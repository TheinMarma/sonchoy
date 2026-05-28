/* ------------------------------------------------------------------ */
/*  Delivery Note Generator — pack list, no pricing                     */
/* ------------------------------------------------------------------ */

import {
  formatNumber, formatDate, todayISO,
} from '../invoice/format'

export { formatNumber, formatDate, todayISO }

/* ---- Constants ---- */

export const DN_STATUSES = [
  { id: 'draft',     label: 'Draft',           tone: 'muted'   },
  { id: 'ready',     label: 'Ready to dispatch', tone: 'info'  },
  { id: 'dispatched', label: 'Dispatched',     tone: 'success' },
  { id: 'partial',   label: 'Partial dispatch', tone: 'warning' },
  { id: 'delivered', label: 'Delivered',       tone: 'success' },
  { id: 'returned',  label: 'Returned',        tone: 'danger'  },
]

export const TRANSPORT_MODES = [
  { id: 'road',    label: 'Road / surface' },
  { id: 'rail',    label: 'Rail' },
  { id: 'air',     label: 'Air freight' },
  { id: 'sea',     label: 'Sea freight' },
  { id: 'courier', label: 'Courier' },
  { id: 'self',    label: 'Self pickup' },
]

export const PACKAGE_TYPES = [
  { id: 'carton',  label: 'Carton' },
  { id: 'pallet',  label: 'Pallet' },
  { id: 'crate',   label: 'Crate' },
  { id: 'envelope', label: 'Envelope' },
  { id: 'bag',     label: 'Bag' },
  { id: 'drum',    label: 'Drum' },
  { id: 'mixed',   label: 'Mixed' },
]

/* ---- Helpers ---- */

export function findDnStatus(id) { return DN_STATUSES.find((s) => s.id === id) || DN_STATUSES[0] }
export function findTransportMode(id) { return TRANSPORT_MODES.find((t) => t.id === id) || TRANSPORT_MODES[0] }
export function findPackageType(id) { return PACKAGE_TYPES.find((p) => p.id === id) || PACKAGE_TYPES[0] }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/* ---- Core computation ---- */

/**
 * Each line: { sku, description, qtyOrdered, qtyDispatched, unit, weight, batchNo, notes }
 */
export function computeTotals(data) {
  const lines = (data.items || []).map((it) => {
    const qtyOrdered    = Number(it.qtyOrdered) || 0
    const qtyDispatched = Number(it.qtyDispatched) || 0
    const qtyPending    = Math.max(0, qtyOrdered - qtyDispatched)
    const weight        = Number(it.weight) || 0
    const totalWeight   = round2(weight * qtyDispatched)
    return { ...it, qtyOrdered, qtyDispatched, qtyPending, weight, totalWeight }
  })

  const totalOrdered    = round2(lines.reduce((s, l) => s + l.qtyOrdered, 0))
  const totalDispatched = round2(lines.reduce((s, l) => s + l.qtyDispatched, 0))
  const totalPending    = round2(lines.reduce((s, l) => s + l.qtyPending, 0))
  const totalWeight     = round2(lines.reduce((s, l) => s + l.totalWeight, 0))
  const fullyDispatched = totalPending === 0 && totalOrdered > 0

  return {
    lines,
    totalOrdered,
    totalDispatched,
    totalPending,
    totalWeight,
    fullyDispatched,
  }
}

/* ---- Counters ---- */

export function countSections(data) {
  let n = 4 // header + parties + items + dispatch
  if (data.includePackageBlock)  n++
  if (data.includeNotesBlock)    n++
  if (data.includeReceiptBlock)  n++
  return n
}
