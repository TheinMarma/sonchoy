'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  PercentIcon, VatIcon, PayrollIcon, EmiIcon, AmortIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, REGIMES, INCOME_TYPES,
  findCurrency, findRegime, findIncomeType,
  computeEstimate, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/incomeTaxEstimator/compute'
import { generateIncomeTaxEstimatorPdf } from '@/lib/incomeTaxEstimator/generatePdf'
import { generateIncomeTaxEstimatorXlsx } from '@/lib/incomeTaxEstimator/generateXlsx'

/* ---------- Local helpers ---------- */

const Eyebrow = ({ children, className = '' }) => (
  <p className={`m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300 ${className}`}>{children}</p>
)
const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950 ${className}`}>{children}</h2>
)

/* ---------- Modal ---------- */

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
    <div role="dialog" aria-modal="true" aria-label="Live Income Tax Estimator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[580px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['5',       'Preset regimes'],
  ['Per-slab', 'Bracket breakdown'],
  ['Effective', 'vs marginal rate'],
  ['Free',    'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 60%)' }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
        <div className="relative mx-auto max-w-[1240px] px-6 py-20 md:py-28">
          <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-tax">Tax &amp; Banking</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Income Tax Estimator PDF</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Annual estimate
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Your tax bill{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — before
            </em>
            <br />
            HMRC, IRS or{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              the ITR.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Pick a tax regime, drop in your incomes and deductions, and see your full annual liability — bracket by bracket, with effective and marginal rates, monthly take-home, and a year-to-date projection if you&rsquo;ve already paid some.
          </p>
          <div className="mb-12 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="btn btn-cta btn-xl">
              Launch The Tool <ArrowRight size={16} />
            </button>
            <Link href="/#tools" className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-950/15 bg-ink-950/5 px-7 py-[18px] text-[16px] font-medium leading-none text-ink-950 no-underline backdrop-blur-sm transition-colors hover:bg-ink-950/10 capitalize">
              Explore More Tools
            </Link>
          </div>
          <div className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> No signup, ever</span>
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> 100% local · nothing uploaded</span>
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Per-slab tax workings</span>
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Esc to close</span>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {HERO_STATS.map(([num, lab]) => (
              <div key={lab} className="bg-paper p-5">
                <div className="mb-1 font-medium text-[28px] leading-none tracking-[-0.025em] text-ink-950">{num}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">{lab}</div>
              </div>
            ))}
          </div>
        </div>
      </header>
      <LiveDemoModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/* ---------- Form building blocks ---------- */

const labelClass = 'font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500'
const inputClass =
  'w-full min-h-[36px] rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950 ' +
  'placeholder:text-ink-400 outline-none transition-colors ' +
  'focus:border-tax/60 focus:ring-2 focus:ring-tax/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} ${mono ? 'font-mono' : ''}`} />
    </div>
  )
}
function NumberInput({ label, value, onChange, suffix, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input type="number" inputMode="decimal" step="any"
          value={value ?? 0}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={`${inputClass} text-right font-mono ${suffix ? 'pr-12' : ''}`} />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-500">{suffix}</span>
        )}
      </div>
    </div>
  )
}
function TextareaInput({ label, value, onChange, placeholder, rows = 2, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} min-h-[58px] resize-y leading-[1.4]`} />
    </div>
  )
}
function SelectInput({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none cursor-pointer pr-8 bg-[length:14px] bg-no-repeat bg-[right_10px_center]`}
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='none' stroke='%2382827d' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/></svg>\")" }}>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
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
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer accent-tax" />
    </label>
  )
}

/* ---------- IncomeList ---------- */

