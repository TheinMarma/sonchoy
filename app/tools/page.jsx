import Link from 'next/link'
import { TOOLS_META } from '@/lib/tools-data'
import { pageMetadata, withTrailingSlash } from '@/lib/seo'

/**
 * /tools/ — a plain, server-rendered index of every tool.
 *
 * The homepage grid only renders the first 16 tools until "View all" is
 * clicked, so crawlers never saw links to the rest (orphan pages). This
 * page links every routable tool in static HTML, grouped by category.
 */
export const metadata = pageMetadata({
  path:  '/tools/',
  title: `All ${TOOLS_META.length} Free Finance & PDF Tools`,
  description:
    'Browse every free Sonchoy tool — invoice generators, PDF to Excel converters, accounting reports, tax calculators, and contracts. All run in your browser.',
})

const GROUPS = [
  { id: 'invoicing',  label: 'Invoicing',     blurb: 'Invoices of every kind — numbered, taxed, templated, and ready to send.' },
  { id: 'conversion', label: 'Convert',       blurb: 'Move data between PDF, Excel, CSV, and images without retyping a line.' },
  { id: 'pdf',        label: 'PDF tools',     blurb: 'Merge, split, sign, compress, and protect financial PDFs.' },
  { id: 'documents',  label: 'Documents',     blurb: 'Quotes, receipts, purchase orders, delivery notes, payslips, and expense reports.' },
  { id: 'accounting', label: 'Accounting',    blurb: 'P&L, balance sheets, cash flow, ledgers, and forecasts.' },
  { id: 'tax',        label: 'Tax & banking', blurb: 'Tax workings, loan schedules, reconciliations, and statement analysis.' },
  { id: 'contracts',  label: 'Contracts',     blurb: 'Client contracts, NDAs, proposals, and payment letters.' },
]

export default function ToolsIndexPage() {
  return (
    <main className="bg-paper text-ink-900">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 -right-48 h-[560px] w-[560px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
        />
        <div className="relative mx-auto max-w-[1240px] px-6 py-20 md:py-24">
          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500"
          >
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">
              Home
            </Link>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">All tools</span>
          </nav>

          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
            The toolkit · {TOOLS_META.length} tools
          </p>
          <h1 className="mb-5 mt-3 max-w-[860px] font-medium text-[44px] leading-[1.02] tracking-[-0.03em] text-ink-950 md:text-[64px] md:leading-[0.98]">
            Every free{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              finance &amp; PDF
            </em>{' '}
            tool, in one place.
          </h1>
          <p className="m-0 max-w-[640px] text-[17px] leading-[1.6] text-ink-700">
            Generators, converters, reports, and calculators for invoicing,
            accounting, tax, and contracts. Every tool runs in your browser —
            no signup, and your files never leave your device.
          </p>
        </div>
      </section>

      {GROUPS.map((group) => {
        const tools = TOOLS_META.filter((t) => t.group === group.id)
        if (!tools.length) return null
        return (
          <section key={group.id} id={group.id} className="border-t border-line">
            <div className="mx-auto max-w-[1240px] px-6 py-14">
              <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <h2 className="m-0 text-3xl font-medium tracking-[-0.02em] text-ink-950">
                  {group.label}{' '}
                  <span className="font-mono text-[13px] font-normal tracking-[0.04em] text-ink-500">
                    {tools.length}
                  </span>
                </h2>
                <p className="m-0 max-w-[480px] text-[14px] leading-[1.55] text-ink-600">
                  {group.blurb}
                </p>
              </div>
              <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <li key={tool.path}>
                    <Link
                      href={withTrailingSlash(tool.path)}
                      className="block h-full rounded-lg border border-line bg-surface p-5 no-underline transition-colors hover:border-line-strong"
                    >
                      <h3 className="m-0 mb-1 text-md font-medium tracking-[-0.01em] text-ink-950">
                        {tool.name}
                      </h3>
                      <p className="m-0 text-xs leading-[1.5] text-ink-500">{tool.desc}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )
      })}
    </main>
  )
}
