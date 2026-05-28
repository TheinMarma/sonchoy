import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findExportMode, findPageSize, findSortOption,
  parseRows, sortRows, totalForRow, computeBatchTotals, buildStatusSummary,
} from './compute'

const MARGIN = 40
const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_INV     = [251, 191, 36]
const C_INV_DK  = [180, 110, 5]

const BODY = 10
const LINE_H = 14

function pageDims(pageSizeId) {
  // jsPDF uses pt: A4 595.28 × 841.89, Letter 612 × 792
  if (pageSizeId === 'letter') return { w: 612, h: 792 }
  return { w: 595.28, h: 841.89 }
}

export function generateBatchInvoicePdf(data) {
  const cur = findCurrency(data.currency || 'USD')
  const mode = findExportMode(data.exportModeId)
  const pageSize = findPageSize(data.pageSizeId)
  const sortOpt  = findSortOption(data.sortId)
  const { w: PAGE_W, h: PAGE_H } = pageDims(pageSize.id)

  const parsed = parseRows(data.csvText, data.parseFormatId)
  const rows = sortRows(parsed.rows, sortOpt.id)
  const totals = computeBatchTotals(rows)
  const statusSummary = buildStatusSummary(rows)

  const doc = new jsPDF({ unit: 'pt', format: pageSize.id === 'letter' ? 'letter' : 'a4' })

  /* ---- Cover sheet (page 1) ---- */
  let y = MARGIN
  doc.setFillColor(...C_INV)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.company?.name || '[Your business]', MARGIN, y + 18)
  y += 24
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.company?.address) {
    const lines = doc.splitTextToSize(data.company.address, PAGE_W / 2 - MARGIN)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  const contact = [data.company?.email, data.company?.phone].filter(Boolean).join('  ·  ')
  if (contact) { doc.text(contact, MARGIN, y); y += 12 }

  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INV_DK)
  doc.text('INVOICE BATCH EXPORT', PAGE_W - MARGIN, rightY + 22, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.batchId)      { doc.text(`Batch #: ${data.batchId}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.batchDate)    { doc.text(`Prepared: ${formatDate(data.batchDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(`Mode: ${mode.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  doc.text(`Sort: ${sortOpt.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  doc.text(`Page size: ${pageSize.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12

  y = Math.max(y, ry + 14)
  doc.setDrawColor(...C_INV); doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 18

  // Headline tiles
  const tileW = (PAGE_W - MARGIN * 2 - 16) / 3
  const tiles = [
    ['INVOICES',  String(totals.invoices)],
    ['SUBTOTAL',  `${cur.code} ${formatNumber(totals.subtotal)}`],
    ['BATCH TOTAL', `${cur.code} ${formatNumber(totals.total)}`],
  ]
  tiles.forEach(([k, v], i) => {
    const cx = MARGIN + i * (tileW + 8)
    if (i === 2) {
      doc.setFillColor(...C_INV); doc.roundedRect(cx, y, tileW, 80, 6, 6, 'F')
      doc.setTextColor(...C_INV_DK)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      doc.text(k, cx + 12, y + 16)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
      doc.text(v, cx + 12, y + 48)
    } else {
      doc.setDrawColor(...C_LINE); doc.setLineWidth(1)
      doc.roundedRect(cx, y, tileW, 80, 6, 6, 'S')
      doc.setTextColor(...C_INV_DK)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      doc.text(k, cx + 12, y + 16)
      doc.setTextColor(...C_INK_950)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
      doc.text(v, cx + 12, y + 48)
    }
  })
  y += 92

  /* ---- Manifest table ---- */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(...C_INV_DK)
  doc.text('MANIFEST', MARGIN, y); y += 14

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 6
  const cInv   = tX + 30
  const cDate  = tX + tW * 0.30
  const cClient = tX + tW * 0.45
  const cStat  = tX + tW * 0.78
  const cAmt   = tX + tW - 6

  doc.setFillColor(...C_INV); doc.rect(tX, y, tW, 20, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_INV_DK)
  doc.text('#',          cN,     y + 13)
  doc.text('INVOICE',    cInv,   y + 13)
  doc.text('ISSUE',      cDate,  y + 13)
  doc.text('CLIENT',     cClient, y + 13)
  doc.text('STATUS',     cStat,  y + 13)
  doc.text('AMOUNT',     cAmt,   y + 13, { align: 'right' })
  y += 20

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowH = 14
    y = ensureSpace(doc, y, rowH, PAGE_W, PAGE_H)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, rowH, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(String(r.invoiceNumber || '—'), cInv, y + 10)
    doc.setTextColor(...C_INK_700)
    doc.text(formatDate(r.issueDate) || '—', cDate, y + 10)
    doc.setTextColor(...C_INK_950)
    const clientText = String(r.clientName || '—')
    const clipped = clientText.length > 36 ? clientText.slice(0, 35) + '…' : clientText
    doc.text(clipped, cClient, y + 10)
    doc.setTextColor(...C_INK_500)
    doc.text((r.status || 'draft').toUpperCase(), cStat, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'bold')
    doc.text(formatNumber(totalForRow(r)), cAmt, y + 10, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += rowH
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.2); doc.line(tX, y, tX + tW, y)
  }
  // Total row
  y = ensureSpace(doc, y, 22, PAGE_W, PAGE_H)
  doc.setFillColor(...C_INV); doc.rect(tX, y, tW, 22, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.setTextColor(...C_INV_DK)
  doc.text(`BATCH TOTAL · ${rows.length} invoices`, cInv, y + 14)
  doc.text(`${cur.code} ${formatNumber(totals.total)}`, cAmt, y + 14, { align: 'right' })
  y += 30

  /* ---- Status summary ---- */
  if (data.includeStatusSummary && statusSummary.length > 0) {
    y = ensureSpace(doc, y, 60, PAGE_W, PAGE_H)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_INV_DK)
    doc.text('BY STATUS', MARGIN, y); y += 14

    const sLab = MARGIN
    const sCnt = MARGIN + 220
    const sAmt = PAGE_W - MARGIN - 8
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('STATUS', sLab, y)
    doc.text('COUNT',  sCnt, y, { align: 'right' })
    doc.text('AMOUNT', sAmt, y, { align: 'right' })
    y += 4
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 8

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const s of statusSummary) {
      y = ensureSpace(doc, y, 14, PAGE_W, PAGE_H)
      doc.setTextColor(...C_INK_950)
      doc.text(s.status.toUpperCase(), sLab, y + 10)
      doc.setTextColor(...C_INK_700)
      doc.text(String(s.count), sCnt, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(`${cur.code} ${formatNumber(s.total)}`, sAmt, y + 10, { align: 'right' })
      y += 14
    }
    y += 8
  }

  /* ---- Notes ---- */
  if (data.includeNotesBlock && data.notes) {
    y = ensureSpace(doc, y, 40, PAGE_W, PAGE_H)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_INV_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13, PAGE_W, PAGE_H); doc.text(line, MARGIN, y); y += 13 }
  }

  /* ---- Per-invoice pages ---- */
  if (mode.id === 'one_pdf') {
    for (const r of rows) {
      doc.addPage()
      renderInvoicePage(doc, r, data, cur, PAGE_W, PAGE_H)
    }
  }

  addPageFooters(doc, data, PAGE_W, PAGE_H, rows.length)

  const fileName = `invoice-batch-${(data.batchId || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

/* Render one invoice as a single-page A4/Letter layout. */
function renderInvoicePage(doc, r, data, cur, PAGE_W, PAGE_H) {
  let y = MARGIN
  doc.setFillColor(...C_INV)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.company?.name || '[Your business]', MARGIN, y + 18)
  y += 24

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.company?.address) {
    const lines = doc.splitTextToSize(data.company.address, PAGE_W / 2 - MARGIN)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  const contact = [data.company?.email, data.company?.phone].filter(Boolean).join('  ·  ')
  if (contact) { doc.text(contact, MARGIN, y); y += 12 }
  if (data.company?.taxId) { doc.text(`Tax ID: ${data.company.taxId}`, MARGIN, y); y += 12 }

  // Right
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(26)
  doc.setTextColor(...C_INV_DK)
  doc.text('INVOICE', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (r.invoiceNumber) { doc.text(`Invoice #: ${r.invoiceNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (r.issueDate)     { doc.text(`Issue: ${formatDate(r.issueDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (r.dueDate)       { doc.text(`Due: ${formatDate(r.dueDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(`Status: ${(r.status || 'draft').toUpperCase()}`, PAGE_W - MARGIN, ry, { align: 'right' })

  y = Math.max(y, ry + 14)
  doc.setDrawColor(...C_INV); doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 18

  // Bill to
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INV_DK)
  doc.text('BILL TO', MARGIN, y); y += 12
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  doc.setTextColor(...C_INK_950)
  doc.text(r.clientName || '[Client]', MARGIN, y); y += 20

  // Line table (this batch view shows a single line per invoice — the description)
  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cDesc = tX + 12
  const cQty  = tX + tW * 0.62
  const cRate = tX + tW * 0.76
  const cAmt  = tX + tW - 12

  doc.setFillColor(...C_INV); doc.rect(tX, y, tW, 22, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_INV_DK)
  doc.text('DESCRIPTION', cDesc, y + 14)
  doc.text('QTY',         cQty,  y + 14, { align: 'right' })
  doc.text('RATE',        cRate, y + 14, { align: 'right' })
  doc.text('AMOUNT',      cAmt,  y + 14, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  const descText = r.description || '(no description supplied)'
  const descLines = doc.splitTextToSize(descText, cQty - cDesc - 8)
  const rowH = Math.max(LINE_H + 4, descLines.length * LINE_H + 4)
  doc.setTextColor(...C_INK_950)
  doc.text(descLines, cDesc, y + 12)
  doc.text(formatNumber(Number(r.qty) || 0),  cQty,  y + 12, { align: 'right' })
  doc.text(formatNumber(Number(r.rate) || 0), cRate, y + 12, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.text(formatNumber(totalForRow(r)),      cAmt,  y + 12, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  y += rowH
  doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  y += 12

  // Totals
  const tx1 = PAGE_W - MARGIN - 220
  const tx2 = PAGE_W - MARGIN - 8
  const gross = (Number(r.qty) || 0) * (Number(r.rate) || 0)
  const tax = gross * (Number(r.taxPct) || 0) / 100
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.setTextColor(...C_INK_500); doc.text('Subtotal', tx1, y + 10)
  doc.setTextColor(...C_INK_950); doc.text(`${cur.code} ${formatNumber(gross)}`, tx2, y + 10, { align: 'right' })
  y += 14
  if (tax > 0) {
    doc.setTextColor(...C_INK_500); doc.text(`Tax (${formatNumber(r.taxPct)}%)`, tx1, y + 10)
    doc.setTextColor(...C_INK_950); doc.text(`${cur.code} ${formatNumber(tax)}`, tx2, y + 10, { align: 'right' })
    y += 14
  }
  doc.setDrawColor(...C_INV); doc.setLineWidth(1); doc.line(tx1, y, tx2, y); y += 4
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.setTextColor(...C_INV_DK)
  doc.text('TOTAL', tx1, y + 10)
  doc.text(`${cur.code} ${formatNumber(totalForRow(r))}`, tx2, y + 10, { align: 'right' })

  // Watermark for drafts
  if ((r.status || 'draft').toLowerCase() === 'draft') {
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.06 }))
    doc.setTextColor(...C_INV)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(110)
    doc.text('DRAFT', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: -30 })
    doc.restoreGraphicsState()
  }
}

function ensureSpace(doc, y, needed, PAGE_W, PAGE_H) {
  if (y + needed > PAGE_H - MARGIN - 24) { doc.addPage(); return MARGIN }
  return y
}

function addPageFooters(doc, data, PAGE_W, PAGE_H, invoiceCount) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `Invoice Batch${data.batchId ? ` · ${data.batchId}` : ''}  ·  ${invoiceCount} invoices`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
