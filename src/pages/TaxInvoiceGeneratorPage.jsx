import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus, BrandMark,
  TaxInvoiceIcon, VatIcon, InvoiceIcon, RecurringIcon, QuoteIcon,
  HashIcon, TemplateIcon, ExportIcon, PercentIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, PAYMENT_TERMS, TAX_REGIMES, PLACES_OF_SUPPLY,
  findRegime, findCurrency,
  formatNumber, formatMoney, formatDate,
  addDays, todayISO, nextTaxInvoiceNumber,
  computeLine, computeTotals,
} from '../lib/taxInvoice/format'
import { generateTaxInvoicePdf } from '../lib/taxInvoice/generatePdf'
import { generateTaxInvoiceXlsx } from '../lib/taxInvoice/generateXlsx'

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

/* ---------- Sample data for static preview ---------- */

const SAMPLE = {
  number: 'TAX-INV-2026-0042',
  issueDate: '06 May 2026',
  dueDate: '20 May 2026',
  regimeLabel: 'GST (India)',
  place: 'Intra-state · CGST + SGST',
  supplier: { name: 'Sonchoy Studio Pvt. Ltd.', addr: '7 Old Street, Mumbai 400001', taxId: '27ABCDE1234F1Z5' },
  buyer:    { name: 'Northwind Books Ltd.',     addr: '221B Baker Street, Mumbai 400024', taxId: '27ZYXWV9876K1Z8' },
  currency: 'INR',
  items: [
    { desc: 'Brand strategy & identity sprint',  hsn: '998314', qty: 1,  rate: 84000, taxRate: 18 },
    { desc: 'Web design — landing & onboarding', hsn: '998313', qty: 2,  rate: 52000, taxRate: 18 },
    { desc: 'Implementation support, May',       hsn: '998313', qty: 12, rate: 1500,  taxRate: 18 },
    { desc: 'Stock photography licence',         hsn: '998365', qty: 1,  rate: 3200,  taxRate: 12 },
  ],
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
      aria-label="Live Tax Invoice Generator"
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
  ['3',    'Tax regimes (GST/VAT/Sales)'],
  ['HSN',  'SAC code per line'],
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
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-invoicing">Invoicing</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Tax Invoice Generator</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-invoicing/30 bg-invoicing-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-invoicing">
            <span className="h-1.5 w-1.5 rounded-full bg-invoicing shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
            Invoicing · Tax-compliant
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Tax invoices{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              that pass
            </em>
            <br />
            every{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              audit.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            GST, VAT, or Sales-tax — pick a regime, fill the form, ship a fully compliant tax invoice with HSN/SAC codes, per-line tax rates, and breakdowns that match your filing.
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
              <Check className="text-crimson-400" /> Multi-regime
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
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/* ---------- Full functional Tax Invoice Generator ---------- */

const INITIAL = {
  number: 'TAX-INV-2026-0042',
  issueDate: todayISO(),
  dueDate:   addDays(todayISO(), 14),
  termsId:   'net-14',

  regimeId: 'gst-in',
  placeOfSupply: 'intra',
  currency: 'INR',

  brand: 'Sonchoy Studio Pvt. Ltd.',
  supplierName:    'Sonchoy Studio Pvt. Ltd.',
  supplierAddress: '7 Old Street\nMumbai 400001, India',
  supplierTaxId:   '27ABCDE1234F1Z5',

  buyerName:    'Northwind Books Ltd.',
  buyerAddress: '221B Baker Street\nMumbai 400024, India',
  buyerTaxId:   '27ZYXWV9876K1Z8',

  items: [
    { id: 1, description: 'Brand strategy & identity sprint',  hsn: '998314', qty: 1,  rate: 84000, taxRate: 18 },
    { id: 2, description: 'Web design — landing & onboarding', hsn: '998313', qty: 2,  rate: 52000, taxRate: 18 },
    { id: 3, description: 'Implementation support, May',       hsn: '998313', qty: 12, rate: 1500,  taxRate: 18 },
  ],

  notes: 'Goods/services supplied as per agreement. Pay via bank transfer; reference invoice number on payment.',
}

let nextItemId = 100

function GeneratorPanel() {
  const [inv, setInv] = useState(INITIAL)
  const [busy, setBusy] = useState(null) // 'pdf' | 'xlsx' | null

  const regime = useMemo(() => findRegime(inv.regimeId), [inv.regimeId])
  const term   = useMemo(() => PAYMENT_TERMS.find((t) => t.id === inv.termsId) || PAYMENT_TERMS[1], [inv.termsId])
  const totals = useMemo(() => computeTotals(inv.items, regime, inv.placeOfSupply), [inv.items, regime, inv.placeOfSupply])

  const setField = (key) => (val) => setInv((s) => ({ ...s, [key]: val }))
  const setIssue = (val) => setInv((s) => ({ ...s, issueDate: val, dueDate: addDays(val, term.days) }))
  const setTerms = (id) => {
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
      items: [...s.items, { id: nextItemId++, description: '', hsn: '', qty: 1, rate: 0, taxRate: regime.rates[Math.min(2, regime.rates.length - 1)] }],
    }))

  const resetForm = () =>
    setInv({ ...INITIAL, items: INITIAL.items.map((i) => ({ ...i })) })

  // When the regime changes, sensible defaults
  const setRegime = (id) => {
    const r = findRegime(id)
    setInv((s) => ({
      ...s,
      regimeId: id,
      // Reset each line's taxRate to nearest valid in the new regime
      items: s.items.map((it) => ({
        ...it,
        taxRate: r.rates.includes(Number(it.taxRate))
          ? it.taxRate
          : r.rates[Math.min(2, r.rates.length - 1)],
      })),
      // Currency hint
      currency: id === 'gst-in' ? 'INR' : id === 'vat-eu' ? 'EUR' : 'USD',
    }))
  }

  const buildPayload = () => ({
    ...inv,
    items: inv.items.map(({ id, ...rest }) => rest),
  })

  const handlePdf = async () => {
    try { setBusy('pdf'); generateTaxInvoicePdf(buildPayload()) }
    finally { setBusy(null) }
  }
  const handleXlsx = async () => {
    try { setBusy('xlsx'); generateTaxInvoiceXlsx(buildPayload()) }
    finally { setBusy(null) }
  }

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
              <TaxInvoiceIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Tax Invoice
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

        {/* Regime + place of supply */}
        <SelectInput
          label="Tax regime"
          value={inv.regimeId}
          onChange={setRegime}
          options={TAX_REGIMES.map((r) => ({ value: r.id, label: r.label }))}
        />

        {regime.needsPlaceOfSupply && (
          <div className="mt-2">
            <SelectInput
              label="Place of supply"
              value={inv.placeOfSupply}
              onChange={setField('placeOfSupply')}
              options={PLACES_OF_SUPPLY.map((p) => ({ value: p.id, label: p.label }))}
            />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Invoice details */}
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <TextInput
            label="Invoice number"
            value={inv.number}
            onChange={setField('number')}
            placeholder="TAX-INV-2026-0001"
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

        {/* Supplier */}
        <div className="mb-3">
          <span className="mb-2 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-invoicing">
            Supplier
          </span>
          <div className="space-y-2">
            <TextInput label="Name" value={inv.supplierName} onChange={setField('supplierName')} placeholder="Your Company Pvt. Ltd." />
            <TextareaInput label="Address" value={inv.supplierAddress} onChange={setField('supplierAddress')} placeholder="Street, City, Postcode" rows={2} />
            <TextInput label={regime.taxIdLabel} value={inv.supplierTaxId} onChange={setField('supplierTaxId')} placeholder={regime.taxIdPlaceholder} mono />
          </div>
        </div>

        {/* Recipient */}
        <div>
          <span className="mb-2 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-invoicing">
            Recipient
          </span>
          <div className="space-y-2">
            <TextInput label="Name" value={inv.buyerName} onChange={setField('buyerName')} placeholder="Client name" />
            <TextareaInput label="Address" value={inv.buyerAddress} onChange={setField('buyerAddress')} placeholder="Street, City, Postcode" rows={2} />
            <TextInput label={regime.taxIdLabel} value={inv.buyerTaxId} onChange={setField('buyerTaxId')} placeholder={regime.taxIdPlaceholder} mono />
          </div>
        </div>

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
          <div className={`grid ${regime.needsHsn ? 'grid-cols-[1fr_60px_36px_60px_44px_22px]' : 'grid-cols-[1.4fr_36px_60px_44px_22px]'} gap-x-1.5 rounded-t-md border border-line bg-canvas px-2.5 py-1.5`}>
            <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Description</span>
            {regime.needsHsn && (
              <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">{regime.hsnLabel}</span>
            )}
            <span className="text-right font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Qty</span>
            <span className="text-right font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Rate</span>
            <span className="text-right font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Tax %</span>
            <span></span>
          </div>

          {/* Editable rows */}
          <div className="divide-y divide-line rounded-b-md border-x border-b border-line">
            {inv.items.map((it) => (
              <div
                key={it.id}
                className={`grid ${regime.needsHsn ? 'grid-cols-[1fr_60px_36px_60px_44px_22px]' : 'grid-cols-[1.4fr_36px_60px_44px_22px]'} items-center gap-x-1.5 bg-paper px-2 py-1.5`}
              >
                <input
                  type="text"
                  value={it.description}
                  onChange={(e) => updateItem(it.id, { description: e.target.value })}
                  placeholder="Item description"
                  className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[11px] text-ink-900 outline-none placeholder:text-ink-400 hover:border-line focus:border-invoicing/60 focus:bg-canvas"
                />
                {regime.needsHsn && (
                  <input
                    type="text"
                    value={it.hsn || ''}
                    onChange={(e) => updateItem(it.id, { hsn: e.target.value })}
                    placeholder="HSN"
                    className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none placeholder:text-ink-400 hover:border-line focus:border-invoicing/60 focus:bg-canvas"
                  />
                )}
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
                <select
                  value={it.taxRate}
                  onChange={(e) => updateItem(it.id, { taxRate: Number(e.target.value) })}
                  className="min-h-[28px] cursor-pointer rounded-md border border-transparent bg-transparent px-1 py-1 text-right font-mono text-[11px] text-ink-900 outline-none hover:border-line focus:border-invoicing/60 focus:bg-canvas"
                >
                  {regime.rates.map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
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

        {/* Totals */}
        <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
          <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-[11.5px]">
            <dt className="text-ink-500">Subtotal (taxable)</dt>
            <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.subtotal)}</dd>

            {regime.id === 'gst-in' && inv.placeOfSupply === 'inter' && (
              <>
                <dt className="text-ink-500">IGST</dt>
                <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.igst)}</dd>
              </>
            )}
            {regime.id === 'gst-in' && inv.placeOfSupply !== 'inter' && (
              <>
                <dt className="text-ink-500">CGST</dt>
                <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.cgst)}</dd>
                <dt className="text-ink-500">SGST</dt>
                <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.sgst)}</dd>
              </>
            )}
            {regime.id === 'vat-eu' && (
              <>
                <dt className="text-ink-500">VAT</dt>
                <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.vat)}</dd>
              </>
            )}
            {regime.id === 'sales-us' && (
              <>
                <dt className="text-ink-500">Sales tax</dt>
                <dd className="m-0 text-right font-mono text-ink-700">{formatNumber(totals.sales)}</dd>
              </>
            )}

            <dt className="border-t border-line pt-2 font-semibold text-ink-950">Total payable</dt>
            <dd className="m-0 border-t border-line pt-2 text-right font-mono text-[13px] font-semibold text-invoicing">
              {formatMoney(totals.grandTotal, inv.currency)}
            </dd>
          </dl>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={inv.notes}
            onChange={setField('notes')}
            placeholder="Bank details, terms, thank-you note…"
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
          {busy === 'pdf' ? 'Generating…' : 'Generate Tax Invoice PDF'}
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

