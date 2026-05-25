/* ------------------------------------------------------------------ */
/*  OCR Invoice to Excel — invoice-specific field detector + workbook    */
/*  builder. Shares the Tesseract loader from the OCR-receipt module.   */
/* ------------------------------------------------------------------ */

import * as XLSX from 'xlsx'

export const LANGUAGES = [
  { id: 'eng',         label: 'English' },
  { id: 'eng+fra',     label: 'English + French' },
  { id: 'eng+deu',     label: 'English + German' },
  { id: 'eng+spa',     label: 'English + Spanish' },
  { id: 'eng+hin',     label: 'English + Hindi' },
  { id: 'eng+por',     label: 'English + Portuguese' },
  { id: 'eng+jpn',     label: 'English + Japanese' },
  { id: 'eng+chi_sim', label: 'English + Simplified Chinese' },
  { id: 'eng+ara',     label: 'English + Arabic' },
]

export function findLanguage(id) { return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / (1024 * 1024)).toFixed(2)} MB`
}

/* ---- Invoice-field detector ----------------------------------------
 * The patterns below try common invoice layouts globally. Best-effort:
 * surfaces the most-likely candidates, not the authoritative answer.    */

const INVOICE_NUM_RXS = [
  /\b(?:invoice|inv\.?|bill)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9-/_]{3,24})/i,
  /\b(?:invoice|inv)\s*#\s*([A-Z0-9][A-Z0-9-/_]{3,24})/i,
]
const PO_RX = /\b(?:po\.?|purchase\s*order)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9-/_]{3,24})/i

const DATE_RXS = [
  /(?:date|dated|issued|invoice\s*date)[\s:]+(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
  /(?:date|dated|issued|invoice\s*date)[\s:]+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
  /(?:date|dated|issued|invoice\s*date)[\s:]+(\d{2,4}[\s./-]\d{1,2}[\s./-]\d{1,2})/i,
]
const DUE_RXS = [
  /(?:due|payment\s*due|due\s*date)[\s:]+(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
  /(?:due|payment\s*due|due\s*date)[\s:]+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
]
const GENERIC_DATE_RX = /\b(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}|\d{4}[\s./-]\d{1,2}[\s./-]\d{1,2})\b/gi

const CURRENCY_PREFIX_RX = /(?:₹|INR|\$|USD|€|EUR|£|GBP|¥|JPY|AUD|CAD)/i
const AMOUNT_RX = /(₹|INR|\$|USD|€|EUR|£|GBP|¥|JPY|AUD|CAD)\s?([0-9][\d,]*\.?\d{0,2})/g
const TOTAL_LINE_RX = /(?:grand\s*total|total\s*due|total\s*amount|net\s*payable|amount\s*due|balance\s*due|total)[^\n]{0,40}/gi

const TAX_ID_PATTERNS = [
  { kind: 'GST',  rx: /\b(?:GSTIN|GST\s*No)\.?\s*[:\-]?\s*([0-9A-Z]{15})/i },
  { kind: 'VAT',  rx: /\b(?:VAT\s*(?:No|Number|ID|Reg(?:istration)?))\.?\s*[:\-]?\s*([A-Z0-9 ]{8,18})/i },
  { kind: 'EIN',  rx: /\b(?:EIN|FEIN)\.?\s*[:\-]?\s*(\d{2}-\d{7})/i },
  { kind: 'TIN',  rx: /\b(?:TIN|Tax\s*ID)\.?\s*[:\-]?\s*([A-Z0-9-]{6,18})/i,  },
  { kind: 'PAN',  rx: /\b(?:PAN)\.?\s*[:\-]?\s*([A-Z]{5}\d{4}[A-Z])/i },
]

const EMAIL_RX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_RX = /\+?\d[\d\s().-]{7,17}\d/

/** Parse a numeric value from a regex-matched amount string. Returns NaN on failure. */
function parseAmount(numericLike) {
  if (!numericLike) return NaN
  const cleaned = String(numericLike).replace(/,/g, '').replace(/[^\d.-]/g, '')
  return parseFloat(cleaned)
}

/** Detect every currency-prefixed amount in the OCR text and rank likely candidates. */
function collectAmounts(text) {
  AMOUNT_RX.lastIndex = 0
  const out = []
  let m
  while ((m = AMOUNT_RX.exec(text))) {
    const v = parseAmount(m[2])
    if (Number.isFinite(v)) {
      out.push({ currency: m[1], value: v, raw: `${m[1]} ${m[2]}`, index: m.index })
    }
  }
  return out
}

/** Returns the line containing the first match for any "total"-ish phrase, plus the amount on that line. */
function detectTotalLine(text) {
  TOTAL_LINE_RX.lastIndex = 0
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    if (/grand\s*total|total\s*due|net\s*payable|amount\s*due|balance\s*due/i.test(line)) {
      const m = line.match(AMOUNT_RX)
      if (m && m.length) {
        const last = m[m.length - 1]
        const parsed = last.match(/(₹|INR|\$|USD|€|EUR|£|GBP|¥|JPY|AUD|CAD)\s?([0-9][\d,]*\.?\d{0,2})/i)
        if (parsed) {
          return { raw: last.trim(), currency: parsed[1], value: parseAmount(parsed[2]), line: line.trim() }
        }
      }
    }
  }
  return null
}

/** First non-empty non-numeric line — best-effort vendor guess. */
function detectVendor(text) {
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  for (const line of lines.slice(0, 6)) {
    if (line.length < 3 || line.length > 60) continue
    if (/^[\d\s\-,/.]+$/.test(line))     continue
    if (CURRENCY_PREFIX_RX.test(line))   continue
    return line
  }
  return ''
}

/** Buyer / bill-to — line right after the literal "bill to" / "buyer" / "customer". */
function detectBuyer(text) {
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    if (/\b(?:bill\s*to|invoice\s*to|buyer|customer|sold\s*to)\b/i.test(lines[i])) {
      const candidate = (lines[i + 1] || '').trim()
      if (candidate && candidate.length >= 3 && candidate.length <= 80) return candidate
    }
  }
  return ''
}

export function detectInvoiceFields(text) {
  if (!text) return null

  const result = {
    invoiceNumber: '',
    poNumber: '',
    issueDate: '',
    dueDate: '',
    otherDates: [],
    vendor: '',
    buyer: '',
    taxId: { kind: '', value: '' },
    contact: { email: '', phone: '' },
    subtotal: null,
    tax: null,
    total: null,
    currency: '',
    candidateAmounts: [],
  }

  // Invoice number
  for (const rx of INVOICE_NUM_RXS) {
    const m = text.match(rx)
    if (m && m[1]) { result.invoiceNumber = m[1]; break }
  }

  // PO number
  const poMatch = text.match(PO_RX)
  if (poMatch) result.poNumber = poMatch[1]

  // Dates
  for (const rx of DATE_RXS) {
    const m = text.match(rx)
    if (m) { result.issueDate = m[1]; break }
  }
  for (const rx of DUE_RXS) {
    const m = text.match(rx)
    if (m) { result.dueDate = m[1]; break }
  }
  // Other dates not already pinned
  GENERIC_DATE_RX.lastIndex = 0
  let gm
  while ((gm = GENERIC_DATE_RX.exec(text))) {
    const d = gm[0]
    if (d === result.issueDate || d === result.dueDate) continue
    if (!result.otherDates.includes(d) && result.otherDates.length < 4) result.otherDates.push(d)
  }

  // Vendor + buyer
  result.vendor = detectVendor(text)
  result.buyer  = detectBuyer(text)

  // Tax ID
  for (const p of TAX_ID_PATTERNS) {
    const m = text.match(p.rx)
    if (m) { result.taxId = { kind: p.kind, value: m[1].trim() }; break }
  }

  // Contact
  const em = text.match(EMAIL_RX); if (em) result.contact.email = em[0]
  const ph = text.match(PHONE_RX); if (ph) result.contact.phone = ph[0].trim()

  // Amounts
  const amounts = collectAmounts(text)
  result.candidateAmounts = amounts
  if (amounts.length) result.currency = amounts[0].currency

  // Subtotal / tax / total — look for explicit labels first
  const subMatch = text.match(/subtotal[^\n]*?(₹|INR|\$|USD|€|EUR|£|GBP|¥|JPY)\s?([0-9][\d,]*\.?\d{0,2})/i)
  if (subMatch) result.subtotal = { currency: subMatch[1], value: parseAmount(subMatch[2]) }

  const taxMatch = text.match(/(?:tax|vat|gst|hst)[^\n]*?(₹|INR|\$|USD|€|EUR|£|GBP|¥|JPY)\s?([0-9][\d,]*\.?\d{0,2})/i)
  if (taxMatch) result.tax = { currency: taxMatch[1], value: parseAmount(taxMatch[2]) }

  const totalLine = detectTotalLine(text)
  if (totalLine && Number.isFinite(totalLine.value)) {
    result.total = { currency: totalLine.currency, value: totalLine.value, line: totalLine.line }
  } else if (amounts.length) {
    // Fallback: largest detected amount is usually the total
    const largest = [...amounts].sort((a, b) => b.value - a.value)[0]
    if (largest) result.total = { currency: largest.currency, value: largest.value, line: `(largest amount)` }
  }

  return result
}

/* ---- Confidence heuristic ---- */

/** A coarse 0–100 confidence based on how many key fields were populated. */
export function fieldsConfidence(fields, ocrConfidence) {
  if (!fields) return 0
  const checks = [
    !!fields.invoiceNumber,
    !!fields.issueDate,
    !!fields.vendor,
    !!fields.total,
    !!fields.taxId.value,
  ]
  const filled = checks.filter(Boolean).length
  const fieldScore = (filled / checks.length) * 60
  const ocrScore = (Math.max(0, Math.min(100, Number(ocrConfidence) || 0))) * 0.4
  return Math.round(fieldScore + ocrScore)
}

/* ---- XLSX builder -------------------------------------------------- */

/**
 * Build a multi-sheet workbook containing:
 *   - Summary: header fields (invoice #, dates, vendor, buyer, totals)
 *   - Amounts: all currency-prefixed amounts detected, with indices
 *   - Raw text: the full OCR output for audit
 */
export function buildInvoiceWorkbook(fields, rawText, fileName) {
  const wb = XLSX.utils.book_new()

  /* Summary sheet */
  const summary = [
    ['OCR Invoice Extraction'],
    [],
    ['Source image', fileName || ''],
    ['Extracted at', new Date().toISOString()],
    [],
    ['Invoice number',  fields?.invoiceNumber || ''],
    ['PO number',       fields?.poNumber || ''],
    ['Issue date',      fields?.issueDate || ''],
    ['Due date',        fields?.dueDate || ''],
    ['Other dates',     (fields?.otherDates || []).join(', ')],
    [],
    ['Vendor',          fields?.vendor || ''],
    ['Buyer',           fields?.buyer || ''],
    ['Tax ID kind',     fields?.taxId?.kind || ''],
    ['Tax ID',          fields?.taxId?.value || ''],
    ['Email',           fields?.contact?.email || ''],
    ['Phone',           fields?.contact?.phone || ''],
    [],
    ['Currency',        fields?.currency || ''],
    ['Subtotal',        fields?.subtotal?.value ?? '', fields?.subtotal?.currency || ''],
    ['Tax',             fields?.tax?.value ?? '',     fields?.tax?.currency || ''],
    ['Total',           fields?.total?.value ?? '',   fields?.total?.currency || ''],
    [],
    ['Total source line', fields?.total?.line || ''],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 8 }]
  // Make detected numerics actual number cells
  for (const r of [19, 20, 21]) {
    const cell = wsSummary[XLSX.utils.encode_cell({ r, c: 1 })]
    if (cell && typeof cell.v === 'number') { cell.t = 'n' }
  }
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Candidate amounts */
  if (fields?.candidateAmounts?.length) {
    const rows = [
      ['#', 'Currency', 'Value', 'Raw match', 'Position in text'],
      ...fields.candidateAmounts.map((a, i) => [i + 1, a.currency, a.value, a.raw, a.index]),
    ]
    const wsAmts = XLSX.utils.aoa_to_sheet(rows)
    wsAmts['!cols'] = [{ wch: 4 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsAmts, 'Amounts')
  }

  /* Raw OCR text */
  const lines = (rawText || '').split(/\r?\n/).map((l, i) => [i + 1, l])
  const wsRaw = XLSX.utils.aoa_to_sheet([['Line', 'Text'], ...lines])
  wsRaw['!cols'] = [{ wch: 6 }, { wch: 90 }]
  XLSX.utils.book_append_sheet(wb, wsRaw, 'Raw text')

  return wb
}

export function downloadWorkbook(wb, baseName) {
  const arrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx', compression: true })
  const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const fileName = `${(baseName || 'invoice').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { blob, fileName }
}
