import * as XLSX from 'xlsx'
import { computeBreakEven, buildScheduleRows, defaultFileBase, findScenario } from './compute'

export function generateBreakEvenXlsx(data) {
  const r = computeBreakEven(data)
  const rows = buildScheduleRows(data)

  const summary = [
    ['Label',                   data.label || ''],
    ['Scenario',                findScenario(data.scenarioId).label],
    ['Currency',                data.currencyCode || 'USD'],
    ['Unit name',               data.unitName || 'units'],
    [],
    ['INPUTS'],
    ['Price per unit',          r.price],
    ['Variable cost / unit',    r.variable],
    ['Fixed costs',             r.fixed],
    ['Expected volume',         r.expectedUnits],
    ['Target profit',           Number(data.targetProfit) || 0],
    [],
    ['OUTCOMES'],
    ['Contribution / unit',     r.contribution],
    ['Contribution margin %',   r.contributionMarginPct],
    ['Break-even units',        r.breakEvenUnits],
    ['Break-even revenue',      r.breakEvenRevenue],
    ['Units to hit target',     r.targetUnits],
    ['Revenue to hit target',   r.targetRevenue],
    ['Expected revenue',        r.expectedRevenue],
    ['Expected variable cost',  r.expectedVariableCost],
    ['Expected contribution',   r.expectedContribution],
    ['Expected profit',         r.expectedProfit],
    ['Margin of safety units',  r.marginOfSafetyUnits],
    ['Margin of safety rev.',   r.marginOfSafetyRevenue],
    ['Margin of safety %',      r.marginOfSafetyPct],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(summary)
  ws1['!cols'] = [{ wch: 26 }, { wch: 18 }]

  const ladder = [
    ['Units', 'Revenue', 'Variable cost', 'Contribution', 'Profit'],
    ...rows.map((x) => [x.units, x.revenue, x.variableTotal, x.contribution, x.profit]),
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(ladder)
  ws2['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary')
  XLSX.utils.book_append_sheet(wb, ws2, 'Scenario ladder')
  XLSX.writeFile(wb, `${defaultFileBase(data)}.xlsx`)
}
