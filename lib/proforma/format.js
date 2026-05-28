/* ------------------------------------------------------------------ */
/*  Proforma-invoice format helpers                                    */
/*  A proforma is a non-binding price preview, NOT a tax document.     */
/* ------------------------------------------------------------------ */

import {
  CURRENCIES, TAX_PRESETS, PAYMENT_TERMS, findCurrency,
  formatMoney, formatNumber, formatDate,
  addDays, todayISO,
  computeTotals, lineAmount,
} from '../invoice/format'

export {
  CURRENCIES, TAX_PRESETS, PAYMENT_TERMS, findCurrency,
  formatMoney, formatNumber, formatDate,
  addDays, todayISO,
  computeTotals, lineAmount,
}

/* Validity window — how long the proforma stands as a binding quote */
export const VALIDITY_PRESETS = [
  { id: 'days-7',  label: '7 days',  days: 7  },
  { id: 'days-14', label: '14 days', days: 14 },
  { id: 'days-30', label: '30 days', days: 30 },
  { id: 'days-60', label: '60 days', days: 60 },
  { id: 'days-90', label: '90 days', days: 90 },
]

export function findValidity(id) {
  return VALIDITY_PRESETS.find((v) => v.id === id) || VALIDITY_PRESETS[2]
}

/** "PRF-2026-0042" — auto-numbered proforma reference */
export function nextProformaNumber(prev) {
  const year = new Date().getFullYear()
  const m = String(prev || '').match(/(\d+)\s*$/)
  const next = m ? String(Number(m[1]) + 1).padStart(4, '0') : '0001'
  return `PRF-${year}-${next}`
}
