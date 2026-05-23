/* ------------------------------------------------------------------ */
/*  Split engine — extracts page ranges from one PDF into many PDFs.    */
/*                                                                      */
/*  Like the merge tool, this rasterises each page (via pdfjs) and       */
/*  re-emits via jsPDF, so it works on any source PDF the browser can    */
/*  read — no second PDF library needed.                                 */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'
import { findQuality } from './compute'

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerPort) {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()
}

/** Read page count + first-page size for a freshly-added PDF. */
export async function probePdf(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const firstPage = await pdf.getPage(1)
  const v = firstPage.getViewport({ scale: 1 })
  pdf.destroy()
  return { pages: pdf.numPages, width: v.width, height: v.height }
}

/**
 * Split `file` according to `ranges` and download one PDF per range.
 * Spaces downloads slightly so browsers don't block them as a popup burst.
 *
 * onProgress({ stage, pct, message }) fires throughout.
 */
export async function splitPdf(file, ranges, options = {}, onProgress = () => {}) {
  if (!file)               throw new Error('No PDF selected.')
  if (!ranges?.length)     throw new Error('No ranges to extract.')

  const quality = findQuality(options.qualityId)
  const baseName = (options.baseName || file.name.replace(/\.pdf$/i, '') || 'split').replace(/[^a-z0-9-]+/gi, '-')

  onProgress({ stage: 'loading', pct: 0, message: 'Reading source PDF…' })
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  const totalOutputPages = ranges.reduce((s, r) => s + (r.end - r.start + 1), 0)
  let rendered = 0

  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i]
    const partLabel = sanitisePart(r.label || `Part-${i + 1}`)

    onProgress({
      stage: 'rendering',
      pct: 5 + (rendered / Math.max(1, totalOutputPages)) * 90,
      message: `Part ${i + 1} of ${ranges.length} · ${r.label}`,
    })

    // Build a per-range jsPDF doc by walking pages start..end.
    let out = null
    for (let p = r.start; p <= r.end; p++) {
      const page = await pdf.getPage(p)
      const baseViewport = page.getViewport({ scale: 1 })

      const renderScale = quality.scale
      const viewport = page.getViewport({ scale: renderScale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport }).promise
      const dataUrl = canvas.toDataURL('image/jpeg', quality.jpegQuality)

      const W = baseViewport.width
      const H = baseViewport.height
      const orientation = W > H ? 'landscape' : 'portrait'

      if (!out) {
        out = new jsPDF({ unit: 'pt', format: [W, H], orientation })
      } else {
        out.addPage([W, H], orientation)
      }
      out.addImage(dataUrl, 'JPEG', 0, 0, W, H, undefined, 'FAST')

      rendered += 1
      if (rendered % 4 === 0) {
        onProgress({
          stage: 'rendering',
          pct: 5 + (rendered / Math.max(1, totalOutputPages)) * 90,
          message: `Page ${p} (part ${i + 1}/${ranges.length})`,
        })
      }
    }

    // Optional page numbers on each part
    if (options.includePageNumbers !== false) {
      const pc = out.internal.getNumberOfPages()
      for (let k = 1; k <= pc; k++) {
        out.setPage(k)
        const w = out.internal.pageSize.getWidth()
        const h = out.internal.pageSize.getHeight()
        out.setFont('helvetica', 'normal'); out.setFontSize(8)
        out.setTextColor(130, 130, 124)
        out.text(`${r.label}  ·  Page ${k} of ${pc}`, w - 20, h - 14, { align: 'right' })
      }
    }

    const padded = String(i + 1).padStart(2, '0')
    const fileName = `${baseName}__${padded}__${partLabel}.pdf`
    out.save(fileName)

    // Slight stagger so the browser doesn't suppress multiple downloads
    // (this is what trips most browsers; pacing is enough to be reliable)
    await sleep(180)
  }

  pdf.destroy()
  onProgress({ stage: 'done', pct: 100, message: `Saved ${ranges.length} file${ranges.length === 1 ? '' : 's'}` })

  return { count: ranges.length, totalOutputPages }
}

function sanitisePart(s) {
  return String(s)
    .replace(/[^\w\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'part'
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
