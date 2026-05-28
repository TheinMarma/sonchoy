import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findPayrollFrequency, findSummaryPurpose,
  computeSummary, buildDepartmentSummary,
} from './compute'

export function generatePayrollSummaryXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findSummaryPurpose(data.purposeId)
  const frequency = findPayrollFrequency(data.frequencyId)
  const { rows, totals, variance } = computeSummary(data)
  const departments = buildDepartmentSummary(rows)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Payroll Summary'],
    [],
    ['Title',          data.reportTitle || ''],
    ['Reference',      data.reference || ''],
    ['Entity',         data.entityName || ''],
    ['Period',         data.periodLabel || ''],
    ['Frequency',      frequency.label],
    ['Purpose',        purpose.label],
    [],
    ['Headcount',      rows.length],
    ['Gross wages',    totals.gross,         cur.code],
    ['Allowances',     totals.allowances + totals.overtime + totals.bonus, cur.code],
    ['Total deductions', totals.totalDeductions, cur.code],
    ['Net paid out',   totals.net,           cur.code],
    [],
    ['Employer PF',    totals.employerPf,    cur.code],
    ['Employer ESI',   totals.employerEsi,   cur.code],
    ['Gratuity',       totals.gratuity,      cur.code],
    ['Other employer cost', totals.otherEmployerCost, cur.code],
    ['Total employer cost', totals.employerTotal,    cur.code],
    [],
    ['Total CTC',      totals.ctc,           cur.code],
  ]
  if (data.priorTotals) {
    summary.push([])
    summary.push(['vs prior gross',  variance.gross, cur.code])
    summary.push(['vs prior net',    variance.net,   cur.code])
    summary.push(['vs prior CTC',    variance.ctc,   cur.code])
  }
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Employees */
  const empRows = [
    ['#', 'Employee ID', 'Name', 'Role', 'Department',
     'Basic', 'Allowances', 'Overtime', 'Bonus', 'Gross',
     'PF', 'ESI', 'Prof tax', 'Income tax', 'Loan', 'Other', 'Total deductions',
     'Net pay',
     'Employer PF', 'Employer ESI', 'Gratuity', 'Other employer', 'Employer total',
     'CTC'],
    ...rows.map((r, i) => [
      i + 1, r.employeeId || '', r.name || '', r.role || '', r.departmentLabel,
      r.basic, r.allowances, r.overtime, r.bonus, r.gross,
      r.pf, r.esi, r.professionalTax, r.incomeTax, r.loanDeduction, r.otherDeduction, r.totalDeductions,
      r.net,
      r.employerPf, r.employerEsi, r.gratuity, r.otherEmployerCost, r.employerTotal,
      r.ctc,
    ]),
    [],
    ['TOTAL', '', '', '', '',
     totals.basic, totals.allowances, totals.overtime, totals.bonus, totals.gross,
     totals.pf, totals.esi, totals.professionalTax, totals.incomeTax, totals.loanDeduction, totals.otherDeduction, totals.totalDeductions,
     totals.net,
     totals.employerPf, totals.employerEsi, totals.gratuity, totals.otherEmployerCost, totals.employerTotal,
     totals.ctc],
  ]
  const wsEmp = XLSX.utils.aoa_to_sheet(empRows)
  wsEmp['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 24 }, { wch: 22 }, { wch: 16 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
    { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsEmp, 'Employees')

  /* By department */
  const deptRows = [
    ['Department', 'Headcount', 'Gross', 'Deductions', 'Net', 'Employer cost', 'CTC'],
    ...departments.map((d) => [d.label, d.headcount, d.gross, d.totalDeductions, d.net, d.employerTotal, d.ctc]),
  ]
  const wsDept = XLSX.utils.aoa_to_sheet(deptRows)
  wsDept['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsDept, 'By Department')

  const fileName = `payroll-summary-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
