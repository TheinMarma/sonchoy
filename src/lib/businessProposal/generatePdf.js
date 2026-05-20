import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findPaymentTerm, findValidity,
  computeInvestmentTotal,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generateBusinessProposalPdf(data) → triggers a download            */
/* ------------------------------------------------------------------ */

const MARGIN = 56
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_ROSE    = [244, 63, 94]

const BODY_FONT_SIZE = 10
const BODY_LINE_H = 13
const SECTION_FONT_SIZE = 12
const SECTION_LINE_H = 16

export function generateBusinessProposalPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.currency || 'USD')
  const term = findPaymentTerm(data.paymentTermsId)
  const validity = findValidity(data.validityId)
  const totals = computeInvestmentTotal(data.investmentItems, {
    taxRate: data.taxRate,
    discount: data.discount,
  })

  // ============== COVER PAGE ==============

  // Top accent bar
  doc.setFillColor(...C_ROSE)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  let y = MARGIN + 24

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text('BUSINESS PROPOSAL', MARGIN, y)
  if (data.proposalNumber) {
    doc.text(data.proposalNumber, PAGE_W - MARGIN, y, { align: 'right' })
  }
  y += 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(34)
  doc.setTextColor(...C_INK_950)
  y = drawWrapped(doc, data.proposalTitle || 'Business Proposal', MARGIN, y, PAGE_W - MARGIN * 2, 38, { bold: true, fontSize: 34 })
  y += 14

  if (data.proposalSubtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(...C_INK_700)
    y = drawWrapped(doc, data.proposalSubtitle, MARGIN, y, PAGE_W - MARGIN * 2, 18, { fontSize: 13 })
    y += 8
  }

  // Crimson rule
  doc.setDrawColor(...C_ROSE)
  doc.setLineWidth(2)
  doc.line(MARGIN, y + 8, MARGIN + 60, y + 8)
  y += 36

  // "Prepared for / by" block
  const colW = (PAGE_W - MARGIN * 2 - 30) / 2
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C_INK_500)
  doc.text('PREPARED FOR', MARGIN, y)
  doc.text('PREPARED BY', MARGIN + colW + 30, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...C_INK_950)
  doc.text(data.client?.name || '[Client Name]', MARGIN, y + 18)
  doc.text(data.provider?.name || '[Provider Name]', MARGIN + colW + 30, y + 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...C_INK_700)
  let leftY = y + 34
  let rightY = y + 34
  if (data.client?.contactName) { doc.text(data.client.contactName, MARGIN, leftY); leftY += 13 }
  if (data.client?.contactTitle) { doc.text(data.client.contactTitle, MARGIN, leftY); leftY += 13 }
  if (data.client?.company && data.client.company !== data.client?.name) { doc.text(data.client.company, MARGIN, leftY); leftY += 13 }
  if (data.client?.email) { doc.text(data.client.email, MARGIN, leftY); leftY += 13 }

  if (data.provider?.contactName) { doc.text(data.provider.contactName, MARGIN + colW + 30, rightY); rightY += 13 }
  if (data.provider?.contactTitle) { doc.text(data.provider.contactTitle, MARGIN + colW + 30, rightY); rightY += 13 }
  if (data.provider?.email) { doc.text(data.provider.email, MARGIN + colW + 30, rightY); rightY += 13 }
  if (data.provider?.phone) { doc.text(data.provider.phone, MARGIN + colW + 30, rightY); rightY += 13 }

  y = Math.max(leftY, rightY) + 30

  // Dates and validity
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 18

  const meta = []
  if (data.proposalDate)  meta.push(['Date',     formatDate(data.proposalDate)])
  if (data.validityId)    meta.push(['Valid for', validity.label])
  if (data.investmentItems?.length) meta.push(['Investment', `${cur.code} ${formatNumber(totals.total)}`])

  const metaColW = (PAGE_W - MARGIN * 2) / Math.max(meta.length, 1)
  for (let i = 0; i < meta.length; i++) {
    const [k, v] = meta[i]
    const x = MARGIN + metaColW * i
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_INK_500)
    doc.text(k.toUpperCase(), x, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...C_INK_950)
    doc.text(v, x, y + 14)
  }

  // ============== BODY PAGES ==============

  let sectionN = 1
  const sec = (title) => {
    y = ensureSpace(doc, y, 50)
    if (y === MARGIN) y += 8
    else y += 22

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...C_ROSE)
    doc.text(String(sectionN).padStart(2, '0'), MARGIN, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(SECTION_FONT_SIZE)
    doc.setTextColor(...C_INK_950)
    doc.text(title, MARGIN + 24, y)
    sectionN += 1
    y += SECTION_LINE_H + 4

    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2)
    y += 10
  }

  const body = (text) => {
    if (!text) return
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_700)
    y = drawWrapped(doc, text, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
    y += 6
  }

  const bullet = (text) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_700)
    y = ensureSpace(doc, y, BODY_LINE_H + 2)
    doc.setFillColor(...C_ROSE)
    doc.circle(MARGIN + 6, y - 3, 1.6, 'F')
    y = drawWrapped(doc, text, MARGIN + 18, y, PAGE_W - MARGIN * 2 - 18, BODY_LINE_H)
    y += 2
  }

  doc.addPage()
  y = MARGIN

  // EXEC SUMMARY
  if (data.includeExecSummary) {
    sec('EXECUTIVE SUMMARY')
    body(data.execSummary
      || `${data.provider?.name || 'We'} are pleased to submit this proposal to ${data.client?.name || 'Client'}. This document outlines our understanding of your objectives, our recommended approach, the deliverables, timeline, and investment required.`)
  }

  // PROBLEM
  if (data.includeProblem) {
    sec('THE OPPORTUNITY')
    body(data.problemStatement
      || 'Brief framing of the business challenge or opportunity that this engagement addresses.')
  }

  // APPROACH
  if (data.includeApproach) {
    sec('OUR APPROACH')
    body(data.approachDescription
      || 'How we propose to solve the problem — the methodology, frameworks, and principles we will apply.')
  }

  // SCOPE
  if (data.includeScope) {
    sec('SCOPE OF WORK')
    body(data.scopeDescription || 'The work covered by this proposal includes:')
    for (const it of (data.scopeItems || [])) bullet(it.description || '—')
    if (data.outOfScopeNote) {
      y += 4
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(BODY_FONT_SIZE)
      doc.setTextColor(...C_INK_950)
      y = ensureSpace(doc, y, BODY_LINE_H + 4)
      doc.text('Out of scope:', MARGIN, y); y += BODY_LINE_H
      body(data.outOfScopeNote)
    }
  }

  // DELIVERABLES
  if (data.includeDeliverables) {
    sec('DELIVERABLES')
    body(data.deliverablesIntro || 'You will receive the following tangible deliverables on completion:')
    for (const it of (data.deliverables || [])) bullet(it.description || '—')
  }

  // TIMELINE
  if (data.includeTimeline) {
    sec('TIMELINE')
    body(data.timelineIntro
      || `Proposed engagement timeline. Dates are indicative and can be adjusted after kick-off.`)
    for (const ph of (data.timelinePhases || [])) {
      const dates = []
      if (ph.startDate) dates.push(formatDate(ph.startDate))
      if (ph.endDate)   dates.push(formatDate(ph.endDate))
      const range = dates.length ? ` (${dates.join(' → ')})` : ''
      bullet(`${ph.name || 'Phase'}${range}${ph.description ? ` — ${ph.description}` : ''}`)
    }
  }

  // TEAM
  if (data.includeTeam) {
    sec('THE TEAM')
    body(data.teamIntro || `The following team members will deliver this engagement:`)
    for (const m of (data.teamMembers || [])) {
      bullet(`${m.name || '[Name]'}${m.role ? ` — ${m.role}` : ''}${m.bio ? `. ${m.bio}` : ''}`)
    }
  }

  // INVESTMENT
  if (data.includeInvestment) {
    sec('INVESTMENT')
    body(data.investmentIntro
      || `The total investment for the work described above is set out in the table below. All amounts are in ${cur.code}.`)

    y = ensureSpace(doc, y, 60)
    const tableX = MARGIN
    const tableW = PAGE_W - MARGIN * 2
    const c1 = tableX + 8
    const c2 = tableX + tableW - 60 - 80 - 100
    const c3 = tableX + tableW - 60 - 100
    const c4 = tableX + tableW - 100
    const c5 = tableX + tableW - 8

    // Header
    doc.setFillColor(248, 247, 243)
    doc.rect(tableX, y, tableW, 22, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C_INK_500)
    doc.text('ITEM', c1, y + 14)
    doc.text('QTY', c3, y + 14, { align: 'right' })
    doc.text('RATE', c4, y + 14, { align: 'right' })
    doc.text('AMOUNT', c5, y + 14, { align: 'right' })
    y += 22

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_950)
    for (const it of (data.investmentItems || [])) {
      y = ensureSpace(doc, y, 24)
      const qty = Number(it.qty) || 0
      const rate = Number(it.rate) || 0
      const amt = qty * rate
      doc.setTextColor(...C_INK_950)
      const descLines = doc.splitTextToSize(String(it.description || '—'), c2 - c1)
      const rowH = Math.max(18, descLines.length * BODY_LINE_H + 4)
      doc.text(descLines, c1, y + 12)
      doc.setTextColor(...C_INK_700)
      doc.text(formatNumber(qty),  c3, y + 12, { align: 'right' })
      doc.text(formatNumber(rate), c4, y + 12, { align: 'right' })
      doc.setTextColor(...C_INK_950)
      doc.text(formatNumber(amt),  c5, y + 12, { align: 'right' })
      y += rowH
      doc.setDrawColor(...C_LINE)
      doc.setLineWidth(0.3)
      doc.line(tableX, y, tableX + tableW, y)
    }

    y += 8
    const drawTotalRow = (label, value, opts = {}) => {
      y = ensureSpace(doc, y, BODY_LINE_H + 4)
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
      doc.setFontSize(opts.large ? 12 : BODY_FONT_SIZE)
      doc.setTextColor(...(opts.accent ? C_ROSE : C_INK_700))
      doc.text(label, c4, y + 10, { align: 'right' })
      doc.setTextColor(...(opts.accent ? C_ROSE : C_INK_950))
      doc.text(`${cur.code} ${formatNumber(value)}`, c5, y + 10, { align: 'right' })
      y += opts.large ? 22 : 16
    }
    drawTotalRow('Subtotal', totals.subtotal)
    if (totals.discount > 0) drawTotalRow(`Discount (${Number(data.discount) || 0}%)`, -totals.discount)
    if (totals.tax > 0)      drawTotalRow(`Tax (${Number(data.taxRate) || 0}%)`, totals.tax)

    // Big total
    y += 6
    y = ensureSpace(doc, y, 36)
    doc.setFillColor(...C_INK_950)
    doc.rect(c4 - 110, y, c5 - (c4 - 110), 30, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C_INK_500)
    doc.text('TOTAL INVESTMENT', c4 - 100, y + 12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.text(`${cur.code} ${formatNumber(totals.total)}`, c5 - 8, y + 20, { align: 'right' })
    y += 38
  }

  // TERMS
  if (data.includeTerms) {
    sec('TERMS & CONDITIONS')
    body(data.termsIntro || `The following commercial terms apply to this proposal:`)
    bullet(`Payment terms: ${term.label}.`)
    bullet(`This proposal is valid for ${validity.label} from the date of issue.`)
    if (data.additionalTerms) body(data.additionalTerms)
  }

  // NEXT STEPS
  if (data.includeNextSteps) {
    sec('NEXT STEPS')
    body(data.nextStepsIntro || 'To proceed with this proposal, please:')
    bullet('Sign the acceptance page and return a scan to the email above.')
    bullet('We will issue an order confirmation and project kick-off date within 2 business days.')
    bullet('A formal contract or SoW will be executed before work commences.')
  }

  // ACCEPTANCE
  if (data.includeAcceptance) {
    sec('ACCEPTANCE')
    body(`By signing below, ${data.client?.name || 'Client'} accepts the terms of this proposal and authorises ${data.provider?.name || 'Provider'} to commence the work as described.`)

    y += 12
    y = ensureSpace(doc, y, 130)
    const colW2 = (PAGE_W - MARGIN * 2 - 40) / 2
    drawSignatureBlock(doc, MARGIN, y, colW2, 'CLIENT', data.client)
    drawSignatureBlock(doc, MARGIN + colW2 + 40, y, colW2, 'PROVIDER', data.provider)
  }

  addPageFooters(doc, data)

  const fileName = `${(data.proposalTitle || 'proposal').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-proposal.pdf`
  doc.save(fileName)
}

