/* ------------------------------------------------------------------ */
/*  Loan Amortization — multi-rate amortization (fixed / floating /    */
/*  step-up structures) with EMI recalculation at each reset.          */
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

export const RATE_STRUCTURES = [
  { id: 'fixed',    label: 'Fixed rate (one rate for the whole tenure)' },
  { id: 'stepup',   label: 'Step-up (rate increases on a schedule)' },
  { id: 'floating', label: 'Floating (rate resets periodically)' },
  { id: 'custom',   label: 'Custom segments' },
]

export const FREQUENCIES = [
  { id: 'monthly',    label: 'Monthly',     perYear: 12 },
  { id: 'quarterly',  label: 'Quarterly',   perYear: 4  },
  { id: 'semiannual', label: 'Semi-annual', perYear: 2  },
  { id: 'annual',     label: 'Annual',      perYear: 1  },
  { id: 'weekly',     label: 'Weekly',      perYear: 52 },
  { id: 'biweekly',   label: 'Bi-weekly',   perYear: 26 },
]

export const TENURE_UNITS = [
  { id: 'years',  label: 'Years',  toMonths: 12 },
  { id: 'months', label: 'Months', toMonths: 1  },
]

export const LOAN_TYPES = [
  { id: 'home',      label: 'Home loan / Mortgage' },
  { id: 'auto',      label: 'Auto loan' },
  { id: 'personal',  label: 'Personal loan' },
  { id: 'business',  label: 'Business loan' },
  { id: 'education', label: 'Education loan' },
  { id: 'other',     label: 'Other' },
]

/* ---- Helpers ---- */

export function findRateStructure(id) { return RATE_STRUCTURES.find((r) => r.id === id) || RATE_STRUCTURES[0] }
export function findFrequency(id)     { return FREQUENCIES.find((f) => f.id === id)     || FREQUENCIES[0] }
export function findTenureUnit(id)    { return TENURE_UNITS.find((u) => u.id === id)    || TENURE_UNITS[0] }
export function findLoanType(id)      { return LOAN_TYPES.find((l) => l.id === id)      || LOAN_TYPES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

export function addMonths(iso, months) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  const target = d.getMonth() + Number(months || 0)
  const yr = d.getFullYear() + Math.floor(target / 12)
  const mo = ((target % 12) + 12) % 12
  const lastDay = new Date(yr, mo + 1, 0).getDate()
  const day = Math.min(d.getDate(), lastDay)
  return new Date(yr, mo, day).toISOString().slice(0, 10)
}
export function addDays(iso, days) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}
export function nextDate(iso, frequencyId) {
  switch (frequencyId) {
    case 'monthly':    return addMonths(iso, 1)
    case 'quarterly':  return addMonths(iso, 3)
    case 'semiannual': return addMonths(iso, 6)
    case 'annual':     return addMonths(iso, 12)
    case 'weekly':     return addDays(iso, 7)
    case 'biweekly':   return addDays(iso, 14)
    default:           return addMonths(iso, 1)
  }
}

export function tenureToPeriods({ tenureValue, tenureUnitId, frequencyId }) {
  const months = Number(tenureValue || 0) * findTenureUnit(tenureUnitId).toMonths
  const f = findFrequency(frequencyId)
  return Math.max(1, Math.round(months * (f.perYear / 12)))
}

/** Standard EMI formula. */
export function computeEmi({ principal, perPeriodRate, periods }) {
  const P = Number(principal) || 0
  const r = Number(perPeriodRate) || 0
  const n = Math.max(1, Math.floor(Number(periods) || 0))
  if (P <= 0 || n <= 0) return 0
  if (r <= 0) return round2(P / n)
  const pow = Math.pow(1 + r, n)
  return round2((P * r * pow) / (pow - 1))
}

/**
 * Resolve the rate-segments array into a per-period rate lookup.
 * Returns an array of length `totalPeriods` containing the per-period rate.
 *
 * Each segment: { startPeriod (1-based), annualRatePct }
 * Sorted ascending by startPeriod. Segment 1 must start at 1.
 */
export function buildRateMap({ segments, totalPeriods, frequencyId, baseAnnualRatePct }) {
  const f = findFrequency(frequencyId)
  const sorted = (segments || [])
    .filter((s) => Number.isFinite(Number(s.startPeriod)))
    .map((s) => ({
      startPeriod: Math.max(1, Math.floor(Number(s.startPeriod))),
      annualRatePct: Number(s.annualRatePct) || 0,
    }))
    .sort((a, b) => a.startPeriod - b.startPeriod)

  // Ensure segment at period 1
  if (sorted.length === 0 || sorted[0].startPeriod !== 1) {
    sorted.unshift({ startPeriod: 1, annualRatePct: Number(baseAnnualRatePct) || 0 })
  }

  const out = []
  let segIdx = 0
  for (let p = 1; p <= totalPeriods; p++) {
    while (segIdx + 1 < sorted.length && sorted[segIdx + 1].startPeriod <= p) segIdx++
    out.push(sorted[segIdx].annualRatePct / 100 / f.perYear)
  }
  return { perPeriodRates: out, resolvedSegments: sorted }
}

