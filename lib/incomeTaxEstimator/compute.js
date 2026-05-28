/* ------------------------------------------------------------------ */
/*  Income Tax Estimator — slabs, deductions, projection               */
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

/* ---------- Constants ---------- */

export const REGIMES = [
  {
    id: 'uk-2025',
    label: 'United Kingdom — 2025/26 (England)',
    currency: 'GBP',
    personalAllowance: 12570,
    paTaperFrom: 100000,    // £1 reduction for every £2 above
    bands: [
      { upTo: 50270,    ratePct: 20, label: 'Basic rate' },
      { upTo: 125140,   ratePct: 40, label: 'Higher rate' },
      { upTo: Infinity, ratePct: 45, label: 'Additional rate' },
    ],
    notes: 'Personal allowance tapered above £100,000 by £1 for every £2 of income. Scottish rates differ.',
  },
  {
    id: 'us-2025-single',
    label: 'United States — 2025 Federal (Single)',
    currency: 'USD',
    personalAllowance: 14600,  // Standard deduction
    paTaperFrom: 0,            // No taper
    bands: [
      { upTo: 11925,    ratePct: 10, label: '10% bracket' },
      { upTo: 48475,    ratePct: 12, label: '12% bracket' },
      { upTo: 103350,   ratePct: 22, label: '22% bracket' },
      { upTo: 197300,   ratePct: 24, label: '24% bracket' },
      { upTo: 250525,   ratePct: 32, label: '32% bracket' },
      { upTo: 626350,   ratePct: 35, label: '35% bracket' },
      { upTo: Infinity, ratePct: 37, label: '37% bracket' },
    ],
    notes: 'Federal only — state income tax extra. Standard deduction (single) of $14,600.',
  },
  {
    id: 'in-new-2025',
    label: 'India — New regime 2025/26 (section 115BAC)',
    currency: 'INR',
    personalAllowance: 300000,  // Basic exemption (no tax up to ₹3L)
    paTaperFrom: 0,
    bands: [
      { upTo: 700000,   ratePct: 5,  label: '₹3L–₹7L · 5%' },
      { upTo: 1000000,  ratePct: 10, label: '₹7L–₹10L · 10%' },
      { upTo: 1200000,  ratePct: 15, label: '₹10L–₹12L · 15%' },
      { upTo: 1500000,  ratePct: 20, label: '₹12L–₹15L · 20%' },
      { upTo: Infinity, ratePct: 30, label: '> ₹15L · 30%' },
    ],
    notes: 'New regime. Standard deduction ₹75,000 for salaried. Section 87A rebate up to ₹25,000 if taxable income ≤ ₹7L.',
  },
  {
    id: 'in-old-2025',
    label: 'India — Old regime 2025/26',
    currency: 'INR',
    personalAllowance: 250000,
    paTaperFrom: 0,
    bands: [
      { upTo: 500000,   ratePct: 5,  label: '₹2.5L–₹5L · 5%' },
      { upTo: 1000000,  ratePct: 20, label: '₹5L–₹10L · 20%' },
      { upTo: Infinity, ratePct: 30, label: '> ₹10L · 30%' },
    ],
    notes: 'Old regime allows 80C / 80D / HRA / LTA deductions. 87A rebate up to ₹12,500 if taxable income ≤ ₹5L.',
  },
  {
    id: 'custom',
    label: 'Custom — your own slabs',
    currency: 'USD',
    personalAllowance: 0,
    paTaperFrom: 0,
    bands: [
      { upTo: 50000,    ratePct: 10, label: 'Band 1' },
      { upTo: 100000,   ratePct: 20, label: 'Band 2' },
      { upTo: Infinity, ratePct: 30, label: 'Band 3' },
    ],
    notes: 'Custom regime. Edit slabs, personal allowance, and notes as needed.',
  },
]

export const INCOME_TYPES = [
  { id: 'salary',     label: 'Salary / employment' },
  { id: 'business',   label: 'Business / self-employed' },
  { id: 'rental',     label: 'Rental income' },
  { id: 'investment', label: 'Dividends / interest' },
  { id: 'capital',    label: 'Capital gains' },
  { id: 'other',      label: 'Other' },
]

/* ---------- Helpers ---------- */

