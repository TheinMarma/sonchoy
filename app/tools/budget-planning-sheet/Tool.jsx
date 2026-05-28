'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  TemplateIcon, ReportIcon, PnlIcon, BalanceIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, LINE_TYPES, PERIOD_FREQUENCIES, PLAN_PURPOSES,
  findCurrency, findLineType, findPeriodFrequency, findPlanPurpose,
  computeBudget, buildLineGroups, buildWatchlist, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/budgetPlanning/compute'
import { generateBudgetPlanningPdf } from '@/lib/budgetPlanning/generatePdf'
import { generateBudgetPlanningXlsx } from '@/lib/budgetPlanning/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Budget Planning Sheet"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Budget',    'vs actual variance'],
  ['5',         'Line types'],
  ['Watchlist', 'Off-budget alerts'],
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
            <span className="text-ink-950">Budget Planning Sheet</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(129,140,248,0.25)]" />
            Accounting · Forward planning
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Plan the year{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — track every
            </em>
            <br />
            line{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              against it.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Build a budget by revenue and expense line, fill in monthly allocations, then drop in actuals as the year unfolds. The tool computes variance per line, flags off-budget items in a watchlist, and shows net-by-period across 12 months.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Auto-status flags</span>
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
        className="h-4 w-4 shrink-0 cursor-pointer accent-accounting" />
    </label>
  )
}

/* ---------- LineList ---------- */

