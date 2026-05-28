import jsPDF from 'jspdf'
import {
  formatDate, findNdaType, findTerm,
} from './compute'

/* ------------------------------------------------------------------ */
/*  generateNDAPdf(data) → triggers a download                         */
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

export function generateNDAPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const ndaType = findNdaType(data.type)
  const term = findTerm(data.termId)
  const isMutual = data.type === 'mutual'

  let y = MARGIN

  // ============== TITLE BLOCK ==============

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C_INK_500)
  const headerLabel = isMutual ? 'MUTUAL NON-DISCLOSURE AGREEMENT' : 'NON-DISCLOSURE AGREEMENT'
  doc.text(headerLabel, PAGE_W / 2, y, { align: 'center' })
  y += 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...C_INK_950)
  doc.text(data.ndaTitle || (isMutual ? 'Mutual Non-Disclosure Agreement' : 'Non-Disclosure Agreement'),
    PAGE_W / 2, y + 14, { align: 'center' })
  y += 30

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C_INK_500)
  const meta = []
  if (data.ndaNumber) meta.push(data.ndaNumber)
  if (data.effectiveDate) meta.push(`Effective ${formatDate(data.effectiveDate)}`)
  if (meta.length) doc.text(meta.join('  ·  '), PAGE_W / 2, y, { align: 'center' })
  y += 8

  // Divider
  doc.setDrawColor(...C_CONTRACT)
  doc.setLineWidth(1.5)
  doc.line(PAGE_W / 2 - 24, y + 8, PAGE_W / 2 + 24, y + 8)
  y += 24

  // ============== PARTIES ==============

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_700)
  const partiesIntro = `This Non-Disclosure Agreement (the "Agreement") is entered into on ${formatDate(data.effectiveDate) || '___'} between:`
  y = drawWrapped(doc, partiesIntro, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  y += 8

  const partyALabel = isMutual ? 'PARTY A' : (data.partyA?.role === 'discloser' ? 'DISCLOSING PARTY' : 'RECEIVING PARTY')
  const partyBLabel = isMutual ? 'PARTY B' : (data.partyB?.role === 'discloser' ? 'DISCLOSING PARTY' : 'RECEIVING PARTY')

  // Party A block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_950)
  doc.text(`${partyALabel}: ${data.partyA?.name || '[Party A]'}`, MARGIN, y)
  y += BODY_LINE_H
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C_INK_700)
  if (data.partyA?.entityTypeLabel) {
    y = drawWrapped(doc, `Entity type: ${data.partyA.entityTypeLabel}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  }
  if (data.partyA?.address) {
    y = drawWrapped(doc, `Address: ${data.partyA.address}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  }
  y += 10

  // Party B block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_950)
  doc.text(`${partyBLabel}: ${data.partyB?.name || '[Party B]'}`, MARGIN, y)
  y += BODY_LINE_H
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C_INK_700)
  if (data.partyB?.entityTypeLabel) {
    y = drawWrapped(doc, `Entity type: ${data.partyB.entityTypeLabel}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  }
  if (data.partyB?.address) {
    y = drawWrapped(doc, `Address: ${data.partyB.address}`, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H)
  }
  y += 6

  // Collectively
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor(...C_INK_700)
  const collTxt = isMutual
    ? '(Party A and Party B are each referred to as a "Party" and collectively as the "Parties". Each Party may act as Disclosing Party or Receiving Party from time to time.)'
    : '(The Disclosing Party and Receiving Party are each referred to as a "Party" and collectively as the "Parties".)'
  y = drawWrapped(doc, collTxt, MARGIN, y, PAGE_W - MARGIN * 2, BODY_LINE_H, { italic: true })
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

  // ============== SECTION: PURPOSE ==============

  drawSectionHeading('PURPOSE')
  drawBody(data.purpose
    || 'The Parties wish to explore a potential business relationship (the "Purpose") and, in connection with the Purpose, each may disclose to the other certain Confidential Information that is to be protected under this Agreement.')

  // ============== SECTION: CONFIDENTIAL INFORMATION ==============

  drawSectionHeading('CONFIDENTIAL INFORMATION')
  if (data.confidentialDefinition === 'specific' && (data.specificCategories || []).length > 0) {
    drawBody('"Confidential Information" means the following categories of information, whether disclosed orally, in writing, or by any other means, and whether or not marked as confidential:')
    for (const c of data.specificCategories) {
      drawBullet(c.description || '—')
    }
  } else {
    drawBody('"Confidential Information" means any and all non-public information of a Party (the "Disclosing Party"), whether disclosed orally, in writing, electronically, or by any other means, and whether or not marked as confidential. Confidential Information includes, but is not limited to: business plans, financial information, customer and supplier data, technical and product information, intellectual property, trade secrets, marketing strategies, and any information that a reasonable person would understand to be confidential under the circumstances.')
  }

  // ============== SECTION: OBLIGATIONS ==============

  drawSectionHeading('OBLIGATIONS OF RECEIVING PARTY')
  drawBody('Each Party, when acting as the recipient of Confidential Information (the "Receiving Party"), shall:')
  drawBullet('Hold the Confidential Information in strict confidence and use it solely for the Purpose;')
  drawBullet('Take reasonable measures to protect the Confidential Information, no less stringent than those used to protect its own confidential information of similar importance;')
  drawBullet('Not disclose the Confidential Information to any third party without the Disclosing Party\'s prior written consent;')
  drawBullet('Limit access to the Confidential Information to its employees, contractors, and advisors who have a legitimate need to know and who are bound by written confidentiality obligations at least as protective as this Agreement;')
  drawBullet('Not use the Confidential Information for any purpose other than the Purpose, including for the Receiving Party\'s own benefit or that of any third party;')
  drawBullet('Promptly notify the Disclosing Party in the event of any unauthorized disclosure or use of the Confidential Information.')

  // ============== SECTION: EXCLUSIONS ==============

  drawSectionHeading('EXCLUSIONS')
  drawBody('The obligations in this Agreement shall not apply to information that:')
  drawBullet('Is or becomes publicly known through no fault of the Receiving Party;')
  drawBullet('Was rightfully known to the Receiving Party before disclosure, as evidenced by written records;')
  drawBullet('Is independently developed by the Receiving Party without use of or reference to the Confidential Information;')
  drawBullet('Is rightfully received from a third party who has the right to disclose it and who has not breached any obligation of confidentiality;')
  drawBullet('Is required to be disclosed by law, court order, or regulatory authority, provided the Receiving Party gives prompt notice to the Disclosing Party (where legally permitted) and cooperates with any effort to seek a protective order or other appropriate remedy.')

  if (data.exclusions === 'custom' && (data.customExclusions || []).length > 0) {
    y += 4
    drawBody('Additional exclusions:')
    for (const ex of data.customExclusions) {
      drawBullet(ex.description || '—')
    }
  }

  // ============== SECTION: TERM ==============

  drawSectionHeading('TERM AND DURATION')
  let termTxt
  if (data.termId === 'indefinite') {
    termTxt = `This Agreement shall commence on the Effective Date and continue indefinitely. The Receiving Party's obligations with respect to Confidential Information shall survive until such information is no longer confidential or trade secret, or is publicly disclosed by the Disclosing Party.`
  } else {
    termTxt = `This Agreement shall commence on the Effective Date and continue for a period of ${term.years} (${term.years === 1 ? 'one' : term.years === 2 ? 'two' : term.years === 3 ? 'three' : term.years === 5 ? 'five' : term.years === 7 ? 'seven' : String(term.years)}) year${term.years === 1 ? '' : 's'}.`
    if (data.surviveTermination) {
      termTxt += ` The Receiving Party's confidentiality obligations shall survive termination of this Agreement and continue for the duration of the Term and any extensions thereto.`
    } else {
      termTxt += ` Upon expiration, the Receiving Party\'s obligations shall terminate.`
    }
  }
  drawBody(termTxt)

  // ============== OPTIONAL: RETURN / DESTRUCTION ==============

  if (data.returnRequired || data.destructionAllowed) {
    drawSectionHeading('RETURN OR DESTRUCTION OF MATERIALS')
    if (data.returnRequired && data.destructionAllowed) {
      drawBody('Upon written request by the Disclosing Party, or upon termination or expiration of this Agreement, the Receiving Party shall, at the Disclosing Party\'s election, either (a) return to the Disclosing Party all materials containing Confidential Information, including copies, or (b) destroy such materials and provide written certification of destruction signed by an authorized officer of the Receiving Party.')
    } else if (data.returnRequired) {
      drawBody('Upon written request by the Disclosing Party, or upon termination or expiration of this Agreement, the Receiving Party shall promptly return to the Disclosing Party all materials containing Confidential Information, including all copies.')
    } else {
      drawBody('Upon written request by the Disclosing Party, or upon termination or expiration of this Agreement, the Receiving Party shall destroy all materials containing Confidential Information, including copies, and provide written certification of destruction signed by an authorized officer of the Receiving Party.')
    }
  }

  // ============== OPTIONAL: NON-SOLICIT ==============

  if (data.includeNonSolicit) {
    drawSectionHeading('NON-SOLICITATION')
    drawBody('During the Term and for a period of twelve (12) months thereafter, the Receiving Party shall not, directly or indirectly, solicit for employment or engagement any employee, contractor, or consultant of the Disclosing Party who has been involved in the Purpose, without the Disclosing Party\'s prior written consent. General solicitations not specifically targeted at such persons shall not constitute a breach of this provision.')
  }

  // ============== OPTIONAL: INJUNCTIVE RELIEF ==============

  if (data.includeInjunctiveRelief) {
    drawSectionHeading('REMEDIES AND INJUNCTIVE RELIEF')
    drawBody('The Parties acknowledge that money damages may be inadequate to remedy a breach or threatened breach of this Agreement. Accordingly, the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity, without the need to post a bond. The Receiving Party shall reimburse the Disclosing Party for all reasonable costs and attorneys\' fees incurred in enforcing this Agreement.')
  }

  // ============== GOVERNING LAW ==============

  drawSectionHeading('GOVERNING LAW AND JURISDICTION')
  const law = data.governingLaw || '[State / Country]'
  drawBody(`This Agreement shall be governed by and construed in accordance with the laws of ${law}, without regard to its conflict-of-laws principles. The Parties submit to the exclusive jurisdiction of the courts of ${law} for any dispute, controversy, or claim arising out of or relating to this Agreement.`)

  // ============== ENTIRE AGREEMENT ==============

  drawSectionHeading('GENERAL PROVISIONS')
  drawBody('This Agreement constitutes the entire understanding between the Parties with respect to the subject matter and supersedes all prior negotiations, agreements, and understandings, whether written or oral. This Agreement may only be amended by a written instrument signed by both Parties. No waiver of any provision shall be effective unless in writing. If any provision is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. Neither Party may assign this Agreement without the other Party\'s prior written consent, except to a successor in connection with a merger, acquisition, or sale of substantially all assets.')
  drawBody('Nothing in this Agreement grants the Receiving Party any rights, by license or otherwise, in the Confidential Information except as expressly set forth herein. No agency, partnership, joint venture, or employment relationship is created by this Agreement.')

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
  drawSignatureBlock(doc, MARGIN, y, colW, partyALabel, data.partyA)
  drawSignatureBlock(doc, MARGIN + colW + 40, y, colW, partyBLabel, data.partyB)

  addPageFooters(doc)

  const fileName = `${(data.ndaTitle || 'nda').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-nda.pdf`
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
