import jsPDF from 'jspdf'
import {
  findScheme, findFiscalStart, findPad, findSeparator, findCase,
  buildInvoiceNumber, generateSeries, findDuplicates,
} from './compute'

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_INV     = [251, 191, 36]
const C_INV_DK  = [180, 110, 5]
const C_DANGER  = [220, 38, 38]

const BODY = 10

export function generateInvoiceNumberPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const scheme = findScheme(data.schemeId)
  const fiscal = findFiscalStart(data.fiscalStartId)
  const pad    = findPad(data.padId)
  const sep    = findSeparator(data.separatorId)
  const cs     = findCase(data.caseId)
  const count = Math.max(1, Math.min(100, Number(data.previewCount) || 12))
  const series = generateSeries(data, count)
  const usedList = (data.usedNumbersText || '')
    .split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
  const dupes = findDuplicates(series, usedList)
  const sample = buildInvoiceNumber(data, 0)

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_INV)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.businessName || '[Your business]', MARGIN, y + 18)
  y += 24

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.businessTaxId) { doc.text(`Tax ID: ${data.businessTaxId}`, MARGIN, y); y += 12 }
  if (data.preparedBy)    { doc.text(`Prepared by: ${data.preparedBy}`, MARGIN, y); y += 12 }

  // Right
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INV_DK)
  doc.text('INVOICE NUMBER SCHEME', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.schemeName)  { doc.text(`Name: ${data.schemeName}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(`Effective: ${data.issueDate || ''}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  doc.text(`Format: ${scheme.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12

  y = Math.max(y, ry + 14)

  doc.setDrawColor(...C_INV); doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 18

  /* SAMPLE HERO */
  y = ensureSpace(doc, y, 90)
  doc.setDrawColor(...C_INV); doc.setLineWidth(1.5)
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 80, 8, 8, 'S')
  doc.setFillColor(...C_INV)
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 22, 8, 8, 'F')
  doc.rect(MARGIN, y + 14, PAGE_W - MARGIN * 2, 8, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_INV_DK)
  doc.text('NEXT INVOICE NUMBER', MARGIN + 12, y + 14)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28)
  doc.setTextColor(...C_INK_950)
  doc.text(sample, MARGIN + 12, y + 60)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  doc.text(`starts at ${data.startNumber || 1}`, PAGE_W - MARGIN - 12, y + 60, { align: 'right' })
  y += 90

  /* FORMAT TABLE */
  y = ensureSpace(doc, y, 100)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(...C_INV_DK)
  doc.text('FORMAT CHOICES', MARGIN, y); y += 14

  const fmtRows = [
    ['Scheme',           `${scheme.label} — ${scheme.desc}`],
    ['Prefix',           data.prefix || '—'],
    ['Suffix',           data.suffix || '—'],
    ['Separator',        sep.label],
    ['Pad length',       pad.label],
    ['Case',             cs.label],
    ['Starts at',        String(data.startNumber || 1)],
  ]
  if (scheme.id === 'fiscal' || scheme.id === 'client') {
    fmtRows.push(['Fiscal year starts', fiscal.label])
  }
  if (scheme.id === 'client') {
    fmtRows.push(['Client code', data.clientCode || '—'])
  }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (const [k, v] of fmtRows) {
    y = ensureSpace(doc, y, 14)
    doc.setTextColor(...C_INK_500)
    doc.text(k, MARGIN, y + 10)
    doc.setTextColor(...C_INK_950)
    doc.text(String(v), MARGIN + 140, y + 10)
    y += 14
  }
  y += 8

  /* SERIES TABLE */
  y = ensureSpace(doc, y, 80)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(...C_INV_DK)
  doc.text(`SERIES PREVIEW (next ${series.length})`, MARGIN, y); y += 14

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const cN  = tX + 8
  const cNo = tX + 60

  doc.setFillColor(...C_INV); doc.rect(tX, y, tW, 20, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_INV_DK)
  doc.text('#',              cN, y + 13)
  doc.text('INVOICE NUMBER', cNo, y + 13)
  y += 20

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
  for (let i = 0; i < series.length; i++) {
    const s = series[i]
    const conflict = dupes.includes(s.number)
    y = ensureSpace(doc, y, 14)
    if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 14, 'F') }
    doc.setTextColor(...C_INK_500)
    doc.text(String(s.index), cN, y + 10)
    doc.setTextColor(...(conflict ? C_DANGER : C_INK_950))
    doc.setFont('helvetica', conflict ? 'bold' : 'normal')
    doc.text(s.number, cNo, y + 10)
    if (conflict) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8)
      doc.setTextColor(...C_DANGER)
      doc.text('CONFLICT', tX + tW - 8, y + 10, { align: 'right' })
      doc.setFontSize(BODY)
    }
    doc.setFont('helvetica', 'normal')
    y += 14
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.2); doc.line(tX, y, tX + tW, y)
  }
  y += 10

  /* DUPLICATE WARNING */
  if (dupes.length > 0) {
    y = ensureSpace(doc, y, 30)
    doc.setFillColor(254, 226, 226)
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 24, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_DANGER)
    doc.text(`⚠  ${dupes.length} number(s) conflict with the existing log`, MARGIN + 10, y + 15)
    y += 32
  }

  /* RULES */
  if (data.includeRulesBlock && data.rules) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_INV_DK)
    doc.text('INTERNAL NUMBERING RULES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.rules), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
    y += 8
  }

  /* AUDIT */
  if (data.includeAuditBlock) {
    y = ensureSpace(doc, y, 90)
    y += 6
    const halfW = (PAGE_W - MARGIN * 2 - 40) / 2
    const sBlockY = y

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INV_DK)
    doc.text('APPROVED BY (FINANCE)', MARGIN, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN, sBlockY + 40, MARGIN + halfW, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN, sBlockY + 52)

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_INV_DK)
    doc.text('LOGGED BY (PREPARER)', MARGIN + halfW + 40, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN + halfW + 40, sBlockY + 40, PAGE_W - MARGIN, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN + halfW + 40, sBlockY + 52)
    y += 80
  }

  addPageFooters(doc, data)

  const fileName = `invoice-numbering-${(data.schemeName || 'scheme').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 24) { doc.addPage(); return MARGIN }
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
    const left = `Invoice Numbering Scheme${data.schemeName ? ` · ${data.schemeName}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
