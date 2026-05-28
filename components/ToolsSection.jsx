'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Caret, SearchIcon,
  InvoicePdfIcon, BankStatementIcon, ReceiptIcon, CsvIcon, ExcelToPdfIcon, PdfToExcelIcon, ImageToPdfIcon, ScanIcon,
  MergeIcon, SplitIcon, CompressIcon, ReorderIcon, WatermarkIcon, LockIcon, UnlockIcon, SignatureIcon, RotateIcon,
  InvoiceIcon, TaxInvoiceIcon, RecurringIcon, HashIcon, TemplateIcon, ExportIcon,
  QuoteIcon, POIcon, DeliveryIcon, ExpenseIcon, PayslipIcon, ReportIcon,
  PnlIcon, CashFlowIcon, BalanceIcon,
  PercentIcon, VatIcon, PayrollIcon, ReconcileIcon, EmiIcon, AmortIcon,
  ContractIcon, NdaIcon, ProposalIcon, LetterIcon, BellIcon,
  LedgerIcon, ForecastIcon, BudgetIcon, InventoryIcon,
  OcrIcon, TableIcon, CreditCardIcon, CoinStackIcon,
} from './icons'

/* group  → filter chip · cat → visual color
   conversion (convert / blue) · pdf (edit / violet) ·
   invoicing, documents, accounting, tax, contracts (business / teal) */

/* Exported so other modules (e.g. /get-started redirect) can derive the live
   list of tool pages without re-declaring it. Any tile here with a `path`
   property is a live, routed page. */
