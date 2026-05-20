import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  EmiIcon, PercentIcon, VatIcon, PayrollIcon, TaxInvoiceIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, FREQUENCIES, TENURE_UNITS, LOAN_TYPES,
  findCurrency, findFrequency, findTenureUnit, findLoanType,
  computeEmi, tenureToPeriods, buildSchedule, buildYearlySummary,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/emiSchedule/compute'
import { generateEmiSchedulePdf } from '../lib/emiSchedule/generatePdf'
import { generateEmiScheduleXlsx } from '../lib/emiSchedule/generateXlsx'

/* ---------- Local helpers ---------- */

const Eyebrow = ({ children, className = '' }) => (
  <p className={`m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300 ${className}`}>
    {children}
  </p>
)

const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950 ${className}`}>
    {children}
  </h2>
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Live EMI Schedule Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[560px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['EMI',     'Equated instalment'],
  ['6',       'Payment frequencies'],
  ['PDF+',    'XLSX (formulas-ready)'],
  ['Free',    'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 60%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative mx-auto max-w-[1240px] px-6 py-20 md:py-28">
          <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-tax">Tax &amp; Banking</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">EMI Schedule PDF</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Amortization
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Every EMI, every period,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              split to the cent.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop in the principal, rate, and tenure — out comes a clean PDF schedule with the EMI, principal/interest split for every period, a yearly rollup, and an XLSX you can plug into a model.
          </p>

          <div className="mb-12 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn btn-cta btn-xl"
            >
              Launch The Tool
              <ArrowRight size={16} />
            </button>
            <Link
              to="/#tools"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-950/15 bg-ink-950/5 px-7 py-[18px] text-[16px] font-medium leading-none text-ink-950 no-underline backdrop-blur-sm transition-colors hover:bg-ink-950/10 capitalize"
            >
              Explore More Tools
            </Link>
          </div>

          <div className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> No signup, ever
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> 100% local · nothing uploaded
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> XLSX with totals row
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> Esc to close
            </span>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {HERO_STATS.map(([num, lab]) => (
              <div key={lab} className="bg-paper p-5">
                <div className="mb-1 font-medium text-[28px] leading-none tracking-[-0.025em] text-ink-950">
                  {num}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">
                  {lab}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <LiveDemoModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/* ---------- Form input building blocks ---------- */

const labelClass = 'font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500'
const inputClass =
  'w-full min-h-[36px] rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950 ' +
  'placeholder:text-ink-400 outline-none transition-colors ' +
  'focus:border-tax/60 focus:ring-2 focus:ring-tax/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )
}

function NumberInput({ label, value, onChange, suffix, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input
          type="number" inputMode="decimal" step="any"
          value={value ?? 0}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={`${inputClass} text-right font-mono ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function TextareaInput({ label, value, onChange, placeholder, rows = 2, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <textarea
        rows={rows}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} min-h-[58px] resize-y leading-[1.4]`}
      />
    </div>
  )
}

function DateInput({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} font-mono [color-scheme:dark]`}
      />
    </div>
  )
}

