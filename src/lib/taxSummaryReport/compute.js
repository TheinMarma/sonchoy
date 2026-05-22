/* ------------------------------------------------------------------ */
/*  Tax Summary Report — collected / owed / remitted across taxes      */
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

export const TAX_TYPES = [
  { id: 'income',     label: 'Corporate income tax' },
  { id: 'gst',        label: 'GST / VAT' },
  { id: 'sales',      label: 'Sales tax' },
  { id: 'payroll',    label: 'Payroll / withholding tax' },
  { id: 'tds',        label: 'TDS / withholding (vendor)' },
  { id: 'property',   label: 'Property tax' },
  { id: 'excise',     label: 'Excise / customs' },
  { id: 'capital',    label: 'Capital gains' },
  { id: 'other',      label: 'Other' },
]

export const STATUSES = [
  { id: 'paid',       label: 'Paid in full',     tone: 'success' },
  { id: 'partial',    label: 'Partially paid',   tone: 'warning' },
  { id: 'pending',    label: 'Pending / due',    tone: 'info'    },
  { id: 'overdue',    label: 'Overdue',          tone: 'danger'  },
  { id: 'filed',      label: 'Filed, no payment due', tone: 'success' },
]

export const SORT_MODES = [
  { id: 'due-asc',     label: 'Due date · earliest first' },
  { id: 'owed-desc',   label: 'Owed amount · largest first' },
  { id: 'type',        label: 'Tax type, then jurisdiction' },
  { id: 'status',      label: 'Status · overdue first' },
]

export const REPORT_PURPOSES = [
  { id: 'monthly',    label: 'Monthly close' },
  { id: 'quarterly',  label: 'Quarterly review' },
  { id: 'year-end',   label: 'Year-end / audit prep' },
  { id: 'cfo',        label: 'CFO / leadership review' },
  { id: 'authority',  label: 'For tax authority' },
]

/* ---- Helpers ---- */

export function findTaxType(id) { return TAX_TYPES.find((t) => t.id === id) || TAX_TYPES[TAX_TYPES.length - 1] }
export function findStatus(id) { return STATUSES.find((s) => s.id === id) || STATUSES[2] }
export function findSortMode(id) { return SORT_MODES.find((s) => s.id === id) || SORT_MODES[0] }
export function findReportPurpose(id) { return REPORT_PURPOSES.find((p) => p.id === id) || REPORT_PURPOSES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

const STATUS_ORDER = { overdue: 0, partial: 1, pending: 2, paid: 3, filed: 4 }

/* ---- Core computation ---- */

/**
 * Compute tax summary.
 *
 * Each row: {
 *   taxTypeId, jurisdiction, period, dueDate,
 *   collected, owed, remitted, statusId, reference
 * }
 */
export function computeSummary(data) {
  const today = (data.reportDate || todayISO())
  const todayMs = new Date(today).valueOf()

  const rows = (data.rows || []).map((r) => {
    const type = findTaxType(r.taxTypeId)
    const collected = round2(Math.max(0, Number(r.collected) || 0))
    const owed      = round2(Math.max(0, Number(r.owed) || 0))
    const remitted  = round2(Math.max(0, Number(r.remitted) || 0))
    const balance   = round2(Math.max(0, owed - remitted))

    // Auto-status: if user didn't supply, derive
    let statusId = r.statusId
    if (!statusId || statusId === 'auto') {
      if (owed === 0)                       statusId = 'filed'
      else if (balance <= 0.005)            statusId = 'paid'
      else if (remitted > 0)                statusId = 'partial'
      else if (r.dueDate && new Date(r.dueDate).valueOf() < todayMs) statusId = 'overdue'
      else                                  statusId = 'pending'
    }
    const status = findStatus(statusId)

    return {
      ...r,
      taxTypeId: type.id,
      taxTypeLabel: type.label,
      collected, owed, remitted, balance,
      statusId, statusLabel: status.label, statusTone: status.tone,
    }
  })

  const totals = rows.reduce((s, r) => {
    s.collected += r.collected
    s.owed      += r.owed
    s.remitted  += r.remitted
    s.balance   += r.balance
    return s
  }, { collected: 0, owed: 0, remitted: 0, balance: 0 })
  Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]) })

  // Counts by status
  const statusCounts = rows.reduce((s, r) => {
    s[r.statusId] = (s[r.statusId] || 0) + 1
    return s
  }, {})

  const overdueBalance = round2(rows.filter((r) => r.statusId === 'overdue').reduce((s, r) => s + r.balance, 0))
  const pendingBalance = round2(rows.filter((r) => r.statusId === 'pending' || r.statusId === 'partial').reduce((s, r) => s + r.balance, 0))

  // Sort
  const sort = findSortMode(data.sortMode)
  const sorted = [...rows]
  switch (sort.id) {
    case 'due-asc':
      sorted.sort((a, b) => (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31'))
      break
    case 'owed-desc':
      sorted.sort((a, b) => b.owed - a.owed)
      break
    case 'type':
      sorted.sort((a, b) => {
        if (a.taxTypeId !== b.taxTypeId) return a.taxTypeId.localeCompare(b.taxTypeId)
        return String(a.jurisdiction || '').localeCompare(String(b.jurisdiction || ''))
      })
      break
    case 'status':
      sorted.sort((a, b) => {
        const sa = STATUS_ORDER[a.statusId] ?? 99
        const sb = STATUS_ORDER[b.statusId] ?? 99
        if (sa !== sb) return sa - sb
        return b.owed - a.owed
      })
      break
  }

  return {
    rows: sorted,
    totals,
    statusCounts,
    overdueBalance,
    pendingBalance,
  }
}

/** Roll up by tax type. */
export function buildTypeSummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const acc = map.get(r.taxTypeId) || {
      taxTypeId: r.taxTypeId, label: r.taxTypeLabel,
      count: 0, collected: 0, owed: 0, remitted: 0, balance: 0,
    }
    acc.count    += 1
    acc.collected += r.collected
    acc.owed      += r.owed
    acc.remitted  += r.remitted
    acc.balance   += r.balance
    map.set(r.taxTypeId, acc)
  }
  return Array.from(map.values())
    .map((t) => ({
      ...t,
      collected: round2(t.collected),
      owed: round2(t.owed),
      remitted: round2(t.remitted),
      balance: round2(t.balance),
    }))
    .sort((a, b) => b.owed - a.owed)
}

/** Roll up by jurisdiction (free-text label per row). */
export function buildJurisdictionSummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = (r.jurisdiction || '—').trim() || '—'
    const acc = map.get(key) || {
      jurisdiction: key,
      count: 0, owed: 0, remitted: 0, balance: 0,
    }
    acc.count    += 1
    acc.owed      += r.owed
    acc.remitted  += r.remitted
    acc.balance   += r.balance
    map.set(key, acc)
  }
  return Array.from(map.values())
    .map((j) => ({
      ...j,
      owed: round2(j.owed),
      remitted: round2(j.remitted),
      balance: round2(j.balance),
    }))
    .sort((a, b) => b.balance - a.balance)
}

/** Filter rows that are overdue. */
export function buildOverdueList(rows) {
  return rows.filter((r) => r.statusId === 'overdue' && r.balance > 0)
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + main table
  if (data.includeTypeSummary)        n++
  if (data.includeJurisdictionSummary) n++
  if (data.includeOverdueBlock)        n++
  if (data.notes)                       n++
  return n
}
