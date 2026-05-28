import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  computeAggregate, buildMonthlyProjection, buildTypeSummary,
} from './compute'

export function generateMonthlyLoanPaymentXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const { loans, totals } = computeAggregate(data.loans)
  const typeSummary = buildTypeSummary(loans)
  const projection = data.includeProjection
    ? buildMonthlyProjection(data.loans, Number(data.projectionMonths) || 12, data.projectionStartDate)
    : []

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Monthly Loan Payment Report'],
    [],
    ['Title',          data.reportTitle || ''],
    ['Reference',      data.reference || ''],
    ['Borrower',       data.borrowerName || ''],
    ['As at',          formatDate(data.reportDate) || ''],
    [],
    ['Loans',          loans.length],
    ['Total balance',  totals.balance,        cur.code],
    ['Monthly EMI',    totals.emi,            cur.code],
    ['Monthly interest', totals.monthlyInterest, cur.code],
    ['Monthly principal', totals.monthlyPrincipal, cur.code],
    ['Weighted rate',  `${totals.weightedRate}%`],
    ['Total interest remaining', totals.totalInterestRemain, cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Loans */
  const loanRows = [
    ['#', 'Name', 'Type', 'Principal', 'Balance', 'Rate %', 'Tenure (mo)',
     'EMI', 'Interest / mo', 'Principal / mo', 'Months left', 'Total interest remaining'],
    ...loans.map((l, i) => [
      i + 1, l.name || '', l.typeLabel,
      l.principal, l.balance, l.annualRatePct, l.tenureMonths,
      l.emi, l.monthlyInterest, l.monthlyPrincipal,
      l.monthsLeft != null ? l.monthsLeft : 'Never',
      l.totalInterestRemaining,
    ]),
    [],
    ['TOTALS', '', '', '', totals.balance, totals.weightedRate, '',
     totals.emi, totals.monthlyInterest, totals.monthlyPrincipal, '', totals.totalInterestRemain],
  ]
  const wsLoans = XLSX.utils.aoa_to_sheet(loanRows)
  wsLoans['!cols'] = [
    { wch: 4 }, { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans')

  /* By type */
  const typeRows = [
    ['Type', 'Count', 'Balance', 'EMI / mo', 'Interest / mo'],
    ...typeSummary.map((t) => [t.label, t.count, t.balance, t.emi, t.monthlyInterest]),
  ]
  const wsType = XLSX.utils.aoa_to_sheet(typeRows)
  wsType['!cols'] = [{ wch: 22 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsType, 'By Type')

  /* Projection */
  if (projection.length > 0) {
    const projRows = [
      ['#', 'Month', 'Payment', 'Interest', 'Principal', 'Closing balance'],
      ...projection.map((r) => [r.n, formatDate(r.date) || '', r.emi, r.interest, r.principal, r.closingBalance]),
    ]
    const wsProj = XLSX.utils.aoa_to_sheet(projRows)
    wsProj['!cols'] = [{ wch: 4 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsProj, 'Projection')
  }

  const fileName = `monthly-loan-payment-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
