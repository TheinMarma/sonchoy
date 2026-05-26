/* ------------------------------------------------------------------ */
/*  Profit Margin Calculator — gross, operating, net margins           */
/* ------------------------------------------------------------------ */

import {
  CURRENCIES, findCurrency, formatMoney, formatNumber, formatDate, todayISO,
} from '../invoice/format'

export { CURRENCIES, findCurrency, formatMoney, formatNumber, formatDate, todayISO }

export const PURPOSES = [
  { id: 'product',   label: 'Single product / SKU' },
  { id: 'project',   label: 'Client project' },
  { id: 'monthly',   label: 'Monthly P&L snapshot' },
  { id: 'quarterly', label: 'Quarterly review' },
  { id: 'annual',    label: 'Annual statement' },
  { id: 'other',     label: 'Other / general' },
]
export function findPurpose(id) { return PURPOSES.find((p) => p.id === id) || PURPOSES[0] }

export const SAMPLE_DATA = {
  purposeId:        'product',
  label:            'SKU-A1042 · Hand-bound notebook',
  periodStartIso:   '',
  periodEndIso:     '',
  currencyCode:     'USD',
  revenue:          50000,
  cogs:             18500,
  operatingExpense: 14200,
  otherIncome:      0,
  interestExpense:  600,
  taxes:            3200,
  notes:            '',
}

function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0 }
function round2(n) { return Math.round((n || 0) * 100) / 100 }
function safePct(num, denom) { return denom ? (num / denom) * 100 : 0 }

export function computeMargins(data) {
  const revenue          = num(data.revenue)
  const cogs             = num(data.cogs)
  const operatingExpense = num(data.operatingExpense)
  const otherIncome      = num(data.otherIncome)
  const interestExpense  = num(data.interestExpense)
  const taxes            = num(data.taxes)

  const grossProfit     = round2(revenue - cogs)
  const operatingProfit = round2(grossProfit - operatingExpense)
  const pretaxProfit    = round2(operatingProfit + otherIncome - interestExpense)
  const netProfit       = round2(pretaxProfit - taxes)
  const markup          = round2(safePct(grossProfit, cogs))

  return {
    revenue,
    cogs,
    operatingExpense,
    otherIncome,
    interestExpense,
    taxes,
    grossProfit,
    operatingProfit,
    pretaxProfit,
    netProfit,
    grossMargin:     round2(safePct(grossProfit, revenue)),
    operatingMargin: round2(safePct(operatingProfit, revenue)),
    pretaxMargin:    round2(safePct(pretaxProfit, revenue)),
    netMargin:       round2(safePct(netProfit, revenue)),
    markup,
  }
}

export function defaultFileBase(data) {
  const base = (data.label || 'profit-margin').toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'profit-margin'
  return `${base}-${todayISO()}`
}
