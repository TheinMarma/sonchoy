'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  ContractIcon, NdaIcon, ProposalIcon, LetterIcon, SignatureIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, ENTITY_TYPES, TERM_TYPES, FEE_STRUCTURES, PAYMENT_TERMS,
  IP_OWNERSHIP, DISPUTE_RESOLUTION,
  findFeeStructure, findCurrency, countSections, computeMilestoneTotal,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/contract/compute'
import { generateContractPdf } from '@/lib/contract/generatePdf'
import { generateContractDocx } from '@/lib/contract/generateDocx'

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
      aria-label="Live Client Contract Generator"
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
  ['12',     'Standard clauses'],
  ['4',      'Fee structures'],
  ['PDF+',   'DOCX (editable)'],
  ['Free',   'Always · no signup'],
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
            <span className="text-ink-950">Client Contract Generator</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-contracts/30 bg-contracts-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-contracts">
            <span className="h-1.5 w-1.5 rounded-full bg-contracts shadow-[0_0_0_4px_rgba(244,63,94,0.25)]" />
            Contracts · Services agreement
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Client contracts{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              that hold up
            </em>
            <br />
            without a{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              law firm.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Fill in parties, scope, fees, and term — pick which standard clauses you want (IP, confidentiality, indemnity, liability cap) and ship a signature-ready PDF + editable DOCX. Lawyer-reviewed template, no signup.
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

/* ---------- Sub-component: deliverables/exclusions list ---------- */

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

/* ---------- Milestone editor ---------- */

function MilestoneList({ lines, setLines, currency }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = () =>
    setLines([...lines, { id: Date.now() + Math.random(), description: '', amount: 0, dueDate: '' }])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-contracts">
          Milestones
        </span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-contracts-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-contracts transition-colors hover:bg-contracts/20"
        >
          <Plus size={9} />
          Add milestone
        </button>
      </div>
      <div className="space-y-1.5">
        {lines.map((m) => (
          <div key={m.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
              <input
                type="text"
                value={m.description || ''}
                onChange={(e) => update(m.id, { description: e.target.value })}
                placeholder="Milestone description"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-contracts/60"
              />
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label="Remove milestone"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-[1fr_120px] gap-1.5">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={m.amount}
                onChange={(e) => update(m.id, { amount: e.target.value })}
                placeholder={`Amount (${currency})`}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none focus:border-contracts/60"
              />
              <input
                type="date"
                value={m.dueDate || ''}
                onChange={(e) => update(m.id, { dueDate: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none [color-scheme:dark] focus:border-contracts/60"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  contractTitle: 'Brand Strategy & Identity Services Agreement',
  contractNumber: 'CSA-2026-0042',
  effectiveDate: todayISO(),

  provider: {
    name: 'Sonchoy Studio Ltd.',
    entityType: 'company',
    address: '7 Old Street, London EC1V 9HL, United Kingdom',
    taxId: 'GB 123 4567 89',
    signatoryName: 'Alex Hartwell',
    signatoryTitle: 'Managing Director',
  },
  client: {
    name: 'Northwind Books Ltd.',
    entityType: 'company',
    address: '221B Baker Street, London NW1 6XE, United Kingdom',
    taxId: 'GB 987 6543 21',
    signatoryName: 'Marcus Vance',
    signatoryTitle: 'Chief Marketing Officer',
  },

  scopeSummary:
    'Provider shall design and deliver a complete brand identity system, including logo, type system, colour palette, and brand guidelines, for Client to use across digital and print channels.',
  deliverables: [
    { id: 1, description: 'Primary and secondary logo marks (vector files)' },
    { id: 2, description: 'Brand guidelines PDF (typography, colour, voice)' },
    { id: 3, description: 'Stationery suite (letterhead, business card, email signature)' },
    { id: 4, description: 'Source files (.ai, .indd, .fig) on project completion' },
  ],
  exclusions: [
    { id: 5, description: 'Website design and development' },
    { id: 6, description: 'Print production and merchandise sourcing' },
  ],

  termType: 'fixed',
  startDate: todayISO(),
  endDate: '2026-12-31',
  noticePeriodDays: 30,

  feeStructure: 'milestone',
  feeAmount: 32000,
  feeCurrency: 'USD',
  paymentTermsId: 'net-14',
  milestones: [
    { id: 7, description: '40% on signing',        amount: 12800, dueDate: todayISO() },
    { id: 8, description: '40% on midpoint review', amount: 12800, dueDate: '2026-09-15' },
    { id: 9, description: '20% on final delivery',  amount: 6400,  dueDate: '2026-12-15' },
  ],
  expensesReimbursable: true,

  includeIP: true,
  ipOwnership: 'client',
  includeConfidentiality: true,
  confidentialityYears: 3,
  includeNonCompete: false,
  includeWarranties: true,
  includeLiabilityCap: true,
  liabilityCapMultiple: 1,
  includeIndemnification: true,

  governingLaw: 'England and Wales',
  disputeResolution: 'courts',

  customClauses: [],
  notes: 'Boilerplate template — review with counsel before execution in high-value or cross-border deals.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const fee = useMemo(() => findFeeStructure(data.feeStructure), [data.feeStructure])
  const numSections = useMemo(() => countSections(data), [data])
  const cur = useMemo(() => findCurrency(data.feeCurrency), [data.feeCurrency])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setProviderField = (k) => (v) =>
    setData((s) => ({ ...s, provider: { ...s.provider, [k]: v } }))
  const setClientField = (k) => (v) =>
    setData((s) => ({ ...s, client: { ...s.client, [k]: v } }))
  const setLines = (k) => (lines) =>
    setData((s) => ({ ...s, [k]: lines.map((l) => ({ ...l, id: l.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => {
    const cleanLines = (arr) => arr.map(({ id, ...rest }) => rest)
    const findLabel = (list, id) => (list.find((x) => x.id === id) || {}).label
    return {
      ...data,
      provider: {
        ...data.provider,
        entityTypeLabel: findLabel(ENTITY_TYPES, data.provider.entityType),
      },
      client: {
        ...data.client,
        entityTypeLabel: findLabel(ENTITY_TYPES, data.client.entityType),
      },
      deliverables: cleanLines(data.deliverables),
      exclusions: cleanLines(data.exclusions),
      milestones: cleanLines(data.milestones).map((m) => ({
        ...m,
        amount: Number(m.amount) || 0,
      })),
      customClauses: cleanLines(data.customClauses || []),
    }
  }

  const handlePdf  = async () => { try { setBusy('pdf');  generateContractPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleDocx = async () => { try { setBusy('docx'); await generateContractDocx(buildPayload()) } finally { setBusy(null) } }

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
              <ContractIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Contract · {numSections} sections
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

        {/* Title */}
        <TextInput
          label="Contract title"
          value={data.contractTitle}
          onChange={setField('contractTitle')}
          placeholder="Client Services Agreement"
        />
        <div className="mt-2 grid grid-cols-[1fr_140px] gap-2">
          <TextInput
            label="Contract number"
            value={data.contractNumber}
            onChange={setField('contractNumber')}
            placeholder="CSA-2026-0001"
            mono
          />
          <DateInput
            label="Effective date"
            value={data.effectiveDate}
            onChange={setField('effectiveDate')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Provider */}
        <div className="mb-3">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
            Provider (you)
          </span>
          <div className="space-y-2">
            <TextInput label="Legal name"   value={data.provider.name}    onChange={setProviderField('name')} />
            <SelectInput
              label="Entity type"
              value={data.provider.entityType}
              onChange={setProviderField('entityType')}
              options={ENTITY_TYPES.map((e) => ({ value: e.id, label: e.label }))}
            />
            <TextareaInput
              label="Address"
              value={data.provider.address}
              onChange={setProviderField('address')}
              rows={2}
            />
            <TextInput label="Tax ID / Registration" value={data.provider.taxId} onChange={setProviderField('taxId')} mono />
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Signatory name"  value={data.provider.signatoryName}  onChange={setProviderField('signatoryName')} />
              <TextInput label="Signatory title" value={data.provider.signatoryTitle} onChange={setProviderField('signatoryTitle')} />
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="mb-3">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
            Client
          </span>
          <div className="space-y-2">
            <TextInput label="Legal name"   value={data.client.name}    onChange={setClientField('name')} />
            <SelectInput
              label="Entity type"
              value={data.client.entityType}
              onChange={setClientField('entityType')}
              options={ENTITY_TYPES.map((e) => ({ value: e.id, label: e.label }))}
            />
            <TextareaInput
              label="Address"
              value={data.client.address}
              onChange={setClientField('address')}
              rows={2}
            />
            <TextInput label="Tax ID / Registration" value={data.client.taxId} onChange={setClientField('taxId')} mono />
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Signatory name"  value={data.client.signatoryName}  onChange={setClientField('signatoryName')} />
              <TextInput label="Signatory title" value={data.client.signatoryTitle} onChange={setClientField('signatoryTitle')} />
            </div>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Scope */}
        <TextareaInput
          label="Scope of services"
          value={data.scopeSummary}
          onChange={setField('scopeSummary')}
          placeholder="One-paragraph summary of what Provider will do."
          rows={3}
        />
        <div className="mt-3">
          <StringList
            title="Deliverables"
            lines={data.deliverables}
            setLines={setLines('deliverables')}
            placeholder="What gets delivered"
            accent
          />
        </div>
        <div className="mt-3">
          <StringList
            title="Excluded from scope"
            lines={data.exclusions}
            setLines={setLines('exclusions')}
            placeholder="What's out of scope"
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Term */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Term &amp; termination
        </span>
        <SelectInput
          label="Term type"
          value={data.termType}
          onChange={setField('termType')}
          options={TERM_TYPES.map((t) => ({ value: t.id, label: t.label }))}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DateInput label="Start date" value={data.startDate} onChange={setField('startDate')} />
          {data.termType === 'fixed' && (
            <DateInput label="End date" value={data.endDate} onChange={setField('endDate')} />
          )}
          {data.termType === 'ongoing' && (
            <NumberInput
              label="Notice period"
              value={data.noticePeriodDays}
              onChange={setField('noticePeriodDays')}
              suffix="days"
            />
          )}
        </div>
        {data.termType === 'fixed' && (
          <div className="mt-2">
            <NumberInput
              label="Notice period"
              value={data.noticePeriodDays}
              onChange={setField('noticePeriodDays')}
              suffix="days"
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Compensation */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Compensation
        </span>
        <SelectInput
          label="Fee structure"
          value={data.feeStructure}
          onChange={setField('feeStructure')}
          options={FEE_STRUCTURES.map((f) => ({ value: f.id, label: f.label }))}
        />
        {fee.id !== 'milestone' && (
          <div className="mt-2 grid grid-cols-[1fr_92px] gap-2">
            <NumberInput
              label={fee.id === 'hourly' ? 'Hourly rate' : fee.id === 'retainer' ? 'Monthly retainer' : 'Fixed fee'}
              value={data.feeAmount}
              onChange={setField('feeAmount')}
            />
            <SelectInput
              label="Currency"
              value={data.feeCurrency}
              onChange={setField('feeCurrency')}
              options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
            />
          </div>
        )}
        {fee.id === 'milestone' && (
          <>
            <div className="mt-2">
              <SelectInput
                label="Currency"
                value={data.feeCurrency}
                onChange={setField('feeCurrency')}
                options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
              />
            </div>
            <div className="mt-2">
              <MilestoneList
                lines={data.milestones}
                setLines={setLines('milestones')}
                currency={data.feeCurrency}
              />
            </div>
            <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Milestone total</span>
              <span className="font-mono text-[12px] font-semibold text-contracts">
                {formatMoney(computeMilestoneTotal(data.milestones), data.feeCurrency)}
              </span>
            </div>
          </>
        )}
        <div className="mt-2">
          <SelectInput
            label="Payment terms"
            value={data.paymentTermsId}
            onChange={setField('paymentTermsId')}
            options={PAYMENT_TERMS.map((p) => ({ value: p.id, label: p.label }))}
          />
        </div>
        <div className="mt-2">
          <ToggleRow
            label="Expenses reimbursable"
            desc="Provider can bill back pre-approved out-of-pocket costs"
            checked={data.expensesReimbursable}
            onChange={setField('expensesReimbursable')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Standard clauses */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Standard clauses · pick what you need
        </span>
        <div className="space-y-2">
          <ToggleRow
            label="Intellectual property"
            desc="Who owns the work product"
            checked={data.includeIP}
            onChange={setField('includeIP')}
          />
          {data.includeIP && (
            <div className="ml-3">
              <SelectInput
                label="IP ownership"
                value={data.ipOwnership}
                onChange={setField('ipOwnership')}
                options={IP_OWNERSHIP.map((p) => ({ value: p.id, label: p.label }))}
              />
            </div>
          )}
          <ToggleRow
            label="Confidentiality"
            desc="Mutual NDA-style protection"
            checked={data.includeConfidentiality}
            onChange={setField('includeConfidentiality')}
          />
          {data.includeConfidentiality && (
            <div className="ml-3">
              <NumberInput
                label="Confidentiality duration"
                value={data.confidentialityYears}
                onChange={setField('confidentialityYears')}
                suffix="years"
              />
            </div>
          )}
          <ToggleRow
            label="Non-compete / non-solicit"
            desc="12-month post-termination restriction"
            checked={data.includeNonCompete}
            onChange={setField('includeNonCompete')}
          />
          <ToggleRow
            label="Warranties & disclaimers"
            desc="Standard professional-services warranties"
            checked={data.includeWarranties}
            onChange={setField('includeWarranties')}
          />
          <ToggleRow
            label="Limitation of liability"
            desc="Cap aggregate liability"
            checked={data.includeLiabilityCap}
            onChange={setField('includeLiabilityCap')}
          />
          {data.includeLiabilityCap && (
            <div className="ml-3">
              <NumberInput
                label="Liability cap multiple"
                value={data.liabilityCapMultiple}
                onChange={setField('liabilityCapMultiple')}
                suffix="× fees"
              />
            </div>
          )}
          <ToggleRow
            label="Indemnification"
            desc="Mutual indemnity for breach/negligence"
            checked={data.includeIndemnification}
            onChange={setField('includeIndemnification')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Governing law */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Governing law
        </span>
        <TextInput
          label="Jurisdiction"
          value={data.governingLaw}
          onChange={setField('governingLaw')}
          placeholder="England and Wales / California, USA / Delaware…"
        />
        <div className="mt-2">
          <SelectInput
            label="Dispute resolution"
            value={data.disputeResolution}
            onChange={setField('disputeResolution')}
            options={DISPUTE_RESOLUTION.map((d) => ({ value: d.id, label: d.label }))}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Summary card */}
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
            Contract summary
          </p>
          <div className="space-y-1 text-[11px]">
            {[
              ['Parties',     `${data.provider.name} ↔ ${data.client.name}`],
              ['Term',        data.termType === 'fixed' ? `Fixed: ${formatDate(data.startDate)} → ${formatDate(data.endDate)}` : `Ongoing from ${formatDate(data.startDate)}`],
              ['Fee',         fee.id === 'milestone' ? `${cur.code} ${formatNumber(computeMilestoneTotal(data.milestones))} (milestones)` : `${cur.code} ${formatNumber(Number(data.feeAmount) || 0)} (${fee.label.toLowerCase()})`],
              ['Sections',    `${numSections} included`],
              ['Jurisdiction', data.governingLaw || '—'],
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
              Contract value
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {numSections} sections · {fee.label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {fee.id === 'milestone'
              ? formatMoney(computeMilestoneTotal(data.milestones), data.feeCurrency)
              : formatMoney(Number(data.feeAmount) || 0, data.feeCurrency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Internal notes (not in PDF)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Counsel review notes, version comments…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Contract PDF'}
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

function ContractMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="text-center">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.16em] text-ink-500">CLIENT SERVICES AGREEMENT</p>
        <p className="m-0 mt-2 text-[18px] font-bold tracking-[-0.01em] text-ink-950">Brand Strategy &amp; Identity Services Agreement</p>
        <p className="m-0 mt-1 text-[10px] text-ink-500">CSA-2026-0042 · Effective 30 Jun 2026</p>
        <div className="mx-auto mt-2 h-[2px] w-10 rounded bg-contracts" />
      </div>

      <p className="m-0 mt-5 text-[10px] leading-[1.5] text-ink-700">
        This Agreement is entered into on 30 Jun 2026 between:
      </p>
      <p className="m-0 mt-2 text-[10px] font-semibold text-ink-950">PROVIDER: Sonchoy Studio Ltd.</p>
      <p className="m-0 text-[9.5px] text-ink-700">Limited company · 7 Old Street, London EC1V 9HL</p>
      <p className="m-0 text-[9.5px] text-ink-500">Tax ID: GB 123 4567 89</p>

      <p className="m-0 mt-2 text-[10px] font-semibold text-ink-950">CLIENT: Northwind Books Ltd.</p>
      <p className="m-0 text-[9.5px] text-ink-700">Limited company · 221B Baker Street, London NW1 6XE</p>
      <p className="m-0 text-[9.5px] text-ink-500">Tax ID: GB 987 6543 21</p>

      <p className="m-0 mt-3 text-[9px] italic text-ink-500">
        (Provider and Client are referred to individually as a "Party" and collectively as the "Parties".)
      </p>

      <p className="m-0 mt-4 text-[11px]"><span className="font-bold text-contracts">1.</span> <span className="font-bold text-ink-950">SCOPE OF SERVICES</span></p>
      <p className="m-0 mt-1 text-[9.5px] leading-[1.5] text-ink-700">
        Provider shall design and deliver a complete brand identity system, including logo, type system, colour palette, and brand guidelines, for Client to use across digital and print channels.
      </p>

      <p className="m-0 mt-3 text-[11px]"><span className="font-bold text-contracts">2.</span> <span className="font-bold text-ink-950">TERM AND TERMINATION</span></p>
      <p className="m-0 mt-1 text-[9.5px] leading-[1.5] text-ink-700">
        This Agreement commences on 30 Jun 2026 and continues until 31 Dec 2026 (the "Term"), unless terminated earlier in accordance with this Section…
      </p>

      <p className="m-0 mt-3 text-[11px]"><span className="font-bold text-contracts">3.</span> <span className="font-bold text-ink-950">COMPENSATION AND PAYMENT</span></p>
      <p className="m-0 mt-1 text-[9.5px] leading-[1.5] text-ink-700">
        Client shall pay Provider on a milestone basis as set out below, for an aggregate amount of USD 32,000.00…
      </p>

      <p className="m-0 mt-3 text-[10px] italic text-ink-500">
        + 6 more sections (IP, Confidentiality, Warranties, Liability, Indemnity, Governing Law)
      </p>

      {/* Signature blocks */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {['PROVIDER', 'CLIENT'].map((label) => (
          <div key={label}>
            <p className="m-0 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-ink-500">{label}</p>
            <div className="mt-6 h-px bg-ink-950" />
            <p className="m-0 mt-0.5 text-[8px] text-ink-500">Signature</p>
            <p className="m-0 mt-2 text-[10px] font-bold text-ink-950">
              {label === 'PROVIDER' ? 'Alex Hartwell' : 'Marcus Vance'}
            </p>
            <p className="m-0 text-[9px] text-ink-500">
              {label === 'PROVIDER' ? 'Managing Director' : 'CMO'}
            </p>
          </div>
        ))}
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
            From a few form fields{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a signature-ready contract.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Professional document layout, numbered sections, plain-English clauses, and signature blocks on the last page — exactly the format counter-parties expect.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-contracts-bg text-contracts">
                    <ContractIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Contract Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  10 sections · USD 32,000
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Title',         'Brand Strategy & Identity Services'],
                  ['Parties',       'Sonchoy Studio ↔ Northwind Books'],
                  ['Term',          'Fixed · 6 months · 30-day notice'],
                  ['Fee',           '3 milestones · USD 32,000 total'],
                  ['IP',            'Assigned to Client on full payment'],
                  ['Confidentiality', 'Mutual · 3 years'],
                  ['Liability cap',  '1× fees · standard exclusions'],
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
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-contracts">Contract value</span>
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
              <ContractMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Fill the parties',        'Provider + Client legal name, entity type, address, tax ID, and signatory details. Re-usable across every contract.'],
  ['02', 'Set scope + fees',        'One-paragraph scope, deliverables, exclusions. Pick fee structure (fixed, hourly, retainer, or milestones) and payment terms.'],
  ['03', 'Pick clauses, generate',  'Toggle which standard clauses to include (IP, confidentiality, warranties, indemnity, liability cap). Download as PDF + editable DOCX.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three steps from{' '}
              <em className="font-serif font-normal italic text-crimson-300">handshake to signature.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Every clause is plain-English, lawyer-reviewed boilerplate. For high-value or cross-border deals, run the DOCX past your counsel before signing.
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
  { title: '12 standard clauses',      desc: 'Parties, scope, term, fees, IP, confidentiality, non-compete, warranties, liability cap, indemnity, governing law, entire-agreement — toggle what you need.' },
  { title: '4 fee structures',         desc: 'Fixed project fee, hourly rate, monthly retainer, or milestone-based. Milestone mode totals the schedule automatically.' },
  { title: 'IP ownership modes',       desc: '3 options — assigned to Client on payment, retained by Provider with licence, or jointly owned. Wording adapts to your pick.' },
  { title: 'Liability cap',            desc: 'Standard cap formula (1× fees, 2× fees, etc.) plus carve-outs for gross negligence, indemnity, and confidentiality breaches.' },
  { title: 'Dispute resolution',       desc: 'Choose courts, binding arbitration, or mediation-then-arbitration. Wording matches international best practice.' },
  { title: 'PDF + editable DOCX',      desc: 'Print-ready PDF for the deal flow, plus a fully editable .docx for redlining with counsel or your counter-party.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for everyday deals</Eyebrow>
          <SectionTitle>
            Every clause your{' '}
            <em className="font-serif font-normal italic text-crimson-300">counter-party</em> expects.
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
  { q: 'Is this a substitute for a lawyer?',                a: 'No — it\'s a lawyer-reviewed template you can use for low-to-medium risk client engagements (typical professional-services contracts under USD 100k, single jurisdiction). For high-value, M&A, or cross-border deals, take the .docx to qualified counsel for a redline before signing.' },
  { q: 'Which jurisdictions does it cover?',                a: 'The template is jurisdiction-neutral. You type your governing law in the form (e.g. "England and Wales", "Delaware, USA", "Maharashtra, India") and the relevant section adopts it. Disputes can route to courts, arbitration, or mediation-first.' },
  { q: 'Why is the liability cap so important?',            a: 'Without a cap, your liability is "uncapped" — a 50,000 contract could expose you to 5,000,000 in damages. The standard 1× fees cap means you can never be sued for more than you were paid. Gross negligence and willful misconduct stay uncapped (as they should).' },
  { q: 'What does "IP assigned on full payment" mean?',     a: 'Until the Client has paid all invoices, the Provider owns the work. Once fully paid, ownership transfers to the Client. This protects Providers from non-paying clients walking away with the work.' },
  { q: 'Can I edit the clauses?',                           a: 'Yes — download the DOCX, open it in Word/Pages/Google Docs, and edit freely. The PDF is the locked, signature-ready version; the DOCX is the editable working copy.' },
  { q: 'Output formats?',                                   a: 'PDF (multi-page, numbered sections, signature blocks on the last page, page footers with brand) and .docx (fully editable — same content, ready for counsel redlines or counter-party negotiation).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">client contracts.</em>
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
  { name: 'NDA Generator',              desc: 'Mutual or one-way non-disclosure agreements.',  Icon: NdaIcon,       label: 'CONTRACTS', path: '/tools/nda-generator' },
  { name: 'Service Agreement',          desc: 'Master service + SoW agreements.',              Icon: ContractIcon,  label: 'CONTRACTS' },
  { name: 'Business Proposal Generator', desc: 'Pitch-ready proposals before the contract.',   Icon: ProposalIcon,  label: 'CONTRACTS' },
  { name: 'Payment Reminder Letter',    desc: 'Polite-to-firm reminder letters.',              Icon: LetterIcon,    label: 'CONTRACTS' },
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

export default function ClientContractGeneratorTool() {
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
