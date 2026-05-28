import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findIncomeType, computeEstimate,
} from './compute'

export function generateIncomeTaxEstimatorXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const est = computeEstimate(data)
  const regime = est.regime

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Income Tax Estimate'],
    [],
    ['Taxpayer',          data.taxpayerName || ''],
    ['Reference',         data.reference || ''],
    ['Tax year',          data.taxYear || ''],
    ['Regime',            regime.label],
    [],
    ['Gross income',      est.gross,             cur.code],
    ['Personal allowance', est.personalAllowance, cur.code],
    ['Deductions',        est.deductionsTotal,   cur.code],
    ['Taxable income',    est.taxable,           cur.code],
    [],
    ['Tax on slabs',      est.totalTax,          cur.code],
    ['Surcharge',         est.surcharge,         cur.code],
    ['Cess',              est.cess,              cur.code],
    ['Rebate',            est.rebate,            cur.code],
    ['Total tax payable', est.netTax,            cur.code],
    [],
    ['Effective rate',    `${est.effectiveRatePct}%`],
    ['Marginal rate',     `${est.marginalRatePct}%`],
    ['Take-home',         est.takeHome,          cur.code],
    ['Monthly take-home', est.monthlyTakeHome,   cur.code],
    [],
    ['Paid YTD',          est.paidYTD,           cur.code],
    ['Remaining to pay',  est.remainingTax,      cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Income */
  const incomeRows = [
    ['Type', 'Description', 'Amount'],
    ...(data.incomeSources || []).map((it) => [
      findIncomeType(it.typeId).label, it.description || '', Number(it.amount) || 0,
    ]),
    [],
    ['TOTAL', '', est.gross],
  ]
  const wsIncome = XLSX.utils.aoa_to_sheet(incomeRows)
  wsIncome['!cols'] = [{ wch: 22 }, { wch: 38 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Income')

  /* Deductions */
  if ((data.deductions || []).length > 0) {
    const dedRows = [
      ['Section', 'Description', 'Amount'],
      ...data.deductions.map((it) => [it.section || '', it.description || '', Number(it.amount) || 0]),
      [],
      ['TOTAL', '', est.deductionsTotal],
    ]
    const wsDed = XLSX.utils.aoa_to_sheet(dedRows)
    wsDed['!cols'] = [{ wch: 14 }, { wch: 38 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsDed, 'Deductions')
  }

  /* Slabs */
  const slabRows = [
    ['Band', 'Lower', 'Upper', 'Taxed in band', 'Rate (%)', 'Tax'],
    ...est.breakdown.map((b) => [
      b.label, b.lower, Number.isFinite(b.upper) ? b.upper : '∞',
      b.sliceAmount, b.ratePct, b.tax,
    ]),
    [],
    ['TOTAL', '', '', est.taxable, '', est.totalTax],
  ]
  const wsSlabs = XLSX.utils.aoa_to_sheet(slabRows)
  wsSlabs['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsSlabs, 'Slabs')

  const fileName = `income-tax-estimate-${(data.reference || regime.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
