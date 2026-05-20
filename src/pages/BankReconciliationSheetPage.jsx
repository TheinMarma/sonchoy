import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus, BrandMark,
  ReconcileIcon, BankStatementIcon, PercentIcon, VatIcon, PayrollIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES,
  computeRecon, asOfLabel, findCurrency,
  formatNumber, formatMoney, todayISO,
} from '../lib/bankRecon/compute'
import { generateBankReconPdf } from '../lib/bankRecon/generatePdf'
import { generateBankReconXlsx } from '../lib/bankRecon/generateXlsx'

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
      aria-label="Live Bank Reconciliation Sheet"
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
  ['BANK=BOOK', 'Live integrity check'],
  ['5',         'Reconciling item types'],
  ['PDF+',      'XLSX two-column sheet'],
  ['Free',      'Always · no signup'],
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
            <span className="text-ink-950">Bank Reconciliation Sheet</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Reconciliation
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Statement vs. books,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              reconciled
            </em>
            <br />
            to the{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              cent.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Log statement balance, outstanding checks, deposits in transit, interest, and bank charges. We reconcile both sides line-by-line — the report only ships green when adjusted bank balance equals adjusted book balance.
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
              <Check className="text-crimson-400" /> Two-column auditor format
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

function NumberInput({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        value={value ?? 0}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={`${inputClass} text-right font-mono`}
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

/* ---------- Line group (description + amount, with optional second metadata col) ---------- */

function LineGroup({ title, accent = false, lines, setLines, total, totalLabel = 'Subtotal', sign = '+', kind = 'simple' }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = () =>
    setLines([
      ...lines,
      kind === 'check'
        ? { id: Date.now() + Math.random(), checkNumber: '', payee: '', amount: 0 }
        : kind === 'nsf'
          ? { id: Date.now() + Math.random(), checkNumber: '', payer: '', amount: 0 }
          : { id: Date.now() + Math.random(), description: '', amount: 0 },
    ])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${accent ? 'text-tax' : 'text-ink-500'}`}>
          {title}
        </span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20"
        >
          <Plus size={9} />
          Add row
        </button>
      </div>

      <div className="space-y-1.5">
        {lines.length === 0 && (
          <div className="rounded-md border border-dashed border-line-strong bg-canvas/40 px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            No items
          </div>
        )}
        {lines.map((ln) => (
          <div
            key={ln.id}
            className={`grid ${kind === 'simple' ? 'grid-cols-[1fr_92px_22px]' : 'grid-cols-[72px_1fr_92px_22px]'} items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1.5`}
          >
            {kind !== 'simple' && (
              <input
                type="text"
                value={ln.checkNumber || ''}
                onChange={(e) => update(ln.id, { checkNumber: e.target.value })}
                placeholder="#"
                className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none placeholder:text-ink-400 hover:border-line focus:border-tax/60 focus:bg-canvas"
              />
            )}
            <input
              type="text"
              value={kind === 'check' ? (ln.payee || '') : kind === 'nsf' ? (ln.payer || '') : (ln.description || '')}
              onChange={(e) => {
                if (kind === 'check') update(ln.id, { payee: e.target.value })
                else if (kind === 'nsf') update(ln.id, { payer: e.target.value })
                else update(ln.id, { description: e.target.value })
              }}
              placeholder={kind === 'check' ? 'Payee' : kind === 'nsf' ? 'Payer' : 'Description'}
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 hover:border-line focus:border-tax/60 focus:bg-canvas"
            />
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={ln.amount}
              onChange={(e) => update(ln.id, { amount: e.target.value })}
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none hover:border-line focus:border-tax/60 focus:bg-canvas"
            />
            <button
              type="button"
              onClick={() => remove(ln.id)}
              aria-label="Remove row"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {total !== undefined && (
        <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">{totalLabel}</span>
          <span className={`font-mono text-[12px] font-semibold ${sign === '+' ? 'text-success' : 'text-crimson-300'}`}>
            {sign}{formatNumber(total)}
          </span>
        </div>
      )}
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  companyName: 'Sonchoy Studio Ltd.',
  accountName: 'Operating Account',
  accountNumber: 'XXXX-XXXX-4521',
  periodLabel: '',
  asOfDate: todayISO(),
  currency: 'USD',

  statementBalance: 187280,
  bookBalance: 184220,

  depositsInTransit: [
    { id: 1, description: 'Cash deposit · 30 Jun (post-cutoff)', amount: 4200 },
    { id: 2, description: 'Wire from Acme Inc.',                  amount: 8400 },
  ],
  outstandingChecks: [
    { id: 3, checkNumber: '1042', payee: 'Old Street Holdings',  amount: 2200 },
    { id: 4, checkNumber: '1043', payee: 'AWS',                  amount: 1480 },
    { id: 5, checkNumber: '1045', payee: 'Adobe',                amount: 192 },
  ],
  bankAdjustments: [
    { id: 6, description: 'Bank error correction · 22 Jun',      amount: 50 },
  ],

  interestEarned: [
    { id: 7, description: 'Interest on operating account',        amount: 142 },
  ],
  bankCharges: [
    { id: 8, description: 'Monthly service fee',                  amount: 18 },
    { id: 9, description: 'Wire transfer fee',                    amount: 25 },
  ],
  nsfChecks: [
    { id: 10, checkNumber: '5021', payer: 'XYZ Trading Co.',     amount: 580 },
  ],
  bookAdjustments: [
    { id: 11, description: 'Journal entry correction · INV-0149', amount: 0 },
  ],

  notes: 'Operating account reconciliation as of 30 Jun 2026. Statement received 02 Jul, deposits-in-transit cleared 03 Jul.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const t = useMemo(() => computeRecon(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setLines = (k) => (lines) =>
    setData((s) => ({ ...s, [k]: lines.map((l) => ({ ...l, id: l.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => {
    const cleanLines = (arr) =>
      arr.map(({ id, ...rest }) => ({ ...rest, amount: Number(rest.amount) || 0 }))
    return {
      ...data,
      statementBalance: Number(data.statementBalance) || 0,
      bookBalance:      Number(data.bookBalance) || 0,
      depositsInTransit: cleanLines(data.depositsInTransit),
      outstandingChecks: cleanLines(data.outstandingChecks),
      bankAdjustments:   cleanLines(data.bankAdjustments),
      interestEarned:    cleanLines(data.interestEarned),
      bankCharges:       cleanLines(data.bankCharges),
      nsfChecks:         cleanLines(data.nsfChecks),
      bookAdjustments:   cleanLines(data.bookAdjustments),
    }
  }

  const handlePdf  = async () => { try { setBusy('pdf');  generateBankReconPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateBankReconXlsx(buildPayload()) } finally { setBusy(null) } }

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
              <ReconcileIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Reconciliation
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
          label="Company name"
          value={data.companyName}
          onChange={setField('companyName')}
          placeholder="Your Company Ltd."
        />
        <div className="mt-2 grid grid-cols-[1fr_92px] gap-2">
          <TextInput
            label="Account name"
            value={data.accountName}
            onChange={setField('accountName')}
            placeholder="Operating Account"
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
            label="Account number"
            value={data.accountNumber}
            onChange={setField('accountNumber')}
            placeholder="XXXX-XXXX-1234"
            mono
          />
          <DateInput label="As of" value={data.asOfDate} onChange={setField('asOfDate')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Opening balances */}
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Statement balance"
            value={data.statementBalance}
            onChange={setField('statementBalance')}
          />
          <NumberInput
            label="Book balance"
            value={data.bookBalance}
            onChange={setField('bookBalance')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* BANK SIDE */}
        <div className="mb-3 rounded-lg border border-tax/20 bg-tax-bg/40 p-3">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
            Per bank statement
          </span>
          <div className="space-y-3">
            <LineGroup
              title="Deposits in transit"
              lines={data.depositsInTransit}
              setLines={setLines('depositsInTransit')}
              total={t.totalDIT}
              totalLabel="DIT total"
              sign="+"
            />
            <LineGroup
              title="Outstanding checks"
              lines={data.outstandingChecks}
              setLines={setLines('outstandingChecks')}
              total={t.totalOutstanding}
              totalLabel="Outstanding total"
              sign="−"
              kind="check"
            />
            <LineGroup
              title="Bank adjustments"
              lines={data.bankAdjustments}
              setLines={setLines('bankAdjustments')}
              total={t.totalBankAdj}
              totalLabel="Net adjustments"
              sign={t.totalBankAdj < 0 ? '−' : '+'}
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md border border-tax/40 bg-ink-950 px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Adjusted bank balance</span>
            <span className="font-mono text-[13px] font-semibold text-paper">{formatNumber(t.adjustedBankBalance)}</span>
          </div>
        </div>

        {/* BOOK SIDE */}
        <div className="mb-3 rounded-lg border border-line bg-paper/40 p-3">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-700">
            Per books / ledger
          </span>
          <div className="space-y-3">
            <LineGroup
              title="Interest / credits not booked"
              lines={data.interestEarned}
              setLines={setLines('interestEarned')}
              total={t.totalInterest}
              totalLabel="Interest total"
              sign="+"
            />
            <LineGroup
              title="Bank charges"
              lines={data.bankCharges}
              setLines={setLines('bankCharges')}
              total={t.totalCharges}
              totalLabel="Charges total"
              sign="−"
            />
            <LineGroup
              title="NSF / returned checks"
              lines={data.nsfChecks}
              setLines={setLines('nsfChecks')}
              total={t.totalNSF}
              totalLabel="NSF total"
              sign="−"
              kind="nsf"
            />
            <LineGroup
              title="Book adjustments / errors"
              lines={data.bookAdjustments}
              setLines={setLines('bookAdjustments')}
              total={t.totalBookAdj}
              totalLabel="Net adjustments"
              sign={t.totalBookAdj < 0 ? '−' : '+'}
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md border border-line bg-ink-950 px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Adjusted book balance</span>
            <span className="font-mono text-[13px] font-semibold text-paper">{formatNumber(t.adjustedBookBalance)}</span>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Reconciliation check */}
        <div className={`flex items-center justify-between rounded-md border px-3 py-2.5 ${t.isReconciled ? 'border-success/40 bg-success/10' : 'border-crimson-500/40 bg-crimson-500/10'}`}>
          <span className={`font-mono text-[10px] uppercase tracking-[0.1em] ${t.isReconciled ? 'text-success' : 'text-crimson-300'}`}>
            {t.isReconciled ? '✓ Reconciled' : '⚠ Out of balance'}
          </span>
          <span className={`font-mono text-[13px] font-semibold ${t.isReconciled ? 'text-success' : 'text-crimson-300'}`}>
            {t.isReconciled ? '0.00' : (t.difference < 0 ? `(${formatNumber(Math.abs(t.difference))})` : formatNumber(t.difference))}
          </span>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">
              Reconciled balance
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {t.isReconciled ? 'Verified ✓' : 'Pending'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(t.adjustedBankBalance, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Cut-off explanations, bank errors, follow-ups…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Reconciliation PDF'}
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={handleXlsx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'xlsx' ? '…' : (<>Export XLSX <ArrowRight size={10} /></>)}
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
            Need auto-match?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function ReconMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Bank Reconciliation
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">
          Operating Account · USD
        </span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Sonchoy Studio Ltd.</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">Account #XXXX-4521 · As of 30 Jun 2026</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
          <BrandMark size={14} className="text-paper" />
        </span>
      </div>

      {/* Stats strip */}
      <div className="mb-5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Stmt bal.',  '187,280'],
          ['Book bal.',  '184,220'],
          ['Adjusted',   '196,058'],
          ['Status',     '✓ BAL', 'text-success'],
        ].map(([k, v, tone]) => (
          <div key={k} className="bg-canvas px-2 py-3">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className={`m-0 mt-1 font-mono text-[12px] font-semibold ${tone || 'text-ink-950'}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Two-column mock */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bank side */}
        <div>
          <div className="mb-2 rounded-md bg-ink-950 px-2 py-1">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-tax">Per bank</span>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between border-b border-line pb-1">
              <span className="font-semibold text-ink-950">Statement bal.</span>
              <span className="font-mono font-semibold text-ink-950">187,280</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-700">+ DIT</span>
              <span className="font-mono text-success">+12,600</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-700">− Outstanding</span>
              <span className="font-mono text-crimson-300">−3,872</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-700">+ Bank adj.</span>
              <span className="font-mono text-success">+50</span>
            </div>
            <div className="mt-2 rounded bg-ink-950 px-2 py-1.5 text-center">
              <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-tax">Adjusted</span>
              <span className="block font-mono text-[12px] font-semibold text-paper">196,058</span>
            </div>
          </div>
        </div>

        {/* Book side */}
        <div>
          <div className="mb-2 rounded-md bg-ink-950 px-2 py-1">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-tax">Per books</span>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between border-b border-line pb-1">
              <span className="font-semibold text-ink-950">Book bal.</span>
              <span className="font-mono font-semibold text-ink-950">184,220</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-700">+ Interest</span>
              <span className="font-mono text-success">+142</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-700">− Bank charges</span>
              <span className="font-mono text-crimson-300">−43</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-700">− NSF returns</span>
              <span className="font-mono text-crimson-300">−580</span>
            </div>
            <div className="mt-2 rounded bg-ink-950 px-2 py-1.5 text-center">
              <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-tax">Adjusted</span>
              <span className="block font-mono text-[12px] font-semibold text-paper">196,058</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reconciled banner */}
      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-success">✓ Reconciled</span>
          <span className="font-mono text-[13px] font-semibold text-paper">USD 196,058.00</span>
        </div>
        <p className="m-0 mt-1 text-[9px] text-ink-500">Both sides match to the cent.</p>
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
            From two balances{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            one reconciled number.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            The classic two-column reconciliation auditors expect: bank side adjusts for outstanding items, book side adjusts for unrecorded transactions, both arrive at the same balance.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <ReconcileIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Reconciliation Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  30 Jun 2026 · USD
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Account',          'Operating · #XXXX-4521'],
                  ['Statement bal.',   '187,280.00'],
                  ['Book bal.',        '184,220.00'],
                  ['Bank-side adj.',   '+8,778.00 (3 categories)'],
                  ['Book-side adj.',   '−481.00 (3 categories)'],
                  ['Reconciled to',    '196,058.00 (both sides)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-success/40 bg-success/10 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-success">✓ Reconciled</span>
                <span className="font-mono text-[12px] font-semibold text-success">0.00</span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Reconciled balance</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 196,058.00</span>
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
                  Audit-ready
                </span>
              </div>
              <ReconMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Type the two balances',  'Statement balance (bank\'s number) and book balance (your ledger\'s number). They rarely match — that\'s normal.'],
  ['02', 'Log reconciling items',  'Outstanding checks, deposits in transit, interest, bank charges, NSF returns — anything that explains the gap.'],
  ['03', 'Confirm balanced',       'PDF only ships green when adjusted bank = adjusted book. Any remaining gap surfaces with the exact amount.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three steps to{' '}
              <em className="font-serif font-normal italic text-crimson-300">cash certainty.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Bank reconciliation is monthly hygiene — catches fraud, errors, and timing issues before they snowball. Run it at every period close so the cash on your balance sheet is the cash you actually have.
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
  { title: 'Two-column auditor format', desc: 'Bank side and book side side-by-side — the format every accountant and auditor expects on first glance.' },
  { title: '5 reconciling item types',   desc: 'Deposits in transit, outstanding checks, interest, bank charges, NSF returns — each with its own input group.' },
  { title: 'Live balance check',         desc: 'Adjusted bank vs adjusted book reconciled on every keystroke — green when balanced, red when not.' },
  { title: 'Check / payee tracking',     desc: 'Outstanding checks carry check number + payee. NSF returns carry check number + payer. Auditable detail in every row.' },
  { title: 'Bank & book adjustments',    desc: 'Free-form line items for one-off corrections (bank errors, ledger fixes) on either side.' },
  { title: 'Item count summary',         desc: 'PDF includes a reconciling-items summary table — at-a-glance count and amount per category.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for month-end</Eyebrow>
          <SectionTitle>
            Every line a{' '}
            <em className="font-serif font-normal italic text-crimson-300">CFO</em> can defend.
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
  { q: 'Why do statement and book balances disagree?',         a: 'Timing. Deposits you recorded today won\'t show on the statement until they clear. Checks you wrote yesterday won\'t hit the bank until the payee deposits. Interest the bank credited you may not be in your books yet. Reconciliation explains the gap.' },
  { q: 'What\'s a deposit in transit (DIT)?',                  a: 'Money you deposited at end of period that the bank hadn\'t processed by the statement cut-off. It\'s in your book balance but not yet in the bank balance — so you add it back when reconciling.' },
  { q: 'What\'s an outstanding check?',                        a: 'A check you issued that hasn\'t cleared the bank yet. It reduced your book balance when you wrote it, but the bank still has the cash — so you subtract it from the bank balance when reconciling.' },
  { q: 'How do bank errors fit?',                              a: 'Bank errors (rare but they happen — duplicate posting, wrong amount, misapplied wire) go in "Bank adjustments". Use positive for credits-in-error to add, negative for debits-in-error to subtract. Document with the bank\'s error notice for audit.' },
  { q: 'What if I can\'t get it to balance?',                  a: 'The PDF stays red and shows the exact gap. Common causes: a check you missed entering in the book, an interest credit not yet booked, an NSF return not posted, or a transposition error somewhere. Hunt for an item equal to the gap, then look for two items that net to the gap.' },
  { q: 'Output formats?',                                      a: 'PDF (two-column reconciliation + reconciling-items summary + signature line) and .xlsx (single sheet with the same two columns laid out for easy auditor review).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">bank reconciliation.</em>
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
  { name: 'Bank Statement PDF to Excel', desc: 'Reconcile transactions from a statement PDF.', Icon: BankStatementIcon, label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
  { name: 'Tax Calculation Sheet',       desc: 'Progressive income-tax slabs by regime.',     Icon: PercentIcon,      label: 'TAX',     path: '/tools/tax-calculation-sheet' },
  { name: 'VAT Calculator PDF Export',   desc: 'Inline VAT/sales-tax calculation.',           Icon: VatIcon,          label: 'TAX',     path: '/tools/vat-calculator-pdf-export' },
  { name: 'Payroll Tax Report',          desc: 'Employer withholding summaries.',             Icon: PayrollIcon,      label: 'TAX',     path: '/tools/payroll-tax-report' },
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
            const isTax = t.label === 'TAX'
            const isConvert = t.label === 'CONVERT'
            const labelColor = isTax ? 'text-tax' : (isConvert ? 'text-convert' : 'text-business')
            const iconBg = isTax ? 'bg-tax-bg text-tax' : (isConvert ? 'bg-convert-bg text-convert' : 'bg-business-bg text-business')
            const inner = (
              <>
                <span className={`absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] ${labelColor}`}>
                  {t.label}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-md ${iconBg}`}>
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

export default function BankReconciliationSheetPage() {
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
