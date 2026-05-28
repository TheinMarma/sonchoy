/* ------------------------------------------------------------------ */
/*  Payroll Summary Generator — wages, deductions, employer taxes       */
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

export const DEPARTMENTS = [
  { id: 'engineering',   label: 'Engineering' },
  { id: 'design',        label: 'Design' },
  { id: 'sales',         label: 'Sales & Marketing' },
  { id: 'operations',    label: 'Operations' },
  { id: 'finance',       label: 'Finance & Admin' },
  { id: 'leadership',    label: 'Leadership' },
  { id: 'support',       label: 'Customer Support' },
  { id: 'other',         label: 'Other' },
]

export const PAYROLL_FREQUENCIES = [
  { id: 'monthly',    label: 'Monthly' },
  { id: 'biweekly',   label: 'Bi-weekly' },
  { id: 'weekly',     label: 'Weekly' },
  { id: 'semimonthly', label: 'Semi-monthly' },
]

export const SUMMARY_PURPOSES = [
  { id: 'monthly',     label: 'Monthly payroll close' },
  { id: 'quarterly',   label: 'Quarterly review' },
  { id: 'year-end',    label: 'Year-end / Form 16 prep' },
  { id: 'audit',       label: 'Audit support' },
  { id: 'cfo',         label: 'CFO / leadership review' },
]

/* ---- Helpers ---- */

export function findDepartment(id) { return DEPARTMENTS.find((d) => d.id === id) || DEPARTMENTS[DEPARTMENTS.length - 1] }
export function findPayrollFrequency(id) { return PAYROLL_FREQUENCIES.find((p) => p.id === id) || PAYROLL_FREQUENCIES[0] }
export function findSummaryPurpose(id) { return SUMMARY_PURPOSES.find((p) => p.id === id) || SUMMARY_PURPOSES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Compute payroll summary.
 *
 * Each employee: {
 *   employeeId, name, role, departmentId,
 *   basic, allowances, overtime, bonus,        // gross components
 *   pf, esi, professionalTax, incomeTax,        // employee-side deductions
 *   loanDeduction, otherDeduction,
 *   employerPf, employerEsi, gratuity, otherEmployerCost,
 * }
 */
export function computeEmployeeTotals(emp) {
  const basic       = round2(Math.max(0, Number(emp.basic) || 0))
  const allowances  = round2(Math.max(0, Number(emp.allowances) || 0))
  const overtime    = round2(Math.max(0, Number(emp.overtime) || 0))
  const bonus       = round2(Math.max(0, Number(emp.bonus) || 0))
  const gross       = round2(basic + allowances + overtime + bonus)

  const pf               = round2(Math.max(0, Number(emp.pf) || 0))
  const esi              = round2(Math.max(0, Number(emp.esi) || 0))
  const professionalTax  = round2(Math.max(0, Number(emp.professionalTax) || 0))
  const incomeTax        = round2(Math.max(0, Number(emp.incomeTax) || 0))
  const loanDeduction    = round2(Math.max(0, Number(emp.loanDeduction) || 0))
  const otherDeduction   = round2(Math.max(0, Number(emp.otherDeduction) || 0))
  const totalDeductions  = round2(pf + esi + professionalTax + incomeTax + loanDeduction + otherDeduction)

  const net = round2(Math.max(0, gross - totalDeductions))

  const employerPf       = round2(Math.max(0, Number(emp.employerPf) || 0))
  const employerEsi      = round2(Math.max(0, Number(emp.employerEsi) || 0))
  const gratuity         = round2(Math.max(0, Number(emp.gratuity) || 0))
  const otherEmployerCost = round2(Math.max(0, Number(emp.otherEmployerCost) || 0))
  const employerTotal     = round2(employerPf + employerEsi + gratuity + otherEmployerCost)

  const ctc = round2(gross + employerTotal)

  return {
    ...emp,
    basic, allowances, overtime, bonus, gross,
    pf, esi, professionalTax, incomeTax, loanDeduction, otherDeduction, totalDeductions,
    net,
    employerPf, employerEsi, gratuity, otherEmployerCost, employerTotal,
    ctc,
  }
}

/** Compute aggregates across all employees. */
export function computeSummary(data) {
  const rows = (data.employees || []).map((e) => {
    const computed = computeEmployeeTotals(e)
    const dept = findDepartment(computed.departmentId)
    return { ...computed, departmentLabel: dept.label }
  })

  const totals = rows.reduce((s, r) => {
    s.basic            += r.basic
    s.allowances       += r.allowances
    s.overtime         += r.overtime
    s.bonus            += r.bonus
    s.gross            += r.gross
    s.pf               += r.pf
    s.esi              += r.esi
    s.professionalTax  += r.professionalTax
    s.incomeTax        += r.incomeTax
    s.loanDeduction    += r.loanDeduction
    s.otherDeduction   += r.otherDeduction
    s.totalDeductions  += r.totalDeductions
    s.net              += r.net
    s.employerPf       += r.employerPf
    s.employerEsi      += r.employerEsi
    s.gratuity         += r.gratuity
    s.otherEmployerCost += r.otherEmployerCost
    s.employerTotal    += r.employerTotal
    s.ctc              += r.ctc
    return s
  }, {
    basic: 0, allowances: 0, overtime: 0, bonus: 0, gross: 0,
    pf: 0, esi: 0, professionalTax: 0, incomeTax: 0,
    loanDeduction: 0, otherDeduction: 0, totalDeductions: 0,
    net: 0,
    employerPf: 0, employerEsi: 0, gratuity: 0, otherEmployerCost: 0, employerTotal: 0,
    ctc: 0,
  })
  Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]) })

  // Variance vs prior period (totals only — prior numbers supplied in data.priorTotals if present)
  const prior = data.priorTotals || {}
  const variance = {
    gross: round2(totals.gross - (Number(prior.gross) || 0)),
    net:   round2(totals.net   - (Number(prior.net) || 0)),
    ctc:   round2(totals.ctc   - (Number(prior.ctc) || 0)),
  }

  return { rows, totals, variance, prior }
}

/** Department-level rollup. */
export function buildDepartmentSummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const acc = map.get(r.departmentId) || {
      departmentId: r.departmentId,
      label: r.departmentLabel,
      headcount: 0,
      gross: 0, net: 0, ctc: 0, employerTotal: 0, totalDeductions: 0,
    }
    acc.headcount += 1
    acc.gross           += r.gross
    acc.net             += r.net
    acc.ctc             += r.ctc
    acc.employerTotal   += r.employerTotal
    acc.totalDeductions += r.totalDeductions
    map.set(r.departmentId, acc)
  }
  return Array.from(map.values()).map((d) => ({
    ...d,
    gross: round2(d.gross),
    net: round2(d.net),
    ctc: round2(d.ctc),
    employerTotal: round2(d.employerTotal),
    totalDeductions: round2(d.totalDeductions),
  })).sort((a, b) => b.gross - a.gross)
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 2 // header + employee table
  if (data.includeDepartmentSummary) n++
  if (data.includeDeductionsBreakdown) n++
  if (data.includeEmployerContributions) n++
  if (data.includePriorComparison && data.priorTotals) n++
  if (data.notes) n++
  return n
}
