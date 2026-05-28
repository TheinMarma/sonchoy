import * as XLSX from 'xlsx'
import { findCurrency, computeTax, describePeriod } from './compute'

export function generateTaxCalcXlsx(data) {
  const t = computeTax(data)
  const cur = findCurrency(data.currency || t.regime.defaultCurrency)
  const period = describePeriod(data)

  const wb = XLSX.utils.book_new()

  const rows = [
    [`Tax Calculation Sheet — ${data.taxpayerName || 'Taxpayer'}`],
    [`Regime: ${t.regime.label}`, '', `Currency: ${cur.code}`],
    ...(data.taxId ? [[`${t.regime.taxIdLabel}: ${data.taxId}`]] : []),
    ...(period ? [[`Period: ${period}`]] : []),
    [],

    ['Income'],
    ...(data.income || []).map((i) => [`  ${i.description || ''}`, Number(i.amount) || 0]),
    ['Gross total income', t.totalIncome],
    [],

    ['Deductions'],
    ...(t.stdDeduction > 0 ? [['  Standard deduction', t.stdDeduction]] : []),
    ...(data.deductions || []).map((d) => [
      d.section ? `  ${d.description} · ${d.section}` : `  ${d.description || ''}`,
      Number(d.amount) || 0,
    ]),
    ['Total deductions', t.totalDeductions],
    [],

    ['Taxable income', t.taxableIncome],
    [],

    ['Tax by slab'],
    ['Slab', 'Rate', 'Taxable in band', 'Tax'],
    ...t.breakdown
      .filter((b) => b.taxableInBand > 0 || b.from === 0)
      .map((b) => [
        b.to === Infinity ? `> ${b.from}` : `${b.from} – ${b.to}`,
        `${(b.rate * 100).toFixed(b.rate * 100 === Math.floor(b.rate * 100) ? 0 : 2)}%`,
        b.taxableInBand,
        b.tax,
      ]),
    ['Tax before cess/surcharge', '', '', t.tax],
    [],
  ]

  if (t.cess > 0) rows.push([`Cess (${t.cessRate}%)`, '', '', t.cess])
  if (t.surcharge > 0) rows.push([`Surcharge (${t.surchargeRate}%)`, '', '', t.surcharge])

  rows.push([])
  rows.push(['TOTAL TAX LIABILITY', '', '', t.totalLiability])
  rows.push([])
  rows.push(['Key metrics'])
  rows.push(['Effective tax rate',     `${t.effectiveRate}%`])
  rows.push(['Marginal tax rate',      `${t.marginalRate}%`])
  rows.push(['Net income (after tax)', t.netIncome])

  if (data.notes) {
    rows.push([])
    rows.push(['Notes', data.notes])
  }
  if (t.regime.note) {
    rows.push([])
    rows.push(['Regime note', t.regime.note])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 38 }, { wch: 14 }, { wch: 16 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Tax Calc')

  const fileName = `${(data.taxpayerName || 'tax-calculation').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-tax.xlsx`
  XLSX.writeFile(wb, fileName)
}
