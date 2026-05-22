import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findTaxType, findStatus, findReportPurpose,
  computeSummary, buildTypeSummary, buildJurisdictionSummary, buildOverdueList,
} from './compute'

const MARGIN = 36
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ACC     = [129, 140, 248]
const C_ACC_DK  = [67, 56, 202]
const C_SUCCESS = [22, 163, 74]
const C_WARN    = [217, 119, 6]
const C_DANGER  = [220, 38, 38]
const C_INFO    = [37, 99, 235]

const BODY = 9

const STATUS_COLOR = {
  success: C_SUCCESS,
  warning: C_WARN,
  danger:  C_DANGER,
  info:    C_INFO,
}

export function generateTaxSummaryReportPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findReportPurpose(data.purposeId)
  const result = computeSummary(data)
  const { rows, totals, statusCounts, overdueBalance, pendingBalance } = result
  const typeSummary = buildTypeSummary(rows)
  const jurisdictionSummary = buildJurisdictionSummary(rows)
  const overdueList = buildOverdueList(rows)

  let y = MARGIN

  doc.setFillColor(...C_ACC); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('TAX SUMMARY REPORT', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Tax Summary Report', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.entityName)  meta.push(`Entity: ${data.entityName}`)
  if (data.periodLabel) meta.push(`Period: ${data.periodLabel}`)
  if (data.reportDate)  meta.push(`As at: ${formatDate(data.reportDate)}`)
  meta.push(`Purpose: ${purpose.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_ACC); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* SUMMARY CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const balanceColor = totals.balance > 0 ? (overdueBalance > 0 ? C_DANGER : C_WARN) : C_SUCCESS
  const cards = [
    ['TAX COLLECTED',  `${cur.code} ${formatNumber(totals.collected)}`, C_INK_950],
    ['TAX OWED',       `${cur.code} ${formatNumber(totals.owed)}`,       C_INK_950],
    ['REMITTED',       `${cur.code} ${formatNumber(totals.remitted)}`,   C_SUCCESS],
    ['OUTSTANDING',    `${cur.code} ${formatNumber(totals.balance)}`,    balanceColor],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 50, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_ACC_DK); doc.text(cards[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5)
    doc.setTextColor(...cards[i][2]); doc.text(cards[i][1], x + 8, y + 34)
  }
  y += 50 + 14

  /* STATUS BAR */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_ACC_DK)
  doc.text('STATUS DASHBOARD', MARGIN, y); y += 12

  const statusCards = [
    ['OVERDUE',  statusCounts.overdue || 0, C_DANGER,  overdueBalance],
    ['PENDING',  (statusCounts.pending || 0) + (statusCounts.partial || 0), C_WARN, pendingBalance],
    ['PAID',     (statusCounts.paid || 0) + (statusCounts.filed || 0), C_SUCCESS, 0],
    ['TOTAL',    rows.length, C_ACC_DK, 0],
  ]
  for (let i = 0; i < statusCards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 42, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...statusCards[i][2]); doc.text(statusCards[i][0], x + 8, y + 12)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
    doc.setTextColor(...C_INK_950); doc.text(String(statusCards[i][1]), x + 8, y + 28)
    if (statusCards[i][3] > 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
      doc.setTextColor(...C_INK_500)
      doc.text(`${cur.code} ${formatNumber(statusCards[i][3])}`, x + cardW - 8, y + 28, { align: 'right' })
    }
  }
  y += 42 + 12

  /* MAIN TABLE */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_ACC_DK)
  doc.text('TAX OBLIGATIONS', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 4
  const cType  = tX + 22
  const cJur   = tX + 110
  const cDue   = tX + tW * 0.40
  const cOwed  = tX + tW * 0.58
  const cRem   = tX + tW * 0.72
  const cBal   = tX + tW * 0.86
  const cStat  = tX + tW - 4

  const drawHeader = () => {
    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('#',         cN,    y + 11)
    doc.text('TAX TYPE',  cType, y + 11)
    doc.text('JURISDICTION', cJur, y + 11)
    doc.text('DUE',       cDue,  y + 11)
    doc.text('OWED',      cOwed, y + 11, { align: 'right' })
    doc.text('REMITTED',  cRem,  y + 11, { align: 'right' })
    doc.text('BALANCE',   cBal,  y + 11, { align: 'right' })
    doc.text('STATUS',    cStat, y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < rows.length; i++) {
    if (y + 14 > PAGE_H - MARGIN - 28) {
      addPageFooters(doc, data); doc.addPage(); y = MARGIN; drawHeader()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    }
    const r = rows[i]
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(doc.splitTextToSize(r.taxTypeLabel, cJur - cType - 6).slice(0, 1), cType, y + 10)
    doc.setTextColor(...C_INK_700)
    doc.text(doc.splitTextToSize(String(r.jurisdiction || '—'), cDue - cJur - 6).slice(0, 1), cJur, y + 10)
    doc.text(formatDate(r.dueDate) || '—', cDue, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(r.owed), cOwed, y + 10, { align: 'right' })
    doc.setTextColor(...C_SUCCESS)
    doc.text(formatNumber(r.remitted), cRem, y + 10, { align: 'right' })
    doc.setTextColor(...(r.balance > 0 ? (r.statusId === 'overdue' ? C_DANGER : C_WARN) : C_SUCCESS))
    doc.text(formatNumber(r.balance), cBal, y + 10, { align: 'right' })
    doc.setTextColor(...(STATUS_COLOR[r.statusTone] || C_INK_500))
    doc.text(r.statusLabel.split(',')[0].slice(0, 14), cStat, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  // Totals
  y = ensureSpace(doc, y, 22)
  doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
  doc.setTextColor(...C_ACC_DK)
  doc.text('TOTAL', cType, y + 12)
  doc.text(formatNumber(totals.owed),     cOwed, y + 12, { align: 'right' })
  doc.text(formatNumber(totals.remitted), cRem,  y + 12, { align: 'right' })
  doc.text(formatNumber(totals.balance),  cBal,  y + 12, { align: 'right' })
  y += 18

  /* TYPE SUMMARY */
  if (data.includeTypeSummary && typeSummary.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('BY TAX TYPE', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + tW * 0.40
    const c3 = tX + tW * 0.55
    const c4 = tX + tW * 0.70
    const c5 = tX + tW * 0.85
    const c6 = tX + tW - 10

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('TYPE',     c1, y + 11)
    doc.text('COUNT',    c2, y + 11, { align: 'right' })
    doc.text('COLLECTED', c3, y + 11, { align: 'right' })
    doc.text('OWED',     c4, y + 11, { align: 'right' })
    doc.text('REMITTED', c5, y + 11, { align: 'right' })
    doc.text('BALANCE',  c6, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const t of typeSummary) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(t.label, c1, y + 10)
      doc.text(String(t.count), c2, y + 10, { align: 'right' })
      doc.text(formatNumber(t.collected), c3, y + 10, { align: 'right' })
      doc.text(formatNumber(t.owed),       c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_SUCCESS)
      doc.text(formatNumber(t.remitted),   c5, y + 10, { align: 'right' })
      doc.setTextColor(...(t.balance > 0 ? C_DANGER : C_SUCCESS))
      doc.text(formatNumber(t.balance),    c6, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* JURISDICTION SUMMARY */
  if (data.includeJurisdictionSummary && jurisdictionSummary.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('BY JURISDICTION', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + tW * 0.40
    const c3 = tX + tW * 0.60
    const c4 = tX + tW * 0.80
    const c5 = tX + tW - 10

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('JURISDICTION', c1, y + 11)
    doc.text('COUNT',    c2, y + 11, { align: 'right' })
    doc.text('OWED',     c3, y + 11, { align: 'right' })
    doc.text('REMITTED', c4, y + 11, { align: 'right' })
    doc.text('BALANCE',  c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const j of jurisdictionSummary) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(j.jurisdiction, c1, y + 10)
      doc.text(String(j.count), c2, y + 10, { align: 'right' })
      doc.text(formatNumber(j.owed),     c3, y + 10, { align: 'right' })
      doc.setTextColor(...C_SUCCESS)
      doc.text(formatNumber(j.remitted), c4, y + 10, { align: 'right' })
      doc.setTextColor(...(j.balance > 0 ? C_DANGER : C_SUCCESS))
      doc.text(formatNumber(j.balance),  c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* OVERDUE BLOCK */
  if (data.includeOverdueBlock && overdueList.length > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_DANGER)
    doc.text(`OVERDUE TAXES (${overdueList.length})`, MARGIN, y); y += 12

    doc.setDrawColor(...C_DANGER); doc.setLineWidth(0.6)
    doc.setFillColor(254, 242, 242)
    doc.roundedRect(MARGIN, y, tW, 60, 4, 4, 'FD')

    const cL = MARGIN + 14
    const cR = PAGE_W - MARGIN - 14
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
    doc.setTextColor(...C_DANGER)
    doc.text('Total overdue balance', cL, y + 18)
    doc.setTextColor(...C_DANGER)
    doc.text(`${cur.code} ${formatNumber(overdueBalance)}`, cR, y + 18, { align: 'right' })

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY - 0.5)
    doc.setTextColor(...C_INK_700)
    doc.text(`${overdueList.length} obligation${overdueList.length === 1 ? '' : 's'} past their due date`, cL, y + 36)
    doc.text('Resolve before next filing cycle to avoid penalties / interest', cL, y + 50)

    y += 60 + 8

    // Quick list of overdue items
    const c1 = tX + 10
    const c2 = tX + tW * 0.42
    const c3 = tX + tW * 0.65
    const c4 = tX + tW - 10
    for (let i = 0; i < overdueList.length; i++) {
      const r = overdueList[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(254, 248, 248); doc.rect(tX, y, tW, 14, 'F') }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...C_INK_950)
      doc.text(`${r.taxTypeLabel} — ${r.jurisdiction || '—'}`.slice(0, 50), c1, y + 10)
      doc.setTextColor(...C_DANGER)
      doc.text(`due ${formatDate(r.dueDate) || '—'}`, c2, y + 10)
      doc.setTextColor(...C_INK_700)
      doc.text(r.reference || '', c3, y + 10)
      doc.setTextColor(...C_DANGER)
      doc.text(`${cur.code} ${formatNumber(r.balance)}`, c4, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* NOTES */
  if (data.notes) {
    y += 6
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
  }

  addPageFooters(doc, data)

  const fileName = `tax-summary-report-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 20) { doc.addPage(); return MARGIN }
  return y
}

function addPageFooters(doc, data) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `Tax summary report${data.entityName ? ` · ${data.entityName}` : ''}${data.periodLabel ? ` · ${data.periodLabel}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
