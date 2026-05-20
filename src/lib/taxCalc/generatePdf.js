import jsPDF from 'jspdf'
import { findCurrency, formatNumber, computeTax, describePeriod } from './compute'

/* ------------------------------------------------------------------ */
/*  generateTaxCalcPdf(data) → triggers a download                     */
/* ------------------------------------------------------------------ */

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_CRIMSON = [237, 40, 40]
const C_TAX     = [132, 204, 22]   // lime-500
const C_SUCCESS = [21, 128, 61]
const C_DANGER  = [185, 28, 28]

export function generateTaxCalcPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const t = computeTax(data)
  const cur = findCurrency(data.currency || t.regime.defaultCurrency)
  const period = describePeriod(data)

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_TAX)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TAX CALCULATION SHEET', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`${t.regime.label}  ·  ${cur.code}`, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.taxpayerName || 'Taxpayer', MARGIN, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  const subLine = []
  if (data.taxId) subLine.push(`${t.regime.taxIdLabel}: ${data.taxId}`)
  if (period) subLine.push(`Period: ${period}`)
  if (subLine.length) doc.text(subLine.join('  ·  '), MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 24

  // ============== TOP STATS STRIP ==============

  const ratios = [
    { label: 'Gross income',  value: formatNumber(t.totalIncome) },
    { label: 'Taxable',       value: formatNumber(t.taxableIncome) },
    { label: 'Tax liability', value: formatNumber(t.totalLiability), accent: t.totalLiability > 0 ? 'neg' : null },
    { label: 'Effective %',   value: `${t.effectiveRate}%`,           accent: t.effectiveRate < 20 ? 'pos' : null },
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
    if (r.accent === 'pos') doc.setTextColor(...C_SUCCESS)
    else if (r.accent === 'neg') doc.setTextColor(...C_DANGER)
    else doc.setTextColor(...C_INK_950)
    doc.text(String(r.value), x + ratioW / 2, y + 34, { align: 'center' })
  })

  y += 58

  // ============== INCOME ==============

  drawSection(doc, MARGIN, y, stripW, 'INCOME')
  y += 18

  for (const inc of (data.income || [])) {
    y = drawLineRow(doc, MARGIN, y, stripW, inc.description || '—', Number(inc.amount) || 0, false)
  }
  y = drawSubtotalRow(doc, MARGIN, y, stripW, 'Gross total income', t.totalIncome)
  y += 8

  // ============== DEDUCTIONS ==============

  drawSection(doc, MARGIN, y, stripW, 'DEDUCTIONS')
  y += 18

  if (t.stdDeduction > 0) {
    y = drawLineRow(doc, MARGIN, y, stripW, 'Standard deduction', t.stdDeduction, true)
  }
  for (const ded of (data.deductions || [])) {
    const label = ded.section
      ? `${ded.description}  ·  ${ded.section}`
      : (ded.description || '—')
    y = drawLineRow(doc, MARGIN, y, stripW, label, Number(ded.amount) || 0, true)
  }
  y = drawSubtotalRow(doc, MARGIN, y, stripW, 'Total deductions', t.totalDeductions)
  y += 8

  // ============== TAXABLE INCOME ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(MARGIN, y, stripW, 28, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C_TAX)
  doc.text('TAXABLE INCOME', MARGIN + 12, y + 18)
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(formatNumber(t.taxableIncome), MARGIN + stripW - 12, y + 18, { align: 'right' })
  y += 38

  // ============== TAX BY SLAB ==============

  drawSection(doc, MARGIN, y, stripW, 'TAX COMPUTATION BY SLAB')
  y += 18

  // Header
  doc.setFillColor(245, 244, 241)
  doc.rect(MARGIN, y, stripW, 16, 'F')
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.rect(MARGIN, y, stripW, 16, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_700)
  doc.text('SLAB',     MARGIN + 8, y + 11)
  doc.text('RATE',     MARGIN + 200, y + 11)
  doc.text('TAXABLE',  MARGIN + stripW - 130, y + 11)
  doc.text('TAX',      MARGIN + stripW - 8, y + 11, { align: 'right' })
  y += 16

  for (const b of t.breakdown) {
    if (b.taxableInBand === 0 && b.from !== 0) continue
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.4)
    doc.rect(MARGIN, y, stripW, 16, 'S')

    const fromS = formatNumber(b.from)
    const toS = b.to === Infinity ? 'and above' : formatNumber(b.to)
    const slabLabel = b.to === Infinity ? `> ${fromS}` : `${fromS} – ${toS}`

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_950)
    doc.text(slabLabel, MARGIN + 8, y + 11)
    doc.setTextColor(...C_INK_500)
    doc.text(`${(b.rate * 100).toFixed(b.rate * 100 === Math.floor(b.rate * 100) ? 0 : 2)}%`, MARGIN + 200, y + 11)
    doc.setTextColor(...C_INK_700)
    doc.text(formatNumber(b.taxableInBand), MARGIN + stripW - 130, y + 11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(b.tax), MARGIN + stripW - 8, y + 11, { align: 'right' })
    y += 16
  }
  y = drawSubtotalRow(doc, MARGIN, y, stripW, 'Tax before cess/surcharge', t.tax)
  y += 4

  if (t.cess > 0) {
    y = drawLineRow(doc, MARGIN, y, stripW, `Health & education cess (${t.cessRate}%)`, t.cess, false)
  }
  if (t.surcharge > 0) {
    y = drawLineRow(doc, MARGIN, y, stripW, `Surcharge (${t.surchargeRate}%)`, t.surcharge, false)
  }
  y += 4

  // ============== TOTAL LIABILITY (big) ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(MARGIN, y, stripW, 36, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C_TAX)
  doc.text('TOTAL TAX LIABILITY', MARGIN + 12, y + 22)
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(`${cur.code} ${formatNumber(t.totalLiability)}`, MARGIN + stripW - 12, y + 24, { align: 'right' })
  y += 50

  // ============== KEY RATES ==============

  if (y + 90 < PAGE_H - MARGIN) {
    drawSection(doc, MARGIN, y, stripW, 'KEY METRICS')
    y += 18

    const metrics = [
      ['Effective tax rate', `${t.effectiveRate}%`,      'Total liability ÷ gross income'],
      ['Marginal tax rate',  `${t.marginalRate}%`,       'Rate on the next dollar/rupee earned'],
      ['Total deductions',   formatNumber(t.totalDeductions), 'Standard + line-item deductions'],
      ['Net income (after tax)', formatNumber(t.netIncome), 'Take-home: gross − total liability'],
    ]
    const c1 = 180, c2 = 110
    doc.setFillColor(245, 244, 241)
    doc.rect(MARGIN, y, stripW, 16, 'F')
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.rect(MARGIN, y, stripW, 16, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_700)
    doc.text('METRIC',  MARGIN + 8, y + 11)
    doc.text('VALUE',   MARGIN + c1, y + 11)
    doc.text('FORMULA', MARGIN + c1 + c2, y + 11)
    y += 16

    for (const [label, value, formula] of metrics) {
      doc.rect(MARGIN, y, stripW, 16, 'S')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...C_INK_950)
      doc.text(label, MARGIN + 8, y + 11)
      doc.setTextColor(...C_TAX)
      doc.text(value, MARGIN + c1, y + 11)
      doc.setTextColor(...C_INK_500)
      doc.text(formula, MARGIN + c1 + c2, y + 11)
      y += 16
    }
  }

  // ============== FOOTER ==============

  const footerY = PAGE_H - MARGIN
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, footerY - 40, PAGE_W - MARGIN, footerY - 40)

  // Regime note
  if (t.regime.note) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...C_INK_500)
    const noteLines = doc.splitTextToSize(t.regime.note, stripW)
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

  const fileName = `${(data.taxpayerName || 'tax-calculation').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-tax.pdf`
  doc.save(fileName)
}

function drawSection(doc, x, y, w, label) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.setFillColor(245, 244, 241)
  doc.rect(x, y, w, 18, 'F')
  doc.text(label, x + 6, y + 12)
}

function drawLineRow(doc, x, y, w, label, amount, isDeduction) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_700)
  doc.text(String(label), x + 14, y + 14)
  const sign = isDeduction ? '−' : ''
  const txt = `${sign}${formatNumber(amount)}`
  doc.setTextColor(...(isDeduction ? C_DANGER : C_INK_950))
  doc.text(txt, x + w - 6, y + 14, { align: 'right' })
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.4)
  doc.line(x, y + 18, x + w, y + 18)
  return y + 18
}

function drawSubtotalRow(doc, x, y, w, label, amount) {
  doc.setDrawColor(...C_INK_950)
  doc.setLineWidth(0.8)
  doc.line(x + w - 100, y + 2, x + w - 6, y + 2)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_950)
  doc.text(label, x + 6, y + 16)
  doc.text(formatNumber(amount), x + w - 6, y + 16, { align: 'right' })
  return y + 22
}
