import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findLineType, findPeriodFrequency, findPlanPurpose,
  computeBudget, buildLineGroups, buildWatchlist,
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

const BODY = 9

export function generateBudgetPlanningPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const frequency = findPeriodFrequency(data.frequencyId)
  const purpose = findPlanPurpose(data.purposeId)
  const report = computeBudget(data)
  const groups = buildLineGroups(report.rows)
  const watchlist = buildWatchlist(report.rows, 6)

  let y = MARGIN

  doc.setFillColor(...C_ACC); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('BUDGET PLANNING SHEET', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Budget Planning Sheet', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.entityName)  meta.push(`Entity: ${data.entityName}`)
  if (data.periodLabel) meta.push(`Period: ${data.periodLabel}`)
  meta.push(`Plan: ${purpose.label}`)
  meta.push(frequency.label)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_ACC); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* SUMMARY CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const netColor = report.netActual >= 0 ? C_SUCCESS : C_DANGER
  const cards = [
    ['BUDGETED INCOME',  `${cur.code} ${formatNumber(report.totalIncome.budget)}`, C_INK_950],
    ['BUDGETED EXPENSE', `${cur.code} ${formatNumber(report.totalExpense.budget)}`, C_INK_950],
    ['NET BUDGET',       `${report.netBudget >= 0 ? '' : '-'}${cur.code} ${formatNumber(Math.abs(report.netBudget))}`, C_ACC_DK],
    ['NET ACTUAL',       `${report.netActual >= 0 ? '' : '-'}${cur.code} ${formatNumber(Math.abs(report.netActual))}`, netColor],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 50, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_ACC_DK); doc.text(cards[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5)
    doc.setTextColor(...cards[i][2]); doc.text(cards[i][1], x + 8, y + 34)
  }
  y += 50 + 14

  /* STATUS BAR */
  const statusBarItems = [
    ['ON TRACK',    report.statusCounts['on-track'] || 0, C_SUCCESS],
    ['UNDER',       report.statusCounts['under'] || 0,    C_SUCCESS],
    ['ABOVE',       report.statusCounts['above'] || 0,    C_SUCCESS],
    ['OVER BUDGET', report.statusCounts['over'] || 0,     C_DANGER],
    ['BELOW',       report.statusCounts['below'] || 0,    C_DANGER],
  ].filter((s) => s[1] > 0)

  if (statusBarItems.length > 0) {
    const sbarW = (PAGE_W - MARGIN * 2 - 4 * (statusBarItems.length - 1)) / statusBarItems.length
    for (let i = 0; i < statusBarItems.length; i++) {
      const x = MARGIN + i * (sbarW + 4)
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
      doc.setFillColor(248, 247, 243)
      doc.roundedRect(x, y, sbarW, 36, 4, 4, 'FD')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
      doc.setTextColor(...statusBarItems[i][2]); doc.text(statusBarItems[i][0], x + 8, y + 13)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
      doc.setTextColor(...C_INK_950); doc.text(String(statusBarItems[i][1]), x + 8, y + 28)
    }
    y += 36 + 12
  }

  /* MAIN TABLE: grouped */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_ACC_DK)
  doc.text('BUDGET vs ACTUAL', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cName  = tX + 8
  const cBud   = tX + tW * 0.46
  const cAct   = tX + tW * 0.60
  const cVar   = tX + tW * 0.74
  const cVarPct = tX + tW * 0.86
  const cStat  = tX + tW - 8

  const drawHeader = () => {
    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('LINE',     cName, y + 11)
    doc.text('BUDGET',   cBud,  y + 11, { align: 'right' })
    doc.text('ACTUAL',   cAct,  y + 11, { align: 'right' })
    doc.text('VARIANCE', cVar,  y + 11, { align: 'right' })
    doc.text('Δ%',       cVarPct, y + 11, { align: 'right' })
    doc.text('STATUS',   cStat, y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  const drawRow = (label, budget, actual, variance, variancePct, kind, isHeading, status) => {
    y = ensureSpace(doc, y, 14)
    if (isHeading) {
      doc.setFillColor(244, 245, 255); doc.rect(tX, y, tW, 14, 'F')
    }
    doc.setFont('helvetica', isHeading ? 'bold' : 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...(isHeading ? C_ACC_DK : C_INK_700))
    doc.text(label, cName, y + 10)
    doc.setTextColor(...(isHeading ? C_ACC_DK : C_INK_950))
    doc.text(formatNumber(budget), cBud, y + 10, { align: 'right' })
    doc.text(formatNumber(actual), cAct, y + 10, { align: 'right' })
    // Variance colour-coding: revenue increase = good; expense increase = bad
    const goodIncrease = kind === 'income'
    const goodDecrease = kind === 'expense'
    const varColor = variance === 0 ? C_INK_500
      : (goodIncrease && variance > 0) || (goodDecrease && variance < 0) ? C_SUCCESS
      : C_DANGER
    doc.setTextColor(...varColor)
    doc.text(`${variance >= 0 ? '+' : '-'}${formatNumber(Math.abs(variance))}`, cVar, y + 10, { align: 'right' })
    doc.text(`${variance >= 0 ? '+' : ''}${formatNumber(variancePct)}%`, cVarPct, y + 10, { align: 'right' })
    if (status) {
      doc.setTextColor(...(status.tone === 'success' ? C_SUCCESS : status.tone === 'danger' ? C_DANGER : C_INK_500))
      doc.text(status.label.split(' ')[0].slice(0, 10), cStat, y + 10, { align: 'right' })
    }
    y += 14
    if (!isHeading) {
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    } else {
      doc.setDrawColor(...C_ACC); doc.setLineWidth(0.5); doc.line(tX, y, tX + tW, y)
    }
  }

  for (const g of groups) {
    // Group header row
    drawRow(g.label.toUpperCase(), g.subBudget, g.subActual, g.subVariance, g.subVariancePct, g.kind, true, null)
    for (const r of g.rows) {
      drawRow(`  ${r.name || '—'}`, r.budget, r.actual, r.variance, r.variancePct, g.kind, false, r.status)
    }
    y += 4
  }

  // Net row
  y = ensureSpace(doc, y, 20)
  doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.setTextColor(...C_ACC_DK)
  doc.text('NET (income − expense)', cName, y + 12)
  doc.text(formatNumber(report.netBudget), cBud, y + 12, { align: 'right' })
  doc.setTextColor(...(report.netActual >= 0 ? C_SUCCESS : C_DANGER))
  doc.text(formatNumber(report.netActual), cAct, y + 12, { align: 'right' })
  doc.text(`${report.netVariance >= 0 ? '+' : '-'}${formatNumber(Math.abs(report.netVariance))}`, cVar, y + 12, { align: 'right' })
  y += 18

  /* WATCHLIST */
  if (data.includeVarianceWatchlist && watchlist.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_DANGER)
    doc.text(`VARIANCE WATCHLIST (${watchlist.length})`, MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + tW * 0.45
    const c3 = tX + tW * 0.60
    const c4 = tX + tW * 0.75
    const c5 = tX + tW * 0.88
    const c6 = tX + tW - 10

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('LINE',      c1, y + 11)
    doc.text('TYPE',      c2, y + 11)
    doc.text('BUDGET',    c3, y + 11, { align: 'right' })
    doc.text('ACTUAL',    c4, y + 11, { align: 'right' })
    doc.text('Δ%',        c5, y + 11, { align: 'right' })
    doc.text('STATUS',    c6, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < watchlist.length; i++) {
      const r = watchlist[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(doc.splitTextToSize(r.name || '—', c2 - c1 - 6).slice(0, 1), c1, y + 10)
      doc.setTextColor(...C_INK_700)
      doc.text(r.typeLabel, c2, y + 10)
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.budget), c3, y + 10, { align: 'right' })
      doc.text(formatNumber(r.actual), c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_DANGER)
      doc.text(`${r.variancePct >= 0 ? '+' : ''}${formatNumber(r.variancePct)}%`, c5, y + 10, { align: 'right' })
      doc.text(r.status.label.split(' ')[0], c6, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* PERIOD TABLE */
  if (data.includePeriodTable && Array.isArray(data.periodLabels) && data.periodLabels.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text(`PER-PERIOD BUDGET (${data.periodLabels.length} periods)`, MARGIN, y); y += 12

    const totalCols = Math.min(data.periodLabels.length, 12)
    const colW = (tW - 140) / totalCols
    const cNameP = tX + 6
    const c0     = tX + 140

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('LINE', cNameP, y + 11)
    for (let i = 0; i < totalCols; i++) {
      doc.text(String(data.periodLabels[i] || `P${i + 1}`).slice(0, 8),
        c0 + colW * (i + 1) - 4, y + 11, { align: 'right' })
    }
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    const periodRows = report.rows.filter((r) => Array.isArray(r.periods) && r.periods.some((v) => v > 0)).slice(0, 14)
    for (let i = 0; i < periodRows.length; i++) {
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      const r = periodRows[i]
      doc.setTextColor(...C_INK_950)
      doc.text(doc.splitTextToSize(String(r.name || '—'), c0 - cNameP - 6).slice(0, 1), cNameP, y + 10)
      doc.setTextColor(...C_INK_700)
      for (let j = 0; j < totalCols; j++) {
        doc.text(formatNumber(Number(r.periods[j]) || 0),
          c0 + colW * (j + 1) - 4, y + 10, { align: 'right' })
      }
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }

    if (report.periodTotals.length > 0) {
      y = ensureSpace(doc, y, 18)
      doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(0.8)
      doc.line(tX, y, tX + tW, y); y += 2
      doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
      doc.setTextColor(...C_ACC_DK)
      doc.text('NET BY PERIOD', cNameP, y + 11)
      for (let j = 0; j < totalCols; j++) {
        const v = Number(report.periodTotals[j]) || 0
        doc.setTextColor(...(v >= 0 ? C_SUCCESS : C_DANGER))
        doc.text(formatNumber(v), c0 + colW * (j + 1) - 4, y + 11, { align: 'right' })
      }
      y += 16
    }
  }

  /* NOTES */
  if (data.notes) {
    y += 6
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
  }

  addPageFooters(doc, data)

  const fileName = `budget-planning-${(data.reference || 'sheet').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Budget planning${data.entityName ? ` · ${data.entityName}` : ''}${data.periodLabel ? ` · ${data.periodLabel}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
