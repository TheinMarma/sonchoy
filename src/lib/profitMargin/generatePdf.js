import jsPDF from 'jspdf'
import { computeMargins, defaultFileBase, formatMoney, formatNumber, formatDate, findPurpose } from './compute'

export function generateProfitMarginPdf(data) {
  const m = computeMargins(data)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const margin = 48
  let y = margin

  // Header band
  doc.setFillColor(237, 40, 40)
  doc.rect(0, 0, W, 6, 'F')

  // Title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(20, 20, 20)
  doc.text('Profit Margin Report', margin, y + 22)
  y += 40

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(110, 110, 110)
  if (data.label)     { doc.text(data.label, margin, y); y += 14 }
  const periodText =
    data.periodStartIso && data.periodEndIso
      ? `Period: ${formatDate(data.periodStartIso)} → ${formatDate(data.periodEndIso)}`
      : `Type: ${findPurpose(data.purposeId).label}`
  doc.text(periodText, margin, y); y += 18

  // KPI cards
  const cards = [
    ['Gross margin',     `${formatNumber(m.grossMargin)}%`],
    ['Operating margin', `${formatNumber(m.operatingMargin)}%`],
    ['Net margin',       `${formatNumber(m.netMargin)}%`],
    ['Markup on cost',   `${formatNumber(m.markup)}%`],
  ]
  const cardW = (W - margin * 2 - 18) / 4
  cards.forEach((c, i) => {
    const x = margin + i * (cardW + 6)
    doc.setDrawColor(225); doc.setFillColor(248, 248, 246)
    doc.roundedRect(x, y, cardW, 64, 6, 6, 'FD')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(110, 110, 110)
    doc.text(c[0].toUpperCase(), x + 10, y + 16)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(20, 20, 20)
    doc.text(c[1], x + 10, y + 44)
  })
  y += 88

  // Statement rows
  const rows = [
    ['Revenue',                m.revenue,          true ],
    ['(–) COGS',               m.cogs,             false],
    ['Gross profit',           m.grossProfit,      true ],
    ['(–) Operating expenses', m.operatingExpense, false],
    ['Operating profit',       m.operatingProfit,  true ],
    ['(+) Other income',       m.otherIncome,      false],
    ['(–) Interest expense',   m.interestExpense,  false],
    ['Pre-tax profit',         m.pretaxProfit,     true ],
    ['(–) Taxes',              m.taxes,            false],
    ['Net profit',             m.netProfit,        true ],
  ]
  const labelX = margin
  const amountX = W - margin
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 20, 20)
  doc.text('Statement', labelX, y); y += 12
  doc.setDrawColor(220); doc.line(labelX, y, amountX, y); y += 14
  rows.forEach(([label, value, emphasize]) => {
    doc.setFont('helvetica', emphasize ? 'bold' : 'normal'); doc.setFontSize(10)
    doc.setTextColor(emphasize ? 20 : 80)
    doc.text(label, labelX, y)
    doc.text(formatMoney(value, data.currencyCode), amountX, y, { align: 'right' })
    y += 16
    if (emphasize) { doc.setDrawColor(235); doc.line(labelX, y - 6, amountX, y - 6) }
  })

  // Notes
  if (data.notes) {
    y += 12
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 20)
    doc.text('Notes', labelX, y); y += 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80)
    const wrapped = doc.splitTextToSize(String(data.notes), W - margin * 2)
    doc.text(wrapped, labelX, y); y += wrapped.length * 12
  }

  // Footer
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160, 160, 160)
  doc.text(`Generated ${formatDate(new Date().toISOString())} · sonchoy.com`, margin, doc.internal.pageSize.getHeight() - 24)

  doc.save(`${defaultFileBase(data)}.pdf`)
}
