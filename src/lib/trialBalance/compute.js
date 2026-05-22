/* ------------------------------------------------------------------ */
/*  Trial Balance Generator — GL balances with debit/credit pairing    */
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

export const ACCOUNT_TYPES = [
  { id: 'asset',     label: 'Asset',     normal: 'debit'  },
  { id: 'liability', label: 'Liability', normal: 'credit' },
  { id: 'equity',    label: 'Equity',    normal: 'credit' },
  { id: 'revenue',   label: 'Revenue',   normal: 'credit' },
  { id: 'expense',   label: 'Expense',   normal: 'debit'  },
  { id: 'contra',    label: 'Contra',    normal: 'credit' },
  { id: 'gain',      label: 'Gain',      normal: 'credit' },
  { id: 'loss',      label: 'Loss',      normal: 'debit'  },
]

export const TB_PURPOSES = [
  { id: 'monthly',     label: 'Monthly close' },
  { id: 'quarterly',   label: 'Quarterly review' },
  { id: 'year-end',    label: 'Year-end / audit prep' },
  { id: 'adjusting',   label: 'Adjusting / post-close' },
  { id: 'pre-close',   label: 'Pre-close / draft' },
]

/* ---- Helpers ---- */

export function findAccountType(id) { return ACCOUNT_TYPES.find((a) => a.id === id) || ACCOUNT_TYPES[0] }
export function findTbPurpose(id) { return TB_PURPOSES.find((p) => p.id === id) || TB_PURPOSES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Sort and enrich accounts; compute the trial balance.
 * Each account row: { code, name, typeId, debit, credit }
 * One side should be 0 for a normal account; the tool tolerates both filled
 * (debits and credits separately, useful for working trial balances).
 */
export function computeTrialBalance(accounts) {
  const rows = (accounts || []).map((a) => {
    const debit = round2(Math.max(0, Number(a.debit) || 0))
    const credit = round2(Math.max(0, Number(a.credit) || 0))
    const type = findAccountType(a.typeId)
    return {
      ...a,
      typeId: type.id,
      typeLabel: type.label,
      normalSide: type.normal,
      debit,
      credit,
      net: round2(debit - credit),
    }
  })

  const totals = rows.reduce((s, r) => {
    s.debit  += r.debit
    s.credit += r.credit
    return s
  }, { debit: 0, credit: 0 })
  Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]) })

  const difference = round2(totals.debit - totals.credit)
  const inBalance = Math.abs(difference) < 0.005

  return { rows, totals, difference, inBalance }
}

/** Roll up by account type. */
export function buildTypeSummary(rows) {
  const order = ['asset', 'liability', 'equity', 'revenue', 'expense', 'contra', 'gain', 'loss']
  const map = new Map()
  for (const r of rows) {
    const acc = map.get(r.typeId) || {
      typeId: r.typeId, label: r.typeLabel, normalSide: r.normalSide,
      count: 0, debit: 0, credit: 0, net: 0,
    }
    acc.count  += 1
    acc.debit  += r.debit
    acc.credit += r.credit
    acc.net    += r.net
    map.set(r.typeId, acc)
  }
  return Array.from(map.values())
    .map((a) => ({
      ...a,
      debit: round2(a.debit),
      credit: round2(a.credit),
      net: round2(a.net),
    }))
    .sort((a, b) => order.indexOf(a.typeId) - order.indexOf(b.typeId))
}

/** Group accounts by type, sorted by account code within type. */
export function groupAccountsByType(rows) {
  const order = ['asset', 'liability', 'equity', 'revenue', 'expense', 'contra', 'gain', 'loss']
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.typeId)) map.set(r.typeId, [])
    map.get(r.typeId).push(r)
  }
  for (const [, list] of map) {
    list.sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
  }
  const out = []
  for (const t of order) {
    if (!map.has(t)) continue
    const accs = map.get(t)
    out.push({
      typeId: t,
      label: findAccountType(t).label,
      normalSide: findAccountType(t).normal,
      accounts: accs,
      subtotalDebit: round2(accs.reduce((s, a) => s + a.debit, 0)),
      subtotalCredit: round2(accs.reduce((s, a) => s + a.credit, 0)),
    })
  }
  return out
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + accounts table
  if (data.includeTypeSummary) n++
  if (data.includeGrouping)    n++
  if (data.notes)              n++
  return n
}
