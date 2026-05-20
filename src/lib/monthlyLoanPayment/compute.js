/* ------------------------------------------------------------------ */
/*  Monthly Loan Payment Generator — multi-loan monthly outflow        */
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

export const LOAN_TYPES = [
  { id: 'home',      label: 'Home / mortgage' },
  { id: 'auto',      label: 'Auto loan' },
  { id: 'personal',  label: 'Personal loan' },
  { id: 'student',   label: 'Student / education' },
  { id: 'credit',    label: 'Credit card / line' },
  { id: 'business',  label: 'Business loan' },
  { id: 'other',     label: 'Other' },
]

/* ---- Helpers ---- */

export function findLoanType(id) { return LOAN_TYPES.find((l) => l.id === id) || LOAN_TYPES[0] }

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

/** Compute standard monthly EMI. */
export function computeMonthlyEmi({ principal, annualRatePct, tenureMonths }) {
  const P = Number(principal) || 0
  const r = ((Number(annualRatePct) || 0) / 100) / 12
  const n = Math.max(1, Math.floor(Number(tenureMonths) || 0))
  if (P <= 0 || n <= 0) return 0
  if (r <= 0) return round2(P / n)
  const pow = Math.pow(1 + r, n)
  return round2((P * r * pow) / (pow - 1))
}

/**
 * Months left to clear a balance at given EMI / annual rate.
 * If EMI < monthly interest, returns Infinity (never pays off).
 */
export function monthsToPayoff({ balance, annualRatePct, emi }) {
  const P = Number(balance) || 0
  const r = ((Number(annualRatePct) || 0) / 100) / 12
  const M = Number(emi) || 0
  if (P <= 0 || M <= 0) return 0
  if (r <= 0) return Math.ceil(P / M)
  if (M <= P * r + 0.005) return Infinity
  const n = Math.log(M / (M - P * r)) / Math.log(1 + r)
  return Math.ceil(n)
}

/** Compute first-month split given balance and rate. */
function firstMonthSplit({ balance, annualRatePct, emi }) {
  const B = Number(balance) || 0
  const r = ((Number(annualRatePct) || 0) / 100) / 12
  const M = Number(emi) || 0
  if (B <= 0 || M <= 0) return { interest: 0, principal: 0 }
  const interest = round2(B * r)
  const principal = round2(Math.min(M - interest, B))
  return { interest, principal }
}

/** Compute the per-loan derived numbers used in the summary. */
export function computeLoanMetrics(loan) {
  const principal = Number(loan.principal) || 0
  const balance = loan.openingBalance != null && loan.openingBalance !== ''
    ? Number(loan.openingBalance) || 0
    : principal
  const tenure = Math.max(1, Number(loan.tenureMonths) || 0)
  const annualRatePct = Number(loan.annualRatePct) || 0
  // EMI computed against original principal + tenure
  const emi = loan.emi != null && loan.emi !== ''
    ? Number(loan.emi) || 0
    : computeMonthlyEmi({ principal, annualRatePct, tenureMonths: tenure })

  const { interest, principal: principalPortion } = firstMonthSplit({
    balance, annualRatePct, emi,
  })
  const monthsLeft = monthsToPayoff({ balance, annualRatePct, emi })
  const monthsLeftFinite = Number.isFinite(monthsLeft) ? monthsLeft : null
  // Total interest if held to maturity, given current balance:
  const totalPayments = monthsLeftFinite != null ? emi * monthsLeftFinite : 0
  const totalInterestRemaining = monthsLeftFinite != null ? round2(totalPayments - balance) : 0

  return {
    principal: round2(principal),
    balance: round2(balance),
    annualRatePct: round2(annualRatePct),
    tenureMonths: tenure,
    emi: round2(emi),
    monthlyInterest: interest,
    monthlyPrincipal: principalPortion,
    monthsLeft: monthsLeftFinite,
    totalInterestRemaining,
  }
}

