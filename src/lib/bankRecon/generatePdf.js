import jsPDF from 'jspdf'
import { findCurrency, formatNumber, computeRecon, asOfLabel } from './compute'

/* ------------------------------------------------------------------ */
/*  generateBankReconPdf(data) → triggers a download                   */
/* ------------------------------------------------------------------ */

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_TAX     = [132, 204, 22]
const C_SUCCESS = [21, 128, 61]
const C_DANGER  = [185, 28, 28]

export function generateBankReconPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const t = computeRecon(data)
  const cur = findCurrency(data.currency)
  const dateLabel = asOfLabel(data)

  let y = MARGIN

  // ============== HEADER STRIP ==============

  doc.setFillColor(...C_INK_950)
  doc.rect(0, 0, PAGE_W, 32, 'F')
  doc.setTextColor(...C_TAX)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('BANK RECONCILIATION', MARGIN, 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`${data.accountName || 'Bank account'}  ·  ${cur.code}`, PAGE_W - MARGIN, 20, { align: 'right' })

  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.companyName || 'Your Company', MARGIN, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C_INK_500)
  const subLine = []
  if (data.accountName)   subLine.push(data.accountName)
  if (data.accountNumber) subLine.push(`#${data.accountNumber}`)
  if (dateLabel)          subLine.push(`As of: ${dateLabel}`)
  if (subLine.length) doc.text(subLine.join('  ·  '), MARGIN, y)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 24

  // ============== TOP STATS STRIP ==============

  const ratios = [
    { label: 'Statement bal.', value: formatNumber(t.statementBalance) },
    { label: 'Book bal.',      value: formatNumber(t.bookBalance) },
    { label: 'Adjusted',       value: formatNumber(t.adjustedBankBalance) },
    {
      label: 'Status',
      value: t.isReconciled ? '✓ RECONCILED' : 'OUT BY ' + formatNumber(Math.abs(t.difference)),
      accent: t.isReconciled ? 'pos' : 'neg',
    },
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

  // ============== TWO-COLUMN RECONCILIATION ==============
  // Left column: Bank side. Right column: Book side.

  const colGap = 16
  const colW = (stripW - colGap) / 2
  const leftX = stripX
  const rightX = stripX + colW + colGap

  // Compute heights needed — render side by side, track max y
  let bankY = y
  let bookY = y

  // === BANK SIDE ===
  bankY = drawColHeader(doc, leftX, bankY, colW, 'PER BANK STATEMENT')
  bankY = drawAmountLine(doc, leftX, bankY, colW, 'Statement balance', t.statementBalance, { bold: true })
  bankY += 4

  // Deposits in transit
  if ((data.depositsInTransit || []).length > 0) {
    bankY = drawSubHeader(doc, leftX, bankY, colW, 'Add: Deposits in transit')
    for (const it of data.depositsInTransit) {
      bankY = drawItemLine(doc, leftX, bankY, colW, it.description || '—', Number(it.amount) || 0, false)
    }
    bankY = drawSubtotalLine(doc, leftX, bankY, colW, 'Total deposits in transit', t.totalDIT, '+')
    bankY += 4
  }

  // Outstanding checks
  if ((data.outstandingChecks || []).length > 0) {
    bankY = drawSubHeader(doc, leftX, bankY, colW, 'Less: Outstanding checks')
    for (const ck of data.outstandingChecks) {
      const label = ck.checkNumber
        ? `#${ck.checkNumber} · ${ck.payee || '—'}`
        : (ck.payee || ck.description || '—')
      bankY = drawItemLine(doc, leftX, bankY, colW, label, Number(ck.amount) || 0, true)
    }
    bankY = drawSubtotalLine(doc, leftX, bankY, colW, 'Total outstanding', t.totalOutstanding, '−')
    bankY += 4
  }

  // Bank adjustments
  if ((data.bankAdjustments || []).length > 0) {
    bankY = drawSubHeader(doc, leftX, bankY, colW, 'Bank adjustments')
    for (const it of data.bankAdjustments) {
      const v = Number(it.amount) || 0
      bankY = drawItemLine(doc, leftX, bankY, colW, it.description || '—', Math.abs(v), v < 0)
    }
    bankY = drawSubtotalLine(doc, leftX, bankY, colW, 'Net bank adjustments', t.totalBankAdj, t.totalBankAdj < 0 ? '−' : '+')
    bankY += 4
  }

  bankY = drawBigSubtotal(doc, leftX, bankY, colW, 'Adjusted bank balance', t.adjustedBankBalance)

  // === BOOK SIDE ===
  bookY = drawColHeader(doc, rightX, bookY, colW, 'PER BOOKS / LEDGER')
  bookY = drawAmountLine(doc, rightX, bookY, colW, 'Book balance', t.bookBalance, { bold: true })
  bookY += 4

  // Interest earned
  if ((data.interestEarned || []).length > 0) {
    bookY = drawSubHeader(doc, rightX, bookY, colW, 'Add: Interest / credits not booked')
    for (const it of data.interestEarned) {
      bookY = drawItemLine(doc, rightX, bookY, colW, it.description || '—', Number(it.amount) || 0, false)
    }
    bookY = drawSubtotalLine(doc, rightX, bookY, colW, 'Total interest / credits', t.totalInterest, '+')
    bookY += 4
  }

  // Bank charges
  if ((data.bankCharges || []).length > 0) {
    bookY = drawSubHeader(doc, rightX, bookY, colW, 'Less: Bank charges')
    for (const it of data.bankCharges) {
      bookY = drawItemLine(doc, rightX, bookY, colW, it.description || '—', Number(it.amount) || 0, true)
    }
    bookY = drawSubtotalLine(doc, rightX, bookY, colW, 'Total bank charges', t.totalCharges, '−')
    bookY += 4
  }

  // NSF checks
  if ((data.nsfChecks || []).length > 0) {
    bookY = drawSubHeader(doc, rightX, bookY, colW, 'Less: NSF / returned checks')
    for (const ck of data.nsfChecks) {
      const label = ck.checkNumber
        ? `#${ck.checkNumber} · ${ck.payer || '—'}`
        : (ck.payer || ck.description || '—')
      bookY = drawItemLine(doc, rightX, bookY, colW, label, Number(ck.amount) || 0, true)
    }
    bookY = drawSubtotalLine(doc, rightX, bookY, colW, 'Total NSF', t.totalNSF, '−')
    bookY += 4
  }

  // Book adjustments
  if ((data.bookAdjustments || []).length > 0) {
    bookY = drawSubHeader(doc, rightX, bookY, colW, 'Book adjustments / errors')
    for (const it of data.bookAdjustments) {
      const v = Number(it.amount) || 0
      bookY = drawItemLine(doc, rightX, bookY, colW, it.description || '—', Math.abs(v), v < 0)
    }
    bookY = drawSubtotalLine(doc, rightX, bookY, colW, 'Net book adjustments', t.totalBookAdj, t.totalBookAdj < 0 ? '−' : '+')
    bookY += 4
  }

  bookY = drawBigSubtotal(doc, rightX, bookY, colW, 'Adjusted book balance', t.adjustedBookBalance)

  y = Math.max(bankY, bookY) + 12

  // ============== RECONCILIATION CHECK ==============

  if (y + 60 > PAGE_H - MARGIN) {
    doc.addPage()
    y = MARGIN
  }

  doc.setFillColor(...C_INK_950)
  doc.rect(stripX, y, stripW, 50, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(t.isReconciled ? C_TAX[0] : C_DANGER[0], t.isReconciled ? C_TAX[1] : C_DANGER[1], t.isReconciled ? C_TAX[2] : C_DANGER[2])
  doc.text(t.isReconciled ? '✓ RECONCILED' : '⚠ OUT OF BALANCE', stripX + 16, y + 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 200, 195)
  if (t.isReconciled) {
    doc.text(`Adjusted bank = Adjusted book = ${cur.code} ${formatNumber(t.adjustedBankBalance)}`, stripX + 16, y + 38)
  } else {
    doc.text(`Adjusted bank ${formatNumber(t.adjustedBankBalance)}  vs  Adjusted book ${formatNumber(t.adjustedBookBalance)}`, stripX + 16, y + 38)
  }

  if (!t.isReconciled) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...C_DANGER)
    const diffStr = t.difference < 0 ? `(${formatNumber(Math.abs(t.difference))})` : formatNumber(t.difference)
    doc.text(`${cur.code} ${diffStr}`, stripX + stripW - 16, y + 30, { align: 'right' })
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...C_TAX)
    doc.text('0.00', stripX + stripW - 16, y + 30, { align: 'right' })
  }
  y += 64

  // ============== ITEM COUNTS ==============

  if (y + 60 < PAGE_H - MARGIN) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text('RECONCILING ITEMS SUMMARY', stripX, y)
    y += 10

    const items = [
      ['Deposits in transit',    t.countDIT,         t.totalDIT,         '+'],
      ['Outstanding checks',     t.countOutstanding, t.totalOutstanding, '−'],
      ['Interest / credits',     t.countInterest,    t.totalInterest,    '+'],
      ['Bank charges',           t.countCharges,     t.totalCharges,     '−'],
      ['NSF / returned',         t.countNSF,         t.totalNSF,         '−'],
    ].filter((r) => r[1] > 0)

    if (items.length > 0) {
      doc.setFillColor(245, 244, 241)
      doc.rect(stripX, y, stripW, 16, 'F')
      doc.setDrawColor(...C_LINE)
      doc.rect(stripX, y, stripW, 16, 'S')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...C_INK_700)
      doc.text('ITEM',    stripX + 8,             y + 11)
      doc.text('# ITEMS', stripX + stripW - 160,  y + 11)
      doc.text('IMPACT',  stripX + stripW - 80,   y + 11)
      doc.text('TOTAL',   stripX + stripW - 8,    y + 11, { align: 'right' })
      y += 16

      for (const [label, count, total, sign] of items) {
        doc.rect(stripX, y, stripW, 16, 'S')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...C_INK_950)
        doc.text(label, stripX + 8, y + 11)
        doc.setTextColor(...C_INK_500)
        doc.text(String(count), stripX + stripW - 160, y + 11)
        doc.setTextColor(sign === '+' ? C_SUCCESS[0] : C_DANGER[0], sign === '+' ? C_SUCCESS[1] : C_DANGER[1], sign === '+' ? C_SUCCESS[2] : C_DANGER[2])
        doc.text(sign, stripX + stripW - 80, y + 11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...C_INK_950)
        doc.text(formatNumber(total), stripX + stripW - 8, y + 11, { align: 'right' })
        y += 16
      }
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
    const notes = doc.splitTextToSize(data.notes, stripW)
    doc.text(notes, MARGIN, footerY - 18)
  }

  doc.setFontSize(7)
  doc.setTextColor(...C_INK_500)
  doc.text('Generated with Sonchoy · sonchoy.com', PAGE_W - MARGIN, footerY - 6, { align: 'right' })

  const fileName = `${(data.companyName || 'bank-recon').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-recon.pdf`
  doc.save(fileName)
}

