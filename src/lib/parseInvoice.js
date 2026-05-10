/* Heuristic invoice parser — turns raw text-with-positions into a structured
   invoice object. Designed to handle most text-based invoice PDFs without an
   LLM round-trip. */

const CURRENCY_SYMBOL_RE = /([\$€£¥₹₽])/
const CURRENCY_CODE_RE = /\b(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY|SGD|HKD|BRL|MXN|AED|SAR|RUB|ZAR|NZD|SEK|NOK|DKK|PLN|TRY|KRW|THB|MYR|PHP|IDR|VND|EGP|NGN|KES|BDT|PKR|LKR|NPR)\b/i
const CURRENCY_NAMES = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR', '₽': 'RUB' }

/* A money number anchored to the END of a string. Decimals optional so "100" or "$50" both match. */
const TRAILING_MONEY_RE = /(?:^|\s)([\$€£¥₹₽]?\s?-?\s?\(?[\$€£¥₹₽]?\s?(?:\d{1,3}(?:[,. ]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\)?)\s*$/

const DATE_PATTERNS = [
  /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/,
  /\b(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/,
  /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{2,4})\b/i,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{2,4})\b/i,
]

const HEADER_KEYWORDS = ['description', 'item', 'service', 'product', 'qty', 'quantity', 'unit price', 'rate', 'amount', 'price', 'total']
const TOTAL_LABELS = ['total', 'amount due', 'balance due', 'grand total', 'amount payable']
const SUBTOTAL_LABELS = ['subtotal', 'sub total', 'sub-total', 'net total', 'net amount']
const TAX_LABELS = ['tax', 'vat', 'gst', 'sales tax', 'igst', 'cgst', 'sgst']
const DISCOUNT_LABELS = ['discount']
const SHIPPING_LABELS = ['shipping', 'freight', 'delivery', 'postage']

const MONTH_TO_NUM = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 }

/* ---------- helpers ---------- */

export function parseAmount(raw) {
  if (raw == null) return null
  const cleaned = String(raw).replace(/[^\d,.\-()]/g, '').trim()
  if (!cleaned) return null

  const negative = cleaned.startsWith('-') || cleaned.startsWith('(')
  const stripped = cleaned.replace(/[()-]/g, '')

  const lastComma = stripped.lastIndexOf(',')
  const lastDot = stripped.lastIndexOf('.')

  let normalized
  if (lastComma === -1 && lastDot === -1) {
    normalized = stripped
  } else if (lastComma > lastDot) {
    normalized = stripped.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = stripped.replace(/,/g, '')
  }

  const num = parseFloat(normalized)
  if (isNaN(num)) return null
  return negative ? -num : num
}

function groupIntoLines(items) {
  if (!items.length) return []
  const sorted = [...items].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x)

  const lines = []
  for (const item of sorted) {
    const last = lines[lines.length - 1]
    const tol = Math.max(2, (item.height || 8) * 0.6)
    if (last && last.page === item.page && Math.abs(last.y - item.y) < tol) {
      last.items.push(item)
    } else {
      lines.push({ page: item.page, y: item.y, items: [item] })
    }
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x)
    line.text = line.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim()
    line.minX = line.items[0].x
    line.maxX = Math.max(...line.items.map((i) => i.x + (i.width || 0)))
  }

  return lines
}

function trailingAmount(text) {
  const m = text.match(TRAILING_MONEY_RE)
  if (!m) return null
  const num = parseAmount(m[1])
  if (num == null) return null
  return { value: num, raw: m[1].trim(), startIdx: m.index + (m[0].length - m[1].length) }
}

function findDate(text) {
  for (const re of DATE_PATTERNS) {
    const m = text.match(re)
    if (m) {
      const iso = normaliseDate(m)
      if (iso) return iso
    }
  }
  return null
}

