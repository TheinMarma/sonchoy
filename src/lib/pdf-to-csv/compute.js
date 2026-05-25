/* ------------------------------------------------------------------ */
/*  PDF to CSV — config + table-extraction heuristics                    */
/* ------------------------------------------------------------------ */

export const DELIMITERS = [
  { id: 'comma',     label: 'Comma (CSV)',         char: ',' },
  { id: 'semicolon', label: 'Semicolon (EU CSV)',  char: ';' },
  { id: 'tab',       label: 'Tab (TSV)',           char: '\t' },
  { id: 'pipe',      label: 'Pipe',                char: '|' },
]

export const ENCODINGS = [
  { id: 'utf8',     label: 'UTF-8 (recommended)' },
  { id: 'utf8_bom', label: 'UTF-8 with BOM (Excel-friendly)' },
]

export const PAGE_MODES = [
  { id: 'all',     label: 'All pages, one CSV' },
  { id: 'per_page', label: 'Per page, one section each' },
  { id: 'range',   label: 'Custom page range' },
]

export const HEADER_MODES = [
  { id: 'first_row',  label: 'First detected row is the header' },
  { id: 'numbered',   label: 'No header — number columns col1, col2…' },
  { id: 'none',       label: 'No header row at all' },
]

export const ROW_TOLERANCE_PRESETS = [
  { id: 'tight',  label: 'Tight (2pt)',   pt: 2 },
  { id: 'normal', label: 'Normal (4pt)',  pt: 4 },
  { id: 'loose',  label: 'Loose (8pt)',   pt: 8 },
]

export const COL_TOLERANCE_PRESETS = [
  { id: 'tight',  label: 'Tight (4pt)',  pt: 4 },
  { id: 'normal', label: 'Normal (10pt)', pt: 10 },
  { id: 'loose',  label: 'Loose (20pt)',  pt: 20 },
]

export function findDelimiter(id)   { return DELIMITERS.find((d) => d.id === id) || DELIMITERS[0] }
export function findEncoding(id)    { return ENCODINGS.find((e) => e.id === id) || ENCODINGS[0] }
export function findPageMode(id)    { return PAGE_MODES.find((p) => p.id === id) || PAGE_MODES[0] }
export function findHeaderMode(id)  { return HEADER_MODES.find((h) => h.id === id) || HEADER_MODES[0] }
export function findRowTolerance(id) { return ROW_TOLERANCE_PRESETS.find((r) => r.id === id) || ROW_TOLERANCE_PRESETS[1] }
export function findColTolerance(id) { return COL_TOLERANCE_PRESETS.find((c) => c.id === id) || COL_TOLERANCE_PRESETS[1] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / (1024 * 1024)).toFixed(2)} MB`
}

/* ---- Custom range parser (re-used from other tools) ---- */

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
        errors.push(`Range #${idx + 1}: "${raw}" — invalid`); return
      }
      const lo = Math.min(start, end)
      const hi = Math.max(start, end)
      if (lo < 1 || hi > totalPages) {
        errors.push(`Range #${idx + 1}: out of range (1–${totalPages})`); return
      }
      for (let i = lo; i <= hi; i++) pages.add(i)
      return
    }
    if (/^\d+$/.test(raw)) {
      const n = Number(raw)
      if (n < 1 || n > totalPages) { errors.push(`Range #${idx + 1}: page ${n} out of range`); return }
      pages.add(n)
      return
    }
    errors.push(`Range #${idx + 1}: "${raw}" — could not parse`)
  })
  return { pages, errors }
}

/* ---- Table detection from pdfjs items -------------------------------
 * Input:  array of { str, x, y, page } (from extractTextFromPdf)
 * Output: { rows: string[][], columnAnchors: number[] }
 *
 * Algorithm:
 *   1. Group items into rows by y-coordinate within `rowTolerance` pt.
 *   2. Collect all distinct x-positions across all items, cluster them
 *      using `colTolerance` pt — the cluster centroids become column
 *      anchors for this page.
 *   3. For each row, bucket each item into its nearest anchor column,
 *      then join items inside the same row+col with a space.
 *
 * Why per-page anchors? Two-column reports look like one big table if
 * you compute anchors across all pages — but each page is actually two
 * separate columns. Page-local anchors detect that correctly. -------- */

