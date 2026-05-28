import * as XLSX from 'xlsx'
import {
  findCurrency, formatDate,
  findFilingFrequency, findReportPurpose,
  computeReport, buildStateSummary, buildCountySummary, buildRateSummary,
} from './compute'

export function generateSalesTaxReportXlsx(data) {
  const cur = findCurrency(data.currency || 'USD')
  const purpose = findReportPurpose(data.purposeId)
  const filing  = findFilingFrequency(data.filingFrequencyId)
  const { rows, totals } = computeReport(data)
  const stateSummary  = buildStateSummary(rows)
  const countySummary = buildCountySummary(rows)
  const rateSummary   = buildRateSummary(rows)

  const wb = XLSX.utils.book_new()

  /* Summary */
  const summary = [
    ['Sales Tax Report'],
    [],
    ['Title',        data.reportTitle || ''],
    ['Reference',    data.reference || ''],
    ['Period',       data.periodLabel || ''],
    ['Filing freq.', filing.label],
    ['Purpose',      purpose.label],
    ['Generated',    formatDate(data.reportDate) || ''],
    [],
    ['Seller',       data.entity?.name || ''],
    ['Tax ID',       data.entity?.taxId || ''],
    ['Address',      data.entity?.address || ''],
    [],
    ['Gross sales',  totals.gross,    cur.code],
    ['Exempt',       totals.exempt,   cur.code],
    ['Taxable',      totals.taxable,  cur.code],
    ['State tax',    totals.stateTax, cur.code],
    ['County tax',   totals.countyTax, cur.code],
    ['City tax',     totals.cityTax,  cur.code],
    ['Special tax',  totals.specialTax, cur.code],
    ['Total tax due', totals.totalTax, cur.code],
    ['Grand total',  totals.grandTotal, cur.code],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  /* Transactions */
  const txRows = [
    ['#', 'Date', 'Invoice', 'Jurisdiction', 'County',
     'Gross', 'Exempt', 'Taxable',
     'State %', 'County %', 'City %', 'Special %', 'Total %',
     'State tax', 'County tax', 'City tax', 'Special tax', 'Total tax'],
    ...rows.map((r, i) => [
      i + 1, formatDate(r.date) || '', r.invoiceNumber || '',
      r.jurisdictionCode, r.county || '',
      r.gross, r.exempt, r.taxable,
      r.stateRate, r.countyRate, r.cityRate, r.specialRate, r.totalRate,
      r.stateTax, r.countyTax, r.cityTax, r.specialTax, r.totalTax,
    ]),
    [],
    ['TOTALS', '', '', '', '',
     totals.gross, totals.exempt, totals.taxable,
     '', '', '', '', '',
     totals.stateTax, totals.countyTax, totals.cityTax, totals.specialTax, totals.totalTax],
  ]
  const wsTx = XLSX.utils.aoa_to_sheet(txRows)
  wsTx['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
    { wch: 12 }, { wch: 10 }, { wch: 12 },
    { wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 10 }, { wch: 9 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions')

  /* By state */
  const stRows = [
    ['Code', 'Jurisdiction', 'Transactions', 'Gross', 'Exempt', 'Taxable',
     'State tax', 'County tax', 'City tax', 'Special tax', 'Total tax'],
    ...stateSummary.map((s) => [
      s.code, s.label, s.transactions,
      s.gross, s.exempt, s.taxable,
      s.stateTax, s.countyTax, s.cityTax, s.specialTax, s.totalTax,
    ]),
  ]
  const wsSt = XLSX.utils.aoa_to_sheet(stRows)
  wsSt['!cols'] = [
    { wch: 6 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSt, 'By State')

  /* By county */
  const ctRows = [
    ['State', 'County', 'Transactions', 'Taxable', 'Total tax'],
    ...countySummary.map((c) => [c.stateCode, c.county, c.transactions, c.taxable, c.totalTax]),
  ]
  const wsCt = XLSX.utils.aoa_to_sheet(ctRows)
  wsCt['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsCt, 'By County')

  /* By rate */
  const rtRows = [
    ['Combined rate (%)', 'Transactions', 'Taxable', 'Total tax'],
    ...rateSummary.map((r) => [r.ratePct, r.transactions, r.taxable, r.totalTax]),
  ]
  const wsRt = XLSX.utils.aoa_to_sheet(rtRows)
  wsRt['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsRt, 'By Rate')

  const fileName = `sales-tax-report-${(data.reference || purpose.id).replace(/[^a-z0-9-]+/gi, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
