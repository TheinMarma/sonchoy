import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import Footer from './components/Footer'
import CursorGlow from './components/CursorGlow'
import BackToTop from './components/BackToTop'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'

/* Lazy-load tool pages — keeps pdf.js + xlsx out of the homepage bundle. */
const InvoicePdfToExcelPage       = lazy(() => import('./pages/InvoicePdfToExcelPage'))
const InvoiceGeneratorPage        = lazy(() => import('./pages/InvoiceGeneratorPage'))
const BankStatementPdfToExcelPage = lazy(() => import('./pages/BankStatementPdfToExcelPage'))
const TaxInvoiceGeneratorPage     = lazy(() => import('./pages/TaxInvoiceGeneratorPage'))
const ProformaInvoiceGeneratorPage = lazy(() => import('./pages/ProformaInvoiceGeneratorPage'))
const GstVatInvoiceGeneratorPage   = lazy(() => import('./pages/GstVatInvoiceGeneratorPage'))
const ProfitLossStatementPage      = lazy(() => import('./pages/ProfitLossStatementPage'))
const CashFlowStatementPage        = lazy(() => import('./pages/CashFlowStatementPage'))
const BalanceSheetGeneratorPage    = lazy(() => import('./pages/BalanceSheetGeneratorPage'))
const IncomeStatementGeneratorPage = lazy(() => import('./pages/IncomeStatementGeneratorPage'))
const ExpenseTrackerSheetPage      = lazy(() => import('./pages/ExpenseTrackerSheetPage'))
const AccountsPayableReportPage    = lazy(() => import('./pages/AccountsPayableReportPage'))
const AccountsReceivableReportPage = lazy(() => import('./pages/AccountsReceivableReportPage'))
const GeneralLedgerGeneratorPage   = lazy(() => import('./pages/GeneralLedgerGeneratorPage'))
const TaxCalculationSheetPage      = lazy(() => import('./pages/TaxCalculationSheetPage'))
const VATCalculatorPDFExportPage   = lazy(() => import('./pages/VATCalculatorPDFExportPage'))
const PayrollTaxReportPage         = lazy(() => import('./pages/PayrollTaxReportPage'))
const BankReconciliationSheetPage  = lazy(() => import('./pages/BankReconciliationSheetPage'))
const ClientContractGeneratorPage  = lazy(() => import('./pages/ClientContractGeneratorPage'))
const NDAGeneratorPage             = lazy(() => import('./pages/NDAGeneratorPage'))
const ServiceAgreementGeneratorPage = lazy(() => import('./pages/ServiceAgreementGeneratorPage'))
const BusinessProposalGeneratorPage = lazy(() => import('./pages/BusinessProposalGeneratorPage'))
const PaymentReminderLetterPage    = lazy(() => import('./pages/PaymentReminderLetterPage'))
const LatePaymentNoticePage        = lazy(() => import('./pages/LatePaymentNoticePage'))
const EmiSchedulePage              = lazy(() => import('./pages/EmiSchedulePage'))
const LoanAmortizationPage         = lazy(() => import('./pages/LoanAmortizationPage'))
const GstCalculationSheetPage      = lazy(() => import('./pages/GstCalculationSheetPage'))
const IncomeTaxEstimatorPage       = lazy(() => import('./pages/IncomeTaxEstimatorPage'))
const SalesTaxReportPage           = lazy(() => import('./pages/SalesTaxReportPage'))
const TaxDeductionSummaryPage      = lazy(() => import('./pages/TaxDeductionSummaryPage'))
const BankStatementAnalyzerPage    = lazy(() => import('./pages/BankStatementAnalyzerPage'))
const InterestCalcPage             = lazy(() => import('./pages/InterestCalcPage'))
const MonthlyLoanPaymentPage       = lazy(() => import('./pages/MonthlyLoanPaymentPage'))
const CreditCardPaymentSchedulePage = lazy(() => import('./pages/CreditCardPaymentSchedulePage'))
const MortgagePaymentPage          = lazy(() => import('./pages/MortgagePaymentPage'))
const SavingsInterestReportPage    = lazy(() => import('./pages/SavingsInterestReportPage'))
const TrialBalancePage             = lazy(() => import('./pages/TrialBalancePage'))
const MonthlyFinancialSummaryPage  = lazy(() => import('./pages/MonthlyFinancialSummaryPage'))
const RevenueReportPage            = lazy(() => import('./pages/RevenueReportPage'))
const BusinessExpenseBreakdownPage = lazy(() => import('./pages/BusinessExpenseBreakdownPage'))
const PayrollSummaryPage           = lazy(() => import('./pages/PayrollSummaryPage'))
const TaxSummaryReportPage         = lazy(() => import('./pages/TaxSummaryReportPage'))
const BudgetPlanningPage           = lazy(() => import('./pages/BudgetPlanningPage'))
const FinancialForecastPage        = lazy(() => import('./pages/FinancialForecastPage'))
const QuotationGeneratorPage       = lazy(() => import('./pages/QuotationGeneratorPage'))
const ReceiptGeneratorPage         = lazy(() => import('./pages/ReceiptGeneratorPage'))

