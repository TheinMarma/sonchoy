/* ------------------------------------------------------------------ */
/*  EMI Schedule — amortization helpers + constants                    */
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

export const FREQUENCIES = [
  { id: 'monthly',     label: 'Monthly',      perYear: 12 },
  { id: 'quarterly',   label: 'Quarterly',    perYear: 4  },
  { id: 'semiannual',  label: 'Semi-annual',  perYear: 2  },
  { id: 'annual',      label: 'Annual',       perYear: 1  },
  { id: 'weekly',      label: 'Weekly',       perYear: 52 },
  { id: 'biweekly',    label: 'Bi-weekly',    perYear: 26 },
]

export const TENURE_UNITS = [
  { id: 'years',  label: 'Years',  toMonths: 12 },
  { id: 'months', label: 'Months', toMonths: 1  },
]

export const LOAN_TYPES = [
  { id: 'home',     label: 'Home loan / Mortgage' },
  { id: 'auto',     label: 'Auto loan' },
  { id: 'personal', label: 'Personal loan' },
  { id: 'business', label: 'Business loan' },
  { id: 'education', label: 'Education loan' },
  { id: 'other',    label: 'Other' },
]

/* ---- Helpers ---- */

export function findFrequency(id) {
  return FREQUENCIES.find((f) => f.id === id) || FREQUENCIES[0]
}
export function findTenureUnit(id) {
  return TENURE_UNITS.find((u) => u.id === id) || TENURE_UNITS[0]
}
export function findLoanType(id) {
  return LOAN_TYPES.find((l) => l.id === id) || LOAN_TYPES[0]
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** Add N months to an ISO date, preserving day-of-month where possible. */
export function addMonths(iso, months) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  const targetMonth = d.getMonth() + Number(months || 0)
  const targetYear  = d.getFullYear() + Math.floor(targetMonth / 12)
  const wrappedMonth = ((targetMonth % 12) + 12) % 12
  const day = d.getDate()
  // Clamp day to end of target month if necessary
  const lastDay = new Date(targetYear, wrappedMonth + 1, 0).getDate()
  const safeDay = Math.min(day, lastDay)
  const out = new Date(targetYear, wrappedMonth, safeDay)
  return out.toISOString().slice(0, 10)
}

/** Add N days to ISO. */
export function addDays(iso, days) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

/** Step to the next instalment date based on frequency. */
export function nextDate(iso, frequencyId) {
  const f = findFrequency(frequencyId)
  switch (f.id) {
    case 'monthly':    return addMonths(iso, 1)
    case 'quarterly':  return addMonths(iso, 3)
    case 'semiannual': return addMonths(iso, 6)
    case 'annual':     return addMonths(iso, 12)
    case 'weekly':     return addDays(iso, 7)
    case 'biweekly':   return addDays(iso, 14)
    default:           return addMonths(iso, 1)
  }
}

/**
 * Compute the equated instalment for the given frequency.
 * Uses the standard amortization formula:
 *    P × r × (1 + r)^n / ((1 + r)^n − 1)
 * where r is the per-period rate and n the total number of periods.
 */
export function computeEmi({ principal, annualRatePct, periods, frequencyId }) {
  const P = Number(principal) || 0
  const annual = (Number(annualRatePct) || 0) / 100
  const f = findFrequency(frequencyId)
  const n = Math.max(1, Math.floor(Number(periods) || 0))
  if (P <= 0 || n <= 0) return 0
  if (annual <= 0) return round2(P / n)
  const r = annual / f.perYear
  const pow = Math.pow(1 + r, n)
  return round2((P * r * pow) / (pow - 1))
}

/** Convert tenure (value + unit) to number of periods for the given frequency. */
export function tenureToPeriods({ tenureValue, tenureUnitId, frequencyId }) {
  const months = Number(tenureValue || 0) * findTenureUnit(tenureUnitId).toMonths
  const f = findFrequency(frequencyId)
  // months → periods: periods = months × (perYear / 12)
  return Math.max(1, Math.round(months * (f.perYear / 12)))
}

/**
 * Build a full amortization schedule.
 * Returns an array of { n, dueDate, opening, emi, interest, principal, closing }.
 * If extraPayment > 0, it is added to the principal portion each period until closed.
 */
export function buildSchedule(data) {
  const P = Number(data.principal) || 0
  const periods = Number(data.periods) || 0
  const f = findFrequency(data.frequencyId)
  const r = ((Number(data.annualRatePct) || 0) / 100) / f.perYear
  const emi = computeEmi({
    principal: P,
    annualRatePct: data.annualRatePct,
    periods,
    frequencyId: data.frequencyId,
  })
  const extra = Math.max(0, Number(data.extraPayment) || 0)

  const rows = []
  let balance = P
  let date = data.firstPaymentDate || data.startDate || ''

  for (let i = 1; i <= periods; i++) {
    if (balance <= 0.005) break
    const interest = round2(balance * r)
    let principalPaid = round2(emi - interest)
    // If extra applied
    if (extra > 0) principalPaid = round2(principalPaid + extra)
    let actualEmi = round2(interest + principalPaid)
    // Last period — pay off remaining
    if (principalPaid >= balance) {
      principalPaid = round2(balance)
      actualEmi = round2(interest + principalPaid)
    }
    const closing = round2(balance - principalPaid)
    rows.push({
      n: i,
      dueDate: date,
      opening: round2(balance),
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
  const totalPaid = round2(rows.reduce((s, r2) => s + r2.emi, 0))
  return {
    emi,
    rows,
    totalInterest,
    totalPaid,
    finalPaymentDate: rows.length ? rows[rows.length - 1].dueDate : '',
    periodsActual: rows.length,
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
