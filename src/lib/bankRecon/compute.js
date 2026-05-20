/* ------------------------------------------------------------------ */
/*  Bank Reconciliation — computation helpers                          */
/*                                                                      */
/*  Two-column reconciliation:                                         */
/*    Bank side: Statement bal + DIT − Outstanding ± Bank adj.         */
/*    Book side: Book bal + Interest − Charges − NSF ± Book adj.       */
/*  Both should equal → reconciled.                                    */
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

/* ------------------------------------------------------------------ */

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }
function sum(arr, key = 'amount') {
  if (!Array.isArray(arr)) return 0
  return arr.reduce((s, it) => s + (Number(it?.[key]) || 0), 0)
}

/** Full reconciliation calculation */
export function computeRecon(data) {
  const statementBalance = round2(Number(data.statementBalance) || 0)
  const bookBalance      = round2(Number(data.bookBalance) || 0)

  const totalDIT          = round2(sum(data.depositsInTransit))
  const totalOutstanding  = round2(sum(data.outstandingChecks))
  const totalBankAdj      = round2(sum(data.bankAdjustments))

  const totalInterest     = round2(sum(data.interestEarned))
  const totalCharges      = round2(sum(data.bankCharges))
  const totalNSF          = round2(sum(data.nsfChecks))
  const totalBookAdj      = round2(sum(data.bookAdjustments))

  // Bank side: add DIT, subtract outstanding, +/- bank adjustments
  const adjustedBankBalance = round2(
    statementBalance + totalDIT - totalOutstanding + totalBankAdj
  )

  // Book side: add interest, subtract charges and NSF, +/- book adjustments
  const adjustedBookBalance = round2(
    bookBalance + totalInterest - totalCharges - totalNSF + totalBookAdj
  )

  const difference = round2(adjustedBankBalance - adjustedBookBalance)
  const isReconciled = Math.abs(difference) < 0.01

  return {
    statementBalance,
    bookBalance,
    totalDIT,
    totalOutstanding,
    totalBankAdj,
    totalInterest,
    totalCharges,
    totalNSF,
    totalBookAdj,
    adjustedBankBalance,
    adjustedBookBalance,
    difference,
    isReconciled,
    // Item counts for summary
    countDIT: (data.depositsInTransit || []).length,
    countOutstanding: (data.outstandingChecks || []).length,
    countInterest: (data.interestEarned || []).length,
    countCharges: (data.bankCharges || []).length,
    countNSF: (data.nsfChecks || []).length,
  }
}

export function asOfLabel(data) {
  if (data.periodLabel) return data.periodLabel
  if (data.asOfDate) {
    const d = new Date(data.asOfDate)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    }
  }
  return ''
}
