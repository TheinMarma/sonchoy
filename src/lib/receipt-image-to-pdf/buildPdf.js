/* ------------------------------------------------------------------ */
/*  Receipt Image → PDF builder                                          */
/*                                                                       */
/*  Reads each user-supplied image as a data URL, places it onto a PDF  */
/*  page per the chosen page size + fit + layout + margins, optionally  */
/*  adds a cover sheet with a manifest, and saves the result via jsPDF. */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import {
  findPageSize, findFitMode, findOrientation, findLayout, findSortOption,
  findQuality, findMarginPreset,
  sortImages, resolveImageRect,
} from './compute'

const MARGIN = 40
const C_INK_950 = [10, 10, 9]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_CONV    = [96, 165, 250]
const C_CONV_DK = [37, 99, 235]

/** Read a File into a data URL. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Load an image to discover its natural dimensions. */
export function loadImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

/** True if the data URL is a PNG (used to pick the right jsPDF image type). */
function isPng(dataUrl) {
  return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png')
}

/**
 * Build + save the receipt PDF.
 * `images`: array of { id, file, name, size, dataUrl, width, height, lastModified }
 */
export async function buildReceiptPdf(images, options = {}, onProgress = () => {}) {
  if (!images || images.length === 0) throw new Error('Add at least one receipt image.')

  const pageSize    = findPageSize(options.pageSizeId)
  const fitMode     = findFitMode(options.fitModeId)
  const orientation = findOrientation(options.orientationId)
  const layout      = findLayout(options.layoutId)
  const sortOpt     = findSortOption(options.sortId)
  const quality     = findQuality(options.qualityId)
  const marginPreset = findMarginPreset(options.marginId)
  const baseName    = (options.baseName || 'receipts').replace(/[^a-z0-9-]+/gi, '-')

  const sorted = sortImages(images, sortOpt.id)
  const margin = Number(marginPreset.pt) || 0

  onProgress({ stage: 'init', pct: 0, message: 'Starting…' })

  /* For 'fit' page size we size each page to the image; otherwise we use
     the chosen page size (A4, Letter, A5, receipt strip). */
  const isFitPage = pageSize.id === 'fit'

  // Determine grid slots per page based on layout
  const slotsPerPage = layout.id === 'grid_4' ? 4
    : layout.id === 'grid_2' ? 2
    : 1

  // Choose orientation for fixed page sizes
  function resolveOrientation(imgW, imgH) {
    if (orientation.id === 'portrait')  return 'portrait'
    if (orientation.id === 'landscape') return 'landscape'
    return imgW > imgH ? 'landscape' : 'portrait'
  }

  // Init output doc with first image's dims (avoids "delete first page" gymnastics)
  let out = null
  let slotCounter = 0
  let pagePageW = 0
  let pagePageH = 0

  /* Optional cover sheet — drawn first if requested. We'll add the doc with
     A4 portrait, draw the cover, then continue with image pages. */
  if (options.includeCover) {
    out = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true })
    drawCover(out, {
      title: options.title || 'Receipt packet',
      subtitle: options.subtitle || '',
      preparedBy: options.preparedBy || '',
      preparedDate: options.preparedDate || '',
      files: sorted.map((im) => ({ name: im.name, size: im.size, dimensions: `${im.width}×${im.height}` })),
      total: sorted.length,
    })
  }

  for (let i = 0; i < sorted.length; i++) {
    const im = sorted[i]
    if (!im.dataUrl || !im.width || !im.height) continue

    const orient = isFitPage ? (im.width > im.height ? 'landscape' : 'portrait') : resolveOrientation(im.width, im.height)

    // Compute target page size for this image
    let pageW, pageH
    if (isFitPage) {
      // Convert image px → pt at ~96 dpi
      pageW = im.width  * 72 / 96
      pageH = im.height * 72 / 96
    } else {
      pageW = orient === 'landscape' ? Math.max(pageSize.w, pageSize.h) : Math.min(pageSize.w, pageSize.h)
      pageH = orient === 'landscape' ? Math.min(pageSize.w, pageSize.h) : Math.max(pageSize.w, pageSize.h)
    }

    // Open a new page when:
    //  - we don't have a doc yet
    //  - we're starting a new layout-grid page
    //  - the previous page's size differs (only matters for 'fit' page size)
    const startingNewPage = (slotCounter % slotsPerPage) === 0
    if (startingNewPage) {
      pagePageW = pageW
      pagePageH = pageH
      if (!out) {
        out = new jsPDF({ unit: 'pt', format: [pageW, pageH], orientation: orient, compress: true })
      } else {
        out.addPage([pageW, pageH], orient)
      }
    }

    // Slot index within this page
    const slotIdx = slotCounter % slotsPerPage

    // Compute slot rect on the current page (uses pagePageW/H captured at page open)
    const slot = slotRect(layout.id, slotIdx, pagePageW, pagePageH, margin)
    const rect = resolveImageRect(fitMode.id, im.width, im.height, slot.x, slot.y, slot.w, slot.h)
    const fmt = isPng(im.dataUrl) ? 'PNG' : 'JPEG'
    // jsPDF doesn't expose a quality knob for addImage — JPEG quality lives in
    // how we capture the source. For now, we ride the file's native encoding.
    void quality
    out.addImage(im.dataUrl, fmt, rect.x, rect.y, rect.w, rect.h, undefined, 'FAST')

    // Optional per-image caption (filename / index)
    if (options.includeCaptions) {
      out.setFont('helvetica', 'normal'); out.setFontSize(8)
      out.setTextColor(...C_INK_500)
      const captionY = Math.min(pagePageH - 8, slot.y + slot.h + 12)
      const caption = `${i + 1}. ${im.name}`
      out.text(caption, slot.x, captionY)
    }

    slotCounter += 1

    onProgress({
      stage: 'building',
      pct: 5 + ((i + 1) / sorted.length) * 90,
      message: `Page ${slotCounter} of ${sorted.length} · ${im.name}`,
    })
  }

  // Page numbers
  if (options.includePageNumbers !== false && out) {
    const total = out.internal.getNumberOfPages()
    for (let p = 1; p <= total; p++) {
      out.setPage(p)
      const w = out.internal.pageSize.getWidth()
      const h = out.internal.pageSize.getHeight()
      out.setFont('helvetica', 'normal'); out.setFontSize(8)
      out.setTextColor(...C_INK_500)
      out.text(`Page ${p} of ${total}`, w - 20, h - 14, { align: 'right' })
      if (options.title) out.text(options.title, 20, h - 14)
    }
  }

  onProgress({ stage: 'saving', pct: 98, message: 'Saving PDF…' })

  const blob = out.output('blob')
  const fileName = `${baseName}.pdf`
  triggerDownload(blob, fileName)

  return {
    pages: out.internal.getNumberOfPages(),
    receipts: sorted.length,
    outputBytes: blob.size,
    fileName,
  }
}

