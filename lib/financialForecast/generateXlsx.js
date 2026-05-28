import * as XLSX from 'xlsx'
import {
  findCurrency,
  findLineType, findPeriodFrequency, findForecastHorizon, findForecastPurpose,
  computeForecast,
} from './compute'

export function generateFinancialForecastXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findForecastPurpose(data.purposeId)
  const frequency = findPeriodFrequency(data.frequencyId)
  const horizon = findForecastHorizon(data.horizonId)
  const report = computeForecast(data)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Financial Forecast'],
    [],
    ['Title',          data.reportTitle || ''],
    ['Reference',      data.reference || ''],
    ['Entity',         data.entityName || ''],
    ['Horizon',        `${report.years} years`],
    ['Frequency',      frequency.label],
    ['Purpose',        purpose.label],
    [],
    ['DOWNSIDE TOTAL'],
    ['Revenue',        report.aggregate.downside.revenue,    cur.code],
    ['Expense',        report.aggregate.downside.expense,    cur.code],
    ['Net income',     report.aggregate.downside.net,        cur.code],
    [],
    ['BASE CASE TOTAL'],
    ['Revenue',        report.aggregate.base.revenue,        cur.code],
    ['Expense',        report.aggregate.base.expense,        cur.code],
    ['Net income',     report.aggregate.base.net,            cur.code],
    [],
    ['OPTIMISTIC TOTAL'],
    ['Revenue',        report.aggregate.optimistic.revenue,  cur.code],
    ['Expense',        report.aggregate.optimistic.expense,  cur.code],
    ['Net income',     report.aggregate.optimistic.net,      cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Lines */
  const lineRows = [
    ['Line', 'Type', 'Current', 'Growth %/yr', 'Optimistic adj %', 'Downside adj %',
     'Base total', 'Optimistic total', 'Downside total'],
    ...report.rows.map((r) => [
      r.name || '', r.typeLabel, r.currentValue, r.growthBasePct, r.optimisticAdjPct, r.downsideAdjPct,
      r.baseTotal, r.optTotal, r.downTotal,
    ]),
    [],
    ['NET INCOME', '', '', '', '', '',
     report.aggregate.base.net, report.aggregate.optimistic.net, report.aggregate.downside.net],
  ]
  const wsLines = XLSX.utils.aoa_to_sheet(lineRows)
  wsLines['!cols'] = [
    { wch: 32 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 16 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsLines, 'Lines')

  /* Yearly */
  if (report.years > 0) {
    const yearStart = new Date(data.startDate || new Date().toISOString().slice(0, 10)).getFullYear()
    const yearHeader = Array.from({ length: report.years }, (_, i) => String(yearStart + i))
    const yearRows = [
      ['Scenario', 'Metric', ...yearHeader],
      ['Downside',   'Revenue', ...report.yearlyAggregate.downside.revenue],
      ['Downside',   'Expense', ...report.yearlyAggregate.downside.expense],
      ['Downside',   'Net',     ...report.yearlyAggregate.downside.net],
      [],
      ['Base case',  'Revenue', ...report.yearlyAggregate.base.revenue],
      ['Base case',  'Expense', ...report.yearlyAggregate.base.expense],
      ['Base case',  'Net',     ...report.yearlyAggregate.base.net],
      [],
      ['Optimistic', 'Revenue', ...report.yearlyAggregate.optimistic.revenue],
      ['Optimistic', 'Expense', ...report.yearlyAggregate.optimistic.expense],
      ['Optimistic', 'Net',     ...report.yearlyAggregate.optimistic.net],
    ]
    const wsYear = XLSX.utils.aoa_to_sheet(yearRows)
    wsYear['!cols'] = [{ wch: 14 }, { wch: 12 }, ...yearHeader.map(() => ({ wch: 14 }))]
    XLSX.utils.book_append_sheet(wb, wsYear, 'Yearly')
  }

  /* Per-period base */
  const periodRows = [
    ['Line', 'Scenario', ...report.periodLabels],
    ...report.rows.flatMap((r) => [
      [r.name || '', 'Base',       ...r.basePer],
      [r.name || '', 'Optimistic', ...r.optPer],
      [r.name || '', 'Downside',   ...r.downPer],
    ]),
    [],
    ['NET', 'Base',       ...report.netPerPeriod.base],
    ['NET', 'Optimistic', ...report.netPerPeriod.optimistic],
    ['NET', 'Downside',   ...report.netPerPeriod.downside],
  ]
  const wsPeriod = XLSX.utils.aoa_to_sheet(periodRows)
  wsPeriod['!cols'] = [{ wch: 32 }, { wch: 12 }, ...report.periodLabels.map(() => ({ wch: 12 }))]
  XLSX.utils.book_append_sheet(wb, wsPeriod, 'Per-period')

  const fileName = `financial-forecast-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
