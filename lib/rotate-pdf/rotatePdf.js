/* ------------------------------------------------------------------ */
/*  Rotate engine — render each source page, optionally rotate via a    */
/*  second canvas, then emit through jsPDF.                              */
/*                                                                      */
/*  Why a second canvas? Drawing the source canvas onto a rotated ctx   */
/*  is the cleanest way to handle 90° / 270° rotations where the page   */
/*  width and height swap. 180° works on the original canvas in place   */
/*  but we use the same rotated-canvas path for consistency.            */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import { getPdfjs } from '@/lib/pdfjs-setup'
import { findQuality, resolveRotations } from './compute'

const THUMB_SCALE = 0.18

export async function probePdf(file) {
  const pdfjsLib = await getPdfjs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const firstPage = await pdf.getPage(1)
  const v = firstPage.getViewport({ scale: 1 })
  pdf.destroy()
  return { pages: pdf.numPages, width: v.width, height: v.height }
}

/**
 * Probe + render small thumbnails for the per-page picker. Same approach
 * as the Reorder tool: thumbs let users identify pages visually before
 * deciding which need rotating.
 */
export async function probePdfWithThumbs(file, onProgress = () => {}) {
  const pdfjsLib = await getPdfjs()
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
      width: v.width,
      height: v.height,
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
 * Apply rotation map and emit a new PDF.
 * `rotationMap` is a Map<pageNum, rotationDegrees> (0/90/180/270).
 */
export async function rotatePdf(file, options = {}, onProgress = () => {}) {
  if (!file) throw new Error('No PDF selected.')

  const quality = findQuality(options.qualityId)
  const baseName = (options.baseName || file.name.replace(/\.pdf$/i, '') || 'rotated').replace(/[^a-z0-9-]+/gi, '-')

  onProgress({ stage: 'loading', pct: 0, message: 'Reading source PDF…' })
  const pdfjsLib = await getPdfjs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const total = pdf.numPages

  const { map: rotationMap } = resolveRotations(options, total)

  let out = null
  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p)
    const baseViewport = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: quality.scale })

    // 1) Render source page to canvas at chosen quality
    const src = document.createElement('canvas')
    src.width = Math.ceil(viewport.width)
    src.height = Math.ceil(viewport.height)
    const srcCtx = src.getContext('2d')
    await page.render({ canvasContext: srcCtx, viewport }).promise

    // 2) If rotation is non-zero, draw onto a rotated canvas
    const rotation = rotationMap.get(p) || 0
    let outCanvas = src
    if (rotation !== 0) {
      const dst = document.createElement('canvas')
      const sw = src.width, sh = src.height
      const sideways = rotation === 90 || rotation === 270
      dst.width  = sideways ? sh : sw
      dst.height = sideways ? sw : sh
      const ctx = dst.getContext('2d')
      ctx.save()
      ctx.translate(dst.width / 2, dst.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(src, -sw / 2, -sh / 2)
      ctx.restore()
      outCanvas = dst
    }

    const dataUrl = outCanvas.toDataURL('image/jpeg', quality.jpegQuality)

    // 3) Target PDF page dimensions match the rotated canvas's aspect ratio,
    //    sized from the source page's PDF-point dims (rotated where needed).
    const W = baseViewport.width
    const H = baseViewport.height
    const sideways = rotation === 90 || rotation === 270
    const pageW = sideways ? H : W
    const pageH = sideways ? W : H
    const orientation = pageW > pageH ? 'landscape' : 'portrait'

    if (!out) {
      out = new jsPDF({ unit: 'pt', format: [pageW, pageH], orientation, compress: true })
    } else {
      out.addPage([pageW, pageH], orientation)
    }
    out.addImage(dataUrl, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST')

    onProgress({
      stage: 'rotating',
      pct: 5 + (p / total) * 90,
      message: `Page ${p} of ${total}${rotation !== 0 ? ` · rotated ${rotation}°` : ''}`,
    })
  }

  onProgress({ stage: 'saving', pct: 98, message: 'Saving rotated PDF…' })
  const blob = out.output('blob')
  const fileName = `${baseName}__rotated.pdf`
  triggerDownload(blob, fileName)
  pdf.destroy()

  let rotatedCount = 0
  for (const v of rotationMap.values()) if (v !== 0) rotatedCount += 1

  return {
    pages: total,
    rotatedPages: rotatedCount,
    outputBytes: blob.size,
    fileName,
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
