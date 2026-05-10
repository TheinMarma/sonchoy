/* PDF text extraction via pdf.js — runs entirely in the browser. */

import * as pdfjsLib from 'pdfjs-dist'
/* Vite spins up the worker as a Web Worker module. Using the worker constructor
   (rather than `?url`) avoids MIME-type / URL-resolution issues at runtime. */
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerPort) {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()
}

/**
 * Extracts every text run from a PDF File along with its page-relative
 * coordinates so we can reason about layout (lines, columns) downstream.
 *
 * @param {File|Blob} file
 * @returns {Promise<{ items: Array, numPages: number, pages: Array, totalChars: number }>}
 */
export async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise

  const items = []
  const pages = []
  let totalChars = 0

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()

    pages.push({ pageNum, width: viewport.width, height: viewport.height })

    for (const item of content.items) {
      const str = (item.str || '').replace(/\s+/g, ' ')
      if (!str.trim()) continue

      const x = item.transform[4]
      const y = viewport.height - item.transform[5] // flip y so 0 is at the top

      items.push({
        str,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        width: item.width || 0,
        height: item.height || 0,
        page: pageNum,
      })
      totalChars += str.length
    }
  }

  return { items, numPages: pdf.numPages, pages, totalChars }
}

/** Heuristic check for empty / image-only PDFs (likely scanned). */
export function isLikelyScanned(items, totalChars) {
  if (typeof totalChars === 'number') return totalChars < 40
  const sum = items.reduce((s, it) => s + (it.str?.length || 0), 0)
  return sum < 40
}
