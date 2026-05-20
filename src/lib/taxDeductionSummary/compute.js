/* ------------------------------------------------------------------ */
/*  Tax Deduction Summary — section-wise deductions + proof audit      */
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

export const DEDUCTION_CATEGORIES = [
  { id: 'investment', label: 'Investments & savings' },
  { id: 'insurance',  label: 'Insurance premiums' },
  { id: 'housing',    label: 'Housing / mortgage' },
  { id: 'medical',    label: 'Medical / health' },
  { id: 'education',  label: 'Education / loans' },
  { id: 'charity',    label: 'Charitable donations' },
  { id: 'pension',    label: 'Pension / retirement' },
  { id: 'business',   label: 'Business expenses' },
  { id: 'other',      label: 'Other' },
]

export const PROOF_STATUSES = [
  { id: 'verified',  label: 'Verified',       tone: 'success' },
  { id: 'pending',   label: 'Pending review', tone: 'warning' },
  { id: 'missing',   label: 'Missing proof',  tone: 'danger'  },
  { id: 'n/a',       label: 'Not required',   tone: 'muted'   },
]

export const SUMMARY_PURPOSES = [
  { id: 'filing',     label: 'Filing preparation' },
  { id: 'audit',      label: 'Audit / inspection support' },
  { id: 'planning',   label: 'Tax-planning review' },
  { id: 'employer',   label: 'Employer declaration (e.g. India Form 12BB)' },
]

/* ---- Helpers ---- */

export function findCategory(id) { return DEDUCTION_CATEGORIES.find((c) => c.id === id) || DEDUCTION_CATEGORIES[0] }
export function findProofStatus(id) { return PROOF_STATUSES.find((s) => s.id === id) || PROOF_STATUSES[1] }
export function findSummaryPurpose(id) { return SUMMARY_PURPOSES.find((p) => p.id === id) || SUMMARY_PURPOSES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/**
 * Compute per-row claimed (capped by limit when limit > 0) plus totals.
 */
export function computeDeductions(rows) {
  const out = (rows || []).map((r) => {
    const amount = Number(r.amount) || 0
    const limit  = Number(r.limit) || 0
    const claimable = limit > 0 ? Math.min(amount, limit) : amount
    const unused    = limit > 0 ? Math.max(0, limit - amount) : 0
    return {
      ...r,
      amount: round2(amount),
      limit: round2(limit),
      claimable: round2(claimable),
      unused: round2(unused),
    }
  })

  const totals = out.reduce((s, r) => {
    s.claimedRaw  += r.amount
    s.claimable   += r.claimable
    s.limit       += r.limit
    s.unused      += r.unused
    return s
  }, { claimedRaw: 0, claimable: 0, limit: 0, unused: 0 })

  Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]) })

  const verifiedCount = out.filter((r) => r.proofStatusId === 'verified').length
  const pendingCount  = out.filter((r) => r.proofStatusId === 'pending').length
  const missingCount  = out.filter((r) => r.proofStatusId === 'missing').length

  return {
    rows: out,
    totals,
    verifiedCount,
    pendingCount,
    missingCount,
  }
}

/** Roll up by category. */
export function buildCategorySummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = r.categoryId || 'other'
    const cat = findCategory(key)
    const acc = map.get(key) || {
      categoryId: key, label: cat.label,
      count: 0, claimedRaw: 0, claimable: 0, limit: 0, unused: 0,
    }
    acc.count       += 1
    acc.claimedRaw  += r.amount
    acc.claimable   += r.claimable
    acc.limit       += r.limit
    acc.unused      += r.unused
    map.set(key, acc)
  }
  return Array.from(map.values()).map((a) => ({
    ...a,
    claimedRaw: round2(a.claimedRaw),
    claimable:  round2(a.claimable),
    limit:      round2(a.limit),
    unused:     round2(a.unused),
  }))
}

/** Roll up by section code (e.g., 80C, 80D in India; bands in other jurisdictions). */
export function buildSectionSummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = (r.section || '—').trim() || '—'
    const acc = map.get(key) || {
      section: key, label: r.sectionLabel || key,
      count: 0, claimable: 0, limit: 0,
    }
    acc.count     += 1
    acc.claimable += r.claimable
    acc.limit     += r.limit
    if (r.sectionLabel) acc.label = r.sectionLabel
    map.set(key, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, claimable: round2(a.claimable), limit: round2(a.limit) }))
    .sort((a, b) => a.section.localeCompare(b.section))
}

/** Section counter for hero stats. */
export function countSections(data) {
  let n = 2 // header + line items
  if (data.includeCategorySummary) n++
  if (data.includeSectionSummary)  n++
  if (data.includeProofAudit)      n++
  if (data.notes) n++
  return n
}
