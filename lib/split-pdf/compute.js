/* ------------------------------------------------------------------ */
/*  Split PDF — slice one PDF into many                                  */
/* ------------------------------------------------------------------ */

export const SPLIT_MODES = [
  { id: 'ranges',   label: 'Custom page ranges',  desc: 'List ranges (e.g. 1-12, 13-24)' },
  { id: 'even',     label: 'Even N parts',         desc: 'Split into N roughly-equal slices' },
  { id: 'every_n',  label: 'Every N pages',        desc: 'Fixed-size chunks (every N pages)' },
  { id: 'per_page', label: 'One PDF per page',     desc: 'Each page becomes its own file' },
]

export const QUALITY_PRESETS = [
  { id: 'low',     label: 'Draft (1.0×)',  scale: 1.0, jpegQuality: 0.7  },
  { id: 'medium',  label: 'Standard (1.5×)', scale: 1.5, jpegQuality: 0.82 },
  { id: 'high',    label: 'High (2.0×)',   scale: 2.0, jpegQuality: 0.9  },
  { id: 'print',   label: 'Print (2.5×)',  scale: 2.5, jpegQuality: 0.92 },
]

export function findSplitMode(id) { return SPLIT_MODES.find((m) => m.id === id) || SPLIT_MODES[0] }
export function findQuality(id)   { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/* ---- Range parser ----------------------------------------------------
 * Accepts comma-separated entries. Each entry can be:
 *   "1-12"               → pages 1–12 (inclusive)
 *   "5"                  → just page 5
 *   "1-12: Jan 2026"     → pages 1–12 with a friendly label "Jan 2026"
 *   "20-end"             → pages 20 through the last page
 *
 * Returns `{ ranges, errors }` where `ranges` is [{ start, end, label }].
 * Out-of-bound / inverted ranges are reported in `errors` but never throw.
 * ----------------------------------------------------------------------*/
export function parseRanges(text, totalPages) {
  const errors = []
  const ranges = []
  if (!text) return { ranges, errors }

  const entries = String(text).split(/[,\n]+/).map((s) => s.trim()).filter(Boolean)
  entries.forEach((raw, idx) => {
    let labelPart = ''
    let pagesPart = raw
    const colonIx = raw.indexOf(':')
    if (colonIx !== -1) {
      pagesPart = raw.slice(0, colonIx).trim()
      labelPart = raw.slice(colonIx + 1).trim()
    }

    const dashMatch = pagesPart.match(/^(\d+)\s*-\s*(end|\d+)$/i)
    let start = null, end = null
    if (dashMatch) {
      start = Number(dashMatch[1])
      end = /^end$/i.test(dashMatch[2]) ? totalPages : Number(dashMatch[2])
    } else if (/^\d+$/.test(pagesPart)) {
      start = end = Number(pagesPart)
    } else {
      errors.push(`Range #${idx + 1}: "${raw}" — could not be parsed`)
      return
    }

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      errors.push(`Range #${idx + 1}: "${raw}" — invalid page number`)
      return
    }
    if (start < 1) {
      errors.push(`Range #${idx + 1}: starts before page 1`)
      return
    }
    if (totalPages && end > totalPages) {
      errors.push(`Range #${idx + 1}: ends past the document (${totalPages} pages)`)
      return
    }
    if (start > end) {
      errors.push(`Range #${idx + 1}: start > end (${start} > ${end})`)
      return
    }

    ranges.push({
      start, end,
      label: labelPart || `Part ${ranges.length + 1}`,
    })
  })

  return { ranges, errors }
}

/* ---- Auto-range builders -------------------------------------------- */

export function buildEvenRanges(totalPages, n) {
  const parts = Math.max(1, Math.min(50, Number(n) || 1))
  if (!totalPages) return []
  const base = Math.floor(totalPages / parts)
  const remainder = totalPages % parts
  const out = []
  let cursor = 1
  for (let i = 0; i < parts; i++) {
    const size = base + (i < remainder ? 1 : 0)
    if (size <= 0) break
    const start = cursor
    const end = cursor + size - 1
    out.push({ start, end, label: `Part ${i + 1}` })
    cursor = end + 1
  }
  return out
}

export function buildEveryNRanges(totalPages, n) {
  const step = Math.max(1, Number(n) || 1)
  const out = []
  if (!totalPages) return out
  let i = 1
  let part = 1
  while (i <= totalPages) {
    const end = Math.min(totalPages, i + step - 1)
    out.push({ start: i, end, label: `Part ${part}` })
    i = end + 1
    part += 1
  }
  return out
}

export function buildPerPageRanges(totalPages) {
  const out = []
  for (let i = 1; i <= (totalPages || 0); i++) {
    out.push({ start: i, end: i, label: `Page ${i}` })
  }
  return out
}

/* ---- Resolve the final ranges given the chosen mode and inputs. */
export function resolveRanges(data, totalPages) {
  const mode = findSplitMode(data.splitModeId)
  switch (mode.id) {
    case 'ranges':   return parseRanges(data.rangesText, totalPages)
    case 'even':     return { ranges: buildEvenRanges(totalPages, data.evenParts),  errors: [] }
    case 'every_n':  return { ranges: buildEveryNRanges(totalPages, data.everyN),    errors: [] }
    case 'per_page': return { ranges: buildPerPageRanges(totalPages),                errors: [] }
    default:         return { ranges: [], errors: [] }
  }
}

/** Sums total bytes / pages output across the projected ranges. */
export function computeTotals(ranges) {
  const files = ranges.length
  const pages = ranges.reduce((s, r) => s + (r.end - r.start + 1), 0)
  return { files, pages }
}
