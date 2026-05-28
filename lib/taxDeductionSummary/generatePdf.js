import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findCategory, findProofStatus, findSummaryPurpose,
  computeDeductions, buildCategorySummary, buildSectionSummary,
} from './compute'

const MARGIN = 36
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_TAX     = [132, 204, 22]
const C_TAX_DK  = [77, 124, 15]
const C_SUCCESS = [22, 163, 74]
const C_WARN    = [217, 119, 6]
const C_DANGER  = [220, 38, 38]

const BODY = 9

const STATUS_COLOR = {
  verified: C_SUCCESS,
  pending:  C_WARN,
  missing:  C_DANGER,
  'n/a':    C_INK_500,
}

export function generateTaxDeductionPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'INR')
  const purpose = findSummaryPurpose(data.purposeId)
  const { rows, totals, verifiedCount, pendingCount, missingCount } = computeDeductions(data.deductions)
  const categorySummary = buildCategorySummary(rows)
  const sectionSummary  = buildSectionSummary(rows)

  let y = MARGIN

  doc.setFillColor(...C_TAX); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('TAX DEDUCTION SUMMARY', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.summaryTitle || 'Tax Deduction Summary', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.taxpayerName) meta.push(`Taxpayer: ${data.taxpayerName}`)
  if (data.taxYear)      meta.push(`Tax year: ${data.taxYear}`)
  meta.push(`Purpose: ${purpose.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 12

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 14

  // Taxpayer info
  if (data.taxpayer?.address || data.taxpayer?.taxId || data.taxpayer?.email) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    doc.setTextColor(...C_INK_700)
    if (data.taxpayer?.taxId)   { doc.text(`Tax ID: ${data.taxpayer.taxId}`, MARGIN, y); y += 11 }
    if (data.taxpayer?.address) {
      const lines = doc.splitTextToSize(data.taxpayer.address, PAGE_W - MARGIN * 2)
      for (const ln of lines) { doc.text(ln, MARGIN, y); y += 11 }
    }
    if (data.taxpayer?.email) { doc.text(data.taxpayer.email, MARGIN, y); y += 11 }
    y += 6
  }

  /* SUMMARY CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['TOTAL CLAIMED',  `${cur.code} ${formatNumber(totals.claimable)}`],
    ['TOTAL LIMIT',    `${cur.code} ${formatNumber(totals.limit)}`],
    ['UNUSED HEADROOM', `${cur.code} ${formatNumber(totals.unused)}`],
    ['VERIFIED',       `${verifiedCount} / ${rows.length}`],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 50, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_TAX_DK); doc.text(cards[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.setTextColor(...C_INK_950); doc.text(cards[i][1], x + 8, y + 34)
  }
  y += 50 + 14

  /* DEDUCTIONS TABLE */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('CLAIMED DEDUCTIONS', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 4
  const cSec   = tX + 22
  const cDesc  = tX + 70
  const cLimit = tX + tW * 0.50
  const cClaim = tX + tW * 0.64
  const cProof = tX + tW * 0.78
  const cStat  = tX + tW * 0.92
  const cEnd   = tX + tW - 4

  const drawHeader = () => {
    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('#',         cN,    y + 11)
    doc.text('SECTION',   cSec,  y + 11)
    doc.text('DESCRIPTION', cDesc, y + 11)
    doc.text('LIMIT',     cLimit, y + 11, { align: 'right' })
    doc.text('CLAIMABLE', cClaim, y + 11, { align: 'right' })
    doc.text('PROOF',     cProof, y + 11, { align: 'right' })
    doc.text('STATUS',    cEnd,   y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < rows.length; i++) {
    if (y + 14 > PAGE_H - MARGIN - 28) {
      addPageFooters(doc, data, purpose); doc.addPage(); y = MARGIN; drawHeader()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    }
    const r = rows[i]
    const st = findProofStatus(r.proofStatusId)
    const stColor = STATUS_COLOR[st.id] || C_INK_500
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setTextColor(...C_INK_950)
    doc.text(String(i + 1), cN, y + 10)
    doc.text(r.section || '—', cSec, y + 10)
    const descLines = doc.splitTextToSize(r.description || '—', cLimit - cDesc - 6)
    doc.text(descLines.slice(0, 1), cDesc, y + 10)
    doc.text(r.limit > 0 ? formatNumber(r.limit) : '—', cLimit, y + 10, { align: 'right' })
    doc.setTextColor(...C_TAX_DK)
    doc.text(formatNumber(r.claimable), cClaim, y + 10, { align: 'right' })
    doc.setTextColor(...C_INK_700)
    doc.text((r.proofRef || '').slice(0, 18), cProof, y + 10, { align: 'right' })
    doc.setTextColor(...stColor)
    doc.text(st.label, cEnd, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  // Totals
  y = ensureSpace(doc, y, 18)
  doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TOTALS', cSec, y + 12)
  doc.text(formatNumber(totals.limit),     cLimit, y + 12, { align: 'right' })
  doc.text(formatNumber(totals.claimable), cClaim, y + 12, { align: 'right' })
  y += 18 + 4

  /* CATEGORY SUMMARY */
  if (data.includeCategorySummary && categorySummary.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('BY CATEGORY', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + tW * 0.42
    const c3 = tX + tW * 0.58
    const c4 = tX + tW * 0.78
    const c5 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('CATEGORY',   c1, y + 11)
    doc.text('ITEMS',      c2, y + 11, { align: 'right' })
    doc.text('CLAIMABLE',  c3, y + 11, { align: 'right' })
    doc.text('LIMIT',      c4, y + 11, { align: 'right' })
    doc.text('UNUSED',     c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const s of categorySummary) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(s.label,                    c1, y + 10)
      doc.text(String(s.count),            c2, y + 10, { align: 'right' })
      doc.text(formatNumber(s.claimable),  c3, y + 10, { align: 'right' })
      doc.text(s.limit > 0 ? formatNumber(s.limit) : '—',  c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(s.unused > 0 ? formatNumber(s.unused) : '—', c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* SECTION SUMMARY */
  if (data.includeSectionSummary && sectionSummary.length > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('BY SECTION CODE', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + 80
    const c3 = tX + tW * 0.60
    const c4 = tX + tW * 0.80
    const c5 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('SECTION',    c1, y + 11)
    doc.text('DESCRIPTION', c2, y + 11)
    doc.text('ITEMS',      c3, y + 11, { align: 'right' })
    doc.text('CLAIMABLE',  c4, y + 11, { align: 'right' })
    doc.text('LIMIT',      c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const s of sectionSummary) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(s.section, c1, y + 10)
      doc.text(doc.splitTextToSize(s.label || '', c3 - c2 - 6).slice(0, 1), c2, y + 10)
      doc.text(String(s.count),           c3, y + 10, { align: 'right' })
      doc.setTextColor(...C_TAX_DK)
      doc.text(formatNumber(s.claimable), c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_700)
      doc.text(s.limit > 0 ? formatNumber(s.limit) : '—', c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* PROOF AUDIT */
  if (data.includeProofAudit) {
    y = ensureSpace(doc, y, 70)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('PROOF-DOCUMENT AUDIT', MARGIN, y); y += 12

    const pjW = PAGE_W - MARGIN * 2
    doc.setDrawColor(...C_TAX); doc.setLineWidth(0.6)
    doc.setFillColor(244, 252, 220)
    doc.roundedRect(MARGIN, y, pjW, 60, 4, 4, 'FD')

    const cL = MARGIN + 14
    const cR = PAGE_W - MARGIN - 14
    const auditRows = [
      ['Verified',       verifiedCount, C_SUCCESS],
      ['Pending review', pendingCount,  C_WARN],
      ['Missing proof',  missingCount,  C_DANGER],
    ]
    let ry = y + 18
    for (const [label, count, color] of auditRows) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...C_INK_700); doc.text(label, cL, ry)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...color)
      doc.text(`${count} ${count === 1 ? 'item' : 'items'}`, cR, ry, { align: 'right' })
      ry += 13
    }
    y += 60 + 10

    if (missingCount > 0) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8)
      doc.setTextColor(...C_DANGER)
      doc.text(`⚠ ${missingCount} deduction${missingCount === 1 ? ' is' : 's are'} missing proof of document. Resolve before filing or audit.`,
        MARGIN, y); y += 14
    }
  }

  /* NOTES */
  if (data.notes) {
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
  }

  addPageFooters(doc, data, purpose)

  const fileName = `tax-deduction-summary-${(data.reference || purpose.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 20) { doc.addPage(); return MARGIN }
  return y
}

function addPageFooters(doc, data, purpose) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `Tax deduction summary${data.taxYear ? ` · ${data.taxYear}` : ''}${data.reference ? ` · ${data.reference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
