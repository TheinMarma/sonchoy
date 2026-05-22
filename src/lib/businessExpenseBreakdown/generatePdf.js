import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findExpenseGroup, findSortMode,
  computeBreakdown, buildTopMovers,
} from './compute'

const MARGIN = 38
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

export function generateBusinessExpenseBreakdownPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const sort = findSortMode(data.sortMode)
  const report = computeBreakdown(data)
  const movers = buildTopMovers(report.rows, 6)

  let y = MARGIN

  doc.setFillColor(...C_ACC); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('BUSINESS EXPENSE BREAKDOWN', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Business Expense Breakdown', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.entityName)  meta.push(`Entity: ${data.entityName}`)
  if (data.periodLabel) meta.push(`Period: ${data.periodLabel}`)
  meta.push(`Sort: ${sort.label.toLowerCase()}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_ACC); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* SUMMARY CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const varColor = report.totalVariance > 0 ? C_DANGER : C_SUCCESS // for expenses, increase is "bad"
  const cards = [
    ['CURRENT PERIOD', `${cur.code} ${formatNumber(report.totalCurrent)}`, C_INK_950],
    ['PRIOR PERIOD',   `${cur.code} ${formatNumber(report.totalPrior)}`,   C_INK_700],
    ['MoM CHANGE',     `${report.totalVariance >= 0 ? '+' : '-'}${cur.code} ${formatNumber(Math.abs(report.totalVariance))}`, varColor],
    ['CHANGE %',       `${report.totalVariancePct >= 0 ? '+' : ''}${formatNumber(report.totalVariancePct)}%`, varColor],
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

  /* GROUP SUMMARY */
  if (data.includeGroupSummary && report.groupSummary.length > 0) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('BY EXPENSE GROUP', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 10
    const c2 = tX + tW * 0.40
    const c3 = tX + tW * 0.56
    const c4 = tX + tW * 0.72
    const c5 = tX + tW * 0.86
    const c6 = tX + tW - 10

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('GROUP',    c1, y + 11)
    doc.text('CURRENT',  c2, y + 11, { align: 'right' })
    doc.text('PRIOR',    c3, y + 11, { align: 'right' })
    doc.text('VARIANCE', c4, y + 11, { align: 'right' })
    doc.text('Δ%',       c5, y + 11, { align: 'right' })
    doc.text('SHARE',    c6, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < report.groupSummary.length; i++) {
      const g = report.groupSummary[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(g.label, c1, y + 10)
      doc.text(formatNumber(g.current), c2, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_700)
      doc.text(formatNumber(g.prior),   c3, y + 10, { align: 'right' })
      const vColor = g.variance === 0 ? C_INK_500 : (g.variance > 0 ? C_DANGER : C_SUCCESS)
      doc.setTextColor(...vColor)
      doc.text(`${g.variance >= 0 ? '+' : '-'}${formatNumber(Math.abs(g.variance))}`, c4, y + 10, { align: 'right' })
      doc.text(`${g.variancePct >= 0 ? '+' : ''}${formatNumber(g.variancePct)}%`, c5, y + 10, { align: 'right' })
      doc.setTextColor(...C_ACC_DK)
      doc.text(`${formatNumber(g.sharePct)}%`, c6, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* LINE-ITEM TABLE */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_ACC_DK)
  doc.text('ALL EXPENSE LINES', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 4
  const cName  = tX + 22
  const cGroup = tX + tW * 0.40
  const cCur   = tX + tW * 0.60
  const cVar   = tX + tW * 0.76
  const cVarPct = tX + tW * 0.87
  const cShare = tX + tW - 4

  const drawHeader = () => {
    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('#',         cN,      y + 11)
    doc.text('LINE',      cName,   y + 11)
    doc.text('GROUP',     cGroup,  y + 11)
    doc.text('CURRENT',   cCur,    y + 11, { align: 'right' })
    doc.text('VAR',       cVar,    y + 11, { align: 'right' })
    doc.text('Δ%',        cVarPct, y + 11, { align: 'right' })
    doc.text('SHARE',     cShare,  y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < report.rows.length; i++) {
    if (y + 14 > PAGE_H - MARGIN - 28) {
      addPageFooters(doc, data); doc.addPage(); y = MARGIN; drawHeader()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    }
    const r = report.rows[i]
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(doc.splitTextToSize(String(r.name || '—'), cGroup - cName - 6).slice(0, 1), cName, y + 10)
    doc.setTextColor(...C_INK_700)
    doc.text(doc.splitTextToSize(r.groupLabel, cCur - cGroup - 6).slice(0, 1), cGroup, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(r.current), cCur, y + 10, { align: 'right' })
    const vColor = r.variance === 0 ? C_INK_500 : (r.variance > 0 ? C_DANGER : C_SUCCESS)
    doc.setTextColor(...vColor)
    doc.text(`${r.variance >= 0 ? '+' : '-'}${formatNumber(Math.abs(r.variance))}`, cVar, y + 10, { align: 'right' })
    doc.text(`${r.variancePct >= 0 ? '+' : ''}${formatNumber(r.variancePct)}%`, cVarPct, y + 10, { align: 'right' })
    doc.setTextColor(...C_ACC_DK)
    doc.text(`${formatNumber(r.sharePct)}%`, cShare, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  // Totals
  y = ensureSpace(doc, y, 22)
  doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
  doc.setTextColor(...C_ACC_DK)
  doc.text('TOTAL', cName, y + 12)
  doc.text(formatNumber(report.totalCurrent), cCur,   y + 12, { align: 'right' })
  doc.setTextColor(...(report.totalVariance > 0 ? C_DANGER : C_SUCCESS))
  doc.text(`${report.totalVariance >= 0 ? '+' : '-'}${formatNumber(Math.abs(report.totalVariance))}`, cVar, y + 12, { align: 'right' })
  doc.text(`${report.totalVariancePct >= 0 ? '+' : ''}${formatNumber(report.totalVariancePct)}%`, cVarPct, y + 12, { align: 'right' })
  doc.setTextColor(...C_ACC_DK)
  doc.text('100%', cShare, y + 12, { align: 'right' })
  y += 18

  /* TOP MOVERS */
  if (data.includeTopMovers && movers.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('BIGGEST MOVERS (BY ABSOLUTE VARIANCE)', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + 30
    const c3 = tX + tW * 0.55
    const c4 = tX + tW * 0.72
    const c5 = tX + tW - 10

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('#',         c1, y + 11)
    doc.text('LINE',      c2, y + 11)
    doc.text('CURRENT',   c3, y + 11, { align: 'right' })
    doc.text('VAR',       c4, y + 11, { align: 'right' })
    doc.text('Δ%',        c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < movers.length; i++) {
      const r = movers[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_500)
      doc.text(String(i + 1), c1, y + 10)
      doc.setTextColor(...C_INK_950)
      doc.text(doc.splitTextToSize(String(r.name || '—'), c3 - c2 - 6).slice(0, 1), c2, y + 10)
      doc.text(formatNumber(r.current), c3, y + 10, { align: 'right' })
      doc.setTextColor(...(r.variance > 0 ? C_DANGER : C_SUCCESS))
      doc.text(`${r.variance >= 0 ? '+' : '-'}${formatNumber(Math.abs(r.variance))}`, c4, y + 10, { align: 'right' })
      doc.text(`${r.variancePct >= 0 ? '+' : ''}${formatNumber(r.variancePct)}%`, c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* TREND TABLE */
  if (data.includeTrendTable && Array.isArray(data.trendLabels) && data.trendLabels.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text(`MULTI-PERIOD TREND (${data.trendLabels.length} periods)`, MARGIN, y); y += 12

    const trendRows = report.rows.filter((r) => Array.isArray(r.trend) && r.trend.some((v) => v > 0)).slice(0, 12)
    const totalTrendCols = Math.min(data.trendLabels.length, 8)
    const colW = (tW - 140) / totalTrendCols
    const cNameT = tX + 6
    const c0     = tX + 140

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('LINE', cNameT, y + 11)
    for (let i = 0; i < totalTrendCols; i++) {
      doc.text(String(data.trendLabels[i] || `P${i + 1}`).slice(0, 8),
        c0 + colW * (i + 1) - 4, y + 11, { align: 'right' })
    }
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < trendRows.length; i++) {
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      const r = trendRows[i]
      doc.setTextColor(...C_INK_950)
      doc.text(doc.splitTextToSize(String(r.name || '—'), c0 - cNameT - 6).slice(0, 1), cNameT, y + 10)
      doc.setTextColor(...C_INK_700)
      for (let j = 0; j < totalTrendCols; j++) {
        doc.text(formatNumber(Number(r.trend[j]) || 0),
          c0 + colW * (j + 1) - 4, y + 10, { align: 'right' })
      }
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }

    if (report.trendTotals.length > 0) {
      y = ensureSpace(doc, y, 18)
      doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(0.8)
      doc.line(tX, y, tX + tW, y); y += 2
      doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
      doc.setTextColor(...C_ACC_DK)
      doc.text('TOTAL', cNameT, y + 11)
      for (let j = 0; j < totalTrendCols; j++) {
        doc.text(formatNumber(Number(report.trendTotals[j]) || 0),
          c0 + colW * (j + 1) - 4, y + 11, { align: 'right' })
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

  const fileName = `business-expense-breakdown-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Expense breakdown${data.entityName ? ` · ${data.entityName}` : ''}${data.periodLabel ? ` · ${data.periodLabel}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
