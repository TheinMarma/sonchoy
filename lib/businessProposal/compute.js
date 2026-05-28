/* ------------------------------------------------------------------ */
/*  Business Proposal Generator — helpers + constants                  */
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

export const PROPOSAL_TONES = [
  { id: 'consultative', label: 'Consultative / strategic' },
  { id: 'creative',     label: 'Creative / agency' },
  { id: 'technical',    label: 'Technical / engineering' },
  { id: 'sales',        label: 'Sales / commercial' },
]

export const PAYMENT_TERMS = [
  { id: 'net-7',      label: 'Net 7',      days: 7  },
  { id: 'net-14',     label: 'Net 14',     days: 14 },
  { id: 'net-30',     label: 'Net 30',     days: 30 },
  { id: 'net-60',     label: 'Net 60',     days: 60 },
  { id: '50-50',      label: '50% upfront, 50% on completion', days: 0 },
  { id: 'milestone',  label: 'Milestone-based',                days: 0 },
]

export const VALIDITY_OPTIONS = [
  { id: '14',  label: '14 days', days: 14 },
  { id: '30',  label: '30 days', days: 30 },
  { id: '60',  label: '60 days', days: 60 },
  { id: '90',  label: '90 days', days: 90 },
]

/* ---- Computed helpers ---- */

export function findPaymentTerm(id) {
  return PAYMENT_TERMS.find((p) => p.id === id) || PAYMENT_TERMS[2]
}
export function findValidity(id) {
  return VALIDITY_OPTIONS.find((v) => v.id === id) || VALIDITY_OPTIONS[1]
}
export function findTone(id) {
  return PROPOSAL_TONES.find((t) => t.id === id) || PROPOSAL_TONES[0]
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

export function computeInvestmentTotal(items, { taxRate = 0, discount = 0 } = {}) {
  const subtotal = (items || []).reduce((s, it) => {
    const qty = Number(it?.qty) || 0
    const rate = Number(it?.rate) || 0
    return s + qty * rate
  }, 0)
  const discountAmt = round2(subtotal * (Number(discount) || 0) / 100)
  const taxable = subtotal - discountAmt
  const taxAmt = round2(taxable * (Number(taxRate) || 0) / 100)
  return {
    subtotal: round2(subtotal),
    discount: discountAmt,
    tax:      taxAmt,
    total:    round2(taxable + taxAmt),
  }
}

/** Count rendered sections — used for hero stats. */
export function countSections(data) {
  let n = 1 // Cover always
  if (data.includeExecSummary)   n++
  if (data.includeProblem)       n++
  if (data.includeApproach)      n++
  if (data.includeScope)         n++
  if (data.includeDeliverables)  n++
  if (data.includeTimeline)      n++
  if (data.includeTeam)          n++
  if (data.includeInvestment)    n++
  if (data.includeTerms)         n++
  if (data.includeNextSteps)     n++
  if (data.includeAcceptance)    n++
  return n
}
