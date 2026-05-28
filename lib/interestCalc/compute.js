/* ------------------------------------------------------------------ */
/*  Interest Calculation Sheet — simple, compound, reducing balance    */
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

export const INTEREST_METHODS = [
  { id: 'simple',    label: 'Simple interest' },
  { id: 'compound',  label: 'Compound interest' },
  { id: 'reducing',  label: 'Reducing balance' },
]

export const COMPOUND_FREQUENCIES = [
  { id: 'annual',     label: 'Annual',     perYear: 1   },
  { id: 'semiannual', label: 'Semi-annual', perYear: 2  },
  { id: 'quarterly',  label: 'Quarterly',  perYear: 4   },
  { id: 'monthly',    label: 'Monthly',    perYear: 12  },
  { id: 'daily',      label: 'Daily',      perYear: 365 },
]

export const TENURE_UNITS = [
  { id: 'years',  label: 'Years',  toMonths: 12 },
  { id: 'months', label: 'Months', toMonths: 1  },
  { id: 'days',   label: 'Days',   toMonths: 1 / 30 },
]

export const SHEET_PURPOSES = [
  { id: 'savings',     label: 'Savings / FD accrual' },
  { id: 'loan',        label: 'Loan interest verification' },
  { id: 'penalty',     label: 'Late-fee / penalty interest' },
  { id: 'investment',  label: 'Investment growth projection' },
  { id: 'other',       label: 'Other / general' },
]

/* ---- Helpers ---- */

export function findInterestMethod(id) { return INTEREST_METHODS.find((m) => m.id === id) || INTEREST_METHODS[0] }
export function findCompoundFrequency(id) { return COMPOUND_FREQUENCIES.find((f) => f.id === id) || COMPOUND_FREQUENCIES[3] }
export function findTenureUnit(id) { return TENURE_UNITS.find((u) => u.id === id) || TENURE_UNITS[0] }
export function findSheetPurpose(id) { return SHEET_PURPOSES.find((p) => p.id === id) || SHEET_PURPOSES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }
function round4(n) { return Math.round((Number(n) || 0) * 10000) / 10000 }

