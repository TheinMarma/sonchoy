import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findDepartment, findPayrollFrequency, findSummaryPurpose,
  computeSummary, buildDepartmentSummary,
} from './compute'

const MARGIN = 32
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ACC     = [129, 140, 248]
const C_ACC_DK  = [67, 56, 202]
const C_SUCCESS = [22, 163, 74]
const C_DANGER  = [220, 38, 38]

const BODY = 8.5

export function generatePayrollSummaryPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  const PAGE_W_L = PAGE_H
  const PAGE_H_L = PAGE_W
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findSummaryPurpose(data.purposeId)
  const frequency = findPayrollFrequency(data.frequencyId)
  const result = computeSummary(data)
  const { rows, totals, variance } = result
  const departments = buildDepartmentSummary(rows)

  let y = MARGIN

  doc.setFillColor(...C_ACC); doc.rect(0, 0, PAGE_W_L, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('PAYROLL SUMMARY', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W_L - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Payroll Summary', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.entityName)  meta.push(`Entity: ${data.entityName}`)
  if (data.periodLabel) meta.push(`Period: ${data.periodLabel}`)
  meta.push(`${frequency.label} payroll · ${purpose.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_ACC); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 14

  /* SUMMARY CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W_L - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['HEADCOUNT',       `${rows.length}`],
    ['GROSS WAGES',     `${cur.code} ${formatNumber(totals.gross)}`],
    ['NET PAID OUT',    `${cur.code} ${formatNumber(totals.net)}`],
    ['EMPLOYER COST',   `${cur.code} ${formatNumber(totals.ctc)}`],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 48, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_ACC_DK); doc.text(cards[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.setTextColor(...C_INK_950); doc.text(cards[i][1], x + 8, y + 34)
  }
  y += 48 + 12

  /* EMPLOYEE TABLE */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_ACC_DK)
  doc.text('EMPLOYEE PAYROLL DETAIL', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W_L - MARGIN * 2
  // Columns: # | Name | Dept | Basic | Allow | Gross | PF/ESI/PT | Tax | Deduct | Net | Employer | CTC
  const cN     = tX + 4
  const cName  = tX + 22
  const cDept  = tX + 130
  const cBasic = tX + 215
  const cAllow = tX + 260
  const cGross = tX + 315
  const cPfEsi = tX + 365
  const cTax   = tX + 415
  const cDed   = tX + 470
  const cNet   = tX + 525
  const cEmp   = tX + 585
  const cCtc   = tX + tW - 4

  const drawHeader = () => {
    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('#',         cN,    y + 11)
    doc.text('EMPLOYEE',  cName, y + 11)
    doc.text('DEPT',      cDept, y + 11)
    doc.text('BASIC',     cBasic, y + 11, { align: 'right' })
    doc.text('ALLOW',     cAllow, y + 11, { align: 'right' })
    doc.text('GROSS',     cGross, y + 11, { align: 'right' })
    doc.text('PF+ESI',    cPfEsi, y + 11, { align: 'right' })
    doc.text('TAX',       cTax,   y + 11, { align: 'right' })
    doc.text('DEDUCT',    cDed,   y + 11, { align: 'right' })
    doc.text('NET PAY',   cNet,   y + 11, { align: 'right' })
    doc.text('EMPLOYER',  cEmp,   y + 11, { align: 'right' })
    doc.text('CTC',       cCtc,   y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < rows.length; i++) {
    if (y + 14 > PAGE_H_L - MARGIN - 28) {
      addPageFooters(doc, data, PAGE_W_L, PAGE_H_L); doc.addPage('a4', 'landscape'); y = MARGIN; drawHeader()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    }
    const r = rows[i]
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(doc.splitTextToSize(String(r.name || '—'), cDept - cName - 6).slice(0, 1), cName, y + 10)
    doc.setTextColor(...C_INK_700)
    doc.text(doc.splitTextToSize(r.departmentLabel, cBasic - cDept - 6).slice(0, 1), cDept, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(r.basic),                cBasic, y + 10, { align: 'right' })
    doc.text(formatNumber(r.allowances + r.overtime + r.bonus), cAllow, y + 10, { align: 'right' })
    doc.text(formatNumber(r.gross),                cGross, y + 10, { align: 'right' })
    doc.setTextColor(...C_INK_700)
    doc.text(formatNumber(r.pf + r.esi + r.professionalTax), cPfEsi, y + 10, { align: 'right' })
    doc.text(formatNumber(r.incomeTax),            cTax,   y + 10, { align: 'right' })
    doc.text(formatNumber(r.totalDeductions),      cDed,   y + 10, { align: 'right' })
    doc.setTextColor(...C_SUCCESS)
    doc.text(formatNumber(r.net),                  cNet,   y + 10, { align: 'right' })
    doc.setTextColor(...C_INK_700)
    doc.text(formatNumber(r.employerTotal),        cEmp,   y + 10, { align: 'right' })
    doc.setTextColor(...C_ACC_DK)
    doc.text(formatNumber(r.ctc),                  cCtc,   y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  // Totals row
  y = ensureSpace(doc, y, 20, PAGE_H_L)
  doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
  doc.setTextColor(...C_ACC_DK)
  doc.text('TOTAL', cName, y + 12)
  doc.text(formatNumber(totals.basic),                                cBasic, y + 12, { align: 'right' })
  doc.text(formatNumber(totals.allowances + totals.overtime + totals.bonus), cAllow, y + 12, { align: 'right' })
  doc.text(formatNumber(totals.gross),                                cGross, y + 12, { align: 'right' })
  doc.text(formatNumber(totals.pf + totals.esi + totals.professionalTax), cPfEsi, y + 12, { align: 'right' })
  doc.text(formatNumber(totals.incomeTax),                            cTax,   y + 12, { align: 'right' })
  doc.text(formatNumber(totals.totalDeductions),                      cDed,   y + 12, { align: 'right' })
  doc.text(formatNumber(totals.net),                                  cNet,   y + 12, { align: 'right' })
  doc.text(formatNumber(totals.employerTotal),                        cEmp,   y + 12, { align: 'right' })
  doc.text(formatNumber(totals.ctc),                                  cCtc,   y + 12, { align: 'right' })
  y += 18

  /* DEPARTMENT SUMMARY */
  if (data.includeDepartmentSummary && departments.length > 0) {
    y = ensureSpace(doc, y, 80, PAGE_H_L)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('BY DEPARTMENT', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + tW * 0.35
    const c3 = tX + tW * 0.50
    const c4 = tX + tW * 0.65
    const c5 = tX + tW * 0.80
    const c6 = tX + tW - 10

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('DEPARTMENT', c1, y + 11)
    doc.text('HEADCOUNT', c2, y + 11, { align: 'right' })
    doc.text('GROSS',     c3, y + 11, { align: 'right' })
    doc.text('DEDUCT',    c4, y + 11, { align: 'right' })
    doc.text('NET',       c5, y + 11, { align: 'right' })
    doc.text('CTC',       c6, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const d of departments) {
      y = ensureSpace(doc, y, 14, PAGE_H_L)
      doc.setTextColor(...C_INK_950)
      doc.text(d.label, c1, y + 10)
      doc.text(String(d.headcount), c2, y + 10, { align: 'right' })
      doc.text(formatNumber(d.gross), c3, y + 10, { align: 'right' })
      doc.text(formatNumber(d.totalDeductions), c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_SUCCESS)
      doc.text(formatNumber(d.net), c5, y + 10, { align: 'right' })
      doc.setTextColor(...C_ACC_DK)
      doc.text(formatNumber(d.ctc), c6, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* DEDUCTIONS BREAKDOWN */
  if (data.includeDeductionsBreakdown) {
    y = ensureSpace(doc, y, 80, PAGE_H_L)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('EMPLOYEE DEDUCTIONS BREAKDOWN', MARGIN, y); y += 12

    const dedRows = [
      ['Provident fund (PF)',       totals.pf],
      ['ESI / health insurance',     totals.esi],
      ['Professional tax',           totals.professionalTax],
      ['Income tax / TDS',           totals.incomeTax],
      ['Loan deductions',            totals.loanDeduction],
      ['Other deductions',           totals.otherDeduction],
    ].filter(([, v]) => v > 0)

    const c1 = tX + 12
    const c2 = tX + tW - 12

    for (let i = 0; i < dedRows.length; i++) {
      const [label, value] = dedRows[i]
      y = ensureSpace(doc, y, 14, PAGE_H_L)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...C_INK_700)
      doc.text(label, c1, y + 10)
      doc.setTextColor(...C_INK_950)
      doc.text(`${cur.code} ${formatNumber(value)}`, c2, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y = ensureSpace(doc, y, 18, PAGE_H_L)
    doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(0.8)
    doc.line(tX, y, tX + tW, y); y += 2
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    doc.setTextColor(...C_ACC_DK)
    doc.text('TOTAL DEDUCTIONS', c1, y + 12)
    doc.text(`${cur.code} ${formatNumber(totals.totalDeductions)}`, c2, y + 12, { align: 'right' })
    y += 18
  }

  /* EMPLOYER CONTRIBUTIONS */
  if (data.includeEmployerContributions) {
    y = ensureSpace(doc, y, 80, PAGE_H_L)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('EMPLOYER CONTRIBUTIONS', MARGIN, y); y += 12

    const empRows = [
      ['Employer PF contribution', totals.employerPf],
      ['Employer ESI contribution', totals.employerEsi],
      ['Gratuity provision',       totals.gratuity],
      ['Other employer costs',     totals.otherEmployerCost],
    ].filter(([, v]) => v > 0)

    const c1 = tX + 12
    const c2 = tX + tW - 12

    for (let i = 0; i < empRows.length; i++) {
      const [label, value] = empRows[i]
      y = ensureSpace(doc, y, 14, PAGE_H_L)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...C_INK_700)
      doc.text(label, c1, y + 10)
      doc.setTextColor(...C_INK_950)
      doc.text(`${cur.code} ${formatNumber(value)}`, c2, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y = ensureSpace(doc, y, 18, PAGE_H_L)
    doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(0.8)
    doc.line(tX, y, tX + tW, y); y += 2
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    doc.setTextColor(...C_ACC_DK)
    doc.text('TOTAL EMPLOYER COST', c1, y + 12)
    doc.text(`${cur.code} ${formatNumber(totals.employerTotal)}`, c2, y + 12, { align: 'right' })
    y += 18
  }

  /* PRIOR COMPARISON */
  if (data.includePriorComparison && data.priorTotals) {
    y = ensureSpace(doc, y, 80, PAGE_H_L)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('VS PRIOR PERIOD', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + tW * 0.40
    const c3 = tX + tW * 0.60
    const c4 = tX + tW * 0.80
    const c5 = tX + tW - 10

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('METRIC',   c1, y + 11)
    doc.text('CURRENT',  c2, y + 11, { align: 'right' })
    doc.text('PRIOR',    c3, y + 11, { align: 'right' })
    doc.text('VARIANCE', c4, y + 11, { align: 'right' })
    doc.text('Δ%',       c5, y + 11, { align: 'right' })
    y += 16

    const rowsForCompare = [
      ['Gross wages',   totals.gross, Number(data.priorTotals.gross) || 0, variance.gross],
      ['Net paid out',  totals.net,   Number(data.priorTotals.net) || 0,   variance.net],
      ['Employer cost', totals.ctc,   Number(data.priorTotals.ctc) || 0,   variance.ctc],
    ]
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < rowsForCompare.length; i++) {
      const [label, current, prior, varAmt] = rowsForCompare[i]
      const varPct = prior > 0 ? (varAmt / prior) * 100 : 0
      y = ensureSpace(doc, y, 14, PAGE_H_L)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_700); doc.text(label, c1, y + 10)
      doc.setTextColor(...C_INK_950); doc.text(formatNumber(current), c2, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_500); doc.text(formatNumber(prior),   c3, y + 10, { align: 'right' })
      doc.setTextColor(...(varAmt > 0 ? C_DANGER : varAmt < 0 ? C_SUCCESS : C_INK_500))
      doc.text(`${varAmt >= 0 ? '+' : '-'}${formatNumber(Math.abs(varAmt))}`, c4, y + 10, { align: 'right' })
      doc.text(`${varPct >= 0 ? '+' : ''}${formatNumber(Math.round(varPct * 100) / 100)}%`, c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* NOTES */
  if (data.notes) {
    y = ensureSpace(doc, y, 30, PAGE_H_L)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W_L - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13, PAGE_H_L); doc.text(line, MARGIN, y); y += 13 }
  }

  addPageFooters(doc, data, PAGE_W_L, PAGE_H_L)

  const fileName = `payroll-summary-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed, pageH) {
  if (y + needed > pageH - MARGIN - 20) { doc.addPage('a4', 'landscape'); return MARGIN }
  return y
}

function addPageFooters(doc, data, pageW, pageH) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = pageH - 22
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, pageW - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `Payroll summary${data.entityName ? ` · ${data.entityName}` : ''}${data.periodLabel ? ` · ${data.periodLabel}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, pageW - MARGIN, footerY + 4, { align: 'right' })
  }
}
