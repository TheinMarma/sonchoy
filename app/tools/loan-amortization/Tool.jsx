'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  AmortIcon, EmiIcon, PercentIcon, VatIcon, PayrollIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, RATE_STRUCTURES, FREQUENCIES, TENURE_UNITS, LOAN_TYPES,
  findCurrency, findFrequency, findRateStructure,
  tenureToPeriods, buildSchedule, buildYearlySummary, buildSegmentSummary,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/loanAmortization/compute'
import { generateLoanAmortizationPdf } from '@/lib/loanAmortization/generatePdf'
import { generateLoanAmortizationXlsx } from '@/lib/loanAmortization/generateXlsx'

/* ---------- Local helpers ---------- */

const Eyebrow = ({ children, className = '' }) => (
  <p className={`m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300 ${className}`}>{children}</p>
)
const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950 ${className}`}>{children}</h2>
)

/* ---------- 1) Tool hero ---------- */

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
    <div role="dialog" aria-modal="true" aria-label="Live Loan Amortization Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[560px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Multi-rate', 'Fixed · floating · step-up'],
  ['Reset',     'Auto EMI re-calc'],
  ['PDF+',      'XLSX (4 sheets)'],
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
            <span className="text-ink-950">Loan Amortization PDF</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Amortization
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Full amortization{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — with rate resets
            </em>
            <br />
            and step-up{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              built in.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Beyond a flat-rate EMI — model fixed, floating, or step-up loans with multiple rate segments. The EMI re-amortizes at each rate change, just like your bank does at every reset.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Rate-reset EMI re-amortization</span>
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

/* ---------- Rate-segment editor ---------- */

function SegmentList({ segments, setSegments, totalPeriods }) {
  const update = (id, patch) =>
    setSegments(segments.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const remove = (id) => setSegments(segments.filter((s) => s.id !== id))
  const addOne = () => {
    const last = segments[segments.length - 1] || { startPeriod: 1, annualRatePct: 0 }
    setSegments([...segments, {
      id: Date.now() + Math.random(),
      startPeriod: Math.min((Number(last.startPeriod) || 1) + 12, totalPeriods),
      annualRatePct: Number(last.annualRatePct) || 0,
    }])
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">Rate segments</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20">
          <Plus size={9} /> Add segment
        </button>
      </div>
      <div className="space-y-1.5">
        {segments.map((s, idx) => (
          <div key={s.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[1fr_1fr_22px] items-center gap-1.5">
              <input type="number" inputMode="numeric" min={1} max={totalPeriods}
                value={s.startPeriod}
                onChange={(e) => update(s.id, { startPeriod: Number(e.target.value) || 1 })}
                placeholder="Start period"
                disabled={idx === 0}
                className={`min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none focus:border-tax/60 ${idx === 0 ? 'opacity-60' : ''}`}
              />
              <input type="number" inputMode="decimal" step="any"
                value={s.annualRatePct}
                onChange={(e) => update(s.id, { annualRatePct: Number(e.target.value) || 0 })}
                placeholder="Rate (% p.a.)"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none focus:border-tax/60"
              />
              <button
                type="button"
                onClick={() => remove(s.id)}
                disabled={idx === 0}
                aria-label="Remove segment"
                className={`flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300 ${idx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="m-0 mt-1 text-[9.5px] text-ink-500">
              {idx === 0
                ? `From period 1 — starting rate`
                : `From period ${s.startPeriod} onwards`}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  scheduleTitle: 'Floating Home Loan — Amortization',
  scheduleReference: 'AMT-2026-FL-0042',
  loanTypeId: 'home',
  rateStructureId: 'floating',

  borrowerName: 'Marcus Vance',
  lenderName: 'Northwind Mortgage Bank',

  principal: 250000,
  annualRatePct: 6.5,
  currency: 'USD',

  tenureValue: 20,
  tenureUnitId: 'years',
  frequencyId: 'monthly',

  startDate: todayISO(),
  firstPaymentDate: '',
  extraPayment: 0,

  segments: [
    { id: 1, startPeriod: 1,   annualRatePct: 6.5 },
    { id: 2, startPeriod: 25,  annualRatePct: 7.0 },
    { id: 3, startPeriod: 73,  annualRatePct: 7.5 },
    { id: 4, startPeriod: 121, annualRatePct: 7.0 },
  ],

  notes: 'Floating-rate loan. EMI is re-calculated at each rate reset based on the remaining balance and remaining tenure — the same way most retail banks re-amortize after a reset.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const frequency = useMemo(() => findFrequency(data.frequencyId), [data.frequencyId])
  const structure = useMemo(() => findRateStructure(data.rateStructureId), [data.rateStructureId])
  const cur = useMemo(() => findCurrency(data.currency), [data.currency])

  const periods = useMemo(
    () => tenureToPeriods({
      tenureValue: data.tenureValue,
      tenureUnitId: data.tenureUnitId,
      frequencyId: data.frequencyId,
    }),
    [data.tenureValue, data.tenureUnitId, data.frequencyId]
  )

  const firstPaymentDate = data.firstPaymentDate || data.startDate || ''

  const payload = useMemo(() => ({
    ...data,
    periods,
    firstPaymentDate,
    // When rate structure is fixed, ignore segments and use a single segment at startingRate.
    segments: data.rateStructureId === 'fixed'
      ? [{ startPeriod: 1, annualRatePct: data.annualRatePct }]
      : data.segments,
  }), [data, periods, firstPaymentDate])

  const schedule = useMemo(() => buildSchedule(payload), [payload])
  const yearly = useMemo(() => buildYearlySummary(schedule.rows), [schedule.rows])
  const segs = useMemo(() => buildSegmentSummary(schedule.rows, schedule.resolvedSegments), [schedule.rows, schedule.resolvedSegments])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setSegments = (segs2) => setData((s) => ({
    ...s, segments: segs2.map((seg) => ({ ...seg, id: seg.id ?? nextId++ })),
  }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generateLoanAmortizationPdf(payload) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateLoanAmortizationXlsx(payload) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <AmortIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              {structure.label.split('(')[0].trim()} · {periods} periods
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Schedule title" value={data.scheduleTitle} onChange={setField('scheduleTitle')} placeholder="Loan amortization" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference" value={data.scheduleReference} onChange={setField('scheduleReference')} placeholder="AMT-2026-0001" mono />
          <SelectInput label="Loan type" value={data.loanTypeId} onChange={setField('loanTypeId')}
            options={LOAN_TYPES.map((l) => ({ value: l.id, label: l.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Borrower" value={data.borrowerName} onChange={setField('borrowerName')} />
          <TextInput label="Lender"   value={data.lenderName}   onChange={setField('lenderName')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Loan inputs */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">Loan terms</span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_92px] gap-2">
            <NumberInput label="Principal" value={data.principal} onChange={setField('principal')} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <NumberInput label="Starting annual rate" value={data.annualRatePct} onChange={setField('annualRatePct')} suffix="% p.a." />
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <NumberInput label="Tenure" value={data.tenureValue} onChange={setField('tenureValue')} />
            <SelectInput label="Unit" value={data.tenureUnitId} onChange={setField('tenureUnitId')}
              options={TENURE_UNITS.map((u) => ({ value: u.id, label: u.label }))} />
          </div>
          <SelectInput label="Payment frequency" value={data.frequencyId} onChange={setField('frequencyId')}
            options={FREQUENCIES.map((f) => ({ value: f.id, label: f.label }))} />
          <div className="grid grid-cols-2 gap-2">
            <DateInput label="Start date"    value={data.startDate}        onChange={setField('startDate')} />
            <DateInput label="First payment" value={data.firstPaymentDate} onChange={setField('firstPaymentDate')} />
          </div>
          <NumberInput label="Extra payment / period" value={data.extraPayment} onChange={setField('extraPayment')} suffix={cur.code} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Rate structure */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">Rate structure</span>
        <SelectInput label="Structure" value={data.rateStructureId} onChange={setField('rateStructureId')}
          options={RATE_STRUCTURES.map((r) => ({ value: r.id, label: r.label }))} />

        {data.rateStructureId !== 'fixed' && (
          <div className="mt-3 rounded-lg border border-tax/20 bg-tax-bg/30 p-3 space-y-2">
            <SegmentList segments={data.segments} setSegments={setSegments} totalPeriods={periods} />
            <p className="m-0 text-[10.5px] italic text-ink-500">
              At each segment boundary, the EMI is re-computed on the remaining balance and remaining tenure.
            </p>
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Computed cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Initial EMI</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(schedule.initialEmi)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code} · {frequency.label}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total interest</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(schedule.totalInterest)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total paid</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(schedule.totalPaid)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>

        {/* Segment preview */}
        {segs.length > 1 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Segments preview ({segs.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Segment</th>
                    <th className="py-1 text-right font-normal">Rate</th>
                    <th className="py-1 text-right font-normal">EMI</th>
                    <th className="py-1 text-right font-normal">End bal.</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {segs.map((s, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1 text-ink-700">{s.label}</td>
                      <td className="py-1 text-right text-tax">{formatNumber(s.ratePct)}%</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(s.emiAtStart)}</td>
                      <td className="py-1 text-right text-ink-700">{formatNumber(s.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Yearly preview */}
        <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
            Yearly rollup ({yearly.length} year{yearly.length === 1 ? '' : 's'})
          </p>
          <div className="max-h-32 overflow-y-auto">
            <table className="w-full text-[10.5px]">
              <thead>
                <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                  <th className="py-1 font-normal">Year</th>
                  <th className="py-1 text-right font-normal">Principal</th>
                  <th className="py-1 text-right font-normal">Interest</th>
                  <th className="py-1 text-right font-normal">Balance</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {yearly.slice(0, 10).map((r) => (
                  <tr key={r.year} className="border-t border-line">
                    <td className="py-1 text-ink-700">{r.year}</td>
                    <td className="py-1 text-right text-ink-950">{formatNumber(r.principal)}</td>
                    <td className="py-1 text-right text-ink-950">{formatNumber(r.interest)}</td>
                    <td className="py-1 text-right text-ink-700">{formatNumber(r.closing)}</td>
                  </tr>
                ))}
                {yearly.length > 10 && (
                  <tr><td colSpan={4} className="py-1 text-center italic text-ink-500">+ {yearly.length - 10} more</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">Total payable</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {schedule.periodsActual} payments
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(schedule.totalPaid, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Method, reset cadence, escrow handling…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Amortization PDF'}
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

function ScheduleMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">LOAN AMORTIZATION SCHEDULE</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Floating Home Loan — Amortization</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Borrower: Marcus Vance · Structure: Floating</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            ['LOAN AMOUNT',   'USD 250,000'],
            ['START RATE',    '6.50% p.a.'],
            ['INITIAL EMI',   'USD 1,864.29'],
            ['TOTAL PAYABLE', 'USD 471,892'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">RATE SEGMENTS</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_50px_70px_70px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>SEGMENT</span><span className="text-right">RATE</span>
            <span className="text-right">EMI</span><span className="text-right">END BAL.</span>
          </div>
          {[
            ['Periods 1–24',   '6.50%', '1,864', '230,318'],
            ['Periods 25–72',  '7.00%', '1,940', '189,547'],
            ['Periods 73–120', '7.50%', '1,994', '120,431'],
            ['Periods 121–240', '7.00%', '1,985', '0'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_50px_70px_70px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span>{r[0]}</span><span className="text-right text-tax">{r[1]}</span>
              <span className="text-right font-bold">{r[2]}</span><span className="text-right">{r[3]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[10px] italic text-ink-500">+ 240 period rows in the full PDF — EMI re-amortizes at every rate reset.</p>
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
            Loan structure in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            re-amortizing schedule out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop in a fixed, floating, or step-up loan. At each rate boundary, the EMI is recalculated on the remaining balance and tenure — exactly how a retail bank handles a reset.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <AmortIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Amortization Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Floating · 4 segments
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Loan type',     'Home loan / Mortgage'],
                  ['Principal',     'USD 250,000.00'],
                  ['Starting rate', '6.50% p.a.'],
                  ['Tenure',        '20 years · monthly'],
                  ['Structure',     'Floating · 4 rate resets'],
                  ['Initial EMI',   'USD 1,864.29'],
                  ['Total interest', 'USD 221,892.71'],
                  ['Periods',       '240 monthly'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Total payable</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 471,892.71</span>
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
                  Bank-grade
                </span>
              </div>
              <ScheduleMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the structure',  'Fixed for one rate across the whole tenure; floating or step-up for rate resets at fixed periods; custom for fully arbitrary segments.'],
  ['02', 'Define the segments', 'Each segment starts at a specific period with its own annual rate. The first segment always starts at period 1 — every subsequent one triggers an EMI recalc.'],
  ['03', 'Export PDF + XLSX',   'PDF with summary cards, rate segments, yearly rollup, and full period table. XLSX has Summary, Schedule, Yearly, and Segments sheets.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Re-amortize like{' '}
              <em className="font-serif font-normal italic text-crimson-300">your bank does.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Floating-rate loans don&rsquo;t keep their EMI flat — at every reset the bank looks at the balance you still owe and the time left, then recomputes the EMI on the new rate. This tool does the same maths, period by period.
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
  { title: 'Four rate structures',     desc: 'Fixed, step-up, floating, or fully custom. Define as many rate boundaries as you need across the loan tenure.' },
  { title: 'EMI re-amortization',      desc: 'At every rate change, the EMI is recomputed on the remaining balance and remaining periods — the same way banks handle a reset.' },
  { title: 'Per-period rate column',   desc: 'Every row in the schedule shows the effective annual rate. Visual marker on the PDF at each boundary so you can see exactly when the reset kicked in.' },
  { title: 'Segment-level rollup',     desc: 'In addition to per-period and per-year views, get a segment-level summary showing EMI, principal, interest, and ending balance for each rate band.' },
  { title: 'Six payment frequencies',  desc: 'Monthly, quarterly, semi-annual, annual, weekly, bi-weekly. Tenure converts automatically based on your chosen frequency.' },
  { title: 'PDF + 4-sheet XLSX',       desc: 'PDF with summary cards, segments table, yearly rollup, full schedule, and totals row. XLSX has Summary, Schedule, Yearly, and Segments sheets.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for serious loans</Eyebrow>
          <SectionTitle>
            Every loan type{' '}
            <em className="font-serif font-normal italic text-crimson-300">handled properly.</em>
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
  { q: 'How is this different from the EMI Schedule tool?',         a: 'The EMI Schedule tool assumes a single rate across the whole tenure — fine for fixed-rate loans. Loan Amortization adds rate segments, so you can model floating-rate loans, step-up structures, or any custom rate schedule. At each segment boundary, the EMI is recomputed.' },
  { q: 'What is EMI re-amortization?',                              a: 'When a loan\'s rate changes mid-tenure, banks typically keep the remaining tenure the same and recompute the EMI on the new rate against the remaining balance. That\'s "re-amortization" — and it\'s what this tool does at every rate boundary.' },
  { q: 'Can I model a step-up loan?',                              a: 'Yes — add a segment for each rate step. For example: 5.5% for periods 1–24, 6.5% for 25–48, 7.5% for 49–end. The EMI rises at each step. Common structure for student loans, salary-linked home loans, and EMI-moratorium products.' },
  { q: 'What about prepayment / extra payments?',                  a: 'Set the "Extra payment per period" field. It\'s added to the principal portion of each EMI; the schedule shortens automatically and total interest drops. Works with any rate structure.' },
  { q: 'Will my bank\'s numbers match exactly?',                   a: 'EMI to within a few cents. Total interest within 0.5%. Differences usually come from how the bank handles month-end day counts, processing-fee amortization, or insurance bundled into the EMI — none of which this tool models.' },
  { q: 'Output formats?',                                           a: 'PDF (multi-page, with summary cards, segments table, yearly rollup, full amortization with rate-boundary markers, totals row, page footers) and XLSX (4 sheets: Summary, Schedule, Yearly, Segments). XLSX columns are numeric — ready for pivots, charts, or further formulas.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">loan amortization.</em>
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
  { name: 'EMI Schedule PDF',      desc: 'Simple flat-rate EMI schedules.',           Icon: EmiIcon,    label: 'TAX', path: '/tools/emi-schedule' },
  { name: 'Tax Calculation Sheet', desc: 'Per-bracket income-tax breakdown.',         Icon: PercentIcon, label: 'TAX' },
  { name: 'VAT Calculator',        desc: 'Add or remove VAT; per-rate breakdown.',    Icon: VatIcon,     label: 'TAX' },
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

export default function LoanAmortizationTool() {
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
