import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findReportPurpose,
  computeSummary, buildTypeSummary, buildJurisdictionSummary, buildOverdueList,
} from './compute'

export function generateTaxSummaryReportXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findReportPurpose(data.purposeId)
  const result = computeSummary(data)
  const { rows, totals, statusCounts, overdueBalance, pendingBalance } = result
  const typeSummary = buildTypeSummary(rows)
  const jurisdictionSummary = buildJurisdictionSummary(rows)
  const overdueList = buildOverdueList(rows)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Tax Summary Report'],
    [],
    ['Title',          data.reportTitle || ''],
    ['Reference',      data.reference || ''],
    ['Entity',         data.entityName || ''],
    ['Period',         data.periodLabel || ''],
    ['Purpose',        purpose.label],
    [],
    ['Tax collected',  totals.collected, cur.code],
    ['Tax owed',       totals.owed,      cur.code],
    ['Remitted',       totals.remitted,  cur.code],
    ['Outstanding',    totals.balance,   cur.code],
    [],
    ['Total obligations', rows.length],
    ['Overdue',        statusCounts.overdue || 0],
    ['Overdue balance', overdueBalance,  cur.code],
    ['Pending',        (statusCounts.pending || 0) + (statusCounts.partial || 0)],
    ['Pending balance', pendingBalance,  cur.code],
    ['Paid / filed',   (statusCounts.paid || 0) + (statusCounts.filed || 0)],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Obligations */
  const obligationRows = [
    ['#', 'Tax type', 'Jurisdiction', 'Period', 'Due date', 'Reference',
     'Collected', 'Owed', 'Remitted', 'Balance', 'Status'],
    ...rows.map((r, i) => [
      i + 1, r.taxTypeLabel, r.jurisdiction || '', r.period || '',
      formatDate(r.dueDate) || '', r.reference || '',
      r.collected, r.owed, r.remitted, r.balance, r.statusLabel,
    ]),
    [],
    ['TOTAL', '', '', '', '', '',
     totals.collected, totals.owed, totals.remitted, totals.balance, ''],
  ]
  const wsObl = XLSX.utils.aoa_to_sheet(obligationRows)
  wsObl['!cols'] = [
    { wch: 4 }, { wch: 24 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsObl, 'Obligations')

  /* By type */
  const typeRows = [
    ['Tax type', 'Count', 'Collected', 'Owed', 'Remitted', 'Balance'],
    ...typeSummary.map((t) => [t.label, t.count, t.collected, t.owed, t.remitted, t.balance]),
  ]
  const wsType = XLSX.utils.aoa_to_sheet(typeRows)
  wsType['!cols'] = [{ wch: 24 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsType, 'By Type')

  /* By jurisdiction */
  const jurRows = [
    ['Jurisdiction', 'Count', 'Owed', 'Remitted', 'Balance'],
    ...jurisdictionSummary.map((j) => [j.jurisdiction, j.count, j.owed, j.remitted, j.balance]),
  ]
  const wsJur = XLSX.utils.aoa_to_sheet(jurRows)
  wsJur['!cols'] = [{ wch: 24 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsJur, 'By Jurisdiction')

  /* Overdue */
  if (overdueList.length > 0) {
    const overdueRows = [
      ['Tax type', 'Jurisdiction', 'Due date', 'Reference', 'Balance'],
      ...overdueList.map((r) => [r.taxTypeLabel, r.jurisdiction || '', formatDate(r.dueDate) || '', r.reference || '', r.balance]),
    ]
    const wsOver = XLSX.utils.aoa_to_sheet(overdueRows)
    wsOver['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsOver, 'Overdue')
  }

  const fileName = `tax-summary-report-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
