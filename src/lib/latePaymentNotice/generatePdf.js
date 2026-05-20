import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findPurpose, findSignOff,
  computeNotice,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generateLatePaymentNoticePdf(data) → triggers a download           */
/* ------------------------------------------------------------------ */

const MARGIN = 64
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ROSE    = [244, 63, 94]
const C_AMBER   = [217, 119, 6]
const C_RED     = [220, 38, 38]

const BODY_FONT_SIZE = 10.5
const BODY_LINE_H = 15

const PURPOSE_ACCENT = {
  'demand':     C_AMBER,
  'pre-action': C_ROSE,
  'final':      C_RED,
}

export function generateLatePaymentNoticePdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findPurpose(data.purposeId)
  const signOff = findSignOff(data.signOffId)
  const c = computeNotice(data)
  const accent = PURPOSE_ACCENT[purpose.id] || C_ROSE

  let y = MARGIN

  // Top stripe
  doc.setFillColor(...accent)
  doc.rect(0, 0, PAGE_W, 5, 'F')

  // ============== LETTERHEAD ==============

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...C_INK_950)
  doc.text(data.sender?.name || '[Your Company]', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.sender?.address) {
    const lines = doc.splitTextToSize(data.sender.address, PAGE_W / 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 11 }
  }
  const contactLine = [data.sender?.email, data.sender?.phone].filter(Boolean).join('  ·  ')
  if (contactLine) { doc.text(contactLine, MARGIN, y); y += 11 }

  // Purpose tag (right side)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  const tagText = purpose.label.toUpperCase()
  const tagW = doc.getTextWidth(tagText) + 18
  doc.setFillColor(...accent)
  doc.rect(PAGE_W - MARGIN - tagW, MARGIN - 8, tagW, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(tagText, PAGE_W - MARGIN - tagW / 2, MARGIN + 4, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  doc.text(formatDate(data.noticeDate), PAGE_W - MARGIN, MARGIN + 24, { align: 'right' })
  if (data.noticeReference) {
    doc.text(`Ref: ${data.noticeReference}`, PAGE_W - MARGIN, MARGIN + 38, { align: 'right' })
  }

  y += 16

  // ============== TITLE BANNER ==============

  doc.setDrawColor(...accent)
  doc.setLineWidth(1.5)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...accent)
  doc.text('FORMAL NOTICE OF LATE PAYMENT', MARGIN, y); y += 18

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  y = drawWrapped(doc, `Issued under: ${c.framework.reference}`, MARGIN, y, PAGE_W - MARGIN * 2, 13, { italic: true })
  y += 6

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 16

  // ============== RECIPIENT ==============

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_500)
  doc.text('TO', MARGIN, y); y += 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_950)
  doc.text(data.debtor?.name || '[Debtor name]', MARGIN, y); y += 13

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...C_INK_700)
  if (data.debtor?.address) {
    const lines = doc.splitTextToSize(data.debtor.address, PAGE_W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  if (data.debtor?.companyNumber) { doc.text(`Company no.: ${data.debtor.companyNumber}`, MARGIN, y); y += 12 }
  if (data.debtor?.email)         { doc.text(data.debtor.email, MARGIN, y); y += 12 }

  y += 14

  // ============== OPENING ==============

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_700)
  const dearLine = data.debtor?.contactName ? `Dear ${data.debtor.contactName},` : 'Dear Sir / Madam,'
  doc.text(dearLine, MARGIN, y); y += BODY_LINE_H + 4

  const opening = purpose.id === 'final'
    ? `We refer to invoice ${data.invoiceNumber || ''} (the "Invoice") issued by ${data.sender?.name || 'us'} to ${data.debtor?.name || 'you'} on ${formatDate(data.invoiceDate) || '[invoice date]'} for the sum of ${cur.code} ${formatNumber(c.principal)} in respect of ${data.contractDescription || 'goods supplied / services rendered'}. The Invoice fell due for payment on ${formatDate(data.dueDate) || '[due date]'} and remains unpaid notwithstanding our previous demands. This letter constitutes a final statutory demand for payment.`
    : purpose.id === 'pre-action'
      ? `We refer to invoice ${data.invoiceNumber || ''} (the "Invoice") issued by ${data.sender?.name || 'us'} to ${data.debtor?.name || 'you'} on ${formatDate(data.invoiceDate) || '[invoice date]'} for the sum of ${cur.code} ${formatNumber(c.principal)} in respect of ${data.contractDescription || 'goods supplied / services rendered'}. The Invoice fell due for payment on ${formatDate(data.dueDate) || '[due date]'} and remains unpaid. We write to formally place you on notice of this debt prior to commencing recovery proceedings.`
      : `We refer to invoice ${data.invoiceNumber || ''} (the "Invoice") issued by ${data.sender?.name || 'us'} to ${data.debtor?.name || 'you'} on ${formatDate(data.invoiceDate) || '[invoice date]'} for the sum of ${cur.code} ${formatNumber(c.principal)} in respect of ${data.contractDescription || 'goods supplied / services rendered'}. The Invoice fell due for payment on ${formatDate(data.dueDate) || '[due date]'} and is now ${c.daysOverdue} day${c.daysOverdue === 1 ? '' : 's'} overdue.`
  y = drawWrapped(doc, opening, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  y += 8

  // ============== STATUTORY BLOCK ==============

  y = drawWrapped(doc,
    `Pursuant to ${c.framework.reference}, statutory interest accrues on the unpaid principal at the prescribed rate from the day after the due date until payment is received in cleared funds. The applicable rate is calculated as the ${c.framework.baseRateLabel.toLowerCase()} (currently ${formatNumber(Number(data.baseRatePct) || 0)}%) plus a statutory margin of ${formatNumber(Number(data.marginPct) || 0)}%, giving a total rate of ${formatNumber(c.interest.rate)}% per annum.`,
    MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  y += 8

  // Statement of account box
  y = ensureSpace(doc, y, 200)
  const boxX = MARGIN
  const boxW = PAGE_W - MARGIN * 2
  const includeComp = data.includeCompensation && c.compensation > 0
  const boxH = includeComp ? 170 : 140

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.6)
  doc.setFillColor(248, 247, 243)
  doc.roundedRect(boxX, y, boxW, boxH, 6, 6, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...accent)
  doc.text('STATEMENT OF ACCOUNT', boxX + 14, y + 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_500)
  doc.text(`As at ${formatDate(data.noticeDate)}`, boxX + boxW - 14, y + 20, { align: 'right' })

  const rows = [
    ['Invoice number',                          data.invoiceNumber || '—'],
    ['Invoice date',                            formatDate(data.invoiceDate) || '—'],
    ['Due date',                                formatDate(data.dueDate) || '—'],
    ['Days overdue',                            String(c.daysOverdue)],
    ['Principal sum',                           `${cur.code} ${formatNumber(c.principal)}`],
    [`Statutory interest @ ${formatNumber(c.interest.rate)}% p.a. (${c.daysOverdue} d)`,
                                                `${cur.code} ${formatNumber(c.interest.amount)}`],
  ]
  if (includeComp) {
    rows.push([`${c.framework.compensationLabel}`,
                `${c.framework.compensationCurrencyLabel || cur.code}${c.framework.compensationCurrencyLabel ? '' : ' '}${formatNumber(c.compensation)}`])
  }

  let rowY = y + 38
  for (const [k, v] of rows) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...C_INK_500)
    doc.text(k, boxX + 14, rowY)
    doc.setTextColor(...C_INK_950)
    doc.text(v, boxX + boxW - 14, rowY, { align: 'right' })
    rowY += 13
  }
  // Divider
  doc.setDrawColor(...C_LINE)
  doc.line(boxX + 14, rowY + 2, boxX + boxW - 14, rowY + 2); rowY += 12

  // TOTAL
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...accent)
  doc.text('TOTAL NOW DUE', boxX + 14, rowY)
  doc.text(`${cur.code} ${formatNumber(c.total)}`, boxX + boxW - 14, rowY, { align: 'right' })

  y += boxH + 18

  // ============== DEMAND PARAGRAPH ==============

  const demandPara = purpose.id === 'final'
    ? `WE HEREBY DEMAND payment of the total sum of ${cur.code} ${formatNumber(c.total)} within ${data.deadlineDays || 7} days of the date of this notice, being no later than ${c.deadlineFormatted}. Interest continues to accrue at ${cur.code} ${formatNumber(c.interest.perDay)} per day until payment is received in cleared funds. If payment is not received in full by the deadline, we shall, WITHOUT FURTHER NOTICE, take the following action: (a) commence legal proceedings to recover the debt, together with all interest, statutory compensation, and legal costs; (b) where applicable, present a statutory demand or winding-up petition; and (c) refer the matter to a debt-recovery agency.`
    : purpose.id === 'pre-action'
      ? `Demand is hereby made for payment of the total sum of ${cur.code} ${formatNumber(c.total)} within ${data.deadlineDays || 14} days of the date of this notice, being no later than ${c.deadlineFormatted}. Interest continues to accrue at ${cur.code} ${formatNumber(c.interest.perDay)} per day until payment is received. If full payment is not received by the deadline, we shall be entitled to commence proceedings for recovery without further reference to you, and to claim all interest, statutory compensation, and the reasonable costs of recovery.`
      : `Demand is hereby made for payment of the total sum of ${cur.code} ${formatNumber(c.total)} within ${data.deadlineDays || 14} days of the date of this notice, being no later than ${c.deadlineFormatted}. Interest continues to accrue at ${cur.code} ${formatNumber(c.interest.perDay)} per day until payment is received in cleared funds.`

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_700)
  y = drawWrapped(doc, demandPara, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  y += 8

  // ============== DISPUTE / RESPONSE ==============

  if (data.includeDisputeClause) {
    y = drawWrapped(doc,
      `If you dispute any part of this debt, you must notify us in writing within ${data.deadlineDays || 14} days of the date of this notice, setting out the precise grounds of the dispute and providing supporting evidence. In the absence of a substantive written response within that period, the debt shall be deemed admitted.`,
      MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
    y += 8
  }

  // ============== PAYMENT INSTRUCTIONS ==============

  if (data.paymentInstructions) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...accent)
    doc.text('PAYMENT DETAILS', MARGIN, y); y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_700)
    y = drawWrapped(doc, data.paymentInstructions, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
    y += 8
  }

  // ============== WITHOUT PREJUDICE ==============

  if (data.includeWithoutPrejudice) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_500)
    y = drawWrapped(doc,
      'This notice is sent without prejudice to any other rights or remedies available to us, all of which are expressly reserved.',
      MARGIN, y, PAGE_W - MARGIN * 2, 13, { italic: true })
    y += 8
  }

  // ============== SIGN-OFF ==============

  y = ensureSpace(doc, y, 100)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_700)
  doc.text(`${signOff.label},`, MARGIN, y); y += 38

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_950)
  doc.text(data.sender?.contactName || '[Authorised signatory]', MARGIN, y); y += 13

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...C_INK_500)
  if (data.sender?.contactTitle) { doc.text(data.sender.contactTitle, MARGIN, y); y += 11 }
  doc.text(`For and on behalf of ${data.sender?.name || '[Your Company]'}`, MARGIN, y); y += 11

  addPageFooters(doc, data, purpose)

  const fileName = `late-payment-notice-${(data.invoiceNumber || 'INV').replace(/[^a-z0-9-]+/gi, '-')}-${purpose.id}.pdf`
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

function addPageFooters(doc, data, purpose) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 30
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `${purpose.label} · ${data.invoiceNumber || ''}${data.noticeReference ? ` · Ref ${data.noticeReference}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
