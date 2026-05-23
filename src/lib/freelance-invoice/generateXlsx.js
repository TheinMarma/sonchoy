import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findInvoiceStatus, findRateType, findPaymentTerm,
  computeTotals, buildTaxSummary, buildRateTypeSummary,
} from './compute'

export function generateFreelanceInvoiceXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const status = findInvoiceStatus(data.statusId)
  const term = findPaymentTerm(data.paymentTermId)
  const totals = computeTotals(data)
  const taxSummary = buildTaxSummary(totals.lines)
  const rtSummary  = buildRateTypeSummary(totals.lines)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Freelance Invoice'],
    [],
    ['Invoice #',     data.invoiceNumber || ''],
    ['Issue date',    formatDate(data.invoiceDate) || ''],
    ['Due date',      formatDate(totals.dueDate) || ''],
    ['Terms',         term.label],
    ['Project',       data.projectName || ''],
    ['PO ref',        data.poRef || ''],
    ['Status',        status.label],
    [],
    ['From',          data.from?.businessName || data.from?.name || ''],
    ['From email',    data.from?.email || ''],
    ['From tax ID',   data.from?.taxId || ''],
    [],
    ['Bill to',       data.to?.companyName || data.to?.name || ''],
    ['Contact',       data.to?.contactName || ''],
    ['Email',         data.to?.email || ''],
    [],
    ['Hours billed',  totals.totalHours],
    ['Days billed',   totals.totalDays],
    [],
    ['Subtotal',      totals.subtotal,   cur.code],
    ['Discount',      totals.discount,   cur.code],
    ['Tax',           totals.totalTax,   cur.code],
    ['Grand total',   totals.grandTotal, cur.code],
    ['Advance',       totals.advance,    cur.code],
    ['Amount paid',   totals.amountPaid, cur.code],
    ['Balance due',   totals.balanceDue, cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Line items */
  const itemRows = [
    ['#', 'Description', 'Project code', 'Type', 'Qty', 'Unit', 'Rate', 'Taxable', 'Tax %', 'Tax', 'Total'],
    ...totals.lines.map((l, i) => {
      const rt = findRateType(l.rateTypeId)
      return [
        i + 1, l.description || '', l.projectCode || '',
        rt.label, Number(l.qty) || 0, rt.unit,
        Number(l.rate) || 0,
        l.taxable ? 'Yes' : 'No',
        Number(l.taxPct) || 0, l.tax, l.total,
      ]
    }),
    [],
    ['TOTAL', '', '', '', '', '', '', '', '', totals.totalTax, totals.grandTotal],
  ]
  const wsItems = XLSX.utils.aoa_to_sheet(itemRows)
  wsItems['!cols'] = [
    { wch: 4 }, { wch: 36 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
    { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsItems, 'Line items')

  /* Tax summary */
  if (taxSummary.length > 0) {
    const taxRows = [
      ['Rate %', 'Count', 'Taxable', 'Tax'],
      ...taxSummary.map((t) => [t.ratePct, t.count, t.taxable, t.tax]),
    ]
    const wsTax = XLSX.utils.aoa_to_sheet(taxRows)
    wsTax['!cols'] = [{ wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsTax, 'Tax summary')
  }

  /* Rate-type summary */
  if (rtSummary.length > 0) {
    const rtRows = [
      ['Rate type', 'Lines', 'Qty', 'Total'],
      ...rtSummary.map((r) => [r.label, r.count, r.qty, r.total]),
    ]
    const wsRt = XLSX.utils.aoa_to_sheet(rtRows)
    wsRt['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsRt, 'By rate type')
  }

  const fileName = `freelance-invoice-${(data.invoiceNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
