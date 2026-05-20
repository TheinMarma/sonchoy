import jsPDF from 'jspdf'
import { findCurrency, formatNumber, computeIncomeStatement, describePeriod } from './compute'

/* ------------------------------------------------------------------ */
/*  generateIncomeStatementPdf(data) → triggers a download             */
/*  Comparative two-period layout with variance %.                     */
/* ------------------------------------------------------------------ */

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ACCOUNT = [99, 102, 241]
const C_SUCCESS = [21, 128, 61]
const C_DANGER  = [185, 28, 28]

export function generateIncomeStatementPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const { current, prior, variances } = computeIncomeStatement(data)
  const cur = findCurrency(data.currency)
  const currentLabel = describePeriod(data.currentPeriodLabel, data.currentPeriodStart, data.currentPeriodEnd)
  const priorLabel   = describePeriod(data.priorPeriodLabel,   data.priorPeriodStart,   data.priorPeriodEnd)

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_ACCOUNT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('INCOME STATEMENT', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`Comparative  ·  ${cur.code}`, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.companyName || 'Your Company', MARGIN, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  doc.text(`Comparing  ${currentLabel || 'current'}  vs  ${priorLabel || 'prior'}`, MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 24

  // ============== TOP RATIO STRIP ==============

  const ratios = [
    { label: 'Revenue',  value: formatNumber(current.revenue) },
    { label: 'Gross %',  value: `${current.grossMargin}%` },
    { label: 'Op %',     value: `${current.operatingMargin}%` },
    { label: 'Net %',    value: `${current.netMargin}%` },
    { label: 'EPS basic', value: current.epsBasic ? current.epsBasic.toFixed(2) : '—' },
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

  // Column geometry: [desc] [current $] [prior $] [Δ %]
  const cols = {
    desc:    { x: tableX,                              align: 'left'  },
    curr:    { x: tableX + tableW - 230,               align: 'right', label: currentLabel || 'Current' },
    prior:   { x: tableX + tableW - 110,               align: 'right', label: priorLabel || 'Prior' },
    varPct:  { x: tableX + tableW,                     align: 'right', label: 'Δ %' },
  }

  // Header row
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_ACCOUNT)
  doc.text('LINE', cols.desc.x + 4,  y + 14)
  doc.setTextColor(255, 255, 255)
  doc.text(String(cols.curr.label).toUpperCase(),  cols.curr.x - 4,  y + 14, { align: 'right' })
  doc.text(String(cols.prior.label).toUpperCase(), cols.prior.x - 4, y + 14, { align: 'right' })
  doc.setTextColor(...C_ACCOUNT)
  doc.text('Δ %', cols.varPct.x - 4, y + 14, { align: 'right' })
  y += 22

  const drawSectionHeader = (label) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.setFillColor(245, 244, 241)
    doc.rect(tableX, y, tableW, 18, 'F')
    doc.text(label.toUpperCase(), cols.desc.x + 4, y + 12)
    y += 18
  }

  const drawLine = (label, currAmt, priorAmt, opts = {}) => {
    const indent = opts.indent || 6
    const bold = !!opts.bold

    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...(bold ? C_INK_950 : C_INK_700))
    doc.text(String(label || '—'), cols.desc.x + indent, y + 13)

    const c = Number(currAmt) || 0
    const p = Number(priorAmt) || 0
    const formatVal = (v) => (v < 0 ? `(${formatNumber(Math.abs(v))})` : formatNumber(v))
    doc.setTextColor(...(c < 0 ? C_DANGER : (bold ? C_INK_950 : C_INK_700)))
    doc.text(formatVal(c), cols.curr.x - 4, y + 13, { align: 'right' })
    doc.setTextColor(...(p < 0 ? C_DANGER : C_INK_500))
    doc.text(formatVal(p), cols.prior.x - 4, y + 13, { align: 'right' })

    if (opts.showVariance && p !== 0) {
      const pctChange = ((c - p) / Math.abs(p)) * 100
      doc.setTextColor(...(pctChange >= 0 ? C_SUCCESS : C_DANGER))
      const arrow = pctChange >= 0 ? '+' : ''
      doc.text(`${arrow}${pctChange.toFixed(1)}%`, cols.varPct.x - 4, y + 13, { align: 'right' })
    } else if (opts.showVariance) {
      doc.setTextColor(...C_INK_500)
      doc.text('—', cols.varPct.x - 4, y + 13, { align: 'right' })
    }

    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.4)
    doc.line(tableX, y + 18, tableX + tableW, y + 18)
    y += 18
  }

  const drawSubtotal = (label, currAmt, priorAmt) => {
    doc.setDrawColor(...C_INK_950)
    doc.setLineWidth(0.8)
    doc.line(cols.curr.x - 80, y + 2, cols.curr.x - 4, y + 2)
    doc.line(cols.prior.x - 80, y + 2, cols.prior.x - 4, y + 2)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...C_INK_950)
    doc.text(label, cols.desc.x + 6, y + 16)
    const c = Number(currAmt) || 0
    const p = Number(priorAmt) || 0
    const formatVal = (v) => (v < 0 ? `(${formatNumber(Math.abs(v))})` : formatNumber(v))
    doc.setTextColor(...(c < 0 ? C_DANGER : C_INK_950))
    doc.text(formatVal(c), cols.curr.x - 4, y + 16, { align: 'right' })
    doc.setTextColor(...(p < 0 ? C_DANGER : C_INK_700))
    doc.text(formatVal(p), cols.prior.x - 4, y + 16, { align: 'right' })

    if (p !== 0) {
      const pctChange = ((c - p) / Math.abs(p)) * 100
      doc.setTextColor(...(pctChange >= 0 ? C_SUCCESS : C_DANGER))
      doc.text(`${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%`, cols.varPct.x - 4, y + 16, { align: 'right' })
    } else {
      doc.setTextColor(...C_INK_500)
      doc.text('—', cols.varPct.x - 4, y + 16, { align: 'right' })
    }
    y += 22
  }

  // === Revenue ===
  drawSectionHeader('Revenue')
  for (const ln of (data.revenue || [])) {
    drawLine(ln.description, Number(ln.current) || 0, Number(ln.prior) || 0, { indent: 14, showVariance: true })
  }
  drawSubtotal('Total revenue', current.revenue, prior.revenue)
  y += 6

  // === Cost of Revenue ===
  if ((data.costOfRevenue || []).length > 0) {
    drawSectionHeader('Cost of revenue')
    for (const ln of data.costOfRevenue) {
      drawLine(ln.description, -(Number(ln.current) || 0), -(Number(ln.prior) || 0), { indent: 14, showVariance: true })
    }
    drawSubtotal('Gross profit', current.grossProfit, prior.grossProfit)
    y += 6
  }

  // === Operating Expenses ===
  if ((data.operatingExpenses || []).length > 0) {
    drawSectionHeader('Operating expenses')
    for (const ln of data.operatingExpenses) {
      const label = ln.category ? `${ln.description}  ·  ${ln.category}` : ln.description
      drawLine(label, -(Number(ln.current) || 0), -(Number(ln.prior) || 0), { indent: 14, showVariance: true })
    }
    drawSubtotal('Operating income', current.operatingIncome, prior.operatingIncome)
    y += 6
  }

  // === Other ===
  const hasOther = (data.otherIncome || []).length > 0 || (data.otherExpenses || []).length > 0
  if (hasOther) {
    drawSectionHeader('Other income & expenses')
    for (const ln of (data.otherIncome || [])) {
      drawLine(ln.description, Number(ln.current) || 0, Number(ln.prior) || 0, { indent: 14, showVariance: true })
    }
    for (const ln of (data.otherExpenses || [])) {
      drawLine(ln.description, -(Number(ln.current) || 0), -(Number(ln.prior) || 0), { indent: 14, showVariance: true })
    }
    drawSubtotal('Income before tax', current.preTaxIncome, prior.preTaxIncome)
    y += 6
  } else {
    drawSubtotal('Income before tax', current.preTaxIncome, prior.preTaxIncome)
    y += 6
  }

  // === Tax ===
  drawSectionHeader('Tax')
  drawLine(`Tax expense  ·  ${current.effectiveTaxRate}% effective`,
    -(Number(data.currentTax) || 0),
    -(Number(data.priorTax) || 0),
    { indent: 14, showVariance: true })
  y += 6

  // === NET INCOME — bold callout row ===
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 36, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C_ACCOUNT)
  doc.text('NET INCOME', cols.desc.x + 12, y + 22)

  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(formatNumber(current.netIncome), cols.curr.x - 4, y + 23, { align: 'right' })
  doc.setFontSize(11)
  doc.setTextColor(200, 200, 195)
  doc.text(formatNumber(prior.netIncome), cols.prior.x - 4, y + 23, { align: 'right' })

  if (prior.netIncome !== 0) {
    const pctChange = ((current.netIncome - prior.netIncome) / Math.abs(prior.netIncome)) * 100
    doc.setFontSize(11)
    doc.setTextColor(...(pctChange >= 0 ? [134, 239, 172] : [252, 165, 165]))
    doc.text(`${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%`, cols.varPct.x - 4, y + 23, { align: 'right' })
  }
  y += 50

  // === EPS panel ===
  if (current.sharesBasic > 0 || prior.sharesBasic > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('EARNINGS PER SHARE', tableX, y)
    y += 10

    const epsRows = [
      ['EPS — Basic',   current.epsBasic,   prior.epsBasic],
      ['EPS — Diluted', current.epsDiluted, prior.epsDiluted],
      ['Weighted avg shares — basic',   current.sharesBasic,   prior.sharesBasic],
      ['Weighted avg shares — diluted', current.sharesDiluted, prior.sharesDiluted],
    ]

    for (const [label, c, p] of epsRows) {
      doc.setDrawColor(...C_LINE)
      doc.setLineWidth(0.5)
      doc.rect(tableX, y, tableW, 16, 'S')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...C_INK_700)
      doc.text(label, tableX + 8, y + 11)

      doc.setTextColor(...C_INK_950)
      doc.text(typeof c === 'number' && !Number.isInteger(c) ? c.toFixed(2) : formatNumber(c), cols.curr.x - 4, y + 11, { align: 'right' })
      doc.setTextColor(...C_INK_500)
      doc.text(typeof p === 'number' && !Number.isInteger(p) ? p.toFixed(2) : formatNumber(p), cols.prior.x - 4, y + 11, { align: 'right' })

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
  const fileName = `${(data.companyName || 'income-statement').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-income-statement.pdf`
  doc.save(fileName)
}
