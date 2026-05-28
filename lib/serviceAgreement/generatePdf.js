import jsPDF from 'jspdf'
import {
  findCurrency, formatNumber, formatDate,
  findFeeStructure, findPaymentTerm, findIpOwnership, findDisputeRes,
  computeMilestoneTotal,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generateServiceAgreementPdf(data) → triggers a download            */
/* ------------------------------------------------------------------ */

const MARGIN = 56
const PAGE_W = 595.28
const PAGE_H = 841.89

const C_INK_950 = [10, 10, 9]
const C_INK_700 = [80, 80, 76]
const C_INK_500 = [130, 130, 124]
const C_LINE    = [220, 218, 212]
const C_CONTRACT = [244, 63, 94]

const BODY_FONT_SIZE = 10
const BODY_LINE_H = 13
const SECTION_FONT_SIZE = 11
const SECTION_LINE_H = 16

export function generateServiceAgreementPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = findCurrency(data.feeCurrency || 'USD')
  const fee = findFeeStructure(data.feeStructure)
  const term = findPaymentTerm(data.paymentTermsId)
  const ip = findIpOwnership(data.ipOwnership)
  const dispute = findDisputeRes(data.disputeResolution)

  let y = MARGIN

  // ============== TITLE BLOCK ==============

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C_INK_500)
  doc.text('MASTER SERVICE AGREEMENT', PAGE_W / 2, y, { align: 'center' })
  y += 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.agreementTitle || 'Master Service Agreement', PAGE_W / 2, y + 14, { align: 'center' })
  y += 30

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.agreementNumber) meta.push(data.agreementNumber)
  if (data.effectiveDate) meta.push(`Effective ${formatDate(data.effectiveDate)}`)
  if (meta.length) doc.text(meta.join('  ·  '), PAGE_W / 2, y, { align: 'center' })
  y += 8

  doc.setDrawColor(...C_CONTRACT)
  doc.setLineWidth(1.5)
  doc.line(PAGE_W / 2 - 24, y + 8, PAGE_W / 2 + 24, y + 8)
  y += 24

  // ============== PARTIES ==============

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_700)
  const partiesIntro = `This Master Service Agreement (the "Agreement") is entered into on ${formatDate(data.effectiveDate) || '___'} between:`
  y = drawWrapped(doc, partiesIntro, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_950)
  doc.text(`PROVIDER: ${data.provider?.name || '[Provider Name]'}`, MARGIN, y)
  y += BODY_LINE_H
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C_INK_700)
  if (data.provider?.entityTypeLabel) y = drawWrapped(doc, `Entity type: ${data.provider.entityTypeLabel}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  if (data.provider?.address) y = drawWrapped(doc, `Address: ${data.provider.address}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  if (data.provider?.taxId) y = drawWrapped(doc, `Tax ID: ${data.provider.taxId}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_950)
  doc.text(`CLIENT: ${data.client?.name || '[Client Name]'}`, MARGIN, y)
  y += BODY_LINE_H
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C_INK_700)
  if (data.client?.entityTypeLabel) y = drawWrapped(doc, `Entity type: ${data.client.entityTypeLabel}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  if (data.client?.address) y = drawWrapped(doc, `Address: ${data.client.address}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  if (data.client?.taxId) y = drawWrapped(doc, `Tax ID: ${data.client.taxId}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_700)
  y = drawWrapped(doc,
    '(Provider and Client are referred to individually as a "Party" and collectively as the "Parties".)',
    MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H, { italic: true })
  y += 14

  let sectionN = 1
  const drawSectionHeading = (title) => {
    y = ensureSpace(doc, y, 36)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(SECTION_FONT_SIZE)
    doc.setTextColor(...C_CONTRACT)
    doc.text(`${sectionN}.`, MARGIN, y)
    doc.setTextColor(...C_INK_950)
    doc.text(title, MARGIN + 20, y)
    sectionN += 1
    y += SECTION_LINE_H + 2
  }

  const drawBody = (text) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_700)
    y = drawWrapped(doc, text, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
    y += 6
  }

  const drawBullet = (text) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_FONT_SIZE)
    doc.setTextColor(...C_INK_700)
    y = ensureSpace(doc, y, BODY_LINE_H + 2)
    doc.text('•', MARGIN + 16, y)
    y = drawWrapped(doc, text, MARGIN + 28, y, PAGE_W - MARGIN * 2 - 28, BODY_LINE_H)
    y += 2
  }

  // ============== SERVICES ==============

  drawSectionHeading('SERVICES')
  drawBody(data.servicesDescription
    || 'Provider shall provide professional services to Client as described in this Agreement and as further specified in one or more Statements of Work ("SoWs") executed by the Parties from time to time. Each SoW shall be incorporated into and form part of this Agreement upon execution by both Parties.')
  drawBody('In the event of any conflict between this Agreement and a SoW, this Agreement shall prevail, except where the SoW expressly states an intent to modify a specific provision of this Agreement.')

  // ============== OPTIONAL: SoW ==============

  if (data.includeSoW) {
    drawSectionHeading('STATEMENT OF WORK')
    if (data.sowTitle) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(BODY_FONT_SIZE)
      doc.setTextColor(...C_INK_950)
      y = ensureSpace(doc, y, BODY_LINE_H + 4)
      doc.text(data.sowTitle, MARGIN, y)
      y += BODY_LINE_H + 2
    }
    if (data.sowSummary) {
      drawBody(data.sowSummary)
    }

    if ((data.sowDeliverables || []).length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(BODY_FONT_SIZE)
      doc.setTextColor(...C_INK_950)
      y = ensureSpace(doc, y, BODY_LINE_H + 4)
      doc.text('Deliverables:', MARGIN, y)
      y += BODY_LINE_H + 2
      for (const d of data.sowDeliverables) drawBullet(d.description || '—')
      y += 4
    }

    if (data.sowStartDate || data.sowEndDate) {
      const dates = []
      if (data.sowStartDate) dates.push(`Start: ${formatDate(data.sowStartDate)}`)
      if (data.sowEndDate)   dates.push(`Target completion: ${formatDate(data.sowEndDate)}`)
      drawBody(`Timeline — ${dates.join('  ·  ')}.`)
    }

    if ((data.sowMilestones || []).length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(BODY_FONT_SIZE)
      doc.setTextColor(...C_INK_950)
      y = ensureSpace(doc, y, BODY_LINE_H + 4)
      doc.text('Milestones:', MARGIN, y)
      y += BODY_LINE_H + 2
      for (const m of data.sowMilestones) {
        const due = m.dueDate ? ` (due ${formatDate(m.dueDate)})` : ''
        drawBullet(`${m.description || 'Milestone'}${due}: ${cur.code} ${formatNumber(Number(m.amount) || 0)}`)
      }
      y += 4
    }
  }

  // ============== TERM ==============

  drawSectionHeading('TERM AND TERMINATION')
  const termType = data.termType || 'fixed'
  const noticeDays = Number(data.noticePeriodDays) || 30
  let termBody
  if (termType === 'fixed') {
    termBody = `This Agreement commences on ${formatDate(data.startDate) || '___'} and continues until ${formatDate(data.endDate) || '___'} (the "Term"), unless terminated earlier in accordance with this Section. Either Party may terminate this Agreement or any SoW upon ${noticeDays} days' written notice. Termination shall not affect any rights or obligations accrued prior to the effective date of termination.`
  } else {
    termBody = `This Agreement commences on ${formatDate(data.startDate) || '___'} and continues on a rolling basis until terminated by either Party upon ${noticeDays} days' written notice. Individual SoWs may be terminated independently under the same notice period. Termination shall not affect any rights or obligations accrued prior to the effective date of termination.`
  }
  drawBody(termBody)

  // ============== COMPENSATION ==============

  drawSectionHeading('FEES AND PAYMENT')
  let feeText
  switch (fee.id) {
    case 'fixed':
      feeText = `Client shall pay Provider the fixed fees set out in each applicable SoW for the Services rendered thereunder.`
      break
    case 'hourly':
      feeText = `Client shall pay Provider an hourly rate of ${cur.code} ${formatNumber(Number(data.feeAmount) || 0)} per hour for time spent on the Services. Provider shall maintain accurate time records and submit them with each invoice.`
      break
    case 'retainer':
      feeText = `Client shall pay Provider a monthly retainer of ${cur.code} ${formatNumber(Number(data.feeAmount) || 0)}, invoiced on the first business day of each month and covering the Services described in the active SoWs.`
      break
    case 'milestone':
      feeText = `Client shall pay Provider on a milestone basis as set out in each SoW. The aggregate SoW value under this Agreement at execution is ${cur.code} ${formatNumber(computeMilestoneTotal(data.sowMilestones))}.`
      break
    default:
      feeText = `Client shall pay Provider as set out in each applicable SoW.`
  }
  drawBody(feeText)
  drawBody(`Payment terms: ${term.label}. Invoices shall be settled within ${term.days} days of issuance. Late payments shall accrue interest at the statutory rate (or 1.5% per month, whichever is lower) from the due date until paid in full.`)
  if (data.expensesReimbursable) {
    drawBody('Client shall reimburse Provider for reasonable, pre-approved out-of-pocket expenses incurred in the performance of the Services, supported by receipts.')
  }

  // ============== OPTIONAL: SERVICE LEVELS ==============

  if (data.includeServiceLevels) {
    drawSectionHeading('SERVICE LEVELS')
    drawBody(data.serviceLevelDescription
      || 'Provider shall perform the Services in a professional, workmanlike manner consistent with industry standards. Specific service levels (response times, availability, deliverable quality) shall be set out in each SoW. Failure to meet a specified service level shall be subject to the remedies stated in the relevant SoW.')
  }

  // ============== OPTIONAL: CHANGE ORDERS ==============

  if (data.includeChangeOrders) {
    drawSectionHeading('CHANGE ORDERS')
    drawBody('Either Party may request changes to the scope, timeline, or fees of any SoW by submitting a written change request. Provider shall, within five (5) business days, provide an assessment of the impact on scope, timeline, and fees. No change shall be binding until documented in a written change order signed by authorized representatives of both Parties. Provider shall not be obligated to perform work outside the agreed scope without an executed change order.')
  }

  // ============== OPTIONAL: IP ==============

  if (data.includeIP) {
    drawSectionHeading('INTELLECTUAL PROPERTY')
    let ipText
    if (ip.id === 'client') {
      ipText = `Upon full payment of all fees due under the applicable SoW, all intellectual property rights in the deliverables created for Client under that SoW (the "Work Product") shall be assigned to and owned by Client. Provider retains the right to use generic skills, know-how, and techniques developed in providing the Services. Provider may include Client's name and a non-confidential description of the Work Product in Provider's portfolio for marketing purposes.`
    } else if (ip.id === 'provider') {
      ipText = `Provider retains all intellectual property rights in the Work Product. Provider grants Client a perpetual, worldwide, non-exclusive, royalty-free licence to use the Work Product for Client's internal business purposes. Client shall not sublicense or resell the Work Product without Provider's prior written consent.`
    } else {
      ipText = `The Parties shall jointly own the intellectual property rights in the Work Product. Each Party shall have the right to use, license, and modify the Work Product without further consent from or accounting to the other Party.`
    }
    drawBody(ipText)
    drawBody('Each Party retains all pre-existing intellectual property brought to the engagement (the "Background IP"). No licence to Background IP is granted except as expressly set out herein or in an applicable SoW.')
  }

  // ============== OPTIONAL: CONFIDENTIALITY ==============

  if (data.includeConfidentiality) {
    drawSectionHeading('CONFIDENTIALITY')
    const years = Number(data.confidentialityYears) || 3
    drawBody(`Each Party (the "Receiving Party") shall hold all Confidential Information disclosed by the other Party (the "Disclosing Party") in strict confidence and shall not disclose it to any third party or use it for any purpose other than performance under this Agreement. "Confidential Information" means all non-public information of a Party, whether marked confidential or not, including business plans, financial information, customer data, technical information, and trade secrets. This obligation shall survive termination of this Agreement for ${years} year${years === 1 ? '' : 's'}.`)
    drawBody('The confidentiality obligations shall not apply to information that: (a) is or becomes publicly known through no fault of the Receiving Party; (b) was rightfully known to the Receiving Party before disclosure; (c) is independently developed without use of the Confidential Information; or (d) is required to be disclosed by law or court order, provided the Receiving Party gives prompt notice to the Disclosing Party.')
  }

  // ============== OPTIONAL: WARRANTIES ==============

  if (data.includeWarranties) {
    drawSectionHeading('WARRANTIES AND REPRESENTATIONS')
    drawBody('Provider represents and warrants that: (a) Provider has the legal authority and capacity to enter into this Agreement; (b) the Services shall be performed in a professional, workmanlike manner consistent with industry standards; (c) the Services and Work Product shall not knowingly infringe the intellectual property rights of any third party; and (d) Provider shall comply with all applicable laws and regulations in performing the Services.')
    drawBody('EXCEPT AS EXPRESSLY SET FORTH HEREIN, PROVIDER MAKES NO OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.')
  }

  // ============== OPTIONAL: LIABILITY ==============

  if (data.includeLiabilityCap) {
    drawSectionHeading('LIMITATION OF LIABILITY')
    const cap = Number(data.liabilityCapMultiple) || 1
    drawBody(`TO THE MAXIMUM EXTENT PERMITTED BY LAW, EACH PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT AND ALL SoWs THEREUNDER SHALL NOT EXCEED ${cap === 1 ? 'THE TOTAL FEES PAID OR PAYABLE BY CLIENT TO PROVIDER UNDER THE APPLICABLE SoW IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM' : `${cap} TIMES THE TOTAL FEES PAID OR PAYABLE BY CLIENT TO PROVIDER UNDER THE APPLICABLE SoW IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM`}. NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, OR BUSINESS INTERRUPTION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.`)
    drawBody('The limitations in this Section shall not apply to liability arising from: (a) a Party\'s gross negligence or willful misconduct; (b) indemnification obligations under this Agreement; or (c) breach of confidentiality obligations.')
  }

  // ============== OPTIONAL: INDEMNIFICATION ==============

  if (data.includeIndemnification) {
    drawSectionHeading('INDEMNIFICATION')
    drawBody('Each Party (the "Indemnifying Party") shall indemnify, defend, and hold harmless the other Party from and against any third-party claims, damages, liabilities, costs, and expenses (including reasonable attorneys\' fees) arising out of: (a) the Indemnifying Party\'s breach of this Agreement; (b) the Indemnifying Party\'s gross negligence or willful misconduct; or (c) the Indemnifying Party\'s violation of applicable law.')
    drawBody('The Indemnified Party shall: (i) promptly notify the Indemnifying Party of any claim; (ii) cooperate reasonably in the defense; and (iii) allow the Indemnifying Party to control the defense and settlement, provided no settlement imposes any obligation on the Indemnified Party without its prior written consent.')
  }

  // ============== GOVERNING LAW ==============

  drawSectionHeading('GOVERNING LAW AND DISPUTE RESOLUTION')
  const law = data.governingLaw || '[State / Country]'
  let lawText = `This Agreement shall be governed by and construed in accordance with the laws of ${law}, without regard to its conflict-of-laws principles.`
  if (dispute.id === 'arbitration') {
    lawText += ' Any dispute, controversy, or claim arising out of or relating to this Agreement shall be finally resolved by binding arbitration administered under the rules of the relevant arbitration authority of the governing jurisdiction. The seat of arbitration shall be the governing jurisdiction. The language of arbitration shall be English.'
  } else if (dispute.id === 'mediation') {
    lawText += ' The Parties shall first attempt to resolve any dispute through good-faith mediation. If the dispute is not resolved within thirty (30) days of written notice of mediation, the dispute shall be finally resolved by binding arbitration in the governing jurisdiction.'
  } else {
    lawText += ` The Parties submit to the exclusive jurisdiction of the courts of ${law} for any dispute, controversy, or claim arising out of or relating to this Agreement.`
  }
  drawBody(lawText)

  // ============== CUSTOM CLAUSES ==============

  if ((data.customClauses || []).length > 0) {
    for (const c of data.customClauses) {
      drawSectionHeading((c.title || 'ADDITIONAL TERMS').toUpperCase())
      drawBody(c.body || '')
    }
  }

  // ============== ENTIRE AGREEMENT ==============

  drawSectionHeading('GENERAL PROVISIONS')
  drawBody('This Agreement, together with all SoWs executed hereunder, constitutes the entire understanding between the Parties with respect to the subject matter and supersedes all prior negotiations, agreements, and understandings. This Agreement may only be amended by a written instrument signed by both Parties. If any provision is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. Neither Party may assign this Agreement without the other Party\'s prior written consent, except to a successor in connection with a merger, acquisition, or sale of substantially all assets.')

  // ============== SIGNATURES ==============

  y += 12
  y = ensureSpace(doc, y, 130)

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  doc.text('IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.', PAGE_W / 2, y, { align: 'center' })
  y += 30

  const colW = (PAGE_W - MARGIN * 2 - 40) / 2
  drawSignatureBlock(doc, MARGIN, y, colW, 'PROVIDER', data.provider)
  drawSignatureBlock(doc, MARGIN + colW + 40, y, colW, 'CLIENT', data.client)

  addPageFooters(doc)

  const fileName = `${(data.agreementTitle || 'service-agreement').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-msa.pdf`
  doc.save(fileName)
}

function drawWrapped(doc, text, x, y, maxW, lineH, opts = {}) {
  if (!text) return y
  doc.setFont('helvetica', opts.italic ? 'italic' : (opts.bold ? 'bold' : 'normal'))
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
  doc.text(party?.signatoryName || party?.name || '________________________', x, y + 70)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_700)
  doc.text(party?.signatoryTitle || 'Title', x, y + 84)

  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.5)
  doc.line(x, y + 102, x + 100, y + 102)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C_INK_500)
  doc.text('Date', x, y + 114)
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage()
    return MARGIN
  }
  return y
}

function addPageFooters(doc) {
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
    doc.text('Generated with Sonchoy · sonchoy.com', MARGIN, footerY + 6)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, footerY + 6, { align: 'right' })
  }
}