/** Aggregate across all loans. */
export function computeAggregate(loans) {
  const enriched = (loans || []).map((l) => ({
    ...l,
    typeLabel: findLoanType(l.typeId).label,
    ...computeLoanMetrics(l),
  }))
  const totals = enriched.reduce((s, l) => {
    s.balance              += l.balance
    s.emi                  += l.emi
    s.monthlyInterest      += l.monthlyInterest
    s.monthlyPrincipal     += l.monthlyPrincipal
    s.totalInterestRemain  += l.totalInterestRemaining
    return s
  }, { balance: 0, emi: 0, monthlyInterest: 0, monthlyPrincipal: 0, totalInterestRemain: 0 })

  Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]) })

  // Weighted-average rate by balance
  const totalBalance = totals.balance
  const weightedRate = totalBalance > 0
    ? round2(enriched.reduce((s, l) => s + l.balance * l.annualRatePct, 0) / totalBalance)
    : 0

  return { loans: enriched, totals: { ...totals, weightedRate } }
}

/**
 * Project the next N months of combined outflow.
 * For each month, simulate each loan's EMI; sum across loans.
 */
export function buildMonthlyProjection(loans, months = 12, startISO) {
  const detailed = loans.map((l) => {
    const balance = l.openingBalance != null && l.openingBalance !== ''
      ? Number(l.openingBalance) || 0
      : (Number(l.principal) || 0)
    const annualRatePct = Number(l.annualRatePct) || 0
    const tenure = Math.max(1, Number(l.tenureMonths) || 0)
    const emi = l.emi != null && l.emi !== ''
      ? Number(l.emi) || 0
      : computeMonthlyEmi({ principal: Number(l.principal) || 0, annualRatePct, tenureMonths: tenure })
    return { name: l.name || 'Loan', balance, annualRatePct, emi, active: balance > 0 }
  })

  const rows = []
  let date = startISO || todayISO()
  for (let m = 1; m <= months; m++) {
    let mInterest = 0
    let mPrincipal = 0
    let mEmi = 0
    let activeBalance = 0
    for (const d of detailed) {
      if (!d.active) continue
      const r = (d.annualRatePct / 100) / 12
      const interest = round2(d.balance * r)
      let principalPaid = round2(d.emi - interest)
      if (principalPaid >= d.balance) principalPaid = round2(d.balance)
      const actualEmi = round2(interest + principalPaid)
      mInterest  += interest
      mPrincipal += principalPaid
      mEmi       += actualEmi
      d.balance = round2(d.balance - principalPaid)
      if (d.balance <= 0.005) d.active = false
      activeBalance += d.balance
    }
    rows.push({
      n: m,
      date,
      emi: round2(mEmi),
      interest: round2(mInterest),
      principal: round2(mPrincipal),
      closingBalance: round2(activeBalance),
    })
    date = addMonths(date, 1)
    if (detailed.every((d) => !d.active)) break
  }
  return rows
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + loans
  if (data.includeProjection)     n++
  if (data.includeTypeSummary)    n++
  if (data.notes)                 n++
  return n
}

/** Roll up by loan type. */
export function buildTypeSummary(loans) {
  const map = new Map()
  for (const l of loans) {
    const acc = map.get(l.typeId) || {
      typeId: l.typeId, label: l.typeLabel || findLoanType(l.typeId).label,
      count: 0, balance: 0, emi: 0, monthlyInterest: 0,
    }
    acc.count += 1
    acc.balance         += l.balance
    acc.emi             += l.emi
    acc.monthlyInterest += l.monthlyInterest
    map.set(l.typeId, acc)
  }
  return Array.from(map.values())
    .map((a) => ({
      ...a,
      balance: round2(a.balance),
      emi: round2(a.emi),
      monthlyInterest: round2(a.monthlyInterest),
    }))
    .sort((a, b) => b.balance - a.balance)
}
