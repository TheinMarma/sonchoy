'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  PercentIcon, ReportIcon, PayrollIcon, VatIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, TAX_TYPES, STATUSES, SORT_MODES, REPORT_PURPOSES,
  findCurrency, findTaxType, findStatus, findSortMode, findReportPurpose,
  computeSummary, buildTypeSummary, buildJurisdictionSummary, buildOverdueList, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/taxSummaryReport/compute'
import { generateTaxSummaryReportPdf } from '@/lib/taxSummaryReport/generatePdf'
import { generateTaxSummaryReportXlsx } from '@/lib/taxSummaryReport/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Tax Summary Report"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['9',         'Tax types covered'],
  ['Status',    'Auto-derived'],
  ['Overdue',   'Block + alert'],
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
            <span className="text-ink-950">Tax Summary Report</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(129,140,248,0.25)]" />
            Accounting · Cross-tax overview
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Every tax,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              every jurisdiction,
            </em>
            <br />
            on{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              one page.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Income tax, GST, sales tax, payroll, TDS, property — all in one cross-tax view. See what you collected, owe, remitted, and still owe — with overdue items called out in red and status auto-derived from the numbers.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Overdue alert built in</span>
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

/* ---------- ObligationList ---------- */

const STATUS_OPTIONS = [
  { value: 'auto',     label: 'Auto (from numbers)' },
  ...STATUSES.map((s) => ({ value: s.id, label: s.label })),
]

function ObligationList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    {
      id: Date.now() + Math.random(),
      taxTypeId: 'gst', jurisdiction: '', period: '', dueDate: todayISO(),
      reference: '', collected: 0, owed: 0, remitted: 0, statusId: 'auto',
    },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">Tax obligations ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20">
          <Plus size={9} /> Add obligation
        </button>
      </div>
      <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
        {items.map((r) => {
          const balance = Math.max(0, (Number(r.owed) || 0) - (Number(r.remitted) || 0))
          return (
            <div key={r.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
                <select value={r.taxTypeId}
                  onChange={(e) => update(r.id, { taxTypeId: e.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-accounting/60">
                  {TAX_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
                </select>
                <button type="button" onClick={() => remove(r.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <input type="text" value={r.jurisdiction || ''}
                  onChange={(e) => update(r.id, { jurisdiction: e.target.value })}
                  placeholder="Jurisdiction (e.g. India · Centre)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="text" value={r.period || ''}
                  onChange={(e) => update(r.id, { period: e.target.value })}
                  placeholder="Period (e.g. Q2 2026)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <input type="date" value={r.dueDate || ''}
                  onChange={(e) => update(r.id, { dueDate: e.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none [color-scheme:dark] focus:border-accounting/60" />
                <input type="text" value={r.reference || ''}
                  onChange={(e) => update(r.id, { reference: e.target.value })}
                  placeholder="Reference / challan no."
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                <input type="number" step="any" value={r.collected || 0}
                  onChange={(e) => update(r.id, { collected: Number(e.target.value) || 0 })}
                  placeholder="Collected"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={r.owed || 0}
                  onChange={(e) => update(r.id, { owed: Number(e.target.value) || 0 })}
                  placeholder="Owed"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={r.remitted || 0}
                  onChange={(e) => update(r.id, { remitted: Number(e.target.value) || 0 })}
                  placeholder="Remitted"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              </div>
              <div className="mt-1.5 grid grid-cols-[1fr_140px] gap-1.5">
                <div className="flex items-center justify-between rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[10.5px]">
                  <span className="text-ink-500">Balance</span>
                  <span className={`font-bold ${balance > 0 ? 'text-crimson-400' : 'text-success'}`}>{formatNumber(balance)}</span>
                </div>
                <select value={r.statusId || 'auto'}
                  onChange={(e) => update(r.id, { statusId: e.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60">
                  {STATUS_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  reportTitle: 'Tax Summary Report — Q2 2026',
  reference: 'TSR-2026-Q2-0042',
  entityName: 'Sonchoy Studio Pvt Ltd',
  periodLabel: 'Quarter ended 30 Jun 2026',
  reportDate: todayISO(),
  purposeId: 'quarterly',
  sortMode: 'status',
  currency: 'INR',

  rows: [
    { id: 1, taxTypeId: 'gst',     jurisdiction: 'India · CGST + SGST',  period: 'May 2026',  dueDate: '2026-06-20', reference: 'GSTR-3B/2026-05', collected: 484500, owed: 484500, remitted: 484500, statusId: 'auto' },
    { id: 2, taxTypeId: 'gst',     jurisdiction: 'India · IGST',         period: 'May 2026',  dueDate: '2026-06-20', reference: 'GSTR-3B/2026-05', collected: 162000, owed: 162000, remitted: 162000, statusId: 'auto' },
    { id: 3, taxTypeId: 'tds',     jurisdiction: 'India · 26Q',          period: 'May 2026',  dueDate: '2026-06-07', reference: 'TDS-26Q-MAY26',   collected: 0,      owed: 84500,  remitted: 84500,  statusId: 'auto' },
    { id: 4, taxTypeId: 'payroll', jurisdiction: 'India · PF',           period: 'May 2026',  dueDate: '2026-06-15', reference: 'PF-MAY26',        collected: 0,      owed: 138600, remitted: 138600, statusId: 'auto' },
    { id: 5, taxTypeId: 'payroll', jurisdiction: 'India · ESI',          period: 'May 2026',  dueDate: '2026-06-15', reference: 'ESI-MAY26',       collected: 0,      owed: 18937,  remitted: 18937,  statusId: 'auto' },
    { id: 6, taxTypeId: 'tds',     jurisdiction: 'India · 24Q',          period: 'Q1 2026',   dueDate: '2026-07-31', reference: 'TDS-24Q-Q1-26',   collected: 0,      owed: 195000, remitted: 0,      statusId: 'auto' },
    { id: 7, taxTypeId: 'income',  jurisdiction: 'India · Advance tax',  period: 'Q1 2026',   dueDate: '2026-06-15', reference: 'AT-Q1-26',        collected: 0,      owed: 425000, remitted: 425000, statusId: 'auto' },
    { id: 8, taxTypeId: 'gst',     jurisdiction: 'India · CGST + SGST',  period: 'Jun 2026',  dueDate: '2026-07-20', reference: 'GSTR-3B/2026-06', collected: 0,      owed: 0,      remitted: 0,      statusId: 'auto' },
    { id: 9, taxTypeId: 'sales',   jurisdiction: 'US · California',      period: 'Q2 2026',   dueDate: '2026-07-31', reference: 'CDTFA-Q2-26',     collected: 412000, owed: 412000, remitted: 0,      statusId: 'auto' },
    { id: 10, taxTypeId: 'property', jurisdiction: 'India · Bengaluru',  period: 'FY 25/26',  dueDate: '2026-04-30', reference: 'BBMP-PROP-2526',   collected: 0,      owed: 28500,  remitted: 0,      statusId: 'auto' },
    { id: 11, taxTypeId: 'tds',     jurisdiction: 'India · 26Q',         period: 'Jun 2026',  dueDate: '2026-07-07', reference: 'TDS-26Q-JUN26',   collected: 0,      owed: 92000,  remitted: 0,      statusId: 'auto' },
  ],

  includeTypeSummary: true,
  includeJurisdictionSummary: true,
  includeOverdueBlock: true,

  notes: 'Q2 2026 cross-tax review. Two items overdue: BBMP property tax (filed late) and Q1 24Q TDS return (pending lodgement). California sales tax Q2 filing prepared but not yet remitted — deadline 31 Jul. Otherwise current on monthly GST and PF/ESI.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const purpose = useMemo(() => findReportPurpose(data.purposeId), [data.purposeId])
  const result = useMemo(() => computeSummary(data), [data])
  const typeSummary = useMemo(() => buildTypeSummary(result.rows), [result.rows])
  const overdueList = useMemo(() => buildOverdueList(result.rows), [result.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setRows = (items) => setData((s) => ({ ...s, rows: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    rows: data.rows.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateTaxSummaryReportPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateTaxSummaryReportXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <PercentIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Tax summary · {data.rows.length} obligations · {sections} sections
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
          <DateInput label="As at"       value={data.reportDate}  onChange={setField('reportDate')} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
          <TextInput label="Entity name" value={data.entityName} onChange={setField('entityName')} />
          <SelectInput label="Currency"  value={data.currency}   onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput  label="Period label" value={data.periodLabel} onChange={setField('periodLabel')} />
          <SelectInput label="Purpose"     value={data.purposeId}   onChange={setField('purposeId')}
            options={REPORT_PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>
        <div className="mt-2">
          <SelectInput label="Sort obligations by" value={data.sortMode} onChange={setField('sortMode')}
            options={SORT_MODES.map((m) => ({ value: m.id, label: m.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Obligations */}
        <ObligationList items={data.rows} setItems={setRows} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Optional sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="By tax type"        desc="Roll up collected / owed / remitted per tax type"
            checked={data.includeTypeSummary}     onChange={setField('includeTypeSummary')} />
          <ToggleRow label="By jurisdiction"     desc="Roll up by jurisdiction (state / country / authority)"
            checked={data.includeJurisdictionSummary} onChange={setField('includeJurisdictionSummary')} />
          <ToggleRow label="Overdue alert block" desc="Red-highlighted list of past-due obligations"
            checked={data.includeOverdueBlock}    onChange={setField('includeOverdueBlock')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Tax owed</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(result.totals.owed)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Outstanding</p>
            <p className={`m-0 mt-1 font-mono text-[13px] font-semibold ${result.totals.balance > 0 ? (result.overdueBalance > 0 ? 'text-crimson-400' : 'text-yellow-600') : 'text-success'}`}>
              {formatNumber(result.totals.balance)}
            </p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <div className="rounded-lg border border-crimson-500/40 bg-crimson-500/10 px-2.5 py-2">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-crimson-400">Overdue</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-crimson-400">{result.statusCounts.overdue || 0}</p>
          </div>
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-2">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-yellow-600">Pending</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-yellow-600">{(result.statusCounts.pending || 0) + (result.statusCounts.partial || 0)}</p>
          </div>
          <div className="rounded-lg border border-success/40 bg-success/10 px-2.5 py-2">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-success">Paid</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-success">{(result.statusCounts.paid || 0) + (result.statusCounts.filed || 0)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-2.5 py-2">
            <p className="m-0 font-mono text-[8px] uppercase tracking-[0.1em] text-ink-500">Total</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-ink-950">{result.rows.length}</p>
          </div>
        </div>

        {result.overdueBalance > 0 && (
          <div className="mt-2 rounded-lg border border-crimson-500/40 bg-crimson-500/10 px-3 py-2.5">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-crimson-400 font-bold">⚠ {overdueList.length} overdue obligation{overdueList.length === 1 ? '' : 's'}</span>
              <span className="font-bold text-crimson-400">{cur.code} {formatNumber(result.overdueBalance)}</span>
            </div>
          </div>
        )}

        {/* Type preview */}
        {typeSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              By tax type
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Type</th>
                    <th className="py-1 text-right font-normal">Owed</th>
                    <th className="py-1 text-right font-normal">Remitted</th>
                    <th className="py-1 text-right font-normal">Balance</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {typeSummary.map((t) => (
                    <tr key={t.taxTypeId} className="border-t border-line">
                      <td className="py-1 text-ink-700">{t.label}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(t.owed)}</td>
                      <td className="py-1 text-right text-success">{formatNumber(t.remitted)}</td>
                      <td className={`py-1 text-right font-bold ${t.balance > 0 ? 'text-crimson-400' : 'text-success'}`}>
                        {formatNumber(t.balance)}
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">Outstanding balance</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.periodLabel || 'period'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(result.totals.balance, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Filing context, escalations, audit references…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Tax Summary PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (4–5 sheets) <ArrowRight size={10} /></>)}
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
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">TAX SUMMARY REPORT</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Tax Summary — Q2 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Sonchoy Studio Pvt Ltd · 11 obligations · 5 tax types</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-accounting" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['OWED',         'INR 20.4L'],
            ['REMITTED',     'INR 13.1L'],
            ['OUTSTANDING',  'INR 7.3L'],
            ['OVERDUE',      '2'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-accounting">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">TAX OBLIGATIONS</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[80px_1fr_50px_70px] gap-1 bg-accounting/15 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-accounting">
            <span>TYPE</span><span>JURISDICTION</span>
            <span className="text-right">DUE</span>
            <span className="text-right">STATUS</span>
          </div>
          {[
            ['Property',  'BBMP, Bengaluru',     '30 Apr', 'Overdue',   'text-crimson-400'],
            ['TDS 24Q',   'India · Quarterly',   '31 Jul', 'Pending',   'text-yellow-600'],
            ['Sales tax', 'California (CDTFA)',  '31 Jul', 'Pending',   'text-yellow-600'],
            ['TDS 26Q',   'India · Monthly',     '07 Jul', 'Pending',   'text-yellow-600'],
            ['GST',       'India · CGST+SGST',   '20 Jun', 'Paid',      'text-success'],
            ['PF / ESI',  'India · EPFO',        '15 Jun', 'Paid',      'text-success'],
            ['Income tax', 'India · Advance Q1', '15 Jun', 'Paid',      'text-success'],
          ].map((r) => (
            <div key={r[1]} className="grid grid-cols-[80px_1fr_50px_70px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-700">{r[0]}</span>
              <span className="truncate">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className={`text-right font-bold ${r[4]}`}>{r[3]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-crimson-400">⚠ OVERDUE TAXES (2)</p>
        <div className="mt-1 rounded border border-crimson-500/30 bg-crimson-500/5 px-2 py-1.5 text-[9px]">
          <p className="m-0 text-crimson-400 font-bold">Total overdue: INR 28,500</p>
          <p className="m-0 mt-0.5 text-ink-700">BBMP property tax — due 30 Apr 2026 (52 days overdue)</p>
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
            Every tax in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            one cross-tax view out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Income tax, GST, payroll, sales tax, TDS, property — all tax obligations in one place with collected / owed / remitted columns, overdue flags, and rollups by type and jurisdiction.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <PercentIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Tax Summary Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Q2 2026 · 11 items
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Entity',          'Sonchoy Studio Pvt Ltd'],
                  ['Period',          'Q2 2026'],
                  ['Tax types',       '5 (GST, TDS, payroll, income, sales)'],
                  ['Jurisdictions',   '6 across India & US'],
                  ['Total owed',      'INR 20,40,537'],
                  ['Remitted',        'INR 13,13,037'],
                  ['Outstanding',     'INR 7,27,500'],
                  ['Overdue',         '2 (₹28,500)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Outstanding</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 7,27,500</span>
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
  ['01', 'List your obligations', 'Per tax: type, jurisdiction, period, due date, reference, collected, owed, remitted. Status is auto-derived from the numbers.'],
  ['02', 'See the picture',        'Outstanding balance, count of overdue / pending / paid, rollup by tax type and jurisdiction. Overdue items called out in red.'],
  ['03', 'Export PDF + XLSX',      'PDF: summary cards, status dashboard, full table, type and jurisdiction rollups, overdue alert. XLSX: 4–5 sheets numeric.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              All taxes,{' '}
              <em className="font-serif font-normal italic text-crimson-300">one dashboard.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most tax tools focus on a single tax type. This one zooms out: every type, every jurisdiction, every period — across India, US states, EU VAT, whatever you owe. The view your CFO actually wants on the 5th of every month.
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
  { title: '9 tax types',               desc: 'Corporate income, GST/VAT, sales tax, payroll, TDS, property, excise, capital gains, other. Mix as many types as you owe.' },
  { title: 'Auto-derived status',        desc: 'Status (paid / partial / pending / overdue / filed) computed from owed, remitted, and due date. Override per row when needed.' },
  { title: 'Overdue alert block',        desc: 'Red-highlighted block showing all past-due obligations with balance, due date, and reference. Catches what slips through the cracks.' },
  { title: 'Two rollups',                desc: 'By tax type (income / GST / payroll) and by jurisdiction (India centre / state / US / UK). Two ways to slice the same data.' },
  { title: '4 sort modes',                desc: 'Due date ascending, owed amount descending, by tax type, or status (overdue first). Reorder for whatever conversation you\'re having.' },
  { title: 'PDF + 4-sheet XLSX',         desc: 'PDF: summary cards + status dashboard + full table + rollups + overdue block. XLSX: Summary, Obligations, By Type, By Jurisdiction, Overdue.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for compliance teams</Eyebrow>
          <SectionTitle>
            Every deadline{' '}
            <em className="font-serif font-normal italic text-crimson-300">— tracked.</em>
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
  { q: 'How is this different from the specific tax tools?',          a: 'Tools like GST Calculation Sheet, Payroll Tax Report, and Sales Tax Report compute one tax type in detail. This Summary Report rolls all of them up into a cross-tax view — what you collected, owe, and remitted across every tax obligation. Use the specific tools to prepare; use this one to oversee.' },
  { q: 'What does "auto status" do?',                                 a: 'It computes status from your numbers: balance ≤ 0 → "Paid"; owed = 0 → "Filed (no payment)"; remitted > 0 but balance > 0 → "Partial"; due date in the past with balance > 0 → "Overdue"; otherwise "Pending". Override per row if your workflow uses different labels.' },
  { q: 'What\'s "collected" vs "owed"?',                              a: 'Collected = tax you collected on behalf of the authority (GST/VAT on sales, sales tax, employee withholding). Owed = total liability for the period (collected from customers + your own contribution like employer PF/ESI or corporate income tax). They\'re the same number for some taxes (sales tax) and different for others (payroll, income tax).' },
  { q: 'Why are there two summary rollups?',                          a: 'By tax type tells you which obligation is biggest (usually corporate income or payroll). By jurisdiction tells you who you owe (India centre, US California, UK HMRC). Both views matter for different conversations: tax planning vs filing prioritisation.' },
  { q: 'Can I use this across countries?',                            a: 'Yes. The jurisdiction column is free text and the tax types cover the major categories worldwide. Indian GST, US sales tax, UK VAT, EU IOSS, payroll in every jurisdiction — all fit. Use the jurisdiction field to label "India · IGST" or "US · CA" or "UK · HMRC PAYE."' },
  { q: 'Output formats?',                                              a: 'PDF (summary cards, status dashboard, full obligations table, by-type and by-jurisdiction rollups, overdue alert block, notes — auto-paginated) and XLSX (4–5 sheets: Summary, Obligations, By Type, By Jurisdiction, Overdue if any). All numeric.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">tax summaries.</em>
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
  { name: 'Payroll Summary Generator', desc: 'Multi-employee payroll summary.',         Icon: PayrollIcon, label: 'ACCOUNTING', path: '/tools/payroll-summary' },
  { name: 'GST Calculation Sheet',     desc: 'India GST workings with HSN/SAC.',         Icon: VatIcon,     label: 'TAX',        path: '/tools/gst-calculation-sheet' },
  { name: 'Sales Tax Report',          desc: 'US/CA sales-tax filings by state.',        Icon: PercentIcon, label: 'TAX',        path: '/tools/sales-tax-report' },
  { name: 'Payroll Tax Report',        desc: 'Employer withholding for filing.',          Icon: PayrollIcon, label: 'TAX',        path: '/tools/payroll-tax-report' },
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

export default function TaxSummaryReportTool() {
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
