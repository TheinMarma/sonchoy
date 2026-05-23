/* ------------------------------------------------------------------ */
/*  Financial Report Generator — branded monthly / quarterly report     */
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

export const REPORT_PERIODS = [
  { id: 'monthly',    label: 'Monthly' },
  { id: 'quarterly',  label: 'Quarterly' },
  { id: 'half_year',  label: 'Half-year' },
  { id: 'annual',     label: 'Annual' },
  { id: 'custom',     label: 'Custom range' },
]

export const REPORT_STATUSES = [
  { id: 'draft',     label: 'Draft',         tone: 'muted'   },
  { id: 'internal',  label: 'Internal',      tone: 'info'    },
  { id: 'board',     label: 'Board review',  tone: 'warning' },
  { id: 'final',     label: 'Final',         tone: 'success' },
]

export const AUDIENCES = [
  { id: 'leadership', label: 'Leadership team' },
  { id: 'board',      label: 'Board of directors' },
  { id: 'investors',  label: 'Investors / lenders' },
  { id: 'partners',   label: 'Partners' },
  { id: 'internal',   label: 'Internal staff' },
]

/* ---- Helpers ---- */

export function findReportPeriod(id) { return REPORT_PERIODS.find((p) => p.id === id) || REPORT_PERIODS[0] }
export function findReportStatus(id) { return REPORT_STATUSES.find((s) => s.id === id) || REPORT_STATUSES[0] }
export function findAudience(id) { return AUDIENCES.find((a) => a.id === id) || AUDIENCES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

function pctChange(current, prior) {
  const c = Number(current) || 0
  const p = Number(prior) || 0
  if (p === 0) return c === 0 ? 0 : null  // null = N/A
  return round2((c - p) / Math.abs(p) * 100)
}

/* ---- Core computation ---- */

/**
 * KPI: { id, label, current, prior, target, unit ('money' | 'pct' | 'num'), goodDirection ('up' | 'down') }
 * Revenue line: { label, current, prior }
 * Expense line: { label, current, prior }
 */
export function computeTotals(data) {
  /* KPIs */
  const kpis = (data.kpis || []).map((k) => {
    const delta = pctChange(k.current, k.prior)
    const targetDelta = k.target != null && k.target !== ''
      ? pctChange(k.current, k.target)
      : null
    const goodDir = k.goodDirection || 'up'
    const isGood = delta == null ? null : goodDir === 'up' ? delta >= 0 : delta <= 0
    return {
      ...k,
      current: round2(Number(k.current) || 0),
      prior:   round2(Number(k.prior) || 0),
      target:  k.target == null || k.target === '' ? null : round2(Number(k.target) || 0),
      delta, targetDelta, isGood,
    }
  })

  /* Revenue rows */
  const revenue = (data.revenue || []).map((r) => ({
    ...r,
    current: round2(Number(r.current) || 0),
    prior:   round2(Number(r.prior) || 0),
    delta:   pctChange(r.current, r.prior),
  }))

  /* Expense rows */
  const expenses = (data.expenses || []).map((e) => ({
    ...e,
    current: round2(Number(e.current) || 0),
    prior:   round2(Number(e.prior) || 0),
    delta:   pctChange(e.current, e.prior),
  }))

  const totalRevenueCurrent = round2(revenue.reduce((s, r) => s + r.current, 0))
  const totalRevenuePrior   = round2(revenue.reduce((s, r) => s + r.prior, 0))
  const totalExpenseCurrent = round2(expenses.reduce((s, e) => s + e.current, 0))
  const totalExpensePrior   = round2(expenses.reduce((s, e) => s + e.prior, 0))
  const netIncomeCurrent    = round2(totalRevenueCurrent - totalExpenseCurrent)
  const netIncomePrior      = round2(totalRevenuePrior - totalExpensePrior)
  const grossMarginCurrent  = totalRevenueCurrent > 0
    ? round2((totalRevenueCurrent - totalExpenseCurrent) / totalRevenueCurrent * 100)
    : 0
  const grossMarginPrior = totalRevenuePrior > 0
    ? round2((totalRevenuePrior - totalExpensePrior) / totalRevenuePrior * 100)
    : 0

  return {
    kpis,
    revenue, expenses,
    totalRevenueCurrent, totalRevenuePrior,
    totalExpenseCurrent, totalExpensePrior,
    netIncomeCurrent, netIncomePrior,
    grossMarginCurrent, grossMarginPrior,
    revenueDelta: pctChange(totalRevenueCurrent, totalRevenuePrior),
    expenseDelta: pctChange(totalExpenseCurrent, totalExpensePrior),
    netDelta:     pctChange(netIncomeCurrent, netIncomePrior),
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 4 // header + summary + kpis + financials
  if (data.includeHighlightsBlock) n++
  if (data.includeCommentaryBlock) n++
  if (data.includeRisksBlock)      n++
  if (data.includeOutlookBlock)    n++
  if (data.includeSignatureBlock)  n++
  return n
}
