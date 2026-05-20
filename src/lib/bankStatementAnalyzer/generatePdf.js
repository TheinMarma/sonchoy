import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findCategory,
  analyseTransactions, buildCategorySummary, buildVendorSummary, buildMonthlySummary,
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
const C_DANGER  = [220, 38, 38]

const BODY = 9

export function generateBankStatementAnalysisPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const { rows, totals } = analyseTransactions(data.transactions)
  const categorySummary = buildCategorySummary(rows)
  const vendorSummary   = buildVendorSummary(rows, 15)
  const monthlySummary  = buildMonthlySummary(rows)

  let y = MARGIN

  doc.setFillColor(...C_TAX); doc.rect(0, 0, PAGE_W, 4, 'F')

  // ============== HEADER ==============

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('BANK STATEMENT ANALYSIS', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.analysisTitle || 'Bank Statement Analysis', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.accountHolder)  meta.push(`Holder: ${data.accountHolder}`)
  if (data.bank)           meta.push(`Bank: ${data.bank}`)
  if (data.accountNumber)  meta.push(`A/C: ${data.accountNumber}`)
  if (data.periodLabel)    meta.push(`Period: ${data.periodLabel}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 12

  doc.setDrawColor(...C_TAX); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 14

  // ============== SUMMARY CARDS ==============

  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const netColor = totals.net >= 0 ? C_SUCCESS : C_DANGER
  const cards = [
    ['TOTAL INFLOWS',  `${cur.code} ${formatNumber(totals.totalCredit)}`, C_INK_950],
    ['TOTAL OUTFLOWS', `${cur.code} ${formatNumber(totals.totalDebit)}`,  C_INK_950],
    ['NET FLOW',       `${totals.net >= 0 ? '+' : '-'}${cur.code} ${formatNumber(Math.abs(totals.net))}`, netColor],
    ['TRANSACTIONS',   `${rows.length}`,                                  C_INK_950],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 50, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_TAX_DK); doc.text(cards[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.setTextColor(...cards[i][2]); doc.text(cards[i][1], x + 8, y + 34)
  }
  y += 50 + 14

  // ============== CATEGORY SUMMARY ==============

  if (data.includeCategorySummary && categorySummary.length > 0) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('BY CATEGORY', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 10
    const c2 = tX + tW * 0.42
    const c3 = tX + tW * 0.58
    const c4 = tX + tW * 0.78
    const c5 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('CATEGORY', c1, y + 11)
    doc.text('TXNS',     c2, y + 11, { align: 'right' })
    doc.text('DEBIT',    c3, y + 11, { align: 'right' })
    doc.text('CREDIT',   c4, y + 11, { align: 'right' })
    doc.text('NET',      c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < categorySummary.length; i++) {
      const s = categorySummary[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(s.label, c1, y + 10)
      doc.text(String(s.count),       c2, y + 10, { align: 'right' })
      doc.text(formatNumber(s.debit), c3, y + 10, { align: 'right' })
      doc.text(formatNumber(s.credit), c4, y + 10, { align: 'right' })
      doc.setTextColor(...(s.net >= 0 ? C_SUCCESS : C_DANGER))
      doc.text(`${s.net >= 0 ? '+' : '-'}${formatNumber(Math.abs(s.net))}`, c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  // ============== VENDOR SUMMARY ==============

  if (data.includeVendorSummary && vendorSummary.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('TOP VENDORS (BY SPEND)', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 10
    const c2 = tX + tW * 0.42
    const c3 = tX + tW * 0.58
    const c4 = tX + tW * 0.78
    const c5 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('VENDOR',    c1, y + 11)
    doc.text('CATEGORY',  c2, y + 11)
    doc.text('TXNS',      c3, y + 11, { align: 'right' })
    doc.text('RECURRING', c4, y + 11, { align: 'right' })
    doc.text('SPEND',     c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < vendorSummary.length; i++) {
      const v = vendorSummary[i]
      y = ensureSpace(doc, y, 14)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(v.vendor.slice(0, 28), c1, y + 10)
      doc.setTextColor(...C_INK_700)
      doc.text(findCategory(v.categoryId).label, c2, y + 10)
      doc.setTextColor(...C_INK_950)
      doc.text(String(v.count),      c3, y + 10, { align: 'right' })
      doc.setTextColor(...(v.recurring ? C_TAX_DK : C_INK_500))
      doc.text(v.recurring ? 'Yes' : '—', c4, y + 10, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(v.debit), c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  // ============== MONTHLY SUMMARY ==============

  if (data.includeMonthlySummary && monthlySummary.length > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('BY MONTH', MARGIN, y); y += 12

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const c1 = tX + 10
    const c2 = tX + tW * 0.28
    const c3 = tX + tW * 0.48
    const c4 = tX + tW * 0.70
    const c5 = tX + tW - 10

    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('MONTH',   c1, y + 11)
    doc.text('TXNS',    c2, y + 11, { align: 'right' })
    doc.text('INFLOWS', c3, y + 11, { align: 'right' })
    doc.text('OUTFLOWS', c4, y + 11, { align: 'right' })
    doc.text('NET',     c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const m of monthlySummary) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(m.month, c1, y + 10)
      doc.text(String(m.count),       c2, y + 10, { align: 'right' })
      doc.text(formatNumber(m.credit), c3, y + 10, { align: 'right' })
      doc.text(formatNumber(m.debit),  c4, y + 10, { align: 'right' })
      doc.setTextColor(...(m.net >= 0 ? C_SUCCESS : C_DANGER))
      doc.text(`${m.net >= 0 ? '+' : '-'}${formatNumber(Math.abs(m.net))}`, c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  // ============== RECURRING vs ONE-OFF ==============

  if (data.includeRecurringBlock) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('RECURRING vs ONE-OFF SPEND', MARGIN, y); y += 12

    const pjW = PAGE_W - MARGIN * 2
    doc.setDrawColor(...C_TAX); doc.setLineWidth(0.6)
    doc.setFillColor(244, 252, 220)
    doc.roundedRect(MARGIN, y, pjW, 52, 4, 4, 'FD')

    const cL = MARGIN + 14
    const cR = PAGE_W - MARGIN - 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    doc.text('Recurring (subscriptions, bills)', cL, y + 18)
    doc.text('One-off transactions',              cL, y + 34)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_TAX_DK)
    doc.text('TOTAL OUTFLOWS',                    cL, y + 48 - 1)

    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK_950)
    doc.text(`${cur.code} ${formatNumber(totals.recurringDebit)}`, cR, y + 18, { align: 'right' })
    doc.text(`${cur.code} ${formatNumber(totals.oneOffDebit)}`,    cR, y + 34, { align: 'right' })
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_TAX_DK)
    doc.text(`${cur.code} ${formatNumber(totals.totalDebit)}`,      cR, y + 48 - 1, { align: 'right' })
    y += 52 + 10
  }

  // ============== TRANSACTIONS TABLE ==============

  y = ensureSpace(doc, y, 40)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TRANSACTION DETAIL', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN     = tX + 4
  const cDate  = tX + 22
  const cDesc  = tX + 76
  const cCat   = tX + tW * 0.46
  const cDeb   = tX + tW * 0.65
  const cCred  = tX + tW * 0.80
  const cBal   = tX + tW - 4

  const drawHeader = () => {
    doc.setFillColor(...C_TAX); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(...C_TAX_DK)
    doc.text('#',          cN,   y + 11)
    doc.text('DATE',       cDate, y + 11)
    doc.text('DESCRIPTION', cDesc, y + 11)
    doc.text('CATEGORY',   cCat,  y + 11)
    doc.text('DEBIT',      cDeb,  y + 11, { align: 'right' })
    doc.text('CREDIT',     cCred, y + 11, { align: 'right' })
    doc.text('BALANCE',    cBal,  y + 11, { align: 'right' })
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
    doc.setTextColor(...C_INK_950)
    doc.text(String(i + 1), cN, y + 10)
    doc.text(formatDate(r.date) || '—', cDate, y + 10)
    const desc = doc.splitTextToSize(String(r.description || '—'), cCat - cDesc - 6)
    doc.text(desc.slice(0, 1), cDesc, y + 10)
    doc.setTextColor(...C_INK_700)
    doc.text(findCategory(r.categoryId).label, cCat, y + 10)
    doc.setTextColor(...(r.debit > 0 ? C_DANGER : C_INK_500))
    doc.text(r.debit > 0 ? formatNumber(r.debit) : '—', cDeb, y + 10, { align: 'right' })
    doc.setTextColor(...(r.credit > 0 ? C_SUCCESS : C_INK_500))
    doc.text(r.credit > 0 ? formatNumber(r.credit) : '—', cCred, y + 10, { align: 'right' })
    doc.setTextColor(...C_INK_950)
    doc.text(r.balance != null ? formatNumber(r.balance) : '—', cBal, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  // Totals
  y = ensureSpace(doc, y, 18)
  doc.setDrawColor(...C_TAX_DK); doc.setLineWidth(1)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
  doc.setTextColor(...C_TAX_DK)
  doc.text('TOTALS', cDate, y + 12)
  doc.text(formatNumber(totals.totalDebit),  cDeb,  y + 12, { align: 'right' })
  doc.text(formatNumber(totals.totalCredit), cCred, y + 12, { align: 'right' })
  y += 18

  // ============== NOTES ==============

  if (data.notes) {
    y += 6
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_TAX_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
  }

  addPageFooters(doc, data)

  const fileName = `bank-statement-analysis-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Bank statement analysis${data.periodLabel ? ` · ${data.periodLabel}` : ''}${data.reference ? ` · ${data.reference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
