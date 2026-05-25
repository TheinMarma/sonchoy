/* ------------------------------------------------------------------ */
/*  Excel / CSV → PDF                                                    */
/*                                                                       */
/*  Reads .xlsx / .xls / .csv via SheetJS, then renders each chosen     */
/*  sheet onto a jsPDF document — header row in the accent colour,      */
/*  zebra-striped body rows, automatic column widths sized to the page. */
/* ------------------------------------------------------------------ */

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import {
  findPageSize, findSheetMode, findHeaderMode, findFitMode, findFontSize,
  sheetToRows, trimRows, estimateColumnWidths, resolveOrientation, summariseWorkbook,
} from './compute'

const MARGIN = 36
const C_INK_950 = [10, 10, 9]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_BAND    = [252, 252, 250]
const C_CONV    = [96, 165, 250]
const C_ON_ACCENT = [255, 255, 255]

/** Parse the workbook file and return { workbook, sheets: [{ name, rows }] }. */
export async function readWorkbook(file) {
  if (!file) throw new Error('No spreadsheet selected.')
  const buffer = await file.arrayBuffer()
  // SheetJS reads from a Uint8Array; raw:false in sheetToRows formats cells
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true })
  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]
    const rows = trimRows(sheetToRows(ws, XLSX))
    return { name, rows }
  })
  return { workbook: wb, sheets, summary: summariseWorkbook(sheets) }
}

