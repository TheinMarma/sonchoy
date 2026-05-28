import * as XLSX from 'xlsx'
import { findCurrency, computeGL, describePeriod } from './compute'

export function generateGLReportXlsx(data) {
  const t = computeGL(data)
  const cur = findCurrency(data.currency)
  const period = describePeriod(data)

  const wb = XLSX.utils.book_new()

  /* ---- Journal sheet ---- */
  const sortedEntries = [...t.entries].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const journalRows = [
    [`General Ledger — ${data.companyName || 'Your Company'}`],
    [`Period: ${period || '—'}`, '', `Currency: ${cur.code}`],
    [],
    ['#', 'Date', 'Reference', 'Account', 'Description', 'Debit', 'Credit'],
    ...sortedEntries.map((e, i) => [
      i + 1,
      e.date || '',
      e.reference || '',
      e.account || '',
      e.description || '',
      Number(e.debit) || 0,
      Number(e.credit) || 0,
    ]),
    [],
    ['', '', '', '', 'TOTALS', t.totalDebits, t.totalCredits],
    ['', '', '', '', 'BALANCE CHECK', t.isBalanced ? 'BALANCED ✓' : `OUT BY ${t.balanceDiff}`],
  ]
  const journalSheet = XLSX.utils.aoa_to_sheet(journalRows)
  journalSheet['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 44 },
    { wch: 14 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, journalSheet, 'Journal')

  /* ---- Trial Balance sheet ---- */
  const tbRows = [
    [`Trial Balance — ${data.companyName || 'Your Company'}`],
    [`Period: ${period || '—'}`, '', `Currency: ${cur.code}`],
    [],
    ['Account', 'Type', 'Opening', 'Debits', 'Credits', 'Closing'],
    ...t.perAccount.map((a) => [
      a.name,
      a.typeMeta.label,
      a.opening,
      a.debits,
      a.credits,
      a.closing,
    ]),
    [],
    ['', '', '', '', 'DEBIT-SIDE TOTAL',  t.tbDebit],
    ['', '', '', '', 'CREDIT-SIDE TOTAL', t.tbCredit],
    ['', '', '', '', 'CHECK', t.tbBalanced ? 'BALANCED ✓' : `OUT BY ${t.tbDiff}`],
  ]
  const tbSheet = XLSX.utils.aoa_to_sheet(tbRows)
  tbSheet['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, tbSheet, 'Trial Balance')

  /* ---- Summary sheet ---- */
  const sumRows = [
    ['Summary'],
    [],
    ['Total debits',  t.totalDebits],
    ['Total credits', t.totalCredits],
    ['# Entries',     t.countEntries],
    ['# Accounts',    t.countAccounts],
    ['Journal balanced', t.isBalanced ? 'Yes' : `No (diff ${t.balanceDiff})`],
    ['Trial balance balanced', t.tbBalanced ? 'Yes' : `No (diff ${t.tbDiff})`],
    [],
    ['By account type', 'Accounts', 'Debits', 'Credits'],
    ...t.byType.map((r) => [r.label, r.accounts, r.debits, r.credits]),
  ]
  if (data.notes) {
    sumRows.push([])
    sumRows.push(['Notes', data.notes])
  }
  const sumSheet = XLSX.utils.aoa_to_sheet(sumRows)
  sumSheet['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Summary')

  const fileName = `${(data.companyName || 'general-ledger').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-gl.xlsx`
  XLSX.writeFile(wb, fileName)
}
