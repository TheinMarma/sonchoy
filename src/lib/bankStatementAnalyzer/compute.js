/* ------------------------------------------------------------------ */
/*  Bank Statement Analyzer — categorise, detect recurring, roll up    */
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

/* ---- Categories ---- */

export const CATEGORIES = [
  { id: 'income',         label: 'Income / salary',         tone: 'success', kind: 'credit' },
  { id: 'transfer-in',    label: 'Transfer in',             tone: 'success', kind: 'credit' },
  { id: 'refund',         label: 'Refund / reversal',       tone: 'success', kind: 'credit' },
  { id: 'groceries',      label: 'Groceries',               tone: 'tax',     kind: 'debit'  },
  { id: 'dining',         label: 'Dining / cafes',          tone: 'tax',     kind: 'debit'  },
  { id: 'transport',      label: 'Transport / fuel',        tone: 'tax',     kind: 'debit'  },
  { id: 'travel',         label: 'Travel',                  tone: 'tax',     kind: 'debit'  },
  { id: 'utilities',      label: 'Utilities',               tone: 'tax',     kind: 'debit'  },
  { id: 'rent',           label: 'Rent / mortgage',         tone: 'tax',     kind: 'debit'  },
  { id: 'subscriptions',  label: 'Subscriptions',           tone: 'tax',     kind: 'debit'  },
  { id: 'shopping',       label: 'Shopping',                tone: 'tax',     kind: 'debit'  },
  { id: 'health',         label: 'Health / medical',        tone: 'tax',     kind: 'debit'  },
  { id: 'entertainment',  label: 'Entertainment',           tone: 'tax',     kind: 'debit'  },
  { id: 'fees',           label: 'Bank fees / charges',     tone: 'warning', kind: 'debit'  },
  { id: 'tax',            label: 'Tax / govt',              tone: 'warning', kind: 'debit'  },
  { id: 'investment',     label: 'Investment / savings',    tone: 'tax',     kind: 'debit'  },
  { id: 'transfer-out',   label: 'Transfer out',            tone: 'muted',   kind: 'debit'  },
  { id: 'other',          label: 'Other',                   tone: 'muted',   kind: 'either' },
  { id: 'uncategorised',  label: 'Uncategorised',           tone: 'muted',   kind: 'either' },
]

/**
 * Keyword rules used for auto-categorisation. First match wins.
 * Each rule:  { id, patterns: RegExp[], category }
 */
const RULES = [
  // Income
  { category: 'income',        patterns: [/salary/i, /payroll/i, /direct deposit/i, /wages/i] },
  { category: 'refund',        patterns: [/refund/i, /reversal/i, /chargeback/i] },
  { category: 'transfer-in',   patterns: [/credit transfer/i, /incoming transfer/i] },

  // Groceries / shopping
  { category: 'groceries',     patterns: [/tesco|sainsbury|asda|waitrose|aldi|lidl|whole foods|kroger|trader joe|walmart grocer|big bazaar|bigbasket|grofers|zepto|reliance fresh/i] },
  { category: 'dining',        patterns: [/restaurant|cafe|coffee|starbucks|costa|pret|mcdonald|kfc|domino|pizza hut|zomato|swiggy|uber eats|deliveroo|grubhub|doordash/i] },

  // Transport / travel
  { category: 'transport',     patterns: [/uber|lyft|ola|gas station|petrol|shell|bp |exxon|chevron|tfl|metro|transit/i] },
  { category: 'travel',        patterns: [/airline|flight|hotel|booking\.com|expedia|airbnb|trip\.com|kayak|delta air|british airways|emirates|indigo|vistara/i] },

  // Bills
  { category: 'utilities',     patterns: [/electricity|electric co|water|gas bill|broadband|internet|wifi|phone bill|airtel|vodafone|verizon|att |comcast|sky |bt /i] },
  { category: 'rent',          patterns: [/rent|landlord|mortgage|emi|housing/i] },

  // Subscriptions
  { category: 'subscriptions', patterns: [/netflix|spotify|hulu|disney|prime video|apple\.com\/bill|icloud|google\s?one|youtube premium|adobe|notion|figma|github|dropbox/i] },

  // Misc
  { category: 'shopping',      patterns: [/amazon|amzn|flipkart|ebay|aliexpress|target|shopify|myntra|nykaa|asos|zara|h&m|uniqlo/i] },
  { category: 'health',        patterns: [/pharmacy|chemist|apollo|fortis|hospital|clinic|cvs|walgreens|boots|medical/i] },
  { category: 'entertainment', patterns: [/cinema|movie|theatre|theater|pvr|inox|imax|bookmyshow|ticketmaster|concert|stubhub/i] },

  // Fees / tax
  { category: 'fees',          patterns: [/bank charge|service fee|overdraft|interest charge|atm fee|nsf|insufficient/i] },
  { category: 'tax',           patterns: [/tax|hmrc|irs|gst payment|income tax|tds|self assessment/i] },

  // Investment / savings
  { category: 'investment',    patterns: [/etf|mutual fund|stock|sip|elss|ppf|nps|brokerage|vanguard|fidelity|zerodha|robinhood/i] },

  // Generic transfers
  { category: 'transfer-out',  patterns: [/transfer to|outgoing transfer|wire to|imps|neft|upi/i] },
]

