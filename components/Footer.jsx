import Link from 'next/link'

const COLS = [
  {
    title: 'Invoicing & Quotes',
    links: [
      ['Invoice Generator',          '/tools/invoice-generator'],
      ['Tax Invoice Generator',      '/tools/tax-invoice-generator'],
      ['Proforma Invoice',           '/tools/proforma-invoice-generator'],
      ['GST / VAT Invoice',          '/tools/gst-vat-invoice-generator'],
      ['Quotation Generator',        '/tools/quotation-generator'],
    ],
  },
  {
    title: 'Accounting & Reports',
    links: [
      ['Profit & Loss Statement',    '/tools/profit-loss-statement'],
      ['Cash Flow Statement',        '/tools/cash-flow-statement'],
      ['Balance Sheet',              '/tools/balance-sheet-generator'],
      ['Trial Balance',              '/tools/trial-balance'],
      ['Monthly Financial Summary',  '/tools/monthly-financial-summary'],
      ['Budget Planning Sheet',      '/tools/budget-planning-sheet'],
      ['Financial Forecast',         '/tools/financial-forecast'],
    ],
  },
  {
    title: 'Tax & Banking',
    links: [
      ['Tax Calculation Sheet',      '/tools/tax-calculation-sheet'],
      ['GST Calculation Sheet',      '/tools/gst-calculation-sheet'],
      ['Income Tax Estimator',       '/tools/income-tax-estimator'],
      ['Bank Reconciliation',        '/tools/bank-reconciliation-sheet'],
      ['EMI Schedule',               '/tools/emi-schedule'],
      ['Mortgage Payment',           '/tools/mortgage-payment'],
      ['Interest Calculation',       '/tools/interest-calculation-sheet'],
    ],
  },
  {
    title: 'Contracts & Letters',
    links: [
      ['Client Contract',            '/tools/client-contract-generator'],
      ['NDA Generator',              '/tools/nda-generator'],
      ['Service Agreement',          '/tools/service-agreement-generator'],
      ['Business Proposal',          '/tools/business-proposal-generator'],
      ['Payment Reminder Letter',    '/tools/payment-reminder-letter'],
      ['Late Payment Notice',        '/tools/late-payment-notice'],
    ],
  },
  {
    title: 'PDF & Convert',
    links: [
      ['Invoice PDF to Excel',       '/tools/invoice-pdf-to-excel'],
      ['Bank Statement PDF to Excel', '/tools/bank-statement-pdf-to-excel'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-canvas px-10 pt-18 pb-8 text-ink-950">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-10 border-b border-line pb-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]">
          <div>
            <p className="m-0 mb-4 font-serif text-[32px] font-medium tracking-[-0.02em] text-ink-950">
              son<b className="not-italic font-medium italic text-crimson-400">choy</b>
            </p>
            <p className="m-0 max-w-[320px] text-[14px] leading-[1.55] text-ink-600">
              The finance &amp; billing document workspace for freelancers, accountants, agencies, and small businesses. Free generators, free extractors, premium when you need scale.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h6 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500 m-0">
                {col.title}
              </h6>
              {col.links.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="block py-1.5 text-[13px] text-ink-700 no-underline hover:text-ink-950 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-3 pt-6 text-[12px] text-ink-500 md:flex-row md:items-center">
          <span className="font-mono uppercase tracking-[0.06em]">
            © 2026 Sonchoy · Built for finance teams
          </span>
          <div className="flex gap-4">
            <Link href="/about" className="text-ink-500 no-underline hover:text-ink-950 transition-colors">About</Link>
            <Link href="/contact" className="text-ink-500 no-underline hover:text-ink-950 transition-colors">Contact</Link>
            <Link href="/terms" className="text-ink-500 no-underline hover:text-ink-950 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-ink-500 no-underline hover:text-ink-950 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
