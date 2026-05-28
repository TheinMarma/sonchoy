import * as XLSX from 'xlsx'
import { findCurrency, computeAP, asOfLabel, statusLabel } from './compute'

export function generateAPReportXlsx(data) {
  const t = computeAP(data)
  const cur = findCurrency(data.currency)
  const dateLabel = asOfLabel(data)

  const wb = XLSX.utils.book_new()

  /* ---- Bills sheet (detail) ---- */
  const billRows = [
    [`Accounts Payable Report — ${data.companyName || 'Your Company'}`],
    [`As of: ${dateLabel || '—'}`, '', `Currency: ${cur.code}`],
    [],
    ['#', 'Vendor', 'Invoice #', 'Invoice date', 'Due date', 'Days overdue', 'Ageing bucket', 'Status', 'Reference', 'Amount'],
    ...t.bills.map((b, i) => [
      i + 1,
      b.vendor || '',
      b.invoiceNumber || '',
      b.invoiceDate || '',
      b.dueDate || '',
      b.daysOverdue,
      b.bucketLabel,
      statusLabel(b.status),
      b.reference || '',
      Number(b.amount) || 0,
    ]),
    [],
    ['', '', '', '', '', '', '', '', 'TOTAL OUTSTANDING', t.totalOutstanding],
    ['', '', '', '', '', '', '', '', 'TOTAL PAID',        t.totalPaid],
  ]
  const billSheet = XLSX.utils.aoa_to_sheet(billRows)
  billSheet['!cols'] = [
    { wch: 4 }, { wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, billSheet, 'Bills')

  /* ---- Summary sheet ---- */
  const summaryRows = [
    ['Summary'],
    [],
    ['Total outstanding',   t.totalOutstanding],
    ['Number of bills',     t.countOutstanding],
    ['Average per bill',    t.averageOutstanding],
    ['Overdue total',       t.totalOverdue],
    ['Overdue count',       t.countOverdue],
    ['Overdue %',           `${t.overduePct}%`],
    ['Paid (in dataset)',   t.totalPaid],
    [],
    ['Ageing buckets', 'Amount', '# Bills', '% Share'],
    ...t.ageing.map((b) => [b.label, b.amount, b.count, `${b.pct}%`]),
    [],
    ['Top vendors', 'Amount', '# Bills', '% Share'],
    ...t.byVendor.map((v) => [v.vendor, v.amount, v.count, `${v.pct}%`]),
  ]
  if (data.notes) {
    summaryRows.push([])
    summaryRows.push(['Notes', data.notes])
  }
  const sumSheet = XLSX.utils.aoa_to_sheet(summaryRows)
  sumSheet['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 10 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Summary')

  const fileName = `${(data.companyName || 'accounts-payable').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-ap-report.xlsx`
  XLSX.writeFile(wb, fileName)
}
