import { ArrowRight, Check } from './icons'

const STATS = [
  ['4.8M', 'Invoices /mo'],
  ['99.4%', 'Parse accuracy'],
  ['11s', 'Avg time-to-PDF'],
  ['90+', 'Free tools'],
]

export default function Hero() {
  return (
    <header className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-crimson-700) 0%, transparent 60%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative mx-auto max-w-[1240px] px-6 py-24 md:py-32">
        <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-crimson-500/30 bg-crimson-500/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
          <span className="h-1.5 w-1.5 rounded-full bg-crimson-400 shadow-[0_0_0_4px_rgba(237,40,40,0.25)]" />
          The finance &amp; billing workspace
        </span>

        <h1 className="mb-7 max-w-[1000px] font-medium text-[48px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[88px] md:leading-[0.98]">
          Books, bills,{' '}
          <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
            statements,
          </em>{' '}
          contracts.
          <br />
          One workspace.{' '}
          <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
            Zero signups.
          </em>
        </h1>

        <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
          90+ generators &amp; extractors built for freelancers, accountants, finance teams, and small businesses. Free where it counts. Premium when the work scales.
        </p>

        <div className="mb-12 flex flex-wrap items-center gap-3">
          <a
            href="https://go.sonchoy.com/pdfFiller"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-cta btn-xl"
          >
            Try Premium Free
            <ArrowRight size={16} />
          </a>
          <a
            href="#tools"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-950/15 bg-ink-950/5 px-7 py-[18px] text-[16px] font-medium leading-none text-ink-950 no-underline backdrop-blur-sm transition-colors hover:bg-ink-950/10 capitalize"
          >
            Browse the toolkit
          </a>
        </div>

        <div className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-600">
          <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> No signup, ever</span>
          <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Files purged after 1 hour</span>
          <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> AES-256 encrypted</span>
          <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> GST · VAT · Sales tax ready</span>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {STATS.map(([num, lab]) => (
            <div key={lab} className="bg-paper p-5">
              <div className="mb-1 font-medium text-[28px] leading-none tracking-[-0.025em] text-ink-950">
                {num}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">
                {lab}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
