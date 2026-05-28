import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findCategory, findProofStatus, findSummaryPurpose,
  computeDeductions, buildCategorySummary, buildSectionSummary,
} from './compute'

export function generateTaxDeductionXlsx(data) {
  const cur = findCurrency(data.currency || 'INR')
  const purpose = findSummaryPurpose(data.purposeId)
  const { rows, totals, verifiedCount, pendingCount, missingCount } = computeDeductions(data.deductions)
  const categorySummary = buildCategorySummary(rows)
  const sectionSummary  = buildSectionSummary(rows)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Tax Deduction Summary'],
    [],
    ['Title',         data.summaryTitle || ''],
    ['Reference',     data.reference || ''],
    ['Taxpayer',      data.taxpayerName || ''],
    ['Tax ID',        data.taxpayer?.taxId || ''],
    ['Tax year',      data.taxYear || ''],
    ['Purpose',       purpose.label],
    [],
    ['Total claimable', totals.claimable, cur.code],
    ['Total limit',     totals.limit,     cur.code],
    ['Unused headroom', totals.unused,    cur.code],
    [],
    ['Verified items',  verifiedCount],
    ['Pending review',  pendingCount],
    ['Missing proof',   missingCount],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Deductions */
  const dedRows = [
    ['#', 'Section', 'Section label', 'Category', 'Description',
     'Amount', 'Limit', 'Claimable', 'Unused',
     'Proof reference', 'Proof status'],
    ...rows.map((r, i) => [
      i + 1, r.section || '', r.sectionLabel || '',
      findCategory(r.categoryId).label, r.description || '',
      r.amount, r.limit, r.claimable, r.unused,
      r.proofRef || '', findProofStatus(r.proofStatusId).label,
    ]),
    [],
    ['TOTALS', '', '', '', '',
     totals.claimedRaw, totals.limit, totals.claimable, totals.unused, '', ''],
  ]
  const wsDed = XLSX.utils.aoa_to_sheet(dedRows)
  wsDed['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 24 }, { wch: 22 }, { wch: 38 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 22 }, { wch: 16 },
  ]
  XLSX.utils.book_append_sheet(wb, wsDed, 'Deductions')

  /* By category */
  const catRows = [
    ['Category', 'Items', 'Claimable', 'Limit', 'Unused'],
    ...categorySummary.map((c) => [c.label, c.count, c.claimable, c.limit, c.unused]),
  ]
  const wsCat = XLSX.utils.aoa_to_sheet(catRows)
  wsCat['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsCat, 'By Category')

  /* By section */
  const secRows = [
    ['Section', 'Label', 'Items', 'Claimable', 'Limit'],
    ...sectionSummary.map((s) => [s.section, s.label, s.count, s.claimable, s.limit]),
  ]
  const wsSec = XLSX.utils.aoa_to_sheet(secRows)
  wsSec['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 10 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsSec, 'By Section')

  const fileName = `tax-deduction-summary-${(data.reference || purpose.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
