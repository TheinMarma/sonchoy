import Link from 'next/link'

export const metadata = {
  title: 'Contact — Sonchoy',
  description:
    'Get in touch with the Sonchoy team. Bug reports, feature requests, partnerships, or just to say hi — email hello@sonchoy.com.',
  alternates: { canonical: '/contact/' },
  openGraph: {
    title:       'Contact — Sonchoy',
    description: 'Get in touch with the Sonchoy team.',
    url:         'https://sonchoy.com/contact/',
    type:        'website',
    siteName:    'Sonchoy',
  },
}

const REASONS = [
  {
    title:   'Bug reports',
    body:    'Something not working? Tell us what tool, what you did, and what happened. Screenshots and browser version help us fix it faster.',
    cta:     'hello@sonchoy.com',
    href:    'mailto:hello@sonchoy.com?subject=Bug%20report',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="6.5" />
        <path d="M6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title:   'Feature requests',
    body:    "Need a tool we don't have yet, or a specific tweak to an existing one? We read every request. Bonus points for explaining your workflow.",
    cta:     'Suggest a feature',
    href:    'mailto:hello@sonchoy.com?subject=Feature%20request',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 1.5v3M9 13.5v3M3 9H1.5M16.5 9H15M4.4 4.4L3.4 3.4M14.6 14.6l-1-1M4.4 13.6l-1 1M14.6 3.4l-1 1" />
        <circle cx="9" cy="9" r="3" />
      </svg>
    ),
  },
  {
    title:   'Partnerships',
    body:    "Building something that complements Sonchoy? Want to integrate, white-label, or collaborate on a finance workflow? Let's talk.",
    cta:     'Reach out',
    href:    'mailto:hello@sonchoy.com?subject=Partnership',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8a3 3 0 116 0v3a3 3 0 11-6 0V8z" />
        <path d="M9 2v3M9 16v-2" />
      </svg>
    ),
  },
  {
    title:   'Press & media',
    body:    'Writing about free finance tools, browser-side processing, or independent dev work? Happy to help with quotes, screenshots, or background.',
    cta:     'press@sonchoy.com',
    href:    'mailto:hello@sonchoy.com?subject=Press%20enquiry',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="3" width="13" height="12" rx="1.5" />
        <path d="M5 6.5h8M5 9.5h8M5 12.5h5" />
      </svg>
    ),
  },
]

const FAQ = [
  {
    q: "I have a sensitive file — can I really process it without uploading?",
    a: "Yes. Every tool runs entirely in your browser using JavaScript. There is no upload pipeline on our end. You can verify this in your browser's network tab — no requests are sent to our servers while a tool runs.",
  },
  {
    q: "How fast do you reply?",
    a: "Usually within 24-48 hours on weekdays. We're a small team, so complex bug reports or partnership conversations may take a few days.",
  },
  {
    q: "Do you offer phone or live chat support?",
    a: "Not currently. Email is the fastest path to a real human. We prefer it for the same reason you probably do — a written record of what was asked and what we said.",
  },
  {
    q: "Can I host Sonchoy on my own server / behind my firewall?",
    a: "We don't publish a self-hosted version today. If that's a hard requirement for your team, drop us a line — we'd like to understand the use case.",
  },
]

export default function ContactPage() {
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
            <span className="text-ink-950">Contact</span>
          </nav>

          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
            Contact · Sonchoy
          </p>
          <h1 className="mb-5 mt-3 font-medium text-[44px] leading-[1.02] tracking-[-0.03em] text-ink-950 md:text-[64px] md:leading-[0.98]">
            Say hello,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              report a bug,
            </em>{' '}
            or pitch an idea.
          </h1>
          <p className="m-0 max-w-[640px] text-[17px] leading-[1.6] text-ink-700">
            We&rsquo;re a small team and we read every message. Email is the
            fastest way to reach us — drop us a line and we&rsquo;ll usually
            reply within a working day or two.
          </p>

          <div className="mt-8 inline-flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-5 py-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300">
              Email
            </span>
            <a
              href="mailto:hello@sonchoy.com"
              className="text-[16px] font-medium text-ink-950 no-underline hover:text-crimson-300 transition-colors"
            >
              hello@sonchoy.com
            </a>
          </div>
        </div>
      </section>

      {/* Reason cards */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-[1240px] px-6 py-16 md:py-20">
          <div className="mx-auto max-w-[860px]">
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
              01 · What are you writing about?
            </p>
            <h2 className="m-0 mt-3 mb-10 text-3xl font-medium tracking-[-0.02em] text-ink-950 md:text-4xl">
              Pick the closest match.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {REASONS.map((r) => (
              <article key={r.title} className="rounded-xl border border-line bg-surface p-7">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-sm border border-crimson-500/20 bg-crimson-500/10 text-crimson-300">
                  {r.icon}
                </div>
                <h3 className="m-0 mb-2 text-[19px] font-medium tracking-[-0.015em] text-ink-950">
                  {r.title}
                </h3>
                <p className="m-0 mb-4 text-[14.5px] leading-[1.65] text-ink-700">
                  {r.body}
                </p>
                <a
                  href={r.href}
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-crimson-300 no-underline hover:text-crimson-400"
                >
                  {r.cta} →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[860px] px-6 py-16 md:py-20">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
            02 · Common questions
          </p>
          <h2 className="m-0 mt-3 mb-10 text-3xl font-medium tracking-[-0.02em] text-ink-950 md:text-4xl">
            Probably already answered.
          </h2>
          <div className="space-y-6">
            {FAQ.map(({ q, a }) => (
              <article key={q} className="border-b border-line pb-6 last:border-b-0">
                <h3 className="m-0 mb-2 text-[18px] font-medium tracking-[-0.015em] text-ink-950">
                  {q}
                </h3>
                <p className="m-0 text-[15px] leading-[1.7] text-ink-700">
                  {a}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-[860px] px-6 py-12 md:py-16">
          <div className="rounded-xl border border-line bg-surface p-6 md:p-8">
            <p className="m-0 font-mono text-[10px] uppercase tracking-[0.12em] text-crimson-300">
              While you&rsquo;re here
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Link
                href="/about"
                className="block rounded-lg border border-line bg-canvas p-5 no-underline transition-colors hover:border-ink-700"
              >
                <h3 className="m-0 text-[16px] font-medium tracking-[-0.015em] text-ink-950">
                  About Sonchoy →
                </h3>
                <p className="m-0 mt-1 text-[13.5px] leading-[1.55] text-ink-600">
                  The story, principles, and what we&rsquo;re building next.
                </p>
              </Link>
              <Link
                href="/privacy"
                className="block rounded-lg border border-line bg-canvas p-5 no-underline transition-colors hover:border-ink-700"
              >
                <h3 className="m-0 text-[16px] font-medium tracking-[-0.015em] text-ink-950">
                  Privacy policy →
                </h3>
                <p className="m-0 mt-1 text-[13.5px] leading-[1.55] text-ink-600">
                  Short answer: your files never leave your browser.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
