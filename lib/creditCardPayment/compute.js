/* ------------------------------------------------------------------ */
/*  Credit Card Payment Schedule — minimum vs accelerated payoff       */
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

export const STRATEGIES = [
  { id: 'minimum',     label: 'Minimum payment only' },
  { id: 'fixed',       label: 'Fixed monthly payment' },
  { id: 'compare',     label: 'Compare both side-by-side' },
]

export const PAYOFF_GOALS = [
  { id: 'fastest',    label: 'Fastest possible payoff' },
  { id: 'budget',     label: 'Match a monthly budget' },
  { id: 'minonly',    label: 'See cost of minimum-only' },
]

/* ---- Helpers ---- */

export function findStrategy(id) { return STRATEGIES.find((s) => s.id === id) || STRATEGIES[2] }
export function findPayoffGoal(id) { return PAYOFF_GOALS.find((g) => g.id === id) || PAYOFF_GOALS[0] }

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

/**
 * Compute the minimum payment for one month given:
 *   balance, minPercentPct (e.g. 2 = 2% of balance),
 *   minFloor (e.g. 25 = ₹25 / $25 floor),
 *   monthlyInterest (so min covers at least interest)
 */
export function computeMinimumPayment({ balance, minPercentPct, minFloor, monthlyInterest }) {
  const B = Number(balance) || 0
  const pct = Number(minPercentPct) || 0
  const floor = Number(minFloor) || 0
  const interest = Number(monthlyInterest) || 0
  if (B <= 0) return 0
  const percentBased = B * pct / 100
  // Min payment must at least cover interest (most cards do this); typical is max of (percent, floor, interest + small principal)
  const baseMin = Math.max(percentBased, floor)
  // Ensure pays a tiny bit beyond interest
  const minWithInterestCover = Math.max(baseMin, interest + 1)
  return round2(Math.min(minWithInterestCover, B + interest)) // never more than total due
}

/**
 * Simulate a payoff with the given strategy.
 * Returns { rows, months, totalPaid, totalInterest, paidOff }
 *
 * paymentMode: 'minimum' | 'fixed'
 *   - minimum: each month's payment is computeMinimumPayment(...)
 *   - fixed:   each month's payment is data.fixedPayment (or computed)
 *
 * monthlyCharges: a flat amount of new charges added each month (revolving simulation)
 */
export function simulatePayoff({
  startingBalance, annualRatePct, paymentMode,
  fixedPayment, minPercentPct, minFloor,
  monthlyCharges, maxMonths, startISO,
}) {
  const r = ((Number(annualRatePct) || 0) / 100) / 12
  const maxN = Math.max(1, Number(maxMonths) || 600)
  const rows = []
  let balance = Number(startingBalance) || 0
  let date = startISO || todayISO()
  let totalPaid = 0
  let totalInterest = 0
  const extras = Math.max(0, Number(monthlyCharges) || 0)

  for (let n = 1; n <= maxN; n++) {
    if (balance <= 0.005) break
    // Optional new charges first
    if (extras > 0) balance = round2(balance + extras)
    const interest = round2(balance * r)
    let payment = 0
    if (paymentMode === 'minimum') {
      payment = computeMinimumPayment({
        balance, minPercentPct, minFloor, monthlyInterest: interest,
      })
    } else {
      payment = Number(fixedPayment) || 0
    }
    // Cap payment at the total amount due
    const totalDue = round2(balance + interest)
    payment = Math.min(payment, totalDue)
    // If payment is less than interest, the balance grows
    const principalPaid = round2(payment - interest)
    const newBalance = round2(balance - principalPaid)
    rows.push({
      n,
      date,
      opening: round2(balance),
      interest,
      payment: round2(payment),
      principal: principalPaid,
      newCharges: extras,
      closing: newBalance,
    })
    balance = newBalance
    totalPaid += payment
    totalInterest += interest
    date = addMonths(date, 1)
    // Safety: if payment cannot cover interest plus charges, exit
    if (payment <= interest + extras - 0.005 && n > 600) break
  }

  return {
    rows,
    months: rows.length,
    totalPaid: round2(totalPaid),
    totalInterest: round2(totalInterest),
    paidOff: balance <= 0.005,
    remainingBalance: round2(balance),
  }
}

/**
 * Build a full result set for the form data:
 * - Minimum-only simulation
 * - Fixed-payment simulation (if strategy includes fixed or compare)
 * - Side-by-side savings if compare
 */
export function computeSchedule(data) {
  const strategy = findStrategy(data.strategyId)
  const startISO = data.startDate || todayISO()

  const minimumSim = simulatePayoff({
    startingBalance: data.balance,
    annualRatePct: data.annualRatePct,
    paymentMode: 'minimum',
    minPercentPct: data.minPercentPct,
    minFloor: data.minFloor,
    monthlyCharges: data.monthlyCharges,
    maxMonths: data.minMaxMonths || 480,
    startISO,
  })

  let fixedSim = null
  if (strategy.id !== 'minimum') {
    fixedSim = simulatePayoff({
      startingBalance: data.balance,
      annualRatePct: data.annualRatePct,
      paymentMode: 'fixed',
      fixedPayment: data.fixedPayment,
      monthlyCharges: data.monthlyCharges,
      maxMonths: data.fixedMaxMonths || 240,
      startISO,
    })
  }

  // Savings if both available
  let savings = null
  if (fixedSim && minimumSim && fixedSim.paidOff && minimumSim.paidOff) {
    savings = {
      interestSaved: round2(minimumSim.totalInterest - fixedSim.totalInterest),
      monthsSaved: minimumSim.months - fixedSim.months,
      totalPaidDifference: round2(minimumSim.totalPaid - fixedSim.totalPaid),
    }
  } else if (fixedSim && fixedSim.paidOff && !minimumSim.paidOff) {
    savings = {
      interestSaved: null,
      monthsSaved: null,
      totalPaidDifference: null,
      note: 'Minimum-only never pays off the card under these assumptions.',
    }
  }

  return {
    strategy,
    minimumSim,
    fixedSim,
    savings,
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + schedule
  const strategy = findStrategy(data.strategyId)
  if (strategy.id === 'compare') n++
  if (data.includeMinimumDetail) n++
  if (data.notes) n++
  return n
}

/** Yearly summary (useful for long minimum-only payoffs). */
export function buildYearlySummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const yr = (r.date || '').slice(0, 4) || '—'
    const acc = map.get(yr) || { year: yr, interest: 0, principal: 0, payment: 0, closing: 0 }
    acc.interest  += r.interest
    acc.principal += r.principal
    acc.payment   += r.payment
    acc.closing    = r.closing
    map.set(yr, acc)
  }
  return Array.from(map.values()).map((a) => ({
    ...a,
    interest:  round2(a.interest),
    principal: round2(a.principal),
    payment:   round2(a.payment),
    closing:   round2(a.closing),
  }))
}