function SelectInput({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none cursor-pointer pr-8 bg-[length:14px] bg-no-repeat bg-[right_10px_center]`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='none' stroke='%2382827d' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/></svg>\")",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  scheduleTitle: 'Home Loan — EMI Schedule',
  scheduleReference: 'EMI-2026-HL-0042',
  loanTypeId: 'home',

  borrowerName: 'Marcus Vance',
  lenderName: 'Northwind Mortgage Bank',

  principal: 250000,
  annualRatePct: 6.5,
  currency: 'USD',

  tenureValue: 20,
  tenureUnitId: 'years',
  frequencyId: 'monthly',

  startDate: todayISO(),
  firstPaymentDate: '',     // auto-derived if blank
  extraPayment: 0,

  notes: 'Standard EMI loan based on declining balance method. Schedule assumes no prepayment, fixed rate, and payment received on the due date.',
}

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const frequency = useMemo(() => findFrequency(data.frequencyId), [data.frequencyId])
  const tenureUnit = useMemo(() => findTenureUnit(data.tenureUnitId), [data.tenureUnitId])
  const loanType = useMemo(() => findLoanType(data.loanTypeId), [data.loanTypeId])
  const cur = useMemo(() => findCurrency(data.currency), [data.currency])

  const periods = useMemo(
    () => tenureToPeriods({
      tenureValue: data.tenureValue,
      tenureUnitId: data.tenureUnitId,
      frequencyId: data.frequencyId,
    }),
    [data.tenureValue, data.tenureUnitId, data.frequencyId]
  )

  const firstPaymentDate = useMemo(() => {
    if (data.firstPaymentDate) return data.firstPaymentDate
    // Default: first scheduled payment one period after start
    if (!data.startDate) return ''
    return data.startDate
  }, [data.firstPaymentDate, data.startDate])

  const emi = useMemo(
    () => computeEmi({
      principal: data.principal,
      annualRatePct: data.annualRatePct,
      periods,
      frequencyId: data.frequencyId,
    }),
    [data.principal, data.annualRatePct, periods, data.frequencyId]
  )

  const schedulePayload = useMemo(() => ({
    ...data,
    periods,
    firstPaymentDate,
  }), [data, periods, firstPaymentDate])

  const schedule = useMemo(() => buildSchedule(schedulePayload), [schedulePayload])
  const yearly = useMemo(() => buildYearlySummary(schedule.rows), [schedule.rows])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generateEmiSchedulePdf(schedulePayload) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateEmiScheduleXlsx(schedulePayload) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <EmiIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              EMI schedule · {periods} {frequency.label.toLowerCase()} periods
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700"
          >
            Reset
          </button>
        </div>

        <TextInput
          label="Schedule title"
          value={data.scheduleTitle}
          onChange={setField('scheduleTitle')}
          placeholder="Home Loan — EMI Schedule"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput
            label="Reference"
            value={data.scheduleReference}
            onChange={setField('scheduleReference')}
            placeholder="EMI-2026-0001"
            mono
          />
          <SelectInput
            label="Loan type"
            value={data.loanTypeId}
            onChange={setField('loanTypeId')}
            options={LOAN_TYPES.map((l) => ({ value: l.id, label: l.label }))}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Borrower" value={data.borrowerName} onChange={setField('borrowerName')} />
          <TextInput label="Lender"   value={data.lenderName}   onChange={setField('lenderName')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Loan inputs */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Loan terms
        </span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_92px] gap-2">
            <NumberInput label="Principal" value={data.principal} onChange={setField('principal')} />
            <SelectInput
              label="Currency"
              value={data.currency}
              onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))}
            />
          </div>
          <NumberInput label="Annual interest rate" value={data.annualRatePct} onChange={setField('annualRatePct')} suffix="% p.a." />
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <NumberInput
              label="Tenure"
              value={data.tenureValue}
              onChange={setField('tenureValue')}
            />
            <SelectInput
              label="Unit"
              value={data.tenureUnitId}
              onChange={setField('tenureUnitId')}
              options={TENURE_UNITS.map((u) => ({ value: u.id, label: u.label }))}
            />
          </div>
          <SelectInput
            label="Payment frequency"
            value={data.frequencyId}
            onChange={setField('frequencyId')}
            options={FREQUENCIES.map((f) => ({ value: f.id, label: f.label }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <DateInput label="Start date"     value={data.startDate}        onChange={setField('startDate')} />
            <DateInput label="First payment"  value={data.firstPaymentDate} onChange={setField('firstPaymentDate')} />
          </div>
          <NumberInput
            label="Extra payment per period (optional)"
            value={data.extraPayment}
            onChange={setField('extraPayment')}
            suffix={cur.code}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live computed cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">EMI</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(emi)}</p>
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

        <div className="my-3.5 h-px bg-line" />

        {/* Yearly preview */}
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
            Yearly rollup ({yearly.length} year{yearly.length === 1 ? '' : 's'})
          </p>
          <div className="max-h-36 overflow-y-auto">
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
                {yearly.slice(0, 12).map((r) => (
                  <tr key={r.year} className="border-t border-line">
                    <td className="py-1 text-ink-700">{r.year}</td>
                    <td className="py-1 text-right text-ink-950">{formatNumber(r.principal)}</td>
                    <td className="py-1 text-right text-ink-950">{formatNumber(r.interest)}</td>
                    <td className="py-1 text-right text-ink-700">{formatNumber(r.closing)}</td>
                  </tr>
                ))}
                {yearly.length > 12 && (
                  <tr><td colSpan={4} className="py-1 text-center italic text-ink-500">+ {yearly.length - 12} more years</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">
              EMI per {frequency.label.toLowerCase()}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {schedule.periodsActual} payments
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(emi, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (appear in PDF)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Method, assumptions, rate-reset terms…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Schedule PDF'}
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={handleXlsx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'xlsx' ? '…' : (<>Export XLSX (3 sheets) <ArrowRight size={10} /></>)}
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">
            100% local · nothing uploaded
          </span>
          <a
            href="https://go.sonchoy.com/pdfFiller"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-crimson-300 no-underline hover:text-crimson-400"
          >
            Need e-signing?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function ScheduleMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">EMI / AMORTIZATION SCHEDULE</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Home Loan — EMI Schedule</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Borrower: Marcus Vance · Lender: Northwind Mortgage Bank</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            ['LOAN AMOUNT',   'USD 250,000.00'],
            ['INTEREST RATE', '6.50% p.a.'],
            ['EMI / MONTHLY', 'USD 1,864.29'],
            ['TOTAL PAYABLE', 'USD 447,430'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">AMORTIZATION SCHEDULE</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[28px_60px_1fr_1fr_1fr_1fr] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>#</span><span>DUE</span>
            <span className="text-right">OPENING</span><span className="text-right">EMI</span>
            <span className="text-right">INTEREST</span><span className="text-right">PRINCIPAL</span>
          </div>
          {[
            ['1', '19 Jun 2026', '250,000', '1,864', '1,354', '510'],
            ['2', '19 Jul 2026', '249,490', '1,864', '1,351', '513'],
            ['3', '19 Aug 2026', '248,977', '1,864', '1,349', '516'],
            ['4', '19 Sep 2026', '248,461', '1,864', '1,346', '518'],
            ['5', '19 Oct 2026', '247,943', '1,864', '1,343', '521'],
            ['6', '19 Nov 2026', '247,422', '1,864', '1,340', '524'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[28px_60px_1fr_1fr_1fr_1fr] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span>{r[0]}</span><span className="text-ink-700">{r[1]}</span>
              <span className="text-right">{r[2]}</span><span className="text-right font-bold">{r[3]}</span>
              <span className="text-right">{r[4]}</span><span className="text-right">{r[5]}</span>
            </div>
          ))}
          <div className="grid grid-cols-[28px_60px_1fr_1fr_1fr_1fr] gap-1 border-t-2 border-tax-bg bg-tax/10 px-1.5 py-1 font-mono text-[8.5px] font-bold text-tax">
            <span></span><span>TOTALS</span>
            <span className="text-right"></span>
            <span className="text-right">447,430</span>
            <span className="text-right">197,430</span>
            <span className="text-right">250,000</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[10px] italic text-ink-500">+ 234 more rows over 240 monthly periods</p>
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
            Loan terms in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a full amortization out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            EMI, every period&rsquo;s principal/interest split, opening and closing balance, yearly rollup, and totals — all in one PDF, with an XLSX for the modellers.
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    EMI Calculator
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  240 monthly periods
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Loan type',         'Home loan / Mortgage'],
                  ['Principal',         'USD 250,000.00'],
                  ['Rate',              '6.5% p.a.'],
                  ['Tenure',            '20 years · monthly'],
                  ['Start date',        '19 May 2026'],
                  ['Extra / period',    'USD 0.00'],
                  ['EMI',               'USD 1,864.29 / mo'],
                  ['Total interest',    'USD 197,430.50'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Total payable</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 447,430.50</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    OUTPUT.PDF
                  </span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Bank-ready
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
  ['01', 'Three numbers',     'Principal, annual rate, tenure. The EMI computes from the standard amortization formula — same one your bank uses.'],
  ['02', 'Pick the frequency', 'Monthly is most common; the tool also supports quarterly, semi-annual, annual, weekly, and bi-weekly. Tenure converts automatically to the right number of periods.'],
  ['03', 'Export PDF + XLSX', 'PDF for printing, sharing, or attaching to a loan agreement. XLSX has three sheets — summary, full schedule, yearly rollup — ready to drop into a model.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              The maths{' '}
              <em className="font-serif font-normal italic text-crimson-300">your bank does</em>{' '}
              — in your browser.
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Every retail loan in the world uses the same EMI formula on a declining balance. This tool runs it locally, lets you tweak the inputs, and shows you the full schedule before you sign anything.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(([num, title, desc]) => (
            <div key={num} className="rounded-xl border border-line bg-surface p-8">
              <div className="mb-4 font-serif text-[56px] font-normal italic leading-none text-crimson-300">
                {num}
              </div>
              <h4 className="m-0 mb-2 text-xl font-medium tracking-[-0.015em] text-ink-950">
                {title}
              </h4>
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
  { title: 'Declining-balance EMI',     desc: 'The standard amortization formula — same one banks use. P × r × (1+r)^n / ((1+r)^n − 1).' },
  { title: 'Six payment frequencies',   desc: 'Monthly, quarterly, semi-annual, annual, weekly, bi-weekly. Tenure converts automatically based on the frequency you pick.' },
  { title: 'Extra-payment toggle',      desc: 'Add a flat extra-payment per period to model accelerated payoff. The schedule shortens and total interest drops accordingly.' },
  { title: 'Yearly rollup',             desc: 'In addition to the period-by-period schedule, a yearly summary shows total principal, interest, and year-end balance by calendar year.' },
  { title: 'Period-end dates',          desc: 'Each row gets its actual due date — calculated from your start date and the chosen frequency, respecting month-end logic.' },
  { title: 'PDF + 3-sheet XLSX',        desc: 'PDF with summary cards, yearly rollup, and full period table. XLSX has Summary, Schedule, and Yearly sheets — pre-formatted for further analysis.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for borrowers &amp; lenders</Eyebrow>
          <SectionTitle>
            Every number you need to{' '}
            <em className="font-serif font-normal italic text-crimson-300">sign with confidence.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-tax/20 bg-tax-bg text-tax">
                <Check size={16} />
              </div>
              <h4 className="m-0 mb-2 text-lg font-medium tracking-[-0.015em] text-ink-950">
                {f.title}
              </h4>
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
  { q: 'What does EMI actually mean?',                          a: 'EMI is "Equated Monthly Instalment" — the fixed amount you pay each period that includes both interest and principal. The split shifts over time: early payments are mostly interest, late payments are mostly principal. Total amount per period stays constant.' },
  { q: 'Will my bank\'s number match exactly?',                a: 'Almost always within a few cents per EMI. Different banks round at different steps, and some apply rate-reset, processing-fee amortization, or insurance — the tool models the pure amortization. The total interest figure should be within 0.5% of the bank\'s.' },
  { q: 'Why does monthly interest move down each period?',     a: 'EMI is calculated on a declining-balance basis. Each period, interest is charged on the remaining balance — and since principal goes down, interest does too. The principal portion of the EMI rises every period to compensate, keeping the EMI itself constant.' },
  { q: 'Can I model prepayment / extra payments?',             a: 'Yes — set the "Extra payment per period" field. It\'s added to the principal portion of each EMI, the schedule shortens automatically, and total interest drops. The final period\'s payment is auto-adjusted to settle any remaining balance.' },
  { q: 'What\'s the difference between monthly and weekly EMIs?', a: 'Weekly / bi-weekly EMIs charge interest more frequently, which means slightly less interest accrues between compounding steps. Over a 20-year loan, switching from monthly to bi-weekly can save several percent on total interest — though most banks only offer monthly.' },
  { q: 'Output formats?',                                       a: 'PDF (multi-page, with summary cards, yearly rollup, full amortization table, and totals row) and XLSX (three sheets: Summary, Schedule, Yearly). The XLSX columns are numeric and ready for further formulas, pivots, or charts.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">EMI schedules.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {FAQS.map(({ q, a }, idx) => (
            <div key={q} className="bg-surface p-8">
              <h4 className="m-0 mb-3 flex items-start gap-3 text-lg font-medium tracking-[-0.015em] text-ink-950">
                <span className="mt-1 shrink-0 font-mono text-[11px] tracking-[0.1em] text-crimson-300">
                  {String(idx + 1).padStart(2, '0')}
                </span>
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
  { name: 'Tax Calculation Sheet', desc: 'Per-bracket income-tax breakdown.',          Icon: PercentIcon,    label: 'TAX' },
  { name: 'VAT Calculator',        desc: 'Add or remove VAT; per-rate breakdown.',     Icon: VatIcon,        label: 'TAX' },
  { name: 'Payroll Tax Report',    desc: 'Per-employee tax + employer contributions.', Icon: PayrollIcon,    label: 'TAX' },
  { name: 'GST/VAT Invoice',       desc: 'Tax-compliant invoicing with GSTIN/VAT.',    Icon: TaxInvoiceIcon, label: 'INVOICING' },
]

function RelatedTools() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="mb-3">05 — Related tools</Eyebrow>
            <SectionTitle>
              Often used{' '}
              <em className="font-serif font-normal italic text-crimson-300">together.</em>
            </SectionTitle>
          </div>
          <Link
            to="/#tools"
            className="inline-flex items-center gap-2 font-medium text-[14px] text-crimson-300 underline decoration-crimson-500/40 underline-offset-4 hover:decoration-crimson-300"
          >
            Browse all 91 tools
            <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((t) => {
            const inner = (
              <>
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-tax">
                  {t.label}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-tax-bg text-tax">
                  <t.Icon />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-md font-medium tracking-[-0.01em] text-ink-950">{t.name}</h4>
                  <p className="m-0 text-xs leading-[1.5] text-ink-500">{t.desc}</p>
                </div>
              </>
            )
            const cls =
              'group relative flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md'
            return t.path ? (
              <Link key={t.name} to={t.path} className={cls}>{inner}</Link>
            ) : (
              <a key={t.name} href="#" className={cls}>{inner}</a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function EmiSchedulePage() {
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
