'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  InvoiceIcon, TaxInvoiceIcon, VatIcon, RecurringIcon, QuoteIcon, ReceiptIcon,
  HashIcon, TemplateIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, TAX_PRESETS, PAYMENT_TERMS,
  computeTotals, formatNumber, formatMoney, formatDate,
  todayISO, addDays, nextInvoiceNumber, lineAmount,
} from '@/lib/invoice/format'
import { generateInvoicePdf } from '@/lib/invoice/generatePdf'
import { generateInvoiceDocx } from '@/lib/invoice/generateDocx'
import { generateInvoiceXlsx } from '@/lib/invoice/generateXlsx'

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

/* ---------- Sample data shown in preview mockups ---------- */

const SAMPLE_INVOICE = {
  number: 'INV-2026-0042',
  issueDate: '06 May 2026',
  dueDate: '20 May 2026',
  vendor: 'Sonchoy Studio',
  buyer: 'Northwind Books Ltd.',
  currency: 'USD',
  items: [
    ['Brand strategy & identity sprint',  1,  '8,400.00',  '8,400.00'],
    ['Web design — landing & onboarding', 2,  '5,200.00',  '10,400.00'],
    ['Implementation support, May',       12, '150.00',    '1,800.00'],
  ],
  subtotal: '20,600.00',
  tax: '4,120.00',
  total: '24,720.00',
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
      aria-label="Live Invoice Generator"
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
  ['60s',   'First invoice'],
  ['PDF+',  'DOCX + XLSX'],
  ['GST/VAT', 'Tax presets'],
  ['Free',  'Always · no signup'],
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
          style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 60%)' }}
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
            <span className="text-invoicing">Invoicing</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Invoice Generator</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-invoicing/30 bg-invoicing-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-invoicing">
            <span className="h-1.5 w-1.5 rounded-full bg-invoicing shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
            Invoicing · Document creation
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Invoice generator{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              built for
            </em>
            <br />
            finance{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              teams.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Fill a clean form, pick a template, and ship a branded invoice PDF in seconds. GST, VAT, and Sales-tax aware out of the box — with currency, locale, and payment-terms wiring already done.
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
              <Check className="text-crimson-400" /> Print-ready output
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

/* ---------- Generator panel mockup (hero right side) ---------- */

/** Read-only field — used by the static PreviewSection mockup only. */
function Field({ label, value, hint, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500">
        {label}
      </span>
      <div className="flex min-h-[36px] items-center justify-between gap-2 rounded-lg border border-line bg-paper px-3 py-2">
        <span className={`text-[12.5px] text-ink-950 ${mono ? 'font-mono' : ''}`}>{value}</span>
        {hint && (
          <span className="shrink-0 rounded border border-line/60 bg-canvas px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-400">
            {hint}
          </span>
        )}
      </div>
    </div>
  )
}

/* ----- Editable form-input building blocks (styled to match `Field`) ----- */

const labelClass = 'font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500'
const inputClass =
  'w-full min-h-[36px] rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950 ' +
  'placeholder:text-ink-400 outline-none transition-colors ' +
  'focus:border-invoicing/60 focus:ring-2 focus:ring-invoicing/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, hint, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <div className="flex items-center justify-between">
        <span className={labelClass}>{label}</span>
        {hint && (
          <span className="rounded border border-line/60 bg-canvas px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-400">
            {hint}
          </span>
        )}
      </div>
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

function DateInput({ label, value, onChange, hint, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <div className="flex items-center justify-between">
        <span className={labelClass}>{label}</span>
        {hint && (
          <span className="rounded border border-line/60 bg-canvas px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-400">
            {hint}
          </span>
        )}
      </div>
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
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/* -------------------- Full functional generator -------------------- */

const INITIAL_INVOICE = {
  number: 'INV-2026-0042',
  issueDate: todayISO(),
  dueDate:   addDays(todayISO(), 14),
  termsId:   'net-14',

  brand: 'Sonchoy Studio',
  fromName:    'Sonchoy Studio',
  fromAddress: '7 Old Street\nLondon EC1V 9HL',
  toName:      'Northwind Books Ltd.',
  toAddress:   'accounts@northwind.co\n221B Baker Street, London',

  currency: 'USD',
  taxId:    'vat-20',

  items: [
    { id: 1, description: 'Brand strategy & identity sprint',  qty: 1,  rate: 8400 },
    { id: 2, description: 'Web design — landing & onboarding', qty: 2,  rate: 5200 },
    { id: 3, description: 'Implementation support, May',       qty: 12, rate: 150 },
  ],

  notes: 'Thank you for the work. Pay via bank transfer to GB29 NWBK 6016 1331 9268 19',
}

let nextItemId = 100

function GeneratorPanel() {
  const [inv, setInv] = useState(INITIAL_INVOICE)
  const [busy, setBusy] = useState(null) // 'pdf' | 'docx' | 'xlsx' | null

  const tax  = useMemo(() => TAX_PRESETS.find((t) => t.id === inv.taxId)  || TAX_PRESETS[0], [inv.taxId])
  const term = useMemo(() => PAYMENT_TERMS.find((t) => t.id === inv.termsId) || PAYMENT_TERMS[1], [inv.termsId])

  const totals = useMemo(() => computeTotals(inv.items, tax.rate), [inv.items, tax.rate])

  const setField  = (key) => (val) => setInv((s) => ({ ...s, [key]: val }))
  const setIssue  = (val) => setInv((s) => ({ ...s, issueDate: val, dueDate: addDays(val, term.days) }))
  const setTerms  = (id) => {
    const t = PAYMENT_TERMS.find((x) => x.id === id) || PAYMENT_TERMS[1]
    setInv((s) => ({ ...s, termsId: id, dueDate: addDays(s.issueDate, t.days) }))
  }

  const updateItem = (id, patch) =>
    setInv((s) => ({ ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }))

  const removeItem = (id) =>
    setInv((s) => ({ ...s, items: s.items.length > 1 ? s.items.filter((it) => it.id !== id) : s.items }))

  const addItem = () =>
    setInv((s) => ({
      ...s,
      items: [...s.items, { id: nextItemId++, description: '', qty: 1, rate: 0 }],
    }))

  const resetForm = () => setInv({ ...INITIAL_INVOICE, items: INITIAL_INVOICE.items.map((i) => ({ ...i })) })

  /** Build the snapshot expected by the export functions */
  const buildPayload = () => ({
    ...inv,
    taxRate: tax.rate,
    taxLabel: tax.label,
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateInvoicePdf(buildPayload()) }  finally { setBusy(null) } }
  const handleDocx = async () => { try { setBusy('docx'); await generateInvoiceDocx(buildPayload()) } finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateInvoiceXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        {/* Panel header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
              <InvoiceIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Invoice
            </span>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700"
            aria-label="Reset form to sample values"
          >
            Reset
          </button>
        </div>

        {/* Invoice details */}
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <TextInput
            label="Invoice number"
            value={inv.number}
            onChange={setField('number')}
            placeholder="INV-2026-0001"
            hint="auto"
          />
          <SelectInput
            label="Currency"
            value={inv.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <DateInput label="Issue date" value={inv.issueDate} onChange={setIssue} />
          <DateInput label="Due date"   value={inv.dueDate}   onChange={setField('dueDate')} hint={term.label} />
        </div>

        <div className="mt-2">
          <SelectInput
            label="Payment terms"
            value={inv.termsId}
            onChange={setTerms}
            options={PAYMENT_TERMS.map((t) => ({ value: t.id, label: t.label }))}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Parties */}
        <div className="grid grid-cols-1 gap-2">
          <TextInput
            label="From (your company)"
            value={inv.fromName}
            onChange={setField('fromName')}
            placeholder="Your Company Ltd."
          />
          <TextareaInput
            label="From address"
            value={inv.fromAddress}
            onChange={setField('fromAddress')}
            placeholder="Street, City, Postcode"
            rows={2}
          />
          <TextInput
            label="Bill to"
            value={inv.toName}
            onChange={setField('toName')}
            placeholder="Client name"
          />
          <TextareaInput
            label="Bill to address"
            value={inv.toAddress}
            onChange={setField('toAddress')}
            placeholder="Email or postal address"
            rows={2}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Tax preset */}
        <SelectInput
          label="Tax preset"
          value={inv.taxId}
          onChange={setField('taxId')}
          options={TAX_PRESETS.map((t) => ({ value: t.id, label: t.label }))}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Line items */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className={labelClass}>Line items</span>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 rounded-md bg-invoicing-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-invoicing transition-colors hover:bg-invoicing/20"
            >
              <Plus size={9} />
              Add row
            </button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_44px_72px_72px_22px] gap-x-1.5 rounded-t-md border border-line bg-canvas px-2.5 py-1.5">
            {['Description', 'Qty', 'Rate', 'Amount', ''].map((h, i) => (
              <span
                key={i}
                className={`font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500 ${
                  i === 1 || i === 2 || i === 3 ? 'text-right' : ''
                }`}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Editable rows */}
          <div className="divide-y divide-line rounded-b-md border-x border-b border-line">
            {inv.items.map((it) => (
              <div
                key={it.id}
                className="grid grid-cols-[1fr_44px_72px_72px_22px] items-center gap-x-1.5 bg-paper px-2 py-1.5"
              >
                <input
                  type="text"
                  value={it.description}
                  onChange={(e) => updateItem(it.id, { description: e.target.value })}
                  placeholder="Item description"
                  className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[11px] text-ink-900 outline-none placeholder:text-ink-400 hover:border-line focus:border-invoicing/60 focus:bg-canvas"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={it.qty}
                  onChange={(e) => updateItem(it.id, { qty: e.target.value })}
                  className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none hover:border-line focus:border-invoicing/60 focus:bg-canvas"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={it.rate}
                  onChange={(e) => updateItem(it.id, { rate: e.target.value })}
                  className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none hover:border-line focus:border-invoicing/60 focus:bg-canvas"
                />
                <span className="text-right font-mono text-[11px] text-ink-900">
                  {formatNumber(lineAmount(it))}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  disabled={inv.items.length <= 1}
                  aria-label="Remove line item"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-500"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals strip */}
        <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
          <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-[11.5px]">
            <dt className="text-ink-500">Subtotal</dt>
            <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.subtotal)}</dd>
            {tax.rate > 0 && (
              <>
                <dt className="text-ink-500">{tax.label}</dt>
                <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.tax)}</dd>
              </>
            )}
            <dt className="border-t border-line pt-2 font-semibold text-ink-950">Total due</dt>
            <dd className="m-0 border-t border-line pt-2 text-right font-mono text-[13px] font-semibold text-invoicing">
              {formatMoney(totals.total, inv.currency)}
            </dd>
          </dl>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={inv.notes}
            onChange={setField('notes')}
            placeholder="Bank details, thank-you note, payment links…"
            rows={2}
          />
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
          aria-label="Generate and download invoice PDF"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Invoice PDF'}
          <ArrowRight size={14} />
        </button>

        {/* Secondary exports */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDocx}
            disabled={busy !== null}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
          >
            {busy === 'docx' ? '…' : (<>Export DOCX <ArrowRight size={10} /></>)}
          </button>
          <button
            type="button"
            onClick={handleXlsx}
            disabled={busy !== null}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
          >
            {busy === 'xlsx' ? '…' : (<>Export XLSX <ArrowRight size={10} /></>)}
          </button>
        </div>

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
            Need recurring?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- Invoice mockup (used in preview section) ---------- */

function InvoiceMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
            <BrandMark size={14} className="text-paper" />
          </span>
          <span className="font-serif text-[18px] font-medium tracking-[-0.02em] text-ink-950">
            Sonchoy<span className="not-italic font-medium italic text-crimson-400">Studio</span>
          </span>
        </div>
        <div className="text-right">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Invoice</p>
          <p className="m-0 mt-1 text-[15px] font-medium text-ink-950">{SAMPLE_INVOICE.number}</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">
            Issued {SAMPLE_INVOICE.issueDate}
            <br />Due {SAMPLE_INVOICE.dueDate}
          </p>
        </div>
      </div>

      <dl className="m-0 mb-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
        <div>
          <dt className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">From</dt>
          <dd className="m-0 text-[12px] leading-[1.5] text-ink-800">
            {SAMPLE_INVOICE.vendor}<br />7 Old Street<br />London EC1V 9HL
          </dd>
        </div>
        <div>
          <dt className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Bill to</dt>
          <dd className="m-0 text-[12px] leading-[1.5] text-ink-800">
            {SAMPLE_INVOICE.buyer}<br />accounts@northwind.co<br />Net 14 days
          </dd>
        </div>
      </dl>

      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-left font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-ink-500">Description</th>
            <th className="py-2 text-right font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-ink-500">Qty</th>
            <th className="py-2 text-right font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-ink-500">Unit</th>
            <th className="py-2 text-right font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-ink-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_INVOICE.items.map(([desc, qty, unit, total]) => (
            <tr key={desc} className="border-b border-line/60">
              <td className="py-2 text-ink-800">{desc}</td>
              <td className="py-2 text-right text-ink-600">{qty}</td>
              <td className="py-2 text-right font-mono text-ink-700">{unit}</td>
              <td className="py-2 text-right font-mono text-ink-900">{total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-8 gap-y-1.5 text-[11px]">
          <dt className="text-ink-500">Subtotal</dt>
          <dd className="m-0 text-right font-mono text-ink-800">{SAMPLE_INVOICE.subtotal}</dd>
          <dt className="text-ink-500">VAT 20%</dt>
          <dd className="m-0 text-right font-mono text-ink-800">{SAMPLE_INVOICE.tax}</dd>
          <dt className="border-t border-ink-700 pt-2 font-medium text-ink-950">Total due</dt>
          <dd className="m-0 border-t border-ink-700 pt-2 text-right font-mono text-[14px] font-medium text-ink-950">
            {SAMPLE_INVOICE.currency} {SAMPLE_INVOICE.total}
          </dd>
        </dl>
      </div>

      <p className="m-0 mt-6 border-t border-line pt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">
        Thank you for the work · Pay via bank transfer to GB29 NWBK 6016 1331 9268 19
      </p>
    </div>
  )
}

/* ---------- 2) "What you create" — form → invoice ---------- */

function PreviewSection() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[760px] text-center">
          <Eyebrow className="mb-4">01 — What you create</Eyebrow>
          <SectionTitle>
            From a clean form{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a print-ready invoice.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Fill the fields once, save your branded template, and reuse it forever. Every invoice ships as both PDF and editable .docx.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Form mockup — mirrors the live generator */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">

              {/* Card header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <InvoiceIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Invoice Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  3 line items
                </span>
              </div>

              {/* Invoice details */}
              <div className="grid grid-cols-[1fr_72px] gap-2">
                <Field label="Invoice #" value={SAMPLE_INVOICE.number} hint="auto" />
                <Field label="Currency" value="USD" mono />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="Issue date" value={SAMPLE_INVOICE.issueDate} />
                <Field label="Due date"   value={SAMPLE_INVOICE.dueDate} hint="net 14" />
              </div>

              <div className="my-3 h-px bg-line" />

              {/* Parties + tax */}
              <div className="space-y-2">
                <Field label="From" value={SAMPLE_INVOICE.vendor} />
                <Field label="Bill to" value={SAMPLE_INVOICE.buyer} />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Tax type" value="VAT 20%" />
                  <Field label="Template" value="Classic Dark" />
                </div>
              </div>

              <div className="my-3 h-px bg-line" />

              {/* Compact line items */}
              <div>
                <span className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500">
                  Line items
                </span>
                <div className="overflow-hidden rounded-md border border-line">
                  {SAMPLE_INVOICE.items.map(([desc, , , total], i) => (
                    <div
                      key={desc}
                      className={`flex items-center justify-between gap-3 px-3 py-2 text-[11px] ${i < SAMPLE_INVOICE.items.length - 1 ? 'border-b border-line' : ''} bg-paper`}
                    >
                      <span className="truncate text-ink-700">{desc}</span>
                      <span className="shrink-0 font-mono text-ink-900">{total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total callout */}
              <div className="mt-3 flex items-center justify-between rounded-lg border border-invoicing/25 bg-invoicing-bg px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-600">
                  Total due
                </span>
                <span className="font-mono text-[14px] font-semibold text-invoicing">
                  {SAMPLE_INVOICE.currency} {SAMPLE_INVOICE.total}
                </span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 rotate-90 items-center justify-center rounded-full border border-crimson-500/40 bg-canvas text-crimson-300 shadow-[0_4px_18px_-4px_rgba(237,40,40,0.4)] lg:rotate-0">
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Output — branded invoice */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-business-bg text-business">
                    <ExportIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    OUTPUT.PDF
                  </span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Print-ready
                </span>
              </div>
              <InvoiceMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Fill the form',         'Your business details, the client, line items, taxes, payment terms — every field has a sensible default so you can ship a first invoice in 60 seconds.'],
  ['02', 'Pick or save a template', 'Branded layout once, reuse forever. Logo, colors, footer notes, and tax presets are saved per template.'],
  ['03', 'Download the invoice',   'PDF + matching .docx for last-minute edits. Numbering increments automatically so the next one is one click away.'],
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
              <em className="font-serif font-normal italic text-crimson-300">form to PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            No setup, no signup. Type the details once, save the layout, and every future invoice takes 30 seconds — including tax math and totals.
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

/* ---------- 4) What you can customize ---------- */

const CUSTOMIZE = [
  { title: 'Brand header & logo',         desc: 'Upload your logo, set accent color, pick a font pairing — saved with the template.' },
  { title: 'Currency & locale',           desc: 'USD / EUR / GBP / INR / 30+ more, with locale-aware date and number formatting.' },
  { title: 'Tax presets',                 desc: 'GST (with HSN/SAC), VAT, Sales tax, reverse-charge, and tax-exempt — toggle per line.' },
  { title: 'Line items & discounts',      desc: 'Per-line quantity, unit price, discount %, and tax. Auto-totalled at the bottom.' },
  { title: 'Payment terms & due dates',   desc: 'Net 7 / 14 / 30, on receipt, or custom — the due date follows automatically.' },
  { title: 'Footer notes & signatures',   desc: 'Bank details, payment links, signature line, thank-you note, and legal footers.' },
]

function Customize() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — What you can customize</Eyebrow>
          <SectionTitle>
            Every field a finance team{' '}
            <em className="font-serif font-normal italic text-crimson-300">actually edits.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {CUSTOMIZE.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-invoicing/20 bg-invoicing-bg text-invoicing">
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
  { q: 'Is the invoice generator actually free?', a: 'Yes. Generate, brand, and download as many invoices as you like. The pdfFiller premium tier is only for batch generation, recurring invoices, and accounting-software push.' },
  { q: 'Does it support my country\'s tax rules?', a: 'GST (India), VAT (EU, UK, GCC), Sales-tax (US, CA), and zero-tax modes. Tax columns and labels follow the regime you pick.' },
  { q: 'Can I save my template and reuse it?', a: 'Yes — set logo, accent color, tax preset, payment terms, and footer once, then reuse across every invoice. Templates live in your browser; no signup needed.' },
  { q: 'What output formats are supported?', a: 'Default is PDF (print-ready). Every invoice also exports as an editable .docx for last-minute manual changes, and a matching .xlsx for record-keeping.' },
  { q: 'Can I generate recurring invoices?', a: 'For one-off invoices, this tool covers it. For recurring billing — schedule it, send it, dunning logic — the pdfFiller premium tier handles those flows.' },
  { q: 'Does it auto-number invoices?', a: 'Yes. Sequential, prefixed, or fiscal-year numbering with optional reset. Numbers increment automatically per template.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">generating invoices.</em>
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
  { name: 'Tax Invoice Generator',     desc: 'Region-aware tax invoices with HSN/SAC and tax breakdowns.', Icon: TaxInvoiceIcon, label: 'INVOICING' },
  { name: 'GST / VAT Invoice',         desc: 'Compliant GST or VAT invoices with multi-rate tax.',         Icon: VatIcon,         label: 'INVOICING' },
  { name: 'Recurring Invoice Generator', desc: 'Set a cadence; we draft the next invoice every cycle.',     Icon: RecurringIcon,   label: 'INVOICING' },
  { name: 'Quotation Generator',       desc: 'Itemised quotes that convert to an invoice in one click.',   Icon: QuoteIcon,       label: 'DOCUMENTS' },
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
            const isInvoicing = t.label === 'INVOICING'
            return (
              <a
                key={t.name}
                href="#"
                className="group relative flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
              >
                <span className={`absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] ${isInvoicing ? 'text-invoicing' : 'text-business'}`}>
                  {t.label}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-md ${isInvoicing ? 'bg-invoicing-bg text-invoicing' : 'bg-business-bg text-business'}`}>
                  <t.Icon />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-md font-medium tracking-[-0.01em] text-ink-950">
                    {t.name}
                  </h4>
                  <p className="m-0 text-xs leading-[1.5] text-ink-500">{t.desc}</p>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function InvoiceGeneratorTool() {
  return (
    <>
      <ToolHero />
      <PreviewSection />
      <CalloutStatHook />
      <HowItWorks />
      <Customize />
      <PromoBento tone="canvas" />
      <FAQ />
      <RelatedTools />
    </>
  )
}
