import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findInvoiceStatus, findRateType, findPaymentTerm,
  computeTotals, buildTaxSummary,
} from './compute'

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_INV     = [251, 191, 36]   // amber — invoicing
const C_INV_DK  = [180, 110, 5]

const BODY = 10
const LINE_H = 14

export function generateFreelanceInvoicePdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const status = findInvoiceStatus(data.statusId)
  const term = findPaymentTerm(data.paymentTermId)
  const totals = computeTotals(data)
  const taxSummary = buildTaxSummary(totals.lines)

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_INV)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.from?.businessName || data.from?.name || '[Your name]', MARGIN, y + 18)
  y += 24

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.from?.address) {
    const lines = doc.splitTextToSize(data.from.address, PAGE_W / 2 - MARGIN)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  const contact = [data.from?.email, data.from?.phone, data.from?.website].filter(Boolean).join('  ·  ')
  if (contact) { doc.text(contact, MARGIN, y); y += 12 }
  if (data.from?.taxId) { doc.text(`Tax ID: ${data.from.taxId}`, MARGIN, y); y += 12 }

  // Right: INVOICE block
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28)
  doc.setTextColor(...C_INV_DK)
  doc.text('INVOICE', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.invoiceNumber)  { doc.text(`Invoice #: ${data.invoiceNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.invoiceDate)    { doc.text(`Issued: ${formatDate(data.invoiceDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (totals.dueDate)      { doc.text(`Due: ${formatDate(totals.dueDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(`Terms: ${term.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  if (data.projectName)    { doc.text(`Project: ${data.projectName}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.poRef)          { doc.text(`PO ref: ${data.poRef}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }

  // Status badge
  const statusColors = {
    success: [22, 163, 74], info: [37, 99, 235], warning: [217, 119, 6], danger: [220, 38, 38], muted: [130, 130, 124],
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

  doc.setDrawColor(...C_INV); doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 18

  /* CLIENT BLOCK */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INV_DK)
  doc.text('BILL TO', MARGIN, y); y += 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.to?.companyName || data.to?.name || '[Client name]', MARGIN, y); y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.to?.contactName) { doc.text(data.to.contactName, MARGIN, y); y += 12 }
  if (data.to?.address) {
    const lines = doc.splitTextToSize(data.to.address, PAGE_W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  if (data.to?.email) { doc.text(data.to.email, MARGIN, y); y += 12 }
  if (data.to?.taxId) { doc.text(`Tax ID: ${data.to.taxId}`, MARGIN, y); y += 12 }
  y += 12

  /* LINE ITEMS TABLE */
  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 6
  const cDesc  = tX + 26
  const cType  = tX + tW * 0.50
  const cQty   = tX + tW * 0.66
  const cRate  = tX + tW * 0.78
  const cTax   = tX + tW * 0.88
  const cAmt   = tX + tW - 6

  const drawHeader = () => {
    doc.setFillColor(...C_INV); doc.rect(tX, y, tW, 22, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_INV_DK)
    doc.text('#',           cN,    y + 14)
    doc.text('DESCRIPTION', cDesc, y + 14)
    doc.text('TYPE',        cType, y + 14)
    doc.text('QTY',         cQty,  y + 14, { align: 'right' })
    doc.text('RATE',        cRate, y + 14, { align: 'right' })
    doc.text('TAX %',       cTax,  y + 14, { align: 'right' })
    doc.text('AMOUNT',      cAmt,  y + 14, { align: 'right' })
    y += 22
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < totals.lines.length; i++) {
    const l = totals.lines[i]
    const rt = findRateType(l.rateTypeId)
    let descText = String(l.description || '—')
    if (l.projectCode) descText += `   ·   ${l.projectCode}`
    const descLines = doc.splitTextToSize(descText, cType - cDesc - 8)
    const rowH = Math.max(LINE_H + 2, descLines.length * LINE_H + 2)
    y = ensureSpace(doc, y, rowH)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, rowH, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 12)
    doc.setTextColor(...C_INK_950)
    doc.text(descLines, cDesc, y + 12)
    doc.setTextColor(...C_INK_700)
    doc.text(rt.label, cType, y + 12)
    doc.setTextColor(...C_INK_950)
    const qtyText = `${formatNumber(Number(l.qty) || 0)} ${rt.unit}`
    doc.text(qtyText, cQty, y + 12, { align: 'right' })
    doc.text(formatNumber(Number(l.rate) || 0), cRate, y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_700)
    doc.text(l.taxable && l.taxPct > 0 ? `${formatNumber(l.taxPct)}%` : '—', cTax, y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'bold')
    doc.text(formatNumber(l.total), cAmt, y + 12, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += rowH
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  y += 8

  /* HOURS / DAYS strip */
  if (totals.totalHours > 0 || totals.totalDays > 0) {
    y = ensureSpace(doc, y, 26)
    doc.setFillColor(248, 248, 244)
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 22, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INV_DK)
    let strip = []
    if (totals.totalHours > 0) strip.push(`${formatNumber(totals.totalHours)} HRS BILLED`)
    if (totals.totalDays > 0)  strip.push(`${formatNumber(totals.totalDays)} DAYS BILLED`)
    doc.text(strip.join('   ·   '), MARGIN + 8, y + 14)
    y += 30
  }

  /* TOTALS BLOCK */
  const totalsX1 = PAGE_W - MARGIN - 220
  const totalsX2 = PAGE_W - MARGIN - 8
  const drawTotalRow = (label, value, opts = {}) => {
    y = ensureSpace(doc, y, 16)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal'); doc.setFontSize(opts.large ? 12 : BODY)
    doc.setTextColor(...(opts.accent ? C_INV_DK : C_INK_500))
    doc.text(label, totalsX1, y + 10)
    doc.setTextColor(...(opts.accent ? C_INV_DK : C_INK_950))
    doc.text(`${cur.code} ${formatNumber(value)}`, totalsX2, y + 10, { align: 'right' })
    y += opts.large ? 18 : 14
  }
  drawTotalRow('Subtotal', totals.subtotal)
  if (totals.discount > 0) drawTotalRow('Discount', -totals.discount)
  if (totals.totalTax > 0) drawTotalRow('Tax', totals.totalTax)
  y += 4
  doc.setDrawColor(...C_INV); doc.setLineWidth(1)
  doc.line(totalsX1, y, totalsX2, y); y += 4
  drawTotalRow('TOTAL', totals.grandTotal, { bold: true, large: true, accent: true })
  if (totals.advance > 0)    drawTotalRow('Less: advance',    -totals.advance)
  if (totals.amountPaid > 0) drawTotalRow('Less: amount paid', -totals.amountPaid)
  if (totals.advance > 0 || totals.amountPaid > 0) {
    y += 2
    doc.setDrawColor(...C_INV); doc.setLineWidth(1)
    doc.line(totalsX1, y, totalsX2, y); y += 4
    drawTotalRow('BALANCE DUE', totals.balanceDue, { bold: true, large: true, accent: true })
  }

  // Tax summary mini-block
  if (taxSummary.length > 1) {
    y += 4
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    const summaryParts = taxSummary.map((t) => `${formatNumber(t.ratePct)}% on ${formatNumber(t.taxable)} = ${formatNumber(t.tax)}`)
    const summaryText = `Tax breakdown: ${summaryParts.join(' · ')}`
    const lines = doc.splitTextToSize(summaryText, PAGE_W - MARGIN * 2)
    for (const line of lines) {
      y = ensureSpace(doc, y, 12)
      doc.text(line, MARGIN, y); y += 12
    }
  }
  y += 14

  /* PAYMENT BLOCK */
  if (data.includePaymentBlock) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_INV_DK)
    doc.text('HOW TO PAY', MARGIN, y); y += 14

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const payRows = [
      ['Bank',           data.payment?.bankName],
      ['Account name',   data.payment?.accountName],
      ['Account no.',    data.payment?.accountNumber],
      ['IFSC / SWIFT',   data.payment?.ifsc],
      ['UPI / PayID',    data.payment?.upi],
      ['PayPal',         data.payment?.paypal],
      ['Stripe link',    data.payment?.stripeLink],
      ['Reference',      data.payment?.reference || data.invoiceNumber],
    ]
    const labelW = 110
    for (const [k, v] of payRows) {
      if (!v) continue
      y = ensureSpace(doc, y, 13)
      doc.setTextColor(...C_INK_500)
      doc.text(k, MARGIN, y)
      doc.setTextColor(...C_INK_950)
      doc.text(String(v), MARGIN + labelW, y)
      y += 13
    }
    y += 8
  }

  /* TERMS */
  if (data.includeTermsBlock && data.terms) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_INV_DK)
    doc.text('TERMS & LATE-PAYMENT POLICY', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.terms), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
    y += 8
  }

  /* NOTES */
  if (data.includeNotesBlock && data.notes) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_INV_DK)
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
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INV_DK)
    doc.text('SIGNED BY', MARGIN, y)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN, y + 40, MARGIN + 240, y + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN, y + 52)
    if (data.from?.name) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.setTextColor(...C_INK_950)
      doc.text(data.from.name, MARGIN, y + 64)
    }
    y += 80
  }

  // Thank-you line
  y = ensureSpace(doc, y, 14)
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5)
  doc.setTextColor(...C_INV_DK)
  doc.text('Thanks for the work — looking forward to the next round.', MARGIN, y)

  addPageFooters(doc, data, totals)

  const fileName = `freelance-invoice-${(data.invoiceNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Freelance Invoice${data.invoiceNumber ? ` · ${data.invoiceNumber}` : ''}${totals.dueDate ? ` · due ${totals.dueDate}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
