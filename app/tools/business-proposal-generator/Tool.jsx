'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  ContractIcon, NdaIcon, ProposalIcon, LetterIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, PAYMENT_TERMS, VALIDITY_OPTIONS, PROPOSAL_TONES,
  findCurrency, findPaymentTerm, findValidity,
  countSections, computeInvestmentTotal,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/businessProposal/compute'
import { generateBusinessProposalPdf } from '@/lib/businessProposal/generatePdf'
import { generateBusinessProposalDocx } from '@/lib/businessProposal/generateDocx'

/* ---------- Local helpers ---------- */

const Eyebrow = ({ children, className = '' }) => (
  <p className={`m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300 ${className}`}>
    {children}
  </p>
)

const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950 ${className}`}>
    {children}
  </h2>
)

/* ---------- 1) Tool hero ---------- */

function LiveDemoModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Live Business Proposal Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[560px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['12',      'Proposal sections'],
  ['Cover+',  'Branded cover page'],
  ['PDF+',    'DOCX (editable)'],
  ['Free',    'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-contracts) 0%, transparent 60%)' }}
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

        <div className="relative mx-auto max-w-[1240px] px-6 py-20 md:py-28">
          <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-contracts">Contracts</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Business Proposal Generator</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-contracts/30 bg-contracts-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-contracts">
            <span className="h-1.5 w-1.5 rounded-full bg-contracts shadow-[0_0_0_4px_rgba(244,63,94,0.25)]" />
            Contracts · Pitch-ready proposal
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Proposals that{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              win the work
            </em>
            <br />
            before the{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              contract lands.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Branded cover, executive summary, scope, deliverables, timeline, team, pricing table, terms, and acceptance page — all in one PDF that closes. Edit anything in DOCX.
          </p>

          <div className="mb-12 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn btn-cta btn-xl"
            >
              Launch The Tool
              <ArrowRight size={16} />
            </button>
            <Link
              href="/#tools"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-950/15 bg-ink-950/5 px-7 py-[18px] text-[16px] font-medium leading-none text-ink-950 no-underline backdrop-blur-sm transition-colors hover:bg-ink-950/10 capitalize"
            >
              Explore More Tools
            </Link>
          </div>

          <div className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> No signup, ever
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> 100% local · nothing uploaded
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> Editable DOCX export
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> Esc to close
            </span>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {HERO_STATS.map(([num, lab]) => (
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

      <LiveDemoModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/* ---------- Form input building blocks ---------- */

const labelClass = 'font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500'
const inputClass =
  'w-full min-h-[36px] rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950 ' +
  'placeholder:text-ink-400 outline-none transition-colors ' +
  'focus:border-contracts/60 focus:ring-2 focus:ring-contracts/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )
}

function NumberInput({ label, value, onChange, suffix, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={value ?? 0}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={`${inputClass} text-right font-mono ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function TextareaInput({ label, value, onChange, placeholder, rows = 2, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <textarea
        rows={rows}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} min-h-[58px] resize-y leading-[1.4]`}
      />
    </div>
  )
}

function DateInput({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} font-mono [color-scheme:dark]`}
      />
    </div>
  )
}

