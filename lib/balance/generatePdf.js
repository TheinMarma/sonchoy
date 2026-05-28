import jsPDF from 'jspdf'
import { findCurrency, formatNumber, computeBalance, asOfLabel } from './compute'

/* ------------------------------------------------------------------ */
/*  generateBalanceSheetPdf(data) → triggers a download                */
/* ------------------------------------------------------------------ */

const MARGIN = 48
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ACCOUNT = [99, 102, 241]
const C_SUCCESS = [21, 128, 61]
const C_DANGER  = [185, 28, 28]

export function generateBalanceSheetPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const t = computeBalance(data)
  const cur = findCurrency(data.currency)
  const dateLabel = asOfLabel(data)

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_ACCOUNT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('BALANCE SHEET', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(cur.code, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.companyName || 'Your Company', MARGIN, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  doc.text(`As of: ${dateLabel || '—'}`, MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 24

  // ============== KEY RATIOS STRIP ==============

  const ratios = [
    { label: 'Total assets',  value: formatNumber(t.totalAssets) },
    { label: 'Current ratio',  value: `${t.currentRatio.toFixed(2)}x`, accent: t.currentRatio >= 1 ? 'pos' : 'neg' },
    { label: 'D/E',            value: `${t.debtToEquity.toFixed(2)}x` },
    { label: 'Equity ratio',   value: `${t.equityRatio.toFixed(1)}%` },
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
    if (r.accent === 'pos') doc.setTextColor(...C_SUCCESS)
    else if (r.accent === 'neg') doc.setTextColor(...C_DANGER)
    else doc.setTextColor(...C_INK_950)
    doc.text(String(r.value), x + ratioW / 2, y + 34, { align: 'center' })
  })

  y += 60

  // ============== MAIN TABLE ==============

  const tableX = MARGIN
  const tableW = PAGE_W - MARGIN * 2
  const labelX = tableX
  const amountX = tableX + tableW

  const drawSectionHeader = (label) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.setFillColor(245, 244, 241)
    doc.rect(tableX, y, tableW, 18, 'F')
    doc.text(label.toUpperCase(), labelX + 6, y + 12)
    y += 18
  }

  const drawLine = (label, amount, indent = 10) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...C_INK_700)

    const text = String(label || '—')
    doc.text(text, labelX + 6 + indent, y + 13)
    const amt = Number(amount) || 0
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(amt), amountX - 6, y + 13, { align: 'right' })

    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.4)
    doc.line(tableX, y + 18, tableX + tableW, y + 18)
    y += 18
  }

  const drawSubtotal = (label, amount) => {
    doc.setDrawColor(...C_INK_950)
    doc.setLineWidth(0.8)
    doc.line(amountX - 110, y + 2, amountX - 6, y + 2)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...C_INK_950)
    doc.text(label, labelX + 6, y + 16)
    doc.text(formatNumber(Number(amount) || 0), amountX - 6, y + 16, { align: 'right' })
    y += 22
  }

  // === ASSETS ===
  drawSectionHeader('Assets')
  if ((data.currentAssets || []).length > 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Current assets', labelX + 6, y + 12)
    y += 14
    for (const ln of data.currentAssets) drawLine(ln.description, Number(ln.amount) || 0)
    drawSubtotal('Total current assets', t.currentAssets)
    y += 4
  }
  if ((data.nonCurrentAssets || []).length > 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Non-current assets', labelX + 6, y + 12)
    y += 14
    for (const ln of data.nonCurrentAssets) drawLine(ln.description, Number(ln.amount) || 0)
    drawSubtotal('Total non-current assets', t.nonCurrentAssets)
    y += 4
  }
  drawSubtotal('TOTAL ASSETS', t.totalAssets)
  y += 10

  // === LIABILITIES ===
  drawSectionHeader('Liabilities')
  if ((data.currentLiabilities || []).length > 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Current liabilities', labelX + 6, y + 12)
    y += 14
    for (const ln of data.currentLiabilities) drawLine(ln.description, Number(ln.amount) || 0)
    drawSubtotal('Total current liabilities', t.currentLiab)
    y += 4
  }
  if ((data.nonCurrentLiabilities || []).length > 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Non-current liabilities', labelX + 6, y + 12)
    y += 14
    for (const ln of data.nonCurrentLiabilities) drawLine(ln.description, Number(ln.amount) || 0)
    drawSubtotal('Total non-current liabilities', t.nonCurrentLiab)
    y += 4
  }
  drawSubtotal('TOTAL LIABILITIES', t.totalLiab)
  y += 10

  // === EQUITY ===
  drawSectionHeader('Equity')
  for (const ln of (data.equity || [])) drawLine(ln.description, Number(ln.amount) || 0)
  drawSubtotal('TOTAL EQUITY', t.equity)
  y += 6

  // === LIAB + EQUITY (with balance check) ===
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 36, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C_ACCOUNT)
  doc.text('TOTAL LIABILITIES + EQUITY', labelX + 12, y + 22)
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(`${cur.code} ${formatNumber(t.totalLiabAndEquity)}`, amountX - 12, y + 24, { align: 'right' })
  y += 50

  // Balance check note
  if (t.isBalanced) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_SUCCESS)
    doc.text(`✓ Balance sheet balances. Assets = Liabilities + Equity = ${cur.code} ${formatNumber(t.totalAssets)}`, tableX, y)
    y += 14
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_DANGER)
    doc.text(`⚠ Out of balance by ${cur.code} ${formatNumber(Math.abs(t.balanceDiff))}. Check your line items.`, tableX, y)
    y += 14
  }

  // ============== KEY METRICS DETAIL ==============

  if (y < PAGE_H - 160) {
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('KEY METRICS', tableX, y)
    y += 10

    const metrics = [
      ['Working capital',  formatNumber(t.workingCapital), 'Current assets − current liabilities'],
      ['Current ratio',    `${t.currentRatio.toFixed(2)}x`, '> 1.0 indicates short-term solvency'],
      ['Quick ratio',      `${t.quickRatio.toFixed(2)}x`,   'Excludes inventory & prepaids'],
      ['Debt-to-equity',   `${t.debtToEquity.toFixed(2)}x`, 'Total liabilities ÷ total equity'],
      ['Equity ratio',     `${t.equityRatio.toFixed(1)}%`,  'Equity ÷ total assets'],
    ]

    const mW = tableW
    const c1 = 160, c2 = 100
    doc.setFillColor(245, 244, 241)
    doc.rect(tableX, y, mW, 16, 'F')
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.rect(tableX, y, mW, 16, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_700)
    doc.text('METRIC', tableX + 8, y + 11)
    doc.text('VALUE',  tableX + c1, y + 11)
    doc.text('FORMULA', tableX + c1 + c2, y + 11)
    y += 16

    for (const [label, value, formula] of metrics) {
      doc.rect(tableX, y, mW, 16, 'S')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...C_INK_950)
      doc.text(label, tableX + 8, y + 11)
      doc.setTextColor(...C_ACCOUNT)
      doc.text(value, tableX + c1, y + 11)
      doc.setTextColor(...C_INK_500)
      doc.text(formula, tableX + c1 + c2, y + 11)
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
  const fileName = `${(data.companyName || 'balance-sheet').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-balance-sheet.pdf`
  doc.save(fileName)
}
