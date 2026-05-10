import * as XLSX from 'xlsx'
import { findCurrency, computeTotals, formatDate } from './format'

export function generateInvoiceXlsx(invoice) {
  const { items, taxRate, taxLabel, currency } = invoice
  const { subtotal, tax, total } = computeTotals(items, taxRate)
  const cur = findCurrency(currency)

  const rows = [
    [`Invoice ${invoice.number || ''}`],
    [],
    ['From',    invoice.fromName || ''],
    ['Address', String(invoice.fromAddress || '').replace(/\n/g, ', ')],
    ['Bill to', invoice.toName || ''],
    ['Address', String(invoice.toAddress || '').replace(/\n/g, ', ')],
    [],
    ['Issue date', formatDate(invoice.issueDate)],
    ['Due date',   formatDate(invoice.dueDate)],
    ['Currency',   cur.code],
    [],
    ['Description', 'Qty', 'Rate', 'Amount'],
    ...items.map((it) => {
      const qty  = Number(it.qty)  || 0
      const rate = Number(it.rate) || 0
      return [it.description || '', qty, rate, qty * rate]
    }),
    [],
    ['', '', 'Subtotal', subtotal],
    ...(taxRate > 0 ? [['', '', taxLabel || 'Tax', tax]] : []),
    ['', '', 'Total due', total],
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 36 }, { wch: 8 }, { wch: 14 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Invoice')

  const fileName = `${(invoice.number || 'invoice').replace(/[^a-z0-9-]+/gi, '_')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
