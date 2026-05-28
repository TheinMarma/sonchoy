import jsPDF from 'jspdf'
import { findCurrency, formatNumber, computeCashFlow, describePeriod } from './compute'

/* ------------------------------------------------------------------ */
/*  generateCashFlowPdf(data) → triggers a download                    */
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

export function generateCashFlowPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const t = computeCashFlow(data)
  const cur = findCurrency(data.currency)
  const period = describePeriod(data)
  const method = data.method === 'direct' ? 'Direct method' : 'Indirect method'

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_ACCOUNT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('CASH FLOW STATEMENT', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`${method}  ·  ${cur.code}`, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  // Company name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.companyName || 'Your Company', MARGIN, y)
  y += 22

  // Period subhead
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  doc.text(`For the period: ${period || '—'}`, MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 24

  // ============== TOP STATS STRIP ==============

  const ratios = [
    { label: 'Opening cash',  value: formatNumber(t.openingCash) },
    { label: 'Net change',    value: formatNumber(t.netChange),    accent: t.netChange >= 0 ? 'pos' : 'neg' },
    { label: 'Free cash flow', value: formatNumber(t.freeCashFlow), accent: t.freeCashFlow >= 0 ? 'pos' : 'neg' },
    { label: 'Closing cash',  value: formatNumber(t.closingCash) },
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

  const drawLine = (label, amount, opts = {}) => {
    const indent = opts.indent || 0
    const bold = !!opts.bold
    const color = opts.color || C_INK_950

    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...color)

    const text = String(label || '—')
    doc.text(text, labelX + 6 + indent, y + 13)
    const amt = Number(amount) || 0
    // Show negatives in parentheses for accounting style
    const formatted = amt < 0 ? `(${formatNumber(Math.abs(amt))})` : formatNumber(amt)
    doc.setTextColor(...(amt < 0 ? C_DANGER : color))
    doc.text(formatted, amountX - 6, y + 13, { align: 'right' })

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
    const amt = Number(amount) || 0
    doc.setTextColor(...(amt < 0 ? C_DANGER : (amt > 0 ? C_SUCCESS : C_INK_950)))
    const formatted = amt < 0 ? `(${formatNumber(Math.abs(amt))})` : formatNumber(amt)
    doc.text(formatted, amountX - 6, y + 16, { align: 'right' })
    y += 22
  }

  // === Opening cash ===
  drawLine('Cash & equivalents — opening', t.openingCash, { bold: true })
  y += 4

  // === Operating ===
  drawSectionHeader('Cash flows from operating activities')
  for (const ln of (data.operating || [])) {
    drawLine(ln.description, Number(ln.amount) || 0, { indent: 10, color: C_INK_700 })
  }
  drawSubtotal('Net cash from operating activities', t.netOperating)
  y += 6

  // === Investing ===
  drawSectionHeader('Cash flows from investing activities')
  for (const ln of (data.investing || [])) {
    drawLine(ln.description, Number(ln.amount) || 0, { indent: 10, color: C_INK_700 })
  }
  drawSubtotal('Net cash from investing activities', t.netInvesting)
  y += 6

  // === Financing ===
  drawSectionHeader('Cash flows from financing activities')
  for (const ln of (data.financing || [])) {
    drawLine(ln.description, Number(ln.amount) || 0, { indent: 10, color: C_INK_700 })
  }
  drawSubtotal('Net cash from financing activities', t.netFinancing)
  y += 6

  // === NET CHANGE ===
  drawSubtotal('Net change in cash', t.netChange)
  y += 6

  // === CLOSING CASH ===
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 36, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C_ACCOUNT)
  doc.text('CASH & EQUIVALENTS — CLOSING', labelX + 12, y + 22)
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(`${cur.code} ${formatNumber(t.closingCash)}`, amountX - 12, y + 24, { align: 'right' })
  y += 50

  // ============== FREE CASH FLOW NOTE ==============

  if (y < PAGE_H - 140) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('FREE CASH FLOW (OPERATING − CAPEX)', tableX, y)
    y += 10

    const fcfW = 280
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.rect(tableX, y, fcfW, 16, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_950)
    doc.text('Net operating', tableX + 8, y + 11)
    doc.text(formatNumber(t.netOperating), tableX + fcfW - 8, y + 11, { align: 'right' })
    y += 16

    doc.rect(tableX, y, fcfW, 16, 'S')
    doc.text('Less: CapEx', tableX + 8, y + 11)
    const capexStr = t.capex < 0 ? `(${formatNumber(Math.abs(t.capex))})` : formatNumber(t.capex)
    doc.setTextColor(...C_DANGER)
    doc.text(capexStr, tableX + fcfW - 8, y + 11, { align: 'right' })
    y += 16

    doc.setDrawColor(...C_INK_950)
    doc.setLineWidth(0.8)
    doc.rect(tableX, y, fcfW, 18, 'S')
    doc.setFillColor(245, 244, 241)
    doc.rect(tableX, y, fcfW, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...C_INK_950)
    doc.text('Free cash flow', tableX + 8, y + 12)
    doc.setTextColor(...(t.freeCashFlow >= 0 ? C_SUCCESS : C_DANGER))
    const fcfStr = t.freeCashFlow < 0
      ? `(${formatNumber(Math.abs(t.freeCashFlow))})`
      : formatNumber(t.freeCashFlow)
    doc.text(fcfStr, tableX + fcfW - 8, y + 12, { align: 'right' })
    y += 18
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
  const fileName = `${(data.companyName || 'cash-flow').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-cashflow.pdf`
  doc.save(fileName)
}
