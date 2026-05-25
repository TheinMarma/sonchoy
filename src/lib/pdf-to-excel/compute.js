/* ------------------------------------------------------------------ */
/*  PDF to Excel — config helpers                                        */
/*                                                                       */
/*  Re-uses the row + column detector from the PDF-to-CSV tool so the   */
/*  table-extraction behaviour is consistent across both. The XLSX      */
/*  builder lives in `buildXlsx.js`.                                     */
/* ------------------------------------------------------------------ */

export const PAGE_MODES = [
  { id: 'all_one_sheet',  label: 'All pages → one sheet'  },
  { id: 'sheet_per_page', label: 'One sheet per page'      },
  { id: 'range_one_sheet', label: 'Custom range → one sheet' },
]

export const HEADER_MODES = [
  { id: 'first_row',  label: 'First detected row is the header' },
  { id: 'numbered',   label: 'No header — number columns col1, col2…' },
  { id: 'none',       label: 'No header row at all' },
]

export const ROW_TOLERANCE_PRESETS = [
  { id: 'tight',  label: 'Tight (2pt)',   pt: 2 },
  { id: 'normal', label: 'Normal (4pt)',  pt: 4 },
  { id: 'loose',  label: 'Loose (8pt)',   pt: 8 },
]

export const COL_TOLERANCE_PRESETS = [
  { id: 'tight',  label: 'Tight (4pt)',   pt: 4 },
  { id: 'normal', label: 'Normal (10pt)', pt: 10 },
  { id: 'loose',  label: 'Loose (20pt)',  pt: 20 },
]

export const NUMBER_MODES = [
  { id: 'auto',  label: 'Auto-detect numbers (recommended)' },
  { id: 'text',  label: 'Keep all cells as text' },
]

export function findPageMode(id)     { return PAGE_MODES.find((p) => p.id === id) || PAGE_MODES[0] }
export function findHeaderMode(id)   { return HEADER_MODES.find((h) => h.id === id) || HEADER_MODES[0] }
export function findRowTolerance(id) { return ROW_TOLERANCE_PRESETS.find((r) => r.id === id) || ROW_TOLERANCE_PRESETS[1] }
export function findColTolerance(id) { return COL_TOLERANCE_PRESETS.find((c) => c.id === id) || COL_TOLERANCE_PRESETS[1] }
export function findNumberMode(id)   { return NUMBER_MODES.find((n) => n.id === id) || NUMBER_MODES[0] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / (1024 * 1024)).toFixed(2)} MB`
}

/* Re-export the bits we need from the CSV compute module so the page
   doesn't have to import from two places. */
export {
  parseRanges,
  extractTableFromPage,
  applyHeaderMode,
  previewRows,
} from '../pdf-to-csv/compute'

/* ---- Numeric-cell coercion ----------------------------------------
 * Real spreadsheets benefit when extracted numbers become number-typed
 * cells (so they sum, sort numerically, and respect format). We try to
 * detect numbers using a few common locale shapes:
 *   "1,234.56"  / "1234.56"    → 1234.56
 *   "1.234,56"  (EU decimal)   → 1234.56
 *   "(1,234.56)" (accounting)  → -1234.56
 *   "12.5%"                    → 0.125  (with % format applied)
 * Anything else stays a string. ------------------------------------- */
export function coerceCell(str) {
  if (str == null) return { v: '', t: 's' }
  const raw = String(str).trim()
  if (raw === '') return { v: '', t: 's' }

  // Accounting negatives "(123.45)" → "-123.45"
  let s = raw
  let negative = false
  const accountingMatch = s.match(/^\((.+)\)$/)
  if (accountingMatch) { s = accountingMatch[1]; negative = true }

  // Strip leading currency symbols / common prefixes (₹, $, €, £, ¥, INR, USD, GBP, EUR)
  s = s.replace(/^(?:[₠-⃏$£¥₹]|INR|USD|GBP|EUR|JPY|AUD|CAD)\s*/i, '')

  // Trailing percent
  const isPct = /%$/.test(s)
  if (isPct) s = s.replace(/%\s*$/, '').trim()

  // Bail if the leftover contains non-numeric chars (besides digits, ., ,, -)
  if (!/^-?[\d.,]+$/.test(s)) return { v: raw, t: 's' }

  // Heuristic for comma-as-decimal: if the last separator is a comma and there's no
  // dot after it, treat comma as decimal. Otherwise comma is a thousands separator.
  const lastDot   = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  let normalised
  if (lastComma > lastDot) {
    // EU style — comma is decimal, dots are thousands
    normalised = s.replace(/\./g, '').replace(',', '.')
  } else {
    // US/UK style — dot is decimal, commas are thousands
    normalised = s.replace(/,/g, '')
  }

  const num = parseFloat(normalised)
  if (!Number.isFinite(num)) return { v: raw, t: 's' }

  const value = (negative ? -1 : 1) * num
  if (isPct) {
    return { v: value / 100, t: 'n', z: '0.00%' }
  }
  return { v: value, t: 'n' }
}
