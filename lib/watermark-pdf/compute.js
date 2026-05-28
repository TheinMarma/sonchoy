/* ------------------------------------------------------------------ */
/*  Watermark engine config — presets, helpers, contrast math           */
/* ------------------------------------------------------------------ */

export const WATERMARK_PRESETS = [
  { id: 'draft',  label: 'DRAFT',          text: 'DRAFT',        color: '#B46E05', opacity: 0.10, angle: -30, size: 110 },
  { id: 'paid',   label: 'PAID',           text: 'PAID',         color: '#15803D', opacity: 0.10, angle: -30, size: 110 },
  { id: 'copy',   label: 'COPY',           text: 'COPY',         color: '#1F2937', opacity: 0.08, angle: -30, size: 110 },
  { id: 'void',   label: 'VOID',           text: 'VOID',         color: '#DC2626', opacity: 0.12, angle: -30, size: 110 },
  { id: 'conf',   label: 'CONFIDENTIAL',   text: 'CONFIDENTIAL', color: '#DC2626', opacity: 0.10, angle: -30, size: 80  },
  { id: 'sample', label: 'SAMPLE',         text: 'SAMPLE',       color: '#0E7490', opacity: 0.10, angle: -30, size: 110 },
  { id: 'custom', label: 'Custom text',    text: '',             color: '#B46E05', opacity: 0.12, angle: -30, size: 110 },
]

export const POSITIONS = [
  { id: 'center',       label: 'Centre (diagonal)' },
  { id: 'tile',         label: 'Tiled across page' },
  { id: 'top_right',    label: 'Top-right corner' },
  { id: 'top_left',     label: 'Top-left corner' },
  { id: 'bottom_right', label: 'Bottom-right corner' },
  { id: 'bottom_left',  label: 'Bottom-left corner' },
  { id: 'header',       label: 'Centred along top edge' },
  { id: 'footer',       label: 'Centred along bottom edge' },
]

export const QUALITY_PRESETS = [
  { id: 'low',    label: 'Draft (1.0×)',  scale: 1.0, jpegQuality: 0.7  },
  { id: 'medium', label: 'Standard (1.5×)', scale: 1.5, jpegQuality: 0.82 },
  { id: 'high',   label: 'High (2.0×)',   scale: 2.0, jpegQuality: 0.9  },
]

export const FONTS = [
  { id: 'helvetica', label: 'Helvetica · sans' },
  { id: 'times',     label: 'Times · serif' },
  { id: 'courier',   label: 'Courier · mono' },
]

export const PAGE_SELECTIONS = [
  { id: 'all',      label: 'All pages' },
  { id: 'first',    label: 'First page only' },
  { id: 'last',     label: 'Last page only' },
  { id: 'odd',      label: 'Odd pages only' },
  { id: 'even',     label: 'Even pages only' },
  { id: 'custom',   label: 'Custom ranges' },
]

/* ---- Helpers ---- */

export function findPreset(id)   { return WATERMARK_PRESETS.find((p) => p.id === id) || WATERMARK_PRESETS[0] }
export function findPosition(id) { return POSITIONS.find((p) => p.id === id) || POSITIONS[0] }
export function findQuality(id)  { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }
export function findFont(id)     { return FONTS.find((f) => f.id === id) || FONTS[0] }
export function findPageSelection(id) { return PAGE_SELECTIONS.find((p) => p.id === id) || PAGE_SELECTIONS[0] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/* Hex → RGB. Tolerant of `#abc` shorthand and missing-#. */
export function hexToRgb(hex) {
  if (!hex) return [180, 110, 5]
  const h = String(hex).replace('#', '').trim()
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  }
  if (h.length !== 6) return [180, 110, 5]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/* ---- Custom page-range parser (1-3, 5, 9-end) ---- */

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

/** Decide which pages get the watermark, given the page-selection setting. */
export function resolveWatermarkedPages(data, totalPages) {
  const sel = findPageSelection(data.pageSelectionId)
  switch (sel.id) {
    case 'all':    return { pages: setOfRange(1, totalPages), errors: [] }
    case 'first':  return { pages: new Set([1]),               errors: [] }
    case 'last':   return { pages: new Set([totalPages]),      errors: [] }
    case 'odd':    return { pages: setFilter(totalPages, (p) => p % 2 === 1), errors: [] }
    case 'even':   return { pages: setFilter(totalPages, (p) => p % 2 === 0), errors: [] }
    case 'custom': return parseRanges(data.pageRangesText, totalPages)
    default:       return { pages: setOfRange(1, totalPages), errors: [] }
  }
}

function setOfRange(start, end) {
  const s = new Set()
  for (let i = start; i <= end; i++) s.add(i)
  return s
}
function setFilter(total, pred) {
  const s = new Set()
  for (let i = 1; i <= total; i++) if (pred(i)) s.add(i)
  return s
}