function LineList({ items, setItems, periodLabels }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), name: '', typeId: 'opex', budget: 0, actual: 0, periods: periodLabels.map(() => 0) },
  ])
  const periodCount = (periodLabels || []).length
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">Budget lines ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="max-h-[440px] space-y-1.5 overflow-y-auto pr-1">
        {items.map((r) => (
          <div key={r.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
              <input type="text" value={r.name || ''}
                onChange={(e) => update(r.id, { name: e.target.value })}
                placeholder="Line (e.g. Salaries — engineering)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-accounting/60" />
              <button type="button" onClick={() => remove(r.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-[1.2fr_1fr_1fr] gap-1.5">
              <select value={r.typeId}
                onChange={(e) => update(r.id, { typeId: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60">
                {LINE_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
              <input type="number" step="any" value={r.budget}
                onChange={(e) => update(r.id, { budget: Number(e.target.value) || 0 })}
                placeholder="Budget"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              <input type="number" step="any" value={r.actual}
                onChange={(e) => update(r.id, { actual: Number(e.target.value) || 0 })}
                placeholder="Actual"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
            </div>
            {periodCount > 0 && (
              <div className="mt-1.5">
                <p className="m-0 mb-1 font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Per-period budget</p>
                <div className="grid grid-cols-6 gap-1">
                  {periodLabels.slice(0, 6).map((label, i) => (
                    <input
                      key={i}
                      type="number" step="any"
                      value={Array.isArray(r.periods) ? (r.periods[i] ?? 0) : 0}
                      onChange={(e) => {
                        const newPeriods = [...(r.periods || [])]
                        newPeriods[i] = Number(e.target.value) || 0
                        update(r.id, { periods: newPeriods })
                      }}
                      placeholder={label.slice(0, 4)}
                      title={label}
                      className="min-h-[24px] rounded border border-line bg-canvas px-1 py-0.5 text-right font-mono text-[10px] text-ink-900 outline-none focus:border-accounting/60"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  reportTitle: 'Budget Planning Sheet — FY 2026',
  reference: 'BUD-2026-FY-0042',
  entityName: 'Sonchoy Studio Pvt Ltd',
  periodLabel: 'Apr 2026 – Mar 2027',
  purposeId: 'annual',
  frequencyId: 'monthly',
  sortMode: 'type',
  currency: 'INR',

  periodLabels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],

  rows: [
    // Revenue
    { id: 1, name: 'Service revenue — retainers',  typeId: 'revenue', budget: 30000000, actual: 5950000, periods: [2400000, 2500000, 2550000, 2600000, 2650000, 2700000, 2700000, 2700000, 2700000, 2700000, 2700000, 2700000] },
    { id: 2, name: 'Service revenue — projects',    typeId: 'revenue', budget: 12000000, actual: 1850000, periods: [900000, 950000, 1000000, 1050000, 1050000, 1100000, 1050000, 1000000, 950000, 950000, 1000000, 1000000] },
    { id: 3, name: 'Training & workshops',          typeId: 'revenue', budget: 1800000,  actual: 320000,  periods: [120000, 150000, 150000, 150000, 150000, 180000, 180000, 150000, 150000, 130000, 130000, 160000] },
    // COGS
    { id: 4, name: 'Contractor / freelancer cost',  typeId: 'cogs',    budget: 3600000,  actual: 645000,  periods: [280000, 300000, 310000, 305000, 290000, 290000, 290000, 300000, 305000, 310000, 305000, 215000] },
    { id: 5, name: 'Software / tools (COGS)',        typeId: 'cogs',    budget: 600000,   actual: 96000,   periods: [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000] },
    // Opex
    { id: 6, name: 'Salaries — engineering',         typeId: 'opex',    budget: 11400000, actual: 1840000, periods: [920000, 920000, 950000, 950000, 950000, 950000, 950000, 950000, 950000, 950000, 950000, 1000000] },
    { id: 7, name: 'Salaries — design',              typeId: 'opex',    budget: 4500000,  actual: 760000,  periods: [380000, 380000, 380000, 380000, 380000, 380000, 380000, 380000, 380000, 380000, 380000, 360000] },
    { id: 8, name: 'Office rent',                    typeId: 'opex',    budget: 1140000,  actual: 190000,  periods: [95000, 95000, 95000, 95000, 95000, 95000, 95000, 95000, 95000, 95000, 95000, 95000] },
    { id: 9, name: 'Marketing & advertising',        typeId: 'opex',    budget: 900000,   actual: 167000,  periods: [60000, 75000, 80000, 75000, 75000, 75000, 75000, 70000, 70000, 80000, 80000, 85000] },
    { id: 10, name: 'Travel & entertainment',        typeId: 'opex',    budget: 360000,   actual: 62500,   periods: [24000, 38500, 30000, 30000, 30000, 30000, 30000, 30000, 30000, 30000, 30000, 27500] },
    { id: 11, name: 'Software subscriptions (opex)', typeId: 'opex',    budget: 1080000,  actual: 185000,  periods: [89000, 96000, 90000, 90000, 90000, 90000, 90000, 90000, 90000, 90000, 87000, 88000] },
    // Capex
    { id: 12, name: 'Office equipment',              typeId: 'capex',   budget: 600000,   actual: 0,       periods: [0, 0, 200000, 0, 0, 0, 200000, 0, 0, 0, 200000, 0] },
    // Tax
    { id: 13, name: 'Income tax provision',          typeId: 'tax',     budget: 4800000,  actual: 792000,  periods: [380000, 412000, 400000, 400000, 400000, 400000, 400000, 400000, 400000, 400000, 400000, 408000] },
  ],

  includePeriodTable: true,
  includeVarianceWatchlist: true,

  notes: 'FY 2026/27 annual budget · 12-month monthly allocations. Two months of actuals (Apr, May) shown for variance tracking. Marketing spend tracking ~13% above-budget — review July plan. Income tax provision tracking budget assumes ~16% effective rate; reassess at half-year.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const purpose = useMemo(() => findPlanPurpose(data.purposeId), [data.purposeId])
  const report = useMemo(() => computeBudget(data), [data])
  const groups = useMemo(() => buildLineGroups(report.rows), [report.rows])
  const watchlist = useMemo(() => buildWatchlist(report.rows, 5), [report.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setRows = (items) => setData((s) => ({ ...s, rows: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const updatePeriodLabels = (raw) => {
    const labels = raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12)
    setData((s) => ({
      ...s,
      periodLabels: labels,
      rows: s.rows.map((r) => ({
        ...r,
        periods: labels.map((_, i) => (r.periods && r.periods[i] != null) ? r.periods[i] : 0),
      })),
    }))
  }

  const buildPayload = () => ({
    ...data,
    rows: data.rows.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateBudgetPlanningPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateBudgetPlanningXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <TemplateIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Budget · {data.rows.length} lines · {sections} sections
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
          <TextInput label="Period label" value={data.periodLabel} onChange={setField('periodLabel')} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
          <TextInput label="Entity name" value={data.entityName} onChange={setField('entityName')} />
          <SelectInput label="Currency"  value={data.currency}   onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="Plan purpose" value={data.purposeId} onChange={setField('purposeId')}
            options={PLAN_PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Frequency"    value={data.frequencyId} onChange={setField('frequencyId')}
            options={PERIOD_FREQUENCIES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Period labels */}
        <TextInput
          label="Period labels (comma-separated)"
          value={(data.periodLabels || []).join(', ')}
          onChange={updatePeriodLabels}
          placeholder="Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec, Jan, Feb, Mar"
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Lines */}
        <LineList items={data.rows} setItems={setRows} periodLabels={data.periodLabels || []} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Optional sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Variance watchlist" desc="Off-budget items ranked by absolute variance"
            checked={data.includeVarianceWatchlist} onChange={setField('includeVarianceWatchlist')} />
          <ToggleRow label="Per-period table"   desc="Per-line breakdown across all defined periods"
            checked={data.includePeriodTable}     onChange={setField('includePeriodTable')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Net budget</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-accounting">{formatNumber(report.netBudget)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Net actual</p>
            <p className={`m-0 mt-1 font-mono text-[13px] font-semibold ${report.netActual >= 0 ? 'text-success' : 'text-crimson-400'}`}>
              {report.netActual >= 0 ? '' : '-'}{formatNumber(Math.abs(report.netActual))}
            </p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-2.5 py-2">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-ink-500">Lines</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-ink-950">{report.rows.length}</p>
          </div>
          <div className="rounded-lg border border-success/40 bg-success/10 px-2.5 py-2">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-success">On track</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-success">{report.statusCounts['on-track'] || 0}</p>
          </div>
          <div className="rounded-lg border border-success/40 bg-success/10 px-2.5 py-2">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-success">Good</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-success">{(report.statusCounts['under'] || 0) + (report.statusCounts['above'] || 0)}</p>
          </div>
          <div className="rounded-lg border border-crimson-500/40 bg-crimson-500/10 px-2.5 py-2">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-crimson-400">Off-track</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-crimson-400">{(report.statusCounts['over'] || 0) + (report.statusCounts['below'] || 0)}</p>
          </div>
        </div>

        {/* Watchlist preview */}
        {watchlist.length > 0 && (
          <div className="mt-3 rounded-lg border border-crimson-500/30 bg-crimson-500/5 p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-crimson-400">
              ⚠ Variance watchlist ({watchlist.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Line</th>
                    <th className="py-1 text-right font-normal">Variance</th>
                    <th className="py-1 text-right font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {watchlist.map((r) => (
                    <tr key={r.id} className="border-t border-crimson-500/15">
                      <td className="py-1 text-ink-700 truncate max-w-[200px]">{r.name}</td>
                      <td className="py-1 text-right text-crimson-400">{r.variancePct >= 0 ? '+' : ''}{formatNumber(r.variancePct)}%</td>
                      <td className="py-1 text-right text-crimson-400 font-bold">{r.status.label.split(' ')[0]}</td>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">Budgeted net income</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.periodLabel || 'period'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {report.netBudget >= 0 ? '' : '-'}{formatMoney(Math.abs(report.netBudget), data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Assumptions, methodology, review schedule…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Budget PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (3–4 sheets) <ArrowRight size={10} /></>)}
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
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">BUDGET PLANNING SHEET</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Budget Plan — FY 2026/27</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Sonchoy Studio Pvt Ltd · Annual · 12 monthly periods</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-accounting" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['INCOME',     'INR 4.38Cr'],
            ['EXPENSE',    'INR 2.86Cr'],
            ['NET BUDGET', 'INR 1.52Cr'],
            ['LINES',      '13'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-accounting">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">BUDGET vs ACTUAL</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_50px_50px_50px] gap-1 bg-accounting/15 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-accounting">
            <span>LINE</span>
            <span className="text-right">BUDGET</span>
            <span className="text-right">ACTUAL</span>
            <span className="text-right">Δ%</span>
          </div>
          {[
            ['REVENUE', '4,38,00,000', '81,20,000', '', 'group'],
            ['  Service revenue — retainers',    '3,00,00,000', '59,50,000', '-0.8%', 'good'],
            ['  Service revenue — projects',      '1,20,00,000', '18,50,000', '-2.6%', 'bad'],
            ['  Training & workshops',           '18,00,000',   '3,20,000',  '+6.7%', 'good'],
            ['OPERATING EXPENSE', '1,89,80,000', '32,04,500', '', 'group'],
            ['  Salaries — engineering',          '1,14,00,000', '18,40,000', '-3.2%', 'good'],
            ['  Marketing & advertising',         '9,00,000',    '1,67,000',  '+11.3%', 'bad'],
          ].map((r, i) => (
            r[4] === 'group'
              ? (
                <div key={i} className="grid grid-cols-[1fr_50px_50px_50px] gap-1 border-t border-line bg-accounting/5 px-1.5 py-1 font-mono text-[7.5px] font-bold uppercase tracking-[0.08em] text-accounting">
                  <span>{r[0]}</span>
                  <span className="text-right">{r[1]}</span>
                  <span className="text-right">{r[2]}</span>
                  <span></span>
                </div>
              )
              : (
                <div key={i} className="grid grid-cols-[1fr_50px_50px_50px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
                  <span className="truncate">{r[0]}</span>
                  <span className="text-right">{r[1]}</span>
                  <span className="text-right">{r[2]}</span>
                  <span className={`text-right font-bold ${r[4] === 'good' ? 'text-success' : 'text-crimson-400'}`}>{r[3]}</span>
                </div>
              )
          ))}
        </div>

        <p className="m-0 mt-3 text-[10px] italic text-ink-500">+ watchlist, 12-month per-period grid, status dashboard in the full PDF</p>
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
            Plan in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            track the year out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Build the budget line by line, allocate it across 12 months, drop in actuals as the year unfolds. The tool computes variance per line and per group, flags off-budget items, and shows net by period.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <TemplateIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Budget Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  FY 2026/27 · monthly
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Entity',          'Sonchoy Studio Pvt Ltd'],
                  ['Period',          'Apr 2026 – Mar 2027'],
                  ['Lines',           '13 (3 revenue, 10 expense)'],
                  ['Budgeted income', 'INR 4,38,00,000'],
                  ['Budgeted expense', 'INR 2,86,80,000'],
                  ['Net budget',      'INR 1,51,20,000'],
                  ['YTD actuals',     '2 months entered'],
                  ['Watchlist',       '2 off-budget lines'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Budgeted net</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 1,51,20,000</span>
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
                  Plan-ready
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
  ['01', 'Build the budget',  'Per line: name, type (revenue / COGS / opex / capex / tax), annual budget, per-period allocation. Group subtotals roll up automatically.'],
  ['02', 'Drop in actuals',    'Type the actuals into the same row as you close each month. Variance, percentage, and status flag (on track / under / over) compute live.'],
  ['03', 'Export PDF + XLSX',  'PDF: summary cards, status dashboard, grouped table with subtotals, watchlist, per-period grid, notes. XLSX: Summary, Lines, Watchlist, Per-period.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Plan once,{' '}
              <em className="font-serif font-normal italic text-crimson-300">track all year.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A budget that sits in a spreadsheet nobody reopens isn&rsquo;t a budget — it&rsquo;s a guess. This tool is built to be reopened every month: drop in the new actuals, regenerate the PDF, send to the board. The variance watchlist tells you what to talk about.
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
  { title: '5 line types',                desc: 'Revenue, cost of revenue, operating expense, capital expense, tax / other. Subtotals per group; gross profit, operating profit, and net all compute.' },
  { title: 'Auto-status flags',           desc: 'Per line: on track (±5%), under/above budget (good direction), over/below budget (bad direction). Revenue and expense conventions handled separately.' },
  { title: 'Variance watchlist',          desc: 'Off-budget lines ranked by absolute variance. The block your finance lead opens first — surfaces what to investigate.' },
  { title: '12-month per-period grid',    desc: 'Allocate annual budget across months / quarters / weeks. The tool sums per-period across all lines for a net-by-period view.' },
  { title: '5 plan purposes',             desc: 'Annual budget, quarterly forecast, project budget, department budget, rolling 12-month forecast. Same engine, different framing.' },
  { title: 'PDF + 3–4 sheet XLSX',        desc: 'PDF: summary cards + status dashboard + grouped table + watchlist + per-period grid + notes. XLSX: Summary, Lines, Watchlist, Per-period.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for forward planning</Eyebrow>
          <SectionTitle>
            Budget,{' '}
            <em className="font-serif font-normal italic text-crimson-300">tracked.</em>
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
  { q: 'How is this different from the Monthly Financial Summary?', a: 'The Monthly Summary reports actuals for one month with optional comparison to a prior month or budget. The Budget Planning Sheet is the budget itself — the forward-looking plan, with all 12 months allocated and actuals tracked against it as they come in. Use this to plan; use the Summary to report.' },
  { q: 'What\'s the difference vs Business Expense Breakdown?',     a: 'The Expense Breakdown is historical — actual spend split into categories with MoM trend. Budget Planning is forward-looking — what you plan to spend / earn, then tracked against actuals. Different orientation; complementary tools.' },
  { q: 'When does a line show "On track" vs "Over budget"?',       a: 'Within ±5% of budget → "On track". Otherwise: for revenue, above-budget is good (green) and below-budget is bad (red); for expenses, the opposite — under-budget is good, over-budget is bad. The tool handles the convention automatically per line type.' },
  { q: 'Should the per-period columns sum to the annual budget?',  a: 'Usually yes — it\'s how budgets work. But the tool doesn\'t enforce it; you can have monthly allocations that don\'t add up to the annual figure if you\'re modelling a part-year project or a goal that exceeds the booked annual figure.' },
  { q: 'Can I model multiple budgets at once?',                    a: 'Not in a single sheet — each report is one budget. For multiple budgets (e.g. base case + stretch case, or per-department), generate separate reports with different references and titles, then compare the XLSX exports side-by-side.' },
  { q: 'Output formats?',                                          a: 'PDF (summary cards, status dashboard, grouped budget vs actual table with subtotals and group headers, variance watchlist, per-period grid, notes — auto-paginated) and XLSX (3–4 sheets: Summary, Lines, Watchlist, Per-period — all numeric).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">budget planning.</em>
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
  { name: 'Monthly Financial Summary', desc: 'P&L + KPIs + cash position.',          Icon: ReportIcon, label: 'ACCOUNTING', path: '/tools/monthly-financial-summary' },
  { name: 'Business Expense Breakdown', desc: 'Expenses by category + MoM trend.',    Icon: ReportIcon, label: 'ACCOUNTING', path: '/tools/business-expense-breakdown' },
  { name: 'Revenue Report',            desc: 'Revenue by segment + variance.',        Icon: ReportIcon, label: 'ACCOUNTING', path: '/tools/revenue-report' },
  { name: 'Profit & Loss Statement',   desc: 'Formal P&L statement.',                 Icon: PnlIcon,    label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
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

export default function BudgetPlanningTool() {
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
