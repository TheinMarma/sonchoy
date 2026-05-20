import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  CreditCardIcon, EmiIcon, AmortIcon, PercentIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, STRATEGIES, PAYOFF_GOALS,
  findCurrency, findStrategy, findPayoffGoal,
  computeSchedule, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/creditCardPayment/compute'
import { generateCreditCardSchedulePdf } from '../lib/creditCardPayment/generatePdf'
import { generateCreditCardScheduleXlsx } from '../lib/creditCardPayment/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Credit Card Payment Schedule"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[560px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Min vs Fixed', 'Side-by-side'],
  ['Months',       'to payoff'],
  ['Interest',     'saved · shown'],
  ['Free',         'Always · no signup'],
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
            <span className="text-ink-950">Credit Card Payment Schedule</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Card payoff
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            See what minimums{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              really cost
            </em>
            <br />
            — and a plan to{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              clear it.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Compare paying just the minimum versus a fixed monthly payment. The tool simulates every month, shows the principal/interest split, and tells you exactly how many months and how much interest you save by paying above the minimum.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Minimum vs accelerated</span>
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

/* ---------- Strategy picker ---------- */

function StrategyPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STRATEGIES.map((s) => {
        const active = value === s.id
        return (
          <button key={s.id} type="button" onClick={() => onChange(s.id)}
            className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors ${
              active ? 'border-tax/60 bg-tax-bg' : 'border-line bg-paper hover:border-line-strong'
            }`}>
            <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${active ? 'text-tax' : 'text-ink-500'}`}>
              {s.id.toUpperCase()}
            </span>
            <span className={`text-[10.5px] leading-tight ${active ? 'text-ink-950' : 'text-ink-700'}`}>
              {s.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  scheduleTitle: 'Credit Card Payoff Plan — May 2026',
  reference: 'CCP-2026-05-0042',
  cardholderName: 'Marcus Vance',
  cardName: 'HDFC Regalia Credit Card',
  goalId: 'fastest',
  strategyId: 'compare',
  currency: 'INR',

  balance: 125000,
  annualRatePct: 36,
  minPercentPct: 5,
  minFloor: 250,

  fixedPayment: 8000,
  monthlyCharges: 0,

  startDate: todayISO(),
  minMaxMonths: 480,
  fixedMaxMonths: 60,

  notes: 'Stop using the card while paying it off — any new charges restart the clock. The 36% APR is typical for revolving balances; rewards-card APRs in India range 30–42%. Compare minimum-only vs ₹8K fixed; the fixed plan typically saves a large chunk of interest.',
}

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const result = useMemo(() => computeSchedule(data), [data])
  const { strategy, minimumSim, fixedSim, savings } = result
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generateCreditCardSchedulePdf(data) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateCreditCardScheduleXlsx(data) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <CreditCardIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Card payoff · {strategy.label} · {sections} sections
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
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Cardholder" value={data.cardholderName} onChange={setField('cardholderName')} />
          <TextInput label="Card name" value={data.cardName} onChange={setField('cardName')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Strategy
        </span>
        <StrategyPicker value={data.strategyId} onChange={setField('strategyId')} />

        <div className="my-3.5 h-px bg-line" />

        {/* Card inputs */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Card terms
        </span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_92px] gap-2">
            <NumberInput label="Current balance" value={data.balance} onChange={setField('balance')} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <NumberInput label="APR" value={data.annualRatePct} onChange={setField('annualRatePct')} suffix="% p.a." />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Min payment %" value={data.minPercentPct} onChange={setField('minPercentPct')} suffix="%" />
            <NumberInput label="Min payment floor" value={data.minFloor} onChange={setField('minFloor')} suffix={cur.code} />
          </div>
          {(strategy.id === 'fixed' || strategy.id === 'compare') && (
            <NumberInput label="Fixed monthly payment" value={data.fixedPayment} onChange={setField('fixedPayment')} suffix={cur.code} />
          )}
          <NumberInput label="New charges per month" value={data.monthlyCharges} onChange={setField('monthlyCharges')} suffix={cur.code} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards: primary scenario */}
        {(strategy.id === 'minimum' || strategy.id === 'fixed') && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Months</p>
              <p className={`m-0 mt-1 font-mono text-[13px] font-semibold ${(strategy.id === 'minimum' ? minimumSim : fixedSim)?.paidOff ? 'text-ink-950' : 'text-crimson-400'}`}>
                {(strategy.id === 'minimum' ? minimumSim : fixedSim)?.paidOff
                  ? (strategy.id === 'minimum' ? minimumSim : fixedSim).months
                  : 'Never'}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total interest</p>
              <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-crimson-400">
                {formatNumber((strategy.id === 'minimum' ? minimumSim : fixedSim)?.totalInterest || 0)}
              </p>
              <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
            </div>
            <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total paid</p>
              <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">
                {formatNumber((strategy.id === 'minimum' ? minimumSim : fixedSim)?.totalPaid || 0)}
              </p>
              <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
            </div>
          </div>
        )}

        {/* Compare scenario */}
        {strategy.id === 'compare' && minimumSim && fixedSim && (
          <>
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
              Side-by-side comparison
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
                <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Minimum only</p>
                <p className={`m-0 mt-1 font-mono text-[12px] font-semibold ${minimumSim.paidOff ? 'text-ink-950' : 'text-crimson-400'}`}>
                  {minimumSim.paidOff ? `${minimumSim.months} months` : 'Never pays off'}
                </p>
                <p className="m-0 mt-0.5 font-mono text-[10.5px] text-ink-500">
                  Interest <span className="text-crimson-400">{formatNumber(minimumSim.totalInterest)}</span>
                </p>
              </div>
              <div className="rounded-lg border border-tax/30 bg-tax-bg/40 px-3 py-2.5">
                <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-tax">Fixed payment</p>
                <p className="m-0 mt-1 font-mono text-[12px] font-semibold text-ink-950">
                  {fixedSim.paidOff ? `${fixedSim.months} months` : 'Never pays off'}
                </p>
                <p className="m-0 mt-0.5 font-mono text-[10.5px] text-ink-500">
                  Interest <span className="text-ink-950">{formatNumber(fixedSim.totalInterest)}</span>
                </p>
              </div>
            </div>
            {savings && savings.interestSaved != null && (
              <div className="mt-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5">
                <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-success">You save by paying fixed</p>
                <p className="m-0 mt-1 font-mono text-[14px] font-bold text-success">
                  {cur.code} {formatNumber(savings.interestSaved)} · {savings.monthsSaved} months
                </p>
              </div>
            )}
            {savings && savings.note && (
              <div className="mt-2 rounded-lg border border-crimson-500/40 bg-crimson-500/10 px-3 py-2.5">
                <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-crimson-400">Warning</p>
                <p className="m-0 mt-1 text-[11px] text-ink-950">{savings.note}</p>
              </div>
            )}
          </>
        )}

        {/* Schedule preview */}
        {(strategy.id === 'fixed' || strategy.id === 'compare') && fixedSim && fixedSim.rows.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Fixed-payment schedule (first {Math.min(8, fixedSim.rows.length)} of {fixedSim.rows.length})
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
                  {fixedSim.rows.slice(0, 8).map((r) => (
                    <tr key={r.n} className="border-t border-line">
                      <td className="py-1 text-ink-700">{formatDate(r.date) || `M${r.n}`}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(r.payment)}</td>
                      <td className="py-1 text-right text-crimson-400">{formatNumber(r.interest)}</td>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">
              {strategy.id === 'compare' && savings?.interestSaved != null ? 'Interest saved by paying fixed' : 'Total interest paid'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {strategy.label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(
              strategy.id === 'compare' && savings?.interestSaved != null
                ? savings.interestSaved
                : (strategy.id === 'minimum' ? minimumSim : fixedSim)?.totalInterest || 0,
              data.currency
            )}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Goal, lender contact, refinance options…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Payoff PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (full schedules) <ArrowRight size={10} /></>)}
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
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">CREDIT CARD PAYMENT SCHEDULE</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Credit Card Payoff Plan — May 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Marcus Vance · HDFC Regalia · Compare both</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['BALANCE',  'INR 1,25,000'],
            ['APR',      '36%'],
            ['MONTHS',   '18 (fixed)'],
            ['INTEREST', 'INR 19,420'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">MIN vs FIXED COMPARISON</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_90px_90px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>METRIC</span>
            <span className="text-right">MIN ONLY</span>
            <span className="text-right">FIXED</span>
          </div>
          {[
            ['Months to clear',  'Never',         '18 mo'],
            ['Total paid',       '—',             '1,44,420'],
            ['Total interest',   '—',             '19,420'],
            ['First payment',    '6,250',         '8,000'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_90px_90px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span>{r[0]}</span>
              <span className="text-right text-crimson-400">{r[1]}</span>
              <span className="text-right font-bold">{r[2]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded border border-success/40 bg-success/10 px-2.5 py-2">
          <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-success">YOU SAVE</p>
          <p className="m-0 mt-0.5 text-[11px] font-bold text-success">Avoiding interest spiral — never-paying-off scenario</p>
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
            Card balance in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            payoff plan + cost reveal out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            See exactly what the minimum payment costs over time, what a fixed payment clears it for, and how many months and how much interest you save by going above the minimum.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <CreditCardIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Payoff Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Compare both
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Cardholder',    'Marcus Vance'],
                  ['Card',          'HDFC Regalia · 36% APR'],
                  ['Balance',       'INR 1,25,000'],
                  ['Min payment',   '5% of balance · floor ₹250'],
                  ['Fixed plan',    'INR 8,000 / month'],
                  ['New charges',   'INR 0 (stop using the card)'],
                  ['Fixed payoff',  '18 months · ₹19,420 interest'],
                  ['Min payoff',    'Never (interest > min principal)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Saved by going fixed</span>
                <span className="font-mono text-[14px] font-semibold text-paper">∞ vs INR 19,420</span>
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
                  Decision-ready
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
  ['01', 'Drop in the card',  'Balance, APR, minimum-payment percentage and floor (most card statements show all three). Pick a fixed payment you can afford.'],
  ['02', 'See the cost',       'The tool simulates every month under both strategies — minimum-only and fixed-payment — and shows months to payoff plus total interest for each.'],
  ['03', 'Export the plan',    'PDF: summary cards, comparison block, savings block, full schedule. XLSX: Summary, Minimum-only schedule, Fixed-payment schedule, Yearly rollup.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              The math the{' '}
              <em className="font-serif font-normal italic text-crimson-300">card issuer hides.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Credit card minimum payments are designed to keep you in debt — they cover interest plus a tiny bit of principal. This tool shows you exactly how long that path takes, what it costs, and what a small increase above the minimum changes.
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
  { title: 'Minimum-only simulation',  desc: 'Models the typical "% of balance, with a floor" minimum formula. Shows what happens if you only pay what the card asks each month.' },
  { title: 'Fixed-payment simulation',  desc: 'Pick any monthly payment you can afford and see exactly when the balance hits zero — plus the total interest you pay along the way.' },
  { title: 'Side-by-side compare',      desc: 'Run both strategies at once. The interest-saved block tells you, in plain currency, the cost of paying the minimum instead.' },
  { title: 'New-charges modelling',     desc: 'Add a monthly new-charges figure to simulate revolving spend. Almost always reveals that paying minimums while spending traps you forever.' },
  { title: '"Never pays off" flag',     desc: 'If your minimum payment cannot cover the interest, the tool marks the scenario as "Never pays off" — the case the card issuer never advertises.' },
  { title: 'PDF + multi-sheet XLSX',    desc: 'PDF: summary cards, comparison, savings block, schedule preview. XLSX: Summary, Minimum-only, Fixed-payment, Yearly — full schedules for both.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Honest numbers</Eyebrow>
          <SectionTitle>
            See the cost{' '}
            <em className="font-serif font-normal italic text-crimson-300">— before</em> the bill.
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
  { q: 'What does "Never pays off" mean?',                          a: 'It means your minimum payment is less than (or barely above) the monthly interest charge. Each minimum payment covers interest plus a few currency units of principal — so the balance barely moves, or in some scenarios actually grows. Most card minimums are deliberately designed to keep you in this state.' },
  { q: 'How is this different from the Monthly Loan Payment tool?', a: 'The Loan Payment tool models a fixed EMI amortising a fixed-tenure loan. Credit card balances are revolving — there\'s no fixed tenure, and the minimum payment is a percentage of the balance, not a fixed amount. This tool handles those mechanics specifically.' },
  { q: 'What APR should I use?',                                    a: 'The APR on your card statement. Indian credit cards typically run 30–42% p.a.; US revolving APRs run 19–29%; UK personal cards 25–35%. The actual rate matters — even a 5% APR difference compounds dramatically over a multi-year payoff.' },
  { q: 'My minimum payment is "2% of balance with no floor". Is that supported?', a: 'Yes — set minimum % to 2 and floor to 0. The tool ensures the payment at least covers interest each month; otherwise the balance would grow indefinitely (which some issuers actually allow up to a credit limit, but most cards prevent).' },
  { q: 'What if I keep using the card while paying it off?',         a: 'Set "New charges per month" to your typical spend. The simulation adds those charges before interest each month. For most people, the answer is brutal — even modest spend extends the payoff dramatically. Use the simulation to motivate stopping use entirely until it\'s clear.' },
  { q: 'Output formats?',                                            a: 'PDF (summary cards + inputs + min vs fixed comparison + savings block + yearly summary + schedule with first 60 months + totals row + notes — auto-paginated) and XLSX (4 sheets: Summary, Minimum-only schedule, Fixed-payment schedule, Yearly rollup). All numeric.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">card payoff.</em>
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
  { name: 'Monthly Loan Payment',       desc: 'Multi-loan monthly outflow.',           Icon: EmiIcon,    label: 'TAX', path: '/tools/monthly-loan-payment' },
  { name: 'EMI Schedule PDF',           desc: 'Single-loan amortization.',              Icon: EmiIcon,    label: 'TAX', path: '/tools/emi-schedule' },
  { name: 'Loan Amortization',          desc: 'Multi-rate amortization with resets.',   Icon: AmortIcon,  label: 'TAX', path: '/tools/loan-amortization' },
  { name: 'Interest Calculation Sheet', desc: 'Simple/compound/reducing interest.',     Icon: PercentIcon, label: 'TAX', path: '/tools/interest-calculation-sheet' },
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

export default function CreditCardPaymentSchedulePage() {
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
