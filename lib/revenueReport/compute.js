/* ------------------------------------------------------------------ */
/*  Revenue Report Generator — by segment/product/period               */
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

export const DIMENSIONS = [
  { id: 'product',  label: 'Product / SKU' },
  { id: 'segment',  label: 'Customer segment' },
  { id: 'customer', label: 'Customer / account' },
  { id: 'region',   label: 'Region / geography' },
  { id: 'channel',  label: 'Channel' },
  { id: 'category', label: 'Category' },
  { id: 'other',    label: 'Other' },
]

export const SORT_MODES = [
  { id: 'current-desc',   label: 'Current period · highest first' },
  { id: 'current-asc',    label: 'Current period · lowest first' },
  { id: 'variance-desc',  label: 'Variance · biggest gain first' },
  { id: 'variance-asc',   label: 'Variance · biggest decline first' },
  { id: 'name',           label: 'Name (A–Z)' },
]

/* ---- Helpers ---- */

export function findDimension(id) { return DIMENSIONS.find((d) => d.id === id) || DIMENSIONS[0] }
export function findSortMode(id) { return SORT_MODES.find((s) => s.id === id) || SORT_MODES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Compute the revenue report.
 *
 * Each row: { name, current, prior, trend: [n1, n2, ...] }
 *   - current: current-period revenue
 *   - prior: prior-period revenue
 *   - trend (optional): array of period revenues used for the mini sparkline
 */
export function computeReport(data) {
  const rows = (data.rows || []).map((r) => {
    const current = round2(Math.max(0, Number(r.current) || 0))
    const prior   = round2(Math.max(0, Number(r.prior) || 0))
    const variance = round2(current - prior)
    const variancePct = prior > 0 ? round2((variance / prior) * 100) : (current > 0 ? 100 : 0)
    const trend = Array.isArray(r.trend) ? r.trend.map((v) => round2(Number(v) || 0)) : []
    return {
      ...r,
      current, prior, variance, variancePct,
      trend,
      avgTrend: trend.length > 0 ? round2(trend.reduce((s, v) => s + v, 0) / trend.length) : 0,
    }
  })

  const totalCurrent = round2(rows.reduce((s, r) => s + r.current, 0))
  const totalPrior   = round2(rows.reduce((s, r) => s + r.prior, 0))
  const totalVariance = round2(totalCurrent - totalPrior)
  const totalVariancePct = totalPrior > 0 ? round2((totalVariance / totalPrior) * 100) : 0

  // Share of total per row
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
    case 'name':           sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))); break
  }

  // Concentration: top-N share
  const topN = Math.min(3, sorted.length)
  const topNSorted = [...enriched].sort((a, b) => b.current - a.current).slice(0, topN)
  const topNShare = totalCurrent > 0
    ? round2((topNSorted.reduce((s, r) => s + r.current, 0) / totalCurrent) * 100)
    : 0

  // Trend totals (column-by-column sum)
  let trendTotals = []
  if (Array.isArray(data.trendLabels) && data.trendLabels.length > 0) {
    trendTotals = data.trendLabels.map((_, i) =>
      round2(rows.reduce((s, r) => s + (Number(r.trend?.[i]) || 0), 0))
    )
  }

  return {
    rows: sorted,
    totalCurrent,
    totalPrior,
    totalVariance,
    totalVariancePct,
    topN, topNShare,
    trendTotals,
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + main table
  if (data.includeTopContributors) n++
  if (data.includeTrendTable && Array.isArray(data.trendLabels) && data.trendLabels.length > 0) n++
  if (data.includeConcentration) n++
  if (data.notes) n++
  return n
}

/** Top contributors block — already computed by computeReport. */
export function buildTopContributors(rows, limit = 5) {
  return [...rows]
    .sort((a, b) => b.current - a.current)
    .slice(0, limit)
}
