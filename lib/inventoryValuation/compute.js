/* ------------------------------------------------------------------ */
/*  Inventory Valuation Report — cost / retail / moving-average        */
/* ------------------------------------------------------------------ */

import {
  CURRENCIES, findCurrency, formatMoney, formatNumber, formatDate, todayISO,
} from '../invoice/format'

export { CURRENCIES, findCurrency, formatMoney, formatNumber, formatDate, todayISO }

export const VALUATION_METHODS = [
  { id: 'cost',     label: 'Cost (unit cost × qty)' },
  { id: 'retail',   label: 'Retail (price × qty)' },
  { id: 'moving',   label: 'Moving average' },
  { id: 'lcnr',     label: 'Lower of cost or NRV' },
]
export function findValuationMethod(id) { return VALUATION_METHODS.find((m) => m.id === id) || VALUATION_METHODS[0] }

export const STOCK_STATUSES = [
  { id: 'in_stock',  label: 'In stock' },
  { id: 'low',       label: 'Low' },
  { id: 'reorder',   label: 'Reorder' },
  { id: 'out',       label: 'Out of stock' },
  { id: 'damaged',   label: 'Damaged' },
]
export function findStockStatus(id) { return STOCK_STATUSES.find((s) => s.id === id) || STOCK_STATUSES[0] }

let uid = 0
export function newItem(overrides = {}) {
  uid += 1
  return {
    id:        `it-${Date.now()}-${uid}`,
    sku:       '',
    name:      '',
    category:  '',
    location:  '',
    qty:       0,
    unitCost:  0,
    unitPrice: 0,
    nrv:       0,
    status:    'in_stock',
    ...overrides,
  }
}

export const SAMPLE_DATA = {
  reportTitle:   'Inventory Valuation — December 2026',
  company:       'Sonchoy Mercantile Co.',
  reference:     'INV-VAL-2026-12',
  asOfDate:      todayISO(),
  warehouse:     'Main warehouse · Bay 04',
  currencyCode:  'USD',
  methodId:      'cost',
  items: [
    newItem({ sku: 'SKU-A1042', name: 'Hand-bound notebook', category: 'Stationery', location: 'A-04-03', qty: 240, unitCost: 9.50,  unitPrice: 25.00, nrv: 24.00, status: 'in_stock' }),
    newItem({ sku: 'SKU-B2210', name: 'Ceramic mug 12oz',    category: 'Drinkware',  location: 'B-02-11', qty: 86,  unitCost: 4.20,  unitPrice: 14.00, nrv: 14.00, status: 'in_stock' }),
    newItem({ sku: 'SKU-C3308', name: 'Linen tote bag',       category: 'Bags',       location: 'C-05-02', qty: 32,  unitCost: 7.10,  unitPrice: 22.00, nrv: 18.50, status: 'low' }),
    newItem({ sku: 'SKU-D0917', name: 'Brass bookmark',       category: 'Stationery', location: 'A-09-17', qty: 14,  unitCost: 2.30,  unitPrice: 9.00,  nrv: 9.00,  status: 'reorder' }),
    newItem({ sku: 'SKU-E5500', name: 'Vintage map print',    category: 'Wall art',   location: 'D-01-05', qty: 0,   unitCost: 11.50, unitPrice: 38.00, nrv: 35.00, status: 'out' }),
  ],
  notes: '',
}

function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0 }
function round2(n) { return Math.round((n || 0) * 100) / 100 }

export function valueItem(item, methodId) {
  const qty   = num(item.qty)
  const cost  = num(item.unitCost)
  const price = num(item.unitPrice)
  const nrv   = num(item.nrv) || price
  let unitValue
  switch (methodId) {
    case 'retail':  unitValue = price; break
    case 'moving':  unitValue = cost; break // moving-average over time would need ledger; use cost as proxy
    case 'lcnr':    unitValue = Math.min(cost, nrv); break
    case 'cost':
    default:        unitValue = cost
  }
  return {
    qty,
    unitCost:   cost,
    unitPrice:  price,
    nrv,
    unitValue:  round2(unitValue),
    totalValue: round2(qty * unitValue),
    totalCost:  round2(qty * cost),
    totalRetail: round2(qty * price),
    grossMargin: price > 0 ? round2(((price - cost) / price) * 100) : 0,
  }
}

export function computeTotals(items, methodId) {
  const valued = items.map((it) => ({ ...it, valuation: valueItem(it, methodId) }))
  const qty         = valued.reduce((a, x) => a + x.valuation.qty, 0)
  const totalValue  = round2(valued.reduce((a, x) => a + x.valuation.totalValue, 0))
  const totalCost   = round2(valued.reduce((a, x) => a + x.valuation.totalCost, 0))
  const totalRetail = round2(valued.reduce((a, x) => a + x.valuation.totalRetail, 0))
  const potentialMargin = totalRetail > 0 ? round2(((totalRetail - totalCost) / totalRetail) * 100) : 0
  const lines = valued.length
  const lowOrOut = valued.filter((x) => ['low', 'reorder', 'out'].includes(x.status)).length

  // Category breakdown
  const byCategory = {}
  valued.forEach((x) => {
    const k = x.category || 'Uncategorised'
    if (!byCategory[k]) byCategory[k] = { category: k, qty: 0, totalCost: 0, totalRetail: 0, totalValue: 0 }
    byCategory[k].qty         += x.valuation.qty
    byCategory[k].totalCost   = round2(byCategory[k].totalCost   + x.valuation.totalCost)
    byCategory[k].totalRetail = round2(byCategory[k].totalRetail + x.valuation.totalRetail)
    byCategory[k].totalValue  = round2(byCategory[k].totalValue  + x.valuation.totalValue)
  })
  const categories = Object.values(byCategory).sort((a, b) => b.totalValue - a.totalValue)

  return { valued, qty, totalValue, totalCost, totalRetail, potentialMargin, lines, lowOrOut, categories }
}

export function defaultFileBase(data) {
  const base = (data.reportTitle || 'inventory-valuation').toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'inventory-valuation'
  return `${base}-${todayISO()}`
}
