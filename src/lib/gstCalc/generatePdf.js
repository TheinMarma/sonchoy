import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findSupplyType, findSheetPurpose,
  computeGstTotals, buildRateSummary, buildHsnSummary,
} from './compute'

const MARGIN = 36
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_TAX     = [132, 204, 22]
const C_TAX_DK  = [77, 124, 15]

const BODY = 9

export function generateGstSheetPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'INR')
  const purpose = findSheetPurpose(data.purposeId)
  const supplyDefault = findSupplyType(data.supplyTypeId)
  const { rows, totals } = computeGstTotals(data.items, {
    gstRatePct: data.defaultGstRatePct,
    supplyTypeId: data.supplyTypeId,
  })
  const rateSummary = buildRateSummary(rows)
  const hsnSummary  = buildHsnSummary(rows)

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_TAX)
  doc.rect(0, 0, PAGE_W, 4, 'F')

  // ============== HEADER ==============

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('GST CALCULATION SHEET', MARGIN, y + 8)
  if (data.sheetReference) {
    doc.text(data.sheetReference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  }
  y += 22

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...C_INK_950)
  doc.text(data.sheetTitle || 'GST Calculation Sheet', MARGIN, y)
  y += 13

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.periodLabel)  meta.push(`Period: ${data.periodLabel}`)
  if (data.sheetDate)    meta.push(`Date: ${formatDate(data.sheetDate)}`)
  meta.push(`Purpose: ${purpose.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y)
  y += 12

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y)
  y += 16

  // ============== ENTITY INFO ==============

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('REGISTERED ENTITY', MARGIN, y); y += 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.setTextColor(...C_INK_950)
  doc.text(data.entity?.name || '[Entity name]', MARGIN, y); y += 12

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.entity?.gstin)   { doc.text(`GSTIN: ${data.entity.gstin}`, MARGIN, y); y += 11 }
  if (data.entity?.address) {
    const lines = doc.splitTextToSize(data.entity.address, PAGE_W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 11 }
  }
  if (data.entity?.placeOfSupply) { doc.text(`Place of supply: ${data.entity.placeOfSupply}`, MARGIN, y); y += 11 }
  y += 6

  // ============== SUMMARY CARDS ==============

  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['TAXABLE VALUE', `${cur.code} ${formatNumber(totals.taxable)}`],
    ['TOTAL GST',     `${cur.code} ${formatNumber(totals.totalTax)}`],
    ['CGST + SGST',   `${cur.code} ${formatNumber(totals.cgst + totals.sgst)}`],
    ['IGST',          `${cur.code} ${formatNumber(totals.igst)}`],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 50, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_TAX_DK); doc.text(cards[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.setTextColor(...C_INK_950); doc.text(cards[i][1], x + 8, y + 34)
  }
  y += 50 + 14

  // ============== LINE ITEMS TABLE ==============

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('LINE ITEMS', MARGIN, y); y += 12

  const tX = MARGIN
  const tW = PAGE_W - MARGIN * 2
  // 9 columns: # | HSN | Description | Qty | Rate | Taxable | GST% | GST amt | Total
  const colW = {
    n:    20,
    hsn:  46,
    qty:  32,
    rate: 50,
    tax:  60,
    gpct: 32,
    gamt: 56,
    tot:  62,
  }
  const descW = tW - (colW.n + colW.hsn + colW.qty + colW.rate + colW.tax + colW.gpct + colW.gamt + colW.tot) - 16
  let cx = tX
  const cN    = cx + 4;                                cx += colW.n
  const cHsn  = cx + 4;                                cx += colW.hsn
  const cDesc = cx + 4;                                cx += descW
  const cQty  = cx + colW.qty - 4;                     cx += colW.qty
  const cRate = cx + colW.rate - 4;                    cx += colW.rate
  const cTax  = cx + colW.tax - 4;                     cx += colW.tax
  const cGp   = cx + colW.gpct - 4;                    cx += colW.gpct
  const cGa   = cx + colW.gamt - 4;                    cx += colW.gamt
  const cTot  = cx + colW.tot - 4

  const drawHeader = () => {
    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 18, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('#',           cN,    y + 12)
    doc.text('HSN/SAC',     cHsn,  y + 12)
    doc.text('DESCRIPTION', cDesc, y + 12)
    doc.text('QTY',         cQty,  y + 12, { align: 'right' })
    doc.text('RATE',        cRate, y + 12, { align: 'right' })
    doc.text('TAXABLE',     cTax,  y + 12, { align: 'right' })
    doc.text('GST %',       cGp,   y + 12, { align: 'right' })
    doc.text('GST AMT',     cGa,   y + 12, { align: 'right' })
    doc.text('TOTAL',       cTot,  y + 12, { align: 'right' })
    y += 18
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  doc.setTextColor(...C_INK_950)
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const descLines = doc.splitTextToSize(String(r.description || '—'), descW - 8)
    const rowH = Math.max(14, descLines.length * 11 + 4)

    if (y + rowH > PAGE_H - MARGIN - 28) {
      addPageFooters(doc, data, purpose)
      doc.addPage(); y = MARGIN; drawHeader()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY); doc.setTextColor(...C_INK_950)
    }

    if (i % 2 === 1) {
      doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, rowH, 'F')
    }
    doc.setTextColor(...C_INK_950)
    doc.text(String(i + 1), cN, y + 11)
    doc.text(r.hsn || '—',  cHsn, y + 11)
    doc.text(descLines, cDesc, y + 11)
    doc.text(formatNumber(Number(r.qty) || 0),       cQty,  y + 11, { align: 'right' })
    doc.text(formatNumber(Number(r.unitPrice) || 0), cRate, y + 11, { align: 'right' })
    doc.text(formatNumber(r.taxable),                cTax,  y + 11, { align: 'right' })
    doc.text(`${formatNumber(Number(r.gstRatePct) || 0)}%`, cGp, y + 11, { align: 'right' })
    doc.setTextColor(...(r.reverseCharge ? C_TAX_DK : C_INK_950))
    doc.text(`${formatNumber(r.totalTax)}${r.reverseCharge ? '*' : ''}`, cGa, y + 11, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(r.lineTotal), cTot, y + 11, { align: 'right' })
    y += rowH
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(tX, y, tX + tW, y)
  }

  // Totals
  y = ensureSpace(doc, y, 20)
  doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TOTALS',                          cDesc, y + 12)
  doc.text(formatNumber(totals.taxable),      cTax,  y + 12, { align: 'right' })
  doc.text(formatNumber(totals.totalTax),     cGa,   y + 12, { align: 'right' })
  doc.text(formatNumber(totals.lineTotal),    cTot,  y + 12, { align: 'right' })
  y += 18

  // Reverse-charge footnote
  if (rows.some((r) => r.reverseCharge)) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('* GST on these lines is payable by the recipient under reverse charge — excluded from invoice total.',
      MARGIN, y); y += 12
  }
  y += 6

  // ============== RATE SUMMARY ==============

  if (data.includeRateSummary && rateSummary.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('GST RATE-WISE SUMMARY', MARGIN, y); y += 12

    const rX = MARGIN
    const rW = PAGE_W - MARGIN * 2
    const c1 = rX + 10
    const c2 = rX + 60
    const c3 = rX + rW * 0.30
    const c4 = rX + rW * 0.48
    const c5 = rX + rW * 0.64
    const c6 = rX + rW * 0.80
    const c7 = rX + rW - 10

    doc.setFillColor(...C_TAX); doc.rect(rX, y, rW, 18, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('RATE',     c1, y + 12)
    doc.text('LINES',    c2, y + 12)
    doc.text('TAXABLE',  c3, y + 12, { align: 'right' })
    doc.text('CGST',     c4, y + 12, { align: 'right' })
    doc.text('SGST',     c5, y + 12, { align: 'right' })
    doc.text('IGST',     c6, y + 12, { align: 'right' })
    doc.text('TOTAL TAX', c7, y + 12, { align: 'right' })
    y += 18

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_950)
    for (const r of rateSummary) {
      y = ensureSpace(doc, y, 16)
      doc.text(`${formatNumber(r.ratePct)}%`,   c1, y + 11)
      doc.text(String(r.count),                 c2, y + 11)
      doc.text(formatNumber(r.taxable),         c3, y + 11, { align: 'right' })
      doc.text(formatNumber(r.cgst),            c4, y + 11, { align: 'right' })
      doc.text(formatNumber(r.sgst),            c5, y + 11, { align: 'right' })
      doc.text(formatNumber(r.igst),            c6, y + 11, { align: 'right' })
      doc.text(formatNumber(r.totalTax),        c7, y + 11, { align: 'right' })
      y += 13
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(rX, y, rX + rW, y)
    }
    y += 8
  }

  // ============== HSN SUMMARY ==============

  if (data.includeHsnSummary && hsnSummary.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('HSN / SAC-WISE SUMMARY', MARGIN, y); y += 12

    const hX = MARGIN
    const hW = PAGE_W - MARGIN * 2
    const cH1 = hX + 10
    const cH2 = hX + 70
    const cH3 = hX + hW * 0.62
    const cH4 = hX + hW * 0.74
    const cH5 = hX + hW * 0.86
    const cH6 = hX + hW - 10

    doc.setFillColor(...C_TAX); doc.rect(hX, y, hW, 18, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('HSN/SAC',     cH1, y + 12)
    doc.text('DESCRIPTION', cH2, y + 12)
    doc.text('LINES',       cH3, y + 12, { align: 'right' })
    doc.text('RATE',        cH4, y + 12, { align: 'right' })
    doc.text('TAXABLE',     cH5, y + 12, { align: 'right' })
    doc.text('GST AMT',     cH6, y + 12, { align: 'right' })
    y += 18

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_950)
    for (const r of hsnSummary) {
      y = ensureSpace(doc, y, 16)
      const descLines = doc.splitTextToSize(r.description || '—', (cH3 - cH2) - 6)
      doc.text(r.hsn,                 cH1, y + 11)
      doc.text(descLines.slice(0, 1), cH2, y + 11)
      doc.text(String(r.count),       cH3, y + 11, { align: 'right' })
      doc.text(`${formatNumber(r.ratePct)}%`, cH4, y + 11, { align: 'right' })
      doc.text(formatNumber(r.taxable), cH5, y + 11, { align: 'right' })
      doc.text(formatNumber(r.totalTax), cH6, y + 11, { align: 'right' })
      y += 13
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(hX, y, hX + hW, y)
    }
    y += 8
  }

  // ============== REVERSE-CHARGE BLOCK ==============

  if (data.includeReverseChargeBlock && totals.reverseChargeTax > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('REVERSE-CHARGE LIABILITY (PAYABLE BY RECIPIENT)', MARGIN, y); y += 12

    doc.setDrawColor(...C_TAX); doc.setLineWidth(0.6)
    doc.setFillColor(244, 252, 220)
    doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 40, 4, 4, 'FD')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    doc.text('Total GST under reverse charge', MARGIN + 12, y + 24)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.setTextColor(...C_TAX_DK)
    doc.text(`${cur.code} ${formatNumber(totals.reverseChargeTax)}`, PAGE_W - MARGIN - 12, y + 26, { align: 'right' })
    y += 40 + 10
  }

  // ============== NOTES ==============

  if (data.notes) {
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
  }

  addPageFooters(doc, data, purpose)

  const fileName = `gst-sheet-${(data.sheetReference || purpose.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 20) { doc.addPage(); return MARGIN }
  return y
}

function addPageFooters(doc, data, purpose) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `${purpose.label} · ${data.sheetReference || ''}`.replace(/ · $/, '')
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
