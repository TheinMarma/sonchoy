import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findSignOff, buildLetterCopy,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generatePaymentReminderPdf(data) → triggers a download             */
/* ------------------------------------------------------------------ */

const MARGIN = 64
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ROSE    = [244, 63, 94]

const BODY_FONT_SIZE = 10.5
const BODY_LINE_H = 15

const TONE_COLOR = {
  friendly: [22, 163, 74],   // green
  polite:   [180, 130, 30],  // amber
  firm:     [217, 119, 6],   // dark amber
  final:    [220, 38, 38],   // red
}

export function generatePaymentReminderPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const signOff = findSignOff(data.signOffId)
  const letter = buildLetterCopy(data)
  const accent = TONE_COLOR[letter.stage.tone] || C_ROSE

  let y = MARGIN

  // ============== LETTERHEAD ==============

  // Top accent
  doc.setFillColor(...accent)
  doc.rect(0, 0, PAGE_W, 4, 'F')

  y = MARGIN + 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...C_INK_950)
  doc.text(data.sender?.name || '[Your Company]', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.sender?.address) {
    const addrLines = doc.splitTextToSize(data.sender.address, PAGE_W - MARGIN * 2)
    for (const line of addrLines) { doc.text(line, MARGIN, y); y += 11 }
  }
  const contactLine = [data.sender?.email, data.sender?.phone].filter(Boolean).join('  ·  ')
  if (contactLine) { doc.text(contactLine, MARGIN, y); y += 11 }

  y += 18

  // Stage tag (right side, top)
  doc.setFillColor(...accent)
  const tagText = letter.stage.tag
  doc.setFontSize(8)
  const tagW = doc.getTextWidth(tagText) + 16
  doc.rect(PAGE_W - MARGIN - tagW, MARGIN + 14 - 10, tagW, 18, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text(tagText, PAGE_W - MARGIN - tagW / 2, MARGIN + 14 + 2, { align: 'center' })

  // Letter date (right under tag)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  doc.text(formatDate(data.letterDate), PAGE_W - MARGIN, MARGIN + 14 + 26, { align: 'right' })

  // ============== RECIPIENT BLOCK ==============

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_500)
  doc.text('TO', MARGIN, y); y += 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_950)
  doc.text(data.recipientName || data.client?.name || '[Client Name]', MARGIN, y); y += 13

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...C_INK_700)
  if (data.client?.name && data.recipientName && data.recipientName !== data.client.name) {
    doc.text(data.client.name, MARGIN, y); y += 12
  }
  if (data.client?.address) {
    const lines = doc.splitTextToSize(data.client.address, PAGE_W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  if (data.client?.email) { doc.text(data.client.email, MARGIN, y); y += 12 }

  y += 14

  // ============== SUBJECT LINE ==============

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...C_INK_950)
  y = drawWrapped(doc, `Subject: ${letter.subject}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H, { bold: true })
  y += 6

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 18

  // ============== BODY ==============

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_700)
  for (const para of letter.paragraphs) {
    if (para === '') { y += 6; continue }
    y = drawWrapped(doc, para, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
    y += 6
  }

  // ============== INVOICE DETAILS BOX ==============

  y += 6
  y = ensureSpace(doc, y, 130)
  const boxX = MARGIN
  const boxW = PAGE_W - MARGIN * 2
  const boxH = data.includeInterest ? 120 : 90

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.6)
  doc.setFillColor(248, 247, 243)
  doc.roundedRect(boxX, y, boxW, boxH, 6, 6, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...accent)
  doc.text('OUTSTANDING INVOICE', boxX + 14, y + 18)

  const rows = [
    ['Invoice number', data.invoiceNumber || '—'],
    ['Invoice date',   formatDate(data.invoiceDate)],
    ['Due date',       formatDate(data.dueDate)],
    ['Days overdue',   String(letter.daysOverdue)],
    ['Amount due',     `${cur.code} ${formatNumber(Number(data.amount) || 0)}`],
  ]
  if (data.includeInterest) {
    rows.push(['Late-payment interest', `${cur.code} ${formatNumber(letter.interest)} (${Number(data.interestRate) || 0}% p.a.)`])
    rows.push(['TOTAL DUE',             `${cur.code} ${formatNumber((Number(data.amount) || 0) + letter.interest)}`])
  }

  let rowY = y + 34
  for (let i = 0; i < rows.length; i++) {
    const [k, v] = rows[i]
    const isTotal = k === 'TOTAL DUE'
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal')
    doc.setFontSize(isTotal ? 10 : 9.5)
    doc.setTextColor(...(isTotal ? accent : C_INK_500))
    doc.text(k, boxX + 14, rowY)
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal')
    doc.setTextColor(...(isTotal ? accent : C_INK_950))
    doc.text(v, boxX + boxW - 14, rowY, { align: 'right' })
    rowY += isTotal ? 14 : 11
  }

  y += boxH + 16

  // ============== PAYMENT INSTRUCTIONS ==============

  if (data.paymentInstructions) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...accent)
    doc.text('HOW TO PAY', MARGIN, y); y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_700)
    y = drawWrapped(doc, data.paymentInstructions, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
    y += 10
  }

  // ============== SIGN-OFF ==============

  y = ensureSpace(doc, y, 80)
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_700)
  doc.text(`${signOff.label},`, MARGIN, y); y += 36

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_950)
  doc.text(data.sender?.contactName || data.sender?.name || '[Your Name]', MARGIN, y); y += 13

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...C_INK_500)
  if (data.sender?.contactTitle) { doc.text(data.sender.contactTitle, MARGIN, y); y += 11 }
  if (data.sender?.name && data.sender?.contactName) { doc.text(data.sender.name, MARGIN, y); y += 11 }

  addPageFooters(doc, data, letter.stage.tag)

  const fileName = `payment-reminder-${(data.invoiceNumber || 'INV').replace(/[^a-z0-9-]+/gi, '-')}-${letter.stage.id}.pdf`
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

function addPageFooters(doc, data, tag) {
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
    const left = data.invoiceNumber ? `${tag} · ${data.invoiceNumber}` : tag
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
