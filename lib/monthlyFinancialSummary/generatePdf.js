import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findLineType, findCompareMode,
  computeSummary, buildLineGroups,
} from './compute'

const MARGIN = 38
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ACC     = [129, 140, 248]
const C_ACC_DK  = [67, 56, 202]
const C_SUCCESS = [22, 163, 74]
const C_DANGER  = [220, 38, 38]

const BODY = 9

export function generateMonthlyFinancialSummaryPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const compareMode = findCompareMode(data.compareMode)
  const sum = computeSummary(data)
  const groups = buildLineGroups(sum.rows)

  let y = MARGIN

  doc.setFillColor(...C_ACC); doc.rect(0, 0, PAGE_W, 4, 'F')

  /* HEADER */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('MONTHLY FINANCIAL SUMMARY', MARGIN, y + 8)
  if (data.reference) doc.text(data.reference, PAGE_W - MARGIN, y + 8, { align: 'right' })
  y += 22

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.setTextColor(...C_INK_950)
  doc.text(data.reportTitle || 'Monthly Financial Summary', MARGIN, y)
  y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.entityName)  meta.push(`Entity: ${data.entityName}`)
  if (data.monthLabel)  meta.push(`Period: ${data.monthLabel}`)
  if (compareMode.id !== 'none') meta.push(`Comparison: ${compareMode.label.toLowerCase()}`)
  doc.text(meta.join('  ·  '), MARGIN, y); y += 14

  doc.setDrawColor(...C_ACC); doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 60, y); y += 16

  /* TOP CARDS */
  const cardCount = 4
  const gap = 6
  const cardW = (PAGE_W - MARGIN * 2 - gap * (cardCount - 1)) / cardCount
  const netColor = sum.netIncome >= 0 ? C_SUCCESS : C_DANGER
  const cards = [
    ['REVENUE',     `${cur.code} ${formatNumber(sum.totals.revenue)}`,         C_INK_950],
    ['EXPENSES',    `${cur.code} ${formatNumber(sum.totals.cogs + sum.totals.opex + sum.totals.tax)}`, C_INK_950],
    ['NET INCOME',  `${sum.netIncome >= 0 ? '' : '-'}${cur.code} ${formatNumber(Math.abs(sum.netIncome))}`, netColor],
    ['NET MARGIN',  `${formatNumber(sum.netMarginPct)}%`,                       C_ACC_DK],
  ]
  for (let i = 0; i < cards.length; i++) {
    const x = MARGIN + i * (cardW + gap)
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.5)
    doc.setFillColor(248, 247, 243)
    doc.roundedRect(x, y, cardW, 50, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
    doc.setTextColor(...C_ACC_DK); doc.text(cards[i][0], x + 8, y + 14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5)
    doc.setTextColor(...cards[i][2]); doc.text(cards[i][1], x + 8, y + 34)
  }
  y += 50 + 14

  /* LINE-ITEM TABLE */
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.setTextColor(...C_ACC_DK)
  doc.text('REVENUE & EXPENSES', MARGIN, y); y += 12

  const tX = MARGIN, tW = PAGE_W - MARGIN * 2
  const showCompare = compareMode.id !== 'none'

  const cCat = tX + 8
  const cActual = showCompare ? tX + tW * 0.50 : tX + tW * 0.70
  const cComp   = tX + tW * 0.70
  const cVar    = tX + tW * 0.86
  const cEnd    = tX + tW - 8

  const drawHeader = () => {
    doc.setFillColor(...C_ACC); doc.rect(tX, y, tW, 16, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('CATEGORY', cCat, y + 11)
    doc.text(showCompare ? 'ACTUAL' : 'AMOUNT', cActual, y + 11, { align: 'right' })
    if (showCompare) {
      doc.text(compareMode.id === 'prior' ? 'PRIOR' : 'BUDGET', cComp, y + 11, { align: 'right' })
      doc.text('VAR',     cVar,  y + 11, { align: 'right' })
      doc.text('VAR %',   cEnd,  y + 11, { align: 'right' })
    }
    y += 16
  }
  drawHeader()

  const drawRow = (label, actual, compare, variance, variancePct, isSubtotal, kind) => {
    y = ensureSpace(doc, y, 14)
    if (isSubtotal) {
      doc.setFillColor(244, 245, 255)
      doc.rect(tX, y, tW, 14, 'F')
    }
    doc.setFont('helvetica', isSubtotal ? 'bold' : 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...(isSubtotal ? C_ACC_DK : C_INK_700))
    doc.text(label, cCat, y + 10)
    doc.setTextColor(...(isSubtotal ? C_ACC_DK : C_INK_950))
    doc.text(formatNumber(actual), cActual, y + 10, { align: 'right' })
    if (showCompare) {
      doc.setTextColor(...(isSubtotal ? C_ACC_DK : C_INK_700))
      doc.text(formatNumber(compare), cComp, y + 10, { align: 'right' })
      const goodIncrease = kind === 'income'   // for revenue, higher is good
      const goodDecrease = kind === 'expense'  // for expenses, higher is bad
      const varColor = variance === 0 ? C_INK_500
        : (goodIncrease && variance > 0) || (goodDecrease && variance < 0) ? C_SUCCESS
        : C_DANGER
      doc.setTextColor(...varColor)
      doc.text(`${variance >= 0 ? '+' : '-'}${formatNumber(Math.abs(variance))}`, cVar, y + 10, { align: 'right' })
      doc.text(`${variance >= 0 ? '+' : ''}${formatNumber(variancePct)}%`, cEnd, y + 10, { align: 'right' })
    }
    y += 14
    if (!isSubtotal) {
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    } else {
      doc.setDrawColor(...C_ACC); doc.setLineWidth(0.5); doc.line(tX, y, tX + tW, y)
    }
  }

  for (const g of groups) {
    // Group rows
    for (const r of g.rows) {
      drawRow(`  ${r.category || '—'}`, r.actual, r.compare, r.variance, r.variancePct, false, g.kind)
    }
    // Subtotal
    drawRow(
      `${g.label} subtotal`,
      g.subtotalActual,
      g.subtotalCompare,
      g.subtotalActual - g.subtotalCompare,
      g.subtotalCompare > 0 ? ((g.subtotalActual - g.subtotalCompare) / g.subtotalCompare) * 100 : 0,
      true,
      g.kind,
    )
  }

  // Gross profit / Operating profit / Net income lines
  y += 6
  const drawCalcRow = (label, actual, compare, isBold) => {
    y = ensureSpace(doc, y, 14)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal'); doc.setFontSize(isBold ? 10 : BODY)
    doc.setTextColor(...(isBold ? C_ACC_DK : C_INK_700))
    doc.text(label, cCat, y + 10)
    doc.setTextColor(...(isBold ? (actual >= 0 ? C_SUCCESS : C_DANGER) : C_INK_950))
    doc.text(formatNumber(actual), cActual, y + 10, { align: 'right' })
    if (showCompare) {
      doc.setTextColor(...C_INK_700)
      doc.text(formatNumber(compare), cComp, y + 10, { align: 'right' })
      const variance = actual - compare
      const varPct = compare !== 0 ? (variance / Math.abs(compare)) * 100 : 0
      const varColor = variance >= 0 ? C_SUCCESS : C_DANGER
      doc.setTextColor(...varColor)
      doc.text(`${variance >= 0 ? '+' : '-'}${formatNumber(Math.abs(variance))}`, cVar, y + 10, { align: 'right' })
      doc.text(`${variance >= 0 ? '+' : ''}${formatNumber(varPct)}%`, cEnd, y + 10, { align: 'right' })
    }
    y += 14
    if (isBold) {
      doc.setDrawColor(...C_ACC_DK); doc.setLineWidth(0.8); doc.line(tX, y, tX + tW, y)
    } else {
      doc.setDrawColor(...C_LINE); doc.setLineWidth(0.3); doc.line(tX, y, tX + tW, y)
    }
  }

  drawCalcRow('Gross profit',       sum.grossProfit,      sum.grossProfitCompare,     false)
  drawCalcRow('Operating profit',   sum.operatingProfit,  sum.operatingProfitCompare, false)
  drawCalcRow('NET INCOME',         sum.netIncome,        sum.netIncomeCompare,       true)
  y += 6

  /* KPI BLOCK */
  if (data.includeKpis) {
    y = ensureSpace(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('KEY METRICS', MARGIN, y); y += 12

    const kpiCount = 4
    const kpiGap = 6
    const kpiW = (PAGE_W - MARGIN * 2 - kpiGap * (kpiCount - 1)) / kpiCount
    const kpis = [
      ['GROSS MARGIN',     `${formatNumber(sum.grossMarginPct)}%`,     `vs ${formatNumber(sum.grossMarginPctCompare)}%`],
      ['OPERATING MARGIN', `${formatNumber(sum.operatingMarginPct)}%`, ''],
      ['NET MARGIN',       `${formatNumber(sum.netMarginPct)}%`,        `vs ${formatNumber(sum.netMarginPctCompare)}%`],
      ['EXPENSE RATIO',    `${formatNumber(sum.expenseRatioPct)}%`,     'of revenue'],
    ]
    for (let i = 0; i < kpis.length; i++) {
      const x = MARGIN + i * (kpiW + kpiGap)
      doc.setDrawColor(...C_ACC); doc.setLineWidth(0.4)
      doc.setFillColor(244, 245, 255)
      doc.roundedRect(x, y, kpiW, 56, 4, 4, 'FD')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
      doc.setTextColor(...C_ACC_DK); doc.text(kpis[i][0], x + 8, y + 14)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
      doc.setTextColor(...C_INK_950); doc.text(kpis[i][1], x + 8, y + 34)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
      doc.setTextColor(...C_INK_500); doc.text(kpis[i][2], x + 8, y + 48)
    }
    y += 56 + 12
  }

  /* CASH POSITION */
  if (data.includeCashPosition) {
    y = ensureSpace(doc, y, 70)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('CASH POSITION', MARGIN, y); y += 12

    doc.setDrawColor(...C_ACC); doc.setLineWidth(0.6)
    doc.setFillColor(244, 245, 255)
    doc.roundedRect(MARGIN, y, tW, 56, 4, 4, 'FD')

    const cL = MARGIN + 14
    const cR = PAGE_W - MARGIN - 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    doc.text('Opening cash',  cL, y + 18)
    doc.text('Closing cash',  cL, y + 32)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C_ACC_DK)
    doc.text('CHANGE IN CASH', cL, y + 48)

    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK_950)
    doc.text(`${cur.code} ${formatNumber(sum.cashOpen)}`,  cR, y + 18, { align: 'right' })
    doc.text(`${cur.code} ${formatNumber(sum.cashClose)}`, cR, y + 32, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(sum.cashChange >= 0 ? C_SUCCESS : C_DANGER))
    doc.text(`${sum.cashChange >= 0 ? '+' : '-'}${cur.code} ${formatNumber(Math.abs(sum.cashChange))}`, cR, y + 48, { align: 'right' })
    y += 56 + 10
  }

  /* HIGHLIGHTS */
  if (data.includeHighlights && (data.highlights || []).length > 0) {
    y = ensureSpace(doc, y, 50)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('HIGHLIGHTS & CONTEXT', MARGIN, y); y += 12

    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    for (const h of data.highlights) {
      if (!h.text) continue
      y = ensureSpace(doc, y, 13)
      // Bullet
      doc.setFillColor(...C_ACC)
      doc.circle(MARGIN + 4, y + 6, 1.6, 'F')
      doc.setTextColor(...C_INK_700)
      const lines = doc.splitTextToSize(String(h.text), tW - 16)
      for (let i = 0; i < lines.length; i++) {
        y = ensureSpace(doc, y, 13)
        doc.text(lines[i], MARGIN + 12, y + 10)
        y += 13
      }
      y += 2
    }
    y += 4
  }

  /* NOTES */
  if (data.notes) {
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.setTextColor(...C_ACC_DK)
    doc.text('NOTES', MARGIN, y); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY)
    doc.setTextColor(...C_INK_700)
    const lines = doc.splitTextToSize(String(data.notes), PAGE_W - MARGIN * 2)
    for (const line of lines) { y = ensureSpace(doc, y, 13); doc.text(line, MARGIN, y); y += 13 }
  }

  addPageFooters(doc, data)

  const fileName = `monthly-financial-summary-${(data.reference || 'report').replace(/[^a-z0-9-]+/gi, '-')}.pdf`
  doc.save(fileName)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 20) { doc.addPage(); return MARGIN }
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
    const left = `Monthly summary${data.entityName ? ` · ${data.entityName}` : ''}${data.monthLabel ? ` · ${data.monthLabel}` : ''}`
    doc.text(left, MARGIN, footerY + 4)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 4, { align: 'right' })
  }
}
