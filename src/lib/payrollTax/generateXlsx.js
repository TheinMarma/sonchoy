import * as XLSX from 'xlsx'
import { findCurrency, computePayroll, findRegime, periodLabel } from './compute'

export function generatePayrollTaxXlsx(data) {
  const t = computePayroll(data)
  const regime = findRegime(data.regimeId)
  const cols = regime.columns
  const cur = findCurrency(data.currency || regime.defaultCurrency)
  const period = periodLabel(data)

  const wb = XLSX.utils.book_new()

  /* ---- Detail sheet ---- */
  const rows = [
    [`Payroll Tax Report — ${data.employerName || 'Employer'}`],
    [`Regime: ${regime.label}`, '', `Period: ${period || '—'}`, '', `Currency: ${cur.code}`],
    ...(data.taxId ? [[`EIN/Tax ID: ${data.taxId}`]] : []),
    [],
    ['#', 'Employee', 'Emp ID', 'Gross', cols.incomeTax, cols.socialContrib, cols.medicare, 'Total deductions', 'Net pay', cols.employerContrib, 'Total cost'],
    ...t.rows.map((r, i) => [
      i + 1,
      r.name || '',
      r.employeeId || '',
      r.gross,
      r.incomeTax,
      r.socialContrib,
      r.medicare,
      r.deductions,
      r.netPay,
      r.employerContrib,
      r.totalCost,
    ]),
    [],
    ['', 'TOTALS', '', t.gross, t.incomeTax, t.socialContrib, t.medicare, t.deductions, t.netPay, t.employerContrib, t.totalCost],
  ]
  const detailSheet = XLSX.utils.aoa_to_sheet(rows)
  detailSheet['!cols'] = [
    { wch: 4 }, { wch: 28 }, { wch: 14 },
    { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Payroll Detail')

  /* ---- Filing summary ---- */
  const sumRows = [
    ['Filing Summary'],
    [],
    ['Employer', data.employerName || ''],
    ['Regime',   regime.label],
    ['Period',   period],
    ['Currency', cur.code],
    [],
    ['Gross payroll',     t.gross],
    ['# Employees',       t.countEmployees],
    [],
    ['Employee withholdings'],
    [cols.incomeTax,     t.incomeTax],
    [cols.socialContrib, t.socialContrib],
    [cols.medicare,      t.medicare],
    ['Total withheld',   t.deductions],
    ['Net paid to employees', t.netPay],
    [],
    ['Employer contributions'],
    [cols.employerContrib, t.employerContrib],
    [],
    ['Total employer cost', t.totalCost],
    [],
    ['Effective tax rate (% of gross)',   `${t.effectiveTaxRate}%`],
    ['Total deduction rate (% of gross)', `${t.effectiveDeductRate}%`],
    ['Employer cost burden (% of gross)', `${t.employerCostRate}%`],
  ]
  if (regime.note) {
    sumRows.push([])
    sumRows.push(['Regime note', regime.note])
  }
  if (data.notes) {
    sumRows.push([])
    sumRows.push(['Notes', data.notes])
  }
  const sumSheet = XLSX.utils.aoa_to_sheet(sumRows)
  sumSheet['!cols'] = [{ wch: 38 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Filing Summary')

  const fileName = `${(data.employerName || 'payroll-tax').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-payroll-tax.xlsx`
  XLSX.writeFile(wb, fileName)
}
