import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  ReportIcon, PnlIcon, CashFlowIcon, BalanceIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, REPORT_PERIODS, REPORT_STATUSES, AUDIENCES,
  findCurrency, findReportPeriod, findReportStatus, findAudience,
  computeTotals, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/financial-report/compute'
import { generateFinancialReportPdf } from '../lib/financial-report/generatePdf'
import { generateFinancialReportXlsx } from '../lib/financial-report/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Financial Report Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['5',      'Period frequencies'],
  ['KPIs',   'With target deltas'],
  ['Δ%',     'Vs prior on every row'],
  ['Free',   'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 60%)' }} />
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
            <span className="text-business">Documents</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Financial Report Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-business/30 bg-business-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-business">
            <span className="h-1.5 w-1.5 rounded-full bg-business shadow-[0_0_0_4px_rgba(52,208,188,0.25)]" />
            Documents · Management report
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Numbers, narrative,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              outlook —
            </em>
            <br />
            one branded{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              report.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Monthly, quarterly, or annual financial reports for leadership, board, or investors. Headline cards, KPI table with Δ vs prior and target, revenue and expense breakdowns, executive summary, commentary, risks, outlook, and sign-off — in one auto-formatted PDF.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Auto Δ% vs prior period</span>
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
  'focus:border-business/60 focus:ring-2 focus:ring-business/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} ${mono ? 'font-mono' : ''}`} />
    </div>
  )
}
function NumberInput({ label, value, onChange, suffix, className = '', allowEmpty = false }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input type="number" inputMode="decimal" step="any"
          value={value == null ? '' : value}
          onChange={(e) => {
            const v = e.target.value
            if (v === '') return onChange(allowEmpty ? null : 0)
            onChange(Number(v) || 0)
          }}
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
        className="h-4 w-4 shrink-0 cursor-pointer accent-business" />
    </label>
  )
}

/* ---------- Lists ---------- */

function KpiList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), label: '', current: 0, prior: 0, target: null, unit: 'money', goodDirection: 'up' },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-business">KPIs ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-business-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-business transition-colors hover:bg-business/20">
          <Plus size={9} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
              <input type="text" value={it.label || ''}
                onChange={(e) => update(it.id, { label: e.target.value })}
                placeholder="KPI label (e.g. ARR, Active customers, Margin%)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-business/60" />
              <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              <input type="number" step="any" value={it.current}
                onChange={(e) => update(it.id, { current: Number(e.target.value) || 0 })}
                placeholder="Current"
                className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
              <input type="number" step="any" value={it.prior}
                onChange={(e) => update(it.id, { prior: Number(e.target.value) || 0 })}
                placeholder="Prior"
                className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-500 outline-none focus:border-business/60" />
              <input type="number" step="any" value={it.target == null ? '' : it.target}
                onChange={(e) => update(it.id, { target: e.target.value === '' ? null : Number(e.target.value) || 0 })}
                placeholder="Target"
                className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-500 outline-none focus:border-business/60" />
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              <select value={it.unit} onChange={(e) => update(it.id, { unit: e.target.value })}
                className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] text-ink-900 outline-none focus:border-business/60">
                <option value="money">Money</option>
                <option value="pct">Percent</option>
                <option value="num">Number</option>
              </select>
              <select value={it.goodDirection} onChange={(e) => update(it.id, { goodDirection: e.target.value })}
                className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] text-ink-900 outline-none focus:border-business/60">
                <option value="up">Up is good</option>
                <option value="down">Down is good</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PnlList({ title, items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), label: '', current: 0, prior: 0 },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-business">{title} ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-business-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-business transition-colors hover:bg-business/20">
          <Plus size={9} /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-[1fr_100px_100px_22px] items-center gap-1.5 rounded-md border border-line bg-paper p-1.5">
            <input type="text" value={it.label || ''}
              onChange={(e) => update(it.id, { label: e.target.value })}
              placeholder="Line label"
              className="min-h-[26px] rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[12px] text-ink-900 outline-none focus:border-business/60" />
            <input type="number" step="any" value={it.current}
              onChange={(e) => update(it.id, { current: Number(e.target.value) || 0 })}
              placeholder="Current"
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
            <input type="number" step="any" value={it.prior}
              onChange={(e) => update(it.id, { prior: Number(e.target.value) || 0 })}
              placeholder="Prior"
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-500 outline-none focus:border-business/60" />
            <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
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

