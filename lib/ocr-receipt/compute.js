/* ------------------------------------------------------------------ */
/*  OCR Receipt to Text — config + post-processing helpers              */
/*                                                                       */
/*  We run Tesseract.js via a dynamic CDN script load (so the heavy     */
/*  WASM stack only ships when the user actually clicks "Extract").    */
/*  The engine itself is in `ocrEngine.js`; this file holds the lang   */
/*  list, output-format options, and the receipt-field auto-detector.  */
/* ------------------------------------------------------------------ */

export const LANGUAGES = [
  { id: 'eng',      label: 'English' },
  { id: 'eng+fra',  label: 'English + French' },
  { id: 'eng+deu',  label: 'English + German' },
  { id: 'eng+spa',  label: 'English + Spanish' },
  { id: 'eng+ita',  label: 'English + Italian' },
  { id: 'eng+hin',  label: 'English + Hindi' },
  { id: 'eng+por',  label: 'English + Portuguese' },
  { id: 'eng+jpn',  label: 'English + Japanese' },
  { id: 'eng+chi_sim', label: 'English + Simplified Chinese' },
]

export const OUTPUT_FORMATS = [
  { id: 'txt',  label: 'Plain text (.txt)',     ext: 'txt',  mime: 'text/plain' },
  { id: 'md',   label: 'Markdown (.md)',         ext: 'md',   mime: 'text/markdown' },
  { id: 'json', label: 'Structured JSON (.json)', ext: 'json', mime: 'application/json' },
]

export const POST_PROCESSING = [
  { id: 'none',    label: 'No post-processing' },
  { id: 'tidy',    label: 'Tidy whitespace + drop empty lines' },
  { id: 'receipt', label: 'Receipt mode (tidy + group blank-line breaks)' },
]

export function findLanguage(id)     { return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0] }
export function findOutputFormat(id) { return OUTPUT_FORMATS.find((o) => o.id === id) || OUTPUT_FORMATS[0] }
export function findPostProcess(id)  { return POST_PROCESSING.find((p) => p.id === id) || POST_PROCESSING[1] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / (1024 * 1024)).toFixed(2)} MB`
}

/* ---- Receipt-field auto-detector ----------------------------------
 * Quick-and-pragmatic regex passes over the OCR text to surface the
 * fields most expense systems care about. Nothing fancy: enough to
 * pre-fill an expense report row, not enough to skip a human review.    */

const CURRENCY_RX = /(₹|INR|\$|USD|€|EUR|£|GBP|¥|JPY)\s?([0-9][\d,]*\.?\d{0,2})/g
const DATE_RXS = [
  /\b(\d{1,2})[\s./-](\d{1,2})[\s./-](\d{2,4})\b/g,                                 // 23/05/26 · 23-05-2026 · 23.05.26
  /\b(\d{2,4})[\s./-](\d{1,2})[\s./-](\d{1,2})\b/g,                                 // 2026-05-23
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/gi, // 23 May 2026
]

export function detectReceiptFields(text) {
  if (!text) return {}
  const result = {
    totals: [],
    dates: [],
    vendor: '',
    taxLines: [],
    paymentLast4: null,
  }

  // Currency-prefixed amounts
  const seenAmounts = new Set()
  let m
  while ((m = CURRENCY_RX.exec(text))) {
    const cur = m[1]
    const num = m[2].replace(/,/g, '')
    const v = parseFloat(num)
    if (!Number.isFinite(v)) continue
    const key = `${cur}:${v}`
    if (seenAmounts.has(key)) continue
    seenAmounts.add(key)
    result.totals.push({ currency: cur, value: v, raw: `${cur} ${m[2]}` })
  }

  // Dates
  for (const rx of DATE_RXS) {
    let dm
    while ((dm = rx.exec(text))) {
      if (!result.dates.includes(dm[0])) result.dates.push(dm[0])
    }
  }

  // Vendor (best-effort: first non-empty line that doesn't look like a date / amount)
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  for (const line of lines.slice(0, 5)) {
    if (/[0-9]/.test(line) && line.length < 30) continue   // probably address number / phone / amount
    if (line.length < 3 || line.length > 60) continue
    result.vendor = line
    break
  }

  // Tax-ish lines
  for (const line of lines) {
    if (/\b(tax|vat|gst|cgst|sgst|igst|hst)\b/i.test(line) && /\d/.test(line)) {
      result.taxLines.push(line)
    }
  }

  // Card last 4
  const cardMatch = text.match(/(?:card|ending)[^\d]{0,8}(\d{4})/i)
  if (cardMatch) result.paymentLast4 = cardMatch[1]

  return result
}

/* ---- Post-processing -------------------------------------------- */

export function postProcessText(raw, mode) {
  if (!raw) return ''
  if (mode === 'none') return raw

  // Normalise weird tesseract artifacts: trailing spaces, double-spaces, control chars
  let t = raw
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ /g, ' ')
    .replace(/[ \t]+$/gm, '')

  if (mode === 'tidy') {
    // Drop fully-empty lines
    t = t.split(/\r?\n/).filter((l) => l.trim().length > 0).join('\n')
  } else if (mode === 'receipt') {
    // Collapse runs of empty lines down to one blank line (receipts have
    // logical blocks separated by space — keep one, kill the rest)
    const lines = t.split(/\r?\n/)
    const out = []
    let blanks = 0
    for (const l of lines) {
      if (l.trim().length === 0) {
        blanks++
        if (blanks === 1) out.push('')
      } else {
        blanks = 0
        out.push(l)
      }
    }
    t = out.join('\n').trim()
  }

  return t
}

/* ---- Serialisation ------------------------------------------------ */

export function serialiseOutput(text, fields, formatId) {
  if (formatId === 'json') {
    return JSON.stringify({
      extractedText: text,
      detectedFields: fields,
      generatedBy: 'Sonchoy · OCR Receipt to Text',
      generatedAt: new Date().toISOString(),
    }, null, 2)
  }
  if (formatId === 'md') {
    const parts = ['# Receipt OCR Output', '']
    if (fields.vendor) parts.push(`**Vendor:** ${fields.vendor}`, '')
    if (fields.dates.length) parts.push(`**Detected dates:** ${fields.dates.join(', ')}`, '')
    if (fields.totals.length) {
      parts.push('**Detected amounts:**')
      for (const a of fields.totals) parts.push(`- ${a.raw}`)
      parts.push('')
    }
    if (fields.taxLines.length) {
      parts.push('**Tax lines:**')
      for (const l of fields.taxLines) parts.push(`- ${l}`)
      parts.push('')
    }
    if (fields.paymentLast4) parts.push(`**Card ending:** \`${fields.paymentLast4}\``, '')
    parts.push('## Full text', '', '```', text, '```')
    return parts.join('\n')
  }
  return text
}
