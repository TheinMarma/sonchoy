/* ------------------------------------------------------------------ */
/*  Tax-invoice format helpers — extends the regular invoice helpers   */
/* ------------------------------------------------------------------ */

import {
  CURRENCIES, PAYMENT_TERMS, findCurrency,
  formatMoney, formatNumber, formatDate,
  addDays, todayISO,
} from '../invoice/format'

export { CURRENCIES, PAYMENT_TERMS, findCurrency, formatMoney, formatNumber, formatDate, addDays, todayISO }

/* ----- Tax regimes ----- */

export const TAX_REGIMES = [
  {
    id: 'gst-in',
    label: 'GST (India)',
    taxIdLabel: 'GSTIN',
    taxIdPlaceholder: '29ABCDE1234F1Z5',
    rates: [0, 5, 12, 18, 28],
    needsPlaceOfSupply: true,
    needsHsn: true,
    hsnLabel: 'HSN/SAC',
    splitName: ['CGST', 'SGST'],   // intra-state
    soleName: 'IGST',              // inter-state
  },
  {
    id: 'vat-eu',
    label: 'VAT (EU / UK)',
    taxIdLabel: 'VAT number',
    taxIdPlaceholder: 'GB123456789',
    rates: [0, 5, 10, 20, 23],
    needsPlaceOfSupply: false,
    needsHsn: false,
    hsnLabel: 'Code',
    splitName: null,
    soleName: 'VAT',
  },
  {
    id: 'sales-us',
    label: 'Sales Tax (US / CA)',
    taxIdLabel: 'EIN / Tax ID',
    taxIdPlaceholder: '12-3456789',
    rates: [0, 4, 6, 7.25, 8.875, 10],
    needsPlaceOfSupply: false,
    needsHsn: false,
    hsnLabel: 'SKU',
    splitName: null,
    soleName: 'Sales tax',
  },
]

export const PLACES_OF_SUPPLY = [
  { id: 'intra', label: 'Same state (CGST + SGST)' },
  { id: 'inter', label: 'Different state (IGST)' },
]

export function findRegime(id) {
  return TAX_REGIMES.find((r) => r.id === id) || TAX_REGIMES[0]
}

/** "TAX-INV-2026-0042" — auto-numbered with current year */
export function nextTaxInvoiceNumber(prev) {
  const year = new Date().getFullYear()
  const m = String(prev || '').match(/(\d+)\s*$/)
  const next = m ? String(Number(m[1]) + 1).padStart(4, '0') : '0001'
  return `TAX-INV-${year}-${next}`
}

/** Per-line numerics — taxable value + tax breakdown */
export function computeLine(item, regime, place) {
  const qty  = Number(item.qty)  || 0
  const rate = Number(item.rate) || 0
  const taxR = Number(item.taxRate) || 0
  const taxable = qty * rate
  const tax = taxable * taxR / 100

  let cgst = 0, sgst = 0, igst = 0, vat = 0, sales = 0
  if (regime.id === 'gst-in') {
    if (place === 'inter') {
      igst = tax
    } else {
      cgst = tax / 2
      sgst = tax / 2
    }
  } else if (regime.id === 'vat-eu') {
    vat = tax
  } else {
    sales = tax
  }

  return {
    taxable: round2(taxable),
    tax: round2(tax),
    total: round2(taxable + tax),
    cgst: round2(cgst), sgst: round2(sgst), igst: round2(igst),
    vat: round2(vat), sales: round2(sales),
  }
}

/** Document-level totals */
export function computeTotals(items, regime, place) {
  let subtotal = 0, totalTax = 0
  let cgst = 0, sgst = 0, igst = 0, vat = 0, sales = 0

  // Grouped breakdown by rate (e.g. 5% → {taxable, tax}; 18% → ...)
  const byRate = new Map()

  for (const it of items) {
    const ln = computeLine(it, regime, place)
    subtotal += ln.taxable
    totalTax += ln.tax
    cgst += ln.cgst; sgst += ln.sgst; igst += ln.igst
    vat  += ln.vat;  sales += ln.sales

    const r = Number(it.taxRate) || 0
    const bucket = byRate.get(r) || { taxable: 0, tax: 0 }
    bucket.taxable += ln.taxable
    bucket.tax     += ln.tax
    byRate.set(r, bucket)
  }

  return {
    subtotal: round2(subtotal),
    totalTax: round2(totalTax),
    grandTotal: round2(subtotal + totalTax),
    cgst: round2(cgst), sgst: round2(sgst), igst: round2(igst),
    vat: round2(vat),   sales: round2(sales),
    byRate: Array.from(byRate.entries())
      .map(([rate, v]) => ({ rate, taxable: round2(v.taxable), tax: round2(v.tax) }))
      .sort((a, b) => a.rate - b.rate),
  }
}

/** Convert a number to words for the "Amount in words" footer (English, simple). */
export function amountInWords(num, currency = 'USD') {
  const n = Number(num) || 0
  if (n === 0) return 'Zero'
  const whole = Math.floor(Math.abs(n))
  const cents = Math.round((Math.abs(n) - whole) * 100)
  const cur = findCurrency(currency)
  const main = numToWords(whole)
  const minor = cents > 0 ? ` and ${numToWords(cents)} cents` : ''
  return `${capitalize(main)} ${currencyWord(cur.code)}${minor} only`
}

/* ---- private utils ---- */

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s }

function currencyWord(code) {
  const map = { USD: 'US dollars', EUR: 'euros', GBP: 'pounds sterling', INR: 'rupees', AUD: 'Australian dollars', CAD: 'Canadian dollars', SGD: 'Singapore dollars', JPY: 'yen' }
  return map[code] || code
}

const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen']
const TENS = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']

function numToWords(n) {
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '')
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '')
  if (n < 1_000_000) return numToWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '')
  if (n < 1_000_000_000) return numToWords(Math.floor(n / 1_000_000)) + ' million' + (n % 1_000_000 ? ' ' + numToWords(n % 1_000_000) : '')
  return numToWords(Math.floor(n / 1_000_000_000)) + ' billion' + (n % 1_000_000_000 ? ' ' + numToWords(n % 1_000_000_000) : '')
}
