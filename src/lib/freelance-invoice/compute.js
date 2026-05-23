/* ------------------------------------------------------------------ */
/*  Freelance Invoice Generator — hours, day rates, retainers           */
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

export const RATE_TYPES = [
  { id: 'hourly',    label: 'Hourly',     unit: 'hr'    },
  { id: 'daily',     label: 'Day rate',   unit: 'day'   },
  { id: 'fixed',     label: 'Fixed fee',  unit: 'fee'   },
  { id: 'retainer',  label: 'Retainer',   unit: 'month' },
  { id: 'milestone', label: 'Milestone',  unit: 'item'  },
  { id: 'expense',   label: 'Expense',    unit: 'item'  },
]

export const INVOICE_STATUSES = [
  { id: 'draft',     label: 'Draft',         tone: 'muted'   },
  { id: 'sent',      label: 'Sent',          tone: 'info'    },
  { id: 'viewed',    label: 'Viewed',        tone: 'info'    },
  { id: 'paid',      label: 'Paid',          tone: 'success' },
  { id: 'overdue',   label: 'Overdue',       tone: 'danger'  },
  { id: 'partial',   label: 'Partially paid', tone: 'warning' },
]

export const PAYMENT_TERMS = [
  { id: 'due_receipt', label: 'Due on receipt', days: 0  },
  { id: 'net_7',       label: 'Net 7',          days: 7  },
  { id: 'net_14',      label: 'Net 14',         days: 14 },
  { id: 'net_15',      label: 'Net 15',         days: 15 },
  { id: 'net_30',      label: 'Net 30',         days: 30 },
  { id: 'net_45',      label: 'Net 45',         days: 45 },
  { id: 'net_60',      label: 'Net 60',         days: 60 },
]

export const DISCOUNT_TYPES = [
  { id: 'none',    label: 'No discount' },
  { id: 'percent', label: 'Percentage' },
  { id: 'flat',    label: 'Flat amount' },
]

/* ---- Helpers ---- */

export function findRateType(id) { return RATE_TYPES.find((r) => r.id === id) || RATE_TYPES[0] }
export function findInvoiceStatus(id) { return INVOICE_STATUSES.find((s) => s.id === id) || INVOICE_STATUSES[0] }
export function findPaymentTerm(id) { return PAYMENT_TERMS.find((p) => p.id === id) || PAYMENT_TERMS[4] }
export function findDiscountType(id) { return DISCOUNT_TYPES.find((d) => d.id === id) || DISCOUNT_TYPES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

export function addDays(iso, days) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

/* ---- Core computation ---- */

/**
 * Each line: { description, rateTypeId, qty, rate, taxPct, taxable, projectCode }
 *   - rateTypeId drives the unit label printed on the PDF
 *   - taxable defaults to true (expense lines often go non-taxable on reimbursements)
 */
export function computeLineAmount(line) {
  const qty   = Number(line.qty) || 0
  const rate  = Number(line.rate) || 0
  const taxPct = line.taxable ? Number(line.taxPct) || 0 : 0
  const gross = round2(qty * rate)
  const tax   = round2(gross * taxPct / 100)
  const total = round2(gross + tax)
  return { gross, tax, total }
}

export function computeTotals(data) {
  const lines = (data.items || []).map((it) => ({ ...it, ...computeLineAmount(it) }))

  const subtotal   = round2(lines.reduce((s, l) => s + l.gross, 0))
  const totalTax   = round2(lines.reduce((s, l) => s + l.tax, 0))

  // Invoice-level discount
  const discountType = findDiscountType(data.discountType)
  let discount = 0
  if (discountType.id === 'percent') {
    discount = round2(subtotal * (Number(data.discountValue) || 0) / 100)
  } else if (discountType.id === 'flat') {
    discount = round2(Math.min(Number(data.discountValue) || 0, subtotal))
  }

  const afterDiscount = round2(subtotal - discount)
  const grandTotal    = round2(afterDiscount + totalTax)

  // Advance / paid offset
  const advance     = round2(Math.max(0, Number(data.advance)     || 0))
  const amountPaid  = round2(Math.max(0, Number(data.amountPaid)  || 0))
  const balanceDue  = round2(Math.max(0, grandTotal - advance - amountPaid))

  // Hours rollup
  const totalHours = round2(lines
    .filter((l) => l.rateTypeId === 'hourly')
    .reduce((s, l) => s + (Number(l.qty) || 0), 0))
  const totalDays = round2(lines
    .filter((l) => l.rateTypeId === 'daily')
    .reduce((s, l) => s + (Number(l.qty) || 0), 0))

  // Payment term
  const term = findPaymentTerm(data.paymentTermId)
  const dueDate = data.invoiceDate
    ? addDays(data.invoiceDate, term.days)
    : ''

  return {
    lines,
    subtotal,
    discount,
    afterDiscount,
    totalTax,
    grandTotal,
    advance,
    amountPaid,
    balanceDue,
    totalHours,
    totalDays,
    dueDate,
  }
}

/** Tax-rate rollup. */
export function buildTaxSummary(lines) {
  const map = new Map()
  for (const l of lines) {
    if (!l.taxable || !l.taxPct || l.taxPct <= 0) continue
    const key = String(l.taxPct)
    const acc = map.get(key) || { ratePct: Number(l.taxPct), taxable: 0, tax: 0, count: 0 }
    acc.taxable += l.gross
    acc.tax     += l.tax
    acc.count   += 1
    map.set(key, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, taxable: round2(a.taxable), tax: round2(a.tax) }))
    .sort((a, b) => a.ratePct - b.ratePct)
}

/** Rate-type rollup. */
export function buildRateTypeSummary(lines) {
  const map = new Map()
  for (const l of lines) {
    const rt = findRateType(l.rateTypeId)
    const acc = map.get(rt.id) || { id: rt.id, label: rt.label, count: 0, qty: 0, total: 0 }
    acc.count += 1
    acc.qty   += Number(l.qty) || 0
    acc.total += l.total
    map.set(rt.id, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, qty: round2(a.qty), total: round2(a.total) }))
    .sort((a, b) => b.total - a.total)
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 3 // header + parties + items
  if (data.includePaymentBlock)   n++
  if (data.includeNotesBlock)     n++
  if (data.includeTermsBlock)     n++
  if (data.includeSignatureBlock) n++
  return n
}
