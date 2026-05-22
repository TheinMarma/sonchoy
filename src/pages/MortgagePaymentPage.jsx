import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  AmortIcon, EmiIcon, PercentIcon, CreditCardIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, LOAN_PROGRAMS, PMI_RULES,
  findCurrency, findLoanProgram, findPmiRule,
  buildSchedule, buildYearlySummary, computeAffordability, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/mortgagePayment/compute'
import { generateMortgagePdf } from '../lib/mortgagePayment/generatePdf'
import { generateMortgageXlsx } from '../lib/mortgagePayment/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Mortgage Payment Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[600px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['PITI',     'Principal + Interest + Taxes + Insurance'],
  ['PMI',      'Auto-drop at 78% LTV'],
  ['DTI',      'Front-end affordability check'],
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
            <span className="text-ink-950">Mortgage Payment PDF</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · PITI schedule
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            P+I+T+I{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — the whole
            </em>
            <br />
            mortgage{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              picture.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Not just the principal-and-interest number — the real monthly mortgage cost, with property tax, homeowner&rsquo;s insurance, PMI (auto-drop at 78% LTV), HOA fees, plus a full amortization schedule and affordability check.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Full PITI breakdown</span>
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

/* ---------- Initial state ---------- */

const INITIAL = {
  scheduleTitle: 'Mortgage Payment Schedule — 2026',
  reference: 'MTG-2026-0042',
  borrowerName: 'Marcus & Sara Vance',
  propertyAddress: '142 Maple Avenue, Austin, TX 78704',
  programId: 'conv-30',
  currency: 'USD',

  homePrice: 485000,
  downPayment: 72750,        // 15%
  annualRatePct: 6.5,
  termYears: 30,
  startDate: todayISO(),

  propertyTaxAnnual: 8740,    // ~1.8% of home price (Texas range)
  insuranceAnnual: 1820,
  hoaMonthly: 45,
  pmiAnnualRatePct: 0.55,
  pmiRuleId: 'auto',
  pmiManualMonths: 0,

  extraPrincipal: 0,
  grossMonthlyIncome: 9500,

  includeYearlySummary: true,
  includeAffordability: true,

  notes: 'Conventional 30-year fixed at 6.5%. 15% down means PMI applies until LTV drops below 78% (≈ year 7 at this rate). Texas property tax is unusually high — verify the actual rate for your county before relying on these figures.',
}

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const program = useMemo(() => findLoanProgram(data.programId), [data.programId])
  const pmiRule = useMemo(() => findPmiRule(data.pmiRuleId), [data.pmiRuleId])
  const schedule = useMemo(() => buildSchedule(data), [data])
  const aff = useMemo(() => computeAffordability({
    monthlyPiti: schedule.monthlyPiti,
    grossMonthlyIncome: data.grossMonthlyIncome,
  }), [schedule.monthlyPiti, data.grossMonthlyIncome])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => setData({ ...INITIAL })

  // When program changes, update term years
  const applyProgram = (id) => {
    const p = findLoanProgram(id)
    setData((s) => ({ ...s, programId: id, termYears: p.termYears }))
  }

  const handlePdf  = async () => { try { setBusy('pdf');  generateMortgagePdf(data) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateMortgageXlsx(data) } finally { setBusy(null) } }

  const ltv = data.homePrice > 0 ? (data.downPayment / data.homePrice) * 100 : 0
  const escrowTotal = schedule.monthlyTax + schedule.monthlyInsurance + schedule.monthlyPmi + schedule.hoaMonthly

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
              Mortgage · {schedule.termYears} yr · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Schedule title" value={data.scheduleTitle} onChange={setField('scheduleTitle')} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference" value={data.reference} onChange={setField('reference')} mono />
          <DateInput label="Start date" value={data.startDate} onChange={setField('startDate')} />
        </div>
        <div className="mt-2">
          <TextInput label="Borrower" value={data.borrowerName} onChange={setField('borrowerName')} />
        </div>
        <div className="mt-2">
          <TextInput label="Property address" value={data.propertyAddress} onChange={setField('propertyAddress')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Loan setup */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Loan setup
        </span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_92px] gap-2">
            <SelectInput label="Loan program" value={data.programId} onChange={applyProgram}
              options={LOAN_PROGRAMS.map((p) => ({ value: p.id, label: p.label }))} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Home price"  value={data.homePrice}  onChange={setField('homePrice')} />
            <NumberInput label="Down payment" value={data.downPayment} onChange={setField('downPayment')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Interest rate" value={data.annualRatePct} onChange={setField('annualRatePct')} suffix="% APR" />
            <NumberInput label="Loan term"     value={data.termYears}     onChange={setField('termYears')}     suffix="yr" />
          </div>
          <NumberInput label="Extra principal / month" value={data.extraPrincipal} onChange={setField('extraPrincipal')} suffix={cur.code} />
        </div>

        <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5 font-mono text-[11px]">
          <span className="text-ink-500">LTV at origination</span>
          <span className="text-ink-950">{formatNumber(100 - ltv)}%</span>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Escrow */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Escrow &amp; ongoing costs
        </span>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Property tax / year"     value={data.propertyTaxAnnual} onChange={setField('propertyTaxAnnual')} suffix={cur.code} />
            <NumberInput label="Insurance / year"         value={data.insuranceAnnual}   onChange={setField('insuranceAnnual')}   suffix={cur.code} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="HOA / month"             value={data.hoaMonthly}        onChange={setField('hoaMonthly')}        suffix={cur.code} />
            <NumberInput label="PMI rate"                value={data.pmiAnnualRatePct}  onChange={setField('pmiAnnualRatePct')}  suffix="% p.a." />
          </div>
          <SelectInput label="PMI rule" value={data.pmiRuleId} onChange={setField('pmiRuleId')}
            options={PMI_RULES.map((p) => ({ value: p.id, label: p.label }))} />
          {pmiRule.id === 'manual' && (
            <NumberInput label="PMI applies for" value={data.pmiManualMonths} onChange={setField('pmiManualMonths')} suffix="months" />
          )}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Affordability */}
        <NumberInput label="Gross monthly income (optional)" value={data.grossMonthlyIncome} onChange={setField('grossMonthlyIncome')} suffix={cur.code} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Optional sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Yearly summary" desc="Roll up principal, interest, escrow by year"
            checked={data.includeYearlySummary} onChange={setField('includeYearlySummary')} />
          <ToggleRow label="Affordability check" desc="Front-end DTI ratio (PITI ÷ gross income)"
            checked={data.includeAffordability} onChange={setField('includeAffordability')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* PITI breakdown live */}
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">Monthly PITI breakdown</p>
          <div className="space-y-1 text-[11px]">
            {[
              ['Principal & interest',      schedule.pi],
              ['Property tax',              schedule.monthlyTax],
              ['Insurance',                 schedule.monthlyInsurance],
              ['PMI',                       schedule.monthlyPmi],
              ['HOA',                       schedule.hoaMonthly],
            ].filter(([, v]) => v > 0).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between font-mono">
                <span className="text-ink-500">{k}</span>
                <span className="text-ink-950">{formatNumber(v)}</span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-line pt-1.5 font-mono">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Total monthly PITI</span>
              <span className="font-mono text-[12.5px] font-bold text-tax">{formatNumber(schedule.monthlyPiti)}</span>
            </div>
          </div>
        </div>

        {/* Affordability live */}
        {data.includeAffordability && Number(data.grossMonthlyIncome) > 0 && (
          <div className="mt-2 rounded-lg border border-line bg-canvas px-3 py-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-ink-500">Front-end DTI ({aff.status})</span>
              <span className={`font-bold ${
                aff.status === 'comfortable' ? 'text-success' :
                aff.status === 'tight'        ? 'text-yellow-500' :
                aff.status === 'stretched'    ? 'text-amber-600' : 'text-crimson-400'
              }`}>
                {formatNumber(aff.ratio)}%
              </span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">Total interest paid</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {schedule.termYears} yr · {program.label.split(' ')[0]}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(schedule.totalInterest, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Lender contact, rate-lock expiry, escrow review date…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Mortgage PDF'}
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

function ScheduleMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">MORTGAGE PAYMENT SCHEDULE</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Mortgage Schedule — 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Marcus &amp; Sara Vance · 142 Maple Avenue, Austin TX · 30-yr fixed</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['PITI',     'USD 3,442'],
            ['P&I',      'USD 2,604'],
            ['ESCROW',   'USD 838'],
            ['LOAN',     'USD 412,250'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">PITI BREAKDOWN</p>
        <div className="mt-1 overflow-hidden rounded border border-line bg-canvas px-2.5 py-2">
          {[
            ['Principal & interest',  '2,604.30'],
            ['Property tax',          '728.33'],
            ['Homeowner\'s insurance', '151.67'],
            ['PMI (until 78% LTV)',   '188.86'],
            ['HOA fee',                '45.00'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-t border-line py-1 first:border-t-0 text-[9px]">
              <span className="text-ink-500">{k}</span>
              <span className="font-mono text-ink-950">{v}</span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t-2 border-tax-bg pt-1.5">
            <span className="font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-tax">TOTAL PITI</span>
            <span className="font-mono text-[11px] font-bold text-tax">USD 3,442.16</span>
          </div>
        </div>

        <p className="m-0 mt-3 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">SCHEDULE PREVIEW</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[24px_60px_1fr_50px_50px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>#</span><span>DATE</span>
            <span className="text-right">P&I</span>
            <span className="text-right">ESC.</span>
            <span className="text-right">BAL</span>
          </div>
          {[
            ['1', 'Jun 2026', '2,604',  '838',  '411,879'],
            ['2', 'Jul 2026', '2,604',  '838',  '411,506'],
            ['3', 'Aug 2026', '2,604',  '838',  '411,131'],
            ['4', 'Sep 2026', '2,604',  '838',  '410,754'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[24px_60px_1fr_50px_50px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span>{r[0]}</span>
              <span className="text-ink-700">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right text-ink-700">{r[3]}</span>
              <span className="text-right font-bold">{r[4]}</span>
            </div>
          ))}
        </div>
        <p className="m-0 mt-2 text-[9px] italic text-ink-500">+ 356 more months in the full schedule</p>
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
            Home price in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            real monthly payment out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Most calculators stop at P&amp;I — the "principal-and-interest" payment alone. This tool gives you the real PITI number with property tax, insurance, PMI, and HOA — what actually leaves your bank each month.
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Mortgage Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  30-yr fixed · 6.5%
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Borrower',     'Marcus & Sara Vance'],
                  ['Property',     '142 Maple Avenue, Austin TX'],
                  ['Home price',   'USD 485,000.00'],
                  ['Down',         'USD 72,750 (15%)'],
                  ['Loan',         'USD 412,250 @ 6.5%'],
                  ['Term',         '30 years (360 months)'],
                  ['Tax + ins',    'USD 880 / mo escrowed'],
                  ['DTI',          '36% (tight)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Monthly PITI</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 3,442.16</span>
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
                  Closing-ready
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
  ['01', 'Set up the loan',     'Home price, down payment, rate, term. Pick the program (30-yr conventional, FHA, VA, 15-yr, etc.) — the tool tracks loan-to-value automatically.'],
  ['02', 'Drop in escrow',       'Annual property tax, homeowner\'s insurance, monthly HOA, and PMI rate. PMI auto-drops at 78% LTV (the US default) — or set a manual cutoff.'],
  ['03', 'Export PDF + XLSX',   'PDF: PITI summary, loan details, PITI breakdown, affordability check, total cost, yearly summary, monthly schedule. XLSX: 3 sheets with full numeric data.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Beyond P&I{' '}
              <em className="font-serif font-normal italic text-crimson-300">— the real payment.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A 30-year mortgage at 6.5% looks like ₹/$ X per month in the principal-and-interest column. Add taxes (escrowed), insurance, PMI, and HOA — and the real cheque that leaves your account is often 30–40% larger. This tool shows you both.
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
  { title: 'Full PITI calculation',     desc: 'Principal + Interest + Taxes + Insurance — the four-part US-standard monthly mortgage cost. Plus PMI and HOA if applicable.' },
  { title: 'PMI auto-drop',             desc: 'PMI runs until the loan-to-value ratio drops below 78% (US default), then auto-stops. Or set a manual cutoff month for cards that do it differently.' },
  { title: '7 loan programs',           desc: 'Conventional 30 / 15-year, FHA, VA, jumbo, 5/1 ARM (first 5 years), or fully custom term. Program defaults set the term automatically.' },
  { title: 'Affordability check',       desc: 'Optional gross-monthly-income input gives you a front-end DTI ratio (PITI ÷ income) and a comfort rating: comfortable / tight / stretched / risky.' },
  { title: 'Extra-principal modelling', desc: 'Add a flat extra-principal payment each month to model accelerated payoff — total interest drops and PMI clears faster.' },
  { title: 'PDF + 3-sheet XLSX',        desc: 'PDF: cards, breakdown, affordability, total cost, yearly summary, first 60 months. XLSX: Summary, Schedule, Yearly — full schedule numeric.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Closing-table ready</Eyebrow>
          <SectionTitle>
            Every line the{' '}
            <em className="font-serif font-normal italic text-crimson-300">closing disclosure</em> shows.
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
  { q: 'What is PITI?',                                                 a: 'Principal + Interest + Taxes + Insurance — the four components of a full US-style monthly mortgage payment. Most online calculators only show P&I; the lender actually collects all four (taxes and insurance go into an escrow account they pay on your behalf).' },
  { q: 'When does PMI drop off?',                                       a: 'Under the US Homeowners Protection Act, PMI auto-cancels when the loan balance reaches 78% of the original home value (assuming on-time payments). The tool defaults to this rule. You can also request manual cancellation at 80% LTV, or pick the "manual months" option to model a different cutoff.' },
  { q: 'How is this different from EMI Schedule or Loan Amortization?', a: 'EMI Schedule and Loan Amortization compute principal-and-interest only — fine for personal/auto loans where taxes don\'t apply. This tool adds the escrow components (tax, insurance, PMI, HOA) that mortgage payments include — and shows the real monthly cheque.' },
  { q: 'What property tax rate should I use?',                          a: 'It varies dramatically by US state and county — Texas (~1.6–2.5%), California (~1%), New Jersey (~2.5%) are typical extremes. The tool takes an annual figure rather than a percentage so you can plug in whatever your closing disclosure or tax assessment shows.' },
  { q: 'Can I model an ARM?',                                          a: 'Pick the 5/1 ARM program for the first-5-year fixed period. To model the post-reset rate, use the Loan Amortization tool which supports multiple rate segments — this Mortgage tool is best for fixed-rate or initial-period fixed scenarios.' },
  { q: 'Output formats?',                                                a: 'PDF (loan details, PITI breakdown, affordability check, total-cost-over-life, yearly summary, monthly schedule with the first 60 months, totals row, notes — auto-paginated) and XLSX (3 sheets: Summary, Schedule, Yearly). All numeric.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">mortgage payments.</em>
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
  { name: 'EMI Schedule PDF',           desc: 'Single-loan amortization.',                  Icon: EmiIcon,        label: 'TAX', path: '/tools/emi-schedule' },
  { name: 'Loan Amortization',          desc: 'Multi-rate amortization with resets.',       Icon: AmortIcon,      label: 'TAX', path: '/tools/loan-amortization' },
  { name: 'Monthly Loan Payment',       desc: 'Multi-loan monthly outflow.',                Icon: EmiIcon,        label: 'TAX', path: '/tools/monthly-loan-payment' },
  { name: 'Credit Card Payment Schedule', desc: 'Card payoff — min vs accelerated.',         Icon: CreditCardIcon, label: 'TAX', path: '/tools/credit-card-payment-schedule' },
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

export default function MortgagePaymentPage() {
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
