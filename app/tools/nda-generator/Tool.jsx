'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  NdaIcon, ContractIcon, ProposalIcon, LetterIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  NDA_TYPES, ENTITY_TYPES, CONFIDENTIAL_DEFINITIONS, EXCLUSIONS_MODE, TERM_OPTIONS,
  findNdaType, findTerm, countSections,
  formatDate, todayISO,
} from '@/lib/nda/compute'
import { generateNDAPdf } from '@/lib/nda/generatePdf'
import { generateNDADocx } from '@/lib/nda/generateDocx'

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
      aria-label="Live NDA Generator"
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
  ['2',     'NDA types (mutual + one-way)'],
  ['10',    'Standard clauses'],
  ['PDF+',  'DOCX (editable)'],
  ['Free',  'Always · no signup'],
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
            <span className="text-ink-950">NDA Generator</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-contracts/30 bg-contracts-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-contracts">
            <span className="h-1.5 w-1.5 rounded-full bg-contracts shadow-[0_0_0_4px_rgba(244,63,94,0.25)]" />
            Contracts · Non-disclosure
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            NDAs that hold up{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              under scrutiny.
            </em>
            <br />
            Ready in{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              60 seconds.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Pick mutual or one-way, fill in the parties and purpose, choose your term and exclusions — ship a signature-ready PDF + editable DOCX. Standard lawyer-reviewed clauses, no jargon, no signup.
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

/* ---------- String list (categories / exclusions) ---------- */

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
        {lines.length === 0 && (
          <div className="rounded-md border border-dashed border-line-strong bg-canvas/40 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            No items
          </div>
        )}
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

/* ---------- Stateful generator ---------- */

const INITIAL = {
  ndaTitle: 'Mutual NDA — Project Apollo',
  ndaNumber: 'NDA-2026-0042',
  effectiveDate: todayISO(),
  type: 'mutual',

  partyA: {
    name: 'Sonchoy Studio Ltd.',
    entityType: 'company',
    address: '7 Old Street, London EC1V 9HL, United Kingdom',
    signatoryName: 'Alex Hartwell',
    signatoryTitle: 'Managing Director',
    role: 'discloser',
  },
  partyB: {
    name: 'Northwind Books Ltd.',
    entityType: 'company',
    address: '221B Baker Street, London NW1 6XE, United Kingdom',
    signatoryName: 'Marcus Vance',
    signatoryTitle: 'CMO',
    role: 'receiver',
  },

  purpose: 'The Parties wish to explore a potential brand-strategy engagement (the "Purpose") and may exchange confidential information in connection with that exploration.',

  confidentialDefinition: 'broad',
  specificCategories: [
    { id: 1, description: 'Financial information, including budgets, forecasts, and pricing' },
    { id: 2, description: 'Customer lists, contacts, and pipeline data' },
    { id: 3, description: 'Marketing strategies and unannounced campaigns' },
  ],

  exclusions: 'standard',
  customExclusions: [],

  termId: '3',
  surviveTermination: true,

  returnRequired: true,
  destructionAllowed: true,

  includeNonSolicit: false,
  includeInjunctiveRelief: true,

  governingLaw: 'England and Wales',

  notes: 'Lawyer-reviewed boilerplate. Replace governing law and counsel-review before signing in high-stakes or cross-border deals.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const ndaType = useMemo(() => findNdaType(data.type), [data.type])
  const term = useMemo(() => findTerm(data.termId), [data.termId])
  const numSections = useMemo(() => countSections(data), [data])
  const isMutual = data.type === 'mutual'

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setPartyAField = (k) => (v) =>
    setData((s) => ({ ...s, partyA: { ...s.partyA, [k]: v } }))
  const setPartyBField = (k) => (v) =>
    setData((s) => ({ ...s, partyB: { ...s.partyB, [k]: v } }))
  const setLines = (k) => (lines) =>
    setData((s) => ({ ...s, [k]: lines.map((l) => ({ ...l, id: l.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  // Toggle one-way roles: if user changes Party A to discloser, set Party B to receiver and vice versa
  const setPartyARole = (role) => {
    setData((s) => ({
      ...s,
      partyA: { ...s.partyA, role },
      partyB: { ...s.partyB, role: role === 'discloser' ? 'receiver' : 'discloser' },
    }))
  }

  const buildPayload = () => {
    const cleanLines = (arr) => (arr || []).map(({ id, ...rest }) => rest)
    const findLabel = (list, id) => (list.find((x) => x.id === id) || {}).label
    return {
      ...data,
      partyA: { ...data.partyA, entityTypeLabel: findLabel(ENTITY_TYPES, data.partyA.entityType) },
      partyB: { ...data.partyB, entityTypeLabel: findLabel(ENTITY_TYPES, data.partyB.entityType) },
      specificCategories: cleanLines(data.specificCategories),
      customExclusions: cleanLines(data.customExclusions),
    }
  }

  const handlePdf  = async () => { try { setBusy('pdf');  generateNDAPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleDocx = async () => { try { setBusy('docx'); await generateNDADocx(buildPayload()) } finally { setBusy(null) } }

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
              <NdaIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New NDA · {numSections} sections
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

        {/* NDA type toggle */}
        <div>
          <span className={`${labelClass} mb-[5px] block`}>NDA type</span>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            {NDA_TYPES.map((t) => {
              const active = data.type === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setField('type')(t.id)}
                  className={`px-3 py-2 text-left transition-colors ${active ? 'bg-contracts-bg' : 'bg-paper hover:bg-canvas'}`}
                >
                  <span className={`block font-mono text-[10px] uppercase tracking-[0.1em] ${active ? 'text-contracts' : 'text-ink-500'}`}>
                    {t.label}
                  </span>
                  <span className={`mt-0.5 block text-[11px] leading-[1.3] ${active ? 'text-ink-950' : 'text-ink-500'}`}>
                    {t.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-3">
          <TextInput
            label="NDA title"
            value={data.ndaTitle}
            onChange={setField('ndaTitle')}
            placeholder="Non-Disclosure Agreement"
          />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_140px] gap-2">
          <TextInput
            label="NDA reference"
            value={data.ndaNumber}
            onChange={setField('ndaNumber')}
            placeholder="NDA-2026-0001"
            mono
          />
          <DateInput
            label="Effective date"
            value={data.effectiveDate}
            onChange={setField('effectiveDate')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Party A */}
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
              {isMutual ? 'Party A' : (data.partyA.role === 'discloser' ? 'Disclosing party' : 'Receiving party')}
            </span>
            {!isMutual && (
              <button
                type="button"
                onClick={() => setPartyARole(data.partyA.role === 'discloser' ? 'receiver' : 'discloser')}
                className="rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700 hover:border-line-strong"
              >
                Switch role
              </button>
            )}
          </div>
          <div className="space-y-2">
            <TextInput label="Legal name" value={data.partyA.name} onChange={setPartyAField('name')} />
            <SelectInput
              label="Entity type"
              value={data.partyA.entityType}
              onChange={setPartyAField('entityType')}
              options={ENTITY_TYPES.map((e) => ({ value: e.id, label: e.label }))}
            />
            <TextareaInput label="Address" value={data.partyA.address} onChange={setPartyAField('address')} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Signatory name"  value={data.partyA.signatoryName}  onChange={setPartyAField('signatoryName')} />
              <TextInput label="Signatory title" value={data.partyA.signatoryTitle} onChange={setPartyAField('signatoryTitle')} />
            </div>
          </div>
        </div>

        {/* Party B */}
        <div className="mb-3">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
            {isMutual ? 'Party B' : (data.partyB.role === 'discloser' ? 'Disclosing party' : 'Receiving party')}
          </span>
          <div className="space-y-2">
            <TextInput label="Legal name" value={data.partyB.name} onChange={setPartyBField('name')} />
            <SelectInput
              label="Entity type"
              value={data.partyB.entityType}
              onChange={setPartyBField('entityType')}
              options={ENTITY_TYPES.map((e) => ({ value: e.id, label: e.label }))}
            />
            <TextareaInput label="Address" value={data.partyB.address} onChange={setPartyBField('address')} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Signatory name"  value={data.partyB.signatoryName}  onChange={setPartyBField('signatoryName')} />
              <TextInput label="Signatory title" value={data.partyB.signatoryTitle} onChange={setPartyBField('signatoryTitle')} />
            </div>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Purpose */}
        <TextareaInput
          label="Purpose"
          value={data.purpose}
          onChange={setField('purpose')}
          placeholder="What are the parties discussing? (e.g. evaluate a partnership)"
          rows={3}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Confidential Information */}
        <SelectInput
          label="Confidential information"
          value={data.confidentialDefinition}
          onChange={setField('confidentialDefinition')}
          options={CONFIDENTIAL_DEFINITIONS.map((c) => ({ value: c.id, label: c.label }))}
        />
        {data.confidentialDefinition === 'specific' && (
          <div className="mt-3">
            <StringList
              title="Specific categories"
              lines={data.specificCategories}
              setLines={setLines('specificCategories')}
              placeholder="e.g. customer lists, financial forecasts"
              accent
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Exclusions */}
        <SelectInput
          label="Exclusions"
          value={data.exclusions}
          onChange={setField('exclusions')}
          options={EXCLUSIONS_MODE.map((e) => ({ value: e.id, label: e.label }))}
        />
        {data.exclusions === 'custom' && (
          <div className="mt-3">
            <StringList
              title="Custom exclusions"
              lines={data.customExclusions}
              setLines={setLines('customExclusions')}
              placeholder="e.g. info already in trade publications"
              accent
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Term */}
        <SelectInput
          label="Confidentiality term"
          value={data.termId}
          onChange={setField('termId')}
          options={TERM_OPTIONS.map((t) => ({ value: t.id, label: t.label }))}
        />
        {data.termId !== 'indefinite' && (
          <div className="mt-2">
            <ToggleRow
              label="Survives termination"
              desc="Obligations continue after expiry"
              checked={data.surviveTermination}
              onChange={setField('surviveTermination')}
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Return / destruction */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Return / destruction options
        </span>
        <div className="space-y-2">
          <ToggleRow
            label="Return required"
            desc="Receiving party must return materials on request"
            checked={data.returnRequired}
            onChange={setField('returnRequired')}
          />
          <ToggleRow
            label="Destruction allowed"
            desc="Materials may be destroyed (with certification)"
            checked={data.destructionAllowed}
            onChange={setField('destructionAllowed')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Optional clauses */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Optional clauses
        </span>
        <div className="space-y-2">
          <ToggleRow
            label="Non-solicitation"
            desc="12-month restriction on hiring each other's people"
            checked={data.includeNonSolicit}
            onChange={setField('includeNonSolicit')}
          />
          <ToggleRow
            label="Injunctive relief"
            desc="Right to seek court orders to stop breaches"
            checked={data.includeInjunctiveRelief}
            onChange={setField('includeInjunctiveRelief')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Governing law */}
        <TextInput
          label="Governing law / jurisdiction"
          value={data.governingLaw}
          onChange={setField('governingLaw')}
          placeholder="England and Wales / California / Delaware…"
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Summary card */}
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
            NDA summary
          </p>
          <div className="space-y-1 text-[11px]">
            {[
              ['Type',           ndaType.label],
              ['Parties',        `${data.partyA.name} ↔ ${data.partyB.name}`],
              ['Definition',     data.confidentialDefinition === 'specific' ? `Specific (${data.specificCategories.length} categories)` : 'Broad (all non-public)'],
              ['Term',           term.id === 'indefinite' ? 'Indefinite' : `${term.years} year${term.years === 1 ? '' : 's'}`],
              ['Return/destroy', data.returnRequired || data.destructionAllowed ? 'Yes' : 'No'],
              ['Jurisdiction',   data.governingLaw || '—'],
              ['Sections',       `${numSections} included`],
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
              {isMutual ? 'Mutual NDA' : 'One-way NDA'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {numSections} sections · {term.id === 'indefinite' ? 'indefinite' : `${term.years}y term`}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[16px] font-semibold text-paper">
            Ready to ship
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Internal notes (not in PDF)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Counsel notes, version comments…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate NDA PDF'}
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

function NdaMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="text-center">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.16em] text-ink-500">MUTUAL NON-DISCLOSURE AGREEMENT</p>
        <p className="m-0 mt-2 text-[18px] font-bold tracking-[-0.01em] text-ink-950">Mutual NDA — Project Apollo</p>
        <p className="m-0 mt-1 text-[10px] text-ink-500">NDA-2026-0042 · Effective 30 Jun 2026</p>
        <div className="mx-auto mt-2 h-[2px] w-10 rounded bg-contracts" />
      </div>

      <p className="m-0 mt-5 text-[10px] leading-[1.5] text-ink-700">
        This Non-Disclosure Agreement is entered into on 30 Jun 2026 between:
      </p>
      <p className="m-0 mt-2 text-[10px] font-semibold text-ink-950">PARTY A: Sonchoy Studio Ltd.</p>
      <p className="m-0 text-[9.5px] text-ink-700">Limited company · 7 Old Street, London EC1V 9HL</p>
      <p className="m-0 mt-2 text-[10px] font-semibold text-ink-950">PARTY B: Northwind Books Ltd.</p>
      <p className="m-0 text-[9.5px] text-ink-700">Limited company · 221B Baker Street, London NW1 6XE</p>

      <p className="m-0 mt-3 text-[9px] italic text-ink-500">
        (Each Party may act as Disclosing Party or Receiving Party from time to time.)
      </p>

      <p className="m-0 mt-4 text-[11px]">
        <span className="font-bold text-contracts">1.</span> <span className="font-bold text-ink-950">PURPOSE</span>
      </p>
      <p className="m-0 mt-1 text-[9.5px] leading-[1.5] text-ink-700">
        The Parties wish to explore a potential brand-strategy engagement and may exchange confidential information in connection with that exploration…
      </p>

      <p className="m-0 mt-3 text-[11px]">
        <span className="font-bold text-contracts">2.</span> <span className="font-bold text-ink-950">CONFIDENTIAL INFORMATION</span>
      </p>
      <p className="m-0 mt-1 text-[9.5px] leading-[1.5] text-ink-700">
        "Confidential Information" means any and all non-public information of a Party, whether disclosed orally, in writing, or electronically…
      </p>

      <p className="m-0 mt-3 text-[11px]">
        <span className="font-bold text-contracts">3.</span> <span className="font-bold text-ink-950">OBLIGATIONS OF RECEIVING PARTY</span>
      </p>
      <p className="m-0 mt-1 text-[9.5px] leading-[1.5] text-ink-700">
        Each Party shall hold the Confidential Information in strict confidence and use it solely for the Purpose…
      </p>

      <p className="m-0 mt-3 text-[10px] italic text-ink-500">
        + 7 more sections (Exclusions, Term, Return, Injunctive Relief, Governing Law, General)
      </p>

      {/* Signature blocks */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {['PARTY A', 'PARTY B'].map((label) => (
          <div key={label}>
            <p className="m-0 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-ink-500">{label}</p>
            <div className="mt-6 h-px bg-ink-950" />
            <p className="m-0 mt-0.5 text-[8px] text-ink-500">Signature</p>
            <p className="m-0 mt-2 text-[10px] font-bold text-ink-950">
              {label === 'PARTY A' ? 'Alex Hartwell' : 'Marcus Vance'}
            </p>
            <p className="m-0 text-[9px] text-ink-500">
              {label === 'PARTY A' ? 'Managing Director' : 'CMO'}
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
            From a quick form{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a signature-ready NDA.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Standard 10-section structure, plain-English clauses, parties named at the top, signature blocks on the last page — exactly the format counter-parties recognise on sight.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-contracts-bg text-contracts">
                    <NdaIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    NDA Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Mutual · 10 sections
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Type',          'Mutual NDA'],
                  ['Parties',       'Sonchoy Studio ↔ Northwind Books'],
                  ['Purpose',       'Brand-strategy engagement exploration'],
                  ['Definition',    'Broad — all non-public information'],
                  ['Term',          '3 years · survives termination'],
                  ['Return',        'On request + destruction allowed'],
                  ['Jurisdiction',  'England and Wales'],
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
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-contracts">Ready to ship</span>
                <span className="font-mono text-[12px] font-semibold text-paper">PDF + DOCX</span>
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
              <NdaMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick mutual or one-way', 'Mutual NDAs cover both sides exchanging information. One-way NDAs cover situations where only one party discloses (e.g. pitching to investors).'],
  ['02', 'Fill in the basics',     'Parties, purpose, term, governing law. Toggle which standard clauses to include — non-solicit, injunctive relief, return/destruction.'],
  ['03', 'Download both formats',  'Signature-ready PDF and an editable DOCX. Print and sign, or send for e-signing through your preferred tool.'],
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
              <em className="font-serif font-normal italic text-crimson-300">conversation to signed.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            NDAs aren&rsquo;t complicated; they&rsquo;re standard. The template covers 90%+ of real-world use cases. For high-stakes or cross-border deals, run the DOCX past counsel before signing.
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
  { title: 'Mutual or one-way',         desc: 'Mutual NDAs are most common (partnerships, M&A talks). One-way NDAs are for pitches, hires, and vendor evaluations.' },
  { title: 'Broad or specific',          desc: 'Broad covers "all non-public information". Specific lists exact categories — useful when only a narrow slice should be protected.' },
  { title: 'Customisable term',          desc: '1, 2, 3, 5, or 7 years — or indefinite (until publicly disclosed). Trade secrets often need indefinite; commercial info usually 2-3 years.' },
  { title: 'Return + destruction',       desc: 'Standard clause for return on request, with destruction certified by an officer. Toggle each on/off independently.' },
  { title: 'Non-solicit + injunction',   desc: 'Optional clauses for 12-month non-solicit of the other party\'s people, and the right to seek court orders for breaches.' },
  { title: 'PDF + editable DOCX',        desc: 'Print-ready PDF for signing, plus an editable .docx for redlining with counsel or your counter-party.' },
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
  { q: 'When do I need a mutual vs one-way NDA?',           a: 'Mutual when both sides will share information (partnership talks, joint ventures, M&A discussions). One-way when only one side discloses (pitching to investors, hiring an evaluator, vendor evaluations). Mutual is more common in practice.' },
  { q: 'How long should the term be?',                       a: 'Commercial info: 2-3 years is standard. Strategic plans / pricing: 3-5 years. Trade secrets: indefinite (since trade secret protection itself is indefinite). Avoid going much longer than necessary — courts may not enforce overly long terms.' },
  { q: 'Should I require return or destruction?',            a: 'Return is the traditional approach. Destruction (with written certification) is more practical now that most data is digital. Allowing either, at the disclosing party\'s election, gives maximum flexibility.' },
  { q: 'What does "injunctive relief" do?',                  a: 'It gives the disclosing party the right to ask a court for an emergency order stopping the receiving party from continuing a breach — without having to wait through normal litigation or prove monetary damages. Standard for trade-secret protection.' },
  { q: 'Is this enforceable internationally?',               a: 'Generally yes — NDAs are enforceable in most common-law and many civil-law jurisdictions. The governing-law clause picks which courts apply. For high-value cross-border deals, get local counsel to review before signing.' },
  { q: 'Output formats?',                                    a: 'PDF (multi-page, numbered sections, signature blocks on the last page, page footers) and .docx (fully editable, same content, ready for redlines or counter-party negotiation).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">NDAs.</em>
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
  { name: 'Client Contract Generator', desc: 'Engagement contracts with scope and fees.', Icon: ContractIcon, label: 'CONTRACTS', path: '/tools/client-contract-generator' },
  { name: 'Service Agreement',         desc: 'Master service + SoW agreements.',          Icon: ContractIcon, label: 'CONTRACTS' },
  { name: 'Business Proposal',         desc: 'Pitch-ready proposals before the contract.', Icon: ProposalIcon, label: 'CONTRACTS' },
  { name: 'Payment Reminder Letter',   desc: 'Polite-to-firm reminder letters.',          Icon: LetterIcon,   label: 'CONTRACTS' },
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

export default function NDAGeneratorTool() {
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
