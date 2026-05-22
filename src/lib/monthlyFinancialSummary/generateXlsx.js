import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findCompareMode, computeSummary, buildLineGroups,
} from './compute'

export function generateMonthlyFinancialSummaryXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const compareMode = findCompareMode(data.compareMode)
  const sum = computeSummary(data)
  const groups = buildLineGroups(sum.rows)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Monthly Financial Summary'],
    [],
    ['Title',          data.reportTitle || ''],
    ['Reference',      data.reference || ''],
    ['Entity',         data.entityName || ''],
    ['Period',         data.monthLabel || ''],
    ['Comparison',     compareMode.label],
    [],
    ['Revenue',        sum.totals.revenue,  cur.code],
    ['Cost of revenue', sum.totals.cogs,    cur.code],
    ['Operating exp.', sum.totals.opex,     cur.code],
    ['Tax / other',    sum.totals.tax,      cur.code],
    [],
    ['Gross profit',     sum.grossProfit,     cur.code],
    ['Operating profit', sum.operatingProfit, cur.code],
    ['NET INCOME',       sum.netIncome,       cur.code],
    [],
    ['Gross margin %',     `${sum.grossMarginPct}%`],
    ['Operating margin %', `${sum.operatingMarginPct}%`],
    ['Net margin %',       `${sum.netMarginPct}%`],
    ['Expense ratio %',    `${sum.expenseRatioPct}%`],
    [],
    ['Cash opening',     sum.cashOpen,  cur.code],
    ['Cash closing',     sum.cashClose, cur.code],
    ['Cash change',      sum.cashChange, cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Lines */
  const showCompare = compareMode.id !== 'none'
  const header = showCompare
    ? ['Category', 'Type', 'Actual', compareMode.id === 'prior' ? 'Prior' : 'Budget', 'Variance', 'Variance %']
    : ['Category', 'Type', 'Amount']
  const lineRows = [header]
  for (const g of groups) {
    for (const r of g.rows) {
      if (showCompare) {
        lineRows.push([r.category || '', r.typeLabel, r.actual, r.compare, r.variance, `${r.variancePct}%`])
      } else {
        lineRows.push([r.category || '', r.typeLabel, r.actual])
      }
    }
    if (showCompare) {
      lineRows.push([`${g.label} subtotal`, '', g.subtotalActual, g.subtotalCompare, g.subtotalActual - g.subtotalCompare, ''])
    } else {
      lineRows.push([`${g.label} subtotal`, '', g.subtotalActual])
    }
    lineRows.push([])
  }
  if (showCompare) {
    lineRows.push(['Gross profit',      '', sum.grossProfit,      sum.grossProfitCompare,      sum.grossProfit - sum.grossProfitCompare, ''])
    lineRows.push(['Operating profit',  '', sum.operatingProfit,  sum.operatingProfitCompare,  sum.operatingProfit - sum.operatingProfitCompare, ''])
    lineRows.push(['NET INCOME',        '', sum.netIncome,        sum.netIncomeCompare,        sum.netVariance, ''])
  } else {
    lineRows.push(['Gross profit',      '', sum.grossProfit])
    lineRows.push(['Operating profit',  '', sum.operatingProfit])
    lineRows.push(['NET INCOME',        '', sum.netIncome])
  }
  const wsLines = XLSX.utils.aoa_to_sheet(lineRows)
  wsLines['!cols'] = showCompare
    ? [{ wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
    : [{ wch: 28 }, { wch: 16 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsLines, 'Lines')

  const fileName = `monthly-financial-summary-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