export const TOOLS = [
  // Document Conversion
  { group: 'conversion', cat: 'convert', name: 'Invoice PDF to Excel',              desc: 'Pull line items, totals, and tax from invoice PDFs into clean spreadsheet rows.', Icon: InvoicePdfIcon, featured: true, path: '/tools/invoice-pdf-to-excel' },
  { group: 'conversion', cat: 'convert', name: 'Bank Statement PDF to Excel',       desc: 'Turn statement PDFs into reconciled transaction tables — dates, amounts, balances.', Icon: BankStatementIcon, featured: true, path: '/tools/bank-statement-pdf-to-excel' },
  { group: 'conversion', cat: 'convert', name: 'Receipt Image to PDF',              desc: 'Combine phone-camera receipts into a single, ordered, archive-ready PDF.', Icon: ReceiptIcon, path: '/tools/receipt-image-to-pdf' },
  { group: 'conversion', cat: 'convert', name: 'PDF to CSV',                        desc: 'Extract any tabular PDF into CSV — ready for accounting software import.', Icon: CsvIcon, featured: true, path: '/tools/pdf-to-csv' },
  { group: 'conversion', cat: 'convert', name: 'Excel to PDF',                      desc: 'Lock a spreadsheet into a fixed-layout PDF — preserves formulas and formatting.', Icon: ExcelToPdfIcon, path: '/tools/excel-to-pdf' },
  { group: 'conversion', cat: 'convert', name: 'PDF to Excel',                      desc: 'Convert any PDF table into a fully editable Excel workbook.', Icon: PdfToExcelIcon, path: '/tools/pdf-to-excel' },
  { group: 'conversion', cat: 'convert', name: 'JPG Receipt to PDF',                desc: 'Single receipt photos into print-ready PDFs for expense filing.', Icon: ImageToPdfIcon, path: '/tools/jpg-receipt-to-pdf' },
  { group: 'conversion', cat: 'convert', name: 'Scan to PDF',                       desc: 'Stitch scanned pages into one searchable PDF with auto-deskew.', Icon: ScanIcon, path: '/tools/scan-to-pdf' },
  { group: 'conversion', cat: 'convert', name: 'PDF to XLSX Converter',             desc: 'Direct PDF → XLSX with formula-aware columns and merged-cell handling.', Icon: PdfToExcelIcon, path: '/tools/pdf-to-xlsx-converter' },
  { group: 'conversion', cat: 'convert', name: 'CSV to PDF Converter',              desc: 'Convert CSV files into branded, print-ready PDFs with auto-formatting.', Icon: ExcelToPdfIcon, path: '/tools/csv-to-pdf-converter' },
  { group: 'conversion', cat: 'convert', name: 'Financial Report PDF to Excel',     desc: 'Pull P&L, balance sheet, and cash-flow tables out of any report PDF.', Icon: ReportIcon, path: '/tools/financial-report-pdf-to-excel' },
  { group: 'conversion', cat: 'convert', name: 'OCR Receipt to Text',               desc: 'Read printed and handwritten receipts into searchable text and JSON.', Icon: OcrIcon, featured: true, path: '/tools/ocr-receipt-to-text' },
  { group: 'conversion', cat: 'convert', name: 'OCR Invoice to Excel',              desc: 'Optical character recognition for invoices — every field structured into Excel.', Icon: OcrIcon, path: '/tools/ocr-invoice-to-excel' },
  { group: 'conversion', cat: 'convert', name: 'PNG Receipt to PDF',                desc: 'High-quality PNG receipts compiled into archive-ready PDFs.', Icon: ImageToPdfIcon, path: '/tools/png-receipt-to-pdf' },
  { group: 'conversion', cat: 'convert', name: 'Multi Receipt PDF Combiner',        desc: 'Combine dozens of receipt PDFs into one expense-report packet.', Icon: MergeIcon, path: '/tools/multi-receipt-pdf-combiner' },
  { group: 'conversion', cat: 'convert', name: 'Transaction History PDF to CSV',    desc: 'Statement transactions exported as clean CSV for accounting-software import.', Icon: CsvIcon, path: '/tools/transaction-history-pdf-to-csv' },
  { group: 'conversion', cat: 'convert', name: 'Scan Bank Statement to Excel',      desc: 'OCR + parse scanned bank statements into reconciled Excel rows.', Icon: ScanIcon, path: '/tools/scan-bank-statement-to-excel' },
  { group: 'conversion', cat: 'convert', name: 'Image to Financial PDF Converter',  desc: 'Phone-camera shots of any financial document — uniform, archive-grade PDFs.', Icon: ImageToPdfIcon, path: '/tools/image-to-financial-pdf-converter' },
  { group: 'conversion', cat: 'convert', name: 'Digital Signature Scan to PDF',     desc: 'Capture a wet signature, embed it cleanly into any PDF document.', Icon: SignatureIcon, path: '/tools/digital-signature-scan-to-pdf' },
  { group: 'conversion', cat: 'convert', name: 'PDF Table Extractor',               desc: 'Pull every table out of a PDF with column types and headers preserved.', Icon: TableIcon, path: '/tools/pdf-table-extractor' },

  // Core PDF Utilities
  { group: 'pdf', cat: 'edit', name: 'Merge Financial PDFs',         desc: 'Combine invoices, statements, and reports into a single packet.', Icon: MergeIcon, featured: true, path: '/tools/merge-financial-pdfs' },
  { group: 'pdf', cat: 'edit', name: 'Split PDF Statements',         desc: 'Break long statements into per-month, per-account, or per-page files.', Icon: SplitIcon, path: '/tools/split-pdf-statements' },
  { group: 'pdf', cat: 'edit', name: 'Compress Invoice PDFs',        desc: 'Shrink invoice attachments by 60–80% — email & archive friendly.', Icon: CompressIcon, featured: true, path: '/tools/compress-invoice-pdfs' },
  { group: 'pdf', cat: 'edit', name: 'Reorder PDF Pages',            desc: 'Drag pages into the right sequence before sending to clients.', Icon: ReorderIcon, path: '/tools/reorder-pdf-pages' },
  { group: 'pdf', cat: 'edit', name: 'Add Watermark to Invoice',     desc: 'Stamp DRAFT, PAID, or your logo across every page in one click.', Icon: WatermarkIcon, path: '/tools/add-watermark-to-invoice' },
  { group: 'pdf', cat: 'edit', name: 'Password Protect Financial PDFs', desc: 'AES-256 encrypt sensitive ledgers, payslips, and reports.', Icon: LockIcon, path: '/tools/password-protect-financial-pdfs' },
  { group: 'pdf', cat: 'edit', name: 'Unlock PDF Statements',        desc: 'Strip the password off a statement you own so you can extract data.', Icon: UnlockIcon, path: '/tools/unlock-pdf-statements' },
  { group: 'pdf', cat: 'edit', name: 'Add Signature to PDF',         desc: 'Drop a typed, drawn, or uploaded signature onto contracts and quotes.', Icon: SignatureIcon, featured: true, path: '/tools/add-signature-to-pdf' },
  { group: 'pdf', cat: 'edit', name: 'Rotate Scanned Documents',     desc: 'Auto-fix sideways or upside-down scans across every page at once.', Icon: RotateIcon, path: '/tools/rotate-scanned-documents' },

  // Invoice Tools
  { group: 'invoicing', cat: 'business', name: 'Invoice Generator',         desc: 'Build branded invoices in seconds — line items, tax, totals, and pay link.', Icon: InvoiceIcon, featured: true, path: '/tools/invoice-generator' },
  { group: 'invoicing', cat: 'business', name: 'Tax Invoice Generator',     desc: 'Region-aware tax invoices with HSN/SAC, tax breakdowns, and signatures.', Icon: TaxInvoiceIcon, path: '/tools/tax-invoice-generator' },
  { group: 'invoicing', cat: 'business', name: 'Proforma Invoice Generator', desc: 'Send a proforma quote that converts to a final invoice in one click.', Icon: InvoiceIcon, path: '/tools/proforma-invoice-generator' },
  { group: 'invoicing', cat: 'business', name: 'GST/VAT Invoice Generator', desc: 'Compliant GST or VAT invoices with multi-rate tax and reverse charge.', Icon: VatIcon, featured: true, path: '/tools/gst-vat-invoice-generator' },
  { group: 'invoicing', cat: 'business', name: 'Freelance Invoice Generator', desc: 'Hours, day rates, retainers — invoices designed for solo operators.', Icon: InvoiceIcon, path: '/tools/freelance-invoice-generator' },
  { group: 'invoicing', cat: 'business', name: 'Recurring Invoice Generator', desc: 'Set a cadence; we draft the next invoice automatically each cycle.', Icon: RecurringIcon, path: '/tools/recurring-invoice-generator' },

  // Billing Utilities
  { group: 'invoicing', cat: 'business', name: 'Invoice Number Generator',  desc: 'Sequential, prefixed, or fiscal-year invoice numbers — never duplicate again.', Icon: HashIcon, path: '/tools/invoice-number-generator' },
  { group: 'invoicing', cat: 'business', name: 'Invoice Template Builder',  desc: 'Design a branded template once, reuse forever across all generators.', Icon: TemplateIcon, path: '/tools/invoice-template-builder' },
  { group: 'invoicing', cat: 'business', name: 'Invoice PDF Exporter',      desc: 'Bulk-export draft invoices to print-ready, archivable PDFs.', Icon: ExportIcon, path: '/tools/invoice-pdf-exporter' },

  // Business Documents
  { group: 'documents', cat: 'business', name: 'Quotation Generator',       desc: 'Itemised quotes with totals, tax, validity, and one-click conversion to invoice.', Icon: QuoteIcon, featured: true, path: '/tools/quotation-generator' },
  { group: 'documents', cat: 'business', name: 'Receipt Generator',         desc: 'Issue clean payment receipts the moment a client clears an invoice.', Icon: ReceiptIcon, path: '/tools/receipt-generator' },
  { group: 'documents', cat: 'business', name: 'Purchase Order Generator',  desc: 'Send vendors POs that match your accounting system numbering.', Icon: POIcon, path: '/tools/purchase-order-generator' },
  { group: 'documents', cat: 'business', name: 'Delivery Note Generator',   desc: 'Pack-list PDFs that ship alongside goods — no pricing visible.', Icon: DeliveryIcon, path: '/tools/delivery-note-generator' },
  { group: 'documents', cat: 'business', name: 'Expense Report Generator',  desc: 'Roll up receipts into a categorised, manager-ready expense report.', Icon: ExpenseIcon, path: '/tools/expense-report-generator' },
  { group: 'documents', cat: 'business', name: 'Salary Slip Generator',     desc: 'Compliant payslips with deductions, taxes, and YTD totals.', Icon: PayslipIcon, path: '/tools/salary-slip-generator' },
  { group: 'documents', cat: 'business', name: 'Financial Report Generator', desc: 'Branded monthly or quarterly reports with charts and commentary.', Icon: ReportIcon, path: '/tools/financial-report-generator' },

  // Accounting Helpers
  { group: 'accounting', cat: 'business', name: 'Profit & Loss Statement',         desc: 'P&L from a CSV or trial balance — exported as a presentation-ready PDF.', Icon: PnlIcon, featured: true, path: '/tools/profit-loss-statement' },
  { group: 'accounting', cat: 'business', name: 'Cash Flow Statement',             desc: 'Operating, investing, and financing cash flows with auto-totals.', Icon: CashFlowIcon, path: '/tools/cash-flow-statement' },
  { group: 'accounting', cat: 'business', name: 'Balance Sheet Generator',         desc: 'Assets, liabilities, equity — tied out to the cent and PDF-exported.', Icon: BalanceIcon, path: '/tools/balance-sheet-generator' },
  { group: 'accounting', cat: 'business', name: 'Income Statement Generator',      desc: 'Revenue, expenses, and net income — formatted for stakeholders.', Icon: ReportIcon, path: '/tools/income-statement-generator' },
  { group: 'accounting', cat: 'business', name: 'Expense Tracker Sheet',           desc: 'Log every business expense with category, vendor, and reimbursement status.', Icon: ExpenseIcon, path: '/tools/expense-tracker-sheet' },
  { group: 'accounting', cat: 'business', name: 'Accounts Payable Report',         desc: 'Outstanding bills, vendor totals, and ageing buckets at a glance.', Icon: InvoiceIcon, path: '/tools/accounts-payable-report' },
  { group: 'accounting', cat: 'business', name: 'Accounts Receivable Report',      desc: 'Customer balances, ageing analysis, and overdue alerts.', Icon: InvoicePdfIcon, path: '/tools/accounts-receivable-report' },
  { group: 'accounting', cat: 'business', name: 'General Ledger Generator',        desc: 'Full transaction history exported in chronological, audit-ready order.', Icon: LedgerIcon, path: '/tools/general-ledger-generator' },
  { group: 'accounting', cat: 'business', name: 'Trial Balance Generator',         desc: 'Debits and credits balanced and locked, ready for the auditor.', Icon: ReconcileIcon, path: '/tools/trial-balance' },
  { group: 'accounting', cat: 'business', name: 'Monthly Financial Summary',       desc: 'A one-page roll-up of revenue, expenses, and net for the month.', Icon: ReportIcon, featured: true, path: '/tools/monthly-financial-summary' },
  { group: 'accounting', cat: 'business', name: 'Revenue Report Generator',        desc: 'Revenue by product, segment, or month with sortable totals and trend.', Icon: ForecastIcon, path: '/tools/revenue-report' },
  { group: 'accounting', cat: 'business', name: 'Business Expense Breakdown',      desc: 'Expenses by category with percentage splits and month-over-month trend.', Icon: BudgetIcon, path: '/tools/business-expense-breakdown' },
  { group: 'accounting', cat: 'business', name: 'Payroll Summary Generator',       desc: 'Wages, deductions, and employer taxes — period-by-period.', Icon: PayrollIcon, path: '/tools/payroll-summary' },
  { group: 'accounting', cat: 'business', name: 'Tax Summary Report',              desc: 'Tax collected, owed, and remitted across periods and regions.', Icon: PercentIcon, path: '/tools/tax-summary-report' },
  { group: 'accounting', cat: 'business', name: 'Budget Planning Sheet',           desc: 'Build budgets line-by-line with variance tracking columns.', Icon: TemplateIcon, path: '/tools/budget-planning-sheet' },
  { group: 'accounting', cat: 'business', name: 'Financial Forecast Generator',    desc: 'Project revenue and expenses forward with optimistic / base / downside columns.', Icon: ForecastIcon, path: '/tools/financial-forecast' },
  { group: 'accounting', cat: 'business', name: 'Profit Margin Calculator',        desc: 'Gross, operating, and net margins on every revenue line — PDF-exported.', Icon: PercentIcon, path: '/tools/profit-margin-calculator' },
  { group: 'accounting', cat: 'business', name: 'Break-Even Analysis',             desc: 'Find the units or revenue where fixed costs cross profit.', Icon: AmortIcon, path: '/tools/break-even-analysis' },
  { group: 'accounting', cat: 'business', name: 'Annual Financial Report',         desc: 'Year-end report with charts, commentary, and signed cover page.', Icon: PnlIcon, path: '/tools/annual-financial-report' },
  { group: 'accounting', cat: 'business', name: 'Inventory Valuation Report',      desc: 'Stock-on-hand valued at cost, retail, or moving average.', Icon: InventoryIcon, path: '/tools/inventory-valuation-report' },

  // Tax & Banking
  { group: 'tax', cat: 'business', name: 'Tax Calculation Sheet',                desc: 'Income, slabs, deductions — a clean working sheet for client filings.', Icon: PercentIcon, featured: true, path: '/tools/tax-calculation-sheet' },
  { group: 'tax', cat: 'business', name: 'VAT Calculator PDF Export',            desc: 'Inline VAT/sales-tax calculations on any invoice, exported to PDF.', Icon: VatIcon, path: '/tools/vat-calculator-pdf-export' },
  { group: 'tax', cat: 'business', name: 'Payroll Tax Report Generator',         desc: 'Employer withholding summaries, ready for filing or audit.', Icon: PayrollIcon, path: '/tools/payroll-tax-report' },
  { group: 'tax', cat: 'business', name: 'Bank Reconciliation Sheet',            desc: 'Match book balances to bank statements with exception highlighting.', Icon: ReconcileIcon, path: '/tools/bank-reconciliation-sheet' },
  { group: 'tax', cat: 'business', name: 'EMI Schedule PDF',                     desc: 'Loan EMI schedules with principal/interest split for each period.', Icon: EmiIcon, path: '/tools/emi-schedule' },
  { group: 'tax', cat: 'business', name: 'Loan Amortization PDF',                desc: 'Full amortization tables — fixed, floating, or step-up structures.', Icon: AmortIcon, path: '/tools/loan-amortization' },
  { group: 'tax', cat: 'business', name: 'GST Calculation Sheet',                desc: 'GST workings with HSN/SAC codes, multi-rate, and reverse-charge support.', Icon: VatIcon, path: '/tools/gst-calculation-sheet' },
  { group: 'tax', cat: 'business', name: 'Income Tax Estimator PDF',             desc: 'Estimate annual liability across slabs, deductions, and exemptions.', Icon: PercentIcon, path: '/tools/income-tax-estimator' },
  { group: 'tax', cat: 'business', name: 'Sales Tax Report Generator',           desc: 'US/CA sales-tax filings broken down by state, county, and rate.', Icon: PercentIcon, path: '/tools/sales-tax-report' },
  { group: 'tax', cat: 'business', name: 'Tax Deduction Summary',                desc: 'Section-wise deductions claimed, with proof-of-document column.', Icon: VatIcon, path: '/tools/tax-deduction-summary' },
  { group: 'tax', cat: 'business', name: 'Bank Statement Analyzer',              desc: 'Categorise every line of a statement — vendor, type, recurring vs one-off.', Icon: BankStatementIcon, path: '/tools/bank-statement-analyzer' },
  { group: 'tax', cat: 'business', name: 'Interest Calculation Sheet',           desc: 'Simple, compound, or reducing-balance interest with period-by-period rows.', Icon: PercentIcon, path: '/tools/interest-calculation-sheet' },
  { group: 'tax', cat: 'business', name: 'Monthly Loan Payment Generator',       desc: 'Calculate monthly outflow with principal/interest split for any loan.', Icon: EmiIcon, path: '/tools/monthly-loan-payment' },
  { group: 'tax', cat: 'business', name: 'Credit Card Payment Schedule',         desc: 'Plan minimum or accelerated card payoff with total interest paid.', Icon: CreditCardIcon, path: '/tools/credit-card-payment-schedule' },
  { group: 'tax', cat: 'business', name: 'Mortgage Payment PDF',                 desc: 'Full mortgage schedule — principal, interest, escrow, taxes, balance.', Icon: AmortIcon, path: '/tools/mortgage-payment' },
  { group: 'tax', cat: 'business', name: 'Savings Interest Report',              desc: 'Compound savings growth across years with deposit and withdrawal lines.', Icon: CoinStackIcon, path: '/tools/savings-interest-report' },
  { group: 'tax', cat: 'business', name: 'Financial Year Tax Summary',           desc: 'A one-page year-end summary — income, deductions, tax paid, refunds.', Icon: ReportIcon, path: '/tools/financial-year-tax-summary' },
  { group: 'tax', cat: 'business', name: 'Banking Transaction Summary',          desc: 'Monthly inflows, outflows, and category breakdowns from any account.', Icon: BankStatementIcon, path: '/tools/banking-transaction-summary' },
  { group: 'tax', cat: 'business', name: 'Debt Repayment Planner PDF',           desc: 'Snowball or avalanche payoff plans across multiple debts and rates.', Icon: AmortIcon, path: '/tools/debt-repayment-planner-pdf' },
  { group: 'tax', cat: 'business', name: 'Investment Return Calculation Sheet',  desc: 'CAGR, IRR, and absolute return on any holding period.', Icon: ForecastIcon, path: '/tools/investment-return-calculation-sheet' },

  // Small Business Utilities (Contracts & letters)
  { group: 'contracts', cat: 'business', name: 'Client Contract Generator',  desc: 'Engagement contracts with scope, rates, and term — lawyer-reviewed templates.', Icon: ContractIcon, path: '/tools/client-contract-generator' },
  { group: 'contracts', cat: 'business', name: 'NDA Generator',              desc: 'Mutual or one-way NDAs — customise parties, term, and jurisdiction.', Icon: NdaIcon, path: '/tools/nda-generator' },
  { group: 'contracts', cat: 'business', name: 'Service Agreement Generator', desc: 'SoW + master service agreements you can re-use across clients.', Icon: ContractIcon, path: '/tools/service-agreement-generator' },
  { group: 'contracts', cat: 'business', name: 'Business Proposal Generator', desc: 'Pitch-ready proposals with pricing tables and executive summary.', Icon: ProposalIcon, path: '/tools/business-proposal-generator' },
  { group: 'contracts', cat: 'business', name: 'Payment Reminder Letter',    desc: 'Polite but firm reminder letters — pre-30-day, 30+, and final notice.', Icon: BellIcon, path: '/tools/payment-reminder-letter' },
  { group: 'contracts', cat: 'business', name: 'Late Payment Notice',        desc: 'Statutory late-payment notices with interest calculation included.', Icon: LetterIcon, path: '/tools/late-payment-notice' },
]

