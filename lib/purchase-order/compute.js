/* ------------------------------------------------------------------ */
/*  Purchase Order Generator — buyer-issued PO with delivery & terms    */
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

export const PO_STATUSES = [
  { id: 'draft',     label: 'Draft',         tone: 'muted'   },
  { id: 'sent',      label: 'Sent to vendor', tone: 'info'   },
  { id: 'confirmed', label: 'Confirmed',      tone: 'success' },
  { id: 'partial',   label: 'Partially shipped', tone: 'warning' },
  { id: 'received',  label: 'Received',       tone: 'success' },
  { id: 'cancelled', label: 'Cancelled',      tone: 'danger' },
]

export const PO_TYPES = [
  { id: 'standard',  label: 'Standard PO',   desc: 'One-off purchase, fixed scope' },
  { id: 'blanket',   label: 'Blanket PO',    desc: 'Recurring drawdown over a period' },
  { id: 'contract',  label: 'Contract PO',   desc: 'Long-term agreement, fixed pricing' },
  { id: 'service',   label: 'Service PO',    desc: 'Labour or services, no goods' },
]

export const DELIVERY_TERMS = [
  { id: 'fob_dest',  label: 'FOB Destination',   desc: 'Vendor pays freight; risk transfers on delivery' },
  { id: 'fob_orig',  label: 'FOB Origin',        desc: 'Buyer pays freight; risk transfers at pickup' },
  { id: 'exw',       label: 'EXW (Ex-Works)',    desc: 'Buyer collects from vendor premises' },
  { id: 'cif',       label: 'CIF',                desc: 'Vendor pays cost, insurance, freight' },
  { id: 'ddp',       label: 'DDP (Delivered Duty Paid)', desc: 'Vendor handles delivery & all duties' },
  { id: 'custom',    label: 'Custom terms',       desc: 'Specify in notes / terms block' },
]

export const PAYMENT_TERMS = [
  { id: 'net_15',    label: 'Net 15',         days: 15 },
  { id: 'net_30',    label: 'Net 30',         days: 30 },
  { id: 'net_45',    label: 'Net 45',         days: 45 },
  { id: 'net_60',    label: 'Net 60',         days: 60 },
  { id: 'cod',       label: 'COD',            days: 0  },
  { id: 'advance',   label: 'Advance payment', days: 0 },
  { id: '50_50',     label: '50% advance / 50% on delivery', days: 0 },
]

export const DISCOUNT_TYPES = [
  { id: 'none',    label: 'No discount' },
  { id: 'percent', label: 'Percentage' },
  { id: 'flat',    label: 'Flat amount' },
]

/* ---- Helpers ---- */

export function findPoStatus(id) { return PO_STATUSES.find((s) => s.id === id) || PO_STATUSES[0] }
export function findPoType(id) { return PO_TYPES.find((t) => t.id === id) || PO_TYPES[0] }
export function findDeliveryTerm(id) { return DELIVERY_TERMS.find((d) => d.id === id) || DELIVERY_TERMS[0] }
export function findPaymentTerm(id) { return PAYMENT_TERMS.find((p) => p.id === id) || PAYMENT_TERMS[1] }
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
 * Each line: { description, sku, qty, unit, rate, discount (flat), taxPct }
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

  // PO-level discount
  const discountType = findDiscountType(data.poDiscountType)
  let poDiscount = 0
  if (discountType.id === 'percent') {
    poDiscount = round2(subtotal * (Number(data.poDiscountValue) || 0) / 100)
  } else if (discountType.id === 'flat') {
    poDiscount = round2(Math.min(Number(data.poDiscountValue) || 0, subtotal))
  }

  const afterDiscount = round2(subtotal - poDiscount)
  const shipping = round2(Math.max(0, Number(data.shipping) || 0))
  const adjustment = round2(Number(data.adjustment) || 0)

  const grandTotal = round2(afterDiscount + totalTax + shipping + adjustment)

  const totalQty = round2(lines.reduce((s, l) => s + (Number(l.qty) || 0), 0))

  return {
    lines,
    subtotal,
    lineDiscounts,
    poDiscount,
    afterDiscount,
    totalTax,
    shipping,
    adjustment,
    grandTotal,
    totalQty,
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
  let n = 4 // header + buyer/vendor + ship-to + line items
  if (data.includeDeliveryBlock)  n++
  if (data.includeTermsBlock)     n++
  if (data.includeNotesBlock)     n++
  if (data.includeSignatureBlock) n++
  return n
}