function ToolPageFallback() {
  return (
    <div className="flex min-h-[480px] items-center justify-center px-6">
      <div className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-500">
        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-crimson-500 border-t-transparent" />
        Loading tool…
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CursorGlow />
      <TopNav />
      <Suspense fallback={<ToolPageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/tools/invoice-pdf-to-excel"
            element={<InvoicePdfToExcelPage />}
          />
          <Route
            path="/tools/invoice-generator"
            element={<InvoiceGeneratorPage />}
          />
          <Route
            path="/tools/bank-statement-pdf-to-excel"
            element={<BankStatementPdfToExcelPage />}
          />
          <Route
            path="/tools/tax-invoice-generator"
            element={<TaxInvoiceGeneratorPage />}
          />
          <Route
            path="/tools/proforma-invoice-generator"
            element={<ProformaInvoiceGeneratorPage />}
          />
          <Route
            path="/tools/gst-vat-invoice-generator"
            element={<GstVatInvoiceGeneratorPage />}
          />
          <Route
            path="/tools/profit-loss-statement"
            element={<ProfitLossStatementPage />}
          />
          <Route
            path="/tools/cash-flow-statement"
            element={<CashFlowStatementPage />}
          />
          <Route
            path="/tools/balance-sheet-generator"
            element={<BalanceSheetGeneratorPage />}
          />
          <Route
            path="/tools/income-statement-generator"
            element={<IncomeStatementGeneratorPage />}
          />
          <Route
            path="/tools/expense-tracker-sheet"
            element={<ExpenseTrackerSheetPage />}
          />
          <Route
            path="/tools/accounts-payable-report"
            element={<AccountsPayableReportPage />}
          />
          <Route
            path="/tools/accounts-receivable-report"
            element={<AccountsReceivableReportPage />}
          />
          <Route
            path="/tools/general-ledger-generator"
            element={<GeneralLedgerGeneratorPage />}
          />
          <Route
            path="/tools/tax-calculation-sheet"
            element={<TaxCalculationSheetPage />}
          />
          <Route
            path="/tools/vat-calculator-pdf-export"
            element={<VATCalculatorPDFExportPage />}
          />
          <Route
            path="/tools/payroll-tax-report"
            element={<PayrollTaxReportPage />}
          />
          <Route
            path="/tools/bank-reconciliation-sheet"
            element={<BankReconciliationSheetPage />}
          />
          <Route
            path="/tools/client-contract-generator"
            element={<ClientContractGeneratorPage />}
          />
          <Route
            path="/tools/nda-generator"
            element={<NDAGeneratorPage />}
          />
          <Route
            path="/tools/service-agreement-generator"
            element={<ServiceAgreementGeneratorPage />}
          />
          <Route
            path="/tools/business-proposal-generator"
            element={<BusinessProposalGeneratorPage />}
          />
          <Route
            path="/tools/payment-reminder-letter"
            element={<PaymentReminderLetterPage />}
          />
          <Route
            path="/tools/late-payment-notice"
            element={<LatePaymentNoticePage />}
          />
          <Route
            path="/tools/emi-schedule"
            element={<EmiSchedulePage />}
          />
          <Route
            path="/tools/loan-amortization"
            element={<LoanAmortizationPage />}
          />
          <Route
            path="/tools/gst-calculation-sheet"
            element={<GstCalculationSheetPage />}
          />
          <Route
            path="/tools/income-tax-estimator"
            element={<IncomeTaxEstimatorPage />}
          />
          <Route
            path="/tools/sales-tax-report"
            element={<SalesTaxReportPage />}
          />
          <Route
            path="/tools/tax-deduction-summary"
            element={<TaxDeductionSummaryPage />}
          />
          <Route
            path="/tools/bank-statement-analyzer"
            element={<BankStatementAnalyzerPage />}
          />
          <Route
            path="/tools/interest-calculation-sheet"
            element={<InterestCalcPage />}
          />
          <Route
            path="/tools/monthly-loan-payment"
            element={<MonthlyLoanPaymentPage />}
          />
          <Route
            path="/tools/credit-card-payment-schedule"
            element={<CreditCardPaymentSchedulePage />}
          />
          <Route
            path="/tools/mortgage-payment"
            element={<MortgagePaymentPage />}
          />
          <Route
            path="/tools/savings-interest-report"
            element={<SavingsInterestReportPage />}
          />
          <Route
            path="/tools/trial-balance"
            element={<TrialBalancePage />}
          />
          <Route
            path="/tools/monthly-financial-summary"
            element={<MonthlyFinancialSummaryPage />}
          />
          <Route
            path="/tools/revenue-report"
            element={<RevenueReportPage />}
          />
          <Route
            path="/tools/business-expense-breakdown"
            element={<BusinessExpenseBreakdownPage />}
          />
          <Route
            path="/tools/payroll-summary"
            element={<PayrollSummaryPage />}
          />
          <Route
            path="/tools/tax-summary-report"
            element={<TaxSummaryReportPage />}
          />
          <Route
            path="/tools/budget-planning-sheet"
            element={<BudgetPlanningPage />}
          />
          <Route
            path="/tools/financial-forecast"
            element={<FinancialForecastPage />}
          />
          <Route
            path="/tools/quotation-generator"
            element={<QuotationGeneratorPage />}
          />
          <Route
            path="/tools/receipt-generator"
            element={<ReceiptGeneratorPage />}
          />
        </Routes>
      </Suspense>
      <Footer />
      <BackToTop />
    </BrowserRouter>
  )
}