/* color per filter group — each tab has its own identity */
const GROUP_STYLES = {
  conversion: { bg: 'bg-convert-bg',    fg: 'text-convert' },
  pdf:        { bg: 'bg-edit-bg',       fg: 'text-edit' },
  invoicing:  { bg: 'bg-invoicing-bg',  fg: 'text-invoicing' },
  documents:  { bg: 'bg-business-bg',   fg: 'text-business' },
  accounting: { bg: 'bg-accounting-bg', fg: 'text-accounting' },
  tax:        { bg: 'bg-tax-bg',        fg: 'text-tax' },
  contracts:  { bg: 'bg-contracts-bg',  fg: 'text-contracts' },
}

const GROUP_LABEL = {
  conversion: 'CONVERT',
  pdf:        'PDF',
  invoicing:  'INVOICING',
  documents:  'DOCUMENTS',
  accounting: 'ACCOUNTING',
  tax:        'TAX & BANKING',
  contracts:  'CONTRACTS',
}

const FILTERS = [
  { id: 'all',        label: 'All tools' },
  { id: 'conversion', label: 'Convert' },
  { id: 'pdf',        label: 'PDF tools' },
  { id: 'invoicing',  label: 'Invoicing' },
  { id: 'documents',  label: 'Documents' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'tax',        label: 'Tax & banking' },
  { id: 'contracts',  label: 'Contracts' },
]

