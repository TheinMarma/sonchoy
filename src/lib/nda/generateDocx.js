import {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
} from 'docx'
import { saveAs } from 'file-saver'
import { formatDate, findNdaType, findTerm } from './compute'

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

export async function generateNDADocx(data) {
  const ndaType = findNdaType(data.type)
  const term = findTerm(data.termId)
  const isMutual = data.type === 'mutual'
  const children = []

  // Title
  children.push(p(isMutual ? 'MUTUAL NON-DISCLOSURE AGREEMENT' : 'NON-DISCLOSURE AGREEMENT',
    { center: true, size: 16, color: '6B7280' }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({
      text: data.ndaTitle || (isMutual ? 'Mutual Non-Disclosure Agreement' : 'Non-Disclosure Agreement'),
      bold: true, size: 36,
    })],
  }))
  const meta = []
  if (data.ndaNumber) meta.push(data.ndaNumber)
  if (data.effectiveDate) meta.push(`Effective ${formatDate(data.effectiveDate)}`)
  if (meta.length) children.push(p(meta.join('  ·  '), { center: true, size: 18, color: '6B7280' }))
  children.push(p('—', { center: true, color: 'F43F5E' }))

  // Parties intro
  children.push(p(`This Non-Disclosure Agreement (the "Agreement") is entered into on ${formatDate(data.effectiveDate) || '___'} between:`))

  const partyALabel = isMutual ? 'PARTY A' : (data.partyA?.role === 'discloser' ? 'DISCLOSING PARTY' : 'RECEIVING PARTY')
  const partyBLabel = isMutual ? 'PARTY B' : (data.partyB?.role === 'discloser' ? 'DISCLOSING PARTY' : 'RECEIVING PARTY')

  children.push(p(`${partyALabel}: ${data.partyA?.name || '[Party A]'}`, { bold: true }))
  if (data.partyA?.entityTypeLabel) children.push(p(`Entity type: ${data.partyA.entityTypeLabel}`))
  if (data.partyA?.address) children.push(p(`Address: ${data.partyA.address}`))
  children.push(p(''))
  children.push(p(`${partyBLabel}: ${data.partyB?.name || '[Party B]'}`, { bold: true }))
  if (data.partyB?.entityTypeLabel) children.push(p(`Entity type: ${data.partyB.entityTypeLabel}`))
  if (data.partyB?.address) children.push(p(`Address: ${data.partyB.address}`))

  children.push(p(isMutual
    ? '(Party A and Party B are each referred to as a "Party" and collectively as the "Parties". Each Party may act as Disclosing Party or Receiving Party from time to time.)'
    : '(The Disclosing Party and Receiving Party are each referred to as a "Party" and collectively as the "Parties".)',
    { italic: true }))

  let n = 1
  const sec = (title) => heading(`${n++}. ${title}`)

  // Purpose
  children.push(sec('PURPOSE'))
  children.push(p(data.purpose
    || 'The Parties wish to explore a potential business relationship (the "Purpose") and, in connection with the Purpose, each may disclose to the other certain Confidential Information that is to be protected under this Agreement.'))

  // Confidential Information
  children.push(sec('CONFIDENTIAL INFORMATION'))
  if (data.confidentialDefinition === 'specific' && (data.specificCategories || []).length > 0) {
    children.push(p('"Confidential Information" means the following categories of information, whether disclosed orally, in writing, or by any other means, and whether or not marked as confidential:'))
    for (const c of data.specificCategories) children.push(bullet(c.description || '—'))
  } else {
    children.push(p('"Confidential Information" means any and all non-public information of a Party (the "Disclosing Party"), whether disclosed orally, in writing, electronically, or by any other means, and whether or not marked as confidential. Confidential Information includes, but is not limited to: business plans, financial information, customer and supplier data, technical and product information, intellectual property, trade secrets, marketing strategies, and any information that a reasonable person would understand to be confidential under the circumstances.'))
  }

  // Obligations
  children.push(sec('OBLIGATIONS OF RECEIVING PARTY'))
  children.push(p('Each Party, when acting as the recipient of Confidential Information (the "Receiving Party"), shall:'))
  children.push(bullet('Hold the Confidential Information in strict confidence and use it solely for the Purpose;'))
  children.push(bullet('Take reasonable measures to protect the Confidential Information, no less stringent than those used to protect its own confidential information of similar importance;'))
  children.push(bullet('Not disclose the Confidential Information to any third party without the Disclosing Party\'s prior written consent;'))
  children.push(bullet('Limit access to the Confidential Information to its employees, contractors, and advisors who have a legitimate need to know and who are bound by written confidentiality obligations at least as protective as this Agreement;'))
  children.push(bullet('Not use the Confidential Information for any purpose other than the Purpose;'))
  children.push(bullet('Promptly notify the Disclosing Party in the event of any unauthorized disclosure or use of the Confidential Information.'))

  // Exclusions
  children.push(sec('EXCLUSIONS'))
  children.push(p('The obligations in this Agreement shall not apply to information that:'))
  children.push(bullet('Is or becomes publicly known through no fault of the Receiving Party;'))
  children.push(bullet('Was rightfully known to the Receiving Party before disclosure, as evidenced by written records;'))
  children.push(bullet('Is independently developed by the Receiving Party without use of or reference to the Confidential Information;'))
  children.push(bullet('Is rightfully received from a third party who has the right to disclose it and who has not breached any obligation of confidentiality;'))
  children.push(bullet('Is required to be disclosed by law, court order, or regulatory authority, provided the Receiving Party gives prompt notice to the Disclosing Party.'))

  if (data.exclusions === 'custom' && (data.customExclusions || []).length > 0) {
    children.push(p('Additional exclusions:'))
    for (const ex of data.customExclusions) children.push(bullet(ex.description || '—'))
  }

  // Term
  children.push(sec('TERM AND DURATION'))
  if (data.termId === 'indefinite') {
    children.push(p('This Agreement shall commence on the Effective Date and continue indefinitely. The Receiving Party\'s obligations with respect to Confidential Information shall survive until such information is no longer confidential or trade secret, or is publicly disclosed by the Disclosing Party.'))
  } else {
    let txt = `This Agreement shall commence on the Effective Date and continue for a period of ${term.years} (${term.years === 1 ? 'one' : term.years === 2 ? 'two' : term.years === 3 ? 'three' : term.years === 5 ? 'five' : term.years === 7 ? 'seven' : String(term.years)}) year${term.years === 1 ? '' : 's'}.`
    if (data.surviveTermination) txt += ' The Receiving Party\'s confidentiality obligations shall survive termination of this Agreement.'
    children.push(p(txt))
  }

  if (data.returnRequired || data.destructionAllowed) {
    children.push(sec('RETURN OR DESTRUCTION OF MATERIALS'))
    if (data.returnRequired && data.destructionAllowed) {
      children.push(p('Upon written request by the Disclosing Party, or upon termination of this Agreement, the Receiving Party shall, at the Disclosing Party\'s election, either return all materials containing Confidential Information or destroy them and provide written certification of destruction.'))
    } else if (data.returnRequired) {
      children.push(p('Upon written request by the Disclosing Party, or upon termination of this Agreement, the Receiving Party shall return all materials containing Confidential Information, including all copies.'))
    } else {
      children.push(p('Upon written request by the Disclosing Party, or upon termination of this Agreement, the Receiving Party shall destroy all materials containing Confidential Information and provide written certification of destruction.'))
    }
  }

  if (data.includeNonSolicit) {
    children.push(sec('NON-SOLICITATION'))
    children.push(p('During the Term and for a period of twelve (12) months thereafter, the Receiving Party shall not, directly or indirectly, solicit for employment any employee, contractor, or consultant of the Disclosing Party who has been involved in the Purpose, without the Disclosing Party\'s prior written consent. General solicitations not specifically targeted at such persons shall not constitute a breach of this provision.'))
  }

  if (data.includeInjunctiveRelief) {
    children.push(sec('REMEDIES AND INJUNCTIVE RELIEF'))
    children.push(p('The Parties acknowledge that money damages may be inadequate to remedy a breach. Accordingly, the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.'))
  }

  children.push(sec('GOVERNING LAW AND JURISDICTION'))
  const law = data.governingLaw || '[State / Country]'
  children.push(p(`This Agreement shall be governed by the laws of ${law}, without regard to its conflict-of-laws principles. The Parties submit to the exclusive jurisdiction of the courts of ${law}.`))

  children.push(sec('GENERAL PROVISIONS'))
  children.push(p('This Agreement constitutes the entire understanding between the Parties with respect to the subject matter and supersedes all prior negotiations. It may only be amended in writing signed by both Parties. If any provision is invalid, the remainder shall continue in full force.'))

  // Signatures
  children.push(p(''))
  children.push(p('IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.', { center: true, bold: true, color: '6B7280' }))
  children.push(p(''))

  children.push(p(partyALabel, { bold: true, color: '6B7280' }))
  children.push(p('Signature: ____________________________________'))
  children.push(p(`Name: ${data.partyA?.signatoryName || data.partyA?.name || '________________________'}`, { bold: true }))
  children.push(p(`Title: ${data.partyA?.signatoryTitle || 'Title'}`))
  children.push(p('Date: ____________________'))
  children.push(p(''))
  children.push(p(partyBLabel, { bold: true, color: '6B7280' }))
  children.push(p('Signature: ____________________________________'))
  children.push(p(`Name: ${data.partyB?.signatoryName || data.partyB?.name || '________________________'}`, { bold: true }))
  children.push(p(`Title: ${data.partyB?.signatoryTitle || 'Title'}`))
  children.push(p('Date: ____________________'))

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const fileName = `${(data.ndaTitle || 'nda').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-nda.docx`
  saveAs(blob, fileName)
}
