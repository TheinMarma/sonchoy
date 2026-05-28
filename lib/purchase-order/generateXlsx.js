import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findPoStatus, findPoType, findDeliveryTerm, findPaymentTerm,
  computeTotals, buildTaxSummary,
} from './compute'

export function generatePurchaseOrderXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const status = findPoStatus(data.statusId)
  const poType = findPoType(data.poTypeId)
  const deliveryTerm = findDeliveryTerm(data.deliveryTermId)
  const paymentTerm = findPaymentTerm(data.paymentTermId)
  const totals = computeTotals(data)
  const taxSummary = buildTaxSummary(totals.lines)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Purchase Order'],
    [],
    ['PO #',          data.poNumber || ''],
    ['Date',          formatDate(data.poDate) || ''],
    ['Required by',   formatDate(data.requiredDate) || ''],
    ['Quote ref',     data.quoteRef || ''],
    ['Type',          poType.label],
    ['Status',        status.label],
    [],
    ['Delivery terms', deliveryTerm.label],
    ['Payment terms',  paymentTerm.label],
    ['Ship via',       data.shipVia || ''],
    [],
    ['Buyer',         data.buyer?.companyName || ''],
    ['Buyer email',   data.buyer?.email || ''],
    [],
    ['Vendor',        data.vendor?.companyName || ''],
    ['Vendor contact', data.vendor?.contactName || ''],
    ['Vendor email',  data.vendor?.email || ''],
    [],
    ['Ship to',       data.shipTo?.companyName || ''],
    ['Ship contact',  data.shipTo?.contactName || ''],
    [],
    ['Subtotal',      totals.subtotal,      cur.code],
    ['Line discounts', totals.lineDiscounts, cur.code],
    ['PO discount',    totals.poDiscount,    cur.code],
    ['Tax',           totals.totalTax,      cur.code],
    ['Shipping',      totals.shipping,      cur.code],
    ['Adjustment',    totals.adjustment,    cur.code],
    ['PO TOTAL',      totals.grandTotal,    cur.code],
    ['Total qty',     totals.totalQty],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 26 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Line items */
  const itemRows = [
    ['#', 'SKU', 'Description', 'Qty', 'Unit', 'Rate', 'Discount', 'Taxable', 'Tax %', 'Tax', 'Total'],
    ...totals.lines.map((l, i) => [
      i + 1, l.sku || '', l.description || '',
      Number(l.qty) || 0, l.unit || 'ea',
      Number(l.rate) || 0, l.discount,
      l.discounted, Number(l.taxPct) || 0, l.tax, l.total,
    ]),
    [],
    ['TOTAL', '', '', totals.totalQty, '', '', totals.lineDiscounts, totals.subtotal, '', totals.totalTax, totals.grandTotal],
  ]
  const wsItems = XLSX.utils.aoa_to_sheet(itemRows)
  wsItems['!cols'] = [
    { wch: 4 }, { wch: 14 }, { wch: 34 }, { wch: 8 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
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

  const fileName = `purchase-order-${(data.poNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
