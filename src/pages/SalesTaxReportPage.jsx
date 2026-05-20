import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  PercentIcon, VatIcon, PayrollIcon, EmiIcon, AmortIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, JURISDICTIONS, FILING_FREQUENCIES, REPORT_PURPOSES,
  findCurrency, findJurisdiction, findFilingFrequency, findReportPurpose,
  computeReport, buildStateSummary, buildCountySummary, buildRateSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/salesTaxReport/compute'
import { generateSalesTaxReportPdf } from '../lib/salesTaxReport/generatePdf'
import { generateSalesTaxReportXlsx } from '../lib/salesTaxReport/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Sales Tax Report"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[600px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['US+CA',     '30 jurisdictions'],
  ['4-tier',    'State / county / city / district'],
  ['By state',  'County · rate rollups'],
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
          style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 60%)' }} />
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
            <span className="text-tax">Tax &amp; Banking</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Sales Tax Report Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · US / Canada
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Sales tax{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — split by state,
            </em>
            <br />
            county and{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              local rate.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            A filing-ready sales-tax report for US and Canadian sellers. Every transaction split by state, county, city, and special-district rate — with rollups by jurisdiction, locality, and combined rate.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> 4-tier rate stack</span>
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
        className="h-4 w-4 shrink-0 cursor-pointer accent-tax" />
    </label>
  )
}

/* ---------- TransactionList ---------- */

