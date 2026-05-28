import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findReportPeriod, findReportStatus, findAudience,
  computeTotals,
} from './compute'

export function generateFinancialReportXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const period = findReportPeriod(data.periodId)
  const status = findReportStatus(data.statusId)
  const audience = findAudience(data.audienceId)
  const totals = computeTotals(data)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Financial Report'],
    [],
    ['Report #',         data.reportNumber || ''],
    ['Title',            data.reportTitle || ''],
    ['Period',           data.periodLabel || ''],
    ['Frequency',        period.label],
    ['Prepared',         formatDate(data.preparedDate) || ''],
    ['Audience',         audience.label],
    ['Status',           status.label],
    [],
    ['Company',          data.company?.name || ''],
    [],
    ['Revenue (current)', totals.totalRevenueCurrent, cur.code],
    ['Revenue (prior)',   totals.totalRevenuePrior,   cur.code],
    ['Revenue Δ%',        totals.revenueDelta != null ? totals.revenueDelta : 'N/A'],
    [],
    ['Expenses (current)', totals.totalExpenseCurrent, cur.code],
    ['Expenses (prior)',   totals.totalExpensePrior,   cur.code],
    ['Expenses Δ%',        totals.expenseDelta != null ? totals.expenseDelta : 'N/A'],
    [],
    ['Net income (current)', totals.netIncomeCurrent, cur.code],
    ['Net income (prior)',   totals.netIncomePrior,   cur.code],
    ['Net income Δ%',        totals.netDelta != null ? totals.netDelta : 'N/A'],
    [],
    ['Gross margin (current)', totals.grossMarginCurrent, '%'],
    ['Gross margin (prior)',   totals.grossMarginPrior,   '%'],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* KPIs */
  if (totals.kpis.length > 0) {
    const kRows = [
      ['Metric', 'Unit', 'Current', 'Prior', 'Target', 'Δ vs prior %', 'Δ vs target %', 'Good direction'],
      ...totals.kpis.map((k) => [
        k.label || '', k.unit || 'num',
        k.current, k.prior, k.target,
        k.delta == null ? 'N/A' : k.delta,
        k.targetDelta == null ? 'N/A' : k.targetDelta,
        k.goodDirection || 'up',
      ]),
    ]
    const wsK = XLSX.utils.aoa_to_sheet(kRows)
    wsK['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsK, 'KPIs')
  }

  /* Revenue */
  if (totals.revenue.length > 0) {
    const rRows = [
      ['Line', 'Current', 'Prior', 'Δ%'],
      ...totals.revenue.map((r) => [r.label || '', r.current, r.prior, r.delta == null ? 'N/A' : r.delta]),
      [],
      ['TOTAL', totals.totalRevenueCurrent, totals.totalRevenuePrior, totals.revenueDelta == null ? 'N/A' : totals.revenueDelta],
    ]
    const wsR = XLSX.utils.aoa_to_sheet(rRows)
    wsR['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, wsR, 'Revenue')
  }

  /* Expenses */
  if (totals.expenses.length > 0) {
    const eRows = [
      ['Category', 'Current', 'Prior', 'Δ%'],
      ...totals.expenses.map((e) => [e.label || '', e.current, e.prior, e.delta == null ? 'N/A' : e.delta]),
      [],
      ['TOTAL', totals.totalExpenseCurrent, totals.totalExpensePrior, totals.expenseDelta == null ? 'N/A' : totals.expenseDelta],
    ]
    const wsE = XLSX.utils.aoa_to_sheet(eRows)
    wsE['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, wsE, 'Expenses')
  }

  /* Narrative */
  const narrative = [
    ['Executive summary'], [data.executiveSummary || ''], [],
    ['Highlights'], ...(data.highlights || []).filter(Boolean).map((h) => [`• ${h}`]), [],
    ['Commentary'], [data.commentary || ''], [],
    ['Risks'], [data.risks || ''], [],
    ['Outlook'], [data.outlook || ''],
  ]
  const wsN = XLSX.utils.aoa_to_sheet(narrative)
  wsN['!cols'] = [{ wch: 100 }]
  XLSX.utils.book_append_sheet(wb, wsN, 'Narrative')

  const fileName = `financial-report-${(data.reportNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
