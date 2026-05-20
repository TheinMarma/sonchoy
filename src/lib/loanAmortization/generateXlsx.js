import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findFrequency, findLoanType, findRateStructure,
  buildSchedule, buildYearlySummary, buildSegmentSummary,
} from './compute'

export function generateLoanAmortizationXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const frequency = findFrequency(data.frequencyId)
  const loanType = findLoanType(data.loanTypeId)
  const structure = findRateStructure(data.rateStructureId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)
  const segs = buildSegmentSummary(schedule.rows, schedule.resolvedSegments)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summaryRows = [
    ['Loan Amortization Schedule'],
    [],
    ['Loan type',         loanType.label],
    ['Rate structure',    structure.label],
    ['Borrower',          data.borrowerName || ''],
    ['Lender',            data.lenderName || ''],
    ['Reference',         data.scheduleReference || ''],
    [],
    ['Principal',         Number(data.principal) || 0, cur.code],
    ['Starting rate',     `${Number(data.annualRatePct) || 0}%`, ''],
    ['Frequency',         frequency.label, ''],
    ['Total periods',     schedule.periodsActual, ''],
    ['Extra / period',    Number(data.extraPayment) || 0, cur.code],
    [],
    ['Initial EMI',       schedule.initialEmi, cur.code],
    ['Total interest',    schedule.totalInterest, cur.code],
    ['Total paid',        schedule.totalPaid, cur.code],
    [],
    ['Start date',        formatDate(data.startDate) || ''],
    ['First payment',     formatDate(data.firstPaymentDate || data.startDate) || ''],
    ['Final payment',     formatDate(schedule.finalPaymentDate) || ''],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Schedule */
  const amortRows = [
    ['#', 'Due date', 'Opening', 'Rate (%)', 'EMI', 'Interest', 'Principal', 'Closing'],
    ...schedule.rows.map((r) => [
      r.n, formatDate(r.dueDate) || '', r.opening, r.ratePct,
      r.emi, r.interest, r.principal, r.closing,
    ]),
    [],
    ['TOTALS', '', Number(data.principal) || 0, '',
      schedule.totalPaid, schedule.totalInterest, Number(data.principal) || 0, 0],
  ]
  const wsAmort = XLSX.utils.aoa_to_sheet(amortRows)
  wsAmort['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsAmort, 'Schedule')

  /* Yearly */
  const yearRows = [
    ['Year', 'Principal', 'Interest', 'Total paid', 'Year-end balance'],
    ...yearly.map((y) => [y.year, y.principal, y.interest, y.emi, y.closing]),
  ]
  const wsYear = XLSX.utils.aoa_to_sheet(yearRows)
  wsYear['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsYear, 'Yearly')

  /* Segments */
  if (segs.length > 0) {
    const segRows = [
      ['Segment', 'Rate (%)', 'Start date', 'End date', 'EMI at start', 'Principal', 'Interest', 'Total paid', 'Ending balance'],
      ...segs.map((s) => [
        s.label, s.ratePct, formatDate(s.startDate) || '', formatDate(s.endDate) || '',
        s.emiAtStart, s.principalPaid, s.interestPaid, s.totalPaid, s.closing,
      ]),
    ]
    const wsSeg = XLSX.utils.aoa_to_sheet(segRows)
    wsSeg['!cols'] = [
      { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    ]
    XLSX.utils.book_append_sheet(wb, wsSeg, 'Segments')
  }

  const fileName = `loan-amortization-${(data.scheduleReference || loanType.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
