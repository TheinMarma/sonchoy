import * as XLSX from 'xlsx'
import { findCurrency, computeCashFlow, describePeriod } from './compute'

export function generateCashFlowXlsx(data) {
  const t = computeCashFlow(data)
  const cur = findCurrency(data.currency)
  const period = describePeriod(data)
  const method = data.method === 'direct' ? 'Direct method' : 'Indirect method'

  const rows = [
    [`Cash Flow Statement — ${data.companyName || 'Your Company'}`],
    [`Period: ${period || '—'}`, '', `Method: ${method}`, '', `Currency: ${cur.code}`],
    [],
    ['Line', cur.code],

    ['Cash & equivalents — opening', t.openingCash],
    [],

    ['Cash flows from operating activities'],
    ...(data.operating || []).map((l) => ['  ' + (l.description || ''), Number(l.amount) || 0]),
    ['Net cash from operating activities', t.netOperating],
    [],

    ['Cash flows from investing activities'],
    ...(data.investing || []).map((l) => ['  ' + (l.description || ''), Number(l.amount) || 0]),
    ['Net cash from investing activities', t.netInvesting],
    [],

    ['Cash flows from financing activities'],
    ...(data.financing || []).map((l) => ['  ' + (l.description || ''), Number(l.amount) || 0]),
    ['Net cash from financing activities', t.netFinancing],
    [],

    ['Net change in cash', t.netChange],
    ['Cash & equivalents — closing', t.closingCash],
    [],
    ['Free cash flow (Operating − CapEx)', t.freeCashFlow],
    ['  Net operating', t.netOperating],
    ['  Less: CapEx', t.capex],
  ]

  if (data.notes) {
    rows.push([])
    rows.push(['Notes', data.notes])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 50 }, { wch: 16 }, { wch: 22 }, { wch: 2 }, { wch: 20 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Cash Flow')

  const fileName = `${(data.companyName || 'cash-flow').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-cashflow.xlsx`
  XLSX.writeFile(wb, fileName)
}
