/* ------------------------------------------------------------------ */
/*  Unlock PDF — decrypt with pdfjs (using the supplied password),       */
/*  rasterise every page, and re-emit a fresh PDF with no security.     */
/*                                                                      */
/*  Same canvas pipeline as the other PDF utilities. The output is an   */
/*  unencrypted, rasterised PDF — text becomes part of each page image. */
/*  For text-preserving unlock, recipients can OCR the result.          */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import { getPdfjs } from '@/lib/pdfjs-setup'
import { findQuality } from './compute'

/* ---- Probe ---- */

/**
 * Try to open the PDF with `password`. Returns `{ pages, encrypted }` on success.
 * Throws with a recognisable message when:
 *  - `password` is missing for an encrypted PDF (caller should prompt the user)
 *  - the password is incorrect
 *  - the PDF itself is malformed
 */
export async function probePdf(file, password = '') {
  const pdfjsLib = await getPdfjs()
  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    password: password || undefined,
  })
  const pdf = await loadingTask.promise
  const firstPage = await pdf.getPage(1)
  const v = firstPage.getViewport({ scale: 1 })
  // pdfjs doesn't expose a public "was encrypted" flag, but if loading
  // succeeded with a password, treat it as encrypted; if no password was
  // needed, the doc was either unencrypted or had an empty user password.
  const encrypted = !!password
  pdf.destroy()
  return { pages: pdf.numPages, width: v.width, height: v.height, encrypted }
}

/* ---- Main unlock pipeline ---- */

export async function unlockPdf(file, options = {}, onProgress = () => {}) {
  if (!file) throw new Error('No PDF selected.')

  const quality = findQuality(options.qualityId)
  const baseName = (options.baseName || file.name.replace(/\.pdf$/i, '') || 'unlocked').replace(/[^a-z0-9-]+/gi, '-')
  const password = options.password || ''

  onProgress({ stage: 'loading', pct: 0, message: 'Decrypting source PDF…' })
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    password: password || undefined,
  }).promise

  const total = pdf.numPages
  let out = null

  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p)
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
      pct: 5 + (p / total) * 90,
      message: `Page ${p} of ${total}`,
    })
  }

  onProgress({ stage: 'saving', pct: 98, message: 'Saving unlocked PDF…' })
  const blob = out.output('blob')
  const fileName = `${baseName}__unlocked.pdf`
  triggerDownload(blob, fileName)
  pdf.destroy()

  return { pages: total, outputBytes: blob.size, fileName }
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
