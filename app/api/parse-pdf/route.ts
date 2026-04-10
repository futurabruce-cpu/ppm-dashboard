import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { pdf_base64 } = await req.json()
  if (!pdf_base64) return NextResponse.json({ error: 'No PDF' }, { status: 400 })

  // Use OpenAI to extract structured data from the PDF
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
          content: 'You are a data extraction assistant. Extract structured fields from job card PDFs. Return ONLY valid JSON with these exact keys: site_name, site_address, service_date (YYYY-MM-DD format), engineer_name, company_name (the company that carried out the work e.g. "Voca", "GOW Systems", "Ladrillos" — look for company branding/logo/header), job_type (look for a Job Type field and map it to one of these exact values: "PPM", "Return Visit", "Small Works", "Callout" — if the job type contains P1/P2/P3/P4/P5/P6/P7 or similar priority codes, or words like callout/emergency/urgent, use "Callout"; if it says return visit use "Return Visit"; if it says small works/minor works use "Small Works"; if it says PPM/service/maintenance use "PPM"), sheet_type (use "voca" for Voca Fire jobs, "lfl" for Ladrillos jobs, "other" for anything else). If a field cannot be found, use null.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the fields from this job card PDF.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${pdf_base64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  })

  if (!res.ok) {
    // Fallback: try text extraction approach
    return NextResponse.json({ error: 'Parse failed', fields: null }, { status: 200 })
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
