/* eslint-disable @typescript-eslint/no-require-imports */
// Server-side Ladrillos Fire Alarm Certificate PDF generation
// Matches the exact format of the LFL reference sheet (FAS Cert v3)

export async function generateLFLPDF(submission: {
  site_name: string | null
  site_address: string | null
  service_date: string | null
  answers: Record<string, unknown>
  engineer_name?: string | null
  loc_ref?: string | null
  cert_no?: string | null
  service_type?: string | null
}): Promise<Buffer> {
  const { jsPDF } = require('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const answers = submission.answers || {}

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB') : ''

  const A: [number, number, number] = [245, 168, 0]
  const W: [number, number, number] = [255, 255, 255]
  const K: [number, number, number] = [0, 0, 0]
  const G: [number, number, number] = [0, 176, 80]
  const M = 10, PW = 210, CW = PW - M * 2
  const lw = 0.3

  function C(x: number, y: number, w: number, h: number, txt: string, bg: [number, number, number], bold: boolean, fs: number) {
    doc.setFillColor(...bg); doc.setDrawColor(...K); doc.setLineWidth(lw)
    doc.rect(x, y, w, h, 'FD')
    if (txt) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(fs || 8); doc.setTextColor(...K)
      const lines = doc.splitTextToSize(String(txt), w - 2.5)
      doc.text(lines, x + 1.5, y + Math.min(h * 0.68, h - 1))
    }
  }

  // Pull site details from answers or submission fields
  const siteName = submission.site_name || ''
  const siteAddress = submission.site_address || ''
  const serviceDate = submission.service_date || ''
  const engineerName = submission.engineer_name || ''
  const certNo = String(answers['cert_no'] || submission.cert_no || '')
  const locRef = String(answers['loc_ref'] || submission.loc_ref || '')
  const serviceType = String(answers['service_type'] || submission.service_type || '')

  // ════════════════════════════════════════
  // PAGE 1 — Certificate cover
  // ════════════════════════════════════════
  let y = 8

  // Row 1: Certificate No
  const cw1 = 55, cw2 = 60
  const cx = M + (CW - cw1 - cw2) / 2
  C(cx, y, cw1, 8, 'Certificate No:', A, true, 8)
  C(cx + cw1, y, cw2, 8, certNo, W, false, 8)
  y += 9

  // Rows 2-4: Location/Property/Address
  const hw = CW / 2
  C(M, y, hw, 8, 'LOCATION REF:', A, true, 8); C(M + hw, y, hw, 8, locRef, W, false, 8); y += 8
  C(M, y, hw, 8, 'PROPERTY NAME:', A, true, 8); C(M + hw, y, hw, 8, siteName, W, false, 8); y += 8
  C(M, y, 22, 8, 'ADDRESS:', A, true, 8); C(M + 22, y, CW - 22, 8, siteAddress, W, false, 7); y += 9

  // Row 5: Certification statement
  const stmtText = 'I / we being the competent person(s) responsible (as indicated by my / our signatures below) for the servicing of the fire detection and fire alarm system, particulars of which are set out below, CERTIFY that the said work for which I / we have been responsible complies to the best of my / our knowledge and belief with the recommendations of clause 45 of BS 5839-1:2017 quarterly inspection of vented batteries / periodic inspection and test / inspection and test over a 12 month period (delete as applicable), except for the variations, if any, stated in this certificate.'
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  const sl = doc.splitTextToSize(stmtText, CW - 3)
  const sh = sl.length * 3.8 + 4
  C(M, y, CW, sh, '', W, false, 7.5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...K)
  doc.text(sl, M + 1.5, y + 3.5); y += sh + 1

  // Row 6-7: Extent of system
  const extText = 'The extent of liability of the signatory is limited to the system described below. Extent of system covered by this certificate:'
  C(M, y, CW, 7, extText, A, false, 7); y += 7
  C(M, y, CW, 18, String(answers[28] || ''), W, false, 7); y += 19

  // Row 8-9: Variations
  const varText = 'Variations from the recommendations of clause 45 of BS 58398-1:2017 for periodic or annual inspection and test (as applicable):'
  C(M, y, CW, 7, varText, A, false, 7); y += 7
  C(M, y, CW, 15, String(answers[29] || ''), W, false, 7); y += 16

  // Row 10: Logbook
  const logbookVal = answers[30] ? (answers[30] === 'Yes' ? 'YES' : 'NO') : 'YES / NO *'
  C(M, y, CW - 38, 10, 'Relevant details of the work carried out and faults identified have been entered in the system logbook?', A, false, 7.5)
  C(M + CW - 38, y, 38, 10, logbookVal + '\n* Delete as appropriate', W, true, 7.5); y += 11

  // Rows 11-13: False alarms
  const fc = CW - 60, mc = 14, rc = 46
  const falseAlarms = answers[31] !== undefined ? String(answers[31]) : ''
  const autoDetectors = answers[32] !== undefined ? String(answers[32]) : ''
  const falseAlarmRate = (answers[31] && answers[32] && Number(answers[32]) > 0)
    ? ((Number(answers[31]) / Number(answers[32])) * 100).toFixed(1) : ''
  C(M, y, fc, 8, 'Number of false alarms in the last 12 months:', A, false, 7.5)
  C(M + fc, y, mc, 8, falseAlarms, W, true, 7.5)
  doc.setFillColor(...W); doc.setDrawColor(...K); doc.setLineWidth(lw)
  doc.rect(M + fc + mc, y, rc, 16, 'FD')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...K)
  doc.text(doc.splitTextToSize('Enter Y in box for Category M Systems and enter "0" below', rc - 2), M + fc + mc + 1.5, y + 4)
  y += 8
  C(M, y, fc, 8, 'Number of Automatic Detectors:', A, false, 7.5)
  C(M + fc, y, mc, 8, autoDetectors, W, true, 7.5); y += 9
  C(M, y, fc + mc, 8, 'Number of false alarms per 100 Detectors per Annum (x/y)x100:', A, false, 7.5)
  C(M + fc + mc, y, rc, 8, falseAlarmRate, W, true, 7.5); y += 9

  // Row 14: Remedial works note
  C(M, y, CW, 8, 'Any Remedial works / actions deemed necessary are detailed on the Comments Sheet', A, true, 8); y += 9

  // Signature blocks p1
  const sigH = 14, nameH = 8
  const sigDate = fmtDate(serviceDate)
  const customerName = String(answers['customer_name'] || '')
  const sigCustomer = answers['sig_customer'] as string | null
  const sigEngineer = answers['sig_engineer'] as string | null

  for (const [lbl, sigData, name] of [
    ['On behalf of the client:', sigCustomer, customerName],
    ['On behalf of Ladrillos Facilities Ltd:', sigEngineer, engineerName],
  ] as [string, string | null, string][]) {
    C(M, y, CW, 8, lbl, A, true, 8); y += 8
    C(M, y, CW, sigH, '', W, false, 8)
    if (sigData) { try { doc.addImage(sigData, 'PNG', M + 1, y + 1, 60, sigH - 2) } catch (e) { /* skip */ } }
    y += sigH
    C(M, y, CW / 2 - 16, nameH, 'Print Name: ' + (name || ''), A, false, 7.5)
    C(M + CW / 2 - 16, y, 16, nameH, '', W, false, 7.5)
    C(M + CW / 2, y, 14, nameH, 'Date:', A, false, 7.5)
    C(M + CW / 2 + 14, y, CW / 2 - 14, nameH, sigDate, W, false, 7.5)
    y += nameH + 1
  }

  C(M, y, CW, 9, 'THIS LOG AND CERTIFICATE IS TO REMAIN WITH THE SITE MAINTENANCE LOG BOOK AND MUST BE AVAILABLE FOR INSPECTION BY AUTHORISED PERSONS.', A, true, 7)

  // ════════════════════════════════════════
  // PAGE 2 — Service record
  // ════════════════════════════════════════
  doc.addPage(); y = 8

  C(M, y, hw, 8, 'LOCATION REF:', A, true, 8); C(M + hw, y, hw, 8, locRef, W, false, 8); y += 8
  C(M, y, hw, 8, 'PROPERTY NAME:', A, true, 8); C(M + hw, y, hw, 8, siteName, W, false, 8); y += 8
  C(M, y, 22, 8, 'ADDRESS:', A, true, 8); C(M + 22, y, CW - 22, 8, siteAddress, W, false, 7); y += 9

  const tsl = CW - 72
  C(M, y, tsl, 8, 'TYPE OF SERVICE', A, true, 8)
  for (let i = 0; i < 3; i++) {
    const t = ['Q', 'B/A', 'A'][i]
    const sel = serviceType === t
    C(M + tsl + (i * 24), y, 14, 8, t, A, true, 8)
    C(M + tsl + (i * 24) + 14, y, 10, 8, sel ? '✓' : '', sel ? A : W, true, 9)
  }
  y += 9

  C(M, y, CW, 8, 'GENERAL SYSTEM INFORMATION', A, true, 9); y += 9

  const lc = 44, ic = CW / 2 - lc, lc2 = 44, ic2 = CW / 2 - lc2
  const pairs: [string, string, string, string][] = [
    ['Manufacturer:', String(answers[1] || ''), 'Model:', String(answers[2] || '')],
    ['Type of System:', String(answers[3] || ''), 'Location:', String(answers[4] || '')],
    ['Battery Load Test:', String(answers[5] || ''), 'Charging Voltage', String(answers[6] || '')],
    ['MCP Manual Call Point', String(answers[7] || ''), 'Panel Controls', String(answers[8] || '')],
    ['H Heat Detector', String(answers[9] || ''), 'Circuit Monitoring', String(answers[10] || '')],
    ['MS Multi Sensor', String(answers[11] || ''), 'Relays & Shutdowns', String(answers[12] || '')],
    ['Optical Detector', String(answers[13] || ''), 'Audibility Test / Visual Devices', String(answers[14] || '')],
    ['Indicator Lights & Fault Buzzer', String(answers[15] || ''), 'Linked to Other Premises', String(answers[16] || '')],
  ]
  for (const [l1, v1, l2, v2] of pairs) {
    C(M, y, lc, 8, l1, A, false, 7.5)
    C(M + lc, y, ic, 8, v1, W, false, 8)
    C(M + CW / 2, y, lc2, 8, l2, A, false, 7.5)
    C(M + CW / 2 + lc2, y, ic2, 8, v2, W, false, 8)
    y += 8
  }

  C(M, y, lc, 8, 'Batteries (Quantity / Voltage / Ah)', A, false, 7.5)
  C(M + lc, y, CW - lc, 8, String(answers[17] || ''), W, false, 8); y += 8

  let bcI1 = '', bcT1 = '', bcI2 = '', bcCmin = ''
  if (answers[18]) {
    try {
      const raw = typeof answers[18] === 'string' ? answers[18] : JSON.stringify(answers[18])
      const b = JSON.parse(raw)
      bcI1 = String(b.I1 || ''); bcT1 = String(b.T1 || ''); bcI2 = String(b.I2 || ''); bcCmin = String(b.Cmin || '')
    } catch (e) { /* skip */ }
  }
  const bc1 = 32, bc2 = 16, bc3 = 16, bc4 = 16, bc5 = 16, bc6 = CW - bc1 - bc2 - bc3 - bc4 - bc5
  C(M, y, bc1, 8, 'Battery Calculation:', A, false, 7.5)
  C(M + bc1, y, bc2, 8, 'I1 =', A, false, 7.5)
  C(M + bc1 + bc2, y, bc3, 8, bcI1, W, false, 8)
  C(M + bc1 + bc2 + bc3, y, bc4, 8, 'I2 =', A, false, 7.5)
  C(M + bc1 + bc2 + bc3 + bc4, y, bc5, 8, bcI2, W, false, 8)
  C(M + bc1 + bc2 + bc3 + bc4 + bc5, y, bc6, 8, '', W, false, 8); y += 8
  const cc1 = 46, cc2 = 16, cc3 = 16, cc4 = 16, cc5 = 16, cc6 = CW - cc1 - cc2 - cc3 - cc4 - cc5
  C(M, y, cc1, 8, 'Cmin = [(I1xT1)+I2] x 1.25', A, false, 7.5)
  C(M + cc1, y, cc2, 8, 'T1 =', A, false, 7.5)
  C(M + cc1 + cc2, y, cc3, 8, bcT1, W, false, 8)
  C(M + cc1 + cc2 + cc3, y, cc4, 8, 'C min =', A, false, 7.5)
  C(M + cc1 + cc2 + cc3 + cc4, y, cc5, 8, bcCmin || '0', G, false, 8)
  C(M + cc1 + cc2 + cc3 + cc4 + cc5, y, cc6, 8, 'Ah', W, false, 8); y += 9

  C(M, y, CW, 8, 'MONITORING', A, true, 9); y += 8
  const monQs: [number | string, string][] = [
    [19, '1. Is the system monitored via Intruder alarm Central Station?'],
    [20, '2. Central Station Telephone Number:'],
    [21, '3. Central Station has been contacted by Engineer upon\ncompletion of testing to restore monitoring?'],
    [22, '4. Fire Alarm Testing operation has been explained to\nthe signatory below?'],
  ]
  for (const [id, lbl] of monQs) {
    const lines = doc.setFont('helvetica', 'normal').setFontSize(7.5).splitTextToSize(lbl, CW - 55 - 2.5)
    const rh = Math.max(8, lines.length * 4 + 3)
    C(M, y, CW - 55, rh, lbl, A, false, 7.5)
    C(M + CW - 55, y, 55, rh, String(answers[id] || ''), W, false, 8)
    y += rh
  }
  y += 1

  const aStmt = 'I have inspected and tested the Fire Alarm installation at the above premises in accordance with BS 5839 Part 1 and Log Book completed. The overall assessment is:'
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  const al = doc.splitTextToSize(aStmt, CW - 2.5)
  const ah = al.length * 3.8 + 3
  C(M, y, CW, ah, '', W, false, 7.5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...K)
  doc.text(al, M + 1.5, y + 3); y += ah
  C(M, y, CW, 9, 'SATISFACTORY with OBSERVATIONS (Delete as appropriate)', W, true, 9); y += 10

  for (const [lbl, sigData, name] of [
    ['On behalf of the client:', sigCustomer, customerName],
    ['On behalf of Ladrillos Facilities Ltd:', sigEngineer, engineerName],
  ] as [string, string | null, string][]) {
    C(M, y, CW, 8, lbl, A, true, 8); y += 8
    doc.setFillColor(...W); doc.setDrawColor(...K); doc.setLineWidth(lw)
    doc.rect(M, y, CW, sigH, 'FD')
    if (sigData) { try { doc.addImage(sigData, 'PNG', M + 1, y + 1, 65, sigH - 2) } catch (e) { /* skip */ } }
    y += sigH
    C(M, y, CW / 2 - 16, nameH, 'Print Name: ' + (name || ''), A, false, 7.5)
    C(M + CW / 2 - 16, y, 16, nameH, '', W, false, 7.5)
    C(M + CW / 2, y, 14, nameH, 'Date:', A, false, 7.5)
    C(M + CW / 2 + 14, y, CW / 2 - 14, nameH, sigDate, W, false, 7.5)
    y += nameH + 1
  }

  C(M, y, CW, 9, 'THIS LOG AND CERTIFICATE IS TO REMAIN WITH THE SITE MAINTENANCE LOG BOOK AND MUST BE AVAILABLE FOR INSPECTION BY AUTHORISED PERSONS.', A, true, 7); y += 9
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
  doc.text('FAS Cert v3 Dec 2018', M + CW, y + 4, { align: 'right' })

  // ════════════════════════════════════════
  // PAGE 3 — Comments sheet
  // ════════════════════════════════════════
  doc.addPage(); y = 8

  const p3lw = 50
  for (const val of [siteName, fmtDate(serviceDate), engineerName]) {
    C(M, y, p3lw, 7, '', W, false, 7)
    C(M + p3lw, y, CW - p3lw, 7, val, W, false, 7); y += 7
  }

  C(M, y, CW, 9, 'COMMENTS / RECOMMENDATIONS / OBSERVATIONS', A, true, 10); y += 10

  const nc = 10, commentW = CW - nc - 36, tc = 12
  let cList: string[] = []
  if (answers[27]) {
    try {
      const raw = typeof answers[27] === 'string' ? answers[27] : JSON.stringify(answers[27])
      cList = JSON.parse(raw)
    } catch (e) { /* skip */ }
  }
  for (let i = 1; i <= 25; i++) {
    const txt = cList[i - 1] || ''
    const rh = 9
    C(M, y, nc, rh, String(i), A, true, 8)
    C(M + nc, y, commentW, rh, txt, W, false, 7.5)
    C(M + nc + commentW, y, tc, rh, '', W, false, 7)
    C(M + nc + commentW + tc, y, tc, rh, '', W, false, 7)
    C(M + nc + commentW + tc * 2, y, tc, rh, '', W, false, 7)
    y += rh
    if (y > 275 && i < 25) { doc.addPage(); y = 8 }
  }

  // Page numbers
  const np = doc.internal.getNumberOfPages()
  for (let i = 1; i <= np; i++) {
    doc.setPage(i)
    doc.setFontSize(7); doc.setTextColor(160, 160, 160); doc.setFont('helvetica', 'normal')
    doc.text(`Ladrillos Facilities Ltd  |  Page ${i} of ${np}  |  FAS Cert v3`, PW / 2, 295, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}
