import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service',
  description:
    'The rules of the road for using Sonchoy — free finance and PDF tools that run entirely in your browser.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service — Sonchoy',
    description:
      'The rules of the road for using Sonchoy — free finance and PDF tools that run entirely in your browser.',
    url: '/terms',
  },
}

const SECTIONS = [
  {
    title: '1. Acceptance of terms',
    body: (
      <>
        By accessing or using sonchoy.com (the &ldquo;Service&rdquo;), you agree to be bound by these
        Terms of Service. If you do not agree, do not use the Service. We may
        update these terms at any time; the current version always lives at
        this URL.
      </>
    ),
  },
  {
    title: '2. The service',
    body: (
      <>
        Sonchoy provides free, browser-based finance and PDF tools — invoice
        generators, PDF converters, accounting reports, tax calculators, and
        related utilities. All processing runs locally in your browser. We do
        not require an account, and we do not upload, store, or transmit the
        contents of the files you process.
      </>
    ),
  },
  {
    title: '3. Free to use',
    body: (
      <>
        The core tools are free to use, with no signup. Some pages link to
        paid third-party services (e.g. pdfFiller). Those services have their
        own terms and pricing, and any transaction you make with them is
        between you and that third party.
      </>
    ),
  },
  {
    title: '4. Acceptable use',
    body: (
      <ul className="m-0 list-disc space-y-2 pl-5">
        <li>Don&rsquo;t use the Service for anything illegal or fraudulent.</li>
        <li>Don&rsquo;t attempt to disrupt, reverse-engineer, or overload the Service.</li>
        <li>Don&rsquo;t scrape, automate, or resell the tools without permission.</li>
        <li>Don&rsquo;t use the Service to process content you don&rsquo;t have the right to handle.</li>
      </ul>
    ),
  },
  {
    title: '5. Output ownership',
    body: (
      <>
        You own everything you create with Sonchoy &mdash; invoices, PDFs,
        spreadsheets, reports, and any other outputs. We make no claim to your
        files, your data, or your generated documents.
      </>
    ),
  },
  {
    title: '6. No warranty',
    body: (
      <>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of
        any kind, express or implied. Tax calculators, financial reports, and
        legal templates are provided for convenience and should be reviewed by
        a qualified professional before you rely on them for filings, audits,
        or legal action. We make no representation that calculations are
        accurate for your specific jurisdiction or situation.
      </>
    ),
  },
  {
    title: '7. Limitation of liability',
    body: (
      <>
        To the maximum extent permitted by law, Sonchoy and its operators are
        not liable for indirect, incidental, special, consequential, or
        punitive damages arising from your use of the Service. Our total
        liability for any claim related to the Service will not exceed one
        hundred U.S. dollars (USD&nbsp;100).
      </>
    ),
  },
  {
    title: '8. Third-party links',
    body: (
      <>
        The Service may link to external sites and services we do not control.
        We are not responsible for their content, privacy practices, or terms.
        Use them at your own discretion.
      </>
    ),
  },
  {
    title: '9. Changes to the service',
    body: (
      <>
        We may add, change, or remove tools at any time without notice. We may
        also suspend or discontinue the Service in whole or in part.
      </>
    ),
  },
  {
    title: '10. Governing law',
    body: (
      <>
        These terms are governed by the laws applicable to the jurisdiction of
        the operator&rsquo;s registered residence, without regard to conflict-of-law
        principles. Any disputes will be resolved in the courts of that
        jurisdiction.
      </>
    ),
  },
  {
    title: '11. Contact',
    body: (
      <>
        Questions about these terms? Reach us at{' '}
        <a
          href="mailto:hello@sonchoy.com"
          className="text-crimson-300 no-underline hover:text-crimson-400"
        >
          hello@sonchoy.com
        </a>
        .
      </>
    ),
  },
]

export default function TermsPage() {
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
            <span className="text-ink-950">Terms of Service</span>
          </nav>

          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
            Legal · Terms of service
          </p>
          <h1 className="mb-5 mt-3 font-medium text-[44px] leading-[1.02] tracking-[-0.03em] text-ink-950 md:text-[64px] md:leading-[0.98]">
            Terms of{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              Service.
            </em>
          </h1>
          <p className="m-0 max-w-[640px] text-[17px] leading-[1.6] text-ink-700">
            The ground rules for using Sonchoy. We&rsquo;ve kept this short and in
            plain English so you can actually read it.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
            Last updated · 26 May 2026
          </p>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto max-w-[860px] px-6 py-16 md:py-20">
          <div className="space-y-10">
            {SECTIONS.map((s) => (
              <article key={s.title}>
                <h2 className="m-0 mb-3 text-[22px] font-medium tracking-[-0.015em] text-ink-950">
                  {s.title}
                </h2>
                <div className="text-[15px] leading-[1.7] text-ink-700">{s.body}</div>
              </article>
            ))}
          </div>

          <div className="mt-16 rounded-xl border border-line bg-surface p-6 md:p-8">
            <p className="m-0 font-mono text-[10px] uppercase tracking-[0.12em] text-crimson-300">
              Related
            </p>
            <h3 className="m-0 mt-2 text-[20px] font-medium tracking-[-0.015em] text-ink-950">
              How we handle your data
            </h3>
            <p className="m-0 mt-2 text-[14px] leading-[1.6] text-ink-700">
              In one line: we don&rsquo;t. Files never leave your browser. Read the
              full policy for the details.
            </p>
            <Link
              href="/privacy"
              className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-crimson-300 no-underline hover:text-crimson-400"
            >
              Read the Privacy Policy →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
