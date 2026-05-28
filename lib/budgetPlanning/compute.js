/* ------------------------------------------------------------------ */
/*  Budget Planning Sheet — line-by-line budget with variance          */
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

export const LINE_TYPES = [
  { id: 'revenue',   label: 'Revenue',         kind: 'income'  },
  { id: 'cogs',      label: 'Cost of revenue', kind: 'expense' },
  { id: 'opex',      label: 'Operating expense', kind: 'expense' },
  { id: 'capex',     label: 'Capital expense',  kind: 'expense' },
  { id: 'tax',       label: 'Tax / other',      kind: 'expense' },
]

export const PERIOD_FREQUENCIES = [
  { id: 'monthly',   label: 'Monthly (12 columns)',     periods: 12 },
  { id: 'quarterly', label: 'Quarterly (4 columns)',    periods: 4  },
  { id: 'annual',    label: 'Annual (1 column)',        periods: 1  },
  { id: 'custom',    label: 'Custom labels',            periods: 0  },
]

export const STATUS_THRESHOLDS = {
  // For expenses: under-budget is good (green), on-track is neutral, over-budget is bad
  // For revenue: above-budget is good (green), on-track is neutral, below-budget is bad
  onTrackPct: 5,    // within ±5% is on-track
}

export const PLAN_PURPOSES = [
  { id: 'annual',     label: 'Annual budget plan' },
  { id: 'quarterly',  label: 'Quarterly forecast' },
  { id: 'project',    label: 'Project / campaign budget' },
  { id: 'department', label: 'Department budget' },
  { id: 'rolling',    label: 'Rolling 12-month forecast' },
]

/* ---- Helpers ---- */