function TransactionList({ items, setItems, defaultJurisdictionId }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    {
      id: Date.now() + Math.random(),
      date: todayISO(),
      invoiceNumber: '',
      jurisdictionId: defaultJurisdictionId || 'US-CA',
      county: '',
      grossSales: 0, exemptAmount: 0,
      stateRatePct: 0, countyRatePct: 0, cityRatePct: 0, specialRatePct: 0,
    },
  ])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">Sales transactions</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20">
          <Plus size={9} /> Add transaction
        </button>
      </div>
      <div className="space-y-2">
        {items.map((it) => {
          const taxable = Math.max(0, (Number(it.grossSales) || 0) - (Number(it.exemptAmount) || 0))
          const rate = (Number(it.stateRatePct) || 0) + (Number(it.countyRatePct) || 0)
                       + (Number(it.cityRatePct) || 0) + (Number(it.specialRatePct) || 0)
          const tax = (taxable * rate) / 100
          return (
            <div key={it.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
                <input type="text"
                  value={it.invoiceNumber || ''}
                  onChange={(e) => update(it.id, { invoiceNumber: e.target.value })}
                  placeholder="Invoice # / reference"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11.5px] text-ink-900 outline-none focus:border-tax/60" />
                <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-[1fr_1fr] gap-1.5">
                <input type="date" value={it.date || ''}
                  onChange={(e) => update(it.id, { date: e.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none [color-scheme:dark] focus:border-tax/60" />
                <select value={it.jurisdictionId}
                  onChange={(e) => update(it.id, { jurisdictionId: e.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60">
                  {JURISDICTIONS.map((j) => (<option key={j.id} value={j.id}>{j.label}</option>))}
                </select>
              </div>
              <input type="text" value={it.county || ''}
                onChange={(e) => update(it.id, { county: e.target.value })}
                placeholder="County / locality (optional)"
                className="mt-1.5 w-full min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60" />
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <input type="number" step="any" value={it.grossSales}
                  onChange={(e) => update(it.id, { grossSales: e.target.value })}
                  placeholder="Gross sales"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={it.exemptAmount || 0}
                  onChange={(e) => update(it.id, { exemptAmount: e.target.value })}
                  placeholder="Exempt amount"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
              </div>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                <input type="number" step="any" value={it.stateRatePct || 0}
                  onChange={(e) => update(it.id, { stateRatePct: e.target.value })}
                  placeholder="State %"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={it.countyRatePct || 0}
                  onChange={(e) => update(it.id, { countyRatePct: e.target.value })}
                  placeholder="County %"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={it.cityRatePct || 0}
                  onChange={(e) => update(it.id, { cityRatePct: e.target.value })}
                  placeholder="City %"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={it.specialRatePct || 0}
                  onChange={(e) => update(it.id, { specialRatePct: e.target.value })}
                  placeholder="Special %"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[10.5px]">
                <span className="text-ink-500">Taxable {formatNumber(taxable)} · {formatNumber(rate)}%</span>
                <span className="font-semibold text-tax">Tax {formatNumber(tax)}</span>
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
  reportTitle: 'Sales Tax Report — Q2 2026',
  reference: 'STX-2026-Q2-0014',
  purposeId: 'filing',
  filingFrequencyId: 'quarterly',
  reportDate: todayISO(),
  periodLabel: 'Apr–Jun 2026',

  entity: {
    name: 'Sonchoy Studio LLC',
    taxId: 'EIN 12-3456789',
    address: '500 Howard Street, San Francisco, CA 94105',
    contactEmail: 'tax@sonchoystudio.com',
  },

  currency: 'USD',
  defaultJurisdictionId: 'US-CA',

  transactions: [
    { id: 1, date: '2026-04-12', invoiceNumber: 'INV-1041', jurisdictionId: 'US-CA', county: 'San Francisco',
      grossSales: 18500, exemptAmount: 0,
      stateRatePct: 6.0, countyRatePct: 1.25, cityRatePct: 0, specialRatePct: 1.375 },
    { id: 2, date: '2026-04-23', invoiceNumber: 'INV-1042', jurisdictionId: 'US-CA', county: 'Los Angeles',
      grossSales: 24000, exemptAmount: 4000,
      stateRatePct: 6.0, countyRatePct: 1.0, cityRatePct: 1.0, specialRatePct: 2.25 },
    { id: 3, date: '2026-05-04', invoiceNumber: 'INV-1043', jurisdictionId: 'US-TX', county: 'Travis',
      grossSales: 16000, exemptAmount: 0,
      stateRatePct: 6.25, countyRatePct: 0, cityRatePct: 1.0, specialRatePct: 1.0 },
    { id: 4, date: '2026-05-18', invoiceNumber: 'INV-1044', jurisdictionId: 'US-NY', county: 'New York',
      grossSales: 32000, exemptAmount: 2500,
      stateRatePct: 4.0, countyRatePct: 0, cityRatePct: 4.5, specialRatePct: 0.375 },
    { id: 5, date: '2026-06-02', invoiceNumber: 'INV-1045', jurisdictionId: 'US-FL', county: 'Miami-Dade',
      grossSales: 9800, exemptAmount: 0,
      stateRatePct: 6.0, countyRatePct: 1.0, cityRatePct: 0, specialRatePct: 0 },
    { id: 6, date: '2026-06-21', invoiceNumber: 'INV-1046', jurisdictionId: 'CA-ON', county: 'Toronto',
      grossSales: 12500, exemptAmount: 0,
      stateRatePct: 13, countyRatePct: 0, cityRatePct: 0, specialRatePct: 0 },
  ],

  includeStateSummary: true,
  includeCountySummary: true,
  includeRateSummary: true,

  notes: 'Q2 2026 sales-tax filing prep. CDTFA filing due 31 Jul 2026 for California. New York filing due 20 Jul 2026. Resale-certificate exempt amounts excluded from taxable base.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const filing = useMemo(() => findFilingFrequency(data.filingFrequencyId), [data.filingFrequencyId])
  const { rows, totals } = useMemo(() => computeReport(data), [data])
  const stateSummary  = useMemo(() => buildStateSummary(rows),  [rows])
  const countySummary = useMemo(() => buildCountySummary(rows), [rows])
  const rateSummary   = useMemo(() => buildRateSummary(rows),   [rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setEntityField = (k) => (v) => setData((s) => ({ ...s, entity: { ...s.entity, [k]: v } }))
  const setTransactions = (items) => setData((s) => ({ ...s, transactions: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    transactions: data.transactions.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateSalesTaxReportPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateSalesTaxReportXlsx(buildPayload()) } finally { setBusy(null) } }

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
              Sales tax · {data.transactions.length} txns · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Report title" value={data.reportTitle} onChange={setField('reportTitle')} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference" value={data.reference} onChange={setField('reference')} mono />
          <DateInput label="Report date" value={data.reportDate} onChange={setField('reportDate')} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <TextInput label="Period label" value={data.periodLabel} onChange={setField('periodLabel')} placeholder="Q2 2026" />
          <SelectInput label="Filing freq." value={data.filingFrequencyId} onChange={setField('filingFrequencyId')}
            options={FILING_FREQUENCIES.map((f) => ({ value: f.id, label: f.label }))} />
          <SelectInput label="Purpose" value={data.purposeId} onChange={setField('purposeId')}
            options={REPORT_PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Entity */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Registered seller
        </span>
        <div className="space-y-2">
          <TextInput label="Entity name" value={data.entity.name} onChange={setEntityField('name')} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Tax ID / EIN" value={data.entity.taxId}       onChange={setEntityField('taxId')} mono />
            <TextInput label="Contact email" value={data.entity.contactEmail} onChange={setEntityField('contactEmail')} mono />
          </div>
          <TextareaInput label="Address" value={data.entity.address} onChange={setEntityField('address')} rows={2} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Defaults */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Defaults for new transactions
        </span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Default jurisdiction" value={data.defaultJurisdictionId} onChange={setField('defaultJurisdictionId')}
            options={JURISDICTIONS.map((j) => ({ value: j.id, label: j.label }))} />
          <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Transactions */}
        <TransactionList items={data.transactions} setItems={setTransactions}
          defaultJurisdictionId={data.defaultJurisdictionId} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Summary sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="State / province summary" desc="Roll up by state with state/county/city split"
            checked={data.includeStateSummary} onChange={setField('includeStateSummary')} />
          <ToggleRow label="County / locality summary" desc="Roll up by county within state"
            checked={data.includeCountySummary} onChange={setField('includeCountySummary')} />
          <ToggleRow label="Combined-rate summary" desc="Group transactions by their total stacked rate"
            checked={data.includeRateSummary} onChange={setField('includeRateSummary')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Taxable</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(totals.taxable)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total tax due</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(totals.totalTax)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-2 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">State</p>
            <p className="m-0 mt-0.5 font-mono text-[10.5px] font-semibold text-ink-950">{formatNumber(totals.stateTax)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-2 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">County</p>
            <p className="m-0 mt-0.5 font-mono text-[10.5px] font-semibold text-ink-950">{formatNumber(totals.countyTax)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-2 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">City</p>
            <p className="m-0 mt-0.5 font-mono text-[10.5px] font-semibold text-ink-950">{formatNumber(totals.cityTax)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-2 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Special</p>
            <p className="m-0 mt-0.5 font-mono text-[10.5px] font-semibold text-ink-950">{formatNumber(totals.specialTax)}</p>
          </div>
        </div>

        {/* State preview */}
        {stateSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              By state ({stateSummary.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Code</th>
                    <th className="py-1 text-right font-normal">Txns</th>
                    <th className="py-1 text-right font-normal">Taxable</th>
                    <th className="py-1 text-right font-normal">Tax</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {stateSummary.map((s) => (
                    <tr key={s.code} className="border-t border-line">
                      <td className="py-1 text-ink-700">{s.code}</td>
                      <td className="py-1 text-right text-ink-700">{s.transactions}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(s.taxable)}</td>
                      <td className="py-1 text-right text-tax">{formatNumber(s.totalTax)}</td>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">Total tax due</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {filing.label} · {data.transactions.length} txns
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.totalTax, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Filing deadlines, reconciliation notes, audit references…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Sales Tax PDF'}
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
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">SALES TAX REPORT</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Sales Tax Report — Q2 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Apr–Jun 2026 · Quarterly · Filing prep</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['GROSS',     'USD 112,800'],
            ['EXEMPT',    'USD 6,500'],
            ['TAXABLE',   'USD 106,300'],
            ['TAX DUE',   'USD 8,789'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">BY STATE / PROVINCE</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[30px_60px_1fr_60px_60px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>CODE</span><span>STATE</span>
            <span className="text-right">TAXABLE</span>
            <span className="text-right">RATE</span>
            <span className="text-right">TAX</span>
          </div>
          {[
            ['CA', 'California', '38,500', '~9.0%', '3,361'],
            ['TX', 'Texas',      '16,000', '8.25%', '1,320'],
            ['NY', 'New York',   '29,500', '8.875%', '2,618'],
            ['FL', 'Florida',     '9,800', '7.0%',    '686'],
            ['ON', 'Ontario',    '12,500', '13%',    '1,625'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[30px_60px_1fr_60px_60px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-700">{r[0]}</span>
              <span className="truncate">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right text-tax">{r[3]}</span>
              <span className="text-right font-bold">{r[4]}</span>
            </div>
          ))}
          <div className="grid grid-cols-[30px_60px_1fr_60px_60px] gap-1 border-t-2 border-tax-bg bg-tax/10 px-1.5 py-1 font-mono text-[8.5px] font-bold text-tax">
            <span></span><span>TOTALS</span>
            <span className="text-right">106,300</span>
            <span className="text-right"></span>
            <span className="text-right">9,610</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[10px] italic text-ink-500">+ county and rate rollups + per-transaction detail in the full PDF</p>
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
            Transactions in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            jurisdictional report out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Each sale carries its state, county, and rate stack. The tool computes per-transaction tax then rolls up by state, county, and combined rate — ready for filing or accountant hand-off.
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Sales Tax Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  6 txns · Q2 2026
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Seller',          'Sonchoy Studio LLC · EIN 12-3456789'],
                  ['Period',          'Apr–Jun 2026 · Quarterly'],
                  ['Transactions',    '6 (across CA, TX, NY, FL, ON)'],
                  ['Gross sales',     'USD 112,800.00'],
                  ['Exempt',          'USD 6,500.00 (resale certs)'],
                  ['Taxable',         'USD 106,300.00'],
                  ['Rate stack',      'State + county + city + special'],
                  ['Total tax',       'USD 9,610.00'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Total tax due</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 9,610.00</span>
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
                  Filing-ready
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
  ['01', 'Drop in the sales',  'Per transaction: date, invoice number, jurisdiction, county, gross, exempt amount. Then the rate stack — state, county, city, special-district.'],
  ['02', 'Auto-roll-up',        'The tool computes per-transaction tax, then rolls up three ways — by state, by county within state, and by combined rate. Every number ties back to the detail.'],
  ['03', 'Export PDF + XLSX',   'PDF with summary cards, state rollup, county rollup, rate rollup, and per-transaction detail. XLSX has 5 sheets — Summary, Transactions, By State, By County, By Rate.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              One report,{' '}
              <em className="font-serif font-normal italic text-crimson-300">every filing.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            US sales tax is jurisdiction-stacked: state, county, city, and sometimes a transit or stadium district. Most accountants want the rollups by state for filing, by county for compliance, and by rate for the audit trail. This tool produces all three.
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
  { title: '30 jurisdictions',            desc: '20 US states (the most sales-tax-active) plus all 10 Canadian provinces. Each labelled with its tax system (HST, GST+PST, GST+QST, GST only).' },
  { title: '4-tier rate stack',           desc: 'State, county, city, and special-district rates as separate columns. They sum to the combined rate that\'s actually charged to the buyer.' },
  { title: 'Exempt-amount column',         desc: 'Subtract resale-certificate sales, services, and other exempt amounts before computing tax. Keeps your taxable base clean for the return.' },
  { title: 'Three rollups',               desc: 'By state (the way you file), by county (the way you reconcile to local jurisdictions), by combined rate (the way you audit).' },
  { title: 'Quarterly / monthly / annual', desc: 'Pick the filing frequency that matches your nexus and state of registration. The period label appears in the footer of every page.' },
  { title: 'PDF + 5-sheet XLSX',          desc: 'PDF: summary cards + state, county, and rate rollups + transaction detail. XLSX: Summary, Transactions, By State, By County, By Rate.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for multi-state sellers</Eyebrow>
          <SectionTitle>
            Every column the{' '}
            <em className="font-serif font-normal italic text-crimson-300">state portal</em> asks for.
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
  { q: 'How is this different from the GST or VAT tools?',          a: 'GST (Indian) splits into CGST/SGST/IGST and operates within one country. VAT is typically a single rate per country. US/CA sales tax is jurisdiction-stacked — state + county + city + district — and varies street-by-street. This tool models that stack.' },
  { q: 'Do I need separate reports for each state?',                a: 'Yes — when filing. Each state has its own return, due date, and portal. Use this tool to model your full activity for the period, then filter by state in the XLSX (or print the state rollup page) for each filing.' },
  { q: 'Where do I look up the right rates?',                       a: 'The tool doesn\'t hard-code rates — you enter them per transaction. Use Avalara, TaxJar, or your state\'s DOR website to look up rates by ZIP code or address. For sellers with serious volume, integrate a tax-engine API; this tool is for working out the numbers manually or auditing the API\'s output.' },
  { q: 'What\'s a "special district" rate?',                       a: 'On top of state/county/city, some areas levy additional sales tax for transit (NYC MCTD 0.375%), stadiums, conventions, or tourism. They\'re bundled into the rate the buyer sees but reported separately to the state. This tool tracks them in their own column.' },
  { q: 'Does this handle marketplace facilitator rules?',           a: 'Not directly — marketplace facilitator sales (Amazon, eBay, Etsy collecting tax on your behalf) should be excluded from your direct sales totals. Add them as separate transactions with the exempt-amount column populated, or just leave them out of the report.' },
  { q: 'Output formats?',                                            a: 'PDF (summary cards + state/county/rate rollups + full transaction table with totals row + page footers) and XLSX (5 sheets: Summary, Transactions, By State, By County, By Rate). All numeric — ready for pivots, charts, or formulas.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">sales tax reports.</em>
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
  { name: 'GST Calculation Sheet', desc: 'India GST workings with HSN/SAC.',           Icon: VatIcon,     label: 'TAX', path: '/tools/gst-calculation-sheet' },
  { name: 'VAT Calculator',        desc: 'Single-rate VAT add/remove.',                Icon: VatIcon,     label: 'TAX', path: '/tools/vat-calculator-pdf-export' },
  { name: 'Income Tax Estimator',  desc: 'Annual liability across slabs.',             Icon: PercentIcon, label: 'TAX', path: '/tools/income-tax-estimator' },
  { name: 'Payroll Tax Report',    desc: 'Per-employee tax + employer contributions.', Icon: PayrollIcon, label: 'TAX' },
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
              ? (<Link key={t.name} to={t.path} className={cls}>{inner}</Link>)
              : (<a key={t.name} href="#" className={cls}>{inner}</a>)
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function SalesTaxReportPage() {
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
