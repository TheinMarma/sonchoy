import jsPDF from 'jspdf'
import { findCurrency, formatNumber, formatDate, computeTotals } from './format'

/* ------------------------------------------------------------------ */
/*  generateInvoicePdf(invoice) → triggers a download                  */
/* ------------------------------------------------------------------ */

const MARGIN = 56          // pt — ≈ 0.78"
const PAGE_W = 595.28      // A4 portrait
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_CRIMSON = [237, 40, 40]

export function generateInvoicePdf(invoice) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const { items, taxRate, taxLabel, currency } = invoice
  const { subtotal, tax, total } = computeTotals(items, taxRate)
  const cur = findCurrency(currency)

  // ============== HEADER ==============

  // Logo block
  doc.setFillColor(...C_INK_950)
  doc.roundedRect(MARGIN, MARGIN, 28, 28, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('S', MARGIN + 14, MARGIN + 19, { align: 'center' })

  // Brand name
  doc.setTextColor(...C_INK_950)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.text(invoice.brand || 'Your Company', MARGIN + 38, MARGIN + 19)

  // Right side: INVOICE label + number + dates
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C_INK_500)
  doc.text('INVOICE', PAGE_W - MARGIN, MARGIN + 8, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...C_INK_950)
  doc.text(invoice.number || '', PAGE_W - MARGIN, MARGIN + 24, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  doc.text(`Issued ${formatDate(invoice.issueDate)}`, PAGE_W - MARGIN, MARGIN + 38, { align: 'right' })
  doc.text(`Due ${formatDate(invoice.dueDate)}`,      PAGE_W - MARGIN, MARGIN + 50, { align: 'right' })

  // ============== PARTIES ==============

  let y = MARGIN + 90
  const colW = (PAGE_W - MARGIN * 2) / 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C_INK_500)
  doc.text('FROM', MARGIN, y)
  doc.text('BILL TO', MARGIN + colW, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_950)
  drawMultiline(doc, invoice.fromName || '',     MARGIN,        y + 14, 11, true)
  drawMultiline(doc, invoice.fromAddress || '',  MARGIN,        y + 28, 11)
  drawMultiline(doc, invoice.toName || '',       MARGIN + colW, y + 14, 11, true)
  drawMultiline(doc, invoice.toAddress || '',    MARGIN + colW, y + 28, 11)

  // ============== ITEMS TABLE ==============

  y += 110
  const tableX = MARGIN
  const tableW = PAGE_W - MARGIN * 2

  // Column layout (left-aligned for desc, right-aligned for numerics)
  const COLS = {
    desc:   { x: tableX,                              align: 'left'  },
    qty:    { x: tableX + tableW - 230,               align: 'right' },
    rate:   { x: tableX + tableW - 130,               align: 'right' },
    amount: { x: tableX + tableW,                     align: 'right' },
  }

  // Header row
  doc.setDrawColor(...C_INK_950)
  doc.setLineWidth(1)
  doc.line(tableX, y, tableX + tableW, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C_INK_500)
  doc.text('DESCRIPTION', COLS.desc.x,   y + 14)
  doc.text('QTY',         COLS.qty.x,    y + 14, { align: 'right' })
  doc.text('RATE',        COLS.rate.x,   y + 14, { align: 'right' })
  doc.text('AMOUNT',      COLS.amount.x, y + 14, { align: 'right' })

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(tableX, y + 22, tableX + tableW, y + 22)

  y += 22

  // Body rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_950)

  items.forEach((it) => {
    const qty  = Number(it.qty)  || 0
    const rate = Number(it.rate) || 0
    const amt  = qty * rate

    const rowH = 22
    doc.text(String(it.description || ''), COLS.desc.x,   y + 14)
    doc.setTextColor(...C_INK_700)
    doc.text(String(qty),                  COLS.qty.x,    y + 14, { align: 'right' })
    doc.text(formatNumber(rate),           COLS.rate.x,   y + 14, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(amt),            COLS.amount.x, y + 14, { align: 'right' })

    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.4)
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH)

    y += rowH
  })

  // ============== TOTALS ==============

  y += 16
  const totalsX = tableX + tableW - 220
  const valueX  = tableX + tableW

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_500)
  doc.text('Subtotal', totalsX, y)
  doc.setTextColor(...C_INK_700)
  doc.text(formatNumber(subtotal), valueX, y, { align: 'right' })

  if (taxRate > 0) {
    y += 16
    doc.setTextColor(...C_INK_500)
    doc.text(`${taxLabel || 'Tax'}`, totalsX, y)
    doc.setTextColor(...C_INK_700)
    doc.text(formatNumber(tax), valueX, y, { align: 'right' })
  }

  // Total due — strong rule + bold
  y += 14
  doc.setDrawColor(...C_INK_950)
  doc.setLineWidth(1)
  doc.line(totalsX, y, valueX, y)

  y += 18
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text('Total due', totalsX, y)
  doc.setTextColor(...C_CRIMSON)
  doc.text(`${cur.code} ${formatNumber(total)}`, valueX, y, { align: 'right' })

  // ============== FOOTER ==============

  const footerY = PAGE_H - MARGIN

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, footerY - 50, PAGE_W - MARGIN, footerY - 50)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (invoice.notes) {
    drawMultiline(doc, invoice.notes, MARGIN, footerY - 36, 11)
  }

  doc.setFontSize(7)
  doc.setTextColor(...C_INK_500)
  doc.text(
    `Generated with Sonchoy · sonchoy.com`,
    PAGE_W - MARGIN,
    footerY - 12,
    { align: 'right' }
  )

  // ============== SAVE ==============
  const fileName = `${(invoice.number || 'invoice').replace(/[^a-z0-9-]+/gi, '_')}.pdf`
  doc.save(fileName)
}

/** Wrap & draw multi-line text */
function drawMultiline(doc, text, x, y, lineH, bold = false) {
  if (!text) return
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  const lines = String(text).split(/\r?\n/)
  lines.forEach((line, i) => {
    doc.text(line, x, y + i * lineH)
  })
  doc.setFont('helvetica', 'normal')
}
