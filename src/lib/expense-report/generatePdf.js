import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findReportStatus, findCategory, findPaymentMethod,
  computeTotals, buildCategorySummary, buildPaymentSummary,
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

const BODY = 10
const LINE_H = 14

export function generateExpenseReportPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const status = findReportStatus(data.statusId)
  const totals = computeTotals(data)
  const catSummary = buildCategorySummary(totals.lines)
  const pmSummary  = buildPaymentSummary(totals.lines)

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

  // Right: EXPENSE REPORT block
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(24)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('EXPENSE REPORT', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.reportNumber)  { doc.text(`Report #: ${data.reportNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.reportDate)    { doc.text(`Date: ${formatDate(data.reportDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.periodFrom || data.periodTo) {
    doc.text(`Period: ${formatDate(data.periodFrom)} → ${formatDate(data.periodTo)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  }
  if (data.purpose)       { doc.text(`Purpose: ${data.purpose}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }

  // Status badge
  const statusColors = {
    success: [22, 163, 74],
    info:    [37, 99, 235],
    warning: [217, 119, 6],
    danger:  [220, 38, 38],
    muted:   [130, 130, 124],
  }
  const sColor = statusColors[status.tone] || statusColors.muted
  doc.setFillColor(...sColor)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  const sLabel = status.label.toUpperCase()
  const sW = doc.getTextWidth(sLabel) + 16
  doc.roundedRect(PAGE_W - MARGIN - sW, ry, sW, 18, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(sLabel, PAGE_W - MARGIN - sW / 2, ry + 12, { align: 'center' })

  y = Math.max(y, ry + 30)
  y += 14

  doc.setDrawColor(...C_BIZ); doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 18

  /* CLAIMANT BLOCK */
  const colW = (PAGE_W - MARGIN * 2 - 20) / 2
  const leftX  = MARGIN
  const rightX = MARGIN + colW + 20

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('CLAIMANT', leftX, y)
  doc.text('APPROVER / FINANCE', rightX, y)
  y += 12

  let leftY = y
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.claimant?.name || '[Employee name]', leftX, leftY); leftY += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.claimant?.employeeId) { doc.text(`Employee ID: ${data.claimant.employeeId}`, leftX, leftY); leftY += 12 }
  if (data.claimant?.title)      { doc.text(data.claimant.title, leftX, leftY); leftY += 12 }
  if (data.claimant?.department) { doc.text(`Department: ${data.claimant.department}`, leftX, leftY); leftY += 12 }
  if (data.claimant?.email)      { doc.text(data.claimant.email, leftX, leftY); leftY += 12 }
  if (data.claimant?.costCenter) { doc.text(`Cost centre: ${data.claimant.costCenter}`, leftX, leftY); leftY += 12 }

  let rightY2 = y
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.approver?.name || '[Approver]', rightX, rightY2); rightY2 += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.approver?.title)      { doc.text(data.approver.title, rightX, rightY2); rightY2 += 12 }
  if (data.approver?.email)      { doc.text(data.approver.email, rightX, rightY2); rightY2 += 12 }
  if (data.approver?.department) { doc.text(`Department: ${data.approver.department}`, rightX, rightY2); rightY2 += 12 }

  y = Math.max(leftY, rightY2) + 8

  /* LINE ITEMS TABLE */
  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 6
  const cDate  = tX + 26
  const cVend  = tX + 80
  const cCat   = tX + tW * 0.38
  const cPm    = tX + tW * 0.55
  const cAmt   = tX + tW * 0.74
  const cTax   = tX + tW * 0.86
  const cTot   = tX + tW - 6

  const drawHeader = () => {
    doc.setFillColor(...C_BIZ); doc.rect(tX, y, tW, 22, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('#',         cN,    y + 14)
    doc.text('DATE',      cDate, y + 14)
    doc.text('VENDOR',    cVend, y + 14)
    doc.text('CATEGORY',  cCat,  y + 14)
    doc.text('PAYMENT',   cPm,   y + 14)
    doc.text('AMOUNT',    cAmt,  y + 14, { align: 'right' })
    doc.text('TAX',       cTax,  y + 14, { align: 'right' })
    doc.text('TOTAL',     cTot,  y + 14, { align: 'right' })
    y += 22
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < totals.lines.length; i++) {
    const l = totals.lines[i]
    const cat = findCategory(l.categoryId)
    const pm  = findPaymentMethod(l.paymentMethodId)
    const vendText = (l.vendor || '—') + (l.description ? `   ·   ${l.description}` : '')
    const vendLines = doc.splitTextToSize(vendText, cCat - cVend - 8)
    const rowH = Math.max(LINE_H + 4, vendLines.length * LINE_H + 4)
    y = ensureSpace(doc, y, rowH)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, rowH, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 12)
    doc.text(formatDate(l.date) || '—', cDate, y + 12)
    doc.setTextColor(...C_INK_950)
    doc.text(vendLines, cVend, y + 12)
    // Category pill
    doc.setFillColor(...cat.color)
    const catW = doc.getTextWidth(cat.label) + 10
    doc.roundedRect(cCat, y + 3, catW, 12, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.text(cat.label, cCat + catW / 2, y + 11, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    doc.text(pm.label, cPm, y + 12)
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(l.amount), cAmt, y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_500)
    doc.text(l.tax > 0 ? formatNumber(l.tax) : '—', cTax, y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'bold')
    doc.text(formatNumber(l.total), cTot, y + 12, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    // Reimbursable / billable flags
    const flags = []
    if (!l.reimbursable) flags.push('Non-reimbursable')
    if (l.billable)      flags.push(`Billable${l.projectCode ? ` · ${l.projectCode}` : ''}`)
    if (l.receiptRef)    flags.push(`Receipt: ${l.receiptRef}`)
    if (flags.length > 0) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5)
      doc.setTextColor(...C_INK_500)
      doc.text(flags.join('  ·  '), cVend, y + 24)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    }

    y += rowH
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  y += 8

  /* TOTALS BLOCK */
  const totalsX1 = PAGE_W - MARGIN - 220
  const totalsX2 = PAGE_W - MARGIN - 8
  const drawTotalRow = (label, value, opts = {}) => {
    y = ensureSpace(doc, y, 16)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal'); doc.setFontSize(opts.large ? 12 : BODY)
    doc.setTextColor(...(opts.accent ? C_BIZ_DK : C_INK_500))
    doc.text(label, totalsX1, y + 10)
    doc.setTextColor(...(opts.accent ? C_BIZ_DK : C_INK_950))
    doc.text(`${cur.code} ${formatNumber(value)}`, totalsX2, y + 10, { align: 'right' })
    y += opts.large ? 18 : 14
  }
  drawTotalRow('Subtotal',  totals.subtotal)
  if (totals.totalTax > 0) drawTotalRow('Tax', totals.totalTax)
  drawTotalRow('Grand total', totals.grandTotal, { bold: true })
  y += 2
  if (totals.nonReimbursable > 0) drawTotalRow('Non-reimbursable', -totals.nonReimbursable)
  drawTotalRow('Reimbursable', totals.reimbursable)
  if (totals.cashAdvance > 0)     drawTotalRow('Less: cash advance', -totals.cashAdvance)
  y += 4
  doc.setDrawColor(...C_BIZ); doc.setLineWidth(1)
  doc.line(totalsX1, y, totalsX2, y); y += 4
  drawTotalRow('NET DUE TO CLAIMANT', totals.netDue, { bold: true, large: true, accent: true })
  if (totals.billable > 0) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8)
    doc.setTextColor(...C_INK_500)
    doc.text(`Billable to client: ${cur.code} ${formatNumber(totals.billable)}`, totalsX2, y + 4, { align: 'right' })
    y += 14
  }
  y += 10

  /* CATEGORY BREAKDOWN */
  if (data.includeCategoryBreakdown && catSummary.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('BY CATEGORY', MARGIN, y); y += 14

    // Table header
    const ccDate = MARGIN
    const ccCnt  = MARGIN + 220
    const ccPct  = MARGIN + 280
    const ccAmt  = PAGE_W - MARGIN - 8
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('CATEGORY',  ccDate, y)
    doc.text('COUNT',     ccCnt,  y, { align: 'right' })
    doc.text('SHARE',     ccPct,  y, { align: 'right' })
    doc.text('AMOUNT',    ccAmt,  y, { align: 'right' })
    y += 4
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 8

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const c of catSummary) {
      y = ensureSpace(doc, y, 14)
      doc.setFillColor(...c.color)
      doc.rect(MARGIN, y + 2, 4, 8, 'F')
      doc.setTextColor(...C_INK_950)
      doc.text(c.label, MARGIN + 10, y + 10)
      doc.setTextColor(...C_INK_700)
      doc.text(String(c.count), ccCnt, y + 10, { align: 'right' })
      doc.text(`${formatNumber(c.pct)}%`, ccPct, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(`${cur.code} ${formatNumber(c.total)}`, ccAmt, y + 10, { align: 'right' })
      y += 14
    }
    y += 8
  }

  /* PAYMENT METHOD BREAKDOWN */
  if (data.includePaymentBreakdown && pmSummary.length > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('BY PAYMENT METHOD', MARGIN, y); y += 14

    const ppLab = MARGIN
    const ppCnt = MARGIN + 220
    const ppAmt = PAGE_W - MARGIN - 8
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('METHOD',  ppLab, y)
    doc.text('COUNT',   ppCnt, y, { align: 'right' })
    doc.text('AMOUNT',  ppAmt, y, { align: 'right' })
    y += 4
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 8

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const p of pmSummary) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(p.label, ppLab, y + 10)
      doc.setTextColor(...C_INK_700)
      doc.text(String(p.count), ppCnt, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(`${cur.code} ${formatNumber(p.total)}`, ppAmt, y + 10, { align: 'right' })
      y += 14
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

  /* APPROVAL BLOCK */
  if (data.includeApprovalBlock) {
    y = ensureSpace(doc, y, 90)
    y += 6
    const halfW = (PAGE_W - MARGIN * 2 - 40) / 2
    const sBlockY = y

    // Claimant
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('SUBMITTED BY (CLAIMANT)', MARGIN, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN, sBlockY + 40, MARGIN + halfW, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN, sBlockY + 52)
    if (data.claimant?.name) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.setTextColor(...C_INK_950)
      doc.text(data.claimant.name, MARGIN, sBlockY + 64)
    }
    if (data.claimant?.title) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
      doc.setTextColor(...C_INK_500)
      doc.text(data.claimant.title, MARGIN, sBlockY + 76)
    }

    // Approver
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('APPROVED BY (MANAGER / FINANCE)', MARGIN + halfW + 40, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN + halfW + 40, sBlockY + 40, PAGE_W - MARGIN, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN + halfW + 40, sBlockY + 52)
    if (data.approver?.name) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.setTextColor(...C_INK_950)
      doc.text(data.approver.name, MARGIN + halfW + 40, sBlockY + 64)
    }
    if (data.approver?.title) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
      doc.setTextColor(...C_INK_500)
      doc.text(data.approver.title, MARGIN + halfW + 40, sBlockY + 76)
    }
    y += 80
  }

  addPageFooters(doc, data, totals)

  const fileName = `expense-report-${(data.reportNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 24) { doc.addPage(); return MARGIN }
  return y
}

function addPageFooters(doc, data, totals) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `Expense Report${data.reportNumber ? ` · ${data.reportNumber}` : ''}${data.claimant?.name ? ` · ${data.claimant.name}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}  ·  ${totals.lines.length} items`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
