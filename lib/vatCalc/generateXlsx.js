import * as XLSX from 'xlsx'
import { findCurrency, computeVAT, findRegime, formatDate } from './compute'

export function generateVATCalcXlsx(data) {
  const t = computeVAT(data)
  const regime = findRegime(data.regimeId)
  const cur = findCurrency(data.currency || regime.defaultCurrency)
  const modeLabel = t.mode === 'extract' ? 'VAT extracted from gross' : 'VAT added to net'

  const rows = [
    [`VAT Calculation — ${data.documentName || ''}`],
    [`Regime: ${regime.label}`, '', `Mode: ${modeLabel}`, '', `Currency: ${cur.code}`],
    ...(data.reference ? [[`Reference: ${data.reference}`]] : []),
    ...(data.customerName ? [[`For: ${data.customerName}`]] : []),
    ...(data.date ? [[`Date: ${formatDate(data.date)}`]] : []),
    [],
    ['#', 'Description', 'Rate %', 'Net', 'VAT', 'Gross'],
    ...t.lines.map((l, i) => [
      i + 1,
      l.description || '',
      l.ratePct,
      l.net,
      l.vat,
      l.gross,
    ]),
    [],
    ['', 'TOTALS', '', t.totalNet, t.totalVat, t.totalGross],
    [],
    ['Breakdown by rate'],
    ['Rate %', '# Lines', 'Net', 'VAT', 'Gross'],
    ...t.byRate.map((r) => [r.rate, r.count, r.net, r.vat, r.gross]),
  ]

  if (data.notes) {
    rows.push([])
    rows.push(['Notes', data.notes])
  }
  if (regime.note) {
    rows.push([])
    rows.push(['Regime note', regime.note])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 4 }, { wch: 42 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'VAT Calc')

  const fileName = `${(data.documentName || 'vat-calculation').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-vat.xlsx`
  XLSX.writeFile(wb, fileName)
}
