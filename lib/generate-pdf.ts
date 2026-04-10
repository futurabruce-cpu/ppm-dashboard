/* eslint-disable @typescript-eslint/no-require-imports */
// Server-side PDF generation using jsPDF

export async function generateSubmissionPDF(submission: {
  sheet_type: string
  site_name: string | null
  site_address: string | null
  service_date: string | null
  answers: Record<string, unknown>
  engineer_name?: string | null
  company_name?: string | null
  job_type?: string | null
}): Promise<Buffer> {
  // jsPDF works in Node.js too
  const { jsPDF } = require('jspdf')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 14
  const pageW = 210
  const contentW = pageW - margin * 2
  let y = 14

  const isCallout = submission.job_type === 'Callout'
  const headerColour: [number, number, number] = isCallout ? [55, 65, 81] : [245, 168, 0]
  const headerText = isCallout ? 'FIRE ALARM CALLOUT REPORT' : 'FIRE ALARM SERVICE REPORT'

  // Header bar
  doc.setFillColor(...headerColour)
  doc.rect(0, 0, pageW, 18, 'F')
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(isCallout ? 255 : 0, isCallout ? 255 : 0, isCallout ? 255 : 0)
  doc.text(headerText, pageW / 2, 11, { align: 'center' })
  y = 24

  // Company + job type
  if (submission.company_name) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text(submission.company_name + (submission.job_type ? ' — ' + submission.job_type : ''), margin, y)
    y += 6
  }

  // Site details block
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, y - 2, contentW, 28, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  const details = [
    ['Site', submission.site_name || '—'],
    ['Address', submission.site_address || '—'],
    ['Date', submission.service_date ? new Date(submission.service_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'],
    ['Engineer', submission.engineer_name || '—'],
  ]
  details.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold'); doc.text(label + ':', margin + 2, y + 4)
    doc.setFont('helvetica', 'normal'); doc.text(String(val), margin + 28, y + 4)
    y += 7
  })
  y += 4

  // Answers
  const answers = submission.answers || {}
  
  doc.setFillColor(230, 230, 230)
  doc.rect(margin, y - 2, contentW, 7, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('INSPECTION ANSWERS', margin + 2, y + 2)
  y += 10

  const checkPage = (needed = 10) => {
    if (y + needed > 280) { doc.addPage(); y = 14 }
  }

  for (const [key, val] of Object.entries(answers)) {
    if (!val || key.startsWith('sig_')) continue
    checkPage(14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text(String(key), margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    if (Array.isArray(val)) {
      // Photos — fetch and embed
      for (const src of val as unknown[]) {
        const str = String(src)
        if (str.startsWith('data:')) {
          checkPage(62)
          try { doc.addImage(str, 'JPEG', margin, y, 80, 55); y += 60; }
          catch(e) { doc.text('[Photo]', margin, y); y += 8; }
        } else if (str.startsWith('http')) {
          try {
            const imgRes = await fetch(str)
            if (imgRes.ok) {
              const imgBuf = await imgRes.arrayBuffer()
              const imgB64 = Buffer.from(imgBuf).toString('base64')
              const mime = (imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0]
              checkPage(62)
              try { doc.addImage(`data:${mime};base64,${imgB64}`, 'JPEG', margin, y, 80, 55); y += 60; }
              catch(e) { doc.text('[Photo]', margin, y); y += 8; }
            }
          } catch(e) {
            doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150)
            doc.text('[Photo unavailable]', margin, y); y += 8
          }
        }
      }
    } else {
      const lines = doc.splitTextToSize(String(val), contentW)
      checkPage(lines.length * 5 + 3)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 4
    }
  }

  // Page numbers
  const np = doc.internal.getNumberOfPages()
  for (let i = 1; i <= np; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(`GOW Systems | Page ${i} of ${np}`, pageW / 2, 293, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

export async function generateFollowUpPDF(followUp: {
  site_name: string | null
  site_address: string | null
  service_date: string | null
  answers: Record<string, unknown>
  engineer_name?: string | null
  company_name?: string | null
}): Promise<Buffer> {
  const { jsPDF } = require('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 14, pageW = 210, contentW = pageW - margin * 2
  let y = 14

  doc.setFillColor(220, 38, 38)
  doc.rect(0, 0, pageW, 18, 'F')
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('FOLLOW UP VISIT REQUIRED', pageW / 2, 11, { align: 'center' })
  y = 24

  doc.setFillColor(245, 245, 245)
  doc.rect(margin, y - 2, contentW, 28, 'F')
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81)
  const details = [
    ['Site', followUp.site_name || '—'],
    ['Address', followUp.site_address || '—'],
    ['Date', followUp.service_date ? new Date(followUp.service_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'],
    ['Engineer', followUp.engineer_name || '—'],
  ]
  details.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold'); doc.text(label + ':', margin + 2, y + 4)
    doc.setFont('helvetica', 'normal'); doc.text(String(val), margin + 28, y + 4)
    y += 7
  })
  y += 8

  doc.setFillColor(254, 226, 226); doc.rect(margin, y - 2, contentW, 7, 'F')
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(153, 27, 27)
  doc.text('RETURN VISIT DETAILS', margin + 2, y + 2); y += 10

  const labels: Record<string, string> = { cf1: 'Work Needed', cf2: 'Parts Required', cf3: 'Hours Estimated' }
  const answers = followUp.answers || {}
  for (const [key, val] of Object.entries(answers)) {
    if (!val) continue
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
    doc.text(labels[key] || key, margin, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40)
    const lines = doc.splitTextToSize(String(val), contentW)
    doc.text(lines, margin, y); y += lines.length * 5 + 4
  }

  doc.setFontSize(7); doc.setTextColor(160, 160, 160); doc.setFont('helvetica', 'normal')
  doc.text('GOW Systems | Follow Up Report', pageW / 2, 293, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}
