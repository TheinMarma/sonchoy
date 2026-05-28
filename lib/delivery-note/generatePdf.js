import jsPDF from 'jspdf'
import {
  formatNumber, formatDate,
  findDnStatus, findTransportMode, findPackageType,
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

const BODY = 10
const LINE_H = 14

export function generateDeliveryNotePdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const status = findDnStatus(data.statusId)
  const mode = findTransportMode(data.transportModeId)
  const pkgType = findPackageType(data.packageTypeId)
  const totals = computeTotals(data)

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_BIZ)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  /* HEADER */
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
  const contact = [data.from?.email, data.from?.phone].filter(Boolean).join('  ·  ')
  if (contact) { doc.text(contact, MARGIN, y); y += 12 }
  if (data.from?.taxId) { doc.text(`Tax ID: ${data.from.taxId}`, MARGIN, y); y += 12 }

  // Right: DELIVERY NOTE block
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(26)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('DELIVERY NOTE', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.dnNumber)     { doc.text(`DN #: ${data.dnNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.dnDate)       { doc.text(`Date: ${formatDate(data.dnDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.poRef)        { doc.text(`PO ref: ${data.poRef}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.invoiceRef)   { doc.text(`Invoice ref: ${data.invoiceRef}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.dispatchDate) { doc.text(`Dispatch: ${formatDate(data.dispatchDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }

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

  /* CONSIGNEE + SHIP-FROM BLOCK */
  const colW = (PAGE_W - MARGIN * 2 - 20) / 2
  const leftX  = MARGIN
  const rightX = MARGIN + colW + 20

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('DELIVER TO (CONSIGNEE)', leftX, y)
  doc.text('SHIP FROM', rightX, y)
  y += 12

  // Consignee
  let leftY = y
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.to?.companyName || '[Consignee]', leftX, leftY); leftY += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.to?.contactName) { doc.text(data.to.contactName, leftX, leftY); leftY += 12 }
  if (data.to?.address) {
    const lines = doc.splitTextToSize(data.to.address, colW)
    for (const ln of lines) { doc.text(ln, leftX, leftY); leftY += 12 }
  }
  if (data.to?.phone) { doc.text(data.to.phone, leftX, leftY); leftY += 12 }
  if (data.to?.email) { doc.text(data.to.email, leftX, leftY); leftY += 12 }

  // Ship-from
  let rightY2 = y
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.shipFrom?.location || data.from?.companyName || '[Origin]', rightX, rightY2); rightY2 += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.shipFrom?.contactName) { doc.text(data.shipFrom.contactName, rightX, rightY2); rightY2 += 12 }
  if (data.shipFrom?.address) {
    const lines = doc.splitTextToSize(data.shipFrom.address, colW)
    for (const ln of lines) { doc.text(ln, rightX, rightY2); rightY2 += 12 }
  }
  if (data.shipFrom?.phone) { doc.text(data.shipFrom.phone, rightX, rightY2); rightY2 += 12 }

  y = Math.max(leftY, rightY2) + 8

  /* DISPATCH STRIP */
  y = ensureSpace(doc, y, 50)
  doc.setFillColor(248, 248, 244)
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 44, 'F')
  const cellW = (PAGE_W - MARGIN * 2) / 4
  const cells = [
    ['TRANSPORT',     mode.label],
    ['VEHICLE / AWB', data.vehicleNo || data.awb || '—'],
    ['DRIVER',        data.driverName || '—'],
    ['EXPECTED',      formatDate(data.expectedDate) || '—'],
  ]
  cells.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text(k, MARGIN + i * cellW + 8, y + 16)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
    doc.setTextColor(...C_INK_950)
    const valLines = doc.splitTextToSize(String(v), cellW - 12)
    doc.text(valLines[0], MARGIN + i * cellW + 8, y + 32)
  })
  y += 56

  /* LINE ITEMS TABLE — no prices */
  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 6
  const cSku   = tX + 28
  const cDesc  = tX + 110
  const cOrd   = tX + tW * 0.66
  const cDisp  = tX + tW * 0.76
  const cPend  = tX + tW * 0.86
  const cUnit  = tX + tW - 6

  const drawHeader = () => {
    doc.setFillColor(...C_BIZ); doc.rect(tX, y, tW, 22, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('#',           cN,    y + 14)
    doc.text('SKU',         cSku,  y + 14)
    doc.text('DESCRIPTION', cDesc, y + 14)
    doc.text('ORDERED',     cOrd,  y + 14, { align: 'right' })
    doc.text('DISPATCHED',  cDisp, y + 14, { align: 'right' })
    doc.text('PENDING',     cPend, y + 14, { align: 'right' })
    doc.text('UNIT',        cUnit, y + 14, { align: 'right' })
    y += 22
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < totals.lines.length; i++) {
    const l = totals.lines[i]
    const descText = String(l.description || '—') + (l.batchNo ? `   ·   Batch: ${l.batchNo}` : '')
    const descLines = doc.splitTextToSize(descText, cOrd - cDesc - 8)
    const rowH = Math.max(LINE_H + 2, descLines.length * LINE_H + 2)
    y = ensureSpace(doc, y, rowH)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, rowH, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 12)
    doc.setTextColor(...C_INK_700)
    doc.setFont('helvetica', 'bold')
    doc.text(String(l.sku || '—'), cSku, y + 12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C_INK_950)
    doc.text(descLines, cDesc, y + 12)
    doc.text(formatNumber(l.qtyOrdered),    cOrd,  y + 12, { align: 'right' })
    doc.setTextColor(l.qtyDispatched > 0 ? C_BIZ_DK : C_INK_500)
    doc.text(formatNumber(l.qtyDispatched), cDisp, y + 12, { align: 'right' })
    doc.setTextColor(l.qtyPending > 0 ? [217, 119, 6] : C_INK_500)
    doc.text(formatNumber(l.qtyPending),    cPend, y + 12, { align: 'right' })
    doc.setTextColor(...C_INK_700)
    doc.text(String(l.unit || 'ea'),        cUnit, y + 12, { align: 'right' })
    y += rowH
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  y += 8

  /* TOTALS STRIP */
  y = ensureSpace(doc, y, 40)
  doc.setFillColor(...(totals.fullyDispatched ? C_BIZ : [248, 248, 244]))
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 32, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...(totals.fullyDispatched ? [255, 255, 255] : C_BIZ_DK))
  doc.text('TOTAL ORDERED',    MARGIN + 12, y + 13)
  doc.text('TOTAL DISPATCHED', MARGIN + 160, y + 13)
  doc.text('TOTAL PENDING',    MARGIN + 308, y + 13)
  if (totals.totalWeight > 0) doc.text('TOTAL WEIGHT', MARGIN + 440, y + 13)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(12)
  doc.setTextColor(...(totals.fullyDispatched ? [255, 255, 255] : C_INK_950))
  doc.text(formatNumber(totals.totalOrdered),    MARGIN + 12, y + 26)
  doc.text(formatNumber(totals.totalDispatched), MARGIN + 160, y + 26)
  doc.text(formatNumber(totals.totalPending),    MARGIN + 308, y + 26)
  if (totals.totalWeight > 0) doc.text(`${formatNumber(totals.totalWeight)} kg`, MARGIN + 440, y + 26)
  y += 44

  // Pricing note
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8)
  doc.setTextColor(...C_INK_500)
  doc.text('This is a delivery note. Pricing not shown — refer to the corresponding invoice for amounts.', MARGIN, y)
  y += 18

  /* PACKAGE INFO */
  if (data.includePackageBlock) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('PACKAGE DETAILS', MARGIN, y); y += 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const pkgInfo = [
      ['Type',          pkgType.label],
      ['Package count', String(data.packageCount || '—')],
      ['Gross weight',  data.grossWeight ? `${formatNumber(data.grossWeight)} kg` : '—'],
      ['Dimensions',    data.dimensions || '—'],
      ['Marks & nos',   data.marks || '—'],
    ]
    const labelW = 110
    pkgInfo.forEach(([k, v]) => {
      y = ensureSpace(doc, y, 13)
      doc.setTextColor(...C_INK_500)
      doc.text(k, MARGIN, y)
      doc.setTextColor(...C_INK_950)
      doc.text(String(v), MARGIN + labelW, y)
      y += 13
    })
    y += 8
  }

  /* NOTES */
  if (data.includeNotesBlock && data.notes) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('NOTES / HANDLING INSTRUCTIONS', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
    y += 8
  }

  /* RECEIPT / SIGNATURE BLOCK */
  if (data.includeReceiptBlock) {
    y = ensureSpace(doc, y, 90)
    y += 6
    const halfW = (PAGE_W - MARGIN * 2 - 40) / 2
    const sBlockY = y

    // Dispatched by
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('DISPATCHED BY (SENDER)', MARGIN, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN, sBlockY + 40, MARGIN + halfW, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Name, signature & date', MARGIN, sBlockY + 52)
    if (data.from?.signatoryName) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.setTextColor(...C_INK_950)
      doc.text(data.from.signatoryName, MARGIN, sBlockY + 64)
    }

    // Received by
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('RECEIVED BY (CONSIGNEE)', MARGIN + halfW + 40, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN + halfW + 40, sBlockY + 40, PAGE_W - MARGIN, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Name, signature, date & seal', MARGIN + halfW + 40, sBlockY + 52)
    doc.text('Received goods in good condition', MARGIN + halfW + 40, sBlockY + 66)
    y += 80
  }

  addPageFooters(doc, data, totals)

  const fileName = `delivery-note-${(data.dnNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Delivery Note${data.dnNumber ? ` · ${data.dnNumber}` : ''}${data.poRef ? ` · against PO ${data.poRef}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}  ·  ${totals.lines.length} lines`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
