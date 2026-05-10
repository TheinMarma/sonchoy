import Hero from '../components/Hero'
import ToolsSection from '../components/ToolsSection'
import PromoCenteredHero from '../components/promos/PromoCenteredHero'
import PromoBento from '../components/promos/PromoBento'
import FaqDialogue from '../components/faqs/FaqDialogue'
import HowStepperTabs from '../components/howitworks/HowStepperTabs'

const STRIP_LOGOS = [
  { name: 'Carousel', suffix: 'Checks',    href: 'https://go.sonchoy.com/CarouselChecks' },
  { name: 'Lesko',    suffix: null,        href: 'https://go.sonchoy.com/Lesko' },
  { name: 'Scholar',  suffix: 'Trip',      href: 'https://go.sonchoy.com/ScholarTrip' },
  { name: 'BGASC',    suffix: null,        href: 'https://go.sonchoy.com/BGASC' },
  { name: 'Clear',    suffix: 'Screening', href: 'https://go.sonchoy.com/ClearScreening' },
  { name: 'Bonzah',   suffix: null,        href: 'https://go.sonchoy.com/Bonzah' },
]

function TrustStrip() {
  return (
    <section className="border-y border-line bg-canvas py-8">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-12 px-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">
          Used by finance teams &amp; accountants at
        </span>
        {STRIP_LOGOS.map(({ name, suffix, href }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif text-[20px] italic tracking-[-0.02em] text-ink-600 no-underline hover:text-ink-900 transition-colors"
          >
            {name}
            {suffix && (
              <>
                {' '}
                <i className="not-italic">{suffix}</i>
              </>
            )}
          </a>
        ))}
      </div>
    </section>
  )
}

const FEATURES = [
  {
    title: 'Built around finance, not generic PDFs',
    desc:  'Tax rules, GST/VAT slabs, invoice numbering, P&L line items, payroll deductions — pre-wired into every generator. No more cobbled-together templates.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <rect x="3" y="2" width="10" height="12" rx="1" />
        <path d="M5 5h6M5 8h6M5 11h3" />
      </svg>
    ),
  },
  {
    title: 'Secure document handling',
    desc:  'AES-256 in transit, isolated workers per file, and automatic purge within an hour. Your invoices, ledgers, and statements never sit on our disks.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M8 1l5 2v4c0 3-2 5.5-5 7-3-1.5-5-4-5-7V3l5-2z" />
      </svg>
    ),
  },
  {
    title: 'Free where it counts, premium when it matters',
    desc:  'Every generator and extractor on this page is free. Need batch OCR, multi-user e-signing, or audit logs? pdfFiller is one click away — free for 30 days.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    ),
  },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300">
            02 — Why Sonchoy
          </p>
          <h2 className="m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950">
            A workspace that thinks in{' '}
            <em className="font-serif font-normal italic text-crimson-300">debits, credits,</em> and deadlines.
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Every generator is built with finance defaults out of the box — so the document you ship is the document a CA, auditor, or client expects.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-line bg-surface p-7">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-sm bg-crimson-500/10 text-crimson-300 border border-crimson-500/20">
                {f.icon}
              </div>
              <h4 className="mb-2 text-lg font-medium tracking-[-0.015em] text-ink-950 m-0">
                {f.title}
              </h4>
              <p className="m-0 text-md leading-[1.55] text-ink-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ToolsSection />
      <Features />
      <PromoBento />
      <HowStepperTabs />
      <FaqDialogue />
      <PromoCenteredHero />
    </>
  )
}
