'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  InvoiceIcon, TaxInvoiceIcon, VatIcon, RecurringIcon, QuoteIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, TAX_PRESETS, PAYMENT_TERMS, VALIDITY_PRESETS,
  findValidity,
  computeTotals, formatNumber, formatMoney,
  todayISO, addDays, lineAmount,
} from '@/lib/proforma/format'
import { generateProformaPdf } from '@/lib/proforma/generatePdf'
import { generateProformaXlsx } from '@/lib/proforma/generateXlsx'

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
      aria-label="Live Proforma Invoice Generator"
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
  ['5',     'Validity windows'],
  ['PRF',   'Auto numbering'],
  ['PDF+',  'XLSX exports'],
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
            <span className="text-ink-950">Proforma Invoice Generator</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-invoicing/30 bg-invoicing-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-invoicing">
            <span className="h-1.5 w-1.5 rounded-full bg-invoicing shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
            Invoicing · Pre-sale quote
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Proforma invoices{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              that close
            </em>
            <br />
            the{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              deal.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            A clean, branded price preview your buyer can sign off on — with validity window, expected delivery, and a clear "not a tax invoice" disclaimer. Convert to a full invoice the moment the order lands.
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
              <Check className="text-crimson-400" /> Converts to invoice
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

/* ---------- Editable form input building blocks ---------- */

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
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

/* ---------- Stateful Proforma Generator ---------- */

const INITIAL = {
  number: 'PRF-2026-0042',
  issueDate: todayISO(),
  validityId: 'days-30',
  validUntil: addDays(todayISO(), 30),
  expectedDelivery: addDays(todayISO(), 14),

  brand: 'Sonchoy Studio',
  fromName:    'Sonchoy Studio',
  fromAddress: '7 Old Street\nLondon EC1V 9HL',
  toName:      'Northwind Books Ltd.',
  toAddress:   'accounts@northwind.co\n221B Baker Street, London',

  currency: 'USD',
  taxId: 'vat-20',

  items: [
    { id: 1, description: 'Brand strategy & identity sprint',  qty: 1,  rate: 8400 },
    { id: 2, description: 'Web design — landing & onboarding', qty: 2,  rate: 5200 },
    { id: 3, description: 'Implementation support, May',       qty: 12, rate: 150 },
  ],

  notes: 'Order confirmation will trigger a full tax invoice. 50% deposit due on PO; balance on delivery.',
}

let nextItemId = 100

function GeneratorPanel() {
  const [pf, setPf] = useState(INITIAL)
  const [busy, setBusy] = useState(null) // 'pdf' | 'xlsx' | null

  const validity = useMemo(() => findValidity(pf.validityId), [pf.validityId])
  const tax = useMemo(() => TAX_PRESETS.find((t) => t.id === pf.taxId) || TAX_PRESETS[0], [pf.taxId])
  const totals = useMemo(() => computeTotals(pf.items, tax.rate), [pf.items, tax.rate])

  const setField = (key) => (val) => setPf((s) => ({ ...s, [key]: val }))
  const setIssue = (val) => setPf((s) => ({ ...s, issueDate: val, validUntil: addDays(val, validity.days) }))
  const setValidity = (id) => {
    const v = findValidity(id)
    setPf((s) => ({ ...s, validityId: id, validUntil: addDays(s.issueDate, v.days) }))
  }

  const updateItem = (id, patch) =>
    setPf((s) => ({ ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }))

  const removeItem = (id) =>
    setPf((s) => ({ ...s, items: s.items.length > 1 ? s.items.filter((it) => it.id !== id) : s.items }))

  const addItem = () =>
    setPf((s) => ({
      ...s,
      items: [...s.items, { id: nextItemId++, description: '', qty: 1, rate: 0 }],
    }))

  const resetForm = () => setPf({ ...INITIAL, items: INITIAL.items.map((i) => ({ ...i })) })

  const buildPayload = () => ({
    ...pf,
    taxRate: tax.rate,
    taxLabel: tax.label,
    items: pf.items.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateProformaPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateProformaXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
              <InvoiceIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Proforma
            </span>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700"
          >
            Reset
          </button>
        </div>

        {/* Reference + currency */}
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <TextInput
            label="Reference"
            value={pf.number}
            onChange={setField('number')}
            placeholder="PRF-2026-0001"
            hint="auto"
          />
          <SelectInput
            label="Currency"
            value={pf.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>

        {/* Dates */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DateInput label="Issue date" value={pf.issueDate} onChange={setIssue} />
          <DateInput
            label="Valid until"
            value={pf.validUntil}
            onChange={setField('validUntil')}
            hint={validity.label}
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput
            label="Validity window"
            value={pf.validityId}
            onChange={setValidity}
            options={VALIDITY_PRESETS.map((v) => ({ value: v.id, label: v.label }))}
          />
          <DateInput
            label="Expected delivery"
            value={pf.expectedDelivery}
            onChange={setField('expectedDelivery')}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Parties */}
        <div className="grid grid-cols-1 gap-2">
          <TextInput
            label="From (your company)"
            value={pf.fromName}
            onChange={setField('fromName')}
            placeholder="Your Company Ltd."
          />
          <TextareaInput
            label="From address"
            value={pf.fromAddress}
            onChange={setField('fromAddress')}
            placeholder="Street, City, Postcode"
            rows={2}
          />
          <TextInput
            label="Prepared for"
            value={pf.toName}
            onChange={setField('toName')}
            placeholder="Buyer name"
          />
          <TextareaInput
            label="Buyer address"
            value={pf.toAddress}
            onChange={setField('toAddress')}
            placeholder="Email or postal address"
            rows={2}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Tax preset */}
        <SelectInput
          label="Tax preset (estimated)"
          value={pf.taxId}
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

          <div className="divide-y divide-line rounded-b-md border-x border-b border-line">
            {pf.items.map((it) => (
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
                  disabled={pf.items.length <= 1}
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

        {/* Totals */}
        <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
          <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-[11.5px]">
            <dt className="text-ink-500">Subtotal</dt>
            <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.subtotal)}</dd>
            {tax.rate > 0 && (
              <>
                <dt className="text-ink-500">{tax.label} (est.)</dt>
                <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.tax)}</dd>
              </>
            )}
            <dt className="border-t border-line pt-2 font-semibold text-ink-950">Estimated total</dt>
            <dd className="m-0 border-t border-line pt-2 text-right font-mono text-[13px] font-semibold text-invoicing">
              {formatMoney(totals.total, pf.currency)}
            </dd>
          </dl>
        </div>

        {/* Disclaimer banner */}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-amber-400">
            <path d="M8 1.5l7 13H1L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 6v4M8 12.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="text-[11px] leading-[1.45] text-amber-100">
            <strong className="font-medium text-amber-200">Not a tax invoice.</strong>{' '}
            This proforma is a non-binding estimate. A full tax invoice will be issued on order confirmation.
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={pf.notes}
            onChange={setField('notes')}
            placeholder="Payment terms, deposit, delivery conditions…"
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
          {busy === 'pdf' ? 'Generating…' : 'Generate Proforma PDF'}
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
            Need batch?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

const SAMPLE_ITEMS = [
  ['Brand strategy & identity sprint',  1,  '8,400.00',  '8,400.00'],
  ['Web design — landing & onboarding', 2,  '5,200.00',  '10,400.00'],
  ['Implementation support, May',       12, '150.00',    '1,800.00'],
]

function ProformaMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      {/* Top strip */}
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">
          Proforma Invoice
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">
          Not a tax invoice
        </span>
      </div>

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
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Proforma No.</p>
          <p className="m-0 mt-1 text-[15px] font-medium text-ink-950">PRF-2026-0042</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">
            Issued 06 May 2026
            <br />Valid until 05 Jun 2026
          </p>
        </div>
      </div>

      <dl className="m-0 mb-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
        <div>
          <dt className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">From</dt>
          <dd className="m-0 text-[12px] leading-[1.5] text-ink-800">
            Sonchoy Studio<br />7 Old Street<br />London EC1V 9HL
          </dd>
        </div>
        <div>
          <dt className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Prepared for</dt>
          <dd className="m-0 text-[12px] leading-[1.5] text-ink-800">
            Northwind Books Ltd.<br />accounts@northwind.co<br />Net 14 days
          </dd>
        </div>
      </dl>

      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-left font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-ink-500">Description</th>
            <th className="py-2 text-right font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-ink-500">Qty</th>
            <th className="py-2 text-right font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-ink-500">Rate</th>
            <th className="py-2 text-right font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-ink-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_ITEMS.map(([desc, qty, unit, total]) => (
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
          <dd className="m-0 text-right font-mono text-ink-800">20,600.00</dd>
          <dt className="text-ink-500">VAT 20% (est.)</dt>
          <dd className="m-0 text-right font-mono text-ink-800">4,120.00</dd>
          <dt className="border-t border-ink-700 pt-2 font-medium text-ink-950">Estimated total</dt>
          <dd className="m-0 border-t border-ink-700 pt-2 text-right font-mono text-[14px] font-medium text-ink-950">
            USD 24,720.00
          </dd>
        </dl>
      </div>

      {/* Disclaimer bar */}
      <div className="mt-5 rounded-md border border-amber-500/40 bg-amber-100 px-3 py-2">
        <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-amber-900">
          NOT A TAX INVOICE
        </p>
        <p className="m-0 mt-0.5 text-[10.5px] leading-[1.4] text-amber-950">
          This proforma is a non-binding estimate. A tax invoice will be issued on order confirmation.
        </p>
      </div>
    </div>
  )
}

function PreviewSection() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[760px] text-center">
          <Eyebrow className="mb-4">01 — What you send</Eyebrow>
          <SectionTitle>
            From a price form{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a sign-off-ready proforma.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            A clear price preview your buyer can approve before the order lands. Validity window, expected delivery, and a clear disclaimer — all baked in.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Form mockup */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <InvoiceIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Proforma Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  3 line items
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Reference',         'PRF-2026-0042'],
                  ['Issue date',        '06 May 2026'],
                  ['Validity',          '30 days · until 05 Jun 2026'],
                  ['Expected delivery', '20 May 2026'],
                  ['Prepared for',      'Northwind Books Ltd.'],
                  ['Tax preset',        'VAT 20% (estimated)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-invoicing/25 bg-invoicing-bg px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-600">
                  Estimated total
                </span>
                <span className="font-mono text-[14px] font-semibold text-invoicing">
                  USD 24,720.00
                </span>
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
                  Sign-off ready
                </span>
              </div>
              <ProformaMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Fill the form',         'Buyer, line items, expected delivery, validity window. Everything has a sensible default so you can ship a first proforma in 60 seconds.'],
  ['02', 'Pick a validity window', '7, 14, 30, 60, or 90 days. The "valid until" date follows automatically — buyers see exactly how long the price holds.'],
  ['03', 'Send the PDF',           'A clean branded PDF with the "not a tax invoice" disclaimer baked in. When the order lands, convert it to a full invoice in one click.'],
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
              <em className="font-serif font-normal italic text-crimson-300">price form to PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            No setup, no signup. Type the buyer once, save the layout, and every future proforma takes 30 seconds — validity dates and disclaimers update automatically.
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

/* ---------- 4) What sets a proforma apart ---------- */

const FEATURES = [
  { title: 'Validity window',       desc: 'How long the price holds — 7, 14, 30, 60, 90 days. Auto-computes "valid until" date.' },
  { title: 'Expected delivery',     desc: 'A clear date the buyer can plan around — drives faster sign-off and fewer support tickets.' },
  { title: '"Not a tax invoice"',   desc: 'Auto-stamped disclaimer in the header and footer. Protects you from accidental tax-liability claims.' },
  { title: 'Estimated tax line',    desc: 'Tax is labelled "(estimated)" everywhere — clearly signalling the final invoice may differ.' },
  { title: 'Reference numbering',   desc: 'PRF-prefix numbering with fiscal-year resets — keeps proformas separate from your invoice sequence.' },
  { title: 'Converts to invoice',   desc: 'When the buyer says yes, every field maps one-to-one into a full tax invoice — no re-typing.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for pre-sale</Eyebrow>
          <SectionTitle>
            Every field a salesperson{' '}
            <em className="font-serif font-normal italic text-crimson-300">actually needs.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
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
  { q: 'How is a proforma different from a regular invoice?',   a: 'A proforma is a price preview, not a demand for payment. It is not a tax document, doesn\'t hit your books, and isn\'t valid for input-tax claims. Send it before the buyer commits; issue a tax invoice on confirmation.' },
  { q: 'When should I use a proforma?',                         a: 'Pre-sale price approvals, international shipments needing customs paperwork before payment, internal PO requisitions, or any time the buyer needs a fixed price to sign off without committing to pay yet.' },
  { q: 'What does the validity window control?',                a: 'How long the quoted price holds. After "valid until," you can re-issue at a new price or let the buyer know the quote expired. This is the single most important reason buyers come back and sign off quickly.' },
  { q: 'Why is the tax labelled "estimated"?',                  a: 'Until the order is confirmed, tax could change — different ship-to address, different place of supply, exemption applied, currency conversion. Labelling tax as estimated keeps the proforma legally distinct from a final tax invoice.' },
  { q: 'Can a buyer pay against a proforma?',                   a: 'Some buyers do — it\'s common with international advance-payment deals. When they do, issue a paid tax invoice once payment is received; the proforma is the precursor, not the receipt.' },
  { q: 'Output formats?',                                        a: 'PDF (print-ready, with disclaimer baked in) and .xlsx (machine-readable, useful for piping into your CRM or sales-ops sheets).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">proforma invoices.</em>
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
  { name: 'Invoice Generator',      desc: 'Convert this proforma into a full branded invoice in one click.', Icon: InvoiceIcon,     label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'Tax Invoice Generator',  desc: 'GST/VAT/Sales-tax compliant invoices with HSN/SAC codes.',        Icon: TaxInvoiceIcon,  label: 'INVOICING', path: '/tools/tax-invoice-generator' },
  { name: 'Quotation Generator',    desc: 'Itemised quotes — alternative to proformas in some markets.',     Icon: QuoteIcon,       label: 'DOCUMENTS' },
  { name: 'Recurring Invoice',      desc: 'Set a cadence; we draft the next invoice every cycle.',           Icon: RecurringIcon,   label: 'INVOICING' },
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
            const inner = (
              <>
                <span className={`absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] ${isInvoicing ? 'text-invoicing' : 'text-business'}`}>
                  {t.label}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-md ${isInvoicing ? 'bg-invoicing-bg text-invoicing' : 'bg-business-bg text-business'}`}>
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

export default function ProformaInvoiceGeneratorTool() {
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