export function findRegime(id) { return REGIMES.find((r) => r.id === id) || REGIMES[0] }
export function findIncomeType(id) { return INCOME_TYPES.find((t) => t.id === id) || INCOME_TYPES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** Apply UK-style personal-allowance taper. */
export function applyPaTaper({ personalAllowance, paTaperFrom, grossIncome }) {
  if (!paTaperFrom || personalAllowance <= 0) return personalAllowance
  const gross = Number(grossIncome) || 0
  if (gross <= paTaperFrom) return personalAllowance
  const overage = gross - paTaperFrom
  const reduction = overage / 2
  return Math.max(0, round2(personalAllowance - reduction))
}

/** Apply slabs to taxable income, return per-band breakdown + total. */
export function applySlabs({ bands, taxableIncome }) {
  const ti = Math.max(0, Number(taxableIncome) || 0)
  let lower = 0
  let total = 0
  const breakdown = []
  for (const band of bands || []) {
    const upper = Number.isFinite(band.upTo) ? band.upTo : Infinity
    if (ti <= lower) break
    const slabBase = Math.min(ti, upper)
    const slice = Math.max(0, slabBase - lower)
    const tax = round2(slice * (Number(band.ratePct) || 0) / 100)
    breakdown.push({
      label: band.label || `${lower}–${Number.isFinite(upper) ? upper : '∞'}`,
      lower,
      upper: Number.isFinite(upper) ? upper : Infinity,
      ratePct: Number(band.ratePct) || 0,
      sliceAmount: round2(slice),
      tax,
    })
    total = round2(total + tax)
    lower = upper
    if (!Number.isFinite(upper)) break
  }
  return { breakdown, total }
}

/** Sum line items array. */
export function sumLines(items, key) {
  return round2((items || []).reduce((s, it) => s + (Number(it[key]) || 0), 0))
}

/**
 * Build the full estimator computation.
 * Includes:
 *   - gross income (sum of income sources)
 *   - total deductions (sum of deductions)
 *   - effective personal allowance (after taper)
 *   - taxable income
 *   - slab-wise breakdown
 *   - effective + marginal rate
 *   - take-home (gross − total tax)
 *   - monthly take-home (gross/12 − tax/12)
 *   - YTD-paid based projection
 */
export function computeEstimate(data) {
  const regime = findRegime(data.regimeId)
  const gross = sumLines(data.incomeSources, 'amount')
  const deductionsTotal = sumLines(data.deductions, 'amount')

  const tapered = applyPaTaper({
    personalAllowance: regime.personalAllowance,
    paTaperFrom: regime.paTaperFrom,
    grossIncome: gross,
  })

  const personalAllowance = Math.max(0, Math.min(tapered, gross))
  // Taxable income = max(0, gross − personal allowance − deductions)
  const taxable = round2(Math.max(0, gross - personalAllowance - deductionsTotal))

  const { breakdown, total: totalTax } = applySlabs({
    bands: regime.bands || [],
    taxableIncome: taxable,
  })

  // Apply optional surcharge / cess (e.g. India)
  const surcharge = round2((Number(data.surchargeRatePct) || 0) * totalTax / 100)
  const cess = round2((Number(data.cessRatePct) || 0) * (totalTax + surcharge) / 100)
  const totalTaxWithCess = round2(totalTax + surcharge + cess)

  // Rebate
  const rebate = Math.min(Number(data.rebateAmount) || 0, totalTaxWithCess)
  const netTax = round2(Math.max(0, totalTaxWithCess - rebate))

  const effectiveRatePct = gross > 0 ? round2((netTax / gross) * 100) : 0
  // Marginal rate = rate of the top band utilised
  const topBand = breakdown[breakdown.length - 1]
  const marginalRatePct = topBand ? topBand.ratePct : 0

  const takeHome = round2(gross - netTax)
  const monthlyGross = round2(gross / 12)
  const monthlyTax = round2(netTax / 12)
  const monthlyTakeHome = round2(takeHome / 12)

  // YTD projection: if user has already paid X tax this year, project remaining
  const paidYTD = Number(data.paidYTD) || 0
  const remainingTax = round2(Math.max(0, netTax - paidYTD))

  return {
    regime,
    gross,
    deductionsTotal,
    personalAllowance,
    taxable,
    breakdown,
    totalTax,
    surcharge,
    cess,
    totalTaxWithCess,
    rebate,
    netTax,
    effectiveRatePct,
    marginalRatePct,
    takeHome,
    monthlyGross,
    monthlyTax,
    monthlyTakeHome,
    paidYTD,
    remainingTax,
  }
}

/** Count of sections rendered (for hero stats). */
export function countSections(data) {
  let n = 3 // header, income, slabs
  if ((data.deductions || []).length > 0) n++
  if (data.includeTakeHomeBlock) n++
  if (data.includeProjectionBlock) n++
  if (data.notes) n++
  return n
}
