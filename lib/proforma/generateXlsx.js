import * as XLSX from 'xlsx'
import { findCurrency, computeTotals, formatDate } from './format'

export function generateProformaXlsx(pf) {
  const { items, taxRate, taxLabel, currency } = pf
  const { subtotal, tax, total } = computeTotals(items, taxRate)
  const cur = findCurrency(currency)

  const rows = [
    [`PROFORMA INVOICE — ${pf.number || ''}`],
    ['Not a tax invoice · Not a demand for payment'],
    [],
    ['From',    pf.fromName || ''],
    ['Address', String(pf.fromAddress || '').replace(/\n/g, ', ')],
    ['Prepared for', pf.toName || ''],
    ['Address',      String(pf.toAddress || '').replace(/\n/g, ', ')],
    [],
    ['Issue date',       formatDate(pf.issueDate)],
    ['Valid until',      formatDate(pf.validUntil)],
    ['Expected delivery', formatDate(pf.expectedDelivery)],
    ['Currency',         cur.code],
    [],
    ['Description', 'Qty', 'Rate', 'Amount'],
    ...items.map((it) => {
      const qty  = Number(it.qty)  || 0
      const rate = Number(it.rate) || 0
      return [it.description || '', qty, rate, qty * rate]
    }),
    [],
    ['', '', 'Subtotal', subtotal],
    ...(taxRate > 0 ? [['', '', `${taxLabel || 'Tax'} (estimated)`, tax]] : []),
    ['', '', 'Estimated total', total],
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 40 }, { wch: 8 }, { wch: 14 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Proforma')

  const fileName = `${(pf.number || 'proforma').replace(/[^a-z0-9-]+/gi, '_')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
