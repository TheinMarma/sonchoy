/* ------------------------------------------------------------------ */
/*  Profit & Loss computation helpers                                  */
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

/* ---- Common operating-expense categories ---- */

export const OPEX_CATEGORIES = [
  'Salaries & wages',
  'Rent & utilities',
  'Marketing & advertising',
  'Software & subscriptions',
  'Travel & entertainment',
  'Professional fees',
  'Office expenses',
  'Insurance',
  'Other operating',
]

/* ---- Period presets ---- */

export const PERIOD_TYPES = [
  { id: 'month',   label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'half',    label: 'Half-year' },
  { id: 'year',    label: 'Year' },
  { id: 'custom',  label: 'Custom' },
]

/* ------------------------------------------------------------------ */

function sum(lines) {
  if (!Array.isArray(lines)) return 0
  return lines.reduce((s, l) => s + (Number(l?.amount) || 0), 0)
}

function pct(part, whole) {
  if (!whole) return 0
  return (part / whole) * 100
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

/** Calculate full P&L totals and ratios */
export function computePnL(data) {
  const revenue = round2(sum(data.revenue))
  const cogs    = round2(sum(data.cogs))
  const grossProfit = round2(revenue - cogs)

  const opex = round2(sum(data.operatingExpenses))
  const operatingIncome = round2(grossProfit - opex)

  const otherIncome   = round2(sum(data.otherIncome))
  const otherExpenses = round2(sum(data.otherExpenses))

  const preTaxIncome = round2(operatingIncome + otherIncome - otherExpenses)
  const taxExpense   = round2(Number(data.taxExpense) || 0)
  const netIncome    = round2(preTaxIncome - taxExpense)

  // Group opex by category for the summary
  const opexByCategory = new Map()
  for (const ln of (data.operatingExpenses || [])) {
    const cat = ln.category || 'Other operating'
    opexByCategory.set(cat, round2((opexByCategory.get(cat) || 0) + (Number(ln.amount) || 0)))
  }
  const opexBreakdown = Array.from(opexByCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

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

    opexBreakdown,
  }
}

/** Human period label, e.g. "Q2 2026" or "May 2026" or "Apr–Jun 2026" */
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
