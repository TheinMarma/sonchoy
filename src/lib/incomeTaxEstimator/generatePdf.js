import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findIncomeType, computeEstimate,
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

export function generateIncomeTaxEstimatorPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const est = computeEstimate(data)
  const regime = est.regime

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_TAX)
  doc.rect(0, 0, PAGE_W, 4, 'F')

  /* ============== HEADER ============== */

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('INCOME TAX ESTIMATE', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.estimateTitle || 'Annual Income Tax Estimate', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.taxpayerName) meta.push(`Taxpayer: ${data.taxpayerName}`)
  if (data.taxYear)      meta.push(`Tax year: ${data.taxYear}`)
  meta.push(`Regime: ${regime.label.split('—')[0].trim()}`)
  doc.text(meta.join('  ·  '), MARGIN, y)
  y += 14

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y)
  y += 16

  /* ============== SUMMARY CARDS ============== */

  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['GROSS INCOME',     `${cur.code} ${formatNumber(est.gross)}`],
    ['TAXABLE INCOME',   `${cur.code} ${formatNumber(est.taxable)}`],
    ['TOTAL TAX',        `${cur.code} ${formatNumber(est.netTax)}`],
    ['TAKE-HOME',        `${cur.code} ${formatNumber(est.takeHome)}`],
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

  /* ============== INCOME SOURCES ============== */

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('INCOME SOURCES', MARGIN, y); y += 12

  const tX = MARGIN
  const tW = PAGE_W - MARGIN * 2
  const cType   = tX + 8
  const cDesc   = tX + 110
  const cAmount = tX + tW - 8

  doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TYPE',        cType,   y + 11)
  doc.text('DESCRIPTION', cDesc,   y + 11)
  doc.text('AMOUNT',      cAmount, y + 11, { align: 'right' })
  y += 16

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  doc.setTextColor(...C_INK_950)
  for (let i = 0; i < (data.incomeSources || []).length; i++) {
    const it = data.incomeSources[i]
    const t = findIncomeType(it.typeId)
    y = ensureSpace(doc, y, 14)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setTextColor(...C_INK_950)
    doc.text(t.label, cType, y + 10)
    doc.text(it.description || '—', cDesc, y + 10)
    doc.text(formatNumber(Number(it.amount) || 0), cAmount, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
  doc.setTextColor(...C_TAX_DK)
  y = ensureSpace(doc, y, 18)
  doc.text('TOTAL GROSS INCOME', cType, y + 12)
  doc.text(`${cur.code} ${formatNumber(est.gross)}`, cAmount, y + 12, { align: 'right' })
  y += 18

  /* ============== DEDUCTIONS ============== */

  if ((data.deductions || []).length > 0) {
    y += 6
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('DEDUCTIONS & EXEMPTIONS', MARGIN, y); y += 12

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('SECTION',     cType, y + 11)
    doc.text('DESCRIPTION', cDesc, y + 11)
    doc.text('AMOUNT',      cAmount, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_950)
    for (let i = 0; i < data.deductions.length; i++) {
      const it = data.deductions[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(it.section || '—',     cType, y + 10)
      doc.text(it.description || '—', cDesc, y + 10)
      doc.text(formatNumber(Number(it.amount) || 0), cAmount, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    doc.setTextColor(...C_TAX_DK)
    y = ensureSpace(doc, y, 18)
    doc.text('TOTAL DEDUCTIONS', cType, y + 12)
    doc.text(`${cur.code} ${formatNumber(est.deductionsTotal)}`, cAmount, y + 12, { align: 'right' })
    y += 20
  }

  /* ============== PERSONAL ALLOWANCE / TAXABLE ============== */

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TAXABLE INCOME CALCULATION', MARGIN, y); y += 12

  const subRows = [
    ['Gross income',                            est.gross],
    ['Less: Personal allowance / exemption',    -est.personalAllowance],
    ['Less: Deductions',                        -est.deductionsTotal],
    ['Taxable income',                           est.taxable],
  ]
  for (const [k, v] of subRows) {
    y = ensureSpace(doc, y, 14)
    const isTotal = k === 'Taxable income'
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_500))
    doc.text(k, MARGIN + 8, y + 10)
    doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_950))
    doc.text(`${v < 0 ? '-' : ''}${cur.code} ${formatNumber(Math.abs(v))}`,
      PAGE_W - MARGIN - 8, y + 10, { align: 'right' })
    y += 14
    if (isTotal) {
      doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(0.8)
      doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2)
    } else {
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    }
  }
  y += 10

  /* ============== SLAB BREAKDOWN ============== */

  if (est.breakdown.length > 0) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('SLAB-WISE TAX BREAKDOWN', MARGIN, y); y += 12

    const c1 = tX + 8
    const c2 = tX + tW * 0.40
    const c3 = tX + tW * 0.58
    const c4 = tX + tW * 0.76
    const c5 = tX + tW - 8

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('BAND',           c1, y + 11)
    doc.text('RANGE',          c2, y + 11, { align: 'right' })
    doc.text('TAXED IN BAND',  c3, y + 11, { align: 'right' })
    doc.text('RATE',           c4, y + 11, { align: 'right' })
    doc.text('TAX',            c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < est.breakdown.length; i++) {
      const b = est.breakdown[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(b.label, c1, y + 10)
      const upperStr = Number.isFinite(b.upper) ? formatNumber(b.upper) : '∞'
      doc.text(`${formatNumber(b.lower)}–${upperStr}`, c2, y + 10, { align: 'right' })
      doc.text(formatNumber(b.sliceAmount), c3, y + 10, { align: 'right' })
      doc.text(`${formatNumber(b.ratePct)}%`, c4, y + 10, { align: 'right' })
      doc.text(formatNumber(b.tax), c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    y = ensureSpace(doc, y, 18)
    doc.setTextColor(...C_TAX_DK)
    doc.text('SUBTOTAL TAX', c1, y + 12)
    doc.text(`${cur.code} ${formatNumber(est.totalTax)}`, c5, y + 12, { align: 'right' })
    y += 18
  }

  /* ============== ADJUSTMENTS ============== */

  const hasAdjustments = est.surcharge > 0 || est.cess > 0 || est.rebate > 0
  if (hasAdjustments) {
    y += 4
    const adjRows = []
    if (est.surcharge > 0) adjRows.push([`Surcharge (${formatNumber(Number(data.surchargeRatePct) || 0)}%)`, est.surcharge])
    if (est.cess > 0)      adjRows.push([`Cess (${formatNumber(Number(data.cessRatePct) || 0)}%)`,           est.cess])
    if (est.rebate > 0)    adjRows.push(['Rebate (e.g. 87A)', -est.rebate])
    adjRows.push(['TOTAL TAX PAYABLE', est.netTax])
    for (const [k, v] of adjRows) {
      const isTotal = k === 'TOTAL TAX PAYABLE'
      y = ensureSpace(doc, y, 14)
      doc.setFont('helvetica', isTotal ? 'bold' : 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_500))
      doc.text(k, MARGIN + 8, y + 10)
      doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_950))
      doc.text(`${v < 0 ? '-' : ''}${cur.code} ${formatNumber(Math.abs(v))}`,
        PAGE_W - MARGIN - 8, y + 10, { align: 'right' })
      y += 14
      if (isTotal) {
        doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(0.8)
        doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2)
      } else {
        doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
        doc.line(MARGIN, y, PAGE_W - MARGIN, y)
      }
    }
    y += 10
  }

  /* ============== RATE METRICS ============== */

  y = ensureSpace(doc, y, 64)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('RATE METRICS', MARGIN, y); y += 12

  const metricGap = 6
  const metricW = (PAGE_W - MARGIN * 2 - metricGap * 2) / 3
  const metrics = [
    ['EFFECTIVE RATE', `${formatNumber(est.effectiveRatePct)}%`,
      'Total tax ÷ gross income'],
    ['MARGINAL RATE',  `${formatNumber(est.marginalRatePct)}%`,
      'Rate on next dollar earned'],
    ['MONTHLY TAX',    `${cur.code} ${formatNumber(est.monthlyTax)}`,
      'Tax ÷ 12'],
  ]
  for (let i = 0; i < metrics.length; i++) {
    const x = MARGIN + i * (metricW + metricGap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(244, 252, 220)
    doc.roundedRect(x, y, metricW, 50, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_TAX_DK); doc.text(metrics[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5)
    doc.setTextColor(...C_INK_950); doc.text(metrics[i][1], x + 8, y + 32)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500); doc.text(metrics[i][2], x + 8, y + 44)
  }
  y += 50 + 14

  /* ============== TAKE-HOME BLOCK ============== */

  if (data.includeTakeHomeBlock) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('TAKE-HOME & MONTHLY VIEW', MARGIN, y); y += 12

    const thRows = [
      ['Gross income (annual)',  `${cur.code} ${formatNumber(est.gross)}`],
      ['Total tax (annual)',     `${cur.code} ${formatNumber(est.netTax)}`],
      ['Take-home (annual)',     `${cur.code} ${formatNumber(est.takeHome)}`],
      ['Gross / month',          `${cur.code} ${formatNumber(est.monthlyGross)}`],
      ['Tax / month',            `${cur.code} ${formatNumber(est.monthlyTax)}`],
      ['Take-home / month',      `${cur.code} ${formatNumber(est.monthlyTakeHome)}`],
    ]
    for (let i = 0; i < thRows.length; i++) {
      const [k, v] = thRows[i]
      const isTotal = k === 'Take-home (annual)' || k === 'Take-home / month'
      y = ensureSpace(doc, y, 14)
      doc.setFont('helvetica', isTotal ? 'bold' : 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_500))
      doc.text(k, MARGIN + 8, y + 10)
      doc.setTextColor(...(isTotal ? C_TAX_DK : C_INK_950))
      doc.text(v, PAGE_W - MARGIN - 8, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    }
    y += 10
  }

  /* ============== PROJECTION ============== */

  if (data.includeProjectionBlock && est.paidYTD >= 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEAR-TO-DATE PROJECTION', MARGIN, y); y += 12

    const pjW = PAGE_W - MARGIN * 2
    doc.setDrawColor(...C_TAX); doc.setLineWidth(0.6)
    doc.setFillColor(244, 252, 220)
    doc.roundedRect(MARGIN, y, pjW, 60, 4, 4, 'FD')

    const cL = MARGIN + 14
    const cR = PAGE_W - MARGIN - 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    doc.text('Total tax estimated (year)', cL, y + 18)
    doc.text('Less: paid year-to-date',    cL, y + 32)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_TAX_DK)
    doc.text('REMAINING TO PAY',           cL, y + 50)

    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK_950)
    doc.text(`${cur.code} ${formatNumber(est.netTax)}`,    cR, y + 18, { align: 'right' })
    doc.text(`${cur.code} ${formatNumber(est.paidYTD)}`,   cR, y + 32, { align: 'right' })
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_TAX_DK)
    doc.text(`${cur.code} ${formatNumber(est.remainingTax)}`, cR, y + 50, { align: 'right' })

    y += 60 + 10
  }

  /* ============== REGIME NOTE ============== */

  if (regime.notes) {
    y = ensureSpace(doc, y, 28)
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8)
    doc.setTextColor(...C_INK_500)
    const lines = doc.splitTextToSize(`Regime notes: ${regime.notes}`, PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 12); doc.text(line, MARGIN, y); y += 12 }
    y += 4
  }

  /* ============== USER NOTES ============== */

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

  const fileName = `income-tax-estimate-${(data.reference || regime.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Income tax estimate${data.taxYear ? ` · ${data.taxYear}` : ''}${data.reference ? ` · ${data.reference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
