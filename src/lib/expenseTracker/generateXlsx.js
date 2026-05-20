import * as XLSX from 'xlsx'
import {
  findCurrency, computeExpenses, describePeriod, statusLabel,
} from './compute'

export function generateExpenseTrackerXlsx(data) {
  const t = computeExpenses(data)
  const cur = findCurrency(data.currency)
  const period = describePeriod(data)

  const wb = XLSX.utils.book_new()

  /* ---- Expenses sheet (detail) ---- */
  const expenseRows = [
    [`Expense Report — ${data.ownerName || 'Owner'}`],
    [`Company: ${data.companyName || '—'}`, '', `Period: ${period || '—'}`, '', `Currency: ${cur.code}`],
    [],
    ['#', 'Date', 'Vendor', 'Description', 'Category', 'Payment method', 'Status', 'Reference', 'Amount'],
    ...(data.expenses || []).map((e, i) => [
      i + 1,
      e.date || '',
      e.vendor || '',
      e.description || '',
      e.category || '',
      e.paymentMethod || '',
      statusLabel(e.status),
      e.reference || '',
      Number(e.amount) || 0,
    ]),
    [],
    ['', '', '', '', '', '', '', 'TOTAL', t.total],
  ]
  const expSheet = XLSX.utils.aoa_to_sheet(expenseRows)
  expSheet['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 22 }, { wch: 38 }, { wch: 22 },
    { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, expSheet, 'Expenses')

  /* ---- Summary sheet ---- */
  const summaryRows = [
    ['Summary'],
    [],
    ['Total spent',         t.total],
    ['Number of expenses',  t.count],
    ['Average per expense', t.average],
    ['Reimbursable total',  t.reimbursableTotal],
    ['Reimbursed total',    t.reimbursedTotal],
    ['Rejected total',      t.rejectedTotal],
    [],
    ['Period start', data.periodStart || t.autoStart || ''],
    ['Period end',   data.periodEnd   || t.autoEnd   || ''],
    [],
    ['By category', 'Amount', '% of total'],
    ...t.byCategory.map((r) => [r.label, r.amount, `${r.pct}%`]),
    [],
    ['By payment method', 'Amount'],
    ...t.byPaymentMethod.map((r) => [r.label, r.amount]),
    [],
    ['By status', 'Amount'],
    ...t.byStatus.map((r) => [statusLabel(r.label), r.amount]),
  ]
  if (data.notes) {
    summaryRows.push([])
    summaryRows.push(['Notes', data.notes])
  }
  const sumSheet = XLSX.utils.aoa_to_sheet(summaryRows)
  sumSheet['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Summary')

  const fileName = `${(data.ownerName || 'expense-report').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-expenses.xlsx`
  XLSX.writeFile(wb, fileName)
}
