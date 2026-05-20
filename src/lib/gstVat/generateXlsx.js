import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate, findRegime, computeLine, computeTotals,
} from './format'

export function generateGstVatXlsx(invoice) {
  const regime = findRegime(invoice.regimeId)
  const totals = computeTotals(invoice.items, regime, invoice.placeOfSupply)
  const cur = findCurrency(invoice.currency)
  const isReverseCharge = !!invoice.reverseCharge

  const wb = XLSX.utils.book_new()

  const headerRows = [
    [`${regime.docHeader} — ${regime.label}`],
    ...(isReverseCharge ? [['REVERSE CHARGE — Recipient liable for tax']] : []),
    [],
    ['Invoice number', invoice.number],
    ['Issue date',     formatDate(invoice.issueDate)],
    ['Due date',       formatDate(invoice.dueDate)],
    ['Currency',       cur.code],
    ...(regime.needsPlaceOfSupply ? [['Place of supply', invoice.placeOfSupply === 'inter' ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)']] : []),
    ['Reverse charge', isReverseCharge ? 'Yes' : 'No'],
    [],
    ['Supplier', invoice.supplierName],
    ['Address',  String(invoice.supplierAddress || '').replace(/\n/g, ', ')],
    [regime.taxIdLabel, invoice.supplierTaxId || ''],
    [],
    ['Recipient', invoice.buyerName],
    ['Address',   String(invoice.buyerAddress || '').replace(/\n/g, ', ')],
    [regime.taxIdLabel, invoice.buyerTaxId || ''],
    [],
  ]

  const itemHeader = regime.needsHsn
    ? ['#', 'Description', regime.hsnLabel, 'Qty', 'Rate', 'Taxable', 'Tax %', 'Tax', 'Amount']
    : ['#', 'Description', 'Qty', 'Rate', 'Taxable', 'Tax %', 'Tax', 'Amount']

  const itemRows = invoice.items.map((it, i) => {
    const ln = computeLine(it, regime, invoice.placeOfSupply)
    const base = [i + 1, it.description || '']
    if (regime.needsHsn) base.push(it.hsn || '')
    base.push(
      Number(it.qty) || 0,
      Number(it.rate) || 0,
      ln.taxable,
      isReverseCharge ? '—' : `${Number(it.taxRate) || 0}%`,
      isReverseCharge ? 0 : ln.tax,
      isReverseCharge ? ln.taxable : ln.total,
    )
    return base
  })

  const taxLines = isReverseCharge
    ? [['', '', '', '', 'Tax (reverse charge)', 0]]
    : regime.id === 'gst-in'
      ? (invoice.placeOfSupply === 'inter'
          ? [['', '', '', '', 'IGST', totals.igst]]
          : [['', '', '', '', 'CGST', totals.cgst], ['', '', '', '', 'SGST', totals.sgst]])
      : [['', '', '', '', 'VAT', totals.vat]]

  const totalsRows = [
    [],
    ...(!isReverseCharge && totals.byRate.length > 0
      ? [
          ['Tax breakdown by rate'],
          ['Rate', 'Taxable', 'Tax'],
          ...totals.byRate.map((r) => [`${r.rate}%`, r.taxable, r.tax]),
          [],
        ]
      : []),
    ['', '', '', '', 'Subtotal (taxable)', totals.subtotal],
    ...taxLines,
    ['', '', '', '', 'Total payable', isReverseCharge ? totals.subtotal : totals.grandTotal],
    ...(isReverseCharge && regime.reverseChargeNote ? [[], ['Note', regime.reverseChargeNote]] : []),
  ]

  const rows = [...headerRows, itemHeader, ...itemRows, ...totalsRows]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = regime.needsHsn
    ? [{ wch: 4 }, { wch: 36 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 14 }]
    : [{ wch: 4 }, { wch: 40 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 14 }]

  XLSX.utils.book_append_sheet(wb, ws, regime.id === 'gst-in' ? 'GST Invoice' : 'VAT Invoice')

  const fileName = `${(invoice.number || 'gst-vat-invoice').replace(/[^a-z0-9-]+/gi, '_')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
