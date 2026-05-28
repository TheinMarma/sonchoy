/* ------------------------------------------------------------------ */
/*  Protect PDF — rasterise every source page, re-emit through jsPDF    */
/*  with encryption set in the constructor. The resulting PDF requires  */
/*  the user password to open and obeys the granted-permissions list.  */
/*                                                                      */
/*  Note on encryption strength: jsPDF uses the standard PDF security   */
/*  handler. Modern PDF viewers honour the password and permission      */
/*  bits; sophisticated attackers with the encrypted bytes can still    */
/*  brute-force a weak password. The UI nudges users to strong ones.    */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import { getPdfjs } from '@/lib/pdfjs-setup'
import { findQuality } from './compute'

export async function probePdf(file) {
  const pdfjsLib = await getPdfjs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const firstPage = await pdf.getPage(1)
  const v = firstPage.getViewport({ scale: 1 })
  pdf.destroy()
  return { pages: pdf.numPages, width: v.width, height: v.height }
}

export async function protectPdf(file, options = {}, onProgress = () => {}) {
  if (!file) throw new Error('No PDF selected.')
  if (!options.userPassword) throw new Error('User password is required.')

  const quality = findQuality(options.qualityId)
  const baseName = (options.baseName || file.name.replace(/\.pdf$/i, '') || 'protected').replace(/[^a-z0-9-]+/gi, '-')

  onProgress({ stage: 'loading', pct: 0, message: 'Reading source PDF…' })
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const total = pdf.numPages

  // We must set encryption in the constructor — jsPDF can't add it after the
  // fact. Use the first page's dimensions to initialise; subsequent pages get
  // explicit dims via addPage().
  const first = await pdf.getPage(1)
  const baseVP = first.getViewport({ scale: 1 })
  const orientation0 = baseVP.width > baseVP.height ? 'landscape' : 'portrait'

  const out = new jsPDF({
    unit: 'pt',
    format: [baseVP.width, baseVP.height],
    orientation: orientation0,
    compress: true,
    encryption: {
      userPassword:  String(options.userPassword),
      ownerPassword: String(options.ownerPassword || options.userPassword),
      userPermissions: Array.isArray(options.permissions) ? options.permissions : [],
    },
  })

  // Render every page (including page 1 again into the initialised doc)
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

    if (p > 1) {
      out.addPage([W, H], orientation)
    } else {
      // Re-size page 1 to actual dimensions (the constructor used baseVP which
      // is already page 1's size, but this keeps the logic uniform).
      // No action needed — page 1 is already correct.
    }
    out.addImage(dataUrl, 'JPEG', 0, 0, W, H, undefined, 'FAST')

    onProgress({
      stage: 'encrypting',
      pct: 5 + (p / total) * 90,
      message: `Page ${p} of ${total}`,
    })
  }

  onProgress({ stage: 'saving', pct: 98, message: 'Encrypting & saving…' })
  const blob = out.output('blob')
  const fileName = `${baseName}__protected.pdf`
  triggerDownload(blob, fileName)
  pdf.destroy()

  return {
    pages: total,
    outputBytes: blob.size,
    fileName,
    permissions: options.permissions || [],
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
