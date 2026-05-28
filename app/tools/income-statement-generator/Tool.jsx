'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  ReportIcon, PnlIcon, CashFlowIcon, BalanceIcon, BudgetIcon, ForecastIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, OPEX_CATEGORIES,
  computeIncomeStatement, findCurrency,
  formatNumber, formatMoney,
} from '@/lib/incomeStatement/compute'
import { generateIncomeStatementPdf } from '@/lib/incomeStatement/generatePdf'
import { generateIncomeStatementXlsx } from '@/lib/incomeStatement/generateXlsx'

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

/* ---------- 1) Tool hero (homepage style — popup-launched) ---------- */

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
      aria-label="Live Income Statement Generator"
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
  ['2',      'Periods side-by-side'],
  ['Δ %',    'Variance on every subtotal'],
  ['EPS',    'Basic + diluted'],
  ['Free',   'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="relative overflow-hidden">
        {/* Glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 60%)' }}
        />
        {/* Grid pattern */}
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
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-accounting">Accounting</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Income Statement Generator</span>
          </nav>

          {/* Eyebrow */}
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(99,102,241,0.25)]" />
            Accounting · Comparative reporting
          </span>

          {/* H1 */}
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Income statements with{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              prior-period
            </em>
            <br />
            comparatives,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              live.
            </em>
          </h1>

          {/* Description */}
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Type current and prior amounts side-by-side; we compute three margin tiers, Δ% variances on every subtotal, and EPS basic + diluted — ready for the 10-Q, investor deck, or quarterly board pack.
          </p>

          {/* CTAs */}
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

          {/* Trust signals */}
          <div className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> No signup, ever
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> 100% local · nothing uploaded
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> 10-Q / 10-K formatting
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> Esc to close
            </span>
          </div>

          {/* Stats */}
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

/* ---------- Editable form input building blocks ---------- */

const labelClass = 'font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500'
const inputClass =
  'w-full min-h-[36px] rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950 ' +
  'placeholder:text-ink-400 outline-none transition-colors ' +
  'focus:border-accounting/60 focus:ring-2 focus:ring-accounting/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  )
}

