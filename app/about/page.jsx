import Link from 'next/link'

export const metadata = {
  title: 'About Sonchoy — Free Finance & PDF Tools',
  description:
    'Sonchoy builds free, privacy-first finance and PDF tools that run entirely in your browser. 90+ generators, converters, and calculators — no signup, no uploads.',
  alternates: { canonical: '/about/' },
  openGraph: {
    title:       'About Sonchoy — Free Finance & PDF Tools',
    description: 'The story behind 90+ free, privacy-first finance and PDF tools.',
    url:         'https://sonchoy.com/about/',
    type:        'website',
    siteName:    'Sonchoy',
  },
}

const PRINCIPLES = [
  {
    title: 'Free where it counts',
    body:
      "Every generator and extractor here runs at zero cost. We don't paywall the basics. The few links you'll see to paid services (like pdfFiller) are clearly labelled and only appear where they genuinely add capability beyond what a browser can do.",
  },
  {
    title: 'Your files never leave your browser',
    body:
      "We have no upload pipeline. PDFs, statements, invoices, and spreadsheets are processed entirely in your browser via JavaScript. We can't see them because we never receive them. Read the Privacy page for the architectural details.",
  },
  {
    title: 'Built for real finance workflows',
    body:
      "Each tool is shaped by how accountants, CAs, freelancers, and small-business owners actually work — GST/VAT slabs, invoice numbering schemes, P&L conventions, bank statement formats. Not generic SaaS templates.",
  },
  {
    title: 'Fast, focused, no signup',
    body:
      "Open a URL, do the job, close the tab. No account creation, no email capture, no onboarding flow. We measure success by how quickly you get the file you needed.",
  },
]

const STATS = [
  ['90+',    'Free tools across invoicing, accounting, tax, and PDFs'],
  ['0',      'Files uploaded to our servers — ever'],
  ['100%',   'Of processing runs in your browser'],
  ['$0',     'For everything on this site'],
]

export default function AboutPage() {
  return (
    <main className="bg-paper text-ink-900">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 -right-48 h-[560px] w-[560px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
        />
        <div className="relative mx-auto max-w-[860px] px-6 py-20 md:py-24">
          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500"
          >
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">
              Home
            </Link>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">About</span>
          </nav>

          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
            About · Sonchoy
          </p>
          <h1 className="mb-5 mt-3 font-medium text-[44px] leading-[1.02] tracking-[-0.03em] text-ink-950 md:text-[64px] md:leading-[0.98]">
            Finance tools that{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              respect your time
            </em>{' '}
            and your files.
          </h1>
          <p className="m-0 max-w-[640px] text-[17px] leading-[1.6] text-ink-700">
            Sonchoy is a free toolkit of invoice generators, PDF converters,
            accounting reports, and tax calculators. Everything runs in your
            browser. Nothing leaves your device. No signup required.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-line bg-canvas">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-y-8 px-6 py-12 md:grid-cols-4">
          {STATS.map(([n, label]) => (
            <div key={label}>
              <p className="m-0 font-serif text-[40px] font-medium leading-none tracking-[-0.02em] text-ink-950 md:text-[52px]">
                {n}
              </p>
              <p className="m-0 mt-2 max-w-[220px] text-[13px] leading-[1.5] text-ink-600">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The why */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-[860px] px-6 py-16 md:py-20">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
            01 · The why
          </p>
          <h2 className="m-0 mt-3 mb-5 text-3xl font-medium tracking-[-0.02em] text-ink-950 md:text-4xl">
            Why we built this.
          </h2>
          <div className="space-y-5 text-[16px] leading-[1.7] text-ink-700">
            <p className="m-0">
              Most online finance and PDF tools fall into one of two camps.
              Either they paywall everything past three uses — or they upload
              your files to a server you&rsquo;ve never heard of, in a country
              you didn&rsquo;t choose, for processing that could just as easily
              run on your laptop.
            </p>
            <p className="m-0">
              Neither felt right when we needed quick, dependable utilities for
              day-to-day finance work — generating a tax invoice, pulling line
              items out of a bank statement PDF, building a quick break-even
              sheet for a new product, signing a contract before sending it.
            </p>
            <p className="m-0">
              So we built Sonchoy: a growing set of focused, single-purpose
              tools that run entirely in your browser. Each tool does one job
              well, with finance-aware defaults — not generic templates.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1240px] px-6 py-16 md:py-20">
          <div className="mx-auto max-w-[860px]">
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
              02 · How we work
            </p>
            <h2 className="m-0 mt-3 mb-10 text-3xl font-medium tracking-[-0.02em] text-ink-950 md:text-4xl">
              Four principles, no asterisks.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <article key={p.title} className="rounded-xl border border-line bg-surface p-7">
                <p className="m-0 font-mono text-[10px] uppercase tracking-[0.14em] text-crimson-300">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="m-0 mt-2 mb-3 text-[20px] font-medium tracking-[-0.015em] text-ink-950">
                  {p.title}
                </h3>
                <p className="m-0 text-[14.5px] leading-[1.65] text-ink-700">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Where we're going + CTA */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-[860px] px-6 py-16 md:py-20">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
            03 · What&rsquo;s next
          </p>
          <h2 className="m-0 mt-3 mb-5 text-3xl font-medium tracking-[-0.02em] text-ink-950 md:text-4xl">
            More tools, same rules.
          </h2>
          <p className="m-0 mb-10 text-[16px] leading-[1.7] text-ink-700">
            We&rsquo;re adding new tools every few weeks — OCR, bulk
            processing, deeper accounting workflows, more contract templates.
            All free, all browser-side, all built around the same four
            principles above.
          </p>

          <div className="rounded-xl border border-line bg-surface p-7 md:p-8">
            <p className="m-0 font-mono text-[10px] uppercase tracking-[0.12em] text-crimson-300">
              Pick a tool
            </p>
            <h3 className="m-0 mt-2 text-[22px] font-medium tracking-[-0.015em] text-ink-950">
              Jump into the toolkit
            </h3>
            <p className="m-0 mt-2 text-[14.5px] leading-[1.6] text-ink-700">
              Browse every generator, converter, and calculator on a single
              page — filter by category, search by name.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/#tools"
                className="inline-flex items-center gap-2 rounded-md bg-crimson-500 px-5 py-2.5 text-[14px] font-medium text-paper no-underline hover:bg-crimson-600 transition-colors"
              >
                Browse all 90+ tools →
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md border border-line px-5 py-2.5 text-[14px] font-medium text-ink-900 no-underline hover:border-ink-700 transition-colors"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
