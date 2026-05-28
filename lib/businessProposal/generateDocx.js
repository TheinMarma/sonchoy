import {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx'
import { saveAs } from 'file-saver'
import {
  findCurrency, formatNumber, formatDate,
  findPaymentTerm, findValidity,
  computeInvestmentTotal,
} from './compute'

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.center ? AlignmentType.CENTER : (opts.right ? AlignmentType.RIGHT : undefined),
    children: [new TextRun({
      text: String(text || ''),
      bold: !!opts.bold,
      italics: !!opts.italic,
      size: opts.size || 20,
      color: opts.color || '1F2937',
    })],
  })
}

function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, color: '111111' })],
  })
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text: String(text || ''), size: 20 })],
  })
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 25, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      alignment: opts.right ? AlignmentType.RIGHT : undefined,
      children: [new TextRun({
        text: String(text || ''),
        bold: !!opts.bold,
        size: opts.size || 20,
        color: opts.color || '1F2937',
      })],
    })],
    shading: opts.shading ? { fill: opts.shading } : undefined,
  })
}

export async function generateBusinessProposalDocx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const term = findPaymentTerm(data.paymentTermsId)
  const validity = findValidity(data.validityId)
  const totals = computeInvestmentTotal(data.investmentItems, {
    taxRate: data.taxRate,
    discount: data.discount,
  })

  const children = []

  // Cover
  children.push(p('BUSINESS PROPOSAL', { size: 16, color: 'F43F5E', bold: true }))
  if (data.proposalNumber) children.push(p(data.proposalNumber, { size: 16, color: '6B7280' }))
  children.push(p(''))
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: data.proposalTitle || 'Business Proposal', bold: true, size: 56 })],
  }))
  if (data.proposalSubtitle) children.push(p(data.proposalSubtitle, { size: 26, color: '6B7280' }))

  children.push(p('—', { color: 'F43F5E', size: 24 }))

  // Prepared for / by
  children.push(p('PREPARED FOR', { bold: true, size: 16, color: '6B7280' }))
  children.push(p(data.client?.name || '[Client Name]', { bold: true, size: 26 }))
  if (data.client?.contactName)  children.push(p(data.client.contactName))
  if (data.client?.contactTitle) children.push(p(data.client.contactTitle))
  if (data.client?.email)        children.push(p(data.client.email))

  children.push(p(''))
  children.push(p('PREPARED BY', { bold: true, size: 16, color: '6B7280' }))
  children.push(p(data.provider?.name || '[Provider Name]', { bold: true, size: 26 }))
  if (data.provider?.contactName)  children.push(p(data.provider.contactName))
  if (data.provider?.contactTitle) children.push(p(data.provider.contactTitle))
  if (data.provider?.email)        children.push(p(data.provider.email))
  if (data.provider?.phone)        children.push(p(data.provider.phone))

  children.push(p(''))
  if (data.proposalDate) children.push(p(`Date: ${formatDate(data.proposalDate)}`, { size: 18 }))
  if (data.validityId)   children.push(p(`Valid for: ${validity.label}`, { size: 18 }))

  let n = 1
  const sec = (title) => heading(`${String(n++).padStart(2, '0')}  ${title}`)

  if (data.includeExecSummary) {
    children.push(sec('EXECUTIVE SUMMARY'))
    children.push(p(data.execSummary
      || `${data.provider?.name || 'We'} are pleased to submit this proposal to ${data.client?.name || 'Client'}.`))
  }

  if (data.includeProblem) {
    children.push(sec('THE OPPORTUNITY'))
    children.push(p(data.problemStatement || ''))
  }

  if (data.includeApproach) {
    children.push(sec('OUR APPROACH'))
    children.push(p(data.approachDescription || ''))
  }

  if (data.includeScope) {
    children.push(sec('SCOPE OF WORK'))
    if (data.scopeDescription) children.push(p(data.scopeDescription))
    for (const it of (data.scopeItems || [])) children.push(bullet(it.description || '—'))
    if (data.outOfScopeNote) {
      children.push(p('Out of scope:', { bold: true }))
      children.push(p(data.outOfScopeNote))
    }
  }

  if (data.includeDeliverables) {
    children.push(sec('DELIVERABLES'))
    if (data.deliverablesIntro) children.push(p(data.deliverablesIntro))
    for (const it of (data.deliverables || [])) children.push(bullet(it.description || '—'))
  }

  if (data.includeTimeline) {
    children.push(sec('TIMELINE'))
    if (data.timelineIntro) children.push(p(data.timelineIntro))
    for (const ph of (data.timelinePhases || [])) {
      const dates = []
      if (ph.startDate) dates.push(formatDate(ph.startDate))
      if (ph.endDate)   dates.push(formatDate(ph.endDate))
      const range = dates.length ? ` (${dates.join(' → ')})` : ''
      children.push(bullet(`${ph.name || 'Phase'}${range}${ph.description ? ` — ${ph.description}` : ''}`))
    }
  }

  if (data.includeTeam) {
    children.push(sec('THE TEAM'))
    if (data.teamIntro) children.push(p(data.teamIntro))
    for (const m of (data.teamMembers || [])) {
      children.push(bullet(`${m.name || '[Name]'}${m.role ? ` — ${m.role}` : ''}${m.bio ? `. ${m.bio}` : ''}`))
    }
  }

  if (data.includeInvestment) {
    children.push(sec('INVESTMENT'))
    if (data.investmentIntro) children.push(p(data.investmentIntro))

    const rows = []
    rows.push(new TableRow({
      tableHeader: true,
      children: [
        cell('Item',   { bold: true, width: 55, shading: 'F8F7F3', color: '6B7280' }),
        cell('Qty',    { bold: true, width: 10, shading: 'F8F7F3', color: '6B7280', right: true }),
        cell('Rate',   { bold: true, width: 15, shading: 'F8F7F3', color: '6B7280', right: true }),
        cell('Amount', { bold: true, width: 20, shading: 'F8F7F3', color: '6B7280', right: true }),
      ],
    }))
    for (const it of (data.investmentItems || [])) {
      const qty = Number(it.qty) || 0
      const rate = Number(it.rate) || 0
      rows.push(new TableRow({
        children: [
          cell(it.description || '—',     { width: 55 }),
          cell(formatNumber(qty),         { width: 10, right: true }),
          cell(formatNumber(rate),        { width: 15, right: true }),
          cell(formatNumber(qty * rate),  { width: 20, right: true, bold: true }),
        ],
      }))
    }
    rows.push(new TableRow({
      children: [
        cell('', { width: 65 }),
        cell('Subtotal', { width: 15, right: true, bold: true, color: '6B7280' }),
        cell('', { width: 0 }),
        cell(`${cur.code} ${formatNumber(totals.subtotal)}`, { width: 20, right: true }),
      ],
    }))
    if (totals.discount > 0) {
      rows.push(new TableRow({
        children: [
          cell('', { width: 65 }),
          cell(`Discount (${Number(data.discount) || 0}%)`, { width: 15, right: true, color: '6B7280' }),
          cell('', { width: 0 }),
          cell(`- ${cur.code} ${formatNumber(totals.discount)}`, { width: 20, right: true }),
        ],
      }))
    }
    if (totals.tax > 0) {
      rows.push(new TableRow({
        children: [
          cell('', { width: 65 }),
          cell(`Tax (${Number(data.taxRate) || 0}%)`, { width: 15, right: true, color: '6B7280' }),
          cell('', { width: 0 }),
          cell(`${cur.code} ${formatNumber(totals.tax)}`, { width: 20, right: true }),
        ],
      }))
    }
    rows.push(new TableRow({
      children: [
        cell('', { width: 65 }),
        cell('TOTAL', { width: 15, right: true, bold: true, color: 'F43F5E' }),
        cell('', { width: 0 }),
        cell(`${cur.code} ${formatNumber(totals.total)}`, { width: 20, right: true, bold: true, size: 24 }),
      ],
    }))

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top:     { style: BorderStyle.SINGLE, size: 4, color: 'DCDAD4' },
        bottom:  { style: BorderStyle.SINGLE, size: 4, color: 'DCDAD4' },
        left:    { style: BorderStyle.SINGLE, size: 4, color: 'DCDAD4' },
        right:   { style: BorderStyle.SINGLE, size: 4, color: 'DCDAD4' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'EFEDE8' },
        insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: 'EFEDE8' },
      },
      rows,
    }))
    children.push(p(''))
  }

  if (data.includeTerms) {
    children.push(sec('TERMS & CONDITIONS'))
    if (data.termsIntro) children.push(p(data.termsIntro))
    children.push(bullet(`Payment terms: ${term.label}.`))
    children.push(bullet(`This proposal is valid for ${validity.label} from the date of issue.`))
    if (data.additionalTerms) children.push(p(data.additionalTerms))
  }

  if (data.includeNextSteps) {
    children.push(sec('NEXT STEPS'))
    if (data.nextStepsIntro) children.push(p(data.nextStepsIntro))
    children.push(bullet('Sign the acceptance page and return a scan to the email above.'))
    children.push(bullet('We will issue an order confirmation and project kick-off date within 2 business days.'))
    children.push(bullet('A formal contract or SoW will be executed before work commences.'))
  }

  if (data.includeAcceptance) {
    children.push(sec('ACCEPTANCE'))
    children.push(p(`By signing below, ${data.client?.name || 'Client'} accepts the terms of this proposal and authorises ${data.provider?.name || 'Provider'} to commence the work as described.`))
    children.push(p(''))
    children.push(p('CLIENT', { bold: true, color: '6B7280' }))
    children.push(p('Signature: ____________________________________'))
    children.push(p(`Name: ${data.client?.contactName || data.client?.name || '________________________'}`, { bold: true }))
    children.push(p(`Title: ${data.client?.contactTitle || 'Title'}`))
    children.push(p('Date: ____________________'))
    children.push(p(''))
    children.push(p('PROVIDER', { bold: true, color: '6B7280' }))
    children.push(p('Signature: ____________________________________'))
    children.push(p(`Name: ${data.provider?.contactName || data.provider?.name || '________________________'}`, { bold: true }))
    children.push(p(`Title: ${data.provider?.contactTitle || 'Title'}`))
    children.push(p('Date: ____________________'))
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const fileName = `${(data.proposalTitle || 'proposal').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-proposal.docx`
  saveAs(blob, fileName)
}
