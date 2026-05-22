import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findPeriodFrequency, findPlanPurpose,
  computeBudget, buildLineGroups, buildWatchlist,
} from './compute'

export function generateBudgetPlanningXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const frequency = findPeriodFrequency(data.frequencyId)
  const purpose = findPlanPurpose(data.purposeId)
  const report = computeBudget(data)
  const groups = buildLineGroups(report.rows)
  const watchlist = buildWatchlist(report.rows, 20)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Budget Planning Sheet'],
    [],
    ['Title',          data.reportTitle || ''],
    ['Reference',      data.reference || ''],
    ['Entity',         data.entityName || ''],
    ['Period',         data.periodLabel || ''],
    ['Plan purpose',   purpose.label],
    ['Frequency',      frequency.label],
    [],
    ['Budgeted income',  report.totalIncome.budget, cur.code],
    ['Actual income',    report.totalIncome.actual, cur.code],
    ['Income variance',  report.totalIncome.variance, cur.code],
    [],
    ['Budgeted expense', report.totalExpense.budget, cur.code],
    ['Actual expense',   report.totalExpense.actual, cur.code],
    ['Expense variance', report.totalExpense.variance, cur.code],
    [],
    ['Net budget',       report.netBudget, cur.code],
    ['Net actual',       report.netActual, cur.code],
    ['Net variance',     report.netVariance, cur.code],
    [],
    ['On track',         report.statusCounts['on-track'] || 0],
    ['Under / above',    (report.statusCounts['under'] || 0) + (report.statusCounts['above'] || 0)],
    ['Over / below',     (report.statusCounts['over'] || 0) + (report.statusCounts['below'] || 0)],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Lines */
  const lineRows = [['Type', 'Line', 'Budget', 'Actual', 'Variance', 'Variance %', 'Status']]
  for (const g of groups) {
    lineRows.push([`${g.label.toUpperCase()} subtotal`, '', g.subBudget, g.subActual, g.subVariance, g.subVariancePct, ''])
    for (const r of g.rows) {
      lineRows.push([r.typeLabel, r.name || '', r.budget, r.actual, r.variance, r.variancePct, r.status.label])
    }
    lineRows.push([])
  }
  lineRows.push(['NET', '', report.netBudget, report.netActual, report.netVariance, '', ''])
  const wsLines = XLSX.utils.aoa_to_sheet(lineRows)
  wsLines['!cols'] = [{ wch: 18 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsLines, 'Lines')

  /* Watchlist */
  if (watchlist.length > 0) {
    const watchRows = [
      ['Line', 'Type', 'Budget', 'Actual', 'Variance', 'Variance %', 'Status'],
      ...watchlist.map((r) => [r.name || '', r.typeLabel, r.budget, r.actual, r.variance, r.variancePct, r.status.label]),
    ]
    const wsWatch = XLSX.utils.aoa_to_sheet(watchRows)
    wsWatch['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsWatch, 'Watchlist')
  }

  /* Per-period */
  if (Array.isArray(data.periodLabels) && data.periodLabels.length > 0) {
    const periodRows = [
      ['Line', 'Type', ...data.periodLabels],
      ...report.rows.map((r) => [r.name || '', r.typeLabel, ...(r.periods || []).slice(0, data.periodLabels.length)]),
      [],
      ['NET BY PERIOD', '', ...report.periodTotals.slice(0, data.periodLabels.length)],
    ]
    const wsPeriod = XLSX.utils.aoa_to_sheet(periodRows)
    wsPeriod['!cols'] = [{ wch: 32 }, { wch: 18 }, ...data.periodLabels.map(() => ({ wch: 12 }))]
    XLSX.utils.book_append_sheet(wb, wsPeriod, 'Per-period')
  }

  const fileName = `budget-planning-${(data.reference || 'sheet').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
