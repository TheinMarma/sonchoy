/* ------------------------------------------------------------------ */
/*  Mortgage Payment — PITI (Principal + Interest + Taxes + Insurance) */
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

export const LOAN_PROGRAMS = [
  { id: 'conv-30', label: 'Conventional 30-year fixed', termYears: 30 },
  { id: 'conv-15', label: 'Conventional 15-year fixed', termYears: 15 },
  { id: 'fha',     label: 'FHA loan',                   termYears: 30 },
  { id: 'va',      label: 'VA loan',                    termYears: 30 },
  { id: 'jumbo',   label: 'Jumbo loan',                 termYears: 30 },
  { id: 'arm-5-1', label: '5/1 ARM (first 5 years)',    termYears: 30 },
  { id: 'custom',  label: 'Custom',                     termYears: 30 },
]

export const PMI_RULES = [
  { id: 'auto',     label: 'Auto-stop at 78% LTV (US default)' },
  { id: 'manual',   label: 'Run for fixed months' },
  { id: 'none',     label: 'No PMI' },
]

/* ---- Helpers ---- */

export function findLoanProgram(id) { return LOAN_PROGRAMS.find((p) => p.id === id) || LOAN_PROGRAMS[0] }
export function findPmiRule(id) { return PMI_RULES.find((r) => r.id === id) || PMI_RULES[0] }

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

/** Standard monthly P&I payment. */
export function computePI({ principal, annualRatePct, termMonths }) {
  const P = Number(principal) || 0
  const r = ((Number(annualRatePct) || 0) / 100) / 12
  const n = Math.max(1, Math.floor(Number(termMonths) || 0))
  if (P <= 0 || n <= 0) return 0
  if (r <= 0) return round2(P / n)
  const pow = Math.pow(1 + r, n)
  return round2((P * r * pow) / (pow - 1))
}

/**
 * Build a full PITI schedule.
 * Inputs:
 *   homePrice, downPayment   → loanPrincipal
 *   annualRatePct, termYears → P&I
 *   propertyTaxAnnual, insuranceAnnual, hoaMonthly, pmiAnnualRatePct
 *   pmiRuleId               → 'auto' | 'manual' | 'none'
 *   pmiManualMonths         → number of months to apply PMI when manual
 *   startDate
 *   extraPrincipal          → extra principal each month
 */
