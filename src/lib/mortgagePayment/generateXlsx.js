import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findLoanProgram, buildSchedule, buildYearlySummary, computeAffordability,
} from './compute'

export function generateMortgageXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const program = findLoanProgram(data.programId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)
  const aff = computeAffordability({
    monthlyPiti: schedule.monthlyPiti,
    grossMonthlyIncome: data.grossMonthlyIncome,
  })

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Mortgage Payment Schedule'],
    [],
    ['Title',         data.scheduleTitle || ''],
    ['Reference',     data.reference || ''],
    ['Borrower',      data.borrowerName || ''],
    ['Property',      data.propertyAddress || ''],
    ['Program',       program.label],
    [],
    ['Home price',    schedule.homePrice,    cur.code],
    ['Down payment',  schedule.downPayment,  cur.code],
    ['Down %',        `${schedule.downPaymentPct}%`],
    ['Loan principal', schedule.principal,    cur.code],
    ['Interest rate', `${Number(data.annualRatePct) || 0}%`],
    ['Term',          `${schedule.termYears} years`],
    ['Start date',    formatDate(data.startDate) || ''],
    [],
    ['MONTHLY PITI',      schedule.monthlyPiti,      cur.code],
    ['Principal & interest', schedule.pi,            cur.code],
    ['Property tax / mo', schedule.monthlyTax,       cur.code],
    ['Insurance / mo',    schedule.monthlyInsurance, cur.code],
    ['PMI / mo',          schedule.monthlyPmi,       cur.code],
    ['HOA / mo',          schedule.hoaMonthly,       cur.code],
    [],
    ['Total interest',    schedule.totalInterest,    cur.code],
    ['Total tax',         schedule.totalPropertyTax, cur.code],
    ['Total insurance',   schedule.totalInsurance,   cur.code],
    ['Total PMI',         schedule.totalPmi,         cur.code],
    ['Total HOA',         schedule.totalHoa,         cur.code],
    ['TOTAL PAID',        schedule.totalPaid,        cur.code],
  ]
  if (Number(data.grossMonthlyIncome) > 0) {
    summary.push([], ['Gross monthly income', Number(data.grossMonthlyIncome), cur.code])
    summary.push(['DTI ratio (front-end)', `${aff.ratio}%`])
    summary.push(['DTI status', aff.status])
  }
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Schedule */
  const schedRows = [
    ['#', 'Date', 'Opening', 'Payment', 'Principal', 'Interest', 'Tax', 'Insurance', 'PMI', 'HOA', 'Extra', 'Closing'],
    ...schedule.rows.map((r) => [
      r.n, formatDate(r.date) || '',
      r.opening, r.payment, r.principal, r.interest,
      r.tax, r.insurance, r.pmi, r.hoa, r.extra, r.closing,
    ]),
    [],
    ['TOTALS', '', '', schedule.totalPaid, schedule.principal, schedule.totalInterest,
     schedule.totalPropertyTax, schedule.totalInsurance, schedule.totalPmi, schedule.totalHoa, schedule.totalExtra, 0],
  ]
  const wsSched = XLSX.utils.aoa_to_sheet(schedRows)
  wsSched['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSched, 'Schedule')

  /* Yearly */
  const yearRows = [
    ['Year', 'Principal', 'Interest', 'Tax', 'Insurance', 'PMI', 'HOA', 'Total paid', 'Year-end balance'],
    ...yearly.map((y) => [
      y.year, y.principal, y.interest, y.tax, y.insurance, y.pmi, y.hoa, y.payment, y.closing,
    ]),
  ]
  const wsYear = XLSX.utils.aoa_to_sheet(yearRows)
  wsYear['!cols'] = [
    { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsYear, 'Yearly')

  const fileName = `mortgage-payment-${(data.reference || program.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
