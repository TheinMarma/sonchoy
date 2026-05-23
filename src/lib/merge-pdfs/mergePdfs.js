/* ------------------------------------------------------------------ */
/*  Merge engine — renders every page of every source PDF onto a        */
/*  canvas, then assembles them into a single output PDF via jsPDF.     */
/*                                                                      */
/*  Pure in-browser; uses the existing pdfjs-dist worker setup.         */
/* ------------------------------------------------------------------ */

import jsPDF from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'
import { findPageSize, findQuality, findCoverMode, findOrientation, formatBytes } from './compute'

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerPort) {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()
}

const A4 = { w: 595.28, h: 841.89 }
const LETTER = { w: 612, h: 792 }
const MARGIN = 40

/* Resolve the target page dimensions for the output PDF. */
function targetDims(pageSizeId, sourceDimsPt, orientationId) {
  let base
  if (pageSizeId === 'a4') base = { ...A4 }
  else if (pageSizeId === 'letter') base = { ...LETTER }
  else base = { ...sourceDimsPt }

  if (orientationId === 'portrait' && base.w > base.h) base = { w: base.h, h: base.w }
  if (orientationId === 'landscape' && base.h > base.w) base = { w: base.h, h: base.w }

  return base
}

/**
 * Quickly read a PDF's page count and first-page dims (without rasterising).
 * Used by the page-side UI to display per-file metadata before merge.
 */
export async function probePdf(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const firstPage = await pdf.getPage(1)
  const v = firstPage.getViewport({ scale: 1 })
  pdf.destroy()
  return { pages: pdf.numPages, width: v.width, height: v.height }
}

/**
 * Merge `files` into a single PDF. Calls `onProgress({ stage, pct, message })`
 * during long passes so the UI can show a live status line.
 *
 * - One source file = one chapter (optionally introduced by a TOC entry on the cover).
 * - Each page is rasterised at the chosen quality scale and embedded as JPEG.
 *
 * Why rasterise rather than re-embed? Re-embedding requires `pdf-lib` (a
 * second PDF stack). Rasterising uses tools already in the bundle and works
 * uniformly across encrypted/uncommon source PDFs. Trade-off: text becomes
 * non-selectable in the merged output (noted in the FAQ).
 */
