/* ------------------------------------------------------------------ */
/*  Late Payment Notice — statutory framework, interest, compensation  */
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

/* ---- Statutory frameworks ---- */
/*
 * Each framework defines:
 *  - baseRatePct: the bank/policy reference rate (editable)
 *  - statutoryMarginPct: the legal margin added to base
 *  - compensationFor(amount): statutory fixed compensation
 *  - reference: short citation
 *  - currencyDefault
 */

export const FRAMEWORKS = [
  {
    id: 'uk',
    label: 'United Kingdom — Late Payment of Commercial Debts Act 1998',
    reference: 'Late Payment of Commercial Debts (Interest) Act 1998 (as amended)',
    baseRatePct: 5.25,           // Bank of England base rate (editable)
    baseRateLabel: 'Bank of England base rate',
    statutoryMarginPct: 8,
    statutoryMarginLabel: 'Statutory margin (s.6)',
    currencyDefault: 'GBP',
    compensationFor: (amount) => {
      const a = Number(amount) || 0
      if (a < 1000)    return 40
      if (a < 10000)   return 70
      return 100
    },
    compensationLabel: 'Fixed compensation (s.5A)',
    compensationCurrencyLabel: '£',
  },
  {
    id: 'eu',
    label: 'European Union — Late Payment Directive 2011/7/EU',
    reference: 'EU Directive 2011/7/EU on combating late payment in commercial transactions',
    baseRatePct: 4.50,
    baseRateLabel: 'ECB reference rate',
    statutoryMarginPct: 8,
    statutoryMarginLabel: 'Statutory margin (Art. 2(6))',
    currencyDefault: 'EUR',
    compensationFor: () => 40,
    compensationLabel: 'Recovery costs (Art. 6)',
    compensationCurrencyLabel: '€',
  },
  {
    id: 'us',
    label: 'United States — contractual rate (state law varies)',
    reference: 'Contractual late-payment rate; subject to applicable state usury laws',
    baseRatePct: 0,
    baseRateLabel: 'Reference rate',
    statutoryMarginPct: 18,
    statutoryMarginLabel: 'Annual rate (cap varies by state)',
    currencyDefault: 'USD',
    compensationFor: () => 0,
    compensationLabel: 'Recovery costs',
    compensationCurrencyLabel: '$',
  },
  {
    id: 'custom',
    label: 'Custom — your contract rate',
    reference: 'Rate as set out in the parties\' written agreement',
    baseRatePct: 0,
    baseRateLabel: 'Base reference',
    statutoryMarginPct: 10,
    statutoryMarginLabel: 'Contractual rate',
    currencyDefault: 'USD',
    compensationFor: () => 0,
    compensationLabel: 'Recovery costs',
    compensationCurrencyLabel: '',
  },
]

export const NOTICE_PURPOSES = [
  { id: 'demand',     label: 'Demand for payment + interest' },
  { id: 'pre-action', label: 'Letter before action' },
  { id: 'final',      label: 'Final statutory demand' },
]

export const SIGN_OFFS = [
  { id: 'kind',       label: 'Kind regards' },
  { id: 'sincerely',  label: 'Yours sincerely' },
  { id: 'faithfully', label: 'Yours faithfully' },
  { id: 'regards',    label: 'Regards' },
]

/* ---- Helpers ---- */

export function findFramework(id) {
  return FRAMEWORKS.find((f) => f.id === id) || FRAMEWORKS[0]
}
export function findPurpose(id) {
  return NOTICE_PURPOSES.find((p) => p.id === id) || NOTICE_PURPOSES[0]
}
export function findSignOff(id) {
  return SIGN_OFFS.find((s) => s.id === id) || SIGN_OFFS[0]
}

export function daysBetween(aIso, bIso) {
  if (!aIso || !bIso) return 0
  const a = new Date(aIso)
  const b = new Date(bIso)
  if (Number.isNaN(a.valueOf()) || Number.isNaN(b.valueOf())) return 0
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

export function addDays(iso, days) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** Daily simple interest accrual: principal × rate × days / 365 */
export function computeStatutoryInterest({
  amount, baseRatePct, marginPct, daysOverdue,
}) {
  const principal = Number(amount) || 0
  const r = ((Number(baseRatePct) || 0) + (Number(marginPct) || 0)) / 100
  const days = Math.max(0, Number(daysOverdue) || 0)
  return {
    rate:   round2(r * 100),
    days,
    amount: round2(principal * r * (days / 365)),
    perDay: round2(principal * r / 365),
  }
}

/** Build the full computation set used by the letter. */
export function computeNotice(data) {
  const fw = findFramework(data.frameworkId)
  const principal = Number(data.amount) || 0
  const daysOverdue = Math.max(0, daysBetween(data.dueDate, data.noticeDate))
  const interest = computeStatutoryInterest({
    amount: principal,
    baseRatePct: data.baseRatePct,
    marginPct: data.marginPct,
    daysOverdue,
  })
  const compensation = data.includeCompensation ? fw.compensationFor(principal) : 0
  const deadline = addDays(data.noticeDate, Number(data.deadlineDays) || 14)
  return {
    framework: fw,
    principal: round2(principal),
    daysOverdue,
    interest,
    compensation: round2(compensation),
    total: round2(principal + interest.amount + compensation),
    deadline,
    deadlineFormatted: formatDate(deadline),
  }
}
