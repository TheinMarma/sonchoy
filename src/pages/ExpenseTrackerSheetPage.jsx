import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus, BrandMark,
  ExpenseIcon, ReceiptIcon, PayrollIcon, BudgetIcon, ReportIcon, ForecastIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, EXPENSE_CATEGORIES, PAYMENT_METHODS, STATUSES,
  computeExpenses, describePeriod, statusLabel, findCurrency,
  formatNumber, formatMoney, todayISO,
} from '../lib/expenseTracker/compute'
import { generateExpenseTrackerPdf } from '../lib/expenseTracker/generatePdf'
import { generateExpenseTrackerXlsx } from '../lib/expenseTracker/generateXlsx'

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

const STATUS_TONES = {
  pending:    { bg: 'bg-amber-500/10',  fg: 'text-amber-400',     border: 'border-amber-500/30' },
  submitted:  { bg: 'bg-accounting/10', fg: 'text-accounting',    border: 'border-accounting/30' },
  approved:   { bg: 'bg-accounting/10', fg: 'text-accounting',    border: 'border-accounting/30' },
  reimbursed: { bg: 'bg-success/10',    fg: 'text-success',       border: 'border-success/30' },
  rejected:   { bg: 'bg-crimson-500/10', fg: 'text-crimson-300',  border: 'border-crimson-500/30' },
}