export function extractTableFromPage(pageItems, opts = {}) {
  const rowTol = Number(opts.rowTolerance) || 4
  const colTol = Number(opts.colTolerance) || 10

  if (!pageItems || pageItems.length === 0) return { rows: [], columnAnchors: [] }

  // 1) Group items into rows
  const sortedByY = [...pageItems].sort((a, b) => a.y - b.y || a.x - b.x)
  const rowsRaw = []   // [{ y, items }]
  for (const it of sortedByY) {
    const last = rowsRaw[rowsRaw.length - 1]
    if (last && Math.abs(it.y - last.y) <= rowTol) {
      last.items.push(it)
      // Update row y to running mean to drift with the row
      last.y = (last.y * (last.items.length - 1) + it.y) / last.items.length
    } else {
      rowsRaw.push({ y: it.y, items: [it] })
    }
  }

  // 2) Cluster x-positions across the whole page → column anchors
  const xs = pageItems.map((it) => it.x).sort((a, b) => a - b)
  const clusters = []
  for (const x of xs) {
    const last = clusters[clusters.length - 1]
    if (last && x - last.right <= colTol) {
      last.values.push(x)
      last.right = x
    } else {
      clusters.push({ values: [x], right: x })
    }
  }
  const columnAnchors = clusters.map((c) => c.values.reduce((s, v) => s + v, 0) / c.values.length)

  // 3) Bucket each row's items into column slots
  const rows = []
  for (const r of rowsRaw) {
    const cells = new Array(columnAnchors.length).fill(null)
    for (const it of [...r.items].sort((a, b) => a.x - b.x)) {
      let nearest = 0
      let dist = Infinity
      for (let i = 0; i < columnAnchors.length; i++) {
        const d = Math.abs(it.x - columnAnchors[i])
        if (d < dist) { dist = d; nearest = i }
      }
      if (cells[nearest] == null) cells[nearest] = it.str
      else                        cells[nearest] = `${cells[nearest]} ${it.str}`
    }
    // Trim per-cell whitespace; rewrite null → '' so the CSV is rectangular
    const normalised = cells.map((c) => (c == null ? '' : String(c).trim()))
    // Skip rows that are completely empty (can happen on noisy PDFs)
    if (normalised.some((c) => c.length > 0)) rows.push(normalised)
  }

  return { rows, columnAnchors }
}

/* ---- CSV serialisation ---- */

/** Escape a single field per RFC 4180 — wrap in quotes if it contains the
   delimiter, a quote, or any line break. Quotes are doubled inside. */
export function escapeCsvField(field, delimiter = ',') {
  const s = String(field == null ? '' : field)
  if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Convert a 2-D array of rows into a CSV string. */
export function rowsToCsv(rows, delimiterChar = ',', lineBreak = '\r\n') {
  return rows
    .map((row) => row.map((cell) => escapeCsvField(cell, delimiterChar)).join(delimiterChar))
    .join(lineBreak)
}

/* Compose a header row given the chosen mode. */
export function applyHeaderMode(rows, headerModeId) {
  if (!rows.length) return { header: null, body: [] }
  if (headerModeId === 'first_row') return { header: rows[0], body: rows.slice(1) }
  if (headerModeId === 'none')      return { header: null,    body: rows }
  // numbered
  const numCols = rows[0].length
  const header = Array.from({ length: numCols }, (_, i) => `col${i + 1}`)
  return { header, body: rows }
}

/* Friendly row preview for the UI — truncates cells past N chars. */
export function previewRows(rows, maxRows = 8, maxCellChars = 28) {
  const head = rows.slice(0, maxRows)
  return head.map((r) => r.map((c) => {
    const s = String(c || '')
    return s.length > maxCellChars ? `${s.slice(0, maxCellChars - 1)}…` : s
  }))
}
