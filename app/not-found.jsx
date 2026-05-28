'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight, SearchIcon,
  InvoiceIcon, QuoteIcon, ReceiptIcon, POIcon,
  PnlIcon, ExpenseIcon, BankStatementIcon, ReportIcon,
} from '@/components/icons'

/* Popular tools surfaced when a route 404s — keeps users one click
   from something useful instead of a dead-end. */
const POPULAR = [
  { name: 'Invoice Generator',         path: '/tools/invoice-generator',          Icon: InvoiceIcon,        label: 'INVOICING' },
  { name: 'Quotation Generator',       path: '/tools/quotation-generator',         Icon: QuoteIcon,          label: 'DOCUMENTS' },
  { name: 'Receipt Generator',         path: '/tools/receipt-generator',           Icon: ReceiptIcon,        label: 'DOCUMENTS' },
  { name: 'Purchase Order',            path: '/tools/purchase-order-generator',    Icon: POIcon,             label: 'DOCUMENTS' },
  { name: 'Profit & Loss',             path: '/tools/profit-loss-statement',       Icon: PnlIcon,            label: 'ACCOUNTING' },
  { name: 'Expense Report',            path: '/tools/expense-report-generator',    Icon: ExpenseIcon,        label: 'DOCUMENTS' },
  { name: 'Bank Statement → Excel',    path: '/tools/bank-statement-pdf-to-excel', Icon: BankStatementIcon,  label: 'CONVERT' },
  { name: 'Monthly Financial Summary', path: '/tools/monthly-financial-summary',   Icon: ReportIcon,         label: 'ACCOUNTING' },
]

export default function NotFoundPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [q, setQ] = useState('')

  const submitSearch = (e) => {
    e?.preventDefault()
    const value = q.trim()
    if (!value) {
      router.push('/#tools')
      return
    }
    router.push(`/#tools?q=${encodeURIComponent(value)}`)
  }

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      {/* Background glows + grid — same language as the hero pattern */}
      <div aria-hidden className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 60%)' }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />

      <div className="relative mx-auto max-w-[1240px] px-6 py-20 md:py-28">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">
          <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
          <span className="text-ink-400">/</span>
          <span className="text-crimson-300">404 · Not found</span>
        </nav>

        {/* Eyebrow pill */}
        <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-crimson-500/30 bg-crimson-500/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
          <span className="h-1.5 w-1.5 rounded-full bg-crimson-500 shadow-[0_0_0_4px_rgba(237,40,40,0.25)]" />
          Error · 404
        </span>

        {/* Big number — typographic, not a stock illustration */}
        <p className="m-0 mb-4 font-serif text-[120px] font-medium leading-[0.9] tracking-[-0.04em] text-ink-950 md:text-[200px]">
          4<em className="font-serif font-normal italic text-crimson-300">0</em>4
        </p>

        <h1 className="mb-7 max-w-[860px] font-medium text-[40px] leading-[1.04] tracking-[-0.03em] text-ink-950 md:text-[64px] md:leading-[1.02]">
          That page{' '}
          <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
            wandered off.
          </em>
        </h1>

        <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
          The URL{' '}
          <code className="rounded-sm border border-line bg-surface px-1.5 py-0.5 font-mono text-[14px] text-ink-900">
            {pathname || '/'}
          </code>{' '}
          doesn&rsquo;t match a tool, page, or article on Sonchoy. It may have moved, been renamed, or never existed. Search the tools below, or jump back to the homepage.
        </p>

        {/* Search */}
        <form role="search" onSubmit={submitSearch} className="mb-6 max-w-[560px]">
          <div className="relative">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search 90+ tools — invoice, GST, P&L, bank statement…"
              aria-label="Search tools"
              autoFocus
              className="w-full rounded-lg border border-line bg-surface py-3.5 pl-11 pr-4 text-[15px] text-ink-950 placeholder:text-ink-500 transition-colors focus:border-crimson-500/60 focus:outline-none focus:ring-2 focus:ring-crimson-500/25"
            />
          </div>
        </form>

        {/* CTAs */}
        <div className="mb-14 flex flex-wrap items-center gap-3">
          <Link href="/" className="btn btn-cta btn-xl">
            Back to homepage <ArrowRight size={16} />
          </Link>
          <Link href="/#tools" className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-950/15 bg-ink-950/5 px-7 py-[18px] text-[16px] font-medium leading-none text-ink-950 no-underline backdrop-blur-sm transition-colors hover:bg-ink-950/10 capitalize">
            Browse all tools
          </Link>
        </div>

        {/* Popular tools */}
        <div>
          <p className="m-0 mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">
            Or jump straight to a popular tool
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR.map((t) => (
              <Link
                key={t.path}
                href={t.path}
                className="group relative flex items-center gap-3 rounded-lg border border-line bg-surface p-4 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-canvas text-ink-700 transition-colors group-hover:bg-crimson-500/10 group-hover:text-crimson-300">
                  <t.Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink-950">{t.name}</span>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">{t.label}</span>
                </div>
                <ArrowRight size={12} className="shrink-0 text-ink-500 transition-colors group-hover:text-crimson-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* Footnote */}
        <p className="m-0 mt-12 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
          Reached this page from a link on Sonchoy?{' '}
          <a
            href="mailto:hello@sonchoy.com?subject=Broken%20link%20on%20Sonchoy"
            className="text-crimson-300 no-underline hover:text-crimson-400"
          >
            Let us know
          </a>
          {' '}so we can fix it.
        </p>
      </div>
    </main>
  )
}
