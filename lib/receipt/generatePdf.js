import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findPaymentMethod, findReceiptType,
  computeReceipt,
} from './compute'

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_BIZ     = [52, 208, 188]   // emerald-teal
const C_BIZ_DK  = [21, 128, 113]
const C_SUCCESS = [22, 163, 74]

const BODY = 10

/** Convert a number to words for the amount-in-words line (English, basic). */
function numberToWords(n) {
  const num = Math.floor(Math.abs(Number(n) || 0))
  if (num === 0) return 'Zero'
  const ones = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
                'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  const groupName = ['', 'Thousand', 'Million', 'Billion']

  const sub1000 = (k) => {
    let s = ''
    if (k >= 100) { s += ones[Math.floor(k / 100)] + ' Hundred '; k = k % 100 }
    if (k >= 20) { s += tens[Math.floor(k / 10)] + (k % 10 ? '-' + ones[k % 10] : '') }
    else if (k > 0) { s += ones[k] }
    return s.trim()
  }

  let value = num
  const parts = []
  let g = 0
  while (value > 0) {
    const chunk = value % 1000
    if (chunk > 0) parts.unshift(sub1000(chunk) + (groupName[g] ? ' ' + groupName[g] : ''))
    value = Math.floor(value / 1000)
    g += 1
  }
  return parts.join(' ').trim()
}

