/* ------------------------------------------------------------------ */
/*  Recurring Invoice Generator — cadence + auto-projected schedule     */
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

export const FREQUENCIES = [
  { id: 'weekly',     label: 'Weekly',     perYear: 52 },
  { id: 'bi_weekly',  label: 'Bi-weekly',  perYear: 26 },
  { id: 'monthly',    label: 'Monthly',    perYear: 12 },
  { id: 'quarterly',  label: 'Quarterly',  perYear: 4  },
  { id: 'half_year',  label: 'Half-year',  perYear: 2  },
  { id: 'annual',     label: 'Annual',     perYear: 1  },
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

export const RECURRING_STATUSES = [
  { id: 'active',    label: 'Active',     tone: 'success' },
  { id: 'paused',    label: 'Paused',     tone: 'warning' },
  { id: 'draft',     label: 'Draft',      tone: 'muted'   },
  { id: 'ended',     label: 'Ended',      tone: 'danger'  },
  { id: 'completed', label: 'Completed',  tone: 'info'    },
]

export const END_CONDITIONS = [
  { id: 'never',       label: 'Never (until cancelled)' },
  { id: 'after_count', label: 'After N occurrences'    },
  { id: 'on_date',     label: 'On a specific date'      },
]

export const AUTO_SEND_MODES = [
  { id: 'draft_only',   label: 'Draft only — manual send' },
  { id: 'email_draft',  label: 'Email draft to me' },
  { id: 'auto_send',    label: 'Auto-send to client' },
]

export const DISCOUNT_TYPES = [
  { id: 'none',    label: 'No discount' },
  { id: 'percent', label: 'Percentage' },
  { id: 'flat',    label: 'Flat amount' },
]

/* ---- Helpers ---- */

export function findFrequency(id)   { return FREQUENCIES.find((f) => f.id === id) || FREQUENCIES[2] }
export function findPaymentTerm(id) { return PAYMENT_TERMS.find((p) => p.id === id) || PAYMENT_TERMS[4] }
export function findStatus(id)      { return RECURRING_STATUSES.find((s) => s.id === id) || RECURRING_STATUSES[0] }
export function findEndCondition(id){ return END_CONDITIONS.find((e) => e.id === id) || END_CONDITIONS[0] }
export function findAutoSend(id)    { return AUTO_SEND_MODES.find((a) => a.id === id) || AUTO_SEND_MODES[0] }
export function findDiscountType(id){ return DISCOUNT_TYPES.find((d) => d.id === id) || DISCOUNT_TYPES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** Add N days to an ISO date string → ISO date string. */
export function addDays(iso, days) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

/** Add one frequency step to an ISO date. */
export function addFrequency(iso, freqId) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  switch (freqId) {
    case 'weekly':    d.setDate(d.getDate() + 7); break
    case 'bi_weekly': d.setDate(d.getDate() + 14); break
    case 'monthly':   d.setMonth(d.getMonth() + 1); break
    case 'quarterly': d.setMonth(d.getMonth() + 3); break
    case 'half_year': d.setMonth(d.getMonth() + 6); break
    case 'annual':    d.setFullYear(d.getFullYear() + 1); break
    default:          d.setMonth(d.getMonth() + 1)
  }
  return d.toISOString().slice(0, 10)
}

/* ---- Per-invoice computation (one occurrence) ---- */

export function computeLineAmount(line) {
  const qty   = Number(line.qty) || 0
  const rate  = Number(line.rate) || 0
  const taxPct = line.taxable ? Number(line.taxPct) || 0 : 0
  const gross = round2(qty * rate)
  const tax   = round2(gross * taxPct / 100)
  const total = round2(gross + tax)
  return { gross, tax, total }
}

export function computeInvoiceTotals(data) {
  const lines = (data.items || []).map((it) => ({ ...it, ...computeLineAmount(it) }))

  const subtotal = round2(lines.reduce((s, l) => s + l.gross, 0))
  const totalTax = round2(lines.reduce((s, l) => s + l.tax, 0))

  const discountType = findDiscountType(data.discountType)
  let discount = 0
  if (discountType.id === 'percent') {
    discount = round2(subtotal * (Number(data.discountValue) || 0) / 100)
  } else if (discountType.id === 'flat') {
    discount = round2(Math.min(Number(data.discountValue) || 0, subtotal))
  }

  const afterDiscount = round2(subtotal - discount)
  const grandTotal    = round2(afterDiscount + totalTax)

  return { lines, subtotal, discount, afterDiscount, totalTax, grandTotal }
}

/* ---- Schedule projection ---- */

/**
 * Generate the projected schedule of occurrences from `startDate`.
 * Stops at:
 *   - `endConditionId === 'after_count'`  → occurrenceCount items
 *   - `endConditionId === 'on_date'`      → occurrences with issueDate <= endDate
 *   - `endConditionId === 'never'`        → caps at MAX_PROJECT (60) to keep UI usable
 *
 * Returns up to `limit` items (default 24) for the on-page preview.
 */
const MAX_PROJECT = 60

export function projectSchedule(data, limit = 24) {
  const totals = computeInvoiceTotals(data)
  const term   = findPaymentTerm(data.paymentTermId)
  const freq   = findFrequency(data.frequencyId)
  const endCond = findEndCondition(data.endConditionId)

  const result = []
  if (!data.startDate) return { occurrences: result, totals, freq, plannedCount: 0, totalProjectedRevenue: 0 }

  const occurrenceCount = endCond.id === 'after_count'
    ? Math.max(0, Math.min(MAX_PROJECT, Number(data.occurrenceCount) || 0))
    : MAX_PROJECT

  let issueDate = data.startDate
  for (let i = 0; i < occurrenceCount; i++) {
    if (endCond.id === 'on_date' && data.endDate && issueDate > data.endDate) break
    const dueDate = addDays(issueDate, term.days)
    result.push({
      n: i + 1,
      issueDate,
      dueDate,
      invoiceNumber: buildInvoiceNumber(data.invoiceNumberPrefix, data.invoiceNumberStart, i),
      total: totals.grandTotal,
    })
    if (result.length >= limit && endCond.id !== 'after_count') break
    issueDate = addFrequency(issueDate, freq.id)
  }

  // Compute planned count + projected revenue using the full series (not just preview slice)
  let plannedCount = 0
  if (endCond.id === 'after_count') {
    plannedCount = Math.max(0, Number(data.occurrenceCount) || 0)
  } else if (endCond.id === 'on_date' && data.startDate && data.endDate) {
    let cursor = data.startDate
    while (cursor <= data.endDate && plannedCount < MAX_PROJECT) {
      plannedCount += 1
      cursor = addFrequency(cursor, freq.id)
    }
  } else {
    plannedCount = null // open-ended
  }

  const totalProjectedRevenue = plannedCount != null
    ? round2(plannedCount * totals.grandTotal)
    : null

  // Annualised value (useful regardless of plannedCount)
  const annualisedRevenue = round2(freq.perYear * totals.grandTotal)

  return {
    occurrences: result,
    totals,
    freq,
    plannedCount,
    totalProjectedRevenue,
    annualisedRevenue,
  }
}

function buildInvoiceNumber(prefix, start, offset) {
  const startNum = Number(start) || 1
  const n = startNum + offset
  const padded = String(n).padStart(4, '0')
  return `${prefix || 'INV'}-${padded}`
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 4 // header + parties + items + schedule
  if (data.includePaymentBlock)   n++
  if (data.includeTermsBlock)     n++
  if (data.includeNotesBlock)     n++
  return n
}
