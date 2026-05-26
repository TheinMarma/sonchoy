import * as XLSX from 'xlsx'
import { computeTotals, defaultFileBase, findValuationMethod, findStockStatus } from './compute'

export function generateInventoryValuationXlsx(data) {
  const T = computeTotals(data.items, data.methodId)
  const method = findValuationMethod(data.methodId)

  const summary = [
    ['Report title',        data.reportTitle || ''],
    ['Company',             data.company || ''],
    ['Reference',           data.reference || ''],
    ['As of',               data.asOfDate || ''],
    ['Warehouse',           data.warehouse || ''],
    ['Currency',            data.currencyCode || ''],
    ['Valuation method',    method.label],
    [],
    ['Lines',               T.lines],
    ['Total quantity',      T.qty],
    ['Total cost',          T.totalCost],
    ['Total retail',        T.totalRetail],
    ['Total value',         T.totalValue],
    ['Potential margin %',  T.potentialMargin],
    ['Low/Out lines',       T.lowOrOut],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(summary)
  ws1['!cols'] = [{ wch: 22 }, { wch: 22 }]

  const items = [
    ['SKU', 'Name', 'Category', 'Location', 'Status', 'Qty', 'Unit cost', 'Unit price', 'NRV', 'Unit value', 'Total cost', 'Total retail', 'Total value', 'Gross margin %'],
    ...T.valued.map((it) => [
      it.sku, it.name, it.category, it.location, findStockStatus(it.status).label,
      it.valuation.qty, it.valuation.unitCost, it.valuation.unitPrice, it.valuation.nrv,
      it.valuation.unitValue, it.valuation.totalCost, it.valuation.totalRetail, it.valuation.totalValue, it.valuation.grossMargin,
    ]),
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(items)
  ws2['!cols'] = [{ wch: 12 }, { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]

  const cats = [
    ['Category', 'Qty', 'Total cost', 'Total retail', 'Total value'],
    ...T.categories.map((c) => [c.category, c.qty, c.totalCost, c.totalRetail, c.totalValue]),
  ]
  const ws3 = XLSX.utils.aoa_to_sheet(cats)
  ws3['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary')
  XLSX.utils.book_append_sheet(wb, ws2, 'Items')
  XLSX.utils.book_append_sheet(wb, ws3, 'Categories')
  XLSX.writeFile(wb, `${defaultFileBase(data)}.xlsx`)
}
