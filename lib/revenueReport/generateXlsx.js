import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findDimension, findSortMode,
  computeReport, buildTopContributors,
} from './compute'

export function generateRevenueReportXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const dim = findDimension(data.dimensionId)
  const sort = findSortMode(data.sortMode)
  const report = computeReport(data)
  const top = buildTopContributors(report.rows, 10)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Revenue Report'],
    [],
    ['Title',           data.reportTitle || ''],
    ['Reference',       data.reference || ''],
    ['Entity',          data.entityName || ''],
    ['Period',          data.periodLabel || ''],
    ['Dimension',       dim.label],
    ['Sort',            sort.label],
    [],
    ['Current period',  report.totalCurrent, cur.code],
    ['Prior period',    report.totalPrior,   cur.code],
    ['Variance',        report.totalVariance, cur.code],
    ['Variance %',      `${report.totalVariancePct}%`],
    [],
    ['Rows tracked',    report.rows.length],
    [`Top ${report.topN} share`, `${report.topNShare}%`],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Main */
  const mainRows = [
    ['#', dim.label, 'Current', 'Prior', 'Variance', 'Variance %', 'Share %'],
    ...report.rows.map((r, i) => [
      i + 1, r.name || '', r.current, r.prior, r.variance, r.variancePct, r.sharePct,
    ]),
    [],
    ['TOTAL', '', report.totalCurrent, report.totalPrior, report.totalVariance, report.totalVariancePct, 100],
  ]
  const wsMain = XLSX.utils.aoa_to_sheet(mainRows)
  wsMain['!cols'] = [
    { wch: 4 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(wb, wsMain, 'Revenue')

  /* Top contributors */
  const topRows = [
    ['#', dim.label, 'Current', 'Share %', 'Variance %'],
    ...top.map((r, i) => [i + 1, r.name || '', r.current, r.sharePct, r.variancePct]),
  ]
  const wsTop = XLSX.utils.aoa_to_sheet(topRows)
  wsTop['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 14 }, { wch: 10 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsTop, 'Top contributors')

  /* Trend */
  if (Array.isArray(data.trendLabels) && data.trendLabels.length > 0) {
    const trendRows = [
      [dim.label, ...data.trendLabels],
      ...report.rows.map((r) => [r.name || '', ...(r.trend || []).slice(0, data.trendLabels.length)]),
      [],
      ['TOTAL', ...report.trendTotals.slice(0, data.trendLabels.length)],
    ]
    const wsTrend = XLSX.utils.aoa_to_sheet(trendRows)
    wsTrend['!cols'] = [{ wch: 32 }, ...data.trendLabels.map(() => ({ wch: 12 }))]
    XLSX.utils.book_append_sheet(wb, wsTrend, 'Trend')
  }

  const fileName = `revenue-report-${(data.reference || dim.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
