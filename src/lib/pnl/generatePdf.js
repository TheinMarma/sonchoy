import jsPDF from 'jspdf'
import { findCurrency, formatNumber, computePnL, describePeriod } from './compute'

/* ------------------------------------------------------------------ */
/*  generatePnlPdf(data) → triggers a download                         */
/* ------------------------------------------------------------------ */

const MARGIN = 48
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_CRIMSON = [237, 40, 40]
const C_ACCOUNT = [99, 102, 241]   // indigo-500
const C_SUCCESS = [21, 128, 61]    // green-700
const C_DANGER  = [185, 28, 28]    // red-700

export function generatePnlPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const t = computePnL(data)
  const cur = findCurrency(data.currency)
  const period = describePeriod(data)

  let y = MARGIN

  // ============== HEADER ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_ACCOUNT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('PROFIT & LOSS STATEMENT', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(cur.code, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  // Company name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.companyName || 'Your Company', MARGIN, y)
  y += 22

  // Subhead
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  doc.text(`For the period: ${period || '—'}`, MARGIN, y)
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 24

  // ============== TOP RATIOS STRIP ==============

  const ratios = [
    { label: 'Revenue',     value: formatNumber(t.revenue),     accent: false },
    { label: 'Gross margin', value: `${t.grossMargin}%`,        accent: t.grossMargin >= 0 },
    { label: 'Operating',    value: `${t.operatingMargin}%`,    accent: t.operatingMargin >= 0 },
    { label: 'Net margin',   value: `${t.netMargin}%`,          accent: t.netMargin >= 0 },
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
    doc.setFontSize(13)
    doc.setTextColor(...C_INK_950)
    doc.text(String(r.value), x + ratioW / 2, y + 34, { align: 'center' })
  })

  y += 60

  // ============== MAIN TABLE ==============

  const tableX = MARGIN
  const tableW = PAGE_W - MARGIN * 2
  const labelX = tableX
  const amountX = tableX + tableW

  // section header
  const drawSectionHeader = (label) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.setFillColor(245, 244, 241)
    doc.rect(tableX, y, tableW, 18, 'F')
    doc.text(label.toUpperCase(), labelX + 6, y + 12)
    y += 18
  }

  // line row
  const drawLine = (label, amount, opts = {}) => {
    const indent = opts.indent || 0
    const bold = !!opts.bold
    const color = opts.color || C_INK_950
    const small = !!opts.small

    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(small ? 9 : 10)
    doc.setTextColor(...color)

    const text = String(label || '—')
    doc.text(text, labelX + 6 + indent, y + 13)
    doc.text(formatNumber(amount), amountX - 6, y + 13, { align: 'right' })

    if (!opts.noBorder) {
      doc.setDrawColor(...C_LINE)
      doc.setLineWidth(0.4)
      doc.line(tableX, y + 18, tableX + tableW, y + 18)
    }
    y += 18
  }

  const drawSubtotal = (label, amount, opts = {}) => {
    doc.setDrawColor(...C_INK_950)
    doc.setLineWidth(0.8)
    doc.line(amountX - 90, y + 2, amountX - 6, y + 2)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...C_INK_950)
    doc.text(label, labelX + 6, y + 16)
    const isNeg = amount < 0
    doc.setTextColor(...(isNeg ? C_DANGER : (opts.success ? C_SUCCESS : C_INK_950)))
    doc.text(formatNumber(amount), amountX - 6, y + 16, { align: 'right' })
    y += 22
  }

  // === Revenue ===
  drawSectionHeader('Revenue')
  for (const ln of (data.revenue || [])) {
    drawLine(ln.description, Number(ln.amount) || 0, { indent: 8 })
  }
  drawSubtotal('Total revenue', t.revenue, { success: true })
  y += 6

  // === COGS ===
  if ((data.cogs || []).length > 0) {
    drawSectionHeader('Cost of goods sold')
    for (const ln of data.cogs) {
      drawLine(ln.description, -(Number(ln.amount) || 0), { indent: 8, color: C_INK_700 })
    }
    drawSubtotal('Total COGS', -t.cogs)
    y += 6

    // Gross profit
    drawSubtotal('Gross profit', t.grossProfit, { success: t.grossProfit >= 0 })
    y += 6
  }

  // === Operating Expenses ===
  if ((data.operatingExpenses || []).length > 0) {
    drawSectionHeader('Operating expenses')
    for (const ln of data.operatingExpenses) {
      const label = ln.category ? `${ln.description}  ·  ${ln.category}` : ln.description
      drawLine(label, -(Number(ln.amount) || 0), { indent: 8, color: C_INK_700 })
    }
    drawSubtotal('Total operating expenses', -t.opex)
    y += 6

    drawSubtotal('Operating income', t.operatingIncome, { success: t.operatingIncome >= 0 })
    y += 6
  }

  // === Other Income / Expenses ===
  const hasOther = (data.otherIncome || []).length > 0 || (data.otherExpenses || []).length > 0
  if (hasOther) {
    drawSectionHeader('Other income & expenses')
    for (const ln of (data.otherIncome || [])) {
      drawLine(ln.description, Number(ln.amount) || 0, { indent: 8, color: C_INK_700 })
    }
    for (const ln of (data.otherExpenses || [])) {
      drawLine(ln.description, -(Number(ln.amount) || 0), { indent: 8, color: C_INK_700 })
    }
    const otherNet = t.otherIncome - t.otherExpenses
    drawSubtotal('Net other', otherNet, { success: otherNet >= 0 })
    y += 6
  }

  // Pre-tax income
  drawSubtotal('Income before tax', t.preTaxIncome, { success: t.preTaxIncome >= 0 })
  y += 6

  // Tax
  if (t.taxExpense > 0) {
    drawSectionHeader('Tax')
    drawLine(`Tax expense  ·  ${t.effectiveTaxRate}% effective`, -t.taxExpense, { indent: 8, color: C_INK_700 })
    y += 6
  }

  // === NET INCOME — bold, large, accent ===
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 36, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C_ACCOUNT)
  doc.text('NET INCOME', labelX + 12, y + 22)
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(`${cur.code} ${formatNumber(t.netIncome)}`, amountX - 12, y + 24, { align: 'right' })
  y += 50

  // ============== OPEX BREAKDOWN MINI-TABLE ==============

  if (t.opexBreakdown.length > 1 && y < PAGE_H - 180) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('OPERATING EXPENSES BY CATEGORY', tableX, y)
    y += 10

    const bkW = 280
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.rect(tableX, y, bkW, 16, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_700)
    doc.text('CATEGORY', tableX + 8, y + 11)
    doc.text('AMOUNT',   tableX + bkW - 60, y + 11, { align: 'right' })
    doc.text('% OPEX',   tableX + bkW - 8,  y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_950)
    for (const row of t.opexBreakdown) {
      const sharePct = t.opex ? (row.amount / t.opex) * 100 : 0
      doc.rect(tableX, y, bkW, 16, 'S')
      doc.text(row.category, tableX + 8, y + 11)
      doc.text(formatNumber(row.amount), tableX + bkW - 60, y + 11, { align: 'right' })
      doc.text(`${sharePct.toFixed(1)}%`, tableX + bkW - 8, y + 11, { align: 'right' })
      y += 16
    }
  }

  // ============== FOOTER ==============

  const footerY = PAGE_H - MARGIN
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, footerY - 30, PAGE_W - MARGIN, footerY - 30)

  if (data.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_700)
    const notes = doc.splitTextToSize(data.notes, tableW)
    doc.text(notes, MARGIN, footerY - 18)
  }

  doc.setFontSize(7)
  doc.setTextColor(...C_INK_500)
  doc.text('Generated with Sonchoy · sonchoy.com', PAGE_W - MARGIN, footerY - 6, { align: 'right' })

  // ============== SAVE ==============
  const fileName = `${(data.companyName || 'profit-loss').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-pnl.pdf`
  doc.save(fileName)
}
