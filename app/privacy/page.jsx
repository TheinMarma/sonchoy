import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How Sonchoy handles your data — short answer, we don’t. Files never leave your browser. Read the full policy.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy — Sonchoy',
    description:
      'How Sonchoy handles your data — short answer, we don’t. Files never leave your browser. Read the full policy.',
    url: '/privacy',
  },
}

const SECTIONS = [
  {
    title: '1. The short version',
    body: (
      <>
        Sonchoy runs in your browser. The PDFs, spreadsheets, and documents
        you process never leave your device &mdash; we don&rsquo;t upload them,
        store them, or even see them. We collect a small amount of anonymous
        analytics so we can improve the tools. That&rsquo;s it.
      </>
    ),
  },
  {
    title: '2. Files you process',
    body: (
      <>
        Every tool on Sonchoy &mdash; invoice generators, PDF converters,
        OCR, statement extractors, signers &mdash; runs entirely on your
        device using your browser&rsquo;s JavaScript runtime. Your files are
        never uploaded to our servers because we don&rsquo;t have a server-side
        processing pipeline. The output is generated in-browser and downloaded
        directly to your device.
      </>
    ),
  },
  {
    title: '3. Information we collect',
    body: (
      <>
        <p className="m-0">
          We use Google Analytics 4 to understand how the Service is used in
          aggregate. GA4 collects:
        </p>
        <ul className="m-0 mt-3 list-disc space-y-2 pl-5">
          <li>Page views and route navigation</li>
          <li>Approximate location (country / region, derived from IP)</li>
          <li>Device and browser type</li>
          <li>Anonymous session identifiers</li>
        </ul>
        <p className="m-0 mt-3">
          We have configured GA4 with{' '}
          <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink-900">
            ads_data_redaction
          </code>{' '}
          enabled and ad-personalization signals denied by default, so no
          ad-targeting data is sent to Google. We do not collect names, email
          addresses, payment details, or the contents of files you process.
        </p>
      </>
    ),
  },
  {
    title: '4. Cookies & local storage',
    body: (
      <>
        Sonchoy uses a small number of cookies and browser local-storage keys
        set by Google Analytics for anonymous measurement. Some tools also
        save your form inputs locally (e.g. an invoice draft) so they survive
        a page refresh &mdash; those entries live only in your browser and
        are never transmitted anywhere. You can clear all cookies and local
        storage at any time via your browser settings.
      </>
    ),
  },
  {
    title: '5. Third-party services',
    body: (
      <>
        <p className="m-0">The Service connects to two third parties:</p>
        <ul className="m-0 mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink-950">Google Fonts</strong> &mdash;
            fonts are loaded from <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink-900">fonts.googleapis.com</code>{' '}
            and <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink-900">fonts.gstatic.com</code>.
          </li>
          <li>
            <strong className="text-ink-950">Google Analytics 4</strong>{' '}
            &mdash; anonymous usage metrics via{' '}
            <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink-900">googletagmanager.com</code>.
          </li>
        </ul>
        <p className="m-0 mt-3">
          Pages that link to{' '}
          <strong className="text-ink-950">pdfFiller</strong> (an external
          paid service) are outbound links only; we don&rsquo;t share your
          data with pdfFiller, and clicking through is entirely up to you.
        </p>
      </>
    ),
  },
  {
    title: '6. Your rights',
    body: (
      <>
        Because we don&rsquo;t hold a user database, there&rsquo;s nothing for
        us to delete on request &mdash; we never had your data in the first
        place. For the anonymous analytics we do collect, you can:
        <ul className="m-0 mt-3 list-disc space-y-2 pl-5">
          <li>Install a privacy extension or use your browser&rsquo;s built-in tracker blocker.</li>
          <li>Use the{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-crimson-300 no-underline hover:text-crimson-400"
            >
              Google Analytics opt-out add-on
            </a>.
          </li>
          <li>Clear cookies / local storage via your browser settings.</li>
        </ul>
      </>
    ),
  },
  {
    title: '7. Children',
    body: (
      <>
        Sonchoy isn&rsquo;t directed at children under 13 (or 16 in the EU /
        UK). We don&rsquo;t knowingly collect personal information from
        minors. If you believe we have, contact us and we&rsquo;ll address it.
      </>
    ),
  },
  {
    title: '8. Security',
    body: (
      <>
        The site is served over HTTPS. Because your files never leave your
        browser, there is no server-side storage for an attacker to breach.
        We can&rsquo;t guarantee absolute security of any web service, but
        the privacy-by-architecture design dramatically reduces the surface
        area.
      </>
    ),
  },
  {
    title: '9. International users',
    body: (
      <>
        The Service is available globally. By using it, you understand that
        anonymous analytics may be processed by Google in jurisdictions
        outside your country, including the United States. We don&rsquo;t
        transmit any personally identifying data ourselves.
      </>
    ),
  },
  {
    title: '10. Changes to this policy',
    body: (
      <>
        We may update this policy as the Service evolves. The current version
        always lives at this URL with the &ldquo;last updated&rdquo; date at
        the top. Material changes will be flagged at the top of the page.
      </>
    ),
  },
  {
    title: '11. Contact',
    body: (
      <>
        Privacy questions? Email{' '}
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

export default function PrivacyPage() {
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
            <span className="text-ink-950">Privacy Policy</span>
          </nav>

          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
            Legal · Privacy policy
          </p>
          <h1 className="mb-5 mt-3 font-medium text-[44px] leading-[1.02] tracking-[-0.03em] text-ink-950 md:text-[64px] md:leading-[0.98]">
            Your files never{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              leave your browser.
            </em>
          </h1>
          <p className="m-0 max-w-[640px] text-[17px] leading-[1.6] text-ink-700">
            Sonchoy is built privacy-first. The PDFs, invoices, and statements
            you process stay on your device. Here&rsquo;s exactly what we
            collect, what we don&rsquo;t, and why.
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
              Terms of service
            </h3>
            <p className="m-0 mt-2 text-[14px] leading-[1.6] text-ink-700">
              The rules of the road for using the tools — kept short and in
              plain English.
            </p>
            <Link
              href="/terms"
              className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-crimson-300 no-underline hover:text-crimson-400"
            >
              Read the Terms of Service →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
