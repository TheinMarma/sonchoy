/* ------------------------------------------------------------------ */
/*  Rotate PDF — config + per-page rotation helpers                      */
/* ------------------------------------------------------------------ */

export const QUALITY_PRESETS = [
  { id: 'low',    label: 'Draft (1.0×)',  scale: 1.0, jpegQuality: 0.7  },
  { id: 'medium', label: 'Standard (1.5×)', scale: 1.5, jpegQuality: 0.82 },
  { id: 'high',   label: 'High (2.0×)',   scale: 2.0, jpegQuality: 0.9  },
]

/* Rotation values are clockwise degrees. 0 = unchanged. */
export const ROTATION_OPTIONS = [
  { id: 0,   label: 'No rotation',           short: '0°' },
  { id: 90,  label: '90° clockwise',          short: '90°' },
  { id: 180, label: '180° (upside-down fix)', short: '180°' },
  { id: 270, label: '270° (= 90° anti-cw)',   short: '270°' },
]

export const PAGE_SELECTIONS = [
  { id: 'all',          label: 'Apply to all pages' },
  { id: 'odd',          label: 'Odd pages only' },
  { id: 'even',         label: 'Even pages only' },
  { id: 'first',        label: 'First page only' },
  { id: 'last',         label: 'Last page only' },
  { id: 'custom',       label: 'Custom ranges' },
  { id: 'per_page',     label: 'Per-page (different rotation per page)' },
]

export function findQuality(id)       { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }
export function findRotation(id)      { return ROTATION_OPTIONS.find((r) => r.id === Number(id)) || ROTATION_OPTIONS[0] }
export function findPageSelection(id) { return PAGE_SELECTIONS.find((p) => p.id === id) || PAGE_SELECTIONS[0] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/* ---- Range parser (re-used pattern from Split / Watermark) ---- */

export function parseRanges(text, totalPages) {
  const errors = []
  if (!text || !totalPages) return { pages: new Set(), errors }
  const pages = new Set()
  const entries = String(text).split(/[,\n]+/).map((s) => s.trim()).filter(Boolean)
  entries.forEach((raw, idx) => {
    const m = raw.match(/^(\d+|end)\s*-\s*(\d+|end)$/i)
    if (m) {
      const start = /^end$/i.test(m[1]) ? totalPages : Number(m[1])
      const end   = /^end$/i.test(m[2]) ? totalPages : Number(m[2])
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        errors.push(`Range #${idx + 1}: "${raw}" — invalid`)
        return
      }
      const lo = Math.min(start, end)
      const hi = Math.max(start, end)
      if (lo < 1 || hi > totalPages) {
        errors.push(`Range #${idx + 1}: out of range (1–${totalPages})`)
        return
      }
      for (let i = lo; i <= hi; i++) pages.add(i)
      return
    }
    if (/^\d+$/.test(raw)) {
      const n = Number(raw)
      if (n < 1 || n > totalPages) {
        errors.push(`Range #${idx + 1}: page ${n} out of range`)
        return
      }
      pages.add(n)
      return
    }
    errors.push(`Range #${idx + 1}: "${raw}" — could not parse`)
  })
  return { pages, errors }
}

/* ---- Resolve final rotation map: { 1: 90, 2: 0, 3: 180, ... } ---- */

/**
 * Returns a Map of pageNum → rotation (0/90/180/270).
 * For modes other than per_page, every selected page gets `data.rotation`
 * and unselected pages get 0.
 * For per_page mode, the caller supplies `data.perPageRotations` —
 * an object like { '3': 90, '5': 180 } — pages not in the map default to 0.
 */
export function resolveRotations(data, totalPages) {
  const map = new Map()
  if (!totalPages) return { map, errors: [] }

  const sel = findPageSelection(data.pageSelectionId)
  const r = Number(data.rotation) || 0

  if (sel.id === 'per_page') {
    for (let i = 1; i <= totalPages; i++) {
      const v = Number(data.perPageRotations?.[i]) || 0
      map.set(i, normaliseRotation(v))
    }
    return { map, errors: [] }
  }

  let targeted = new Set()
  let errors = []
  switch (sel.id) {
    case 'all':    for (let i = 1; i <= totalPages; i++) targeted.add(i); break
    case 'odd':    for (let i = 1; i <= totalPages; i++) if (i % 2 === 1) targeted.add(i); break
    case 'even':   for (let i = 1; i <= totalPages; i++) if (i % 2 === 0) targeted.add(i); break
    case 'first':  targeted.add(1); break
    case 'last':   targeted.add(totalPages); break
    case 'custom': {
      const parsed = parseRanges(data.pageRangesText, totalPages)
      targeted = parsed.pages
      errors = parsed.errors
      break
    }
    default: for (let i = 1; i <= totalPages; i++) targeted.add(i)
  }

  for (let i = 1; i <= totalPages; i++) {
    map.set(i, targeted.has(i) ? normaliseRotation(r) : 0)
  }
  return { map, errors }
}

/* Snap arbitrary rotation values to the four cardinal points. */
export function normaliseRotation(deg) {
  const d = ((Number(deg) || 0) % 360 + 360) % 360
  if (d < 45 || d >= 315) return 0
  if (d < 135) return 90
  if (d < 225) return 180
  return 270
}

/** Returns how many pages will rotate. */
export function countRotatedPages(rotationMap) {
  let n = 0
  for (const v of rotationMap.values()) if (v !== 0) n++
  return n
}