/* ---------- 1) Tool hero (homepage style — popup-launched) ---------- */

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
      aria-label="Live Expense Tracker"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[540px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['12',     'Category presets'],
  ['5',      'Reimbursement statuses'],
  ['PDF+',   'XLSX exports'],
  ['Free',   'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="relative overflow-hidden">
        {/* Glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 60%)' }}
        />
        {/* Grid pattern */}
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
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-accounting">Accounting</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Expense Tracker Sheet</span>
          </nav>

          {/* Eyebrow */}
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(99,102,241,0.25)]" />
            Accounting · Expense logging
          </span>

          {/* H1 */}
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Expense reports{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              finance
            </em>{' '}
            approves
            <br />
            on the{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              first pass.
            </em>
          </h1>

          {/* Description */}
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Log every expense — date, vendor, category, payment method, status. We total the lot, group by category, and ship a clean PDF + .xlsx ready to submit, reconcile, or staple to receipts.
          </p>

          {/* CTAs */}
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

          {/* Trust signals */}
          <div className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> No signup, ever
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> 100% local · nothing uploaded
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> PDF + .xlsx exports
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-crimson-400" /> Esc to close
            </span>
          </div>

          {/* Stats */}
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

/* ---------- Editable form input building blocks ---------- */

const labelClass = 'font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500'
const inputClass =
  'w-full min-h-[36px] rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950 ' +
  'placeholder:text-ink-400 outline-none transition-colors ' +
  'focus:border-accounting/60 focus:ring-2 focus:ring-accounting/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
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

/* ---------- Expense row (inline editable) ---------- */

function ExpenseRow({ expense, onUpdate, onRemove }) {
  const tone = STATUS_TONES[expense.status] || STATUS_TONES.pending

  return (
    <div className="rounded-lg border border-line bg-paper p-2.5">
      {/* Row 1: Date + Vendor + Amount + Remove */}
      <div className="mb-1.5 grid grid-cols-[88px_1fr_92px_22px] items-center gap-1.5">
        <input
          type="date"
          value={expense.date || ''}
          onChange={(e) => onUpdate({ date: e.target.value })}
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none [color-scheme:dark] hover:border-line-strong focus:border-accounting/60"
        />
        <input
          type="text"
          value={expense.vendor || ''}
          onChange={(e) => onUpdate({ vendor: e.target.value })}
          placeholder="Vendor"
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] font-semibold text-ink-950 outline-none placeholder:font-normal placeholder:text-ink-400 hover:border-line-strong focus:border-accounting/60"
        />
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={expense.amount}
          onChange={(e) => onUpdate({ amount: e.target.value })}
          placeholder="0.00"
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] font-semibold text-ink-950 outline-none hover:border-line-strong focus:border-accounting/60"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove expense"
          className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Row 2: Description */}
      <input
        type="text"
        value={expense.description || ''}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Description / what was it for"
        className="mb-1.5 min-h-[28px] w-full rounded-md border border-line bg-canvas px-1.5 py-1 text-[11.5px] text-ink-800 outline-none placeholder:text-ink-400 hover:border-line-strong focus:border-accounting/60"
      />

      {/* Row 3: Category + Payment + Status */}
      <div className="grid grid-cols-[1fr_1fr_120px] gap-1.5">
        <select
          value={expense.category || EXPENSE_CATEGORIES[0]}
          onChange={(e) => onUpdate({ category: e.target.value })}
          className="min-h-[28px] cursor-pointer rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-700 outline-none hover:border-line-strong focus:border-accounting/60"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={expense.paymentMethod || PAYMENT_METHODS[0]}
          onChange={(e) => onUpdate({ paymentMethod: e.target.value })}
          className="min-h-[28px] cursor-pointer rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-700 outline-none hover:border-line-strong focus:border-accounting/60"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={expense.status || 'pending'}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className={`min-h-[28px] cursor-pointer rounded-md border px-1.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] outline-none focus:border-accounting/60 ${tone.bg} ${tone.fg} ${tone.border}`}
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const today = todayISO()
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const INITIAL = {
  companyName: 'Sonchoy Studio Ltd.',
  ownerName:   'Alex Hartwell',
  periodLabel: '',
  periodStart: daysAgo(30),
  periodEnd:   today,
  currency: 'USD',

  expenses: [
    { id: 1, date: daysAgo(28), vendor: 'United Airlines',     description: 'NYC ↔ SFO · client kickoff trip', category: 'Travel & transportation', paymentMethod: 'Corporate card', amount: 642.40, status: 'reimbursed', reference: 'TR-2026-0042' },
    { id: 2, date: daysAgo(26), vendor: 'Hotel Triton',         description: '3 nights, San Francisco',         category: 'Travel & transportation', paymentMethod: 'Corporate card', amount: 894.00, status: 'reimbursed', reference: '' },
    { id: 3, date: daysAgo(25), vendor: 'Blue Bottle Coffee',   description: 'Client coffee meeting',           category: 'Meals & entertainment',   paymentMethod: 'Personal card',  amount: 38.20,  status: 'submitted',  reference: '' },
    { id: 4, date: daysAgo(22), vendor: 'Adobe',                description: 'Creative Cloud · team renewal',   category: 'Software & subscriptions', paymentMethod: 'Corporate card', amount: 192.00, status: 'approved',   reference: '' },
    { id: 5, date: daysAgo(18), vendor: 'Figma',                description: 'Professional plan · 4 seats',     category: 'Software & subscriptions', paymentMethod: 'Corporate card', amount: 60.00,  status: 'approved',   reference: '' },
    { id: 6, date: daysAgo(14), vendor: 'Lyft',                 description: 'Airport transfers',               category: 'Travel & transportation', paymentMethod: 'Personal card',  amount: 87.50,  status: 'pending',    reference: '' },
    { id: 7, date: daysAgo(10), vendor: 'Staples',              description: 'Office printer paper, pens',      category: 'Office supplies',         paymentMethod: 'Corporate card', amount: 64.85,  status: 'reimbursed', reference: '' },
    { id: 8, date: daysAgo(6),  vendor: 'WSJ',                  description: 'Annual subscription',             category: 'Communications',          paymentMethod: 'Personal card',  amount: 39.00,  status: 'rejected',   reference: 'Personal use' },
  ],

  notes: 'All receipts attached separately. Personal-card items submitted for reimbursement via expense system.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const t = useMemo(() => computeExpenses(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))

  const updateExpense = (id, patch) =>
    setData((s) => ({ ...s, expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const removeExpense = (id) =>
    setData((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }))
  const addExpense = () =>
    setData((s) => ({
      ...s,
      expenses: [
        ...s.expenses,
        {
          id: nextId++,
          date: todayISO(),
          vendor: '',
          description: '',
          category: EXPENSE_CATEGORIES[0],
          paymentMethod: PAYMENT_METHODS[0],
          amount: 0,
          status: 'pending',
          reference: '',
        },
      ],
    }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    expenses: data.expenses.map(({ id, ...rest }) => ({
      ...rest,
      amount: Number(rest.amount) || 0,
    })),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateExpenseTrackerPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateExpenseTrackerXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <ExpenseIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Expense Report
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

        {/* Owner + Company + Currency */}
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <TextInput
            label="Owner name"
            value={data.ownerName}
            onChange={setField('ownerName')}
            placeholder="Your name"
          />
          <SelectInput
            label="Currency"
            value={data.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>
        <div className="mt-2">
          <TextInput
            label="Company"
            value={data.companyName}
            onChange={setField('companyName')}
            placeholder="Employer / project"
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DateInput label="Period start" value={data.periodStart} onChange={setField('periodStart')} />
          <DateInput label="Period end"   value={data.periodEnd}   onChange={setField('periodEnd')} />
        </div>
        <div className="mt-2">
          <TextInput
            label="Period label (optional)"
            value={data.periodLabel}
            onChange={setField('periodLabel')}
            placeholder="May 2026"
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Expense list */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
            Expenses · {t.count}
          </span>
          <button
            type="button"
            onClick={addExpense}
            className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20"
          >
            <Plus size={9} />
            Add expense
          </button>
        </div>

        <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {data.expenses.length === 0 && (
            <div className="rounded-md border border-dashed border-line-strong bg-canvas/40 px-3 py-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              No expenses yet — add one to begin
            </div>
          )}
          {data.expenses.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              onUpdate={(patch) => updateExpense(e.id, patch)}
              onRemove={() => removeExpense(e.id)}
            />
          ))}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Total',         formatNumber(t.total)],
            ['Average',       formatNumber(t.average)],
            ['Reimbursable',  formatNumber(t.reimbursableTotal)],
            ['Reimbursed',    formatNumber(t.reimbursedTotal)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-line bg-paper px-3 py-2">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
              <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-accounting">{v}</p>
            </div>
          ))}
        </div>

        {/* By category mini-table */}
        {t.byCategory.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Top categories
            </p>
            <div className="space-y-1">
              {t.byCategory.slice(0, 4).map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-ink-700">{row.label}</span>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-[10px] text-ink-500">{row.pct}%</span>
                    <span className="font-mono text-ink-900">{formatNumber(row.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total (big) */}
        <div className="mt-3 rounded-lg border border-accounting/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">
              Total spend
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {t.count} entries
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(t.total, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Receipts attached, reimbursement instructions, mileage rate…"
            rows={2}
          />
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Expense Report PDF'}
          <ArrowRight size={14} />
        </button>

        {/* Secondary export */}
        <button
          type="button"
          onClick={handleXlsx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'xlsx' ? '…' : (<>Export XLSX <ArrowRight size={10} /></>)}
        </button>

        {/* Footer */}
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
            Need OCR receipts?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function ExpenseMock() {
  const rows = [
    ['12 May', 'United Airlines',     'NYC → SFO',           'Travel',    'REIMBURSED', '642.40'],
    ['14 May', 'Hotel Triton',         '3 nights, SF',        'Travel',    'REIMBURSED', '894.00'],
    ['15 May', 'Blue Bottle Coffee',   'Client meeting',      'Meals',     'SUBMITTED',  '38.20'],
    ['18 May', 'Adobe',                'CC team renewal',     'Software',  'APPROVED',   '192.00'],
    ['22 May', 'Figma',                'Pro · 4 seats',       'Software',  'APPROVED',   '60.00'],
    ['26 May', 'Lyft',                 'Airport transfers',   'Travel',    'PENDING',    '87.50'],
    ['30 May', 'Staples',              'Office supplies',     'Office',    'REIMBURSED', '64.85'],
    ['04 Jun', 'WSJ',                  'Subscription',        'Comms',     'REJECTED',   '39.00'],
  ]
  const statusToneClass = (s) => ({
    PENDING:    'text-amber-400',
    SUBMITTED:  'text-accounting',
    APPROVED:   'text-accounting',
    REIMBURSED: 'text-success',
    REJECTED:   'text-crimson-300',
  }[s] || 'text-ink-500')

  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Expense Report
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">8 entries · USD</span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Alex Hartwell</p>
          <p className="m-0 mt-0.5 text-[11px] text-ink-500">Sonchoy Studio Ltd.</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">12 May – 04 Jun 2026</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
          <BrandMark size={14} className="text-paper" />
        </span>
      </div>

      {/* Stats strip */}
      <div className="mb-5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Total',     '2,017.95'],
          ['Entries',   '8'],
          ['Average',   '252.24'],
          ['Reimbursable', '377.70'],
        ].map(([k, v]) => (
          <div key={k} className="bg-canvas px-2 py-3">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className="m-0 mt-1 font-mono text-[12px] font-semibold text-ink-950">{v}</p>
          </div>
        ))}
      </div>

      {/* Mini table */}
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-ink-950 text-paper">
            <th className="py-1.5 px-1 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-accounting">Date</th>
            <th className="py-1.5 px-1 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Vendor</th>
            <th className="py-1.5 px-1 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Cat.</th>
            <th className="py-1.5 px-1 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Status</th>
            <th className="py-1.5 px-1 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-accounting">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-canvas' : ''}>
              <td className="py-1 px-1 font-mono text-ink-700 whitespace-nowrap">{r[0]}</td>
              <td className="py-1 px-1 font-medium text-ink-950">{r[1]}</td>
              <td className="py-1 px-1 text-ink-500">{r[3]}</td>
              <td className={`py-1 px-1 font-mono text-[8.5px] uppercase tracking-[0.04em] ${statusToneClass(r[4])}`}>
                {r[4]}
              </td>
              <td className="py-1 px-1 text-right font-mono font-semibold text-ink-900">{r[5]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total block */}
      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accounting">Total</span>
          <span className="font-mono text-[18px] font-semibold text-paper">USD 2,017.95</span>
        </div>
      </div>

      {/* Category mini-breakdown */}
      <div className="mt-3 rounded-md border border-line bg-canvas p-3">
        <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Top categories</p>
        <div className="space-y-1 text-[10px]">
          {[
            ['Travel & transportation', '1,623.90', '80.5%'],
            ['Software & subscriptions', '252.00',  '12.5%'],
            ['Office supplies',          '64.85',   '3.2%'],
            ['Meals & entertainment',    '38.20',   '1.9%'],
          ].map(([k, v, p]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-ink-700">{k}</span>
              <span className="flex items-center gap-3 font-mono">
                <span className="text-ink-500">{p}</span>
                <span className="text-ink-900">{v}</span>
              </span>
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
            From a stack of receipts{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            an approve-on-sight report.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Every row carries a date, vendor, category, payment method, and reimbursement status. Totals reconcile per category and per status — finance reviewers see everything at a glance.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Form mockup */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <ExpenseIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Expense Tracker
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  May 2026 · USD
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Owner',           'Alex Hartwell'],
                  ['Period',          '12 May – 04 Jun 2026'],
                  ['# Expenses',      '8 entries · 2,017.95'],
                  ['Top category',    'Travel · 80.5% · 1,623.90'],
                  ['Reimbursable',    '377.70 (3 entries pending)'],
                  ['Reimbursed',      '1,601.25 (4 entries)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-accounting/25 bg-accounting/25 text-center">
                {[
                  ['Pending',  '87.50'],
                  ['Submitted', '38.20'],
                  ['Reimbursed', '1,601.25'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-accounting-bg px-2 py-2">
                    <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
                    <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-accounting">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Total spend</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 2,017.95</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 rotate-90 items-center justify-center rounded-full border border-crimson-500/40 bg-canvas text-crimson-300 shadow-[0_4px_18px_-4px_rgba(237,40,40,0.4)] lg:rotate-0">
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Output */}
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
                  Submit-ready
                </span>
              </div>
              <ExpenseMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Log each expense',      'Date, vendor, description, category, payment method, status, amount. Twelve category presets and seven payment methods make data entry a few clicks per row.'],
  ['02', 'Set status as you go',  'Pending → Submitted → Approved → Reimbursed (or Rejected). Each status is colour-coded so a reviewer can scan the report in seconds.'],
  ['03', 'Download the report',   'PDF with a chip-coded table, category breakdown, and signature line — plus an .xlsx with a Summary sheet for management or filing.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three steps from{' '}
              <em className="font-serif font-normal italic text-crimson-300">receipt pile</em>
              {' '}to report.
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            No spreadsheet template to set up, no accounting software to learn. Log the receipts as you take them, and ship the report at the end of the week or month.
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
  { title: 'Per-row inline editing', desc: 'Click any cell and type — date, vendor, description, category, payment method, status, and amount.' },
  { title: '12 expense categories',  desc: 'Travel, meals, software, supplies, marketing, professional fees, communications, insurance + 4 more.' },
  { title: '5 reimbursement statuses', desc: 'Pending, Submitted, Approved, Reimbursed, Rejected — each colour-coded as a chip in the PDF and on screen.' },
  { title: 'Category & status breakdowns', desc: 'Mini summary tables in both the PDF and the XLSX — group totals, percentage shares, status counts.' },
  { title: 'Reimbursable auto-total',  desc: 'Everything not yet reimbursed (pending + submitted + approved) is summed separately — your "submit this" total.' },
  { title: 'Two-sheet XLSX export',    desc: 'Detail sheet with every expense plus a Summary sheet with totals, breakdowns, and status counts.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for everyone who travels</Eyebrow>
          <SectionTitle>
            Every column an approver{' '}
            <em className="font-serif font-normal italic text-crimson-300">needs to see.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-accounting/20 bg-accounting-bg text-accounting">
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
  { q: 'Who is this for?',                                       a: 'Anyone who needs to track and submit expenses — employees on business trips, freelancers tracking project costs, small business owners running their own books, or anyone preparing a monthly expense report for their accountant.' },
  { q: 'How does "reimbursable" differ from "total"?',           a: 'Total = every expense logged, regardless of status. Reimbursable = expenses with status Pending, Submitted, or Approved (not yet Reimbursed). It\'s your "still-owed-to-me" number, useful when chasing payment.' },
  { q: 'Does the tool attach receipts?',                         a: 'No — receipts stay separately. Each expense row has a Reference field where you can note a receipt number, transaction ID, or filename. Many users export the PDF then staple physical receipts behind it.' },
  { q: 'Can multiple people share one report?',                  a: 'Each report is single-owner. For team-level expense aggregation, see the Expense Report Generator (Business Documents) which rolls up multiple employees\' expenses into one approver-ready PDF.' },
  { q: 'Why no OCR receipt reading?',                            a: 'The free tier is form-driven (faster for power users). OCR — reading receipt images into structured rows — is available on the pdfFiller premium tier alongside batch processing and accounting-software push.' },
  { q: 'Output formats?',                                        a: 'PDF (chip-coded status, category breakdown, signature line — print and submit) and .xlsx (two sheets: Detail and Summary, useful for accountants and pivot tables).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">expense tracking.</em>
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
  { name: 'Expense Report Generator', desc: 'Aggregate multi-employee expense reports.',           Icon: ReceiptIcon,  label: 'DOCUMENTS' },
  { name: 'Payroll Summary',          desc: 'Wages, deductions, employer taxes per period.',      Icon: PayrollIcon,  label: 'ACCOUNTING' },
  { name: 'Budget Planning Sheet',    desc: 'Build budgets line-by-line with variance tracking.', Icon: BudgetIcon,   label: 'ACCOUNTING' },
  { name: 'Profit & Loss Statement',  desc: 'Aggregate expenses with revenue for full P&L.',     Icon: ReportIcon,   label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
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
            const isAccounting = t.label === 'ACCOUNTING'
            const inner = (
              <>
                <span className={`absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] ${isAccounting ? 'text-accounting' : 'text-business'}`}>
                  {t.label}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-md ${isAccounting ? 'bg-accounting-bg text-accounting' : 'bg-business-bg text-business'}`}>
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

export default function ExpenseTrackerSheetPage() {
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
