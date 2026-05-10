import { ArrowRight } from '../icons'

const Icon = ({ children }) => (
  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md border border-crimson-500/20 bg-crimson-500/10 text-crimson-300">
    {children}
  </div>
)

const StackIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l6-3 6 3-6 3z" />
      <path d="M2 8l6 3 6-3M2 12l6 3 6-3" />
    </svg>
  </Icon>
)
const ScanLineIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 3H1v2M13 3h2v2M3 13H1v-2M13 13h2v-2" />
      <path d="M1 8h14" />
    </svg>
  </Icon>
)
const PenIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13l9-9 2 2-9 9H2z" />
      <path d="M9 4l2 2" />
    </svg>
  </Icon>
)
const ShieldIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 1l5 2v4c0 3-2 5.5-5 7-3-1.5-5-4-5-7V3l5-2z" />
    </svg>
  </Icon>
)

const FEATS = [
  { title: 'Batch & bulk', desc: 'Run 100+ invoices, statements, or conversions in one go.', Ico: StackIcon },
  { title: 'OCR scanned PDFs', desc: 'Turn paper invoices into searchable, exportable data.', Ico: ScanLineIcon },
  { title: 'E-sign & request', desc: 'Multi-party signatures with full audit trails.', Ico: PenIcon },
  { title: 'Redact & approve', desc: 'Mask sensitive ledger lines before sending to auditors.', Ico: ShieldIcon },
]

/**
 * @param {{ tone?: 'paper' | 'canvas' }} props
 *   tone="paper"  → section bg = paper, card bg = canvas (homepage default)
 *   tone="canvas" → section bg = canvas, card bg = paper (for canvas-strip pages)
 */
export default function PromoBento({ tone = 'paper' }) {
  const sectionBg = tone === 'canvas' ? 'bg-canvas' : ''
  const cardBg = tone === 'canvas' ? 'bg-paper' : 'bg-canvas'
  return (
    <section className={`py-24 ${sectionBg}`.trim()}>
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:grid-rows-2">
          {/* big copy cell */}
          <div className={`relative overflow-hidden rounded-2xl border border-line ${cardBg} p-10 lg:col-span-2 lg:row-span-2`}>
            <div
              aria-hidden
              className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
              style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-32 -left-32 h-[320px] w-[320px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, var(--color-crimson-700) 0%, transparent 60%)' }}
            />
            <div className="relative flex h-full flex-col">
              <div className="mb-5 inline-flex w-fit items-center gap-2.5 rounded-full border border-crimson-500/30 bg-crimson-500/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
                <span className="h-1.5 w-1.5 rounded-full bg-crimson-400 shadow-[0_0_0_4px_rgba(237,40,40,0.25)]" />
                PdfFiller · 30-Day Free Trial
              </div>
              <h2 className="mb-4 font-medium text-[40px] leading-[1.05] tracking-[-0.03em] text-ink-950 md:text-[44px]">
                When one-off documents{' '}
                <em className="font-serif font-normal italic text-crimson-300">aren't enough.</em>
              </h2>
              <p className="mb-8 max-w-[440px] text-lg leading-[1.55] text-ink-600">
                Bulk OCR, batch invoicing, multi-party e-signing, redaction, audit logs — pdfFiller picks up where Sonchoy ends. Free for 30 days, no credit card.
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-4">
                <a
                  href="https://go.sonchoy.com/pdfFiller"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-cta btn-xl"
                >
                  Try Premium Free
                  <ArrowRight size={16} />
                </a>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                  No card · Cancel anytime
                </span>
              </div>
            </div>
          </div>

          {/* feature cells */}
          {FEATS.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-line-strong"
            >
              <f.Ico />
              <h4 className="m-0 mb-1.5 text-lg font-medium tracking-[-0.015em] text-ink-950">
                {f.title}
              </h4>
              <p className="m-0 text-md leading-[1.5] text-ink-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