function normaliseDate(match) {
  const [, a, b, c] = match
  let yyyy, mm, dd

  if (/^[a-z]{3,5}/i.test(a)) {
    mm = MONTH_TO_NUM[a.toLowerCase().slice(0, 3)]
    dd = parseInt(b, 10); yyyy = parseInt(c, 10)
  } else if (/^[a-z]{3,5}/i.test(b)) {
    dd = parseInt(a, 10); mm = MONTH_TO_NUM[b.toLowerCase().slice(0, 3)]; yyyy = parseInt(c, 10)
  } else if (a.length === 4) {
    yyyy = parseInt(a, 10); mm = parseInt(b, 10); dd = parseInt(c, 10)
  } else {
    const first = parseInt(a, 10), second = parseInt(b, 10)
    if (first > 12) { dd = first; mm = second }
    else if (second > 12) { mm = first; dd = second }
    else { mm = first; dd = second }
    yyyy = parseInt(c, 10)
  }
  if (yyyy < 100) yyyy += 2000
  if (!yyyy || !mm || !dd) return null
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

function detectCurrency(items) {
  const fullText = items.map((i) => i.str).join(' ')
  const codeMatch = fullText.match(CURRENCY_CODE_RE)
  if (codeMatch) return codeMatch[1].toUpperCase()
  const symMatch = fullText.match(CURRENCY_SYMBOL_RE)
  if (symMatch) return CURRENCY_NAMES[symMatch[1]] || symMatch[1]
  return null
}

function findInvoiceNumber(text) {
  const patterns = [
    /(?:invoice|inv)[\s.]*(?:number|num|no|#)?[\s.:#]*([A-Z0-9][A-Z0-9\-_/.]{1,24})/i,
    /(?:bill|receipt)[\s.]*(?:number|no|#)?[\s.:#]*([A-Z0-9][A-Z0-9\-_/.]{1,24})/i,
    /(?:^|\s)#\s*([A-Z0-9][A-Z0-9\-_/.]{2,24})\b/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m && m[1]) {
      const cand = m[1].trim().replace(/[.,]+$/, '')
      if (cand.length >= 2 && cand.length <= 28 && /[A-Z0-9]/i.test(cand)) return cand
    }
  }
  return null
}

function findLabeledAmount(lines, labels) {
  const labelAlt = labels.map((l) => l.replace(/\s+/g, '\\s+')).join('|')
  const labelRe = new RegExp(`\\b(?:${labelAlt})\\b`, 'i')

  /* Search from the BOTTOM up — totals, tax, and the like sit near the end of
     an invoice, while the same words can appear earlier (e.g. "Total" in a
     table header row, "Tax" inside "Tax Invoice" title). */
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    const text = line.text
    if (!text) continue
    /* Long lines tend to be sentences ("Tax invoice for services rendered…")
       rather than label-value pairs. Cap at 80 chars to keep this targeted. */
    if (text.length > 80) continue
    if (!labelRe.test(text)) continue

    const trailing = trailingAmount(text)
    if (trailing) return { value: trailing.value, raw: trailing.raw, lineIndex: i }

    /* Sometimes the label is on one line and the amount on the next. */
    if (i + 1 < lines.length) {
      const next = lines[i + 1]
      if (next.text && next.text.length < 30) {
        const ta = trailingAmount(next.text)
        if (ta) return { value: ta.value, raw: ta.raw, lineIndex: i + 1 }
      }
    }
  }
  return null
}

function findTableBounds(lines, totalLineIndex) {
  let headerIndex = -1
  const limit = totalLineIndex >= 0 ? totalLineIndex : lines.length
  for (let i = 0; i < limit; i++) {
    const lower = lines[i].text.toLowerCase()
    const hits = HEADER_KEYWORDS.filter((kw) => lower.includes(kw)).length
    if (hits >= 2) { headerIndex = i; break }
  }
  return { headerIndex, totalIndex: totalLineIndex }
}

const SKIP_RE = /^(subtotal|sub[\s-]*total|total|tax|vat|gst|amount\s*due|balance|discount|shipping|freight|page|continued|delivery)/i

function extractLineItems(lines, headerIndex, totalIndex) {
  const start = headerIndex >= 0 ? headerIndex + 1 : 0
  const end = totalIndex >= 0 ? totalIndex : lines.length
  const out = []

  for (let i = start; i < end; i++) {
    const line = lines[i]
    const text = line.text
    if (!text || text.length < 3) continue
    if (SKIP_RE.test(text)) continue

    const ta = trailingAmount(text)
    if (!ta) continue

    const description = text.slice(0, ta.startIdx).trim().replace(/\s+/g, ' ')
    if (!description || description.length < 2) continue

    const tokens = description.split(/\s+/)
    let qty = null, unit = null, cleanDesc = description

    const trailingNums = []
    while (tokens.length && /^[\$€£¥₹₽]?\d[\d,.\s]*$/.test(tokens[tokens.length - 1])) {
      trailingNums.unshift(tokens.pop())
    }

    if (trailingNums.length >= 2) {
      unit = parseAmount(trailingNums[trailingNums.length - 1])
      qty = parseAmount(trailingNums[trailingNums.length - 2])
      cleanDesc = tokens.join(' ').trim()
    } else if (trailingNums.length === 1) {
      unit = parseAmount(trailingNums[0])
      cleanDesc = tokens.join(' ').trim()
    }

    out.push({
      description: cleanDesc || description,
      quantity: qty,
      unitPrice: unit,
      total: ta.value,
      raw: text,
    })
  }

  return out
}

/** Fallback when structured extraction misses everything: return ALL lines that
 *  end with a number, as candidate rows. The user can clean these up manually. */
function fallbackLineItems(lines, alreadyFound) {
  if (alreadyFound.length > 0) return alreadyFound
  const out = []
  for (const line of lines) {
    const text = line.text
    if (!text || text.length < 4) continue
    if (SKIP_RE.test(text)) continue
    const ta = trailingAmount(text)
    if (!ta) continue
    const desc = text.slice(0, ta.startIdx).trim().replace(/\s+/g, ' ')
    if (!desc || desc.length < 2) continue
    out.push({ description: desc, quantity: null, unitPrice: null, total: ta.value, raw: text })
  }
  return out
}

function findVendor(lines) {
  const page1 = lines.filter((l) => l.page === 1).slice(0, 10)
  const filtered = page1.filter((l) =>
    !/(invoice|tax invoice|bill|receipt|date|due)\b/i.test(l.text) &&
    l.text.length > 2 && l.text.length < 120,
  )
  if (!filtered.length) return null
  return filtered.slice(0, 3).map((l) => l.text).join(' · ')
}

function findBuyer(lines) {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].text.toLowerCase()
    if (/(bill\s*to|invoice\s*to|sold\s*to|customer|ship\s*to|to\s*:)/.test(lower)) {
      const next = lines.slice(i + 1, i + 4)
        .filter((l) => l.text && !/(date|invoice|bill|receipt|number|#|due|order)/i.test(l.text))
      if (!next.length) {
        const inline = lines[i].text.split(/(?:bill|invoice|sold|ship)\s*to\s*[:\-]?/i)[1]
        return inline ? inline.trim() : null
      }
      return next.map((l) => l.text).join(' · ')
    }
  }
  return null
}

function scoreConfidence(parsed, lineItems) {
  let score = 0, max = 0
  const fields = ['invoiceNumber', 'issueDate', 'currency', 'total', 'vendor']
  for (const f of fields) { max += 15; if (parsed[f]) score += 15 }
  max += 25
  if (lineItems.length > 0) score += Math.min(25, lineItems.length * 5)
  return Math.round((score / max) * 100)
}

/* ---------- Main parser ---------- */

export function parseInvoice(items, fileName = null) {
  const lines = groupIntoLines(items)
  const fullText = lines.map((l) => l.text).join('\n')

  const total = findLabeledAmount(lines, TOTAL_LABELS)
  const subtotal = findLabeledAmount(lines, SUBTOTAL_LABELS)
  const tax = findLabeledAmount(lines, TAX_LABELS)
  const discount = findLabeledAmount(lines, DISCOUNT_LABELS)
  const shipping = findLabeledAmount(lines, SHIPPING_LABELS)

  const totalIndex = total ? total.lineIndex : -1
  const { headerIndex } = findTableBounds(lines, totalIndex)

  let lineItems = extractLineItems(lines, headerIndex, totalIndex)
  lineItems = fallbackLineItems(lines, lineItems)

  let issueDate = null, dueDate = null
  for (const line of lines) {
    const lower = line.text.toLowerCase()
    const date = findDate(line.text)
    if (!date) continue
    if (!dueDate && /(due|payable)/.test(lower)) { dueDate = date; continue }
    if (!issueDate && /(date|issued|invoice)/.test(lower)) issueDate = date
    if (!issueDate) issueDate = date
  }

  const invoiceNumber = findInvoiceNumber(fullText)
  const currency = detectCurrency(items)
  const vendor = findVendor(lines)
  const buyer = findBuyer(lines)

  const parsed = {
    fileName,
    invoiceNumber,
    issueDate,
    dueDate,
    currency,
    vendor,
    buyer,
    subtotal: subtotal?.value ?? null,
    tax: tax?.value ?? null,
    discount: discount?.value ?? null,
    shipping: shipping?.value ?? null,
    total: total?.value ?? null,
    lineItems,
    rawText: fullText,
  }

  parsed.confidence = scoreConfidence(parsed, lineItems)
  return parsed
}
