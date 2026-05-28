import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  computeExpenses, describePeriod, statusLabel,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generateExpenseTrackerPdf(data) → triggers a download              */
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

const STATUS_COLOR = {
  pending:    C_WARNING,
  submitted:  C_ACCOUNT,
  approved:   C_ACCOUNT,
  reimbursed: C_SUCCESS,
  rejected:   C_DANGER,
}

export function generateExpenseTrackerPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const t = computeExpenses(data)
  const cur = findCurrency(data.currency)
  const period = describePeriod(data)

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_ACCOUNT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('EXPENSE REPORT', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`${t.count} entries  ·  ${cur.code}`, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...C_INK_950)
  doc.text(data.ownerName || 'Expense Owner', MARGIN, y)
  y += 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  doc.text(data.companyName || '', MARGIN, y)
  y += 16

  doc.setFontSize(10)
  doc.text(`Period: ${period || '—'}`, MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 22

  // ============== TOP STATS STRIP ==============

  const ratios = [
    { label: 'Total',       value: `${cur.code} ${formatNumber(t.total)}` },
    { label: '# Expenses',  value: String(t.count) },
    { label: 'Average',     value: formatNumber(t.average) },
    { label: 'Reimbursable', value: formatNumber(t.reimbursableTotal) },
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
    doc.setTextColor(...C_INK_950)
    doc.text(String(r.value), x + ratioW / 2, y + 34, { align: 'center' })
  })

  y += 58

  // ============== EXPENSES TABLE ==============

  const tableX = MARGIN
  const tableW = PAGE_W - MARGIN * 2

  // Column layout
  const cols = {
    n:        { x: tableX,                          w: 24,  align: 'left'  },
    date:     { x: 0,                               w: 56,  align: 'left'  },
    vendor:   { x: 0,                               w: 110, align: 'left'  },
    desc:     { x: 0,                               w: 0,   align: 'left'  }, // fill
    category: { x: 0,                               w: 90,  align: 'left'  },
    status:   { x: 0,                               w: 56,  align: 'left'  },
    amount:   { x: 0,                               w: 64,  align: 'right' },
  }

  // Compute remaining for desc
  let used = 0
  for (const k of Object.keys(cols)) {
    if (k !== 'desc') used += cols[k].w
  }
  cols.desc.w = tableW - used

  // Lay x positions
  let cx = tableX
  for (const k of ['n', 'date', 'vendor', 'desc', 'category', 'status', 'amount']) {
    cols[k].x = cx
    cx += cols[k].w
  }

  // Header
  const headerH = 22
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, headerH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_ACCOUNT)
  const headerLabels = {
    n: '#', date: 'DATE', vendor: 'VENDOR', desc: 'DESCRIPTION',
    category: 'CATEGORY', status: 'STATUS', amount: 'AMOUNT',
  }
  for (const k of Object.keys(cols)) {
    const c = cols[k]
    const tx = c.align === 'right' ? c.x + c.w - 4 : c.x + 4
    doc.text(headerLabels[k], tx, y + 14, { align: c.align })
  }
  y += headerH

  // Rows
  const rowH = 22
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  for (let i = 0; i < (data.expenses || []).length; i++) {
    // Page-break check
    if (y + rowH > PAGE_H - MARGIN - 200) {
      doc.addPage()
      y = MARGIN
    }

    const e = data.expenses[i]
    const isEven = i % 2 === 0
    if (isEven) {
      doc.setFillColor(248, 247, 244)
      doc.rect(tableX, y, tableW, rowH, 'F')
    }

    // # column
    doc.setTextColor(...C_INK_500)
    doc.setFont('helvetica', 'normal')
    doc.text(String(i + 1).padStart(2, '0'), cols.n.x + 4, y + 14)

    // date
    doc.setTextColor(...C_INK_700)
    doc.text(e.date || '—', cols.date.x + 4, y + 14)

    // vendor
    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'bold')
    doc.text(truncate(doc, e.vendor || '—', cols.vendor.w - 6), cols.vendor.x + 4, y + 14)
    doc.setFont('helvetica', 'normal')

    // desc
    doc.setTextColor(...C_INK_700)
    doc.text(truncate(doc, e.description || '', cols.desc.w - 6), cols.desc.x + 4, y + 14)

    // category
    doc.setTextColor(...C_INK_500)
    doc.text(truncate(doc, e.category || '—', cols.category.w - 6), cols.category.x + 4, y + 14)

    // status (chip)
    const statusColor = STATUS_COLOR[e.status] || C_INK_500
    doc.setDrawColor(...statusColor)
    doc.setLineWidth(0.6)
    const chipW = 50
    const chipH = 12
    doc.roundedRect(cols.status.x + 2, y + 5, chipW, chipH, 2, 2, 'S')
    doc.setFontSize(7)
    doc.setTextColor(...statusColor)
    doc.text(statusLabel(e.status).toUpperCase(), cols.status.x + 2 + chipW / 2, y + 13, { align: 'center' })

    // amount
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(Number(e.amount) || 0), cols.amount.x + cols.amount.w - 4, y + 14, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    // border bottom
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
  doc.text('TOTAL', tableX + 12, y + 20)
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(`${cur.code} ${formatNumber(t.total)}`, tableX + tableW - 12, y + 20, { align: 'right' })
  y += 44

  // ============== BREAKDOWNS ==============

  // Page break if needed
  if (y + 200 > PAGE_H - MARGIN) {
    doc.addPage()
    y = MARGIN
  }

  const halfW = (tableW - 16) / 2

  // BY CATEGORY (left)
  drawBreakdown(doc, tableX, y, halfW, 'By category', t.byCategory.slice(0, 8), {
    showPct: true, total: t.total,
  })

  // BY STATUS (right)
  drawBreakdown(doc, tableX + halfW + 16, y, halfW, 'By status', t.byStatus.map((b) => ({
    label: statusLabel(b.label),
    amount: b.amount,
  })))

  y += 180 // approximate height

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

  // Signature line
  doc.setDrawColor(...C_INK_500)
  doc.setLineWidth(0.5)
  doc.line(PAGE_W - MARGIN - 140, footerY - 12, PAGE_W - MARGIN, footerY - 12)
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('Signature', PAGE_W - MARGIN, footerY - 2, { align: 'right' })

  doc.setFontSize(7)
  doc.text('Generated with Sonchoy · sonchoy.com', MARGIN, footerY - 2)

  // ============== SAVE ==============
  const fileName = `${(data.ownerName || 'expense-report').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-expenses.pdf`
  doc.save(fileName)
}

function drawBreakdown(doc, x, y, w, title, rows, opts = {}) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text(title.toUpperCase(), x, y + 10)
  let cy = y + 16

  if (!rows.length) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_500)
    doc.text('—', x, cy + 8)
    return
  }

  for (const row of rows) {
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.4)
    doc.rect(x, cy, w, 16, 'S')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_700)
    doc.text(truncate(doc, row.label || '—', w - 90), x + 6, cy + 11)

    if (opts.showPct) {
      const pct = opts.total ? ((row.amount / opts.total) * 100).toFixed(1) : '0.0'
      doc.setTextColor(...C_INK_500)
      doc.text(`${pct}%`, x + w - 56, cy + 11, { align: 'right' })
    }

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(row.amount), x + w - 4, cy + 11, { align: 'right' })

    cy += 16
  }
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
