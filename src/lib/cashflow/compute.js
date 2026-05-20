/* ------------------------------------------------------------------ */
/*  Cash Flow Statement computation helpers                            */
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

/* ---- Method ---- */

export const METHODS = [
  { id: 'indirect', label: 'Indirect (from Net Income)' },
  { id: 'direct',   label: 'Direct (from cash receipts)' },
]

/* ---- Common operating line presets — for the indirect method ---- */
/*    NOTE: positive = cash in, negative = cash out                  */
export const OPERATING_PRESETS = {
  indirect: [
    'Net income',
    'Depreciation & amortisation',
    'Stock-based compensation',
    'Changes in accounts receivable',
    'Changes in inventory',
    'Changes in accounts payable',
    'Changes in accrued expenses',
    'Other working capital',
  ],
  direct: [
    'Cash received from customers',
    'Cash paid to suppliers',
    'Cash paid to employees',
    'Interest received',
    'Interest paid',
    'Income tax paid',
  ],
}

export const INVESTING_PRESETS = [
  'Purchase of property & equipment',
  'Sale of property & equipment',
  'Purchase of investments',
  'Sale of investments',
  'Acquisitions, net of cash',
  'Capitalised software',
]

export const FINANCING_PRESETS = [
  'Proceeds from debt',
  'Repayment of debt',
  'Proceeds from equity issuance',
  'Share buybacks',
  'Dividends paid',
  'Lease payments',
]

/* ------------------------------------------------------------------ */

function sum(lines) {
  if (!Array.isArray(lines)) return 0
  return lines.reduce((s, l) => s + (Number(l?.amount) || 0), 0)
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

/** Calculate full cash flow totals */
export function computeCashFlow(data) {
  const openingCash = round2(Number(data.openingCash) || 0)

  const netOperating = round2(sum(data.operating))
  const netInvesting = round2(sum(data.investing))
  const netFinancing = round2(sum(data.financing))

  const netChange   = round2(netOperating + netInvesting + netFinancing)
  const closingCash = round2(openingCash + netChange)

  // Free Cash Flow approximation: Operating - CapEx (negative investing into PP&E)
  // We approximate CapEx as any negative investing line referencing property/equipment/CapEx.
  const capex = round2(
    (data.investing || [])
      .filter((l) => /property|equipment|capex|capitalised|capitalized|software/i.test(l.description || ''))
      .reduce((s, l) => s + Math.min(0, Number(l.amount) || 0), 0)
  )
  const freeCashFlow = round2(netOperating + capex)

  return {
    openingCash,
    netOperating,
    netInvesting,
    netFinancing,
    netChange,
    closingCash,
    capex,
    freeCashFlow,
  }
}

/** Human period label, e.g. "Q2 2026" or "May 2026" */
export function describePeriod(data) {
  if (data.periodLabel) return data.periodLabel
  if (data.periodStart && data.periodEnd) {
    const s = new Date(data.periodStart)
    const e = new Date(data.periodEnd)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
    const optsShort = { month: 'short' }
    const optsFull  = { day: '2-digit', month: 'short', year: 'numeric' }
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      return s.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    }
    if (s.getFullYear() === e.getFullYear()) {
      return `${s.toLocaleDateString('en-GB', optsShort)}–${e.toLocaleDateString('en-GB', optsShort)} ${s.getFullYear()}`
    }
    return `${s.toLocaleDateString('en-GB', optsFull)} → ${e.toLocaleDateString('en-GB', optsFull)}`
  }
  return ''
}
