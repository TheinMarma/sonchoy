import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber,
  findLayout, findFont, findAccentStyle, findTableStyle, findDateFormat, findShowTaxOption,
  hexToRgb, isAccentDark,
  computeSampleTotals,
} from './compute'

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]

/**
 * Generates a sample invoice rendered with the chosen template style.
 * The template settings drive every visual choice — fonts, accent placement, table style.
 */
export function generateTemplateSamplePdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const layout = findLayout(data.layoutId)
  const font   = findFont(data.fontId)
  const accentStyle = findAccentStyle(data.accentStyleId)
  const tableStyle  = findTableStyle(data.tableStyleId)
  const dateFmt     = findDateFormat(data.dateFormatId)
  const showTax     = findShowTaxOption(data.showTaxId)
  const accent      = hexToRgb(data.accentColor)
  const accentDark  = isAccentDark(data.accentColor)
  const onAccent    = accentDark ? [255, 255, 255] : C_INK_950
  const totals      = computeSampleTotals(data)

  const setFont = (style = 'normal', size = 10) => {
    doc.setFont(font.id, style)
    doc.setFontSize(size)
  }

  let y = MARGIN

  /* ACCENT */
  if (accentStyle.id === 'stripe') {
    doc.setFillColor(...accent)
    doc.rect(0, 0, PAGE_W, 6, 'F')
  } else if (accentStyle.id === 'band') {
    doc.setFillColor(...accent)
    doc.rect(0, 0, PAGE_W, 64, 'F')
    y = 64 + 14
  }

  /* HEADER — layout-driven */
  if (layout.id === 'modern') {
    // Big INVOICE title up top
    setFont('bold', 36)
    doc.setTextColor(...(accentStyle.id === 'band' ? onAccent : accent))
    doc.text('INVOICE', MARGIN, y)
    y += 36

    setFont('bold', 14)
    doc.setTextColor(...(accentStyle.id === 'band' ? onAccent : C_INK_950))
    doc.text(data.business?.name || '[Your business]', MARGIN, y); y += 16

    setFont('normal', 9)
    doc.setTextColor(...(accentStyle.id === 'band' ? onAccent : C_INK_500))
    const contactLine = [data.business?.email, data.business?.phone].filter(Boolean).join('  ·  ')
    if (contactLine) { doc.text(contactLine, MARGIN, y); y += 12 }

    // Right meta block
    setFont('normal', 9)
    doc.setTextColor(...(accentStyle.id === 'band' ? onAccent : C_INK_500))
    let ry = MARGIN + 8
    if (data.sample?.invoiceNumber) { doc.text(`Invoice # ${data.sample.invoiceNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
    if (data.sample?.issueDate)     { doc.text(`Date: ${dateFmt.fmt(data.sample.issueDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
    if (data.sample?.dueDate)       { doc.text(`Due: ${dateFmt.fmt(data.sample.dueDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }) }
  } else {
    // classic / compact / bold — brand left, invoice block right
    setFont('bold', layout.id === 'compact' ? 18 : 22)
    doc.setTextColor(...(accentStyle.id === 'band' ? onAccent : C_INK_950))
    doc.text(data.business?.name || '[Your business]', MARGIN, y + 18)
    y += layout.id === 'compact' ? 22 : 26

    setFont('normal', 9)
    doc.setTextColor(...(accentStyle.id === 'band' ? onAccent : C_INK_500))
    if (data.business?.address) {
      const lines = doc.splitTextToSize(data.business.address, PAGE_W / 2 - MARGIN)
      for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
    }
    const contact = [data.business?.email, data.business?.phone, data.business?.website].filter(Boolean).join('  ·  ')
    if (contact) { doc.text(contact, MARGIN, y); y += 12 }

    // Right: INVOICE meta
    setFont('bold', layout.id === 'compact' ? 20 : 26)
    doc.setTextColor(...accent)
    doc.text('INVOICE', PAGE_W - MARGIN, MARGIN + 22, { align: 'right' })

    setFont('normal', 9)
    doc.setTextColor(...C_INK_500)
    let ry = MARGIN + 38
    if (data.sample?.invoiceNumber) { doc.text(`Invoice # ${data.sample.invoiceNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
    if (data.sample?.issueDate)     { doc.text(`Date: ${dateFmt.fmt(data.sample.issueDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
    if (data.sample?.dueDate)       { doc.text(`Due: ${dateFmt.fmt(data.sample.dueDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
    if (data.sample?.poRef)         { doc.text(`PO ref: ${data.sample.poRef}`, PAGE_W - MARGIN, ry, { align: 'right' }) }

    y = Math.max(y, MARGIN + 80)
  }

  y += 14

  // Bottom rule for 'rule' accent
  if (accentStyle.id === 'rule') {
    doc.setDrawColor(...accent); doc.setLineWidth(1)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 14
  }

  /* WATERMARK */
  if (data.includeWatermark && data.watermarkText) {
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.06 }))
    doc.setTextColor(...accent)
    setFont('bold', 90)
    doc.text(data.watermarkText.toUpperCase(), PAGE_W / 2, PAGE_H / 2, {
      align: 'center', angle: -30,
    })
    doc.restoreGraphicsState()
    setFont('normal', 10)
  }

  /* BILL TO */
  setFont('bold', 7.5)
  doc.setTextColor(...accent)
  doc.text('BILL TO', MARGIN, y); y += 12

  setFont('bold', 12)
  doc.setTextColor(...C_INK_950)
  doc.text(data.sample?.clientName || '[Client name]', MARGIN, y); y += 14

  setFont('normal', 9)
  doc.setTextColor(...C_INK_700)
  if (data.sample?.clientAddress) {
    const lines = doc.splitTextToSize(data.sample.clientAddress, PAGE_W - MARGIN * 2)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  if (data.sample?.clientEmail) { doc.text(data.sample.clientEmail, MARGIN, y); y += 12 }
  y += 6

  /* LINE ITEMS — table style controls borders/fill */
  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN    = tX + 6
  const cDesc = tX + 26
  const cQty  = tX + tW * 0.62
  const cRate = tX + tW * 0.74
  const cTax  = tX + tW * 0.86
  const cAmt  = tX + tW - 6

  // Header row
  if (tableStyle.id === 'filled') {
    doc.setFillColor(...accent); doc.rect(tX, y, tW, 22, 'F')
    setFont('bold', 8)
    doc.setTextColor(...onAccent)
  } else if (tableStyle.id === 'outlined') {
    doc.setDrawColor(...accent); doc.setLineWidth(0.7)
    doc.rect(tX, y, tW, 22, 'S')
    setFont('bold', 8)
    doc.setTextColor(...accent)
  } else {
    setFont('bold', 8)
    doc.setTextColor(...accent)
    doc.setDrawColor(...accent); doc.setLineWidth(0.7)
    doc.line(tX, y + 21, tX + tW, y + 21)
  }
  doc.text('#',           cN,    y + 14)
  doc.text('DESCRIPTION', cDesc, y + 14)
  doc.text('QTY',         cQty,  y + 14, { align: 'right' })
  doc.text('RATE',        cRate, y + 14, { align: 'right' })
  if (showTax.id === 'per_line' || showTax.id === 'both') {
    doc.text('TAX %', cTax, y + 14, { align: 'right' })
  }
  doc.text('AMOUNT', cAmt, y + 14, { align: 'right' })
  y += 22

  // Body rows
  setFont('normal', 10)
  for (let i = 0; i < totals.lines.length; i++) {
    const l = totals.lines[i]
    const rowH = 16
    if (tableStyle.id === 'filled' && i % 2 === 1) {
      doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, rowH, 'F')
    }
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1), cN, y + 11)
    doc.setTextColor(...C_INK_950)
    doc.text(String(l.description || '—'), cDesc, y + 11)
    doc.text(formatNumber(l.qty),  cQty,  y + 11, { align: 'right' })
    doc.text(formatNumber(l.rate), cRate, y + 11, { align: 'right' })
    if (showTax.id === 'per_line' || showTax.id === 'both') {
      doc.setTextColor(...C_INK_700)
      doc.text(l.taxPct > 0 ? `${formatNumber(l.taxPct)}%` : '—', cTax, y + 11, { align: 'right' })
      doc.setTextColor(...C_INK_950)
    }
    setFont('bold', 10)
    doc.text(formatNumber(l.total), cAmt, y + 11, { align: 'right' })
    setFont('normal', 10)
    y += rowH
    if (tableStyle.id === 'outlined' || tableStyle.id === 'minimal') {
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
  }

  y += 10

  /* TOTALS */
  const tx1 = PAGE_W - MARGIN - 220
  const tx2 = PAGE_W - MARGIN - 8
  const drawTotalRow = (label, val, opts = {}) => {
    setFont(opts.bold ? 'bold' : 'normal', opts.large ? 12 : 10)
    doc.setTextColor(...(opts.accent ? accent : C_INK_500))
    doc.text(label, tx1, y + 10)
    doc.setTextColor(...(opts.accent ? accent : C_INK_950))
    doc.text(`${cur.code} ${formatNumber(val)}`, tx2, y + 10, { align: 'right' })
    y += opts.large ? 18 : 14
  }
  drawTotalRow('Subtotal', totals.subtotal)
  if ((showTax.id === 'summary' || showTax.id === 'both') && totals.totalTax > 0) {
    drawTotalRow('Tax', totals.totalTax)
  }
  y += 4
  doc.setDrawColor(...accent); doc.setLineWidth(1)
  doc.line(tx1, y, tx2, y); y += 4
  drawTotalRow('TOTAL', totals.grandTotal, { bold: true, large: true, accent: true })
  y += 14

  /* PAYMENT */
  if (data.includePaymentBlock && data.payment) {
    setFont('bold', 9)
    doc.setTextColor(...accent)
    doc.text('HOW TO PAY', MARGIN, y); y += 12
    setFont('normal', 10)
    doc.setTextColor(...C_INK_700)
    const payRows = [
      ['Bank',         data.payment.bankName],
      ['Account name', data.payment.accountName],
      ['Account no.',  data.payment.accountNumber],
      ['IFSC / SWIFT', data.payment.ifsc],
    ]
    for (const [k, v] of payRows) {
      if (!v) continue
      doc.setTextColor(...C_INK_500); doc.text(k, MARGIN, y)
      doc.setTextColor(...C_INK_950); doc.text(String(v), MARGIN + 110, y); y += 13
    }
    y += 6
  }

  /* FOOTER */
  if (data.includeFooter) {
    const footerY = PAGE_H - 24
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 6, PAGE_W - MARGIN, footerY - 6)
    setFont('normal', 7)
    doc.setTextColor(...C_INK_500)
    const leftFooter = data.footerLeft || ''
    const rightFooter = data.footerRight || 'Page 1 of 1'
    if (leftFooter)  doc.text(leftFooter,  MARGIN, footerY + 4)
    if (rightFooter) doc.text(rightFooter, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }

  const fileName = `invoice-template-${(data.templateName || 'sample').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

/* Helper for the page panel to download a JSON template file the
   user can re-import into other invoice generators later. */
export function downloadTemplateJson(data) {
  const blob = new Blob([JSON.stringify(stripFunctions(data), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice-template-${(data.templateName || 'template').replace(/[^a-z0-9-]+/gi, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function stripFunctions(obj) {
  if (obj == null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(stripFunctions)
  const out = {}
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'function') continue
    out[k] = stripFunctions(obj[k])
  }
  return out
}
