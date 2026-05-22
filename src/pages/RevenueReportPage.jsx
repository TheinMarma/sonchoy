import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  ForecastIcon, ReportIcon, PnlIcon, BalanceIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, DIMENSIONS, SORT_MODES,
  findCurrency, findDimension, findSortMode,
  computeReport, buildTopContributors, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/revenueReport/compute'
import { generateRevenueReportPdf } from '../lib/revenueReport/generatePdf'
import { generateRevenueReportXlsx } from '../lib/revenueReport/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Revenue Report Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['7',         'Dimensions'],
  ['Variance',  'vs prior built-in'],
  ['Top-N',     'Contributor view'],
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
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-accounting">Accounting</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Revenue Report Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(129,140,248,0.25)]" />
            Accounting · Revenue analytics
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Revenue,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              ranked
            </em>
            <br />
            and{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              attributed.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Break down revenue by product, segment, customer, region, or any custom dimension. See variance vs prior period, top contributors, share of total, concentration risk, and a multi-period trend table — all in one report.
          </p>
          <div className="mb-12 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="btn btn-cta btn-xl">
              Launch The Tool <ArrowRight size={16} />
            </button>
            <Link to="/#tools" className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-950/15 bg-ink-950/5 px-7 py-[18px] text-[16px] font-medium leading-none text-ink-950 no-underline backdrop-blur-sm transition-colors hover:bg-ink-950/10 capitalize">
              Explore More Tools
            </Link>
          </div>
          <div className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> No signup, ever</span>
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> 100% local · nothing uploaded</span>
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Concentration analysis</span>
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
    { id: Date.now() + Math.random(), name: '', current: 0, prior: 0, trend: trendLabels.map(() => 0) },
  ])
  const trendCount = (trendLabels || []).length

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">Lines ({items.length})</span>
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
                placeholder="Name (product / segment / customer)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-accounting/60" />
              <button type="button" onClick={() => remove(r.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
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
                      className="min-h-[24px] rounded border border-line bg-canvas px-1 py-0.5 text-right font-mono text-[10px] text-ink-900 outline-none focus:border-accounting/60"
                      title={label}
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
  reportTitle: 'Revenue Report — Q2 2026',
  reference: 'REV-2026-Q2-0042',
  entityName: 'Sonchoy Studio Pvt Ltd',
  periodLabel: 'Quarter ended 30 Jun 2026',
  dimensionId: 'segment',
  sortMode: 'current-desc',
  currency: 'INR',

  trendLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  rows: [
    { id: 1, name: 'Enterprise retainers',     current: 4200000, prior: 3650000, trend: [1100000, 1200000, 1350000, 1350000, 1400000, 1450000] },
    { id: 2, name: 'SMB monthly retainers',    current: 1850000, prior: 1720000, trend: [560000, 575000, 590000, 605000, 615000, 630000] },
    { id: 3, name: 'One-off project work',     current: 1240000, prior: 1480000, trend: [490000, 470000, 520000, 410000, 380000, 450000] },
    { id: 4, name: 'White-label partnerships', current: 685000,  prior: 412000,  trend: [110000, 130000, 172000, 185000, 220000, 280000] },
    { id: 5, name: 'Training & workshops',     current: 320000,  prior: 285000,  trend: [80000, 92000, 113000, 105000, 98000, 117000] },
    { id: 6, name: 'Affiliate / referral',     current: 95000,   prior: 82000,   trend: [28000, 30000, 24000, 31000, 32000, 32000] },
  ],

  includeTopContributors: true,
  includeTrendTable: true,
  includeConcentration: true,

  notes: 'Q2 2026 vs Q1 2026. Enterprise retainers grew 15% as Sonchoy onboarded two new logos. Project work slowed — sales team focus shifted to retainer conversion. Concentration risk high in enterprise (50% of revenue from top segment) — monitor in Q3.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const dim = useMemo(() => findDimension(data.dimensionId), [data.dimensionId])
  const report = useMemo(() => computeReport(data), [data])
  const top = useMemo(() => buildTopContributors(report.rows, 5), [report.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setRows = (items) => setData((s) => ({ ...s, rows: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    rows: data.rows.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateRevenueReportPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateRevenueReportXlsx(buildPayload()) } finally { setBusy(null) } }

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
              Revenue · {data.rows.length} lines · {sections} sections
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
          <SelectInput label="Dimension"  value={data.dimensionId} onChange={setField('dimensionId')}
            options={DIMENSIONS.map((d) => ({ value: d.id, label: d.label }))} />
          <SelectInput label="Sort"       value={data.sortMode}    onChange={setField('sortMode')}
            options={SORT_MODES.map((m) => ({ value: m.id, label: m.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Trend setup */}
        <TextInput
          label="Trend periods (comma-separated, optional)"
          value={(data.trendLabels || []).join(', ')}
          onChange={updateTrendLabels}
          placeholder="Jan, Feb, Mar, Apr, May, Jun"
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
          <ToggleRow label="Top contributors" desc="Top 5 lines ranked by current-period revenue"
            checked={data.includeTopContributors} onChange={setField('includeTopContributors')} />
          <ToggleRow label="Concentration block" desc="Top-3 share + risk rating"
            checked={data.includeConcentration} onChange={setField('includeConcentration')} />
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
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Variance</p>
            <p className={`m-0 mt-1 font-mono text-[13px] font-semibold ${report.totalVariance >= 0 ? 'text-success' : 'text-crimson-400'}`}>
              {report.totalVariance >= 0 ? '+' : '-'}{formatNumber(Math.abs(report.totalVariance))}
            </p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code} · {report.totalVariancePct >= 0 ? '+' : ''}{formatNumber(report.totalVariancePct)}%</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Rows</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{report.rows.length}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Top {report.topN}</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-accounting">{formatNumber(report.topNShare)}%</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Risk</p>
            <p className={`m-0 mt-0.5 font-mono text-[11px] font-semibold ${
              report.topNShare >= 70 ? 'text-crimson-400' :
              report.topNShare >= 50 ? 'text-amber-600' : 'text-success'
            }`}>
              {report.topNShare >= 70 ? 'HIGH' : report.topNShare >= 50 ? 'MED' : 'LOW'}
            </p>
          </div>
        </div>

        {/* Top contributors preview */}
        {top.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Top contributors
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">#</th>
                    <th className="py-1 font-normal">{dim.label}</th>
                    <th className="py-1 text-right font-normal">Current</th>
                    <th className="py-1 text-right font-normal">Share</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {top.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1 text-ink-500">{i + 1}</td>
                      <td className="py-1 text-ink-700 truncate max-w-[160px]">{r.name}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(r.current)}</td>
                      <td className="py-1 text-right text-accounting">{formatNumber(r.sharePct)}%</td>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">Total revenue</span>
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
            placeholder="Drivers, risks, narrative…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Revenue Report PDF'}
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
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">REVENUE REPORT</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Revenue Report — Q2 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Sonchoy Studio Pvt Ltd · By customer segment</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-accounting" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['CURRENT',  'INR 83.9L'],
            ['PRIOR',    'INR 76.3L'],
            ['VARIANCE', '+10.0%'],
            ['ROWS',     '6'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-accounting">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">BY SEGMENT</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[20px_1fr_60px_50px_50px] gap-1 bg-accounting/15 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-accounting">
            <span>#</span><span>SEGMENT</span>
            <span className="text-right">CURRENT</span>
            <span className="text-right">Δ%</span>
            <span className="text-right">SHARE</span>
          </div>
          {[
            ['1', 'Enterprise retainers',     '42,00,000', '+15.1%', '50%',  'good'],
            ['2', 'SMB monthly retainers',    '18,50,000',  '+7.6%', '22%',  'good'],
            ['3', 'One-off project work',     '12,40,000', '-16.2%', '15%',  'bad'],
            ['4', 'White-label partnerships', '6,85,000',  '+66.3%',  '8%',  'good'],
            ['5', 'Training & workshops',     '3,20,000',  '+12.3%',  '4%',  'good'],
            ['6', 'Affiliate / referral',     '95,000',    '+15.9%',  '1%',  'good'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[20px_1fr_60px_50px_50px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-500">{r[0]}</span>
              <span className="truncate">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className={`text-right font-bold ${r[5] === 'good' ? 'text-success' : 'text-crimson-400'}`}>{r[3]}</span>
              <span className="text-right text-accounting">{r[4]}</span>
            </div>
          ))}
          <div className="grid grid-cols-[20px_1fr_60px_50px_50px] gap-1 border-t-2 border-accounting/40 bg-accounting/10 px-1.5 py-1 font-mono text-[8.5px] font-bold text-accounting">
            <span></span><span>TOTAL</span>
            <span className="text-right">83,90,000</span>
            <span className="text-right text-success">+10%</span>
            <span className="text-right">100%</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[10px] italic text-ink-500">+ top contributors, concentration block, 6-month trend table in the full PDF</p>
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
            Revenue lines in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            ranked attribution out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop in revenue rows by whatever dimension matters — product, segment, customer. The tool ranks them, computes variance, flags concentration risk, and shows a multi-period trend.
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Revenue Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Q2 2026 · By segment
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Entity',           'Sonchoy Studio Pvt Ltd'],
                  ['Period',           'Quarter ended 30 Jun 2026'],
                  ['Dimension',        'Customer segment (6 lines)'],
                  ['Current revenue',  'INR 83,90,000'],
                  ['Prior period',     'INR 76,29,000'],
                  ['Variance',         '+INR 7,61,000 (+10.0%)'],
                  ['Top contributor',  'Enterprise retainers · 50% share'],
                  ['Concentration',    'MEDIUM (top 3 = 87%)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Total revenue</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 83,90,000</span>
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
                  Analyst-ready
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
  ['01', 'Pick the dimension',  'Product, segment, customer, region, channel, category — whatever cut of revenue matters this period.'],
  ['02', 'Drop in the rows',     'Name, current period, prior period. Optionally fill in multi-period trend cells. Sort by current, variance, or name.'],
  ['03', 'Export PDF + XLSX',    'PDF: summary cards, main table, top contributors, concentration block, multi-period trend, notes. XLSX: Summary, Revenue, Top contributors, Trend.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              What revenue{' '}
              <em className="font-serif font-normal italic text-crimson-300">actually does.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            "Revenue was up 10%" is barely a sentence. "Enterprise retainers drove 80% of growth while project work declined 16%" is a story. This tool turns the first number into the second narrative.
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
  { title: '7 dimensions',                desc: 'Product, segment, customer, region, channel, category, or custom. Same table, different cut of revenue.' },
  { title: 'Variance built in',           desc: 'Every row compares current vs prior period — absolute variance and percentage change, colour-coded green/red.' },
  { title: 'Concentration risk',           desc: 'Top-3 share of total with a risk rating (low / medium / high). Quantifies how dependent your revenue is on a small number of contributors.' },
  { title: 'Top contributors block',       desc: 'Top-5 lines ranked by current revenue with share % and variance — the leaders driving (or dragging) the period.' },
  { title: 'Multi-period trend table',     desc: 'Define up to 12 trend periods; the per-line trend cells become a row-by-row mini-history with column totals.' },
  { title: '5 sort modes',                  desc: 'Current period high-to-low, low-to-high, variance biggest gain, variance biggest decline, or name A–Z. Reorder for whatever story you\'re telling.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for diagnosis</Eyebrow>
          <SectionTitle>
            Numbers,{' '}
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
  { q: 'How is this different from the Monthly Financial Summary?', a: 'The Monthly Summary covers the full P&L (revenue + expenses + net income). This Revenue Report is revenue-only — but with much deeper analytics: variance per line, share of total, concentration risk, ranked top contributors, multi-period trend. Use both: summary for the headline, revenue report for the explanation.' },
  { q: 'What\'s the "concentration" metric?',                       a: 'Top-3 share of total revenue. If your top 3 customers/products/segments make up 80% of revenue, you have high concentration risk: losing one is a serious problem. Healthy concentration is usually <50% for the top 3; 50–70% is medium; >70% is high.' },
  { q: 'Can I track customer-level revenue?',                       a: 'Yes — pick "Customer / account" as the dimension and enter one row per customer. For SaaS or recurring-revenue businesses, this is how you build a customer revenue waterfall — top accounts, churn at the bottom, expansion at the top.' },
  { q: 'What if I don\'t have prior-period data?',                  a: 'Leave the Prior column at 0. The variance columns will show 100% growth (because there\'s nothing to compare to) — useful for first-period reports. Once you have 2+ periods, the comparison becomes meaningful.' },
  { q: 'How many trend periods can I add?',                        a: 'Up to 12. The PDF shows the first 8 columns for readability; the XLSX exports all of them. Common patterns: 12 months (year-long trend), 4 quarters (rolling), 6 months (half-year), 5 years (long-term).' },
  { q: 'Output formats?',                                            a: 'PDF (summary cards, main table with variance and share, top contributors, concentration block, multi-period trend table, notes — auto-paginated) and XLSX (4 sheets: Summary, Revenue, Top contributors, Trend). All numeric.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">revenue reports.</em>
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
  { name: 'Monthly Financial Summary',   desc: 'P&L + KPIs + cash position.',           Icon: ReportIcon, label: 'ACCOUNTING', path: '/tools/monthly-financial-summary' },
  { name: 'Profit & Loss Statement',     desc: 'Full formal P&L.',                       Icon: PnlIcon,    label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
  { name: 'Balance Sheet Generator',     desc: 'Assets, liabilities, equity tied out.',  Icon: BalanceIcon, label: 'ACCOUNTING', path: '/tools/balance-sheet-generator' },
  { name: 'Income Statement Generator',  desc: 'Revenue, expenses, net income.',         Icon: ReportIcon,  label: 'ACCOUNTING', path: '/tools/income-statement-generator' },
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
          <Link to="/#tools" className="inline-flex items-center gap-2 font-medium text-[14px] text-crimson-300 underline decoration-crimson-500/40 underline-offset-4 hover:decoration-crimson-300">
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
              ? (<Link key={t.name} to={t.path} className={cls}>{inner}</Link>)
              : (<a key={t.name} href="#" className={cls}>{inner}</a>)
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function RevenueReportPage() {
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
