/* ------------------------------------------------------------------ */
/*  Excel to PDF — config + sheet/cell helpers                          */
/* ------------------------------------------------------------------ */

export const PAGE_SIZES = [
  { id: 'a4',     label: 'A4 (210 × 297 mm)', w: 595.28, h: 841.89 },
  { id: 'letter', label: 'US Letter',         w: 612,    h: 792    },
  { id: 'a3',     label: 'A3 (297 × 420 mm)', w: 841.89, h: 1190.55 },
  { id: 'legal',  label: 'US Legal',          w: 612,    h: 1008   },
]

export const ORIENTATIONS = [
  { id: 'auto',     label: 'Auto (landscape if many columns)' },
  { id: 'portrait', label: 'Force portrait' },
  { id: 'landscape', label: 'Force landscape' },
]

export const SHEET_MODES = [
  { id: 'all',     label: 'All sheets (one section each)' },
  { id: 'first',   label: 'First sheet only' },
  { id: 'active',  label: 'First non-empty sheet' },
]

export const HEADER_MODES = [
  { id: 'first_row',  label: 'First row is the header' },
  { id: 'none',       label: 'No header row' },
]

export const FIT_MODES = [
  { id: 'fit_width', label: 'Fit columns to page width (shrink to fit)' },
  { id: 'natural',   label: 'Natural column widths (overflow paginates)' },
]

export const FONT_SIZES = [
  { id: 'xs', label: 'X-small (8pt)', pt: 8  },
  { id: 'sm', label: 'Small (9pt)',   pt: 9  },
  { id: 'md', label: 'Medium (10pt)', pt: 10 },
  { id: 'lg', label: 'Large (11pt)',  pt: 11 },
]

export function findPageSize(id)    { return PAGE_SIZES.find((p) => p.id === id) || PAGE_SIZES[0] }
export function findOrientation(id) { return ORIENTATIONS.find((o) => o.id === id) || ORIENTATIONS[0] }
export function findSheetMode(id)   { return SHEET_MODES.find((s) => s.id === id) || SHEET_MODES[0] }
export function findHeaderMode(id)  { return HEADER_MODES.find((h) => h.id === id) || HEADER_MODES[0] }
export function findFitMode(id)     { return FIT_MODES.find((f) => f.id === id) || FIT_MODES[0] }
export function findFontSize(id)    { return FONT_SIZES.find((f) => f.id === id) || FONT_SIZES[2] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / (1024 * 1024)).toFixed(2)} MB`
}

/* ---- Sheet helpers --------------------------------------------------
 * SheetJS gives us cells with formats / formulas. We flatten each sheet
 * into a 2-D array of strings using cell.w (the formatted value, which
 * preserves dates and number formats) when present, else cell.v.       */

/** Convert a SheetJS worksheet to a rectangular array of strings. */
export function sheetToRows(ws, XLSX) {
  if (!ws) return []
  // sheet_to_json with header:1 returns array-of-arrays; raw:false uses formatted strings
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, blankrows: false, defval: '' })
  // Normalise so every row has the same number of columns
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0)
  return rows.map((r) => {
    const out = new Array(maxCols).fill('')
    for (let i = 0; i < maxCols; i++) {
      const v = r[i]
      out[i] = v == null ? '' : String(v)
    }
    return out
  })
}

/** Returns true if a row has any non-empty cell. */
function rowHasContent(row) {
  return row.some((c) => String(c || '').trim().length > 0)
}

/** Drop trailing fully-empty rows. */
export function trimRows(rows) {
  let end = rows.length
  while (end > 0 && !rowHasContent(rows[end - 1])) end--
  return rows.slice(0, end)
}

/** Compute a per-column character-width estimate. */
export function estimateColumnWidths(rows) {
  if (!rows.length) return []
  const cols = rows[0].length
  const widths = new Array(cols).fill(0)
  for (const r of rows) {
    for (let i = 0; i < cols; i++) {
      const len = String(r[i] || '').length
      if (len > widths[i]) widths[i] = len
    }
  }
  return widths
}

/** Decide auto orientation: landscape if column count is high (>= 7). */
export function resolveOrientation(orientationId, columnCount) {
  if (orientationId === 'portrait')  return 'portrait'
  if (orientationId === 'landscape') return 'landscape'
  return columnCount >= 7 ? 'landscape' : 'portrait'
}

/* ---- Preview helpers for the UI ---- */

export function summariseWorkbook(workbookSheets) {
  // workbookSheets = [{ name, rows }, ...]
  return workbookSheets.map((s) => ({
    name: s.name,
    rowCount: s.rows.length,
    colCount: s.rows[0]?.length || 0,
    nonEmpty: s.rows.length > 0 && s.rows[0].some((c) => String(c || '').trim()),
  }))
}

/** Slice a sheet's rows for the preview table. */
export function previewSheet(rows, headerModeId, maxRows = 6, maxCellChars = 20) {
  const header = headerModeId === 'first_row' ? rows[0] : null
  const body = headerModeId === 'first_row' ? rows.slice(1, 1 + maxRows) : rows.slice(0, maxRows)
  const trim = (s) => {
    const str = String(s || '')
    return str.length > maxCellChars ? `${str.slice(0, maxCellChars - 1)}…` : str
  }
  return {
    header: header ? header.map(trim) : null,
    body:   body.map((r) => r.map(trim)),
  }
}
