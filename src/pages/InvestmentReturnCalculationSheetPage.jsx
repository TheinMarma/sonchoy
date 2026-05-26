import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  PercentIcon, EmiIcon, AmortIcon, VatIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, INTEREST_METHODS, COMPOUND_FREQUENCIES, TENURE_UNITS, SHEET_PURPOSES,
  findCurrency, findInterestMethod, findCompoundFrequency, findSheetPurpose,
  buildSchedule, buildYearlySummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/interestCalc/compute'
import { generateInterestCalcPdf } from '../lib/interestCalc/generatePdf'
import { generateInterestCalcXlsx } from '../lib/interestCalc/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Investment Return Calculation Sheet"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[560px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['3',       'Methods'],
  ['5',       'Compounding options'],
  ['Period',  'Row-by-row workings'],
  ['Free',    'Always · no signup'],
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
            <span className="text-ink-950">Investment Return Calculation Sheet</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Investment returns
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            CAGR, IRR{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — and absolute,
            </em>
            <br />
            on any{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              holding.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Compute absolute return, CAGR, and approximate IRR on any investment — stocks, mutual funds, FDs, real estate. Period-by-period growth sheet, with annualised and total returns, ready to share with your CA or tuck into your tax file.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Period-by-period workings</span>
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

/* ---------- Method picker ---------- */

function MethodPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {INTEREST_METHODS.map((m) => {
        const active = value === m.id
        return (
          <button key={m.id} type="button" onClick={() => onChange(m.id)}
            className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors ${
              active ? 'border-tax/60 bg-tax-bg' : 'border-line bg-paper hover:border-line-strong'
            }`}>
            <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${active ? 'text-tax' : 'text-ink-500'}`}>
              {m.id.toUpperCase()}
            </span>
            <span className={`text-[11px] leading-tight ${active ? 'text-ink-950' : 'text-ink-700'}`}>
              {m.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  sheetTitle: 'FD Interest Workings — 2026',
  reference: 'INT-2026-FD-0117',
  partyName: 'Marcus Vance',
  purposeId: 'savings',

  methodId: 'compound',
  principal: 250000,
  annualRatePct: 7.25,
  tenureValue: 5,
  tenureUnitId: 'years',
  frequencyId: 'quarterly',
  startDate: todayISO(),
  emi: 0,

  currency: 'INR',

  includeYearlySummary: true,
  notes: 'Worked example for a ₹2,50,000 fixed deposit at 7.25% p.a., compounded quarterly over 5 years. Maturity-value computation matches the bank\'s quarterly-compound formula. For reducing-balance loan checks, switch method to reducing and enter the loan tenure.',
}

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const method = useMemo(() => findInterestMethod(data.methodId), [data.methodId])
  const frequency = useMemo(() => findCompoundFrequency(data.frequencyId), [data.frequencyId])
  const purpose = useMemo(() => findSheetPurpose(data.purposeId), [data.purposeId])
  const schedule = useMemo(() => buildSchedule(data), [data])
  const yearly = useMemo(() => buildYearlySummary(schedule.rows), [schedule.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generateInterestCalcPdf(data) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateInterestCalcXlsx(data) } finally { setBusy(null) } }

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
              {method.label} · {schedule.periods} periods
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Sheet title" value={data.sheetTitle} onChange={setField('sheetTitle')} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference" value={data.reference} onChange={setField('reference')} mono />
          <TextInput label="For (party)" value={data.partyName} onChange={setField('partyName')} />
        </div>
        <div className="mt-2">
          <SelectInput label="Purpose" value={data.purposeId} onChange={setField('purposeId')}
            options={SHEET_PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Method picker */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Method
        </span>
        <MethodPicker value={data.methodId} onChange={setField('methodId')} />

        <div className="my-3.5 h-px bg-line" />

        {/* Inputs */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Inputs
        </span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_92px] gap-2">
            <NumberInput label="Principal" value={data.principal} onChange={setField('principal')} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <NumberInput label="Annual rate" value={data.annualRatePct} onChange={setField('annualRatePct')} suffix="% p.a." />
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <NumberInput label="Tenure" value={data.tenureValue} onChange={setField('tenureValue')} />
            <SelectInput label="Unit" value={data.tenureUnitId} onChange={setField('tenureUnitId')}
              options={TENURE_UNITS.map((u) => ({ value: u.id, label: u.label }))} />
          </div>
          <SelectInput
            label={method.id === 'simple' ? 'Period cadence' : 'Compounding'}
            value={data.frequencyId}
            onChange={setField('frequencyId')}
            options={COMPOUND_FREQUENCIES.map((f) => ({ value: f.id, label: f.label }))}
          />
          <DateInput label="Start date" value={data.startDate} onChange={setField('startDate')} />
          {method.id === 'reducing' && (
            <NumberInput
              label="EMI (0 = auto-compute)"
              value={data.emi}
              onChange={setField('emi')}
              suffix={cur.code}
            />
          )}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <ToggleRow label="Yearly summary" desc="Roll up interest and balance by year"
          checked={data.includeYearlySummary} onChange={setField('includeYearlySummary')} />

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total interest</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(schedule.totalInterest)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">
              {method.id === 'reducing' ? 'Final balance' : 'Maturity value'}
            </p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(schedule.finalBalance)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        {method.id === 'reducing' && schedule.emi > 0 && (
          <div className="mt-2 rounded-lg border border-tax/30 bg-tax-bg/40 px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-tax">
              EMI / {frequency.label.toLowerCase()}
            </p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-ink-950">
              {cur.code} {formatNumber(schedule.emi)}
            </p>
          </div>
        )}

        {/* Period preview */}
        {schedule.rows.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              First {Math.min(8, schedule.rows.length)} of {schedule.rows.length} periods
            </p>
            <div className="max-h-36 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">#</th>
                    <th className="py-1 font-normal">Date</th>
                    <th className="py-1 text-right font-normal">Interest</th>
                    <th className="py-1 text-right font-normal">Balance</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {schedule.rows.slice(0, 8).map((r) => (
                    <tr key={r.n} className="border-t border-line">
                      <td className="py-1 text-ink-700">{r.n}</td>
                      <td className="py-1 text-ink-700">{formatDate(r.date) || '—'}</td>
                      <td className="py-1 text-right text-tax">{formatNumber(r.interestAccrued)}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(r.closing)}</td>
                    </tr>
                  ))}
                  {schedule.rows.length > 8 && (
                    <tr><td colSpan={4} className="py-1 text-center italic text-ink-500">+ {schedule.rows.length - 8} more</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">
              {method.id === 'reducing' ? 'Total interest paid' : 'Maturity value'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {schedule.periods} periods · {method.label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(method.id === 'reducing' ? schedule.totalInterest : schedule.finalBalance, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Method assumptions, rounding policy, source rate…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Interest Sheet PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (3 sheets) <ArrowRight size={10} /></>)}
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

function SheetMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">INTEREST CALCULATION SHEET</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">FD Interest Workings — 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Marcus Vance · Compound interest · Quarterly</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['PRINCIPAL',     'INR 2,50,000'],
            ['RATE',          '7.25% p.a.'],
            ['TOTAL INT.',    'INR 1,09,234'],
            ['MATURITY',      'INR 3,59,234'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">PERIOD-BY-PERIOD SCHEDULE</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[24px_70px_1fr_70px_70px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>#</span><span>DATE</span>
            <span className="text-right">OPENING</span>
            <span className="text-right">INTEREST</span>
            <span className="text-right">CLOSING</span>
          </div>
          {[
            ['1', '20 Aug 2026', '2,50,000', '4,531', '2,54,531'],
            ['2', '20 Nov 2026', '2,54,531', '4,613', '2,59,144'],
            ['3', '20 Feb 2027', '2,59,144', '4,696', '2,63,840'],
            ['4', '20 May 2027', '2,63,840', '4,782', '2,68,622'],
            ['5', '20 Aug 2027', '2,68,622', '4,868', '2,73,490'],
            ['6', '20 Nov 2027', '2,73,490', '4,956', '2,78,446'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[24px_70px_1fr_70px_70px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span>{r[0]}</span>
              <span className="text-ink-700">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right text-tax font-bold">{r[3]}</span>
              <span className="text-right">{r[4]}</span>
            </div>
          ))}
          <div className="grid grid-cols-[24px_70px_1fr_70px_70px] gap-1 border-t-2 border-tax-bg bg-tax/10 px-1.5 py-1 font-mono text-[8.5px] font-bold text-tax">
            <span></span><span>TOTALS</span>
            <span className="text-right"></span>
            <span className="text-right">1,09,234</span>
            <span className="text-right">3,59,234</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[10px] italic text-ink-500">+ 14 more quarterly periods over 5-year tenure</p>
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
            Three numbers in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a defensible workings sheet out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Principal, rate, and tenure — pick the method and you get the full period-by-period accrual, a yearly summary, and the maturity or final balance figure ready to share or verify.
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Interest Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Compound · Quarterly
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Method',     'Compound interest'],
                  ['Principal',  'INR 2,50,000.00'],
                  ['Rate',       '7.25% p.a.'],
                  ['Tenure',     '5 years'],
                  ['Compounding', 'Quarterly (20 periods)'],
                  ['Start date', '20 May 2026'],
                  ['Total interest', 'INR 1,09,234.51'],
                  ['Maturity',   'INR 3,59,234.51'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Maturity value</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 3,59,234.51</span>
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
                  Workings-grade
                </span>
              </div>
              <SheetMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the method',    'Simple, compound, or reducing balance. Each suits a different use case — accrual on principal, growth on growth, or amortising debt.'],
  ['02', 'Set the cadence',    'Annual, semi-annual, quarterly, monthly, or daily. The tool computes per-period rate, period dates, and total periods automatically.'],
  ['03', 'Export PDF + XLSX',  'PDF with summary cards, inputs block, yearly summary, full period table, and totals. XLSX has Summary, Schedule, and Yearly sheets — all numeric.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Interest{' '}
              <em className="font-serif font-normal italic text-crimson-300">— shown working.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Banks and lenders give you a single maturity number; this tool shows the path. Each period&rsquo;s opening balance, accrued interest, cumulative interest, and closing balance — defensible numbers you can paste into a dispute, a tax filing, or a finance team review.
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
  { title: 'Three interest methods',    desc: 'Simple (P × r × t), compound (P × (1+r/n)^(nt)), reducing-balance (EMI amortising principal). Pick by use case.' },
  { title: 'Five compound cadences',    desc: 'Annual, semi-annual, quarterly, monthly, daily. The per-period rate divides the annual rate by frequency — same way banks do it.' },
  { title: 'Tenure in years/months/days', desc: 'No need to pre-convert. Enter the tenure in whatever units the contract uses; the tool resolves to total periods automatically.' },
  { title: 'Auto EMI for reducing',      desc: 'Set the EMI to 0 for reducing-balance and the tool computes the equated payment that fully amortises principal over the tenure.' },
  { title: 'Yearly rollup',              desc: 'On top of the period-by-period schedule, a yearly summary table shows interest accrued and year-end balance — useful for tax reporting.' },
  { title: 'PDF + 3-sheet XLSX',         desc: 'PDF: summary cards, inputs, yearly summary, full period table, totals row. XLSX: Summary, Schedule, Yearly — all numeric for further analysis.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Defensible workings</Eyebrow>
          <SectionTitle>
            Every formula{' '}
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
  { q: 'When should I use simple vs compound interest?',          a: 'Simple interest applies to most short-term loans, statutory late-payment interest, and a few savings products. Compound interest applies to fixed deposits, recurring savings, and most investment products. If you don\'t know, the contract or product brochure says — and the difference becomes large over longer tenures.' },
  { q: 'How is this different from the EMI Schedule tool?',        a: 'EMI Schedule and Loan Amortization are specifically for amortising loans with EMIs. This Interest Calculation Sheet is broader — it also handles simple accrual (penalties, statutory interest) and compound growth (FDs, savings) where there\'s no EMI involved. Reducing-balance method overlaps with EMI, but the focus here is on the interest workings, not the loan structure.' },
  { q: 'What about daily compounding for savings accounts?',      a: 'Set the compound frequency to "Daily". The schedule will have one row per day — handy for short-tenure verification, but expect a long table for multi-year savings. For long tenures, monthly or quarterly compounding usually gives a very close approximation.' },
  { q: 'Why doesn\'t my bank\'s FD calculator match exactly?',    a: 'Almost always within a few currency units. Differences come from how banks handle leap years, day-count conventions (actual/365 vs actual/360 vs 30/360), and rounding at each step. This tool uses 365-day year and standard rounding at each period — same as most retail bank calculators within ~0.1%.' },
  { q: 'Can I model late-payment penalty interest?',              a: 'Yes — use Simple interest with the rate from your contract (or the statutory rate, e.g. UK 8% over base) and tenure in days. The schedule shows daily accrual; the maturity value is the principal plus accumulated interest as at the end date.' },
  { q: 'Output formats?',                                          a: 'PDF (single document with summary cards, inputs block, yearly summary, full period-by-period schedule with totals row, and notes — auto-paginated) and XLSX (3 sheets: Summary, Schedule, Yearly). All numeric — paste straight into a model.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">interest calculations.</em>
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
  { name: 'EMI Schedule PDF',      desc: 'Flat-rate EMI schedules.',                    Icon: EmiIcon,     label: 'TAX', path: '/tools/emi-schedule' },
  { name: 'Loan Amortization',     desc: 'Multi-rate amortization with resets.',        Icon: AmortIcon,   label: 'TAX', path: '/tools/loan-amortization' },
  { name: 'Income Tax Estimator',  desc: 'Annual liability across slabs.',              Icon: PercentIcon, label: 'TAX', path: '/tools/income-tax-estimator' },
  { name: 'GST Calculation Sheet', desc: 'India GST workings with HSN/SAC.',            Icon: VatIcon,     label: 'TAX', path: '/tools/gst-calculation-sheet' },
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

export default function InvestmentReturnCalculationSheetPage() {
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
