import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findPaymentMethod, findReceiptType,
  computeReceipt,
} from './compute'

export function generateReceiptXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const method = findPaymentMethod(data.paymentMethodId)
  const receiptType = findReceiptType(data.receiptTypeId)
  const totals = computeReceipt(data)

  const wb = XLSX.utils.book_new()

  const rows = [
    ['Receipt'],
    [],
    ['Receipt #',         data.receiptNumber || ''],
    ['Date',              formatDate(data.receiptDate) || ''],
    ['Type',              receiptType.label],
    ['Invoice reference', data.invoiceReference || ''],
    ['PO reference',      data.poNumber || ''],
    [],
    ['From (issuer)'],
    ['Company',           data.from?.companyName || ''],
    ['Address',           data.from?.address || ''],
    ['Email',             data.from?.email || ''],
    ['Phone',             data.from?.phone || ''],
    ['Tax ID',            data.from?.taxId || ''],
    ['Signatory',         data.from?.signatoryName || ''],
    [],
    ['Received from'],
    ['Name',              data.to?.name || ''],
    ['Address',           data.to?.address || ''],
    ['Email',             data.to?.email || ''],
    ['Phone',             data.to?.phone || ''],
    ['Tax ID',            data.to?.taxId || ''],
    [],
    ['Payment'],
    ['Payment method',    method.label],
    ['Transaction ref',   data.transactionId || ''],
    ['Bank / channel',    data.bankName || ''],
    ['Cheque number',     data.chequeNumber || ''],
    [],
    ['Amount',            totals.amount,         cur.code],
    ['Tax',               totals.tax,            cur.code],
    ['Total received',    totals.totalReceived,  cur.code],
    [],
    ['Outstanding before', totals.outstandingBefore, cur.code],
    ['Outstanding after',  totals.outstandingAfter,  cur.code],
    ['Status',            totals.fullySettled ? 'Paid in full' : (totals.outstandingAfter > 0 ? 'Partial' : 'Paid')],
    [],
    ['Purpose',           data.purpose || ''],
    ['Notes',             data.notes || ''],
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 22 }, { wch: 30 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Receipt')

  const fileName = `receipt-${(data.receiptNumber || 'new').replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
