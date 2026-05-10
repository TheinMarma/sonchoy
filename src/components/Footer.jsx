const COLS = [
  { title: 'Invoicing',     links: ['Invoice generator', 'Tax invoice', 'GST/VAT invoice', 'Recurring invoice', 'Freelance invoice', 'Invoice template'] },
  { title: 'Documents',     links: ['Quotation', 'Receipt', 'Purchase order', 'Salary slip', 'Expense report', 'Financial report'] },
  { title: 'Accounting',    links: ['Profit & Loss', 'Cash Flow', 'Balance Sheet', 'Trial balance', 'General ledger', 'Financial forecast'] },
  { title: 'Tax & banking', links: ['Tax calculation sheet', 'GST calculation', 'Bank reconciliation', 'EMI schedule', 'Mortgage payment', 'Investment return'] },
  { title: 'PDF & convert', links: ['Bank statement → Excel', 'Invoice PDF → Excel', 'OCR receipt to text', 'Merge financial PDFs', 'Compress invoices', 'Add signature'] },
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
              {col.links.map((label) => (
                <a
                  key={label}
                  href="#"
                  className="block py-1.5 text-[13px] text-ink-700 no-underline hover:text-ink-950 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-3 pt-6 text-[12px] text-ink-500 md:flex-row md:items-center">
          <span className="font-mono uppercase tracking-[0.06em]">
            © 2026 Sonchoy · Built for finance teams
          </span>
          <div className="flex gap-4">
            <a href="#" className="text-ink-500 no-underline hover:text-ink-950 transition-colors">Terms</a>
            <a href="#" className="text-ink-500 no-underline hover:text-ink-950 transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
