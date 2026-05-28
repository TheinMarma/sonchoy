import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber,
  computeGL, describePeriod, accountTypeMeta,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generateGLReportPdf(data) → triggers a download                    */
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

export function generateGLReportPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const t = computeGL(data)
  const cur = findCurrency(data.currency)
  const period = describePeriod(data)

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_ACCOUNT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('GENERAL LEDGER', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`${t.countEntries} entries  ·  ${cur.code}`, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.companyName || 'Your Company', MARGIN, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  doc.text(`Period: ${period || '—'}`, MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 24

  // ============== TOP STATS STRIP ==============

  const ratios = [
    { label: 'Total Debits',  value: formatNumber(t.totalDebits) },
    { label: 'Total Credits', value: formatNumber(t.totalCredits) },
    { label: 'Accounts',      value: String(t.countAccounts) },
    { label: 'Status',        value: t.isBalanced ? '✓ BALANCED' : 'OUT OF BAL.', accent: t.isBalanced ? 'pos' : 'neg' },
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
    doc.setFontSize(11)
    if (r.accent === 'pos') doc.setTextColor(...C_SUCCESS)
    else if (r.accent === 'neg') doc.setTextColor(...C_DANGER)
    else doc.setTextColor(...C_INK_950)
    doc.text(String(r.value), x + ratioW / 2, y + 34, { align: 'center' })
  })

  y += 58

  // ============== JOURNAL ENTRIES TABLE ==============

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('JOURNAL ENTRIES', MARGIN, y)
  y += 10

  const tableX = MARGIN
  const tableW = stripW

  // Columns: # | Date | Ref | Account | Description | Debit | Credit
  const cols = {
    n:        { x: tableX, w: 24,  align: 'left'  },
    date:     { x: 0,      w: 60,  align: 'left'  },
    ref:      { x: 0,      w: 50,  align: 'left'  },
    account:  { x: 0,      w: 110, align: 'left'  },
    desc:     { x: 0,      w: 0,   align: 'left'  },
    debit:    { x: 0,      w: 60,  align: 'right' },
    credit:   { x: 0,      w: 60,  align: 'right' },
  }
  let used = 0
  for (const k of Object.keys(cols)) {
    if (k !== 'desc') used += cols[k].w
  }
  cols.desc.w = tableW - used

  let cx = tableX
  for (const k of ['n', 'date', 'ref', 'account', 'desc', 'debit', 'credit']) {
    cols[k].x = cx
    cx += cols[k].w
  }

  // Header
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_ACCOUNT)
  const headers = { n: '#', date: 'DATE', ref: 'REF', account: 'ACCOUNT', desc: 'DESCRIPTION', debit: 'DEBIT', credit: 'CREDIT' }
  for (const k of Object.keys(cols)) {
    const c = cols[k]
    const tx = c.align === 'right' ? c.x + c.w - 4 : c.x + 4
    doc.text(headers[k], tx, y + 14, { align: c.align })
  }
  y += 22

  // Body rows — sort chronologically
  const sortedEntries = [...t.entries].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const rowH = 20

  for (let i = 0; i < sortedEntries.length; i++) {
    if (y + rowH > PAGE_H - MARGIN - 160) {
      doc.addPage()
      y = MARGIN
    }
    const e = sortedEntries[i]
    const isEven = i % 2 === 0
    if (isEven) {
      doc.setFillColor(248, 247, 244)
      doc.rect(tableX, y, tableW, rowH, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_500)
    doc.text(String(i + 1).padStart(2, '0'), cols.n.x + 4, y + 13)

    doc.setTextColor(...C_INK_700)
    doc.text(e.date || '—', cols.date.x + 4, y + 13)

    doc.setFont('helvetica', 'normal')
    doc.text(truncate(doc, e.reference || '—', cols.ref.w - 6), cols.ref.x + 4, y + 13)

    doc.setTextColor(...C_INK_950)
    doc.setFont('helvetica', 'bold')
    doc.text(truncate(doc, e.account || '—', cols.account.w - 6), cols.account.x + 4, y + 13)
    doc.setFont('helvetica', 'normal')

    doc.setTextColor(...C_INK_700)
    doc.text(truncate(doc, e.description || '', cols.desc.w - 6), cols.desc.x + 4, y + 13)

    const dr = Number(e.debit) || 0
    const cr = Number(e.credit) || 0
    doc.setFont('helvetica', dr > 0 ? 'bold' : 'normal')
    doc.setTextColor(...(dr > 0 ? C_INK_950 : C_INK_500))
    doc.text(dr > 0 ? formatNumber(dr) : '—', cols.debit.x + cols.debit.w - 4, y + 13, { align: 'right' })

    doc.setFont('helvetica', cr > 0 ? 'bold' : 'normal')
    doc.setTextColor(...(cr > 0 ? C_INK_950 : C_INK_500))
    doc.text(cr > 0 ? formatNumber(cr) : '—', cols.credit.x + cols.credit.w - 4, y + 13, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.3)
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH)

    y += rowH
  }

  // Totals row
  doc.setFillColor(...C_INK_950)
  doc.rect(tableX, y, tableW, 30, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C_ACCOUNT)
  doc.text('JOURNAL TOTALS', tableX + 12, y + 19)

  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(formatNumber(t.totalDebits), cols.debit.x + cols.debit.w - 4, y + 19, { align: 'right' })
  doc.text(formatNumber(t.totalCredits), cols.credit.x + cols.credit.w - 4, y + 19, { align: 'right' })
  y += 36

  // Balance check banner
  if (t.isBalanced) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_SUCCESS)
    doc.text(`✓ Debits = Credits = ${cur.code} ${formatNumber(t.totalDebits)} — journal balances.`, tableX, y)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_DANGER)
    doc.text(`⚠ Out of balance by ${cur.code} ${formatNumber(Math.abs(t.balanceDiff))} — check the entries.`, tableX, y)
  }
  y += 16

  // ============== TRIAL BALANCE ==============

  // Page break if needed
  if (y + 180 > PAGE_H - MARGIN) {
    doc.addPage()
    y = MARGIN
  }

  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('TRIAL BALANCE — CLOSING BALANCES BY ACCOUNT', MARGIN, y)
  y += 10

  const tbCols = {
    account: { x: tableX,            w: 200, align: 'left'  },
    type:    { x: 0,                 w: 90,  align: 'left'  },
    opening: { x: 0,                 w: 70,  align: 'right' },
    debits:  { x: 0,                 w: 70,  align: 'right' },
    credits: { x: 0,                 w: 70,  align: 'right' },
    closing: { x: 0,                 w: 0,   align: 'right' },
  }
  let tbUsed = 0
  for (const k of Object.keys(tbCols)) {
    if (k !== 'closing') tbUsed += tbCols[k].w
  }
  tbCols.closing.w = tableW - tbUsed

  let tbCx = tableX
  for (const k of ['account', 'type', 'opening', 'debits', 'credits', 'closing']) {
    tbCols[k].x = tbCx
    tbCx += tbCols[k].w
  }

  doc.setFillColor(245, 244, 241)
  doc.rect(tableX, y, tableW, 18, 'F')
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.rect(tableX, y, tableW, 18, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_700)
  const tbHeaders = {
    account: 'ACCOUNT', type: 'TYPE', opening: 'OPENING',
    debits: 'DEBITS', credits: 'CREDITS', closing: 'CLOSING',
  }
  for (const k of Object.keys(tbCols)) {
    const c = tbCols[k]
    const tx = c.align === 'right' ? c.x + c.w - 4 : c.x + 4
    doc.text(tbHeaders[k], tx, y + 12, { align: c.align })
  }
  y += 18

  for (let i = 0; i < t.perAccount.length; i++) {
    if (y + 18 > PAGE_H - MARGIN - 100) {
      doc.addPage()
      y = MARGIN
    }
    const a = t.perAccount[i]
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 247, i % 2 === 0 ? 255 : 244)
    if (i % 2 !== 0) doc.rect(tableX, y, tableW, 18, 'F')
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.3)
    doc.line(tableX, y + 18, tableX + tableW, y + 18)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C_INK_950)
    doc.text(truncate(doc, a.name, tbCols.account.w - 6), tbCols.account.x + 4, y + 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...C_INK_500)
    doc.text(a.typeMeta.label, tbCols.type.x + 4, y + 12)

    doc.setFontSize(9)
    doc.setTextColor(...C_INK_700)
    doc.text(formatNumber(a.opening), tbCols.opening.x + tbCols.opening.w - 4, y + 12, { align: 'right' })
    doc.text(a.debits > 0 ? formatNumber(a.debits) : '—', tbCols.debits.x + tbCols.debits.w - 4, y + 12, { align: 'right' })
    doc.text(a.credits > 0 ? formatNumber(a.credits) : '—', tbCols.credits.x + tbCols.credits.w - 4, y + 12, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C_INK_950)
    doc.text(formatNumber(a.closing), tbCols.closing.x + tbCols.closing.w - 4, y + 12, { align: 'right' })

    y += 18
  }

  // Trial balance check
  y += 4
  if (t.tbBalanced) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_SUCCESS)
    doc.text(`✓ Trial balance: debit-side ${formatNumber(t.tbDebit)} = credit-side ${formatNumber(t.tbCredit)}.`, tableX, y)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_DANGER)
    doc.text(`⚠ Trial balance out by ${cur.code} ${formatNumber(Math.abs(t.tbDiff))}.`, tableX, y)
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

  const fileName = `${(data.companyName || 'general-ledger').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-gl.pdf`
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
