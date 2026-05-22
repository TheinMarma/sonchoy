import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  ReportIcon, PnlIcon, BalanceIcon, ReconcileIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, LINE_TYPES, COMPARE_MODES,
  findCurrency, findLineType, findCompareMode,
  computeSummary, buildLineGroups, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/monthlyFinancialSummary/compute'
import { generateMonthlyFinancialSummaryPdf } from '../lib/monthlyFinancialSummary/generatePdf'
import { generateMonthlyFinancialSummaryXlsx } from '../lib/monthlyFinancialSummary/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Monthly Financial Summary"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[620px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['One page', 'Board-ready'],
  ['Compare',  'vs prior or budget'],
  ['KPIs',     'Margin · ratios · cash'],
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
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-accounting">Accounting</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Monthly Financial Summary</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(129,140,248,0.25)]" />
            Accounting · Board pack
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            One page,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              all the answers
            </em>
            <br />
            the board{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              actually reads.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Revenue, expenses, gross profit, net income, margins, cash position — all on one page, with variance vs prior month or budget and a highlights section for the things that matter most.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Variance analysis</span>
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

function LineList({ items, setItems, showCompare }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), category: '', typeId: 'revenue', actual: 0, compare: 0 },
  ])
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
        {items.map((l) => (
          <div key={l.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
              <input type="text" value={l.category || ''}
                onChange={(e) => update(l.id, { category: e.target.value })}
                placeholder="Line category (e.g. Service revenue)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-accounting/60" />
              <button type="button" onClick={() => remove(l.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className={`mt-1.5 grid gap-1.5 ${showCompare ? 'grid-cols-[1.2fr_1fr_1fr]' : 'grid-cols-[1.2fr_1fr]'}`}>
              <select value={l.typeId}
                onChange={(e) => update(l.id, { typeId: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60">
                {LINE_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
              <input type="number" step="any" value={l.actual}
                onChange={(e) => update(l.id, { actual: Number(e.target.value) || 0 })}
                placeholder="Actual"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              {showCompare && (
                <input type="number" step="any" value={l.compare}
                  onChange={(e) => update(l.id, { compare: Number(e.target.value) || 0 })}
                  placeholder="Prior / budget"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- HighlightsList ---------- */

function HighlightsList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items, { id: Date.now() + Math.random(), text: '' },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">Highlights ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20">
          <Plus size={9} /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((h) => (
          <div key={h.id} className="grid grid-cols-[1fr_22px] items-start gap-1.5">
            <textarea value={h.text || ''}
              onChange={(e) => update(h.id, { text: e.target.value })}
              placeholder="One-line highlight (e.g. Q1 enterprise pipeline grew 38%)"
              rows={2}
              className="min-h-[52px] rounded-md border border-line bg-paper px-2 py-1.5 text-[11.5px] leading-[1.4] text-ink-900 outline-none focus:border-accounting/60" />
            <button type="button" onClick={() => remove(h.id)} aria-label="Remove"
              className="mt-1 flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
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

const INITIAL = {
  reportTitle: 'Monthly Financial Summary — May 2026',
  reference: 'MFS-2026-05-0042',
  entityName: 'Sonchoy Studio Pvt Ltd',
  monthLabel: 'May 2026',
  currency: 'INR',
  compareMode: 'prior',

  lines: [
    // Revenue
    { id: 1, category: 'Service revenue',          typeId: 'revenue', actual: 2840000, compare: 2620000 },
    { id: 2, category: 'Recurring retainer',       typeId: 'revenue', actual: 480000,  compare: 480000  },
    { id: 3, category: 'Project milestone billing', typeId: 'revenue', actual: 215000,  compare: 180000  },
    // Cost of revenue
    { id: 4, category: 'Freelancer / contractor',  typeId: 'cogs',    actual: 320000,  compare: 285000  },
    { id: 5, category: 'Software / tooling',       typeId: 'cogs',    actual: 96000,   compare: 92000   },
    // Operating expenses
    { id: 6, category: 'Salaries & wages',         typeId: 'opex',    actual: 1450000, compare: 1410000 },
    { id: 7, category: 'Rent & utilities',         typeId: 'opex',    actual: 145000,  compare: 145000  },
    { id: 8, category: 'Marketing & advertising',  typeId: 'opex',    actual: 92000,   compare: 78000   },
    { id: 9, category: 'Travel & meals',           typeId: 'opex',    actual: 38500,   compare: 24000   },
    { id: 10, category: 'Professional fees',        typeId: 'opex',    actual: 45000,   compare: 35000   },
    // Tax / other
    { id: 11, category: 'Income tax provision',     typeId: 'tax',     actual: 412000,  compare: 380000  },
    { id: 12, category: 'Interest expense',         typeId: 'tax',     actual: 28500,   compare: 28500   },
  ],

  highlights: [
    { id: 21, text: 'Service revenue up 8.4% MoM, driven by two new enterprise retainers signed in late April.' },
    { id: 22, text: 'Operating margin compressed to 32% (from 33.5%) as marketing spend scaled ahead of Q2 launch.' },
    { id: 23, text: 'Freelancer spend up 12% — reviewing utilization vs full-time hire decision for Q3.' },
  ],

  includeKpis: true,
  includeCashPosition: true,
  includeHighlights: true,

  cashOpeningBalance: 845000,
  cashClosingBalance: 1162000,

  notes: 'Prepared for board pack — May 2026. Figures reflect provisional close as at 5 Jun 2026. Final audit-adjusted numbers will follow within 10 working days.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const compareMode = useMemo(() => findCompareMode(data.compareMode), [data.compareMode])
  const sum = useMemo(() => computeSummary(data), [data])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setLines = (items) => setData((s) => ({ ...s, lines: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const setHighlights = (items) => setData((s) => ({ ...s, highlights: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    lines: data.lines.map(({ id, ...rest }) => rest),
    highlights: data.highlights.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateMonthlyFinancialSummaryPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateMonthlyFinancialSummaryXlsx(buildPayload()) } finally { setBusy(null) } }

  const showCompare = compareMode.id !== 'none'

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <ReportIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Monthly summary · {data.lines.length} lines · {sections} sections
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
          <TextInput label="Month label" value={data.monthLabel}  onChange={setField('monthLabel')} placeholder="May 2026" />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
          <TextInput label="Entity name" value={data.entityName} onChange={setField('entityName')} />
          <SelectInput label="Currency"  value={data.currency}   onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>
        <div className="mt-2">
          <SelectInput label="Comparison column" value={data.compareMode} onChange={setField('compareMode')}
            options={COMPARE_MODES.map((m) => ({ value: m.id, label: m.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Lines */}
        <LineList items={data.lines} setItems={setLines} showCompare={showCompare} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Optional sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Key metrics block" desc="Gross / operating / net margin and expense ratio"
            checked={data.includeKpis} onChange={setField('includeKpis')} />
          <ToggleRow label="Cash position" desc="Opening, closing, and change in cash"
            checked={data.includeCashPosition} onChange={setField('includeCashPosition')} />
          <ToggleRow label="Highlights" desc="Bullet-list narrative for context"
            checked={data.includeHighlights} onChange={setField('includeHighlights')} />
        </div>

        {data.includeCashPosition && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <NumberInput label="Opening cash" value={data.cashOpeningBalance} onChange={setField('cashOpeningBalance')} suffix={cur.code} />
            <NumberInput label="Closing cash" value={data.cashClosingBalance} onChange={setField('cashClosingBalance')} suffix={cur.code} />
          </div>
        )}

        {data.includeHighlights && (
          <div className="mt-3">
            <HighlightsList items={data.highlights} setItems={setHighlights} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Revenue</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(sum.totals.revenue)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Net income</p>
            <p className={`m-0 mt-1 font-mono text-[13px] font-semibold ${sum.netIncome >= 0 ? 'text-success' : 'text-crimson-400'}`}>
              {sum.netIncome >= 0 ? '' : '-'}{formatNumber(Math.abs(sum.netIncome))}
            </p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-2.5 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Gross %</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(sum.grossMarginPct)}%</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-2.5 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Op %</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(sum.operatingMarginPct)}%</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-2.5 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Net %</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-accounting">{formatNumber(sum.netMarginPct)}%</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-2.5 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Exp %</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(sum.expenseRatioPct)}%</p>
          </div>
        </div>

        {/* Cash position live */}
        {data.includeCashPosition && (
          <div className="mt-2 rounded-lg border border-accounting/30 bg-accounting-bg/40 px-3 py-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-ink-500">Cash change</span>
              <span className={`font-bold ${sum.cashChange >= 0 ? 'text-success' : 'text-crimson-400'}`}>
                {sum.cashChange >= 0 ? '+' : '-'}{formatNumber(Math.abs(sum.cashChange))}
              </span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-accounting/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">Net income</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.monthLabel || 'this month'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {sum.netIncome >= 0 ? '' : '-'}{formatMoney(Math.abs(sum.netIncome), data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Provisional close caveats, audit timing, methodology…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Summary PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (2 sheets) <ArrowRight size={10} /></>)}
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

function SummaryMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-accounting" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">MONTHLY FINANCIAL SUMMARY</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Monthly Summary — May 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Sonchoy Studio Pvt Ltd · Comparison: prior month</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-accounting" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['REVENUE',    'INR 35.4L'],
            ['EXPENSES',   'INR 26.3L'],
            ['NET',        'INR 9.1L'],
            ['NET MARGIN', '25.7%'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-accounting">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">REVENUE &amp; EXPENSES</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_60px_60px_50px] gap-1 bg-accounting/15 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-accounting">
            <span>CATEGORY</span>
            <span className="text-right">ACTUAL</span>
            <span className="text-right">PRIOR</span>
            <span className="text-right">VAR%</span>
          </div>
          {[
            ['  Service revenue',         '28,40,000', '26,20,000', '+8.4%',  'good'],
            ['  Recurring retainer',      '4,80,000',  '4,80,000',  '0%',     ''],
            ['Revenue subtotal',          '35,35,000', '32,80,000', '+7.8%',  'good', true],
            ['  Freelancer / contractor', '3,20,000',  '2,85,000',  '+12%',   'bad'],
            ['  Salaries & wages',        '14,50,000', '14,10,000', '+2.8%',  'bad'],
            ['NET INCOME',                '9,11,000',  '8,75,500',  '+4.1%',  'good', true],
          ].map((r, i) => (
            <div key={i} className={`grid grid-cols-[1fr_60px_60px_50px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] ${r[5] ? 'bg-accounting/5 font-bold' : ''} ${r[0] === 'NET INCOME' ? 'border-t-2 border-accounting' : ''}`}>
              <span className={r[5] ? 'text-accounting' : 'text-ink-900'}>{r[0]}</span>
              <span className={`text-right ${r[5] ? 'text-success' : 'text-ink-900'}`}>{r[1]}</span>
              <span className="text-right text-ink-700">{r[2]}</span>
              <span className={`text-right font-bold ${r[4] === 'good' ? 'text-success' : r[4] === 'bad' ? 'text-crimson-400' : 'text-ink-500'}`}>{r[3]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">KEY METRICS</p>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {[
            ['GROSS',     '88.3%'],
            ['OP',        '32.0%'],
            ['NET',       '25.7%'],
            ['EXP RATIO', '74.3%'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-accounting/30 bg-accounting/5 px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-accounting">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
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
            Month-end numbers in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            board-pack page out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            One page that tells the whole story: revenue, expenses, gross profit, net income, key margins, cash position, and the highlights the founders care about — with prior-month or budget comparison built in.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <ReportIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Summary Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  May 2026 · vs prior
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Entity',         'Sonchoy Studio Pvt Ltd'],
                  ['Period',         'May 2026'],
                  ['Revenue',        'INR 35,35,000 (+7.8% MoM)'],
                  ['Cost of revenue', 'INR 4,16,000'],
                  ['Operating exp',  'INR 17,70,500'],
                  ['Tax / other',    'INR 4,40,500'],
                  ['Gross margin',   '88.3%'],
                  ['Net income',     'INR 9,08,000 (+3.8% MoM)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Net margin</span>
                <span className="font-mono text-[14px] font-semibold text-paper">25.7%</span>
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
              <SummaryMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the comparison',    'No comparison column, vs prior month, or vs budget. Variance and % change are computed for every line.'],
  ['02', 'Drop in the lines',       'Revenue lines, cost of revenue, operating expenses, tax / other. Subtotals roll up; gross profit and net income compute automatically.'],
  ['03', 'Export the page',         'PDF: summary cards, full P&L table with variance, KPI block, cash position, highlights, notes. XLSX: Summary + Lines sheets.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              The page the{' '}
              <em className="font-serif font-normal italic text-crimson-300">CFO emails</em> on the 5th.
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A board pack typically lands with a full P&L, balance sheet, cash flow, and a sprawling dashboard. Most readers only look at the first page — the one that says "here&rsquo;s where we are, here&rsquo;s how it compares, here&rsquo;s why." This tool produces that page in 5 minutes.
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
  { title: 'Four line types',          desc: 'Revenue, cost of revenue, operating expense, tax / other. Subtotals per group; gross profit, operating profit, and net income computed automatically.' },
  { title: 'Variance vs prior or budget', desc: 'Optional comparison column with absolute and percentage variance. Variance colour-coded green/red based on whether higher is "good" (revenue) or "bad" (expenses).' },
  { title: 'KPI block',                 desc: 'Gross margin, operating margin, net margin, expense ratio — four metrics, plus prior-period values where the comparison column is enabled.' },
  { title: 'Cash position',             desc: 'Opening balance, closing balance, change in cash. Brings the P&L and cash story onto the same page.' },
  { title: 'Highlights narrative',       desc: 'A bullet list of "what happened this month" — give the numbers context. The thing that turns a report into a story.' },
  { title: 'PDF + 2-sheet XLSX',        desc: 'PDF: summary cards + full table with subtotals + KPI block + cash position + highlights + notes. XLSX: Summary, Lines — numeric for further work.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for monthly close</Eyebrow>
          <SectionTitle>
            Numbers,{' '}
            <em className="font-serif font-normal italic text-crimson-300">in context.</em>
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
  { q: 'How is this different from the P&L Statement?',                 a: 'The P&L Statement is a formal financial statement with a strict format and full reporting layout. This Monthly Summary is a management report — one page, narrative-friendly, with KPIs and variance built in. Both have their place: the P&L for compliance, the summary for the board pack.' },
  { q: 'What\'s a good operating margin?',                              a: 'Varies wildly by sector. SaaS companies target 20–30% operating margins; agencies 15–25%; retail 5–10%; manufacturing 5–15%. The more useful question is whether your margin is improving or compressing month-over-month — which is exactly what the comparison column shows.' },
  { q: 'Should I include depreciation here?',                          a: 'If your management view is on operating cash, exclude depreciation (it\'s non-cash). If it\'s on accrual / GAAP earnings, include it as a separate opex line. The tool doesn\'t enforce either — match your accounting policy.' },
  { q: 'What\'s the "expense ratio"?',                                  a: 'Total expenses (cost of revenue + opex + tax) divided by revenue. It\'s the inverse of net margin: if expenses are 74% of revenue, net margin is 26%. Useful for tracking cost discipline trend over time.' },
  { q: 'Can I leave the comparison column off?',                       a: 'Yes — pick "No comparison column" from the dropdown. The actual numbers and KPIs still display; the variance columns are hidden. Useful for the very first month\'s report when you don\'t have a prior-period figure yet.' },
  { q: 'Output formats?',                                              a: 'PDF (single page with summary cards, line-item table with subtotals and variance, KPI block, cash position, highlights bullet list, notes — auto-paginates only if the highlights are very long) and XLSX (2 sheets: Summary, Lines). All numeric — paste straight into your existing model.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">monthly summaries.</em>
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
  { name: 'Profit & Loss Statement',     desc: 'Full formal P&L.',                       Icon: PnlIcon,       label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
  { name: 'Balance Sheet Generator',     desc: 'Assets, liabilities, equity tied out.',  Icon: BalanceIcon,   label: 'ACCOUNTING', path: '/tools/balance-sheet-generator' },
  { name: 'Income Statement Generator',  desc: 'Revenue, expenses, net income.',         Icon: ReportIcon,    label: 'ACCOUNTING', path: '/tools/income-statement-generator' },
  { name: 'Trial Balance Generator',     desc: 'Debits = credits, audit-ready.',         Icon: ReconcileIcon, label: 'ACCOUNTING', path: '/tools/trial-balance' },
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

export default function MonthlyFinancialSummaryPage() {
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
