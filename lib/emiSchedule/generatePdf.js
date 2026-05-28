import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findFrequency, findLoanType,
  buildSchedule, buildYearlySummary,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generateEmiSchedulePdf(data) → triggers a download                 */
/* ------------------------------------------------------------------ */

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_TAX     = [132, 204, 22]   // lime
const C_TAX_DK  = [77, 124, 15]

const BODY_FONT_SIZE = 9.5

export function generateEmiSchedulePdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const frequency = findFrequency(data.frequencyId)
  const loanType = findLoanType(data.loanTypeId)
  const schedule = buildSchedule(data)
  const yearly = buildYearlySummary(schedule.rows)

  let y = MARGIN

  // ============== HEADER ==============

  // Top stripe
  doc.setFillColor(...C_TAX)
  doc.rect(0, 0, PAGE_W, 4, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('EMI / AMORTIZATION SCHEDULE', MARGIN, y + 8)
  if (data.scheduleReference) {
    doc.text(data.scheduleReference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  }
  y += 22

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.scheduleTitle || `${loanType.label} — EMI Schedule`, MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.borrowerName) meta.push(`Borrower: ${data.borrowerName}`)
  if (data.lenderName)   meta.push(`Lender: ${data.lenderName}`)
  if (meta.length) {
    doc.text(meta.join('  ·  '), MARGIN, y)
    y += 14
  }

  doc.setDrawColor(...C_TAX)
  doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y)
  y += 16

  // ============== LOAN SUMMARY CARDS ==============

  const cardCount = 4
  const gap = 8
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount

  const cards = [
    ['LOAN AMOUNT',   `${cur.code} ${formatNumber(Number(data.principal) || 0)}`],
    ['INTEREST RATE', `${formatNumber(Number(data.annualRatePct) || 0)}% p.a.`],
    [`EMI / ${frequency.label.toUpperCase()}`, `${cur.code} ${formatNumber(schedule.emi)}`],
    ['TOTAL PAYABLE', `${cur.code} ${formatNumber(schedule.totalPaid)}`],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 56, 4, 4, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text(cards[i][0], x + 10, y + 16)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...C_INK_950)
    doc.text(cards[i][1], x + 10, y + 40)
  }
  y += 56 + 14

  // ============== DETAILED LOAN INFO ==============

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('LOAN DETAILS', MARGIN, y); y += 12

  const detailRows = [
    ['Loan type',           loanType.label],
    ['Principal',           `${cur.code} ${formatNumber(Number(data.principal) || 0)}`],
    ['Annual interest rate', `${formatNumber(Number(data.annualRatePct) || 0)}%`],
    ['Payment frequency',   frequency.label],
    ['Total periods',       String(schedule.periodsActual)],
    ['Start date',          formatDate(data.startDate) || '—'],
    ['First payment',       formatDate(data.firstPaymentDate || data.startDate) || '—'],
    ['Final payment',       formatDate(schedule.finalPaymentDate) || '—'],
    ['Total interest',      `${cur.code} ${formatNumber(schedule.totalInterest)}`],
    ['Total paid',          `${cur.code} ${formatNumber(schedule.totalPaid)}`],
  ]
  if (Number(data.extraPayment) > 0) {
    detailRows.splice(4, 0, ['Extra payment / period', `${cur.code} ${formatNumber(Number(data.extraPayment) || 0)}`])
  }

  const dCol1 = MARGIN
  const dCol2 = MARGIN + (PAGE_W - MARGIN * 2) / 2 + 10
  const dColW = (PAGE_W - MARGIN * 2) / 2 - 10
  const half = Math.ceil(detailRows.length / 2)

  let rowY1 = y
  let rowY2 = y
  for (let i = 0; i < detailRows.length; i++) {
    const [k, v] = detailRows[i]
    const inLeft = i < half
    const x = inLeft ? dCol1 : dCol2
    const ry = inLeft ? rowY1 : rowY2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_500)
    doc.text(k, x, ry)
    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'bold')
    doc.text(v, x + dColW, ry, { align: 'right' })
    if (inLeft) rowY1 += 13
    else        rowY2 += 13
  }
  y = Math.max(rowY1, rowY2) + 10

  // ============== YEARLY SUMMARY ==============

  if (yearly.length > 0 && y < PAGE_H - 240) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEARLY SUMMARY', MARGIN, y); y += 12

    const ySumX = MARGIN
    const ySumW = PAGE_W - MARGIN * 2
    const cYear   = ySumX + 10
    const cPrin   = ySumX + ySumW * 0.30
    const cInt    = ySumX + ySumW * 0.52
    const cTotal  = ySumX + ySumW * 0.74
    const cBal    = ySumX + ySumW - 10

    // Header bar
    doc.setFillColor(...C_TAX)
    doc.rect(ySumX, y, ySumW, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_TAX_DK)
    doc.text('YEAR',           cYear,  y + 12)
    doc.text('PRINCIPAL',      cPrin,  y + 12, { align: 'right' })
    doc.text('INTEREST',       cInt,   y + 12, { align: 'right' })
    doc.text('TOTAL PAID',     cTotal, y + 12, { align: 'right' })
    doc.text('YEAR-END BAL.',  cBal,   y + 12, { align: 'right' })
    y += 18

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_950)
    for (const r of yearly) {
      y = ensureSpace(doc, y, 16)
      doc.text(String(r.year),                  cYear,  y + 12)
      doc.text(formatNumber(r.principal),       cPrin,  y + 12, { align: 'right' })
      doc.text(formatNumber(r.interest),        cInt,   y + 12, { align: 'right' })
      doc.text(formatNumber(r.emi),             cTotal, y + 12, { align: 'right' })
      doc.text(formatNumber(r.closing),         cBal,   y + 12, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE)
      doc.setLineWidth(0.3)
      doc.line(ySumX, y, ySumX + ySumW, y)
    }
    y += 8
  }

  // ============== AMORTIZATION TABLE ==============

  if (schedule.rows.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('AMORTIZATION SCHEDULE', MARGIN, y); y += 12

    const tX = MARGIN
    const tW = PAGE_W - MARGIN * 2

    // Column anchors (right-aligned for numeric columns)
    const c1  = tX + 8
    const c2  = tX + 38
    const c3  = tX + tW * 0.30
    const c4  = tX + tW * 0.50
    const c5  = tX + tW * 0.68
    const c6  = tX + tW * 0.84
    const c7  = tX + tW - 8

    const drawTableHeader = () => {
      doc.setFillColor(...C_TAX)
      doc.rect(tX, y, tW, 18, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...C_TAX_DK)
      doc.text('#',              c1, y + 12)
      doc.text('DUE DATE',       c2, y + 12)
      doc.text('OPENING BAL.',   c3, y + 12, { align: 'right' })
      doc.text('EMI',            c4, y + 12, { align: 'right' })
      doc.text('INTEREST',       c5, y + 12, { align: 'right' })
      doc.text('PRINCIPAL',      c6, y + 12, { align: 'right' })
      doc.text('CLOSING BAL.',   c7, y + 12, { align: 'right' })
      y += 18
    }
    drawTableHeader()

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_950)

    for (let i = 0; i < schedule.rows.length; i++) {
      // Page-break check
      if (y + 14 > PAGE_H - MARGIN - 30) {
        addPageFooters(doc, data, loanType)
        doc.addPage()
        y = MARGIN
        drawTableHeader()
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(BODY_FONT_SIZE)
        doc.setTextColor(...C_INK_950)
      }
      const r = schedule.rows[i]
      // Zebra
      if (i % 2 === 1) {
        doc.setFillColor(252, 252, 250)
        doc.rect(tX, y, tW, 14, 'F')
      }
      doc.text(String(r.n),                     c1, y + 10)
      doc.text(formatDate(r.dueDate) || '—',    c2, y + 10)
      doc.text(formatNumber(r.opening),         c3, y + 10, { align: 'right' })
      doc.text(formatNumber(r.emi),             c4, y + 10, { align: 'right' })
      doc.text(formatNumber(r.interest),        c5, y + 10, { align: 'right' })
      doc.text(formatNumber(r.principal),       c6, y + 10, { align: 'right' })
      doc.text(formatNumber(r.closing),         c7, y + 10, { align: 'right' })
      y += 14
    }

    // Totals row
    y = ensureSpace(doc, y, 18)
    doc.setDrawColor(...C_TAX_DK)
    doc.setLineWidth(1)
    doc.line(tX, y, tX + tW, y); y += 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C_TAX_DK)
    doc.text('TOTALS',                                                 c2, y + 12)
    doc.text(`${cur.code} ${formatNumber(schedule.totalPaid)}`,         c4, y + 12, { align: 'right' })
    doc.text(`${cur.code} ${formatNumber(schedule.totalInterest)}`,     c5, y + 12, { align: 'right' })
    doc.text(`${cur.code} ${formatNumber(Number(data.principal) || 0)}`,c6, y + 12, { align: 'right' })
    y += 18
  }

  // ============== NOTES ==============

  if (data.notes) {
    y += 4
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_700)
    y = drawWrapped(doc, data.notes, MARGIN, y, PAGE_W - MARGIN * 2, 13)
  }

  addPageFooters(doc, data, loanType)

  const fileName = `emi-schedule-${(data.scheduleReference || loanType.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function drawWrapped(doc, text, x, y, maxW, lineH, opts = {}) {
  if (!text) return y
  doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'))
  const lines = doc.splitTextToSize(String(text), maxW)
  for (const line of lines) {
    y = ensureSpace(doc, y, lineH)
    doc.text(line, x, y)
    y += lineH
  }
  return y
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 20) {
    doc.addPage()
    return MARGIN
  }
  return y
}

function addPageFooters(doc, data, loanType) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `${loanType.label} EMI schedule${data.scheduleReference ? ` · ${data.scheduleReference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
