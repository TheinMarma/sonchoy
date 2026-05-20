/* SheetJS-backed XLSX export for parsed bank statements.
   Three sheets: Transactions, Summary, Confidence. */

import * as XLSX from 'xlsx'

function fmt(value) {
  if (value == null || value === '') return ''
  return value
}

export function buildStatementWorkbook(stmt) {
  const wb = XLSX.utils.book_new()

  /* ---- Transactions ---- */
  const txRows = [
    ['#', 'Date', 'Description', 'Debit', 'Credit', 'Balance'],
    ...stmt.transactions.map((t, i) => [
      i + 1,
      fmt(t.date),
      fmt(t.description),
      fmt(t.debit),
      fmt(t.credit),
      fmt(t.balance),
    ]),
  ]
  if (stmt.transactions.length === 0) {
    txRows.push(['', '', 'No transactions detected — verify the source PDF', '', '', ''])
  } else {
    txRows.push([])
    txRows.push(['', '', 'Totals', fmt(stmt.totalDebit), fmt(stmt.totalCredit), ''])
  }
  const txSheet = XLSX.utils.aoa_to_sheet(txRows)
  txSheet['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 56 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions')

  /* ---- Summary ---- */
  const summary = [
    ['Field', 'Value'],
    ['Bank',            fmt(stmt.bank)],
    ['Account holder',  fmt(stmt.accountHolder)],
    ['Account number',  fmt(stmt.accountNumber)],
    ['Branch',          fmt(stmt.branch)],
    ['Currency',        fmt(stmt.currency)],
    ['Statement period', fmt(stmt.period)],
    ['Period start',    fmt(stmt.startDate)],
    ['Period end',      fmt(stmt.endDate)],
    [],
    ['Opening balance', fmt(stmt.openingBalance)],
    ['Total credits',   fmt(stmt.totalCredit)],
    ['Total debits',    fmt(stmt.totalDebit)],
    ['Closing balance', fmt(stmt.closingBalance)],
    [],
    ['Transactions',    stmt.transactions.length],
    ['Source file',     fmt(stmt.fileName)],
    ['Extracted by',    'Sonchoy · Bank Statement PDF to Excel'],
    ['Generated at',    new Date().toISOString()],
  ]
  const sumSheet = XLSX.utils.aoa_to_sheet(summary)
  sumSheet['!cols'] = [{ wch: 22 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Summary')

  /* ---- Confidence ---- */
  const presence = (v) => (v == null || v === '' ? 'missing' : 'detected')
  const confRows = [
    ['Field', 'Status', 'Value'],
    ['Bank',             presence(stmt.bank),             fmt(stmt.bank)],
    ['Account holder',   presence(stmt.accountHolder),    fmt(stmt.accountHolder)],
    ['Account number',   presence(stmt.accountNumber),    fmt(stmt.accountNumber)],
    ['Currency',         presence(stmt.currency),         fmt(stmt.currency)],
    ['Statement period', presence(stmt.period),           fmt(stmt.period)],
    ['Opening balance',  presence(stmt.openingBalance),   fmt(stmt.openingBalance)],
    ['Closing balance',  presence(stmt.closingBalance),   fmt(stmt.closingBalance)],
    ['Transactions',     stmt.transactions.length > 0 ? 'detected' : 'missing', `${stmt.transactions.length} rows`],
    [],
    ['Overall confidence', `${stmt.confidence}%`, ''],
  ]
  const confSheet = XLSX.utils.aoa_to_sheet(confRows)
  confSheet['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, confSheet, 'Confidence')

  /* ---- Raw Text ---- */
  if (stmt.rawText) {
    const rawLines = String(stmt.rawText).split('\n').map((l, i) => [i + 1, l])
    rawLines.unshift(['Line', 'Text'])
    const rawSheet = XLSX.utils.aoa_to_sheet(rawLines)
    rawSheet['!cols'] = [{ wch: 6 }, { wch: 100 }]
    XLSX.utils.book_append_sheet(wb, rawSheet, 'Raw Text')
  }

  return wb
}

export function writeWorkbookBlob(wb) {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function downloadWorkbook(wb, filename = 'bank-statement.xlsx') {
  const blob = writeWorkbookBlob(wb)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function suggestedFilename(originalName) {
  if (!originalName) return 'bank-statement.xlsx'
  const stem = originalName.replace(/\.pdf$/i, '').replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 80)
  return `${stem || 'bank-statement'}.xlsx`
}
