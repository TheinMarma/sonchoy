import { FAQS } from './data'

export default function FaqDialogue() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300">
            04 — Common questions
          </p>
          <h2 className="m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950">
            The <em className="font-serif font-normal italic text-crimson-300">basics,</em> answered.
          </h2>
        </div>

        <div className="mx-auto max-w-[820px] space-y-10">
          {FAQS.map((f, idx) => (
            <div key={f.q} className="space-y-3">
              {/* question bubble — right aligned */}
              <div className="flex justify-end">
                <div className="max-w-[80%]">
                  <div className="mb-1.5 flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">
                    <span>You · {String(idx + 1).padStart(2, '0')}</span>
                    <span className="h-1 w-1 rounded-full bg-crimson-400" />
                  </div>
                  <div className="rounded-2xl rounded-tr-sm bg-crimson-500 px-5 py-3.5 text-[15px] font-medium leading-[1.4] text-white shadow-[0_4px_18px_-4px_rgba(237,40,40,0.4)]">
                    {f.q}
                  </div>
                </div>
              </div>

              {/* answer bubble — left aligned */}
              <div className="flex justify-start">
                <div className="max-w-[88%]">
                  <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-crimson-300">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-crimson-500/30 bg-crimson-500/10">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M4 2h6l2.5 2.5V14H4z" />
                        <path d="M10 2v3h2.5" />
                      </svg>
                    </span>
                    Sonchoy · {f.catLabel}
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-line bg-surface px-5 py-3.5 text-md leading-[1.6] text-ink-700">
                    {f.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
