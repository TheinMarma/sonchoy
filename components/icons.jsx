export const Caret = ({ className = "w-2.5 h-2.5" }) => (
  <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M3 5l3 3 3-3" />
  </svg>
)

export const ArrowRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
)

export const Check = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l3 3 7-7" />
  </svg>
)

export const Upload = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v12M6 10l6-6 6 6" />
    <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </svg>
)

export const Plus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M3 8h10M8 3v10" />
  </svg>
)

export const SearchIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5l3 3" />
  </svg>
)

export const HeroDownArrow = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v9M3 7l5 5 5-5" />
  </svg>
)

/* ---------- Finance / tool icons ---------- */

const w = "1.6"
const wrap = (children) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

export const InvoicePdfIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 7h5M7 10h5M7 13h3" />
  <path d="M14 13l3 3-3 3M17 16h-7" />
</>)

export const BankStatementIcon = () => wrap(<>
  <rect x="3" y="9" width="14" height="9" rx="1" />
  <path d="M3 13h14" />
  <path d="M5 6l5-3 5 3" />
  <path d="M3 9h14" />
</>)

export const ReceiptIcon = () => wrap(<>
  <path d="M5 3v17l2-1.5L9 20l2-1.5L13 20l2-1.5L17 20V3z" />
  <path d="M8 7h6M8 10h6M8 13h4" />
</>)

export const CsvIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M3 7v6M7 7v6M11 7v6" />
  <path d="M3 7h8M3 10h8M3 13h8" />
</>)

export const ExcelToPdfIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M3 6l3 3M3 12h6M9 14l3-3 3 3" />
</>)

export const PdfToExcelIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M14 13l3 3-3 3M10 16h7" />
  <path d="M7 7h5M7 10h5M7 13h3" />
</>)

export const ImageToPdfIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <circle cx="9" cy="9" r="1.5" />
  <path d="M5 14l3-3 5 4" />
</>)

export const ScanIcon = () => wrap(<>
  <path d="M5 3H3v3M19 3h2v3M5 21H3v-3M19 21h2v-3" />
  <path d="M3 12h18" />
  <path d="M7 7h10v10H7z" />
</>)

export const MergeIcon = () => wrap(<>
  <rect x="3" y="4" width="9" height="11" rx="1" />
  <rect x="12" y="4" width="9" height="11" rx="1" />
</>)

export const SplitIcon = () => wrap(<>
  <rect x="3" y="4" width="7" height="14" rx="1" />
  <rect x="14" y="4" width="7" height="14" rx="1" />
</>)

export const CompressIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M9 9l-2 2 2 2M11 9l2 2-2 2" />
</>)

export const ReorderIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="6" rx="1" />
  <rect x="4" y="11" width="11" height="6" rx="1" />
  <path d="M19 7l-2-2M19 7l-2 2M19 15l-2-2M19 15l-2 2" />
</>)

export const WatermarkIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 13l2-3 2 2 3-4" opacity="0.6" />
</>)

export const LockIcon = () => wrap(<>
  <rect x="4" y="4" width="10" height="13" rx="1.5" />
  <path d="M16 8a3 3 0 110 6" />
  <circle cx="14" cy="11" r="1" />
</>)

export const UnlockIcon = () => wrap(<>
  <rect x="4" y="9" width="10" height="9" rx="1.5" />
  <path d="M6 9V6a3 3 0 016-1" />
</>)

export const SignatureIcon = () => wrap(<>
  <path d="M3 16c2 0 3-2 5-7s4-2 4 1-2 5 0 6 4-2 5-3" />
  <path d="M14 16h5" />
</>)

export const RotateIcon = () => wrap(<>
  <path d="M5 12a7 7 0 1 1 14 0 7 7 0 0 1-14 0z" />
  <path d="M12 5v3M5 12h3" />
</>)

export const InvoiceIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 7h5M7 10h5M7 13h3" />
  <circle cx="14" cy="13" r="2.5" />
  <path d="M14 11.5v3" />
</>)

export const TaxInvoiceIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M8 7h4M8 10h4" />
  <circle cx="9" cy="14" r="0.6" fill="currentColor" />
  <circle cx="13" cy="14" r="0.6" fill="currentColor" />
  <path d="M9 14l4-3" />
</>)

export const RecurringIcon = () => wrap(<>
  <rect x="4" y="4" width="11" height="13" rx="1.5" />
  <path d="M14 7l2 2-2 2" />
  <path d="M16 9c2 0 3 2 1 4" />
</>)

export const HashIcon = () => wrap(<>
  <path d="M6 3v18M14 3v18M3 8h18M3 16h18" />
</>)

export const TemplateIcon = () => wrap(<>
  <rect x="3" y="3" width="18" height="6" rx="1" />
  <rect x="3" y="11" width="8" height="10" rx="1" />
  <rect x="13" y="11" width="8" height="10" rx="1" />
</>)

export const ExportIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M14 8l4 4-4 4M18 12h-8" />
</>)

export const QuoteIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 7h7M7 10h7M7 13h4" />
</>)

export const POIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 7h5" />
  <path d="M14 11l2 2 4-4" />
</>)

export const DeliveryIcon = () => wrap(<>
  <rect x="3" y="6" width="11" height="9" rx="1" />
  <path d="M14 9h4l3 3v3h-7" />
  <circle cx="7" cy="17" r="2" />
  <circle cx="17" cy="17" r="2" />
</>)

