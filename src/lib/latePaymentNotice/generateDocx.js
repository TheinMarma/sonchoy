import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx'
import { saveAs } from 'file-saver'
import {
  findCurrency, formatNumber, formatDate,
  findPurpose, findSignOff,
  computeNotice,
} from './compute'

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.spacing || 120 },
    alignment: opts.center ? AlignmentType.CENTER : (opts.right ? AlignmentType.RIGHT : undefined),
    children: [new TextRun({
      text: String(text || ''),
      bold: !!opts.bold,
      italics: !!opts.italic,
      size: opts.size || 22,
      color: opts.color || '1F2937',
    })],
  })
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 50, type: WidthType.PERCENTAGE },
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

const PURPOSE_HEX = {
  'demand':     'D97706',
  'pre-action': 'F43F5E',
  'final':      'DC2626',
}

export async function generateLatePaymentNoticeDocx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findPurpose(data.purposeId)
  const signOff = findSignOff(data.signOffId)
  const c = computeNotice(data)
  const accent = PURPOSE_HEX[purpose.id] || 'F43F5E'

  const children = []

  // Letterhead
  children.push(p(data.sender?.name || '[Your Company]', { bold: true, size: 28 }))
  if (data.sender?.address) children.push(p(data.sender.address, { size: 18, color: '6B7280' }))
  const contactLine = [data.sender?.email, data.sender?.phone].filter(Boolean).join('  ·  ')
  if (contactLine) children.push(p(contactLine, { size: 18, color: '6B7280' }))

  children.push(p(''))
  children.push(p(purpose.label.toUpperCase(), { bold: true, color: accent, size: 18 }))
  children.push(p(formatDate(data.noticeDate), { size: 18, color: '6B7280' }))
  if (data.noticeReference) children.push(p(`Ref: ${data.noticeReference}`, { size: 18, color: '6B7280' }))
  children.push(p(''))

  // Title
  children.push(p('FORMAL NOTICE OF LATE PAYMENT', { bold: true, size: 30, color: accent }))
  children.push(p(`Issued under: ${c.framework.reference}`, { italic: true, size: 18, color: '6B7280' }))
  children.push(p(''))

  // To block
  children.push(p('TO', { bold: true, size: 16, color: '6B7280' }))
  children.push(p(data.debtor?.name || '[Debtor name]', { bold: true, size: 24 }))
  if (data.debtor?.address)       children.push(p(data.debtor.address))
  if (data.debtor?.companyNumber) children.push(p(`Company no.: ${data.debtor.companyNumber}`))
  if (data.debtor?.email)         children.push(p(data.debtor.email))
  children.push(p(''))

  // Opening
  const dearLine = data.debtor?.contactName ? `Dear ${data.debtor.contactName},` : 'Dear Sir / Madam,'
  children.push(p(dearLine))

  const opening = purpose.id === 'final'
    ? `We refer to invoice ${data.invoiceNumber || ''} (the "Invoice") issued by ${data.sender?.name || 'us'} to ${data.debtor?.name || 'you'} on ${formatDate(data.invoiceDate) || '[invoice date]'} for the sum of ${cur.code} ${formatNumber(c.principal)} in respect of ${data.contractDescription || 'goods supplied / services rendered'}. The Invoice fell due for payment on ${formatDate(data.dueDate) || '[due date]'} and remains unpaid notwithstanding our previous demands. This letter constitutes a final statutory demand for payment.`
    : purpose.id === 'pre-action'
      ? `We refer to invoice ${data.invoiceNumber || ''} (the "Invoice") issued by ${data.sender?.name || 'us'} to ${data.debtor?.name || 'you'} on ${formatDate(data.invoiceDate) || '[invoice date]'} for the sum of ${cur.code} ${formatNumber(c.principal)} in respect of ${data.contractDescription || 'goods supplied / services rendered'}. The Invoice fell due for payment on ${formatDate(data.dueDate) || '[due date]'} and remains unpaid. We write to formally place you on notice of this debt prior to commencing recovery proceedings.`
      : `We refer to invoice ${data.invoiceNumber || ''} (the "Invoice") issued by ${data.sender?.name || 'us'} to ${data.debtor?.name || 'you'} on ${formatDate(data.invoiceDate) || '[invoice date]'} for the sum of ${cur.code} ${formatNumber(c.principal)} in respect of ${data.contractDescription || 'goods supplied / services rendered'}. The Invoice fell due for payment on ${formatDate(data.dueDate) || '[due date]'} and is now ${c.daysOverdue} day${c.daysOverdue === 1 ? '' : 's'} overdue.`
  children.push(p(opening))

  children.push(p(`Pursuant to ${c.framework.reference}, statutory interest accrues on the unpaid principal at the prescribed rate from the day after the due date until payment is received in cleared funds. The applicable rate is calculated as the ${c.framework.baseRateLabel.toLowerCase()} (currently ${formatNumber(Number(data.baseRatePct) || 0)}%) plus a statutory margin of ${formatNumber(Number(data.marginPct) || 0)}%, giving a total rate of ${formatNumber(c.interest.rate)}% per annum.`))

  // Statement of account table
  const includeComp = data.includeCompensation && c.compensation > 0
  const rows = []
  rows.push(new TableRow({
    tableHeader: true,
    children: [
      cell('STATEMENT OF ACCOUNT', { bold: true, width: 60, shading: 'F8F7F3', color: accent }),
      cell(`As at ${formatDate(data.noticeDate)}`, { width: 40, right: true, shading: 'F8F7F3', color: '6B7280' }),
    ],
  }))
  const detailRows = [
    ['Invoice number',  data.invoiceNumber || '—'],
    ['Invoice date',    formatDate(data.invoiceDate) || '—'],
    ['Due date',        formatDate(data.dueDate) || '—'],
    ['Days overdue',    String(c.daysOverdue)],
    ['Principal sum',   `${cur.code} ${formatNumber(c.principal)}`],
    [`Statutory interest @ ${formatNumber(c.interest.rate)}% p.a. (${c.daysOverdue} d)`,
                        `${cur.code} ${formatNumber(c.interest.amount)}`],
  ]
  if (includeComp) {
    detailRows.push([c.framework.compensationLabel,
      `${c.framework.compensationCurrencyLabel || cur.code}${c.framework.compensationCurrencyLabel ? '' : ' '}${formatNumber(c.compensation)}`])
  }
  for (const [k, v] of detailRows) {
    rows.push(new TableRow({
      children: [
        cell(k, { width: 60, color: '6B7280' }),
        cell(v, { width: 40, right: true }),
      ],
    }))
  }
  rows.push(new TableRow({
    children: [
      cell('TOTAL NOW DUE', { width: 60, bold: true, color: accent, size: 24 }),
      cell(`${cur.code} ${formatNumber(c.total)}`, { width: 40, right: true, bold: true, color: accent, size: 24 }),
    ],
  }))
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:     { style: BorderStyle.SINGLE, size: 6, color: 'DCDAD4' },
      bottom:  { style: BorderStyle.SINGLE, size: 6, color: 'DCDAD4' },
      left:    { style: BorderStyle.SINGLE, size: 6, color: 'DCDAD4' },
      right:   { style: BorderStyle.SINGLE, size: 6, color: 'DCDAD4' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'EFEDE8' },
      insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: 'EFEDE8' },
    },
    rows,
  }))
  children.push(p(''))

  // Demand paragraph
  const demandPara = purpose.id === 'final'
    ? `WE HEREBY DEMAND payment of the total sum of ${cur.code} ${formatNumber(c.total)} within ${data.deadlineDays || 7} days of the date of this notice, being no later than ${c.deadlineFormatted}. Interest continues to accrue at ${cur.code} ${formatNumber(c.interest.perDay)} per day until payment is received in cleared funds. If payment is not received in full by the deadline, we shall, WITHOUT FURTHER NOTICE, take the following action: (a) commence legal proceedings to recover the debt, together with all interest, statutory compensation, and legal costs; (b) where applicable, present a statutory demand or winding-up petition; and (c) refer the matter to a debt-recovery agency.`
    : purpose.id === 'pre-action'
      ? `Demand is hereby made for payment of the total sum of ${cur.code} ${formatNumber(c.total)} within ${data.deadlineDays || 14} days of the date of this notice, being no later than ${c.deadlineFormatted}. Interest continues to accrue at ${cur.code} ${formatNumber(c.interest.perDay)} per day until payment is received. If full payment is not received by the deadline, we shall be entitled to commence proceedings for recovery without further reference to you, and to claim all interest, statutory compensation, and the reasonable costs of recovery.`
      : `Demand is hereby made for payment of the total sum of ${cur.code} ${formatNumber(c.total)} within ${data.deadlineDays || 14} days of the date of this notice, being no later than ${c.deadlineFormatted}. Interest continues to accrue at ${cur.code} ${formatNumber(c.interest.perDay)} per day until payment is received in cleared funds.`
  children.push(p(demandPara))

  if (data.includeDisputeClause) {
    children.push(p(`If you dispute any part of this debt, you must notify us in writing within ${data.deadlineDays || 14} days of the date of this notice, setting out the precise grounds of the dispute and providing supporting evidence. In the absence of a substantive written response within that period, the debt shall be deemed admitted.`))
  }

  if (data.paymentInstructions) {
    children.push(p('PAYMENT DETAILS', { bold: true, size: 18, color: accent }))
    children.push(p(data.paymentInstructions))
  }

  if (data.includeWithoutPrejudice) {
    children.push(p('This notice is sent without prejudice to any other rights or remedies available to us, all of which are expressly reserved.', { italic: true, color: '6B7280', size: 18 }))
  }

  children.push(p(''))
  children.push(p(`${signOff.label},`))
  children.push(p(''))
  children.push(p(''))
  children.push(p(data.sender?.contactName || '[Authorised signatory]', { bold: true, size: 24 }))
  if (data.sender?.contactTitle) children.push(p(data.sender.contactTitle, { color: '6B7280' }))
  children.push(p(`For and on behalf of ${data.sender?.name || '[Your Company]'}`, { color: '6B7280' }))

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const fileName = `late-payment-notice-${(data.invoiceNumber || 'INV').replace(/[^a-z0-9-]+/gi, '-')}-${purpose.id}.docx`
  saveAs(blob, fileName)
}
