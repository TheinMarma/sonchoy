import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findStatus, findFrequency, findPaymentTerm, findEndCondition, findAutoSend,
  projectSchedule,
} from './compute'

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_INV     = [251, 191, 36]
const C_INV_DK  = [180, 110, 5]

const BODY = 10
const LINE_H = 14

export function generateRecurringInvoicePdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const status = findStatus(data.statusId)
  const freq   = findFrequency(data.frequencyId)
  const term   = findPaymentTerm(data.paymentTermId)
  const endCond = findEndCondition(data.endConditionId)
  const autoSend = findAutoSend(data.autoSendModeId)
  const projection = projectSchedule(data, 24)
  const totals = projection.totals

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_INV)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.from?.businessName || data.from?.name || '[Your business]', MARGIN, y + 18)
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

  // Right
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INV_DK)
  doc.text('RECURRING INVOICE', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.scheduleId) { doc.text(`Schedule #: ${data.scheduleId}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(`Frequency: ${freq.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  if (data.startDate) { doc.text(`Starts: ${formatDate(data.startDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(`Terms: ${term.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  doc.text(`Ends: ${endLabel(endCond, data)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  doc.text(`Auto-send: ${autoSend.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12

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

  y = Math.max(y, ry + 30) + 6

  doc.setDrawColor(...C_INV); doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 18

  /* BILL TO */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INV_DK)
  doc.text('BILL TO', MARGIN, y); y += 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.to?.companyName || '[Client]', MARGIN, y); y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.to?.contactName) { doc.text(data.to.contactName, MARGIN, y); y += 12 }
  if (data.to?.address) {
    const lines = doc.splitTextToSize(data.to.address, PAGE_W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  if (data.to?.email) { doc.text(data.to.email, MARGIN, y); y += 12 }
  if (data.to?.taxId) { doc.text(`Tax ID: ${data.to.taxId}`, MARGIN, y); y += 12 }
  y += 6

  /* SCHEDULE-LEVEL HERO STATS */
  y = ensureSpace(doc, y, 70)
  doc.setFillColor(248, 248, 244)
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 60, 'F')
  const tileW = (PAGE_W - MARGIN * 2) / 4
  const tiles = [
    ['PER INVOICE',     `${cur.code} ${formatNumber(totals.grandTotal)}`],
    ['ANNUALISED',      `${cur.code} ${formatNumber(projection.annualisedRevenue || 0)}`],
    ['OCCURRENCES',     projection.plannedCount == null ? 'Open' : String(projection.plannedCount)],
    ['LIFETIME VALUE',  projection.totalProjectedRevenue == null ? 'Open-ended' : `${cur.code} ${formatNumber(projection.totalProjectedRevenue)}`],
  ]
  tiles.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INV_DK)
    doc.text(k, MARGIN + i * tileW + 10, y + 16)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.setTextColor(...C_INK_950)
    const vLines = doc.splitTextToSize(String(v), tileW - 16)
    doc.text(vLines[0], MARGIN + i * tileW + 10, y + 42)
  })
  y += 70

  /* TEMPLATE LINE ITEMS */
  y = ensureSpace(doc, y, 60)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(...C_INV_DK)
  doc.text('TEMPLATE — BILLED EACH CYCLE', MARGIN, y); y += 14

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN    = tX + 6
  const cDesc = tX + 26
  const cQty  = tX + tW * 0.62
  const cRate = tX + tW * 0.75
  const cTax  = tX + tW * 0.86
  const cAmt  = tX + tW - 6

  doc.setFillColor(...C_INV); doc.rect(tX, y, tW, 20, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_INV_DK)
  doc.text('#',           cN,    y + 13)
  doc.text('DESCRIPTION', cDesc, y + 13)
  doc.text('QTY',         cQty,  y + 13, { align: 'right' })
  doc.text('RATE',        cRate, y + 13, { align: 'right' })
  doc.text('TAX %',       cTax,  y + 13, { align: 'right' })
  doc.text('AMOUNT',      cAmt,  y + 13, { align: 'right' })
  y += 20

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < totals.lines.length; i++) {
    const l = totals.lines[i]
    const descLines = doc.splitTextToSize(String(l.description || '—'), cQty - cDesc - 8)
    const rowH = Math.max(LINE_H + 2, descLines.length * LINE_H + 2)
    y = ensureSpace(doc, y, rowH)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, rowH, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 11)
    doc.setTextColor(...C_INK_950)
    doc.text(descLines, cDesc, y + 11)
    doc.text(formatNumber(Number(l.qty) || 0),  cQty,  y + 11, { align: 'right' })
    doc.text(formatNumber(Number(l.rate) || 0), cRate, y + 11, { align: 'right' })
    doc.setTextColor(...C_INK_700)
    doc.text(l.taxable && l.taxPct > 0 ? `${formatNumber(l.taxPct)}%` : '—', cTax, y + 11, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'bold')
    doc.text(formatNumber(l.total), cAmt, y + 11, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += rowH
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  // Total row for the template
  y = ensureSpace(doc, y, 22)
  doc.setFillColor(...C_INV); doc.rect(tX, y, tW, 22, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.setTextColor(...C_INV_DK)
  doc.text('PER-CYCLE TOTAL', cDesc, y + 14)
  doc.text(`${cur.code} ${formatNumber(totals.grandTotal)}`, cAmt, y + 14, { align: 'right' })
  y += 30

  /* PROJECTED SCHEDULE */
  if (projection.occurrences.length > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_INV_DK)
    const headerSuffix = projection.plannedCount != null && projection.plannedCount > projection.occurrences.length
      ? `  (first ${projection.occurrences.length} of ${projection.plannedCount})`
      : projection.plannedCount == null
        ? `  (next ${projection.occurrences.length})`
        : ''
    doc.text(`PROJECTED SCHEDULE${headerSuffix}`, MARGIN, y); y += 14

    const sN    = tX + 6
    const sNum  = tX + 30
    const sIss  = tX + 130
    const sDue  = tX + tW * 0.55
    const sAmt  = tX + tW - 6

    doc.setFillColor(248, 248, 244); doc.rect(tX, y, tW, 18, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INV_DK)
    doc.text('#',              sN,   y + 12)
    doc.text('INVOICE #',      sNum, y + 12)
    doc.text('ISSUE DATE',     sIss, y + 12)
    doc.text('DUE DATE',       sDue, y + 12)
    doc.text('AMOUNT',         sAmt, y + 12, { align: 'right' })
    y += 18

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    for (let i = 0; i < projection.occurrences.length; i++) {
      const o = projection.occurrences[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_500)
      doc.text(String(o.n), sN, y + 10)
      doc.setTextColor(...C_INK_950)
      doc.text(o.invoiceNumber, sNum, y + 10)
      doc.setTextColor(...C_INK_700)
      doc.text(formatDate(o.issueDate), sIss, y + 10)
      doc.text(formatDate(o.dueDate),   sDue, y + 10)
      doc.setTextColor(...C_INK_950)
      doc.text(`${cur.code} ${formatNumber(o.total)}`, sAmt, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.2); doc.line(tX, y, tX + tW, y)
    }
    y += 6
    if (projection.plannedCount != null && projection.plannedCount > projection.occurrences.length) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8)
      doc.setTextColor(...C_INK_500)
      doc.text(`+ ${projection.plannedCount - projection.occurrences.length} more occurrences not shown`, MARGIN, y); y += 12
    }
    y += 8
  }

  /* PAYMENT */
  if (data.includePaymentBlock) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_INV_DK)
    doc.text('HOW TO PAY (EVERY CYCLE)', MARGIN, y); y += 14

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const payRows = [
      ['Bank',          data.payment?.bankName],
      ['Account name',  data.payment?.accountName],
      ['Account no.',   data.payment?.accountNumber],
      ['IFSC / SWIFT',  data.payment?.ifsc],
      ['UPI / PayID',   data.payment?.upi],
      ['Auto-pay link', data.payment?.autopayLink],
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
    doc.text('TERMS', MARGIN, y); y += 12
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

  addPageFooters(doc, data, projection)

  const fileName = `recurring-invoice-${(data.scheduleId || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function endLabel(endCond, data) {
  if (endCond.id === 'after_count') return `after ${data.occurrenceCount || 0} cycles`
  if (endCond.id === 'on_date')     return data.endDate ? `on ${data.endDate}` : 'on a date'
  return 'until cancelled'
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 24) { doc.addPage(); return MARGIN }
  return y
}

function addPageFooters(doc, data, projection) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `Recurring Invoice${data.scheduleId ? ` · ${data.scheduleId}` : ''}${projection.freq ? ` · ${projection.freq.label}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
