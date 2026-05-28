/* ------------------------------------------------------------------ */
/*  JPG / PNG receipt → single-image PDF                                 */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import { findPageSize, findFitMode, findMarginPreset, findQuality, resolvePlacement, pickOrientation } from './compute'

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
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

function isPng(dataUrl) {
  return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png')
}

/**
 * Build + save a single-image PDF.
 * `image`: { dataUrl, width, height, name }
 */
export async function buildJpgReceiptPdf(image, options = {}, onProgress = () => {}) {
  if (!image || !image.dataUrl) throw new Error('Add a receipt image first.')

  const pageSize     = findPageSize(options.pageSizeId)
  const fitMode      = findFitMode(options.fitModeId)
  const marginPreset = findMarginPreset(options.marginId)
  const quality      = findQuality(options.qualityId)
  void quality  // (jsPDF re-encodes; native image quality is what survives)
  const margin       = Number(marginPreset.pt) || 0
  const baseName     = (options.baseName || (image.name || 'receipt').replace(/\.[^.]+$/, '')).replace(/[^a-z0-9-]+/gi, '-')

  onProgress({ stage: 'init', pct: 5, message: 'Sizing page…' })

  // Resolve page dimensions
  let pageW, pageH
  if (pageSize.id === 'fit') {
    // Convert image px → pt at 96 dpi, plus margins
    pageW = (image.width  * 72 / 96) + margin * 2
    pageH = (image.height * 72 / 96) + margin * 2
  } else {
    const orientation = pickOrientation(pageSize, image.width, image.height)
    pageW = orientation === 'landscape' ? Math.max(pageSize.w, pageSize.h) : Math.min(pageSize.w, pageSize.h)
    pageH = orientation === 'landscape' ? Math.min(pageSize.w, pageSize.h) : Math.max(pageSize.w, pageSize.h)
  }

  const orientation = pageW > pageH ? 'landscape' : 'portrait'
  const out = new jsPDF({ unit: 'pt', format: [pageW, pageH], orientation, compress: true })

  // Optional caption / metadata header above the receipt
  let topPad = margin
  if (options.includeCaption && (options.caption || options.captionDate)) {
    out.setFont('helvetica', 'normal'); out.setFontSize(9)
    out.setTextColor(130, 130, 124)
    const parts = []
    if (options.caption)     parts.push(options.caption)
    if (options.captionDate) parts.push(options.captionDate)
    const captionText = parts.join('  ·  ')
    out.text(captionText, margin, margin + 10)
    topPad = margin + 24
  }

  // Image slot inside the margin box (minus the caption pad on top)
  const slotX = margin
  const slotY = topPad
  const slotW = pageW - margin * 2
  const slotH = pageH - topPad - margin

  const rect = resolvePlacement(fitMode.id, image.width, image.height, slotX, slotY, slotW, slotH)
  const fmt = isPng(image.dataUrl) ? 'PNG' : 'JPEG'

  onProgress({ stage: 'embedding', pct: 60, message: 'Embedding image…' })
  out.addImage(image.dataUrl, fmt, rect.x, rect.y, rect.w, rect.h, undefined, 'FAST')

  // Optional small footer with original filename
  if (options.includeFilename && image.name) {
    out.setFont('helvetica', 'normal'); out.setFontSize(7)
    out.setTextColor(150, 150, 142)
    out.text(image.name, margin, pageH - 8)
  }

  onProgress({ stage: 'saving', pct: 95, message: 'Saving PDF…' })
  const blob = out.output('blob')
  const fileName = `${baseName}.pdf`
  triggerDownload(blob, fileName)

  return {
    pageW,
    pageH,
    orientation,
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