export function findCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

/* ---- Vendor extraction ---- */

/** Reduce a noisy transaction description to a vendor key. */
export function extractVendor(description) {
  if (!description) return '—'
  let s = String(description)
  // Strip dates
  s = s.replace(/\b\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?\b/g, '')
  // Strip reference / id-like tokens
  s = s.replace(/\b(ref|txn|trn|id|auth|seq|po)[: ]?[a-z0-9-]+/gi, '')
  s = s.replace(/\b\d{6,}\b/g, '')          // long number sequences
  s = s.replace(/[*#\-_/\\]+/g, ' ')          // common separators
  s = s.replace(/\s{2,}/g, ' ').trim()

  // Take leading 2-4 words (most banks put the vendor first)
  const words = s.split(/\s+/).filter(Boolean)
  const vendor = words.slice(0, Math.min(4, words.length)).join(' ').trim()
  // Title-case
  return vendor.replace(/\b([A-Z]{2,})\b/g, (m) => m.charAt(0) + m.slice(1).toLowerCase()) || '—'
}

/* ---- Auto-categorise ---- */

export function autoCategorise(tx) {
  const text = `${tx.description || ''}`.toLowerCase()
  // First, broad credit detection
  const isCredit = (Number(tx.credit) || 0) > 0
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      if (p.test(text)) return rule.category
    }
  }
  // Default: split by credit/debit
  if (isCredit) return 'income'
  return 'uncategorised'
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core analysis ---- */

/**
 * Take an array of raw transactions and return an enriched analysis.
 * Transaction shape: { date, description, debit, credit, balance }
 */
export function analyseTransactions(rawTransactions, opts = {}) {
  const enriched = (rawTransactions || []).map((t, idx) => {
    const debit  = Number(t.debit)  || 0
    const credit = Number(t.credit) || 0
    const vendor = extractVendor(t.description || '')
    const categoryId = t.categoryId || autoCategorise(t)
    return {
      ...t,
      idx,
      debit, credit,
      net: round2(credit - debit),
      vendor,
      categoryId,
    }
  })

  // Recurring detection: same vendor + appearing >= 2 times with similar magnitude
  const groups = new Map()
  for (const t of enriched) {
    const key = `${t.vendor}|${t.categoryId}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(t)
  }
  const recurringVendors = new Set()
  for (const [key, txs] of groups.entries()) {
    if (txs.length < 2) continue
    // Mark all as recurring if appearing at least twice (in a single statement)
    recurringVendors.add(key)
  }
  for (const t of enriched) {
    t.recurring = recurringVendors.has(`${t.vendor}|${t.categoryId}`)
  }

  // Totals
  const totalCredit = round2(enriched.reduce((s, t) => s + t.credit, 0))
  const totalDebit  = round2(enriched.reduce((s, t) => s + t.debit, 0))
  const net = round2(totalCredit - totalDebit)
  const recurringDebit = round2(enriched.filter((t) => t.recurring && t.debit > 0).reduce((s, t) => s + t.debit, 0))
  const oneOffDebit    = round2(totalDebit - recurringDebit)

  return {
    rows: enriched,
    totals: { totalCredit, totalDebit, net, recurringDebit, oneOffDebit },
  }
}

/* ---- Rollups ---- */

export function buildCategorySummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const id = r.categoryId
    const cat = findCategory(id)
    const acc = map.get(id) || {
      categoryId: id, label: cat.label, tone: cat.tone,
      count: 0, debit: 0, credit: 0, net: 0,
    }
    acc.count += 1
    acc.debit  += r.debit
    acc.credit += r.credit
    acc.net    += r.net
    map.set(id, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, debit: round2(a.debit), credit: round2(a.credit), net: round2(a.net) }))
    .sort((a, b) => b.debit - a.debit)
}

export function buildVendorSummary(rows, limit = 12) {
  const map = new Map()
  for (const r of rows) {
    if (r.debit <= 0) continue
    const key = r.vendor || '—'
    const acc = map.get(key) || {
      vendor: key, count: 0, debit: 0, recurring: r.recurring,
      categoryId: r.categoryId,
    }
    acc.count += 1
    acc.debit += r.debit
    acc.recurring = acc.recurring || r.recurring
    map.set(key, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, debit: round2(a.debit) }))
    .sort((a, b) => b.debit - a.debit)
    .slice(0, limit)
}

export function buildMonthlySummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = (r.date || '').slice(0, 7) || '—'
    const acc = map.get(key) || { month: key, debit: 0, credit: 0, net: 0, count: 0 }
    acc.debit  += r.debit
    acc.credit += r.credit
    acc.net    += r.net
    acc.count  += 1
    map.set(key, acc)
  }
  return Array.from(map.values())
    .map((a) => ({ ...a, debit: round2(a.debit), credit: round2(a.credit), net: round2(a.net) }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/* ---- Section counter ---- */

export function countSections(data) {
  let n = 2 // header + transactions
  if (data.includeCategorySummary) n++
  if (data.includeVendorSummary)   n++
  if (data.includeMonthlySummary)  n++
  if (data.includeRecurringBlock)  n++
  if (data.notes) n++
  return n
}
