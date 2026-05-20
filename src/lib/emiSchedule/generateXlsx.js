import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findFrequency, findLoanType,
  buildSchedule, buildYearlySummary,
} from './compute'

export function generateEmiScheduleXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const frequency = findFrequency(data.frequencyId)
  const loanType = findLoanType(data.loanTypeId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)

  const wb = XLSX.utils.book_new()

  /* ---- Sheet 1: Summary ---- */
  const summaryRows = [
    ['EMI / Amortization Schedule'],
    [],
    ['Loan type',           loanType.label],
    ['Borrower',            data.borrowerName || ''],
    ['Lender',              data.lenderName || ''],
    ['Reference',           data.scheduleReference || ''],
    [],
    ['Principal',           Number(data.principal) || 0,             cur.code],
    ['Annual interest',     `${Number(data.annualRatePct) || 0}%`,   ''],
    ['Frequency',           frequency.label,                          ''],
    ['Total periods',       schedule.periodsActual,                   ''],
    ['Extra / period',      Number(data.extraPayment) || 0,           cur.code],
    [],
    ['EMI',                 schedule.emi,                             cur.code],
    ['Total interest',      schedule.totalInterest,                   cur.code],
    ['Total paid',          schedule.totalPaid,                       cur.code],
    [],
    ['Start date',          formatDate(data.startDate) || ''],
    ['First payment',       formatDate(data.firstPaymentDate || data.startDate) || ''],
    ['Final payment',       formatDate(schedule.finalPaymentDate) || ''],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* ---- Sheet 2: Amortization ---- */
  const amortRows = [
    ['#', 'Due date', 'Opening balance', 'EMI', 'Interest', 'Principal', 'Closing balance'],
    ...schedule.rows.map((r) => [
      r.n,
      formatDate(r.dueDate) || '',
      r.opening,
      r.emi,
      r.interest,
      r.principal,
      r.closing,
    ]),
    [],
    [
      'TOTALS', '',
      Number(data.principal) || 0,
      schedule.totalPaid,
      schedule.totalInterest,
      Number(data.principal) || 0,
      0,
    ],
  ]
  const wsAmort = XLSX.utils.aoa_to_sheet(amortRows)
  wsAmort['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
  ]
  XLSX.utils.book_append_sheet(wb, wsAmort, 'Schedule')

  /* ---- Sheet 3: Yearly ---- */
  const yearRows = [
    ['Year', 'Principal paid', 'Interest paid', 'Total paid', 'Year-end balance'],
    ...yearly.map((y) => [y.year, y.principal, y.interest, y.emi, y.closing]),
  ]
  const wsYear = XLSX.utils.aoa_to_sheet(yearRows)
  wsYear['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsYear, 'Yearly')

  const fileName = `emi-schedule-${(data.scheduleReference || loanType.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