export const ExpenseIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 11l2-2 2 2 3-3" />
  <path d="M14 8h2v2" />
</>)

export const PayslipIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M9 7v6M7 9c0-1 1-1.5 2-1.5s2 0.5 2 1.5-1 1-2 1-2 0-2 1 1 1.5 2 1.5 2-0.5 2-1.5" />
</>)

export const ReportIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 13V9M10 13V7M13 13v-2" />
</>)

export const PnlIcon = () => wrap(<>
  <path d="M3 17l5-5 4 4 8-9" />
  <path d="M16 7h4v4" />
</>)

export const CashFlowIcon = () => wrap(<>
  <path d="M5 8h12l-3-3M19 16H7l3 3" />
  <circle cx="5" cy="8" r="1" />
  <circle cx="19" cy="16" r="1" />
</>)

export const BalanceIcon = () => wrap(<>
  <path d="M12 4v16" />
  <path d="M4 8h16" />
  <path d="M8 8l-3 6h6z" />
  <path d="M16 8l-3 6h6z" />
</>)

export const PercentIcon = () => wrap(<>
  <circle cx="7" cy="7" r="2" />
  <circle cx="17" cy="17" r="2" />
  <path d="M19 5L5 19" />
</>)

export const VatIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 7l1 4 1-4M11 7v4M11 7h2M11 9h2" />
</>)

export const PayrollIcon = () => wrap(<>
  <rect x="4" y="5" width="13" height="9" rx="1" />
  <circle cx="10" cy="9.5" r="2" />
  <path d="M21 8v6" />
</>)

export const ReconcileIcon = () => wrap(<>
  <path d="M5 4l5 5-5 5M19 20l-5-5 5-5" />
</>)

export const EmiIcon = () => wrap(<>
  <rect x="3" y="6" width="18" height="12" rx="1.5" />
  <path d="M3 10h18" />
  <circle cx="8" cy="14" r="0.8" fill="currentColor" />
  <circle cx="12" cy="14" r="0.8" fill="currentColor" />
  <circle cx="16" cy="14" r="0.8" fill="currentColor" />
</>)

export const AmortIcon = () => wrap(<>
  <path d="M3 18h18" />
  <path d="M5 18V8M9 18v-7M13 18V5M17 18v-9" />
</>)

export const OcrIcon = () => wrap(<>
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <path d="M3 12h18" />
  <path d="M7 7h4M14 7h3M7 17h7" />
  <circle cx="7" cy="12" r="0.6" fill="currentColor" />
  <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  <circle cx="17" cy="12" r="0.6" fill="currentColor" />
</>)

export const TableIcon = () => wrap(<>
  <rect x="3" y="4" width="18" height="16" rx="1.5" />
  <path d="M3 9h18M3 14h18" />
  <path d="M9 4v16M15 4v16" />
</>)

export const CreditCardIcon = () => wrap(<>
  <rect x="3" y="6" width="18" height="13" rx="1.5" />
  <path d="M3 10h18" />
  <path d="M7 15h4" />
  <circle cx="17" cy="15" r="0.8" fill="currentColor" />
</>)

export const CoinStackIcon = () => wrap(<>
  <ellipse cx="12" cy="6" rx="7" ry="2.5" />
  <path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
  <path d="M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" />
  <path d="M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" />
</>)

export const LedgerIcon = () => wrap(<>
  <rect x="3" y="4" width="18" height="14" rx="1" />
  <path d="M12 4v14" />
  <path d="M5 8h5M5 11h5M5 14h3" />
  <path d="M14 8h5M14 11h5M14 14h3" />
</>)

export const ForecastIcon = () => wrap(<>
  <path d="M3 18h18" />
  <path d="M5 14l4-4 4 4 6-6" />
  <path d="M15 4h4v4" />
</>)

export const BudgetIcon = () => wrap(<>
  <circle cx="12" cy="12" r="9" />
  <path d="M12 3v9l8 4" />
  <path d="M12 12L4 9" />
</>)

export const InventoryIcon = () => wrap(<>
  <rect x="3" y="4" width="8" height="7" rx="1" />
  <rect x="13" y="4" width="8" height="7" rx="1" />
  <rect x="3" y="13" width="8" height="7" rx="1" />
  <rect x="13" y="13" width="8" height="7" rx="1" />
</>)

export const ContractIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 7h5M7 10h5" />
  <path d="M14 14l2 2 4-4" />
</>)

export const NdaIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M8 8h4M8 11h4M8 14h2" />
  <path d="M16 14l1 1.5L20 12" />
</>)

export const ProposalIcon = () => wrap(<>
  <rect x="4" y="3" width="11" height="14" rx="1.5" />
  <path d="M7 7h5M7 10h2M11 10h1" />
  <path d="M13 13l2 2 4-4" />
</>)

export const LetterIcon = () => wrap(<>
  <rect x="3" y="6" width="18" height="12" rx="1.5" />
  <path d="M3 8l9 6 9-6" />
</>)

export const BellIcon = () => wrap(<>
  <path d="M6 9a6 6 0 0112 0c0 4 2 5 2 6H4c0-1 2-2 2-6z" />
  <path d="M10 19a2 2 0 004 0" />
</>)

/* ---------- Brand mark ---------- */
export const BrandMark = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M4 2h6l2.5 2.5V14H4z" />
    <path d="M10 2v3h2.5" />
  </svg>
)
