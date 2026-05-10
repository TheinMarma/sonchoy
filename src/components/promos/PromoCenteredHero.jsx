import { ArrowRight, Check } from '../icons'

const FEATS = [
  'Batch OCR',
  'Bulk export',
  'E-signing',
  'Redaction',
  'Multi-user approvals',
  'Audit logs',
]

export default function PromoCenteredHero() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-canvas px-8 py-20 text-center md:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-48 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-48 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-crimson-700) 0%, transparent 60%)' }}
          />

          <span className="relative mb-7 inline-flex items-center gap-2.5 rounded-full border border-crimson-500/30 bg-crimson-500/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
            <span className="h-1.5 w-1.5 rounded-full bg-crimson-400 shadow-[0_0_0_4px_rgba(237,40,40,0.25)]" />
            PdfFiller · 30-Day Free Trial
          </span>

          <h2 className="relative mx-auto mb-5 max-w-[820px] font-medium text-[40px] leading-[1.05] tracking-[-0.03em] text-ink-950 md:text-[56px] md:leading-[1.02]">
            Ready to scale beyond{' '}
            <em className="font-serif font-normal italic text-crimson-300">one-off documents?</em>
          </h2>

          <p className="relative mx-auto mb-9 max-w-[600px] text-lg leading-[1.55] text-ink-600">
            When the work scales — bulk OCR, e-signing, multi-party approvals, audit logs — pdfFiller picks up where Sonchoy ends. Try it free for 30 days, no credit card.
          </p>

          <a
            href="https://go.sonchoy.com/pdfFiller"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-cta btn-xl relative"
          >
            Try Premium Free
            <ArrowRight size={16} />
          </a>

          <p className="relative mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
            No credit card · Free for 30 days · Cancel anytime
          </p>

          <div className="relative mt-10 flex flex-wrap items-center justify-center gap-2">
            {FEATS.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper/60 px-3 py-1.5 text-[12px] font-medium text-ink-800 backdrop-blur-sm"
              >
                <Check size={12} className="text-crimson-400" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