function ToolTile({ tool }) {
  const styles = GROUP_STYLES[tool.group]
  const className =
    'group relative flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md'

  const inner = (
    <>
      <span className={`absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] ${styles.fg}`}>
        {GROUP_LABEL[tool.group]}
      </span>
      <div className={`flex h-11 w-11 items-center justify-center rounded-md ${styles.bg} ${styles.fg}`}>
        <tool.Icon />
      </div>
      <div>
        <h4 className="mb-1 text-md font-medium tracking-[-0.01em] text-ink-950">
          {tool.name}
        </h4>
        <p className="text-xs leading-[1.5] text-ink-500 m-0">{tool.desc}</p>
      </div>
    </>
  )

  if (tool.path) {
    return (
      <Link href={tool.path} className={className}>
        {inner}
      </Link>
    )
  }
  return (
    <a href="#" className={className}>
      {inner}
    </a>
  )
}

const PAGE_LIMIT = 16

/** Parse `#tools?q=foo&filter=invoicing` style hash → { q, filter } */
function readHashQuery() {
  if (typeof window === 'undefined') return { q: '', filter: '' }
  const hash = window.location.hash || ''
  const i = hash.indexOf('?')
  if (i === -1) return { q: '', filter: '' }
  try {
    const p = new URLSearchParams(hash.slice(i + 1))
    return { q: p.get('q') || '', filter: p.get('filter') || '' }
  } catch {
    return { q: '', filter: '' }
  }
}

