/* ------------------------------------------------------------------ */
/*  Merge Financial PDFs — combine multiple PDFs into one packet        */
/* ------------------------------------------------------------------ */

export const PAGE_SIZES = [
  { id: 'auto',   label: 'Match source pages', desc: 'Each page keeps its original size' },
  { id: 'a4',     label: 'A4 (210 × 297 mm)',  desc: 'All pages scaled to A4' },
  { id: 'letter', label: 'US Letter',           desc: 'All pages scaled to US Letter' },
]

export const QUALITY_PRESETS = [
  { id: 'low',     label: 'Draft (1.0×)',  scale: 1.0, jpegQuality: 0.7 },
  { id: 'medium',  label: 'Standard (1.5×)', scale: 1.5, jpegQuality: 0.82 },
  { id: 'high',    label: 'High (2.0×)',     scale: 2.0, jpegQuality: 0.9 },
  { id: 'print',   label: 'Print (2.5×)',    scale: 2.5, jpegQuality: 0.92 },
]

export const COVER_MODES = [
  { id: 'none',   label: 'No cover sheet' },
  { id: 'cover',  label: 'Cover sheet only' },
  { id: 'toc',    label: 'Cover + table of contents' },
]

export const ORIENTATIONS = [
  { id: 'auto',     label: 'Match source' },
  { id: 'portrait', label: 'Force portrait' },
  { id: 'landscape', label: 'Force landscape' },
]

export function findPageSize(id)  { return PAGE_SIZES.find((p) => p.id === id) || PAGE_SIZES[0] }
export function findQuality(id)   { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }
export function findCoverMode(id) { return COVER_MODES.find((c) => c.id === id) || COVER_MODES[1] }
export function findOrientation(id) { return ORIENTATIONS.find((o) => o.id === id) || ORIENTATIONS[0] }

/** Friendly byte-size formatting. */
export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** Sums total bytes + page counts across the file list. */
export function computeTotals(files) {
  let bytes = 0, pages = 0
  for (const f of files || []) {
    bytes += Number(f.size) || 0
    pages += Number(f.pages) || 0
  }
  return { bytes, pages, count: (files || []).length }
}
