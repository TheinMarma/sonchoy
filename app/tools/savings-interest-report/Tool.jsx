'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  CoinStackIcon, PercentIcon, EmiIcon, AmortIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, COMPOUND_FREQUENCIES, CONTRIBUTION_FREQUENCIES, ACCOUNT_TYPES, FLOW_TYPES,
  findCurrency, findCompoundFrequency, findContribFrequency, findAccountType, findFlowType,
  buildSchedule, buildYearlySummary, computeGoalProgress, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/savingsInterestReport/compute'
import { generateSavingsInterestPdf } from '@/lib/savingsInterestReport/generatePdf'
import { generateSavingsInterestXlsx } from '@/lib/savingsInterestReport/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Savings Interest Report"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[620px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Compound', '5 frequencies'],
  ['Contrib.',  'Recurring + one-off'],
  ['Goal',      'Tracker built-in'],
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
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-tax">Tax &amp; Banking</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Savings Interest Report</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Savings growth
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Compound growth,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              every deposit,
            </em>
            <br />
            every{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              withdrawal.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Model a real savings account or investment plan: opening balance, recurring contributions, one-off deposits or withdrawals, compound interest at your chosen cadence, optional withholding tax. Plus a goal tracker that tells you the date you hit your target.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Goal-tracking built in</span>
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

/* ---------- CashFlowList ---------- */

function CashFlowList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), date: todayISO(), type: 'deposit', amount: 0, label: '' },
  ])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">One-off cash flows ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20">
          <Plus size={9} /> Add event
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((cf) => (
          <div key={cf.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[100px_1fr_22px] items-center gap-1.5">
              <input type="date" value={cf.date || ''}
                onChange={(e) => update(cf.id, { date: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none [color-scheme:dark] focus:border-tax/60" />
              <input type="text" value={cf.label || ''}
                onChange={(e) => update(cf.id, { label: e.target.value })}
                placeholder="Label (e.g. annual bonus)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60" />
              <button type="button" onClick={() => remove(cf.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-[1fr_1fr] gap-1.5">
              <select value={cf.type}
                onChange={(e) => update(cf.id, { type: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60">
                {FLOW_TYPES.map((f) => (<option key={f.id} value={f.id}>{f.label}</option>))}
              </select>
              <input type="number" step="any" value={cf.amount}
                onChange={(e) => update(cf.id, { amount: Number(e.target.value) || 0 })}
                placeholder="Amount"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  reportTitle: 'Savings Interest Report — 2026',
  reference: 'SAV-2026-0042',
  accountHolder: 'Marcus Vance',
  bankName: 'HDFC Bank · Premier Savings',
  accountTypeId: 'goal',
  currency: 'INR',

  openingBalance: 250000,
  annualRatePct: 7.0,
  compoundFrequencyId: 'quarterly',
  contribAmount: 15000,
  contribFrequencyId: 'monthly',
  tenureMonths: 60,
  startDate: todayISO(),

  taxOnInterestPct: 10,    // typical India TDS
  targetAmount: 1500000,

  cashFlows: [
    { id: 1, date: '2026-12-15', type: 'deposit',    amount: 80000,  label: 'Year-end bonus' },
    { id: 2, date: '2027-08-10', type: 'withdrawal', amount: 45000,  label: 'Tax payment' },
    { id: 3, date: '2028-06-30', type: 'deposit',    amount: 150000, label: 'Investment maturity' },
  ],

  includeYearlySummary: true,
  includeGoalBlock: true,
  includeCashFlowList: true,

  notes: 'Goal: ₹15L for a property down-payment in 5 years. Monthly SIP of ₹15K on top of opening balance; year-end bonus reinvested. 10% TDS modelled on interest (recoverable via ITR if applicable). FD/quarterly-compound assumption.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const accountType = useMemo(() => findAccountType(data.accountTypeId), [data.accountTypeId])
  const compoundF = useMemo(() => findCompoundFrequency(data.compoundFrequencyId), [data.compoundFrequencyId])
  const contribF = useMemo(() => findContribFrequency(data.contribFrequencyId), [data.contribFrequencyId])
  const schedule = useMemo(() => buildSchedule(data), [data])
  const goal = useMemo(() => computeGoalProgress({ targetAmount: data.targetAmount, schedule }), [data.targetAmount, schedule])
  const yearly = useMemo(() => buildYearlySummary(schedule.rows), [schedule.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setCashFlows = (items) => setData((s) => ({ ...s, cashFlows: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    cashFlows: data.cashFlows.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateSavingsInterestPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateSavingsInterestXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <CoinStackIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Savings · {schedule.months} months · {sections} sections
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
          <SelectInput label="Account type" value={data.accountTypeId} onChange={setField('accountTypeId')}
            options={ACCOUNT_TYPES.map((a) => ({ value: a.id, label: a.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Account holder" value={data.accountHolder} onChange={setField('accountHolder')} />
          <TextInput label="Bank / institution" value={data.bankName} onChange={setField('bankName')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Core inputs */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Account parameters
        </span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_92px] gap-2">
            <NumberInput label="Opening balance" value={data.openingBalance} onChange={setField('openingBalance')} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Annual rate" value={data.annualRatePct} onChange={setField('annualRatePct')} suffix="% p.a." />
            <SelectInput label="Compounding" value={data.compoundFrequencyId} onChange={setField('compoundFrequencyId')}
              options={COMPOUND_FREQUENCIES.map((f) => ({ value: f.id, label: f.label }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Tenure" value={data.tenureMonths} onChange={setField('tenureMonths')} suffix="mo" />
            <DateInput label="Start date" value={data.startDate} onChange={setField('startDate')} />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Contributions */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Recurring contributions
        </span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Cadence" value={data.contribFrequencyId} onChange={setField('contribFrequencyId')}
            options={CONTRIBUTION_FREQUENCIES.map((f) => ({ value: f.id, label: f.label }))} />
          <NumberInput label="Amount per period" value={data.contribAmount} onChange={setField('contribAmount')} suffix={cur.code} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Cash flows */}
        <CashFlowList items={data.cashFlows} setItems={setCashFlows} />

        <div className="my-3.5 h-px bg-line" />

        {/* Goal */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Goal &amp; tax
        </span>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Target amount" value={data.targetAmount} onChange={setField('targetAmount')} suffix={cur.code} />
          <NumberInput label="Tax on interest" value={data.taxOnInterestPct} onChange={setField('taxOnInterestPct')} suffix="%" />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Optional sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Yearly summary" desc="Roll up contributions, interest, balance by year"
            checked={data.includeYearlySummary} onChange={setField('includeYearlySummary')} />
          <ToggleRow label="Goal tracker block" desc="Date you hit the target / shortfall view"
            checked={data.includeGoalBlock} onChange={setField('includeGoalBlock')} />
          <ToggleRow label="Cash-flow events list" desc="Standalone table of one-off deposits and withdrawals"
            checked={data.includeCashFlowList} onChange={setField('includeCashFlowList')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Interest earned</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(schedule.totalInterestNet)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code} (net of tax)</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Final balance</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(schedule.finalBalance)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Contrib.</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(schedule.totalContributions)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Lump in</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-success">{formatNumber(schedule.totalDeposits)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Withdrawn</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-crimson-400">{formatNumber(schedule.totalWithdrawals)}</p>
          </div>
        </div>

        {/* Goal block */}
        {data.includeGoalBlock && Number(data.targetAmount) > 0 && (
          <div className="mt-2 rounded-lg border border-tax/30 bg-tax-bg/40 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-tax">
                Target {cur.code} {formatNumber(Number(data.targetAmount) || 0)}
              </p>
              <p className={`m-0 font-mono text-[11px] font-bold ${goal.hit ? 'text-success' : 'text-crimson-400'}`}>
                {goal.hit ? `Hit on ${formatDate(goal.monthsToHitDate)}` : `${formatNumber(goal.finalProgressPct)}%`}
              </p>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
              <div className={`h-full ${goal.hit ? 'bg-success' : 'bg-tax'}`}
                style={{ width: `${Math.min(100, goal.finalProgressPct)}%` }} />
            </div>
          </div>
        )}

        {/* Yearly preview */}
        {yearly.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Yearly summary ({yearly.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Year</th>
                    <th className="py-1 text-right font-normal">Contrib.</th>
                    <th className="py-1 text-right font-normal">Interest</th>
                    <th className="py-1 text-right font-normal">Balance</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {yearly.map((r) => (
                    <tr key={r.year} className="border-t border-line">
                      <td className="py-1 text-ink-700">{r.year}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(r.contribution)}</td>
                      <td className="py-1 text-right text-tax">{formatNumber(r.interestNet)}</td>
                      <td className="py-1 text-right text-ink-700">{formatNumber(r.closing)}</td>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">Final balance</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {compoundF.label} · {(schedule.months / 12).toFixed(1)} yr
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(schedule.finalBalance, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Goal context, rate-reset notes, tax assumptions…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Savings PDF'}
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
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">SAVINGS INTEREST REPORT</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Savings Interest Report — 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Marcus Vance · Goal-based savings · 7.0% p.a. quarterly</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['OPENING',  'INR 2,50,000'],
            ['IN',       'INR 9,80,000'],
            ['INTEREST', 'INR 2,87,420'],
            ['FINAL',    'INR 15,72,420'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">GOAL TRACKER</p>
        <div className="mt-1 rounded border border-line bg-canvas px-2.5 py-2">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-ink-500">Target</span>
            <span className="font-mono font-bold text-ink-950">INR 15,00,000</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-success" style={{ width: '100%' }} />
          </div>
          <p className="m-0 mt-1 text-[8px] font-bold text-success">ACHIEVED · Apr 2031 (month 59)</p>
        </div>

        <p className="m-0 mt-3 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">YEARLY</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[40px_1fr_60px_70px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>YEAR</span><span>CONTRIB.</span>
            <span className="text-right">INT.</span>
            <span className="text-right">BAL</span>
          </div>
          {[
            ['2026', '1,80,000', '36,510', '4,66,510'],
            ['2027', '1,80,000', '52,840', '6,99,350'],
            ['2028', '1,80,000', '69,820', '9,49,170'],
            ['2029', '1,80,000', '87,460', '12,16,630'],
            ['2030', '1,80,000', '40,790', '15,72,420'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[40px_1fr_60px_70px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-700">{r[0]}</span>
              <span>{r[1]}</span>
              <span className="text-right text-tax">{r[2]}</span>
              <span className="text-right font-bold">{r[3]}</span>
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
            Savings plan in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            month-by-month growth out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Run a real savings model — opening balance, recurring contributions, one-off events, compound interest, withholding tax, and a goal target. The output shows every month from now to the finish line.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <CoinStackIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Savings Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  5-yr goal plan
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Holder',         'Marcus Vance'],
                  ['Account',        'HDFC Premier Savings · Goal-based'],
                  ['Opening',        'INR 2,50,000'],
                  ['Monthly SIP',    'INR 15,000'],
                  ['Rate',           '7.0% p.a. compounded quarterly'],
                  ['Tax on interest', '10% TDS'],
                  ['Tenure',         '60 months (5 years)'],
                  ['Target',         'INR 15,00,000 (down-payment)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Final balance</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 15,72,420</span>
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
                  Goal-ready
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
  ['01', 'Set the account',     'Opening balance, annual rate, compounding cadence (daily through annual). Pick the account type — savings, FD, ISA, SIP, goal fund.'],
  ['02', 'Add the flows',        'Recurring contributions (monthly/quarterly/annual SIP-style) plus one-off deposits and withdrawals on specific dates.'],
  ['03', 'Export PDF + XLSX',    'PDF: summary cards, account parameters, goal block, yearly summary, monthly schedule. XLSX: Summary, Schedule, Yearly, Cash flows.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Plan the goal{' '}
              <em className="font-serif font-normal italic text-crimson-300">— see the path.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most savings calculators give you a single maturity number. This tool shows the path month by month — every contribution, every interest credit, every withdrawal, and the running balance — so you can plan around real life events, not idealised growth.
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
  { title: 'Compound interest engine',  desc: 'Annual, semi-annual, quarterly, monthly, or daily compounding. The monthly schedule converts your compound cadence into a monthly accrual that matches what banks actually credit.' },
  { title: 'Recurring contributions',   desc: 'Monthly, quarterly, annual SIP-style contributions. Plus one-off deposits and withdrawals on specific dates — model bonuses, tax payments, emergencies.' },
  { title: 'Goal tracker',              desc: 'Set a target amount. The tool tells you whether you hit it, the exact month you cross the line, and the shortfall if you don\'t.' },
  { title: 'Tax on interest',           desc: 'Optional withholding tax (TDS for India, withholding for US/UK savings). Shown gross and net per row plus rolled up to the totals.' },
  { title: '8 account types',           desc: 'Savings, FD/CD, RD, ISA / tax-advantaged, SIP, emergency fund, goal fund, other. Mainly cosmetic — drives PDF labelling — but useful for organising multiple reports.' },
  { title: 'PDF + 4-sheet XLSX',        desc: 'PDF: summary cards + parameters + goal block + cash-flow list + yearly summary + monthly schedule with first 60 months. XLSX: Summary, Schedule, Yearly, Cash flows.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Goal-first savings</Eyebrow>
          <SectionTitle>
            Every contribution{' '}
            <em className="font-serif font-normal italic text-crimson-300">— shown.</em>
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
  { q: 'How is this different from the Interest Calculation Sheet?',  a: 'Interest Calculation Sheet is pure mathematics — principal × rate × time for simple/compound/reducing balance, no contributions. This Savings Interest Report adds recurring contributions, one-off cash flows, withholding tax, and a goal tracker — the way real savings products actually work.' },
  { q: 'Why doesn\'t my bank\'s FD calculator match exactly?',         a: 'Almost always within a few currency units. Differences come from how banks handle leap years, day-count conventions (actual/365 vs actual/360 vs 30/360), and rounding at each step. This tool uses 365-day year and standard rounding at each period — same as most retail bank calculators within ~0.1%.' },
  { q: 'What does the "tax on interest" field do?',                    a: 'Applies a withholding-tax percentage to every interest credit before adding it to the balance. India TDS on FDs is 10% (or 20% without PAN); US savings interest is taxed at marginal rate (but no automatic withholding); UK savings up to the personal savings allowance are tax-free. Use this field to model the net interest you actually see.' },
  { q: 'Can I model irregular contributions?',                        a: 'Yes — use the one-off cash-flow events list. The recurring contribution handles the regular cadence (monthly/quarterly/annual); the cash-flow events list handles bonuses, tax-time withdrawals, year-end top-ups, and any other irregular money in or out.' },
  { q: 'What\'s the goal tracker for?',                                a: 'It compares your final balance (and the per-month closing balances) to a target amount and tells you (a) if you hit the target, (b) the exact month you crossed it, and (c) the shortfall if you didn\'t. Useful for emergency funds, down-payments, education funds, anything with a number.' },
  { q: 'Output formats?',                                              a: 'PDF (summary cards, parameters, goal block, cash-flow list, yearly summary, monthly schedule with the first 60 months, totals row, notes — auto-paginated) and XLSX (4 sheets: Summary, Schedule, Yearly, Cash flows). All numeric — paste straight into a model.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">savings reports.</em>
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
  { name: 'Interest Calculation Sheet', desc: 'Simple, compound, or reducing-balance.', Icon: PercentIcon, label: 'TAX', path: '/tools/interest-calculation-sheet' },
  { name: 'EMI Schedule PDF',           desc: 'Single-loan amortization.',              Icon: EmiIcon,     label: 'TAX', path: '/tools/emi-schedule' },
  { name: 'Loan Amortization',          desc: 'Multi-rate amortization with resets.',   Icon: AmortIcon,   label: 'TAX', path: '/tools/loan-amortization' },
  { name: 'Mortgage Payment PDF',       desc: 'PITI mortgage schedule.',                Icon: AmortIcon,   label: 'TAX', path: '/tools/mortgage-payment' },
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
              ? (<Link key={t.name} href={t.path} className={cls}>{inner}</Link>)
              : (<a key={t.name} href="#" className={cls}>{inner}</a>)
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function SavingsInterestReportTool() {
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
