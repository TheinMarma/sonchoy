/* ------------------------------------------------------------------ */
/*  Sales Tax Report Generator — US/CA jurisdictional filings          */
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

/* ---- Constants ---- */

export const FILING_FREQUENCIES = [
  { id: 'monthly',   label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'annual',    label: 'Annual' },
]

export const REPORT_PURPOSES = [
  { id: 'filing',     label: 'Sales-tax filing / return prep' },
  { id: 'reconcile',  label: 'Reconciliation' },
  { id: 'audit',      label: 'Audit support' },
]

/** Common US states / Canadian provinces for the dropdown. */
export const JURISDICTIONS = [
  // US states (most populous + tax-relevant)
  { id: 'US-CA', code: 'CA', label: 'California (US)',     country: 'US' },
  { id: 'US-TX', code: 'TX', label: 'Texas (US)',           country: 'US' },
  { id: 'US-NY', code: 'NY', label: 'New York (US)',        country: 'US' },
  { id: 'US-FL', code: 'FL', label: 'Florida (US)',         country: 'US' },
  { id: 'US-IL', code: 'IL', label: 'Illinois (US)',        country: 'US' },
  { id: 'US-PA', code: 'PA', label: 'Pennsylvania (US)',    country: 'US' },
  { id: 'US-OH', code: 'OH', label: 'Ohio (US)',            country: 'US' },
  { id: 'US-GA', code: 'GA', label: 'Georgia (US)',         country: 'US' },
  { id: 'US-NC', code: 'NC', label: 'North Carolina (US)',  country: 'US' },
  { id: 'US-MI', code: 'MI', label: 'Michigan (US)',        country: 'US' },
  { id: 'US-NJ', code: 'NJ', label: 'New Jersey (US)',      country: 'US' },
  { id: 'US-VA', code: 'VA', label: 'Virginia (US)',        country: 'US' },
  { id: 'US-WA', code: 'WA', label: 'Washington (US)',      country: 'US' },
  { id: 'US-AZ', code: 'AZ', label: 'Arizona (US)',         country: 'US' },
  { id: 'US-MA', code: 'MA', label: 'Massachusetts (US)',   country: 'US' },
  { id: 'US-TN', code: 'TN', label: 'Tennessee (US)',       country: 'US' },
  { id: 'US-CO', code: 'CO', label: 'Colorado (US)',        country: 'US' },
  { id: 'US-IN', code: 'IN', label: 'Indiana (US)',         country: 'US' },
  { id: 'US-MN', code: 'MN', label: 'Minnesota (US)',       country: 'US' },
  { id: 'US-MO', code: 'MO', label: 'Missouri (US)',        country: 'US' },
  // Canadian provinces
  { id: 'CA-ON', code: 'ON', label: 'Ontario (CA · HST)',          country: 'CA' },
  { id: 'CA-BC', code: 'BC', label: 'British Columbia (CA · GST+PST)', country: 'CA' },
  { id: 'CA-QC', code: 'QC', label: 'Quebec (CA · GST+QST)',       country: 'CA' },
  { id: 'CA-AB', code: 'AB', label: 'Alberta (CA · GST only)',     country: 'CA' },
  { id: 'CA-MB', code: 'MB', label: 'Manitoba (CA · GST+PST)',     country: 'CA' },
  { id: 'CA-SK', code: 'SK', label: 'Saskatchewan (CA · GST+PST)', country: 'CA' },
  { id: 'CA-NS', code: 'NS', label: 'Nova Scotia (CA · HST)',      country: 'CA' },
  { id: 'CA-NB', code: 'NB', label: 'New Brunswick (CA · HST)',    country: 'CA' },
  { id: 'CA-NL', code: 'NL', label: 'Newfoundland (CA · HST)',     country: 'CA' },
  { id: 'CA-PE', code: 'PE', label: 'PEI (CA · HST)',              country: 'CA' },
]

/* ---- Helpers ---- */