/* ---------- 2) Static preview mockup ---------- */

function TaxInvoiceMock() {
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
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.1em] text-invoicing">Tax Invoice</p>
          <p className="m-0 mt-1 text-[15px] font-medium text-ink-950">{SAMPLE.number}</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">
            Issued {SAMPLE.issueDate}<br />Due {SAMPLE.dueDate}
          </p>
        </div>
      </div>

      <dl className="m-0 mb-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
        <div>
          <dt className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Supplier</dt>
          <dd className="m-0 text-[12px] font-medium text-ink-900">{SAMPLE.supplier.name}</dd>
          <dd className="m-0 text-[11px] text-ink-700">{SAMPLE.supplier.addr}</dd>
          <dd className="m-0 mt-1 font-mono text-[10px] text-ink-500">GSTIN: {SAMPLE.supplier.taxId}</dd>
        </div>
        <div>
          <dt className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Recipient</dt>
          <dd className="m-0 text-[12px] font-medium text-ink-900">{SAMPLE.buyer.name}</dd>
          <dd className="m-0 text-[11px] text-ink-700">{SAMPLE.buyer.addr}</dd>
          <dd className="m-0 mt-1 font-mono text-[10px] text-ink-500">GSTIN: {SAMPLE.buyer.taxId}</dd>
        </div>
      </dl>

      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
        <span>Place of supply: <span className="text-ink-700">{SAMPLE.place}</span></span>
        <span>{SAMPLE.regimeLabel}</span>
      </div>

      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-ink-500">Description</th>
            <th className="py-2 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-ink-500">HSN</th>
            <th className="py-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-ink-500">Qty</th>
            <th className="py-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-ink-500">Rate</th>
            <th className="py-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-ink-500">Tax %</th>
            <th className="py-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-ink-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE.items.map((it, i) => {
            const ln = computeLine(it, findRegime('gst-in'), 'intra')
            return (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1.5 text-[10px] text-ink-800">{it.desc}</td>
                <td className="py-1.5 font-mono text-[10px] text-ink-600">{it.hsn}</td>
                <td className="py-1.5 text-right text-ink-700">{it.qty}</td>
                <td className="py-1.5 text-right font-mono text-ink-700">{formatNumber(it.rate)}</td>
                <td className="py-1.5 text-right font-mono text-ink-700">{it.taxRate}%</td>
                <td className="py-1.5 text-right font-mono font-medium text-ink-950">{formatNumber(ln.total)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-8 gap-y-1.5 text-[11px]">
          <dt className="text-ink-500">Subtotal (taxable)</dt>
          <dd className="m-0 text-right font-mono text-ink-800">2,03,840.00</dd>
          <dt className="text-ink-500">CGST</dt>
          <dd className="m-0 text-right font-mono text-ink-800">18,153.60</dd>
          <dt className="text-ink-500">SGST</dt>
          <dd className="m-0 text-right font-mono text-ink-800">18,153.60</dd>
          <dt className="border-t border-ink-700 pt-2 font-medium text-ink-950">Total payable</dt>
          <dd className="m-0 border-t border-ink-700 pt-2 text-right font-mono text-[14px] font-medium text-invoicing">
            INR 2,40,147.20
          </dd>
        </dl>
      </div>

      <p className="m-0 mt-6 border-t border-line pt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">
        Authorised signatory · Generated with Sonchoy
      </p>
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
            From a compliance form{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            an audit-ready tax invoice.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Per-line HSN/SAC codes, mixed tax rates, and CGST/SGST/IGST splits — all reconciled at the bottom with amount-in-words.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Compliance form mockup */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <TaxInvoiceIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Tax Invoice Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  GST · 4 line items
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Regime',         'GST (India)'],
                  ['Place of supply', SAMPLE.place],
                  ['Invoice #',      SAMPLE.number],
                  ['Supplier GSTIN', SAMPLE.supplier.taxId],
                  ['Buyer GSTIN',    SAMPLE.buyer.taxId],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500">{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-lg border border-invoicing/25 bg-invoicing-bg px-3 py-2.5 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-600">Total payable</span>
                <span className="font-mono text-[14px] font-semibold text-invoicing">
                  INR 2,40,147.20
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 rotate-90 items-center justify-center rounded-full border border-crimson-500/40 bg-canvas text-crimson-300 shadow-[0_4px_18px_-4px_rgba(237,40,40,0.4)] lg:rotate-0">
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Output preview */}
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
              <TaxInvoiceMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the regime',     'GST, VAT, or Sales-tax — every column, label, and breakdown follows the rules of the regime you choose.'],
  ['02', 'Fill the line items', 'Each row carries its own HSN/SAC code and its own tax rate, so mixed-rate invoices Just Work™.'],
  ['03', 'Download the invoice', 'PDF with tax breakdown by rate, CGST/SGST/IGST split, and amount-in-words — plus a matching .xlsx for your records.'],
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
              <em className="font-serif font-normal italic text-crimson-300">form to compliant PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Numbers reconcile automatically — CGST + SGST sums to total GST, taxable + tax sums to grand total, and amount-in-words updates on every change.
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

/* ---------- 4) What's on the invoice ---------- */

const FIELDS = [
  { title: 'Supplier & recipient tax IDs',  desc: 'GSTIN, VAT number, or EIN — printed in the header per regime rules.' },
  { title: 'Place of supply',                desc: 'India GST: intra-state (CGST + SGST) or inter-state (IGST) selected per invoice.' },
  { title: 'HSN / SAC per line item',        desc: 'Required India GST classification codes — editable per row, persisted to PDF and XLSX.' },
  { title: 'Per-line tax rates',             desc: 'Mix 5%, 12%, 18%, 28% (or any rate) on one invoice — totals split by rate at the bottom.' },
  { title: 'Tax breakdown by rate',          desc: 'A separate breakdown table groups taxable value & tax for each rate band.' },
  { title: 'Amount in words',                desc: 'Auto-generated narrative form of the total — required on many compliance regimes.' },
]

function Fields() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Every field a compliance team needs</Eyebrow>
          <SectionTitle>
            Built for{' '}
            <em className="font-serif font-normal italic text-crimson-300">audit, not aesthetics.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
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
  { q: 'Which tax regimes are supported?', a: 'GST (India) with CGST/SGST/IGST splits, VAT (EU / UK / GCC), and Sales-tax (US / CA). Each regime ships with its own tax-rate presets, HSN/SAC handling, and tax-ID label.' },
  { q: 'Can I have different tax rates on the same invoice?', a: 'Yes — every line item picks its own rate from the regime\'s preset list. The Tax Breakdown by Rate section at the bottom groups them automatically.' },
  { q: 'Does it handle CGST + SGST vs IGST automatically?', a: 'Yes. Pick "Same state" or "Different state" under Place of supply and the tax is split into CGST + SGST or printed as IGST accordingly.' },
  { q: 'Is the GSTIN / VAT number validated?', a: 'We don\'t check the IDs against tax-authority databases (offline tool), but we lay them out in the printed format required by each regime.' },
  { q: 'What if I need a non-tax invoice?', a: 'Use the regular Invoice Generator — it ships without the tax-compliance fields and is faster for everyday billing.' },
  { q: 'Output formats?', a: 'PDF (print-ready, with amount-in-words and signature line) and .xlsx (machine-readable, useful for filing imports).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">tax invoices.</em>
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
  { name: 'Invoice Generator',           desc: 'Everyday branded invoices without compliance overhead.', Icon: InvoiceIcon,    label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'GST / VAT Invoice Generator', desc: 'Streamlined GST / VAT invoices with multi-rate tax.',    Icon: VatIcon,        label: 'INVOICING' },
  { name: 'Recurring Invoice Generator', desc: 'Set a cadence; we draft the next invoice every cycle.',  Icon: RecurringIcon,  label: 'INVOICING' },
  { name: 'Quotation Generator',         desc: 'Quotes that convert to a tax invoice in one click.',     Icon: QuoteIcon,      label: 'DOCUMENTS' },
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

export default function TaxInvoiceGeneratorPage() {
  return (
    <>
      <ToolHero />
      <PreviewSection />
      <CalloutStatHook />
      <HowItWorks />
      <Fields />
      <PromoBento tone="canvas" />
      <FAQ />
      <RelatedTools />
    </>
  )
}
