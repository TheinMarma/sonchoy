/* ------------------------------------------------------------------ */
/*  Scan → PDF builder                                                   */
/*                                                                       */
/*  Takes the captured pages (each one already a data URL + dimensions) */
/*  and assembles a multi-page PDF after applying the chosen scan       */
/*  filter via an offscreen canvas.                                      */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import { findPageSize, findFilter, findQuality, applyFilter } from './compute'

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function loadImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, image: img })
    img.onerror = reject
    img.src = dataUrl
  })
}

/* Render the source image to a canvas, apply the scan filter, return a
   new JPEG data URL (or PNG if quality is high and small image). */
async function applyScanFilter(dataUrl, filterId, scale, jpegQuality) {
  const { image, width, height } = await loadImageSize(dataUrl)
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, w, h)
  applyFilter(ctx, w, h, filterId)
  return {
    dataUrl: canvas.toDataURL('image/jpeg', jpegQuality),
    width: w,
    height: h,
  }
}

export async function buildScanPdf(captures, options = {}, onProgress = () => {}) {
  if (!captures || captures.length === 0) throw new Error('No pages captured.')

  const pageSize = findPageSize(options.pageSizeId)
  const filter   = findFilter(options.filterId)
  const quality  = findQuality(options.qualityId)
  const baseName = (options.baseName || 'scan').replace(/[^a-z0-9-]+/gi, '-')

  onProgress({ stage: 'init', pct: 0, message: 'Starting…' })

  let out = null
  for (let i = 0; i < captures.length; i++) {
    const cap = captures[i]
    if (!cap.dataUrl) continue

    onProgress({ stage: 'filtering', pct: 5 + (i / captures.length) * 85, message: `Page ${i + 1} of ${captures.length} · ${filter.label.split('(')[0].trim()}` })
    const processed = await applyScanFilter(cap.dataUrl, filter.id, quality.scale, quality.jpegQuality)

    let pageW, pageH
    if (pageSize.id === 'fit') {
      pageW = processed.width * 72 / 96
      pageH = processed.height * 72 / 96
    } else {
      const orient = processed.width > processed.height ? 'landscape' : 'portrait'
      pageW = orient === 'landscape' ? Math.max(pageSize.w, pageSize.h) : Math.min(pageSize.w, pageSize.h)
      pageH = orient === 'landscape' ? Math.min(pageSize.w, pageSize.h) : Math.max(pageSize.w, pageSize.h)
    }
    const orientation = pageW > pageH ? 'landscape' : 'portrait'

    if (!out) {
      out = new jsPDF({ unit: 'pt', format: [pageW, pageH], orientation, compress: true })
    } else {
      out.addPage([pageW, pageH], orientation)
    }

    // Place the scanned page to fit the entire page (contain), preserving aspect
    const aspect = processed.width / processed.height
    let imgW, imgH, imgX, imgY
    const pageAspect = pageW / pageH
    if (aspect > pageAspect) {
      imgW = pageW
      imgH = pageW / aspect
      imgX = 0
      imgY = (pageH - imgH) / 2
    } else {
      imgH = pageH
      imgW = pageH * aspect
      imgX = (pageW - imgW) / 2
      imgY = 0
    }
    out.addImage(processed.dataUrl, 'JPEG', imgX, imgY, imgW, imgH, undefined, 'FAST')
  }

  onProgress({ stage: 'saving', pct: 96, message: 'Saving PDF…' })
  const blob = out.output('blob')
  const fileName = `${baseName}.pdf`
  triggerDownload(blob, fileName)
  return {
    pages: captures.length,
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
