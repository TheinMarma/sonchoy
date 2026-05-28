/* Heuristic bank-statement parser.
   Reuses the positioned-text output from pdfExtract.js and turns it into a
   structured statement object: account header + transaction rows. Designed
   for text-based statement PDFs (most modern banks export these); scanned
   statements need OCR, which is gated behind the pdfFiller premium tier. */

import { parseAmount } from './parseInvoice'

/* ---------- shared regexes ---------- */

const DATE_PATTERNS = [
  /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/,
  /\b(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/,
  /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{2,4})\b/i,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{2,4})\b/i,
]
const LEADING_DATE_RE = new RegExp(
  '^\\s*(' +
    '\\d{1,2}[\\/.\\-]\\d{1,2}[\\/.\\-]\\d{2,4}' +
    '|\\d{4}[\\/.\\-]\\d{1,2}[\\/.\\-]\\d{1,2}' +
    '|\\d{1,2}\\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?\\s+\\d{2,4}' +
    '|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?\\s+\\d{1,2},?\\s+\\d{2,4}' +
  ')',
  'i',
)

const CURRENCY_CODE_RE = /\b(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY|SGD|HKD|BRL|MXN|AED|SAR|RUB|ZAR|NZD|SEK|NOK|DKK|PLN|TRY|KRW|THB|MYR|PHP|IDR|VND|EGP|NGN|KES|BDT|PKR|LKR|NPR)\b/i
const CURRENCY_SYMBOL_NAMES = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR', '₽': 'RUB' }

const MONEY_TOKEN_RE = /-?\(?[\$€£¥₹₽]?\s?\d{1,3}(?:[,. ]\d{3})*(?:[.,]\d{1,2})?\)?(?:\s?(?:CR|DR|cr|dr))?/g

const SKIP_KEYWORDS = [
  'page', 'continued', 'statement period', 'statement date',
  'date description', 'transaction date', 'posting date',
  'opening balance', 'closing balance', 'balance forward',
  'subtotal', 'total', 'beginning balance', 'ending balance',
]

const MONTH_TO_NUM = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

/* ---------- helpers ---------- */

