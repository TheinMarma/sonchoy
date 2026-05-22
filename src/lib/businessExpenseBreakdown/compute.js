/* ------------------------------------------------------------------ */
/*  Business Expense Breakdown — category split + MoM trend             */
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

export const EXPENSE_GROUPS = [
  { id: 'people',         label: 'People & payroll' },
  { id: 'facilities',     label: 'Facilities & rent' },
  { id: 'tech',           label: 'Technology & software' },
  { id: 'marketing',      label: 'Marketing & sales' },
  { id: 'travel',         label: 'Travel & entertainment' },
  { id: 'professional',   label: 'Professional services' },
  { id: 'operations',     label: 'Operations & supplies' },
  { id: 'cogs',           label: 'Cost of goods / contractors' },
  { id: 'finance',        label: 'Finance & banking' },
  { id: 'tax',            label: 'Tax & compliance' },
  { id: 'other',          label: 'Other' },
]

export const SORT_MODES = [
  { id: 'current-desc',   label: 'Current · largest first' },
  { id: 'current-asc',    label: 'Current · smallest first' },
  { id: 'variance-desc',  label: 'Variance · biggest increase first' },
  { id: 'variance-asc',   label: 'Variance · biggest decrease first' },
  { id: 'group',          label: 'By group, then name' },
]

/* ---- Helpers ---- */

export function findExpenseGroup(id) { return EXPENSE_GROUPS.find((g) => g.id === id) || EXPENSE_GROUPS[EXPENSE_GROUPS.length - 1] }
export function findSortMode(id) { return SORT_MODES.find((s) => s.id === id) || SORT_MODES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Compute the breakdown.
 *
 * Each row: { name, groupId, current, prior, trend: [...] }
 */
export function computeBreakdown(data) {
  const rows = (data.rows || []).map((r) => {
    const g = findExpenseGroup(r.groupId)
    const current = round2(Math.max(0, Number(r.current) || 0))
    const prior   = round2(Math.max(0, Number(r.prior) || 0))
    const variance = round2(current - prior)
    const variancePct = prior > 0 ? round2((variance / prior) * 100) : (current > 0 ? 100 : 0)
    const trend = Array.isArray(r.trend) ? r.trend.map((v) => round2(Number(v) || 0)) : []
    return {
      ...r,
      groupId: g.id,
      groupLabel: g.label,
      current, prior, variance, variancePct,
      trend,
    }
  })

  const totalCurrent = round2(rows.reduce((s, r) => s + r.current, 0))
  const totalPrior   = round2(rows.reduce((s, r) => s + r.prior, 0))
  const totalVariance = round2(totalCurrent - totalPrior)
  const totalVariancePct = totalPrior > 0 ? round2((totalVariance / totalPrior) * 100) : 0

  const enriched = rows.map((r) => ({
    ...r,
    sharePct: totalCurrent > 0 ? round2((r.current / totalCurrent) * 100) : 0,
  }))

  // Sort
  const sort = findSortMode(data.sortMode)
  const sorted = [...enriched]
  switch (sort.id) {
    case 'current-desc':   sorted.sort((a, b) => b.current - a.current); break
    case 'current-asc':    sorted.sort((a, b) => a.current - b.current); break
    case 'variance-desc':  sorted.sort((a, b) => b.variance - a.variance); break
    case 'variance-asc':   sorted.sort((a, b) => a.variance - b.variance); break
    case 'group':          sorted.sort((a, b) => {
      if (a.groupId !== b.groupId) return a.groupId.localeCompare(b.groupId)
      return String(a.name || '').localeCompare(String(b.name || ''))
    }); break
  }

  // Group rollup
  const groupMap = new Map()
  for (const r of enriched) {
    const acc = groupMap.get(r.groupId) || {
      groupId: r.groupId, label: r.groupLabel,
      count: 0, current: 0, prior: 0,
    }
    acc.count += 1
    acc.current += r.current
    acc.prior   += r.prior
    groupMap.set(r.groupId, acc)
  }
  const groupSummary = Array.from(groupMap.values()).map((g) => {
    const variance = round2(g.current - g.prior)
    const variancePct = g.prior > 0 ? round2((variance / g.prior) * 100) : (g.current > 0 ? 100 : 0)
    return {
      ...g,
      current: round2(g.current),
      prior: round2(g.prior),
      variance, variancePct,
      sharePct: totalCurrent > 0 ? round2((g.current / totalCurrent) * 100) : 0,
    }
  }).sort((a, b) => b.current - a.current)

  // Trend totals (column-by-column)
  let trendTotals = []
  if (Array.isArray(data.trendLabels) && data.trendLabels.length > 0) {
    trendTotals = data.trendLabels.map((_, i) =>
      round2(enriched.reduce((s, r) => s + (Number(r.trend?.[i]) || 0), 0))
    )
  }

  // Largest categories concentration
  const topN = Math.min(3, sorted.length)
  const topNGroupsSorted = [...groupSummary].slice(0, topN)
  const topNGroupShare = totalCurrent > 0
    ? round2((topNGroupsSorted.reduce((s, g) => s + g.current, 0) / totalCurrent) * 100)
    : 0

  return {
    rows: sorted,
    groupSummary,
    totalCurrent,
    totalPrior,
    totalVariance,
    totalVariancePct,
    trendTotals,
    topN,
    topNGroupShare,
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + lines
  if (data.includeGroupSummary)   n++
  if (data.includeTopMovers)       n++
  if (data.includeTrendTable && Array.isArray(data.trendLabels) && data.trendLabels.length > 0) n++
  if (data.notes) n++
  return n
}

/** Top movers by absolute variance. */
export function buildTopMovers(rows, limit = 6) {
  return [...rows]
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, limit)
}
