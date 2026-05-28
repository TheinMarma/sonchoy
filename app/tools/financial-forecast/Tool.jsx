'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  ForecastIcon, ReportIcon, TemplateIcon, PnlIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, LINE_TYPES, PERIOD_FREQUENCIES, FORECAST_HORIZONS, FORECAST_PURPOSES,
  findCurrency, findLineType, findPeriodFrequency, findForecastHorizon, findForecastPurpose,
  computeForecast, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/financialForecast/compute'
import { generateFinancialForecastPdf } from '@/lib/financialForecast/generatePdf'
import { generateFinancialForecastXlsx } from '@/lib/financialForecast/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Financial Forecast Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['3',         'Scenarios per line'],
  ['1–5',       'Year horizon'],
  ['Per-period', '12-month projection'],
  ['Free',      'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 60%)' }} />
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
            <span className="text-accounting">Accounting</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Financial Forecast Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(129,140,248,0.25)]" />
            Accounting · Scenario planning
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Three scenarios{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              for the board
            </em>
            <br />
            in one{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              PDF.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Set a base-case growth rate per line, plus optimistic and downside adjustments. The tool projects 1–5 years forward across all three scenarios, with yearly rollups, per-period grids, and a sensitivity confidence-range block.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> 3 scenarios per line</span>
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
  'focus:border-accounting/60 focus:ring-2 focus:ring-accounting/20 hover:border-line-strong'

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
function DateInput({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} font-mono [color-scheme:dark]`} />
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
        className="h-4 w-4 shrink-0 cursor-pointer accent-accounting" />
    </label>
  )
}

/* ---------- LineList ---------- */

function LineList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), name: '', typeId: 'revenue', currentValue: 0, growthBasePct: 10, optimisticAdjPct: 5, downsideAdjPct: -8 },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">Forecast lines ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
        {items.map((r) => (
          <div key={r.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
              <input type="text" value={r.name || ''}
                onChange={(e) => update(r.id, { name: e.target.value })}
                placeholder="Line (e.g. Enterprise revenue)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-accounting/60" />
              <button type="button" onClick={() => remove(r.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-[1.2fr_1fr] gap-1.5">
              <select value={r.typeId}
                onChange={(e) => update(r.id, { typeId: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60">
                {LINE_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
              <input type="number" step="any" value={r.currentValue}
                onChange={(e) => update(r.id, { currentValue: Number(e.target.value) || 0 })}
                placeholder="Current value"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
            </div>
            <p className="m-0 mt-2 font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Growth assumptions (annual)</p>
            <div className="mt-1 grid grid-cols-3 gap-1">
              <input type="number" step="any" value={r.growthBasePct}
                onChange={(e) => update(r.id, { growthBasePct: Number(e.target.value) || 0 })}
                placeholder="Base %"
                className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              <input type="number" step="any" value={r.optimisticAdjPct}
                onChange={(e) => update(r.id, { optimisticAdjPct: Number(e.target.value) || 0 })}
                placeholder="Opt adj"
                className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              <input type="number" step="any" value={r.downsideAdjPct}
                onChange={(e) => update(r.id, { downsideAdjPct: Number(e.target.value) || 0 })}
                placeholder="Down adj"
                className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  reportTitle: 'Financial Forecast — FY 2026–28',
  reference: 'FCAST-2026-3YR-0042',
  entityName: 'Sonchoy Studio Pvt Ltd',
  purposeId: 'fundraise',
  horizonId: '3yr',
  customYears: 3,
  frequencyId: 'quarterly',
  startDate: todayISO(),
  currency: 'INR',

  rows: [
    { id: 1,  name: 'Enterprise retainers',     typeId: 'revenue', currentValue: 1450000, growthBasePct: 35, optimisticAdjPct: 15, downsideAdjPct: -15 },
    { id: 2,  name: 'SMB monthly retainers',    typeId: 'revenue', currentValue: 630000,  growthBasePct: 18, optimisticAdjPct: 12, downsideAdjPct: -10 },
    { id: 3,  name: 'One-off project work',     typeId: 'revenue', currentValue: 450000,  growthBasePct: 5,  optimisticAdjPct: 10, downsideAdjPct: -20 },
    { id: 4,  name: 'White-label partnerships', typeId: 'revenue', currentValue: 280000,  growthBasePct: 60, optimisticAdjPct: 25, downsideAdjPct: -30 },
    { id: 5,  name: 'Training & workshops',     typeId: 'revenue', currentValue: 117000,  growthBasePct: 20, optimisticAdjPct: 10, downsideAdjPct: -10 },

    { id: 6,  name: 'Contractor / freelancer',  typeId: 'cogs',    currentValue: 320000,  growthBasePct: 18, optimisticAdjPct: 0,  downsideAdjPct: 5 },
    { id: 7,  name: 'Software (COGS)',          typeId: 'cogs',    currentValue: 50000,   growthBasePct: 10, optimisticAdjPct: 0,  downsideAdjPct: 5 },

    { id: 8,  name: 'Salaries — engineering',   typeId: 'opex',    currentValue: 1000000, growthBasePct: 22, optimisticAdjPct: 8,  downsideAdjPct: -10 },
    { id: 9,  name: 'Salaries — design',        typeId: 'opex',    currentValue: 380000,  growthBasePct: 15, optimisticAdjPct: 8,  downsideAdjPct: -8 },
    { id: 10, name: 'Office rent + utilities',  typeId: 'opex',    currentValue: 113500,  growthBasePct: 8,  optimisticAdjPct: 0,  downsideAdjPct: 0 },
    { id: 11, name: 'Marketing & advertising',  typeId: 'opex',    currentValue: 85000,   growthBasePct: 40, optimisticAdjPct: 20, downsideAdjPct: -15 },
    { id: 12, name: 'Software (opex)',           typeId: 'opex',    currentValue: 88000,   growthBasePct: 15, optimisticAdjPct: 0,  downsideAdjPct: 0 },

    { id: 13, name: 'Income tax provision',      typeId: 'tax',     currentValue: 408000,  growthBasePct: 25, optimisticAdjPct: 10, downsideAdjPct: -15 },
  ],

  includeYearlyTable: true,
  includePeriodTable: true,
  includeSensitivity: true,

  notes: '3-year forecast prepared for Series-A pitch deck. Base case assumes 30% revenue CAGR driven by enterprise retainer growth; optimistic adds white-label partnerships scaling; downside reflects extended sales cycles. Marketing and headcount scale with revenue. Tax provision tracks at ~14% effective rate.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const purpose = useMemo(() => findForecastPurpose(data.purposeId), [data.purposeId])
  const report = useMemo(() => computeForecast(data), [data])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setRows = (items) => setData((s) => ({ ...s, rows: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    rows: data.rows.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateFinancialForecastPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateFinancialForecastXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <ForecastIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Forecast · {report.years}y · {report.rows.length} lines
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Report title" value={data.reportTitle} onChange={setField('reportTitle')} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference"   value={data.reference}   onChange={setField('reference')} mono />
          <SelectInput label="Purpose"   value={data.purposeId}   onChange={setField('purposeId')}
            options={FORECAST_PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
          <TextInput label="Entity name" value={data.entityName} onChange={setField('entityName')} />
          <SelectInput label="Currency"  value={data.currency}   onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <SelectInput label="Horizon"   value={data.horizonId}   onChange={setField('horizonId')}
            options={FORECAST_HORIZONS.map((h) => ({ value: h.id, label: h.label }))} />
          {data.horizonId === 'custom' ? (
            <NumberInput label="Custom years" value={data.customYears} onChange={setField('customYears')} suffix="yr" />
          ) : (
            <SelectInput label="Frequency" value={data.frequencyId} onChange={setField('frequencyId')}
              options={PERIOD_FREQUENCIES.map((p) => ({ value: p.id, label: p.label }))} />
          )}
          {data.horizonId === 'custom' && (
            <SelectInput label="Frequency" value={data.frequencyId} onChange={setField('frequencyId')}
              options={PERIOD_FREQUENCIES.map((p) => ({ value: p.id, label: p.label }))} />
          )}
          {data.horizonId !== 'custom' && (
            <DateInput label="Start date" value={data.startDate} onChange={setField('startDate')} />
          )}
        </div>
        {data.horizonId === 'custom' && (
          <div className="mt-2">
            <DateInput label="Start date" value={data.startDate} onChange={setField('startDate')} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Lines */}
        <LineList items={data.rows} setItems={setRows} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Optional sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Yearly net income table" desc="Net per year × scenario"
            checked={data.includeYearlyTable} onChange={setField('includeYearlyTable')} />
          <ToggleRow label="Per-period base table"   desc="Base case net per period (up to 24 periods)"
            checked={data.includePeriodTable}   onChange={setField('includePeriodTable')} />
          <ToggleRow label="Sensitivity block"       desc="Upside / downside spread and confidence range"
            checked={data.includeSensitivity}   onChange={setField('includeSensitivity')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Scenario cards live */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-crimson-500/40 bg-crimson-500/10 px-3 py-2.5">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-crimson-400">Downside</p>
            <p className={`m-0 mt-1 font-mono text-[12px] font-bold ${report.aggregate.downside.net >= 0 ? 'text-success' : 'text-crimson-400'}`}>
              {report.aggregate.downside.net >= 0 ? '+' : '-'}{formatNumber(Math.abs(report.aggregate.downside.net))}
            </p>
            <p className="m-0 font-mono text-[8.5px] text-ink-500">Net · {cur.code}</p>
          </div>
          <div className="rounded-lg border border-accounting/40 bg-accounting/10 px-3 py-2.5">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-accounting">Base case</p>
            <p className={`m-0 mt-1 font-mono text-[12px] font-bold ${report.aggregate.base.net >= 0 ? 'text-success' : 'text-crimson-400'}`}>
              {report.aggregate.base.net >= 0 ? '+' : '-'}{formatNumber(Math.abs(report.aggregate.base.net))}
            </p>
            <p className="m-0 font-mono text-[8.5px] text-ink-500">Net · {cur.code}</p>
          </div>
          <div className="rounded-lg border border-success/40 bg-success/10 px-3 py-2.5">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-success">Optimistic</p>
            <p className="m-0 mt-1 font-mono text-[12px] font-bold text-success">
              +{formatNumber(report.aggregate.optimistic.net)}
            </p>
            <p className="m-0 font-mono text-[8.5px] text-ink-500">Net · {cur.code}</p>
          </div>
        </div>

        {/* Yearly preview */}
        {report.years > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Net income by year ({report.years} years)
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Year</th>
                    <th className="py-1 text-right font-normal">Downside</th>
                    <th className="py-1 text-right font-normal">Base</th>
                    <th className="py-1 text-right font-normal">Optimistic</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {Array.from({ length: report.years }).map((_, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1 text-ink-700">Year {i + 1}</td>
                      <td className="py-1 text-right text-crimson-400">{formatNumber(report.yearlyAggregate.downside.net[i] || 0)}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(report.yearlyAggregate.base.net[i] || 0)}</td>
                      <td className="py-1 text-right text-success">{formatNumber(report.yearlyAggregate.optimistic.net[i] || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-accounting/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">Base-case net (total)</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {report.years}-year forecast
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {report.aggregate.base.net >= 0 ? '' : '-'}{formatMoney(Math.abs(report.aggregate.base.net), data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes & assumptions (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Drivers of optimistic case, downside risks, methodology…" rows={3} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Forecast PDF'}
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

function ReportMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-accounting" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">FINANCIAL FORECAST</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Financial Forecast — FY 2026–28</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Sonchoy Studio Pvt Ltd · 3-year · Quarterly</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-accounting" />

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {[
            ['DOWNSIDE',   'INR 1.1Cr',  'border-crimson-500/40 bg-crimson-500/5',  'text-crimson-400'],
            ['BASE CASE',  'INR 4.2Cr',  'border-accounting/40 bg-accounting/5',     'text-accounting'],
            ['OPTIMISTIC', 'INR 8.7Cr',  'border-success/40 bg-success/5',           'text-success'],
          ].map(([k, v, bc, tc]) => (
            <div key={k} className={`rounded border px-2 py-1.5 ${bc}`}>
              <p className={`m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] ${tc}`}>{k}</p>
              <p className="m-0 mt-0.5 text-[11px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">3-YEAR FORECAST BY LINE</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_50px_50px_50px] gap-1 bg-accounting/15 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-accounting">
            <span>LINE</span>
            <span className="text-right">BASE</span>
            <span className="text-right">OPT</span>
            <span className="text-right">DOWN</span>
          </div>
          {[
            ['REVENUE', '11.8Cr', '15.1Cr', '8.7Cr', 'group'],
            ['  Enterprise retainers',     '8,30L', '10,20L', '6,40L'],
            ['  SMB monthly retainers',    '2,70L',  '3,30L', '2,20L'],
            ['  White-label partnerships',  '95L',   '1,40L',   '52L'],
            ['EXPENSE', '7.6Cr', '6.4Cr', '7.6Cr', 'group'],
            ['  Salaries — engineering',   '4,30L', '4,80L', '3,80L'],
            ['  Contractor / freelancer',  '1,30L', '1,30L', '1,35L'],
          ].map((r, i) => (
            r[4] === 'group'
              ? (
                <div key={i} className="grid grid-cols-[1fr_50px_50px_50px] gap-1 border-t border-line bg-accounting/5 px-1.5 py-1 font-mono text-[7.5px] font-bold uppercase tracking-[0.08em] text-accounting">
                  <span>{r[0]}</span>
                  <span className="text-right">{r[1]}</span>
                  <span className="text-right">{r[2]}</span>
                  <span className="text-right">{r[3]}</span>
                </div>
              )
              : (
                <div key={i} className="grid grid-cols-[1fr_50px_50px_50px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
                  <span className="truncate">{r[0]}</span>
                  <span className="text-right">{r[1]}</span>
                  <span className="text-right text-success">{r[2]}</span>
                  <span className="text-right text-crimson-400">{r[3]}</span>
                </div>
              )
          ))}
        </div>

        <p className="m-0 mt-3 text-[10px] italic text-ink-500">+ yearly net rollup, per-period grid, sensitivity confidence range in the full PDF</p>
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
            Growth rates in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            three-scenario forecast out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            One line, three numbers (base growth, optimistic adjustment, downside adjustment). The tool compounds them across 1–5 years and produces a board-ready three-scenario forecast with sensitivity analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <ForecastIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Forecast Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  3-year · quarterly
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Entity',           'Sonchoy Studio Pvt Ltd'],
                  ['Horizon',          '3 years (12 quarterly periods)'],
                  ['Purpose',          'Fundraising deck'],
                  ['Lines',            '13 (5 revenue, 8 expense)'],
                  ['Base case net',    'INR 4.2 Cr cumulative'],
                  ['Optimistic net',   'INR 8.7 Cr'],
                  ['Downside net',     'INR 1.1 Cr'],
                  ['Confidence range', 'INR 1.1 Cr → INR 8.7 Cr'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Base case net</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 4,20,00,000</span>
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
                  Deck-ready
                </span>
              </div>
              <ReportMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Set the lines',     'Per line: name, type (revenue / COGS / opex / capex / tax), current value, base growth %, optimistic adjustment %, downside adjustment %.'],
  ['02', 'Pick horizon',       'Forecast 1, 3, or 5 years out (or custom). Choose monthly, quarterly, or annual periods. The tool compounds growth per period accordingly.'],
  ['03', 'Export PDF + XLSX',  'PDF: scenario cards, full forecast table, yearly rollup, per-period grid, sensitivity block. XLSX: Summary, Lines, Yearly, Per-period.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three lenses{' '}
              <em className="font-serif font-normal italic text-crimson-300">on the same plan.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A single-point forecast is a wish. A three-scenario forecast is a plan: here&rsquo;s what we believe (base), here&rsquo;s what could go right (optimistic), here&rsquo;s what we&rsquo;ve modelled if it doesn&rsquo;t (downside). Investors read all three. So should you.
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
  { title: 'Three scenarios per line',   desc: 'Base growth rate plus optimistic and downside adjustments. The tool compounds each scenario forward independently.' },
  { title: '1–5 year horizon',           desc: 'Forecast 1 year, 3 years, 5 years, or custom. Pick monthly, quarterly, or annual periods — the tool handles the period-level compounding.' },
  { title: 'Yearly rollup',              desc: 'Per-year net income for each of the three scenarios. The view that goes on slide 12 of the fundraising deck.' },
  { title: 'Per-period grid',            desc: 'Up to 24 periods (e.g. 2 years monthly or 6 years quarterly) showing base-case net per period. Useful for cash-flow timing.' },
  { title: 'Sensitivity block',          desc: 'Confidence-range view: downside floor → optimistic ceiling, with the spread quantified. Tells investors what you actually believe.' },
  { title: 'PDF + 4-sheet XLSX',         desc: 'PDF: scenario cards + full forecast table + yearly table + per-period grid + sensitivity. XLSX: Summary, Lines, Yearly, Per-period.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for serious planning</Eyebrow>
          <SectionTitle>
            Forecast,{' '}
            <em className="font-serif font-normal italic text-crimson-300">with humility.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-accounting/20 bg-accounting-bg text-accounting">
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
  { q: 'How is this different from the Budget Planning Sheet?',     a: 'The Budget Planning Sheet is a single-scenario plan tracked vs actuals as the year unfolds. The Forecast is multi-scenario, multi-year, forward-projecting with growth assumptions per line. Use the budget for the year you\'re in; use the forecast for the years you\'re planning toward.' },
  { q: 'What does "optimistic adjustment" mean exactly?',           a: 'It\'s added to the base growth rate. So if base growth is 30% and optimistic adjustment is +10, the optimistic scenario uses 40% annual growth for that line. Downside works the same way (negative). Lets you model upside/downside per line, not just at the aggregate level.' },
  { q: 'How is per-period growth computed?',                       a: 'Annual rate is converted to per-period using (1 + annual)^(1/periodsPerYear) − 1. So 30% annual = 6.78% quarterly = 2.21% monthly. The tool then compounds the current value forward period by period.' },
  { q: 'How accurate is a 5-year forecast really?',                a: 'Honest answer: not very, beyond ~18 months. The point of a forecast isn\'t precision — it\'s direction and sensitivity. A good multi-scenario forecast tells stakeholders the range of outcomes you\'re planning around, what drives each scenario, and what would have to be true for each. That\'s the value, not the third decimal place.' },
  { q: 'Should I include capex and tax lines?',                    a: 'Yes for tax (it\'s a real cash outflow). Capex depends on your business: lumpy capex is hard to model with a smooth growth rate — for those, model in the year you expect it and override the growth to 0%. Software businesses often skip capex entirely; manufacturing businesses can\'t.' },
  { q: 'Output formats?',                                          a: 'PDF (three scenario cards, full forecast table grouped by type, yearly net income table, per-period base-case grid, sensitivity confidence-range block, notes/assumptions — auto-paginated) and XLSX (4 sheets: Summary, Lines, Yearly, Per-period). All numeric.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">financial forecasts.</em>
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
  { name: 'Budget Planning Sheet',     desc: 'Single-scenario budget vs actual.',     Icon: TemplateIcon, label: 'ACCOUNTING', path: '/tools/budget-planning-sheet' },
  { name: 'Monthly Financial Summary', desc: 'P&L + KPIs + cash position.',           Icon: ReportIcon,    label: 'ACCOUNTING', path: '/tools/monthly-financial-summary' },
  { name: 'Revenue Report',            desc: 'Revenue by segment + variance.',        Icon: ReportIcon,    label: 'ACCOUNTING', path: '/tools/revenue-report' },
  { name: 'Profit & Loss Statement',   desc: 'Formal P&L statement.',                 Icon: PnlIcon,       label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accounting-bg text-accounting">
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

export default function FinancialForecastTool() {
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
