/* ------------------------------------------------------------------ */
/*  Accounts Receivable (AR) Report computation helpers                */
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

/* ---- Invoice statuses ---- */

export const INVOICE_STATUSES = [
  { id: 'draft',       label: 'Draft' },
  { id: 'sent',        label: 'Sent' },
  { id: 'viewed',      label: 'Viewed' },
  { id: 'partial',     label: 'Partial pay' },
  { id: 'disputed',    label: 'Disputed' },
  { id: 'paid',        label: 'Paid' },
  { id: 'written-off', label: 'Written off' },
]

/* ---- Ageing buckets (same shape as AP) ---- */
export const AGEING_BUCKETS = [
  { id: 'current',  label: 'Current',     min: -Infinity, max: 0   },
  { id: '1-30',     label: '1–30 days',   min: 1,         max: 30  },
  { id: '31-60',    label: '31–60 days',  min: 31,        max: 60  },
  { id: '61-90',    label: '61–90 days',  min: 61,        max: 90  },
  { id: '90-plus',  label: '90+ days',    min: 91,        max: Infinity },
]

/* ------------------------------------------------------------------ */

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

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
  const s = INVOICE_STATUSES.find((x) => x.id === id)
  return s ? s.label : id
}

/** Outstanding = neither paid nor written-off */
function isOutstanding(inv) {
  return inv && inv.status !== 'paid' && inv.status !== 'written-off'
}

/** Compute full AR report metrics */
export function computeAR(data) {
  const asOf = data.asOfDate || todayISO()
  const invoices = data.invoices || []

  const annotated = invoices.map((iv) => {
    const days = daysBetween(asOf, iv.dueDate)
    const bucket = bucketForDays(days)
    return { ...iv, daysOverdue: days, bucketId: bucket.id, bucketLabel: bucket.label }
  })

  const outstanding = annotated.filter(isOutstanding)
  const paid       = annotated.filter((iv) => iv.status === 'paid')
  const writtenOff = annotated.filter((iv) => iv.status === 'written-off')

  const totalOutstanding = round2(outstanding.reduce((s, iv) => s + (Number(iv.amount) || 0), 0))
  const totalPaid        = round2(paid.reduce((s, iv) => s + (Number(iv.amount) || 0), 0))
  const totalBadDebt     = round2(writtenOff.reduce((s, iv) => s + (Number(iv.amount) || 0), 0))

  const countOutstanding = outstanding.length
  const countPaid        = paid.length
  const countBadDebt     = writtenOff.length

  // Overdue
  const overdueInvoices = outstanding.filter((iv) => iv.daysOverdue > 0)
  const totalOverdue = round2(overdueInvoices.reduce((s, iv) => s + (Number(iv.amount) || 0), 0))
  const countOverdue = overdueInvoices.length

  // Disputed
  const disputedInvoices = outstanding.filter((iv) => iv.status === 'disputed')
  const totalDisputed = round2(disputedInvoices.reduce((s, iv) => s + (Number(iv.amount) || 0), 0))
  const countDisputed = disputedInvoices.length

  // Ageing buckets
  const ageing = AGEING_BUCKETS.map((b) => {
    const rows = outstanding.filter((iv) => iv.bucketId === b.id)
    const amount = round2(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0))
    return {
      id: b.id,
      label: b.label,
      count: rows.length,
      amount,
      pct: round2(pct(amount, totalOutstanding)),
    }
  })

  // By customer
  const byCustomerMap = new Map()
  for (const iv of outstanding) {
    const key = iv.customer || 'Unknown'
    const prev = byCustomerMap.get(key) || { customer: key, count: 0, amount: 0 }
    prev.count += 1
    prev.amount += Number(iv.amount) || 0
    byCustomerMap.set(key, prev)
  }
  const byCustomer = Array.from(byCustomerMap.values())
    .map((c) => ({
      customer: c.customer,
      count: c.count,
      amount: round2(c.amount),
      pct: round2(pct(c.amount, totalOutstanding)),
    }))
    .sort((a, b) => b.amount - a.amount)

  // DSO approximation: average days outstanding across overdue
  const dso = overdueInvoices.length
    ? Math.round(overdueInvoices.reduce((s, iv) => s + iv.daysOverdue, 0) / overdueInvoices.length)
    : 0

  // Collection rate: paid / (paid + outstanding + bad debt)
  const totalIssued = totalOutstanding + totalPaid + totalBadDebt
  const collectionRate = totalIssued ? round2(pct(totalPaid, totalIssued)) : 0

  return {
    asOf,
    invoices: annotated,
    outstanding,
    paid,
    writtenOff,
    totalOutstanding,
    totalPaid,
    totalBadDebt,
    totalOverdue,
    totalDisputed,
    countOutstanding,
    countPaid,
    countBadDebt,
    countOverdue,
    countDisputed,
    averageOutstanding: countOutstanding ? round2(totalOutstanding / countOutstanding) : 0,
    overduePct: round2(pct(totalOverdue, totalOutstanding)),
    dso,
    collectionRate,
    ageing,
    byCustomer,
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