const VALID_FILTERS = new Set(['all', 'conversion', 'pdf', 'invoicing', 'documents', 'accounting', 'tax', 'contracts'])

export default function ToolsSection() {
  const initial = readHashQuery()
  const [filter, setFilter] = useState(
    VALID_FILTERS.has(initial.filter) ? initial.filter : 'all',
  )
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState(initial.q)

  // Listen for hash changes (header search, dropdown "View all" links, etc.)
  useEffect(() => {
    const onHash = () => {
      const { q, filter: f } = readHashQuery()
      setQuery(q)
      if (VALID_FILTERS.has(f)) {
        setFilter(f)
        setShowAll(false)
      }
      if ((q || f) && typeof window !== 'undefined') {
        const el = document.getElementById('tools')
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // 1) Apply category filter (for "All", surface featured first)
  const baseList =
    filter === 'all'
      ? [...TOOLS].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
      : TOOLS.filter((t) => t.group === filter)

  // 2) Apply text search
  const q = query.trim().toLowerCase()
  const filteredTools = q
    ? baseList.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q),
      )
    : baseList

  const totalInFilter = filteredTools.length
  const hasMore = totalInFilter > PAGE_LIMIT
  const visible = showAll ? filteredTools : filteredTools.slice(0, PAGE_LIMIT)
  const isSearching = q.length > 0

  const handleFilter = (id) => {
    setFilter(id)
    setShowAll(false)
  }

  const filterLabel =
    filter === 'all'
      ? 'tools'
      : `${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} tools`

  return (
    <section id="tools" className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-10 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300">
              01 — The toolkit
            </p>
            <h2 className="m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950">
              Every <em className="font-serif font-normal italic text-crimson-500">finance &amp; billing</em> document — generated in seconds.
            </h2>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            90+ tools covering invoicing, statements, accounting, tax, payroll, and contracts. Pick the document you need, fill the form, ship the PDF.
          </p>
        </div>

        {/* Filter tabs + Search — horizontally aligned */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => handleFilter(f.id)}
                  className={`rounded-md border px-3.5 py-2 font-sans text-[13px] font-medium transition-colors ${
                    active
                      ? 'border-crimson-600 bg-crimson-500 text-white shadow-[0_4px_14px_-4px_rgba(237,40,40,0.5)]'
                      : 'border-line-strong bg-surface text-ink-700 hover:bg-ink-100 hover:text-ink-950'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <div className="relative w-full shrink-0 lg:w-[320px]">
            <SearchIcon
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${TOOLS.length} tools…`}
              aria-label="Search tools"
              className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-10 text-[13px] text-ink-950 placeholder:text-ink-500 transition-colors focus:border-crimson-500/60 focus:outline-none focus:ring-2 focus:ring-crimson-500/25"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((t) => (
              <ToolTile key={t.name} tool={t} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center">
            <p className="m-0 mb-2 text-lg font-medium text-ink-950">
              No tools match “{query}”.
            </p>
            <p className="m-0 mb-5 text-md text-ink-600">
              Try a shorter keyword, or clear the search to see all tools in this category.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="btn btn-secondary"
            >
              Clear search
            </button>
          </div>
        )}

        {hasMore && visible.length > 0 && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="btn btn-secondary"
            >
              {showAll
                ? 'Show less'
                : isSearching
                  ? `Show all ${totalInFilter} matches`
                  : `View all ${totalInFilter} ${filterLabel}`}
              <Caret
                className={`h-2.5 w-2.5 text-ink-500 transition-transform ${showAll ? 'rotate-180' : ''}`}
              />
            </button>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500">
              {showAll
                ? `Showing all ${totalInFilter}`
                : `Showing ${visible.length} of ${totalInFilter}`}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
