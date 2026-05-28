import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findLineType, findPeriodFrequency, findForecastHorizon, findForecastPurpose,
  computeForecast,
} from './compute'

const MARGIN = 36
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ACC     = [129, 140, 248]
const C_ACC_DK  = [67, 56, 202]
const C_SUCCESS = [22, 163, 74]
const C_DANGER  = [220, 38, 38]
const C_WARN    = [217, 119, 6]

const BODY = 9

export function generateFinancialForecastPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findForecastPurpose(data.purposeId)
  const frequency = findPeriodFrequency(data.frequencyId)
  const horizon = findForecastHorizon(data.horizonId)
  const report = computeForecast(data)

  let y = MARGIN

  doc.setFillColor(...C_ACC); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('FINANCIAL FORECAST', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Financial Forecast', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.entityName)  meta.push(`Entity: ${data.entityName}`)
  meta.push(`Horizon: ${report.years} year${report.years === 1 ? '' : 's'}`)
  meta.push(`Frequency: ${frequency.label.toLowerCase()}`)
  meta.push(`Purpose: ${purpose.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_ACC); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* SCENARIO CARDS */
  const cardCount = 3
  const gap = 8
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const baseColor = report.aggregate.base.net >= 0 ? C_SUCCESS : C_DANGER
  const optColor  = report.aggregate.optimistic.net >= 0 ? C_SUCCESS : C_DANGER
  const downColor = report.aggregate.downside.net >= 0 ? C_SUCCESS : C_DANGER

  const cards = [
    ['DOWNSIDE',   report.aggregate.downside,   C_DANGER,  downColor],
    ['BASE CASE',  report.aggregate.base,       C_ACC_DK,  baseColor],
    ['OPTIMISTIC', report.aggregate.optimistic, C_SUCCESS, optColor],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...cards[i][2]); doc.setLineWidth(0.8)
    doc.setFillColor(248, 247, 250)
    doc.roundedRect(x, y, cardW, 76, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...cards[i][2]); doc.text(cards[i][0], x + 10, y + 16)

    const agg = cards[i][1]
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_500); doc.text('Revenue', x + 10, y + 32)
    doc.setTextColor(...C_INK_500); doc.text('Expense', x + 10, y + 46)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    doc.setTextColor(...cards[i][2]); doc.text('Net income', x + 10, y + 64)

    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(agg.revenue), x + cardW - 10, y + 32, { align: 'right' })
    doc.text(formatNumber(agg.expense), x + cardW - 10, y + 46, { align: 'right' })
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.setTextColor(...cards[i][3])
    doc.text(`${agg.net >= 0 ? '+' : '-'}${formatNumber(Math.abs(agg.net))}`, x + cardW - 10, y + 64, { align: 'right' })
  }
  y += 76 + 14

  /* MAIN TABLE: 3-scenario forecast per line */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_ACC_DK)
  doc.text(`${report.years}-YEAR FORECAST BY LINE`, MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cName  = tX + 8
  const cType  = tX + tW * 0.35
  const cCur   = tX + tW * 0.49
  const cBase  = tX + tW * 0.64
  const cOpt   = tX + tW * 0.79
  const cDown  = tX + tW - 8

  const drawHeader = () => {
    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('LINE',       cName, y + 11)
    doc.text('TYPE',       cType, y + 11)
    doc.text('CURRENT',    cCur,  y + 11, { align: 'right' })
    doc.text('BASE',       cBase, y + 11, { align: 'right' })
    doc.text('OPTIMISTIC', cOpt,  y + 11, { align: 'right' })
    doc.text('DOWNSIDE',   cDown, y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  // Group lines by type
  const typeOrder = ['revenue', 'cogs', 'opex', 'capex', 'tax']
  const grouped = {}
  for (const r of report.rows) {
    if (!grouped[r.typeId]) grouped[r.typeId] = []
    grouped[r.typeId].push(r)
  }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (const tId of typeOrder) {
    if (!grouped[tId]) continue
    const list = grouped[tId]
    const subBase = list.reduce((s, r) => s + r.baseTotal, 0)
    const subOpt  = list.reduce((s, r) => s + r.optTotal, 0)
    const subDown = list.reduce((s, r) => s + r.downTotal, 0)
    const subCur  = list.reduce((s, r) => s + r.currentValue, 0)

    // Group heading
    y = ensureSpace(doc, y, 14)
    doc.setFillColor(244, 245, 255); doc.rect(tX, y, tW, 14, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    doc.setTextColor(...C_ACC_DK)
    doc.text(findLineType(tId).label.toUpperCase(), cName, y + 10)
    doc.text(formatNumber(subCur),  cCur,  y + 10, { align: 'right' })
    doc.text(formatNumber(subBase), cBase, y + 10, { align: 'right' })
    doc.text(formatNumber(subOpt),  cOpt,  y + 10, { align: 'right' })
    doc.text(formatNumber(subDown), cDown, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_ACC); doc.setLineWidth(0.5); doc.line(tX, y, tX + tW, y)

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < list.length; i++) {
      y = ensureSpace(doc, y, 14)
      if (y === MARGIN) drawHeader()
      const r = list[i]
      if (i % 2 === 0) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(`  ${r.name || '—'}`, cName, y + 10)
      doc.setTextColor(...C_INK_700)
      const detail = `${r.growthBasePct >= 0 ? '+' : ''}${formatNumber(r.growthBasePct)}%/yr`
      doc.text(detail, cType, y + 10)
      doc.setTextColor(...C_INK_500)
      doc.text(formatNumber(r.currentValue), cCur, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.baseTotal), cBase, y + 10, { align: 'right' })
      doc.setTextColor(...C_SUCCESS)
      doc.text(formatNumber(r.optTotal), cOpt, y + 10, { align: 'right' })
      doc.setTextColor(...C_DANGER)
      doc.text(formatNumber(r.downTotal), cDown, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 4
  }

  // Net row
  y = ensureSpace(doc, y, 20)
  doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.setTextColor(...C_ACC_DK)
  doc.text('NET INCOME (income − expense)', cName, y + 12)
  doc.text(formatNumber(report.aggregate.base.net),       cBase, y + 12, { align: 'right' })
  doc.setTextColor(...C_SUCCESS)
  doc.text(formatNumber(report.aggregate.optimistic.net), cOpt,  y + 12, { align: 'right' })
  doc.setTextColor(...C_DANGER)
  doc.text(formatNumber(report.aggregate.downside.net),   cDown, y + 12, { align: 'right' })
  y += 18

  /* YEARLY TABLE */
  if (data.includeYearlyTable && report.years > 1) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('YEARLY NET INCOME — BASE / OPTIMISTIC / DOWNSIDE', MARGIN, y); y += 12

    const totalCols = report.years
    const colW = (tW - 120) / totalCols
    const cLabel = tX + 8
    const c0     = tX + 120

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('SCENARIO', cLabel, y + 11)
    for (let i = 0; i < totalCols; i++) {
      const startYear = new Date(data.startDate || todayISO()).getFullYear() + i
      doc.text(String(startYear), c0 + colW * (i + 1) - 4, y + 11, { align: 'right' })
    }
    y += 16

    const scenarios = [
      ['Downside',   report.yearlyAggregate.downside.net, C_DANGER],
      ['Base case',  report.yearlyAggregate.base.net,      C_INK_950],
      ['Optimistic', report.yearlyAggregate.optimistic.net, C_SUCCESS],
    ]
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < scenarios.length; i++) {
      const [label, vals, color] = scenarios[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...color)
      doc.text(label, cLabel, y + 10)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...color)
      for (let j = 0; j < totalCols; j++) {
        doc.text(formatNumber(vals[j] || 0), c0 + colW * (j + 1) - 4, y + 10, { align: 'right' })
      }
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* PERIOD TABLE — base-case net per period */
  if (data.includePeriodTable && report.totalPeriods <= 24) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text(`BASE-CASE NET PER ${frequency.label.toUpperCase()} PERIOD`, MARGIN, y); y += 12

    const labelsToShow = report.periodLabels.slice(0, Math.min(report.totalPeriods, 12))
    const cWid = (tW - 70) / labelsToShow.length
    const cL = tX + 8
    const c0 = tX + 70

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('NET', cL, y + 11)
    for (let i = 0; i < labelsToShow.length; i++) {
      doc.text(String(labelsToShow[i]).slice(0, 8), c0 + cWid * (i + 1) - 2, y + 11, { align: 'right' })
    }
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    y = ensureSpace(doc, y, 14)
    doc.setTextColor(...C_INK_700)
    doc.text('Base', cL, y + 10)
    for (let i = 0; i < labelsToShow.length; i++) {
      const v = report.netPerPeriod.base[i] || 0
      doc.setTextColor(...(v >= 0 ? C_SUCCESS : C_DANGER))
      doc.text(formatNumber(v), c0 + cWid * (i + 1) - 2, y + 10, { align: 'right' })
    }
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    y += 8
  }

  /* SENSITIVITY BLOCK */
  if (data.includeSensitivity) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('SENSITIVITY · BASE-CASE vs SCENARIOS', MARGIN, y); y += 12

    const spread = report.aggregate.optimistic.net - report.aggregate.downside.net

    doc.setDrawColor(...C_ACC); doc.setLineWidth(0.6)
    doc.setFillColor(244, 245, 255)
    doc.roundedRect(MARGIN, y, tW, 76, 4, 4, 'FD')

    const cL = MARGIN + 14
    const cR = PAGE_W - MARGIN - 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    doc.text('Optimistic upside vs base', cL, y + 18)
    doc.text('Downside risk vs base',     cL, y + 32)
    doc.text('Total spread (opt − down)', cL, y + 46)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_ACC_DK)
    doc.text('Confidence range', cL, y + 64)

    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_SUCCESS)
    doc.text(`+${formatNumber(report.aggregate.optimistic.net - report.aggregate.base.net)}`, cR, y + 18, { align: 'right' })
    doc.setTextColor(...C_DANGER)
    doc.text(`-${formatNumber(report.aggregate.base.net - report.aggregate.downside.net)}`, cR, y + 32, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.text(`${formatNumber(spread)}`, cR, y + 46, { align: 'right' })
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_ACC_DK)
    doc.text(`${cur.code} ${formatNumber(report.aggregate.downside.net)} → ${cur.code} ${formatNumber(report.aggregate.optimistic.net)}`, cR, y + 64, { align: 'right' })

    y += 76 + 10
  }

  /* NOTES */
  if (data.notes) {
    y += 6
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('NOTES & ASSUMPTIONS', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
  }

  addPageFooters(doc, data)

  const fileName = `financial-forecast-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 20) { doc.addPage(); return MARGIN }
  return y
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
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
    const left = `Financial forecast${data.entityName ? ` · ${data.entityName}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