export function generateReceiptPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const method = findPaymentMethod(data.paymentMethodId)
  const receiptType = findReceiptType(data.receiptTypeId)
  const totals = computeReceipt(data)

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_BIZ)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.from?.companyName || '[Your Business]', MARGIN, y + 18)
  y += 24

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.from?.address) {
    const lines = doc.splitTextToSize(data.from.address, PAGE_W / 2 - MARGIN)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  const contact = [data.from?.email, data.from?.phone].filter(Boolean).join('  ·  ')
  if (contact) { doc.text(contact, MARGIN, y); y += 12 }
  if (data.from?.taxId) { doc.text(`Tax ID: ${data.from.taxId}`, MARGIN, y); y += 12 }

  // Right: RECEIPT block
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('RECEIPT', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 40
  if (data.receiptNumber) { doc.text(`Receipt #: ${data.receiptNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.receiptDate)   { doc.text(`Date: ${formatDate(data.receiptDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.invoiceReference) { doc.text(`For invoice: ${data.invoiceReference}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(receiptType.label, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12

  // PAID badge if fully settled
  if (totals.fullySettled || (totals.outstandingBefore === 0 && totals.amount > 0)) {
    doc.setFillColor(...C_SUCCESS)
    const tagText = totals.fullySettled ? 'PAID IN FULL' : 'PAID'
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    const tagW = doc.getTextWidth(tagText) + 16
    doc.roundedRect(PAGE_W - MARGIN - tagW, ry + 4, tagW, 20, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(tagText, PAGE_W - MARGIN - tagW / 2, ry + 18, { align: 'center' })
    ry += 28
  }

  y = Math.max(y, ry + 16)

  doc.setDrawColor(...C_BIZ); doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 22

  /* RECEIVED FROM block */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('RECEIVED FROM', MARGIN, y); y += 14

  doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.setTextColor(...C_INK_950)
  doc.text(data.to?.name || '[Customer / Payer Name]', MARGIN, y); y += 16

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
  doc.setTextColor(...C_INK_700)
  if (data.to?.address) {
    const lines = doc.splitTextToSize(data.to.address, PAGE_W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  if (data.to?.email)        { doc.text(data.to.email, MARGIN, y); y += 12 }
  if (data.to?.phone)        { doc.text(data.to.phone, MARGIN, y); y += 12 }
  if (data.to?.taxId)        { doc.text(`Tax ID: ${data.to.taxId}`, MARGIN, y); y += 12 }
  y += 16

  /* AMOUNT BLOCK — the centrepiece */
  const ampX = MARGIN
  const ampW = PAGE_W - MARGIN * 2
  const ampH = totals.tax > 0 || (data.includeOutstanding && totals.outstandingBefore > 0) ? 100 : 76

  doc.setFillColor(244, 252, 248); doc.setDrawColor(...C_BIZ); doc.setLineWidth(0.8)
  doc.roundedRect(ampX, y, ampW, ampH, 6, 6, 'FD')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('AMOUNT RECEIVED', ampX + 16, y + 18)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(28)
  doc.setTextColor(...C_INK_950)
  doc.text(`${cur.code} ${formatNumber(totals.totalReceived)}`, ampX + ampW - 16, y + 36, { align: 'right' })

  doc.setFont('helvetica', 'italic'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const words = numberToWords(totals.totalReceived)
  doc.text(`${cur.code} ${words} only`, ampX + 16, y + 56)

  // Tax breakdown / outstanding sub-row
  if (totals.tax > 0 || (data.includeOutstanding && totals.outstandingBefore > 0)) {
    const subY = y + 76
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.4)
    doc.line(ampX + 16, subY - 4, ampX + ampW - 16, subY - 4)

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    let xCursor = ampX + 16
    if (totals.tax > 0) {
      doc.text(`Net amount: ${cur.code} ${formatNumber(totals.amount)}`, xCursor, subY + 10)
      xCursor += 180
      doc.text(`Tax (${formatNumber(Number(data.taxRatePct) || 0)}%): ${cur.code} ${formatNumber(totals.tax)}`, xCursor, subY + 10)
    }
    if (data.includeOutstanding && totals.outstandingBefore > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(totals.outstandingAfter > 0 ? C_BIZ_DK : C_SUCCESS))
      const balanceText = totals.outstandingAfter > 0
        ? `Balance remaining: ${cur.code} ${formatNumber(totals.outstandingAfter)}`
        : `Balance: paid in full`
      doc.text(balanceText, ampX + ampW - 16, subY + 10, { align: 'right' })
    }
  }
  y += ampH + 22

  /* PAYMENT DETAILS BLOCK */
  if (data.includePaymentDetails) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('PAYMENT DETAILS', MARGIN, y); y += 14

    const cL = MARGIN
    const cR = PAGE_W - MARGIN
    const labelClass = (lbl, val) => {
      if (!val) return
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...C_INK_500); doc.text(lbl, cL, y + 10)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_INK_950)
      doc.text(val, cR, y + 10, { align: 'right' })
      y += 14
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    }

    labelClass('Payment method', method.label)
    if (data.transactionId)   labelClass('Transaction reference', data.transactionId)
    if (data.bankName)        labelClass('Bank / channel', data.bankName)
    if (data.chequeNumber)    labelClass('Cheque number', data.chequeNumber)
    if (data.invoiceReference) labelClass('Invoice reference', data.invoiceReference)
    if (data.poNumber)        labelClass('PO reference', data.poNumber)
    y += 12
  }

  /* PURPOSE / NOTES */
  if (data.notes || data.purpose) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('PURPOSE & NOTES', MARGIN, y); y += 14

    if (data.purpose) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY)
      doc.setTextColor(...C_INK_950)
      const purposeLines = doc.splitTextToSize(`Received towards: ${data.purpose}`, PAGE_W - MARGIN * 2)
      for (const line of purposeLines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
      y += 4
    }
    if (data.notes) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
      doc.setTextColor(...C_INK_700)
      const noteLines = doc.splitTextToSize(data.notes, PAGE_W - MARGIN * 2)
      for (const line of noteLines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
    }
    y += 12
  }

  /* SIGNATURE BLOCK */
  if (data.includeSignature) {
    y = ensureSpace(doc, y, 90)
    y += 8
    const halfW = (PAGE_W - MARGIN * 2 - 40) / 2
    const sBlockY = y

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('RECEIVED & ACKNOWLEDGED BY', MARGIN, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN, sBlockY + 44, MARGIN + halfW, sBlockY + 44)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature with stamp', MARGIN, sBlockY + 56)

    if (data.from?.signatoryName) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
      doc.setTextColor(...C_INK_950)
      doc.text(data.from.signatoryName, MARGIN, sBlockY + 70)
    }
    if (data.from?.signatoryTitle) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      doc.setTextColor(...C_INK_700)
      doc.text(data.from.signatoryTitle, MARGIN, sBlockY + 82)
    }

    // Right side - date acknowledgement
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('RECEIPT ISSUED', MARGIN + halfW + 40, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN + halfW + 40, sBlockY + 44, PAGE_W - MARGIN, sBlockY + 44)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.setTextColor(...C_INK_950)
    doc.text(formatDate(data.receiptDate) || '________________', MARGIN + halfW + 40, sBlockY + 38)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Date of receipt', MARGIN + halfW + 40, sBlockY + 56)

    y += 90
  }

  addPageFooters(doc, data, totals)

  const fileName = `receipt-${(data.receiptNumber || 'new').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 24) { doc.addPage(); return MARGIN }
  return y
}

function addPageFooters(doc, data, totals) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = `Receipt${data.receiptNumber ? ` · ${data.receiptNumber}` : ''}${data.receiptDate ? ` · ${data.receiptDate}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
