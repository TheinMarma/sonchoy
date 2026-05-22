import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BrandMark, Caret, ArrowRight, SearchIcon } from './icons'

/* Click handler for in-page hash anchors (#tools).
   When already on the homepage, just scroll. When on a sub-route, navigate
   to /#tools so ScrollToTop scrolls to the section after the route mounts. */
function useToolsAnchorHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  return (e) => {
    if (e?.metaKey || e?.ctrlKey || e?.shiftKey || (e && e.button !== 0 && e.button !== undefined)) return
    e?.preventDefault?.()
    if (location.pathname === '/') {
      const el = document.getElementById('tools')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.location.hash = 'tools'
    } else {
      navigate('/#tools')
    }
  }
}

/* ---------- Mega-menu data ---------- */

const MENUS = {
  invoicing: {
    label: 'Invoicing',
    columns: [
      {
        title: 'Invoice generators',
        items: [
          ['Invoice generator',          'General-purpose, branded',          '/tools/invoice-generator'],
          ['Tax invoice',                'HSN/SAC, tax breakdowns',           '/tools/tax-invoice-generator'],
          ['Proforma invoice',           'Pre-quote, converts later',         '/tools/proforma-invoice-generator'],
          ['GST / VAT invoice',          'Multi-rate, reverse charge',        '/tools/gst-vat-invoice-generator'],
        ],
      },
      {
        title: 'Quotes & receipts',
        items: [
          ['Quotation generator',        'Itemised, tax-aware quotes',        '/tools/quotation-generator'],
          ['Receipt generator',          'Issue on payment received',         '/tools/receipt-generator'],
        ],
      },
    ],
    seeAll: 'View all invoicing tools',
  },
  accounting: {
    label: 'Accounting',
    columns: [
      {
        title: 'Statements & ledgers',
        items: [
          ['Profit & Loss',              'P&L from CSV or trial balance',     '/tools/profit-loss-statement'],
          ['Cash Flow',                  'Operating, investing, financing',   '/tools/cash-flow-statement'],
          ['Balance Sheet',              'Tied-out, PDF-exported',            '/tools/balance-sheet-generator'],
          ['Income statement',           'Revenue, expenses, net income',     '/tools/income-statement-generator'],
          ['General ledger',             'Chronological transaction log',     '/tools/general-ledger-generator'],
          ['Trial balance',              'Debits & credits, audit-ready',     '/tools/trial-balance'],
          ['Accounts payable',           'Vendor invoices & ageing',          '/tools/accounts-payable-report'],
          ['Accounts receivable',        'Customer dues & ageing',            '/tools/accounts-receivable-report'],
        ],
      },
      {
        title: 'Reports & planning',
        items: [
          ['Monthly financial summary',  'P&L, cash, KPIs in one PDF',        '/tools/monthly-financial-summary'],
          ['Revenue report',             'Channels, segments, growth',        '/tools/revenue-report'],
          ['Business expense breakdown', 'Category-level spend',              '/tools/business-expense-breakdown'],
          ['Payroll summary',            'Gross, deductions, net',            '/tools/payroll-summary'],
          ['Expense tracker sheet',      'Daily logging in XLSX',             '/tools/expense-tracker-sheet'],
          ['Budget planning sheet',      'Plan vs. actual variance',          '/tools/budget-planning-sheet'],
          ['Financial forecast',         '12-month projection',               '/tools/financial-forecast'],
        ],
      },
    ],
    seeAll: 'View all accounting tools',
  },
  tax: {
    label: 'Tax & Banking',
    columns: [
      {
        title: 'Tax',
        items: [
          ['Tax calculation sheet',      'Income, slabs, deductions',         '/tools/tax-calculation-sheet'],
          ['GST calculation sheet',      'Multi-rate GST workings',           '/tools/gst-calculation-sheet'],
          ['VAT calculator',             'Forward + reverse VAT',             '/tools/vat-calculator-pdf-export'],
          ['Income tax estimator',       'Slab-based estimate',               '/tools/income-tax-estimator'],
          ['Sales tax report',           'Period totals & filings',           '/tools/sales-tax-report'],
          ['Tax deduction summary',      'Deductions consolidated',           '/tools/tax-deduction-summary'],
          ['Tax summary report',         'Year-end tax PDF',                  '/tools/tax-summary-report'],
          ['Payroll tax report',         'Withholding & contributions',       '/tools/payroll-tax-report'],
        ],
      },
      {
        title: 'Banking & loans',
        items: [
          ['Bank reconciliation',        'Book vs. statement match',          '/tools/bank-reconciliation-sheet'],
          ['EMI schedule',               'Principal / interest split',        '/tools/emi-schedule'],
          ['Loan amortization',          'Full amortization table',           '/tools/loan-amortization'],
          ['Monthly loan payment',       'Affordable EMI calculator',         '/tools/monthly-loan-payment'],
          ['Credit card schedule',       'Payoff timeline + interest',        '/tools/credit-card-payment-schedule'],
          ['Mortgage payment',           'Escrow, taxes, balance',            '/tools/mortgage-payment'],
          ['Savings interest report',    'Compounded projections',            '/tools/savings-interest-report'],
          ['Interest calculation',       'Simple & compound interest',        '/tools/interest-calculation-sheet'],
        ],
      },
    ],
    seeAll: 'View all tax & banking tools',
  },
  documents: {
    label: 'Documents',
    columns: [
      {
        title: 'Contracts',
        items: [
          ['Client contract',            'Scope, payment, termination',       '/tools/client-contract-generator'],
          ['NDA generator',              'Mutual or one-way NDA',             '/tools/nda-generator'],
          ['Service agreement',          'Services, SLA, deliverables',       '/tools/service-agreement-generator'],
          ['Business proposal',          'Pitch + pricing in one PDF',        '/tools/business-proposal-generator'],
        ],
      },
      {
        title: 'Letters & PDF tools',
        items: [
          ['Payment reminder letter',    'Polite, dated, branded',            '/tools/payment-reminder-letter'],
          ['Late payment notice',        'Final-notice with terms',           '/tools/late-payment-notice'],
          ['Invoice PDF → Excel',        'Line items, totals, tax',           '/tools/invoice-pdf-to-excel'],
          ['Bank statement → Excel',     'Reconciled rows from PDFs',         '/tools/bank-statement-pdf-to-excel'],
          ['Bank statement analyzer',    'Insights & categorised spend',      '/tools/bank-statement-analyzer'],
        ],
      },
    ],
    seeAll: 'View all document & PDF tools',
  },
}

