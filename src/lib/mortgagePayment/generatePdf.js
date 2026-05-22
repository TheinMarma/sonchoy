import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findLoanProgram, buildSchedule, buildYearlySummary, computeAffordability,
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

export function generateMortgagePdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const program = findLoanProgram(data.programId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)
  const aff = computeAffordability({
    monthlyPiti: schedule.monthlyPiti,
    grossMonthlyIncome: data.grossMonthlyIncome,
  })

  let y = MARGIN

  doc.setFillColor(...C_TAX); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('MORTGAGE PAYMENT SCHEDULE', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.scheduleTitle || 'Mortgage Payment Schedule', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.borrowerName)  meta.push(`Borrower: ${data.borrowerName}`)
  if (data.propertyAddress) meta.push(`Property: ${data.propertyAddress}`)
  meta.push(`Program: ${program.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* PITI CARD */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['MONTHLY PITI',  `${cur.code} ${formatNumber(schedule.monthlyPiti)}`],
    ['P&I',           `${cur.code} ${formatNumber(schedule.pi)}`],
    ['ESCROW / MO',   `${cur.code} ${formatNumber(schedule.monthlyTax + schedule.monthlyInsurance + schedule.monthlyPmi + schedule.hoaMonthly)}`],
    ['LOAN AMOUNT',   `${cur.code} ${formatNumber(schedule.principal)}`],
  ]
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

  /* LOAN DETAILS */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('LOAN DETAILS', MARGIN, y); y += 12

  const detailRows = [
    ['Home price',           `${cur.code} ${formatNumber(schedule.homePrice)}`],
    ['Down payment',         `${cur.code} ${formatNumber(schedule.downPayment)} (${formatNumber(schedule.downPaymentPct)}%)`],
    ['Loan principal',       `${cur.code} ${formatNumber(schedule.principal)}`],
    ['Interest rate',        `${formatNumber(Number(data.annualRatePct) || 0)}% APR`],
    ['Loan term',            `${schedule.termYears} years (${schedule.termMonths} months)`],
    ['Start date',           formatDate(data.startDate) || '—'],
    ['Final payment',        formatDate(schedule.finalDate) || '—'],
    ['Extra principal / mo', `${cur.code} ${formatNumber(Number(data.extraPrincipal) || 0)}`],
  ]

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
  y = Math.max(y1, y2) + 12

  /* PITI BREAKDOWN */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('MONTHLY PITI BREAKDOWN', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cLabel = tX + 12
  const cAmt   = tX + tW - 12

  const pitiBreakdown = [
    ['Principal & interest', schedule.pi, false],
    ['Property tax (1/12 of annual)', schedule.monthlyTax, false],
    ['Homeowner\'s insurance (1/12)',   schedule.monthlyInsurance, false],
  ]
  if (schedule.monthlyPmi > 0) pitiBreakdown.push(['Mortgage insurance (PMI)', schedule.monthlyPmi, false])
  if (schedule.hoaMonthly > 0) pitiBreakdown.push(['HOA fee', schedule.hoaMonthly, false])
  pitiBreakdown.push(['TOTAL MONTHLY PITI', schedule.monthlyPiti, true])

  for (const [label, value, isTotal] of pitiBreakdown) {
    y = ensureSpace(doc, y, 14)
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal'); doc.setFontSize(isTotal ? 10 : BODY)
    doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_500))
    doc.text(label, cLabel, y + 10)
    doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_950))
    doc.text(`${cur.code} ${formatNumber(value)}`, cAmt, y + 10, { align: 'right' })
    y += 14
    if (isTotal) {
      doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(0.8)
      doc.line(tX, y - 2, tX + tW, y - 2)
    } else {
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
      doc.line(tX, y, tX + tW, y)
    }
  }
  y += 12

  /* AFFORDABILITY */
  if (data.includeAffordability && Number(data.grossMonthlyIncome) > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('AFFORDABILITY CHECK', MARGIN, y); y += 12

    doc.setDrawColor(...C_TAX); doc.setLineWidth(0.6)
    doc.setFillColor(244, 252, 220)
    doc.roundedRect(MARGIN, y, tW, 56, 4, 4, 'FD')

    const cL = MARGIN + 14
    const cR = PAGE_W - MARGIN - 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    doc.text('Gross monthly income',           cL, y + 18)
    doc.text('Monthly PITI',                    cL, y + 32)
    doc.text(`Front-end DTI ratio (${aff.status})`, cL, y + 46)

    doc.setTextColor(...C_INK_950)
    doc.text(`${cur.code} ${formatNumber(Number(data.grossMonthlyIncome) || 0)}`, cR, y + 18, { align: 'right' })
    doc.text(`${cur.code} ${formatNumber(schedule.monthlyPiti)}`, cR, y + 32, { align: 'right' })
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_TAX_DK)
    doc.text(`${formatNumber(aff.ratio)}%`, cR, y + 46, { align: 'right' })
    y += 56 + 10
  }

  /* TOTALS CARD */
  y = ensureSpace(doc, y, 60)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TOTAL COST OVER LOAN LIFE', MARGIN, y); y += 12

  const costRows = [
    ['Total principal paid',     schedule.principal],
    ['Total interest paid',      schedule.totalInterest],
    ['Total property tax',       schedule.totalPropertyTax],
    ['Total insurance',          schedule.totalInsurance],
  ]
  if (schedule.totalPmi > 0) costRows.push(['Total PMI', schedule.totalPmi])
  if (schedule.totalHoa > 0) costRows.push(['Total HOA fees', schedule.totalHoa])
  costRows.push(['TOTAL OF ALL PAYMENTS', schedule.totalPaid])

  for (const [label, value] of costRows) {
    const isTotal = label.startsWith('TOTAL OF')
    y = ensureSpace(doc, y, 14)
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal'); doc.setFontSize(isTotal ? 10 : BODY)
    doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_500))
    doc.text(label, cLabel, y + 10)
    doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_950))
    doc.text(`${cur.code} ${formatNumber(value)}`, cAmt, y + 10, { align: 'right' })
    y += 14
    if (isTotal) {
      doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(0.8)
      doc.line(tX, y - 2, tX + tW, y - 2)
    } else {
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
      doc.line(tX, y, tX + tW, y)
    }
  }
  y += 12

  /* YEARLY SUMMARY */
  if (data.includeYearlySummary && yearly.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEARLY SUMMARY', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + tW * 0.22
    const c3 = tX + tW * 0.40
    const c4 = tX + tW * 0.58
    const c5 = tX + tW * 0.76
    const c6 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEAR',      c1, y + 11)
    doc.text('PRINCIPAL', c2, y + 11, { align: 'right' })
    doc.text('INTEREST',  c3, y + 11, { align: 'right' })
    doc.text('TAX+INS',   c4, y + 11, { align: 'right' })
    doc.text('TOTAL',     c5, y + 11, { align: 'right' })
    doc.text('BALANCE',   c6, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const r of yearly) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(String(r.year), c1, y + 10)
      doc.text(formatNumber(r.principal),         c2, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(r.interest),          c3, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_700)
      doc.text(formatNumber(r.tax + r.insurance + r.pmi + r.hoa), c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.payment),           c5, y + 10, { align: 'right' })
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
    doc.text('MONTHLY PAYMENT SCHEDULE', MARGIN, y); y += 12

    const cN     = tX + 4
    const cDate  = tX + 22
    const cPmt   = tX + tW * 0.28
    const cPrin  = tX + tW * 0.43
    const cInt   = tX + tW * 0.58
    const cEsc   = tX + tW * 0.73
    const cBal   = tX + tW - 4

    const drawHeader = () => {
      doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
      doc.setTextColor(...C_TAX_DK)
      doc.text('#',         cN,    y + 11)
      doc.text('DATE',      cDate, y + 11)
      doc.text('PAYMENT',   cPmt,  y + 11, { align: 'right' })
      doc.text('PRINCIPAL', cPrin, y + 11, { align: 'right' })
      doc.text('INTEREST',  cInt,  y + 11, { align: 'right' })
      doc.text('ESCROW',    cEsc,  y + 11, { align: 'right' })
      doc.text('BALANCE',   cBal,  y + 11, { align: 'right' })
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
      doc.text(formatNumber(r.payment),    cPmt,  y + 10, { align: 'right' })
      doc.text(formatNumber(r.principal),  cPrin, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(r.interest),   cInt,  y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_700)
      doc.text(formatNumber(r.tax + r.insurance + r.pmi + r.hoa), cEsc, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.closing),    cBal,  y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }

    if (schedule.rows.length > 60) {
      y = ensureSpace(doc, y, 16)
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5)
      doc.setTextColor(...C_INK_500)
      doc.text(`+ ${schedule.rows.length - 60} more months (full schedule in the XLSX export)`, MARGIN, y); y += 12
    }
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

  const fileName = `mortgage-payment-${(data.reference || program.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Mortgage schedule${data.borrowerName ? ` · ${data.borrowerName}` : ''}${data.reference ? ` · ${data.reference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
