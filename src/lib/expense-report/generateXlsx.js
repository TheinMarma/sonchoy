import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findReportStatus, findCategory, findPaymentMethod,
  computeTotals, buildCategorySummary, buildPaymentSummary,
} from './compute'

export function generateExpenseReportXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const status = findReportStatus(data.statusId)
  const totals = computeTotals(data)
  const catSummary = buildCategorySummary(totals.lines)
  const pmSummary  = buildPaymentSummary(totals.lines)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Expense Report'],
    [],
    ['Report #',       data.reportNumber || ''],
    ['Date',           formatDate(data.reportDate) || ''],
    ['Period from',    formatDate(data.periodFrom) || ''],
    ['Period to',      formatDate(data.periodTo) || ''],
    ['Purpose',        data.purpose || ''],
    ['Status',         status.label],
    [],
    ['Claimant',       data.claimant?.name || ''],
    ['Employee ID',    data.claimant?.employeeId || ''],
    ['Title',          data.claimant?.title || ''],
    ['Department',     data.claimant?.department || ''],
    ['Cost centre',    data.claimant?.costCenter || ''],
    [],
    ['Approver',       data.approver?.name || ''],
    ['Approver title', data.approver?.title || ''],
    [],
    ['Subtotal',          totals.subtotal,        cur.code],
    ['Tax',               totals.totalTax,        cur.code],
    ['Grand total',       totals.grandTotal,      cur.code],
    ['Non-reimbursable',  totals.nonReimbursable, cur.code],
    ['Reimbursable',      totals.reimbursable,    cur.code],
    ['Less: cash advance', totals.cashAdvance,    cur.code],
    ['NET DUE',            totals.netDue,         cur.code],
    ['Billable to client', totals.billable,       cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Line items */
  const itemRows = [
    ['#', 'Date', 'Vendor', 'Description', 'Category', 'Payment method', 'Amount', 'Tax', 'Total',
     'Reimbursable', 'Billable', 'Project code', 'Receipt ref', 'Notes'],
    ...totals.lines.map((l, i) => [
      i + 1, formatDate(l.date) || '', l.vendor || '', l.description || '',
      findCategory(l.categoryId).label,
      findPaymentMethod(l.paymentMethodId).label,
      l.amount, l.tax, l.total,
      l.reimbursable ? 'Yes' : 'No',
      l.billable ? 'Yes' : 'No',
      l.projectCode || '',
      l.receiptRef || '',
      l.notes || '',
    ]),
    [],
    ['TOTAL', '', '', '', '', '', totals.subtotal, totals.totalTax, totals.grandTotal],
  ]
  const wsItems = XLSX.utils.aoa_to_sheet(itemRows)
  wsItems['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 16 },
    { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 28 },
  ]
  XLSX.utils.book_append_sheet(wb, wsItems, 'Line items')

  /* Category breakdown */
  if (catSummary.length > 0) {
    const catRows = [
      ['Category', 'Count', 'Share %', 'Amount'],
      ...catSummary.map((c) => [c.label, c.count, c.pct, c.total]),
    ]
    const wsCat = XLSX.utils.aoa_to_sheet(catRows)
    wsCat['!cols'] = [{ wch: 22 }, { wch: 8 }, { wch: 10 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsCat, 'By category')
  }

  /* Payment-method breakdown */
  if (pmSummary.length > 0) {
    const pmRows = [
      ['Payment method', 'Count', 'Amount'],
      ...pmSummary.map((p) => [p.label, p.count, p.total]),
    ]
    const wsPm = XLSX.utils.aoa_to_sheet(pmRows)
    wsPm['!cols'] = [{ wch: 22 }, { wch: 8 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsPm, 'By payment')
  }

  const fileName = `expense-report-${(data.reportNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
