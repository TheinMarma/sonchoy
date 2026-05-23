/* ------------------------------------------------------------------ */
/*  Reorder engine — render the source PDF's pages in a chosen order    */
/*  into a new PDF. Uses the same canvas-rasterise pipeline as Merge /  */
/*  Split / Compress so it works against any source PDF the browser     */
/*  can read.                                                            */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'
import { findQuality } from './compute'

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerPort) {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()
}

const THUMB_SCALE = 0.18  // ~108 px wide for an A4 portrait page

/**
 * Read page count + render thumbnails for every page in parallel batches.
 * Returns: { pages, width, height, thumbs: [{ pageNum, dataUrl, w, h }] }
 *
 * The UI uses the thumbnails as drag handles so users can identify pages
 * visually (a long bank statement is impossible to reorder by page number
 * alone).
 */
export async function probePdfWithThumbs(file, onProgress = () => {}) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  const firstPage = await pdf.getPage(1)
  const baseView = firstPage.getViewport({ scale: 1 })

  const thumbs = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const v = page.getViewport({ scale: THUMB_SCALE })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(v.width)
    canvas.height = Math.ceil(v.height)
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport: v }).promise
    thumbs.push({
      pageNum: p,
      dataUrl: canvas.toDataURL('image/jpeg', 0.7),
      w: canvas.width,
      h: canvas.height,
    })
    onProgress({ stage: 'thumbs', pct: (p / pdf.numPages) * 100, message: `Thumbnail ${p} of ${pdf.numPages}` })
  }

  pdf.destroy()
  return {
    pages: pdf.numPages,
    width: baseView.width,
    height: baseView.height,
    thumbs,
  }
}

/**
 * Emit a new PDF with pages rendered in `order` (1-based page numbers from
 * the source). Quality preset controls render scale and JPEG quality.
 */
export async function reorderPdf(file, order, options = {}, onProgress = () => {}) {
  if (!file)            throw new Error('No PDF selected.')
  if (!order?.length)   throw new Error('Order list is empty.')

  const quality = findQuality(options.qualityId)
  const baseName = (options.baseName || file.name.replace(/\.pdf$/i, '') || 'reordered').replace(/[^a-z0-9-]+/gi, '-')

  onProgress({ stage: 'loading', pct: 0, message: 'Reading source PDF…' })
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  let out = null
  for (let i = 0; i < order.length; i++) {
    const pageNum = order[i]
    if (pageNum < 1 || pageNum > pdf.numPages) continue

    const page = await pdf.getPage(pageNum)
    const baseViewport = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: quality.scale })

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
      out = new jsPDF({ unit: 'pt', format: [W, H], orientation, compress: true })
    } else {
      out.addPage([W, H], orientation)
    }
    out.addImage(dataUrl, 'JPEG', 0, 0, W, H, undefined, 'FAST')

    onProgress({
      stage: 'rendering',
      pct: 5 + ((i + 1) / order.length) * 90,
      message: `Page ${i + 1} of ${order.length} (source page ${pageNum})`,
    })
  }

  if (options.includePageNumbers !== false) {
    const pageCount = out.internal.getNumberOfPages()
    for (let k = 1; k <= pageCount; k++) {
      out.setPage(k)
      const w = out.internal.pageSize.getWidth()
      const h = out.internal.pageSize.getHeight()
      out.setFont('helvetica', 'normal'); out.setFontSize(8)
      out.setTextColor(130, 130, 124)
      out.text(`Page ${k} of ${pageCount}`, w - 20, h - 14, { align: 'right' })
    }
  }

  onProgress({ stage: 'saving', pct: 98, message: 'Saving reordered PDF…' })

  const blob = out.output('blob')
  const fileName = `${baseName}__reordered.pdf`
  triggerDownload(blob, fileName)
  pdf.destroy()

  return { pages: order.length, outputBytes: blob.size, fileName }
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
