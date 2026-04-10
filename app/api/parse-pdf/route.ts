import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { pdf_base64 } = await req.json()
  if (!pdf_base64) return NextResponse.json({ error: 'No PDF' }, { status: 400 })

  // Extract text from PDF
  let pdfText = ''
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const buf = Buffer.from(pdf_base64, 'base64')
    const parsed = await pdfParse(buf)
    pdfText = parsed.text
  } catch (e) {
    console.error('PDF parse error:', e)
    return NextResponse.json({ fields: null })
  }

  if (!pdfText.trim()) return NextResponse.json({ fields: null })

  // Send text to OpenAI for structured extraction
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a data extraction assistant. Extract structured fields from job card text. Return ONLY valid JSON with these exact keys:
- site_name: the customer/site name (e.g. "VUE CINEMA EASTLEIGH")
- site_address: the site address (not billing address)
- service_date: date in YYYY-MM-DD format
- engineer_name: the engineer/resource who did the work
- company_name: the company that carried out the work — look for company header/branding (e.g. "Voca", "GOW Systems", "Ladrillos")
- job_type: map to exactly one of: "PPM", "Return Visit", "Small Works", "Callout" — if job type contains P1/P2/P3/P4/P5/P6/P7 or callout/emergency use "Callout"; return visit = "Return Visit"; small/minor works = "Small Works"; PPM/service/maintenance = "PPM"
- sheet_type: "voca" for Voca Fire jobs, "lfl" for Ladrillos jobs, "other" for anything else
If a field cannot be found, use null.`,
        },
        {
          role: 'user',
          content: `Extract fields from this job card:\n\n${pdfText.slice(0, 4000)}`,
        },
      ],
      max_tokens: 500,
    }),
  })

  if (!res.ok) {
    console.error('OpenAI error:', await res.text())
    return NextResponse.json({ fields: null })
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const fields = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ fields })
  } catch {
    return NextResponse.json({ fields: null })
  }
}
