'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  BellIcon, LetterIcon, ContractIcon, NdaIcon, ProposalIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, REMINDER_STAGES, DELIVERY_METHODS, SIGN_OFFS,
  findStage, findCurrency, findSignOff,
  buildLetterCopy, daysBetween, todayISO,
  formatNumber, formatMoney, formatDate,
} from '@/lib/paymentReminder/compute'
import { generatePaymentReminderPdf } from '@/lib/paymentReminder/generatePdf'
import { generatePaymentReminderDocx } from '@/lib/paymentReminder/generateDocx'

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
      aria-label="Live Payment Reminder Letter Generator"
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
  ['4',       'Tone stages'],
  ['Auto',    'Days-overdue calc'],
  ['PDF+',    'DOCX + email subject'],
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
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-contracts">Contracts</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Payment Reminder Letter</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-contracts/30 bg-contracts-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-contracts">
            <span className="h-1.5 w-1.5 rounded-full bg-contracts shadow-[0_0_0_4px_rgba(244,63,94,0.25)]" />
            Contracts · Collections
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Polite, then firm{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — get paid
            </em>
            <br />
            without the{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              awkward call.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Four pre-written escalation stages — gentle pre-due nudge through final notice with legal teeth. Tone shifts automatically; the invoice details, days overdue, and late-payment interest stay accurate.
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
              href="/#tools"
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
          className={`${inputClass} text-right font-mono ${suffix ? 'pr-10' : ''}`}
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

/* ---------- Stage picker ---------- */

const STAGE_COLORS = {
  gentle: { bg: 'bg-success/10',         text: 'text-success',         border: 'border-success/40' },
  polite: { bg: 'bg-yellow-500/10',      text: 'text-yellow-600',      border: 'border-yellow-500/40' },
  firm:   { bg: 'bg-amber-600/10',       text: 'text-amber-700',       border: 'border-amber-600/40' },
  final:  { bg: 'bg-crimson-500/10',     text: 'text-crimson-400',     border: 'border-crimson-500/50' },
}

function StagePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {REMINDER_STAGES.map((s) => {
        const c = STAGE_COLORS[s.tone]
        const active = value === s.id
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors ${
              active
                ? `${c.border} ${c.bg}`
                : 'border-line bg-paper hover:border-line-strong'
            }`}
          >
            <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${active ? c.text : 'text-ink-500'}`}>
              {s.tag}
            </span>
            <span className={`text-[11px] leading-tight ${active ? 'text-ink-950' : 'text-ink-700'}`}>
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
  stageId: 'first',
  letterDate: todayISO(),

  sender: {
    name: 'Sonchoy Studio Ltd.',
    contactName: 'Alex Hartwell',
    contactTitle: 'Managing Director',
    address: '7 Old Street, London EC1V 9HL, United Kingdom',
    email: 'accounts@sonchoystudio.com',
    phone: '+44 20 7946 0011',
  },
  client: {
    name: 'Northwind Books Ltd.',
    address: '221B Baker Street, London NW1 6XE, United Kingdom',
    email: 'ap@northwindbooks.com',
  },
  recipientName: 'Marcus Vance',

  invoiceNumber: 'INV-2026-0241',
  invoiceDate: '2026-04-12',
  dueDate: '2026-04-26',
  amount: 4800,
  currency: 'USD',

  includeInterest: false,
  interestRate: 8,
  finalNoticeDays: 7,

  paymentInstructions: 'Bank: Lloyds · Account name: Sonchoy Studio Ltd. · Sort code: 30-12-34 · Account: 12345678 · IBAN: GB12 LOYD 3012 3412 3456 78. Please quote the invoice number as the payment reference.',

  signOffId: 'kind',
  deliveryId: 'email',

  notes: 'Cooper at Northwind AP confirmed receipt of INV last week — likely just slipped through. Friendly tone for now.',
}

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const stage = useMemo(() => findStage(data.stageId), [data.stageId])
  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const letter = useMemo(() => buildLetterCopy(data), [data])
  const daysOverdue = useMemo(() => Math.max(0, daysBetween(data.dueDate, data.letterDate)), [data.dueDate, data.letterDate])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setSenderField = (k) => (v) =>
    setData((s) => ({ ...s, sender: { ...s.sender, [k]: v } }))
  const setClientField = (k) => (v) =>
    setData((s) => ({ ...s, client: { ...s.client, [k]: v } }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generatePaymentReminderPdf(data) }  finally { setBusy(null) } }
  const handleDocx = async () => { try { setBusy('docx'); await generatePaymentReminderDocx(data) } finally { setBusy(null) } }
  const handleCopySubject = async () => {
    try { await navigator.clipboard.writeText(letter.subject) } catch {}
  }
  const handleCopyBody = async () => {
    try { await navigator.clipboard.writeText(letter.paragraphs.join('\n')) } catch {}
  }

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
              <BellIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Reminder letter · {stage.label}
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
          Tone &amp; stage
        </span>
        <StagePicker value={data.stageId} onChange={setField('stageId')} />

        <div className="my-3.5 h-px bg-line" />

        {/* Invoice */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          The invoice
        </span>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Invoice number" value={data.invoiceNumber} onChange={setField('invoiceNumber')} mono />
            <DateInput  label="Letter date"    value={data.letterDate}    onChange={setField('letterDate')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DateInput label="Invoice date" value={data.invoiceDate} onChange={setField('invoiceDate')} />
            <DateInput label="Due date"     value={data.dueDate}     onChange={setField('dueDate')} />
          </div>
          <div className="grid grid-cols-[1fr_92px] gap-2">
            <NumberInput label="Amount due" value={data.amount} onChange={setField('amount')} />
            <SelectInput
              label="Currency"
              value={data.currency}
              onChange={setField('currency')}
              options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Days overdue</span>
            <span className={`font-mono text-[12px] font-semibold ${daysOverdue > 0 ? 'text-crimson-400' : 'text-ink-500'}`}>
              {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Sender */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          From (you)
        </span>
        <div className="space-y-2">
          <TextInput label="Company name" value={data.sender.name} onChange={setSenderField('name')} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Contact name"  value={data.sender.contactName}  onChange={setSenderField('contactName')} />
            <TextInput label="Contact title" value={data.sender.contactTitle} onChange={setSenderField('contactTitle')} />
          </div>
          <TextareaInput label="Address" value={data.sender.address} onChange={setSenderField('address')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email" value={data.sender.email} onChange={setSenderField('email')} mono />
            <TextInput label="Phone" value={data.sender.phone} onChange={setSenderField('phone')} mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Recipient */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-contracts">
          To (client)
        </span>
        <div className="space-y-2">
          <TextInput label="Client / company name" value={data.client.name} onChange={setClientField('name')} />
          <TextInput label="Recipient (contact at client)" value={data.recipientName} onChange={setField('recipientName')} />
          <TextareaInput label="Address" value={data.client.address} onChange={setClientField('address')} rows={2} />
          <TextInput label="Email" value={data.client.email} onChange={setClientField('email')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Interest + final notice */}
        <ToggleRow
          label="Include late-payment interest"
          desc="Adds prorated interest line to the invoice table"
          checked={data.includeInterest}
          onChange={setField('includeInterest')}
        />
        {data.includeInterest && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberInput label="Interest rate" value={data.interestRate} onChange={setField('interestRate')} suffix="% p.a." />
            <NumberInput label="Computed interest" value={letter.interest} onChange={() => {}} suffix={cur.code} />
          </div>
        )}
        {stage.id === 'final' && (
          <div className="mt-2">
            <NumberInput label="Final-notice deadline" value={data.finalNoticeDays} onChange={setField('finalNoticeDays')} suffix="days" />
            <p className="m-0 mt-1 text-[10.5px] text-ink-500">
              Deadline in letter: <span className="font-mono text-ink-700">{letter.finalDeadlineFormatted || '—'}</span>
            </p>
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Payment instructions */}
        <TextareaInput
          label="How to pay (bank details, link, etc.)"
          value={data.paymentInstructions}
          onChange={setField('paymentInstructions')}
          rows={3}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Sign-off + delivery */}
        <div className="grid grid-cols-2 gap-2">
          <SelectInput
            label="Sign-off"
            value={data.signOffId}
            onChange={setField('signOffId')}
            options={SIGN_OFFS.map((s) => ({ value: s.id, label: s.label }))}
          />
          <SelectInput
            label="Delivery"
            value={data.deliveryId}
            onChange={setField('deliveryId')}
            options={DELIVERY_METHODS.map((d) => ({ value: d.id, label: d.label }))}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Subject + body preview (for email use) */}
        <div className="rounded-lg border border-line bg-canvas p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Email subject
            </span>
            <button
              type="button"
              onClick={handleCopySubject}
              className="rounded-md bg-contracts-bg px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-contracts hover:bg-contracts/20"
            >
              Copy
            </button>
          </div>
          <p className="m-0 mb-3 truncate text-[11.5px] font-semibold text-ink-950">{letter.subject}</p>

          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Body preview
            </span>
            <button
              type="button"
              onClick={handleCopyBody}
              className="rounded-md bg-contracts-bg px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-contracts hover:bg-contracts/20"
            >
              Copy
            </button>
          </div>
          <pre className="m-0 max-h-32 overflow-y-auto whitespace-pre-wrap break-words font-sans text-[11px] leading-[1.5] text-ink-700">
            {letter.paragraphs.join('\n')}
          </pre>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-contracts/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-contracts">
              Total due
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {stage.tag.toUpperCase()}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney((Number(data.amount) || 0) + (data.includeInterest ? letter.interest : 0), data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Internal notes (not in PDF)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Context for AR ledger or sales rep…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Reminder PDF'}
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

function LetterMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-amber-500" />
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[12px] font-bold text-ink-950">Sonchoy Studio Ltd.</p>
            <p className="m-0 mt-0.5 text-[9px] text-ink-500">7 Old Street, London EC1V 9HL</p>
            <p className="m-0 text-[9px] text-ink-500">accounts@sonchoystudio.com · +44 20 7946 0011</p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded bg-amber-500 px-2 py-0.5 font-mono text-[8px] font-bold text-white">PAYMENT REMINDER</span>
            <p className="m-0 mt-1 text-[9px] text-ink-500">19 May 2026</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="m-0 font-mono text-[7.5px] uppercase tracking-[0.12em] text-ink-500">TO</p>
          <p className="m-0 mt-0.5 text-[11px] font-bold text-ink-950">Marcus Vance</p>
          <p className="m-0 text-[9px] text-ink-700">Northwind Books Ltd. · 221B Baker Street, London NW1 6XE</p>
        </div>

        <div className="my-3 h-px bg-line" />
        <p className="m-0 text-[10px] font-bold text-ink-950">Subject: Payment reminder — invoice INV-2026-0241</p>
        <div className="my-3 h-px bg-line" />

        <p className="m-0 text-[9.5px] leading-[1.55] text-ink-700">Hi Marcus,</p>
        <p className="m-0 mt-2 text-[9.5px] leading-[1.55] text-ink-700">
          I&rsquo;m writing to follow up on invoice INV-2026-0241 for USD 4,800.00, which was due on 26 Apr 2026 and now appears to be 23 days overdue.
        </p>
        <p className="m-0 mt-2 text-[9.5px] leading-[1.55] text-ink-700">
          It&rsquo;s possible this has crossed in the mail with your payment, or perhaps the invoice didn&rsquo;t reach the right person. Could you confirm whether payment has been issued…
        </p>

        <div className="mt-4 rounded border border-line bg-canvas px-3 py-2">
          <p className="m-0 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-amber-700">OUTSTANDING INVOICE</p>
          {[
            ['Invoice number', 'INV-2026-0241'],
            ['Due date',       '26 Apr 2026'],
            ['Days overdue',   '23'],
            ['Amount due',     'USD 4,800.00'],
          ].map(([k, v]) => (
            <div key={k} className="mt-1 flex items-center justify-between text-[9px]">
              <span className="text-ink-500">{k}</span>
              <span className="font-mono text-ink-950">{v}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-5 text-[9.5px] text-ink-700">Kind regards,</p>
        <p className="m-0 mt-4 text-[10px] font-bold text-ink-950">Alex Hartwell</p>
        <p className="m-0 text-[9px] text-ink-500">Managing Director · Sonchoy Studio Ltd.</p>
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
            Four stages, one form{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a paid invoice.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Pick the stage — the tone, subject line, body copy, and accent colour all adapt. Days overdue and interest calculate automatically from the invoice and letter dates.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-contracts-bg text-contracts">
                    <BellIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Reminder Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  First reminder · 23 days
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Stage',          'First reminder · 1–14 days late'],
                  ['Invoice',        'INV-2026-0241 · USD 4,800.00'],
                  ['Due date',       '26 Apr 2026'],
                  ['Days overdue',   '23 days'],
                  ['To',             'Marcus Vance · Northwind Books'],
                  ['Interest',       'Off (toggle to enable)'],
                  ['Sign-off',       'Kind regards'],
                  ['Delivery',       'Email'],
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
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-contracts">Total due</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 4,800.00</span>
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
                  Send-ready
                </span>
              </div>
              <LetterMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the stage',  'Friendly pre-due nudge, first reminder, second reminder, or final notice. The tag colour, subject line, and tone of the body all adapt automatically.'],
  ['02', 'Drop in the invoice', 'Number, dates, amount, currency. Days overdue and (optionally) late-payment interest compute as you type — no spreadsheet maths.'],
  ['03', 'Send or print',   'Generate a PDF for posting, a DOCX for last-minute edits, or copy the email subject and body straight into Gmail / Outlook.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              The grown-up way to{' '}
              <em className="font-serif font-normal italic text-crimson-300">chase money.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Late payers respond to clear, consistent, calm escalation — not to silence followed by an angry phone call. Three reminders over six weeks recovers most overdue invoices without a single awkward conversation.
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
  { title: 'Four pre-written stages',  desc: 'Friendly, first reminder, second reminder, final notice. Each with its own tone, subject line, body copy, and accent colour.' },
  { title: 'Auto days-overdue',        desc: 'Letter date minus due date — calculated and shown in the invoice detail box and woven into the body copy.' },
  { title: 'Late-payment interest',    desc: 'Optional toggle. Prorated by days overdue at your chosen annual rate. Adds a line and total-due row to the invoice table.' },
  { title: 'Final-notice deadline',    desc: 'On the final-notice stage, set the number of days for the new deadline. The exact deadline date is inserted into the body copy.' },
  { title: 'Email subject + body copy', desc: 'Copy buttons for both, so you can paste straight into Gmail or Outlook if you\'d rather email than send a PDF.' },
  { title: 'PDF + editable DOCX',      desc: 'Print-ready PDF with letterhead, stage tag, and signature block. Editable .docx if you want to soften the auto-generated language.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for AR teams</Eyebrow>
          <SectionTitle>
            Everything to{' '}
            <em className="font-serif font-normal italic text-crimson-300">get paid faster.</em>
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
  { q: 'When should I send each stage?',                            a: 'Friendly pre-due: 3–5 days before the due date. First reminder: 3–5 days after the due date. Second reminder: 14–21 days after due. Final notice: 30+ days after due. Consistency matters more than exact timing — pick a cadence and stick to it across customers.' },
  { q: 'Is the final notice legally binding?',                      a: 'It\'s a formal pre-action letter, not a court order — but it satisfies the "letter before action" step that most jurisdictions require before legal proceedings. If you do end up in court, having this paper trail (especially the final notice with a clear deadline) materially strengthens your position.' },
  { q: 'Can I charge late-payment interest?',                       a: 'In most jurisdictions, yes — either at the statutory rate or at the rate set out in your contract / invoice terms. The UK allows 8% over base; the US varies by state; the EU has the Late Payment Directive. Always check local rules. The tool calculates prorated interest at whatever rate you set.' },
  { q: 'What about the GDPR / data protection angle?',              a: 'Reminder letters about a debt you\'re legitimately owed are covered by "legitimate interest" under GDPR. Don\'t share the debt details with third parties (other than your debt-recovery agent or lawyer) — that can be a violation. The tool generates the letter locally; nothing is uploaded.' },
  { q: 'Should I email or post the letter?',                        a: 'Email is fine for stages 1–2; final notice should go by both email and recorded/tracked post so you have proof of receipt. The tool lets you pick delivery method and copy the subject + body straight to your inbox.' },
  { q: 'Output formats?',                                           a: 'PDF (one-page letter with letterhead, stage tag, invoice detail box, signature block, and footer) and .docx (fully editable). The PDF\'s accent colour reflects the stage — green for friendly, amber for first/second reminder, red for final notice.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">payment reminders.</em>
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
  { name: 'Business Proposal Generator', desc: 'Win the work before the invoice goes out.',     Icon: ProposalIcon, label: 'CONTRACTS', path: '/tools/business-proposal-generator' },
  { name: 'Client Contract Generator',   desc: 'Set clear payment terms in writing.',           Icon: ContractIcon, label: 'CONTRACTS', path: '/tools/client-contract-generator' },
  { name: 'Service Agreement Generator', desc: 'MSA + SoW for ongoing engagements.',            Icon: ContractIcon, label: 'CONTRACTS', path: '/tools/service-agreement-generator' },
  { name: 'NDA Generator',               desc: 'Mutual or one-way NDAs.',                       Icon: NdaIcon,      label: 'CONTRACTS', path: '/tools/nda-generator' },
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
            href="/#tools"
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
              <Link key={t.name} href={t.path} className={cls}>{inner}</Link>
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

export default function PaymentReminderLetterTool() {
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