function SelectInput({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none cursor-pointer pr-8 bg-[length:14px] bg-no-repeat bg-[right_10px_center]`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='none' stroke='%2382827d' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/></svg>\")",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-line bg-paper px-3 py-2 transition-colors hover:border-line-strong">
      <div className="min-w-0 flex-1 pr-3">
        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">{label}</span>
        {desc && <span className="block truncate text-[11px] text-ink-500">{desc}</span>}
      </div>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer accent-contracts"
      />
    </label>
  )
}

/* ---------- StringList ---------- */

function StringList({ title, lines, setLines, placeholder, accent = false }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = () => setLines([...lines, { id: Date.now() + Math.random(), description: '' }])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${accent ? 'text-contracts' : 'text-ink-500'}`}>
          {title}
        </span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-contracts-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-contracts transition-colors hover:bg-contracts/20"
        >
          <Plus size={9} />
          Add
        </button>
      </div>
      <div className="space-y-1.5">
        {lines.map((ln) => (
          <div key={ln.id} className="grid grid-cols-[1fr_22px] items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1.5">
            <input
              type="text"
              value={ln.description || ''}
              onChange={(e) => update(ln.id, { description: e.target.value })}
              placeholder={placeholder}
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 hover:border-line focus:border-contracts/60 focus:bg-canvas"
            />
            <button
              type="button"
              onClick={() => remove(ln.id)}
              aria-label="Remove"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- PhaseList ---------- */

function PhaseList({ lines, setLines }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = () =>
    setLines([...lines, { id: Date.now() + Math.random(), name: '', description: '', startDate: '', endDate: '' }])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-contracts">Timeline phases</span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-contracts-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-contracts transition-colors hover:bg-contracts/20"
        >
          <Plus size={9} /> Add phase
        </button>
      </div>
      <div className="space-y-1.5">
        {lines.map((ph) => (
          <div key={ph.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
              <input
                type="text"
                value={ph.name || ''}
                onChange={(e) => update(ph.id, { name: e.target.value })}
                placeholder="Phase name (e.g. Discovery)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-contracts/60"
              />
              <button
                type="button"
                onClick={() => remove(ph.id)}
                aria-label="Remove phase"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={ph.description || ''}
              onChange={(e) => update(ph.id, { description: e.target.value })}
              placeholder="What happens in this phase"
              className="mt-1.5 min-h-[28px] w-full rounded-md border border-line bg-canvas px-1.5 py-1 text-[11.5px] text-ink-900 outline-none focus:border-contracts/60"
            />
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={ph.startDate || ''}
                onChange={(e) => update(ph.id, { startDate: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none [color-scheme:dark] focus:border-contracts/60"
              />
              <input
                type="date"
                value={ph.endDate || ''}
                onChange={(e) => update(ph.id, { endDate: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none [color-scheme:dark] focus:border-contracts/60"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- TeamList ---------- */

function TeamList({ lines, setLines }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = () =>
    setLines([...lines, { id: Date.now() + Math.random(), name: '', role: '', bio: '' }])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-contracts">Team members</span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-contracts-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-contracts transition-colors hover:bg-contracts/20"
        >
          <Plus size={9} /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {lines.map((m) => (
          <div key={m.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_1fr_22px] items-center gap-1.5">
              <input
                type="text"
                value={m.name || ''}
                onChange={(e) => update(m.id, { name: e.target.value })}
                placeholder="Name"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-contracts/60"
              />
              <input
                type="text"
                value={m.role || ''}
                onChange={(e) => update(m.id, { role: e.target.value })}
                placeholder="Role"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-contracts/60"
              />
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={m.bio || ''}
              onChange={(e) => update(m.id, { bio: e.target.value })}
              placeholder="One-line bio (optional)"
              className="mt-1.5 min-h-[28px] w-full rounded-md border border-line bg-canvas px-1.5 py-1 text-[11.5px] text-ink-900 outline-none focus:border-contracts/60"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- InvestmentList ---------- */

function InvestmentList({ lines, setLines, currency }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = () =>
    setLines([...lines, { id: Date.now() + Math.random(), description: '', qty: 1, rate: 0 }])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-contracts">Investment items</span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-contracts-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-contracts transition-colors hover:bg-contracts/20"
        >
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="space-y-1.5">
        {lines.map((it) => {
          const qty = Number(it.qty) || 0
          const rate = Number(it.rate) || 0
          return (
            <div key={it.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
                <input
                  type="text"
                  value={it.description || ''}
                  onChange={(e) => update(it.id, { description: e.target.value })}
                  placeholder="Item / package description"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-contracts/60"
                />
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                <input
                  type="number" step="any" inputMode="decimal"
                  value={it.qty}
                  onChange={(e) => update(it.id, { qty: e.target.value })}
                  placeholder="Qty"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none focus:border-contracts/60"
                />
                <input
                  type="number" step="any" inputMode="decimal"
                  value={it.rate}
                  onChange={(e) => update(it.id, { rate: e.target.value })}
                  placeholder={`Rate (${currency})`}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none focus:border-contracts/60"
                />
                <div className="flex items-center justify-end rounded-md border border-line bg-canvas px-2 font-mono text-[12px] font-semibold text-ink-950">
                  {formatNumber(qty * rate)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  proposalTitle: 'Brand Identity Sprint — Northwind Books',
  proposalSubtitle: 'A 12-week engagement to define, design, and launch a unified brand system.',
  proposalNumber: 'PRP-2026-0117',
  proposalDate: todayISO(),
  validityId: '30',
  tone: 'creative',

  provider: {
    name: 'Sonchoy Studio Ltd.',
    contactName: 'Alex Hartwell',
    contactTitle: 'Managing Director',
    email: 'alex@sonchoystudio.com',
    phone: '+44 20 7946 0011',
  },
  client: {
    name: 'Northwind Books Ltd.',
    company: 'Northwind Books Ltd.',
    contactName: 'Marcus Vance',
    contactTitle: 'Chief Marketing Officer',
    email: 'marcus@northwindbooks.com',
  },

  includeExecSummary: true,
  execSummary: 'Northwind Books is repositioning from a regional bookshop chain to a national lifestyle brand. This proposal outlines a 12-week engagement to design and launch a unified brand identity — strategy, visual system, voice, and a roll-out kit that can be applied across all touchpoints by your in-house team.',

  includeProblem: true,
  problemStatement: 'The current Northwind identity was built piecemeal over six years across six store openings. The result: inconsistent typography, four logo variants in circulation, and customer research showing brand recognition is 40% lower than the closest competitor in the same price band.',

  includeApproach: true,
  approachDescription: 'A three-phase approach — Discover, Define, Deliver. We start with a 2-week audit and strategy phase to align stakeholders on positioning, then six weeks of identity design with weekly check-ins, and finish with a four-week roll-out and team-handover phase including a brand-guidelines workshop.',

  includeScope: true,
  scopeDescription: 'The work covered by this proposal includes:',
  scopeItems: [
    { id: 1, description: 'Brand audit and competitive landscape review' },
    { id: 2, description: 'Positioning and messaging framework' },
    { id: 3, description: 'Primary and secondary logo design with full mark system' },
    { id: 4, description: 'Type system, colour palette, photography and illustration direction' },
    { id: 5, description: 'Stationery and digital templates (letterhead, email, social, web)' },
    { id: 6, description: 'Brand guidelines PDF and Figma library handover' },
  ],
  outOfScopeNote: 'Website build, marketing campaign production, and printing costs are out of scope and quoted separately on request.',

  includeDeliverables: true,
  deliverablesIntro: 'You will receive the following tangible assets at the close of the engagement:',
  deliverables: [
    { id: 11, description: 'Brand strategy deck (PDF, ~30 slides)' },
    { id: 12, description: 'Logo files in all formats (.ai, .svg, .png, .pdf)' },
    { id: 13, description: 'Brand guidelines PDF (~50 pages)' },
    { id: 14, description: 'Figma library with all components and templates' },
    { id: 15, description: 'Stationery suite (print-ready) and email signature kit' },
  ],

  includeTimeline: true,
  timelineIntro: 'Indicative timeline — final dates confirmed at kick-off.',
  timelinePhases: [
    { id: 21, name: 'Phase 1 — Discover', description: 'Audit, stakeholder interviews, positioning', startDate: todayISO(), endDate: '2026-07-15' },
    { id: 22, name: 'Phase 2 — Define',   description: 'Identity design, type, colour, weekly reviews', startDate: '2026-07-16', endDate: '2026-09-10' },
    { id: 23, name: 'Phase 3 — Deliver',  description: 'Guidelines, templates, handover workshop',      startDate: '2026-09-11', endDate: '2026-10-08' },
  ],

  includeTeam: true,
  teamIntro: 'The engagement will be led by:',
  teamMembers: [
    { id: 31, name: 'Alex Hartwell', role: 'Strategy lead',          bio: '15 years; ex-Pentagram. Leads positioning and stakeholder alignment.' },
    { id: 32, name: 'Priya Shah',    role: 'Design lead',            bio: 'D&AD pencil 2024. Owns visual system end-to-end.' },
    { id: 33, name: 'Jordan Reed',   role: 'Project manager',        bio: 'Your single point of contact. Weekly status, risk, and budget tracking.' },
  ],

  includeInvestment: true,
  investmentIntro: 'The total investment for the engagement described above is set out below.',
  investmentItems: [
    { id: 41, description: 'Phase 1 — Discover (strategy + audit, 2 weeks)',      qty: 1, rate: 8000 },
    { id: 42, description: 'Phase 2 — Define (identity design, 6 weeks)',         qty: 1, rate: 18000 },
    { id: 43, description: 'Phase 3 — Deliver (guidelines + handover, 4 weeks)',  qty: 1, rate: 6000 },
  ],
  currency: 'USD',
  discount: 0,
  taxRate: 0,

  includeTerms: true,
  paymentTermsId: '50-50',
  termsIntro: 'The following commercial terms apply to this proposal:',
  additionalTerms: 'Out-of-pocket expenses (travel, software licences, photography) are billed at cost with prior approval. All IP transfers to Client on full payment of the final invoice.',

  includeNextSteps: true,
  nextStepsIntro: 'To accept this proposal and lock in the kick-off date:',

  includeAcceptance: true,

  notes: 'Internal: 8% discount room before walking away. Marcus is the decision-maker; CFO sign-off needed > $40K.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const numSections = useMemo(() => countSections(data), [data])
  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const term = useMemo(() => findPaymentTerm(data.paymentTermsId), [data.paymentTermsId])
  const validity = useMemo(() => findValidity(data.validityId), [data.validityId])
  const totals = useMemo(
    () => computeInvestmentTotal(data.investmentItems, { taxRate: data.taxRate, discount: data.discount }),
    [data.investmentItems, data.taxRate, data.discount]
  )

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setProviderField = (k) => (v) =>
    setData((s) => ({ ...s, provider: { ...s.provider, [k]: v } }))
  const setClientField = (k) => (v) =>
    setData((s) => ({ ...s, client: { ...s.client, [k]: v } }))
  const setLines = (k) => (lines) =>
    setData((s) => ({ ...s, [k]: lines.map((l) => ({ ...l, id: l.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => {
    const cleanLines = (arr) => (arr || []).map(({ id, ...rest }) => rest)
    return {
      ...data,
      scopeItems:      cleanLines(data.scopeItems),
      deliverables:    cleanLines(data.deliverables),
      timelinePhases:  cleanLines(data.timelinePhases),
      teamMembers:     cleanLines(data.teamMembers),
      investmentItems: cleanLines(data.investmentItems).map((it) => ({
        ...it,
        qty: Number(it.qty) || 0,
        rate: Number(it.rate) || 0,
      })),
    }
  }

  const handlePdf  = async () => { try { setBusy('pdf');  generateBusinessProposalPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleDocx = async () => { try { setBusy('docx'); await generateBusinessProposalDocx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-contracts) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-contracts-bg text-contracts">
              <ProposalIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Proposal · {numSections} sections
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700"
          >
            Reset
          </button>
        </div>

        <TextInput
          label="Proposal title"
          value={data.proposalTitle}
          onChange={setField('proposalTitle')}
          placeholder="A short, punchy project title"
        />
        <div className="mt-2">
          <TextInput
            label="Subtitle"
            value={data.proposalSubtitle}
            onChange={setField('proposalSubtitle')}
            placeholder="One-line description of what this engagement does"
          />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_140px] gap-2">
          <TextInput
            label="Proposal number"
            value={data.proposalNumber}
            onChange={setField('proposalNumber')}
            placeholder="PRP-2026-0001"
            mono
          />
          <DateInput
            label="Proposal date"
            value={data.proposalDate}
            onChange={setField('proposalDate')}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput
            label="Validity"
            value={data.validityId}
            onChange={setField('validityId')}
            options={VALIDITY_OPTIONS.map((v) => ({ value: v.id, label: v.label }))}
          />
          <SelectInput
            label="Tone"
            value={data.tone}
            onChange={setField('tone')}
            options={PROPOSAL_TONES.map((t) => ({ value: t.id, label: t.label }))}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Provider */}
        <div className="mb-3">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
            Prepared by (you)
          </span>
          <div className="space-y-2">
            <TextInput label="Company name"   value={data.provider.name} onChange={setProviderField('name')} />
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Contact name"  value={data.provider.contactName}  onChange={setProviderField('contactName')} />
              <TextInput label="Contact title" value={data.provider.contactTitle} onChange={setProviderField('contactTitle')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Email" value={data.provider.email} onChange={setProviderField('email')} mono />
              <TextInput label="Phone" value={data.provider.phone} onChange={setProviderField('phone')} mono />
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="mb-3">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
            Prepared for (client)
          </span>
          <div className="space-y-2">
            <TextInput label="Client / company name" value={data.client.name} onChange={setClientField('name')} />
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Contact name"  value={data.client.contactName}  onChange={setClientField('contactName')} />
              <TextInput label="Contact title" value={data.client.contactTitle} onChange={setClientField('contactTitle')} />
            </div>
            <TextInput label="Email" value={data.client.email} onChange={setClientField('email')} mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Executive summary */}
        <ToggleRow
          label="Executive summary"
          desc="One-paragraph overview at the top of the proposal"
          checked={data.includeExecSummary}
          onChange={setField('includeExecSummary')}
        />
        {data.includeExecSummary && (
          <div className="mt-2">
            <TextareaInput
              label="Executive summary"
              value={data.execSummary}
              onChange={setField('execSummary')}
              rows={3}
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Problem */}
        <ToggleRow
          label="The opportunity / problem"
          desc="Why this engagement matters"
          checked={data.includeProblem}
          onChange={setField('includeProblem')}
        />
        {data.includeProblem && (
          <div className="mt-2">
            <TextareaInput
              label="Problem statement"
              value={data.problemStatement}
              onChange={setField('problemStatement')}
              rows={3}
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Approach */}
        <ToggleRow
          label="Our approach"
          desc="The methodology you'll use"
          checked={data.includeApproach}
          onChange={setField('includeApproach')}
        />
        {data.includeApproach && (
          <div className="mt-2">
            <TextareaInput
              label="Approach description"
              value={data.approachDescription}
              onChange={setField('approachDescription')}
              rows={3}
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Scope */}
        <ToggleRow
          label="Scope of work"
          desc="What's included (and what isn't)"
          checked={data.includeScope}
          onChange={setField('includeScope')}
        />
        {data.includeScope && (
          <div className="mt-3 rounded-lg border border-contracts/20 bg-contracts-bg/30 p-3 space-y-2">
            <TextareaInput
              label="Scope intro"
              value={data.scopeDescription}
              onChange={setField('scopeDescription')}
              rows={2}
            />
            <StringList
              title="In scope"
              lines={data.scopeItems}
              setLines={setLines('scopeItems')}
              placeholder="A piece of work you'll do"
              accent
            />
            <TextareaInput
              label="Out of scope"
              value={data.outOfScopeNote}
              onChange={setField('outOfScopeNote')}
              rows={2}
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Deliverables */}
        <ToggleRow
          label="Deliverables"
          desc="The tangible things you'll hand over"
          checked={data.includeDeliverables}
          onChange={setField('includeDeliverables')}
        />
        {data.includeDeliverables && (
          <div className="mt-3 rounded-lg border border-contracts/20 bg-contracts-bg/30 p-3 space-y-2">
            <TextInput
              label="Intro"
              value={data.deliverablesIntro}
              onChange={setField('deliverablesIntro')}
            />
            <StringList
              title="Deliverables"
              lines={data.deliverables}
              setLines={setLines('deliverables')}
              placeholder="A specific file or asset"
              accent
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Timeline */}
        <ToggleRow
          label="Timeline"
          desc="Phases with start/end dates"
          checked={data.includeTimeline}
          onChange={setField('includeTimeline')}
        />
        {data.includeTimeline && (
          <div className="mt-3 rounded-lg border border-contracts/20 bg-contracts-bg/30 p-3 space-y-2">
            <TextInput
              label="Timeline intro"
              value={data.timelineIntro}
              onChange={setField('timelineIntro')}
            />
            <PhaseList lines={data.timelinePhases} setLines={setLines('timelinePhases')} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Team */}
        <ToggleRow
          label="The team"
          desc="Who'll be doing the work"
          checked={data.includeTeam}
          onChange={setField('includeTeam')}
        />
        {data.includeTeam && (
          <div className="mt-3 rounded-lg border border-contracts/20 bg-contracts-bg/30 p-3 space-y-2">
            <TextInput
              label="Team intro"
              value={data.teamIntro}
              onChange={setField('teamIntro')}
            />
            <TeamList lines={data.teamMembers} setLines={setLines('teamMembers')} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Investment */}
        <ToggleRow
          label="Investment / pricing"
          desc="Itemised pricing table with totals"
          checked={data.includeInvestment}
          onChange={setField('includeInvestment')}
        />
        {data.includeInvestment && (
          <div className="mt-3 rounded-lg border border-contracts/20 bg-contracts-bg/30 p-3 space-y-2">
            <TextareaInput
              label="Investment intro"
              value={data.investmentIntro}
              onChange={setField('investmentIntro')}
              rows={2}
            />
            <InvestmentList
              lines={data.investmentItems}
              setLines={setLines('investmentItems')}
              currency={data.currency}
            />
            <div className="grid grid-cols-3 gap-2">
              <SelectInput
                label="Currency"
                value={data.currency}
                onChange={setField('currency')}
                options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
              />
              <NumberInput
                label="Discount"
                value={data.discount}
                onChange={setField('discount')}
                suffix="%"
              />
              <NumberInput
                label="Tax"
                value={data.taxRate}
                onChange={setField('taxRate')}
                suffix="%"
              />
            </div>
            <div className="rounded-md border border-line bg-canvas px-3 py-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-mono text-ink-900">{cur.code} {formatNumber(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-500">Discount</span>
                  <span className="font-mono text-ink-900">- {cur.code} {formatNumber(totals.discount)}</span>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-500">Tax</span>
                  <span className="font-mono text-ink-900">{cur.code} {formatNumber(totals.tax)}</span>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between border-t border-line pt-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-contracts">Total investment</span>
                <span className="font-mono text-[14px] font-semibold text-contracts">
                  {formatMoney(totals.total, data.currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Terms */}
        <ToggleRow
          label="Terms & conditions"
          desc="Payment terms, validity, additional notes"
          checked={data.includeTerms}
          onChange={setField('includeTerms')}
        />
        {data.includeTerms && (
          <div className="mt-3 rounded-lg border border-contracts/20 bg-contracts-bg/30 p-3 space-y-2">
            <SelectInput
              label="Payment terms"
              value={data.paymentTermsId}
              onChange={setField('paymentTermsId')}
              options={PAYMENT_TERMS.map((p) => ({ value: p.id, label: p.label }))}
            />
            <TextareaInput
              label="Additional terms"
              value={data.additionalTerms}
              onChange={setField('additionalTerms')}
              rows={2}
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Next steps + Acceptance */}
        <ToggleRow
          label="Next steps"
          desc="What the client does to accept"
          checked={data.includeNextSteps}
          onChange={setField('includeNextSteps')}
        />
        <div className="mt-2">
          <ToggleRow
            label="Acceptance page"
            desc="Signature block for client to sign and return"
            checked={data.includeAcceptance}
            onChange={setField('includeAcceptance')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Summary card */}
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
            Proposal summary
          </p>
          <div className="space-y-1 text-[11px]">
            {[
              ['For',           data.client.name || '—'],
              ['By',            data.provider.name || '—'],
              ['Validity',      validity.label],
              ['Payment',       term.label],
              ['Sections',      `${numSections} included`],
              ['Investment',    `${cur.code} ${formatNumber(totals.total)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="text-ink-500">{k}</span>
                <span className="truncate text-right font-mono text-ink-900">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-contracts/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-contracts">
              Total investment
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {numSections} sections · {validity.label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.total, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Internal notes (not in PDF)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Discount room, decision-maker, internal context…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Proposal PDF'}
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={handleDocx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'docx' ? '…' : (<>Export DOCX (editable) <ArrowRight size={10} /></>)}
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">
            100% local · nothing uploaded
          </span>
          <a
            href="https://go.sonchoy.com/pdfFiller"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-crimson-300 no-underline hover:text-crimson-400"
          >
            Need e-signing?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function ProposalMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-contracts" />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <p className="m-0 font-mono text-[8px] uppercase tracking-[0.16em] text-ink-500">BUSINESS PROPOSAL</p>
          <p className="m-0 font-mono text-[8px] tracking-[0.08em] text-ink-500">PRP-2026-0117</p>
        </div>

        <p className="m-0 mt-6 text-[20px] font-bold tracking-[-0.015em] text-ink-950">Brand Identity Sprint — Northwind Books</p>
        <p className="m-0 mt-1 text-[11px] leading-[1.5] text-ink-600">A 12-week engagement to define, design, and launch a unified brand system.</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-contracts" />

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="m-0 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-ink-500">PREPARED FOR</p>
            <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">Northwind Books Ltd.</p>
            <p className="m-0 text-[9.5px] text-ink-700">Marcus Vance · CMO</p>
          </div>
          <div>
            <p className="m-0 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-ink-500">PREPARED BY</p>
            <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">Sonchoy Studio Ltd.</p>
            <p className="m-0 text-[9.5px] text-ink-700">Alex Hartwell · Managing Director</p>
          </div>
        </div>

        <p className="m-0 mt-5 text-[11px]">
          <span className="font-mono text-contracts">01</span>{' '}
          <span className="font-bold text-ink-950">EXECUTIVE SUMMARY</span>
        </p>
        <p className="m-0 mt-1 text-[9.5px] leading-[1.5] text-ink-700">
          Northwind Books is repositioning from a regional bookshop chain to a national lifestyle brand. This proposal outlines a 12-week engagement to design and launch a unified brand identity…
        </p>

        <p className="m-0 mt-4 text-[11px]">
          <span className="font-mono text-contracts">09</span>{' '}
          <span className="font-bold text-ink-950">INVESTMENT</span>
        </p>
        <div className="mt-2 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_50px_70px] gap-2 bg-canvas px-2 py-1.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-ink-500">
            <span>Item</span><span className="text-right">Qty</span><span className="text-right">Amount</span>
          </div>
          {[
            ['Phase 1 — Discover',      '1', '8,000.00'],
            ['Phase 2 — Define',        '1', '18,000.00'],
            ['Phase 3 — Deliver',       '1', '6,000.00'],
          ].map(([a, b, c]) => (
            <div key={a} className="grid grid-cols-[1fr_50px_70px] gap-2 border-t border-line px-2 py-1.5 text-[9.5px]">
              <span className="text-ink-900">{a}</span>
              <span className="text-right font-mono text-ink-700">{b}</span>
              <span className="text-right font-mono font-semibold text-ink-950">{c}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between rounded bg-ink-950 px-2.5 py-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-500">TOTAL INVESTMENT</span>
          <span className="font-mono text-[12px] font-bold text-paper">USD 32,000.00</span>
        </div>

        <p className="m-0 mt-4 text-[10px] italic text-ink-500">
          + 9 more sections (Opportunity, Approach, Scope, Deliverables, Timeline, Team, Terms, Next Steps, Acceptance)
        </p>
      </div>
    </div>
  )
}

function PreviewSection() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[760px] text-center">
          <Eyebrow className="mb-4">01 — What you create</Eyebrow>
          <SectionTitle>
            From a single form{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a pitch-ready proposal.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Cover page, executive summary, scope, deliverables, timeline, team, pricing table, terms, and a signature page — everything a buyer expects, nothing they don&rsquo;t.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-contracts-bg text-contracts">
                    <ProposalIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Proposal Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  12 sections · USD 32,000
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Title',       'Brand Identity Sprint — Northwind Books'],
                  ['Client',      'Northwind Books · Marcus Vance, CMO'],
                  ['Validity',    '30 days from issue'],
                  ['Tone',        'Creative / agency'],
                  ['Scope',       '6 in-scope items · 1 out-of-scope note'],
                  ['Deliverables','5 tangible assets'],
                  ['Timeline',    '3 phases over 12 weeks'],
                  ['Team',        '3 leads with bios'],
                  ['Investment',  'Itemised · 50/50 payment'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-contracts/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-contracts">Total investment</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 32,000.00</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 rotate-90 items-center justify-center rounded-full border border-crimson-500/40 bg-canvas text-crimson-300 shadow-[0_4px_18px_-4px_rgba(237,40,40,0.4)] lg:rotate-0">
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
                    <ExportIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    OUTPUT.PDF
                  </span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Signature-ready
                </span>
              </div>
              <ProposalMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Frame the work',     'Cover, executive summary, the opportunity, your approach. Set the strategic context before any line items.'],
  ['02', 'Scope and price',    'Scope, deliverables, timeline phases, team bios, and an itemised investment table with discount, tax, and totals.'],
  ['03', 'Send and close',     'Terms, next steps, signature page. Export PDF for sending or DOCX for last-minute redlines with your sales lead.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              The fastest path from{' '}
              <em className="font-serif font-normal italic text-crimson-300">brief to buy-in.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A good proposal does three jobs: prove you understood the brief, show how you&rsquo;ll deliver, and make the price easy to say yes to. This tool ships all three in one document.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(([num, title, desc]) => (
            <div key={num} className="rounded-xl border border-line bg-surface p-8">
              <div className="mb-4 font-serif text-[56px] font-normal italic leading-none text-crimson-300">
                {num}
              </div>
              <h4 className="m-0 mb-2 text-xl font-medium tracking-[-0.015em] text-ink-950">
                {title}
              </h4>
              <p className="m-0 text-md leading-[1.55] text-ink-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 4) Features ---------- */

const FEATURES = [
  { title: 'Branded cover page',       desc: 'Full-page cover with title, subtitle, "prepared for / by" block, and a crimson accent rule. First impression done in one form field.' },
  { title: '12 toggleable sections',   desc: 'Executive summary, opportunity, approach, scope, deliverables, timeline, team, investment, terms, next steps, acceptance — toggle each on/off.' },
  { title: 'Itemised pricing table',   desc: 'Add lines with qty × rate, apply discount and tax, total renders bold in the PDF and DOCX. Matches your invoice style.' },
  { title: 'Phase timeline',           desc: 'Add as many phases as you need with start/end dates. Renders as a clean bulleted timeline section.' },
  { title: 'Team bios',                desc: 'Drop in names, roles, and one-line bios. Buyers want to know who&rsquo;s actually doing the work — give them that.' },
  { title: 'Acceptance signature page', desc: 'Optional last page with signature blocks for both parties so the client can sign and return without a separate contract step.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built to close deals</Eyebrow>
          <SectionTitle>
            Every section the{' '}
            <em className="font-serif font-normal italic text-crimson-300">buyer&rsquo;s checklist</em> needs.
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-contracts/20 bg-contracts-bg text-contracts">
                <Check size={16} />
              </div>
              <h4 className="m-0 mb-2 text-lg font-medium tracking-[-0.015em] text-ink-950">
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

/* ---------- 5) FAQ ---------- */

const FAQS = [
  { q: 'When should I send a proposal vs go straight to a contract?', a: 'Proposals are pitch documents — they sell the work and the price. Contracts are legal instruments — they protect both parties. For most B2B services engagements, you send the proposal, get verbal/email approval, and then the contract follows. For larger deals, proposal first; contract on acceptance.' },
  { q: 'Does the proposal include legal protection?',                a: 'A signed acceptance page on a proposal is generally binding for the commercial terms (scope, price, payment, validity). For meaningful liability protection, IP assignment, and confidentiality, follow up with a Client Contract or Service Agreement before work commences. The acceptance page here is for commercial commitment, not legal coverage.' },
  { q: 'What\'s a "validity period" and why does it matter?',        a: 'It\'s how long the buyer has to accept before the offer expires. Standard is 30 days — long enough for procurement, short enough that pricing assumptions hold. After expiry, you\'re free to re-quote at different terms.' },
  { q: 'How do I price a proposal?',                                  a: 'The tool supports itemised pricing (line items × qty × rate), plus discount and tax. Most consultative engagements price by phase or package, not hours — buyers prefer outcomes-priced. Hourly works for ongoing or undefined-scope work.' },
  { q: 'Can the buyer redline the proposal?',                         a: 'Yes — export the DOCX version. They can comment, redline, and return. Then update the tool with the agreed changes and regenerate the PDF for signing.' },
  { q: 'Output formats?',                                             a: 'PDF (multi-page, branded cover, numbered section headers, pricing table, signature page, footer with page numbers) and .docx (fully editable, same structure, ready for sales-team final review or buyer-side redlines).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">business proposals.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {FAQS.map(({ q, a }, idx) => (
            <div key={q} className="bg-surface p-8">
              <h4 className="m-0 mb-3 flex items-start gap-3 text-lg font-medium tracking-[-0.015em] text-ink-950">
                <span className="mt-1 shrink-0 font-mono text-[11px] tracking-[0.1em] text-crimson-300">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {q}
              </h4>
              <p className="m-0 ml-8 text-md leading-[1.6] text-ink-600">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 6) Related tools ---------- */

const RELATED = [
  { name: 'Client Contract Generator',  desc: 'Sign once the proposal is accepted.',          Icon: ContractIcon, label: 'CONTRACTS', path: '/tools/client-contract-generator' },
  { name: 'Service Agreement Generator', desc: 'MSA + SoW for ongoing engagements.',          Icon: ContractIcon, label: 'CONTRACTS', path: '/tools/service-agreement-generator' },
  { name: 'NDA Generator',               desc: 'Mutual or one-way NDAs.',                     Icon: NdaIcon,      label: 'CONTRACTS', path: '/tools/nda-generator' },
  { name: 'Payment Reminder Letter',     desc: 'Polite-to-firm reminder letters.',            Icon: LetterIcon,   label: 'CONTRACTS' },
]

function RelatedTools() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="mb-3">05 — Related tools</Eyebrow>
            <SectionTitle>
              Often used{' '}
              <em className="font-serif font-normal italic text-crimson-300">together.</em>
            </SectionTitle>
          </div>
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 font-medium text-[14px] text-crimson-300 underline decoration-crimson-500/40 underline-offset-4 hover:decoration-crimson-300"
          >
            Browse all 91 tools
            <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((t) => {
            const inner = (
              <>
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-contracts">
                  {t.label}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-contracts-bg text-contracts">
                  <t.Icon />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-md font-medium tracking-[-0.01em] text-ink-950">{t.name}</h4>
                  <p className="m-0 text-xs leading-[1.5] text-ink-500">{t.desc}</p>
                </div>
              </>
            )
            const cls =
              'group relative flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md'
            return t.path ? (
              <Link key={t.name} href={t.path} className={cls}>{inner}</Link>
            ) : (
              <a key={t.name} href="#" className={cls}>{inner}</a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function BusinessProposalGeneratorTool() {
  return (
    <>
      <ToolHero />
      <PreviewSection />
      <CalloutStatHook />
      <HowItWorks />
      <Features />
      <PromoBento tone="canvas" />
      <FAQ />
      <RelatedTools />
    </>
  )
}
