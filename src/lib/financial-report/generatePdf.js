import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findReportPeriod, findReportStatus, findAudience,
  computeTotals,
} from './compute'

const MARGIN = 40
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_BIZ     = [52, 208, 188]
const C_BIZ_DK  = [21, 128, 113]
const C_SUCCESS = [22, 163, 74]
const C_DANGER  = [220, 38, 38]

const BODY = 10

export function generateFinancialReportPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const period = findReportPeriod(data.periodId)
  const status = findReportStatus(data.statusId)
  const audience = findAudience(data.audienceId)
  const totals = computeTotals(data)

  let y = MARGIN

  // Top accent
  doc.setFillColor(...C_BIZ)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.company?.name || '[Your Company]', MARGIN, y + 18)
  y += 24

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  if (data.company?.address) {
    const lines = doc.splitTextToSize(data.company.address, PAGE_W / 2 - MARGIN)
    for (const ln of lines) { doc.text(ln, MARGIN, y); y += 12 }
  }
  const contact = [data.company?.email, data.company?.website].filter(Boolean).join('  ·  ')
  if (contact) { doc.text(contact, MARGIN, y); y += 12 }

  // Right
  const rightY = MARGIN
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.setTextColor(...C_BIZ_DK)
  doc.text('FINANCIAL REPORT', PAGE_W - MARGIN, rightY + 22, { align: 'right' })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  let ry = rightY + 38
  if (data.reportNumber) { doc.text(`Report #: ${data.reportNumber}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.reportTitle)  { doc.text(data.reportTitle, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  if (data.periodLabel)  { doc.text(`Period: ${data.periodLabel}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(`Frequency: ${period.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12
  if (data.preparedDate) { doc.text(`Prepared: ${formatDate(data.preparedDate)}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12 }
  doc.text(`Audience: ${audience.label}`, PAGE_W - MARGIN, ry, { align: 'right' }); ry += 12

  // Status badge
  const statusColors = {
    success: C_SUCCESS, info: [37, 99, 235], warning: [217, 119, 6], danger: C_DANGER, muted: C_INK_500,
  }
  const sColor = statusColors[status.tone] || C_INK_500
  doc.setFillColor(...sColor)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  const sLabel = status.label.toUpperCase()
  const sW = doc.getTextWidth(sLabel) + 16
  doc.roundedRect(PAGE_W - MARGIN - sW, ry, sW, 18, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(sLabel, PAGE_W - MARGIN - sW / 2, ry + 12, { align: 'center' })

  y = Math.max(y, ry + 30) + 6

  doc.setDrawColor(...C_BIZ); doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 18

  /* EXECUTIVE SUMMARY */
  if (data.executiveSummary) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('EXECUTIVE SUMMARY', MARGIN, y); y += 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
    doc.setTextColor(...C_INK_950)
    const lines = doc.splitTextToSize(String(data.executiveSummary), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 15); doc.text(line, MARGIN, y); y += 15 }
    y += 8
  }

  /* HEADLINE NUMBERS — 3-up grid */
  y = ensureSpace(doc, y, 100)
  const cards = [
    {
      label: 'REVENUE',
      value: totals.totalRevenueCurrent,
      delta: totals.revenueDelta,
      good: true,
    },
    {
      label: 'EXPENSES',
      value: totals.totalExpenseCurrent,
      delta: totals.expenseDelta,
      good: false,
    },
    {
      label: 'NET INCOME',
      value: totals.netIncomeCurrent,
      delta: totals.netDelta,
      good: true,
      accent: true,
    },
  ]
  const cardW = (PAGE_W - MARGIN * 2 - 16) / 3
  cards.forEach((c, i) => {
    const cx = MARGIN + i * (cardW + 8)
    if (c.accent) {
      doc.setFillColor(...C_BIZ); doc.roundedRect(cx, y, cardW, 86, 6, 6, 'F')
      doc.setTextColor(...C_BIZ_DK)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5)
      doc.text(c.label, cx + 12, y + 18)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
      doc.text(`${cur.code} ${formatNumber(c.value)}`, cx + 12, y + 50)
    } else {
      doc.setDrawColor(...C_LINE); doc.setLineWidth(1)
      doc.roundedRect(cx, y, cardW, 86, 6, 6, 'S')
      doc.setTextColor(...C_BIZ_DK)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5)
      doc.text(c.label, cx + 12, y + 18)
      doc.setTextColor(...C_INK_950)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
      doc.text(`${cur.code} ${formatNumber(c.value)}`, cx + 12, y + 50)
    }
    // Delta
    if (c.delta != null) {
      const up = c.delta >= 0
      const isGood = c.good ? up : !up
      const arrow = up ? '▲' : '▼'
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
      doc.setTextColor(...(isGood ? C_SUCCESS : C_DANGER))
      if (c.accent) doc.setTextColor(255, 255, 255)
      doc.text(`${arrow} ${formatNumber(Math.abs(c.delta))}% vs prior`, cx + 12, y + 70)
    } else {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      doc.setTextColor(...(c.accent ? [255, 255, 255] : C_INK_500))
      doc.text('No prior period', cx + 12, y + 70)
    }
  })
  y += 96

  /* HIGHLIGHTS */
  if (data.includeHighlightsBlock && (data.highlights || []).filter(Boolean).length > 0) {
    y = ensureSpace(doc, y, 60)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('KEY HIGHLIGHTS', MARGIN, y); y += 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    for (const h of data.highlights.filter(Boolean)) {
      const lines = doc.splitTextToSize(`•  ${h}`, PAGE_W - MARGIN * 2 - 12)
      for (const line of lines) {
        y = ensureSpace(doc, y, 14)
        doc.text(line, MARGIN, y); y += 14
      }
    }
    y += 6
  }

  /* KPIs */
  if (totals.kpis.length > 0) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('KEY PERFORMANCE INDICATORS', MARGIN, y); y += 14

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const cName    = tX + 8
    const cCurrent = tX + tW * 0.45
    const cPrior   = tX + tW * 0.62
    const cTarget  = tX + tW * 0.79
    const cDelta   = tX + tW - 8

    // Header
    doc.setFillColor(...C_BIZ); doc.rect(tX, y, tW, 20, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('METRIC',   cName,    y + 13)
    doc.text('CURRENT',  cCurrent, y + 13, { align: 'right' })
    doc.text('PRIOR',    cPrior,   y + 13, { align: 'right' })
    doc.text('TARGET',   cTarget,  y + 13, { align: 'right' })
    doc.text('Δ',         cDelta,   y + 13, { align: 'right' })
    y += 20

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < totals.kpis.length; i++) {
      const k = totals.kpis[i]
      y = ensureSpace(doc, y, 16)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 16, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(String(k.label || '—'), cName, y + 11)
      const fmt = (v) => {
        if (v == null) return '—'
        if (k.unit === 'money') return `${cur.code} ${formatNumber(v)}`
        if (k.unit === 'pct')   return `${formatNumber(v)}%`
        return formatNumber(v)
      }
      doc.text(fmt(k.current), cCurrent, y + 11, { align: 'right' })
      doc.setTextColor(...C_INK_500)
      doc.text(fmt(k.prior),   cPrior,   y + 11, { align: 'right' })
      doc.text(fmt(k.target),  cTarget,  y + 11, { align: 'right' })
      if (k.delta == null) {
        doc.text('—', cDelta, y + 11, { align: 'right' })
      } else {
        doc.setTextColor(...(k.isGood ? C_SUCCESS : C_DANGER))
        const arrow = k.delta >= 0 ? '▲' : '▼'
        doc.text(`${arrow} ${formatNumber(Math.abs(k.delta))}%`, cDelta, y + 11, { align: 'right' })
      }
      y += 16
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    y += 10
  }

  /* REVENUE BREAKDOWN */
  if (totals.revenue.length > 0) {
    y = drawFinancialTable(doc, y, 'REVENUE BY LINE', totals.revenue, totals.totalRevenueCurrent, totals.totalRevenuePrior, totals.revenueDelta, cur, 'success')
  }

  /* EXPENSE BREAKDOWN */
  if (totals.expenses.length > 0) {
    y = drawFinancialTable(doc, y, 'EXPENSES BY CATEGORY', totals.expenses, totals.totalExpenseCurrent, totals.totalExpensePrior, totals.expenseDelta, cur, 'danger')
  }

  /* GROSS MARGIN STRIP */
  if (totals.totalRevenueCurrent > 0) {
    y = ensureSpace(doc, y, 40)
    doc.setFillColor(248, 248, 244)
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 32, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('GROSS MARGIN', MARGIN + 12, y + 13)
    doc.text('NET INCOME PRIOR', MARGIN + 180, y + 13)
    doc.text('NET INCOME CURRENT', MARGIN + 340, y + 13)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12)
    doc.setTextColor(...C_INK_950)
    doc.text(`${formatNumber(totals.grossMarginCurrent)}%`, MARGIN + 12, y + 26)
    doc.text(`${cur.code} ${formatNumber(totals.netIncomePrior)}`, MARGIN + 180, y + 26)
    doc.setTextColor(...(totals.netIncomeCurrent >= 0 ? C_BIZ_DK : C_DANGER))
    doc.text(`${cur.code} ${formatNumber(totals.netIncomeCurrent)}`, MARGIN + 340, y + 26)
    y += 44
  }

  /* COMMENTARY */
  if (data.includeCommentaryBlock && data.commentary) {
    y = drawTextBlock(doc, y, 'COMMENTARY', data.commentary)
  }

  /* RISKS */
  if (data.includeRisksBlock && data.risks) {
    y = drawTextBlock(doc, y, 'RISKS & WATCH-OUTS', data.risks)
  }

  /* OUTLOOK */
  if (data.includeOutlookBlock && data.outlook) {
    y = drawTextBlock(doc, y, 'OUTLOOK & NEXT PERIOD', data.outlook)
  }

  /* SIGNATURE */
  if (data.includeSignatureBlock) {
    y = ensureSpace(doc, y, 90)
    y += 6
    const halfW = (PAGE_W - MARGIN * 2 - 40) / 2
    const sBlockY = y

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('PREPARED BY (FINANCE)', MARGIN, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN, sBlockY + 40, MARGIN + halfW, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN, sBlockY + 52)
    if (data.preparedBy?.name) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.setTextColor(...C_INK_950)
      doc.text(data.preparedBy.name, MARGIN, sBlockY + 64)
    }
    if (data.preparedBy?.title) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
      doc.setTextColor(...C_INK_500)
      doc.text(data.preparedBy.title, MARGIN, sBlockY + 76)
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.setTextColor(...C_BIZ_DK)
    doc.text('REVIEWED BY', MARGIN + halfW + 40, sBlockY)
    doc.setDrawColor(...C_INK_700); doc.setLineWidth(0.5)
    doc.line(MARGIN + halfW + 40, sBlockY + 40, PAGE_W - MARGIN, sBlockY + 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.setTextColor(...C_INK_500)
    doc.text('Signature & date', MARGIN + halfW + 40, sBlockY + 52)
    if (data.reviewedBy?.name) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.setTextColor(...C_INK_950)
      doc.text(data.reviewedBy.name, MARGIN + halfW + 40, sBlockY + 64)
    }
    if (data.reviewedBy?.title) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
      doc.setTextColor(...C_INK_500)
      doc.text(data.reviewedBy.title, MARGIN + halfW + 40, sBlockY + 76)
    }
    y += 80
  }

  addPageFooters(doc, data)

  const fileName = `financial-report-${(data.reportNumber || 'draft').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)

  /* ---- helpers (closures) ---- */

  function drawFinancialTable(doc, y, title, rows, totalCurrent, totalPrior, totalDelta, cur, tone) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text(title, MARGIN, y); y += 14

    const tX = MARGIN, tW = PAGE_W - MARGIN * 2
    const cLab = tX + 8
    const cCur = tX + tW * 0.55
    const cPri = tX + tW * 0.74
    const cDel = tX + tW - 8

    doc.setFillColor(...C_BIZ); doc.rect(tX, y, tW, 20, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('LINE',     cLab, y + 13)
    doc.text('CURRENT',  cCur, y + 13, { align: 'right' })
    doc.text('PRIOR',    cPri, y + 13, { align: 'right' })
    doc.text('Δ',         cDel, y + 13, { align: 'right' })
    y += 20

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      y = ensureSpace(doc, y, 16)
      if (i % 2 === 1) { doc.setFillColor(252, 252, 250); doc.rect(tX, y, tW, 16, 'F') }
      doc.setTextColor(...C_INK_950)
      doc.text(String(r.label || '—'), cLab, y + 11)
      doc.text(formatNumber(r.current), cCur, y + 11, { align: 'right' })
      doc.setTextColor(...C_INK_500)
      doc.text(formatNumber(r.prior), cPri, y + 11, { align: 'right' })
      if (r.delta == null) {
        doc.text('—', cDel, y + 11, { align: 'right' })
      } else {
        const isGood = tone === 'success' ? r.delta >= 0 : r.delta <= 0
        doc.setTextColor(...(isGood ? C_SUCCESS : C_DANGER))
        const arrow = r.delta >= 0 ? '▲' : '▼'
        doc.text(`${arrow} ${formatNumber(Math.abs(r.delta))}%`, cDel, y + 11, { align: 'right' })
      }
      y += 16
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
    // Total row
    y = ensureSpace(doc, y, 22)
    doc.setFillColor(...C_BIZ); doc.rect(tX, y, tW, 22, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL', cLab, y + 14)
    doc.text(`${cur.code} ${formatNumber(totalCurrent)}`, cCur, y + 14, { align: 'right' })
    doc.text(`${cur.code} ${formatNumber(totalPrior)}`,   cPri, y + 14, { align: 'right' })
    if (totalDelta != null) {
      const arrow = totalDelta >= 0 ? '▲' : '▼'
      doc.text(`${arrow} ${formatNumber(Math.abs(totalDelta))}%`, cDel, y + 14, { align: 'right' })
    }
    y += 30
    return y
  }

  function drawTextBlock(doc, y, title, text) {
    y = ensureSpace(doc, y, 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...C_BIZ_DK)
    doc.text(title, MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(text), PAGE_W - MARGIN * 2)
    for (const line of lines) {
      y = ensureSpace(doc, y, 13)
      doc.text(line, MARGIN, y); y += 13
    }
    return y + 8
  }
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
    const left = `Financial Report${data.reportNumber ? ` · ${data.reportNumber}` : ''}${data.periodLabel ? ` · ${data.periodLabel}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}  ·  Confidential`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
