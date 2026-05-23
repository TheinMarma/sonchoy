/* ------------------------------------------------------------------ */
/*  Invoice Number Generator — sequential / fiscal / date-based numbers */
/* ------------------------------------------------------------------ */

import { todayISO } from '../invoice/format'
export { todayISO }

/* ---- Constants ---- */

export const NUMBERING_SCHEMES = [
  { id: 'sequential', label: 'Sequential', desc: 'Plain incremental count' },
  { id: 'fiscal',     label: 'Fiscal year', desc: 'Resets each fiscal year' },
  { id: 'calendar',   label: 'Calendar year', desc: 'Resets each Jan 1' },
  { id: 'monthly',    label: 'Year + month', desc: 'Resets each month' },
  { id: 'daily',      label: 'Date stamped', desc: 'YYYYMMDD prefix' },
  { id: 'client',     label: 'Client-coded', desc: 'Includes a per-client tag' },
]

export const FISCAL_YEAR_STARTS = [
  { id: 'apr', label: 'April (India)',     month: 4  },
  { id: 'jan', label: 'January (calendar)', month: 1  },
  { id: 'jul', label: 'July',              month: 7  },
  { id: 'oct', label: 'October (US Fed)',   month: 10 },
]

export const PAD_LENGTHS = [
  { id: '3', label: '3 digits (001)' },
  { id: '4', label: '4 digits (0001)' },
  { id: '5', label: '5 digits (00001)' },
  { id: '6', label: '6 digits (000001)' },
]

export const SEPARATORS = [
  { id: 'dash',  label: '— Dash',       value: '-' },
  { id: 'slash', label: '/ Forward slash', value: '/' },
  { id: 'dot',   label: '. Dot',         value: '.' },
  { id: 'usco',  label: '_ Underscore',  value: '_' },
  { id: 'none',  label: '(none)',        value: ''  },
]

export const CASES = [
  { id: 'upper', label: 'UPPERCASE' },
  { id: 'lower', label: 'lowercase' },
  { id: 'asis',  label: 'As entered' },
]

/* ---- Helpers ---- */

export function findScheme(id)    { return NUMBERING_SCHEMES.find((s) => s.id === id) || NUMBERING_SCHEMES[0] }
export function findFiscalStart(id) { return FISCAL_YEAR_STARTS.find((f) => f.id === id) || FISCAL_YEAR_STARTS[0] }
export function findPad(id)       { return PAD_LENGTHS.find((p) => p.id === String(id)) || PAD_LENGTHS[1] }
export function findSeparator(id) { return SEPARATORS.find((s) => s.id === id) || SEPARATORS[0] }
export function findCase(id)      { return CASES.find((c) => c.id === id) || CASES[0] }

/** Returns 2-letter fiscal-year tag, e.g. "26-27" or just "26".  */
export function fiscalYearTag(iso, fiscalStartMonth) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  const m = d.getMonth() + 1
  const yFull = d.getFullYear()
  // FY starts at fiscalStartMonth. If we're in months before that, FY is yFull-1 → yFull
  const startY = m >= fiscalStartMonth ? yFull : yFull - 1
  const endY   = startY + 1
  if (fiscalStartMonth === 1) {
    return String(startY).slice(-2)
  }
  return `${String(startY).slice(-2)}-${String(endY).slice(-2)}`
}

export function calendarYearTag(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  return String(d.getFullYear())
}

export function monthTag(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  return String(d.getMonth() + 1).padStart(2, '0')
}

export function dailyTag(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function padNum(n, padLen) {
  return String(Math.max(0, Math.floor(Number(n) || 0))).padStart(padLen, '0')
}

function applyCase(s, caseId) {
  if (caseId === 'upper') return s.toUpperCase()
  if (caseId === 'lower') return s.toLowerCase()
  return s
}

/* ---- Core builder ---- */

/**
 * Build a single invoice number for a given sequence index.
 * `index` starts at 0 for the first invoice in the series.
 */
export function buildInvoiceNumber(data, index = 0) {
  const scheme = findScheme(data.schemeId)
  const sep = findSeparator(data.separatorId).value
  const padLen = Number(findPad(data.padId).label.match(/\d+/)?.[0] || 4)
  const start = Math.max(1, Number(data.startNumber) || 1)
  const n = start + index
  const fiscalStart = findFiscalStart(data.fiscalStartId).month
  const issue = data.issueDate || todayISO()

  const tokens = []
  if (data.prefix) tokens.push(data.prefix)

  switch (scheme.id) {
    case 'sequential':
      // prefix + seq
      tokens.push(padNum(n, padLen))
      break
    case 'fiscal':
      tokens.push(fiscalYearTag(issue, fiscalStart))
      tokens.push(padNum(n, padLen))
      break
    case 'calendar':
      tokens.push(calendarYearTag(issue))
      tokens.push(padNum(n, padLen))
      break
    case 'monthly':
      tokens.push(calendarYearTag(issue))
      tokens.push(monthTag(issue))
      tokens.push(padNum(n, padLen))
      break
    case 'daily':
      tokens.push(dailyTag(issue))
      tokens.push(padNum(n, padLen))
      break
    case 'client':
      if (data.clientCode) tokens.push(data.clientCode)
      tokens.push(fiscalYearTag(issue, fiscalStart))
      tokens.push(padNum(n, padLen))
      break
    default:
      tokens.push(padNum(n, padLen))
  }

  if (data.suffix) tokens.push(data.suffix)

  const joined = tokens.filter(Boolean).join(sep)
  return applyCase(joined, data.caseId)
}

/* ---- Series generation ---- */

const MAX_PREVIEW = 100

export function generateSeries(data, count) {
  const n = Math.max(1, Math.min(MAX_PREVIEW, Number(count) || 1))
  const out = []
  for (let i = 0; i < n; i++) {
    out.push({ index: i + 1, number: buildInvoiceNumber(data, i) })
  }
  return out
}

/* ---- Duplicate check against an existing list ---- */

/** Returns the conflicting numbers between `series` and the existing `usedNumbers` list. */
export function findDuplicates(series, usedNumbers) {
  const used = new Set((usedNumbers || []).map((s) => String(s || '').trim()).filter(Boolean))
  const dupes = []
  for (const s of series) {
    if (used.has(s.number)) dupes.push(s.number)
  }
  return dupes
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 3 // header + format + series
  if (data.includeRulesBlock)     n++
  if (data.includeAuditBlock)     n++
  return n
}
