import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findTbPurpose, computeTrialBalance, buildTypeSummary, groupAccountsByType,
} from './compute'

export function generateTrialBalanceXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findTbPurpose(data.purposeId)
  const { rows, totals, difference, inBalance } = computeTrialBalance(data.accounts)
  const typeSummary = buildTypeSummary(rows)
  const grouped = groupAccountsByType(rows)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Trial Balance'],
    [],
    ['Title',         data.reportTitle || ''],
    ['Reference',     data.reference || ''],
    ['Entity',        data.entityName || ''],
    ['Period',        data.periodLabel || ''],
    ['Purpose',       purpose.label],
    [],
    ['Total debits',  totals.debit,  cur.code],
    ['Total credits', totals.credit, cur.code],
    ['Difference',    difference,    cur.code],
    ['Status',        inBalance ? 'In balance' : 'Out of balance'],
    [],
    ['Accounts',      rows.length],
    ['Prepared by',   data.preparedByName || ''],
    ['Approved by',   data.approvedByName || ''],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Accounts table */
  const accountRows = [
    ['Code', 'Account name', 'Type', 'Normal side', 'Debit', 'Credit', 'Net'],
    ...rows.map((r) => [
      r.code || '', r.name || '', r.typeLabel, r.normalSide,
      r.debit, r.credit, r.net,
    ]),
    [],
    ['TOTALS', '', '', '', totals.debit, totals.credit, difference],
  ]
  const wsAcc = XLSX.utils.aoa_to_sheet(accountRows)
  wsAcc['!cols'] = [
    { wch: 10 }, { wch: 38 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsAcc, 'Accounts')

  /* By type */
  const typeRows = [
    ['Type', 'Accounts', 'Debit', 'Credit', 'Net'],
    ...typeSummary.map((t) => [t.label, t.count, t.debit, t.credit, t.net]),
  ]
  const wsType = XLSX.utils.aoa_to_sheet(typeRows)
  wsType['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsType, 'By Type')

  /* Grouped (working trial balance) */
  const groupRows = [['Code', 'Account name', 'Type', 'Debit', 'Credit']]
  for (const g of grouped) {
    groupRows.push([`${g.label.toUpperCase()} (${g.accounts.length})`, '', '', '', ''])
    for (const a of g.accounts) {
      groupRows.push([a.code || '', a.name || '', a.typeLabel, a.debit, a.credit])
    }
    groupRows.push(['', `Subtotal ${g.label}`, '', g.subtotalDebit, g.subtotalCredit])
    groupRows.push([])
  }
  groupRows.push(['', 'GRAND TOTAL', '', totals.debit, totals.credit])
  const wsGroup = XLSX.utils.aoa_to_sheet(groupRows)
  wsGroup['!cols'] = [{ wch: 10 }, { wch: 38 }, { wch: 12 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsGroup, 'By Type · Detail')

  const fileName = `trial-balance-${(data.reference || purpose.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
