import * as XLSX from 'xlsx'
import {
  formatDate,
  findDnStatus, findTransportMode, findPackageType,
  computeTotals,
} from './compute'

export function generateDeliveryNoteXlsx(data) {
  const status = findDnStatus(data.statusId)
  const mode = findTransportMode(data.transportModeId)
  const pkgType = findPackageType(data.packageTypeId)
  const totals = computeTotals(data)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Delivery Note'],
    [],
    ['DN #',           data.dnNumber || ''],
    ['Date',           formatDate(data.dnDate) || ''],
    ['PO ref',         data.poRef || ''],
    ['Invoice ref',    data.invoiceRef || ''],
    ['Dispatch date',  formatDate(data.dispatchDate) || ''],
    ['Expected date',  formatDate(data.expectedDate) || ''],
    ['Status',         status.label],
    [],
    ['Transport mode', mode.label],
    ['Vehicle / AWB',  data.vehicleNo || data.awb || ''],
    ['Driver',         data.driverName || ''],
    ['Driver phone',   data.driverPhone || ''],
    [],
    ['From',           data.from?.companyName || ''],
    ['Ship from',      data.shipFrom?.location || ''],
    [],
    ['Consignee',      data.to?.companyName || ''],
    ['Consignee contact', data.to?.contactName || ''],
    [],
    ['Package type',   pkgType.label],
    ['Package count',  data.packageCount || ''],
    ['Gross weight',   data.grossWeight || ''],
    ['Dimensions',     data.dimensions || ''],
    [],
    ['Total ordered',    totals.totalOrdered],
    ['Total dispatched', totals.totalDispatched],
    ['Total pending',    totals.totalPending],
    ['Total weight',     totals.totalWeight],
    ['Fully dispatched', totals.fullyDispatched ? 'Yes' : 'No'],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 28 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Line items */
  const itemRows = [
    ['#', 'SKU', 'Description', 'Batch', 'Qty ordered', 'Qty dispatched', 'Qty pending', 'Unit', 'Unit weight', 'Total weight'],
    ...totals.lines.map((l, i) => [
      i + 1, l.sku || '', l.description || '', l.batchNo || '',
      l.qtyOrdered, l.qtyDispatched, l.qtyPending,
      l.unit || 'ea', l.weight, l.totalWeight,
    ]),
    [],
    ['TOTAL', '', '', '', totals.totalOrdered, totals.totalDispatched, totals.totalPending, '', '', totals.totalWeight],
  ]
  const wsItems = XLSX.utils.aoa_to_sheet(itemRows)
  wsItems['!cols'] = [
    { wch: 4 }, { wch: 14 }, { wch: 34 }, { wch: 12 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, wsItems, 'Pack list')

  const fileName = `delivery-note-${(data.dnNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
