import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findLoanType, computeAggregate, buildMonthlyProjection, buildTypeSummary,
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

const BODY = 9.5

export function generateMonthlyLoanPaymentPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const { loans, totals } = computeAggregate(data.loans)
  const typeSummary = buildTypeSummary(loans)
  const projection = data.includeProjection
    ? buildMonthlyProjection(data.loans, Number(data.projectionMonths) || 12, data.projectionStartDate)
    : []

  let y = MARGIN

  doc.setFillColor(...C_TAX); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('MONTHLY LOAN PAYMENT REPORT', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Monthly Loan Payment Report', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.borrowerName) meta.push(`Borrower: ${data.borrowerName}`)
  if (data.reportDate)   meta.push(`As at: ${formatDate(data.reportDate)}`)
  meta.push(`Loans: ${loans.length}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* SUMMARY CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['MONTHLY OUTFLOW',  `${cur.code} ${formatNumber(totals.emi)}`],
    ['INTEREST / MO',    `${cur.code} ${formatNumber(totals.monthlyInterest)}`],
    ['PRINCIPAL / MO',   `${cur.code} ${formatNumber(totals.monthlyPrincipal)}`],
    ['TOTAL BALANCE',    `${cur.code} ${formatNumber(totals.balance)}`],
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

  /* LOANS TABLE */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('LOAN-BY-LOAN BREAKDOWN', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 4
  const cName  = tX + 22
  const cType  = tX + tW * 0.32
  const cBal   = tX + tW * 0.49
  const cRate  = tX + tW * 0.61
  const cEmi   = tX + tW * 0.72
  const cInt   = tX + tW * 0.85
  const cLeft  = tX + tW - 4

  const drawHeader = () => {
    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('#',         cN,    y + 11)
    doc.text('LOAN',      cName, y + 11)
    doc.text('TYPE',      cType, y + 11)
    doc.text('BALANCE',   cBal,  y + 11, { align: 'right' })
    doc.text('RATE',      cRate, y + 11, { align: 'right' })
    doc.text('EMI / MO',  cEmi,  y + 11, { align: 'right' })
    doc.text('INT / MO',  cInt,  y + 11, { align: 'right' })
    doc.text('MO. LEFT',  cLeft, y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < loans.length; i++) {
    const l = loans[i]
    if (y + 14 > PAGE_H - MARGIN - 28) {
      addPageFooters(doc, data); doc.addPage(); y = MARGIN; drawHeader()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    }
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setTextColor(...C_INK_950)
    doc.text(String(i + 1), cN, y + 10)
    const nameLines = doc.splitTextToSize(l.name || '—', cType - cName - 6)
    doc.text(nameLines.slice(0, 1), cName, y + 10)
    doc.setTextColor(...C_INK_700)
    doc.text(l.typeLabel, cType, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(l.balance), cBal, y + 10, { align: 'right' })
    doc.setTextColor(...C_TAX_DK)
    doc.text(`${formatNumber(l.annualRatePct)}%`, cRate, y + 10, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(l.emi), cEmi, y + 10, { align: 'right' })
    doc.setTextColor(...C_INK_700)
    doc.text(formatNumber(l.monthlyInterest), cInt, y + 10, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.text(l.monthsLeft != null ? String(l.monthsLeft) : '∞', cLeft, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  // Totals
  y = ensureSpace(doc, y, 20)
  doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TOTALS', cName, y + 12)
  doc.text(formatNumber(totals.balance),         cBal,  y + 12, { align: 'right' })
  doc.text(`${formatNumber(totals.weightedRate)}%*`, cRate, y + 12, { align: 'right' })
  doc.text(formatNumber(totals.emi),             cEmi,  y + 12, { align: 'right' })
  doc.text(formatNumber(totals.monthlyInterest), cInt,  y + 12, { align: 'right' })
  y += 18

  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('* weighted average annual rate, weighted by balance', MARGIN, y); y += 12
  y += 6

  /* TYPE SUMMARY */
  if (data.includeTypeSummary && typeSummary.length > 1) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('BY LOAN TYPE', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + tW * 0.40
    const c3 = tX + tW * 0.58
    const c4 = tX + tW * 0.78
    const c5 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('TYPE',      c1, y + 11)
    doc.text('COUNT',     c2, y + 11, { align: 'right' })
    doc.text('BALANCE',   c3, y + 11, { align: 'right' })
    doc.text('EMI / MO',  c4, y + 11, { align: 'right' })
    doc.text('INT / MO',  c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const t of typeSummary) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(t.label, c1, y + 10)
      doc.text(String(t.count),                c2, y + 10, { align: 'right' })
      doc.text(formatNumber(t.balance),        c3, y + 10, { align: 'right' })
      doc.text(formatNumber(t.emi),            c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(t.monthlyInterest), c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* MONTHLY PROJECTION */
  if (projection.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text(`NEXT ${projection.length} MONTHS — COMBINED OUTFLOW`, MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + 50
    const c3 = tX + tW * 0.36
    const c4 = tX + tW * 0.56
    const c5 = tX + tW * 0.76
    const c6 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('#',          c1, y + 11)
    doc.text('MONTH',      c2, y + 11)
    doc.text('PAYMENT',    c3, y + 11, { align: 'right' })
    doc.text('INTEREST',   c4, y + 11, { align: 'right' })
    doc.text('PRINCIPAL',  c5, y + 11, { align: 'right' })
    doc.text('BALANCE',    c6, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const r of projection) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(String(r.n), c1, y + 10)
      doc.text(formatDate(r.date) || '—', c2, y + 10)
      doc.text(formatNumber(r.emi), c3, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_700)
      doc.text(formatNumber(r.interest),  c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.principal), c5, y + 10, { align: 'right' })
      doc.text(formatNumber(r.closingBalance), c6, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* NOTES */
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

  addPageFooters(doc, data)

  const fileName = `monthly-loan-payment-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 20) { doc.addPage(); return MARGIN }
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
    const left = `Monthly loan payment${data.borrowerName ? ` · ${data.borrowerName}` : ''}${data.reference ? ` · ${data.reference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