export async function mergePdfs(files, options = {}, onProgress = () => {}) {
  const pageSize = findPageSize(options.pageSizeId)
  const quality  = findQuality(options.qualityId)
  const coverMode = findCoverMode(options.coverModeId)
  const orientation = findOrientation(options.orientationId)
  const includePageNumbers = options.includePageNumbers !== false
  const includeFileBreaks  = options.includeFileBreaks  !== false

  if (!files || files.length === 0) throw new Error('No files supplied to merge.')

  // Load all PDFs up-front so we know total page count for progress.
  onProgress({ stage: 'loading', pct: 0, message: 'Reading source PDFs…' })
  const docs = []
  let totalPages = 0
  for (let i = 0; i < files.length; i++) {
    const buf = await files[i].arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise
    docs.push({ file: files[i], pdf, label: files[i].name })
    totalPages += pdf.numPages
    onProgress({
      stage: 'loading',
      pct: ((i + 1) / files.length) * 10,  // first 10% for load
      message: `Loaded ${files[i].name} (${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'})`,
    })
  }

  // Build output doc using A4 portrait baseline; pages are added per source.
  const out = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
  // Track of TOC entries — captured during render so we can stamp page numbers later.
  const tocEntries = []

  /* ---- Cover sheet ---- */
  if (coverMode.id !== 'none') {
    onProgress({ stage: 'cover', pct: 12, message: 'Drawing cover sheet…' })
    drawCover(out, {
      title: options.title || 'Financial PDF packet',
      subtitle: options.subtitle || '',
      preparedBy: options.preparedBy || '',
      preparedDate: options.preparedDate || '',
      files: docs.map((d) => ({ name: d.label, pages: d.pdf.numPages })),
      includeToc: coverMode.id === 'toc',
    })
  }

  /* ---- Render every page of every source PDF ---- */
  let renderedSoFar = 0
  for (let docIx = 0; docIx < docs.length; docIx++) {
    const { pdf, label } = docs[docIx]
    // Record where each file starts in the merged PDF (for the TOC + manifest)
    const chapterStartPage = out.internal.getNumberOfPages()
      + (coverMode.id === 'none' && docIx === 0 ? 1 : 0)
      // adjust because we add the first page below; this gives the page the chapter begins on

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const baseViewport = page.getViewport({ scale: 1 })
      const target = targetDims(pageSize.id, { w: baseViewport.width, h: baseViewport.height }, orientation.id)

      // Add a new page in the output PDF matching `target`
      // (jsPDF first page already exists; we need addPage for every page from p=1 onward
      // unless it's the very first rendered page and there's no cover.)
      const isFirstRendered = docIx === 0 && p === 1 && coverMode.id === 'none'
      if (isFirstRendered) {
        // Replace the default first page with one of the right size by deleting and re-adding
        out.deletePage(1)
      }
      out.addPage([target.w, target.h], target.w > target.h ? 'landscape' : 'portrait')

      // Rasterise at the chosen quality
      const renderScale = quality.scale * (target.w / baseViewport.width)
      const viewport = page.getViewport({ scale: renderScale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport }).promise

      const dataUrl = canvas.toDataURL('image/jpeg', quality.jpegQuality)

      // Place the rasterised page inside the target page. If aspect ratios
      // differ (e.g. a landscape source rendered into A4 portrait), centre it.
      const targetAspect = target.w / target.h
      const sourceAspect = baseViewport.width / baseViewport.height
      let imgW, imgH, imgX, imgY
      if (sourceAspect > targetAspect) {
        imgW = target.w
        imgH = target.w / sourceAspect
        imgX = 0
        imgY = (target.h - imgH) / 2
      } else {
        imgH = target.h
        imgW = target.h * sourceAspect
        imgX = (target.w - imgW) / 2
        imgY = 0
      }
      out.addImage(dataUrl, 'JPEG', imgX, imgY, imgW, imgH, undefined, 'FAST')

      renderedSoFar += 1
      onProgress({
        stage: 'rendering',
        pct: 15 + (renderedSoFar / totalPages) * 80,
        message: `Page ${renderedSoFar} of ${totalPages} · ${label}`,
      })
    }

    // Capture TOC entry now that we know which output page the chapter starts on.
    tocEntries.push({
      name: label,
      pages: pdf.numPages,
      startOutputPage: chapterStartPage,
    })

    if (includeFileBreaks && docIx < docs.length - 1) {
      // A blank divider page between source files
      out.addPage([A4.w, A4.h], 'portrait')
      drawFileBreak(out, docs[docIx + 1].label, docIx + 2, docs.length)
    }
  }

  /* ---- Page numbers ---- */
  if (includePageNumbers) {
    onProgress({ stage: 'finalising', pct: 96, message: 'Stamping page numbers…' })
    const pageCount = out.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      out.setPage(i)
      const w = out.internal.pageSize.getWidth()
      const h = out.internal.pageSize.getHeight()
      out.setFont('helvetica', 'normal'); out.setFontSize(8)
      out.setTextColor(130, 130, 124)
      out.text(`Page ${i} of ${pageCount}`, w - 20, h - 14, { align: 'right' })
      if (options.title) {
        out.text(options.title, 20, h - 14)
      }
    }
  }

  onProgress({ stage: 'saving', pct: 100, message: 'Saving merged PDF…' })

  const fileName = `${(options.title || 'merged').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  out.save(fileName)

  // Cleanup
  for (const d of docs) { try { d.pdf.destroy() } catch { /* noop */ } }

  return {
    pages: out.internal.getNumberOfPages(),
    files: docs.length,
    toc: tocEntries,
    fileName,
  }
}

/* ---- Cover sheet rendering ---- */

function drawCover(doc, ctx) {
  // The doc was created with one default A4 portrait page — draw cover on it.
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // Accent stripe
  doc.setFillColor(251, 191, 36)
  doc.rect(0, 0, W, 6, 'F')

  let y = MARGIN + 10
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28)
  doc.setTextColor(10, 10, 9)
  doc.text(ctx.title, MARGIN, y + 26)
  y += 40

  if (ctx.subtitle) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12)
    doc.setTextColor(80, 80, 76)
    const lines = doc.splitTextToSize(ctx.subtitle, W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 16 }
    y += 6
  }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(130, 130, 124)
  if (ctx.preparedBy)   { doc.text(`Prepared by: ${ctx.preparedBy}`, MARGIN, y); y += 12 }
  if (ctx.preparedDate) { doc.text(`Date: ${ctx.preparedDate}`, MARGIN, y); y += 12 }
  doc.text(`Files merged: ${ctx.files.length}  ·  Total source pages: ${ctx.files.reduce((s, f) => s + f.pages, 0)}`, MARGIN, y); y += 18

  doc.setDrawColor(251, 191, 36); doc.setLineWidth(1)
  doc.line(MARGIN, y, W - MARGIN, y); y += 18

  // File list / TOC
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(180, 110, 5)
  doc.text(ctx.includeToc ? 'TABLE OF CONTENTS' : 'INCLUDED FILES', MARGIN, y); y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  for (let i = 0; i < ctx.files.length; i++) {
    if (y > H - MARGIN - 24) {
      doc.addPage('a4', 'portrait'); y = MARGIN
    }
    const f = ctx.files[i]
    doc.setTextColor(130, 130, 124)
    doc.text(`${i + 1}.`, MARGIN, y + 10)
    doc.setTextColor(10, 10, 9)
    const name = f.name.length > 70 ? f.name.slice(0, 69) + '…' : f.name
    doc.text(name, MARGIN + 22, y + 10)
    doc.setTextColor(130, 130, 124)
    doc.text(`${f.pages} pp`, W - MARGIN, y + 10, { align: 'right' })
    y += 16
  }
}

/* Divider page between source files */
function drawFileBreak(doc, nextFileName, nextIndex, totalCount) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setFillColor(248, 248, 244); doc.rect(0, 0, W, H, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.setTextColor(180, 110, 5)
  doc.text(`FILE ${nextIndex} OF ${totalCount}`, W / 2, H / 2 - 18, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(16)
  doc.setTextColor(10, 10, 9)
  const lines = doc.splitTextToSize(nextFileName, W - MARGIN * 2)
  let y = H / 2
  for (const ln of lines) { doc.text(ln, W / 2, y, { align: 'center' }); y += 22 }
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9)
  doc.setTextColor(130, 130, 124)
  doc.text('(divider page · skip to continue)', W / 2, H - 80, { align: 'center' })
}

/* Public convenience export so the page can show byte/page totals using the
   same helper as the merge engine. */
export { formatBytes }