/* ---- drawing primitives ---- */

function drawColHeader(doc, x, y, w, label) {
  doc.setFillColor(...C_INK_950)
  doc.rect(x, y, w, 20, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C_TAX)
  doc.text(label, x + 8, y + 13)
  return y + 20
}

function drawAmountLine(doc, x, y, w, label, amount, opts = {}) {
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_950)
  doc.text(label, x + 6, y + 14)
  doc.text(formatNumber(amount), x + w - 6, y + 14, { align: 'right' })
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(x, y + 20, x + w, y + 20)
  return y + 20
}

function drawSubHeader(doc, x, y, w, label) {
  doc.setFillColor(248, 247, 244)
  doc.rect(x, y, w, 16, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text(label.toUpperCase(), x + 6, y + 11)
  return y + 16
}

function drawItemLine(doc, x, y, w, label, amount, isDeduction) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  doc.text(truncate(doc, String(label), w - 80), x + 14, y + 12)
  const sign = isDeduction ? '−' : ''
  doc.setTextColor(...(isDeduction ? C_DANGER : C_INK_950))
  doc.text(`${sign}${formatNumber(amount)}`, x + w - 6, y + 12, { align: 'right' })
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.3)
  doc.line(x, y + 16, x + w, y + 16)
  return y + 16
}

function drawSubtotalLine(doc, x, y, w, label, amount, sign = '+') {
  doc.setDrawColor(...C_INK_950)
  doc.setLineWidth(0.6)
  doc.line(x + w - 100, y + 1, x + w - 6, y + 1)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_950)
  doc.text(label, x + 14, y + 14)
  doc.setTextColor(sign === '+' ? C_SUCCESS[0] : C_DANGER[0], sign === '+' ? C_SUCCESS[1] : C_DANGER[1], sign === '+' ? C_SUCCESS[2] : C_DANGER[2])
  doc.text(`${sign}${formatNumber(amount)}`, x + w - 6, y + 14, { align: 'right' })
  return y + 20
}

function drawBigSubtotal(doc, x, y, w, label, amount) {
  doc.setFillColor(...C_INK_950)
  doc.rect(x, y, w, 28, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C_TAX)
  doc.text(label.toUpperCase(), x + 8, y + 17)
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(formatNumber(amount), x + w - 8, y + 17, { align: 'right' })
  return y + 32
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
