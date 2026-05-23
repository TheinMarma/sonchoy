import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findExportMode, findPageSize, findSortOption,
  parseRows, sortRows, totalForRow, computeBatchTotals, buildStatusSummary,
} from './compute'

export function generateBatchManifestXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const mode = findExportMode(data.exportModeId)
  const pageSize = findPageSize(data.pageSizeId)
  const sortOpt = findSortOption(data.sortId)

  const parsed = parseRows(data.csvText, data.parseFormatId)
  const rows = sortRows(parsed.rows, sortOpt.id)
  const totals = computeBatchTotals(rows)
  const statusSummary = buildStatusSummary(rows)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Invoice Batch'],
    [],
    ['Batch #',       data.batchId || ''],
    ['Prepared',      formatDate(data.batchDate) || ''],
    ['Mode',          mode.label],
    ['Page size',     pageSize.label],
    ['Sort',          sortOpt.label],
    [],
    ['Company',       data.company?.name || ''],
    ['Tax ID',        data.company?.taxId || ''],
    [],
    ['Invoices',      totals.invoices],
    ['Subtotal',      totals.subtotal, cur.code],
    ['Tax',           totals.tax,      cur.code],
    ['Batch total',   totals.total,    cur.code],
    [],
    ['Parse errors',  parsed.errors.length],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Manifest */
  const manifestRows = [
    ['#', 'Invoice #', 'Issue date', 'Due date', 'Client', 'Description', 'Qty', 'Rate', 'Tax %', 'Status', 'Total'],
    ...rows.map((r, i) => [
      i + 1, r.invoiceNumber, formatDate(r.issueDate) || '', formatDate(r.dueDate) || '',
      r.clientName, r.description,
      Number(r.qty) || 0, Number(r.rate) || 0, Number(r.taxPct) || 0,
      r.status || 'draft', totalForRow(r),
    ]),
    [],
    ['TOTAL', '', '', '', '', '', '', '', '', '', totals.total],
  ]
  const wsManifest = XLSX.utils.aoa_to_sheet(manifestRows)
  wsManifest['!cols'] = [
    { wch: 4 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 34 },
    { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsManifest, 'Manifest')

  /* Status summary */
  if (statusSummary.length > 0) {
    const sRows = [
      ['Status', 'Count', 'Amount'],
      ...statusSummary.map((s) => [s.status, s.count, s.total]),
    ]
    const wsStatus = XLSX.utils.aoa_to_sheet(sRows)
    wsStatus['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsStatus, 'By status')
  }

  /* Errors */
  if (parsed.errors.length > 0) {
    const eRows = [['Parse errors'], ...parsed.errors.map((e) => [e])]
    const wsErr = XLSX.utils.aoa_to_sheet(eRows)
    wsErr['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsErr, 'Errors')
  }

  const fileName = `invoice-batch-${(data.batchId || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
