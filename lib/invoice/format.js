/* ------------------------------------------------------------------ */
/*  Shared formatting helpers for the Invoice Generator                */
/* ------------------------------------------------------------------ */

export const CURRENCIES = [
  { code: 'USD', symbol: '$',   locale: 'en-US' },
  { code: 'EUR', symbol: '€',   locale: 'en-IE' },
  { code: 'GBP', symbol: '£',   locale: 'en-GB' },
  { code: 'INR', symbol: '₹',   locale: 'en-IN' },
  { code: 'AUD', symbol: 'A$',  locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$',  locale: 'en-CA' },
  { code: 'SGD', symbol: 'S$',  locale: 'en-SG' },
  { code: 'JPY', symbol: '¥',   locale: 'ja-JP' },
]

export const TAX_PRESETS = [
  { id: 'vat-20', label: 'VAT 20%',     rate: 20, code: 'VAT' },
  { id: 'vat-5',  label: 'VAT 5%',      rate: 5,  code: 'VAT' },
  { id: 'gst-18', label: 'GST 18%',     rate: 18, code: 'GST' },
  { id: 'gst-5',  label: 'GST 5%',      rate: 5,  code: 'GST' },
  { id: 'sales-7', label: 'Sales 7.25%', rate: 7.25, code: 'Sales' },
  { id: 'none',   label: 'No tax',      rate: 0,  code: '' },
]

export const PAYMENT_TERMS = [
  { id: 'net-7',     label: 'Net 7',     days: 7  },
  { id: 'net-14',    label: 'Net 14',    days: 14 },
  { id: 'net-30',    label: 'Net 30',    days: 30 },
  { id: 'on-receipt', label: 'On receipt', days: 0 },
]

export function findCurrency(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0]
}

export function formatMoney(amount, currencyCode) {
  const c = findCurrency(currencyCode)
  const value = Number.isFinite(amount) ? amount : 0
  try {
    return new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: c.code,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${c.symbol}${value.toFixed(2)}`
  }
}

/** Plain-number money (no currency symbol) — for table cells */
export function formatNumber(amount) {
  const value = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** ISO YYYY-MM-DD shifted by N days from a base ISO date */
export function addDays(iso, days) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Compute totals from raw line items */
export function computeTotals(items, taxRate) {
  const subtotal = items.reduce((sum, it) => {
    const qty  = Number(it.qty)  || 0
    const rate = Number(it.rate) || 0
    return sum + qty * rate
  }, 0)
  const tax = subtotal * (Number(taxRate) || 0) / 100
  const total = subtotal + tax
  return { subtotal, tax, total }
}

export function lineAmount(item) {
  const qty  = Number(item.qty)  || 0
  const rate = Number(item.rate) || 0
  return qty * rate
}

/** "INV-2026-0042" — auto-numbered with current year */
export function nextInvoiceNumber(prevNumber) {
  const year = new Date().getFullYear()
  const m = String(prevNumber || '').match(/(\d+)\s*$/)
  const next = m ? String(Number(m[1]) + 1).padStart(4, '0') : '0001'
  return `INV-${year}-${next}`
}
