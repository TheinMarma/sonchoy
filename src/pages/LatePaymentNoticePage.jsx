import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  LetterIcon, BellIcon, ContractIcon, NdaIcon, ProposalIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, FRAMEWORKS, NOTICE_PURPOSES, SIGN_OFFS,
  findFramework, findCurrency, findPurpose, findSignOff,
  computeNotice, daysBetween, todayISO,
  formatNumber, formatMoney, formatDate,
} from '../lib/latePaymentNotice/compute'
import { generateLatePaymentNoticePdf } from '../lib/latePaymentNotice/generatePdf'
import { generateLatePaymentNoticeDocx } from '../lib/latePaymentNotice/generateDocx'

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
      aria-label="Live Late Payment Notice Generator"
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
  ['4',       'Statutory frameworks'],
  ['Auto',    'Interest + compensation'],
  ['Pre-action', 'Court-ready format'],
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
          style={{ background: 'radial-gradient(circle, var(--color-contracts) 0%, transparent 60%)' }}
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
            <span className="text-contracts">Contracts</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Late Payment Notice</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-contracts/30 bg-contracts-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-contracts">
            <span className="h-1.5 w-1.5 rounded-full bg-contracts shadow-[0_0_0_4px_rgba(244,63,94,0.25)]" />
            Contracts · Statutory demand
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            When polite stops working{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — go statutory.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Formal late-payment notices under UK, EU, or US frameworks. Statutory interest, recovery compensation, and a deadline calculated to the day — properly drafted as a pre-action letter your debtor&rsquo;s lawyer will take seriously.
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
              <Check className="text-crimson-400" /> Editable DOCX export
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
  'focus:border-contracts/60 focus:ring-2 focus:ring-contracts/20 hover:border-line-strong'

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

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-line bg-paper px-3 py-2 transition-colors hover:border-line-strong">
      <div className="min-w-0 flex-1 pr-3">
        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">{label}</span>
        {desc && <span className="block truncate text-[11px] text-ink-500">{desc}</span>}
      </div>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer accent-contracts"
      />
    </label>
  )
}

/* ---------- Purpose picker ---------- */

const PURPOSE_COLORS = {
  'demand':     { bg: 'bg-amber-600/10',  text: 'text-amber-700',  border: 'border-amber-600/40' },
  'pre-action': { bg: 'bg-crimson-500/10', text: 'text-crimson-400', border: 'border-crimson-500/50' },
  'final':      { bg: 'bg-red-500/10',     text: 'text-red-600',     border: 'border-red-500/50' },
}

function PurposePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {NOTICE_PURPOSES.map((s) => {
        const c = PURPOSE_COLORS[s.id]
        const active = value === s.id
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors ${
              active ? `${c.border} ${c.bg}` : 'border-line bg-paper hover:border-line-strong'
            }`}
          >
            <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${active ? c.text : 'text-ink-500'}`}>
              {s.id === 'final' ? 'FINAL' : s.id === 'pre-action' ? 'PRE-ACTION' : 'DEMAND'}
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

/* ---------- Stateful generator ---------- */

const INITIAL = {
  purposeId: 'pre-action',
  frameworkId: 'uk',
  noticeDate: todayISO(),
  noticeReference: 'LPN-2026-0083',

  sender: {
    name: 'Sonchoy Studio Ltd.',
    contactName: 'Alex Hartwell',
    contactTitle: 'Managing Director',
    address: '7 Old Street, London EC1V 9HL, United Kingdom',
    email: 'accounts@sonchoystudio.com',
    phone: '+44 20 7946 0011',
  },
  debtor: {
    name: 'Northwind Books Ltd.',
    contactName: 'Marcus Vance',
    address: '221B Baker Street, London NW1 6XE, United Kingdom',
    companyNumber: '08234567',
    email: 'ap@northwindbooks.com',
  },

  invoiceNumber: 'INV-2026-0241',
  invoiceDate: '2026-04-12',
  dueDate: '2026-04-26',
  amount: 12500,
  currency: 'GBP',
  contractDescription: 'design and brand identity services rendered under our engagement of 1 March 2026',

  baseRatePct: 5.25,
  marginPct: 8,

  includeCompensation: true,
  deadlineDays: 14,

  includeDisputeClause: true,
  includeWithoutPrejudice: true,

  paymentInstructions: 'Bank: Lloyds · Account name: Sonchoy Studio Ltd. · Sort code: 30-12-34 · Account: 12345678 · IBAN: GB12 LOYD 3012 3412 3456 78. Please quote reference LPN-2026-0083 and the invoice number.',

  signOffId: 'faithfully',

  notes: 'Sent first reminder 14 days ago; AP did not respond. Counsel cc\'d on this notice. Court action prepped if no payment within deadline.',
}

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const fw = useMemo(() => findFramework(data.frameworkId), [data.frameworkId])
  const purpose = useMemo(() => findPurpose(data.purposeId), [data.purposeId])
  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const c = useMemo(() => computeNotice(data), [data])
  const daysOverdue = useMemo(() => Math.max(0, daysBetween(data.dueDate, data.noticeDate)), [data.dueDate, data.noticeDate])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setSenderField = (k) => (v) =>
    setData((s) => ({ ...s, sender: { ...s.sender, [k]: v } }))
  const setDebtorField = (k) => (v) =>
    setData((s) => ({ ...s, debtor: { ...s.debtor, [k]: v } }))
  const reset = () => setData({ ...INITIAL })

  // When framework changes, pre-fill its rates and currency
  const applyFramework = (id) => {
    const f = findFramework(id)
    setData((s) => ({
      ...s,
      frameworkId: id,
      baseRatePct: f.baseRatePct,
      marginPct: f.statutoryMarginPct,
      currency: f.currencyDefault,
    }))
  }

  const handlePdf  = async () => { try { setBusy('pdf');  generateLatePaymentNoticePdf(data) }  finally { setBusy(null) } }
  const handleDocx = async () => { try { setBusy('docx'); await generateLatePaymentNoticeDocx(data) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-contracts) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-contracts-bg text-contracts">
              <LetterIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Statutory notice · {purpose.label}
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

        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Purpose
        </span>
        <PurposePicker value={data.purposeId} onChange={setField('purposeId')} />

        <div className="my-3.5 h-px bg-line" />

        {/* Framework */}
        <SelectInput
          label="Statutory framework"
          value={data.frameworkId}
          onChange={applyFramework}
          options={FRAMEWORKS.map((f) => ({ value: f.id, label: f.label }))}
        />
        <p className="m-0 mt-1 text-[10.5px] italic text-ink-500">{fw.reference}</p>

        <div className="my-3.5 h-px bg-line" />

        {/* Invoice */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Invoice details
        </span>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Invoice number"  value={data.invoiceNumber}   onChange={setField('invoiceNumber')} mono />
            <TextInput label="Notice reference" value={data.noticeReference} onChange={setField('noticeReference')} mono />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <DateInput label="Invoice date" value={data.invoiceDate} onChange={setField('invoiceDate')} />
            <DateInput label="Due date"     value={data.dueDate}     onChange={setField('dueDate')} />
            <DateInput label="Notice date"  value={data.noticeDate}  onChange={setField('noticeDate')} />
          </div>
          <div className="grid grid-cols-[1fr_92px] gap-2">
            <NumberInput label="Principal amount" value={data.amount} onChange={setField('amount')} />
            <SelectInput
              label="Currency"
              value={data.currency}
              onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))}
            />
          </div>
          <TextareaInput
            label="Contract / supply description"
            value={data.contractDescription}
            onChange={setField('contractDescription')}
            rows={2}
            placeholder="e.g. services rendered under our engagement of 1 March 2026"
          />
          <div className="flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Days overdue</span>
            <span className={`font-mono text-[12px] font-semibold ${daysOverdue > 0 ? 'text-crimson-400' : 'text-ink-500'}`}>
              {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Rates */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Statutory rate
        </span>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label={fw.baseRateLabel}       value={data.baseRatePct} onChange={setField('baseRatePct')} suffix="%" />
          <NumberInput label={fw.statutoryMarginLabel} value={data.marginPct}   onChange={setField('marginPct')}   suffix="%" />
        </div>
        <div className="mt-2 rounded-md border border-line bg-canvas px-3 py-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Total rate</span>
            <span className="font-mono font-semibold text-ink-950">{formatNumber(c.interest.rate)}% p.a.</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Daily accrual</span>
            <span className="font-mono text-ink-950">{cur.code} {formatNumber(c.interest.perDay)} / day</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-line pt-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-contracts">Interest accrued</span>
            <span className="font-mono font-semibold text-contracts">{cur.code} {formatNumber(c.interest.amount)}</span>
          </div>
        </div>

        <div className="mt-3">
          <ToggleRow
            label="Include statutory compensation"
            desc={`${fw.compensationLabel} (auto-calculated)`}
            checked={data.includeCompensation}
            onChange={setField('includeCompensation')}
          />
          {data.includeCompensation && c.compensation > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Compensation</span>
              <span className="font-mono text-[12px] font-semibold text-contracts">
                {fw.compensationCurrencyLabel || cur.code}{fw.compensationCurrencyLabel ? '' : ' '}{formatNumber(c.compensation)}
              </span>
            </div>
          )}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Sender */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          From (creditor)
        </span>
        <div className="space-y-2">
          <TextInput label="Company name" value={data.sender.name} onChange={setSenderField('name')} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Signatory name"  value={data.sender.contactName}  onChange={setSenderField('contactName')} />
            <TextInput label="Signatory title" value={data.sender.contactTitle} onChange={setSenderField('contactTitle')} />
          </div>
          <TextareaInput label="Address" value={data.sender.address} onChange={setSenderField('address')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email" value={data.sender.email} onChange={setSenderField('email')} mono />
            <TextInput label="Phone" value={data.sender.phone} onChange={setSenderField('phone')} mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Debtor */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          To (debtor)
        </span>
        <div className="space-y-2">
          <TextInput label="Company name"     value={data.debtor.name}        onChange={setDebtorField('name')} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Contact name"   value={data.debtor.contactName} onChange={setDebtorField('contactName')} />
            <TextInput label="Company no."    value={data.debtor.companyNumber} onChange={setDebtorField('companyNumber')} mono />
          </div>
          <TextareaInput label="Address" value={data.debtor.address} onChange={setDebtorField('address')} rows={2} />
          <TextInput label="Email" value={data.debtor.email} onChange={setDebtorField('email')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Deadline & options */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          Deadline &amp; clauses
        </span>
        <div className="space-y-2">
          <NumberInput
            label="Payment deadline"
            value={data.deadlineDays}
            onChange={setField('deadlineDays')}
            suffix="days"
          />
          <p className="m-0 text-[10.5px] text-ink-500">
            Deadline in letter: <span className="font-mono text-ink-700">{c.deadlineFormatted || '—'}</span>
          </p>
          <ToggleRow
            label="Dispute-or-deemed-admitted clause"
            desc="Forces a written response or deems debt admitted"
            checked={data.includeDisputeClause}
            onChange={setField('includeDisputeClause')}
          />
          <ToggleRow
            label='"Without prejudice" reservation'
            desc="Preserves all other rights and remedies"
            checked={data.includeWithoutPrejudice}
            onChange={setField('includeWithoutPrejudice')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Payment instructions */}
        <TextareaInput
          label="Payment details"
          value={data.paymentInstructions}
          onChange={setField('paymentInstructions')}
          rows={3}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Sign-off */}
        <SelectInput
          label="Sign-off"
          value={data.signOffId}
          onChange={setField('signOffId')}
          options={SIGN_OFFS.map((s) => ({ value: s.id, label: s.label }))}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Summary card */}
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
            Notice summary
          </p>
          <div className="space-y-1 text-[11px]">
            {[
              ['Type',          purpose.label],
              ['Framework',     fw.label.split('—')[0].trim()],
              ['Debtor',        data.debtor.name || '—'],
              ['Principal',     `${cur.code} ${formatNumber(c.principal)}`],
              ['Interest',      `${cur.code} ${formatNumber(c.interest.amount)} @ ${formatNumber(c.interest.rate)}%`],
              ['Compensation',  data.includeCompensation && c.compensation > 0
                ? `${fw.compensationCurrencyLabel || cur.code}${fw.compensationCurrencyLabel ? '' : ' '}${formatNumber(c.compensation)}`
                : '—'],
              ['Deadline',      c.deadlineFormatted || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="text-ink-500">{k}</span>
                <span className="truncate text-right font-mono text-ink-900">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-contracts/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-contracts">
              Total now due
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {c.daysOverdue} d overdue
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(c.total, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Internal notes (not in PDF)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Counsel cc, prior contact log, escalation plan…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Notice PDF'}
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={handleDocx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'docx' ? '…' : (<>Export DOCX (editable) <ArrowRight size={10} /></>)}
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

function NoticeMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-crimson-500" />
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[12px] font-bold text-ink-950">Sonchoy Studio Ltd.</p>
            <p className="m-0 mt-0.5 text-[9px] text-ink-500">7 Old Street, London EC1V 9HL</p>
            <p className="m-0 text-[9px] text-ink-500">accounts@sonchoystudio.com · +44 20 7946 0011</p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded bg-crimson-500 px-2 py-0.5 font-mono text-[7.5px] font-bold text-white">LETTER BEFORE ACTION</span>
            <p className="m-0 mt-1 text-[9px] text-ink-500">19 May 2026</p>
            <p className="m-0 text-[9px] text-ink-500">Ref: LPN-2026-0083</p>
          </div>
        </div>

        <div className="mt-3 h-[1.5px] bg-crimson-500" />
        <p className="m-0 mt-2 text-[13px] font-bold text-crimson-400">FORMAL NOTICE OF LATE PAYMENT</p>
        <p className="m-0 mt-0.5 text-[9px] italic text-ink-500">
          Issued under: Late Payment of Commercial Debts (Interest) Act 1998 (as amended)
        </p>
        <div className="my-2 h-px bg-line" />

        <p className="m-0 font-mono text-[7.5px] uppercase tracking-[0.12em] text-ink-500">TO</p>
        <p className="m-0 text-[11px] font-bold text-ink-950">Northwind Books Ltd.</p>
        <p className="m-0 text-[9px] text-ink-700">221B Baker Street, London NW1 6XE</p>
        <p className="m-0 text-[9px] text-ink-700">Company no.: 08234567</p>

        <p className="m-0 mt-3 text-[9.5px] text-ink-700">Dear Marcus Vance,</p>
        <p className="m-0 mt-1 text-[9px] leading-[1.5] text-ink-700">
          We refer to invoice INV-2026-0241 (the &ldquo;Invoice&rdquo;) issued by Sonchoy Studio Ltd. to Northwind Books Ltd. on 12 Apr 2026 for the sum of GBP 12,500.00 in respect of design and brand identity services…
        </p>

        <div className="mt-3 rounded border border-line bg-canvas p-2.5">
          <div className="flex items-center justify-between">
            <p className="m-0 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-crimson-400">STATEMENT OF ACCOUNT</p>
            <p className="m-0 text-[7.5px] text-ink-500">As at 19 May 2026</p>
          </div>
          {[
            ['Principal sum',           'GBP 12,500.00'],
            ['Statutory interest @ 13.25% p.a. (23 d)', 'GBP 104.40'],
            ['Fixed compensation (s.5A)', '£100'],
          ].map(([k, v]) => (
            <div key={k} className="mt-1 flex items-center justify-between text-[9px]">
              <span className="text-ink-500">{k}</span>
              <span className="font-mono text-ink-950">{v}</span>
            </div>
          ))}
          <div className="my-1.5 h-px bg-line" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9.5px] font-bold text-crimson-400">TOTAL NOW DUE</span>
            <span className="font-mono text-[10px] font-bold text-crimson-400">GBP 12,704.40</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[9px] leading-[1.5] text-ink-700">
          Demand is hereby made for payment of the total sum of GBP 12,704.40 within 14 days, being no later than 2 Jun 2026…
        </p>

        <p className="m-0 mt-3 text-[9px] text-ink-700">Yours faithfully,</p>
        <p className="m-0 mt-3 text-[10px] font-bold text-ink-950">Alex Hartwell</p>
        <p className="m-0 text-[8.5px] text-ink-500">Managing Director · For and on behalf of Sonchoy Studio Ltd.</p>
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
            A proper statutory notice{' '}
            <em className="font-serif font-normal italic text-crimson-300">— not a reminder.</em>
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Interest at the prescribed rate, recovery compensation at the statutory amount, a clear demand with a hard deadline, and a citation to the law that gives you the right to all of it.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-contracts-bg text-contracts">
                    <LetterIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Notice Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Pre-action · UK
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Purpose',     'Letter before action'],
                  ['Framework',   'UK — Late Payment Act 1998'],
                  ['Invoice',     'INV-2026-0241 · GBP 12,500.00'],
                  ['Due date',    '26 Apr 2026 · 23 days overdue'],
                  ['Rate',        'BoE base 5.25% + 8% margin = 13.25%'],
                  ['Interest',    'GBP 104.40 (£0.0454/day)'],
                  ['Compensation', '£100 (s.5A fixed sum)'],
                  ['Deadline',    '2 Jun 2026 (14 days)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-contracts/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-contracts">Total now due</span>
                <span className="font-mono text-[14px] font-semibold text-paper">GBP 12,704.40</span>
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
                  Court-ready
                </span>
              </div>
              <NoticeMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the framework',  'UK Late Payment Act, EU Directive 2011/7, US contractual rate, or custom. The interest rate, statutory margin, and fixed compensation values all switch automatically.'],
  ['02', 'Drop in the debt',     'Invoice number, dates, principal amount. Days overdue, daily interest accrual, and prorated statutory interest all calculate as you type.'],
  ['03', 'Set the deadline',     'Pick demand, pre-action, or final stage. The deadline date, demand language, and consequences-on-default paragraph adapt to the stage you choose.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Get paid, or be{' '}
              <em className="font-serif font-normal italic text-crimson-300">litigation-ready.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A late-payment notice does two jobs at once. For most debtors, the citation of the statute and the precise interest figure unlocks payment within the deadline. For the rest, the notice becomes Exhibit A in your recovery claim.
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
  { title: 'Four statutory frameworks', desc: 'UK Late Payment Act 1998, EU Directive 2011/7, US contractual rate, or custom contract rate. Switch and the rates auto-fill.' },
  { title: 'Auto interest calculation', desc: 'Principal × (base rate + statutory margin) × days / 365. Shown as accrued total, daily run-rate, and total now due.' },
  { title: 'Statutory compensation',    desc: 'UK tiered fixed sum (£40 / £70 / £100 by debt size), EU €40 minimum recovery costs, or off for US/custom. Calculated automatically.' },
  { title: 'Three escalation stages',   desc: 'Demand for payment, letter before action, or final statutory demand. Body copy and consequences paragraph adapt to the stage.' },
  { title: 'Pre-action ready',          desc: 'Dispute-or-deemed-admitted clause, without-prejudice reservation, signature block. Standard pre-action protocol language a court will recognise.' },
  { title: 'PDF + editable DOCX',       desc: 'Print-ready PDF with letterhead, statute citation, statement of account, and demand block. Editable .docx for counsel review.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for credit control</Eyebrow>
          <SectionTitle>
            Everything your{' '}
            <em className="font-serif font-normal italic text-crimson-300">solicitor</em> would write.
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-contracts/20 bg-contracts-bg text-contracts">
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
  { q: 'How is this different from a Payment Reminder Letter?',     a: 'The reminder letter is collections-flow correspondence — friendly to firm in tone, designed to nudge a customer. A late-payment notice is a formal pre-action document — it cites the statute, sets out the precise interest and compensation owed under law, and warns of legal proceedings. Send reminders first; escalate to a notice when reminders are ignored.' },
  { q: 'Is the UK interest rate really 8% over base?',              a: 'Yes — under section 6 of the Late Payment of Commercial Debts (Interest) Act 1998, statutory interest on a qualifying commercial debt is the Bank of England base rate plus 8 percentage points. The tool defaults to a current-ish base rate which you can edit if BoE has moved.' },
  { q: 'What is the £40 / £70 / £100 fixed compensation?',          a: 'Section 5A of the UK Act entitles you to fixed compensation per invoice, in addition to interest: £40 for debts under £1,000, £70 for £1,000–£10,000, and £100 for £10,000 or more. It is automatic and doesn\'t require a contractual entitlement.' },
  { q: 'What about debts in the EU or US?',                        a: 'EU: Directive 2011/7 mirrors the UK position — ECB reference rate + 8% margin, plus a minimum €40 in recovery costs. US: no federal statutory rate; the tool defaults to a contractual rate (commonly 18% p.a., or 1.5% per month) but you must check the usury cap in the applicable state. Custom framework lets you plug in whatever your contract specifies.' },
  { q: 'Will this stand up in court?',                              a: 'The format follows standard pre-action protocols and the calculation is mathematically defensible — but it is generated by software, not by a lawyer. For debts over a meaningful threshold, or where the debtor has threatened to dispute, have counsel review the DOCX before sending. The tool gives you a strong starting draft, not the last word.' },
  { q: 'Output formats?',                                           a: 'PDF (one or two pages, with letterhead, statutory citation, statement-of-account box, demand paragraph with deadline, signature block, footer with stage and reference) and .docx (fully editable). The accent colour reflects the stage — amber for demand, crimson for pre-action, red for final.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">late-payment notices.</em>
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
  { name: 'Payment Reminder Letter',     desc: 'Polite-to-firm reminders before going statutory.', Icon: BellIcon,     label: 'CONTRACTS', path: '/tools/payment-reminder-letter' },
  { name: 'Client Contract Generator',   desc: 'Set clear payment terms in writing.',              Icon: ContractIcon, label: 'CONTRACTS', path: '/tools/client-contract-generator' },
  { name: 'Service Agreement Generator', desc: 'MSA + SoW for ongoing engagements.',               Icon: ContractIcon, label: 'CONTRACTS', path: '/tools/service-agreement-generator' },
  { name: 'Business Proposal Generator', desc: 'Win the work before the invoice goes out.',        Icon: ProposalIcon, label: 'CONTRACTS', path: '/tools/business-proposal-generator' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-contracts">
                  {t.label}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-contracts-bg text-contracts">
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

export default function LatePaymentNoticePage() {
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
