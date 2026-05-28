/* SheetJS-backed XLSX export. Three sheets:
   - Line Items (the meat)
   - Header (vendor / buyer / totals)
   - Confidence (per-field score so reviewers know what to spot-check) */

import * as XLSX from 'xlsx'

function fmt(value) {
  if (value == null || value === '') return ''
  return value
}

export function buildWorkbook(invoice) {
  const wb = XLSX.utils.book_new()

  /* ---- Line Items ---- */
  const itemRows = [
    ['#', 'Description', 'Quantity', 'Unit Price', 'Amount'],
    ...invoice.lineItems.map((it, i) => [
      i + 1,
      fmt(it.description),
      fmt(it.quantity),
      fmt(it.unitPrice),
      fmt(it.total),
    ]),
  ]
  if (invoice.lineItems.length === 0) {
    itemRows.push(['', 'No line items detected — verify the source PDF', '', '', ''])
  }
  const itemsSheet = XLSX.utils.aoa_to_sheet(itemRows)
  itemsSheet['!cols'] = [
    { wch: 4 }, { wch: 60 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, itemsSheet, 'Line Items')

  /* ---- Header / Summary ---- */
  const headerRows = [
    ['Field', 'Value'],
    ['Invoice number', fmt(invoice.invoiceNumber)],
    ['Issue date', fmt(invoice.issueDate)],
    ['Due date', fmt(invoice.dueDate)],
    ['Currency', fmt(invoice.currency)],
    ['Vendor', fmt(invoice.vendor)],
    ['Bill to', fmt(invoice.buyer)],
    [],
    ['Subtotal', fmt(invoice.subtotal)],
    ['Discount', fmt(invoice.discount)],
    ['Shipping', fmt(invoice.shipping)],
    ['Tax', fmt(invoice.tax)],
    ['Total', fmt(invoice.total)],
    [],
    ['Source file', fmt(invoice.fileName)],
    ['Extracted by', 'Sonchoy · Invoice PDF to Excel'],
    ['Generated at', new Date().toISOString()],
  ]
  const headerSheet = XLSX.utils.aoa_to_sheet(headerRows)
  headerSheet['!cols'] = [{ wch: 22 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, headerSheet, 'Header')

  /* ---- Confidence ---- */
  const presence = (v) => (v == null || v === '' ? 'missing' : 'detected')
  const confRows = [
    ['Field', 'Status', 'Value'],
    ['Invoice number', presence(invoice.invoiceNumber), fmt(invoice.invoiceNumber)],
    ['Issue date',     presence(invoice.issueDate),     fmt(invoice.issueDate)],
    ['Due date',       presence(invoice.dueDate),       fmt(invoice.dueDate)],
    ['Currency',       presence(invoice.currency),      fmt(invoice.currency)],
    ['Vendor',         presence(invoice.vendor),        fmt(invoice.vendor)],
    ['Bill to',        presence(invoice.buyer),         fmt(invoice.buyer)],
    ['Subtotal',       presence(invoice.subtotal),      fmt(invoice.subtotal)],
    ['Tax',            presence(invoice.tax),           fmt(invoice.tax)],
    ['Total',          presence(invoice.total),         fmt(invoice.total)],
    ['Line items',     invoice.lineItems.length > 0 ? 'detected' : 'missing', `${invoice.lineItems.length} rows`],
    [],
    ['Overall confidence', `${invoice.confidence}%`, ''],
  ]
  const confSheet = XLSX.utils.aoa_to_sheet(confRows)
  confSheet['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, confSheet, 'Confidence')

  /* ---- Raw Text (fallback so user always has the source text) ---- */
  if (invoice.rawText) {
    const rawLines = String(invoice.rawText).split('\n').map((l, i) => [i + 1, l])
    rawLines.unshift(['Line', 'Text'])
    const rawSheet = XLSX.utils.aoa_to_sheet(rawLines)
    rawSheet['!cols'] = [{ wch: 6 }, { wch: 100 }]
    XLSX.utils.book_append_sheet(wb, rawSheet, 'Raw Text')
  }

  return wb
}

export function writeWorkbookBlob(wb) {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function downloadWorkbook(wb, filename = 'invoice.xlsx') {
  const blob = writeWorkbookBlob(wb)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Suggested filename: original-stem + ".xlsx" (or fallback). */
export function suggestedFilename(originalName) {
  if (!originalName) return 'invoice.xlsx'
  const stem = originalName.replace(/\.pdf$/i, '').replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 80)
  return `${stem || 'invoice'}.xlsx`
}
