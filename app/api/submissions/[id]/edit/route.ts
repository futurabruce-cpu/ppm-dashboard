import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateSubmissionPDF } from '@/lib/generate-pdf'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const {
    site_name,
    site_address,
    service_date,
    engineer_name,
    company_name,
    job_type,
    follow_up_required,
    answers,
    sheet_type,
  } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdminClient() as any

  const { error: updateErr } = await admin
    .from('submissions')
    .update({
      site_name,
      site_address,
      service_date,
      company_name,
      job_type,
      follow_up_required,
      answers,
    })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json(
      { ok: false, error: updateErr.message },
      { status: 500, headers: corsHeaders }
    )
  }

  // Regenerate PDF
  try {
    const pdfBuf = await generateSubmissionPDF({
      sheet_type: sheet_type ?? 'voca',
      site_name,
      site_address,
      service_date,
      answers: answers ?? {},
      engineer_name: engineer_name ?? '',
      company_name: company_name ?? null,
      job_type: job_type ?? null,
    })

    const filename = `edited-${id}-${Date.now()}.pdf`
    const { error: uploadErr } = await admin.storage
      .from('pdfs')
      .upload(filename, pdfBuf, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (!uploadErr) {
      const { data: publicData } = admin.storage.from('pdfs').getPublicUrl(filename)
      await admin
        .from('submissions')
        .update({ pdf_url: publicData.publicUrl })
        .eq('id', id)
    }
  } catch (e) {
    console.error('PDF regen failed:', e)
    // Don't fail the whole request if PDF regen fails
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders })
}