const MENU_IDS = ['invoicing', 'accounting', 'tax', 'documents']

/* ---------- Brand mark (shared by desktop nav + mobile drawer) ---------- */

function Brand({ onClick }) {
  return (
    <a
      href="/"
      onClick={onClick}
      className="flex items-center gap-2.5 font-serif text-[22px] font-medium tracking-[-0.02em] text-ink-950 no-underline min-[939px]:text-[24px]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface border border-line text-ink-950">
        <BrandMark size={18} />
      </span>
      <span>son<b className="not-italic font-medium italic text-crimson-400">choy</b></span>
    </a>
  )
}

/* ---------- Desktop mega menu ---------- */

function MegaMenu({ menu }) {
  const handleToolsClick = useToolsAnchorHandler()
  return (
    <div className="absolute left-0 top-full z-50 pt-2">
      <div className="w-[640px] rounded-lg border border-line bg-surface p-5 shadow-xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {menu.columns.map((col) => (
            <div key={col.title}>
              <h6 className="mb-2 px-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500">
                {col.title}
              </h6>
              {col.items.map(([name, desc, path]) => (
                <Link
                  key={name}
                  to={path}
                  className="group flex items-baseline gap-3 rounded-sm px-2 py-1.5 no-underline transition-colors hover:bg-canvas"
                >
                  <span className="text-[13px] font-medium text-ink-900 group-hover:text-crimson-300">
                    {name}
                  </span>
                  <span className="ml-auto text-[11px] text-ink-500 group-hover:text-ink-700">
                    {desc}
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <a
            href="/#tools"
            onClick={handleToolsClick}
            className="inline-flex items-center gap-2 px-2 text-[13px] font-medium text-crimson-300 no-underline hover:text-crimson-400"
          >
            {menu.seeAll}
            <ArrowRight size={12} />
          </a>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">
            All tools free · no signup
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---------- Header search ---------- */

function HeaderSearch({ onSubmit, compact = false }) {
  const [q, setQ] = useState('')

  const submit = (e) => {
    e?.preventDefault()
    const value = q.trim()
    if (!value) return
    // Route to home + #tools with a query string in the hash
    const target = `/#tools?q=${encodeURIComponent(value)}`
    if (typeof window !== 'undefined') {
      // If we're already on the home page, just update the hash so
      // the hashchange listener in ToolsSection picks it up.
      if (window.location.pathname === '/') {
        window.location.hash = `tools?q=${encodeURIComponent(value)}`
      } else {
        window.location.href = target
      }
    }
    onSubmit?.()
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className={`relative ${compact ? 'w-full' : 'w-[220px] xl:w-[280px]'}`}
    >
      <SearchIcon
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search tools…"
        aria-label="Search tools"
        className="w-full rounded-md border border-line bg-surface py-2 pl-9 pr-3 text-[13px] text-ink-950 placeholder:text-ink-500 transition-colors focus:border-crimson-500/60 focus:outline-none focus:ring-2 focus:ring-crimson-500/25"
      />
    </form>
  )
}

function NavLink({ href, children, onClick }) {
  const handleToolsClick = useToolsAnchorHandler()
  const isToolsAnchor = href === '#tools' || href === '/#tools'
  return (
    <a
      href={isToolsAnchor ? '/#tools' : href}
      onClick={(e) => {
        if (isToolsAnchor) handleToolsClick(e)
        onClick?.(e)
      }}
      className="flex items-center gap-1.5 px-3.5 py-2 text-[14px] font-medium text-ink-700 rounded-sm hover:bg-surface hover:text-ink-950 no-underline transition-colors"
    >
      {children}
    </a>
  )
}

function NavMenuTrigger({ id, openMenu, setOpenMenu }) {
  const menu = MENUS[id]
  const open = openMenu === id
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpenMenu(id)}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <button
        type="button"
        onClick={() => setOpenMenu(open ? null : id)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 px-3.5 py-2 text-[14px] font-medium rounded-sm no-underline transition-colors ${
          open
            ? 'bg-surface text-ink-950'
            : 'text-ink-700 hover:bg-surface hover:text-ink-950'
        }`}
      >
        {menu.label}
        <Caret
          className={`w-2.5 h-2.5 transition-transform ${
            open ? 'rotate-180 text-ink-300' : 'text-ink-500'
          }`}
        />
      </button>
      {open && <MegaMenu menu={menu} />}
    </div>
  )
}

/* ---------- Mobile drawer item ---------- */

function MobileSection({ id, expanded, setExpanded, onClose }) {
  const menu = MENUS[id]
  const isExp = expanded === id
  const handleToolsClick = useToolsAnchorHandler()
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setExpanded(isExp ? null : id)}
        aria-expanded={isExp}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-[16px] font-medium text-ink-950">{menu.label}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border border-line transition-transform ${
            isExp ? 'rotate-180 bg-surface' : ''
          }`}
        >
          <Caret className="h-3 w-3 text-ink-500" />
        </span>
      </button>

      <div
        className="grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isExp ? '1fr' : '0fr' }}
      >
        <div className="min-h-0">
          <div className="space-y-5 pb-5">
            {menu.columns.map((col) => (
              <div key={col.title}>
                <h6 className="m-0 mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500">
                  {col.title}
                </h6>
                <ul className="m-0 list-none space-y-2.5 p-0">
                  {menu.columns.find(c => c.title === col.title).items.map(([name, desc, path]) => (
                    <li key={name}>
                      <Link
                        to={path}
                        onClick={onClose}
                        className="block no-underline"
                      >
                        <span className="block text-[14px] font-medium text-ink-900">
                          {name}
                        </span>
                        <span className="block text-[11px] text-ink-500">{desc}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <a
              href="/#tools"
              onClick={(e) => { handleToolsClick(e); onClose?.(e) }}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-crimson-300 no-underline hover:text-crimson-400"
            >
              {menu.seeAll}
              <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- TopNav ---------- */

export default function TopNav() {
  const [openMenu, setOpenMenu] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const handleToolsClick = useToolsAnchorHandler()

  // Close on Escape
  useEffect(() => {
    if (!openMenu && !mobileOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openMenu, mobileOpen])

  // Lock body scroll while drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const closeMobile = () => {
    setMobileOpen(false)
    setMobileExpanded(null)
  }

  return (
    <>
      <nav className="sticky top-0 z-40 flex items-center gap-4 border-b border-line bg-paper/80 px-4 py-3 backdrop-blur-md backdrop-saturate-150 min-[939px]:gap-8 min-[939px]:px-8 min-[939px]:py-3.5">
        <Brand />

        {/* Desktop nav items */}
        <div className="hidden flex-1 gap-1 min-[939px]:flex">
          {MENU_IDS.map((id) => (
            <NavMenuTrigger key={id} id={id} openMenu={openMenu} setOpenMenu={setOpenMenu} />
          ))}
          <NavLink href="#tools">All tools</NavLink>
        </div>

        {/* Right-side group: search (desktop) + CTA + hamburger */}
        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden min-[939px]:block">
            <HeaderSearch />
          </div>

          <a
            href="https://go.sonchoy.com/pdfFiller"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary !hidden min-[939px]:!inline-flex"
          >
            Try Premium Free
            <ArrowRight size={12} />
          </a>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-ink-950 transition-colors hover:bg-ink-100 min-[939px]:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M3 7h16M3 12h16M3 17h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-paper min-[939px]:hidden"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <Brand onClick={closeMobile} />
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMobile}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-ink-950 transition-colors hover:bg-ink-100"
            >
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M5 5l12 12M17 5L5 17" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <div className="py-4">
              <HeaderSearch compact onSubmit={closeMobile} />
            </div>
            {MENU_IDS.map((id) => (
              <MobileSection
                key={id}
                id={id}
                expanded={mobileExpanded}
                setExpanded={setMobileExpanded}
                onClose={closeMobile}
              />
            ))}
            <a
              href="/#tools"
              onClick={(e) => { handleToolsClick(e); closeMobile() }}
              className="block border-b border-line py-4 text-[16px] font-medium text-ink-950 no-underline"
            >
              All tools
            </a>
          </div>

          <div className="border-t border-line bg-canvas px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <a
              href="https://go.sonchoy.com/pdfFiller"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobile}
              className="btn btn-primary w-full"
            >
              Try Premium Free
              <ArrowRight size={12} />
            </a>
          </div>
        </div>
      )}
    </>
  )
}
