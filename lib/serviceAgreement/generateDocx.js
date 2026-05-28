import {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
} from 'docx'
import { saveAs } from 'file-saver'
import {
  findCurrency, formatNumber, formatDate,
  findFeeStructure, findPaymentTerm, findIpOwnership, findDisputeRes,
  computeMilestoneTotal,
} from './compute'

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.center ? AlignmentType.CENTER : undefined,
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
    spacing: { before: 240, after: 120 },
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

export async function generateServiceAgreementDocx(data) {
  const cur = findCurrency(data.feeCurrency || 'USD')
  const fee = findFeeStructure(data.feeStructure)
  const term = findPaymentTerm(data.paymentTermsId)
  const ip = findIpOwnership(data.ipOwnership)
  const dispute = findDisputeRes(data.disputeResolution)

  const children = []

  // Title
  children.push(p('MASTER SERVICE AGREEMENT', { center: true, size: 16, color: '6B7280' }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: data.agreementTitle || 'Master Service Agreement', bold: true, size: 36 })],
  }))
  const meta = []
  if (data.agreementNumber) meta.push(data.agreementNumber)
  if (data.effectiveDate) meta.push(`Effective ${formatDate(data.effectiveDate)}`)
  if (meta.length) children.push(p(meta.join('  ·  '), { center: true, size: 18, color: '6B7280' }))
  children.push(p('—', { center: true, color: 'F43F5E' }))

  // Parties
  children.push(p(`This Master Service Agreement is entered into on ${formatDate(data.effectiveDate) || '___'} between:`))
  children.push(p(`PROVIDER: ${data.provider?.name || '[Provider Name]'}`, { bold: true }))
  if (data.provider?.entityTypeLabel) children.push(p(`Entity type: ${data.provider.entityTypeLabel}`))
  if (data.provider?.address) children.push(p(`Address: ${data.provider.address}`))
  if (data.provider?.taxId) children.push(p(`Tax ID: ${data.provider.taxId}`))

  children.push(p(''))
  children.push(p(`CLIENT: ${data.client?.name || '[Client Name]'}`, { bold: true }))
  if (data.client?.entityTypeLabel) children.push(p(`Entity type: ${data.client.entityTypeLabel}`))
  if (data.client?.address) children.push(p(`Address: ${data.client.address}`))
  if (data.client?.taxId) children.push(p(`Tax ID: ${data.client.taxId}`))

  children.push(p('(Provider and Client are referred to individually as a "Party" and collectively as the "Parties".)', { italic: true }))

  let n = 1
  const sec = (title) => heading(`${n++}. ${title}`)

  // SERVICES
  children.push(sec('SERVICES'))
  children.push(p(data.servicesDescription
    || 'Provider shall provide professional services to Client as described in this Agreement and as further specified in one or more Statements of Work ("SoWs") executed by the Parties from time to time. Each SoW shall be incorporated into and form part of this Agreement upon execution by both Parties.'))
  children.push(p('In the event of any conflict between this Agreement and a SoW, this Agreement shall prevail, except where the SoW expressly states an intent to modify a specific provision of this Agreement.'))

  // SoW
  if (data.includeSoW) {
    children.push(sec('STATEMENT OF WORK'))
    if (data.sowTitle) children.push(p(data.sowTitle, { bold: true }))
    if (data.sowSummary) children.push(p(data.sowSummary))
    if ((data.sowDeliverables || []).length > 0) {
      children.push(p('Deliverables:', { bold: true }))
      for (const d of data.sowDeliverables) children.push(bullet(d.description || '—'))
    }
    if (data.sowStartDate || data.sowEndDate) {
      const dates = []
      if (data.sowStartDate) dates.push(`Start: ${formatDate(data.sowStartDate)}`)
      if (data.sowEndDate)   dates.push(`Target completion: ${formatDate(data.sowEndDate)}`)
      children.push(p(`Timeline — ${dates.join('  ·  ')}.`))
    }
    if ((data.sowMilestones || []).length > 0) {
      children.push(p('Milestones:', { bold: true }))
      for (const m of data.sowMilestones) {
        const due = m.dueDate ? ` (due ${formatDate(m.dueDate)})` : ''
        children.push(bullet(`${m.description || 'Milestone'}${due}: ${cur.code} ${formatNumber(Number(m.amount) || 0)}`))
      }
    }
  }

  // Term
  children.push(sec('TERM AND TERMINATION'))
  const noticeDays = Number(data.noticePeriodDays) || 30
  if (data.termType === 'ongoing') {
    children.push(p(`This Agreement commences on ${formatDate(data.startDate) || '___'} and continues on a rolling basis until terminated by either Party upon ${noticeDays} days' written notice. Individual SoWs may be terminated independently under the same notice period.`))
  } else {
    children.push(p(`This Agreement commences on ${formatDate(data.startDate) || '___'} and continues until ${formatDate(data.endDate) || '___'} (the "Term"). Either Party may terminate this Agreement or any SoW upon ${noticeDays} days' written notice.`))
  }

  // Compensation
  children.push(sec('FEES AND PAYMENT'))
  let feeText
  switch (fee.id) {
    case 'fixed':     feeText = `Client shall pay Provider the fixed fees set out in each applicable SoW for the Services rendered thereunder.`; break
    case 'hourly':    feeText = `Client shall pay Provider an hourly rate of ${cur.code} ${formatNumber(Number(data.feeAmount) || 0)} per hour for time spent on the Services.`; break
    case 'retainer':  feeText = `Client shall pay Provider a monthly retainer of ${cur.code} ${formatNumber(Number(data.feeAmount) || 0)}, invoiced on the first business day of each month.`; break
    case 'milestone': feeText = `Client shall pay Provider on a milestone basis as set out in each SoW. The aggregate SoW value at execution is ${cur.code} ${formatNumber(computeMilestoneTotal(data.sowMilestones))}.`; break
    default: feeText = `Client shall pay Provider as set out in each applicable SoW.`
  }
  children.push(p(feeText))
  children.push(p(`Payment terms: ${term.label}. Invoices shall be settled within ${term.days} days of issuance.`))
  if (data.expensesReimbursable) {
    children.push(p('Client shall reimburse Provider for reasonable, pre-approved out-of-pocket expenses, supported by receipts.'))
  }

  if (data.includeServiceLevels) {
    children.push(sec('SERVICE LEVELS'))
    children.push(p(data.serviceLevelDescription
      || 'Provider shall perform the Services in a professional, workmanlike manner consistent with industry standards. Specific service levels (response times, availability, deliverable quality) shall be set out in each SoW.'))
  }

  if (data.includeChangeOrders) {
    children.push(sec('CHANGE ORDERS'))
    children.push(p('Either Party may request changes by submitting a written change request. Provider shall provide an impact assessment within 5 business days. No change shall be binding until documented in a written change order signed by both Parties.'))
  }

  if (data.includeIP) {
    children.push(sec('INTELLECTUAL PROPERTY'))
    if (ip.id === 'client') {
      children.push(p('Upon full payment of all fees due under the applicable SoW, all intellectual property rights in the deliverables created for Client under that SoW shall be assigned to and owned by Client. Provider retains the right to use generic skills, know-how, and techniques developed in providing the Services.'))
    } else if (ip.id === 'provider') {
      children.push(p('Provider retains all intellectual property rights in the Work Product. Provider grants Client a perpetual, worldwide, non-exclusive, royalty-free licence to use the Work Product for Client\'s internal business purposes.'))
    } else {
      children.push(p('The Parties shall jointly own the intellectual property rights in the Work Product. Each Party shall have the right to use, license, and modify the Work Product without further consent from the other Party.'))
    }
    children.push(p('Each Party retains all pre-existing intellectual property brought to the engagement.'))
  }

  if (data.includeConfidentiality) {
    children.push(sec('CONFIDENTIALITY'))
    const years = Number(data.confidentialityYears) || 3
    children.push(p(`Each Party shall hold all Confidential Information disclosed by the other Party in strict confidence. This obligation shall survive termination for ${years} year${years === 1 ? '' : 's'}.`))
  }

  if (data.includeWarranties) {
    children.push(sec('WARRANTIES AND REPRESENTATIONS'))
    children.push(p('Provider warrants that the Services shall be performed in a professional, workmanlike manner consistent with industry standards and shall not knowingly infringe any third-party intellectual property rights.'))
  }

  if (data.includeLiabilityCap) {
    children.push(sec('LIMITATION OF LIABILITY'))
    const cap = Number(data.liabilityCapMultiple) || 1
    children.push(p(`TO THE MAXIMUM EXTENT PERMITTED BY LAW, EACH PARTY'S AGGREGATE LIABILITY SHALL NOT EXCEED ${cap === 1 ? 'THE TOTAL FEES PAID OR PAYABLE UNDER THE APPLICABLE SoW IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM' : `${cap} TIMES THE TOTAL FEES PAID OR PAYABLE UNDER THE APPLICABLE SoW IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM`}. NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.`))
  }

  if (data.includeIndemnification) {
    children.push(sec('INDEMNIFICATION'))
    children.push(p('Each Party shall indemnify the other against third-party claims arising from breach, gross negligence, willful misconduct, or violation of applicable law.'))
  }

  children.push(sec('GOVERNING LAW AND DISPUTE RESOLUTION'))
  const law = data.governingLaw || '[State / Country]'
  let lawText = `This Agreement shall be governed by the laws of ${law}.`
  if (dispute.id === 'arbitration') lawText += ' Disputes shall be finally resolved by binding arbitration.'
  else if (dispute.id === 'mediation') lawText += ' Disputes shall first be addressed through mediation, then binding arbitration.'
  else lawText += ` The Parties submit to the exclusive jurisdiction of the courts of ${law}.`
  children.push(p(lawText))

  if ((data.customClauses || []).length > 0) {
    for (const c of data.customClauses) {
      children.push(sec((c.title || 'Additional Terms').toUpperCase()))
      children.push(p(c.body || ''))
    }
  }

  children.push(sec('GENERAL PROVISIONS'))
  children.push(p('This Agreement, together with all SoWs executed hereunder, constitutes the entire understanding between the Parties. It may only be amended in writing signed by both Parties.'))

  // Signatures
  children.push(p(''))
  children.push(p('IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.', { center: true, bold: true, color: '6B7280' }))
  children.push(p(''))

  children.push(p('PROVIDER', { bold: true, color: '6B7280' }))
  children.push(p('Signature: ____________________________________'))
  children.push(p(`Name: ${data.provider?.signatoryName || data.provider?.name || '________________________'}`, { bold: true }))
  children.push(p(`Title: ${data.provider?.signatoryTitle || 'Title'}`))
  children.push(p('Date: ____________________'))

  children.push(p(''))
  children.push(p('CLIENT', { bold: true, color: '6B7280' }))
  children.push(p('Signature: ____________________________________'))
  children.push(p(`Name: ${data.client?.signatoryName || data.client?.name || '________________________'}`, { bold: true }))
  children.push(p(`Title: ${data.client?.signatoryTitle || 'Title'}`))
  children.push(p('Date: ____________________'))

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const fileName = `${(data.agreementTitle || 'service-agreement').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-msa.docx`
  saveAs(blob, fileName)
}
