/* ------------------------------------------------------------------ */
/*  GST Calculation Sheet — HSN/SAC, multi-rate, reverse charge        */
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

export const SUPPLY_TYPES = [
  { id: 'intra', label: 'Intra-state (CGST + SGST)' },
  { id: 'inter', label: 'Inter-state (IGST)' },
  { id: 'export', label: 'Export / SEZ (zero-rated)' },
]

export const STANDARD_GST_RATES = [0, 0.25, 3, 5, 12, 18, 28]

export const SHEET_PURPOSES = [
  { id: 'outward', label: 'Outward supply (sales)' },
  { id: 'inward',  label: 'Inward supply (purchases)' },
  { id: 'workings', label: 'GST workings / reconciliation' },
]

/* ---- Helpers ---- */

export function findSupplyType(id) {
  return SUPPLY_TYPES.find((s) => s.id === id) || SUPPLY_TYPES[0]
}
export function findSheetPurpose(id) {
  return SHEET_PURPOSES.find((s) => s.id === id) || SHEET_PURPOSES[0]
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/**
 * Compute the GST breakdown for one line item.
 * Inputs:
 *   taxableValue      — pre-tax line amount
 *   gstRatePct        — total GST rate (e.g. 18)
 *   supplyTypeId      — 'intra' | 'inter' | 'export'
 *   reverseCharge     — boolean; if true, GST is payable by recipient (excluded from invoice total)
 *   cess (optional)   — additional cess as a percentage
 */
export function computeLineGst({
  taxableValue, gstRatePct, supplyTypeId, reverseCharge, cessRatePct,
}) {
  const taxable = Number(taxableValue) || 0
  const rate = Number(gstRatePct) || 0
  const cess = Number(cessRatePct) || 0
  const supply = findSupplyType(supplyTypeId)

  let cgst = 0, sgst = 0, igst = 0
  if (supply.id === 'export') {
    // zero-rated
  } else if (supply.id === 'inter') {
    igst = round2(taxable * rate / 100)
  } else {
    const half = round2(taxable * rate / 200)
    cgst = half
    sgst = half
  }
  const cessAmt = round2(taxable * cess / 100)
  const totalTax = round2(cgst + sgst + igst + cessAmt)
  // If reverse charge, the recipient pays GST — invoice line total excludes GST
  const lineTotal = reverseCharge ? round2(taxable) : round2(taxable + totalTax)

  return {
    taxable: round2(taxable),
    cgst, sgst, igst,
    cessAmt,
    totalTax,
    lineTotal,
    reverseCharge: !!reverseCharge,
  }
}

/** Compute totals across an array of line items. */
export function computeGstTotals(items, defaults = {}) {
  const rows = (items || []).map((it) => {
    const breakdown = computeLineGst({
      taxableValue: Number(it.qty || 0) * Number(it.unitPrice || 0) - Number(it.discount || 0),
      gstRatePct: it.gstRatePct ?? defaults.gstRatePct ?? 0,
      supplyTypeId: it.supplyTypeId ?? defaults.supplyTypeId ?? 'intra',
      reverseCharge: !!it.reverseCharge,
      cessRatePct: it.cessRatePct ?? 0,
    })
    return { ...it, ...breakdown }
  })

  const totals = rows.reduce((s, r) => {
    s.taxable    += r.taxable
    s.cgst       += r.cgst
    s.sgst       += r.sgst
    s.igst       += r.igst
    s.cessAmt    += r.cessAmt
    s.totalTax   += r.totalTax
    s.lineTotal  += r.lineTotal
    if (r.reverseCharge) s.reverseChargeTax += r.totalTax
    return s
  }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, cessAmt: 0, totalTax: 0, lineTotal: 0, reverseChargeTax: 0 })

  // round
  Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]) })

  return { rows, totals }
}

/** Per-rate summary — for the GST workings table. */
export function buildRateSummary(rows) {
  const byRate = new Map()
  for (const r of rows) {
    const key = `${Number(r.gstRatePct) || 0}`
    const acc = byRate.get(key) || {
      ratePct: Number(r.gstRatePct) || 0,
      taxable: 0, cgst: 0, sgst: 0, igst: 0, cessAmt: 0, totalTax: 0, count: 0,
    }
    acc.taxable  += r.taxable
    acc.cgst     += r.cgst
    acc.sgst     += r.sgst
    acc.igst     += r.igst
    acc.cessAmt  += r.cessAmt
    acc.totalTax += r.totalTax
    acc.count    += 1
    byRate.set(key, acc)
  }
  return Array.from(byRate.values())
    .map((a) => ({
      ...a,
      taxable:  round2(a.taxable),
      cgst:     round2(a.cgst),
      sgst:     round2(a.sgst),
      igst:     round2(a.igst),
      cessAmt:  round2(a.cessAmt),
      totalTax: round2(a.totalTax),
    }))
    .sort((a, b) => a.ratePct - b.ratePct)
}

/** Per-HSN/SAC summary — for the workings table. */
export function buildHsnSummary(rows) {
  const byHsn = new Map()
  for (const r of rows) {
    const key = (r.hsn || '—').toString().trim() || '—'
    const acc = byHsn.get(key) || {
      hsn: key,
      description: r.description || '',
      ratePct: Number(r.gstRatePct) || 0,
      taxable: 0, totalTax: 0, count: 0,
    }
    acc.taxable  += r.taxable
    acc.totalTax += r.totalTax
    acc.count    += 1
    byHsn.set(key, acc)
  }
  return Array.from(byHsn.values())
    .map((a) => ({
      ...a,
      taxable:  round2(a.taxable),
      totalTax: round2(a.totalTax),
    }))
    .sort((a, b) => a.hsn.localeCompare(b.hsn))
}

/** Section counter for hero stats. */
export function countSections(data) {
  let n = 2 // Header + line items always
  if (data.includeRateSummary) n++
  if (data.includeHsnSummary)  n++
  if (data.includeReverseChargeBlock) n++
  if (data.notes) n++
  return n
}
