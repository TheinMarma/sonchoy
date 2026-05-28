/* ------------------------------------------------------------------ */
/*  Payroll Tax Report — computation helpers                           */
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

/* ---- Regime presets with column labels ----
   Different jurisdictions name the deduction buckets differently. */

export const PAYROLL_REGIMES = [
  {
    id: 'us',
    label: 'US Federal',
    defaultCurrency: 'USD',
    columns: {
      incomeTax: 'Fed. income tax',
      socialContrib: 'Social Security',
      medicare: 'Medicare',
      employerContrib: 'Employer SS + Medicare',
    },
    note: 'US Federal withholding (FIT) + FICA (Social Security 6.2% + Medicare 1.45%). Employer matches FICA.',
  },
  {
    id: 'uk',
    label: 'UK · PAYE / NIC',
    defaultCurrency: 'GBP',
    columns: {
      incomeTax: 'PAYE income tax',
      socialContrib: 'NI (employee)',
      medicare: 'Other (pension etc.)',
      employerContrib: 'Employer NIC',
    },
    note: 'PAYE (income tax) + employee NIC (Class 1) + employer NIC. Auto-enrolment pension typically 5%+3%.',
  },
  {
    id: 'in',
    label: 'India · TDS / EPF',
    defaultCurrency: 'INR',
    columns: {
      incomeTax: 'TDS (income tax)',
      socialContrib: 'EPF (employee)',
      medicare: 'Professional tax',
      employerContrib: 'EPF + ESI (employer)',
    },
    note: 'TDS u/s 192 + employee EPF 12% + professional tax. Employer EPF 12% + ESI if applicable.',
  },
  {
    id: 'de',
    label: 'Germany',
    defaultCurrency: 'EUR',
    columns: {
      incomeTax: 'Lohnsteuer',
      socialContrib: 'Social insurance (ee)',
      medicare: 'Health insurance',
      employerContrib: 'Employer SI',
    },
    note: 'Lohnsteuer + employee social insurance (pension, unemployment, care). Employer matches social insurance.',
  },
  {
    id: 'custom',
    label: 'Custom column labels',
    defaultCurrency: 'USD',
    columns: {
      incomeTax: 'Income tax',
      socialContrib: 'Social contrib.',
      medicare: 'Other deduction',
      employerContrib: 'Employer contrib.',
    },
    note: 'Customise column labels in your XLSX downstream.',
  },
]

export function findRegime(id) {
  return PAYROLL_REGIMES.find((r) => r.id === id) || PAYROLL_REGIMES[0]
}

export const PAY_FREQUENCIES = [
  { id: 'monthly',    label: 'Monthly' },
  { id: 'semi-monthly', label: 'Semi-monthly' },
  { id: 'bi-weekly',  label: 'Bi-weekly' },
  { id: 'weekly',     label: 'Weekly' },
  { id: 'annual',     label: 'Annual' },
]

/* ------------------------------------------------------------------ */

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

function pct(part, whole) {
  if (!whole) return 0
  return (part / whole) * 100
}

/** Per-employee computation */
export function computeEmployee(emp) {
  const gross           = Number(emp.gross) || 0
  const incomeTax       = Number(emp.incomeTax) || 0
  const socialContrib   = Number(emp.socialContrib) || 0
  const medicare        = Number(emp.medicare) || 0
  const employerContrib = Number(emp.employerContrib) || 0

  const deductions = incomeTax + socialContrib + medicare
  const netPay = gross - deductions
  const totalCost = gross + employerContrib

  return {
    gross: round2(gross),
    incomeTax: round2(incomeTax),
    socialContrib: round2(socialContrib),
    medicare: round2(medicare),
    employerContrib: round2(employerContrib),
    deductions: round2(deductions),
    netPay: round2(netPay),
    totalCost: round2(totalCost),
  }
}

/** Full payroll computation */
export function computePayroll(data) {
  const rows = (data.employees || []).map((e) => ({ ...e, ...computeEmployee(e) }))

  const totals = rows.reduce(
    (acc, r) => ({
      gross:           acc.gross           + r.gross,
      incomeTax:       acc.incomeTax       + r.incomeTax,
      socialContrib:   acc.socialContrib   + r.socialContrib,
      medicare:        acc.medicare        + r.medicare,
      employerContrib: acc.employerContrib + r.employerContrib,
      deductions:      acc.deductions      + r.deductions,
      netPay:          acc.netPay          + r.netPay,
      totalCost:       acc.totalCost       + r.totalCost,
    }),
    { gross: 0, incomeTax: 0, socialContrib: 0, medicare: 0, employerContrib: 0, deductions: 0, netPay: 0, totalCost: 0 }
  )

  const rounded = {}
  for (const k of Object.keys(totals)) rounded[k] = round2(totals[k])

  // Effective rates
  const effectiveTaxRate    = round2(pct(rounded.incomeTax, rounded.gross))
  const effectiveDeductRate = round2(pct(rounded.deductions, rounded.gross))
  const employerCostRate    = round2(pct(rounded.employerContrib, rounded.gross))

  return {
    rows,
    ...rounded,
    countEmployees: rows.length,
    effectiveTaxRate,
    effectiveDeductRate,
    employerCostRate,
  }
}

export function periodLabel(data) {
  if (data.periodLabel) return data.periodLabel
  if (data.periodStart && data.periodEnd) {
    const s = new Date(data.periodStart)
    const e = new Date(data.periodEnd)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      return s.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    }
    if (s.getFullYear() === e.getFullYear()) {
      return `${s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    }
    return `${s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} → ${e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }
  return ''
}
