import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber,
  computePayroll, findRegime, periodLabel,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generatePayrollTaxPdf(data) → triggers a download                  */
/* ------------------------------------------------------------------ */

const MARGIN = 36
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_TAX     = [132, 204, 22]
const C_DANGER  = [185, 28, 28]
const C_SUCCESS = [21, 128, 61]

export function generatePayrollTaxPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  const PW = PAGE_H // landscape
  const PH = PAGE_W

  const t = computePayroll(data)
  const regime = findRegime(data.regimeId)
  const cols = regime.columns
  const cur = findCurrency(data.currency || regime.defaultCurrency)
  const period = periodLabel(data)

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PW, 32, 'F')
  doc.setTextColor(...C_TAX)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('PAYROLL TAX REPORT', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`${regime.label}  ·  ${t.countEmployees} employees  ·  ${cur.code}`, PW - MARGIN, 20, { align: 'right' })

  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.employerName || 'Employer', MARGIN, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  const subLine = []
  if (data.taxId) subLine.push(`EIN/Tax ID: ${data.taxId}`)
  if (period) subLine.push(`Period: ${period}`)
  if (data.payFrequency) subLine.push(data.payFrequency)
  if (subLine.length) doc.text(subLine.join('  ·  '), MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PW - MARGIN, y, { align: 'right' })
  y += 24

  // ============== TOP STATS STRIP ==============

  const ratios = [
    { label: 'Gross payroll', value: formatNumber(t.gross) },
    { label: 'Total withheld', value: formatNumber(t.deductions), accent: 'neg' },
    { label: 'Net paid',      value: formatNumber(t.netPay) },
    { label: 'Employer cost', value: formatNumber(t.totalCost), accent: 'neg' },
  ]

  const stripX = MARGIN
  const stripW = PW - MARGIN * 2
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

  y += 58

  // ============== EMPLOYEE TABLE ==============

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('EMPLOYEE WITHHOLDING DETAIL', MARGIN, y)
  y += 10

  const tableX = MARGIN
  const tableW = stripW

  const tcols = {
    n:        { x: tableX, w: 20,  align: 'left'  },
    name:     { x: 0,      w: 140, align: 'left'  },
    id:       { x: 0,      w: 56,  align: 'left'  },
    gross:    { x: 0,      w: 72,  align: 'right' },
    income:   { x: 0,      w: 70,  align: 'right' },
    social:   { x: 0,      w: 70,  align: 'right' },
    medicare: { x: 0,      w: 60,  align: 'right' },
    net:      { x: 0,      w: 72,  align: 'right' },
    employer: { x: 0,      w: 0,   align: 'right' },
  }
  let used = 0
  for (const k of Object.keys(tcols)) if (k !== 'employer') used += tcols[k].w
  tcols.employer.w = tableW - used

  let cx = tableX
  for (const k of ['n', 'name', 'id', 'gross', 'income', 'social', 'medicare', 'net', 'employer']) {
    tcols[k].x = cx
    cx += tcols[k].w
  }

  // Header
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 26, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...C_TAX)
  const headers = {
    n: '#',
    name: 'EMPLOYEE',
    id: 'EMP ID',
    gross: 'GROSS',
    income: cols.incomeTax.toUpperCase(),
    social: cols.socialContrib.toUpperCase(),
    medicare: cols.medicare.toUpperCase(),
    net: 'NET PAY',
    employer: cols.employerContrib.toUpperCase(),
  }
  for (const k of Object.keys(tcols)) {
    const c = tcols[k]
    const tx = c.align === 'right' ? c.x + c.w - 4 : c.x + 4
    // wrap header text for narrow columns
    const wrapped = doc.splitTextToSize(headers[k], c.w - 6)
    doc.text(wrapped, tx, y + 11, { align: c.align })
  }
  y += 26

  const rowH = 22
  for (let i = 0; i < t.rows.length; i++) {
    if (y + rowH > PH - MARGIN - 120) {
      doc.addPage()
      y = MARGIN
    }
    const r = t.rows[i]
    const isEven = i % 2 === 0
    if (isEven) {
      doc.setFillColor(248, 247, 244)
      doc.rect(tableX, y, tableW, rowH, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1).padStart(2, '0'), tcols.n.x + 4, y + 14)

    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'bold')
    doc.text(truncate(doc, r.name || '—', tcols.name.w - 6), tcols.name.x + 4, y + 14)
    doc.setFont('helvetica', 'normal')

    doc.setTextColor(...C_INK_500)
    doc.text(truncate(doc, r.employeeId || '—', tcols.id.w - 6), tcols.id.x + 4, y + 14)

    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(r.gross), tcols.gross.x + tcols.gross.w - 4, y + 14, { align: 'right' })

    doc.setTextColor(...C_DANGER)
    doc.text(r.incomeTax > 0 ? formatNumber(r.incomeTax) : '—',
      tcols.income.x + tcols.income.w - 4, y + 14, { align: 'right' })
    doc.text(r.socialContrib > 0 ? formatNumber(r.socialContrib) : '—',
      tcols.social.x + tcols.social.w - 4, y + 14, { align: 'right' })
    doc.text(r.medicare > 0 ? formatNumber(r.medicare) : '—',
      tcols.medicare.x + tcols.medicare.w - 4, y + 14, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C_SUCCESS)
    doc.text(formatNumber(r.netPay), tcols.net.x + tcols.net.w - 4, y + 14, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C_INK_700)
    doc.text(r.employerContrib > 0 ? formatNumber(r.employerContrib) : '—',
      tcols.employer.x + tcols.employer.w - 4, y + 14, { align: 'right' })

    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.3)
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH)

    y += rowH
  }

  // Total row
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 30, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_TAX)
  doc.text('TOTALS', tableX + 8, y + 19)

  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text(formatNumber(t.gross),           tcols.gross.x    + tcols.gross.w    - 4, y + 19, { align: 'right' })
  doc.text(formatNumber(t.incomeTax),       tcols.income.x   + tcols.income.w   - 4, y + 19, { align: 'right' })
  doc.text(formatNumber(t.socialContrib),   tcols.social.x   + tcols.social.w   - 4, y + 19, { align: 'right' })
  doc.text(formatNumber(t.medicare),        tcols.medicare.x + tcols.medicare.w - 4, y + 19, { align: 'right' })
  doc.text(formatNumber(t.netPay),          tcols.net.x      + tcols.net.w      - 4, y + 19, { align: 'right' })
  doc.text(formatNumber(t.employerContrib), tcols.employer.x + tcols.employer.w - 4, y + 19, { align: 'right' })
  y += 42

  // ============== FILING SUMMARY ==============

  if (y + 130 > PH - MARGIN) {
    doc.addPage()
    y = MARGIN
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('FILING SUMMARY — REMIT TO TAX AUTHORITY', MARGIN, y)
  y += 10

  // Two columns of remittance
  const halfW = (stripW - 16) / 2

  // LEFT: Withholdings to remit
  doc.setFillColor(245, 244, 241)
  doc.rect(tableX, y, halfW, 18, 'F')
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.rect(tableX, y, halfW, 18, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_700)
  doc.text('EMPLOYEE WITHHOLDINGS', tableX + 8, y + 12)
  doc.text('AMOUNT', tableX + halfW - 8, y + 12, { align: 'right' })

  let ly = y + 18
  const employeeLines = [
    [cols.incomeTax,     t.incomeTax],
    [cols.socialContrib, t.socialContrib],
    [cols.medicare,      t.medicare],
  ].filter(([, v]) => v > 0)

  for (const [label, val] of employeeLines) {
    doc.rect(tableX, ly, halfW, 16, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_950)
    doc.text(label, tableX + 8, ly + 11)
    doc.setFont('helvetica', 'bold')
    doc.text(formatNumber(val), tableX + halfW - 8, ly + 11, { align: 'right' })
    ly += 16
  }
  // Subtotal
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, ly, halfW, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C_TAX)
  doc.text('Total withholdings', tableX + 8, ly + 14)
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(formatNumber(t.deductions), tableX + halfW - 8, ly + 14, { align: 'right' })

  // RIGHT: Employer contributions
  let ry = y
  const rx = tableX + halfW + 16
  doc.setFillColor(245, 244, 241)
  doc.rect(rx, ry, halfW, 18, 'F')
  doc.setDrawColor(...C_LINE)
  doc.rect(rx, ry, halfW, 18, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_700)
  doc.text('EMPLOYER CONTRIBUTIONS', rx + 8, ry + 12)
  doc.text('AMOUNT', rx + halfW - 8, ry + 12, { align: 'right' })

  ry += 18
  doc.rect(rx, ry, halfW, 16, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_950)
  doc.text(cols.employerContrib, rx + 8, ry + 11)
  doc.setFont('helvetica', 'bold')
  doc.text(formatNumber(t.employerContrib), rx + halfW - 8, ry + 11, { align: 'right' })
  ry += 16

  // Effective rates
  doc.rect(rx, ry, halfW, 16, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C_INK_500)
  doc.text('Effective tax rate (% of gross)', rx + 8, ry + 11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C_TAX)
  doc.text(`${t.effectiveTaxRate}%`, rx + halfW - 8, ry + 11, { align: 'right' })
  ry += 16

  doc.rect(rx, ry, halfW, 16, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C_INK_500)
  doc.text('Employer cost burden (%)', rx + 8, ry + 11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C_TAX)
  doc.text(`${t.employerCostRate}%`, rx + halfW - 8, ry + 11, { align: 'right' })
  ry += 16

  doc.setFillColor(...C_INK_950)
  doc.rect(rx, ry, halfW, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C_TAX)
  doc.text('Total employer cost', rx + 8, ry + 14)
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(formatNumber(t.totalCost), rx + halfW - 8, ry + 14, { align: 'right' })

  // ============== FOOTER ==============

  const footerY = PH - MARGIN
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, footerY - 36, PW - MARGIN, footerY - 36)

  if (regime.note) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...C_INK_500)
    const noteLines = doc.splitTextToSize(regime.note, stripW)
    doc.text(noteLines, MARGIN, footerY - 24)
  }

  if (data.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_700)
    const notes = doc.splitTextToSize(data.notes, stripW)
    doc.text(notes, MARGIN, footerY - 10)
  }

  doc.setFontSize(7)
  doc.setTextColor(...C_INK_500)
  doc.text('Generated with Sonchoy · sonchoy.com', PW - MARGIN, footerY - 2, { align: 'right' })

  const fileName = `${(data.employerName || 'payroll-tax').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-payroll-tax.pdf`
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
