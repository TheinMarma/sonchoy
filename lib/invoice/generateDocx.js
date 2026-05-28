import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, BorderStyle, WidthType, HeightRule,
} from 'docx'
import { saveAs } from 'file-saver'
import { findCurrency, formatNumber, formatDate, computeTotals } from './format'

const NO_BORDER = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

const t = (text, opts = {}) =>
  new Paragraph({ children: [new TextRun({ text: String(text ?? ''), ...opts })] })

const cell = (children, opts = {}) =>
  new TableCell({
    children: Array.isArray(children) ? children : [children],
    borders: NO_BORDER,
    ...opts,
  })

export async function generateInvoiceDocx(invoice) {
  const { items, taxRate, taxLabel, currency } = invoice
  const { subtotal, tax, total } = computeTotals(items, taxRate)
  const cur = findCurrency(currency)

  // Header table — brand on left, invoice meta on right
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell(t(invoice.brand || 'Your Company', { bold: true, size: 32 }),
               { width: { size: 50, type: WidthType.PERCENTAGE } }),
          cell([
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'INVOICE', bold: true, size: 16, color: '888888' })],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: invoice.number || '', bold: true, size: 26 })],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `Issued ${formatDate(invoice.issueDate)}`, size: 18 })],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `Due ${formatDate(invoice.dueDate)}`, size: 18 })],
            }),
          ], { width: { size: 50, type: WidthType.PERCENTAGE } }),
        ],
      }),
    ],
  })

  // Parties table — From / Bill to
  const partiesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell([
            t('FROM', { bold: true, size: 16, color: '888888' }),
            ...String(invoice.fromName || '').split('\n').map((l) => t(l, { bold: true, size: 20 })),
            ...String(invoice.fromAddress || '').split('\n').map((l) => t(l, { size: 18 })),
          ], { width: { size: 50, type: WidthType.PERCENTAGE } }),
          cell([
            t('BILL TO', { bold: true, size: 16, color: '888888' }),
            ...String(invoice.toName || '').split('\n').map((l) => t(l, { bold: true, size: 20 })),
            ...String(invoice.toAddress || '').split('\n').map((l) => t(l, { size: 18 })),
          ], { width: { size: 50, type: WidthType.PERCENTAGE } }),
        ],
      }),
    ],
  })

  // Items table
  const headerCell = (text, align = AlignmentType.LEFT) =>
    new TableCell({
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 12, color: '0A0A09' },
        bottom: { style: BorderStyle.SINGLE, size: 4,  color: 'CCCAC2' },
        left:   { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
        right:  { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
      },
      children: [new Paragraph({
        alignment: align,
        children: [new TextRun({ text, bold: true, size: 16, color: '888888' })],
      })],
    })

  const bodyCell = (text, align = AlignmentType.LEFT, opts = {}) =>
    new TableCell({
      borders: {
        top:    { style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E5E3DD' },
        left:   { style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' },
        right:  { style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' },
      },
      children: [new Paragraph({
        alignment: align,
        children: [new TextRun({ text: String(text), size: 20, ...opts })],
      })],
    })

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [5400, 1200, 1500, 1500],
    rows: [
      new TableRow({
        height: { value: 360, rule: HeightRule.ATLEAST },
        children: [
          headerCell('DESCRIPTION'),
          headerCell('QTY',    AlignmentType.RIGHT),
          headerCell('RATE',   AlignmentType.RIGHT),
          headerCell('AMOUNT', AlignmentType.RIGHT),
        ],
      }),
      ...items.map((it) => {
        const qty  = Number(it.qty)  || 0
        const rate = Number(it.rate) || 0
        const amt  = qty * rate
        return new TableRow({
          children: [
            bodyCell(it.description || ''),
            bodyCell(qty,                AlignmentType.RIGHT),
            bodyCell(formatNumber(rate), AlignmentType.RIGHT),
            bodyCell(formatNumber(amt),  AlignmentType.RIGHT, { bold: true }),
          ],
        })
      }),
    ],
  })

  // Totals
  const totalsRows = [
    [`Subtotal`, formatNumber(subtotal)],
    ...(taxRate > 0 ? [[taxLabel || 'Tax', formatNumber(tax)]] : []),
  ]

  const totalsTable = new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.RIGHT,
    rows: [
      ...totalsRows.map(([label, value]) => new TableRow({
        children: [
          cell(t(label, { size: 20, color: '888888' })),
          cell(new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: value, size: 20 })],
          })),
        ],
      })),
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 12, color: '0A0A09' },
              bottom: { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
              left:   { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
              right:  { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
            },
            children: [t('Total due', { bold: true, size: 24 })],
          }),
          new TableCell({
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 12, color: '0A0A09' },
              bottom: { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
              left:   { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
              right:  { style: BorderStyle.NONE,   size: 0,  color: 'FFFFFF' },
            },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({
                text: `${cur.code} ${formatNumber(total)}`,
                bold: true,
                size: 24,
                color: 'ED2828',
              })],
            })],
          }),
        ],
      }),
    ],
  })

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: [
        headerTable,
        new Paragraph({ text: '' }),
        partiesTable,
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        itemsTable,
        new Paragraph({ text: '' }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: ' ' })],
        }),
        totalsTable,
        ...(invoice.notes ? [
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          ...String(invoice.notes).split('\n').map((l) =>
            t(l, { size: 18, color: '50504C' })
          ),
        ] : []),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const fileName = `${(invoice.number || 'invoice').replace(/[^a-z0-9-]+/gi, '_')}.docx`
  saveAs(blob, fileName)
}