/**
 * Build a full amortization schedule with potentially-changing rates.
 * EMI is recalculated whenever the per-period rate changes — using the
 * remaining balance and the remaining periods, mirroring how a bank
 * re-amortizes after a rate reset.
 */
export function buildSchedule(data) {
  const P = Number(data.principal) || 0
  const periods = Number(data.periods) || tenureToPeriods({
    tenureValue: data.tenureValue,
    tenureUnitId: data.tenureUnitId,
    frequencyId: data.frequencyId,
  })
  const { perPeriodRates, resolvedSegments } = buildRateMap({
    segments: data.segments,
    totalPeriods: periods,
    frequencyId: data.frequencyId,
    baseAnnualRatePct: data.annualRatePct,
  })

  const extra = Math.max(0, Number(data.extraPayment) || 0)
  const rows = []
  let balance = P
  let date = data.firstPaymentDate || data.startDate || ''
  let currentEmi = 0
  let lastRate = -1

  for (let i = 1; i <= periods; i++) {
    if (balance <= 0.005) break
    const r = perPeriodRates[i - 1]
    if (r !== lastRate) {
      // Recompute EMI for the remaining schedule
      const remaining = periods - i + 1
      currentEmi = computeEmi({
        principal: balance,
        perPeriodRate: r,
        periods: remaining,
      })
      lastRate = r
    }
    const interest = round2(balance * r)
    let principalPaid = round2(currentEmi - interest)
    if (extra > 0) principalPaid = round2(principalPaid + extra)
    let actualEmi = round2(interest + principalPaid)
    if (principalPaid >= balance) {
      principalPaid = round2(balance)
      actualEmi = round2(interest + principalPaid)
    }
    const closing = round2(balance - principalPaid)
    rows.push({
      n: i,
      dueDate: date,
      opening: round2(balance),
      ratePct: round2(r * findFrequency(data.frequencyId).perYear * 100),
      emi: actualEmi,
      interest,
      principal: principalPaid,
      closing,
    })
    balance = closing
    date = nextDate(date, data.frequencyId)
    if (balance <= 0.005) break
  }

  const totalInterest = round2(rows.reduce((s, r2) => s + r2.interest, 0))
  const totalPaid     = round2(rows.reduce((s, r2) => s + r2.emi, 0))

  return {
    rows,
    totalInterest,
    totalPaid,
    finalPaymentDate: rows.length ? rows[rows.length - 1].dueDate : '',
    periodsActual: rows.length,
    initialEmi: rows.length ? rows[0].emi : 0,
    resolvedSegments,
  }
}

/** Yearly rollup of the schedule. */
export function buildYearlySummary(rows) {
  const byYear = new Map()
  for (const r of rows) {
    const yr = (r.dueDate || '').slice(0, 4) || '—'
    const acc = byYear.get(yr) || { year: yr, principal: 0, interest: 0, emi: 0, closing: 0 }
    acc.principal += r.principal
    acc.interest  += r.interest
    acc.emi       += r.emi
    acc.closing    = r.closing
    byYear.set(yr, acc)
  }
  return Array.from(byYear.values()).map((a) => ({
    ...a,
    principal: round2(a.principal),
    interest:  round2(a.interest),
    emi:       round2(a.emi),
    closing:   round2(a.closing),
  }))
}

/** Segment-level rollup (between rate boundaries). */
export function buildSegmentSummary(rows, resolvedSegments) {
  if (!rows.length || !resolvedSegments.length) return []
  const out = []
  for (let i = 0; i < resolvedSegments.length; i++) {
    const start = resolvedSegments[i].startPeriod
    const end = (i + 1 < resolvedSegments.length) ? resolvedSegments[i + 1].startPeriod - 1 : rows.length
    const slice = rows.filter((r) => r.n >= start && r.n <= end)
    if (!slice.length) continue
    out.push({
      label: `Periods ${start}–${slice[slice.length - 1].n}`,
      ratePct: resolvedSegments[i].annualRatePct,
      startDate: slice[0].dueDate,
      endDate: slice[slice.length - 1].dueDate,
      emiAtStart: slice[0].emi,
      principalPaid: round2(slice.reduce((s, r) => s + r.principal, 0)),
      interestPaid:  round2(slice.reduce((s, r) => s + r.interest, 0)),
      totalPaid:     round2(slice.reduce((s, r) => s + r.emi, 0)),
      closing:       slice[slice.length - 1].closing,
    })
  }
  return out
}
