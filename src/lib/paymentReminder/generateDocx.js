import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx'
import { saveAs } from 'file-saver'
import {
  findCurrency, formatNumber, formatDate,
  findSignOff, buildLetterCopy,
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

const TONE_HEX = {
  friendly: '16A34A',
  polite:   'B4821E',
  firm:     'D97706',
  final:    'DC2626',
}

export async function generatePaymentReminderDocx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const signOff = findSignOff(data.signOffId)
  const letter = buildLetterCopy(data)
  const accent = TONE_HEX[letter.stage.tone] || 'F43F5E'

  const children = []

  // Header — sender name & address (left)
  children.push(p(data.sender?.name || '[Your Company]', { bold: true, size: 28 }))
  if (data.sender?.address) children.push(p(data.sender.address, { size: 18, color: '6B7280' }))
  const contactLine = [data.sender?.email, data.sender?.phone].filter(Boolean).join('  ·  ')
  if (contactLine) children.push(p(contactLine, { size: 18, color: '6B7280' }))

  children.push(p(''))

  // Stage tag + date
  children.push(p(letter.stage.tag, { bold: true, size: 18, color: accent }))
  children.push(p(formatDate(data.letterDate), { size: 18, color: '6B7280' }))
  children.push(p(''))

  // Recipient
  children.push(p('TO', { bold: true, size: 16, color: '6B7280' }))
  children.push(p(data.recipientName || data.client?.name || '[Client Name]', { bold: true, size: 24 }))
  if (data.client?.name && data.recipientName && data.recipientName !== data.client.name) {
    children.push(p(data.client.name))
  }
  if (data.client?.address) children.push(p(data.client.address))
  if (data.client?.email)   children.push(p(data.client.email))

  children.push(p(''))
  children.push(p(`Subject: ${letter.subject}`, { bold: true, size: 22 }))
  children.push(p(''))

  // Body
  for (const para of letter.paragraphs) {
    if (para === '') {
      children.push(p(''))
    } else {
      children.push(p(para, { size: 22 }))
    }
  }

  children.push(p(''))

  // Invoice details table
  const rows = []
  rows.push(new TableRow({
    tableHeader: true,
    children: [
      cell('OUTSTANDING INVOICE', { bold: true, width: 100, shading: 'F8F7F3', color: accent }),
      cell('', { width: 0, shading: 'F8F7F3' }),
    ],
  }))
  const detailRows = [
    ['Invoice number', data.invoiceNumber || '—'],
    ['Invoice date',   formatDate(data.invoiceDate)],
    ['Due date',       formatDate(data.dueDate)],
    ['Days overdue',   String(letter.daysOverdue)],
    ['Amount due',     `${cur.code} ${formatNumber(Number(data.amount) || 0)}`],
  ]
  if (data.includeInterest) {
    detailRows.push(['Late-payment interest', `${cur.code} ${formatNumber(letter.interest)} (${Number(data.interestRate) || 0}% p.a.)`])
    detailRows.push(['TOTAL DUE', `${cur.code} ${formatNumber((Number(data.amount) || 0) + letter.interest)}`])
  }
  for (const [k, v] of detailRows) {
    const isTotal = k === 'TOTAL DUE'
    rows.push(new TableRow({
      children: [
        cell(k, { width: 50, bold: isTotal, color: isTotal ? accent : '6B7280' }),
        cell(v, { width: 50, right: true, bold: isTotal, color: isTotal ? accent : '1F2937' }),
      ],
    }))
  }
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

  if (data.paymentInstructions) {
    children.push(p('HOW TO PAY', { bold: true, size: 18, color: accent }))
    children.push(p(data.paymentInstructions))
    children.push(p(''))
  }

  // Sign-off
  children.push(p(`${signOff.label},`))
  children.push(p(''))
  children.push(p(''))
  children.push(p(data.sender?.contactName || data.sender?.name || '[Your Name]', { bold: true, size: 24 }))
  if (data.sender?.contactTitle) children.push(p(data.sender.contactTitle, { color: '6B7280' }))
  if (data.sender?.name && data.sender?.contactName) children.push(p(data.sender.name, { color: '6B7280' }))

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const fileName = `payment-reminder-${(data.invoiceNumber || 'INV').replace(/[^a-z0-9-]+/gi, '-')}-${letter.stage.id}.docx`
  saveAs(blob, fileName)
}