function normalizeDate(rawMatch) {
  if (!rawMatch) return null
  const s = String(rawMatch).trim()

  // dd/mm/yyyy or yyyy-mm-dd
  let m = s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/)
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`

  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/)
  if (m) {
    const a = +m[1], b = +m[2]
    let y = +m[3]
    if (y < 100) y += y < 50 ? 2000 : 1900
    // assume dd/mm/yyyy when ambiguous; fall back to mm/dd if day > 12 is impossible
    const day = a, month = b
    return `${y}-${pad(month)}-${pad(day)}`
  }

  m = s.match(/^(\d{1,2})\s+([a-z]+)\.?\s+(\d{2,4})$/i)
  if (m) {
    let y = +m[3]
    if (y < 100) y += y < 50 ? 2000 : 1900
    const mon = MONTH_TO_NUM[m[2].toLowerCase().slice(0, 3)]
    if (mon) return `${y}-${pad(mon)}-${pad(+m[1])}`
  }

  m = s.match(/^([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{2,4})$/i)
  if (m) {
    let y = +m[3]
    if (y < 100) y += y < 50 ? 2000 : 1900
    const mon = MONTH_TO_NUM[m[1].toLowerCase().slice(0, 3)]
    if (mon) return `${y}-${pad(mon)}-${pad(+m[2])}`
  }

  return s
}

function pad(n) { return String(n).padStart(2, '0') }

function detectCurrency(text) {
  const m = text.match(CURRENCY_CODE_RE)
  if (m) return m[1].toUpperCase()
  for (const sym of Object.keys(CURRENCY_SYMBOL_NAMES)) {
    if (text.includes(sym)) return CURRENCY_SYMBOL_NAMES[sym]
  }
  return null
}

function groupIntoLines(items) {
  if (!items.length) return []
  const sorted = [...items].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x)
  const lines = []
  for (const it of sorted) {
    const last = lines[lines.length - 1]
    if (last && last.page === it.page && Math.abs(last.y - it.y) < 4) {
      last.parts.push(it)
    } else {
      lines.push({ page: it.page, y: it.y, parts: [it] })
    }
  }
  return lines.map((ln) => ({
    page: ln.page,
    y: ln.y,
    text: ln.parts.map((p) => p.str).join(' ').replace(/\s+/g, ' ').trim(),
    parts: ln.parts.sort((a, b) => a.x - b.x),
  }))
}

/** Parse a single transaction line. Returns null if the line isn't a tx. */
function parseTxLine(line) {
  const text = line.text
  if (!text || text.length < 6) return null

  // Skip header/footnote-ish rows
  const low = text.toLowerCase()
  if (SKIP_KEYWORDS.some((k) => low.startsWith(k))) return null

  // Must start with a date
  const dateMatch = text.match(LEADING_DATE_RE)
  if (!dateMatch) return null
  const dateRaw = dateMatch[1]
  const afterDate = text.slice(dateMatch[0].length).trim()
  if (!afterDate) return null

  // Find money tokens
  const moneyMatches = []
  let m
  const re = new RegExp(MONEY_TOKEN_RE.source, 'g')
  while ((m = re.exec(afterDate)) !== null) {
    const raw = m[0]
    // Reject pure year-like tokens (e.g. 2026) without decimals/separators
    if (/^\(?\d{1,4}\)?$/.test(raw) && !raw.includes(',') && !raw.includes('.')) continue
    const val = parseAmount(raw)
    if (val == null || Math.abs(val) < 0.01 && raw !== '0' && raw !== '0.00') continue
    // CR / DR suffix → polarity hint
    const dr = /dr\s*$/i.test(raw)
    const cr = /cr\s*$/i.test(raw)
    moneyMatches.push({ raw, value: val, index: m.index, length: raw.length, dr, cr })
  }

  if (moneyMatches.length === 0) return null

  // Description = everything before the first money token
  const firstMoney = moneyMatches[0]
  const description = afterDate.slice(0, firstMoney.index).trim().replace(/\s+/g, ' ')
  if (!description) return null

  // Allocate the trailing numbers to debit / credit / balance
  let debit = null, credit = null, balance = null

  if (moneyMatches.length === 1) {
    const v = moneyMatches[0]
    if (v.cr) credit = Math.abs(v.value)
    else if (v.dr) debit = Math.abs(v.value)
    else if (v.value < 0) debit = Math.abs(v.value)
    else credit = v.value   // ambiguous — default to credit
  } else if (moneyMatches.length === 2) {
    const [a, b] = moneyMatches
    balance = b.value
    if (a.cr) credit = Math.abs(a.value)
    else if (a.dr) debit = Math.abs(a.value)
    else if (a.value < 0) debit = Math.abs(a.value)
    else credit = a.value
  } else {
    // 3+ numbers — assume debit, credit, balance (banks often leave one blank but pdf.js may not insert it).
    const [a, b, c] = moneyMatches
    debit   = a.value && a.value !== 0 ? Math.abs(a.value) : null
    credit  = b.value && b.value !== 0 ? Math.abs(b.value) : null
    balance = c.value
  }

  return {
    date: normalizeDate(dateRaw),
    description,
    debit:   debit   != null ? Number(debit.toFixed(2))   : null,
    credit:  credit  != null ? Number(credit.toFixed(2))  : null,
    balance: balance != null ? Number(balance.toFixed(2)) : null,
  }
}

/** Find the value following a label, e.g. "Account number: XXXX1234". */
function findLabeled(lines, labels, maxLines = 200) {
  const slice = lines.slice(0, maxLines)
  for (const ln of slice) {
    const low = ln.text.toLowerCase()
    for (const label of labels) {
      const idx = low.indexOf(label.toLowerCase())
      if (idx === -1) continue
      // Trim the label off + common separators
      const rest = ln.text.slice(idx + label.length).replace(/^[\s:\-–—.]+/, '').trim()
      if (rest) return rest.split(/\s{2,}|\s\|\s/)[0].trim()
    }
  }
  return null
}

/** Find the FIRST line containing one of the labels and return its trailing money amount. */
function findLabeledMoney(lines, labels) {
  for (const ln of lines) {
    const low = ln.text.toLowerCase()
    if (!labels.some((l) => low.includes(l))) continue
    let last = null
    let m
    const re = new RegExp(MONEY_TOKEN_RE.source, 'g')
    while ((m = re.exec(ln.text)) !== null) last = m[0]
    if (!last) continue
    const v = parseAmount(last)
    if (v != null) return v
  }
  return null
}

/* ---------- main entry ---------- */

/**
 * @param {Array}  items — positioned text items from pdfExtract.js
 * @param {string} fileName — original file name (for the workbook)
 * @returns {object} parsed statement
 */
export function parseStatement(items, fileName = null) {
  const lines = groupIntoLines(items)
  const fullText = lines.map((l) => l.text).join('\n')

  // ---- Header / account ----
  const accountHolder = findLabeled(lines, ['account holder', 'account name', 'name on account', 'customer name'])
  const accountNumber = findLabeled(lines, ['account number', 'account no', 'a/c no', 'acct number', 'acc number', 'iban'])
  const bankName      = findLabeled(lines, ['bank name', 'issued by', 'bank']) || guessBankFromTop(lines)
  const branch        = findLabeled(lines, ['branch'])
  const currency      = detectCurrency(fullText)
  const period        = findLabeled(lines, ['statement period', 'period', 'for the period'])

  const openingBalance = findLabeledMoney(lines, ['opening balance', 'beginning balance', 'balance forward', 'previous balance'])
  const closingBalance = findLabeledMoney(lines, ['closing balance', 'ending balance', 'balance carried', 'current balance'])

  // ---- Transactions ----
  const transactions = []
  for (const ln of lines) {
    const tx = parseTxLine(ln)
    if (tx) transactions.push(tx)
  }

  // ---- Totals ----
  let totalDebit  = 0
  let totalCredit = 0
  for (const t of transactions) {
    if (t.debit)  totalDebit  += t.debit
    if (t.credit) totalCredit += t.credit
  }
  totalDebit  = Number(totalDebit.toFixed(2))
  totalCredit = Number(totalCredit.toFixed(2))

  // ---- Date range from transactions (fallback when "period" missing) ----
  const dates = transactions.map((t) => t.date).filter(Boolean).sort()
  const startDate = dates[0] || null
  const endDate   = dates[dates.length - 1] || null

  // ---- Confidence ----
  const detected =
    (accountNumber ? 1 : 0) +
    (currency ? 1 : 0) +
    (openingBalance != null ? 1 : 0) +
    (closingBalance != null ? 1 : 0) +
    (transactions.length > 0 ? 1 : 0)
  const confidence = Math.min(99, 55 + detected * 9 + Math.min(10, Math.floor(transactions.length / 10)))

  return {
    fileName,
    bank: bankName,
    accountHolder,
    accountNumber,
    branch,
    period,
    startDate,
    endDate,
    currency,
    openingBalance,
    closingBalance,
    transactions,
    totalDebit,
    totalCredit,
    confidence,
    rawText: fullText,
  }
}

function guessBankFromTop(lines) {
  // Look in the top 6 lines for a bank-looking name
  for (const ln of lines.slice(0, 6)) {
    if (/bank|credit union|building society/i.test(ln.text) && ln.text.length < 60) {
      return ln.text.replace(/\s{2,}/g, ' ').trim()
    }
  }
  return null
}
