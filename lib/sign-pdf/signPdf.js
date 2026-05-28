/* ------------------------------------------------------------------ */
/*  Sign PDF engine — rasterise each source page, stamp the signature   */
/*  PNG on the target page(s), and re-emit through jsPDF.                */
/*                                                                      */
/*  Same canvas pipeline as the other PDF utilities. The signature is   */
/*  always a PNG data URL — built either from a typed name (compute.js  */
/*  `buildTypedSignatureDataUrl`), the drawn canvas, or an uploaded     */
/*  image file. Transparency is preserved via PNG, so the underlying    */
/*  page content (signature line, etc.) stays visible behind ink.       */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import { getPdfjs } from '@/lib/pdfjs-setup'
import { findQuality, findPosition, resolveSignaturePlacement, resolveSignedPages } from './compute'

export async function probePdf(file) {
  const pdfjsLib = await getPdfjs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const firstPage = await pdf.getPage(1)
  const v = firstPage.getViewport({ scale: 1 })
  pdf.destroy()
  return { pages: pdf.numPages, width: v.width, height: v.height }
}

/** File (PNG/JPG) → data URL */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Image data URL → natural width/height */
export function loadImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Apply signature to chosen page(s) and save the output PDF.
 * `options.signatureDataUrl` is the PNG produced by typing / drawing / uploading.
 */
export async function applySignature(file, options = {}, onProgress = () => {}) {
  if (!file) throw new Error('No PDF selected.')
  if (!options.signatureDataUrl) throw new Error('Signature image is empty.')

  const quality = findQuality(options.qualityId)
  const position = findPosition(options.positionId)
  const baseName = (options.baseName || file.name.replace(/\.pdf$/i, '') || 'signed').replace(/[^a-z0-9-]+/gi, '-')

  onProgress({ stage: 'loading', pct: 0, message: 'Reading source PDF…' })
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const total = pdf.numPages

  const sigMeta = await loadImageSize(options.signatureDataUrl)
  const targetPages = resolveSignedPages(options, total)

  let out = null
  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p)
    const baseViewport = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: quality.scale })

    // Rasterise the source page
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

    if (targetPages.has(p)) {
      // Signature size: clamp width to a % of page width (default 25%)
      const widthPct = Math.max(0.05, Math.min(1, Number(options.widthPct) || 0.25))
      const sigW = W * widthPct
      const aspect = sigMeta.width / Math.max(1, sigMeta.height)
      const sigH = sigW / aspect

      const { x, y } = resolveSignaturePlacement(
        position.id,
        options.customX,
        options.customY,
        W, H, sigW, sigH
      )

      out.addImage(options.signatureDataUrl, 'PNG', x, y, sigW, sigH, undefined, 'FAST')

      // Optional caption underneath ("Signed by Name · 23 May 2026")
      if (options.includeCaption && (options.signerName || options.signedDate)) {
        const parts = []
        if (options.signerName) parts.push(`Signed by ${options.signerName}`)
        if (options.signedDate) parts.push(options.signedDate)
        const caption = parts.join('  ·  ')
        out.setFont('helvetica', 'normal'); out.setFontSize(9)
        out.setTextColor(80, 80, 76)
        const cy = Math.min(H - 8, y + sigH + 14)
        const cx = position.id === 'br' || position.id === 'tr' || (position.id === 'custom' && (Number(options.customX) || 0) > 60)
          ? x + sigW
          : x
        const align = position.id === 'br' || position.id === 'tr' || (position.id === 'custom' && (Number(options.customX) || 0) > 60)
          ? 'right'
          : 'left'
        out.text(caption, cx, cy, { align })
      }
    }

    onProgress({
      stage: 'signing',
      pct: 5 + (p / total) * 90,
      message: `Page ${p} of ${total}${targetPages.has(p) ? ' · signed' : ''}`,
    })
  }

  onProgress({ stage: 'saving', pct: 98, message: 'Saving signed PDF…' })
  const blob = out.output('blob')
  const fileName = `${baseName}__signed.pdf`
  triggerDownload(blob, fileName)
  pdf.destroy()

  return {
    pages: total,
    signedPages: targetPages.size,
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
