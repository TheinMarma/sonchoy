import * as XLSX from 'xlsx'
import { findCurrency, computeAR, asOfLabel, statusLabel } from './compute'

export function generateARReportXlsx(data) {
  const t = computeAR(data)
  const cur = findCurrency(data.currency)
  const dateLabel = asOfLabel(data)

  const wb = XLSX.utils.book_new()

  /* ---- Invoices sheet (detail) ---- */
  const rows = [
    [`Accounts Receivable Report — ${data.companyName || 'Your Company'}`],
    [`As of: ${dateLabel || '—'}`, '', `Currency: ${cur.code}`],
    [],
    ['#', 'Customer', 'Invoice #', 'Invoice date', 'Due date', 'Days overdue', 'Ageing bucket', 'Status', 'Reference', 'Amount'],
    ...t.invoices.map((iv, i) => [
      i + 1,
      iv.customer || '',
      iv.invoiceNumber || '',
      iv.invoiceDate || '',
      iv.dueDate || '',
      iv.daysOverdue,
      iv.bucketLabel,
      statusLabel(iv.status),
      iv.reference || '',
      Number(iv.amount) || 0,
    ]),
    [],
    ['', '', '', '', '', '', '', '', 'TOTAL RECEIVABLE', t.totalOutstanding],
    ['', '', '', '', '', '', '', '', 'TOTAL PAID',       t.totalPaid],
    ['', '', '', '', '', '', '', '', 'BAD DEBT (W/O)',   t.totalBadDebt],
  ]
  const invSheet = XLSX.utils.aoa_to_sheet(rows)
  invSheet['!cols'] = [
    { wch: 4 }, { wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, invSheet, 'Invoices')

  /* ---- Summary sheet ---- */
  const summaryRows = [
    ['Summary'],
    [],
    ['Total receivable',     t.totalOutstanding],
    ['Number of invoices',   t.countOutstanding],
    ['Average per invoice',  t.averageOutstanding],
    ['Overdue total',        t.totalOverdue],
    ['Overdue count',        t.countOverdue],
    ['Overdue %',            `${t.overduePct}%`],
    ['Disputed total',       t.totalDisputed],
    ['Disputed count',       t.countDisputed],
    [],
    ['DSO (days sales outstanding)', `${t.dso}d`],
    ['Collection rate',              `${t.collectionRate}%`],
    ['Total paid',                   t.totalPaid],
    ['Bad debt (written off)',       t.totalBadDebt],
    [],
    ['Ageing buckets', 'Amount', '# Invoices', '% Share'],
    ...t.ageing.map((b) => [b.label, b.amount, b.count, `${b.pct}%`]),
    [],
    ['Top customers', 'Amount', '# Invoices', '% Share'],
    ...t.byCustomer.map((c) => [c.customer, c.amount, c.count, `${c.pct}%`]),
  ]
  if (data.notes) {
    summaryRows.push([])
    summaryRows.push(['Notes', data.notes])
  }
  const sumSheet = XLSX.utils.aoa_to_sheet(summaryRows)
  sumSheet['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 12 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Summary')

  const fileName = `${(data.companyName || 'accounts-receivable').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-ar-report.xlsx`
  XLSX.writeFile(wb, fileName)
}
