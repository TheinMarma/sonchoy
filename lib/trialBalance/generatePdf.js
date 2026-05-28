import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findAccountType, findTbPurpose,
  computeTrialBalance, buildTypeSummary, groupAccountsByType,
} from './compute'

const MARGIN = 36
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ACC     = [129, 140, 248]   // indigo
const C_ACC_DK  = [67, 56, 202]
const C_SUCCESS = [22, 163, 74]
const C_DANGER  = [220, 38, 38]

const BODY = 9

export function generateTrialBalancePdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findTbPurpose(data.purposeId)
  const { rows, totals, difference, inBalance } = computeTrialBalance(data.accounts)
  const typeSummary = buildTypeSummary(rows)
  const grouped = groupAccountsByType(rows)

  let y = MARGIN

  doc.setFillColor(...C_ACC); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('TRIAL BALANCE', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Trial Balance', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.entityName)   meta.push(`Entity: ${data.entityName}`)
  if (data.periodLabel)  meta.push(`As at: ${data.periodLabel}`)
  meta.push(`Purpose: ${purpose.label}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_ACC); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* BALANCE STATUS CARD */
  const statusColor = inBalance ? C_SUCCESS : C_DANGER
  const statusLabel = inBalance ? 'IN BALANCE' : 'OUT OF BALANCE'
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const cards = [
    ['TOTAL DEBITS',  `${cur.code} ${formatNumber(totals.debit)}`,  C_INK_950],
    ['TOTAL CREDITS', `${cur.code} ${formatNumber(totals.credit)}`, C_INK_950],
    ['DIFFERENCE',    inBalance ? '0.00' : `${cur.code} ${formatNumber(Math.abs(difference))}`, statusColor],
    ['STATUS',        statusLabel, statusColor],
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

  /* ACCOUNTS TABLE — grouped or flat */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_ACC_DK)
  doc.text(data.includeGrouping ? 'ACCOUNTS BY TYPE' : 'ACCOUNT LISTING', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cCode = tX + 6
  const cName = tX + 64
  const cType = tX + tW * 0.55
  const cDebit = tX + tW * 0.78
  const cCredit = tX + tW - 6

  const drawHeader = () => {
    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('CODE',     cCode,   y + 11)
    doc.text('ACCOUNT',  cName,   y + 11)
    doc.text('TYPE',     cType,   y + 11)
    doc.text('DEBIT',    cDebit,  y + 11, { align: 'right' })
    doc.text('CREDIT',   cCredit, y + 11, { align: 'right' })
    y += 16
  }
  drawHeader()

  const drawAccountRow = (a, idx) => {
    if (y + 14 > PAGE_H - MARGIN - 28) {
      addPageFooters(doc, data, purpose); doc.addPage(); y = MARGIN; drawHeader()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    }
    if (idx % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_500)
    doc.text(String(a.code || '—'), cCode, y + 10)
    doc.setTextColor(...C_INK_950)
    const nameLines = doc.splitTextToSize(String(a.name || '—'), cType - cName - 6)
    doc.text(nameLines.slice(0, 1), cName, y + 10)
    doc.setTextColor(...C_INK_700)
    doc.text(a.typeLabel, cType, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(a.debit > 0 ? formatNumber(a.debit) : '—',  cDebit,  y + 10, { align: 'right' })
    doc.text(a.credit > 0 ? formatNumber(a.credit) : '—', cCredit, y + 10, { align: 'right' })
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
  }

  if (data.includeGrouping) {
    let idx = 0
    for (const group of grouped) {
      // Group header band
      y = ensureSpace(doc, y, 18)
      doc.setFillColor(...C_ACC); doc.setDrawColor(...C_ACC)
      // Light tint for group header
      doc.setFillColor(230, 232, 252)
      doc.rect(tX, y, tW, 14, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      doc.setTextColor(...C_ACC_DK)
      doc.text(`${group.label.toUpperCase()} (${group.accounts.length} accounts)`, cCode, y + 10)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
      doc.text(`Normal side: ${group.normalSide}`, cType, y + 10)
      y += 14
      idx = 0
      for (const a of group.accounts) {
        drawAccountRow(a, idx); idx += 1
      }
      // Subtotal
      y = ensureSpace(doc, y, 14)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
      doc.setTextColor(...C_ACC_DK)
      doc.text(`Subtotal · ${group.label}`, cName, y + 10)
      doc.text(formatNumber(group.subtotalDebit),  cDebit,  y + 10, { align: 'right' })
      doc.text(formatNumber(group.subtotalCredit), cCredit, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5); doc.line(tX, y, tX + tW, y)
      y += 4
    }
  } else {
    // Flat list (sorted by account code)
    const flat = [...rows].sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
    for (let i = 0; i < flat.length; i++) {
      drawAccountRow(flat[i], i)
    }
  }

  /* GRAND TOTALS */
  y = ensureSpace(doc, y, 22)
  doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(1.2)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.setTextColor(...C_ACC_DK)
  doc.text('GRAND TOTAL', cName, y + 12)
  doc.text(`${cur.code} ${formatNumber(totals.debit)}`,  cDebit,  y + 12, { align: 'right' })
  doc.text(`${cur.code} ${formatNumber(totals.credit)}`, cCredit, y + 12, { align: 'right' })
  y += 18
  doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(0.6)
  doc.line(tX, y, tX + tW, y); y += 2
  doc.line(tX, y, tX + tW, y); y += 10

  /* TYPE SUMMARY */
  if (data.includeTypeSummary && typeSummary.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('ACCOUNT-TYPE SUMMARY', MARGIN, y); y += 12

    const c1 = tX + 10
    const c2 = tX + tW * 0.35
    const c3 = tX + tW * 0.50
    const c4 = tX + tW * 0.70
    const c5 = tX + tW - 10

    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('TYPE',   c1, y + 11)
    doc.text('ACCTS',  c2, y + 11, { align: 'right' })
    doc.text('DEBIT',  c3, y + 11, { align: 'right' })
    doc.text('CREDIT', c4, y + 11, { align: 'right' })
    doc.text('NET',    c5, y + 11, { align: 'right' })
    y += 16

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const t of typeSummary) {
      y = ensureSpace(doc, y, 14)
      doc.setTextColor(...C_INK_950)
      doc.text(t.label, c1, y + 10)
      doc.text(String(t.count), c2, y + 10, { align: 'right' })
      doc.text(formatNumber(t.debit),  c3, y + 10, { align: 'right' })
      doc.text(formatNumber(t.credit), c4, y + 10, { align: 'right' })
      doc.setTextColor(...(t.net >= 0 ? C_INK_950 : C_DANGER))
      doc.text(`${t.net >= 0 ? '' : '-'}${formatNumber(Math.abs(t.net))}`, c5, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 8
  }

  /* CERTIFICATION BLOCK */
  if (data.includeCertification) {
    y = ensureSpace(doc, y, 80)
    doc.setDrawColor(...C_ACC); doc.setLineWidth(0.6)
    doc.setFillColor(244, 245, 255)
    doc.roundedRect(MARGIN, y, tW, 64, 4, 4, 'FD')

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('CERTIFICATION', MARGIN + 14, y + 16)

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const certLines = doc.splitTextToSize(
      `I certify that the above trial balance has been prepared from the general ledger of ${data.entityName || 'the entity'} as at ${data.periodLabel || 'the period end date'}, and the totals shown agree with the underlying ledger records.`,
      tW - 28
    )
    let cy = y + 32
    for (const line of certLines.slice(0, 2)) { doc.text(line, MARGIN + 14, cy); cy += 12 }

    // Signature block
    const sigY = y + 64 + 14
    if (sigY + 60 < PAGE_H - MARGIN - 24) {
      y = sigY
      doc.setDrawColor(...C_INK_500); doc.setLineWidth(0.5)
      doc.line(MARGIN, y, MARGIN + 200, y)
      doc.line(PAGE_W - MARGIN - 180, y, PAGE_W - MARGIN, y)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      doc.setTextColor(...C_INK_500)
      doc.text('Prepared by', MARGIN, y + 10)
      doc.text('Approved by', PAGE_W - MARGIN - 180, y + 10)
      if (data.preparedByName) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
        doc.setTextColor(...C_INK_950)
        doc.text(data.preparedByName, MARGIN, y - 4)
      }
      if (data.approvedByName) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
        doc.setTextColor(...C_INK_950)
        doc.text(data.approvedByName, PAGE_W - MARGIN - 180, y - 4)
      }
      y += 24
    } else {
      y += 64 + 10
    }
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

  addPageFooters(doc, data, purpose)

  const fileName = `trial-balance-${(data.reference || purpose.id).replace(/[^a-z0-9-]+/gi, '-')}.pdf`
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
    const left = `Trial balance${data.entityName ? ` · ${data.entityName}` : ''}${data.periodLabel ? ` · ${data.periodLabel}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
