/* ------------------------------------------------------------------ */
/*  Savings Interest Report — compound growth with cash flows           */
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

export const COMPOUND_FREQUENCIES = [
  { id: 'annual',     label: 'Annual',     perYear: 1   },
  { id: 'semiannual', label: 'Semi-annual', perYear: 2  },
  { id: 'quarterly',  label: 'Quarterly',  perYear: 4   },
  { id: 'monthly',    label: 'Monthly',    perYear: 12  },
  { id: 'daily',      label: 'Daily',      perYear: 365 },
]

export const CONTRIBUTION_FREQUENCIES = [
  { id: 'none',       label: 'No recurring contributions', perYear: 0  },
  { id: 'monthly',    label: 'Monthly',                    perYear: 12 },
  { id: 'quarterly',  label: 'Quarterly',                  perYear: 4  },
  { id: 'annual',     label: 'Annual',                     perYear: 1  },
]

export const ACCOUNT_TYPES = [
  { id: 'savings',     label: 'Savings account' },
  { id: 'fd',          label: 'Fixed deposit / CD' },
  { id: 'rd',          label: 'Recurring deposit' },
  { id: 'isa',         label: 'ISA / tax-advantaged' },
  { id: 'sip',         label: 'SIP / regular investment' },
  { id: 'emergency',   label: 'Emergency fund' },
  { id: 'goal',        label: 'Goal-based savings' },
  { id: 'other',       label: 'Other' },
]

export const FLOW_TYPES = [
  { id: 'deposit',     label: 'Deposit / lump sum in',  kind: 'in'  },
  { id: 'withdrawal',  label: 'Withdrawal / lump sum out', kind: 'out' },
]

/* ---- Helpers ---- */

export function findCompoundFrequency(id) { return COMPOUND_FREQUENCIES.find((f) => f.id === id) || COMPOUND_FREQUENCIES[3] }
export function findContribFrequency(id) { return CONTRIBUTION_FREQUENCIES.find((f) => f.id === id) || CONTRIBUTION_FREQUENCIES[1] }
export function findAccountType(id) { return ACCOUNT_TYPES.find((a) => a.id === id) || ACCOUNT_TYPES[0] }
export function findFlowType(id) { return FLOW_TYPES.find((f) => f.id === id) || FLOW_TYPES[0] }

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
 * Build a monthly growth schedule.
 *
 * Inputs:
 *   openingBalance        — starting balance
 *   annualRatePct         — APY/APR
 *   compoundFrequencyId   — how often the bank credits interest
 *   contribAmount         — recurring contribution amount
 *   contribFrequencyId    — recurring contribution cadence ('none' to disable)
 *   tenureMonths          — schedule length in months
 *   startDate
 *   cashFlows             — array of { date, type, amount, label } for one-off deposits/withdrawals
 *   taxOnInterestPct      — optional tax rate applied to interest (TDS, withholding)
 *
 * The simulation runs monthly. Interest is credited only on months that align
 * with the compounding cadence; otherwise it accrues silently. Contributions
 * and cash flows apply on their respective dates.
 */
