import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate, findCategory,
  analyseTransactions, buildCategorySummary, buildVendorSummary, buildMonthlySummary,
} from './compute'

export function generateBankStatementAnalysisXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const { rows, totals } = analyseTransactions(data.transactions)
  const categorySummary = buildCategorySummary(rows)
  const vendorSummary   = buildVendorSummary(rows, 100)
  const monthlySummary  = buildMonthlySummary(rows)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Bank Statement Analysis'],
    [],
    ['Title',         data.analysisTitle || ''],
    ['Reference',     data.reference || ''],
    ['Account holder', data.accountHolder || ''],
    ['Bank',          data.bank || ''],
    ['Account no.',   data.accountNumber || ''],
    ['Period',        data.periodLabel || ''],
    [],
    ['Total inflows',  totals.totalCredit, cur.code],
    ['Total outflows', totals.totalDebit,  cur.code],
    ['Net flow',       totals.net,         cur.code],
    [],
    ['Recurring spend', totals.recurringDebit, cur.code],
    ['One-off spend',   totals.oneOffDebit,    cur.code],
    [],
    ['Transactions',   rows.length],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Transactions */
  const txRows = [
    ['#', 'Date', 'Description', 'Vendor', 'Category', 'Debit', 'Credit', 'Net', 'Balance', 'Recurring'],
    ...rows.map((r, i) => [
      i + 1, formatDate(r.date) || '', r.description || '',
      r.vendor || '', findCategory(r.categoryId).label,
      r.debit, r.credit, r.net,
      r.balance ?? '', r.recurring ? 'Yes' : '',
    ]),
    [],
    ['TOTALS', '', '', '', '',
     totals.totalDebit, totals.totalCredit, totals.net, '', ''],
  ]
  const wsTx = XLSX.utils.aoa_to_sheet(txRows)
  wsTx['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 38 }, { wch: 22 }, { wch: 22 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions')

  /* By category */
  const catRows = [
    ['Category', 'Transactions', 'Debit', 'Credit', 'Net'],
    ...categorySummary.map((s) => [s.label, s.count, s.debit, s.credit, s.net]),
  ]
  const wsCat = XLSX.utils.aoa_to_sheet(catRows)
  wsCat['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsCat, 'By Category')

  /* Vendors */
  const venRows = [
    ['Vendor', 'Category', 'Transactions', 'Recurring', 'Spend'],
    ...vendorSummary.map((v) => [v.vendor, findCategory(v.categoryId).label, v.count, v.recurring ? 'Yes' : '', v.debit]),
  ]
  const wsVen = XLSX.utils.aoa_to_sheet(venRows)
  wsVen['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsVen, 'Vendors')

  /* Monthly */
  const monRows = [
    ['Month', 'Transactions', 'Inflows', 'Outflows', 'Net'],
    ...monthlySummary.map((m) => [m.month, m.count, m.credit, m.debit, m.net]),
  ]
  const wsMon = XLSX.utils.aoa_to_sheet(monRows)
  wsMon['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsMon, 'Monthly')

  const fileName = `bank-statement-analysis-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
