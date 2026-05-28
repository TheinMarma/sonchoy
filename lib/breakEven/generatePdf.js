import jsPDF from 'jspdf'
import { computeBreakEven, buildScheduleRows, defaultFileBase, formatMoney, formatNumber, formatDate, findScenario } from './compute'

export function generateBreakEvenPdf(data) {
  const r = computeBreakEven(data)
  const rows = buildScheduleRows(data)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const margin = 48
  let y = margin

  doc.setFillColor(237, 40, 40)
  doc.rect(0, 0, W, 6, 'F')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(20, 20, 20)
  doc.text('Break-Even Analysis', margin, y + 22)
  y += 40

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(110, 110, 110)
  if (data.label) { doc.text(data.label, margin, y); y += 14 }
  doc.text(`Scenario: ${findScenario(data.scenarioId).label} · ${data.currencyCode}`, margin, y); y += 18

  // KPI cards
  const cards = [
    ['Break-even units',   `${formatNumber(r.breakEvenUnits)} ${data.unitName || 'units'}`],
    ['Break-even revenue', formatMoney(r.breakEvenRevenue, data.currencyCode)],
    ['Contribution / unit', formatMoney(r.contribution, data.currencyCode)],
    ['CM %',               `${formatNumber(r.contributionMarginPct)}%`],
  ]
  const cardW = (W - margin * 2 - 18) / 4
  cards.forEach((c, i) => {
    const x = margin + i * (cardW + 6)
    doc.setDrawColor(225); doc.setFillColor(248, 248, 246)
    doc.roundedRect(x, y, cardW, 64, 6, 6, 'FD')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(110, 110, 110)
    doc.text(c[0].toUpperCase(), x + 10, y + 16)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20, 20, 20)
    doc.text(c[1], x + 10, y + 44)
  })
  y += 88

  // Inputs block
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 20, 20)
  doc.text('Inputs', margin, y); y += 12
  doc.setDrawColor(220); doc.line(margin, y, W - margin, y); y += 14
  const inputRows = [
    ['Price per unit',    formatMoney(r.price, data.currencyCode)],
    ['Variable cost / unit', formatMoney(r.variable, data.currencyCode)],
    ['Fixed costs',       formatMoney(r.fixed, data.currencyCode)],
    ['Expected volume',   `${formatNumber(r.expectedUnits)} ${data.unitName || 'units'}`],
    ['Target profit',     formatMoney(data.targetProfit, data.currencyCode)],
  ]
  inputRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(80)
    doc.text(label, margin, y)
    doc.text(value, W - margin, y, { align: 'right' })
    y += 14
  })

  // Outcomes block
  y += 10
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 20, 20)
  doc.text('Outcomes at expected volume', margin, y); y += 12
  doc.setDrawColor(220); doc.line(margin, y, W - margin, y); y += 14
  const out = [
    ['Expected revenue',         formatMoney(r.expectedRevenue, data.currencyCode), false],
    ['(–) Variable costs',       formatMoney(r.expectedVariableCost, data.currencyCode), false],
    ['Contribution margin',      formatMoney(r.expectedContribution, data.currencyCode), true],
    ['(–) Fixed costs',          formatMoney(r.fixed, data.currencyCode), false],
    ['Expected profit',          formatMoney(r.expectedProfit, data.currencyCode), true],
    ['Margin of safety',         `${formatNumber(r.marginOfSafetyUnits)} units · ${formatMoney(r.marginOfSafetyRevenue, data.currencyCode)} (${formatNumber(r.marginOfSafetyPct)}%)`, true],
    ['Units to hit target',      `${formatNumber(r.targetUnits)} ${data.unitName || 'units'}`, false],
    ['Revenue to hit target',    formatMoney(r.targetRevenue, data.currencyCode), false],
  ]
  out.forEach(([label, value, emph]) => {
    doc.setFont('helvetica', emph ? 'bold' : 'normal'); doc.setFontSize(10); doc.setTextColor(emph ? 20 : 80)
    doc.text(label, margin, y)
    doc.text(value, W - margin, y, { align: 'right' })
    y += 14
  })

  // Scenario ladder
  if (rows.length > 0) {
    y += 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 20, 20)
    doc.text('Scenario ladder', margin, y); y += 12
    doc.setDrawColor(220); doc.line(margin, y, W - margin, y); y += 14
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(110)
    const colX = [margin, margin + 90, margin + 200, margin + 310, W - margin]
    doc.text('Units', colX[0], y)
    doc.text('Revenue', colX[1], y, { align: 'right' })
    doc.text('Variable', colX[2], y, { align: 'right' })
    doc.text('Contribution', colX[3], y, { align: 'right' })
    doc.text('Profit', colX[4], y, { align: 'right' })
    y += 12
    doc.setDrawColor(235); doc.line(margin, y - 4, W - margin, y - 4)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40)
    rows.forEach((row) => {
      doc.text(formatNumber(row.units), colX[0], y)
      doc.text(formatMoney(row.revenue, data.currencyCode),       colX[1], y, { align: 'right' })
      doc.text(formatMoney(row.variableTotal, data.currencyCode), colX[2], y, { align: 'right' })
      doc.text(formatMoney(row.contribution, data.currencyCode),  colX[3], y, { align: 'right' })
      doc.setTextColor(row.profit >= 0 ? 20 : 200, row.profit >= 0 ? 20 : 60, row.profit >= 0 ? 20 : 60)
      doc.text(formatMoney(row.profit, data.currencyCode),        colX[4], y, { align: 'right' })
      doc.setTextColor(40)
      y += 13
    })
  }

  if (data.notes) {
    y += 12
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20)
    doc.text('Notes', margin, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80)
    const wrapped = doc.splitTextToSize(String(data.notes), W - margin * 2)
    doc.text(wrapped, margin, y)
  }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160)
  doc.text(`Generated ${formatDate(new Date().toISOString())} · sonchoy.com`, margin, doc.internal.pageSize.getHeight() - 24)

  doc.save(`${defaultFileBase(data)}.pdf`)
}
