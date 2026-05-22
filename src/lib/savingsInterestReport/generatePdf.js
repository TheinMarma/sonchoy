import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findCompoundFrequency, findContribFrequency, findAccountType, findFlowType,
  buildSchedule, buildYearlySummary, computeGoalProgress,
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
const C_SUCCESS = [22, 163, 74]
const C_DANGER  = [220, 38, 38]

const BODY = 9

export function generateSavingsInterestPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const accountType = findAccountType(data.accountTypeId)
  const compoundF = findCompoundFrequency(data.compoundFrequencyId)
  const contribF = findContribFrequency(data.contribFrequencyId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)
  const goal = computeGoalProgress({ targetAmount: data.targetAmount, schedule })

  let y = MARGIN

  doc.setFillColor(...C_TAX); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('SAVINGS INTEREST REPORT', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Savings Interest Report', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.accountHolder) meta.push(`Holder: ${data.accountHolder}`)
  if (data.bankName)      meta.push(`Bank: ${data.bankName}`)
  meta.push(`Type: ${accountType.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* SUMMARY CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['OPENING',        `${cur.code} ${formatNumber(schedule.openingBalance)}`,    C_INK_950],
    ['TOTAL IN',       `${cur.code} ${formatNumber(schedule.totalContributions + schedule.totalDeposits)}`, C_INK_950],
    ['INTEREST EARNED', `${cur.code} ${formatNumber(schedule.totalInterestNet)}`, C_SUCCESS],
    ['FINAL BALANCE',  `${cur.code} ${formatNumber(schedule.finalBalance)}`,      C_TAX_DK],
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
  doc.text('ACCOUNT PARAMETERS', MARGIN, y); y += 12

  const inputRows = [
    ['Opening balance',     `${cur.code} ${formatNumber(schedule.openingBalance)}`],
    ['Annual rate',         `${formatNumber(Number(data.annualRatePct) || 0)}% (${compoundF.label.toLowerCase()})`],
    ['Tenure',              `${schedule.months} months (~${(schedule.months / 12).toFixed(1)} yr)`],
    ['Recurring contrib.',  contribF.id === 'none' ? 'None' : `${cur.code} ${formatNumber(Number(data.contribAmount) || 0)} / ${contribF.label.toLowerCase()}`],
    ['Tax on interest',     `${formatNumber(Number(data.taxOnInterestPct) || 0)}%`],
    ['Start date',          formatDate(data.startDate) || '—'],
    ['Final date',          formatDate(schedule.finalDate) || '—'],
    ['Cash-flow events',    `${(data.cashFlows || []).length}`],
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

  /* GOAL TRACKER */
  if (data.includeGoalBlock && Number(data.targetAmount) > 0) {
    y = ensureSpace(doc, y, 70)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('GOAL TRACKER', MARGIN, y); y += 12

    const tW = PAGE_W - MARGIN * 2
    doc.setDrawColor(...C_TAX); doc.setLineWidth(0.6)
    doc.setFillColor(244, 252, 220)
    doc.roundedRect(MARGIN, y, tW, 60, 4, 4, 'FD')

    const cL = MARGIN + 14
    const cR = PAGE_W - MARGIN - 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    doc.text('Target',                             cL, y + 18)
    doc.text(goal.hit ? 'Target hit on' : 'Final progress', cL, y + 34)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_TAX_DK)
    doc.text(goal.hit ? 'STATUS: ACHIEVED' : `STATUS: ${formatNumber(goal.finalProgressPct)}%`, cL, y + 48)

    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_INK_950)
    doc.text(`${cur.code} ${formatNumber(Number(data.targetAmount) || 0)}`, cR, y + 18, { align: 'right' })
    if (goal.hit) {
      doc.setTextColor(...C_SUCCESS)
      doc.text(`${formatDate(goal.monthsToHitDate)} (month ${goal.monthsToHit})`, cR, y + 34, { align: 'right' })
    } else {
      doc.setTextColor(...C_DANGER)
      doc.text(`Shortfall ${cur.code} ${formatNumber(goal.shortfall)}`, cR, y + 34, { align: 'right' })
    }
    y += 60 + 10
  }

  /* CASH-FLOW EVENTS */
  if (data.includeCashFlowList && (data.cashFlows || []).length > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('PLANNED CASH-FLOW EVENTS', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 10
    const c2 = tX + 90
    const c3 = tX + tW * 0.50
    const c4 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('DATE',   c1, y + 11)
    doc.text('TYPE',   c2, y + 11)
    doc.text('LABEL',  c3, y + 11)
    doc.text('AMOUNT', c4, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    const sorted = [...data.cashFlows].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    for (let i = 0; i < sorted.length; i++) {
      const cf = sorted[i]
      const ft = findFlowType(cf.type)
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(formatDate(cf.date) || '—', c1, y + 10)
      doc.setTextColor(...(ft.kind === 'in' ? C_SUCCESS : C_DANGER))
      doc.text(ft.label.split('/')[0].trim(), c2, y + 10)
      doc.setTextColor(...C_INK_700)
      doc.text(String(cf.label || ''), c3, y + 10)
      doc.setTextColor(...(ft.kind === 'in' ? C_SUCCESS : C_DANGER))
      doc.text(`${ft.kind === 'in' ? '+' : '-'}${formatNumber(Number(cf.amount) || 0)}`, c4, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* YEARLY SUMMARY */
  if (data.includeYearlySummary && yearly.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEARLY SUMMARY', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 10
    const c2 = tX + tW * 0.22
    const c3 = tX + tW * 0.42
    const c4 = tX + tW * 0.62
    const c5 = tX + tW * 0.80
    const c6 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEAR',         c1, y + 11)
    doc.text('CONTRIB.',     c2, y + 11, { align: 'right' })
    doc.text('LUMP IN',      c3, y + 11, { align: 'right' })
    doc.text('WITHDRAW',     c4, y + 11, { align: 'right' })
    doc.text('INTEREST',     c5, y + 11, { align: 'right' })
    doc.text('YEAR-END',     c6, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const r of yearly) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(String(r.year), c1, y + 10)
      doc.text(formatNumber(r.contribution),      c2, y + 10, { align: 'right' })
      doc.setTextColor(...C_SUCCESS)
      doc.text(r.depositLumpSum > 0 ? `+${formatNumber(r.depositLumpSum)}` : '—', c3, y + 10, { align: 'right' })
      doc.setTextColor(...C_DANGER)
      doc.text(r.withdrawalLumpSum > 0 ? `-${formatNumber(r.withdrawalLumpSum)}` : '—', c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(r.interestNet),       c5, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.closing),           c6, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* MONTHLY SCHEDULE */
  if (schedule.rows.length > 0) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('MONTHLY SCHEDULE', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const cN     = tX + 4
    const cDate  = tX + 22
    const cOpen  = tX + tW * 0.30
    const cAdd   = tX + tW * 0.46
    const cInt   = tX + tW * 0.63
    const cWd    = tX + tW * 0.80
    const cClose = tX + tW - 4

    const drawHeader = () => {
      doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
      doc.setTextColor(...C_TAX_DK)
      doc.text('#',         cN,    y + 11)
      doc.text('DATE',      cDate, y + 11)
      doc.text('OPENING',   cOpen, y + 11, { align: 'right' })
      doc.text('ADDED',     cAdd,  y + 11, { align: 'right' })
      doc.text('INTEREST',  cInt,  y + 11, { align: 'right' })
      doc.text('WITHDRAW',  cWd,   y + 11, { align: 'right' })
      doc.text('CLOSING',   cClose, y + 11, { align: 'right' })
      y += 16
    }
    drawHeader()

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    const showRows = schedule.rows.length > 60 ? schedule.rows.slice(0, 60) : schedule.rows
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
      const added = r.contribution + r.depositLumpSum
      doc.setTextColor(...(added > 0 ? C_SUCCESS : C_INK_500))
      doc.text(added > 0 ? `+${formatNumber(added)}` : '—', cAdd, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(r.interestNet), cInt,  y + 10, { align: 'right' })
      doc.setTextColor(...(r.withdrawalLumpSum > 0 ? C_DANGER : C_INK_500))
      doc.text(r.withdrawalLumpSum > 0 ? `-${formatNumber(r.withdrawalLumpSum)}` : '—', cWd, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.closing),    cClose, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }

    if (schedule.rows.length > 60) {
      y = ensureSpace(doc, y, 16)
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5)
      doc.setTextColor(...C_INK_500)
      doc.text(`+ ${schedule.rows.length - 60} more months (full schedule in the XLSX export)`, MARGIN, y); y += 12
    }

    /* Totals */
    y = ensureSpace(doc, y, 20)
    doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
    doc.line(tX, y, tX + tW, y); y += 2
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    doc.setTextColor(...C_TAX_DK)
    doc.text('TOTALS', cDate, y + 12)
    doc.text(formatNumber(schedule.openingBalance), cOpen, y + 12, { align: 'right' })
    doc.text(formatNumber(schedule.totalContributions + schedule.totalDeposits), cAdd, y + 12, { align: 'right' })
    doc.text(formatNumber(schedule.totalInterestNet), cInt, y + 12, { align: 'right' })
    doc.text(formatNumber(schedule.totalWithdrawals), cWd, y + 12, { align: 'right' })
    doc.text(formatNumber(schedule.finalBalance), cClose, y + 12, { align: 'right' })
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

  const fileName = `savings-interest-${(data.reference || accountType.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Savings interest report${data.accountHolder ? ` · ${data.accountHolder}` : ''}${data.reference ? ` · ${data.reference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
