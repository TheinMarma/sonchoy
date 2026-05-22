/* ------------------------------------------------------------------ */
/*  Monthly Financial Summary — one-page management roll-up           */
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
  { id: 'tax',       label: 'Tax / other',      kind: 'expense' },
]

export const COMPARE_MODES = [
  { id: 'none',     label: 'No comparison column' },
  { id: 'prior',    label: 'Compare vs prior month' },
  { id: 'budget',   label: 'Compare vs budget' },
]

/* ---- Helpers ---- */

export function findLineType(id) { return LINE_TYPES.find((t) => t.id === id) || LINE_TYPES[0] }
export function findCompareMode(id) { return COMPARE_MODES.find((c) => c.id === id) || COMPARE_MODES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Compute the summary from line items.
 *
 * Each line item: { category, typeId, actual, compare }
 *   - actual: this month's amount
 *   - compare: prior-month amount OR budget amount (depending on compareMode)
 */
export function computeSummary(data) {
  const rows = (data.lines || []).map((l) => {
    const t = findLineType(l.typeId)
    const actual = round2(Math.max(0, Number(l.actual) || 0))
    const compare = round2(Math.max(0, Number(l.compare) || 0))
    const variance = round2(actual - compare)
    const variancePct = compare > 0 ? round2((variance / compare) * 100) : (actual > 0 ? 100 : 0)
    return {
      ...l,
      typeId: t.id,
      typeLabel: t.label,
      kind: t.kind,
      actual, compare, variance, variancePct,
    }
  })

  // Roll up by type
  const totals = rows.reduce((s, r) => {
    if (r.typeId === 'revenue') { s.revenue += r.actual;   s.revenueCompare += r.compare }
    if (r.typeId === 'cogs')    { s.cogs    += r.actual;   s.cogsCompare    += r.compare }
    if (r.typeId === 'opex')    { s.opex    += r.actual;   s.opexCompare    += r.compare }
    if (r.typeId === 'tax')     { s.tax     += r.actual;   s.taxCompare     += r.compare }
    return s
  }, {
    revenue: 0, revenueCompare: 0,
    cogs: 0, cogsCompare: 0,
    opex: 0, opexCompare: 0,
    tax: 0, taxCompare: 0,
  })
  Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]) })

  const grossProfit = round2(totals.revenue - totals.cogs)
  const operatingProfit = round2(grossProfit - totals.opex)
  const netIncome = round2(operatingProfit - totals.tax)

  const grossProfitCompare = round2(totals.revenueCompare - totals.cogsCompare)
  const operatingProfitCompare = round2(grossProfitCompare - totals.opexCompare)
  const netIncomeCompare = round2(operatingProfitCompare - totals.taxCompare)

  // Variances
  const revenueVariance = round2(totals.revenue - totals.revenueCompare)
  const netVariance = round2(netIncome - netIncomeCompare)

  // KPIs
  const grossMarginPct      = totals.revenue > 0 ? round2((grossProfit / totals.revenue) * 100) : 0
  const operatingMarginPct  = totals.revenue > 0 ? round2((operatingProfit / totals.revenue) * 100) : 0
  const netMarginPct        = totals.revenue > 0 ? round2((netIncome / totals.revenue) * 100) : 0
  const expenseRatioPct     = totals.revenue > 0 ? round2(((totals.cogs + totals.opex + totals.tax) / totals.revenue) * 100) : 0

  const grossMarginPctCompare      = totals.revenueCompare > 0 ? round2((grossProfitCompare / totals.revenueCompare) * 100) : 0
  const netMarginPctCompare        = totals.revenueCompare > 0 ? round2((netIncomeCompare / totals.revenueCompare) * 100) : 0

  // Cash position
  const cashOpen   = Number(data.cashOpeningBalance) || 0
  const cashClose  = Number(data.cashClosingBalance) || 0
  const cashChange = round2(cashClose - cashOpen)

  return {
    rows,
    totals,
    grossProfit, operatingProfit, netIncome,
    grossProfitCompare, operatingProfitCompare, netIncomeCompare,
    revenueVariance, netVariance,
    grossMarginPct, operatingMarginPct, netMarginPct, expenseRatioPct,
    grossMarginPctCompare, netMarginPctCompare,
    cashOpen: round2(cashOpen),
    cashClose: round2(cashClose),
    cashChange,
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + lines
  if (data.includeKpis)           n++
  if (data.includeCashPosition)   n++
  if (data.includeHighlights && (data.highlights || []).length > 0) n++
  if (data.notes)                 n++
  return n
}

/** Roll lines up by category within their type — for the line-item table. */
export function buildLineGroups(rows) {
  const order = ['revenue', 'cogs', 'opex', 'tax']
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.typeId)) map.set(r.typeId, [])
    map.get(r.typeId).push(r)
  }
  return order
    .filter((id) => map.has(id))
    .map((id) => ({
      typeId: id,
      label: findLineType(id).label,
      kind: findLineType(id).kind,
      rows: map.get(id),
      subtotalActual:  map.get(id).reduce((s, r) => s + r.actual, 0),
      subtotalCompare: map.get(id).reduce((s, r) => s + r.compare, 0),
    }))
}
