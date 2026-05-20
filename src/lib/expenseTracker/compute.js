/* ------------------------------------------------------------------ */
/*  Expense Tracker computation helpers                                */
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

/* ---- Expense categories ---- */

export const EXPENSE_CATEGORIES = [
  'Meals & entertainment',
  'Travel & transportation',
  'Office supplies',
  'Software & subscriptions',
  'Marketing & advertising',
  'Professional services',
  'Utilities & rent',
  'Equipment & hardware',
  'Training & education',
  'Communications',
  'Insurance',
  'Other',
]

/* ---- Payment methods ---- */

export const PAYMENT_METHODS = [
  'Corporate card',
  'Personal card',
  'Cash',
  'Bank transfer',
  'Direct debit',
  'Cheque',
  'Mobile payment',
]

/* ---- Statuses ---- */

export const STATUSES = [
  { id: 'pending',    label: 'Pending' },
  { id: 'submitted',  label: 'Submitted' },
  { id: 'approved',   label: 'Approved' },
  { id: 'reimbursed', label: 'Reimbursed' },
  { id: 'rejected',   label: 'Rejected' },
]

/* ------------------------------------------------------------------ */

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

function pct(part, whole) {
  if (!whole) return 0
  return (part / whole) * 100
}

/** Group an array by a key, summing amount */
function groupSum(items, key) {
  const map = new Map()
  for (const it of items) {
    const k = it[key] || 'Uncategorised'
    map.set(k, round2((map.get(k) || 0) + (Number(it.amount) || 0)))
  }
  return Array.from(map.entries())
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)
}

/** Calculate full expense tracker totals + breakdowns */
export function computeExpenses(data) {
  const items = data.expenses || []
  const total = round2(items.reduce((s, e) => s + (Number(e.amount) || 0), 0))
  const count = items.length

  const byCategory = groupSum(items, 'category')
  const byPaymentMethod = groupSum(items, 'paymentMethod')
  const byStatus = groupSum(items, 'status')

  // Helpful aggregates
  const reimbursableStatuses = new Set(['pending', 'submitted', 'approved'])
  const reimbursableTotal = round2(
    items
      .filter((e) => reimbursableStatuses.has(e.status))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0)
  )
  const reimbursedTotal = round2(
    items
      .filter((e) => e.status === 'reimbursed')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0)
  )
  const rejectedTotal = round2(
    items
      .filter((e) => e.status === 'rejected')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0)
  )

  // Add % share to category breakdown
  const byCategoryWithShare = byCategory.map((row) => ({
    ...row,
    pct: round2(pct(row.amount, total)),
  }))

  // Date range (auto from rows, in case period isn't set)
  const dates = items.map((e) => e.date).filter(Boolean).sort()
  const autoStart = dates[0] || null
  const autoEnd = dates[dates.length - 1] || null

  return {
    count,
    total,
    average: count > 0 ? round2(total / count) : 0,
    byCategory: byCategoryWithShare,
    byPaymentMethod,
    byStatus,
    reimbursableTotal,
    reimbursedTotal,
    rejectedTotal,
    autoStart,
    autoEnd,
  }
}

export function describePeriod(data) {
  if (data.periodLabel) return data.periodLabel
  if (data.periodStart && data.periodEnd) {
    const s = new Date(data.periodStart)
    const e = new Date(data.periodEnd)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      return s.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    }
    if (s.getFullYear() === e.getFullYear()) {
      return `${s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    }
    return `${s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} → ${e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }
  return ''
}

export function statusLabel(id) {
  const s = STATUSES.find((x) => x.id === id)
  return s ? s.label : id
}
