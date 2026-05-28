import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findPayFrequency, findPaymentMode, findEmploymentType,
  computeTotals,
} from './compute'

export function generateSalarySlipXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const freq = findPayFrequency(data.payFrequencyId)
  const mode = findPaymentMode(data.paymentModeId)
  const emp = findEmploymentType(data.employmentTypeId)
  const totals = computeTotals(data)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Salary Slip'],
    [],
    ['Slip #',         data.slipNumber || ''],
    ['Pay period',     data.payPeriod || ''],
    ['Pay date',       formatDate(data.payDate) || ''],
    ['Frequency',      freq.label],
    ['Mode',           mode.label],
    [],
    ['Company',        data.company?.name || ''],
    ['Tax ID',         data.company?.taxId || ''],
    [],
    ['Employee',       data.employee?.name || ''],
    ['Employee ID',    data.employee?.employeeId || ''],
    ['Designation',    data.employee?.designation || ''],
    ['Department',     data.employee?.department || ''],
    ['Date of joining', formatDate(data.employee?.dateOfJoining) || ''],
    ['Employment',     emp.label],
    ['Tax ID',         data.employee?.taxId || ''],
    ['UAN / PF',       data.employee?.uan || ''],
    [],
    ['Working days',   totals.workingDays],
    ['Present days',   totals.presentDays],
    ['LOP days',       totals.lopDays],
    [],
    ['Gross earnings',    totals.grossEarnings,     cur.code],
    ['Taxable earnings',  totals.taxableEarnings,   cur.code],
    ['Total deductions',  totals.totalDeductions,   cur.code],
    ['Statutory ded.',    totals.statutoryDeductions, cur.code],
    ['Tax deductions',    totals.taxDeductions,     cur.code],
    ['Net pay',           totals.netPay,            cur.code],
    ['Reimbursements',    totals.reimbursement,     cur.code],
    ['Take-home',         totals.takeHome,          cur.code],
    [],
    ['Gross YTD',         totals.grossYtd,          cur.code],
    ['Deductions YTD',    totals.totalDeductionsYtd, cur.code],
    ['Net YTD',           totals.netYtd,            cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 26 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Earnings */
  const eRows = [
    ['Label', 'Taxable', 'Amount', 'YTD'],
    ...totals.earnings.map((e) => [e.label || '', e.taxable ? 'Yes' : 'No', e.amount, e.ytd]),
    [],
    ['TOTAL', '', totals.grossEarnings, totals.grossYtd],
  ]
  const wsE = XLSX.utils.aoa_to_sheet(eRows)
  wsE['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsE, 'Earnings')

  /* Deductions */
  const dRows = [
    ['Label', 'Type', 'Amount', 'YTD'],
    ...totals.deductions.map((d) => [d.label || '', d.type || 'other', d.amount, d.ytd]),
    [],
    ['TOTAL', '', totals.totalDeductions, totals.totalDeductionsYtd],
  ]
  const wsD = XLSX.utils.aoa_to_sheet(dRows)
  wsD['!cols'] = [{ wch: 26 }, { wch: 12 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsD, 'Deductions')

  const fileName = `salary-slip-${(data.slipNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
