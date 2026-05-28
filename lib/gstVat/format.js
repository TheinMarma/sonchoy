/* ------------------------------------------------------------------ */
/*  GST / VAT invoice format helpers                                   */
/*  A focused alternative to the multi-regime Tax Invoice Generator    */
/*  — GST (India), VAT (EU / UK / UAE / Saudi), with reverse-charge.   */
/* ------------------------------------------------------------------ */

import {
  CURRENCIES, PAYMENT_TERMS, findCurrency,
  formatMoney, formatNumber, formatDate,
  addDays, todayISO,
} from '../invoice/format'

import { computeLine, computeTotals, amountInWords } from '../taxInvoice/format'

export {
  CURRENCIES, PAYMENT_TERMS, findCurrency,
  formatMoney, formatNumber, formatDate,
  addDays, todayISO,
  computeLine, computeTotals, amountInWords,
}

/* ----- GST / VAT regimes (narrower than the multi-regime tool) ----- */

export const GST_VAT_REGIMES = [
  {
    id: 'gst-in',
    label: 'GST (India)',
    docHeader: 'GST INVOICE',
    taxIdLabel: 'GSTIN',
    taxIdPlaceholder: '29ABCDE1234F1Z5',
    rates: [0, 5, 12, 18, 28],
    needsPlaceOfSupply: true,
    needsHsn: true,
    hsnLabel: 'HSN/SAC',
    splitName: ['CGST', 'SGST'],
    soleName: 'IGST',
    reverseChargeNote: 'Recipient liable to pay GST under reverse charge.',
    defaultCurrency: 'INR',
  },
  {
    id: 'vat-eu',
    label: 'VAT (EU)',
    docHeader: 'VAT INVOICE',
    taxIdLabel: 'VAT number',
    taxIdPlaceholder: 'DE123456789',
    rates: [0, 7, 10, 19, 21, 23],
    needsPlaceOfSupply: false,
    needsHsn: false,
    hsnLabel: 'Code',
    splitName: null,
    soleName: 'VAT',
    reverseChargeNote: 'Reverse charge — Article 196, Directive 2006/112/EC.',
    defaultCurrency: 'EUR',
  },
  {
    id: 'vat-uk',
    label: 'VAT (UK)',
    docHeader: 'VAT INVOICE',
    taxIdLabel: 'VAT registration no.',
    taxIdPlaceholder: 'GB 123 4567 89',
    rates: [0, 5, 20],
    needsPlaceOfSupply: false,
    needsHsn: false,
    hsnLabel: 'Code',
    splitName: null,
    soleName: 'VAT',
    reverseChargeNote: 'Reverse charge: customer to account for VAT to HMRC.',
    defaultCurrency: 'GBP',
  },
  {
    id: 'vat-uae',
    label: 'VAT (UAE)',
    docHeader: 'TAX INVOICE',
    taxIdLabel: 'TRN',
    taxIdPlaceholder: '100123456700003',
    rates: [0, 5],
    needsPlaceOfSupply: false,
    needsHsn: false,
    hsnLabel: 'Code',
    splitName: null,
    soleName: 'VAT',
    reverseChargeNote: 'Reverse charge mechanism applies (FTA Article 48).',
    defaultCurrency: 'AED',
  },
  {
    id: 'vat-sa',
    label: 'VAT (Saudi Arabia)',
    docHeader: 'TAX INVOICE',
    taxIdLabel: 'VAT number',
    taxIdPlaceholder: '310123456700003',
    rates: [0, 15],
    needsPlaceOfSupply: false,
    needsHsn: false,
    hsnLabel: 'Code',
    splitName: null,
    soleName: 'VAT',
    reverseChargeNote: 'Reverse charge applies under ZATCA regulations.',
    defaultCurrency: 'SAR',
  },
]

export const PLACES_OF_SUPPLY = [
  { id: 'intra', label: 'Same state (CGST + SGST)' },
  { id: 'inter', label: 'Different state (IGST)' },
]

export function findRegime(id) {
  return GST_VAT_REGIMES.find((r) => r.id === id) || GST_VAT_REGIMES[0]
}

/** "GST-INV-2026-0042" or "VAT-INV-2026-0042" depending on regime */
export function nextGstVatNumber(prev, regimeId = 'gst-in') {
  const prefix = regimeId === 'gst-in' ? 'GST' : 'VAT'
  const year = new Date().getFullYear()
  const m = String(prev || '').match(/(\d+)\s*$/)
  const next = m ? String(Number(m[1]) + 1).padStart(4, '0') : '0001'
  return `${prefix}-INV-${year}-${next}`
}
