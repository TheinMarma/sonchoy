/* ------------------------------------------------------------------ */
/*  Compress engine — re-rasterises each page of the source PDF at the  */
/*  preset's scale + JPEG quality, then re-emits via jsPDF. Smaller     */
/*  scale × lower quality = smaller output.                              */
/*                                                                      */
/*  Same canvas-based pipeline as Merge / Split; the only differences   */
/*  are (a) the scale defaults are lower and (b) grayscale mode pushes  */
/*  the canvas pixels to luma before encoding.                          */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'
import { findPreset, findPageSize, findColorMode } from './compute'

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerPort) {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()
}

const A4 = { w: 595.28, h: 841.89 }
const LETTER = { w: 612, h: 792 }

export async function probePdf(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const firstPage = await pdf.getPage(1)
  const v = firstPage.getViewport({ scale: 1 })
  pdf.destroy()
  return { pages: pdf.numPages, width: v.width, height: v.height }
}

function targetDims(pageSizeId, sourceDims) {
  if (pageSizeId === 'a4') return { ...A4 }
  if (pageSizeId === 'letter') return { ...LETTER }
  return { ...sourceDims }
}

/** Drop ImageData saturation to 0 — converts the canvas to grayscale in place. */
function toGrayscale(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = d[i + 1] = d[i + 2] = luma
  }
  ctx.putImageData(img, 0, 0)
}

export async function compressPdf(file, options = {}, onProgress = () => {}) {
  if (!file) throw new Error('No PDF selected.')

  const preset    = findPreset(options.presetId)
  const colorMode = findColorMode(options.colorModeId)
  const pageSize  = findPageSize(options.pageSizeId)
  const baseName  = (options.baseName || file.name.replace(/\.pdf$/i, '') || 'compressed').replace(/[^a-z0-9-]+/gi, '-')
  const isGrayscale = colorMode.id === 'grayscale'

  onProgress({ stage: 'loading', pct: 0, message: 'Reading source PDF…' })
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const total = pdf.numPages

  let out = null
  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p)
    const baseViewport = page.getViewport({ scale: 1 })
    const target = targetDims(pageSize.id, { w: baseViewport.width, h: baseViewport.height })

    // Render at preset.scale × target/source ratio so the rasterised image
    // matches the target page exactly (no leftover whitespace).
    const renderScale = preset.scale * (target.w / baseViewport.width)
    const viewport = page.getViewport({ scale: renderScale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise

    if (isGrayscale) toGrayscale(ctx, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/jpeg', preset.jpegQuality)

    if (!out) {
      out = new jsPDF({
        unit: 'pt',
        format: pageSize.id === 'auto' ? [target.w, target.h] : (pageSize.id === 'letter' ? 'letter' : 'a4'),
        orientation: target.w > target.h ? 'landscape' : 'portrait',
        compress: true,
      })
    } else {
      out.addPage([target.w, target.h], target.w > target.h ? 'landscape' : 'portrait')
    }
    out.addImage(dataUrl, 'JPEG', 0, 0, target.w, target.h, undefined, 'FAST')

    onProgress({
      stage: 'compressing',
      pct: 5 + (p / total) * 90,
      message: `Page ${p} of ${total}`,
    })
  }

  // Optional page numbers / footer text
  if (options.includePageNumbers !== false) {
    const pageCount = out.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      out.setPage(i)
      const w = out.internal.pageSize.getWidth()
      const h = out.internal.pageSize.getHeight()
      out.setFont('helvetica', 'normal'); out.setFontSize(8)
      out.setTextColor(130, 130, 124)
      out.text(`Page ${i} of ${pageCount}`, w - 20, h - 14, { align: 'right' })
    }
  }

  onProgress({ stage: 'saving', pct: 98, message: 'Saving compressed PDF…' })

  const fileName = `${baseName}__compressed.pdf`
  // jsPDF's `output('blob')` returns the assembled PDF blob, so we can read its
  // actual size before triggering the download — that lets the UI report a real
  // before/after comparison instead of just the estimate.
  const blob = out.output('blob')
  triggerDownload(blob, fileName)
  pdf.destroy()

  return {
    pages: total,
    fileName,
    outputBytes: blob.size,
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
  // Revoke after a tick so Safari has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
