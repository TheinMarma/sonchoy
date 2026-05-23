/* ------------------------------------------------------------------ */
/*  Invoice PDF Exporter — bulk-render many drafts into one archive PDF */
/* ------------------------------------------------------------------ */

import {
  CURRENCIES, findCurrency,
  formatMoney, formatNumber, formatDate,
  todayISO,
} from '../invoice/format'

export {
  CURRENCIES, findCurrency,
  formatMoney, formatNumber, formatDate,
  todayISO,
}

/* ---- Constants ---- */

export const EXPORT_MODES = [
  { id: 'one_pdf',   label: 'Single multi-page PDF', desc: 'All invoices in one file (best for archives)' },
  { id: 'cover_only', label: 'Cover sheet only',     desc: 'Manifest + summary, no per-invoice pages' },
]

export const PAGE_SIZES = [
  { id: 'a4',     label: 'A4 (210 × 297 mm)' },
  { id: 'letter', label: 'US Letter (8.5 × 11 in)' },
]

export const SORT_OPTIONS = [
  { id: 'as_entered',    label: 'As entered' },
  { id: 'invoice_asc',   label: 'Invoice # — ascending' },
  { id: 'invoice_desc',  label: 'Invoice # — descending' },
  { id: 'date_asc',      label: 'Issue date — oldest first' },
  { id: 'date_desc',     label: 'Issue date — newest first' },
  { id: 'client',        label: 'Client name (A–Z)' },
  { id: 'amount_desc',   label: 'Amount — largest first' },
]

export const PARSE_FORMATS = [
  { id: 'csv', label: 'CSV (comma-separated)' },
  { id: 'tsv', label: 'TSV (tab-separated)' },
]

/* ---- Helpers ---- */

export function findExportMode(id) { return EXPORT_MODES.find((m) => m.id === id) || EXPORT_MODES[0] }
export function findPageSize(id)   { return PAGE_SIZES.find((p) => p.id === id) || PAGE_SIZES[0] }
export function findSortOption(id) { return SORT_OPTIONS.find((s) => s.id === id) || SORT_OPTIONS[0] }
export function findParseFormat(id){ return PARSE_FORMATS.find((p) => p.id === id) || PARSE_FORMATS[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- CSV / TSV parser ---- */

/**
 * Parse a pasted list of invoices into rows.
 * Columns (in order): invoiceNumber, issueDate, dueDate, clientName, description, qty, rate, taxPct, status
 * - First row may be a header (auto-detected if first cell is non-numeric and contains 'invoice')
 * - qty / rate / taxPct default to 1 / amount / 0 when missing
 */
export function parseRows(text, formatId = 'csv') {
  if (!text) return { rows: [], headerSkipped: false, errors: [] }
  const sep = formatId === 'tsv' ? '\t' : ','
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  const errors = []
  let headerSkipped = false

  // Auto-detect header: first line cells contain non-numeric values and mention 'invoice'/'inv'
  const first = lines[0]?.toLowerCase() || ''
  if (first.includes('invoice') && first.includes(',')) headerSkipped = true
  else if (first.includes('invoice') && first.includes('\t')) headerSkipped = true

  const dataLines = headerSkipped ? lines.slice(1) : lines

  const rows = dataLines.map((line, i) => {
    const cells = splitCsvLine(line, sep)
    const row = {
      id: i + 1,
      invoiceNumber: (cells[0] || '').trim(),
      issueDate:     (cells[1] || '').trim(),
      dueDate:       (cells[2] || '').trim(),
      clientName:    (cells[3] || '').trim(),
      description:   (cells[4] || '').trim(),
      qty:           Number(cells[5]) || 1,
      rate:          Number(cells[6]) || 0,
      taxPct:        Number(cells[7]) || 0,
      status:        (cells[8] || 'draft').trim().toLowerCase(),
    }
    if (!row.invoiceNumber && !row.clientName && row.rate === 0) {
      errors.push(`Line ${i + 1}: empty row`)
      return null
    }
    if (!row.invoiceNumber) errors.push(`Line ${i + 1}: missing invoice number`)
    if (!row.clientName)    errors.push(`Line ${i + 1}: missing client name`)
    return row
  }).filter(Boolean)

  return { rows, headerSkipped, errors }
}

/** Very simple CSV split that handles quoted cells. */
function splitCsvLine(line, sep) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (c === sep && !inQuotes) {
      out.push(cur); cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

/* ---- Sorting + totals ---- */

export function sortRows(rows, sortId) {
  const copy = [...rows]
  switch (sortId) {
    case 'invoice_asc':  return copy.sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true }))
    case 'invoice_desc': return copy.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber, undefined, { numeric: true }))
    case 'date_asc':     return copy.sort((a, b) => (a.issueDate || '').localeCompare(b.issueDate || ''))
    case 'date_desc':    return copy.sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''))
    case 'client':       return copy.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''))
    case 'amount_desc':  return copy.sort((a, b) => totalForRow(b) - totalForRow(a))
    default:             return copy
  }
}

export function totalForRow(row) {
  const qty = Number(row.qty)   || 0
  const rate = Number(row.rate) || 0
  const taxPct = Number(row.taxPct) || 0
  const gross = qty * rate
  const tax = gross * taxPct / 100
  return round2(gross + tax)
}

export function computeBatchTotals(rows) {
  let subtotal = 0, tax = 0, total = 0
  for (const r of rows) {
    const q = Number(r.qty) || 0
    const ra = Number(r.rate) || 0
    const t = Number(r.taxPct) || 0
    const g = q * ra
    subtotal += g
    tax += g * t / 100
    total += g + g * t / 100
  }
  return {
    invoices: rows.length,
    subtotal: round2(subtotal),
    tax:      round2(tax),
    total:    round2(total),
  }
}

export function buildStatusSummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const s = (r.status || 'draft').toLowerCase()
    const acc = map.get(s) || { status: s, count: 0, total: 0 }
    acc.count += 1
    acc.total += totalForRow(r)
    map.set(s, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, total: round2(a.total) }))
    .sort((a, b) => b.total - a.total)
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 3 // cover + manifest + per-invoice pages
  if (data.includeStatusSummary) n++
  if (data.includeNotesBlock)    n++
  return n
}