/* ---------- Initial state ---------- */

const today = todayISO()

const INITIAL = {
  reportNumber: 'FR-2026-Q1',
  reportTitle: 'Quarterly Performance Review',
  periodLabel: 'Q1 FY 2026-27 (Apr–Jun 2026)',
  periodId: 'quarterly',
  preparedDate: today,
  audienceId: 'board',
  statusId: 'board',
  currency: 'INR',

  company: {
    name: 'Sonchoy Studio Pvt Ltd',
    address: '7 Brigade Road, Bengaluru, Karnataka 560001',
    email: 'finance@sonchoystudio.com',
    website: 'sonchoystudio.com',
  },

  executiveSummary: 'Q1 closed 14.2% ahead of revenue plan, driven by stronger-than-expected pickup in our retainer book and a clean cohort of three new logos in the SaaS vertical. Gross margin held at 47% despite a deliberate ramp in client-services headcount. Cash position is healthy and the financing line remains untouched.',

  highlights: [
    'Revenue INR 4.85 Cr — up 18% YoY and 14% ahead of plan',
    '3 new logos signed in SaaS vertical (Northwind Books, Lumen, BrightBox)',
    'Net retention rate climbed to 118% from 109% last quarter',
    'Cash runway extended to 19 months; financing line untapped',
    'Client-services headcount up 4 (now 28); productivity ratio holding',
  ],

  kpis: [
    { id: 1, label: 'Revenue (period)',          current: 48500000, prior: 41200000, target: 42500000, unit: 'money', goodDirection: 'up'   },
    { id: 2, label: 'ARR (annualised)',          current: 178000000, prior: 152000000, target: 165000000, unit: 'money', goodDirection: 'up' },
    { id: 3, label: 'Gross margin',              current: 47, prior: 46.4, target: 48, unit: 'pct', goodDirection: 'up' },
    { id: 4, label: 'Net retention',             current: 118, prior: 109, target: 110, unit: 'pct', goodDirection: 'up' },
    { id: 5, label: 'New logos',                 current: 3,  prior: 2,   target: 3,   unit: 'num', goodDirection: 'up' },
    { id: 6, label: 'Customer acquisition cost', current: 425000, prior: 488000, target: 450000, unit: 'money', goodDirection: 'down' },
    { id: 7, label: 'DSO (days sales outstanding)', current: 41, prior: 47, target: 45, unit: 'num', goodDirection: 'down' },
  ],

  revenue: [
    { id: 1, label: 'Retainer engagements',  current: 28600000, prior: 23400000 },
    { id: 2, label: 'Project engagements',   current: 14200000, prior: 13800000 },
    { id: 3, label: 'Recurring SaaS revenue', current: 4900000,  prior: 3200000  },
    { id: 4, label: 'Other / training',       current: 800000,   prior: 800000   },
  ],

  expenses: [
    { id: 1, label: 'Salaries & benefits',         current: 19800000, prior: 16700000 },
    { id: 2, label: 'Contractor & freelance fees', current: 3400000,  prior: 4100000  },
    { id: 3, label: 'Software & tooling',          current: 1100000,  prior: 980000   },
    { id: 4, label: 'Rent & utilities',            current: 1200000,  prior: 1200000  },
    { id: 5, label: 'Marketing & sales',           current: 1700000,  prior: 1900000  },
    { id: 6, label: 'Travel & client',             current: 480000,   prior: 320000   },
    { id: 7, label: 'Other operating expenses',    current: 220000,   prior: 290000   },
  ],

  includeHighlightsBlock: true,

  includeCommentaryBlock: true,
  commentary: 'Retainer growth is the standout — we deliberately leaned into upgrading 5 existing accounts to retainer terms in Q4, and that re-pricing landed cleanly this quarter. Project revenue plateaued because two large fixed-fee builds slipped into Q2 by client choice; both are de-risked and signed. The SaaS line is small in absolute terms but growing 53% YoY and now contributes 10% of total revenue with 70%+ gross margin, which is starting to materially move the blended margin.',

  includeRisksBlock: true,
  risks: 'Two concentration risks worth flagging: (1) Top-3 clients now contribute 41% of retainer revenue — we should target diversification in Q2-Q3. (2) Contractor costs dropped because we converted 3 long-running freelancers to FTE; this stabilises capacity but raises fixed cost run-rate by ~INR 4 Cr annualised. Currency exposure has grown with the SaaS line (60% USD-denominated) — board to discuss hedging policy.',

  includeOutlookBlock: true,
  outlook: 'Q2 plan stands at INR 5.3 Cr revenue with the two slipped projects landing in the first half. Pipeline coverage is 2.4x against plan, which is healthy. Two strategic priorities for the half: (a) bring SaaS gross margin to 75%+ by re-platforming the analytics stack off third-party billed APIs, (b) launch the formal partner-channel programme with a target of 3 signed partners by end-September.',

  preparedBy: {
    name: 'Nikhil Sharma',
    title: 'Head of Finance',
  },
  reviewedBy: {
    name: 'Alex Hartwell',
    title: 'CEO',
  },

  includeSignatureBlock: true,
}

