import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findStatus, findFrequency, findPaymentTerm, findEndCondition, findAutoSend,
  projectSchedule,
} from './compute'

export function generateRecurringInvoiceXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const status = findStatus(data.statusId)
  const freq   = findFrequency(data.frequencyId)
  const term   = findPaymentTerm(data.paymentTermId)
  const endCond = findEndCondition(data.endConditionId)
  const autoSend = findAutoSend(data.autoSendModeId)
  const projection = projectSchedule(data, 200)  // full series for the spreadsheet
  const totals = projection.totals

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Recurring Invoice Schedule'],
    [],
    ['Schedule #',         data.scheduleId || ''],
    ['Status',             status.label],
    ['Frequency',          freq.label],
    ['Payment terms',      term.label],
    ['Start date',         formatDate(data.startDate) || ''],
    ['End condition',      endCond.label],
    ['End date',           formatDate(data.endDate) || ''],
    ['Occurrence count',   data.occurrenceCount || ''],
    ['Auto-send',          autoSend.label],
    [],
    ['Currency',           cur.code],
    ['From',               data.from?.businessName || data.from?.name || ''],
    ['Bill to',            data.to?.companyName || ''],
    [],
    ['Per-cycle subtotal', totals.subtotal,    cur.code],
    ['Per-cycle discount', totals.discount,    cur.code],
    ['Per-cycle tax',      totals.totalTax,    cur.code],
    ['Per-cycle total',    totals.grandTotal,  cur.code],
    [],
    ['Annualised revenue',     projection.annualisedRevenue || 0, cur.code],
    ['Planned occurrences',    projection.plannedCount == null ? 'Open-ended' : projection.plannedCount],
    ['Lifetime projected',     projection.totalProjectedRevenue == null ? 'Open-ended' : projection.totalProjectedRevenue, cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Template line items (single cycle) */
  const itemRows = [
    ['#', 'Description', 'Qty', 'Rate', 'Taxable', 'Tax %', 'Tax', 'Total'],
    ...totals.lines.map((l, i) => [
      i + 1, l.description || '',
      Number(l.qty) || 0, Number(l.rate) || 0,
      l.taxable ? 'Yes' : 'No',
      Number(l.taxPct) || 0, l.tax, l.total,
    ]),
    [],
    ['TOTAL', '', '', '', '', '', totals.totalTax, totals.grandTotal],
  ]
  const wsItems = XLSX.utils.aoa_to_sheet(itemRows)
  wsItems['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsItems, 'Template')

  /* Projected schedule */
  const sched = projection.occurrences
  const schedRows = [
    ['#', 'Invoice #', 'Issue date', 'Due date', 'Amount'],
    ...sched.map((o) => [o.n, o.invoiceNumber, o.issueDate, o.dueDate, o.total]),
  ]
  if (sched.length > 0) {
    const totalAmt = sched.reduce((s, o) => s + o.total, 0)
    schedRows.push([], ['TOTAL (shown)', '', '', '', Math.round(totalAmt * 100) / 100])
  }
  const wsSched = XLSX.utils.aoa_to_sheet(schedRows)
  wsSched['!cols'] = [{ wch: 4 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsSched, 'Schedule')

  const fileName = `recurring-invoice-${(data.scheduleId || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
