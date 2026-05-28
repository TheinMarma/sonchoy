'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  PercentIcon, VatIcon, PayrollIcon, ReconcileIcon, EmiIcon, ExportIcon, BankStatementIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, TAX_REGIMES,
  computeTax, findRegime, findCurrency,
  formatNumber, formatMoney, todayISO,
} from '@/lib/taxCalc/compute'
import { generateTaxCalcPdf } from '@/lib/taxCalc/generatePdf'
import { generateTaxCalcXlsx } from '@/lib/taxCalc/generateXlsx'

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
      aria-label="Live Tax Calculation Sheet"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[540px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['5',     'Tax regimes built in'],
  ['Slab',  'Progressive computation'],
  ['PDF+',  'XLSX working sheet'],
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
          style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 60%)' }}
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
            <span className="text-tax">Tax &amp; Banking</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Tax Calculation Sheet</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax · Slab-based computation
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Income tax,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              slab by slab.
            </em>
            <br />
            Filing-ready{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              working sheet.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Pick a regime (India new/old, US Federal, UK, or custom slabs), type income and deductions, and we compute taxable income, slab-wise tax, cess, surcharge — and surface the effective &amp; marginal rates.
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
              <Check className="text-crimson-400" /> Slab-wise breakdown
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
  'focus:border-tax/60 focus:ring-2 focus:ring-tax/20 hover:border-line-strong'

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
          className={`${inputClass} text-right font-mono ${suffix ? 'pr-8' : ''}`}
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

/* ---------- Line-item group component ---------- */

function LineGroup({ title, accent = false, lines, setLines, total, kind = 'income' }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = () =>
    setLines([
      ...lines,
      { id: Date.now() + Math.random(), description: '', amount: 0, ...(kind === 'deduction' ? { section: '' } : {}) },
    ])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${accent ? 'text-tax' : 'text-ink-500'}`}>
          {title}
        </span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20"
        >
          <Plus size={9} />
          Add row
        </button>
      </div>

      <div className="space-y-1.5">
        {lines.length === 0 && (
          <div className="rounded-md border border-dashed border-line-strong bg-canvas/40 px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            No lines — add one
          </div>
        )}
        {lines.map((ln) => (
          <div
            key={ln.id}
            className={`grid ${kind === 'deduction' ? 'grid-cols-[1fr_72px_96px_22px]' : 'grid-cols-[1fr_96px_22px]'} items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1.5`}
          >
            <input
              type="text"
              value={ln.description}
              onChange={(e) => update(ln.id, { description: e.target.value })}
              placeholder={kind === 'income' ? 'Salary / business / capital gains' : 'Description'}
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 hover:border-line focus:border-tax/60 focus:bg-canvas"
            />
            {kind === 'deduction' && (
              <input
                type="text"
                value={ln.section || ''}
                onChange={(e) => update(ln.id, { section: e.target.value })}
                placeholder="80C"
                className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none placeholder:text-ink-400 hover:border-line focus:border-tax/60 focus:bg-canvas"
              />
            )}
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={ln.amount}
              onChange={(e) => update(ln.id, { amount: e.target.value })}
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none hover:border-line focus:border-tax/60 focus:bg-canvas"
            />
            <button
              type="button"
              onClick={() => remove(ln.id)}
              aria-label="Remove row"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {total !== undefined && (
        <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Subtotal</span>
          <span className="font-mono text-[12px] font-semibold text-ink-950">{formatNumber(total)}</span>
        </div>
      )}
    </div>
  )
}

/* ---------- Custom-slab editor ---------- */

function SlabEditor({ slabs, setSlabs }) {
  const update = (i, patch) => setSlabs(slabs.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const remove = (i) => setSlabs(slabs.filter((_, idx) => idx !== i))
  const addOne = () => {
    const last = slabs[slabs.length - 1]
    // Insert a slab before the Infinity slab if present
    if (last && last.to === Infinity) {
      const beforeLast = slabs[slabs.length - 2]
      const newTo = beforeLast ? Math.round(beforeLast.to * 1.5) : 100000
      setSlabs([
        ...slabs.slice(0, -1),
        { to: newTo, rate: 0.25 },
        last,
      ])
    } else {
      setSlabs([...slabs, { to: Infinity, rate: 0.30 }])
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">
          Custom slabs · {slabs.length}
        </span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20"
        >
          <Plus size={9} />
          Add band
        </button>
      </div>
      <div className="space-y-1.5">
        {slabs.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-[120px_1fr_72px_22px] items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1.5"
          >
            <span className="font-mono text-[10px] text-ink-500">
              {i === 0 ? '0' : formatNumber(slabs[i - 1].to)} –
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={s.to === Infinity ? '' : s.to}
              placeholder="∞ (last band)"
              onChange={(e) => update(i, { to: e.target.value === '' ? Infinity : Number(e.target.value) })}
              className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60"
            />
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={Math.round(s.rate * 10000) / 100}
                onChange={(e) => update(i, { rate: (Number(e.target.value) || 0) / 100 })}
                className="min-h-[28px] w-full rounded-md border border-line bg-canvas px-1.5 py-1 pr-5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-500">%</span>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={slabs.length <= 1}
              aria-label="Remove slab"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <p className="m-0 mt-1.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-500">
        Leave the last band's "to" blank for ∞ (highest bracket).
      </p>
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  taxpayerName: 'Alex Hartwell',
  taxId: 'ABCDE1234F',
  periodLabel: 'FY 2025-26',
  currency: 'INR',
  regimeId: 'in-new',

  income: [
    { id: 1, description: 'Salary (gross)',         amount: 1800000 },
    { id: 2, description: 'Freelance consulting',   amount: 240000 },
    { id: 3, description: 'Interest income',        amount: 28000 },
  ],
  deductions: [
    { id: 4, description: 'EPF / VPF',              section: '80C',  amount: 150000 },
    { id: 5, description: 'Health insurance',       section: '80D',  amount: 25000 },
    { id: 6, description: 'NPS (Tier 1)',           section: '80CCD(1B)', amount: 50000 },
  ],

  // Standard deduction is auto-set by regime; null means use regime default
  standardDeduction: null,
  customSlabs: null,

  // Cess/surcharge: leave null to fall back to regime
  cessRate: null,       // %
  surchargeRate: 0,     // %

  notes: 'Working sheet — verify with current Income Tax notifications before filing.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const t = useMemo(() => computeTax(data), [data])
  const regime = useMemo(() => findRegime(data.regimeId), [data.regimeId])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setLines = (k) => (lines) =>
    setData((s) => ({ ...s, [k]: lines.map((l) => ({ ...l, id: l.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  // When regime changes, swap defaults
  const onRegimeChange = (id) => {
    const r = findRegime(id)
    setData((s) => ({
      ...s,
      regimeId: id,
      currency: r.defaultCurrency,
      standardDeduction: null,
      cessRate: null,
      customSlabs: id === 'custom' ? (s.customSlabs || r.slabs) : null,
    }))
  }

  // Slabs for display: from regime, or custom
  const activeSlabs = data.regimeId === 'custom'
    ? (data.customSlabs || regime.slabs)
    : regime.slabs

  const buildPayload = () => ({
    ...data,
    income:     data.income.map(({ id, ...r }) => ({ ...r, amount: Number(r.amount) || 0 })),
    deductions: data.deductions.map(({ id, ...r }) => ({ ...r, amount: Number(r.amount) || 0 })),
    customSlabs: data.regimeId === 'custom' ? activeSlabs : null,
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateTaxCalcPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateTaxCalcXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <PercentIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Tax Calc · {regime.label.split(' · ')[0]}
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

        {/* Taxpayer + regime */}
        <TextInput
          label="Taxpayer name"
          value={data.taxpayerName}
          onChange={setField('taxpayerName')}
          placeholder="Your name"
        />
        <div className="mt-2 grid grid-cols-[1fr_92px] gap-2">
          <TextInput
            label={regime.taxIdLabel}
            value={data.taxId}
            onChange={setField('taxId')}
            placeholder={regime.taxIdPlaceholder}
            mono
          />
          <SelectInput
            label="Currency"
            value={data.currency || regime.defaultCurrency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>
        <div className="mt-2">
          <TextInput
            label="Period label (optional)"
            value={data.periodLabel}
            onChange={setField('periodLabel')}
            placeholder="FY 2025-26"
          />
        </div>
        <div className="mt-2">
          <SelectInput
            label="Tax regime"
            value={data.regimeId}
            onChange={onRegimeChange}
            options={TAX_REGIMES.map((r) => ({ value: r.id, label: r.label }))}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Custom slabs */}
        {data.regimeId === 'custom' && (
          <>
            <SlabEditor
              slabs={activeSlabs}
              setSlabs={(slabs) => setData((s) => ({ ...s, customSlabs: slabs }))}
            />
            <div className="my-3.5 h-px bg-line" />
          </>
        )}

        {/* Income */}
        <LineGroup
          title="Income"
          accent
          lines={data.income}
          setLines={setLines('income')}
          total={t.totalIncome}
          kind="income"
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Standard deduction */}
        <div className="mb-3 flex items-center justify-between rounded-md border border-line bg-paper px-3 py-2">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">
              Standard deduction
            </span>
            <span className="block text-[11px] text-ink-500">
              Default {formatNumber(regime.standardDeduction)} for this regime
            </span>
          </div>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={data.standardDeduction != null ? data.standardDeduction : regime.standardDeduction}
            onChange={(e) => setField('standardDeduction')(e.target.value === '' ? 0 : Number(e.target.value))}
            className="min-h-[28px] w-[120px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] font-semibold text-ink-950 outline-none focus:border-tax/60"
          />
        </div>

        {/* Additional deductions */}
        <LineGroup
          title="Additional deductions"
          lines={data.deductions}
          setLines={setLines('deductions')}
          total={t.additionalDeductions}
          kind="deduction"
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Cess + Surcharge */}
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Cess rate"
            value={data.cessRate != null ? data.cessRate : (regime.cessRate * 100)}
            onChange={setField('cessRate')}
            suffix="%"
          />
          <NumberInput
            label="Surcharge"
            value={data.surchargeRate || 0}
            onChange={setField('surchargeRate')}
            suffix="%"
          />
        </div>

        {/* Computed strip */}
        <div className="mt-3 space-y-2">
          {[
            ['Taxable income',           formatNumber(t.taxableIncome)],
            ['Tax before cess',           formatNumber(t.tax)],
            ['Cess',                     formatNumber(t.cess)],
            ...(t.surcharge > 0 ? [['Surcharge', formatNumber(t.surcharge)]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-md border border-line bg-paper px-3 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">{k}</span>
              <span className="font-mono text-[12px] text-ink-900">{v}</span>
            </div>
          ))}
        </div>

        {/* Slab breakdown mini-table */}
        {t.breakdown.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Slab breakdown
            </p>
            <div className="space-y-1">
              {t.breakdown
                .filter((b) => b.taxableInBand > 0)
                .map((b, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-ink-700">
                      {b.to === Infinity ? `> ${formatNumber(b.from)}` : `${formatNumber(b.from)}–${formatNumber(b.to)}`}
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-[10px] text-tax">
                        {(b.rate * 100).toFixed(b.rate * 100 === Math.floor(b.rate * 100) ? 0 : 2)}%
                      </span>
                      <span className="font-mono text-ink-900">{formatNumber(b.tax)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Rates strip */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ['Effective', `${t.effectiveRate}%`],
            ['Marginal',  `${t.marginalRate}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-line bg-paper px-3 py-2">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k} rate</p>
              <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-tax">{v}</p>
            </div>
          ))}
        </div>

        {/* Total tax (big) */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">
              Total tax liability
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              Net: {formatNumber(t.netIncome)}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(t.totalLiability, data.currency || regime.defaultCurrency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Assumptions, rebates claimed, filing notes…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Working Sheet PDF'}
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={handleXlsx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'xlsx' ? '…' : (<>Export XLSX <ArrowRight size={10} /></>)}
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
            Need filing help?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function TaxMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Tax Calculation Sheet
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">
          India · New regime · INR
        </span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Alex Hartwell</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">PAN: ABCDE1234F · FY 2025-26</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
          <BrandMark size={14} className="text-paper" />
        </span>
      </div>

      {/* Stats strip */}
      <div className="mb-5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Gross',     '20,68,000'],
          ['Taxable',   '19,93,000'],
          ['Tax',       '2,16,712', 'text-crimson-300'],
          ['Eff. %',    '10.5%',    'text-tax'],
        ].map(([k, v, tone]) => (
          <div key={k} className="bg-canvas px-2 py-3">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className={`m-0 mt-1 font-mono text-[12px] font-semibold ${tone || 'text-ink-950'}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Slab table */}
      <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Tax by slab</p>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-ink-950 text-paper">
            <th className="py-1.5 px-2 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-tax">Slab</th>
            <th className="py-1.5 px-2 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Rate</th>
            <th className="py-1.5 px-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Taxable</th>
            <th className="py-1.5 px-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Tax</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['0 – 4,00,000',         '0%',  '4,00,000',  '0'],
            ['4,00,000 – 8,00,000',  '5%',  '4,00,000',  '20,000'],
            ['8,00,000 – 12,00,000', '10%', '4,00,000',  '40,000'],
            ['12,00,000 – 16,00,000','15%', '4,00,000',  '60,000'],
            ['16,00,000 – 20,00,000','20%', '3,93,000',  '78,600'],
          ].map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-canvas' : ''}>
              <td className="py-1 px-2 font-mono text-ink-700">{r[0]}</td>
              <td className="py-1 px-2 font-mono text-tax">{r[1]}</td>
              <td className="py-1 px-2 text-right font-mono text-ink-700">{r[2]}</td>
              <td className="py-1 px-2 text-right font-mono font-semibold text-ink-900">{r[3]}</td>
            </tr>
          ))}
          <tr className="border-y border-ink-700 bg-paper">
            <td className="py-1.5 px-2 font-semibold text-ink-950" colSpan={3}>Tax before cess</td>
            <td className="py-1.5 px-2 text-right font-mono font-semibold text-ink-950">1,98,600</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-ink-700" colSpan={3}>Health &amp; education cess (4%)</td>
            <td className="py-1 px-2 text-right font-mono text-ink-700">7,944</td>
          </tr>
        </tbody>
      </table>

      {/* Total */}
      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-tax">Total tax liability</span>
          <span className="font-mono text-[18px] font-semibold text-paper">INR 2,06,544</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          ['Effective', '10.0%'],
          ['Marginal',  '20%'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md border border-line bg-canvas px-3 py-2 text-center">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k} rate</p>
            <p className="m-0 mt-0.5 font-mono text-[14px] font-semibold text-tax">{v}</p>
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
            From income &amp; deductions{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a slab-by-slab tax sheet.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Every band of the chosen regime, the tax computed in each band, cess and surcharge, plus the effective and marginal rates — all on one page.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <PercentIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Tax Calc Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  India new · INR
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Regime',           'India · New regime (FY 2025-26)'],
                  ['Gross income',     '20,68,000 across 3 sources'],
                  ['Std. deduction',   '75,000 (regime default)'],
                  ['Add. deductions',  '0 (new regime · few allowed)'],
                  ['Taxable income',   '19,93,000'],
                  ['Cess',             '4% on tax'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ['Effective', '10.0%'],
                  ['Marginal',  '20%'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-md border border-line bg-paper px-3 py-2 text-center">
                    <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
                    <p className="m-0 mt-0.5 font-mono text-[14px] font-semibold text-tax">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Total tax</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 2,06,544</span>
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
                  Filing-ready
                </span>
              </div>
              <TaxMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the regime',     'India new/old, US Federal, UK, or build your own custom slabs. Standard deduction, cess, and tax-ID label adapt automatically.'],
  ['02', 'Type income + deductions', 'Each income source as a line; deductions with optional section tags (80C, 80D…). Standard deduction is pre-filled per regime.'],
  ['03', 'Download the sheet',   'PDF showing every slab\'s contribution to tax, cess, surcharge, effective and marginal rates — plus a matching .xlsx for your records.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three steps to a{' '}
              <em className="font-serif font-normal italic text-crimson-300">working tax sheet.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Progressive slabs are computed band-by-band, so the PDF shows exactly which slab contributed what. Switch regimes mid-flow to compare old vs new in one sitting.
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
  { title: '5 regimes built in',         desc: 'India new + old (FY 2025-26), US Federal (2025), UK (2025-26), plus custom slabs for any country.' },
  { title: 'Slab-by-slab breakdown',     desc: 'Each band shown with its rate, taxable amount in that band, and the tax contribution.' },
  { title: 'Cess & surcharge',           desc: 'India 4% health & education cess auto-applied. Surcharge editable for high-income brackets.' },
  { title: 'Effective + marginal rates', desc: 'Effective rate = total tax ÷ gross income. Marginal rate = the band you\'re currently in.' },
  { title: 'Custom slab editor',         desc: 'Build your own slabs — band thresholds and rates editable. Useful for hypotheticals and policy modelling.' },
  { title: 'Section-tagged deductions',  desc: 'Each deduction line carries a section tag (80C, 80D, NPS) — printed alongside the description in the PDF.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for tax workings</Eyebrow>
          <SectionTitle>
            Every number a{' '}
            <em className="font-serif font-normal italic text-crimson-300">CA</em> wants to see.
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-tax/20 bg-tax-bg text-tax">
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
  { q: 'Is this filing-ready?',                              a: 'It produces a clean working sheet — the format a CA or tax preparer would normally type up by hand. Use it to prepare for filing, not to file. Verify against the latest official notifications before submitting any return.' },
  { q: 'How are progressive slabs computed?',                a: 'Income is sliced across bands. The tax for each band = (income within that band) × (band rate). The total is the sum across all bands. The PDF shows each band as a separate row so the math is auditable.' },
  { q: 'What\'s the difference between effective and marginal?', a: 'Effective rate = total tax ÷ gross income (your actual tax burden as a %). Marginal rate = the rate that applies to the next rupee/dollar of income (the top slab you\'re in). Marginal is usually higher than effective.' },
  { q: 'Old vs new regime — how do I compare?',              a: 'Generate the sheet under each regime in turn. Old regime allows 80C, 80D, HRA and home-loan deductions but has higher slab rates; new regime has lower rates but very few deductions. The "cheaper" regime depends on your deduction profile.' },
  { q: 'Are surcharge and cess included?',                    a: 'India: 4% health &amp; education cess applied on tax automatically. Surcharge is user-editable (typical 10%, 15%, 25%, 37% depending on income) — type the rate per your taxable income bracket.' },
  { q: 'Output formats?',                                     a: 'PDF (working sheet with slab breakdown, key metrics, regime note) and .xlsx (every line item plus the slab table — easy to drop into a CA\'s working file).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">tax computation.</em>
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
  { name: 'GST Calculation Sheet',    desc: 'GST workings with HSN/SAC codes.',                Icon: VatIcon,           label: 'TAX' },
  { name: 'VAT Calculator',           desc: 'Inline VAT/sales-tax for invoices.',              Icon: VatIcon,           label: 'TAX' },
  { name: 'Payroll Tax Report',       desc: 'Employer withholding summaries.',                 Icon: PayrollIcon,       label: 'TAX' },
  { name: 'Bank Reconciliation Sheet', desc: 'Book vs. statement match.',                      Icon: ReconcileIcon,     label: 'TAX' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-tax">
                  {t.label}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-tax-bg text-tax">
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

export default function TaxCalculationSheetTool() {
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
