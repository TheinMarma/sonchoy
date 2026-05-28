import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findQuoteStatus, findValidityPreset,
  computeTotals, buildTaxSummary,
} from './compute'

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_BIZ     = [52, 208, 188]    // emerald-teal (documents)
const C_BIZ_DK  = [21, 128, 113]

const BODY = 10
const LINE_H = 14

export function generateQuotationPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const status = findQuoteStatus(data.statusId)
  const totals = computeTotals(data)
  const taxSummary = buildTaxSummary(totals.lines)

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_BIZ)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  /* HEADER */
  // Left: brand / from
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.from?.companyName || '[Your Company]', MARGIN, y + 18)
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

  // Right: QUOTATION block
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('QUOTATION', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.quoteNumber)  { doc.text(`Quote #: ${data.quoteNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.quoteDate)    { doc.text(`Date: ${formatDate(data.quoteDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (totals.expiryDate) { doc.text(`Valid until: ${formatDate(totals.expiryDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.poNumber)     { doc.text(`PO #: ${data.poNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }

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

  /* CLIENT BLOCK */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('QUOTATION FOR', MARGIN, y); y += 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.to?.companyName || '[Client Name]', MARGIN, y); y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.to?.contactName)  { doc.text(data.to.contactName, MARGIN, y); y += 12 }
  if (data.to?.address) {
    const lines = doc.splitTextToSize(data.to.address, PAGE_W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  if (data.to?.email)        { doc.text(data.to.email, MARGIN, y); y += 12 }
  if (data.to?.taxId)        { doc.text(`Tax ID: ${data.to.taxId}`, MARGIN, y); y += 12 }
  y += 12

  if (data.subject) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.setTextColor(...C_INK_950)
    doc.text('Subject: ', MARGIN, y)
    const labelWidth = doc.getTextWidth('Subject: ')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
    const lines = doc.splitTextToSize(data.subject, PAGE_W - MARGIN * 2 - labelWidth)
    doc.text(lines[0], MARGIN + labelWidth, y)
    y += 14
    for (let i = 1; i < lines.length; i++) {
      y = ensureSpace(doc, y, 14)
      doc.text(lines[i], MARGIN, y); y += 14
    }
    y += 6
  }

  /* LINE ITEMS TABLE */
  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 6
  const cDesc  = tX + 28
  const cQty   = tX + tW * 0.55
  const cRate  = tX + tW * 0.66
  const cDisc  = tX + tW * 0.77
  const cTax   = tX + tW * 0.86
  const cAmt   = tX + tW - 6

  const drawHeader = () => {
    doc.setFillColor(...C_BIZ); doc.rect(tX, y, tW, 22, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('#',           cN,    y + 14)
    doc.text('DESCRIPTION', cDesc, y + 14)
    doc.text('QTY',         cQty,  y + 14, { align: 'right' })
    doc.text('RATE',        cRate, y + 14, { align: 'right' })
    doc.text('DISC',        cDisc, y + 14, { align: 'right' })
    doc.text('TAX %',       cTax,  y + 14, { align: 'right' })
    doc.text('AMOUNT',      cAmt,  y + 14, { align: 'right' })
    y += 22
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < totals.lines.length; i++) {
    const l = totals.lines[i]
    const descLines = doc.splitTextToSize(String(l.description || '—'), cQty - cDesc - 8)
    const rowH = Math.max(LINE_H + 2, descLines.length * LINE_H + 2)
    y = ensureSpace(doc, y, rowH)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, rowH, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 12)
    doc.setTextColor(...C_INK_950)
    doc.text(descLines, cDesc, y + 12)
    doc.text(formatNumber(Number(l.qty) || 0),  cQty,  y + 12, { align: 'right' })
    doc.text(formatNumber(Number(l.rate) || 0), cRate, y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_700)
    doc.text(l.discount > 0 ? formatNumber(l.discount) : '—', cDisc, y + 12, { align: 'right' })
    doc.text(l.taxPct > 0 ? `${formatNumber(l.taxPct)}%` : '—', cTax, y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(l.total), cAmt, y + 12, { align: 'right' })
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
  drawTotalRow('Subtotal', totals.subtotal)
  if (totals.lineDiscounts > 0)  drawTotalRow('Line discounts', -totals.lineDiscounts)
  if (totals.quoteDiscount > 0)  drawTotalRow(`Quote discount`, -totals.quoteDiscount)
  if (totals.totalTax > 0)       drawTotalRow('Tax', totals.totalTax)
  if (totals.shipping > 0)       drawTotalRow('Shipping / handling', totals.shipping)
  if (totals.adjustment !== 0)   drawTotalRow('Adjustment', totals.adjustment)
  y += 4
  doc.setDrawColor(...C_BIZ); doc.setLineWidth(1)
  doc.line(totalsX1, y, totalsX2, y); y += 4
  drawTotalRow('TOTAL', totals.grandTotal, { bold: true, large: true, accent: true })

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

  /* TERMS */
  if (data.includeTermsBlock && data.terms) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('TERMS & CONDITIONS', MARGIN, y); y += 12
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
    const halfW = (PAGE_W - MARGIN * 2 - 40) / 2
    const sBlockY = y

    // Provider signature
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('AUTHORISED BY (PROVIDER)', MARGIN, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN, sBlockY + 40, MARGIN + halfW, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature', MARGIN, sBlockY + 52)
    if (data.from?.signatoryName) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.setTextColor(...C_INK_950)
      doc.text(data.from.signatoryName, MARGIN, sBlockY + 64)
    }

    // Client signature
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('ACCEPTED BY (CLIENT)', MARGIN + halfW + 40, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN + halfW + 40, sBlockY + 40, PAGE_W - MARGIN, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN + halfW + 40, sBlockY + 52)
    y += 70
  }

  addPageFooters(doc, data, totals)

  const fileName = `quotation-${(data.quoteNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Quotation${data.quoteNumber ? ` · ${data.quoteNumber}` : ''}${totals.expiryDate ? ` · valid until ${totals.expiryDate}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
