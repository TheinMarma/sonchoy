import * as XLSX from 'xlsx'
import { findCurrency, computeRecon, asOfLabel } from './compute'

export function generateBankReconXlsx(data) {
  const t = computeRecon(data)
  const cur = findCurrency(data.currency)
  const dateLabel = asOfLabel(data)

  const wb = XLSX.utils.book_new()

  const lines = []
  lines.push([`Bank Reconciliation — ${data.companyName || 'Your Company'}`])
  lines.push([`Account: ${data.accountName || ''}`, '', `#: ${data.accountNumber || ''}`, '', `Currency: ${cur.code}`])
  if (dateLabel) lines.push([`As of: ${dateLabel}`])
  lines.push([])

  // BANK SIDE
  lines.push(['PER BANK STATEMENT'])
  lines.push(['Statement balance', '', t.statementBalance])
  if ((data.depositsInTransit || []).length > 0) {
    lines.push(['Add: Deposits in transit'])
    for (const it of data.depositsInTransit) {
      lines.push([`  ${it.description || ''}`, '', Number(it.amount) || 0])
    }
    lines.push(['Total deposits in transit', '+', t.totalDIT])
  }
  if ((data.outstandingChecks || []).length > 0) {
    lines.push(['Less: Outstanding checks'])
    for (const ck of data.outstandingChecks) {
      const label = ck.checkNumber ? `  #${ck.checkNumber} · ${ck.payee || ''}` : `  ${ck.payee || ck.description || ''}`
      lines.push([label, '', -(Number(ck.amount) || 0)])
    }
    lines.push(['Total outstanding', '−', -t.totalOutstanding])
  }
  if ((data.bankAdjustments || []).length > 0) {
    lines.push(['Bank adjustments'])
    for (const it of data.bankAdjustments) {
      lines.push([`  ${it.description || ''}`, '', Number(it.amount) || 0])
    }
    lines.push(['Net bank adjustments', '', t.totalBankAdj])
  }
  lines.push(['ADJUSTED BANK BALANCE', '', t.adjustedBankBalance])
  lines.push([])

  // BOOK SIDE
  lines.push(['PER BOOKS / LEDGER'])
  lines.push(['Book balance', '', t.bookBalance])
  if ((data.interestEarned || []).length > 0) {
    lines.push(['Add: Interest / credits'])
    for (const it of data.interestEarned) {
      lines.push([`  ${it.description || ''}`, '', Number(it.amount) || 0])
    }
    lines.push(['Total interest', '+', t.totalInterest])
  }
  if ((data.bankCharges || []).length > 0) {
    lines.push(['Less: Bank charges'])
    for (const it of data.bankCharges) {
      lines.push([`  ${it.description || ''}`, '', -(Number(it.amount) || 0)])
    }
    lines.push(['Total charges', '−', -t.totalCharges])
  }
  if ((data.nsfChecks || []).length > 0) {
    lines.push(['Less: NSF / returned'])
    for (const ck of data.nsfChecks) {
      const label = ck.checkNumber ? `  #${ck.checkNumber} · ${ck.payer || ''}` : `  ${ck.payer || ck.description || ''}`
      lines.push([label, '', -(Number(ck.amount) || 0)])
    }
    lines.push(['Total NSF', '−', -t.totalNSF])
  }
  if ((data.bookAdjustments || []).length > 0) {
    lines.push(['Book adjustments / errors'])
    for (const it of data.bookAdjustments) {
      lines.push([`  ${it.description || ''}`, '', Number(it.amount) || 0])
    }
    lines.push(['Net book adjustments', '', t.totalBookAdj])
  }
  lines.push(['ADJUSTED BOOK BALANCE', '', t.adjustedBookBalance])
  lines.push([])

  // RECONCILIATION CHECK
  lines.push(['RECONCILIATION CHECK'])
  lines.push(['Adjusted bank balance', '', t.adjustedBankBalance])
  lines.push(['Adjusted book balance', '', t.adjustedBookBalance])
  lines.push(['Difference', '', t.difference])
  lines.push(['Status', '', t.isReconciled ? 'BALANCED ✓' : 'OUT OF BALANCE ⚠'])

  if (data.notes) {
    lines.push([])
    lines.push(['Notes', data.notes])
  }

  const ws = XLSX.utils.aoa_to_sheet(lines)
  ws['!cols'] = [{ wch: 44 }, { wch: 10 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Reconciliation')

  const fileName = `${(data.companyName || 'bank-recon').toLowerCase().replace(/[^a-z0-9-]+/gi, '-')}-recon.xlsx`
  XLSX.writeFile(wb, fileName)
}
