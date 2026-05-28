/* ------------------------------------------------------------------ */
/*  Balance Sheet computation helpers                                  */
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

/* ---- Common balance-sheet line presets ---- */

export const CURRENT_ASSET_PRESETS = [
  'Cash & cash equivalents',
  'Short-term investments',
  'Accounts receivable',
  'Inventory',
  'Prepaid expenses',
  'Other current assets',
]

export const NON_CURRENT_ASSET_PRESETS = [
  'Property, plant & equipment',
  'Intangible assets',
  'Goodwill',
  'Long-term investments',
  'Deferred tax assets',
  'Other non-current assets',
]

export const CURRENT_LIAB_PRESETS = [
  'Accounts payable',
  'Short-term debt',
  'Accrued expenses',
  'Deferred revenue',
  'Current portion of long-term debt',
  'Income tax payable',
  'Other current liabilities',
]

export const NON_CURRENT_LIAB_PRESETS = [
  'Long-term debt',
  'Deferred tax liabilities',
  'Lease liabilities',
  'Pension obligations',
  'Other non-current liabilities',
]

export const EQUITY_PRESETS = [
  'Share capital',
  'Share premium / APIC',
  'Retained earnings',
  'Treasury shares',
  'Other comprehensive income',
  'Non-controlling interests',
]

/* ------------------------------------------------------------------ */

function sum(lines) {
  if (!Array.isArray(lines)) return 0
  return lines.reduce((s, l) => s + (Number(l?.amount) || 0), 0)
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

function safeDiv(a, b) {
  if (!b) return 0
  return a / b
}

/** Calculate full balance sheet totals + ratios */
export function computeBalance(data) {
  const currentAssets    = round2(sum(data.currentAssets))
  const nonCurrentAssets = round2(sum(data.nonCurrentAssets))
  const totalAssets      = round2(currentAssets + nonCurrentAssets)

  const currentLiab      = round2(sum(data.currentLiabilities))
  const nonCurrentLiab   = round2(sum(data.nonCurrentLiabilities))
  const totalLiab        = round2(currentLiab + nonCurrentLiab)

  const equity           = round2(sum(data.equity))

  const totalLiabAndEquity = round2(totalLiab + equity)
  const balanceDiff        = round2(totalAssets - totalLiabAndEquity)
  const isBalanced         = Math.abs(balanceDiff) < 0.01

  // Key ratios
  const currentRatio  = round2(safeDiv(currentAssets, currentLiab))
  const quickAssets   = round2(
    (data.currentAssets || [])
      .filter((l) => !/inventory|prepaid/i.test(l.description || ''))
      .reduce((s, l) => s + (Number(l.amount) || 0), 0)
  )
  const quickRatio    = round2(safeDiv(quickAssets, currentLiab))
  const debtToEquity  = round2(safeDiv(totalLiab, equity))
  const workingCapital = round2(currentAssets - currentLiab)
  const equityRatio   = round2(safeDiv(equity, totalAssets) * 100)

  return {
    currentAssets,
    nonCurrentAssets,
    totalAssets,
    currentLiab,
    nonCurrentLiab,
    totalLiab,
    equity,
    totalLiabAndEquity,
    balanceDiff,
    isBalanced,
    currentRatio,
    quickRatio,
    debtToEquity,
    workingCapital,
    equityRatio,
  }
}

export function asOfLabel(data) {
  if (data.asOfLabel) return data.asOfLabel
  if (data.asOfDate) {
    const d = new Date(data.asOfDate)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    }
  }
  return ''
}
