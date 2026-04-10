import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { pdf_base64 } = await req.json()
  if (!pdf_base64) return NextResponse.json({ error: 'No PDF' }, { status: 400 })

  try {
    // Upload PDF to OpenAI files API
    const buf = Buffer.from(pdf_base64, 'base64')
    const formData = new FormData()
    formData.append('file', new Blob([buf], { type: 'application/pdf' }), 'worksheet.pdf')
    formData.append('purpose', 'assistants')

    const uploadRes = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    })
    const uploadData = await uploadRes.json()
    const fileId = uploadData.id

    if (!fileId) throw new Error('File upload failed: ' + JSON.stringify(uploadData))

    // Use responses API with file_search to extract text
    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Extract structured fields from this job card PDF. Return ONLY valid JSON with these keys:
- site_name: customer/site name
- site_address: site address (not billing)  
- service_date: YYYY-MM-DD format
- engineer_name: engineer who did the work
- company_name: company that carried out the work (e.g. "Voca", "GOW Systems", "Ladrillos")
- job_type: one of exactly: "PPM", "Return Visit", "Small Works", "Callout" (P1-P7/callout/emergency = Callout)
- sheet_type: "voca" for Voca Fire, "lfl" for Ladrillos, "other" otherwise
Use null for any field not found.`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract fields from this job card PDF.' },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { type: 'file', file: { file_id: fileId } } as any,
            ],
          },
        ],
        max_tokens: 500,
      }),
    })

    // Clean up file
    fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    }).catch(() => {})

    if (!chatRes.ok) throw new Error('Chat failed: ' + await chatRes.text())

    const chatData = await chatRes.json()
    const content = chatData.choices?.[0]?.message?.content ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const fields = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ fields })

  } catch (e) {
    console.error('parse-pdf error:', e)
    return NextResponse.json({ fields: null })
  }
}
