import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findStrategy, computeSchedule, buildYearlySummary,
} from './compute'

export function generateCreditCardScheduleXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const { strategy, minimumSim, fixedSim, savings } = computeSchedule(data)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Credit Card Payment Schedule'],
    [],
    ['Title',         data.scheduleTitle || ''],
    ['Reference',     data.reference || ''],
    ['Cardholder',    data.cardholderName || ''],
    ['Card',          data.cardName || ''],
    ['Strategy',      strategy.label],
    [],
    ['Balance',       Number(data.balance) || 0, cur.code],
    ['APR',           `${Number(data.annualRatePct) || 0}%`],
    ['Min %',         `${Number(data.minPercentPct) || 0}%`],
    ['Min floor',     Number(data.minFloor) || 0, cur.code],
    ['Fixed payment', Number(data.fixedPayment) || 0, cur.code],
    ['Monthly charges', Number(data.monthlyCharges) || 0, cur.code],
    [],
  ]
  if (minimumSim) {
    summary.push(['MINIMUM-ONLY', '', ''])
    summary.push(['Months',       minimumSim.paidOff ? minimumSim.months : 'Never'])
    summary.push(['Total paid',   minimumSim.totalPaid, cur.code])
    summary.push(['Interest',     minimumSim.totalInterest, cur.code])
    summary.push([])
  }
  if (fixedSim) {
    summary.push(['FIXED-PAYMENT', '', ''])
    summary.push(['Months',       fixedSim.paidOff ? fixedSim.months : 'Never'])
    summary.push(['Total paid',   fixedSim.totalPaid, cur.code])
    summary.push(['Interest',     fixedSim.totalInterest, cur.code])
    summary.push([])
  }
  if (savings && savings.interestSaved != null) {
    summary.push(['SAVINGS (Fixed vs Min)', '', ''])
    summary.push(['Interest saved', savings.interestSaved, cur.code])
    summary.push(['Months saved',   savings.monthsSaved])
  }
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 26 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Helper to build schedule rows */
  const scheduleSheet = (sim, label) => {
    if (!sim || sim.rows.length === 0) return null
    const rows = [
      ['#', 'Date', 'Opening', 'Payment', 'Interest', 'Principal', 'New charges', 'Closing'],
      ...sim.rows.map((r) => [
        r.n, formatDate(r.date) || '',
        r.opening, r.payment, r.interest, r.principal, r.newCharges, r.closing,
      ]),
      [],
      ['TOTALS', '', '', sim.totalPaid, sim.totalInterest, sim.totalPaid - sim.totalInterest, '', 0],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
    ]
    return ws
  }

  if (minimumSim) {
    const ws = scheduleSheet(minimumSim, 'Minimum-only')
    if (ws) XLSX.utils.book_append_sheet(wb, ws, 'Minimum-only')
  }
  if (fixedSim) {
    const ws = scheduleSheet(fixedSim, 'Fixed-payment')
    if (ws) XLSX.utils.book_append_sheet(wb, ws, 'Fixed-payment')
  }

  /* Yearly summary for the primary sim */
  const primarySim = strategy.id === 'minimum' ? minimumSim : fixedSim
  if (primarySim && primarySim.rows.length > 0) {
    const yearly = buildYearlySummary(primarySim.rows)
    const yearRows = [
      ['Year', 'Paid', 'Interest', 'Principal', 'Year-end balance'],
      ...yearly.map((y) => [y.year, y.payment, y.interest, y.principal, y.closing]),
    ]
    const wsYear = XLSX.utils.aoa_to_sheet(yearRows)
    wsYear['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsYear, 'Yearly')
  }

  const fileName = `credit-card-payoff-${(data.reference || strategy.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
