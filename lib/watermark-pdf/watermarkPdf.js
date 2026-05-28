/* ------------------------------------------------------------------ */
/*  Watermark engine — rasterise each source page, stamp the watermark  */
/*  (text or image) using jsPDF's GState opacity, and emit a new PDF.   */
/*                                                                      */
/*  Same canvas pipeline as the other PDF utilities, so it works on any */
/*  source PDF the browser can read.                                    */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import { getPdfjs } from '@/lib/pdfjs-setup'
import { findQuality, findPosition, findFont, hexToRgb, resolveWatermarkedPages } from './compute'

/** Read page count + size of first page for the UI. */
export async function probePdf(file) {
  const pdfjsLib = await getPdfjs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const firstPage = await pdf.getPage(1)
  const v = firstPage.getViewport({ scale: 1 })
  pdf.destroy()
  return { pages: pdf.numPages, width: v.width, height: v.height }
}

/** Convert a File (PNG/JPG/SVG) to a data URL — used for logo overlays. */
export async function fileToDataUrl(file) {
  const pdfjsLib = await getPdfjs()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Compute the natural dimensions of an image data URL. */
function loadImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Apply watermark and save the resulting PDF.
 * `options.mode`: 'text' | 'image'
 * `options.text` / `options.color` / `options.opacity` / `options.angle` / `options.size`
 *  drive the text watermark. `options.imageDataUrl` drives the image watermark.
 */
export async function applyWatermark(file, options = {}, onProgress = () => {}) {
  if (!file) throw new Error('No PDF selected.')

  const quality = findQuality(options.qualityId)
  const position = findPosition(options.positionId)
  const fontDef = findFont(options.fontId)
  const baseName = (options.baseName || file.name.replace(/\.pdf$/i, '') || 'watermarked').replace(/[^a-z0-9-]+/gi, '-')

  onProgress({ stage: 'loading', pct: 0, message: 'Reading source PDF…' })
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const total = pdf.numPages

  const targetPages = resolveWatermarkedPages(options, total).pages
  let imageMeta = null
  if (options.mode === 'image' && options.imageDataUrl) {
    imageMeta = await loadImageSize(options.imageDataUrl)
  }

  let out = null
  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p)
    const baseViewport = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: quality.scale })

    // Rasterise this source page
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

    // Apply watermark (if this page is in the target set)
    if (targetPages.has(p)) {
      out.saveGraphicsState()
      out.setGState(new out.GState({ opacity: Math.max(0.02, Math.min(1, Number(options.opacity) || 0.1)) }))

      if (options.mode === 'image' && options.imageDataUrl && imageMeta) {
        drawImageWatermark(out, options, position, imageMeta, W, H)
      } else {
        drawTextWatermark(out, options, position, fontDef, W, H)
      }

      out.restoreGraphicsState()
    }

    onProgress({
      stage: 'stamping',
      pct: 5 + (p / total) * 90,
      message: `Page ${p} of ${total}${targetPages.has(p) ? ' · watermarked' : ' · skipped'}`,
    })
  }

  onProgress({ stage: 'saving', pct: 98, message: 'Saving watermarked PDF…' })
  const blob = out.output('blob')
  const fileName = `${baseName}__watermarked.pdf`
  triggerDownload(blob, fileName)
  pdf.destroy()

  return {
    pages: total,
    watermarkedPages: targetPages.size,
    outputBytes: blob.size,
    fileName,
  }
}

/* ---- Text watermark layout ---- */

function drawTextWatermark(doc, options, position, fontDef, W, H) {
  const text = String(options.text || 'WATERMARK').toUpperCase()
  const size = Math.max(8, Number(options.size) || 110)
  const angle = position.id === 'center' || position.id === 'tile' ? (Number(options.angle) || -30) : 0
  const [r, g, b] = hexToRgb(options.color)
  doc.setFont(fontDef.id, 'bold')
  doc.setFontSize(size)
  doc.setTextColor(r, g, b)

  if (position.id === 'tile') {
    // Tiled diagonal stamps — repeat across the page in a grid
    const step = Math.max(120, size * 3)
    for (let y = -step; y < H + step; y += step) {
      for (let x = -step; x < W + step; x += step) {
        doc.text(text, x, y, { align: 'center', angle })
      }
    }
    return
  }

  let x, y, align = 'center'
  const pad = 20
  switch (position.id) {
    case 'top_right':    x = W - pad; y = pad + size * 0.7; align = 'right'; break
    case 'top_left':     x = pad;     y = pad + size * 0.7; align = 'left';  break
    case 'bottom_right': x = W - pad; y = H - pad;          align = 'right'; break
    case 'bottom_left':  x = pad;     y = H - pad;          align = 'left';  break
    case 'header':       x = W / 2;   y = pad + size * 0.7; align = 'center'; break
    case 'footer':       x = W / 2;   y = H - pad;          align = 'center'; break
    case 'center':
    default:             x = W / 2;   y = H / 2;            align = 'center'
  }
  doc.text(text, x, y, { align, angle })
}

/* ---- Image watermark layout ---- */

function drawImageWatermark(doc, options, position, imageMeta, W, H) {
  // Image size: cap at 60% of page width by default, preserve aspect ratio
  const widthPct = Math.max(0.05, Math.min(1, Number(options.imageWidthPct) || 0.4))
  const targetW = W * widthPct
  const aspect = imageMeta.width / Math.max(1, imageMeta.height)
  const targetH = targetW / aspect

  let x, y
  const pad = 20
  switch (position.id) {
    case 'top_right':    x = W - targetW - pad; y = pad; break
    case 'top_left':     x = pad;               y = pad; break
    case 'bottom_right': x = W - targetW - pad; y = H - targetH - pad; break
    case 'bottom_left':  x = pad;               y = H - targetH - pad; break
    case 'header':       x = (W - targetW) / 2; y = pad; break
    case 'footer':       x = (W - targetW) / 2; y = H - targetH - pad; break
    case 'tile':
    case 'center':
    default:             x = (W - targetW) / 2; y = (H - targetH) / 2
  }

  const fmt = options.imageDataUrl?.startsWith('data:image/png') ? 'PNG' : 'JPEG'
  doc.addImage(options.imageDataUrl, fmt, x, y, targetW, targetH, undefined, 'FAST')
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