export function buildSchedule(data) {
  const opening = Number(data.openingBalance) || 0
  const annualRate = Number(data.annualRatePct) || 0
  const compoundF = findCompoundFrequency(data.compoundFrequencyId)
  const contribF = findContribFrequency(data.contribFrequencyId)
  const contribAmt = contribF.id === 'none' ? 0 : (Number(data.contribAmount) || 0)
  const taxRate = Math.max(0, Number(data.taxOnInterestPct) || 0)
  const monthsTotal = Math.max(1, Math.floor(Number(data.tenureMonths) || 0))

  // Map of date → array of {type, amount, label}
  const flowMap = new Map()
  for (const cf of (data.cashFlows || [])) {
    const date = cf.date
    if (!date) continue
    if (!flowMap.has(date)) flowMap.set(date, [])
    flowMap.get(date).push({
      type: cf.type || 'deposit',
      amount: Number(cf.amount) || 0,
      label: cf.label || '',
    })
  }

  const rows = []
  let balance = opening
  let date = data.startDate || todayISO()
  let totalContributions = 0
  let totalInterest = 0
  let totalInterestTax = 0
  let totalDeposits = 0
  let totalWithdrawals = 0

  // Interest accrual on a monthly tick. We compute the effective monthly rate
  // from the compound frequency:
  // monthly accrual rate = (1 + annualRate / perYear) ^ (perYear / 12) - 1
  const perYear = compoundF.perYear
  const monthlyAccrualRate = perYear > 0 && annualRate > 0
    ? Math.pow(1 + (annualRate / 100) / perYear, perYear / 12) - 1
    : 0

  // Contribution months: we apply on every month, every 3rd, or every 12th depending on frequency.
  const contribStep = contribF.perYear > 0 ? Math.round(12 / contribF.perYear) : 0

  for (let n = 1; n <= monthsTotal; n++) {
    const opening = balance

    // Cash flows on this date (deposits first, withdrawals after)
    const cashFlows = flowMap.get(date) || []
    let flowIn = 0
    let flowOut = 0
    for (const f of cashFlows) {
      if (f.type === 'deposit') flowIn += f.amount
      else if (f.type === 'withdrawal') flowOut += f.amount
    }
    flowIn = round2(flowIn)
    flowOut = round2(flowOut)

    // Recurring contribution
    let contribution = 0
    if (contribStep > 0 && n % contribStep === 0) contribution = contribAmt

    // Apply contributions and lump-in deposits first (BOP convention)
    balance = round2(balance + contribution + flowIn)

    // Interest on the resulting balance
    const interest = round2(balance * monthlyAccrualRate)
    const interestTax = round2(interest * taxRate / 100)
    const interestNet = round2(interest - interestTax)
    balance = round2(balance + interestNet)

    // Withdrawals at end of month
    if (flowOut > 0) {
      const actualWithdrawal = round2(Math.min(flowOut, balance))
      balance = round2(balance - actualWithdrawal)
      flowOut = actualWithdrawal
    }

    rows.push({
      n,
      date,
      opening: round2(opening),
      contribution,
      depositLumpSum: flowIn,
      withdrawalLumpSum: flowOut,
      interestGross: interest,
      interestTax,
      interestNet,
      closing: round2(balance),
    })

    totalContributions += contribution
    totalInterest += interest
    totalInterestTax += interestTax
    totalDeposits += flowIn
    totalWithdrawals += flowOut

    date = addMonths(date, 1)
  }

  return {
    rows,
    months: rows.length,
    openingBalance: round2(opening),
    finalBalance: round2(balance),
    totalContributions: round2(totalContributions),
    totalDeposits: round2(totalDeposits),
    totalWithdrawals: round2(totalWithdrawals),
    totalInterest: round2(totalInterest),
    totalInterestTax: round2(totalInterestTax),
    totalInterestNet: round2(totalInterest - totalInterestTax),
    totalIn: round2(opening + totalContributions + totalDeposits),
    effectiveAprPct: annualRate,
    finalDate: rows.length > 0 ? rows[rows.length - 1].date : '',
  }
}

/** Yearly summary rollup. */
export function buildYearlySummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const yr = (r.date || '').slice(0, 4) || '—'
    const acc = map.get(yr) || {
      year: yr, contribution: 0, depositLumpSum: 0, withdrawalLumpSum: 0,
      interestNet: 0, interestTax: 0, closing: 0,
    }
    acc.contribution      += r.contribution
    acc.depositLumpSum    += r.depositLumpSum
    acc.withdrawalLumpSum += r.withdrawalLumpSum
    acc.interestNet       += r.interestNet
    acc.interestTax       += r.interestTax
    acc.closing            = r.closing
    map.set(yr, acc)
  }
  return Array.from(map.values()).map((a) => ({
    ...a,
    contribution:      round2(a.contribution),
    depositLumpSum:    round2(a.depositLumpSum),
    withdrawalLumpSum: round2(a.withdrawalLumpSum),
    interestNet:       round2(a.interestNet),
    interestTax:       round2(a.interestTax),
    closing:           round2(a.closing),
  }))
}

/** Goal tracker — does the schedule reach the target? */
export function computeGoalProgress({ targetAmount, schedule }) {
  const target = Number(targetAmount) || 0
  if (target <= 0) return { hit: false, monthsToHit: null, finalProgressPct: 0 }
  let monthsToHit = null
  for (const r of schedule.rows) {
    if (r.closing >= target) { monthsToHit = r.n; break }
  }
  const finalProgressPct = target > 0 ? Math.min(100, round2((schedule.finalBalance / target) * 100)) : 0
  return {
    hit: monthsToHit != null,
    monthsToHit,
    monthsToHitDate: monthsToHit != null ? schedule.rows[monthsToHit - 1].date : null,
    finalProgressPct,
    shortfall: round2(Math.max(0, target - schedule.finalBalance)),
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + schedule
  if (data.includeYearlySummary)  n++
  if (data.includeGoalBlock && data.targetAmount > 0) n++
  if (data.includeCashFlowList && (data.cashFlows || []).length > 0) n++
  if (data.notes) n++
  return n
}
