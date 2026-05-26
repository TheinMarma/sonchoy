import jsPDF from 'jspdf'
import { computeTotals, defaultFileBase, findValuationMethod, findStockStatus, formatMoney, formatNumber, formatDate } from './compute'

export function generateInventoryValuationPdf(data) {
  const T = computeTotals(data.items, data.methodId)
  const method = findValuationMethod(data.methodId)
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const margin = 36
  let y = margin

  doc.setFillColor(237, 40, 40)
  doc.rect(0, 0, W, 6, 'F')

  // Title row
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(20)
  doc.text(data.reportTitle || 'Inventory Valuation Report', margin, y + 22)
  y += 36
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(110)
  if (data.company)   { doc.text(data.company, margin, y); y += 12 }
  if (data.warehouse) { doc.text(data.warehouse, margin, y); y += 12 }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(140)
  doc.text(`Ref: ${data.reference || '—'} · As of ${formatDate(data.asOfDate)} · Method: ${method.label} · ${data.currencyCode}`, margin, y)
  y += 18

  // KPI cards
  const cards = [
    ['Lines',            `${formatNumber(T.lines)}`],
    ['Total quantity',   `${formatNumber(T.qty)}`],
    ['Total value',      formatMoney(T.totalValue, data.currencyCode)],
    ['Retail value',     formatMoney(T.totalRetail, data.currencyCode)],
    ['Potential margin', `${formatNumber(T.potentialMargin)}%`],
  ]
  const cardW = (W - margin * 2 - 16) / 5
  cards.forEach((c, i) => {
    const x = margin + i * (cardW + 4)
    doc.setDrawColor(225); doc.setFillColor(248, 248, 246)
    doc.roundedRect(x, y, cardW, 50, 5, 5, 'FD')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110)
    doc.text(c[0].toUpperCase(), x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(20)
    doc.text(c[1], x + 8, y + 36)
  })
  y += 70

  // Items table header
  const colX = [margin, margin + 70, margin + 250, margin + 350, margin + 410, margin + 480, margin + 555, W - margin - 80, W - margin]
  // columns: SKU | Name | Category | Status | Qty | Unit cost | Unit value | Total value
  doc.setFillColor(15, 15, 16)
  doc.rect(margin, y, W - margin * 2, 18, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(255, 235, 235)
  doc.text('SKU',        colX[0] + 4, y + 12)
  doc.text('Item',       colX[1], y + 12)
  doc.text('Category',   colX[2], y + 12)
  doc.text('Status',     colX[3], y + 12)
  doc.text('Qty',        colX[4], y + 12, { align: 'right' })
  doc.text('Unit cost',  colX[5], y + 12, { align: 'right' })
  doc.text('Unit value', colX[6], y + 12, { align: 'right' })
  doc.text('Total value', W - margin - 4, y + 12, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40)
  T.valued.forEach((it, i) => {
    if (y > H - 60) {
      doc.addPage()
      y = margin
    }
    if (i % 2 === 1) {
      doc.setFillColor(247, 247, 244)
      doc.rect(margin, y - 10, W - margin * 2, 16, 'F')
    }
    doc.setTextColor(40)
    doc.text(String(it.sku || '—').slice(0, 14), colX[0] + 4, y)
    doc.text(String(it.name || '').slice(0, 36), colX[1], y)
    doc.text(String(it.category || '').slice(0, 14), colX[2], y)
    doc.text(findStockStatus(it.status).label, colX[3], y)
    doc.text(formatNumber(it.valuation.qty),         colX[4], y, { align: 'right' })
    doc.text(formatNumber(it.valuation.unitCost),    colX[5], y, { align: 'right' })
    doc.text(formatNumber(it.valuation.unitValue),   colX[6], y, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text(formatMoney(it.valuation.totalValue, data.currencyCode), W - margin - 4, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += 16
  })

  // Totals row
  doc.setDrawColor(180); doc.line(margin, y - 6, W - margin, y - 6); y += 6
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20)
  doc.text('Totals', colX[0] + 4, y)
  doc.text(formatNumber(T.qty),       colX[4], y, { align: 'right' })
  doc.text(formatMoney(T.totalCost,  data.currencyCode), colX[5], y, { align: 'right' })
  doc.text(formatMoney(T.totalValue, data.currencyCode), colX[6], y, { align: 'right' })
  doc.text(formatMoney(T.totalValue, data.currencyCode), W - margin - 4, y, { align: 'right' })

  // Category section on next page if it fits
  y += 28
  if (y > H - 120) { doc.addPage(); y = margin }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20)
  doc.text('Valuation by category', margin, y); y += 12
  doc.setDrawColor(220); doc.line(margin, y, W - margin, y); y += 14
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(110)
  doc.text('Category', margin, y)
  doc.text('Qty',          margin + 240, y, { align: 'right' })
  doc.text('Cost',         margin + 340, y, { align: 'right' })
  doc.text('Retail',       margin + 440, y, { align: 'right' })
  doc.text('Value',        W - margin - 4, y, { align: 'right' })
  y += 12
  doc.setDrawColor(235); doc.line(margin, y - 4, W - margin, y - 4)
  doc.setTextColor(40)
  T.categories.forEach((c) => {
    if (y > H - 60) { doc.addPage(); y = margin }
    doc.text(String(c.category).slice(0, 30), margin, y)
    doc.text(formatNumber(c.qty),                                  margin + 240, y, { align: 'right' })
    doc.text(formatMoney(c.totalCost,   data.currencyCode),         margin + 340, y, { align: 'right' })
    doc.text(formatMoney(c.totalRetail, data.currencyCode),         margin + 440, y, { align: 'right' })
    doc.text(formatMoney(c.totalValue,  data.currencyCode),         W - margin - 4, y, { align: 'right' })
    y += 14
  })

  if (data.notes) {
    y += 12
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20)
    doc.text('Notes', margin, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80)
    const wrapped = doc.splitTextToSize(String(data.notes), W - margin * 2)
    doc.text(wrapped, margin, y)
  }

  // Footer
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160)
  doc.text(`Generated ${formatDate(new Date().toISOString())} · sonchoy.com`, margin, H - 18)

  doc.save(`${defaultFileBase(data)}.pdf`)
}
