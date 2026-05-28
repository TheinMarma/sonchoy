import * as XLSX from 'xlsx'
import { findCurrency, computeIncomeStatement, describePeriod } from './compute'

export function generateIncomeStatementXlsx(data) {
  const { current, prior } = computeIncomeStatement(data)
  const cur = findCurrency(data.currency)
  const currentLabel = describePeriod(data.currentPeriodLabel, data.currentPeriodStart, data.currentPeriodEnd)
  const priorLabel   = describePeriod(data.priorPeriodLabel,   data.priorPeriodStart,   data.priorPeriodEnd)

  const pctOf = (c, p) => {
    if (!p) return '—'
    return `${(((c - p) / Math.abs(p)) * 100).toFixed(1)}%`
  }

  const rows = [
    [`Income Statement — ${data.companyName || 'Your Company'}`],
    [`Currency: ${cur.code}`],
    [],
    ['Line', currentLabel || 'Current', priorLabel || 'Prior', 'Δ %'],

    ['Revenue'],
    ...(data.revenue || []).map((l) => [
      '  ' + (l.description || ''),
      Number(l.current) || 0,
      Number(l.prior) || 0,
      pctOf(Number(l.current) || 0, Number(l.prior) || 0),
    ]),
    ['Total revenue', current.revenue, prior.revenue, pctOf(current.revenue, prior.revenue)],
    [],

    ...((data.costOfRevenue || []).length > 0 ? [
      ['Cost of revenue'],
      ...data.costOfRevenue.map((l) => [
        '  ' + (l.description || ''),
        -(Number(l.current) || 0),
        -(Number(l.prior) || 0),
        pctOf(Number(l.current) || 0, Number(l.prior) || 0),
      ]),
      ['Gross profit', current.grossProfit, prior.grossProfit, pctOf(current.grossProfit, prior.grossProfit)],
      [`Gross margin %`, `${current.grossMargin}%`, `${prior.grossMargin}%`],
      [],
    ] : []),

    ...((data.operatingExpenses || []).length > 0 ? [
      ['Operating expenses'],
      ...data.operatingExpenses.map((l) => [
        l.category ? `  ${l.description} · ${l.category}` : '  ' + (l.description || ''),
        -(Number(l.current) || 0),
        -(Number(l.prior) || 0),
        pctOf(Number(l.current) || 0, Number(l.prior) || 0),
      ]),
      ['Operating income', current.operatingIncome, prior.operatingIncome, pctOf(current.operatingIncome, prior.operatingIncome)],
      [`Operating margin %`, `${current.operatingMargin}%`, `${prior.operatingMargin}%`],
      [],
    ] : []),

    ...(((data.otherIncome || []).length > 0 || (data.otherExpenses || []).length > 0) ? [
      ['Other income & expenses'],
      ...(data.otherIncome || []).map((l) => [
        '  ' + (l.description || ''),
        Number(l.current) || 0,
        Number(l.prior) || 0,
        pctOf(Number(l.current) || 0, Number(l.prior) || 0),
      ]),
      ...(data.otherExpenses || []).map((l) => [
        '  ' + (l.description || ''),
        -(Number(l.current) || 0),
        -(Number(l.prior) || 0),
        pctOf(Number(l.current) || 0, Number(l.prior) || 0),
      ]),
      [],
    ] : []),

    ['Income before tax', current.preTaxIncome, prior.preTaxIncome, pctOf(current.preTaxIncome, prior.preTaxIncome)],
    [`Tax expense (${current.effectiveTaxRate}% / ${prior.effectiveTaxRate}%)`,
      -(Number(data.currentTax) || 0),
      -(Number(data.priorTax) || 0),
      pctOf(Number(data.currentTax) || 0, Number(data.priorTax) || 0),
    ],
    [],
    ['NET INCOME', current.netIncome, prior.netIncome, pctOf(current.netIncome, prior.netIncome)],
    [`Net margin %`, `${current.netMargin}%`, `${prior.netMargin}%`],
  ]

  if (current.sharesBasic > 0 || prior.sharesBasic > 0) {
    rows.push([])
    rows.push(['Earnings per share'])
    rows.push(['EPS — Basic',                  Number(current.epsBasic.toFixed(2)),   Number(prior.epsBasic.toFixed(2))])
    rows.push(['EPS — Diluted',                Number(current.epsDiluted.toFixed(2)), Number(prior.epsDiluted.toFixed(2))])
    rows.push(['Weighted avg shares — basic',   current.sharesBasic,   prior.sharesBasic])
    rows.push(['Weighted avg shares — diluted', current.sharesDiluted, prior.sharesDiluted])
  }

  if (data.notes) {
    rows.push([])
    rows.push(['Notes', data.notes])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 44 }, { wch: 16 }, { wch: 16 }, { wch: 10 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Income Statement')

  const fileName = `${(data.companyName || 'income-statement').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-income-statement.xlsx`
  XLSX.writeFile(wb, fileName)
}
