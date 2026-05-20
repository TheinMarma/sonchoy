import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findFrequency, findLoanType, findRateStructure,
  buildSchedule, buildYearlySummary, buildSegmentSummary,
} from './compute'

const MARGIN = 38
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_TAX     = [132, 204, 22]
const C_TAX_DK  = [77, 124, 15]

const BODY = 9.5

export function generateLoanAmortizationPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const frequency = findFrequency(data.frequencyId)
  const loanType = findLoanType(data.loanTypeId)
  const structure = findRateStructure(data.rateStructureId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)
  const segs = buildSegmentSummary(schedule.rows, schedule.resolvedSegments)

  let y = MARGIN

  /* ============== HEADER ============== */

  doc.setFillColor(...C_TAX)
  doc.rect(0, 0, PAGE_W, 4, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('LOAN AMORTIZATION SCHEDULE', MARGIN, y + 8)
  if (data.scheduleReference) {
    doc.text(data.scheduleReference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  }
  y += 22

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.scheduleTitle || `${loanType.label} — Amortization`, MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.borrowerName) meta.push(`Borrower: ${data.borrowerName}`)
  if (data.lenderName)   meta.push(`Lender: ${data.lenderName}`)
  meta.push(`Structure: ${structure.label.split('(')[0].trim()}`)
  doc.text(meta.join('  ·  '), MARGIN, y)
  y += 14

  doc.setDrawColor(...C_TAX)
  doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y)
  y += 16

  /* ============== SUMMARY CARDS ============== */

  const cardCount = 4
  const gap = 8
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['LOAN AMOUNT',    `${cur.code} ${formatNumber(Number(data.principal) || 0)}`],
    ['STARTING RATE',  `${formatNumber(Number(data.annualRatePct) || 0)}% p.a.`],
    [`INITIAL EMI (${frequency.label.toUpperCase()})`, `${cur.code} ${formatNumber(schedule.initialEmi)}`],
    ['TOTAL PAYABLE',  `${cur.code} ${formatNumber(schedule.totalPaid)}`],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 56, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK); doc.text(cards[i][0], x + 10, y + 16)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5)
    doc.setTextColor(...C_INK_950); doc.text(cards[i][1], x + 10, y + 40)
  }
  y += 56 + 14

  /* ============== LOAN DETAILS ============== */

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('LOAN DETAILS', MARGIN, y); y += 12

  const detailRows = [
    ['Loan type',           loanType.label],
    ['Rate structure',      structure.label],
    ['Principal',           `${cur.code} ${formatNumber(Number(data.principal) || 0)}`],
    ['Starting rate',       `${formatNumber(Number(data.annualRatePct) || 0)}%`],
    ['Frequency',           frequency.label],
    ['Total periods',       String(schedule.periodsActual)],
    ['Start date',          formatDate(data.startDate) || '—'],
    ['First payment',       formatDate(data.firstPaymentDate || data.startDate) || '—'],
    ['Final payment',       formatDate(schedule.finalPaymentDate) || '—'],
    ['Total interest',      `${cur.code} ${formatNumber(schedule.totalInterest)}`],
  ]
  if (Number(data.extraPayment) > 0) {
    detailRows.push(['Extra / period', `${cur.code} ${formatNumber(Number(data.extraPayment) || 0)}`])
  }
  const dCol1 = MARGIN
  const dCol2 = MARGIN + (PAGE_W - MARGIN * 2) / 2 + 10
  const dColW = (PAGE_W - MARGIN * 2) / 2 - 10
  const half = Math.ceil(detailRows.length / 2)
  let y1 = y, y2 = y
  for (let i = 0; i < detailRows.length; i++) {
    const [k, v] = detailRows[i]
    const inLeft = i < half
    const x = inLeft ? dCol1 : dCol2
    const ry = inLeft ? y1 : y2
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_500); doc.text(k, x, ry)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_INK_950)
    doc.text(v, x + dColW, ry, { align: 'right' })
    if (inLeft) y1 += 13; else y2 += 13
  }
  y = Math.max(y1, y2) + 10

  /* ============== RATE SEGMENTS (only if more than one) ============== */

  if (segs.length > 1) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('RATE SEGMENTS', MARGIN, y); y += 12

    const sX = MARGIN
    const sW = PAGE_W - MARGIN * 2
    const c1 = sX + 10
    const c2 = sX + sW * 0.22
    const c3 = sX + sW * 0.40
    const c4 = sX + sW * 0.60
    const c5 = sX + sW * 0.78
    const c6 = sX + sW - 10

    doc.setFillColor(...C_TAX)
    doc.rect(sX, y, sW, 18, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_TAX_DK)
    doc.text('SEGMENT',     c1, y + 12)
    doc.text('RATE',        c2, y + 12, { align: 'right' })
    doc.text('EMI AT START', c3, y + 12, { align: 'right' })
    doc.text('PRINCIPAL',   c4, y + 12, { align: 'right' })
    doc.text('INTEREST',    c5, y + 12, { align: 'right' })
    doc.text('END BAL.',    c6, y + 12, { align: 'right' })
    y += 18

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_950)
    for (const s of segs) {
      y = ensureSpace(doc, y, 16)
      doc.text(s.label,                       c1, y + 11)
      doc.text(`${formatNumber(s.ratePct)}%`, c2, y + 11, { align: 'right' })
      doc.text(formatNumber(s.emiAtStart),    c3, y + 11, { align: 'right' })
      doc.text(formatNumber(s.principalPaid), c4, y + 11, { align: 'right' })
      doc.text(formatNumber(s.interestPaid),  c5, y + 11, { align: 'right' })
      doc.text(formatNumber(s.closing),       c6, y + 11, { align: 'right' })
      y += 13
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(sX, y, sX + sW, y)
    }
    y += 8
  }

  /* ============== YEARLY SUMMARY ============== */

  if (yearly.length > 0 && y < PAGE_H - 240) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEARLY SUMMARY', MARGIN, y); y += 12

    const yX = MARGIN
    const yW = PAGE_W - MARGIN * 2
    const cYear = yX + 10
    const cPrin = yX + yW * 0.30
    const cInt  = yX + yW * 0.52
    const cTot  = yX + yW * 0.74
    const cBal  = yX + yW - 10

    doc.setFillColor(...C_TAX); doc.rect(yX, y, yW, 18, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEAR',          cYear, y + 12)
    doc.text('PRINCIPAL',     cPrin, y + 12, { align: 'right' })
    doc.text('INTEREST',      cInt,  y + 12, { align: 'right' })
    doc.text('TOTAL PAID',    cTot,  y + 12, { align: 'right' })
    doc.text('YEAR-END BAL.', cBal,  y + 12, { align: 'right' })
    y += 18

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_950)
    for (const r of yearly) {
      y = ensureSpace(doc, y, 16)
      doc.text(String(r.year),            cYear, y + 11)
      doc.text(formatNumber(r.principal), cPrin, y + 11, { align: 'right' })
      doc.text(formatNumber(r.interest),  cInt,  y + 11, { align: 'right' })
      doc.text(formatNumber(r.emi),       cTot,  y + 11, { align: 'right' })
      doc.text(formatNumber(r.closing),   cBal,  y + 11, { align: 'right' })
      y += 13
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(yX, y, yX + yW, y)
    }
    y += 8
  }

  /* ============== AMORTIZATION TABLE ============== */

  if (schedule.rows.length > 0) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('AMORTIZATION SCHEDULE', MARGIN, y); y += 12

    const tX = MARGIN
    const tW = PAGE_W - MARGIN * 2
    const c1 = tX + 8
    const c2 = tX + 32
    const c3 = tX + tW * 0.27
    const c4 = tX + tW * 0.42
    const c5 = tX + tW * 0.55
    const c6 = tX + tW * 0.70
    const c7 = tX + tW * 0.85
    const c8 = tX + tW - 8

    const drawHeader = () => {
      doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 18, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
      doc.setTextColor(...C_TAX_DK)
      doc.text('#',            c1, y + 12)
      doc.text('DUE',          c2, y + 12)
      doc.text('OPENING',      c3, y + 12, { align: 'right' })
      doc.text('RATE',         c4, y + 12, { align: 'right' })
      doc.text('EMI',          c5, y + 12, { align: 'right' })
      doc.text('INTEREST',     c6, y + 12, { align: 'right' })
      doc.text('PRINCIPAL',    c7, y + 12, { align: 'right' })
      doc.text('CLOSING',      c8, y + 12, { align: 'right' })
      y += 18
    }
    drawHeader()

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_950)
    let prevRate = -1
    for (let i = 0; i < schedule.rows.length; i++) {
      if (y + 14 > PAGE_H - MARGIN - 28) {
        addPageFooters(doc, data, loanType)
        doc.addPage(); y = MARGIN; drawHeader()
        doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY); doc.setTextColor(...C_INK_950)
      }
      const r = schedule.rows[i]
      const isRateBoundary = r.ratePct !== prevRate
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      if (isRateBoundary && i > 0) {
        // Visual marker for rate change
        doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
        doc.line(tX, y, tX + tW, y)
      }
      doc.setTextColor(...C_INK_950)
      doc.text(String(r.n),                  c1, y + 10)
      doc.text(formatDate(r.dueDate) || '—', c2, y + 10)
      doc.text(formatNumber(r.opening),      c3, y + 10, { align: 'right' })
      doc.setTextColor(...(isRateBoundary && i > 0 ? C_TAX_DK : C_INK_700))
      doc.text(`${formatNumber(r.ratePct)}%`, c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.emi),          c5, y + 10, { align: 'right' })
      doc.text(formatNumber(r.interest),     c6, y + 10, { align: 'right' })
      doc.text(formatNumber(r.principal),    c7, y + 10, { align: 'right' })
      doc.text(formatNumber(r.closing),      c8, y + 10, { align: 'right' })
      y += 14
      prevRate = r.ratePct
    }

    // Totals
    y = ensureSpace(doc, y, 20)
    doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
    doc.line(tX, y, tX + tW, y); y += 2
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_TAX_DK)
    doc.text('TOTALS', c2, y + 12)
    doc.text(`${cur.code} ${formatNumber(schedule.totalPaid)}`,     c5, y + 12, { align: 'right' })
    doc.text(`${cur.code} ${formatNumber(schedule.totalInterest)}`, c6, y + 12, { align: 'right' })
    doc.text(`${cur.code} ${formatNumber(Number(data.principal) || 0)}`, c7, y + 12, { align: 'right' })
    y += 18
  }

  /* ============== NOTES ============== */

  if (data.notes) {
    y += 4
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
  }

  addPageFooters(doc, data, loanType)

  const fileName = `loan-amortization-${(data.scheduleReference || loanType.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 20) { doc.addPage(); return MARGIN }
  return y
}

function addPageFooters(doc, data, loanType) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `${loanType.label} amortization${data.scheduleReference ? ` · ${data.scheduleReference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
