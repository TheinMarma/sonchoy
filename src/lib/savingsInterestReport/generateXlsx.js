import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findCompoundFrequency, findContribFrequency, findAccountType, findFlowType,
  buildSchedule, buildYearlySummary, computeGoalProgress,
} from './compute'

export function generateSavingsInterestXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const accountType = findAccountType(data.accountTypeId)
  const compoundF = findCompoundFrequency(data.compoundFrequencyId)
  const contribF = findContribFrequency(data.contribFrequencyId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)
  const goal = computeGoalProgress({ targetAmount: data.targetAmount, schedule })

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Savings Interest Report'],
    [],
    ['Title',         data.reportTitle || ''],
    ['Reference',     data.reference || ''],
    ['Account holder', data.accountHolder || ''],
    ['Bank',          data.bankName || ''],
    ['Account type',  accountType.label],
    [],
    ['Opening balance', schedule.openingBalance, cur.code],
    ['Annual rate',     `${Number(data.annualRatePct) || 0}%`],
    ['Compounding',     compoundF.label],
    ['Tenure (months)', schedule.months],
    ['Contribution',    contribF.id === 'none' ? '—' : `${Number(data.contribAmount) || 0} ${cur.code} / ${contribF.label}`],
    ['Tax on interest', `${Number(data.taxOnInterestPct) || 0}%`],
    [],
    ['Total contributions', schedule.totalContributions, cur.code],
    ['Total lump-sum in',   schedule.totalDeposits,      cur.code],
    ['Total withdrawals',   schedule.totalWithdrawals,   cur.code],
    ['Interest (gross)',    schedule.totalInterest,      cur.code],
    ['Interest tax',        schedule.totalInterestTax,   cur.code],
    ['Interest (net)',      schedule.totalInterestNet,   cur.code],
    ['Final balance',       schedule.finalBalance,       cur.code],
  ]
  if (Number(data.targetAmount) > 0) {
    summary.push([])
    summary.push(['Target', Number(data.targetAmount), cur.code])
    summary.push(['Status', goal.hit ? `Achieved on ${formatDate(goal.monthsToHitDate)}` : `${goal.finalProgressPct}% (shortfall ${goal.shortfall})`])
  }
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Schedule */
  const schedRows = [
    ['#', 'Date', 'Opening', 'Contribution', 'Deposit (lump)', 'Withdrawal (lump)', 'Interest (gross)', 'Interest tax', 'Interest (net)', 'Closing'],
    ...schedule.rows.map((r) => [
      r.n, formatDate(r.date) || '',
      r.opening, r.contribution, r.depositLumpSum, r.withdrawalLumpSum,
      r.interestGross, r.interestTax, r.interestNet,
      r.closing,
    ]),
    [],
    ['TOTALS', '', schedule.openingBalance, schedule.totalContributions, schedule.totalDeposits, schedule.totalWithdrawals,
     schedule.totalInterest, schedule.totalInterestTax, schedule.totalInterestNet, schedule.finalBalance],
  ]
  const wsSched = XLSX.utils.aoa_to_sheet(schedRows)
  wsSched['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSched, 'Schedule')

  /* Yearly */
  const yearRows = [
    ['Year', 'Contribution', 'Lump-sum in', 'Withdrawals', 'Interest (net)', 'Year-end balance'],
    ...yearly.map((y) => [y.year, y.contribution, y.depositLumpSum, y.withdrawalLumpSum, y.interestNet, y.closing]),
  ]
  const wsYear = XLSX.utils.aoa_to_sheet(yearRows)
  wsYear['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsYear, 'Yearly')

  /* Cash flows */
  if ((data.cashFlows || []).length > 0) {
    const cfRows = [
      ['Date', 'Type', 'Label', 'Amount'],
      ...[...data.cashFlows].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((cf) => [
        formatDate(cf.date) || '', findFlowType(cf.type).label, cf.label || '', Number(cf.amount) || 0,
      ]),
    ]
    const wsCf = XLSX.utils.aoa_to_sheet(cfRows)
    wsCf['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 30 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsCf, 'Cash flows')
  }

  const fileName = `savings-interest-${(data.reference || accountType.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
