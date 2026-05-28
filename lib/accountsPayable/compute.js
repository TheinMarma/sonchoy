/* ------------------------------------------------------------------ */
/*  Accounts Payable (AP) Report computation helpers                   */
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

/* ---- Bill statuses ---- */

export const BILL_STATUSES = [
  { id: 'open',     label: 'Open' },
  { id: 'approved', label: 'Approved' },
  { id: 'partial',  label: 'Partial pay' },
  { id: 'on-hold',  label: 'On hold' },
  { id: 'disputed', label: 'Disputed' },
  { id: 'paid',     label: 'Paid' },
]

/* ---- Ageing buckets ---- */
/*    label, minDays (inclusive lower bound on days overdue), maxDays */
/*    Days overdue = asOfDate - dueDate.                              */
/*    Negative days overdue → bill is not yet due (Current bucket).   */
export const AGEING_BUCKETS = [
  { id: 'current',  label: 'Current',     min: -Infinity, max: 0   },
  { id: '1-30',     label: '1–30 days',   min: 1,         max: 30  },
  { id: '31-60',    label: '31–60 days',  min: 31,        max: 60  },
  { id: '61-90',    label: '61–90 days',  min: 61,        max: 90  },
  { id: '90-plus',  label: '90+ days',    min: 91,        max: Infinity },
]

/* ------------------------------------------------------------------ */

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

function daysBetween(later, earlier) {
  const a = new Date(later)
  const b = new Date(earlier)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.round((a - b) / (24 * 60 * 60 * 1000))
}

function pct(part, whole) {
  if (!whole) return 0
  return (part / whole) * 100
}

function bucketForDays(daysOverdue) {
  for (const b of AGEING_BUCKETS) {
    if (daysOverdue >= b.min && daysOverdue <= b.max) return b
  }
  return AGEING_BUCKETS[0]
}

export function statusLabel(id) {
  const s = BILL_STATUSES.find((x) => x.id === id)
  return s ? s.label : id
}

/** Filter out paid bills from outstanding calculations */
function isOutstanding(bill) {
  return bill && bill.status !== 'paid'
}

/** Compute full AP report metrics */
export function computeAP(data) {
  const asOf = data.asOfDate || todayISO()
  const bills = data.bills || []

  // Annotate each bill with daysOverdue + bucket
  const annotated = bills.map((b) => {
    const days = daysBetween(asOf, b.dueDate)
    const bucket = bucketForDays(days)
    return { ...b, daysOverdue: days, bucketId: bucket.id, bucketLabel: bucket.label }
  })

  const outstanding = annotated.filter(isOutstanding)
  const paid = annotated.filter((b) => b.status === 'paid')

  const totalOutstanding = round2(outstanding.reduce((s, b) => s + (Number(b.amount) || 0), 0))
  const totalPaid = round2(paid.reduce((s, b) => s + (Number(b.amount) || 0), 0))
  const countOutstanding = outstanding.length
  const countPaid = paid.length

  // Overdue total — anything with daysOverdue > 0
  const overdueBills = outstanding.filter((b) => b.daysOverdue > 0)
  const totalOverdue = round2(overdueBills.reduce((s, b) => s + (Number(b.amount) || 0), 0))
  const countOverdue = overdueBills.length

  // Ageing buckets
  const ageing = AGEING_BUCKETS.map((b) => {
    const rows = outstanding.filter((bill) => bill.bucketId === b.id)
    const amount = round2(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0))
    return {
      id: b.id,
      label: b.label,
      count: rows.length,
      amount,
      pct: round2(pct(amount, totalOutstanding)),
    }
  })

  // By vendor (outstanding only)
  const byVendorMap = new Map()
  for (const b of outstanding) {
    const key = b.vendor || 'Unknown'
    const prev = byVendorMap.get(key) || { vendor: key, count: 0, amount: 0 }
    prev.count += 1
    prev.amount += Number(b.amount) || 0
    byVendorMap.set(key, prev)
  }
  const byVendor = Array.from(byVendorMap.values())
    .map((v) => ({
      vendor: v.vendor,
      count: v.count,
      amount: round2(v.amount),
      pct: round2(pct(v.amount, totalOutstanding)),
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    asOf,
    bills: annotated,
    outstanding,
    paid,
    totalOutstanding,
    totalPaid,
    totalOverdue,
    countOutstanding,
    countPaid,
    countOverdue,
    averageOutstanding: countOutstanding ? round2(totalOutstanding / countOutstanding) : 0,
    overduePct: round2(pct(totalOverdue, totalOutstanding)),
    ageing,
    byVendor,
  }
}

export function asOfLabel(data) {
  if (data.periodLabel) return data.periodLabel
  if (data.asOfDate) {
    const d = new Date(data.asOfDate)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    }
  }
  return ''
}