function IncomeList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), typeId: 'salary', description: '', amount: 0 },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">Income sources</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20">
          <Plus size={9} /> Add source
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
              <input type="text" value={it.description || ''}
                onChange={(e) => update(it.id, { description: e.target.value })}
                placeholder="Description (e.g. Acme Corp salary)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-tax/60" />
              <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-[1fr_120px] gap-1.5">
              <select value={it.typeId}
                onChange={(e) => update(it.id, { typeId: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60">
                {INCOME_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
              <input type="number" step="any" value={it.amount}
                onChange={(e) => update(it.id, { amount: e.target.value })}
                placeholder="Annual amount"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none focus:border-tax/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- DeductionList ---------- */

function DeductionList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), section: '', description: '', amount: 0 },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">Deductions &amp; exemptions</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20">
          <Plus size={9} /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
              <input type="text" value={it.description || ''}
                onChange={(e) => update(it.id, { description: e.target.value })}
                placeholder="Description"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-tax/60" />
              <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-[120px_1fr] gap-1.5">
              <input type="text" value={it.section || ''}
                onChange={(e) => update(it.id, { section: e.target.value })}
                placeholder="Section (e.g. 80C)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
              <input type="number" step="any" value={it.amount}
                onChange={(e) => update(it.id, { amount: e.target.value })}
                placeholder="Amount"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none focus:border-tax/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  estimateTitle: 'Annual Income Tax Estimate — 2025/26',
  reference: 'ITX-2026-0117',
  taxpayerName: 'Marcus Vance',
  taxYear: '2025/26',

  regimeId: 'uk-2025',
  currency: 'GBP',

  incomeSources: [
    { id: 1, typeId: 'salary',     description: 'Acme Corp · Senior Manager',  amount: 95000 },
    { id: 2, typeId: 'investment', description: 'Dividends · ETF portfolio',   amount: 4200  },
    { id: 3, typeId: 'rental',     description: 'Flat in Manchester',          amount: 14400 },
  ],

  deductions: [
    { id: 11, section: 'Pension',    description: 'Workplace pension contributions',     amount: 8550 },
    { id: 12, section: 'Allowable',  description: 'Buy-to-let mortgage interest',         amount: 4200 },
  ],

  surchargeRatePct: 0,
  cessRatePct: 0,
  rebateAmount: 0,

  paidYTD: 12500,
  includeTakeHomeBlock: true,
  includeProjectionBlock: true,

  notes: 'Estimate prepared for cash-flow planning ahead of the January self-assessment payment on account. Final figures subject to confirmation by accountant — dividend allowance and savings allowance not modelled here.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const regime = useMemo(() => findRegime(data.regimeId), [data.regimeId])
  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const est = useMemo(() => computeEstimate(data), [data])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setIncome     = (items) => setData((s) => ({ ...s, incomeSources: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const setDeductions = (items) => setData((s) => ({ ...s, deductions:    items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  // Apply regime preset — auto-switches currency
  const applyRegime = (id) => {
    const r = findRegime(id)
    setData((s) => ({ ...s, regimeId: id, currency: r.currency }))
  }

  const buildPayload = () => ({
    ...data,
    incomeSources: data.incomeSources.map(({ id, ...rest }) => rest),
    deductions:    data.deductions.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateIncomeTaxEstimatorPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateIncomeTaxEstimatorXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <PercentIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Tax estimate · {data.incomeSources.length} sources · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Estimate title" value={data.estimateTitle} onChange={setField('estimateTitle')} placeholder="Annual Income Tax Estimate — YYYY/YY" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference" value={data.reference} onChange={setField('reference')} placeholder="ITX-2026-0001" mono />
          <TextInput label="Tax year"  value={data.taxYear}   onChange={setField('taxYear')} placeholder="2025/26" />
        </div>
        <div className="mt-2">
          <TextInput label="Taxpayer name" value={data.taxpayerName} onChange={setField('taxpayerName')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Regime */}
        <SelectInput
          label="Tax regime / jurisdiction"
          value={data.regimeId}
          onChange={applyRegime}
          options={REGIMES.map((r) => ({ value: r.id, label: r.label }))}
        />
        <p className="m-0 mt-1 text-[10.5px] italic text-ink-500">{regime.notes}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput
            label="Currency"
            value={data.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))}
          />
          <div className="flex items-end">
            <div className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-[11px]">
              <span className="text-ink-500">Personal allowance: </span>
              <span className="font-mono font-semibold text-ink-950">{formatNumber(regime.personalAllowance)}</span>
            </div>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Income */}
        <IncomeList items={data.incomeSources} setItems={setIncome} />

        <div className="my-3.5 h-px bg-line" />

        {/* Deductions */}
        <DeductionList items={data.deductions} setItems={setDeductions} />

        <div className="my-3.5 h-px bg-line" />

        {/* Adjustments */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Surcharge, cess, rebate
        </span>
        <div className="grid grid-cols-3 gap-2">
          <NumberInput label="Surcharge"     value={data.surchargeRatePct} onChange={setField('surchargeRatePct')} suffix="%" />
          <NumberInput label="Cess"          value={data.cessRatePct}      onChange={setField('cessRatePct')}      suffix="%" />
          <NumberInput label="Rebate amount" value={data.rebateAmount}     onChange={setField('rebateAmount')}     suffix={cur.code} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Projection */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Year-to-date paid
        </span>
        <NumberInput label="Tax paid year-to-date" value={data.paidYTD} onChange={setField('paidYTD')} suffix={cur.code} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Optional sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Take-home & monthly view"
            desc="Annual + monthly gross, tax, take-home"
            checked={data.includeTakeHomeBlock} onChange={setField('includeTakeHomeBlock')} />
          <ToggleRow label="Year-to-date projection"
            desc="Remaining tax to pay this year"
            checked={data.includeProjectionBlock} onChange={setField('includeProjectionBlock')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Taxable income</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(est.taxable)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total tax</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(est.netTax)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Effective</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(est.effectiveRatePct)}%</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Marginal</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(est.marginalRatePct)}%</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Take-home / mo</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-tax">{formatNumber(est.monthlyTakeHome)}</p>
          </div>
        </div>

        {/* Slab preview */}
        {est.breakdown.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Slab breakdown ({est.breakdown.length} bands)
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Band</th>
                    <th className="py-1 text-right font-normal">Taxed</th>
                    <th className="py-1 text-right font-normal">Rate</th>
                    <th className="py-1 text-right font-normal">Tax</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {est.breakdown.map((b, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1 text-ink-700 truncate max-w-[120px]">{b.label}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(b.sliceAmount)}</td>
                      <td className="py-1 text-right text-tax">{formatNumber(b.ratePct)}%</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(b.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">Annual take-home</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {formatNumber(est.effectiveRatePct)}% effective
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(est.takeHome, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Assumptions, accountant context…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Estimate PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (4 sheets) <ArrowRight size={10} /></>)}
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">100% local · nothing uploaded</span>
          <a href="https://go.sonchoy.com/pdfFiller" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-crimson-300 no-underline hover:text-crimson-400">
            Need e-signing? <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Preview ---------- */

function EstimateMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">INCOME TAX ESTIMATE</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Annual Income Tax Estimate — 2025/26</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Marcus Vance · UK 2025/26 (England)</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['GROSS',     'GBP 113,600'],
            ['TAXABLE',   'GBP 88,280'],
            ['TOTAL TAX', 'GBP 22,652'],
            ['TAKE-HOME', 'GBP 90,948'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">SLAB-WISE TAX BREAKDOWN</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1.4fr_70px_50px_60px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>BAND</span>
            <span className="text-right">TAXED</span>
            <span className="text-right">RATE</span>
            <span className="text-right">TAX</span>
          </div>
          {[
            ['Basic rate',       '37,700', '20%',  '7,540'],
            ['Higher rate',      '50,580', '40%', '20,232'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1.4fr_70px_50px_60px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span>{r[0]}</span>
              <span className="text-right">{r[1]}</span>
              <span className="text-right text-tax">{r[2]}</span>
              <span className="text-right font-bold">{r[3]}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1.4fr_70px_50px_60px] gap-1 border-t-2 border-tax-bg bg-tax/10 px-1.5 py-1 font-mono text-[8.5px] font-bold text-tax">
            <span>SUBTOTAL TAX</span>
            <span className="text-right"></span>
            <span className="text-right"></span>
            <span className="text-right">22,652</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {[
            ['EFFECTIVE',     '19.94%'],
            ['MARGINAL',      '40%'],
            ['TAX/MO',        'GBP 1,888'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-tax/30 bg-tax/10 px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax-dk">{k}</p>
              <p className="m-0 mt-0.5 text-[9.5px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>
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
            Income in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a slab-by-slab tax estimate out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Pick a regime, drop in your incomes and deductions, and see exactly how each slab of your taxable income gets taxed — plus effective and marginal rates and your monthly take-home.
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Estimator Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  UK 2025/26
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Taxpayer',         'Marcus Vance'],
                  ['Regime',           'UK 2025/26 (England)'],
                  ['Income sources',   '3 (salary, dividends, rental)'],
                  ['Gross income',     'GBP 113,600.00'],
                  ['Deductions',       'GBP 12,750.00 (pension + interest)'],
                  ['Personal allow.',  'GBP 12,570.00 (no taper)'],
                  ['Taxable income',   'GBP 88,280.00'],
                  ['Effective rate',   '19.94%'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Annual take-home</span>
                <span className="font-mono text-[14px] font-semibold text-paper">GBP 90,948.00</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT.PDF</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Accountant-ready
                </span>
              </div>
              <EstimateMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the regime',     'UK 2025/26, US Federal Single 2025, India new regime, India old regime, or fully custom. Slabs and personal allowance pre-fill.'],
  ['02', 'Drop in incomes',     'Salary, business, rental, dividends, capital gains — any combination, each with its own description. The gross adds up automatically.'],
  ['03', 'Export PDF + XLSX',   'PDF: summary cards, income table, deductions table, slab-wise breakdown, rate metrics, take-home view, YTD projection. XLSX: 4 sheets ready for analysis.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              The full picture{' '}
              <em className="font-serif font-normal italic text-crimson-300">— in one page.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Tax calculators usually give you one number. This tool gives you the workings — every slab utilised, every rate applied, effective vs marginal, monthly view, and what&rsquo;s still owed if you&rsquo;ve been paying through the year.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(([num, title, desc]) => (
            <div key={num} className="rounded-xl border border-line bg-surface p-8">
              <div className="mb-4 font-serif text-[56px] font-normal italic leading-none text-crimson-300">{num}</div>
              <h4 className="m-0 mb-2 text-xl font-medium tracking-[-0.015em] text-ink-950">{title}</h4>
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
  { title: 'Five regime presets',         desc: 'UK 2025/26 with PA taper, US 2025 Federal single, India new regime (115BAC), India old regime, or fully custom slabs.' },
  { title: 'Per-slab breakdown',           desc: 'Shows exactly how each slab of taxable income gets taxed — band label, range, sliced amount, rate, and tax. No black-box.' },
  { title: 'Effective vs marginal',        desc: 'Effective rate (tax ÷ gross) and marginal rate (rate on next pound earned) side-by-side. Two metrics every taxpayer should know.' },
  { title: 'Take-home & monthly view',     desc: 'Annual gross, tax, and take-home plus the same numbers divided by 12 — useful for budgeting and payslip-vs-estimate reconciliation.' },
  { title: 'YTD projection',               desc: 'Plug in tax already paid this year — the tool projects how much is still owed, helpful for ensuring you don\'t under-pay (or over-pay).' },
  { title: 'PDF + 4-sheet XLSX',           desc: 'PDF: summary cards, income, deductions, slab table, rate metrics, take-home, projection. XLSX: Summary, Income, Deductions, Slabs.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for honest forecasting</Eyebrow>
          <SectionTitle>
            Numbers that{' '}
            <em className="font-serif font-normal italic text-crimson-300">survive</em> the accountant&rsquo;s desk.
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-tax/20 bg-tax-bg text-tax">
                <Check size={16} />
              </div>
              <h4 className="m-0 mb-2 text-lg font-medium tracking-[-0.015em] text-ink-950">{f.title}</h4>
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
  { q: 'How accurate is this vs my actual tax bill?',                a: 'For straightforward employment income, very accurate — usually within £100–£200 on a £50K+ salary. Where it gets fuzzy: dividend allowance, savings allowance, capital gains rates that differ from income tax, regional variations (Scotland), and benefits in kind. Always sense-check against HMRC / IRS / ITR portal calculators before filing.' },
  { q: 'How is this different from the Tax Calculation Sheet?',     a: 'The Tax Calculation Sheet is a clean working document for an accountant — it presents numbers neutrally. This Estimator is a forward-looking planning tool — it adds take-home, monthly view, effective vs marginal rates, and YTD projection. Different purpose; both useful.' },
  { q: 'What is "effective rate" vs "marginal rate"?',              a: 'Effective rate = total tax ÷ gross income — the average percentage of your income you actually pay in tax. Marginal rate = the rate that applies to your next dollar of income. Marginal is always higher (or equal) than effective in a progressive system. Marginal drives decisions; effective drives perception.' },
  { q: 'What is the UK personal allowance taper?',                   a: 'Above £100,000 of gross income, the £12,570 personal allowance is reduced by £1 for every £2 of income over the threshold. By £125,140 it\'s fully tapered out. This creates a 60% effective marginal rate band between £100K and £125K. The UK preset models this automatically.' },
  { q: 'Can I model India\'s new vs old regime side-by-side?',      a: 'Not in a single PDF, but you can switch regimes mid-session and compare the totals. The new regime has lower rates but disallows most deductions (80C, HRA, etc.); the old regime is the opposite. The Estimator makes either trivial to model.' },
  { q: 'Output formats?',                                            a: 'PDF (multi-page if needed, with summary cards, income/deductions tables, slab breakdown, rate metrics, take-home view, YTD projection block, regime notes footer) and XLSX (4 sheets: Summary, Income, Deductions, Slabs). Every numeric column is a real number, ready for further work.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">tax estimation.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {FAQS.map(({ q, a }, idx) => (
            <div key={q} className="bg-surface p-8">
              <h4 className="m-0 mb-3 flex items-start gap-3 text-lg font-medium tracking-[-0.015em] text-ink-950">
                <span className="mt-1 shrink-0 font-mono text-[11px] tracking-[0.1em] text-crimson-300">{String(idx + 1).padStart(2, '0')}</span>
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
  { name: 'Tax Calculation Sheet', desc: 'Per-bracket workings for accountant hand-off.',  Icon: PercentIcon, label: 'TAX', path: '/tools/tax-calculation-sheet' },
  { name: 'GST Calculation Sheet', desc: 'GST workings with HSN/SAC and reverse charge.',  Icon: VatIcon,     label: 'TAX', path: '/tools/gst-calculation-sheet' },
  { name: 'VAT Calculator',        desc: 'Add or remove VAT; per-rate breakdown.',         Icon: VatIcon,     label: 'TAX', path: '/tools/vat-calculator-pdf-export' },
  { name: 'Payroll Tax Report',    desc: 'Per-employee tax + employer contributions.',     Icon: PayrollIcon, label: 'TAX' },
]

function RelatedTools() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="mb-3">05 — Related tools</Eyebrow>
            <SectionTitle>Often used <em className="font-serif font-normal italic text-crimson-300">together.</em></SectionTitle>
          </div>
          <Link href="/#tools" className="inline-flex items-center gap-2 font-medium text-[14px] text-crimson-300 underline decoration-crimson-500/40 underline-offset-4 hover:decoration-crimson-300">
            Browse all 91 tools <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((t) => {
            const inner = (
              <>
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-tax">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-tax-bg text-tax">
                  <t.Icon />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-md font-medium tracking-[-0.01em] text-ink-950">{t.name}</h4>
                  <p className="m-0 text-xs leading-[1.5] text-ink-500">{t.desc}</p>
                </div>
              </>
            )
            const cls = 'group relative flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md'
            return t.path
              ? (<Link key={t.name} href={t.path} className={cls}>{inner}</Link>)
              : (<a key={t.name} href="#" className={cls}>{inner}</a>)
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function IncomeTaxEstimatorTool() {
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