/** Add months to ISO. */
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
export function daysBetween(aIso, bIso) {
  if (!aIso || !bIso) return 0
  const a = new Date(aIso)
  const b = new Date(bIso)
  if (Number.isNaN(a.valueOf()) || Number.isNaN(b.valueOf())) return 0
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

/** Step to next compound period. */
function stepDate(iso, frequencyId) {
  switch (frequencyId) {
    case 'annual':     return addMonths(iso, 12)
    case 'semiannual': return addMonths(iso, 6)
    case 'quarterly':  return addMonths(iso, 3)
    case 'monthly':    return addMonths(iso, 1)
    case 'daily':      return addDays(iso, 1)
    default:           return addMonths(iso, 1)
  }
}

/** Convert tenure to total months & days for calculations. */
export function tenureToDays({ tenureValue, tenureUnitId }) {
  const v = Number(tenureValue) || 0
  switch (tenureUnitId) {
    case 'years':  return Math.round(v * 365)
    case 'months': return Math.round(v * 30)
    case 'days':   return Math.round(v)
    default:       return Math.round(v * 365)
  }
}
export function tenureToPeriods({ tenureValue, tenureUnitId, frequencyId }) {
  const f = findCompoundFrequency(frequencyId)
  const days = tenureToDays({ tenureValue, tenureUnitId })
  const periodDays = 365 / f.perYear
  return Math.max(1, Math.round(days / periodDays))
}

/* ---- Core calculations ---- */

/** Simple interest. SI = P × r × t (years). */
export function computeSimple({ principal, annualRatePct, days }) {
  const P = Number(principal) || 0
  const r = (Number(annualRatePct) || 0) / 100
  const t = days / 365
  return round2(P * r * t)
}

/** Compound interest. CI = P × (1 + r/n)^(n × t) − P. */
export function computeCompound({ principal, annualRatePct, days, frequencyId }) {
  const P = Number(principal) || 0
  const r = (Number(annualRatePct) || 0) / 100
  const f = findCompoundFrequency(frequencyId)
  const t = days / 365
  const n = f.perYear
  if (P <= 0 || r <= 0) return 0
  const final = P * Math.pow(1 + r / n, n * t)
  return round2(final - P)
}

/**
 * Reducing balance: an EMI is paid each period; interest accrues on the
 * remaining balance; principal portion of EMI reduces the balance.
 * If emi is 0 / undefined, we compute the EMI required to fully amortize over the periods.
 */
export function computeReducing({ principal, annualRatePct, periods, frequencyId, providedEmi }) {
  const P = Number(principal) || 0
  const f = findCompoundFrequency(frequencyId)
  const r = ((Number(annualRatePct) || 0) / 100) / f.perYear
  const n = Math.max(1, Math.floor(Number(periods) || 0))
  if (P <= 0) return { emi: 0, totalInterest: 0 }
  let emi = Number(providedEmi) || 0
  if (!emi) {
    if (r <= 0) emi = round2(P / n)
    else {
      const pow = Math.pow(1 + r, n)
      emi = round2((P * r * pow) / (pow - 1))
    }
  }
  let balance = P
  let totalInterest = 0
  for (let i = 1; i <= n; i++) {
    if (balance <= 0.005) break
    const interest = round2(balance * r)
    let principalPaid = round2(emi - interest)
    if (principalPaid >= balance) principalPaid = round2(balance)
    balance = round2(balance - principalPaid)
    totalInterest += interest
  }
  return { emi: round2(emi), totalInterest: round2(totalInterest) }
}

/**
 * Build a period-by-period schedule for any method.
 * Returns: { rows, totalInterest, finalBalance, methodLabel }
 */
export function buildSchedule(data) {
  const method = findInterestMethod(data.methodId)
  const f = findCompoundFrequency(data.frequencyId)
  const P = Number(data.principal) || 0
  const r = (Number(data.annualRatePct) || 0) / 100
  const days = tenureToDays({ tenureValue: data.tenureValue, tenureUnitId: data.tenureUnitId })
  const periods = tenureToPeriods({
    tenureValue: data.tenureValue, tenureUnitId: data.tenureUnitId, frequencyId: data.frequencyId,
  })
  const periodDays = 365 / f.perYear
  const ratePerPeriod = r / f.perYear

  const rows = []
  let date = data.startDate || ''

  if (method.id === 'simple') {
    // Single accrual per compound-frequency period using simple formula
    let cumulative = 0
    let opening = P
    for (let i = 1; i <= periods; i++) {
      const interest = round2(opening * ratePerPeriod)
      cumulative = round2(cumulative + interest)
      const closing = round2(opening + cumulative)   // simple = stays the same opening principal
      const dueDate = stepDate(date, data.frequencyId)
      rows.push({
        n: i,
        date: dueDate,
        opening: P,                  // simple interest: opening stays as principal
        interestAccrued: interest,
        cumulativeInterest: cumulative,
        closing: round2(P + cumulative),
      })
      date = dueDate
    }
    return {
      rows,
      totalInterest: round2(rows.length ? rows[rows.length - 1].cumulativeInterest : 0),
      finalBalance: round2(P + (rows.length ? rows[rows.length - 1].cumulativeInterest : 0)),
      methodLabel: method.label,
      emi: 0,
      periods: rows.length,
    }
  }

  if (method.id === 'compound') {
    let opening = P
    let cumulative = 0
    for (let i = 1; i <= periods; i++) {
      const interest = round2(opening * ratePerPeriod)
      cumulative = round2(cumulative + interest)
      const closing = round2(opening + interest)
      const dueDate = stepDate(date, data.frequencyId)
      rows.push({
        n: i,
        date: dueDate,
        opening: round2(opening),
        interestAccrued: interest,
        cumulativeInterest: cumulative,
        closing,
      })
      opening = closing
      date = dueDate
    }
    return {
      rows,
      totalInterest: round2(rows.length ? rows[rows.length - 1].cumulativeInterest : 0),
      finalBalance: round2(rows.length ? rows[rows.length - 1].closing : P),
      methodLabel: method.label,
      emi: 0,
      periods: rows.length,
    }
  }

  // Reducing balance
  const { emi } = computeReducing({
    principal: P,
    annualRatePct: data.annualRatePct,
    periods,
    frequencyId: data.frequencyId,
    providedEmi: data.emi,
  })
  let balance = P
  let totalInterest = 0
  for (let i = 1; i <= periods; i++) {
    if (balance <= 0.005) break
    const interest = round2(balance * ratePerPeriod)
    let principalPaid = round2(emi - interest)
    if (principalPaid >= balance) principalPaid = round2(balance)
    const closing = round2(balance - principalPaid)
    const dueDate = stepDate(date, data.frequencyId)
    rows.push({
      n: i,
      date: dueDate,
      opening: round2(balance),
      payment: round2(interest + principalPaid),
      interestAccrued: interest,
      principalPaid,
      cumulativeInterest: round2(totalInterest + interest),
      closing,
    })
    balance = closing
    totalInterest += interest
    date = dueDate
  }
  return {
    rows,
    totalInterest: round2(totalInterest),
    finalBalance: round2(balance),
    methodLabel: method.label,
    emi,
    periods: rows.length,
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + schedule
  if (data.includeYearlySummary) n++
  if (data.notes) n++
  return n
}

/** Yearly rollup (for compound/simple). */
export function buildYearlySummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const yr = (r.date || '').slice(0, 4) || '—'
    const acc = map.get(yr) || { year: yr, interest: 0, closing: 0 }
    acc.interest += r.interestAccrued || 0
    acc.closing   = r.closing
    map.set(yr, acc)
  }
  return Array.from(map.values()).map((a) => ({
    ...a,
    interest: round2(a.interest),
    closing:  round2(a.closing),
  }))
}
