/* ------------------------------------------------------------------ */
/*  Extract pages from a PDF and emit a CSV per page mode (combined,    */
/*  per-page, or custom range). Re-uses the project-wide pdfExtract.    */
/* ------------------------------------------------------------------ */

import { extractTextFromPdf, isLikelyScanned } from '../pdfExtract'
import {
  findDelimiter, findEncoding, findPageMode, findHeaderMode,
  findRowTolerance, findColTolerance,
  parseRanges, extractTableFromPage, rowsToCsv, applyHeaderMode,
} from './compute'

/** Probe the PDF and tell the UI how many pages it has. */
export async function probePdf(file) {
  const extracted = await extractTextFromPdf(file)
  return {
    pages: extracted.numPages,
    totalChars: extracted.totalChars,
    isScanned: isLikelyScanned(extracted.items, extracted.totalChars),
  }
}

/**
 * Extract tables and produce a CSV string + matching preview rows.
 * `options`:
 *   - pageModeId:    'all' | 'per_page' | 'range'
 *   - pageRangesText (when 'range')
 *   - rowToleranceId / colToleranceId
 *   - headerModeId
 *   - delimiterId
 *   - encodingId
 *   - baseName (for download filename)
 */
export async function extractCsv(file, options = {}, onProgress = () => {}) {
  if (!file) throw new Error('No PDF selected.')

  onProgress({ stage: 'reading', pct: 5, message: 'Reading PDF…' })
  const extracted = await extractTextFromPdf(file)
  if (isLikelyScanned(extracted.items, extracted.totalChars)) {
    const err = new Error(`This looks like a scanned PDF (only ${extracted.totalChars} characters found across ${extracted.numPages} page${extracted.numPages === 1 ? '' : 's'}). OCR isn't in this tool — try the pdfFiller premium tier for scanned PDFs.`)
    err.code = 'SCANNED'
    throw err
  }

  const pageMode    = findPageMode(options.pageModeId)
  const headerMode  = findHeaderMode(options.headerModeId)
  const delimiter   = findDelimiter(options.delimiterId)
  const encoding    = findEncoding(options.encodingId)
  const rowTol      = findRowTolerance(options.rowToleranceId).pt
  const colTol      = findColTolerance(options.colToleranceId).pt
  const baseName    = (options.baseName || file.name.replace(/\.pdf$/i, '') || 'extracted').replace(/[^a-z0-9-]+/gi, '-')

  // Determine which pages we extract
  let pages
  if (pageMode.id === 'range') {
    const parsed = parseRanges(options.pageRangesText, extracted.numPages)
    pages = Array.from(parsed.pages).sort((a, b) => a - b)
    if (pages.length === 0) throw new Error('No valid pages in the supplied range.')
  } else {
    pages = []
    for (let i = 1; i <= extracted.numPages; i++) pages.push(i)
  }

  // Group all extracted items by page number
  const itemsByPage = new Map()
  for (const it of extracted.items) {
    if (!itemsByPage.has(it.page)) itemsByPage.set(it.page, [])
    itemsByPage.get(it.page).push(it)
  }

  // Run table-detection per page
  const perPageResults = []
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]
    const pageItems = itemsByPage.get(p) || []
    const result = extractTableFromPage(pageItems, { rowTolerance: rowTol, colTolerance: colTol })
    perPageResults.push({ page: p, rows: result.rows, columns: result.columnAnchors.length })

    onProgress({
      stage: 'extracting',
      pct: 10 + ((i + 1) / pages.length) * 80,
      message: `Page ${p}: ${result.rows.length} rows · ${result.columnAnchors.length} columns`,
    })
  }

  // Assemble final rows + CSV per page mode
  let combinedRows = []
  if (pageMode.id === 'per_page') {
    // One section per page with a heading row in between
    for (let i = 0; i < perPageResults.length; i++) {
      const pr = perPageResults[i]
      if (i > 0) combinedRows.push([])   // blank separator
      combinedRows.push([`--- Page ${pr.page} ---`])
      const { header, body } = applyHeaderMode(pr.rows, headerMode.id)
      if (header) combinedRows.push(header)
      combinedRows.push(...body)
    }
  } else {
    // Flatten all pages into one table. Header from the FIRST page only.
    const allRows = perPageResults.flatMap((pr) => pr.rows)
    const { header, body } = applyHeaderMode(allRows, headerMode.id)
    if (header) combinedRows.push(header)
    combinedRows.push(...body)
  }

  onProgress({ stage: 'serialising', pct: 95, message: 'Building CSV…' })

  // BOM if the encoding asks for it
  const bom = encoding.id === 'utf8_bom' ? '﻿' : ''
  const csv = bom + rowsToCsv(combinedRows, delimiter.char, '\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })

  // File extension reflects the chosen delimiter so spreadsheets pick it up
  const ext = delimiter.id === 'tab' ? 'tsv' : 'csv'
  const fileName = `${baseName}.${ext}`

  triggerDownload(blob, fileName)
  onProgress({ stage: 'done', pct: 100, message: `Saved ${fileName}` })

  return {
    pages: pages.length,
    totalRows: combinedRows.length,
    outputBytes: blob.size,
    fileName,
    perPageResults,
    csv,
  }
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
