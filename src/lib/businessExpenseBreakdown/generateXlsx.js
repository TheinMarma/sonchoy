import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findSortMode, computeBreakdown, buildTopMovers,
} from './compute'

export function generateBusinessExpenseBreakdownXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const sort = findSortMode(data.sortMode)
  const report = computeBreakdown(data)
  const movers = buildTopMovers(report.rows, 10)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Business Expense Breakdown'],
    [],
    ['Title',           data.reportTitle || ''],
    ['Reference',       data.reference || ''],
    ['Entity',          data.entityName || ''],
    ['Period',          data.periodLabel || ''],
    ['Sort',            sort.label],
    [],
    ['Current period',  report.totalCurrent, cur.code],
    ['Prior period',    report.totalPrior,   cur.code],
    ['MoM change',      report.totalVariance, cur.code],
    ['MoM change %',    `${report.totalVariancePct}%`],
    [],
    ['Lines',           report.rows.length],
    ['Groups',          report.groupSummary.length],
    [`Top ${report.topN} group share`, `${report.topNGroupShare}%`],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Lines */
  const lineRows = [
    ['#', 'Line', 'Group', 'Current', 'Prior', 'Variance', 'Variance %', 'Share %'],
    ...report.rows.map((r, i) => [
      i + 1, r.name || '', r.groupLabel, r.current, r.prior, r.variance, r.variancePct, r.sharePct,
    ]),
    [],
    ['TOTAL', '', '', report.totalCurrent, report.totalPrior, report.totalVariance, report.totalVariancePct, 100],
  ]
  const wsLines = XLSX.utils.aoa_to_sheet(lineRows)
  wsLines['!cols'] = [
    { wch: 4 }, { wch: 32 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(wb, wsLines, 'Lines')

  /* By group */
  const groupRows = [
    ['Group', 'Count', 'Current', 'Prior', 'Variance', 'Variance %', 'Share %'],
    ...report.groupSummary.map((g) => [g.label, g.count, g.current, g.prior, g.variance, g.variancePct, g.sharePct]),
  ]
  const wsGroup = XLSX.utils.aoa_to_sheet(groupRows)
  wsGroup['!cols'] = [{ wch: 28 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, wsGroup, 'By Group')

  /* Top movers */
  const moverRows = [
    ['#', 'Line', 'Group', 'Current', 'Variance', 'Variance %'],
    ...movers.map((r, i) => [i + 1, r.name || '', r.groupLabel, r.current, r.variance, r.variancePct]),
  ]
  const wsMovers = XLSX.utils.aoa_to_sheet(moverRows)
  wsMovers['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsMovers, 'Top movers')

  /* Trend */
  if (Array.isArray(data.trendLabels) && data.trendLabels.length > 0) {
    const trendRows = [
      ['Line', 'Group', ...data.trendLabels],
      ...report.rows.map((r) => [r.name || '', r.groupLabel, ...(r.trend || []).slice(0, data.trendLabels.length)]),
      [],
      ['TOTAL', '', ...report.trendTotals.slice(0, data.trendLabels.length)],
    ]
    const wsTrend = XLSX.utils.aoa_to_sheet(trendRows)
    wsTrend['!cols'] = [{ wch: 32 }, { wch: 22 }, ...data.trendLabels.map(() => ({ wch: 12 }))]
    XLSX.utils.book_append_sheet(wb, wsTrend, 'Trend')
  }

  const fileName = `business-expense-breakdown-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
