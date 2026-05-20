import jsPDF from 'jspdf'
import { findCurrency, formatNumber, formatDate, computeTotals } from './format'

/* ------------------------------------------------------------------ */
/*  generateProformaPdf(proforma) → triggers a download                */
/*                                                                     */
/*  Layout mirrors the invoice generator but with a prominent          */
/*  "PROFORMA INVOICE" header strip, validity window, and a clear      */
/*  "Not a tax invoice" disclaimer at the bottom.                      */
/* ------------------------------------------------------------------ */

const MARGIN = 56
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_CRIMSON = [237, 40, 40]
const C_AMBER   = [251, 191, 36]

export function generateProformaPdf(pf) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const { items, taxRate, taxLabel, currency } = pf
  const { subtotal, tax, total } = computeTotals(items, taxRate)
  const cur = findCurrency(currency)

  // ============== TOP STRIP (PROFORMA INVOICE) ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 30, 'F')
  doc.setTextColor(...C_AMBER)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('PROFORMA INVOICE', MARGIN, 19)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.text('Not a tax invoice · Not a demand for payment', PAGE_W - MARGIN, 19, { align: 'right' })

  // ============== HEADER ==============

  // Logo block
  doc.setFillColor(...C_INK_950)
  doc.roundedRect(MARGIN, MARGIN + 4, 28, 28, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('S', MARGIN + 14, MARGIN + 23, { align: 'center' })

  // Brand name
  doc.setTextColor(...C_INK_950)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.text(pf.brand || 'Your Company', MARGIN + 38, MARGIN + 23)

  // Right side: PROFORMA label + number + dates + validity
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C_INK_500)
  doc.text('PROFORMA No.', PAGE_W - MARGIN, MARGIN + 8, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...C_INK_950)
  doc.text(pf.number || '', PAGE_W - MARGIN, MARGIN + 24, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  doc.text(`Issued ${formatDate(pf.issueDate)}`, PAGE_W - MARGIN, MARGIN + 40, { align: 'right' })
  if (pf.validUntil) {
    doc.text(`Valid until ${formatDate(pf.validUntil)}`, PAGE_W - MARGIN, MARGIN + 52, { align: 'right' })
  }
  if (pf.expectedDelivery) {
    doc.text(`Est. delivery ${formatDate(pf.expectedDelivery)}`, PAGE_W - MARGIN, MARGIN + 64, { align: 'right' })
  }

  // ============== PARTIES ==============

  let y = MARGIN + 100
  const colW = (PAGE_W - MARGIN * 2) / 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C_INK_500)
  doc.text('FROM', MARGIN, y)
  doc.text('PREPARED FOR', MARGIN + colW, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_950)
  drawMultiline(doc, pf.fromName || '',    MARGIN,        y + 14, 11, true)
  drawMultiline(doc, pf.fromAddress || '', MARGIN,        y + 28, 11)
  drawMultiline(doc, pf.toName || '',      MARGIN + colW, y + 14, 11, true)
  drawMultiline(doc, pf.toAddress || '',   MARGIN + colW, y + 28, 11)

  // ============== ITEMS TABLE ==============

  y += 110
  const tableX = MARGIN
  const tableW = PAGE_W - MARGIN * 2

  const COLS = {
    desc:   { x: tableX,                              align: 'left'  },
    qty:    { x: tableX + tableW - 230,               align: 'right' },
    rate:   { x: tableX + tableW - 130,               align: 'right' },
    amount: { x: tableX + tableW,                     align: 'right' },
  }

  // Header
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
    doc.text(`${taxLabel || 'Tax'} (estimated)`, totalsX, y)
    doc.setTextColor(...C_INK_700)
    doc.text(formatNumber(tax), valueX, y, { align: 'right' })
  }

  y += 14
  doc.setDrawColor(...C_INK_950)
  doc.setLineWidth(1)
  doc.line(totalsX, y, valueX, y)

  y += 18
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text('Estimated total', totalsX, y)
  doc.setTextColor(...C_CRIMSON)
  doc.text(`${cur.code} ${formatNumber(total)}`, valueX, y, { align: 'right' })

  // ============== DISCLAIMER ==============

  y += 28
  doc.setFillColor(...C_AMBER)
  // Soft amber strip
  const strip = { x: tableX, y, w: tableW, h: 32 }
  doc.setFillColor(254, 243, 199) // amber-100
  doc.rect(strip.x, strip.y, strip.w, strip.h, 'F')
  doc.setDrawColor(...C_AMBER)
  doc.setLineWidth(0.6)
  doc.rect(strip.x, strip.y, strip.w, strip.h, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(146, 64, 14) // amber-900
  doc.text('NOT A TAX INVOICE', strip.x + 12, strip.y + 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(120, 53, 15) // amber-950
  doc.text(
    'This proforma is a non-binding estimate. A tax invoice will be issued on order confirmation or payment.',
    strip.x + 12,
    strip.y + 25,
  )

  // ============== FOOTER ==============

  const footerY = PAGE_H - MARGIN

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, footerY - 50, PAGE_W - MARGIN, footerY - 50)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  if (pf.notes) {
    drawMultiline(doc, pf.notes, MARGIN, footerY - 36, 11)
  }

  doc.setFontSize(7)
  doc.setTextColor(...C_INK_500)
  doc.text(`Generated with Sonchoy · sonchoy.com`, PAGE_W - MARGIN, footerY - 12, { align: 'right' })

  // ============== SAVE ==============
  const fileName = `${(pf.number || 'proforma').replace(/[^a-z0-9-]+/gi, '_')}.pdf`
  doc.save(fileName)
}

function drawMultiline(doc, text, x, y, lineH, bold = false) {
  if (!text) return
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  const lines = String(text).split(/\r?\n/)
  lines.forEach((line, i) => doc.text(line, x, y + i * lineH))
  doc.setFont('helvetica', 'normal')
}
