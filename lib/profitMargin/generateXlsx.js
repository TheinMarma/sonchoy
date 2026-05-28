import * as XLSX from 'xlsx'
import { computeMargins, defaultFileBase, findPurpose } from './compute'

export function generateProfitMarginXlsx(data) {
  const m = computeMargins(data)
  const summary = [
    ['Label',          data.label || ''],
    ['Purpose',        findPurpose(data.purposeId).label],
    ['Period start',   data.periodStartIso || ''],
    ['Period end',     data.periodEndIso || ''],
    ['Currency',       data.currencyCode || 'USD'],
    [],
    ['Revenue',                m.revenue],
    ['COGS',                   m.cogs],
    ['Gross profit',           m.grossProfit],
    ['Operating expenses',     m.operatingExpense],
    ['Operating profit',       m.operatingProfit],
    ['Other income',           m.otherIncome],
    ['Interest expense',       m.interestExpense],
    ['Pre-tax profit',         m.pretaxProfit],
    ['Taxes',                  m.taxes],
    ['Net profit',             m.netProfit],
    [],
    ['Gross margin %',         m.grossMargin],
    ['Operating margin %',     m.operatingMargin],
    ['Pre-tax margin %',       m.pretaxMargin],
    ['Net margin %',           m.netMargin],
    ['Markup on cost %',       m.markup],
  ]
  const ws = XLSX.utils.aoa_to_sheet(summary)
  ws['!cols'] = [{ wch: 26 }, { wch: 22 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Profit Margins')
  XLSX.writeFile(wb, `${defaultFileBase(data)}.xlsx`)
}