/** Build + save the PDF from a parsed workbook. */
export async function buildExcelPdf(file, options = {}, onProgress = () => {}) {
  onProgress({ stage: 'reading', pct: 5, message: 'Reading spreadsheet…' })
  const { sheets, summary } = await readWorkbook(file)

  const pageSize    = findPageSize(options.pageSizeId)
  const sheetMode   = findSheetMode(options.sheetModeId)
  const headerMode  = findHeaderMode(options.headerModeId)
  const fitMode     = findFitMode(options.fitModeId)
  const fontSize    = findFontSize(options.fontSizeId)
  const baseName    = (options.baseName || file.name.replace(/\.[^.]+$/, '') || 'workbook').replace(/[^a-z0-9-]+/gi, '-')

  // Decide which sheets to render
  let sheetsToRender = sheets
  if (sheetMode.id === 'first') sheetsToRender = sheets.slice(0, 1)
  else if (sheetMode.id === 'active') {
    const first = sheets.find((s) => s.rows.length > 0)
    sheetsToRender = first ? [first] : []
  }
  // Drop empty sheets so we don't render a blank page
  sheetsToRender = sheetsToRender.filter((s) => s.rows.length > 0)
  if (sheetsToRender.length === 0) throw new Error('No data rows found in this workbook.')

  let out = null
  let firstPageInDoc = true

  for (let s = 0; s < sheetsToRender.length; s++) {
    const sheet = sheetsToRender[s]
    const colCount = sheet.rows[0]?.length || 0
    const orientation = resolveOrientation(options.orientationId, colCount)

    // Per-sheet page size
    const pageW = orientation === 'landscape' ? Math.max(pageSize.w, pageSize.h) : Math.min(pageSize.w, pageSize.h)
    const pageH = orientation === 'landscape' ? Math.min(pageSize.w, pageSize.h) : Math.max(pageSize.w, pageSize.h)

    if (!out) {
      out = new jsPDF({ unit: 'pt', format: [pageW, pageH], orientation, compress: true })
    } else {
      out.addPage([pageW, pageH], orientation)
    }

    // Sheet title bar
    let y = MARGIN
    out.setFont('helvetica', 'bold'); out.setFontSize(13)
    out.setTextColor(...C_INK_950)
    out.text(sheet.name, MARGIN, y + 12)
    out.setFont('helvetica', 'normal'); out.setFontSize(9)
    out.setTextColor(...C_INK_500)
    const meta = `${sheet.rows.length} rows · ${colCount} cols`
    out.text(meta, pageW - MARGIN, y + 12, { align: 'right' })
    y += 22
    out.setDrawColor(...C_CONV); out.setLineWidth(1)
    out.line(MARGIN, y, pageW - MARGIN, y); y += 12

    // Compute column widths
    const widthsChars = estimateColumnWidths(sheet.rows)
    const charPt = fontSize.pt * 0.55  // approx avg character width in pt
    const naturalWidths = widthsChars.map((c) => Math.max(36, Math.min(220, (c + 2) * charPt)))
    const availableW = pageW - MARGIN * 2
    const naturalTotal = naturalWidths.reduce((a, b) => a + b, 0)
    let columnWidths
    if (fitMode.id === 'fit_width') {
      // Scale natural widths down (or up) so they sum to availableW
      const scale = availableW / Math.max(1, naturalTotal)
      columnWidths = naturalWidths.map((w) => w * scale)
    } else {
      // Natural — if it overflows, we paginate the rightmost columns onto
      // a fresh page-set. Simpler approach: just clamp the total to availableW
      // (overflow scrolls off). We mention this in the FAQ.
      const scale = naturalTotal > availableW ? availableW / naturalTotal : 1
      columnWidths = naturalWidths.map((w) => w * scale)
    }

    // Header + body rendering with pagination
    const headerRow = headerMode.id === 'first_row' ? sheet.rows[0] : null
    const bodyRows  = headerMode.id === 'first_row' ? sheet.rows.slice(1) : sheet.rows
    const rowH = Math.max(14, Math.round(fontSize.pt * 1.4))

    function drawHeaderRow() {
      if (!headerRow) return
      out.setFillColor(...C_CONV)
      out.rect(MARGIN, y, availableW, rowH, 'F')
      out.setFont('helvetica', 'bold'); out.setFontSize(fontSize.pt)
      out.setTextColor(...C_ON_ACCENT)
      let cx = MARGIN
      for (let i = 0; i < columnWidths.length; i++) {
        const text = clipText(out, String(headerRow[i] || ''), columnWidths[i] - 6)
        out.text(text, cx + 4, y + rowH - 4)
        cx += columnWidths[i]
      }
      y += rowH
    }

    drawHeaderRow()

    out.setFont('helvetica', 'normal'); out.setFontSize(fontSize.pt)
    let rowIdx = 0
    while (rowIdx < bodyRows.length) {
      // New page when we run out of vertical space
      if (y + rowH > pageH - MARGIN) {
        out.addPage([pageW, pageH], orientation)
        y = MARGIN
        // Sheet name + page indicator
        out.setFont('helvetica', 'bold'); out.setFontSize(13)
        out.setTextColor(...C_INK_950)
        out.text(sheet.name, MARGIN, y + 12)
        out.setFont('helvetica', 'normal'); out.setFontSize(9)
        out.setTextColor(...C_INK_500)
        out.text(`continued`, pageW - MARGIN, y + 12, { align: 'right' })
        y += 22
        out.setDrawColor(...C_CONV); out.setLineWidth(1)
        out.line(MARGIN, y, pageW - MARGIN, y); y += 12
        drawHeaderRow()
        out.setFont('helvetica', 'normal'); out.setFontSize(fontSize.pt)
      }

      // Zebra stripe
      if (rowIdx % 2 === 1) {
        out.setFillColor(...C_BAND)
        out.rect(MARGIN, y, availableW, rowH, 'F')
      }

      // Row content
      let cx = MARGIN
      const row = bodyRows[rowIdx]
      out.setTextColor(...C_INK_950)
      for (let i = 0; i < columnWidths.length; i++) {
        const text = clipText(out, String(row[i] || ''), columnWidths[i] - 6)
        // Right-align numeric-looking cells
        const isNumberLike = /^-?[\d,]+(\.\d+)?%?$/.test(String(row[i] || '').trim())
        if (isNumberLike) {
          out.text(text, cx + columnWidths[i] - 4, y + rowH - 4, { align: 'right' })
        } else {
          out.text(text, cx + 4, y + rowH - 4)
        }
        cx += columnWidths[i]
      }

      // Thin row separator
      out.setDrawColor(...C_LINE); out.setLineWidth(0.3)
      out.line(MARGIN, y + rowH, pageW - MARGIN, y + rowH)

      y += rowH
      rowIdx += 1
    }

    onProgress({
      stage: 'rendering',
      pct: 10 + ((s + 1) / sheetsToRender.length) * 85,
      message: `Sheet ${s + 1} of ${sheetsToRender.length}: ${sheet.name}`,
    })

    firstPageInDoc = false
  }

  // Page numbers + workbook title in the footer
  const pageCount = out.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    out.setPage(i)
    const w = out.internal.pageSize.getWidth()
    const h = out.internal.pageSize.getHeight()
    out.setFont('helvetica', 'normal'); out.setFontSize(7.5)
    out.setTextColor(...C_INK_500)
    out.setDrawColor(...C_LINE); out.setLineWidth(0.3)
    out.line(MARGIN, h - 22, w - MARGIN, h - 22)
    if (options.title) out.text(options.title, MARGIN, h - 10)
    out.text(`Page ${i} of ${pageCount}`, w - MARGIN, h - 10, { align: 'right' })
  }

  onProgress({ stage: 'saving', pct: 98, message: 'Saving PDF…' })
  const blob = out.output('blob')
  const fileName = `${baseName}.pdf`
  triggerDownload(blob, fileName)

  void firstPageInDoc  // (kept for future "single page" mode)

  return {
    pages: pageCount,
    sheets: sheetsToRender.length,
    summary,
    outputBytes: blob.size,
    fileName,
  }
}

/** Clip text to fit within `maxPt` width using jsPDF's getTextWidth. */
function clipText(doc, text, maxPt) {
  if (!text) return ''
  if (doc.getTextWidth(text) <= maxPt) return text
  let lo = 1, hi = text.length
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    const sub = `${text.slice(0, mid)}…`
    if (doc.getTextWidth(sub) <= maxPt) lo = mid + 1
    else                                 hi = mid
  }
  return `${text.slice(0, Math.max(1, lo - 1))}…`
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
