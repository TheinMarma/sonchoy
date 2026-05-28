import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findFilingFrequency, findReportPurpose,
  computeReport, buildStateSummary, buildCountySummary, buildRateSummary,
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

export function generateSalesTaxReportPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findReportPurpose(data.purposeId)
  const filing  = findFilingFrequency(data.filingFrequencyId)
  const { rows, totals } = computeReport(data)
  const stateSummary  = buildStateSummary(rows)
  const countySummary = buildCountySummary(rows)
  const rateSummary   = buildRateSummary(rows)

  let y = MARGIN

  doc.setFillColor(...C_TAX); doc.rect(0, 0, PAGE_W, 4, 'F')

  // ============== HEADER ==============

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('SALES TAX REPORT', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Sales Tax Report', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.periodLabel) meta.push(`Period: ${data.periodLabel}`)
  if (data.reportDate)  meta.push(`Generated: ${formatDate(data.reportDate)}`)
  meta.push(`Filing: ${filing.label}`)
  meta.push(`Purpose: ${purpose.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 12

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 14

  // Entity
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('REGISTERED SELLER', MARGIN, y); y += 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.setTextColor(...C_INK_950)
  doc.text(data.entity?.name || '[Entity name]', MARGIN, y); y += 12

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (data.entity?.taxId)   { doc.text(`Tax ID: ${data.entity.taxId}`, MARGIN, y); y += 11 }
  if (data.entity?.address) {
    const lines = doc.splitTextToSize(data.entity.address, PAGE_W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 11 }
  }
  if (data.entity?.contactEmail) { doc.text(data.entity.contactEmail, MARGIN, y); y += 11 }
  y += 6

  // ============== SUMMARY CARDS ==============

  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['GROSS SALES',   `${cur.code} ${formatNumber(totals.gross)}`],
    ['EXEMPT',        `${cur.code} ${formatNumber(totals.exempt)}`],
    ['TAXABLE',       `${cur.code} ${formatNumber(totals.taxable)}`],
    ['TOTAL TAX DUE', `${cur.code} ${formatNumber(totals.totalTax)}`],
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

  // ============== STATE SUMMARY ==============

  if (data.includeStateSummary && stateSummary.length > 0) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('BY STATE / PROVINCE', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 10                          // code
    const c2 = tX + 50                          // label
    const c3 = tX + tW * 0.36                   // taxable
    const c4 = tX + tW * 0.52                   // state
    const c5 = tX + tW * 0.66                   // county
    const c6 = tX + tW * 0.80                   // city/special
    const c7 = tX + tW - 10                     // total tax

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('CODE',     c1, y + 11)
    doc.text('STATE',    c2, y + 11)
    doc.text('TAXABLE',  c3, y + 11, { align: 'right' })
    doc.text('STATE',    c4, y + 11, { align: 'right' })
    doc.text('COUNTY',   c5, y + 11, { align: 'right' })
    doc.text('CITY/DIST', c6, y + 11, { align: 'right' })
    doc.text('TOTAL',    c7, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < stateSummary.length; i++) {
      const r = stateSummary[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(r.code, c1, y + 10)
      const lab = doc.splitTextToSize(r.label.split('(')[0].trim(), c3 - c2 - 6)
      doc.text(lab.slice(0, 1), c2, y + 10)
      doc.text(formatNumber(r.taxable),                c3, y + 10, { align: 'right' })
      doc.text(formatNumber(r.stateTax),               c4, y + 10, { align: 'right' })
      doc.text(formatNumber(r.countyTax),              c5, y + 10, { align: 'right' })
      doc.text(formatNumber(r.cityTax + r.specialTax), c6, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(r.totalTax),               c7, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }

    // Totals row
    y = ensureSpace(doc, y, 18)
    doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
    doc.line(tX, y, tX + tW, y); y += 2
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    doc.setTextColor(...C_TAX_DK)
    doc.text('TOTALS',                                 c2, y + 12)
    doc.text(formatNumber(totals.taxable),             c3, y + 12, { align: 'right' })
    doc.text(formatNumber(totals.stateTax),            c4, y + 12, { align: 'right' })
    doc.text(formatNumber(totals.countyTax),           c5, y + 12, { align: 'right' })
    doc.text(formatNumber(totals.cityTax + totals.specialTax), c6, y + 12, { align: 'right' })
    doc.text(formatNumber(totals.totalTax),            c7, y + 12, { align: 'right' })
    y += 18 + 6
  }

  // ============== COUNTY SUMMARY ==============

  if (data.includeCountySummary && countySummary.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('BY COUNTY / LOCALITY', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 10
    const c2 = tX + 50
    const c3 = tX + tW * 0.55
    const c4 = tX + tW * 0.78
    const c5 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('STATE',   c1, y + 11)
    doc.text('COUNTY',  c2, y + 11)
    doc.text('TXNS',    c3, y + 11, { align: 'right' })
    doc.text('TAXABLE', c4, y + 11, { align: 'right' })
    doc.text('TAX',     c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < countySummary.length; i++) {
      const r = countySummary[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(r.stateCode, c1, y + 10)
      doc.text(r.county,    c2, y + 10)
      doc.text(String(r.transactions), c3, y + 10, { align: 'right' })
      doc.text(formatNumber(r.taxable),  c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(r.totalTax), c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  // ============== RATE SUMMARY ==============

  if (data.includeRateSummary && rateSummary.length > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('BY COMBINED RATE', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 10
    const c2 = tX + tW * 0.30
    const c3 = tX + tW * 0.60
    const c4 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('RATE',    c1, y + 11)
    doc.text('TXNS',    c2, y + 11, { align: 'right' })
    doc.text('TAXABLE', c3, y + 11, { align: 'right' })
    doc.text('TAX',     c4, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const r of rateSummary) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(`${formatNumber(r.ratePct)}%`, c1, y + 10)
      doc.text(String(r.transactions),         c2, y + 10, { align: 'right' })
      doc.text(formatNumber(r.taxable),        c3, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(r.totalTax),       c4, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  // ============== TRANSACTIONS TABLE ==============

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TRANSACTION DETAIL', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 6
  const cDate  = tX + 24
  const cInv   = tX + 80
  const cJur   = tX + 130
  const cGross = tX + tW * 0.50
  const cExmp  = tX + tW * 0.62
  const cTxbl  = tX + tW * 0.74
  const cRate  = tX + tW * 0.86
  const cTax   = tX + tW - 6

  const drawHeader = () => {
    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('#',        cN,     y + 11)
    doc.text('DATE',     cDate,  y + 11)
    doc.text('INVOICE',  cInv,   y + 11)
    doc.text('JURISD.',  cJur,   y + 11)
    doc.text('GROSS',    cGross, y + 11, { align: 'right' })
    doc.text('EXEMPT',   cExmp,  y + 11, { align: 'right' })
    doc.text('TAXABLE',  cTxbl,  y + 11, { align: 'right' })
    doc.text('RATE',     cRate,  y + 11, { align: 'right' })
    doc.text('TAX',      cTax,   y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < rows.length; i++) {
    if (y + 14 > PAGE_H - MARGIN - 28) {
      addPageFooters(doc, data, purpose); doc.addPage(); y = MARGIN; drawHeader()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    }
    const r = rows[i]
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setTextColor(...C_INK_950)
    doc.text(String(i + 1), cN, y + 10)
    doc.text(formatDate(r.date) || '—', cDate, y + 10)
    doc.text(String(r.invoiceNumber || '—').slice(0, 12), cInv, y + 10)
    doc.text(r.jurisdictionCode || '—', cJur, y + 10)
    doc.text(formatNumber(r.gross),   cGross, y + 10, { align: 'right' })
    doc.text(formatNumber(r.exempt),  cExmp,  y + 10, { align: 'right' })
    doc.text(formatNumber(r.taxable), cTxbl,  y + 10, { align: 'right' })
    doc.text(`${formatNumber(r.totalRate)}%`, cRate, y + 10, { align: 'right' })
    doc.setTextColor(...C_TAX_DK)
    doc.text(formatNumber(r.totalTax), cTax, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  // Totals
  y = ensureSpace(doc, y, 18)
  doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TOTALS', cDate, y + 12)
  doc.text(formatNumber(totals.gross),    cGross, y + 12, { align: 'right' })
  doc.text(formatNumber(totals.exempt),   cExmp,  y + 12, { align: 'right' })
  doc.text(formatNumber(totals.taxable),  cTxbl,  y + 12, { align: 'right' })
  doc.text(formatNumber(totals.totalTax), cTax,   y + 12, { align: 'right' })
  y += 18

  // ============== NOTES ==============

  if (data.notes) {
    y += 6
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

  const fileName = `sales-tax-report-${(data.reference || purpose.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Sales tax report${data.periodLabel ? ` · ${data.periodLabel}` : ''}${data.reference ? ` · ${data.reference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
