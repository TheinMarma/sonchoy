import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findPayFrequency, findPaymentMode, findEmploymentType,
  computeTotals,
} from './compute'

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_BIZ     = [52, 208, 188]
const C_BIZ_DK  = [21, 128, 113]
const C_DANGER  = [220, 38, 38]

const BODY = 10

export function generateSalarySlipPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const freq = findPayFrequency(data.payFrequencyId)
  const mode = findPaymentMode(data.paymentModeId)
  const emp = findEmploymentType(data.employmentTypeId)
  const totals = computeTotals(data)

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_BIZ)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.company?.name || '[Your Company]', MARGIN, y + 18)
  y += 24

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.company?.address) {
    const lines = doc.splitTextToSize(data.company.address, PAGE_W / 2 - MARGIN)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  const contact = [data.company?.email, data.company?.phone].filter(Boolean).join('  ·  ')
  if (contact) { doc.text(contact, MARGIN, y); y += 12 }
  if (data.company?.taxId) { doc.text(`PAN / TIN: ${data.company.taxId}`, MARGIN, y); y += 12 }

  // Right: SALARY SLIP block
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(24)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('SALARY SLIP', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.slipNumber)   { doc.text(`Slip #: ${data.slipNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.payPeriod)    { doc.text(`Pay period: ${data.payPeriod}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.payDate)      { doc.text(`Pay date: ${formatDate(data.payDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(`Frequency: ${freq.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  doc.text(`Mode: ${mode.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12

  y = Math.max(y, ry + 14)

  doc.setDrawColor(...C_BIZ); doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 18

  /* EMPLOYEE BLOCK — 2 column grid of fields */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('EMPLOYEE DETAILS', MARGIN, y); y += 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  doc.setTextColor(...C_INK_950)
  doc.text(data.employee?.name || '[Employee name]', MARGIN, y); y += 16

  const colW = (PAGE_W - MARGIN * 2 - 20) / 2
  const leftX = MARGIN
  const rightX = MARGIN + colW + 20

  const leftRows = [
    ['Employee ID',   data.employee?.employeeId],
    ['Designation',   data.employee?.designation],
    ['Department',    data.employee?.department],
    ['Date of joining', formatDate(data.employee?.dateOfJoining)],
    ['Employment',    emp.label],
  ]
  const rightRows = [
    ['PAN / Tax ID',  data.employee?.taxId],
    ['UAN / PF',      data.employee?.uan],
    ['Location',      data.employee?.location],
    ['Reports to',    data.employee?.manager],
    ['Email',         data.employee?.email],
  ]

  const startBlockY = y
  doc.setFontSize(9)
  for (let i = 0; i < leftRows.length; i++) {
    const [k, v] = leftRows[i]
    if (!v) continue
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK_500)
    doc.text(k, leftX, startBlockY + i * 14)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK_950)
    doc.text(String(v), leftX + 110, startBlockY + i * 14)
  }
  for (let i = 0; i < rightRows.length; i++) {
    const [k, v] = rightRows[i]
    if (!v) continue
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK_500)
    doc.text(k, rightX, startBlockY + i * 14)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK_950)
    doc.text(String(v), rightX + 110, startBlockY + i * 14)
  }
  y = startBlockY + Math.max(leftRows.length, rightRows.length) * 14 + 8

  /* ATTENDANCE STRIP */
  if (data.includeAttendanceBlock) {
    y = ensureSpace(doc, y, 50)
    doc.setFillColor(248, 248, 244)
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 44, 'F')
    const cellW = (PAGE_W - MARGIN * 2) / 4
    const cells = [
      ['WORKING DAYS', String(totals.workingDays || '—')],
      ['PRESENT',      String(totals.presentDays || '—')],
      ['LOP DAYS',     String(totals.lopDays)],
      ['LEAVE BAL',    data.leaveBalance != null ? String(data.leaveBalance) : '—'],
    ]
    cells.forEach(([k, v], i) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
      doc.setTextColor(...C_BIZ_DK)
      doc.text(k, MARGIN + i * cellW + 8, y + 16)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
      doc.setTextColor(...C_INK_950)
      doc.text(String(v), MARGIN + i * cellW + 8, y + 32)
    })
    y += 56
  }

  /* TWO-COLUMN EARNINGS & DEDUCTIONS TABLE */
  y = ensureSpace(doc, y, 220)
  const tableX = MARGIN
  const tableW = PAGE_W - MARGIN * 2
  const halfW = tableW / 2

  // Header bar
  doc.setFillColor(...C_BIZ); doc.rect(tableX, y, tableW, 22, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('EARNINGS',   tableX + 8, y + 14)
  doc.text('AMOUNT',     tableX + halfW - 70, y + 14, { align: 'right' })
  doc.text('YTD',        tableX + halfW - 8, y + 14, { align: 'right' })
  doc.text('DEDUCTIONS', tableX + halfW + 8, y + 14)
  doc.text('AMOUNT',     tableX + tableW - 70, y + 14, { align: 'right' })
  doc.text('YTD',        tableX + tableW - 8, y + 14, { align: 'right' })
  y += 22

  // Body rows
  const rowsN = Math.max(totals.earnings.length, totals.deductions.length)
  const rowH = 16
  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < rowsN; i++) {
    y = ensureSpace(doc, y, rowH + 4)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tableX, y, tableW, rowH, 'F') }

    const e = totals.earnings[i]
    const d = totals.deductions[i]

    if (e) {
      doc.setTextColor(...C_INK_950)
      doc.text(String(e.label || '—'), tableX + 8, y + 11)
      doc.setTextColor(e.taxable ? C_INK_950 : C_INK_500)
      doc.text(formatNumber(e.amount), tableX + halfW - 70, y + 11, { align: 'right' })
      doc.setTextColor(...C_INK_500)
      doc.text(e.ytd > 0 ? formatNumber(e.ytd) : '—', tableX + halfW - 8, y + 11, { align: 'right' })
    }
    if (d) {
      doc.setTextColor(...C_INK_950)
      doc.text(String(d.label || '—'), tableX + halfW + 8, y + 11)
      doc.setTextColor(d.type === 'tax' ? C_DANGER : C_INK_950)
      doc.text(formatNumber(d.amount), tableX + tableW - 70, y + 11, { align: 'right' })
      doc.setTextColor(...C_INK_500)
      doc.text(d.ytd > 0 ? formatNumber(d.ytd) : '—', tableX + tableW - 8, y + 11, { align: 'right' })
    }

    // Vertical divider
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(tableX + halfW, y, tableX + halfW, y + rowH)
    y += rowH
  }
  doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tableX, y, tableX + tableW, y)

  // Totals row
  y = ensureSpace(doc, y, 22)
  doc.setFillColor(...C_BIZ); doc.rect(tableX, y, tableW, 22, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('GROSS EARNINGS', tableX + 8, y + 14)
  doc.text(`${cur.code} ${formatNumber(totals.grossEarnings)}`, tableX + halfW - 8, y + 14, { align: 'right' })
  doc.text('TOTAL DEDUCTIONS', tableX + halfW + 8, y + 14)
  doc.text(`${cur.code} ${formatNumber(totals.totalDeductions)}`, tableX + tableW - 8, y + 14, { align: 'right' })
  y += 30

  /* NET PAY HERO */
  y = ensureSpace(doc, y, 100)
  doc.setDrawColor(...C_BIZ); doc.setLineWidth(2)
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 80, 8, 8, 'S')
  doc.setFillColor(...C_BIZ)
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 24, 8, 8, 'F')
  doc.rect(MARGIN, y + 16, PAGE_W - MARGIN * 2, 8, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('NET PAY THIS PERIOD', MARGIN + 14, y + 16)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(28)
  doc.setTextColor(...C_BIZ_DK)
  doc.text(`${cur.code} ${formatNumber(totals.takeHome)}`, MARGIN + 14, y + 60)

  // Right-side breakdown inside the hero
  const heroR = PAGE_W - MARGIN - 14
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_500)
  doc.text('Net pay (gross − deductions)', heroR, y + 40, { align: 'right' })
  doc.setTextColor(...C_INK_950)
  doc.text(`${cur.code} ${formatNumber(totals.netPay)}`, heroR, y + 52, { align: 'right' })
  if (totals.reimbursement > 0) {
    doc.setTextColor(...C_INK_500)
    doc.text('+ Reimbursements', heroR, y + 64, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.text(`${cur.code} ${formatNumber(totals.reimbursement)}`, heroR, y + 76, { align: 'right' })
  }
  y += 90

  // YTD strip
  y = ensureSpace(doc, y, 30)
  doc.setFillColor(248, 248, 244)
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 26, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('YEAR-TO-DATE', MARGIN + 8, y + 10)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  doc.text(`Gross: ${cur.code} ${formatNumber(totals.grossYtd)}`, MARGIN + 8, y + 22)
  doc.text(`Deductions: ${cur.code} ${formatNumber(totals.totalDeductionsYtd)}`, MARGIN + 180, y + 22)
  doc.setTextColor(...C_BIZ_DK)
  doc.setFont('helvetica', 'bold')
  doc.text(`Net: ${cur.code} ${formatNumber(totals.netYtd)}`, PAGE_W - MARGIN - 8, y + 22, { align: 'right' })
  y += 38

  /* BANK BLOCK */
  if (data.includeBankBlock && data.bank?.accountName) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('PAID INTO', MARGIN, y); y += 14

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const bankRows = [
      ['Bank',          data.bank?.bankName],
      ['Account name',  data.bank?.accountName],
      ['Account no.',   data.bank?.accountNumber],
      ['IFSC / SWIFT',  data.bank?.ifsc],
      ['UTR / Ref',     data.bank?.utr],
    ]
    for (const [k, v] of bankRows) {
      if (!v) continue
      y = ensureSpace(doc, y, 13)
      doc.setTextColor(...C_INK_500)
      doc.text(k, MARGIN, y)
      doc.setTextColor(...C_INK_950)
      doc.text(String(v), MARGIN + 110, y)
      y += 13
    }
    y += 8
  }

  /* NOTES */
  if (data.includeNotesBlock && data.notes) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
    y += 8
  }

  /* SIGNATURE BLOCK */
  if (data.includeSignatureBlock) {
    y = ensureSpace(doc, y, 70)
    y += 6
    const halfWS = (PAGE_W - MARGIN * 2 - 40) / 2
    const sBlockY = y

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('PREPARED BY (HR / PAYROLL)', MARGIN, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN, sBlockY + 40, MARGIN + halfWS, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN, sBlockY + 52)
    if (data.preparedBy?.name) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.setTextColor(...C_INK_950)
      doc.text(data.preparedBy.name, MARGIN, sBlockY + 64)
    }
    if (data.preparedBy?.title) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
      doc.setTextColor(...C_INK_500)
      doc.text(data.preparedBy.title, MARGIN, sBlockY + 76)
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('AUTHORISED BY (FINANCE)', MARGIN + halfWS + 40, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN + halfWS + 40, sBlockY + 40, PAGE_W - MARGIN, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN + halfWS + 40, sBlockY + 52)
    y += 80
  }

  // System-generated note
  y = ensureSpace(doc, y, 14)
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8)
  doc.setTextColor(...C_INK_500)
  doc.text('This is a system-generated salary slip. No physical signature required unless statutory rules apply.', MARGIN, y)

  addPageFooters(doc, data)

  const fileName = `salary-slip-${(data.slipNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 24) { doc.addPage(); return MARGIN }
  return y
}

function addPageFooters(doc, data) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `Salary Slip${data.slipNumber ? ` · ${data.slipNumber}` : ''}${data.employee?.name ? ` · ${data.employee.name}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
