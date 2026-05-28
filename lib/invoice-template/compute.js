/* ------------------------------------------------------------------ */
/*  Invoice Template Builder — reusable branded layout                  */
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

/* ---- Style presets ---- */

export const LAYOUTS = [
  { id: 'classic', label: 'Classic',  desc: 'Brand left, invoice block right' },
  { id: 'modern',  label: 'Modern',   desc: 'Big invoice title up top, brand inline' },
  { id: 'compact', label: 'Compact',  desc: 'Tight header, more room for line items' },
  { id: 'bold',    label: 'Bold',     desc: 'Coloured header band across the page' },
]

export const FONTS = [
  { id: 'helvetica', label: 'Helvetica · clean sans' },
  { id: 'times',     label: 'Times · classic serif' },
  { id: 'courier',   label: 'Courier · monospaced' },
]

export const ACCENT_STYLES = [
  { id: 'stripe', label: 'Top stripe', desc: '6pt band at the top of the page' },
  { id: 'band',   label: 'Header band', desc: 'Coloured background behind your name' },
  { id: 'rule',   label: 'Thin rule',   desc: '1pt line below the header' },
  { id: 'none',   label: 'None',        desc: 'No accent decoration' },
]

export const TABLE_STYLES = [
  { id: 'filled',   label: 'Filled header', desc: 'Coloured header row in your accent' },
  { id: 'outlined', label: 'Outlined',      desc: 'Thin borders, no fill' },
  { id: 'minimal',  label: 'Minimal lines', desc: 'Horizontal rules only' },
]

export const DATE_FORMATS = [
  { id: 'iso',       label: 'YYYY-MM-DD (ISO)',         fmt: (d) => d || '' },
  { id: 'long',      label: '23 May 2026',              fmt: (d) => longDate(d) },
  { id: 'us',        label: 'MM/DD/YYYY',                fmt: (d) => usDate(d) },
  { id: 'eu',        label: 'DD/MM/YYYY',                fmt: (d) => euDate(d) },
  { id: 'us_short',  label: 'Mon DD, YYYY',              fmt: (d) => usShortDate(d) },
]

export const SHOW_TAX_OPTIONS = [
  { id: 'per_line',   label: 'Per-line tax %' },
  { id: 'summary',    label: 'Single tax row at total' },
  { id: 'both',       label: 'Per-line + summary breakdown' },
  { id: 'none',       label: 'No tax shown' },
]

/* ---- Helpers ---- */

export function findLayout(id)       { return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0] }
export function findFont(id)         { return FONTS.find((f) => f.id === id) || FONTS[0] }
export function findAccentStyle(id)  { return ACCENT_STYLES.find((a) => a.id === id) || ACCENT_STYLES[0] }
export function findTableStyle(id)   { return TABLE_STYLES.find((t) => t.id === id) || TABLE_STYLES[0] }
export function findDateFormat(id)   { return DATE_FORMATS.find((d) => d.id === id) || DATE_FORMATS[1] }
export function findShowTaxOption(id){ return SHOW_TAX_OPTIONS.find((s) => s.id === id) || SHOW_TAX_OPTIONS[2] }

const MONTHS_LONG  = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseISO(d) {
  if (!d) return null
  const dt = new Date(d)
  if (Number.isNaN(dt.valueOf())) return null
  return dt
}
function longDate(d) {
  const dt = parseISO(d); if (!dt) return ''
  return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()}`
}
function usDate(d) {
  const dt = parseISO(d); if (!dt) return ''
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${m}/${dd}/${dt.getFullYear()}`
}
function euDate(d) {
  const dt = parseISO(d); if (!dt) return ''
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dd}/${m}/${dt.getFullYear()}`
}
function usShortDate(d) {
  const dt = parseISO(d); if (!dt) return ''
  return `${MONTHS_SHORT[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`
}
void MONTHS_LONG

/* ---- Hex colour helpers ---- */

export function hexToRgb(hex) {
  if (!hex) return [180, 110, 5]
  const h = hex.replace('#', '').trim()
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  }
  if (h.length !== 6) return [180, 110, 5]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Approximate WCAG luminance — used to pick black/white text on the accent. */
export function isAccentDark(hex) {
  const [r, g, b] = hexToRgb(hex)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum < 0.55
}

/* ---- Sample math ---- */

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

export function computeSampleTotals(data) {
  const lines = (data.sampleItems || []).map((it) => {
    const qty   = Number(it.qty)   || 0
    const rate  = Number(it.rate)  || 0
    const taxPct = Number(it.taxPct) || 0
    const gross = round2(qty * rate)
    const tax   = round2(gross * taxPct / 100)
    return { ...it, qty, rate, taxPct, gross, tax, total: round2(gross + tax) }
  })
  const subtotal = round2(lines.reduce((s, l) => s + l.gross, 0))
  const totalTax = round2(lines.reduce((s, l) => s + l.tax, 0))
  const grandTotal = round2(subtotal + totalTax)
  return { lines, subtotal, totalTax, grandTotal }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 4 // brand + accent + typography + sample
  if (data.includeFooter)         n++
  if (data.includeWatermark)      n++
  if (data.includePaymentBlock)   n++
  return n
}
