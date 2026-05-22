import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findQuoteStatus,
  computeTotals, buildTaxSummary,
} from './compute'

export function generateQuotationXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const status = findQuoteStatus(data.statusId)
  const totals = computeTotals(data)
  const taxSummary = buildTaxSummary(totals.lines)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Quotation'],
    [],
    ['Quote #',       data.quoteNumber || ''],
    ['Date',          formatDate(data.quoteDate) || ''],
    ['Valid until',   formatDate(totals.expiryDate) || ''],
    ['Validity days', totals.validityDays],
    ['PO #',          data.poNumber || ''],
    ['Status',        status.label],
    [],
    ['From',          data.from?.companyName || ''],
    ['From contact',  data.from?.email || ''],
    [],
    ['To',            data.to?.companyName || ''],
    ['Contact',       data.to?.contactName || ''],
    ['Email',         data.to?.email || ''],
    [],
    ['Subtotal',      totals.subtotal,      cur.code],
    ['Line discounts', totals.lineDiscounts, cur.code],
    ['Quote discount', totals.quoteDiscount, cur.code],
    ['Tax',           totals.totalTax,      cur.code],
    ['Shipping',      totals.shipping,      cur.code],
    ['Adjustment',    totals.adjustment,    cur.code],
    ['TOTAL',         totals.grandTotal,    cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Line items */
  const itemRows = [
    ['#', 'Description', 'Qty', 'Rate', 'Discount', 'Taxable', 'Tax %', 'Tax', 'Total'],
    ...totals.lines.map((l, i) => [
      i + 1, l.description || '', Number(l.qty) || 0, Number(l.rate) || 0,
      l.discount, l.discounted, Number(l.taxPct) || 0, l.tax, l.total,
    ]),
    [],
    ['TOTAL', '', '', '', totals.lineDiscounts, totals.subtotal, '', totals.totalTax, totals.grandTotal],
  ]
  const wsItems = XLSX.utils.aoa_to_sheet(itemRows)
  wsItems['!cols'] = [
    { wch: 4 }, { wch: 38 }, { wch: 8 }, { wch: 12 },
    { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
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

  const fileName = `quotation-${(data.quoteNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
