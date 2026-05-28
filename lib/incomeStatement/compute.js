/* ------------------------------------------------------------------ */
/*  Income Statement computation helpers                               */
/*  Comparative format (current vs prior period), with EPS.            */
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

export const OPEX_CATEGORIES = [
  'Salaries & wages',
  'Rent & utilities',
  'Marketing & advertising',
  'Software & subscriptions',
  'Travel & entertainment',
  'Professional fees',
  'Research & development',
  'Office expenses',
  'Insurance',
  'Other operating',
]

/* ------------------------------------------------------------------ */

function sum(lines, key) {
  if (!Array.isArray(lines)) return 0
  return lines.reduce((s, l) => s + (Number(l?.[key]) || 0), 0)
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

function pct(part, whole) {
  if (!whole) return 0
  return (part / whole) * 100
}

function safeDiv(a, b) {
  if (!b) return 0
  return a / b
}

/** Period-level totals computed from line items using either 'current' or 'prior' amounts. */
function periodTotals(data, key) {
  const revenue = round2(sum(data.revenue, key))
  const cogs    = round2(sum(data.costOfRevenue, key))
  const grossProfit = round2(revenue - cogs)

  const opex = round2(sum(data.operatingExpenses, key))
  const operatingIncome = round2(grossProfit - opex)

  const otherIncome   = round2(sum(data.otherIncome, key))
  const otherExpenses = round2(sum(data.otherExpenses, key))
  const preTaxIncome  = round2(operatingIncome + otherIncome - otherExpenses)

  const taxExpense    = round2(Number(data[`${key}Tax`]) || 0)
  const netIncome     = round2(preTaxIncome - taxExpense)

  const sharesBasic   = Number(data[`${key}SharesBasic`])   || 0
  const sharesDiluted = Number(data[`${key}SharesDiluted`]) || sharesBasic
  const epsBasic   = round2(safeDiv(netIncome, sharesBasic) * 100) / 100  // keep 2 dp
  const epsDiluted = round2(safeDiv(netIncome, sharesDiluted) * 100) / 100

  return {
    revenue,
    cogs,
    grossProfit,
    grossMargin: round2(pct(grossProfit, revenue)),

    opex,
    operatingIncome,
    operatingMargin: round2(pct(operatingIncome, revenue)),

    otherIncome,
    otherExpenses,
    preTaxIncome,

    taxExpense,
    effectiveTaxRate: round2(pct(taxExpense, preTaxIncome)),

    netIncome,
    netMargin: round2(pct(netIncome, revenue)),

    sharesBasic,
    sharesDiluted,
    epsBasic:   safeDiv(netIncome, sharesBasic),
    epsDiluted: safeDiv(netIncome, sharesDiluted),
  }
}

function variance(curr, prior) {
  const diff = round2((Number(curr) || 0) - (Number(prior) || 0))
  const pctChange = prior ? round2(pct(diff, Math.abs(prior))) : 0
  return { diff, pctChange }
}

/** Full income statement computation: current, prior, and per-metric variance. */
export function computeIncomeStatement(data) {
  const current = periodTotals(data, 'current')
  const prior   = periodTotals(data, 'prior')

  const metrics = ['revenue', 'cogs', 'grossProfit', 'opex', 'operatingIncome', 'preTaxIncome', 'taxExpense', 'netIncome']
  const variances = {}
  for (const k of metrics) {
    variances[k] = variance(current[k], prior[k])
  }

  return { current, prior, variances }
}

export function describePeriod(label, start, end) {
  if (label) return label
  if (start && end) {
    const s = new Date(start)
    const e = new Date(end)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      return s.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    }
    if (s.getFullYear() === e.getFullYear()) {
      return `${s.toLocaleDateString('en-GB', { month: 'short' })}–${e.toLocaleDateString('en-GB', { month: 'short' })} ${s.getFullYear()}`
    }
    return `${s.getFullYear()}–${e.getFullYear()}`
  }
  return ''
}
