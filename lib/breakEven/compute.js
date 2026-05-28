/* ------------------------------------------------------------------ */
/*  Break-Even Analysis — units, revenue, margin of safety             */
/* ------------------------------------------------------------------ */

import {
  CURRENCIES, findCurrency, formatMoney, formatNumber, formatDate, todayISO,
} from '../invoice/format'

export { CURRENCIES, findCurrency, formatMoney, formatNumber, formatDate, todayISO }

export const SCENARIOS = [
  { id: 'product',  label: 'Single product / SKU' },
  { id: 'service',  label: 'Service / billable hour' },
  { id: 'event',    label: 'Event / launch' },
  { id: 'startup',  label: 'Startup runway' },
  { id: 'other',    label: 'Other / general' },
]
export function findScenario(id) { return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0] }

export const SAMPLE_DATA = {
  scenarioId:     'product',
  label:          'SKU-A1042 · Hand-bound notebook',
  currencyCode:   'USD',
  unitName:       'units',
  pricePerUnit:   25,
  variableCost:   9.5,
  fixedCosts:     18000,
  expectedUnits:  2000,
  targetProfit:   5000,
  notes:          '',
}

function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0 }
function round2(n) { return Math.round((n || 0) * 100) / 100 }

export function computeBreakEven(data) {
  const price         = num(data.pricePerUnit)
  const variable      = num(data.variableCost)
  const fixed         = num(data.fixedCosts)
  const expectedUnits = num(data.expectedUnits)
  const targetProfit  = num(data.targetProfit)

  const contribution        = round2(price - variable)
  const contributionMarginPct = price ? round2((contribution / price) * 100) : 0

  const breakEvenUnits   = contribution > 0 ? Math.ceil(fixed / contribution) : 0
  const breakEvenRevenue = round2(breakEvenUnits * price)

  const targetUnits   = contribution > 0 ? Math.ceil((fixed + targetProfit) / contribution) : 0
  const targetRevenue = round2(targetUnits * price)

  const expectedRevenue       = round2(expectedUnits * price)
  const expectedVariableCost  = round2(expectedUnits * variable)
  const expectedContribution  = round2(expectedUnits * contribution)
  const expectedProfit        = round2(expectedContribution - fixed)
  const marginOfSafetyUnits   = Math.max(0, expectedUnits - breakEvenUnits)
  const marginOfSafetyRevenue = round2(marginOfSafetyUnits * price)
  const marginOfSafetyPct     = expectedRevenue
    ? round2(((expectedRevenue - breakEvenRevenue) / expectedRevenue) * 100)
    : 0

  return {
    price,
    variable,
    fixed,
    contribution,
    contributionMarginPct,
    breakEvenUnits,
    breakEvenRevenue,
    targetUnits,
    targetRevenue,
    expectedUnits,
    expectedRevenue,
    expectedVariableCost,
    expectedContribution,
    expectedProfit,
    marginOfSafetyUnits,
    marginOfSafetyRevenue,
    marginOfSafetyPct,
  }
}

export function buildScheduleRows(data, steps = 8) {
  const r = computeBreakEven(data)
  if (r.contribution <= 0) return []
  // Build a step ladder from 25% of BE to 175% of BE (or expected, whichever larger)
  const cap = Math.max(r.breakEvenUnits * 1.75, r.expectedUnits)
  const min = Math.max(1, Math.round(r.breakEvenUnits * 0.25))
  const stride = Math.max(1, Math.round((cap - min) / (steps - 1)))
  const rows = []
  for (let i = 0; i < steps; i++) {
    const u = i === steps - 1 ? Math.round(cap) : min + stride * i
    const revenue       = u * data.pricePerUnit
    const variableTotal = u * data.variableCost
    const contribution  = revenue - variableTotal
    const profit        = contribution - data.fixedCosts
    rows.push({
      units:        u,
      revenue:      Math.round(revenue * 100) / 100,
      variableTotal: Math.round(variableTotal * 100) / 100,
      contribution: Math.round(contribution * 100) / 100,
      profit:       Math.round(profit * 100) / 100,
    })
  }
  return rows
}

export function defaultFileBase(data) {
  const base = (data.label || 'break-even').toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'break-even'
  return `${base}-${todayISO()}`
}
