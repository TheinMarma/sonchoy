import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  EmiIcon, AmortIcon, PercentIcon, VatIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, LOAN_TYPES,
  findCurrency, findLoanType,
  computeAggregate, buildMonthlyProjection, buildTypeSummary, countSections,
  computeMonthlyEmi, monthsToPayoff,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/monthlyLoanPayment/compute'
import { generateMonthlyLoanPaymentPdf } from '../lib/monthlyLoanPayment/generatePdf'
import { generateMonthlyLoanPaymentXlsx } from '../lib/monthlyLoanPayment/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Monthly Loan Payment Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[600px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['All loans', 'In one view'],
  ['P / I',     'Split per loan'],
  ['12-mo',     'Combined projection'],
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
            <span className="text-ink-950">Monthly Loan Payment Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Multi-loan view
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Every loan{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — one number,
            </em>
            <br />
            every{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              month.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Add all your loans — home, auto, personal, student, business — and see the combined monthly outflow with principal/interest split, weighted-average rate, payoff months, and a 12-month projection.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Multi-loan aggregation</span>
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

/* ---------- LoanList ---------- */

function LoanList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    {
      id: Date.now() + Math.random(),
      name: '', typeId: 'personal',
      principal: 0, openingBalance: '',
      annualRatePct: 0, tenureMonths: 60,
      emi: '',
    },
  ])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">Active loans ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20">
          <Plus size={9} /> Add loan
        </button>
      </div>
      <div className="space-y-2">
        {items.map((l) => {
          const balance = l.openingBalance !== '' ? Number(l.openingBalance) || 0 : Number(l.principal) || 0
          const computedEmi = computeMonthlyEmi({
            principal: Number(l.principal) || 0,
            annualRatePct: Number(l.annualRatePct) || 0,
            tenureMonths: Number(l.tenureMonths) || 0,
          })
          const effectiveEmi = l.emi !== '' ? Number(l.emi) || 0 : computedEmi
          const months = monthsToPayoff({
            balance, annualRatePct: l.annualRatePct, emi: effectiveEmi,
          })
          return (
            <div key={l.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
                <input type="text" value={l.name || ''}
                  onChange={(e) => update(l.id, { name: e.target.value })}
                  placeholder="Loan name (e.g. SBI Home Loan)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-tax/60" />
                <button type="button" onClick={() => remove(l.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5">
                <select value={l.typeId}
                  onChange={(e) => update(l.id, { typeId: e.target.value })}
                  className="w-full min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60">
                  {LOAN_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
                </select>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <input type="number" step="any" value={l.principal}
                  onChange={(e) => update(l.id, { principal: Number(e.target.value) || 0 })}
                  placeholder="Original principal"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={l.openingBalance}
                  onChange={(e) => update(l.id, { openingBalance: e.target.value })}
                  placeholder="Current balance (blank = principal)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                <input type="number" step="any" value={l.annualRatePct}
                  onChange={(e) => update(l.id, { annualRatePct: Number(e.target.value) || 0 })}
                  placeholder="Rate %"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="1" value={l.tenureMonths}
                  onChange={(e) => update(l.id, { tenureMonths: Number(e.target.value) || 0 })}
                  placeholder="Tenure (mo)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={l.emi}
                  onChange={(e) => update(l.id, { emi: e.target.value })}
                  placeholder="EMI (auto if blank)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[10.5px]">
                <span className="text-ink-500">
                  EMI <span className="text-ink-950">{formatNumber(effectiveEmi)}</span>
                  {' · '}Balance <span className="text-ink-950">{formatNumber(balance)}</span>
                </span>
                <span className="text-tax">
                  {Number.isFinite(months) ? `${months} mo left` : 'Never pays off ✗'}
                </span>
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
  reportTitle: 'Monthly Loan Payment Report — May 2026',
  reference: 'MLP-2026-05-0042',
  borrowerName: 'Marcus Vance',
  reportDate: todayISO(),
  currency: 'INR',

  loans: [
    { id: 1, name: 'SBI Home Loan',          typeId: 'home',     principal: 4500000, openingBalance: 3850000, annualRatePct: 8.5,  tenureMonths: 240, emi: '' },
    { id: 2, name: 'HDFC Auto Loan',         typeId: 'auto',     principal: 850000,  openingBalance: 620000,  annualRatePct: 9.25, tenureMonths: 60,  emi: '' },
    { id: 3, name: 'Bajaj Personal Loan',    typeId: 'personal', principal: 350000,  openingBalance: 215000,  annualRatePct: 14,   tenureMonths: 36,  emi: '' },
    { id: 4, name: 'ICICI Credit Card EMI',  typeId: 'credit',   principal: 120000,  openingBalance: 78000,   annualRatePct: 22,   tenureMonths: 24,  emi: '' },
  ],

  includeTypeSummary: true,
  includeProjection: true,
  projectionMonths: 12,
  projectionStartDate: todayISO(),

  notes: 'Prepared as part of personal cash-flow review for May 2026. Credit-card EMI is the most expensive line — prioritise prepayment. Total monthly outflow ~₹62,500 (~₹38K interest, ~₹24K principal).',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const { loans, totals } = useMemo(() => computeAggregate(data.loans), [data.loans])
  const typeSummary = useMemo(() => buildTypeSummary(loans), [loans])
  const projection = useMemo(() => (
    data.includeProjection
      ? buildMonthlyProjection(data.loans, Number(data.projectionMonths) || 12, data.projectionStartDate)
      : []
  ), [data.loans, data.includeProjection, data.projectionMonths, data.projectionStartDate])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setLoans = (items) => setData((s) => ({ ...s, loans: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    loans: data.loans.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateMonthlyLoanPaymentPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateMonthlyLoanPaymentXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <EmiIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              {data.loans.length} loans · {sections} sections
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
          <DateInput label="As at" value={data.reportDate} onChange={setField('reportDate')} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
          <TextInput label="Borrower" value={data.borrowerName} onChange={setField('borrowerName')} />
          <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Loans */}
        <LoanList items={data.loans} setItems={setLoans} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Summary sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="By loan type" desc="Roll up balance and EMI by type (home, auto, etc.)"
            checked={data.includeTypeSummary} onChange={setField('includeTypeSummary')} />
          <ToggleRow label="Combined monthly projection" desc="Next N months of total outflow"
            checked={data.includeProjection} onChange={setField('includeProjection')} />
        </div>
        {data.includeProjection && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberInput label="Projection months" value={data.projectionMonths} onChange={setField('projectionMonths')} suffix="mo" />
            <DateInput   label="Projection start"  value={data.projectionStartDate} onChange={setField('projectionStartDate')} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Monthly outflow</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(totals.emi)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total balance</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(totals.balance)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Int / mo</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(totals.monthlyInterest)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Prin / mo</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(totals.monthlyPrincipal)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Wtd rate</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-tax">{formatNumber(totals.weightedRate)}%</p>
          </div>
        </div>

        {/* Type preview */}
        {typeSummary.length > 1 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              By loan type ({typeSummary.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Type</th>
                    <th className="py-1 text-right font-normal">Balance</th>
                    <th className="py-1 text-right font-normal">EMI</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {typeSummary.map((t) => (
                    <tr key={t.typeId} className="border-t border-line">
                      <td className="py-1 text-ink-700">{t.label} <span className="text-ink-500">·{t.count}</span></td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(t.balance)}</td>
                      <td className="py-1 text-right text-tax">{formatNumber(t.emi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Projection preview */}
        {projection.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Next {Math.min(6, projection.length)} of {projection.length} months
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Month</th>
                    <th className="py-1 text-right font-normal">Payment</th>
                    <th className="py-1 text-right font-normal">Interest</th>
                    <th className="py-1 text-right font-normal">Balance</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {projection.slice(0, 6).map((r) => (
                    <tr key={r.n} className="border-t border-line">
                      <td className="py-1 text-ink-700">{formatDate(r.date) || '—'}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(r.emi)}</td>
                      <td className="py-1 text-right text-tax">{formatNumber(r.interest)}</td>
                      <td className="py-1 text-right text-ink-700">{formatNumber(r.closingBalance)}</td>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">Total monthly outflow</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              across {loans.length} loans
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.emi, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Refinance plans, prepayment priority, lender contact…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Loan Payment PDF'}
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
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">MONTHLY LOAN PAYMENT REPORT</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Monthly Loan Payment — May 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Marcus Vance · 4 active loans</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['OUTFLOW',    'INR 62,541'],
            ['INT / MO',   'INR 38,420'],
            ['PRIN / MO',  'INR 24,121'],
            ['BALANCE',    'INR 47.6L'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">LOAN-BY-LOAN</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_50px_60px_50px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>LOAN</span><span className="text-right">RATE</span>
            <span className="text-right">EMI</span>
            <span className="text-right">INT/MO</span>
          </div>
          {[
            ['SBI Home Loan',           '8.50%',  '38,892', '27,271'],
            ['HDFC Auto Loan',          '9.25%',  '17,683',  '4,779'],
            ['Bajaj Personal Loan',     '14.00%',  '7,168',  '2,508'],
            ['ICICI Credit Card EMI',   '22.00%',  '4,071',  '1,430'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_50px_60px_50px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="truncate">{r[0]}</span>
              <span className="text-right text-tax">{r[1]}</span>
              <span className="text-right font-bold">{r[2]}</span>
              <span className="text-right text-ink-700">{r[3]}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_50px_60px_50px] gap-1 border-t-2 border-tax-bg bg-tax/10 px-1.5 py-1 font-mono text-[8.5px] font-bold text-tax">
            <span>TOTALS</span>
            <span className="text-right">9.07%*</span>
            <span className="text-right">62,541</span>
            <span className="text-right">38,420</span>
          </div>
        </div>

        <p className="m-0 mt-2 text-[7.5px] italic text-ink-500">* weighted average rate by balance</p>
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
            All your loans in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            one outflow number out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Stack home, auto, personal, student, and card-EMIs in one report. The tool computes each loan&rsquo;s EMI, splits principal vs interest, calculates payoff months, and rolls everything into a single combined monthly view.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <EmiIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Loan Stack Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  4 loans · May 2026
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Borrower',        'Marcus Vance'],
                  ['Loans tracked',   '4 (home, auto, personal, card)'],
                  ['Total balance',   'INR 47,63,000'],
                  ['Monthly outflow', 'INR 62,541'],
                  ['Interest / mo',   'INR 38,420 (61%)'],
                  ['Principal / mo',  'INR 24,121 (39%)'],
                  ['Weighted rate',   '9.07% p.a.'],
                  ['Card EMI flag',   '22% — prepay first'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Total monthly outflow</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 62,541</span>
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
  ['01', 'Add your loans',    'Name, type, principal, current balance, rate, tenure. EMI auto-computes — or override if your lender uses a different number.'],
  ['02', 'See the totals',     'Combined monthly outflow, principal vs interest split, weighted-average rate, and how many months until each loan clears.'],
  ['03', 'Export PDF + XLSX',  'PDF: summary cards, loan-by-loan table, by-type rollup, 12-month projection. XLSX: Summary, Loans, By Type, Projection.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Built for{' '}
              <em className="font-serif font-normal italic text-crimson-300">cash-flow planning.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most loan calculators model one loan at a time. Real life has four or five — home plus auto plus a personal loan plus card EMIs plus maybe a student loan. This tool sums them so you see the whole monthly bill at once.
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
  { title: 'Multi-loan aggregation', desc: 'Add as many loans as you carry — home, auto, personal, student, business, credit line. The combined monthly outflow is computed across all of them.' },
  { title: 'Auto EMI + override',     desc: 'EMI computes from principal × rate × tenure using the standard formula. Override with your lender\'s exact figure if it differs (processing fees, insurance, etc.).' },
  { title: 'Current balance support', desc: 'Track loans that are already partway through. Enter the current balance separately from the original principal; the principal/interest split reflects the real balance today.' },
  { title: 'Payoff months',           desc: 'For each loan, the tool shows how many months remain at the current EMI. If EMI is too low to cover interest, it flags "Never pays off" — useful for credit-line interest checks.' },
  { title: 'Weighted average rate',   desc: 'Combined rate across all loans, weighted by balance. Tells you what your overall cost of debt looks like — useful for refinance / consolidation decisions.' },
  { title: 'PDF + 4-sheet XLSX',      desc: 'PDF: summary cards + loan table + by-type rollup + 12-month projection + notes. XLSX: Summary, Loans, By Type, Projection — all numeric for further analysis.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for households &amp; CFOs</Eyebrow>
          <SectionTitle>
            One report,{' '}
            <em className="font-serif font-normal italic text-crimson-300">every loan.</em>
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
  { q: 'How is this different from EMI Schedule or Loan Amortization?',  a: 'EMI Schedule and Loan Amortization model ONE loan in depth — the full period-by-period table. This tool models MANY loans at a household / company level — one row per loan, combined outflow, no per-loan amortization. Use this for cash-flow planning; the others for verifying a single loan in detail.' },
  { q: 'What if I don\'t know my exact EMI?',                            a: 'Leave the EMI field blank. The tool computes it from principal × rate × tenure using the standard formula. Most lenders match this within a few currency units. If yours differs (processing fees, insurance bundled in), enter the override.' },
  { q: 'How is "months left" computed?',                                  a: 'log(EMI / (EMI − Balance × rate)) / log(1 + rate). It tells you how many months until the current balance clears at the current EMI. If your EMI is too low to cover even the monthly interest, it returns "Never pays off" — common on minimum-payment credit lines.' },
  { q: 'What is the weighted-average rate?',                              a: 'Sum of (each balance × its rate) ÷ total balance. It tells you what your overall debt costs — useful for deciding whether to consolidate. If your weighted rate is 12%+, a refinance into a lower-rate personal loan can save money.' },
  { q: 'Can I track non-EMI debts like credit-card minimums?',           a: 'Yes — set the EMI to whatever minimum payment you actually make. The tool will tell you how long that pays off (often "Never" if you only pay the minimum). That\'s exactly the message most card minimums are designed to bury.' },
  { q: 'Output formats?',                                                 a: 'PDF (summary cards + loan-by-loan table + by-type rollup + monthly projection table with running balance + notes — auto-paginated) and XLSX (4 sheets: Summary, Loans, By Type, Projection). All numeric columns are real numbers.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">monthly loan payments.</em>
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
  { name: 'EMI Schedule PDF',          desc: 'Single-loan, flat-rate amortization.',     Icon: EmiIcon,    label: 'TAX', path: '/tools/emi-schedule' },
  { name: 'Loan Amortization',         desc: 'Single-loan, multi-rate amortization.',    Icon: AmortIcon,  label: 'TAX', path: '/tools/loan-amortization' },
  { name: 'Interest Calculation Sheet', desc: 'Simple/compound/reducing interest.',      Icon: PercentIcon, label: 'TAX', path: '/tools/interest-calculation-sheet' },
  { name: 'Income Tax Estimator',      desc: 'Annual liability across slabs.',           Icon: PercentIcon, label: 'TAX', path: '/tools/income-tax-estimator' },
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

export default function MonthlyLoanPaymentPage() {
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
