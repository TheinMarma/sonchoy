import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus, BrandMark,
  InvoiceIcon, PnlIcon, CashFlowIcon, BalanceIcon, ReportIcon, ExportIcon, BankStatementIcon,
  InvoicePdfIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, BILL_STATUSES,
  computeAP, asOfLabel, statusLabel, findCurrency,
  formatNumber, formatMoney, todayISO,
} from '../lib/accountsPayable/compute'
import { generateAPReportPdf } from '../lib/accountsPayable/generatePdf'
import { generateAPReportXlsx } from '../lib/accountsPayable/generateXlsx'

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
  open:     { bg: 'bg-accounting/10',   fg: 'text-accounting',   border: 'border-accounting/30' },
  approved: { bg: 'bg-accounting/10',   fg: 'text-accounting',   border: 'border-accounting/30' },
  partial:  { bg: 'bg-amber-500/10',    fg: 'text-amber-400',    border: 'border-amber-500/30' },
  'on-hold':{ bg: 'bg-amber-500/10',    fg: 'text-amber-400',    border: 'border-amber-500/30' },
  disputed: { bg: 'bg-crimson-500/10',  fg: 'text-crimson-300',  border: 'border-crimson-500/30' },
  paid:     { bg: 'bg-success/10',      fg: 'text-success',      border: 'border-success/30' },
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
      aria-label="Live Accounts Payable Report"
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
  ['5',    'Ageing buckets'],
  ['Auto', 'Days-overdue calc'],
  ['PDF+', 'XLSX exports'],
  ['Free', 'Always · no signup'],
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
          style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 60%)' }}
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
            <span className="text-accounting">Accounting</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Accounts Payable Report</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(99,102,241,0.25)]" />
            Accounting · Vendor obligations
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            What you owe,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              vendor by vendor.
            </em>
            <br />
            Aged{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              by the day.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Log every open bill — vendor, invoice number, due date, status, amount. We compute days-overdue, bucket each line into Current / 1-30 / 31-60 / 61-90 / 90+ days, and roll up totals by vendor.
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
              <Check className="text-crimson-400" /> Ageing & vendor rollups
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

/* ---------- Bill row (inline editable) ---------- */

function BillRow({ bill, onUpdate, onRemove }) {
  const tone = STATUS_TONES[bill.status] || STATUS_TONES.open

  return (
    <div className="rounded-lg border border-line bg-paper p-2.5">
      {/* Row 1: Vendor + Invoice # + Amount + Remove */}
      <div className="mb-1.5 grid grid-cols-[1fr_92px_92px_22px] items-center gap-1.5">
        <input
          type="text"
          value={bill.vendor || ''}
          onChange={(e) => onUpdate({ vendor: e.target.value })}
          placeholder="Vendor"
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] font-semibold text-ink-950 outline-none placeholder:font-normal placeholder:text-ink-400 hover:border-line-strong focus:border-accounting/60"
        />
        <input
          type="text"
          value={bill.invoiceNumber || ''}
          onChange={(e) => onUpdate({ invoiceNumber: e.target.value })}
          placeholder="Inv #"
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none placeholder:text-ink-400 hover:border-line-strong focus:border-accounting/60"
        />
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={bill.amount}
          onChange={(e) => onUpdate({ amount: e.target.value })}
          placeholder="0.00"
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] font-semibold text-ink-950 outline-none hover:border-line-strong focus:border-accounting/60"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove bill"
          className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Row 2: Invoice date + Due date + Status */}
      <div className="grid grid-cols-[1fr_1fr_104px] gap-1.5">
        <input
          type="date"
          value={bill.invoiceDate || ''}
          onChange={(e) => onUpdate({ invoiceDate: e.target.value })}
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none [color-scheme:dark] hover:border-line-strong focus:border-accounting/60"
        />
        <input
          type="date"
          value={bill.dueDate || ''}
          onChange={(e) => onUpdate({ dueDate: e.target.value })}
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none [color-scheme:dark] hover:border-line-strong focus:border-accounting/60"
        />
        <select
          value={bill.status || 'open'}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className={`min-h-[28px] cursor-pointer rounded-md border px-1.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] outline-none focus:border-accounting/60 ${tone.bg} ${tone.fg} ${tone.border}`}
        >
          {BILL_STATUSES.map((s) => (
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
function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const INITIAL = {
  companyName: 'Sonchoy Studio Ltd.',
  asOfDate: today,
  periodLabel: '',
  currency: 'USD',

  bills: [
    { id: 1, vendor: 'AWS',                 invoiceNumber: 'AWS-2026-05',     invoiceDate: daysAgo(40), dueDate: daysAgo(10),  amount: 1480.00, status: 'open',     reference: '' },
    { id: 2, vendor: 'Adobe Creative Cloud', invoiceNumber: 'ADO-99214',       invoiceDate: daysAgo(35), dueDate: daysAgo(5),   amount: 192.00,  status: 'open',     reference: '' },
    { id: 3, vendor: 'Old Street Holdings',  invoiceNumber: 'RENT-MAY-2026',   invoiceDate: daysAgo(30), dueDate: daysAgo(2),   amount: 2200.00, status: 'approved', reference: 'Office rent' },
    { id: 4, vendor: 'Northwind Print Co.',  invoiceNumber: 'NW-INV-2031',     invoiceDate: daysAgo(70), dueDate: daysAgo(40),  amount: 1280.00, status: 'disputed', reference: 'Print quality' },
    { id: 5, vendor: 'Linklaters LLP',       invoiceNumber: 'LL-Q2-2026',      invoiceDate: daysAgo(95), dueDate: daysAgo(65),  amount: 4800.00, status: 'open',     reference: 'Q2 legal' },
    { id: 6, vendor: 'FreshFoods Catering',  invoiceNumber: 'FF-26-117',       invoiceDate: daysAgo(20), dueDate: daysFromNow(10), amount: 420.00, status: 'approved', reference: '' },
    { id: 7, vendor: 'GitHub',               invoiceNumber: 'GH-2026-Q2',      invoiceDate: daysAgo(12), dueDate: daysFromNow(18), amount: 84.00,  status: 'open',     reference: '' },
    { id: 8, vendor: 'Stripe',               invoiceNumber: 'STR-04582',       invoiceDate: daysAgo(110), dueDate: daysAgo(80), amount: 320.00,  status: 'partial',  reference: '50% paid' },
    { id: 9, vendor: 'Adobe Creative Cloud', invoiceNumber: 'ADO-92011',       invoiceDate: daysAgo(125), dueDate: daysAgo(95), amount: 192.00,  status: 'paid',     reference: '' },
  ],

  notes: 'Disputed Northwind Print invoice — awaiting credit note. Stripe arrears under instalment plan.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const t = useMemo(() => computeAP(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))

  const updateBill = (id, patch) =>
    setData((s) => ({ ...s, bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)) }))
  const removeBill = (id) =>
    setData((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }))
  const addBill = () =>
    setData((s) => ({
      ...s,
      bills: [
        ...s.bills,
        {
          id: nextId++,
          vendor: '',
          invoiceNumber: '',
          invoiceDate: todayISO(),
          dueDate: daysFromNow(30),
          amount: 0,
          status: 'open',
          reference: '',
        },
      ],
    }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    bills: data.bills.map(({ id, ...rest }) => ({
      ...rest,
      amount: Number(rest.amount) || 0,
    })),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateAPReportPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateAPReportXlsx(buildPayload()) } finally { setBusy(null) } }

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
              <InvoiceIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New AP Report
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

        {/* Company + currency + as-of */}
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <TextInput
            label="Company"
            value={data.companyName}
            onChange={setField('companyName')}
            placeholder="Your Company Ltd."
          />
          <SelectInput
            label="Currency"
            value={data.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
          <TextInput
            label="Report label (optional)"
            value={data.periodLabel}
            onChange={setField('periodLabel')}
            placeholder="May 2026"
          />
          <DateInput label="As of" value={data.asOfDate} onChange={setField('asOfDate')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Bills list */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
            Bills · {data.bills.length}
          </span>
          <button
            type="button"
            onClick={addBill}
            className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20"
          >
            <Plus size={9} />
            Add bill
          </button>
        </div>

        <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {data.bills.length === 0 && (
            <div className="rounded-md border border-dashed border-line-strong bg-canvas/40 px-3 py-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              No bills yet — add one to begin
            </div>
          )}
          {data.bills.map((b) => (
            <BillRow
              key={b.id}
              bill={b}
              onUpdate={(patch) => updateBill(b.id, patch)}
              onRemove={() => removeBill(b.id)}
            />
          ))}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Ageing strip */}
        <div className="mb-3">
          <span className="mb-2 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500">
            Ageing breakdown
          </span>
          <div className="grid grid-cols-5 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
            {t.ageing.map((b) => (
              <div key={b.id} className="bg-paper px-1 py-2">
                <p className="m-0 font-mono text-[8px] uppercase tracking-[0.08em] text-ink-500">
                  {b.label.replace(' days', '')}
                </p>
                <p className={`m-0 mt-1 font-mono text-[11px] font-semibold ${b.id === 'current' ? 'text-success' : (b.id === '90-plus' || b.id === '61-90') ? 'text-crimson-300' : 'text-amber-400'}`}>
                  {formatNumber(b.amount)}
                </p>
                <p className="m-0 font-mono text-[8px] text-ink-500">{b.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Outstanding',  formatNumber(t.totalOutstanding)],
            ['# Bills',      String(t.countOutstanding)],
            ['Overdue',      formatNumber(t.totalOverdue)],
            ['Overdue %',    `${t.overduePct}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-line bg-paper px-3 py-2">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
              <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-accounting">{v}</p>
            </div>
          ))}
        </div>

        {/* Top vendors */}
        {t.byVendor.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Top vendors
            </p>
            <div className="space-y-1">
              {t.byVendor.slice(0, 4).map((row) => (
                <div key={row.vendor} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-ink-700">{row.vendor}</span>
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
              Total outstanding
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {t.countOutstanding} bills
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(t.totalOutstanding, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Disputes, payment plans, escalations…"
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
          {busy === 'pdf' ? 'Generating…' : 'Generate AP Report PDF'}
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
            Need multi-entity?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function APMock() {
  const rows = [
    ['Linklaters LLP',         'LL-Q2-2026',    '65d', '61–90',  'OPEN',     '4,800.00',  'text-crimson-300'],
    ['Stripe',                  'STR-04582',     '80d', '90+',    'PARTIAL',  '320.00',    'text-crimson-300'],
    ['Northwind Print Co.',     'NW-INV-2031',   '40d', '31–60',  'DISPUTED', '1,280.00',  'text-amber-400'],
    ['AWS',                     'AWS-2026-05',   '10d', '1–30',   'OPEN',     '1,480.00',  'text-amber-400'],
    ['Adobe Creative Cloud',    'ADO-99214',     '5d',  '1–30',   'OPEN',     '192.00',    'text-amber-400'],
    ['Old Street Holdings',     'RENT-MAY-2026', '2d',  '1–30',   'APPROVED', '2,200.00',  'text-amber-400'],
    ['GitHub',                  'GH-2026-Q2',    '+18d', 'Current', 'OPEN',    '84.00',     'text-success'],
    ['FreshFoods Catering',     'FF-26-117',     '+10d', 'Current', 'APPROVED','420.00',    'text-success'],
  ]
  const statusToneClass = (s) => ({
    OPEN:     'text-accounting',
    APPROVED: 'text-accounting',
    PARTIAL:  'text-amber-400',
    DISPUTED: 'text-crimson-300',
    REIMBURSED: 'text-success',
    PAID:     'text-success',
  }[s] || 'text-ink-500')

  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Accounts Payable Report
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">
          8 open · USD
        </span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Sonchoy Studio Ltd.</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">As of 18 Jun 2026</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
          <BrandMark size={14} className="text-paper" />
        </span>
      </div>

      {/* Stats strip */}
      <div className="mb-5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Outstanding', '10,776.00'],
          ['# Bills',     '8'],
          ['Overdue',     '10,272.00'],
          ['Overdue %',   '95.3%'],
        ].map(([k, v]) => (
          <div key={k} className="bg-canvas px-2 py-3">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className="m-0 mt-1 font-mono text-[12px] font-semibold text-ink-950">{v}</p>
          </div>
        ))}
      </div>

      {/* Ageing strip */}
      <div className="mb-5">
        <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Ageing</p>
        <div className="grid grid-cols-5 gap-px overflow-hidden rounded-md bg-ink-950 text-center">
          {[
            ['Current', '504',     'text-success'],
            ['1–30',    '3,872',   'text-amber-400'],
            ['31–60',   '1,280',   'text-amber-400'],
            ['61–90',   '4,800',   'text-crimson-300'],
            ['90+',     '320',     'text-crimson-300'],
          ].map(([k, v, tone]) => (
            <div key={k} className="bg-ink-950 px-1 py-2">
              <p className="m-0 font-mono text-[8px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
              <p className={`m-0 mt-1 font-mono text-[11px] font-semibold ${tone}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mini table */}
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-ink-950 text-paper">
            <th className="py-1.5 px-1 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-accounting">Vendor</th>
            <th className="py-1.5 px-1 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Days</th>
            <th className="py-1.5 px-1 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Status</th>
            <th className="py-1.5 px-1 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-accounting">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-canvas' : ''}>
              <td className="py-1 px-1 font-medium text-ink-950 truncate max-w-[120px]">{r[0]}</td>
              <td className={`py-1 px-1 font-mono ${r[6]}`}>{r[2]}</td>
              <td className={`py-1 px-1 font-mono text-[8.5px] uppercase tracking-[0.04em] ${statusToneClass(r[4])}`}>{r[4]}</td>
              <td className="py-1 px-1 text-right font-mono font-semibold text-ink-900">{r[5]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accounting">Total outstanding</span>
          <span className="font-mono text-[18px] font-semibold text-paper">USD 10,776.00</span>
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
            From a list of open bills{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a clear escalation plan.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Days-overdue per bill, five ageing buckets, vendor rollups, and an escalation-priority sort — finance teams can chase the right vendor first.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Form mockup */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <InvoiceIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    AP Report Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  18 Jun 2026 · USD
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Open bills',     '8 · 10,776.00'],
                  ['Top vendor',     'Linklaters LLP · 44.5% · 4,800.00'],
                  ['Most overdue',   'Stripe · 80 days · 320.00'],
                  ['Overdue %',      '95.3% of outstanding'],
                  ['Disputed',       '1 bill · 1,280.00'],
                  ['Paid (excluded)', '1 bill · 192.00'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Outstanding</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 10,776.00</span>
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
                  Audit-ready
                </span>
              </div>
              <APMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Log open bills',      'Vendor, invoice number, dates, status, amount. Paid bills can stay in the dataset — we exclude them from outstanding totals automatically.'],
  ['02', 'Ageing computes live', 'Each bill\'s days-overdue is computed from your "As of" date. Bills fall into Current / 1-30 / 31-60 / 61-90 / 90+ buckets.'],
  ['03', 'Download the report', 'PDF sorted most-overdue-first with ageing strip, vendor rollups, and signature line — plus a 2-sheet XLSX (Bills + Summary).'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three steps to a{' '}
              <em className="font-serif font-normal italic text-crimson-300">payment priority list.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            The "As of" date is the integrity anchor — every days-overdue, ageing bucket, and vendor total is computed against it. Roll the date forward, watch buckets re-stratify automatically.
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
  { title: 'Days-overdue per bill',  desc: 'Computed live from your "As of" date — negative means not-yet-due, positive means overdue.' },
  { title: '5 ageing buckets',        desc: 'Current, 1-30, 31-60, 61-90, 90+ days — coloured for at-a-glance scanning in the PDF.' },
  { title: '6 bill statuses',         desc: 'Open, Approved, Partial pay, On hold, Disputed, Paid — paid bills auto-excluded from outstanding totals.' },
  { title: 'Vendor rollups',          desc: 'Top vendors by amount owed — perfect for prioritising who to chase first this week.' },
  { title: 'Sorted by escalation',    desc: 'PDF rows automatically sorted most-overdue-first so reviewers see priority bills at the top.' },
  { title: 'Two-sheet XLSX',          desc: 'Detail sheet with every bill + a Summary sheet with totals, ageing buckets, and vendor breakdowns.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for AP teams</Eyebrow>
          <SectionTitle>
            Every column a{' '}
            <em className="font-serif font-normal italic text-crimson-300">treasurer</em> tracks.
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
  { q: 'What\'s the difference between AP and AR?',                a: 'Accounts Payable (AP) is what you owe to vendors — money flowing out. Accounts Receivable (AR) is what customers owe you — money flowing in. This tool tracks AP. For AR (chasing customer invoices), see the Accounts Receivable Report tool.' },
  { q: 'How are days-overdue calculated?',                          a: 'Simple: (As of date) − (Due date). Negative means the bill is not yet due — it sits in the Current bucket. Positive means the bill is overdue and falls into the appropriate ageing bucket.' },
  { q: 'Why are paid bills excluded from outstanding?',             a: 'The whole point of an AP report is what you still owe. Paid bills stay in the .xlsx detail sheet for context but never count toward Total Outstanding, Total Overdue, ageing buckets, or vendor rollups.' },
  { q: 'What does "Disputed" mean?',                                a: 'Use Disputed when there\'s a problem with the bill — wrong amount, undelivered service, quality issue. The bill still counts toward outstanding (until resolved) but the status flags it so reviewers know not to pay yet.' },
  { q: 'Can I track partial payments?',                             a: 'Set status to Partial pay and leave the amount as the remaining balance owed. Add a note in the Reference field (e.g. "50% paid via wire 18 Jun") so the audit trail is preserved.' },
  { q: 'Output formats?',                                           a: 'PDF (escalation-sorted, with ageing strip, vendor rollups, signature line) and .xlsx (two sheets: Bills with full detail, Summary with totals/ageing/vendor breakdowns).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">accounts payable.</em>
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
  { name: 'Accounts Receivable Report', desc: 'Customer balances and overdue alerts.',           Icon: InvoicePdfIcon,    label: 'ACCOUNTING', path: '/tools/accounts-receivable-report' },
  { name: 'Cash Flow Statement',        desc: 'Operating, investing, financing flows.',          Icon: CashFlowIcon,      label: 'ACCOUNTING', path: '/tools/cash-flow-statement' },
  { name: 'Expense Tracker Sheet',      desc: 'Log every business expense with categories.',     Icon: ReportIcon,        label: 'ACCOUNTING', path: '/tools/expense-tracker-sheet' },
  { name: 'Bank Statement PDF to Excel', desc: 'Reconcile vendor payments from statements.',     Icon: BankStatementIcon, label: 'CONVERT',    path: '/tools/bank-statement-pdf-to-excel' },
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
                <span className={`absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] ${isAccounting ? 'text-accounting' : 'text-convert'}`}>
                  {t.label}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-md ${isAccounting ? 'bg-accounting-bg text-accounting' : 'bg-convert-bg text-convert'}`}>
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

export default function AccountsPayableReportPage() {
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
