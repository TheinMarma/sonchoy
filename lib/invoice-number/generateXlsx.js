import * as XLSX from 'xlsx'
import {
  findScheme, findFiscalStart, findPad, findSeparator, findCase,
  generateSeries, findDuplicates,
} from './compute'

export function generateInvoiceNumberXlsx(data) {
  const scheme = findScheme(data.schemeId)
  const fiscal = findFiscalStart(data.fiscalStartId)
  const pad    = findPad(data.padId)
  const sep    = findSeparator(data.separatorId)
  const cs     = findCase(data.caseId)
  const count = Math.max(1, Math.min(100, Number(data.previewCount) || 12))
  const series = generateSeries(data, count)
  const usedList = (data.usedNumbersText || '')
    .split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
  const dupes = new Set(findDuplicates(series, usedList))

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Invoice Numbering Scheme'],
    [],
    ['Scheme name',     data.schemeName || ''],
    ['Effective date',  data.issueDate || ''],
    ['Business',        data.businessName || ''],
    ['Tax ID',          data.businessTaxId || ''],
    ['Prepared by',     data.preparedBy || ''],
    [],
    ['Format',          scheme.label],
    ['Description',     scheme.desc],
    ['Prefix',          data.prefix || ''],
    ['Suffix',          data.suffix || ''],
    ['Separator',       sep.label],
    ['Pad length',      pad.label],
    ['Case',            cs.label],
    ['Starts at',       data.startNumber || 1],
    ['Fiscal year starts', fiscal.label],
    ['Client code',     data.clientCode || ''],
    [],
    ['Preview count',   series.length],
    ['Used numbers',    usedList.length],
    ['Conflicts',       dupes.size],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Series */
  const rows = [
    ['#', 'Invoice number', 'Conflict?'],
    ...series.map((s) => [s.index, s.number, dupes.has(s.number) ? 'YES' : '']),
  ]
  const wsSeries = XLSX.utils.aoa_to_sheet(rows)
  wsSeries['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, wsSeries, 'Series')

  /* Existing log (for cross-check) */
  if (usedList.length > 0) {
    const usedRows = [['Used invoice numbers'], ...usedList.map((n) => [n])]
    const wsUsed = XLSX.utils.aoa_to_sheet(usedRows)
    wsUsed['!cols'] = [{ wch: 28 }]
    XLSX.utils.book_append_sheet(wb, wsUsed, 'Used numbers')
  }

  const fileName = `invoice-numbering-${(data.schemeName || 'scheme').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