export function buildSchedule(data) {
  const homePrice    = Number(data.homePrice) || 0
  const downPayment  = Number(data.downPayment) || 0
  const principal    = Math.max(0, round2(homePrice - downPayment))
  const annualRate   = Number(data.annualRatePct) || 0
  const termYears    = Number(data.termYears) || 30
  const termMonths   = Math.max(1, Math.floor(termYears * 12))
  const pi           = computePI({ principal, annualRatePct: annualRate, termMonths })

  const propertyTax    = Number(data.propertyTaxAnnual)    || 0
  const insurance      = Number(data.insuranceAnnual)      || 0
  const hoaMonthly     = Number(data.hoaMonthly)           || 0
  const pmiAnnualRate  = Number(data.pmiAnnualRatePct)     || 0
  const pmiRule        = findPmiRule(data.pmiRuleId)
  const pmiManualMo    = Math.max(0, Number(data.pmiManualMonths) || 0)
  const extra          = Math.max(0, Number(data.extraPrincipal)  || 0)

  const monthlyTax       = round2(propertyTax / 12)
  const monthlyInsurance = round2(insurance / 12)

  const r = (annualRate / 100) / 12
  const pmiAutoCutoff = homePrice > 0 ? round2(homePrice * 0.78) : 0

  const rows = []
  let balance = principal
  let date = data.startDate || todayISO()
  let pmiActive = pmiAnnualRate > 0 && pmiRule.id !== 'none' && homePrice > 0 && (downPayment / Math.max(1, homePrice) < 0.20)
  let totalInterest = 0
  let totalPropertyTax = 0
  let totalInsurance = 0
  let totalPmi = 0
  let totalHoa = 0
  let totalExtra = 0

  for (let n = 1; n <= termMonths; n++) {
    if (balance <= 0.005) break

    const interest = round2(balance * r)
    let principalPaid = round2(pi - interest)
    if (extra > 0) principalPaid = round2(principalPaid + extra)
    if (principalPaid >= balance) principalPaid = round2(balance)
    const newBalance = round2(balance - principalPaid)

    // PMI logic
    let pmiThisMonth = 0
    if (pmiActive) {
      pmiThisMonth = round2((balance * pmiAnnualRate / 100) / 12)
      if (pmiRule.id === 'auto') {
        if (newBalance <= pmiAutoCutoff) pmiActive = false
      } else if (pmiRule.id === 'manual') {
        if (n >= pmiManualMo) pmiActive = false
      }
    }

    const piActual = round2(interest + (extra > 0 ? principalPaid - extra : principalPaid))
    const piWithExtra = round2(interest + principalPaid)
    const totalPayment = round2(piWithExtra + monthlyTax + monthlyInsurance + pmiThisMonth + hoaMonthly)

    rows.push({
      n,
      date,
      opening: round2(balance),
      pi: piActual,                    // base P&I (without extra)
      payment: totalPayment,
      principal: principalPaid,
      interest,
      tax: monthlyTax,
      insurance: monthlyInsurance,
      pmi: pmiThisMonth,
      hoa: hoaMonthly,
      extra: extra,
      closing: newBalance,
    })

    totalInterest    += interest
    totalPropertyTax += monthlyTax
    totalInsurance   += monthlyInsurance
    totalPmi         += pmiThisMonth
    totalHoa         += hoaMonthly
    totalExtra       += extra

    balance = newBalance
    date = addMonths(date, 1)
  }

  const monthlyPiti = rows.length > 0 ? rows[0].payment : round2(pi + monthlyTax + monthlyInsurance + (pmiActive ? round2(principal * pmiAnnualRate / 100 / 12) : 0) + hoaMonthly)

  return {
    principal,
    homePrice, downPayment,
    downPaymentPct: homePrice > 0 ? round2((downPayment / homePrice) * 100) : 0,
    termMonths, termYears,
    pi,
    monthlyTax,
    monthlyInsurance,
    monthlyPmi: rows.length > 0 ? rows[0].pmi : 0,
    hoaMonthly,
    monthlyPiti,
    rows,
    months: rows.length,
    totalInterest: round2(totalInterest),
    totalPropertyTax: round2(totalPropertyTax),
    totalInsurance: round2(totalInsurance),
    totalPmi: round2(totalPmi),
    totalHoa: round2(totalHoa),
    totalExtra: round2(totalExtra),
    totalPaid: round2(rows.reduce((s, r) => s + r.payment, 0)),
    pmiAutoCutoff,
    finalDate: rows.length > 0 ? rows[rows.length - 1].date : '',
  }
}

/** Yearly summary rollup. */
export function buildYearlySummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const yr = (r.date || '').slice(0, 4) || '—'
    const acc = map.get(yr) || {
      year: yr, principal: 0, interest: 0, tax: 0, insurance: 0, pmi: 0, hoa: 0, payment: 0, closing: 0,
    }
    acc.principal  += r.principal
    acc.interest   += r.interest
    acc.tax        += r.tax
    acc.insurance  += r.insurance
    acc.pmi        += r.pmi
    acc.hoa        += r.hoa
    acc.payment    += r.payment
    acc.closing     = r.closing
    map.set(yr, acc)
  }
  return Array.from(map.values()).map((a) => ({
    ...a,
    principal: round2(a.principal),
    interest:  round2(a.interest),
    tax:       round2(a.tax),
    insurance: round2(a.insurance),
    pmi:       round2(a.pmi),
    hoa:       round2(a.hoa),
    payment:   round2(a.payment),
    closing:   round2(a.closing),
  }))
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 3 // header + breakdown + schedule
  if (data.includeYearlySummary) n++
  if (data.includeAffordability) n++
  if (data.notes) n++
  return n
}

/** Front-end-debt-to-income affordability ratio. */
export function computeAffordability({ monthlyPiti, grossMonthlyIncome }) {
  const piti = Number(monthlyPiti) || 0
  const gross = Number(grossMonthlyIncome) || 0
  if (gross <= 0) return { ratio: 0, status: 'unknown' }
  const ratio = round2((piti / gross) * 100)
  let status = 'comfortable'
  if (ratio > 28) status = 'tight'
  if (ratio > 36) status = 'stretched'
  if (ratio > 43) status = 'risky'
  return { ratio, status }
}
