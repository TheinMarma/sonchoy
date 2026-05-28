import * as XLSX from 'xlsx'
import { findCurrency, computePnL, describePeriod } from './compute'

export function generatePnlXlsx(data) {
  const t = computePnL(data)
  const cur = findCurrency(data.currency)
  const period = describePeriod(data)

  const rows = [
    [`Profit & Loss Statement — ${data.companyName || 'Your Company'}`],
    [`Period: ${period || '—'}`, '', `Currency: ${cur.code}`],
    [],
    ['Line', cur.code],

    ['Revenue'],
    ...(data.revenue || []).map((l) => ['  ' + (l.description || ''), Number(l.amount) || 0]),
    ['Total revenue', t.revenue],
    [],
  ]

  if ((data.cogs || []).length > 0) {
    rows.push(['Cost of goods sold'])
    for (const l of data.cogs) rows.push(['  ' + (l.description || ''), -(Number(l.amount) || 0)])
    rows.push(['Total COGS', -t.cogs])
    rows.push([])
    rows.push(['Gross profit', t.grossProfit])
    rows.push([`Gross margin %`, `${t.grossMargin}%`])
    rows.push([])
  }

  if ((data.operatingExpenses || []).length > 0) {
    rows.push(['Operating expenses'])
    for (const l of data.operatingExpenses) {
      const label = l.category ? `  ${l.description} · ${l.category}` : '  ' + (l.description || '')
      rows.push([label, -(Number(l.amount) || 0)])
    }
    rows.push(['Total operating expenses', -t.opex])
    rows.push([])
    rows.push(['Operating income', t.operatingIncome])
    rows.push([`Operating margin %`, `${t.operatingMargin}%`])
    rows.push([])
  }

  if ((data.otherIncome || []).length > 0 || (data.otherExpenses || []).length > 0) {
    rows.push(['Other income & expenses'])
    for (const l of (data.otherIncome || [])) rows.push(['  ' + (l.description || ''), Number(l.amount) || 0])
    for (const l of (data.otherExpenses || [])) rows.push(['  ' + (l.description || ''), -(Number(l.amount) || 0)])
    rows.push([])
  }

  rows.push(['Income before tax', t.preTaxIncome])
  if (t.taxExpense > 0) {
    rows.push([`Tax expense (${t.effectiveTaxRate}% effective)`, -t.taxExpense])
  }
  rows.push([])
  rows.push(['NET INCOME', t.netIncome])
  rows.push([`Net margin %`, `${t.netMargin}%`])

  // OPEX breakdown
  if (t.opexBreakdown.length > 1) {
    rows.push([])
    rows.push(['Operating expenses by category'])
    rows.push(['Category', 'Amount', '% of OPEX'])
    for (const row of t.opexBreakdown) {
      const share = t.opex ? (row.amount / t.opex) * 100 : 0
      rows.push([row.category, row.amount, `${share.toFixed(1)}%`])
    }
  }

  if (data.notes) {
    rows.push([])
    rows.push(['Notes', data.notes])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 44 }, { wch: 16 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'P&L')

  const fileName = `${(data.companyName || 'profit-loss').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-pnl.xlsx`
  XLSX.writeFile(wb, fileName)
}