function NumberInput({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        value={value ?? 0}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={`${inputClass} text-right font-mono`}
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

/* ---------- Two-period line group ---------- */

function ComparativeLineGroup({ title, accent = false, lines, setLines, totals, showCategory = false }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = () =>
    setLines([...lines, { id: Date.now() + Math.random(), description: '', current: 0, prior: 0, ...(showCategory ? { category: OPEX_CATEGORIES[0] } : {}) }])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${accent ? 'text-accounting' : 'text-ink-500'}`}>
          {title}
        </span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20"
        >
          <Plus size={9} />
          Add row
        </button>
      </div>

      {/* Column header */}
      <div className={`grid ${showCategory ? 'grid-cols-[1fr_104px_82px_82px_22px]' : 'grid-cols-[1fr_82px_82px_22px]'} gap-x-1.5 rounded-t-md border border-line bg-canvas px-2 py-1.5`}>
        <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Description</span>
        {showCategory && <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Category</span>}
        <span className="text-right font-mono text-[8.5px] uppercase tracking-[0.08em] text-accounting">Current</span>
        <span className="text-right font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Prior</span>
        <span></span>
      </div>

      <div className="divide-y divide-line rounded-b-md border-x border-b border-line">
        {lines.length === 0 && (
          <div className="bg-paper px-3 py-3 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            No lines yet — add one
          </div>
        )}
        {lines.map((ln) => (
          <div
            key={ln.id}
            className={`grid ${showCategory ? 'grid-cols-[1fr_104px_82px_82px_22px]' : 'grid-cols-[1fr_82px_82px_22px]'} items-center gap-x-1.5 bg-paper px-2 py-1.5`}
          >
            <input
              type="text"
              value={ln.description}
              onChange={(e) => update(ln.id, { description: e.target.value })}
              placeholder="Description"
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 hover:border-line focus:border-accounting/60 focus:bg-canvas"
            />
            {showCategory && (
              <select
                value={ln.category || OPEX_CATEGORIES[0]}
                onChange={(e) => update(ln.id, { category: e.target.value })}
                className="min-h-[28px] cursor-pointer rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[11px] text-ink-700 outline-none hover:border-line focus:border-accounting/60 focus:bg-canvas"
              >
                {OPEX_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={ln.current}
              onChange={(e) => update(ln.id, { current: e.target.value })}
              placeholder="0"
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none hover:border-line focus:border-accounting/60 focus:bg-canvas"
            />
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={ln.prior}
              onChange={(e) => update(ln.id, { prior: e.target.value })}
              placeholder="0"
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right font-mono text-[12px] text-ink-700 outline-none hover:border-line focus:border-accounting/60 focus:bg-canvas"
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

      {totals && (
        <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Subtotal</span>
          <div className="flex items-center gap-3 font-mono text-[12px]">
            <span className="font-semibold text-accounting">{formatNumber(totals.current)}</span>
            <span className="text-ink-500">{formatNumber(totals.prior)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  companyName: 'Sonchoy Studio Ltd.',
  currentPeriodLabel: 'Q2 2026',
  currentPeriodStart: '2026-04-01',
  currentPeriodEnd:   '2026-06-30',
  priorPeriodLabel: 'Q2 2025',
  priorPeriodStart: '2025-04-01',
  priorPeriodEnd:   '2025-06-30',
  currency: 'USD',

  revenue: [
    { id: 1, description: 'Product sales',    current: 184000, prior: 156000 },
    { id: 2, description: 'Service revenue',  current: 56000,  prior: 42000 },
    { id: 3, description: 'Licensing',        current: 12000,  prior: 8500 },
  ],
  costOfRevenue: [
    { id: 4, description: 'Materials & components',  current: 42000, prior: 38000 },
    { id: 5, description: 'Manufacturing & freight', current: 18000, prior: 17500 },
  ],
  operatingExpenses: [
    { id: 6,  description: 'Engineering salaries',         category: 'Salaries & wages',          current: 64000, prior: 52000 },
    { id: 7,  description: 'Sales & marketing salaries',   category: 'Salaries & wages',          current: 28000, prior: 22000 },
    { id: 8,  description: 'London office rent',           category: 'Rent & utilities',          current: 9600,  prior: 8800 },
    { id: 9,  description: 'Brand & digital marketing',    category: 'Marketing & advertising',   current: 14500, prior: 11200 },
    { id: 10, description: 'SaaS stack',                   category: 'Software & subscriptions',  current: 6200,  prior: 4900 },
    { id: 11, description: 'Legal & accounting',           category: 'Professional fees',         current: 4800,  prior: 4200 },
  ],
  otherIncome: [
    { id: 12, description: 'Interest income', current: 720, prior: 540 },
  ],
  otherExpenses: [
    { id: 13, description: 'Interest expense', current: 1240, prior: 980 },
  ],

  currentTax: 14400,
  priorTax: 9800,

  currentSharesBasic:   100000,
  currentSharesDiluted: 105000,
  priorSharesBasic:     98000,
  priorSharesDiluted:   102000,

  notes: 'Unaudited. Prior-period figures restated to conform with current presentation.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const t = useMemo(() => computeIncomeStatement(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setLines = (k) => (lines) =>
    setData((s) => ({ ...s, [k]: lines.map((l) => ({ ...l, id: l.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => {
    const cleanLines = (arr, keepCategory = false) =>
      arr.map(({ id, ...rest }) => ({
        ...rest,
        current: Number(rest.current) || 0,
        prior: Number(rest.prior) || 0,
        ...(keepCategory ? { category: rest.category } : {}),
      }))
    return {
      ...data,
      revenue:           cleanLines(data.revenue),
      costOfRevenue:     cleanLines(data.costOfRevenue),
      operatingExpenses: cleanLines(data.operatingExpenses, true),
      otherIncome:       cleanLines(data.otherIncome),
      otherExpenses:     cleanLines(data.otherExpenses),
    }
  }

  const handlePdf  = async () => { try { setBusy('pdf');  generateIncomeStatementPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateIncomeStatementXlsx(buildPayload()) } finally { setBusy(null) } }

  // Helper: variance % for the UI display
  const vp = (c, p) => (p ? ((c - p) / Math.abs(p)) * 100 : 0)

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <ReportIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Income Statement
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

        {/* Company + currency */}
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <TextInput label="Company name" value={data.companyName} onChange={setField('companyName')} placeholder="Your Company Ltd." />
          <SelectInput
            label="Currency"
            value={data.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>

        {/* Periods — current (accent) + prior */}
        <div className="mt-3 rounded-lg border border-accounting/20 bg-accounting-bg/40 p-3">
          <span className="mb-2 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">
            Current period
          </span>
          <div className="space-y-2">
            <TextInput label="Period label" value={data.currentPeriodLabel} onChange={setField('currentPeriodLabel')} placeholder="Q2 2026" />
            <div className="grid grid-cols-2 gap-2">
              <DateInput label="Start" value={data.currentPeriodStart} onChange={setField('currentPeriodStart')} />
              <DateInput label="End"   value={data.currentPeriodEnd}   onChange={setField('currentPeriodEnd')} />
            </div>
          </div>
        </div>
        <div className="mt-2 rounded-lg border border-line bg-paper/40 p-3">
          <span className="mb-2 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500">
            Prior period (comparative)
          </span>
          <div className="space-y-2">
            <TextInput label="Period label" value={data.priorPeriodLabel} onChange={setField('priorPeriodLabel')} placeholder="Q2 2025" />
            <div className="grid grid-cols-2 gap-2">
              <DateInput label="Start" value={data.priorPeriodStart} onChange={setField('priorPeriodStart')} />
              <DateInput label="End"   value={data.priorPeriodEnd}   onChange={setField('priorPeriodEnd')} />
            </div>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Revenue */}
        <ComparativeLineGroup
          title="Revenue"
          accent
          lines={data.revenue}
          setLines={setLines('revenue')}
          totals={{ current: t.current.revenue, prior: t.prior.revenue }}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* COGS */}
        <ComparativeLineGroup
          title="Cost of revenue"
          lines={data.costOfRevenue}
          setLines={setLines('costOfRevenue')}
          totals={{ current: t.current.cogs, prior: t.prior.cogs }}
        />

        {/* Gross profit teaser */}
        <div className="mt-3 rounded-lg border border-accounting/25 bg-accounting-bg/60 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">Gross profit</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[13px] font-semibold text-accounting">{formatNumber(t.current.grossProfit)}</span>
              <span className="font-mono text-[10px] text-ink-500">vs {formatNumber(t.prior.grossProfit)}</span>
              <span className={`font-mono text-[10px] ${vp(t.current.grossProfit, t.prior.grossProfit) >= 0 ? 'text-success' : 'text-crimson-300'}`}>
                {vp(t.current.grossProfit, t.prior.grossProfit) >= 0 ? '+' : ''}{vp(t.current.grossProfit, t.prior.grossProfit).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* OPEX */}
        <ComparativeLineGroup
          title="Operating expenses"
          lines={data.operatingExpenses}
          setLines={setLines('operatingExpenses')}
          totals={{ current: t.current.opex, prior: t.prior.opex }}
          showCategory
        />

        {/* Operating income */}
        <div className="mt-3 rounded-lg border border-accounting/25 bg-accounting-bg/60 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">Operating income</span>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-[13px] font-semibold ${t.current.operatingIncome >= 0 ? 'text-accounting' : 'text-crimson-300'}`}>
                {formatNumber(t.current.operatingIncome)}
              </span>
              <span className="font-mono text-[10px] text-ink-500">vs {formatNumber(t.prior.operatingIncome)}</span>
              <span className={`font-mono text-[10px] ${vp(t.current.operatingIncome, t.prior.operatingIncome) >= 0 ? 'text-success' : 'text-crimson-300'}`}>
                {vp(t.current.operatingIncome, t.prior.operatingIncome) >= 0 ? '+' : ''}{vp(t.current.operatingIncome, t.prior.operatingIncome).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Other income / expenses */}
        <ComparativeLineGroup
          title="Other income"
          lines={data.otherIncome}
          setLines={setLines('otherIncome')}
        />
        <div className="h-3" />
        <ComparativeLineGroup
          title="Other expenses"
          lines={data.otherExpenses}
          setLines={setLines('otherExpenses')}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Tax */}
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label={`Tax — ${data.currentPeriodLabel || 'current'}`}
            value={data.currentTax}
            onChange={setField('currentTax')}
          />
          <NumberInput
            label={`Tax — ${data.priorPeriodLabel || 'prior'}`}
            value={data.priorTax}
            onChange={setField('priorTax')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Shares for EPS */}
        <span className="mb-2 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">
          Weighted average shares (for EPS)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Basic — current"   value={data.currentSharesBasic}   onChange={setField('currentSharesBasic')} />
          <NumberInput label="Basic — prior"     value={data.priorSharesBasic}     onChange={setField('priorSharesBasic')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <NumberInput label="Diluted — current" value={data.currentSharesDiluted} onChange={setField('currentSharesDiluted')} />
          <NumberInput label="Diluted — prior"   value={data.priorSharesDiluted}   onChange={setField('priorSharesDiluted')} />
        </div>

        {/* Net income (big) */}
        <div className="mt-3 rounded-lg border border-accounting/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">
              Net income
            </span>
            <span className={`font-mono text-[10px] uppercase tracking-[0.08em] ${vp(t.current.netIncome, t.prior.netIncome) >= 0 ? 'text-success' : 'text-crimson-300'}`}>
              {vp(t.current.netIncome, t.prior.netIncome) >= 0 ? '+' : ''}{vp(t.current.netIncome, t.prior.netIncome).toFixed(1)}% YoY
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              vs {formatNumber(t.prior.netIncome)}
            </span>
            <span className="text-right font-mono text-[18px] font-semibold text-paper">
              {formatMoney(t.current.netIncome, data.currency)}
            </span>
          </div>
        </div>

        {/* EPS strip */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-line bg-paper px-3 py-2">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">EPS Basic</p>
            <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-accounting">
              {(t.current.epsBasic || 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-md border border-line bg-paper px-3 py-2">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">EPS Diluted</p>
            <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-accounting">
              {(t.current.epsDiluted || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Audit status, restatements, accounting policies…"
            rows={2}
          />
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Income Statement PDF'}
          <ArrowRight size={14} />
        </button>

        {/* Secondary export */}
        <button
          type="button"
          onClick={handleXlsx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'xlsx' ? '…' : (<>Export XLSX <ArrowRight size={10} /></>)}
        </button>

        {/* Footer */}
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
            Need segments?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function IncomeStatementMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Income Statement
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">Comparative · USD</span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Sonchoy Studio Ltd.</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">Q2 2026 vs Q2 2025</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
          <BrandMark size={14} className="text-paper" />
        </span>
      </div>

      {/* Ratios strip */}
      <div className="mb-5 grid grid-cols-5 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Revenue',  '252,000'],
          ['Gross %',  '76.2%'],
          ['Op %',     '25.8%'],
          ['Net %',    '19.7%'],
          ['EPS',      '0.50'],
        ].map(([k, v]) => (
          <div key={k} className="bg-canvas px-1 py-3">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className="m-0 mt-1 font-mono text-[12px] font-semibold text-ink-950">{v}</p>
          </div>
        ))}
      </div>

      {/* Two-column table preview */}
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-ink-950 text-paper">
            <th className="py-1.5 px-1 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-accounting">Line</th>
            <th className="py-1.5 px-1 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Q2 2026</th>
            <th className="py-1.5 px-1 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Q2 2025</th>
            <th className="py-1.5 px-1 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-accounting">Δ %</th>
          </tr>
        </thead>
        <tbody>
          {[
            { type: 'h', label: 'Revenue' },
            ['Product sales',    '184,000', '156,000', '+17.9%'],
            ['Service revenue',  '56,000',  '42,000',  '+33.3%'],
            ['Licensing',        '12,000',  '8,500',   '+41.2%'],
            { type: 'st', label: 'Total revenue', c: '252,000', p: '206,500', dv: '+22.0%' },
            { type: 'h', label: 'Cost of revenue' },
            ['Materials',        '(42,000)', '(38,000)', '+10.5%'],
            ['Manufacturing',    '(18,000)', '(17,500)', '+2.9%'],
            { type: 'st', label: 'Gross profit', c: '192,000', p: '151,000', dv: '+27.2%' },
            { type: 'h', label: 'Operating expenses' },
            ['Salaries · S&W',   '(92,000)', '(74,000)', '+24.3%'],
            ['Marketing',        '(14,500)', '(11,200)', '+29.5%'],
            ['Other OPEX',       '(20,600)', '(17,900)', '+15.1%'],
            { type: 'st', label: 'Operating income', c: '64,900', p: '47,900', dv: '+35.5%' },
            ['Tax expense',      '(14,400)', '(9,800)',  '+46.9%'],
          ].map((row, i) => {
            if (row.type === 'h') {
              return (
                <tr key={i} className="bg-canvas">
                  <td colSpan={4} className="py-1 px-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                    {row.label}
                  </td>
                </tr>
              )
            }
            if (row.type === 'st') {
              return (
                <tr key={i} className="border-y border-ink-700">
                  <td className="py-1.5 px-1 font-semibold text-ink-950">{row.label}</td>
                  <td className="py-1.5 px-1 text-right font-mono font-semibold text-accounting">{row.c}</td>
                  <td className="py-1.5 px-1 text-right font-mono text-ink-700">{row.p}</td>
                  <td className="py-1.5 px-1 text-right font-mono text-success">{row.dv}</td>
                </tr>
              )
            }
            return (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1.5 px-1 text-ink-800">{row[0]}</td>
                <td className={`py-1.5 px-1 text-right font-mono ${String(row[1]).startsWith('(') ? 'text-crimson-300' : 'text-ink-900'}`}>{row[1]}</td>
                <td className={`py-1.5 px-1 text-right font-mono ${String(row[2]).startsWith('(') ? 'text-crimson-300' : 'text-ink-500'}`}>{row[2]}</td>
                <td className={`py-1.5 px-1 text-right font-mono ${String(row[3]).startsWith('+') ? 'text-success' : 'text-crimson-300'}`}>{row[3]}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Net income block */}
      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accounting">Net income</span>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-success">+33.9% YoY</span>
            <span className="font-mono text-[18px] font-semibold text-paper">USD 50,580</span>
          </div>
        </div>
      </div>

      {/* EPS row */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-line bg-canvas px-3 py-2 text-center">
          <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">EPS Basic</p>
          <p className="m-0 mt-0.5 font-mono text-[14px] font-semibold text-accounting">0.51</p>
        </div>
        <div className="rounded-md border border-line bg-canvas px-3 py-2 text-center">
          <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">EPS Diluted</p>
          <p className="m-0 mt-0.5 font-mono text-[14px] font-semibold text-accounting">0.48</p>
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
            From two columns of numbers{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a quarterly comparison.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Side-by-side current vs prior, with Δ% on every subtotal. Net income and EPS surface as separate callouts — exactly how investors expect to read the page.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Form mockup */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <ReportIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Income Statement Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Q2 2026 vs Q2 2025
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Revenue',           '252,000 · prior 206,500'],
                  ['COGS',              '−60,000 · prior −55,500'],
                  ['OPEX',              '−127,100 · prior −103,100'],
                  ['Tax expense',       '−14,400 · prior −9,800'],
                  ['Net income',        '+33.9% YoY · 50,580'],
                  ['EPS basic / diluted', '0.51 / 0.48'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-accounting/25 bg-accounting/25 text-center">
                {[
                  ['Rev Δ',  '+22.0%'],
                  ['Op Δ',   '+35.5%'],
                  ['NI Δ',   '+33.9%'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-accounting-bg px-2 py-2">
                    <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
                    <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-accounting">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Net income</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 50,580</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 rotate-90 items-center justify-center rounded-full border border-crimson-500/40 bg-canvas text-crimson-300 shadow-[0_4px_18px_-4px_rgba(237,40,40,0.4)] lg:rotate-0">
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Output */}
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
                  Investor-ready
                </span>
              </div>
              <IncomeStatementMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Type two columns',         'Each line carries a current and a prior amount. Variance percentages compute as you type — green for growth, red for decline.'],
  ['02', 'Drop in shares',           'Weighted-average shares (basic + diluted) for each period. EPS computes immediately and prints alongside Net Income.'],
  ['03', 'Download the PDF',         'Multi-step format with Gross / Operating / Net subtotals, Δ% column, and an EPS panel — ready for the 10-Q or investor deck.'],
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
              <em className="font-serif font-normal italic text-crimson-300">10-Q-grade</em>{' '}statement.
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Built around the comparative format the SEC, IFRS, and most board packs require: current period, prior period, and the variance between them — at every subtotal.
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
  { title: 'Two-period side-by-side',  desc: 'Current and prior amounts on every line, with variance % computed automatically at each subtotal.' },
  { title: 'Multi-step format',         desc: 'Revenue → Gross profit → Operating income → Income before tax → Net income, exactly the order analysts expect.' },
  { title: 'EPS — basic & diluted',     desc: 'Type weighted-average shares for both periods; EPS computes and prints in a dedicated panel below Net Income.' },
  { title: 'OPEX with categories',      desc: 'Each operating-expense line carries a category — useful for the .xlsx export and for cross-period analysis.' },
  { title: 'Variance %, colour-coded',  desc: 'Growth in green, decline in red — at every subtotal, plus a YoY badge on the Net Income callout.' },
  { title: 'Currency aware',            desc: 'USD, EUR, GBP, INR + 30 more — stamped on every monetary cell and EPS.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for analysts</Eyebrow>
          <SectionTitle>
            Every column an investor{' '}
            <em className="font-serif font-normal italic text-crimson-300">wants to see.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-accounting/20 bg-accounting-bg text-accounting">
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
  { q: 'How is this different from the Profit & Loss Statement tool?', a: 'The P&L tool is single-period — type one set of numbers, get one statement with margins. This Income Statement tool is two-period: current vs prior, with Δ% on every line and EPS basic + diluted. Use P&L for management reporting; use Income Statement for investor reporting and SEC filings.' },
  { q: 'How are EPS basic and diluted computed?',                       a: 'EPS basic = Net Income ÷ Weighted Average Shares Outstanding (basic). EPS diluted = Net Income ÷ Weighted Average Shares Outstanding (diluted, including stock options, RSUs, convertibles). Type the share counts for both periods and the values compute live.' },
  { q: 'What if I don\'t have a prior period yet?',                     a: 'Leave the prior column at 0. Variance percentages will show as "—" rather than misleading "+∞%". You can also use this tool single-period if needed — but the P&L Statement tool is purpose-built for that case.' },
  { q: 'Multi-step vs single-step format?',                             a: 'This tool uses the multi-step format (Revenue → Gross profit → Operating income → Net income) preferred by US-GAAP and IFRS filings. Single-step (everything in one totalled stack) isn\'t supported — for that, the simpler P&L tool is a better fit.' },
  { q: 'Can I include non-recurring or restructuring items?',           a: 'Yes — use the "Other expenses" section for one-time charges (restructuring, impairment, loss on disposal). They flow below Operating Income, so Operating Income remains the comparable core-business metric.' },
  { q: 'Output formats?',                                               a: 'PDF (investor-ready, with the comparative table, EPS panel, and variance colour-coding) and .xlsx (formula-friendly with both periods and Δ% — perfect for linking into your model or board deck).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">income statements.</em>
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
  { name: 'Profit & Loss Statement', desc: 'Single-period P&L with margin analysis.',           Icon: PnlIcon,      label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
  { name: 'Cash Flow Statement',     desc: 'Operating, investing, financing cash flows.',       Icon: CashFlowIcon, label: 'ACCOUNTING', path: '/tools/cash-flow-statement' },
  { name: 'Balance Sheet Generator', desc: 'Assets, liabilities, equity — tied out to the cent.', Icon: BalanceIcon, label: 'ACCOUNTING', path: '/tools/balance-sheet-generator' },
  { name: 'Financial Forecast',      desc: 'Project revenue and expenses forward.',             Icon: ForecastIcon, label: 'ACCOUNTING' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting">
                  {t.label}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accounting-bg text-accounting">
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

export default function IncomeStatementGeneratorTool() {
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