let nextId = 1000

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  void findReportPeriod(data.periodId)
  void findReportStatus(data.statusId)
  void findAudience(data.audienceId)
  const totals = useMemo(() => computeTotals(data), [data])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setCompanyField = (k) => (v) => setData((s) => ({ ...s, company: { ...s.company, [k]: v } }))
  const setPrepField    = (k) => (v) => setData((s) => ({ ...s, preparedBy: { ...s.preparedBy, [k]: v } }))
  const setRevField     = (k) => (v) => setData((s) => ({ ...s, reviewedBy: { ...s.reviewedBy, [k]: v } }))

  const setKpis     = (items) => setData((s) => ({ ...s, kpis:     items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const setRevenue  = (items) => setData((s) => ({ ...s, revenue:  items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const setExpenses = (items) => setData((s) => ({ ...s, expenses: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))

  const setHighlight = (idx, value) => setData((s) => {
    const next = [...(s.highlights || [])]
    next[idx] = value
    return { ...s, highlights: next }
  })
  const addHighlight = () => setData((s) => ({ ...s, highlights: [...(s.highlights || []), ''] }))
  const removeHighlight = (idx) => setData((s) => ({ ...s, highlights: (s.highlights || []).filter((_, i) => i !== idx) }))

  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    kpis:     data.kpis.map(({ id, ...rest }) => rest),
    revenue:  data.revenue.map(({ id, ...rest }) => rest),
    expenses: data.expenses.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateFinancialReportPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateFinancialReportXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
              <ReportIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Report · {data.kpis.length} KPIs · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Report #" value={data.reportNumber} onChange={setField('reportNumber')} mono />
          <DateInput label="Prepared on" value={data.preparedDate} onChange={setField('preparedDate')} />
        </div>
        <div className="mt-2">
          <TextInput label="Report title" value={data.reportTitle} onChange={setField('reportTitle')} />
        </div>
        <div className="mt-2">
          <TextInput label="Period label" value={data.periodLabel} onChange={setField('periodLabel')} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_1fr_120px_1fr] gap-2">
          <SelectInput label="Frequency" value={data.periodId} onChange={setField('periodId')}
            options={REPORT_PERIODS.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Audience" value={data.audienceId} onChange={setField('audienceId')}
            options={AUDIENCES.map((a) => ({ value: a.id, label: a.label }))} />
          <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          <SelectInput label="Status" value={data.statusId} onChange={setField('statusId')}
            options={REPORT_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Company */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Company</span>
        <div className="space-y-2">
          <TextInput label="Company name" value={data.company.name} onChange={setCompanyField('name')} />
          <TextareaInput label="Address" value={data.company.address} onChange={setCompanyField('address')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email"   value={data.company.email}   onChange={setCompanyField('email')}   mono />
            <TextInput label="Website" value={data.company.website} onChange={setCompanyField('website')} mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Executive summary */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Executive summary</span>
        <TextareaInput label="2–4 sentence headline summary" value={data.executiveSummary} onChange={setField('executiveSummary')} rows={4} />

        <div className="my-3.5 h-px bg-line" />

        {/* Highlights */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Key highlights</span>
          <button type="button" onClick={addHighlight}
            className="inline-flex items-center gap-1 rounded-md bg-business-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-business transition-colors hover:bg-business/20">
            <Plus size={9} /> Add
          </button>
        </div>
        <div className="space-y-1.5">
          {(data.highlights || []).map((h, i) => (
            <div key={i} className="grid grid-cols-[14px_1fr_22px] items-center gap-1.5">
              <span className="text-center font-mono text-[10px] text-business">•</span>
              <input type="text" value={h}
                onChange={(e) => setHighlight(i, e.target.value)}
                placeholder="Bullet (e.g. Revenue INR 4.85 Cr — up 18% YoY)"
                className="min-h-[30px] rounded-md border border-line bg-paper px-2 py-1 text-[12.5px] text-ink-950 outline-none focus:border-business/60" />
              <button type="button" onClick={() => removeHighlight(i)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* KPIs */}
        <KpiList items={data.kpis} setItems={setKpis} />

        <div className="my-3.5 h-px bg-line" />

        {/* Revenue */}
        <PnlList title="Revenue lines" items={data.revenue} setItems={setRevenue} />

        <div className="my-3.5 h-px bg-line" />

        {/* Expenses */}
        <PnlList title="Expense lines" items={data.expenses} setItems={setExpenses} />

        <div className="my-3.5 h-px bg-line" />

        {/* Narrative sections */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Narrative blocks</span>
        <div className="space-y-2">
          <ToggleRow label="Highlights bullets" desc="Above the headline cards"
            checked={data.includeHighlightsBlock} onChange={setField('includeHighlightsBlock')} />
          <ToggleRow label="Commentary block" desc="Why the numbers moved"
            checked={data.includeCommentaryBlock} onChange={setField('includeCommentaryBlock')} />
          <ToggleRow label="Risks & watch-outs" desc="Things the board should know"
            checked={data.includeRisksBlock} onChange={setField('includeRisksBlock')} />
          <ToggleRow label="Outlook & next period" desc="Forward plan"
            checked={data.includeOutlookBlock} onChange={setField('includeOutlookBlock')} />
          <ToggleRow label="Signature block" desc="Prepared by + reviewed by"
            checked={data.includeSignatureBlock} onChange={setField('includeSignatureBlock')} />
        </div>
        {data.includeCommentaryBlock && (
          <div className="mt-2">
            <TextareaInput label="Commentary" value={data.commentary} onChange={setField('commentary')} rows={4} />
          </div>
        )}
        {data.includeRisksBlock && (
          <div className="mt-2">
            <TextareaInput label="Risks & watch-outs" value={data.risks} onChange={setField('risks')} rows={4} />
          </div>
        )}
        {data.includeOutlookBlock && (
          <div className="mt-2">
            <TextareaInput label="Outlook" value={data.outlook} onChange={setField('outlook')} rows={4} />
          </div>
        )}

        {data.includeSignatureBlock && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Prepared by · name"  value={data.preparedBy?.name}  onChange={setPrepField('name')} />
              <TextInput label="Prepared by · title" value={data.preparedBy?.title} onChange={setPrepField('title')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Reviewed by · name"  value={data.reviewedBy?.name}  onChange={setRevField('name')} />
              <TextInput label="Reviewed by · title" value={data.reviewedBy?.title} onChange={setRevField('title')} />
            </div>
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Totals */}
        <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Revenue</span>
            <span className="text-ink-950">{formatNumber(totals.totalRevenueCurrent)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Expenses</span>
            <span className="text-ink-950">- {formatNumber(totals.totalExpenseCurrent)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Gross margin</span>
            <span className="text-ink-950">{formatNumber(totals.grossMarginCurrent)}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Net income</span>
            <span className={`font-mono text-[14px] font-bold ${totals.netIncomeCurrent >= 0 ? 'text-business' : 'text-danger'}`}>
              {cur.code} {formatNumber(totals.netIncomeCurrent)}
            </span>
          </div>
          {totals.netDelta != null && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500 italic">vs prior</span>
              <span className={`italic ${totals.netDelta >= 0 ? 'text-success' : 'text-danger'}`}>
                {totals.netDelta >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(totals.netDelta))}%
              </span>
            </div>
          )}
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-business/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-business">Net income this period</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.periodLabel || ''}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.netIncomeCurrent, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Financial Report PDF'}
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
      <div className="h-1 rounded-t-md bg-business" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">Brigade Road, Bengaluru 560001</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[14px] font-bold tracking-[-0.01em] text-business">FINANCIAL REPORT</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">FR-2026-Q1 · Quarterly</p>
            <p className="m-0 text-[9px] text-ink-500">Q1 FY 2026-27</p>
            <span className="mt-1 inline-block rounded bg-warning px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-white">BOARD REVIEW</span>
          </div>
        </div>

        <div className="mt-4 h-px bg-business/40" />

        <p className="m-0 mt-3 text-[10px] leading-[1.5] text-ink-700">
          Q1 closed 14.2% ahead of revenue plan, driven by stronger-than-expected pickup in our retainer book and a clean cohort of three new logos in the SaaS vertical.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded border border-line bg-canvas p-2">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-business-dk">REVENUE</p>
            <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">INR 4.85 Cr</p>
            <p className="m-0 text-[8px] text-success font-bold">▲ 17.7% vs prior</p>
          </div>
          <div className="rounded border border-line bg-canvas p-2">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-business-dk">EXPENSES</p>
            <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">INR 2.79 Cr</p>
            <p className="m-0 text-[8px] text-danger font-bold">▲ 11.3% vs prior</p>
          </div>
          <div className="rounded bg-business p-2 text-white">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em]">NET INCOME</p>
            <p className="m-0 mt-1 text-[12px] font-bold">INR 2.06 Cr</p>
            <p className="m-0 text-[8px] font-bold">▲ 27.2% vs prior</p>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_50px_50px_30px] gap-1 bg-business px-1.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white">
            <span>KPI</span>
            <span className="text-right">CURR</span>
            <span className="text-right">PRIOR</span>
            <span className="text-right">Δ</span>
          </div>
          {[
            ['ARR',                'INR 17.8 Cr', 'INR 15.2 Cr', '▲ 17%', true],
            ['Gross margin',       '47.0%',        '46.4%',       '▲ 1%',  true],
            ['Net retention',      '118%',         '109%',        '▲ 8%',  true],
            ['New logos',          '3',            '2',           '▲ 50%', true],
            ['CAC',                'INR 4.25L',    'INR 4.88L',   '▼ 13%', true],
            ['DSO',                '41 days',      '47 days',     '▼ 13%', true],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_50px_50px_30px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="truncate">{r[0]}</span>
              <span className="text-right">{r[1]}</span>
              <span className="text-right text-ink-500">{r[2]}</span>
              <span className={`text-right text-[7px] font-bold ${r[4] ? 'text-success' : 'text-danger'}`}>{r[3]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ revenue / expense breakdowns, commentary, risks, outlook, and signatures in the full PDF</p>
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
            Spreadsheet rows in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            board-ready report out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Headline cards with Δ% callouts, KPI table with prior + target columns, revenue and expense breakdowns, executive summary, commentary, risks, outlook — all formatted into a branded PDF that can go straight to leadership or the board.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
                    <ReportIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Report Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  7 KPIs · INR
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Report #',      'FR-2026-Q1'],
                  ['Period',        'Q1 FY 2026-27'],
                  ['Audience',      'Board of directors'],
                  ['Revenue',       'INR 4.85 Cr (▲ 18% YoY)'],
                  ['Expenses',      'INR 2.79 Cr'],
                  ['Net income',    'INR 2.06 Cr'],
                  ['Gross margin',  '47.0%'],
                  ['Net retention', '118%'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-business/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Net income</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 2.06 Cr</span>
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
                  Board-ready
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
  ['01', 'Set the frame',         'Period (monthly / quarterly / annual), audience (leadership / board / investors), report title, status (draft / internal / board review / final).'],
  ['02', 'Populate the numbers',  'KPI rows with current + prior + target. Revenue lines and expense categories with current + prior. The tool computes every Δ% and the headline cards automatically.'],
  ['03', 'Add the narrative',     'Executive summary, bulleted highlights, commentary on why the numbers moved, risks and watch-outs, outlook for next period. Sign off as preparer + reviewer.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From close{' '}
              <em className="font-serif font-normal italic text-crimson-300">to circulated report.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most financial-report packs are 30-minute slideshow exercises padded into 25 pages. This tool inverts the ratio: enter the numbers and narrative once, get a single tight PDF designed to be read in five minutes by busy decision-makers. Every metric carries its Δ% so context lives next to value.
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
  { title: 'Headline 3-up cards',       desc: 'Revenue, expenses, net income in colour cards at the top of page 1. Each card carries the Δ% vs prior period. The reader\'s eye lands on net income first.' },
  { title: 'KPI table with target',     desc: 'Every KPI gets current, prior, and target columns plus Δ%. Pick "up is good" or "down is good" per metric — CAC and DSO get green when they drop.' },
  { title: 'Revenue vs expense break',  desc: 'Two parallel tables: revenue by line and expenses by category. Each row carries current + prior + Δ%. Total bar in business teal at the bottom.' },
  { title: 'Narrative blocks',           desc: 'Executive summary at the top. Below the numbers: commentary, risks & watch-outs, outlook for next period. Each block is optional — keep the report as tight as you want.' },
  { title: 'Audience-aware framing',    desc: 'Pick leadership / board / investors / partners / internal. The audience tag is stamped on the PDF and influences the tone we suggest for commentary.' },
  { title: 'PDF + 5-sheet XLSX',        desc: 'PDF: branded header, exec summary, headline cards, KPI table, revenue & expense tables, gross-margin strip, narrative blocks, signature. XLSX: Summary, KPIs, Revenue, Expenses, Narrative.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for leadership</Eyebrow>
          <SectionTitle>
            Every page the{' '}
            <em className="font-serif font-normal italic text-crimson-300">board reads.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-business/20 bg-business-bg text-business">
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
  { q: 'How is this different from the Monthly Financial Summary tool?',  a: 'The Monthly Financial Summary is a single-page roll-up — revenue, expenses, net for one month. This Financial Report Generator is the longer-form management report: headline cards + KPI table + revenue/expense breakdowns + multi-paragraph narrative (executive summary, commentary, risks, outlook). Use the Summary for ops-level visibility; use this for board, investor, or leadership reviews.' },
  { q: 'Should every KPI have a target?',                                  a: 'No — leave it blank if there\'s no formal target. The PDF renders a dash and the Δ-vs-target column simply skips. Targets are most useful for KPIs that finance and leadership have explicitly committed to (revenue plan, margin floor, CAC ceiling, retention target). For exploratory or new metrics, current vs prior is enough.' },
  { q: 'What does "good direction" do?',                                    a: 'It controls Δ% colour. For revenue, ARR, retention, margin — up is good, so a positive delta prints green. For CAC, DSO, churn, costs — down is good, so a drop prints green and a rise prints red. The reader doesn\'t have to reason about whether the arrow direction is favourable; the colour already encodes that.' },
  { q: 'Can I use this for non-financial reports too?',                    a: 'It\'s structured around revenue / expense / net income, so it works best for financial or financial-adjacent reports (sales review, marketing performance, ops scorecards with money metrics). For purely operational reports, you can repurpose the revenue table for "delivered" metrics and expenses for "cost-side" metrics, but the headline cards always assume money figures.' },
  { q: 'How long should commentary be?',                                    a: 'For a quarterly board report: 4–6 sentences per block (commentary, risks, outlook). The PDF flows across pages cleanly but the value comes from being readable in 5 minutes, not 50. If you find yourself writing 10+ sentences in commentary, split into commentary + a separate risks block.' },
  { q: 'Output formats?',                                                    a: 'PDF (top accent stripe, branded header, FINANCIAL REPORT block top-right with report # / title / period / frequency / prepared date / audience / status badge, executive summary at top, 3-up headline cards with Δ% callouts, optional highlights bullets, KPI table with current/prior/target/Δ%, revenue breakdown with totals, expense breakdown with totals, gross-margin strip, optional commentary / risks / outlook narrative blocks, optional dual-signature block, confidential footer) and XLSX (5 sheets: Summary, KPIs, Revenue, Expenses, Narrative).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">financial reports.</em>
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
  { name: 'Monthly Financial Summary', desc: 'One-page month-end roll-up.',                Icon: ReportIcon,    label: 'ACCOUNTING', path: '/tools/monthly-financial-summary' },
  { name: 'Profit & Loss Statement',   desc: 'Formal P&L from your CSV or trial balance.',  Icon: PnlIcon,       label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
  { name: 'Cash Flow Statement',       desc: 'Operating / investing / financing breakdown.', Icon: CashFlowIcon, label: 'ACCOUNTING', path: '/tools/cash-flow-statement' },
  { name: 'Balance Sheet Generator',   desc: 'Tied-out, PDF-exported balance sheet.',        Icon: BalanceIcon,   label: 'ACCOUNTING', path: '/tools/balance-sheet-generator' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-business">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-business-bg text-business">
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

export default function FinancialReportGeneratorPage() {
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
