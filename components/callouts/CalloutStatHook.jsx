import { ArrowRight } from '../icons'

export default function CalloutStatHook() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[920px] px-6">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-canvas px-8 py-12 text-center md:px-12 md:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-35 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
          />

          <div className="relative">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-crimson-500/40 bg-crimson-500/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
              <span className="h-1.5 w-1.5 rounded-full bg-crimson-400 shadow-[0_0_0_4px_rgba(237,40,40,0.25)]" />
              Need more power?
            </span>

            <h3 className="m-0 mb-3 font-medium text-3xl leading-[1.1] tracking-[-0.025em] text-ink-950 md:text-[36px]">
              When this tool{' '}
              <em className="font-serif font-normal italic text-crimson-300">isn't enough,</em>
              {' '}pdfFiller takes over.
            </h3>
            <p className="mx-auto m-0 mb-8 max-w-[560px] text-lg leading-[1.55] text-ink-600">
              Scanned invoices, multi-page batches, multi-currency stacks, and direct push into your accounting system. Free for 30 days, no card required.
            </p>

            <a
              href="https://go.sonchoy.com/pdfFiller"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-cta btn-lg"
            >
              Try Premium Free
              <ArrowRight size={14} />
            </a>
            <p className="m-0 mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
              Free 30 days · no credit card · cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
