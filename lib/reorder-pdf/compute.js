/* ------------------------------------------------------------------ */
/*  Reorder PDF — sequence helpers + order-string parsing               */
/* ------------------------------------------------------------------ */

export const QUALITY_PRESETS = [
  { id: 'low',     label: 'Draft (1.0×)',  scale: 1.0, jpegQuality: 0.7  },
  { id: 'medium',  label: 'Standard (1.5×)', scale: 1.5, jpegQuality: 0.82 },
  { id: 'high',    label: 'High (2.0×)',   scale: 2.0, jpegQuality: 0.9  },
  { id: 'print',   label: 'Print (2.5×)',  scale: 2.5, jpegQuality: 0.92 },
]

export function findQuality(id) { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/* ---- Order-string parsing -------------------------------------------
 * Accepts a comma-separated order spec — same syntax as the Split tool
 * but applied to whole-page selection / reordering. Examples:
 *   "3, 1, 2"              → reorder to [3, 1, 2]
 *   "1-5, 8, 6-7"          → expand ranges; result is [1,2,3,4,5,8,6,7]
 *   "1-end" / "end-1"      → uses the total page count for `end`
 *   "all"                  → original 1..N order
 *   "reverse"              → N..1 order
 *   "odd" / "even"         → only odd- or only even-numbered pages
 * Returns `{ order, errors }`. Out-of-range entries become errors but
 * don't throw; the UI surfaces them inline.
 * ----------------------------------------------------------------------*/
export function parseOrderText(text, totalPages) {
  const errors = []
  if (!text || !totalPages) return { order: [], errors }

  const trimmed = String(text).trim().toLowerCase()
  if (trimmed === 'all')      return { order: range(1, totalPages), errors }
  if (trimmed === 'reverse')  return { order: range(1, totalPages).reverse(), errors }
  if (trimmed === 'odd')      return { order: range(1, totalPages).filter((p) => p % 2 === 1), errors }
  if (trimmed === 'even')     return { order: range(1, totalPages).filter((p) => p % 2 === 0), errors }

  const order = []
  const entries = String(text).split(/[,\n]+/).map((s) => s.trim()).filter(Boolean)
  entries.forEach((raw, idx) => {
    const m = raw.match(/^(\d+|end)\s*-\s*(\d+|end)$/i)
    if (m) {
      const start = /^end$/i.test(m[1]) ? totalPages : Number(m[1])
      const end   = /^end$/i.test(m[2]) ? totalPages : Number(m[2])
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        errors.push(`Entry #${idx + 1}: "${raw}" — invalid range`)
        return
      }
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        errors.push(`Entry #${idx + 1}: out of range (1–${totalPages})`)
        return
      }
      if (start <= end) {
        for (let i = start; i <= end; i++) order.push(i)
      } else {
        for (let i = start; i >= end; i--) order.push(i)  // descending range
      }
      return
    }
    if (/^\d+$/.test(raw)) {
      const n = Number(raw)
      if (n < 1 || n > totalPages) {
        errors.push(`Entry #${idx + 1}: page ${n} is out of range`)
        return
      }
      order.push(n)
      return
    }
    errors.push(`Entry #${idx + 1}: "${raw}" — could not parse`)
  })

  return { order, errors }
}

function range(start, end) {
  const out = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}

/** Pretty-print an array of page numbers compactly: [1,2,3,5,6,9] → "1-3, 5-6, 9" */
export function compactOrderString(order) {
  if (!order || order.length === 0) return ''
  const out = []
  let i = 0
  while (i < order.length) {
    let j = i
    while (j + 1 < order.length && order[j + 1] === order[j] + 1) j++
    if (j === i) out.push(String(order[i]))
    else         out.push(`${order[i]}-${order[j]}`)
    i = j + 1
  }
  return out.join(', ')
}

/* ---- Helpers used by the UI for quick presets ---- */

export function reverseOrder(currentOrder) {
  return [...currentOrder].reverse()
}

export function swapAdjacent(order, index) {
  if (index < 0 || index >= order.length - 1) return order
  const next = [...order]
  ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
  return next
}

export function moveItem(order, from, to) {
  if (from < 0 || from >= order.length) return order
  if (to < 0 || to >= order.length) return order
  const next = [...order]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function removeItem(order, index) {
  if (index < 0 || index >= order.length) return order
  const next = [...order]
  next.splice(index, 1)
  return next
}

export function shuffleArray(arr) {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/* ---- Counters ---- */

export function detectIsModified(originalCount, order) {
  if (order.length !== originalCount) return true
  for (let i = 0; i < order.length; i++) {
    if (order[i] !== i + 1) return true
  }
  return false
}