export function findFilingFrequency(id) { return FILING_FREQUENCIES.find((f) => f.id === id) || FILING_FREQUENCIES[1] }
export function findReportPurpose(id)   { return REPORT_PURPOSES.find((r) => r.id === id) || REPORT_PURPOSES[0] }
export function findJurisdiction(id)    { return JURISDICTIONS.find((j) => j.id === id) || JURISDICTIONS[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/**
 * Compute tax for one transaction.
 * Each row carries:
 *   grossSales — total invoiced
 *   exemptAmount — portion exempt (resale certs, services, etc.)
 *   stateRatePct — base state/provincial rate
 *   countyRatePct — county/regional rate (US)
 *   cityRatePct — city/local rate (US)
 *   specialRatePct — special district rate (transit, stadium, etc.)
 */
export function computeRowTax(row) {
  const gross = Number(row.grossSales) || 0
  const exempt = Math.min(Number(row.exemptAmount) || 0, gross)
  const taxable = round2(gross - exempt)

  const stateRate   = Number(row.stateRatePct)   || 0
  const countyRate  = Number(row.countyRatePct)  || 0
  const cityRate    = Number(row.cityRatePct)    || 0
  const specialRate = Number(row.specialRatePct) || 0

  const totalRate = round2(stateRate + countyRate + cityRate + specialRate)
  const stateTax   = round2(taxable * stateRate / 100)
  const countyTax  = round2(taxable * countyRate / 100)
  const cityTax    = round2(taxable * cityRate / 100)
  const specialTax = round2(taxable * specialRate / 100)
  const totalTax   = round2(stateTax + countyTax + cityTax + specialTax)

  return {
    gross: round2(gross),
    exempt: round2(exempt),
    taxable,
    stateRate, countyRate, cityRate, specialRate, totalRate,
    stateTax, countyTax, cityTax, specialTax, totalTax,
    grandTotal: round2(taxable + totalTax + exempt),
  }
}

/** Compute totals + per-row breakdowns. */
export function computeReport(data) {
  const rows = (data.transactions || []).map((row) => {
    const t = computeRowTax(row)
    const jur = findJurisdiction(row.jurisdictionId)
    return { ...row, ...t, jurisdictionLabel: jur.label, jurisdictionCode: jur.code }
  })
  const totals = rows.reduce((s, r) => {
    s.gross      += r.gross
    s.exempt     += r.exempt
    s.taxable    += r.taxable
    s.stateTax   += r.stateTax
    s.countyTax  += r.countyTax
    s.cityTax    += r.cityTax
    s.specialTax += r.specialTax
    s.totalTax   += r.totalTax
    s.grandTotal += r.grandTotal
    return s
  }, { gross: 0, exempt: 0, taxable: 0, stateTax: 0, countyTax: 0, cityTax: 0, specialTax: 0, totalTax: 0, grandTotal: 0 })
  Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]) })

  return { rows, totals }
}

/** Roll up by state/province (jurisdictionCode). */
export function buildStateSummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = r.jurisdictionCode || '—'
    const acc = map.get(key) || {
      code: key, label: r.jurisdictionLabel || key,
      gross: 0, exempt: 0, taxable: 0,
      stateTax: 0, countyTax: 0, cityTax: 0, specialTax: 0, totalTax: 0,
      transactions: 0,
    }
    acc.gross      += r.gross
    acc.exempt     += r.exempt
    acc.taxable    += r.taxable
    acc.stateTax   += r.stateTax
    acc.countyTax  += r.countyTax
    acc.cityTax    += r.cityTax
    acc.specialTax += r.specialTax
    acc.totalTax   += r.totalTax
    acc.transactions += 1
    map.set(key, acc)
  }
  return Array.from(map.values())
    .map((a) => ({
      ...a,
      gross: round2(a.gross), exempt: round2(a.exempt), taxable: round2(a.taxable),
      stateTax: round2(a.stateTax), countyTax: round2(a.countyTax),
      cityTax: round2(a.cityTax), specialTax: round2(a.specialTax),
      totalTax: round2(a.totalTax),
    }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

/** Roll up by county within state (key = `${state}|${county}`). */
export function buildCountySummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const stateCode = r.jurisdictionCode || '—'
    const county = (r.county || '—').trim() || '—'
    const key = `${stateCode}|${county}`
    const acc = map.get(key) || {
      stateCode, county,
      taxable: 0, totalTax: 0, transactions: 0,
    }
    acc.taxable += r.taxable
    acc.totalTax += r.totalTax
    acc.transactions += 1
    map.set(key, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, taxable: round2(a.taxable), totalTax: round2(a.totalTax) }))
    .sort((a, b) => {
      if (a.stateCode !== b.stateCode) return a.stateCode.localeCompare(b.stateCode)
      return a.county.localeCompare(b.county)
    })
}

/** Roll up by combined rate. */
export function buildRateSummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = r.totalRate.toFixed(3)
    const acc = map.get(key) || {
      ratePct: r.totalRate, taxable: 0, totalTax: 0, transactions: 0,
    }
    acc.taxable += r.taxable
    acc.totalTax += r.totalTax
    acc.transactions += 1
    map.set(key, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, taxable: round2(a.taxable), totalTax: round2(a.totalTax) }))
    .sort((a, b) => a.ratePct - b.ratePct)
}

/** Section counter for hero stats. */
export function countSections(data) {
  let n = 2
  if (data.includeStateSummary)  n++
  if (data.includeCountySummary) n++
  if (data.includeRateSummary)   n++
  if (data.notes) n++
  return n
}
