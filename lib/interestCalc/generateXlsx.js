import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findInterestMethod, findCompoundFrequency, findSheetPurpose,
  buildSchedule, buildYearlySummary,
} from './compute'

export function generateInterestCalcXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const method = findInterestMethod(data.methodId)
  const frequency = findCompoundFrequency(data.frequencyId)
  const purpose = findSheetPurpose(data.purposeId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)
  const isReducing = method.id === 'reducing'

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Interest Calculation Sheet'],
    [],
    ['Title',         data.sheetTitle || ''],
    ['Reference',     data.reference || ''],
    ['Party',         data.partyName || ''],
    ['Purpose',       purpose.label],
    [],
    ['Method',        method.label],
    ['Compounding',   method.id === 'simple' ? '—' : frequency.label],
    ['Principal',     Number(data.principal) || 0,     cur.code],
    ['Annual rate',   `${Number(data.annualRatePct) || 0}%`],
    ['Tenure',        `${Number(data.tenureValue) || 0} ${data.tenureUnitId}`],
    ['Start date',    formatDate(data.startDate) || ''],
    ['Periods',       schedule.periods],
    [],
    ['Total interest', schedule.totalInterest, cur.code],
    ['Final balance',  schedule.finalBalance,  cur.code],
  ]
  if (isReducing && schedule.emi > 0) summary.push(['EMI', schedule.emi, cur.code])
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Schedule */
  let scheduleRows
  if (isReducing) {
    scheduleRows = [
      ['#', 'Date', 'Opening', 'Payment', 'Interest', 'Principal', 'Closing'],
      ...schedule.rows.map((r) => [
        r.n, formatDate(r.date) || '',
        r.opening, r.payment, r.interestAccrued, r.principalPaid, r.closing,
      ]),
      [],
      ['TOTALS', '', '', '', schedule.totalInterest, Number(data.principal) || 0, 0],
    ]
  } else {
    scheduleRows = [
      ['#', 'Date', 'Opening', 'Interest', 'Cumulative interest', 'Closing'],
      ...schedule.rows.map((r) => [
        r.n, formatDate(r.date) || '',
        r.opening, r.interestAccrued, r.cumulativeInterest, r.closing,
      ]),
      [],
      ['TOTALS', '', '', schedule.totalInterest, schedule.totalInterest, schedule.finalBalance],
    ]
  }
  const wsSched = XLSX.utils.aoa_to_sheet(scheduleRows)
  wsSched['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSched, 'Schedule')

  /* Yearly */
  const yearRows = [
    ['Year', 'Interest', 'Year-end balance'],
    ...yearly.map((y) => [y.year, y.interest, y.closing]),
  ]
  const wsYear = XLSX.utils.aoa_to_sheet(yearRows)
  wsYear['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsYear, 'Yearly')

  const fileName = `interest-calc-${(data.reference || method.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
