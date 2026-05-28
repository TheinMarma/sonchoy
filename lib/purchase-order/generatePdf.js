import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findPoStatus, findPoType, findDeliveryTerm, findPaymentTerm,
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

export function generatePurchaseOrderPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const status = findPoStatus(data.statusId)
  const poType = findPoType(data.poTypeId)
  const deliveryTerm = findDeliveryTerm(data.deliveryTermId)
  const paymentTerm = findPaymentTerm(data.paymentTermId)
  const totals = computeTotals(data)
  const taxSummary = buildTaxSummary(totals.lines)

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_BIZ)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  /* HEADER */
  // Left: brand / buyer
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.buyer?.companyName || '[Your Company]', MARGIN, y + 18)
  y += 24

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.buyer?.address) {
    const lines = doc.splitTextToSize(data.buyer.address, PAGE_W / 2 - MARGIN)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  const contact = [data.buyer?.email, data.buyer?.phone, data.buyer?.website].filter(Boolean).join('  ·  ')
  if (contact) { doc.text(contact, MARGIN, y); y += 12 }
  if (data.buyer?.taxId) { doc.text(`Tax ID: ${data.buyer.taxId}`, MARGIN, y); y += 12 }

  // Right: PURCHASE ORDER block
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(24)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('PURCHASE ORDER', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.poNumber)     { doc.text(`PO #: ${data.poNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.poDate)       { doc.text(`Date: ${formatDate(data.poDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.requiredDate) { doc.text(`Required by: ${formatDate(data.requiredDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.quoteRef)     { doc.text(`Quote ref: ${data.quoteRef}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (poType?.label)     { doc.text(`Type: ${poType.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }

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

  /* VENDOR + SHIP-TO BLOCK (two columns) */
  const colW = (PAGE_W - MARGIN * 2 - 20) / 2
  const leftX  = MARGIN
  const rightX = MARGIN + colW + 20
  const blockTop = y

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('VENDOR', leftX, y)
  doc.text('SHIP TO', rightX, y)
  y += 12

  // Vendor
  let leftY = y
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.vendor?.companyName || '[Vendor Name]', leftX, leftY); leftY += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.vendor?.contactName) { doc.text(data.vendor.contactName, leftX, leftY); leftY += 12 }
  if (data.vendor?.address) {
    const lines = doc.splitTextToSize(data.vendor.address, colW)
    for (const ln of lines) { doc.text(ln, leftX, leftY); leftY += 12 }
  }
  if (data.vendor?.email) { doc.text(data.vendor.email, leftX, leftY); leftY += 12 }
  if (data.vendor?.phone) { doc.text(data.vendor.phone, leftX, leftY); leftY += 12 }
  if (data.vendor?.taxId) { doc.text(`Tax ID: ${data.vendor.taxId}`, leftX, leftY); leftY += 12 }

  // Ship-to
  let rightY2 = y
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.shipTo?.companyName || data.buyer?.companyName || '[Ship-to]', rightX, rightY2); rightY2 += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.shipTo?.contactName) { doc.text(data.shipTo.contactName, rightX, rightY2); rightY2 += 12 }
  if (data.shipTo?.address) {
    const lines = doc.splitTextToSize(data.shipTo.address, colW)
    for (const ln of lines) { doc.text(ln, rightX, rightY2); rightY2 += 12 }
  }
  if (data.shipTo?.email) { doc.text(data.shipTo.email, rightX, rightY2); rightY2 += 12 }
  if (data.shipTo?.phone) { doc.text(data.shipTo.phone, rightX, rightY2); rightY2 += 12 }

  y = Math.max(leftY, rightY2) + 8
  void blockTop

  /* DELIVERY / TERMS STRIP */
  if (data.includeDeliveryBlock) {
    y = ensureSpace(doc, y, 50)
    doc.setFillColor(248, 248, 244)
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 44, 'F')
    const cellW = (PAGE_W - MARGIN * 2) / 3
    const cells = [
      ['DELIVERY TERMS',  deliveryTerm.label],
      ['PAYMENT TERMS',   paymentTerm.label],
      ['SHIP VIA',        data.shipVia || '—'],
    ]
    cells.forEach(([k, v], i) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
      doc.setTextColor(...C_BIZ_DK)
      doc.text(k, MARGIN + i * cellW + 10, y + 16)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
      doc.setTextColor(...C_INK_950)
      doc.text(String(v), MARGIN + i * cellW + 10, y + 32)
    })
    y += 56
  }

  /* LINE ITEMS TABLE */
  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 6
  const cDesc  = tX + 28
  const cQty   = tX + tW * 0.52
  const cUnit  = tX + tW * 0.62
  const cRate  = tX + tW * 0.74
  const cTax   = tX + tW * 0.86
  const cAmt   = tX + tW - 6

  const drawHeader = () => {
    doc.setFillColor(...C_BIZ); doc.rect(tX, y, tW, 22, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('#',           cN,    y + 14)
    doc.text('DESCRIPTION', cDesc, y + 14)
    doc.text('QTY',         cQty,  y + 14, { align: 'right' })
    doc.text('UNIT',        cUnit, y + 14, { align: 'right' })
    doc.text('RATE',        cRate, y + 14, { align: 'right' })
    doc.text('TAX %',       cTax,  y + 14, { align: 'right' })
    doc.text('AMOUNT',      cAmt,  y + 14, { align: 'right' })
    y += 22
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < totals.lines.length; i++) {
    const l = totals.lines[i]
    const descText = String(l.description || '—') + (l.sku ? `   ·   SKU: ${l.sku}` : '')
    const descLines = doc.splitTextToSize(descText, cQty - cDesc - 8)
    const rowH = Math.max(LINE_H + 2, descLines.length * LINE_H + 2)
    y = ensureSpace(doc, y, rowH)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, rowH, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 12)
    doc.setTextColor(...C_INK_950)
    doc.text(descLines, cDesc, y + 12)
    doc.text(formatNumber(Number(l.qty) || 0),  cQty,  y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_700)
    doc.text(String(l.unit || 'ea'), cUnit, y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(Number(l.rate) || 0), cRate, y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_700)
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
  if (totals.poDiscount > 0)     drawTotalRow('PO discount', -totals.poDiscount)
  if (totals.totalTax > 0)       drawTotalRow('Tax', totals.totalTax)
  if (totals.shipping > 0)       drawTotalRow('Shipping / freight', totals.shipping)
  if (totals.adjustment !== 0)   drawTotalRow('Adjustment', totals.adjustment)
  y += 4
  doc.setDrawColor(...C_BIZ); doc.setLineWidth(1)
  doc.line(totalsX1, y, totalsX2, y); y += 4
  drawTotalRow('PO TOTAL', totals.grandTotal, { bold: true, large: true, accent: true })

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
    doc.text('NOTES / INSTRUCTIONS', MARGIN, y); y += 12
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

    // Buyer signature
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('AUTHORISED BY (BUYER)', MARGIN, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN, sBlockY + 40, MARGIN + halfW, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN, sBlockY + 52)
    if (data.buyer?.signatoryName) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.setTextColor(...C_INK_950)
      doc.text(data.buyer.signatoryName, MARGIN, sBlockY + 64)
    }
    if (data.buyer?.signatoryTitle) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
      doc.setTextColor(...C_INK_500)
      doc.text(data.buyer.signatoryTitle, MARGIN, sBlockY + 76)
    }

    // Vendor acknowledgement
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('ACKNOWLEDGED BY (VENDOR)', MARGIN + halfW + 40, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN + halfW + 40, sBlockY + 40, PAGE_W - MARGIN, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN + halfW + 40, sBlockY + 52)
    y += 80
  }

  addPageFooters(doc, data, totals)

  const fileName = `purchase-order-${(data.poNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Purchase Order${data.poNumber ? ` · ${data.poNumber}` : ''}${data.requiredDate ? ` · required by ${data.requiredDate}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}  ·  ${totals.lines.length} lines`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
