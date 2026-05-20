import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  computeTotals, computeLine, findRegime, amountInWords,
} from './format'

/* ------------------------------------------------------------------ */
/*  generateGstVatPdf(invoice) → triggers a download                   */
/*  GST / VAT-focused — handles reverse-charge and CGST/SGST/IGST.     */
/* ------------------------------------------------------------------ */

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_CRIMSON = [237, 40, 40]
const C_INVOICE = [251, 191, 36]

export function generateGstVatPdf(invoice) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const regime = findRegime(invoice.regimeId)
  const totals = computeTotals(invoice.items, regime, invoice.placeOfSupply)
  const cur = findCurrency(invoice.currency)
  const isReverseCharge = !!invoice.reverseCharge

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 36, 'F')
  doc.setTextColor(...C_INVOICE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(regime.docHeader, MARGIN, 23)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(regime.label, PAGE_W - MARGIN, 23, { align: 'right' })

  // ============== BRAND + META ==============

  doc.setFillColor(...C_INK_950)
  doc.roundedRect(MARGIN, 60, 26, 26, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('S', MARGIN + 13, 78, { align: 'center' })

  doc.setTextColor(...C_INK_950)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(15)
  doc.text(invoice.brand || invoice.supplierName || 'Your Company', MARGIN + 36, 78)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('INVOICE NO.', PAGE_W - MARGIN, 60, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text(invoice.number || '', PAGE_W - MARGIN, 74, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_700)
  doc.text(`Issued ${formatDate(invoice.issueDate)}`, PAGE_W - MARGIN, 86, { align: 'right' })
  doc.text(`Due ${formatDate(invoice.dueDate)}`,      PAGE_W - MARGIN, 97, { align: 'right' })

  // ============== PARTIES ==============

  let y = 120
  const colW = (PAGE_W - MARGIN * 2) / 2 - 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('SUPPLIER', MARGIN, y)
  doc.text('RECIPIENT', MARGIN + colW + 12, y)

  const partyBoxH = 92
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.roundedRect(MARGIN, y + 6, colW, partyBoxH, 4, 4, 'S')
  doc.roundedRect(MARGIN + colW + 12, y + 6, colW, partyBoxH, 4, 4, 'S')

  drawParty(doc, MARGIN + 10, y + 22, colW - 20, {
    name: invoice.supplierName,
    address: invoice.supplierAddress,
    taxIdLabel: regime.taxIdLabel,
    taxId: invoice.supplierTaxId,
  })
  drawParty(doc, MARGIN + colW + 22, y + 22, colW - 20, {
    name: invoice.buyerName,
    address: invoice.buyerAddress,
    taxIdLabel: regime.taxIdLabel,
    taxId: invoice.buyerTaxId,
  })

  y += 6 + partyBoxH + 14

  // Place of supply / reverse charge / currency strip
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C_INK_500)
  const leftPieces = []
  if (regime.needsPlaceOfSupply) {
    leftPieces.push(`Place of supply: ${invoice.placeOfSupply === 'inter' ? 'Inter-state · IGST' : 'Intra-state · CGST + SGST'}`)
  }
  if (isReverseCharge) leftPieces.push('Reverse charge: Yes')
  if (leftPieces.length) doc.text(leftPieces.join('  ·  '), MARGIN, y)
  doc.text(`Currency: ${cur.code}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 14

  // ============== ITEMS TABLE ==============

  const tableX = MARGIN
  const tableW = PAGE_W - MARGIN * 2

  const cols = regime.needsHsn
    ? [
        { key: 'idx',     label: '#',             w: 22,  align: 'left'  },
        { key: 'desc',    label: 'Description',   w: 178, align: 'left'  },
        { key: 'hsn',     label: regime.hsnLabel, w: 56,  align: 'left'  },
        { key: 'qty',     label: 'Qty',           w: 32,  align: 'right' },
        { key: 'rate',    label: 'Rate',          w: 56,  align: 'right' },
        { key: 'taxable', label: 'Taxable',       w: 60,  align: 'right' },
        { key: 'taxR',    label: 'Tax %',         w: 38,  align: 'right' },
        { key: 'amt',     label: 'Amount',        w: 0,   align: 'right' },
      ]
    : [
        { key: 'idx',     label: '#',             w: 22,  align: 'left'  },
        { key: 'desc',    label: 'Description',   w: 222, align: 'left'  },
        { key: 'qty',     label: 'Qty',           w: 36,  align: 'right' },
        { key: 'rate',    label: 'Rate',          w: 64,  align: 'right' },
        { key: 'taxable', label: 'Taxable',       w: 70,  align: 'right' },
        { key: 'taxR',    label: 'Tax %',         w: 42,  align: 'right' },
        { key: 'amt',     label: 'Amount',        w: 0,   align: 'right' },
      ]

  const usedW = cols.reduce((s, c) => s + c.w, 0)
  cols[cols.length - 1].w = tableW - usedW

  let cx = tableX
  for (const c of cols) { c.x = cx; cx += c.w }

  doc.setFillColor(245, 244, 241)
  doc.rect(tableX, y, tableW, 22, 'F')
  doc.setDrawColor(...C_INK_950)
  doc.setLineWidth(1)
  doc.line(tableX, y, tableX + tableW, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_700)
  for (const c of cols) {
    const x = c.align === 'right' ? c.x + c.w - 4 : c.x + 4
    doc.text(c.label.toUpperCase(), x, y + 14, { align: c.align })
  }
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(tableX, y + 22, tableX + tableW, y + 22)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_950)

  invoice.items.forEach((it, i) => {
    const ln = computeLine(it, regime, invoice.placeOfSupply)
    const rowH = 22
    const row = {
      idx: String(i + 1),
      desc: it.description || '',
      hsn: it.hsn || '',
      qty: String(Number(it.qty) || 0),
      rate: formatNumber(Number(it.rate) || 0),
      taxable: formatNumber(ln.taxable),
      taxR: isReverseCharge ? '—' : `${Number(it.taxRate) || 0}%`,
      amt: formatNumber(isReverseCharge ? ln.taxable : ln.total),
    }

    for (const c of cols) {
      const x = c.align === 'right' ? c.x + c.w - 4 : c.x + 4
      const isMoney = ['rate', 'taxable', 'amt'].includes(c.key)
      doc.setFont('helvetica', c.key === 'amt' ? 'bold' : 'normal')
      doc.setTextColor(...(c.key === 'desc' ? C_INK_950 : isMoney ? C_INK_950 : C_INK_700))
      const text = row[c.key] || ''
      let printText = text
      if (c.key === 'desc' && doc.getTextWidth(text) > c.w - 8) {
        while (doc.getTextWidth(printText + '…') > c.w - 8 && printText.length > 0) {
          printText = printText.slice(0, -1)
        }
        printText += '…'
      }
      doc.text(printText, x, y + 14, { align: c.align })
    }

    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.4)
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH)
    y += rowH
  })

  // ============== TAX BREAKDOWN BY RATE ==============

  y += 14
  if (!isReverseCharge && totals.byRate.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('TAX BREAKDOWN BY RATE', tableX, y)
    y += 10

    const brkW = 280
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.rect(tableX, y, brkW, 16, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_700)
    doc.text('RATE',    tableX + 8,          y + 11)
    doc.text('TAXABLE', tableX + 70,         y + 11)
    doc.text('TAX',     tableX + brkW - 8,   y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_950)
    for (const row of totals.byRate) {
      doc.rect(tableX, y, brkW, 16, 'S')
      doc.text(`${row.rate}%`, tableX + 8, y + 11)
      doc.text(formatNumber(row.taxable), tableX + 70, y + 11)
      doc.text(formatNumber(row.tax),     tableX + brkW - 8, y + 11, { align: 'right' })
      y += 16
    }
    y += 12
  }

  // ============== TOTALS ==============

  const totalsX = tableX + tableW - 220
  const valueX  = tableX + tableW

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_500)
  doc.text('Subtotal (taxable)', totalsX, y)
  doc.setTextColor(...C_INK_700)
  doc.text(formatNumber(totals.subtotal), valueX, y, { align: 'right' })
  y += 14

  if (isReverseCharge) {
    doc.setTextColor(...C_INK_500)
    doc.text('Tax (reverse charge)', totalsX, y)
    doc.setTextColor(...C_INK_700)
    doc.text('—', valueX, y, { align: 'right' })
    y += 14
  } else if (regime.id === 'gst-in') {
    if (invoice.placeOfSupply === 'inter') {
      doc.setTextColor(...C_INK_500); doc.text('IGST', totalsX, y)
      doc.setTextColor(...C_INK_700); doc.text(formatNumber(totals.igst), valueX, y, { align: 'right' })
      y += 14
    } else {
      doc.setTextColor(...C_INK_500); doc.text('CGST', totalsX, y)
      doc.setTextColor(...C_INK_700); doc.text(formatNumber(totals.cgst), valueX, y, { align: 'right' })
      y += 14
      doc.setTextColor(...C_INK_500); doc.text('SGST', totalsX, y)
      doc.setTextColor(...C_INK_700); doc.text(formatNumber(totals.sgst), valueX, y, { align: 'right' })
      y += 14
    }
  } else {
    doc.setTextColor(...C_INK_500); doc.text('VAT', totalsX, y)
    doc.setTextColor(...C_INK_700); doc.text(formatNumber(totals.vat), valueX, y, { align: 'right' })
    y += 14
  }

  // Total due
  doc.setDrawColor(...C_INK_950)
  doc.setLineWidth(1)
  doc.line(totalsX, y, valueX, y)
  y += 16

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...C_INK_950)
  doc.text('Total payable', totalsX, y)
  doc.setTextColor(...C_CRIMSON)
  const finalTotal = isReverseCharge ? totals.subtotal : totals.grandTotal
  doc.text(`${cur.code} ${formatNumber(finalTotal)}`, valueX, y, { align: 'right' })
  y += 18

  // Amount in words
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_700)
  const words = amountInWords(finalTotal, cur.code)
  const split = doc.splitTextToSize(`Amount in words: ${words}`, tableW)
  doc.text(split, tableX, y)
  y += split.length * 11 + 4

  // Reverse-charge note (regulation reference)
  if (isReverseCharge && regime.reverseChargeNote) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C_CRIMSON)
    doc.text('REVERSE CHARGE', tableX, y)
    y += 11
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_700)
    const noteLines = doc.splitTextToSize(regime.reverseChargeNote, tableW)
    doc.text(noteLines, tableX, y)
    y += noteLines.length * 11 + 4
  }

  // ============== FOOTER ==============

  const footerY = PAGE_H - MARGIN
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, footerY - 56, PAGE_W - MARGIN, footerY - 56)

  if (invoice.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_700)
    const notes = doc.splitTextToSize(invoice.notes, tableW - 160)
    doc.text(notes, MARGIN, footerY - 42)
  }

  doc.setDrawColor(...C_INK_500)
  doc.setLineWidth(0.5)
  doc.line(PAGE_W - MARGIN - 120, footerY - 24, PAGE_W - MARGIN, footerY - 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('Authorised signatory', PAGE_W - MARGIN, footerY - 14, { align: 'right' })

  doc.setFontSize(7)
  doc.text('Generated with Sonchoy · sonchoy.com', MARGIN, footerY - 2)

  const fileName = `${(invoice.number || 'gst-vat-invoice').replace(/[^a-z0-9-]+/gi, '_')}.pdf`
  doc.save(fileName)
}

function drawParty(doc, x, y, w, p) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_950)
  doc.text(p.name || '—', x, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_700)
  const lines = String(p.address || '').split('\n')
  let dy = y + 12
  for (const line of lines) {
    if (!line.trim()) continue
    doc.text(line, x, dy)
    dy += 11
  }
  if (p.taxId) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text(`${p.taxIdLabel}: ${p.taxId}`, x, dy + 4)
  }
}
