import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  computeVAT, findRegime,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generateVATCalcPdf(data) → triggers a download                     */
/* ------------------------------------------------------------------ */

const MARGIN = 48
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_TAX     = [132, 204, 22]

export function generateVATCalcPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const t = computeVAT(data)
  const regime = findRegime(data.regimeId)
  const cur = findCurrency(data.currency || regime.defaultCurrency)

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_TAX)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('VAT CALCULATION', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  const modeLabel = t.mode === 'extract' ? 'VAT extracted from gross' : 'VAT added to net'
  doc.text(`${regime.label}  ·  ${modeLabel}  ·  ${cur.code}`, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.documentName || 'VAT Calculation', MARGIN, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  const subLine = []
  if (data.reference)    subLine.push(`Ref: ${data.reference}`)
  if (data.customerName) subLine.push(`For: ${data.customerName}`)
  if (data.date)         subLine.push(formatDate(data.date))
  if (subLine.length) doc.text(subLine.join('  ·  '), MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 24

  // ============== TOP STATS STRIP ==============

  const ratios = [
    { label: 'Net total',   value: formatNumber(t.totalNet) },
    { label: 'VAT total',   value: formatNumber(t.totalVat) },
    { label: 'Gross total', value: formatNumber(t.totalGross) },
    { label: '# Lines',     value: String(t.countLines) },
  ]

  const stripX = MARGIN
  const stripW = PAGE_W - MARGIN * 2
  const ratioW = stripW / ratios.length

  doc.setFillColor(248, 247, 244)
  doc.rect(stripX, y, stripW, 44, 'F')
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.rect(stripX, y, stripW, 44, 'S')

  ratios.forEach((r, i) => {
    const x = stripX + i * ratioW
    if (i > 0) {
      doc.setDrawColor(...C_LINE)
      doc.line(x, y + 8, x, y + 36)
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text(r.label.toUpperCase(), x + ratioW / 2, y + 16, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...C_INK_950)
    doc.text(String(r.value), x + ratioW / 2, y + 34, { align: 'center' })
  })

  y += 58

  // ============== LINE ITEMS TABLE ==============

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('LINE ITEMS', MARGIN, y)
  y += 10

  const tableX = MARGIN
  const tableW = stripW

  // # | Description | Rate | Net | VAT | Gross
  const cols = {
    n:     { x: tableX, w: 24,  align: 'left'  },
    desc:  { x: 0,      w: 0,   align: 'left'  },
    rate:  { x: 0,      w: 50,  align: 'right' },
    net:   { x: 0,      w: 78,  align: 'right' },
    vat:   { x: 0,      w: 70,  align: 'right' },
    gross: { x: 0,      w: 78,  align: 'right' },
  }
  let used = 0
  for (const k of Object.keys(cols)) if (k !== 'desc') used += cols[k].w
  cols.desc.w = tableW - used
  let cx = tableX
  for (const k of ['n', 'desc', 'rate', 'net', 'vat', 'gross']) {
    cols[k].x = cx
    cx += cols[k].w
  }

  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_TAX)
  const headers = { n: '#', desc: 'DESCRIPTION', rate: 'RATE', net: 'NET', vat: 'VAT', gross: 'GROSS' }
  for (const k of Object.keys(cols)) {
    const c = cols[k]
    const tx = c.align === 'right' ? c.x + c.w - 4 : c.x + 4
    doc.text(headers[k], tx, y + 14, { align: c.align })
  }
  y += 22

  const rowH = 22
  for (let i = 0; i < t.lines.length; i++) {
    if (y + rowH > PAGE_H - MARGIN - 200) {
      doc.addPage()
      y = MARGIN
    }
    const l = t.lines[i]
    const isEven = i % 2 === 0
    if (isEven) {
      doc.setFillColor(248, 247, 244)
      doc.rect(tableX, y, tableW, rowH, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1).padStart(2, '0'), cols.n.x + 4, y + 14)

    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'normal')
    doc.text(truncate(doc, l.description || '—', cols.desc.w - 6), cols.desc.x + 4, y + 14)

    doc.setTextColor(...C_TAX)
    doc.setFont('helvetica', 'bold')
    doc.text(`${l.ratePct}%`, cols.rate.x + cols.rate.w - 4, y + 14, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C_INK_700)
    doc.text(formatNumber(l.net), cols.net.x + cols.net.w - 4, y + 14, { align: 'right' })
    doc.text(formatNumber(l.vat), cols.vat.x + cols.vat.w - 4, y + 14, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(l.gross), cols.gross.x + cols.gross.w - 4, y + 14, { align: 'right' })

    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.3)
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH)
    y += rowH
  }

  // Totals row
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 32, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C_TAX)
  doc.text('TOTALS', tableX + 12, y + 20)

  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(formatNumber(t.totalNet),   cols.net.x   + cols.net.w   - 4, y + 20, { align: 'right' })
  doc.text(formatNumber(t.totalVat),   cols.vat.x   + cols.vat.w   - 4, y + 20, { align: 'right' })
  doc.text(formatNumber(t.totalGross), cols.gross.x + cols.gross.w - 4, y + 20, { align: 'right' })
  y += 44

  // ============== BREAKDOWN BY RATE ==============

  if (t.byRate.length > 1 && y < PAGE_H - 200) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('BREAKDOWN BY RATE', MARGIN, y)
    y += 10

    const brkW = stripW
    doc.setFillColor(245, 244, 241)
    doc.rect(tableX, y, brkW, 16, 'F')
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.rect(tableX, y, brkW, 16, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_700)
    doc.text('RATE',    tableX + 8,           y + 11)
    doc.text('# LINES', tableX + 80,          y + 11)
    doc.text('NET',     tableX + brkW - 230,  y + 11)
    doc.text('VAT',     tableX + brkW - 120,  y + 11)
    doc.text('GROSS',   tableX + brkW - 8,    y + 11, { align: 'right' })
    y += 16

    for (const r of t.byRate) {
      doc.rect(tableX, y, brkW, 16, 'S')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...C_TAX)
      doc.text(`${r.rate}%`, tableX + 8, y + 11)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C_INK_500)
      doc.text(String(r.count), tableX + 80, y + 11)

      doc.setTextColor(...C_INK_700)
      doc.text(formatNumber(r.net), tableX + brkW - 230, y + 11)
      doc.text(formatNumber(r.vat), tableX + brkW - 120, y + 11)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(r.gross), tableX + brkW - 8, y + 11, { align: 'right' })
      y += 16
    }
  }

  // ============== FOOTER ==============

  const footerY = PAGE_H - MARGIN
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, footerY - 40, PAGE_W - MARGIN, footerY - 40)

  if (regime.note) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...C_INK_500)
    const noteLines = doc.splitTextToSize(regime.note, stripW)
    doc.text(noteLines, MARGIN, footerY - 28)
  }

  if (data.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_700)
    const notes = doc.splitTextToSize(data.notes, stripW)
    doc.text(notes, MARGIN, footerY - 12)
  }

  doc.setFontSize(7)
  doc.setTextColor(...C_INK_500)
  doc.text('Generated with Sonchoy · sonchoy.com', PAGE_W - MARGIN, footerY - 2, { align: 'right' })

  const fileName = `${(data.documentName || 'vat-calculation').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-vat.pdf`
  doc.save(fileName)
}

function truncate(doc, text, maxW) {
  const t = String(text || '')
  if (doc.getTextWidth(t) <= maxW) return t
  let cur = t
  while (cur.length > 0 && doc.getTextWidth(cur + '…') > maxW) {
    cur = cur.slice(0, -1)
  }
  return cur + '…'
}