export function findLineType(id) { return LINE_TYPES.find((t) => t.id === id) || LINE_TYPES[2] }
export function findPeriodFrequency(id) { return PERIOD_FREQUENCIES.find((p) => p.id === id) || PERIOD_FREQUENCIES[0] }
export function findPlanPurpose(id) { return PLAN_PURPOSES.find((p) => p.id === id) || PLAN_PURPOSES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** Get status from variance (positive variance for revenue is good; for expenses is bad). */
export function getStatus(budget, actual, kind) {
  const b = Number(budget) || 0
  const a = Number(actual) || 0
  if (b === 0 && a === 0) return { id: 'on-track', label: 'On track', tone: 'success' }
  const variance = a - b
  const variancePct = b > 0 ? Math.abs(variance / b) * 100 : (a > 0 ? 100 : 0)
  if (variancePct <= STATUS_THRESHOLDS.onTrackPct) return { id: 'on-track', label: 'On track', tone: 'success' }
  if (kind === 'income') {
    if (variance >= 0) return { id: 'above',  label: 'Above budget',  tone: 'success' }
    return { id: 'below',  label: 'Below budget',  tone: 'danger' }
  } else {
    if (variance <= 0) return { id: 'under',  label: 'Under budget',  tone: 'success' }
    return { id: 'over',   label: 'Over budget',   tone: 'danger' }
  }
}

/* ---- Core computation ---- */

/**
 * Compute the full budget report.
 *
 * Each row: { name, typeId, budget, actual, periods?: [n1, n2, ...] }
 *   - budget: total annual / period budget figure
 *   - actual: total actual to date (optional)
 *   - periods (optional): per-period breakdown (e.g. monthly)
 */
export function computeBudget(data) {
  const rows = (data.rows || []).map((r) => {
    const t = findLineType(r.typeId)
    const budget = round2(Number(r.budget) || 0)
    const actual = round2(Number(r.actual) || 0)
    const variance = round2(actual - budget)
    const variancePct = budget > 0 ? round2((variance / budget) * 100) : (actual > 0 ? 100 : 0)
    const periods = Array.isArray(r.periods) ? r.periods.map((v) => round2(Number(v) || 0)) : []
    const status = getStatus(budget, actual, t.kind)
    return {
      ...r,
      typeId: t.id,
      typeLabel: t.label,
      kind: t.kind,
      budget, actual, variance, variancePct,
      periods,
      status,
    }
  })

  // Group totals
  const grouped = {
    revenue: { budget: 0, actual: 0 },
    cogs:    { budget: 0, actual: 0 },
    opex:    { budget: 0, actual: 0 },
    capex:   { budget: 0, actual: 0 },
    tax:     { budget: 0, actual: 0 },
  }
  for (const r of rows) {
    if (grouped[r.typeId]) {
      grouped[r.typeId].budget += r.budget
      grouped[r.typeId].actual += r.actual
    }
  }
  Object.keys(grouped).forEach((k) => {
    grouped[k].budget = round2(grouped[k].budget)
    grouped[k].actual = round2(grouped[k].actual)
    grouped[k].variance = round2(grouped[k].actual - grouped[k].budget)
    grouped[k].variancePct = grouped[k].budget > 0
      ? round2((grouped[k].variance / grouped[k].budget) * 100)
      : 0
  })

  // Calculated totals
  const totalIncome = grouped.revenue
  const totalExpense = {
    budget: round2(grouped.cogs.budget + grouped.opex.budget + grouped.capex.budget + grouped.tax.budget),
    actual: round2(grouped.cogs.actual + grouped.opex.actual + grouped.capex.actual + grouped.tax.actual),
  }
  totalExpense.variance = round2(totalExpense.actual - totalExpense.budget)
  totalExpense.variancePct = totalExpense.budget > 0
    ? round2((totalExpense.variance / totalExpense.budget) * 100)
    : 0

  const netBudget = round2(totalIncome.budget - totalExpense.budget)
  const netActual = round2(totalIncome.actual - totalExpense.actual)
  const netVariance = round2(netActual - netBudget)

  // Period totals (column-by-column)
  let periodTotals = []
  if (Array.isArray(data.periodLabels) && data.periodLabels.length > 0) {
    periodTotals = data.periodLabels.map((_, i) =>
      round2(rows.reduce((s, r) => {
        const v = Number(r.periods?.[i]) || 0
        // For net view: revenue positive, expenses negative
        return s + (r.kind === 'income' ? v : -v)
      }, 0))
    )
  }

  // Count by status
  const statusCounts = rows.reduce((s, r) => {
    s[r.status.id] = (s[r.status.id] || 0) + 1
    return s
  }, {})

  return {
    rows,
    grouped,
    totalIncome,
    totalExpense,
    netBudget,
    netActual,
    netVariance,
    periodTotals,
    statusCounts,
  }
}

/** Group rows by type for the table. */
export function buildLineGroups(rows) {
  const order = ['revenue', 'cogs', 'opex', 'capex', 'tax']
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.typeId)) map.set(r.typeId, [])
    map.get(r.typeId).push(r)
  }
  return order
    .filter((id) => map.has(id))
    .map((id) => {
      const list = map.get(id)
      const subBudget = round2(list.reduce((s, r) => s + r.budget, 0))
      const subActual = round2(list.reduce((s, r) => s + r.actual, 0))
      return {
        typeId: id,
        label: findLineType(id).label,
        kind: findLineType(id).kind,
        rows: list,
        subBudget,
        subActual,
        subVariance: round2(subActual - subBudget),
        subVariancePct: subBudget > 0 ? round2(((subActual - subBudget) / subBudget) * 100) : 0,
      }
    })
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + lines
  if (data.includePeriodTable && Array.isArray(data.periodLabels) && data.periodLabels.length > 0) n++
  if (data.includeVarianceWatchlist) n++
  if (data.notes) n++
  return n
}

/** Build the variance watchlist — items with biggest absolute variance + bad status. */
export function buildWatchlist(rows, limit = 8) {
  return [...rows]
    .filter((r) => r.status.tone === 'danger')
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, limit)
}
