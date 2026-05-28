/* ------------------------------------------------------------------ */
/*  General Ledger computation helpers                                 */
/*                                                                      */
/*  A GL contains journal entries. Each entry is a line: date, account, */
/*  description, debit, credit. Each account accumulates net activity   */
/*  and its closing balance is computed by applying the activity to     */
/*  the opening balance using the account's natural side rule.          */
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

/* ---- Account types and their natural sides ----
   Debit-side accounts INCREASE on debit (Assets, Expenses)
   Credit-side accounts INCREASE on credit (Liabilities, Equity, Revenue) */

export const ACCOUNT_TYPES = [
  { id: 'asset',     label: 'Asset',     naturalSide: 'debit'  },
  { id: 'liability', label: 'Liability', naturalSide: 'credit' },
  { id: 'equity',    label: 'Equity',    naturalSide: 'credit' },
  { id: 'revenue',   label: 'Revenue',   naturalSide: 'credit' },
  { id: 'expense',   label: 'Expense',   naturalSide: 'debit'  },
]

export function accountTypeMeta(id) {
  return ACCOUNT_TYPES.find((t) => t.id === id) || ACCOUNT_TYPES[0]
}

/* ------------------------------------------------------------------ */

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

function pct(part, whole) {
  if (!whole) return 0
  return (part / whole) * 100
}

/** Closing balance for an account given opening + debits + credits.
    Debit-side: closing = opening + debits − credits.
    Credit-side: closing = opening − debits + credits. */
function applyActivity(opening, debits, credits, naturalSide) {
  if (naturalSide === 'debit') return round2(opening + debits - credits)
  return round2(opening - debits + credits)
}

/** Compute full GL metrics */
export function computeGL(data) {
  const accounts = data.accounts || []
  const entries  = data.entries  || []

  // Index accounts by name for fast lookup
  const accountByName = new Map()
  for (const a of accounts) {
    accountByName.set(a.name, a)
  }

  // Total debits / credits across all entries
  let totalDebits = 0
  let totalCredits = 0
  for (const e of entries) {
    totalDebits  += Number(e.debit)  || 0
    totalCredits += Number(e.credit) || 0
  }
  totalDebits  = round2(totalDebits)
  totalCredits = round2(totalCredits)

  const balanceDiff = round2(totalDebits - totalCredits)
  const isBalanced = Math.abs(balanceDiff) < 0.01

  // Per-account rollup: opening, debits, credits, closing
  // Initialize from accounts (so empty-activity accounts still appear)
  const perAccountMap = new Map()
  for (const a of accounts) {
    perAccountMap.set(a.name, {
      name: a.name,
      type: a.type || 'asset',
      typeMeta: accountTypeMeta(a.type),
      opening: round2(Number(a.opening) || 0),
      debits: 0,
      credits: 0,
      closing: 0,
      entryCount: 0,
    })
  }
  // Allow entries referencing unknown accounts to still surface
  for (const e of entries) {
    const name = e.account || 'Unassigned'
    if (!perAccountMap.has(name)) {
      perAccountMap.set(name, {
        name,
        type: 'asset',
        typeMeta: accountTypeMeta('asset'),
        opening: 0,
        debits: 0,
        credits: 0,
        closing: 0,
        entryCount: 0,
      })
    }
    const row = perAccountMap.get(name)
    row.debits  += Number(e.debit)  || 0
    row.credits += Number(e.credit) || 0
    row.entryCount += 1
  }
  // Compute closing for each
  const perAccount = Array.from(perAccountMap.values()).map((row) => {
    const closing = applyActivity(row.opening, round2(row.debits), round2(row.credits), row.typeMeta.naturalSide)
    return { ...row, debits: round2(row.debits), credits: round2(row.credits), closing }
  })

  // Sort by type then name
  const typeOrder = { asset: 0, liability: 1, equity: 2, revenue: 3, expense: 4 }
  perAccount.sort((a, b) => (typeOrder[a.type] - typeOrder[b.type]) || a.name.localeCompare(b.name))

  // Trial balance — sum of CLOSING debit-side balances and credit-side balances
  let tbDebit = 0
  let tbCredit = 0
  for (const a of perAccount) {
    if (a.typeMeta.naturalSide === 'debit') {
      if (a.closing >= 0) tbDebit  += a.closing
      else                tbCredit += Math.abs(a.closing) // contra
    } else {
      if (a.closing >= 0) tbCredit += a.closing
      else                tbDebit  += Math.abs(a.closing) // contra
    }
  }
  tbDebit  = round2(tbDebit)
  tbCredit = round2(tbCredit)
  const tbDiff = round2(tbDebit - tbCredit)
  const tbBalanced = Math.abs(tbDiff) < 0.01

  // Group by type for the type summary
  const byTypeMap = new Map()
  for (const a of perAccount) {
    const key = a.type
    const prev = byTypeMap.get(key) || { type: key, label: a.typeMeta.label, debits: 0, credits: 0, accounts: 0 }
    prev.debits  += a.debits
    prev.credits += a.credits
    prev.accounts += 1
    byTypeMap.set(key, prev)
  }
  const byType = Array.from(byTypeMap.values()).map((row) => ({
    ...row,
    debits: round2(row.debits),
    credits: round2(row.credits),
  })).sort((a, b) => typeOrder[a.type] - typeOrder[b.type])

  // Entry dates range (auto period)
  const dates = entries.map((e) => e.date).filter(Boolean).sort()
  const autoStart = dates[0] || null
  const autoEnd   = dates[dates.length - 1] || null

  return {
    entries,
    totalDebits,
    totalCredits,
    balanceDiff,
    isBalanced,
    perAccount,
    byType,
    tbDebit,
    tbCredit,
    tbDiff,
    tbBalanced,
    countEntries: entries.length,
    countAccounts: perAccount.length,
    autoStart,
    autoEnd,
  }
}

export function describePeriod(data) {
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
