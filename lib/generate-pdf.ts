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

  // Label maps for known question IDs
  const QUESTION_LABELS: Record<string, string | null> = {
    // Callout questions
    c1: 'Work Carried Out', c2: 'Picture', c3: 'Equipment Used', c4: 'Number of Engineers',
    c6: 'System Current Status', c8t: 'Time on Site', c7: 'Return Visit Required',
    c8: 'Engineer Sign Off', c9: 'Customer Sign Off',
    // PPM questions
    1: 'Date of Service', 2: 'Next Service Date', 3: 'Logbook / Defects',
    4: 'Defects Document', 5: 'Call Points Visible', 6: 'Exits – Call Points',
    7: 'New Partitions', 8: 'Storage Clearance', 9: 'Detector Clearance',
    10: 'Occupancy Changes', 11: 'Cable Condition', 12: 'False Alarm Records',
    13: 'Battery Condition', 14: 'Battery Voltage', 15: 'Charge Voltage',
    16: 'Battery Load Test', 17: 'Batteries >4 Years', 18: 'Call Point Switches',
    19: 'Areas / Zones Tested', 20: 'Detectors Tested', 21: 'Call Points Tested',
    22: 'ARC Signalling', 23: 'Remote Signalling', 24: 'Fire Brigade Link',
    25: 'Sounders / Visual', 26: 'Beam Detectors', 27: 'Aspirating Systems',
    28: 'Suppression Systems', 29: 'Door Holders', 30: 'Cause & Effect',
    31: 'Voice Alarm', 32: 'Ancillary Equipment', 33: 'PAVA System',
    34: 'PAVA Batteries', 35: 'PAVA Signalling', 36: 'Photo – PAVA Batteries',
    37: 'Photo – Fire Panel', 38: 'Panel Clean', 39: 'Defects Identified',
    40: 'Outstanding Defects', 41: 'Comments', 42: 'Next Service',
    // Follow-up (excluded from main callout PDF)
    cf1: null, cf2: null, cf3: null,
    customer_name: 'Customer Name',
  }

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
    // Skip follow-up answers from main PDF
    if (key.startsWith('cf')) continue
    // Skip if explicitly null in label map
    if (key in QUESTION_LABELS && QUESTION_LABELS[key] === null) continue
    const label = QUESTION_LABELS[key] || key
    checkPage(14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text(String(label), margin, y)
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

  // Signatures
  const sigEngineer = (answers as Record<string, string>)['sig_engineer']
  const sigCustomer = (answers as Record<string, string>)['sig_customer']
  if (sigEngineer || sigCustomer) {
    checkPage(50)
    doc.setFillColor(230, 230, 230)
    doc.rect(margin, y - 2, contentW, 7, 'F')
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81)
    doc.text('SIGNATURES', margin + 2, y + 2); y += 10
    if (sigEngineer) {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
      doc.text('Engineer Signature:', margin, y); y += 3
      try { doc.addImage(sigEngineer, 'PNG', margin, y, 60, 20); y += 24 } catch(e) {}
    }
    if (sigCustomer) {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
      doc.text('Customer Signature:', margin, y); y += 3
      try { doc.addImage(sigCustomer, 'PNG', margin, y, 60, 20); y += 24 } catch(e) {}
    }
  }

  // Page numbers
  const np = doc.internal.getNumberOfPages()
  for (let i = 1; i <= np; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(`${submission.company_name || 'GOW Systems'} | Page ${i} of ${np}`, pageW / 2, 293, { align: 'center' })
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
