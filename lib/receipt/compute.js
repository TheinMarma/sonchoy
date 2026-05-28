/* ------------------------------------------------------------------ */
/*  Receipt Generator — payment acknowledgement receipts                */
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

export const PAYMENT_METHODS = [
  { id: 'bank',     label: 'Bank transfer'      },
  { id: 'upi',      label: 'UPI / wallet'       },
  { id: 'card',     label: 'Credit / debit card' },
  { id: 'cash',     label: 'Cash'               },
  { id: 'cheque',   label: 'Cheque'             },
  { id: 'paypal',   label: 'PayPal'             },
  { id: 'stripe',   label: 'Stripe'             },
  { id: 'crypto',   label: 'Cryptocurrency'     },
  { id: 'other',    label: 'Other'              },
]

export const RECEIPT_TYPES = [
  { id: 'payment',    label: 'Payment receipt'      },
  { id: 'rent',       label: 'Rent receipt'         },
  { id: 'donation',   label: 'Donation receipt'     },
  { id: 'deposit',    label: 'Security / deposit'   },
  { id: 'advance',    label: 'Advance payment'      },
  { id: 'refund',     label: 'Refund receipt'       },
  { id: 'other',      label: 'Other'                },
]

/* ---- Helpers ---- */

export function findPaymentMethod(id) { return PAYMENT_METHODS.find((m) => m.id === id) || PAYMENT_METHODS[0] }
export function findReceiptType(id) { return RECEIPT_TYPES.find((t) => t.id === id) || RECEIPT_TYPES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Compute totals for a receipt.
 * If `includeTax` and tax %, computes tax on the receipt amount.
 * If `outstandingBefore` is set, computes remaining balance after this payment.
 */
export function computeReceipt(data) {
  const amount = round2(Math.max(0, Number(data.amountReceived) || 0))
  const taxRate = Math.max(0, Number(data.taxRatePct) || 0)
  const tax = data.includeTax ? round2(amount * taxRate / 100) : 0
  const totalReceived = round2(amount + tax)

  const outstandingBefore = round2(Math.max(0, Number(data.outstandingBefore) || 0))
  const outstandingAfter = round2(Math.max(0, outstandingBefore - amount))

  return {
    amount,
    tax,
    totalReceived,
    outstandingBefore,
    outstandingAfter,
    fullySettled: outstandingBefore > 0 && outstandingAfter <= 0.005,
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + main amount
  if (data.includeOutstanding && Number(data.outstandingBefore) > 0) n++
  if (data.includeTax && Number(data.taxRatePct) > 0) n++
  if (data.includePaymentDetails) n++
  if (data.includeSignature) n++
  if (data.notes) n++
  return n
}
