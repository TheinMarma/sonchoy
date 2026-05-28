import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findStrategy, computeSchedule, buildYearlySummary,
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
const C_DANGER  = [220, 38, 38]
const C_SUCCESS = [22, 163, 74]

const BODY = 9

export function generateCreditCardSchedulePdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const result = computeSchedule(data)
  const { strategy, minimumSim, fixedSim, savings } = result

  let y = MARGIN

  doc.setFillColor(...C_TAX); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('CREDIT CARD PAYMENT SCHEDULE', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.scheduleTitle || 'Credit Card Payoff Plan', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.cardholderName) meta.push(`Cardholder: ${data.cardholderName}`)
  if (data.cardName)       meta.push(`Card: ${data.cardName}`)
  meta.push(`Strategy: ${strategy.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* SUMMARY CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount

  const primarySim = strategy.id === 'minimum' ? minimumSim : fixedSim
  const cards = [
    ['BALANCE',         `${cur.code} ${formatNumber(Number(data.balance) || 0)}`, C_INK_950],
    ['APR',             `${formatNumber(Number(data.annualRatePct) || 0)}%`,       C_INK_950],
    ['MONTHS TO PAYOFF', primarySim?.paidOff ? String(primarySim.months) : 'Never', primarySim?.paidOff ? C_INK_950 : C_DANGER],
    ['TOTAL INTEREST',   primarySim ? `${cur.code} ${formatNumber(primarySim.totalInterest)}` : '—', C_DANGER],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 50, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_TAX_DK); doc.text(cards[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5)
    doc.setTextColor(...cards[i][2]); doc.text(cards[i][1], x + 8, y + 34)
  }
  y += 50 + 14

  /* INPUTS */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('INPUTS', MARGIN, y); y += 12

  const inputRows = [
    ['Card balance',        `${cur.code} ${formatNumber(Number(data.balance) || 0)}`],
    ['APR (annual rate)',   `${formatNumber(Number(data.annualRatePct) || 0)}%`],
    ['Min payment %',       `${formatNumber(Number(data.minPercentPct) || 0)}% of balance`],
    ['Min payment floor',   `${cur.code} ${formatNumber(Number(data.minFloor) || 0)}`],
    ['Fixed payment',       `${cur.code} ${formatNumber(Number(data.fixedPayment) || 0)}`],
    ['New monthly charges', `${cur.code} ${formatNumber(Number(data.monthlyCharges) || 0)}`],
    ['Start date',          formatDate(data.startDate) || '—'],
  ]
  const dCol1 = MARGIN
  const dCol2 = MARGIN + (PAGE_W - MARGIN * 2) / 2 + 10
  const dColW = (PAGE_W - MARGIN * 2) / 2 - 10
  const half = Math.ceil(inputRows.length / 2)
  let y1 = y, y2 = y
  for (let i = 0; i < inputRows.length; i++) {
    const [k, v] = inputRows[i]
    const inLeft = i < half
    const x = inLeft ? dCol1 : dCol2
    const ry = inLeft ? y1 : y2
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_500); doc.text(k, x, ry)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_INK_950)
    doc.text(v, x + dColW, ry, { align: 'right' })
    if (inLeft) y1 += 13; else y2 += 13
  }
  y = Math.max(y1, y2) + 12

  /* COMPARISON BLOCK */
  if (strategy.id === 'compare' && fixedSim && minimumSim) {
    y = ensureSpace(doc, y, 100)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('MINIMUM vs FIXED COMPARISON', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 12
    const c2 = tX + tW * 0.45
    const c3 = tX + tW - 12

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('METRIC',           c1, y + 11)
    doc.text('MINIMUM ONLY',     c2, y + 11, { align: 'right' })
    doc.text('FIXED PAYMENT',    c3, y + 11, { align: 'right' })
    y += 16

    const rowFor = (label, min, fixed, accent) => {
      y = ensureSpace(doc, y, 14)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...C_INK_700); doc.text(label, c1, y + 10)
      doc.setTextColor(...(accent || C_INK_950))
      doc.text(min, c2, y + 10, { align: 'right' })
      doc.text(fixed, c3, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }

    rowFor('Months to clear',
      minimumSim.paidOff ? `${minimumSim.months} mo (~${(minimumSim.months / 12).toFixed(1)} yr)` : 'Never',
      fixedSim.paidOff ? `${fixedSim.months} mo (~${(fixedSim.months / 12).toFixed(1)} yr)` : 'Never')
    rowFor('Total paid',
      `${cur.code} ${formatNumber(minimumSim.totalPaid)}`,
      `${cur.code} ${formatNumber(fixedSim.totalPaid)}`)
    rowFor('Total interest',
      `${cur.code} ${formatNumber(minimumSim.totalInterest)}`,
      `${cur.code} ${formatNumber(fixedSim.totalInterest)}`,
      C_DANGER)
    rowFor('First-month payment',
      minimumSim.rows[0] ? `${cur.code} ${formatNumber(minimumSim.rows[0].payment)}` : '—',
      fixedSim.rows[0]   ? `${cur.code} ${formatNumber(fixedSim.rows[0].payment)}`   : '—')

    y += 6

    /* SAVINGS BLOCK */
    if (savings && savings.interestSaved != null) {
      doc.setDrawColor(...C_TAX); doc.setLineWidth(0.6)
      doc.setFillColor(244, 252, 220)
      doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 60, 4, 4, 'FD')

      const cL = MARGIN + 14
      const cR = PAGE_W - MARGIN - 14
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      doc.setTextColor(...C_TAX_DK)
      doc.text('PAYING ABOVE MINIMUM SAVES YOU', cL, y + 16)

      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...C_INK_700)
      doc.text('Interest saved', cL, y + 32)
      doc.text('Months saved',   cL, y + 46)

      doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
      doc.setTextColor(...C_SUCCESS)
      doc.text(`${cur.code} ${formatNumber(savings.interestSaved)}`, cR, y + 32, { align: 'right' })
      doc.text(`${savings.monthsSaved} months (~${(savings.monthsSaved / 12).toFixed(1)} yr)`, cR, y + 46, { align: 'right' })
      y += 60 + 10
    } else if (savings && savings.note) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9)
      doc.setTextColor(...C_DANGER)
      doc.text(`⚠ ${savings.note}`, MARGIN, y); y += 16
    }
  }

  /* SCHEDULE TABLE */
  const showSim = strategy.id === 'minimum' ? minimumSim
                : strategy.id === 'fixed'   ? fixedSim
                : fixedSim   // for compare, default to fixed; minimum-only often huge
  const tableLabel = strategy.id === 'minimum' ? 'MINIMUM-ONLY SCHEDULE'
                  : strategy.id === 'fixed'    ? 'FIXED-PAYMENT SCHEDULE'
                  : 'FIXED-PAYMENT SCHEDULE'

  if (showSim && showSim.rows.length > 0) {
    /* Yearly first (for long schedules) */
    if (showSim.months > 36) {
      const yearly = buildYearlySummary(showSim.rows)
      y = ensureSpace(doc, y, 80)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      doc.setTextColor(...C_TAX_DK)
      doc.text('YEARLY SUMMARY', MARGIN, y); y += 12

      const tX = MARGIN, tW = PAGE_W - MARGIN * 2
      const c1 = tX + 10
      const c2 = tX + tW * 0.30
      const c3 = tX + tW * 0.50
      const c4 = tX + tW * 0.72
      const c5 = tX + tW - 10

      doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
      doc.setTextColor(...C_TAX_DK)
      doc.text('YEAR',      c1, y + 11)
      doc.text('PAID',      c2, y + 11, { align: 'right' })
      doc.text('INTEREST',  c3, y + 11, { align: 'right' })
      doc.text('PRINCIPAL', c4, y + 11, { align: 'right' })
      doc.text('YEAR-END',  c5, y + 11, { align: 'right' })
      y += 16

      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      for (const r of yearly) {
        y = ensureSpace(doc, y, 14)
        doc.setTextColor(...C_INK_950)
        doc.text(String(r.year),        c1, y + 10)
        doc.text(formatNumber(r.payment),   c2, y + 10, { align: 'right' })
        doc.setTextColor(...C_DANGER)
        doc.text(formatNumber(r.interest),  c3, y + 10, { align: 'right' })
        doc.setTextColor(...C_INK_950)
        doc.text(formatNumber(r.principal), c4, y + 10, { align: 'right' })
        doc.setTextColor(...C_INK_700)
        doc.text(formatNumber(r.closing),   c5, y + 10, { align: 'right' })
        y += 14
        doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
      }
      y += 8
    }

    /* Period table */
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text(tableLabel, MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const cN     = tX + 4
    const cDate  = tX + 22
    const cOpen  = tX + tW * 0.30
    const cPay   = tX + tW * 0.46
    const cInt   = tX + tW * 0.62
    const cPrin  = tX + tW * 0.78
    const cClose = tX + tW - 4

    const drawHeader = () => {
      doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
      doc.setTextColor(...C_TAX_DK)
      doc.text('#',         cN,    y + 11)
      doc.text('DATE',      cDate, y + 11)
      doc.text('OPENING',   cOpen, y + 11, { align: 'right' })
      doc.text('PAYMENT',   cPay,  y + 11, { align: 'right' })
      doc.text('INTEREST',  cInt,  y + 11, { align: 'right' })
      doc.text('PRINCIPAL', cPrin, y + 11, { align: 'right' })
      doc.text('CLOSING',   cClose, y + 11, { align: 'right' })
      y += 16
    }
    drawHeader()

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    const showRows = showSim.months > 60 ? showSim.rows.slice(0, 60) : showSim.rows
    for (let i = 0; i < showRows.length; i++) {
      if (y + 14 > PAGE_H - MARGIN - 28) {
        addPageFooters(doc, data); doc.addPage(); y = MARGIN; drawHeader()
        doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      }
      const r = showRows[i]
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(String(r.n),                cN,    y + 10)
      doc.text(formatDate(r.date) || '—',  cDate, y + 10)
      doc.text(formatNumber(r.opening),    cOpen, y + 10, { align: 'right' })
      doc.text(formatNumber(r.payment),    cPay,  y + 10, { align: 'right' })
      doc.setTextColor(...C_DANGER)
      doc.text(formatNumber(r.interest),   cInt,  y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.principal),  cPrin, y + 10, { align: 'right' })
      doc.text(formatNumber(r.closing),    cClose, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }

    if (showSim.months > 60) {
      y = ensureSpace(doc, y, 16)
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5)
      doc.setTextColor(...C_INK_500)
      doc.text(`+ ${showSim.months - 60} more months (full table in the XLSX export)`, MARGIN, y); y += 12
    }

    /* Totals */
    y = ensureSpace(doc, y, 20)
    doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
    doc.line(tX, y, tX + tW, y); y += 2
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    doc.setTextColor(...C_TAX_DK)
    doc.text('TOTALS', cDate, y + 12)
    doc.text(formatNumber(showSim.totalPaid),     cPay,  y + 12, { align: 'right' })
    doc.text(formatNumber(showSim.totalInterest), cInt,  y + 12, { align: 'right' })
    doc.text(formatNumber(showSim.totalPaid - showSim.totalInterest), cPrin, y + 12, { align: 'right' })
    y += 18
  }

  /* NOTES */
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

  addPageFooters(doc, data)

  const fileName = `credit-card-payoff-${(data.reference || strategy.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Credit card payoff${data.cardName ? ` · ${data.cardName}` : ''}${data.reference ? ` · ${data.reference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
