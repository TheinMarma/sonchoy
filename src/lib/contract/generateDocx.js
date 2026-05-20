import {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
} from 'docx'
import { saveAs } from 'file-saver'
import {
  findCurrency, formatNumber, formatDate,
  findFeeStructure, findPaymentTerm, findIpOwnership, findDisputeRes,
  computeMilestoneTotal,
} from './compute'

/* Plain block of body text */
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.center ? AlignmentType.CENTER : undefined,
    children: [
      new TextRun({
        text: String(text || ''),
        bold: !!opts.bold,
        italics: !!opts.italic,
        size: opts.size || 20,
        color: opts.color || '1F2937',
      }),
    ],
  })
}

function heading(text, level = HeadingLevel.HEADING_2) {
  return new Paragraph({
    heading: level,
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

export async function generateContractDocx(data) {
  const cur = findCurrency(data.feeCurrency || 'USD')
  const fee = findFeeStructure(data.feeStructure)
  const term = findPaymentTerm(data.paymentTermsId)
  const ip = findIpOwnership(data.ipOwnership)
  const dispute = findDisputeRes(data.disputeResolution)

  const children = []

  // Title
  children.push(p('CLIENT SERVICES AGREEMENT', { center: true, size: 16, color: '6B7280' }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: data.contractTitle || 'Client Services Agreement', bold: true, size: 36 })],
  }))
  const meta = []
  if (data.contractNumber) meta.push(data.contractNumber)
  if (data.effectiveDate) meta.push(`Effective ${formatDate(data.effectiveDate)}`)
  if (meta.length) {
    children.push(p(meta.join('  ·  '), { center: true, size: 18, color: '6B7280' }))
  }
  children.push(p('—', { center: true, color: 'F43F5E' }))

  // Parties
  children.push(p(`This Agreement is entered into on ${formatDate(data.effectiveDate) || '___'} between:`))
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

  // SCOPE
  children.push(sec('SCOPE OF SERVICES'))
  children.push(p(data.scopeSummary || 'Provider shall provide the services described in this Agreement (the "Services") to Client in accordance with the terms set out herein.'))
  if ((data.deliverables || []).length > 0) {
    children.push(p('Deliverables include:', { bold: true }))
    for (const d of data.deliverables) children.push(bullet(d.description || '—'))
  }
  if ((data.exclusions || []).length > 0) {
    children.push(p('Excluded from scope:', { bold: true }))
    for (const ex of data.exclusions) children.push(bullet(ex.description || '—'))
  }

  // TERM
  children.push(sec('TERM AND TERMINATION'))
  const noticeDays = Number(data.noticePeriodDays) || 30
  if (data.termType === 'ongoing') {
    children.push(p(`This Agreement commences on ${formatDate(data.startDate) || '___'} and continues on a rolling basis until terminated by either Party upon ${noticeDays} days' written notice. Termination shall not affect any rights or obligations accrued prior to the effective date of termination.`))
  } else {
    children.push(p(`This Agreement commences on ${formatDate(data.startDate) || '___'} and continues until ${formatDate(data.endDate) || '___'} (the "Term"), unless terminated earlier in accordance with this Section. Either Party may terminate this Agreement upon ${noticeDays} days' written notice. Termination shall not affect any rights or obligations accrued prior to the effective date of termination.`))
  }

  // COMPENSATION
  children.push(sec('COMPENSATION AND PAYMENT'))
  let feeText
  switch (fee.id) {
    case 'fixed':
      feeText = `Client shall pay Provider a fixed fee of ${cur.code} ${formatNumber(Number(data.feeAmount) || 0)} for the Services described in Section 1.`
      break
    case 'hourly':
      feeText = `Client shall pay Provider an hourly rate of ${cur.code} ${formatNumber(Number(data.feeAmount) || 0)} per hour. Provider shall maintain accurate time records and submit them with each invoice.`
      break
    case 'retainer':
      feeText = `Client shall pay Provider a monthly retainer of ${cur.code} ${formatNumber(Number(data.feeAmount) || 0)}, invoiced on the first business day of each month.`
      break
    case 'milestone':
      feeText = `Client shall pay Provider on a milestone basis as set out below, for an aggregate amount of ${cur.code} ${formatNumber(computeMilestoneTotal(data.milestones))}.`
      break
    default:
      feeText = `Client shall pay Provider as set out in this Agreement.`
  }
  children.push(p(feeText))

  if (fee.id === 'milestone' && (data.milestones || []).length > 0) {
    for (const m of data.milestones) {
      const due = m.dueDate ? ` (due ${formatDate(m.dueDate)})` : ''
      children.push(bullet(`${m.description || 'Milestone'}${due}: ${cur.code} ${formatNumber(Number(m.amount) || 0)}`))
    }
  }

  children.push(p(`Payment terms: ${term.label}. Invoices shall be settled within ${term.days} days of issuance. Late payments shall accrue interest at the statutory rate (or 1.5% per month, whichever is lower).`))
  if (data.expensesReimbursable) {
    children.push(p('Client shall reimburse Provider for reasonable, pre-approved out-of-pocket expenses incurred in the performance of the Services, supported by receipts.'))
  }

  // IP
  if (data.includeIP) {
    children.push(sec('INTELLECTUAL PROPERTY'))
    if (ip.id === 'client') {
      children.push(p('Upon full payment of all fees due under this Agreement, all intellectual property rights in the deliverables created for Client under this Agreement (the "Work Product") shall be assigned to and owned by Client. Provider retains the right to use generic skills, know-how, and techniques developed in providing the Services. Provider may include Client\'s name and a non-confidential description of the Work Product in Provider\'s portfolio for marketing purposes.'))
    } else if (ip.id === 'provider') {
      children.push(p('Provider retains all intellectual property rights in the Work Product. Provider grants Client a perpetual, worldwide, non-exclusive, royalty-free licence to use the Work Product for Client\'s internal business purposes. Client shall not sublicense or resell the Work Product without Provider\'s prior written consent.'))
    } else {
      children.push(p('The Parties shall jointly own the intellectual property rights in the Work Product. Each Party shall have the right to use, license, and modify the Work Product without further consent from or accounting to the other Party.'))
    }
  }

  // Confidentiality
  if (data.includeConfidentiality) {
    children.push(sec('CONFIDENTIALITY'))
    const years = Number(data.confidentialityYears) || 3
    children.push(p(`Each Party (the "Receiving Party") shall hold all Confidential Information disclosed by the other Party (the "Disclosing Party") in strict confidence and shall not disclose it to any third party or use it for any purpose other than performance under this Agreement. "Confidential Information" means all non-public information of a Party, whether marked confidential or not, including business plans, financial information, customer data, technical information, and trade secrets. This obligation shall survive termination of this Agreement for ${years} year${years === 1 ? '' : 's'}.`))
    children.push(p('The confidentiality obligations shall not apply to information that: (a) is or becomes publicly known through no fault of the Receiving Party; (b) was rightfully known to the Receiving Party before disclosure; (c) is independently developed without use of the Confidential Information; or (d) is required to be disclosed by law or court order, provided the Receiving Party gives prompt notice to the Disclosing Party.'))
  }

  if (data.includeNonCompete) {
    children.push(sec('NON-COMPETE AND NON-SOLICITATION'))
    children.push(p('During the Term and for a period of twelve (12) months following termination, Provider shall not directly or indirectly solicit employees or contractors of Client for employment or engagement, nor shall Provider knowingly accept work from any party introduced to Provider by Client during the Term where such work directly competes with Client\'s business as conducted during the Term.'))
  }

  if (data.includeWarranties) {
    children.push(sec('WARRANTIES AND REPRESENTATIONS'))
    children.push(p('Provider represents and warrants that: (a) Provider has the legal authority and capacity to enter into this Agreement; (b) the Services shall be performed in a professional, workmanlike manner consistent with industry standards; (c) the Services and Work Product shall not knowingly infringe the intellectual property rights of any third party; and (d) Provider shall comply with all applicable laws and regulations in performing the Services.'))
    children.push(p('EXCEPT AS EXPRESSLY SET FORTH HEREIN, PROVIDER MAKES NO OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.'))
  }

  if (data.includeLiabilityCap) {
    children.push(sec('LIMITATION OF LIABILITY'))
    const cap = Number(data.liabilityCapMultiple) || 1
    children.push(p(`TO THE MAXIMUM EXTENT PERMITTED BY LAW, EACH PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT SHALL NOT EXCEED ${cap === 1 ? 'THE TOTAL FEES PAID OR PAYABLE BY CLIENT TO PROVIDER UNDER THIS AGREEMENT' : `${cap} TIMES THE TOTAL FEES PAID OR PAYABLE BY CLIENT TO PROVIDER UNDER THIS AGREEMENT`}. NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, OR BUSINESS INTERRUPTION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.`))
    children.push(p('The limitations in this Section shall not apply to liability arising from: (a) a Party\'s gross negligence or willful misconduct; (b) indemnification obligations under this Agreement; or (c) breach of confidentiality obligations.'))
  }

  if (data.includeIndemnification) {
    children.push(sec('INDEMNIFICATION'))
    children.push(p('Each Party (the "Indemnifying Party") shall indemnify, defend, and hold harmless the other Party from and against any third-party claims, damages, liabilities, costs, and expenses (including reasonable attorneys\' fees) arising out of: (a) the Indemnifying Party\'s breach of this Agreement; (b) the Indemnifying Party\'s gross negligence or willful misconduct; or (c) the Indemnifying Party\'s violation of applicable law.'))
    children.push(p('The Indemnified Party shall: (i) promptly notify the Indemnifying Party of any claim; (ii) cooperate reasonably in the defense; and (iii) allow the Indemnifying Party to control the defense and settlement, provided no settlement imposes any obligation on the Indemnified Party without its prior written consent.'))
  }

  children.push(sec('GOVERNING LAW AND DISPUTE RESOLUTION'))
  const law = data.governingLaw || '[State / Country]'
  let lawText = `This Agreement shall be governed by and construed in accordance with the laws of ${law}, without regard to its conflict-of-laws principles.`
  if (dispute.id === 'arbitration') {
    lawText += ' Any dispute, controversy, or claim arising out of or relating to this Agreement shall be finally resolved by binding arbitration administered under the rules of the relevant arbitration authority of the governing jurisdiction. The seat of arbitration shall be the governing jurisdiction. The language of arbitration shall be English.'
  } else if (dispute.id === 'mediation') {
    lawText += ' The Parties shall first attempt to resolve any dispute through good-faith mediation. If the dispute is not resolved within thirty (30) days of written notice of mediation, the dispute shall be finally resolved by binding arbitration in the governing jurisdiction.'
  } else {
    lawText += ` The Parties submit to the exclusive jurisdiction of the courts of ${law} for any dispute, controversy, or claim arising out of or relating to this Agreement.`
  }
  children.push(p(lawText))

  if ((data.customClauses || []).length > 0) {
    for (const c of data.customClauses) {
      children.push(sec((c.title || 'Additional Terms').toUpperCase()))
      children.push(p(c.body || ''))
    }
  }

  children.push(sec('ENTIRE AGREEMENT'))
  children.push(p('This Agreement constitutes the entire understanding between the Parties with respect to the subject matter hereof and supersedes all prior negotiations, agreements, and understandings, whether written or oral. This Agreement may only be amended by a written instrument signed by both Parties. If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.'))

  // Signature blocks
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
  const fileName = `${(data.contractTitle || 'client-contract').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-contract.docx`
  saveAs(blob, fileName)
}
