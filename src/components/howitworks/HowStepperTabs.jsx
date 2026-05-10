import { useState } from 'react'
import { STEPS, HEADER } from './data'
import { Check, ArrowRight } from '../icons'

export default function HowStepperTabs() {
  const [active, setActive] = useState(0)
  const current = STEPS[active]

  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300">
              {HEADER.eyebrow}
            </p>
            <h2 className="m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950">
              {HEADER.title[0]}
              <em className="font-serif font-normal italic text-crimson-300">{HEADER.title[1]}</em>
              {HEADER.title[2]}
            </h2>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            {HEADER.desc}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {/* stepper rail */}
          <div className="relative border-b border-line bg-surface px-6 py-7 md:px-10">
            <div className="mx-auto flex max-w-[820px] items-center justify-between gap-2 md:gap-4">
              {STEPS.map((s, i) => {
                const isActive = i === active
                const isDone = i < active
                return (
                  <div key={s.num} className="contents">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[12px] font-medium transition-all ${
                          isActive
                            ? 'border-crimson-500 bg-crimson-500 text-white shadow-[0_0_0_4px_rgba(237,40,40,0.18)]'
                            : isDone
                              ? 'border-crimson-500/40 bg-crimson-500/10 text-crimson-300'
                              : 'border-line bg-canvas text-ink-500'
                        }`}
                      >
                        {isDone ? <Check size={12} /> : s.num}
                      </span>
                      <span className="hidden flex-col md:flex">
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                            isActive ? 'text-crimson-300' : 'text-ink-500'
                          }`}
                        >
                          {s.label}
                        </span>
                        <span
                          className={`text-[14px] font-medium tracking-[-0.005em] ${
                            isActive ? 'text-ink-950' : isDone ? 'text-ink-700' : 'text-ink-500'
                          }`}
                        >
                          {s.title}
                        </span>
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className={`h-px flex-1 transition-colors ${
                          i < active ? 'bg-crimson-500/50' : 'bg-line'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* active step detail */}
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr]">
            <div className="border-b border-line p-8 md:border-b-0 md:border-r md:p-12">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-crimson-300">
                <span className="h-1.5 w-1.5 rounded-full bg-crimson-400" />
                Step {current.num} · {current.label}
              </div>
              <h3 className="m-0 mb-4 text-3xl font-medium tracking-[-0.02em] text-ink-950 md:text-4xl">
                {current.title}
              </h3>
              <p className="m-0 mb-4 text-lg leading-[1.55] text-ink-700">{current.desc}</p>
              <p className="m-0 text-md leading-[1.6] text-ink-500">{current.detail}</p>

              <div className="mt-7 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActive(Math.max(0, active - 1))}
                  disabled={active === 0}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActive(Math.min(STEPS.length - 1, active + 1))}
                  disabled={active === STEPS.length - 1}
                  className="btn btn-primary"
                >
                  Next step
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* visual cell */}
            <div className="relative overflow-hidden bg-canvas p-8 md:p-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full opacity-40 blur-3xl"
                style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
              />
              <div className="relative">
                <span className="block font-serif text-[180px] italic font-normal leading-[0.85] text-crimson-500/70 md:text-[220px]">
                  {current.num}
                </span>
                <span className="mt-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">
                  {current.label} · {String(active + 1)} of {STEPS.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
