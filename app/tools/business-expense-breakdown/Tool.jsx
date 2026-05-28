'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  BudgetIcon, ExpenseIcon, ReportIcon, PnlIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, EXPENSE_GROUPS, SORT_MODES,
  findCurrency, findExpenseGroup, findSortMode,
  computeBreakdown, buildTopMovers, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/businessExpenseBreakdown/compute'
import { generateBusinessExpenseBreakdownPdf } from '@/lib/businessExpenseBreakdown/generatePdf'
import { generateBusinessExpenseBreakdownXlsx } from '@/lib/businessExpenseBreakdown/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Business Expense Breakdown"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['11',       'Expense groups'],
  ['MoM',      'Variance per line'],
  ['Movers',   'Top variance lines'],
  ['Free',     'Always · no signup'],
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
            <span className="text-ink-950">Business Expense Breakdown</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(129,140,248,0.25)]" />
            Accounting · Spend analytics
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Where the money{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              actually went
            </em>
            <br />
            and{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              what moved.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Break every business expense into 11 standard categories. See share of total, month-over-month variance, the biggest movers driving the change, and a multi-period trend table — all on one PDF.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> MoM variance + share %</span>
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

/* ---------- RowList ---------- */

function RowList({ items, setItems, trendLabels }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), name: '', groupId: 'people', current: 0, prior: 0, trend: trendLabels.map(() => 0) },
  ])
  const trendCount = (trendLabels || []).length
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">Expense lines ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {items.map((r) => (
          <div key={r.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
              <input type="text" value={r.name || ''}
                onChange={(e) => update(r.id, { name: e.target.value })}
                placeholder="Expense line (e.g. Salaries — engineering)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-accounting/60" />
              <button type="button" onClick={() => remove(r.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-[1.2fr_1fr_1fr] gap-1.5">
              <select value={r.groupId}
                onChange={(e) => update(r.id, { groupId: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60">
                {EXPENSE_GROUPS.map((g) => (<option key={g.id} value={g.id}>{g.label}</option>))}
              </select>
              <input type="number" step="any" value={r.current}
                onChange={(e) => update(r.id, { current: Number(e.target.value) || 0 })}
                placeholder="Current"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              <input type="number" step="any" value={r.prior}
                onChange={(e) => update(r.id, { prior: Number(e.target.value) || 0 })}
                placeholder="Prior"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
            </div>
            {trendCount > 0 && (
              <div className="mt-1.5">
                <p className="m-0 mb-1 font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Trend periods</p>
                <div className="grid grid-cols-6 gap-1">
                  {trendLabels.slice(0, 6).map((label, i) => (
                    <input
                      key={i}
                      type="number" step="any"
                      value={Array.isArray(r.trend) ? (r.trend[i] ?? 0) : 0}
                      onChange={(e) => {
                        const newTrend = [...(r.trend || [])]
                        newTrend[i] = Number(e.target.value) || 0
                        update(r.id, { trend: newTrend })
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
  reportTitle: 'Business Expense Breakdown — May 2026',
  reference: 'BEB-2026-05-0042',
  entityName: 'Sonchoy Studio Pvt Ltd',
  periodLabel: 'May 2026 (vs Apr 2026)',
  sortMode: 'current-desc',
  currency: 'INR',

  trendLabels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
  rows: [
    // People
    { id: 1,  name: 'Salaries — engineering',   groupId: 'people',       current: 920000, prior: 880000, trend: [820000, 840000, 850000, 860000, 880000, 920000] },
    { id: 2,  name: 'Salaries — design',         groupId: 'people',       current: 380000, prior: 380000, trend: [360000, 365000, 370000, 375000, 380000, 380000] },
    { id: 3,  name: 'Salaries — operations',     groupId: 'people',       current: 150000, prior: 150000, trend: [140000, 145000, 145000, 150000, 150000, 150000] },
    { id: 4,  name: 'Contractor payments',       groupId: 'cogs',         current: 320000, prior: 285000, trend: [200000, 220000, 245000, 260000, 285000, 320000] },
    // Facilities
    { id: 5,  name: 'Office rent',               groupId: 'facilities',   current: 95000,  prior: 95000,  trend: [95000, 95000, 95000, 95000, 95000, 95000] },
    { id: 6,  name: 'Utilities & internet',      groupId: 'facilities',   current: 18500,  prior: 17200,  trend: [15800, 16100, 16400, 16800, 17200, 18500] },
    // Tech
    { id: 7,  name: 'Software subscriptions',    groupId: 'tech',         current: 96000,  prior: 89000,  trend: [82000, 85000, 87000, 88000, 89000, 96000] },
    { id: 8,  name: 'Cloud hosting',             groupId: 'tech',         current: 42000,  prior: 38000,  trend: [32000, 34000, 35000, 36000, 38000, 42000] },
    // Marketing
    { id: 9,  name: 'Digital ads',               groupId: 'marketing',    current: 75000,  prior: 50000,  trend: [40000, 45000, 48000, 50000, 50000, 75000] },
    { id: 10, name: 'Content & SEO',             groupId: 'marketing',    current: 35000,  prior: 28000,  trend: [22000, 24000, 25000, 26000, 28000, 35000] },
    // Travel
    { id: 11, name: 'Client visits / travel',    groupId: 'travel',       current: 38500,  prior: 24000,  trend: [12000, 18000, 22000, 23000, 24000, 38500] },
    // Professional
    { id: 12, name: 'Legal & accounting fees',   groupId: 'professional', current: 45000,  prior: 35000,  trend: [30000, 32000, 35000, 32000, 35000, 45000] },
    // Finance
    { id: 13, name: 'Bank charges & interest',   groupId: 'finance',      current: 28500,  prior: 28000,  trend: [27000, 27500, 27800, 28000, 28000, 28500] },
    // Tax
    { id: 14, name: 'Income tax provision',      groupId: 'tax',          current: 412000, prior: 380000, trend: [340000, 350000, 365000, 370000, 380000, 412000] },
    // Other
    { id: 15, name: 'Office supplies & misc',    groupId: 'operations',   current: 12500,  prior: 11800,  trend: [10500, 11000, 11200, 11500, 11800, 12500] },
  ],

  includeGroupSummary: true,
  includeTopMovers: true,
  includeTrendTable: true,

  notes: 'May 2026 vs Apr 2026. Headline cost increases driven by (a) marketing scale-up ahead of Q2 launch (+₹32K), (b) higher engineering payroll on two new hires (+₹40K), (c) tax provision tracking revenue growth (+₹32K). Rent and utilities trending flat as expected.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const sort = useMemo(() => findSortMode(data.sortMode), [data.sortMode])
  const report = useMemo(() => computeBreakdown(data), [data])
  const movers = useMemo(() => buildTopMovers(report.rows, 5), [report.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setRows = (items) => setData((s) => ({ ...s, rows: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const updateTrendLabels = (raw) => {
    const labels = raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12)
    setData((s) => ({
      ...s,
      trendLabels: labels,
      rows: s.rows.map((r) => ({
        ...r,
        trend: labels.map((_, i) => (r.trend && r.trend[i] != null) ? r.trend[i] : 0),
      })),
    }))
  }

  const buildPayload = () => ({
    ...data,
    rows: data.rows.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateBusinessExpenseBreakdownPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateBusinessExpenseBreakdownXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <BudgetIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Expense breakdown · {data.rows.length} lines · {sections} sections
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
        <div className="mt-2">
          <SelectInput label="Sort lines by" value={data.sortMode} onChange={setField('sortMode')}
            options={SORT_MODES.map((m) => ({ value: m.id, label: m.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Trend setup */}
        <TextInput
          label="Trend periods (comma-separated, optional)"
          value={(data.trendLabels || []).join(', ')}
          onChange={updateTrendLabels}
          placeholder="Dec, Jan, Feb, Mar, Apr, May"
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Rows */}
        <RowList items={data.rows} setItems={setRows} trendLabels={data.trendLabels || []} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Optional sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Group summary" desc="Roll up lines by expense group"
            checked={data.includeGroupSummary} onChange={setField('includeGroupSummary')} />
          <ToggleRow label="Biggest movers" desc="Top-6 lines ranked by absolute variance"
            checked={data.includeTopMovers} onChange={setField('includeTopMovers')} />
          <ToggleRow label="Multi-period trend table" desc="Per-line trend across all defined periods"
            checked={data.includeTrendTable} onChange={setField('includeTrendTable')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Current period</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(report.totalCurrent)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">MoM change</p>
            <p className={`m-0 mt-1 font-mono text-[13px] font-semibold ${report.totalVariance > 0 ? 'text-crimson-400' : 'text-success'}`}>
              {report.totalVariance >= 0 ? '+' : '-'}{formatNumber(Math.abs(report.totalVariance))}
            </p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code} · {report.totalVariancePct >= 0 ? '+' : ''}{formatNumber(report.totalVariancePct)}%</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Lines</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{report.rows.length}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Groups</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-accounting">{report.groupSummary.length}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Top {report.topN}</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-accounting">{formatNumber(report.topNGroupShare)}%</p>
          </div>
        </div>

        {/* Group preview */}
        {report.groupSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              By group ({report.groupSummary.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Group</th>
                    <th className="py-1 text-right font-normal">Current</th>
                    <th className="py-1 text-right font-normal">Share</th>
                    <th className="py-1 text-right font-normal">Δ%</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {report.groupSummary.map((g) => (
                    <tr key={g.groupId} className="border-t border-line">
                      <td className="py-1 text-ink-700">{g.label}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(g.current)}</td>
                      <td className="py-1 text-right text-accounting">{formatNumber(g.sharePct)}%</td>
                      <td className={`py-1 text-right font-bold ${g.variance > 0 ? 'text-crimson-400' : g.variance < 0 ? 'text-success' : 'text-ink-500'}`}>
                        {g.variancePct >= 0 ? '+' : ''}{formatNumber(g.variancePct)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top movers preview */}
        {movers.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Biggest movers
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Line</th>
                    <th className="py-1 text-right font-normal">Variance</th>
                    <th className="py-1 text-right font-normal">Δ%</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {movers.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1 text-ink-700 truncate max-w-[180px]">{r.name}</td>
                      <td className={`py-1 text-right ${r.variance > 0 ? 'text-crimson-400' : 'text-success'}`}>
                        {r.variance >= 0 ? '+' : '-'}{formatNumber(Math.abs(r.variance))}
                      </td>
                      <td className={`py-1 text-right font-bold ${r.variance > 0 ? 'text-crimson-400' : 'text-success'}`}>
                        {r.variancePct >= 0 ? '+' : ''}{formatNumber(r.variancePct)}%
                      </td>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">Total expenses</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.periodLabel || 'period'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(report.totalCurrent, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Drivers of variance, one-off events, budget context…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Breakdown PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (5 sheets) <ArrowRight size={10} /></>)}
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
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">BUSINESS EXPENSE BREAKDOWN</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Expense Breakdown — May 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Sonchoy Studio Pvt Ltd · 15 lines · 7 groups</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-accounting" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['CURRENT',  'INR 26.7L'],
            ['PRIOR',    'INR 24.9L'],
            ['MoM',      '+7.2%'],
            ['LINES',    '15'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-accounting">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">BY GROUP</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_60px_50px_50px] gap-1 bg-accounting/15 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-accounting">
            <span>GROUP</span>
            <span className="text-right">CURRENT</span>
            <span className="text-right">SHARE</span>
            <span className="text-right">Δ%</span>
          </div>
          {[
            ['People & payroll',          '17,70,000', '66%', '+1.6%', 'bad'],
            ['Tax & compliance',           '4,12,000', '15%', '+8.4%', 'bad'],
            ['Marketing & sales',          '1,10,000',  '4%', '+41.0%', 'bad'],
            ['Facilities & rent',          '1,13,500',  '4%',  '+1.2%', 'bad'],
            ['Technology & software',      '1,38,000',  '5%',  '+8.7%', 'bad'],
            ['Travel & entertainment',     '38,500',    '1%', '+60.4%', 'bad'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_60px_50px_50px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="truncate">{r[0]}</span>
              <span className="text-right">{r[1]}</span>
              <span className="text-right text-accounting">{r[2]}</span>
              <span className={`text-right font-bold ${r[4] === 'good' ? 'text-success' : 'text-crimson-400'}`}>{r[3]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">BIGGEST MOVERS</p>
        <div className="mt-1 rounded border border-line bg-canvas px-2 py-1.5 text-[9px]">
          <p className="m-0 font-mono">
            <span className="text-ink-700">Salaries — engineering</span>
            <span className="float-right text-crimson-400 font-bold">+40,000</span>
          </p>
          <p className="m-0 mt-0.5 font-mono">
            <span className="text-ink-700">Digital ads</span>
            <span className="float-right text-crimson-400 font-bold">+25,000</span>
          </p>
          <p className="m-0 mt-0.5 font-mono">
            <span className="text-ink-700">Income tax provision</span>
            <span className="float-right text-crimson-400 font-bold">+32,000</span>
          </p>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ full line-item table and 6-month trend in the PDF</p>
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
            Expenses in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            attribution + variance out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop every line into one of 11 standard groups. The tool computes share %, month-over-month variance, ranks the biggest movers, and shows the trend so you can see whether this month is a one-off or a pattern.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <BudgetIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Breakdown Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  May 2026 · vs Apr
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Entity',         'Sonchoy Studio Pvt Ltd'],
                  ['Period',         'May 2026 (vs Apr 2026)'],
                  ['Lines',          '15 expense lines'],
                  ['Groups',         '7 expense groups'],
                  ['Current',        'INR 26,67,000'],
                  ['Prior',          'INR 24,89,000'],
                  ['MoM change',     '+INR 1,78,000 (+7.2%)'],
                  ['Biggest mover',  'Salaries — eng (+₹40K)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Total expenses</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 26,67,000</span>
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
                  CFO-ready
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
  ['01', 'Drop in your lines',  'Name, group, current period, prior period. Standard groups cover people, facilities, tech, marketing, travel, professional, ops, COGS, finance, tax, other.'],
  ['02', 'See the splits',       'Share of total per line and per group; variance vs prior in both currency and percentage. Biggest movers ranked by absolute variance.'],
  ['03', 'Export PDF + XLSX',    'PDF: summary cards, group summary, line table, biggest movers, multi-period trend, notes. XLSX: Summary, Lines, By Group, Top movers, Trend.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Spend,{' '}
              <em className="font-serif font-normal italic text-crimson-300">explained.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            "Expenses were up 7% this month" tells you nothing useful. "Marketing scaled 41%, engineering payroll +5% on new hires, tax tracked revenue growth" is a decision-ready narrative. This tool produces the second version.
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
  { title: '11 expense groups',          desc: 'People & payroll, facilities & rent, tech & software, marketing & sales, travel & entertainment, professional services, operations, COGS, finance, tax, other.' },
  { title: 'Variance vs prior',           desc: 'Every line and every group shows absolute and percentage variance vs prior period — colour-coded red (increase) / green (decrease) since expenses going up is "bad."' },
  { title: 'Biggest movers',              desc: 'Top-6 lines ranked by absolute variance. Surfaces the lines actually driving the period\'s change — not just the largest absolute values.' },
  { title: 'Group rollup',                desc: 'Standalone group summary with subtotals, share of total, and per-group variance. Useful for cost-discipline tracking by department or function.' },
  { title: '5 sort modes',                 desc: 'Current high-to-low or low-to-high, variance biggest increase or decrease, or by group then name. Reorder for the story you\'re telling.' },
  { title: 'PDF + 5-sheet XLSX',          desc: 'PDF: summary cards + group summary + line table + movers + trend + notes. XLSX: Summary, Lines, By Group, Top movers, Trend.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for cost discipline</Eyebrow>
          <SectionTitle>
            Spend,{' '}
            <em className="font-serif font-normal italic text-crimson-300">attributed.</em>
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
  { q: 'How is this different from the Expense Tracker Sheet?',     a: 'The Expense Tracker is a transaction log — every individual expense entry with date, vendor, category, amount. This Breakdown is a roll-up — every expense line with current vs prior period, variance, share, and trend. Use the tracker to capture; use the breakdown to analyse.' },
  { q: 'How is it different from the Monthly Financial Summary?',   a: 'The Monthly Summary covers revenue + expenses + net income on one page with KPIs. This Breakdown is deeper on the expense side: per-line share, per-line variance, biggest-mover ranking, multi-period trend. Use the summary for the headline, the breakdown for cost diagnosis.' },
  { q: 'Why are expense increases shown in red?',                   a: 'For expenses, "higher than prior" is usually bad news (cost discipline slipping) and "lower" is good. Revenue tools flip this. Both conventions match how finance teams actually read variance reports.' },
  { q: 'What\'s a healthy share for the people group?',             a: 'Wildly sector-dependent. Software / services: 60–75% of total opex; capital-intensive manufacturing: 20–35%; agencies and consulting: 65–80%. The more useful question is whether your people share is moving in the right direction over your trend periods.' },
  { q: 'Can I add custom groups?',                                  a: 'Not directly — the 11 standard groups should cover almost everything. Use "Other" for genuinely unique categories, and give the line a clear name. If you need many custom buckets, the XLSX export lets you re-tag in Excel afterwards.' },
  { q: 'Output formats?',                                            a: 'PDF (summary cards, group summary, full line-item table with share %, biggest movers ranked, multi-period trend, notes — auto-paginated) and XLSX (5 sheets: Summary, Lines, By Group, Top movers, Trend). All numeric.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">expense breakdowns.</em>
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
  { name: 'Monthly Financial Summary', desc: 'P&L + KPIs + cash position.',           Icon: ReportIcon,  label: 'ACCOUNTING', path: '/tools/monthly-financial-summary' },
  { name: 'Revenue Report',            desc: 'Revenue by segment / product.',         Icon: ReportIcon,  label: 'ACCOUNTING', path: '/tools/revenue-report' },
  { name: 'Expense Tracker Sheet',     desc: 'Transaction-level expense log.',        Icon: ExpenseIcon, label: 'ACCOUNTING', path: '/tools/expense-tracker-sheet' },
  { name: 'Profit & Loss Statement',   desc: 'Formal P&L statement.',                 Icon: PnlIcon,     label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
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

export default function BusinessExpenseBreakdownTool() {
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
