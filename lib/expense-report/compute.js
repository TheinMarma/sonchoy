/* ------------------------------------------------------------------ */
/*  Expense Report Generator — categorised reimbursement claim          */
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

export const REPORT_STATUSES = [
  { id: 'draft',     label: 'Draft',         tone: 'muted'   },
  { id: 'submitted', label: 'Submitted',     tone: 'info'    },
  { id: 'approved',  label: 'Approved',      tone: 'success' },
  { id: 'reimbursed', label: 'Reimbursed',   tone: 'success' },
  { id: 'rejected',  label: 'Rejected',      tone: 'danger'  },
]

export const EXPENSE_CATEGORIES = [
  { id: 'travel',         label: 'Travel',          color: [99, 102, 241]  },
  { id: 'lodging',        label: 'Lodging',         color: [168, 85, 247]  },
  { id: 'meals',          label: 'Meals & client',   color: [236, 72, 153]  },
  { id: 'transport',      label: 'Local transport',  color: [14, 165, 233]  },
  { id: 'fuel',           label: 'Fuel & mileage',   color: [249, 115, 22]  },
  { id: 'office',         label: 'Office supplies',  color: [16, 185, 129]  },
  { id: 'software',       label: 'Software / SaaS',  color: [6, 182, 212]   },
  { id: 'communications', label: 'Phone & internet', color: [59, 130, 246]  },
  { id: 'training',       label: 'Training',         color: [217, 70, 239]  },
  { id: 'entertainment',  label: 'Entertainment',    color: [244, 63, 94]   },
  { id: 'other',          label: 'Other',            color: [130, 130, 124] },
]

export const PAYMENT_METHODS = [
  { id: 'personal_card', label: 'Personal card' },
  { id: 'corp_card',     label: 'Corporate card' },
  { id: 'cash',          label: 'Cash' },
  { id: 'upi',           label: 'UPI / wallet' },
  { id: 'bank',          label: 'Bank transfer' },
  { id: 'other',         label: 'Other' },
]

/* ---- Helpers ---- */

export function findReportStatus(id) { return REPORT_STATUSES.find((s) => s.id === id) || REPORT_STATUSES[0] }
export function findCategory(id) { return EXPENSE_CATEGORIES.find((c) => c.id === id) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1] }
export function findPaymentMethod(id) { return PAYMENT_METHODS.find((p) => p.id === id) || PAYMENT_METHODS[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Each line: { date, vendor, categoryId, paymentMethodId, description,
 *              amount, tax, reimbursable, billable, projectCode, receiptRef, notes }
 */
export function computeLineAmount(line) {
  const amount = Number(line.amount) || 0
  const tax    = Number(line.tax) || 0
  const total  = round2(amount + tax)
  return { amount: round2(amount), tax: round2(tax), total }
}

export function computeTotals(data) {
  const lines = (data.items || []).map((it) => ({ ...it, ...computeLineAmount(it) }))

  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0))
  const totalTax = round2(lines.reduce((s, l) => s + l.tax, 0))
  const grandTotal = round2(subtotal + totalTax)

  const reimbursable    = round2(lines.filter((l) => l.reimbursable).reduce((s, l) => s + l.total, 0))
  const nonReimbursable = round2(grandTotal - reimbursable)
  const billable        = round2(lines.filter((l) => l.billable).reduce((s, l) => s + l.total, 0))

  const cashAdvance = round2(Number(data.cashAdvance) || 0)
  const netDue      = round2(reimbursable - cashAdvance)

  return {
    lines,
    subtotal,
    totalTax,
    grandTotal,
    reimbursable,
    nonReimbursable,
    billable,
    cashAdvance,
    netDue,
  }
}

/** Category rollup. */
export function buildCategorySummary(lines) {
  const map = new Map()
  for (const l of lines) {
    const cat = findCategory(l.categoryId)
    const acc = map.get(cat.id) || { id: cat.id, label: cat.label, color: cat.color, count: 0, total: 0 }
    acc.count += 1
    acc.total += l.total
    map.set(cat.id, acc)
  }
  const total = Array.from(map.values()).reduce((s, c) => s + c.total, 0)
  return Array.from(map.values())
    .map((c) => ({ ...c, total: round2(c.total), pct: total > 0 ? round2(c.total / total * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
}

/** Payment-method rollup. */
export function buildPaymentSummary(lines) {
  const map = new Map()
  for (const l of lines) {
    const pm = findPaymentMethod(l.paymentMethodId)
    const acc = map.get(pm.id) || { id: pm.id, label: pm.label, count: 0, total: 0 }
    acc.count += 1
    acc.total += l.total
    map.set(pm.id, acc)
  }
  return Array.from(map.values())
    .map((p) => ({ ...p, total: round2(p.total) }))
    .sort((a, b) => b.total - a.total)
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 4 // header + claimant + items + summary
  if (data.includeCategoryBreakdown) n++
  if (data.includePaymentBreakdown)  n++
  if (data.includeNotesBlock)        n++
  if (data.includeApprovalBlock)     n++
  return n
}