/* ---- Slot geometry within a single page ---- */

function slotRect(layoutId, slotIdx, pageW, pageH, margin) {
  const contentX = margin
  const contentY = margin
  const contentW = pageW - margin * 2
  const contentH = pageH - margin * 2

  if (layoutId === 'grid_2') {
    // Two stacked vertically
    const halfH = (contentH - margin) / 2
    if (slotIdx === 0) return { x: contentX, y: contentY,          w: contentW, h: halfH }
    return                       { x: contentX, y: contentY + halfH + margin, w: contentW, h: halfH }
  }
  if (layoutId === 'grid_4') {
    // 2 columns × 2 rows
    const halfW = (contentW - margin) / 2
    const halfH = (contentH - margin) / 2
    const col = slotIdx % 2
    const row = Math.floor(slotIdx / 2)
    return {
      x: contentX + col * (halfW + margin),
      y: contentY + row * (halfH + margin),
      w: halfW,
      h: halfH,
    }
  }
  // one_per_page
  return { x: contentX, y: contentY, w: contentW, h: contentH }
}

/* ---- Cover sheet (only drawn when includeCover is true) ---- */

function drawCover(doc, ctx) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  doc.setFillColor(...C_CONV)
  doc.rect(0, 0, W, 6, 'F')

  let y = MARGIN + 10
  doc.setFont('helvetica', 'bold'); doc.setFontSize(26)
  doc.setTextColor(...C_INK_950)
  doc.text(ctx.title, MARGIN, y + 26); y += 40

  if (ctx.subtitle) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12)
    doc.setTextColor(80, 80, 76)
    const lines = doc.splitTextToSize(ctx.subtitle, W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 16 }
    y += 4
  }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (ctx.preparedBy)   { doc.text(`Prepared by: ${ctx.preparedBy}`, MARGIN, y); y += 12 }
  if (ctx.preparedDate) { doc.text(`Date: ${ctx.preparedDate}`, MARGIN, y); y += 12 }
  doc.text(`Total receipts: ${ctx.total}`, MARGIN, y); y += 18

  doc.setDrawColor(...C_CONV); doc.setLineWidth(1)
  doc.line(MARGIN, y, W - MARGIN, y); y += 18

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(...C_CONV_DK)
  doc.text('RECEIPTS IN THIS PACKET', MARGIN, y); y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  for (let i = 0; i < ctx.files.length; i++) {
    if (y > H - MARGIN - 24) { doc.addPage('a4', 'portrait'); y = MARGIN }
    const f = ctx.files[i]
    doc.setTextColor(...C_INK_500)
    doc.text(`${i + 1}.`, MARGIN, y + 10)
    doc.setTextColor(...C_INK_950)
    const name = f.name.length > 60 ? f.name.slice(0, 59) + '…' : f.name
    doc.text(name, MARGIN + 22, y + 10)
    doc.setTextColor(...C_INK_500)
    doc.text(f.dimensions, W - MARGIN, y + 10, { align: 'right' })
    y += 16
  }

  // Footer hint
  if (y < H - MARGIN - 24) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Receipts follow on the next pages.', MARGIN, H - MARGIN)
  }

  void C_LINE
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
