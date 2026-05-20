import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  computeAR, asOfLabel, statusLabel,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generateARReportPdf(data) → triggers a download                    */
/* ------------------------------------------------------------------ */

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ACCOUNT = [99, 102, 241]
const C_SUCCESS = [21, 128, 61]
const C_DANGER  = [185, 28, 28]
const C_WARNING = [217, 119, 6]

const BUCKET_COLOR = {
  current:   C_SUCCESS,
  '1-30':    C_WARNING,
  '31-60':   C_WARNING,
  '61-90':   C_DANGER,
  '90-plus': C_DANGER,
}

export function generateARReportPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const t = computeAR(data)
  const cur = findCurrency(data.currency)
  const dateLabel = asOfLabel(data)

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_ACCOUNT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('ACCOUNTS RECEIVABLE REPORT', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`${t.countOutstanding} open invoices  ·  ${cur.code}`, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.companyName || 'Your Company', MARGIN, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  doc.text(`As of: ${dateLabel || '—'}`, MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 24

  // ============== TOP STATS STRIP ==============

  const ratios = [
    { label: 'Receivable',  value: `${cur.code} ${formatNumber(t.totalOutstanding)}` },
    { label: 'Overdue',     value: formatNumber(t.totalOverdue),    accent: t.totalOverdue > 0 ? 'neg' : null },
    { label: 'DSO',         value: `${t.dso}d`,                     accent: t.dso > 30 ? 'neg' : (t.dso > 0 ? null : 'pos') },
    { label: 'Collection',  value: `${t.collectionRate}%`,          accent: t.collectionRate >= 80 ? 'pos' : 'neg' },
  ]

  const stripX = MARGIN
  const stripW = PAGE_W - MARGIN * 2
  const ratioW = stripW / ratios.length

  doc.setFillColor(248, 247, 244)
  doc.rect(stripX, y, stripW, 44, 'F')
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.rect(stripX, y, stripW, 44, 'S')

  ratios.forEach((r, i) => {
    const x = stripX + i * ratioW
    if (i > 0) {
      doc.setDrawColor(...C_LINE)
      doc.line(x, y + 8, x, y + 36)
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text(r.label.toUpperCase(), x + ratioW / 2, y + 16, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    if (r.accent === 'pos') doc.setTextColor(...C_SUCCESS)
    else if (r.accent === 'neg') doc.setTextColor(...C_DANGER)
    else doc.setTextColor(...C_INK_950)
    doc.text(String(r.value), x + ratioW / 2, y + 34, { align: 'center' })
  })

  y += 58

  // ============== AGEING BREAKDOWN ==============

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('AGEING BUCKETS', MARGIN, y)
  y += 10

  const bucketCount = t.ageing.length
  const bucketW = stripW / bucketCount
  doc.setFillColor(...C_INK_950)
  doc.rect(stripX, y, stripW, 50, 'F')

  t.ageing.forEach((b, i) => {
    const x = stripX + i * bucketW
    if (i > 0) {
      doc.setDrawColor(80, 80, 80)
      doc.line(x, y + 6, x, y + 44)
    }
    const color = BUCKET_COLOR[b.id] || [255, 255, 255]
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(180, 180, 180)
    doc.text(b.label.toUpperCase(), x + bucketW / 2, y + 14, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...color)
    doc.text(formatNumber(b.amount), x + bucketW / 2, y + 30, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`${b.count} · ${b.pct}%`, x + bucketW / 2, y + 42, { align: 'center' })
  })
  y += 66

  // ============== INVOICES TABLE ==============

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('OUTSTANDING INVOICES', MARGIN, y)
  y += 10

  const tableX = MARGIN
  const tableW = stripW

  const cols = {
    n:        { x: tableX, w: 24,  align: 'left'  },
    customer: { x: 0,      w: 140, align: 'left'  },
    inv:      { x: 0,      w: 90,  align: 'left'  },
    due:      { x: 0,      w: 56,  align: 'left'  },
    days:     { x: 0,      w: 44,  align: 'right' },
    status:   { x: 0,      w: 60,  align: 'left'  },
    amount:   { x: 0,      w: 0,   align: 'right' },
  }
  let used = 0
  for (const k of Object.keys(cols)) {
    if (k !== 'amount') used += cols[k].w
  }
  cols.amount.w = tableW - used

  let cx = tableX
  for (const k of ['n', 'customer', 'inv', 'due', 'days', 'status', 'amount']) {
    cols[k].x = cx
    cx += cols[k].w
  }

  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_ACCOUNT)
  const headers = { n: '#', customer: 'CUSTOMER', inv: 'INVOICE #', due: 'DUE', days: 'DAYS', status: 'STATUS', amount: 'AMOUNT' }
  for (const k of Object.keys(cols)) {
    const c = cols[k]
    const tx = c.align === 'right' ? c.x + c.w - 4 : c.x + 4
    doc.text(headers[k], tx, y + 14, { align: c.align })
  }
  y += 22

  const sortedInvoices = [...t.outstanding].sort((a, b) => b.daysOverdue - a.daysOverdue)
  const rowH = 22

  for (let i = 0; i < sortedInvoices.length; i++) {
    if (y + rowH > PAGE_H - MARGIN - 200) {
      doc.addPage()
      y = MARGIN
    }
    const iv = sortedInvoices[i]
    const isEven = i % 2 === 0
    if (isEven) {
      doc.setFillColor(248, 247, 244)
      doc.rect(tableX, y, tableW, rowH, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1).padStart(2, '0'), cols.n.x + 4, y + 14)

    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'bold')
    doc.text(truncate(doc, iv.customer || '—', cols.customer.w - 6), cols.customer.x + 4, y + 14)
    doc.setFont('helvetica', 'normal')

    doc.setTextColor(...C_INK_700)
    doc.text(truncate(doc, iv.invoiceNumber || '—', cols.inv.w - 6), cols.inv.x + 4, y + 14)
    doc.text(iv.dueDate || '—', cols.due.x + 4, y + 14)

    const days = iv.daysOverdue
    const daysColor = days <= 0 ? C_SUCCESS : (days <= 30 ? C_WARNING : C_DANGER)
    doc.setTextColor(...daysColor)
    doc.setFont('helvetica', 'bold')
    doc.text(days <= 0 ? `+${Math.abs(days)}d` : `${days}d`, cols.days.x + cols.days.w - 4, y + 14, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    const sLabel = statusLabel(iv.status).toUpperCase()
    doc.setDrawColor(...C_INK_500)
    doc.setLineWidth(0.5)
    doc.roundedRect(cols.status.x + 2, y + 5, cols.status.w - 4, 12, 2, 2, 'S')
    doc.setFontSize(7)
    doc.setTextColor(...C_INK_700)
    doc.text(sLabel, cols.status.x + cols.status.w / 2, y + 13, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(Number(iv.amount) || 0), cols.amount.x + cols.amount.w - 4, y + 14, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.3)
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH)

    y += rowH
  }

  // Total row
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 32, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C_ACCOUNT)
  doc.text('TOTAL RECEIVABLE', tableX + 12, y + 20)
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(`${cur.code} ${formatNumber(t.totalOutstanding)}`, tableX + tableW - 12, y + 20, { align: 'right' })
  y += 44

  // ============== TOP CUSTOMERS ==============

  if (t.byCustomer.length > 1 && y < PAGE_H - 180) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('TOP CUSTOMERS BY AMOUNT', MARGIN, y)
    y += 10

    const custW = stripW
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.setFillColor(245, 244, 241)
    doc.rect(tableX, y, custW, 16, 'F')
    doc.rect(tableX, y, custW, 16, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_700)
    doc.text('CUSTOMER',  tableX + 8, y + 11)
    doc.text('# INVOICES', tableX + custW - 200, y + 11)
    doc.text('% SHARE',    tableX + custW - 110, y + 11)
    doc.text('AMOUNT',     tableX + custW - 8,   y + 11, { align: 'right' })
    y += 16

    for (const c of t.byCustomer.slice(0, 6)) {
      doc.rect(tableX, y, custW, 16, 'S')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...C_INK_950)
      doc.text(truncate(doc, c.customer, 260), tableX + 8, y + 11)
      doc.setTextColor(...C_INK_500)
      doc.text(String(c.count), tableX + custW - 200, y + 11)
      doc.text(`${c.pct}%`, tableX + custW - 110, y + 11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(c.amount), tableX + custW - 8, y + 11, { align: 'right' })
      y += 16
    }
  }

  // ============== FOOTER ==============

  const footerY = PAGE_H - MARGIN
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, footerY - 30, PAGE_W - MARGIN, footerY - 30)

  if (data.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_700)
    const notes = doc.splitTextToSize(data.notes, tableW)
    doc.text(notes, MARGIN, footerY - 18)
  }

  doc.setFontSize(7)
  doc.setTextColor(...C_INK_500)
  doc.text('Generated with Sonchoy · sonchoy.com', PAGE_W - MARGIN, footerY - 6, { align: 'right' })

  const fileName = `${(data.companyName || 'accounts-receivable').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-ar-report.pdf`
  doc.save(fileName)
}

function truncate(doc, text, maxW) {
  const t = String(text || '')
  if (doc.getTextWidth(t) <= maxW) return t
  let cur = t
  while (cur.length > 0 && doc.getTextWidth(cur + '…') > maxW) {
    cur = cur.slice(0, -1)
  }
  return cur + '…'
}
