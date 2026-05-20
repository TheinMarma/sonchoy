/* ------------------------------------------------------------------ */
/*  Income Tax Calculation Sheet — computation helpers                 */
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

/* ---- Tax regimes ----
   Slabs use cumulative thresholds: { to: <upper bound>, rate: <decimal> }.
   The last slab uses to = Infinity (rate applies on income above prev. limit).
   Amounts in regime "native" currency suggested but tool supports any. */

export const TAX_REGIMES = [
  {
    id: 'in-new',
    label: 'India · New regime (FY 2025-26)',
    defaultCurrency: 'INR',
    standardDeduction: 75000,
    taxIdLabel: 'PAN',
    taxIdPlaceholder: 'ABCDE1234F',
    slabs: [
      { to: 400000,   rate: 0    },
      { to: 800000,   rate: 0.05 },
      { to: 1200000,  rate: 0.10 },
      { to: 1600000,  rate: 0.15 },
      { to: 2000000,  rate: 0.20 },
      { to: 2400000,  rate: 0.25 },
      { to: Infinity, rate: 0.30 },
    ],
    cessRate: 0.04, // Health & education cess
    note: 'Standard deduction ₹75,000. 4% cess on total tax. Rebate u/s 87A for taxable ≤ ₹12L.',
  },
  {
    id: 'in-old',
    label: 'India · Old regime (FY 2025-26)',
    defaultCurrency: 'INR',
    standardDeduction: 50000,
    taxIdLabel: 'PAN',
    taxIdPlaceholder: 'ABCDE1234F',
    slabs: [
      { to: 250000,   rate: 0    },
      { to: 500000,   rate: 0.05 },
      { to: 1000000,  rate: 0.20 },
      { to: Infinity, rate: 0.30 },
    ],
    cessRate: 0.04,
    note: 'Standard deduction ₹50,000. Allows 80C, 80D, HRA, home-loan interest, etc.',
  },
  {
    id: 'us-fed',
    label: 'US Federal · Single (2025)',
    defaultCurrency: 'USD',
    standardDeduction: 15000,
    taxIdLabel: 'SSN / ITIN',
    taxIdPlaceholder: '123-45-6789',
    slabs: [
      { to: 11925,    rate: 0.10 },
      { to: 48475,    rate: 0.12 },
      { to: 103350,   rate: 0.22 },
      { to: 197300,   rate: 0.24 },
      { to: 250525,   rate: 0.32 },
      { to: 626350,   rate: 0.35 },
      { to: Infinity, rate: 0.37 },
    ],
    cessRate: 0,
    note: 'Federal income tax only. Standard deduction $15,000 for single filers.',
  },
  {
    id: 'uk',
    label: 'UK Income Tax (2025-26)',
    defaultCurrency: 'GBP',
    standardDeduction: 12570, // personal allowance
    taxIdLabel: 'NI Number',
    taxIdPlaceholder: 'QQ123456C',
    slabs: [
      { to: 50270,    rate: 0.20 },
      { to: 125140,   rate: 0.40 },
      { to: Infinity, rate: 0.45 },
    ],
    cessRate: 0,
    note: 'Personal allowance £12,570. Basic/Higher/Additional rate slabs apply.',
  },
  {
    id: 'custom',
    label: 'Custom slabs',
    defaultCurrency: 'USD',
    standardDeduction: 0,
    taxIdLabel: 'Tax ID',
    taxIdPlaceholder: '',
    slabs: [
      { to: 50000,    rate: 0.10 },
      { to: 100000,   rate: 0.20 },
      { to: Infinity, rate: 0.30 },
    ],
    cessRate: 0,
    note: 'Editable slabs. Set "to" thresholds and rates per band. Last band must be Infinity.',
  },
]

export function findRegime(id) {
  return TAX_REGIMES.find((r) => r.id === id) || TAX_REGIMES[0]
}

/* ------------------------------------------------------------------ */

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

function pct(part, whole) {
  if (!whole) return 0
  return (part / whole) * 100
}

/** Compute tax from progressive slabs.
    Returns { total, breakdown: [{ from, to, taxableInBand, rate, tax }] }. */
function applySlabs(taxable, slabs) {
  const breakdown = []
  let prev = 0
  let total = 0
  for (const slab of slabs) {
    if (taxable <= prev) {
      breakdown.push({ from: prev, to: slab.to, taxableInBand: 0, rate: slab.rate, tax: 0 })
      prev = slab.to
      continue
    }
    const bandTop = Math.min(taxable, slab.to)
    const inBand = bandTop - prev
    const tax = inBand * slab.rate
    total += tax
    breakdown.push({
      from: prev,
      to: slab.to,
      taxableInBand: round2(inBand),
      rate: slab.rate,
      tax: round2(tax),
    })
    if (taxable <= slab.to) break
    prev = slab.to
  }
  return { total: round2(total), breakdown }
}

/** Full tax computation */
export function computeTax(data) {
  const regime = findRegime(data.regimeId)
  const slabs  = data.regimeId === 'custom' ? (data.customSlabs || regime.slabs) : regime.slabs

  // Income items
  const totalIncome = round2(
    (data.income || []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
  )

  // Standard deduction (regime default unless user overrides)
  const stdDeduction = round2(
    data.standardDeduction != null
      ? Number(data.standardDeduction) || 0
      : (regime.standardDeduction || 0)
  )

  // Additional deductions (line items)
  const additionalDeductions = round2(
    (data.deductions || []).reduce((s, d) => s + (Number(d.amount) || 0), 0)
  )

  const totalDeductions = round2(stdDeduction + additionalDeductions)
  const taxableIncome = round2(Math.max(0, totalIncome - totalDeductions))

  const { total: tax, breakdown } = applySlabs(taxableIncome, slabs)

  // Cess
  const cessRate = data.cessRate != null
    ? (Number(data.cessRate) || 0) / 100
    : regime.cessRate
  const cess = round2(tax * cessRate)

  // Surcharge (optional, user-defined)
  const surchargeRate = (Number(data.surchargeRate) || 0) / 100
  const surcharge = round2(tax * surchargeRate)

  const totalLiability = round2(tax + cess + surcharge)
  const effectiveRate = round2(pct(totalLiability, totalIncome))
  const marginalRate  = round2(getMarginalRate(taxableIncome, slabs) * 100)

  // Take-home / net of tax
  const netIncome = round2(totalIncome - totalLiability)

  return {
    regime,
    totalIncome,
    stdDeduction,
    additionalDeductions,
    totalDeductions,
    taxableIncome,
    tax,
    breakdown,
    cessRate: round2(cessRate * 100),
    cess,
    surchargeRate: round2(surchargeRate * 100),
    surcharge,
    totalLiability,
    netIncome,
    effectiveRate,
    marginalRate,
  }
}

function getMarginalRate(taxable, slabs) {
  let prev = 0
  for (const slab of slabs) {
    if (taxable <= slab.to) return slab.rate
    prev = slab.to
  }
  return slabs[slabs.length - 1].rate
}

export function describePeriod(data) {
  if (data.periodLabel) return data.periodLabel
  return ''
}
