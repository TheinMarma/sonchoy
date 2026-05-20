import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findInterestMethod, findCompoundFrequency, findSheetPurpose,
  buildSchedule, buildYearlySummary,
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

export function generateInterestCalcPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const method = findInterestMethod(data.methodId)
  const frequency = findCompoundFrequency(data.frequencyId)
  const purpose = findSheetPurpose(data.purposeId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)

  let y = MARGIN

  doc.setFillColor(...C_TAX); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('INTEREST CALCULATION SHEET', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.sheetTitle || 'Interest Calculation Sheet', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.partyName) meta.push(`For: ${data.partyName}`)
  meta.push(`Method: ${method.label}`)
  if (method.id !== 'simple') meta.push(`Compounding: ${frequency.label.toLowerCase()}`)
  meta.push(`Purpose: ${purpose.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 12

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* SUMMARY CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount

  const cards = [
    ['PRINCIPAL',       `${cur.code} ${formatNumber(Number(data.principal) || 0)}`],
    ['RATE',            `${formatNumber(Number(data.annualRatePct) || 0)}% p.a.`],
    ['TOTAL INTEREST',  `${cur.code} ${formatNumber(schedule.totalInterest)}`],
    [method.id === 'reducing' ? 'FINAL BALANCE' : 'MATURITY VALUE',
      `${cur.code} ${formatNumber(schedule.finalBalance + (method.id === 'reducing' ? 0 : 0))}`],
  ]
  if (method.id === 'reducing' && schedule.emi > 0) {
    cards[3] = [`EMI / ${frequency.label.toUpperCase()}`, `${cur.code} ${formatNumber(schedule.emi)}`]
  } else if (method.id !== 'reducing') {
    cards[3] = ['MATURITY VALUE', `${cur.code} ${formatNumber(schedule.finalBalance)}`]
  }

  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 50, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_TAX_DK); doc.text(cards[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5)
    doc.setTextColor(...C_INK_950); doc.text(cards[i][1], x + 8, y + 34)
  }
  y += 50 + 14

  /* INPUT SUMMARY */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('INPUTS', MARGIN, y); y += 12

  const inputRows = [
    ['Principal',     `${cur.code} ${formatNumber(Number(data.principal) || 0)}`],
    ['Annual rate',   `${formatNumber(Number(data.annualRatePct) || 0)}%`],
    ['Tenure',        `${formatNumber(Number(data.tenureValue) || 0)} ${data.tenureUnitId}`],
    ['Method',        method.label],
    ['Compounding',   method.id === 'simple' ? '— (simple interest)' : frequency.label],
    ['Start date',    formatDate(data.startDate) || '—'],
    ['Periods',       String(schedule.periods)],
    ['Purpose',       purpose.label],
  ]
  if (method.id === 'reducing' && schedule.emi > 0) {
    inputRows.push(['EMI',  `${cur.code} ${formatNumber(schedule.emi)} per ${frequency.label.toLowerCase()}`])
  }

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
  y = Math.max(y1, y2) + 10

  /* YEARLY SUMMARY */
  if (data.includeYearlySummary && yearly.length > 0) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEARLY SUMMARY', MARGIN, y); y += 12

    const yX = MARGIN, yW = PAGE_W - MARGIN * 2
    const cY = yX + 10
    const cI = yX + yW * 0.50
    const cB = yX + yW - 10

    doc.setFillColor(...C_TAX); doc.rect(yX, y, yW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEAR',     cY, y + 11)
    doc.text('INTEREST', cI, y + 11, { align: 'right' })
    doc.text('YEAR-END BALANCE', cB, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_950)
    for (const r of yearly) {
      y = ensureSpace(doc, y, 14)
      doc.text(String(r.year),       cY, y + 11)
      doc.text(formatNumber(r.interest), cI, y + 11, { align: 'right' })
      doc.text(formatNumber(r.closing),  cB, y + 11, { align: 'right' })
      y += 13
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(yX, y, yX + yW, y)
    }
    y += 8
  }

  /* PERIOD-BY-PERIOD TABLE */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('PERIOD-BY-PERIOD SCHEDULE', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const isReducing = method.id === 'reducing'

  let cols
  if (isReducing) {
    cols = {
      n:        tX + 6,
      date:     tX + 28,
      opening:  tX + tW * 0.32,
      payment:  tX + tW * 0.50,
      interest: tX + tW * 0.66,
      principal: tX + tW * 0.82,
      closing:  tX + tW - 6,
    }
  } else {
    cols = {
      n:        tX + 6,
      date:     tX + 28,
      opening:  tX + tW * 0.42,
      interest: tX + tW * 0.62,
      cumulative: tX + tW * 0.80,
      closing:  tX + tW - 6,
    }
  }

  const drawHeader = () => {
    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('#',         cols.n,    y + 11)
    doc.text('DATE',      cols.date, y + 11)
    doc.text('OPENING',   cols.opening, y + 11, { align: 'right' })
    if (isReducing) {
      doc.text('PAYMENT',   cols.payment,   y + 11, { align: 'right' })
      doc.text('INTEREST',  cols.interest,  y + 11, { align: 'right' })
      doc.text('PRINCIPAL', cols.principal, y + 11, { align: 'right' })
    } else {
      doc.text('INTEREST',   cols.interest,   y + 11, { align: 'right' })
      doc.text('CUMULATIVE', cols.cumulative, y + 11, { align: 'right' })
    }
    doc.text('CLOSING', cols.closing, y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < schedule.rows.length; i++) {
    if (y + 14 > PAGE_H - MARGIN - 28) {
      addPageFooters(doc, data, purpose); doc.addPage(); y = MARGIN; drawHeader()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    }
    const r = schedule.rows[i]
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setTextColor(...C_INK_950)
    doc.text(String(r.n),                   cols.n,    y + 10)
    doc.text(formatDate(r.date) || '—',     cols.date, y + 10)
    doc.text(formatNumber(r.opening),       cols.opening, y + 10, { align: 'right' })
    if (isReducing) {
      doc.text(formatNumber(r.payment),     cols.payment,   y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(r.interestAccrued), cols.interest, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.principalPaid),   cols.principal, y + 10, { align: 'right' })
    } else {
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(r.interestAccrued), cols.interest,  y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_700)
      doc.text(formatNumber(r.cumulativeInterest), cols.cumulative, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
    }
    doc.text(formatNumber(r.closing), cols.closing, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  // Totals
  y = ensureSpace(doc, y, 20)
  doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TOTALS', cols.date, y + 12)
  doc.text(`${cur.code} ${formatNumber(schedule.totalInterest)}`, cols.interest, y + 12, { align: 'right' })
  doc.text(`${cur.code} ${formatNumber(schedule.finalBalance)}`,  cols.closing,  y + 12, { align: 'right' })
  y += 18

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

  addPageFooters(doc, data, purpose)

  const fileName = `interest-calc-${(data.reference || method.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `${purpose.label} · interest calc${data.reference ? ` · ${data.reference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
