/* ------------------------------------------------------------------ */
/*  Quotation Generator — itemised quotes with validity                 */
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

export const QUOTE_STATUSES = [
  { id: 'draft',    label: 'Draft',         tone: 'muted'   },
  { id: 'sent',     label: 'Sent to client', tone: 'info'    },
  { id: 'accepted', label: 'Accepted',       tone: 'success' },
  { id: 'rejected', label: 'Rejected',       tone: 'danger'  },
  { id: 'expired',  label: 'Expired',        tone: 'warning' },
]

export const VALIDITY_PRESETS = [
  { id: '7',   label: '7 days',  days: 7  },
  { id: '14',  label: '14 days', days: 14 },
  { id: '30',  label: '30 days', days: 30 },
  { id: '60',  label: '60 days', days: 60 },
  { id: '90',  label: '90 days', days: 90 },
]

export const DISCOUNT_TYPES = [
  { id: 'none',    label: 'No discount' },
  { id: 'percent', label: 'Percentage' },
  { id: 'flat',    label: 'Flat amount' },
]

/* ---- Helpers ---- */

export function findQuoteStatus(id) { return QUOTE_STATUSES.find((s) => s.id === id) || QUOTE_STATUSES[0] }
export function findValidityPreset(id) { return VALIDITY_PRESETS.find((p) => p.id === id) || VALIDITY_PRESETS[2] }
export function findDiscountType(id) { return DISCOUNT_TYPES.find((d) => d.id === id) || DISCOUNT_TYPES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** Add N days to ISO date → ISO date. */
export function addDays(iso, days) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

/* ---- Core computation ---- */

/**
 * Each line: { description, qty, rate, discount (flat), taxPct }
 */
export function computeLineAmount(line) {
  const qty = Number(line.qty) || 0
  const rate = Number(line.rate) || 0
  const discount = Number(line.discount) || 0
  const taxPct = Number(line.taxPct) || 0

  const gross = round2(qty * rate)
  const discounted = round2(gross - discount)
  const tax = round2(discounted * taxPct / 100)
  const total = round2(discounted + tax)
  return { gross, discount: round2(discount), discounted, tax, total }
}

export function computeTotals(data) {
  const lines = (data.items || []).map((it) => ({ ...it, ...computeLineAmount(it) }))

  const subtotal = round2(lines.reduce((s, l) => s + l.discounted, 0))
  const lineDiscounts = round2(lines.reduce((s, l) => s + l.discount, 0))
  const totalTax = round2(lines.reduce((s, l) => s + l.tax, 0))

  // Quote-level discount
  const discountType = findDiscountType(data.quoteDiscountType)
  let quoteDiscount = 0
  if (discountType.id === 'percent') {
    quoteDiscount = round2(subtotal * (Number(data.quoteDiscountValue) || 0) / 100)
  } else if (discountType.id === 'flat') {
    quoteDiscount = round2(Math.min(Number(data.quoteDiscountValue) || 0, subtotal))
  }

  const afterDiscount = round2(subtotal - quoteDiscount)
  const shipping = round2(Math.max(0, Number(data.shipping) || 0))
  const adjustment = round2(Number(data.adjustment) || 0)

  const grandTotal = round2(afterDiscount + totalTax + shipping + adjustment)

  // Validity
  const preset = findValidityPreset(data.validityPresetId)
  const validityDays = data.validityCustomDays != null && data.validityCustomDays !== ''
    ? Math.max(0, Number(data.validityCustomDays) || 0)
    : preset.days
  const expiryDate = addDays(data.quoteDate, validityDays)

  return {
    lines,
    subtotal,
    lineDiscounts,
    quoteDiscount,
    afterDiscount,
    totalTax,
    shipping,
    adjustment,
    grandTotal,
    validityDays,
    expiryDate,
  }
}

/** Tax-rate rollup. */
export function buildTaxSummary(lines) {
  const map = new Map()
  for (const l of lines) {
    if (!l.taxPct || l.taxPct <= 0) continue
    const key = String(l.taxPct)
    const acc = map.get(key) || { ratePct: Number(l.taxPct), taxable: 0, tax: 0, count: 0 }
    acc.taxable += l.discounted
    acc.tax     += l.tax
    acc.count   += 1
    map.set(key, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, taxable: round2(a.taxable), tax: round2(a.tax) }))
    .sort((a, b) => a.ratePct - b.ratePct)
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 3 // header + parties + line items
  if (data.includeTermsBlock)   n++
  if (data.includeNotesBlock)   n++
  if (data.includeSignatureBlock) n++
  return n
}
