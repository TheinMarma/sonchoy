import * as XLSX from 'xlsx'
import { findCurrency, computeBalance, asOfLabel } from './compute'

export function generateBalanceSheetXlsx(data) {
  const t = computeBalance(data)
  const cur = findCurrency(data.currency)
  const dateLabel = asOfLabel(data)

  const rows = [
    [`Balance Sheet — ${data.companyName || 'Your Company'}`],
    [`As of: ${dateLabel || '—'}`, '', `Currency: ${cur.code}`],
    [],
    ['Line', cur.code],

    ['ASSETS'],
    ['Current assets'],
    ...(data.currentAssets || []).map((l) => ['  ' + (l.description || ''), Number(l.amount) || 0]),
    ['Total current assets', t.currentAssets],
    ['Non-current assets'],
    ...(data.nonCurrentAssets || []).map((l) => ['  ' + (l.description || ''), Number(l.amount) || 0]),
    ['Total non-current assets', t.nonCurrentAssets],
    ['TOTAL ASSETS', t.totalAssets],
    [],

    ['LIABILITIES'],
    ['Current liabilities'],
    ...(data.currentLiabilities || []).map((l) => ['  ' + (l.description || ''), Number(l.amount) || 0]),
    ['Total current liabilities', t.currentLiab],
    ['Non-current liabilities'],
    ...(data.nonCurrentLiabilities || []).map((l) => ['  ' + (l.description || ''), Number(l.amount) || 0]),
    ['Total non-current liabilities', t.nonCurrentLiab],
    ['TOTAL LIABILITIES', t.totalLiab],
    [],

    ['EQUITY'],
    ...(data.equity || []).map((l) => ['  ' + (l.description || ''), Number(l.amount) || 0]),
    ['TOTAL EQUITY', t.equity],
    [],

    ['TOTAL LIABILITIES + EQUITY', t.totalLiabAndEquity],
    ['Balance check', t.isBalanced ? 'Balanced' : `Out of balance by ${t.balanceDiff}`],
    [],

    ['Key metrics'],
    ['Working capital', t.workingCapital, 'Current assets − current liabilities'],
    ['Current ratio',  `${t.currentRatio.toFixed(2)}x`, '> 1.0 indicates short-term solvency'],
    ['Quick ratio',    `${t.quickRatio.toFixed(2)}x`,   'Excludes inventory & prepaids'],
    ['Debt-to-equity', `${t.debtToEquity.toFixed(2)}x`, 'Total liabilities ÷ total equity'],
    ['Equity ratio',   `${t.equityRatio.toFixed(1)}%`,  'Equity ÷ total assets'],
  ]

  if (data.notes) {
    rows.push([])
    rows.push(['Notes', data.notes])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 44 }, { wch: 16 }, { wch: 48 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet')

  const fileName = `${(data.companyName || 'balance-sheet').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-balance-sheet.xlsx`
  XLSX.writeFile(wb, fileName)
}
