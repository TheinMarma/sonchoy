/* ------------------------------------------------------------------ */
/*  Salary Slip Generator — compliant payslip with deductions & YTD     */
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

export const PAY_FREQUENCIES = [
  { id: 'monthly',     label: 'Monthly',     periodsPerYear: 12 },
  { id: 'semi_monthly', label: 'Semi-monthly', periodsPerYear: 24 },
  { id: 'bi_weekly',   label: 'Bi-weekly',   periodsPerYear: 26 },
  { id: 'weekly',      label: 'Weekly',      periodsPerYear: 52 },
]

export const PAYMENT_MODES = [
  { id: 'bank',     label: 'Bank transfer' },
  { id: 'upi',      label: 'UPI' },
  { id: 'cheque',   label: 'Cheque' },
  { id: 'cash',     label: 'Cash' },
  { id: 'other',    label: 'Other' },
]

export const EMPLOYMENT_TYPES = [
  { id: 'full_time',  label: 'Full-time' },
  { id: 'part_time',  label: 'Part-time' },
  { id: 'contract',   label: 'Contractor' },
  { id: 'intern',     label: 'Intern' },
  { id: 'consultant', label: 'Consultant' },
]

/* ---- Helpers ---- */

export function findPayFrequency(id) { return PAY_FREQUENCIES.find((p) => p.id === id) || PAY_FREQUENCIES[0] }
export function findPaymentMode(id) { return PAYMENT_MODES.find((p) => p.id === id) || PAYMENT_MODES[0] }
export function findEmploymentType(id) { return EMPLOYMENT_TYPES.find((e) => e.id === id) || EMPLOYMENT_TYPES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Earnings line: { label, amount, ytd, taxable }
 * Deductions line: { label, amount, ytd, type ('statutory' | 'tax' | 'other') }
 */
export function computeTotals(data) {
  const earnings   = (data.earnings   || []).map((e) => ({ ...e, amount: round2(Number(e.amount) || 0), ytd: round2(Number(e.ytd) || 0) }))
  const deductions = (data.deductions || []).map((d) => ({ ...d, amount: round2(Number(d.amount) || 0), ytd: round2(Number(d.ytd) || 0) }))

  const grossEarnings   = round2(earnings.reduce((s, e) => s + e.amount, 0))
  const grossYtd        = round2(earnings.reduce((s, e) => s + e.ytd, 0))
  const taxableEarnings = round2(earnings.filter((e) => e.taxable).reduce((s, e) => s + e.amount, 0))

  const totalDeductions     = round2(deductions.reduce((s, d) => s + d.amount, 0))
  const totalDeductionsYtd  = round2(deductions.reduce((s, d) => s + d.ytd, 0))
  const statutoryDeductions = round2(deductions.filter((d) => d.type === 'statutory').reduce((s, d) => s + d.amount, 0))
  const taxDeductions       = round2(deductions.filter((d) => d.type === 'tax').reduce((s, d) => s + d.amount, 0))

  const netPay     = round2(grossEarnings - totalDeductions)
  const netYtd     = round2(grossYtd - totalDeductionsYtd)
  const reimbursement = round2(Number(data.reimbursement) || 0)
  const takeHome   = round2(netPay + reimbursement)

  // Working-days info
  const workingDays   = Number(data.workingDays) || 0
  const presentDays   = Number(data.presentDays) || 0
  const lopDays       = Math.max(0, workingDays - presentDays)
  const lopDeduction  = workingDays > 0 ? round2(grossEarnings / workingDays * lopDays) : 0

  return {
    earnings,
    deductions,
    grossEarnings,
    grossYtd,
    taxableEarnings,
    totalDeductions,
    totalDeductionsYtd,
    statutoryDeductions,
    taxDeductions,
    netPay,
    netYtd,
    reimbursement,
    takeHome,
    workingDays,
    presentDays,
    lopDays,
    lopDeduction,
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 5 // header + employee + earnings + deductions + summary
  if (data.includeAttendanceBlock)  n++
  if (data.includeBankBlock)        n++
  if (data.includeNotesBlock)       n++
  if (data.includeSignatureBlock)   n++
  return n
}
