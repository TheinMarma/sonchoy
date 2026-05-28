import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findSupplyType, findSheetPurpose,
  computeGstTotals, buildRateSummary, buildHsnSummary,
} from './compute'

export function generateGstSheetXlsx(data) {
  const cur = findCurrency(data.currency || 'INR')
  const purpose = findSheetPurpose(data.purposeId)
  const { rows, totals } = computeGstTotals(data.items, {
    gstRatePct: data.defaultGstRatePct,
    supplyTypeId: data.supplyTypeId,
  })
  const rateSummary = buildRateSummary(rows)
  const hsnSummary  = buildHsnSummary(rows)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['GST Calculation Sheet'],
    [],
    ['Title',         data.sheetTitle || ''],
    ['Reference',     data.sheetReference || ''],
    ['Purpose',       purpose.label],
    ['Period',        data.periodLabel || ''],
    ['Sheet date',    formatDate(data.sheetDate) || ''],
    [],
    ['Entity',        data.entity?.name || ''],
    ['GSTIN',         data.entity?.gstin || ''],
    ['Address',       data.entity?.address || ''],
    ['Place of supply', data.entity?.placeOfSupply || ''],
    [],
    ['Taxable value',     totals.taxable,     cur.code],
    ['CGST',              totals.cgst,        cur.code],
    ['SGST',              totals.sgst,        cur.code],
    ['IGST',              totals.igst,        cur.code],
    ['Cess',              totals.cessAmt,     cur.code],
    ['Total GST',         totals.totalTax,    cur.code],
    ['Line total',        totals.lineTotal,   cur.code],
    ['Reverse-charge GST', totals.reverseChargeTax, cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Line items */
  const itemRows = [
    ['#', 'HSN/SAC', 'Description', 'Qty', 'Unit price', 'Discount',
     'Taxable', 'GST %', 'CGST', 'SGST', 'IGST', 'Cess',
     'Total GST', 'Reverse charge', 'Line total'],
    ...rows.map((r, i) => [
      i + 1, r.hsn || '', r.description || '',
      Number(r.qty) || 0, Number(r.unitPrice) || 0, Number(r.discount) || 0,
      r.taxable, Number(r.gstRatePct) || 0,
      r.cgst, r.sgst, r.igst, r.cessAmt,
      r.totalTax, r.reverseCharge ? 'Yes' : '', r.lineTotal,
    ]),
    [],
    ['TOTALS', '', '', '', '', '',
     totals.taxable, '', totals.cgst, totals.sgst, totals.igst, totals.cessAmt,
     totals.totalTax, '', totals.lineTotal],
  ]
  const wsItems = XLSX.utils.aoa_to_sheet(itemRows)
  wsItems['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 32 },
    { wch: 8 }, { wch: 12 }, { wch: 10 },
    { wch: 12 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsItems, 'Line Items')

  /* Rate summary */
  const rateRows = [
    ['Rate (%)', 'Lines', 'Taxable', 'CGST', 'SGST', 'IGST', 'Cess', 'Total GST'],
    ...rateSummary.map((r) => [
      r.ratePct, r.count, r.taxable, r.cgst, r.sgst, r.igst, r.cessAmt, r.totalTax,
    ]),
  ]
  const wsRate = XLSX.utils.aoa_to_sheet(rateRows)
  wsRate['!cols'] = [{ wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsRate, 'By Rate')

  /* HSN summary */
  const hsnRows = [
    ['HSN/SAC', 'Description', 'Lines', 'Rate (%)', 'Taxable', 'Total GST'],
    ...hsnSummary.map((r) => [
      r.hsn, r.description, r.count, r.ratePct, r.taxable, r.totalTax,
    ]),
  ]
  const wsHsn = XLSX.utils.aoa_to_sheet(hsnRows)
  wsHsn['!cols'] = [{ wch: 12 }, { wch: 32 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsHsn, 'By HSN')

  const fileName = `gst-sheet-${(data.sheetReference || purpose.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