function drawWrapped(doc, text, x, y, maxW, lineH, opts = {}) {
  if (!text) return y
  doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'))
  if (opts.fontSize) doc.setFontSize(opts.fontSize)
  const lines = doc.splitTextToSize(String(text), maxW)
  for (const line of lines) {
    y = ensureSpace(doc, y, lineH)
    doc.text(line, x, y)
    y += lineH
  }
  return y
}

function drawSignatureBlock(doc, x, y, w, label, party) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C_INK_500)
  doc.text(label, x, y)

  doc.setDrawColor(...C_INK_950)
  doc.setLineWidth(0.8)
  doc.line(x, y + 38, x + w, y + 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_500)
  doc.text('Signature', x, y + 50)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C_INK_950)
  doc.text(party?.contactName || party?.name || '________________________', x, y + 70)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  doc.text(party?.contactTitle || 'Title', x, y + 84)

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(x, y + 102, x + 100, y + 102)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_500)
  doc.text('Date', x, y + 114)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN - 20) {
    doc.addPage()
    return MARGIN
  }
  return y
}

function addPageFooters(doc, data) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const footerY = PAGE_H - 28
    doc.setDrawColor(...C_LINE)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY - 4, PAGE_W - MARGIN, footerY - 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C_INK_500)
    const left = data.proposalNumber
      ? `${data.proposalTitle || 'Proposal'} · ${data.proposalNumber}`
      : (data.proposalTitle || 'Proposal')
    doc.text(left, MARGIN, footerY + 6)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 6, { align: 'right' })
  }
}
