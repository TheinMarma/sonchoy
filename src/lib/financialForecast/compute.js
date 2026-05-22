/* ------------------------------------------------------------------ */
/*  Financial Forecast Generator — base / optimistic / downside        */
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
  { id: 'monthly',   label: 'Monthly',     periodsPerYear: 12 },
  { id: 'quarterly', label: 'Quarterly',   periodsPerYear: 4  },
  { id: 'annual',    label: 'Annual',      periodsPerYear: 1  },
]

export const FORECAST_HORIZONS = [
  { id: '1yr',       label: '1 year',      years: 1 },
  { id: '3yr',       label: '3 years',     years: 3 },
  { id: '5yr',       label: '5 years',     years: 5 },
  { id: 'custom',    label: 'Custom',      years: 1 },
]

export const FORECAST_PURPOSES = [
  { id: 'fundraise',   label: 'Fundraising deck' },
  { id: 'board',       label: 'Board / investor update' },
  { id: 'planning',    label: 'Strategic planning' },
  { id: 'scenario',    label: 'Scenario / sensitivity analysis' },
  { id: 'cashflow',    label: 'Cash-flow projection' },
]

/* ---- Helpers ---- */

export function findLineType(id) { return LINE_TYPES.find((t) => t.id === id) || LINE_TYPES[2] }
export function findPeriodFrequency(id) { return PERIOD_FREQUENCIES.find((p) => p.id === id) || PERIOD_FREQUENCIES[0] }
export function findForecastHorizon(id) { return FORECAST_HORIZONS.find((h) => h.id === id) || FORECAST_HORIZONS[1] }
export function findForecastPurpose(id) { return FORECAST_PURPOSES.find((p) => p.id === id) || FORECAST_PURPOSES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Each row: {
 *   name, typeId,
 *   currentValue,           // starting value (most recent period)
 *   growthBasePct,           // annual growth rate, base case
 *   optimisticAdjPct,        // upside adjustment to growth (e.g. +5 = +5pp on top of base)
 *   downsideAdjPct,          // downside adjustment (e.g. -8 = -8pp from base)
 *   periods?: { base: [], optimistic: [], downside: [] }   // optional per-period overrides
 * }
 *
 * Output: each row contains projected per-period values for each scenario.
 */
export function computeForecast(data) {
  const horizon = findForecastHorizon(data.horizonId)
  const years = data.horizonId === 'custom' ? Math.max(1, Number(data.customYears) || 1) : horizon.years
  const freq = findPeriodFrequency(data.frequencyId)
  const totalPeriods = years * freq.periodsPerYear
  const periodLabels = generatePeriodLabels(data.startDate || todayISO(), totalPeriods, data.frequencyId)

  const rows = (data.rows || []).map((r) => {
    const t = findLineType(r.typeId)
    const start = Number(r.currentValue) || 0
    const baseGrowth = (Number(r.growthBasePct) || 0) / 100
    const optGrowth  = (Number(r.optimisticAdjPct) || 0) / 100 + baseGrowth
    const downGrowth = (Number(r.downsideAdjPct)   || 0) / 100 + baseGrowth

    // Per-period growth = annual ^ (1 / periodsPerYear)
    const perPeriodBase = Math.pow(1 + baseGrowth, 1 / freq.periodsPerYear) - 1
    const perPeriodOpt  = Math.pow(1 + optGrowth,  1 / freq.periodsPerYear) - 1
    const perPeriodDown = Math.pow(1 + downGrowth, 1 / freq.periodsPerYear) - 1

    const basePer = []
    const optPer  = []
    const downPer = []
    let cBase = start, cOpt = start, cDown = start
    for (let i = 0; i < totalPeriods; i++) {
      cBase = round2(cBase * (1 + perPeriodBase))
      cOpt  = round2(cOpt  * (1 + perPeriodOpt))
      cDown = round2(cDown * (1 + perPeriodDown))
      basePer.push(cBase)
      optPer.push(cOpt)
      downPer.push(cDown)
    }

    const baseTotal = round2(basePer.reduce((s, v) => s + v, 0))
    const optTotal  = round2(optPer.reduce((s, v) => s + v, 0))
    const downTotal = round2(downPer.reduce((s, v) => s + v, 0))

    return {
      ...r,
      typeId: t.id, typeLabel: t.label, kind: t.kind,
      currentValue: round2(start),
      growthBasePct: round2(Number(r.growthBasePct) || 0),
      optimisticAdjPct: round2(Number(r.optimisticAdjPct) || 0),
      downsideAdjPct:   round2(Number(r.downsideAdjPct) || 0),
      basePer, optPer, downPer,
      baseTotal, optTotal, downTotal,
    }
  })

  // Aggregate by scenario
  const aggregate = {
    base:       { revenue: 0, expense: 0, net: 0 },
    optimistic: { revenue: 0, expense: 0, net: 0 },
    downside:   { revenue: 0, expense: 0, net: 0 },
  }
  for (const r of rows) {
    if (r.kind === 'income') {
      aggregate.base.revenue       += r.baseTotal
      aggregate.optimistic.revenue += r.optTotal
      aggregate.downside.revenue   += r.downTotal
    } else {
      aggregate.base.expense       += r.baseTotal
      aggregate.optimistic.expense += r.optTotal
      aggregate.downside.expense   += r.downTotal
    }
  }
  for (const s of ['base', 'optimistic', 'downside']) {
    aggregate[s].revenue = round2(aggregate[s].revenue)
    aggregate[s].expense = round2(aggregate[s].expense)
    aggregate[s].net     = round2(aggregate[s].revenue - aggregate[s].expense)
  }

  // Net per-period (for each scenario)
  const netPerPeriod = { base: [], optimistic: [], downside: [] }
  for (let i = 0; i < totalPeriods; i++) {
    let base = 0, opt = 0, down = 0
    for (const r of rows) {
      const v = r.kind === 'income' ? 1 : -1
      base += v * (r.basePer[i] || 0)
      opt  += v * (r.optPer[i]  || 0)
      down += v * (r.downPer[i] || 0)
    }
    netPerPeriod.base.push(round2(base))
    netPerPeriod.optimistic.push(round2(opt))
    netPerPeriod.downside.push(round2(down))
  }

  // Yearly rollup
  const yearlyAggregate = {
    base:       { revenue: [], expense: [], net: [] },
    optimistic: { revenue: [], expense: [], net: [] },
    downside:   { revenue: [], expense: [], net: [] },
  }
  for (let y = 0; y < years; y++) {
    const start = y * freq.periodsPerYear
    const end = start + freq.periodsPerYear
    for (const s of ['base', 'optimistic', 'downside']) {
      const key = s === 'optimistic' ? 'optPer' : s === 'downside' ? 'downPer' : 'basePer'
      let rev = 0, exp = 0
      for (const r of rows) {
        const slice = r[key].slice(start, end).reduce((acc, v) => acc + v, 0)
        if (r.kind === 'income') rev += slice
        else exp += slice
      }
      yearlyAggregate[s].revenue.push(round2(rev))
      yearlyAggregate[s].expense.push(round2(exp))
      yearlyAggregate[s].net.push(round2(rev - exp))
    }
  }

  return {
    rows,
    aggregate,
    netPerPeriod,
    yearlyAggregate,
    periodLabels,
    years,
    totalPeriods,
    freq,
  }
}

/* ---- Period label generation ---- */

function generatePeriodLabels(startISO, totalPeriods, freqId) {
  const out = []
  const d = new Date(startISO || todayISO())
  if (Number.isNaN(d.valueOf())) return Array(totalPeriods).fill('').map((_, i) => `P${i + 1}`)
  if (freqId === 'annual') {
    for (let i = 0; i < totalPeriods; i++) {
      out.push(String(d.getFullYear() + i))
    }
  } else if (freqId === 'quarterly') {
    let q = Math.floor(d.getMonth() / 3) + 1
    let y = d.getFullYear()
    for (let i = 0; i < totalPeriods; i++) {
      out.push(`Q${q} ${String(y).slice(-2)}`)
      q += 1; if (q > 4) { q = 1; y += 1 }
    }
  } else {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    let m = d.getMonth()
    let y = d.getFullYear()
    for (let i = 0; i < totalPeriods; i++) {
      out.push(`${months[m]} ${String(y).slice(-2)}`)
      m += 1; if (m > 11) { m = 0; y += 1 }
    }
  }
  return out
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + main table
  if (data.includeYearlyTable) n++
  if (data.includePeriodTable) n++
  if (data.includeSensitivity) n++
  if (data.notes) n++
  return n
}
