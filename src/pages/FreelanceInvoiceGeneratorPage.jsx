import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  InvoiceIcon, TaxInvoiceIcon, QuoteIcon, RecurringIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, INVOICE_STATUSES, RATE_TYPES, PAYMENT_TERMS, DISCOUNT_TYPES,
  findCurrency, findInvoiceStatus, findRateType, findPaymentTerm, findDiscountType,
  computeTotals, buildTaxSummary, buildRateTypeSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/freelance-invoice/compute'
import { generateFreelanceInvoicePdf } from '../lib/freelance-invoice/generatePdf'
import { generateFreelanceInvoiceXlsx } from '../lib/freelance-invoice/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Freelance Invoice Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[620px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['6',      'Rate types'],
  ['Hours',  'Auto-rolled up'],
  ['7',      'Payment terms'],
  ['Free',   'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 60%)' }} />
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
            <span className="text-invoicing">Invoicing</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Freelance Invoice Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-invoicing/30 bg-invoicing-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-invoicing">
            <span className="h-1.5 w-1.5 rounded-full bg-invoicing shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
            Invoicing · Solo operators
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Bill hours, days, fixed,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              and retainers
            </em>
            <br />
            from{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              one invoice.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Built for solo operators and small studios. Mix hourly, day-rate, fixed-fee, retainer, milestone, and expense lines on a single invoice. Auto-rolled hours, due-date math, advance and partial-payment offsets, and a payment block with bank, UPI, PayPal, and Stripe.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Mixed-rate lines</span>
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
  'focus:border-invoicing/60 focus:ring-2 focus:ring-invoicing/20 hover:border-line-strong'

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
        className="h-4 w-4 shrink-0 cursor-pointer accent-invoicing" />
    </label>
  )
}

/* ---------- ItemList ---------- */

function ItemList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), description: '', rateTypeId: 'hourly', qty: 1, rate: 0, taxPct: 18, taxable: true, projectCode: '' },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-invoicing">Line items ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-invoicing-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-invoicing transition-colors hover:bg-invoicing/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
        {items.map((it) => {
          const rt = findRateType(it.rateTypeId)
          const qty = Number(it.qty) || 0
          const rate = Number(it.rate) || 0
          const taxable = it.taxable && (Number(it.taxPct) || 0) > 0
          const gross = qty * rate
          const tax = taxable ? gross * (Number(it.taxPct) || 0) / 100 : 0
          const total = gross + tax
          return (
            <div key={it.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
                <input type="text" value={it.description || ''}
                  onChange={(e) => update(it.id, { description: e.target.value })}
                  placeholder="Description (e.g. Brand identity sprint · Wk 1–2)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-invoicing/60" />
                <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-[140px_1fr_90px] gap-1">
                <select value={it.rateTypeId} onChange={(e) => update(it.id, { rateTypeId: e.target.value })}
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] text-ink-900 outline-none focus:border-invoicing/60">
                  {RATE_TYPES.map((r) => (<option key={r.id} value={r.id}>{r.label}</option>))}
                </select>
                <input type="text" value={it.projectCode || ''}
                  onChange={(e) => update(it.id, { projectCode: e.target.value })}
                  placeholder="Project code (optional)"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] text-ink-900 outline-none focus:border-invoicing/60" />
                <span className="self-center text-right font-mono text-[10px] text-ink-500">
                  per {rt.unit}
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1">
                <input type="number" step="any" value={it.qty}
                  onChange={(e) => update(it.id, { qty: Number(e.target.value) || 0 })}
                  placeholder="Qty"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-invoicing/60" />
                <input type="number" step="any" value={it.rate}
                  onChange={(e) => update(it.id, { rate: Number(e.target.value) || 0 })}
                  placeholder="Rate"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-invoicing/60" />
                <input type="number" step="any" value={it.taxPct}
                  onChange={(e) => update(it.id, { taxPct: Number(e.target.value) || 0 })}
                  placeholder="Tax %"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-invoicing/60" />
              </div>
              <div className="mt-1.5 grid grid-cols-[1fr_auto] items-center gap-2">
                <label className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-700">
                  <input type="checkbox" checked={!!it.taxable}
                    onChange={(e) => update(it.id, { taxable: e.target.checked })}
                    className="h-3 w-3 accent-invoicing" /> Taxable
                </label>
                <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[10.5px]">
                  <span className="text-ink-500">Line</span>
                  <span className="font-bold text-invoicing">{formatNumber(total)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const today = todayISO()

const INITIAL = {
  invoiceNumber: 'FRL-2026-014',
  invoiceDate: today,
  paymentTermId: 'net_14',
  projectName: 'Northwind Books · Brand sprint Apr–May',
  poRef: 'PO-NWB-019',
  statusId: 'sent',
  currency: 'INR',

  from: {
    name: 'Alex Hartwell',
    businessName: 'Alex Hartwell · Brand & design studio',
    address: '12 Lavelle Road, Bengaluru, Karnataka 560001',
    email: 'alex@hartwellstudio.com',
    phone: '+91 98456 71203',
    website: 'hartwellstudio.com',
    taxId: 'GSTIN 29ABCDE1234F1Z5',
  },
  to: {
    name: '',
    companyName: 'Northwind Books Pvt Ltd',
    contactName: 'Marcus Vance · Marketing Director',
    address: 'Brigade Gateway, Malleshwaram, Bengaluru 560055',
    email: 'marcus@northwindbooks.in',
    taxId: 'GSTIN 29XYZAB5678C1Z2',
  },

  items: [
    { id: 1, description: 'Brand strategy & positioning sessions',     rateTypeId: 'hourly',    qty: 18, rate: 6500,  taxPct: 18, taxable: true,  projectCode: 'NWB-STR' },
    { id: 2, description: 'Logo & wordmark exploration',                rateTypeId: 'daily',     qty: 4,  rate: 38000, taxPct: 18, taxable: true,  projectCode: 'NWB-IDN' },
    { id: 3, description: 'Brand guidelines doc (40 pages)',            rateTypeId: 'fixed',     qty: 1,  rate: 95000, taxPct: 18, taxable: true,  projectCode: 'NWB-DOC' },
    { id: 4, description: 'Apr–May monthly retainer · advisory',        rateTypeId: 'retainer',  qty: 2,  rate: 45000, taxPct: 18, taxable: true,  projectCode: 'NWB-RTN' },
    { id: 5, description: 'Milestone 2 — design system handoff',        rateTypeId: 'milestone', qty: 1,  rate: 60000, taxPct: 18, taxable: true,  projectCode: 'NWB-MLS' },
    { id: 6, description: 'Reimbursable: stock photo licences',         rateTypeId: 'expense',   qty: 1,  rate: 7200,  taxPct: 0,  taxable: false, projectCode: 'NWB-EXP' },
  ],

  discountType: 'none',
  discountValue: 0,

  advance: 80000,
  amountPaid: 0,

  includePaymentBlock: true,
  payment: {
    bankName: 'HDFC Bank · Brigade Road branch',
    accountName: 'Alex Hartwell',
    accountNumber: 'XXXX XXXX 7102',
    ifsc: 'HDFC0001234',
    upi: 'alex@hdfcbank',
    paypal: 'paypal.me/hartwellstudio',
    stripeLink: 'https://buy.stripe.com/hartwell-nwb',
    reference: '',
  },

  includeTermsBlock: true,
  terms: 'Payment due within 14 days of invoice date. Bank transfer preferred (no payment-gateway fees). Late payment incurs interest at 1.5% per month or part-month after the due date. Project files and final assets transfer on receipt of full payment, including the advance previously paid. Invoice reference and project code must be quoted on the bank transfer for accurate reconciliation.',

  includeNotesBlock: true,
  notes: 'INR 80,000 advance was received on 28 March via UPI (ref nwb-advance-001) and has been deducted against this invoice. Milestone 2 (design system handoff) was accepted on 18 May; the remaining design system rollout will be quoted separately under FRL-2026-015. Stock photo licences invoiced at cost, no markup.',

  includeSignatureBlock: true,
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  void findInvoiceStatus(data.statusId)
  void findPaymentTerm(data.paymentTermId)
  void findDiscountType(data.discountType)
  const totals = useMemo(() => computeTotals(data), [data])
  const taxSummary = useMemo(() => buildTaxSummary(totals.lines), [totals.lines])
  const rtSummary  = useMemo(() => buildRateTypeSummary(totals.lines), [totals.lines])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setFromField    = (k) => (v) => setData((s) => ({ ...s, from:    { ...s.from,    [k]: v } }))
  const setToField      = (k) => (v) => setData((s) => ({ ...s, to:      { ...s.to,      [k]: v } }))
  const setPaymentField = (k) => (v) => setData((s) => ({ ...s, payment: { ...s.payment, [k]: v } }))
  const setItems = (items) => setData((s) => ({ ...s, items: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    items: data.items.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateFreelanceInvoicePdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateFreelanceInvoiceXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
              <InvoiceIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Invoice · {data.items.length} lines · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Invoice #" value={data.invoiceNumber} onChange={setField('invoiceNumber')} mono />
          <DateInput label="Issue date" value={data.invoiceDate} onChange={setField('invoiceDate')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="Payment terms" value={data.paymentTermId} onChange={setField('paymentTermId')}
            options={PAYMENT_TERMS.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Status" value={data.statusId} onChange={setField('statusId')}
            options={INVOICE_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Project (optional)" value={data.projectName} onChange={setField('projectName')} />
          <TextInput label="PO ref (optional)"   value={data.poRef}       onChange={setField('poRef')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* From */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">From (you)</span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <TextInput label="Your name" value={data.from.name} onChange={setFromField('name')} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <TextInput label="Business / trade name (optional)" value={data.from.businessName} onChange={setFromField('businessName')} />
          <TextareaInput label="Address" value={data.from.address} onChange={setFromField('address')} rows={2} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Email"   value={data.from.email}   onChange={setFromField('email')}   mono />
            <TextInput label="Phone"   value={data.from.phone}   onChange={setFromField('phone')}   mono />
            <TextInput label="Website" value={data.from.website} onChange={setFromField('website')} mono />
          </div>
          <TextInput label="Tax ID / GSTIN" value={data.from.taxId} onChange={setFromField('taxId')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* To */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Bill to (client)</span>
        <div className="space-y-2">
          <TextInput label="Company name" value={data.to.companyName} onChange={setToField('companyName')} />
          <TextInput label="Contact"      value={data.to.contactName} onChange={setToField('contactName')} />
          <TextareaInput label="Address" value={data.to.address} onChange={setToField('address')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email"  value={data.to.email}  onChange={setToField('email')}  mono />
            <TextInput label="Tax ID" value={data.to.taxId}  onChange={setToField('taxId')}  mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Items */}
        <ItemList items={data.items} setItems={setItems} />

        <div className="my-3.5 h-px bg-line" />

        {/* Discount / advance / paid */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Discount, advance &amp; payment</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Discount" value={data.discountType} onChange={setField('discountType')}
            options={DISCOUNT_TYPES.map((d) => ({ value: d.id, label: d.label }))} />
          {data.discountType !== 'none' && (
            <NumberInput label="Discount value" value={data.discountValue} onChange={setField('discountValue')}
              suffix={data.discountType === 'percent' ? '%' : cur.code} />
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <NumberInput label="Advance received"  value={data.advance}    onChange={setField('advance')}    suffix={cur.code} />
          <NumberInput label="Amount paid"        value={data.amountPaid} onChange={setField('amountPaid')} suffix={cur.code} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Payment block */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">How to pay (optional block)</span>
        <ToggleRow label="Include payment block" desc="Bank / UPI / PayPal / Stripe on PDF"
          checked={data.includePaymentBlock} onChange={setField('includePaymentBlock')} />
        {data.includePaymentBlock && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Bank name"    value={data.payment.bankName}    onChange={setPaymentField('bankName')} />
              <TextInput label="Account name" value={data.payment.accountName} onChange={setPaymentField('accountName')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Account #"    value={data.payment.accountNumber} onChange={setPaymentField('accountNumber')} mono />
              <TextInput label="IFSC / SWIFT" value={data.payment.ifsc}          onChange={setPaymentField('ifsc')}          mono />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <TextInput label="UPI / PayID"  value={data.payment.upi}        onChange={setPaymentField('upi')}        mono />
              <TextInput label="PayPal"        value={data.payment.paypal}     onChange={setPaymentField('paypal')}     mono />
              <TextInput label="Stripe link"   value={data.payment.stripeLink} onChange={setPaymentField('stripeLink')} mono />
            </div>
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Optional sections</span>
        <div className="space-y-2">
          <ToggleRow label="Terms & late policy" desc="Net days, late fee, asset-transfer clause"
            checked={data.includeTermsBlock} onChange={setField('includeTermsBlock')} />
          <ToggleRow label="Notes block" desc="Project context, advances, references"
            checked={data.includeNotesBlock} onChange={setField('includeNotesBlock')} />
          <ToggleRow label="Signature block" desc="Your signature line on the PDF"
            checked={data.includeSignatureBlock} onChange={setField('includeSignatureBlock')} />
        </div>
        {data.includeTermsBlock && (
          <div className="mt-2">
            <TextareaInput label="Terms" value={data.terms} onChange={setField('terms')} rows={3} />
          </div>
        )}
        {data.includeNotesBlock && (
          <div className="mt-2">
            <TextareaInput label="Notes" value={data.notes} onChange={setField('notes')} rows={3} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Totals */}
        <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Subtotal</span>
            <span className="text-ink-950">{formatNumber(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Discount</span>
              <span className="text-ink-950">- {formatNumber(totals.discount)}</span>
            </div>
          )}
          {totals.totalTax > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Tax</span>
              <span className="text-ink-950">{formatNumber(totals.totalTax)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between border-t border-line pt-1">
            <span className="text-ink-500">Grand total</span>
            <span className="font-bold text-ink-950">{formatNumber(totals.grandTotal)}</span>
          </div>
          {(totals.advance > 0 || totals.amountPaid > 0) && (
            <>
              {totals.advance > 0 && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-ink-500">Less: advance</span>
                  <span className="text-ink-950">- {formatNumber(totals.advance)}</span>
                </div>
              )}
              {totals.amountPaid > 0 && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-ink-500">Less: amount paid</span>
                  <span className="text-ink-950">- {formatNumber(totals.amountPaid)}</span>
                </div>
              )}
            </>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-invoicing">Balance due</span>
            <span className="font-mono text-[14px] font-bold text-invoicing">{cur.code} {formatNumber(totals.balanceDue)}</span>
          </div>
        </div>

        {/* Hours/days strip */}
        {(totals.totalHours > 0 || totals.totalDays > 0) && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3 font-mono text-[10.5px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">Time billed</p>
            <div className="flex items-center justify-between">
              {totals.totalHours > 0 && (
                <span className="text-ink-950">{formatNumber(totals.totalHours)} hrs</span>
              )}
              {totals.totalDays > 0 && (
                <span className="text-ink-950">{formatNumber(totals.totalDays)} days</span>
              )}
              <span className="text-ink-500">across {data.items.length} lines</span>
            </div>
          </div>
        )}

        {/* Rate-type rollup */}
        {rtSummary.length > 1 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">By rate type</p>
            <div className="space-y-1">
              {rtSummary.map((r) => (
                <div key={r.id} className="flex items-center justify-between font-mono text-[10.5px]">
                  <span className="text-ink-900">{r.label}</span>
                  <span className="text-ink-500">{r.count}× · {formatNumber(r.qty)}</span>
                  <span className="w-24 text-right text-ink-950">{formatNumber(r.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {taxSummary.length > 1 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">Tax breakdown</p>
            <table className="w-full text-[10.5px]">
              <thead>
                <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                  <th className="py-1 font-normal">Rate</th>
                  <th className="py-1 text-right font-normal">Taxable</th>
                  <th className="py-1 text-right font-normal">Tax</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {taxSummary.map((t) => (
                  <tr key={t.ratePct} className="border-t border-line">
                    <td className="py-1 text-ink-700">{formatNumber(t.ratePct)}%</td>
                    <td className="py-1 text-right text-ink-950">{formatNumber(t.taxable)}</td>
                    <td className="py-1 text-right text-invoicing">{formatNumber(t.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-invoicing/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-invoicing">Balance due</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              by {formatDate(totals.dueDate) || '—'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.balanceDue, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Invoice PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (4 sheets) <ArrowRight size={10} /></>)}
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

function InvoiceMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-invoicing" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Alex Hartwell · Brand &amp; design studio</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">Lavelle Road, Bengaluru 560001</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[18px] font-bold tracking-[-0.01em] text-invoicing">INVOICE</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">FRL-2026-014 · Net 14</p>
            <p className="m-0 text-[9px] text-ink-500">Project: Northwind Books</p>
            <span className="mt-1 inline-block rounded bg-info px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-white">SENT</span>
          </div>
        </div>

        <div className="mt-4 h-px bg-invoicing/40" />

        <div className="mt-3">
          <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-invoicing-dk">BILL TO</p>
          <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">Northwind Books Pvt Ltd</p>
          <p className="m-0 text-[9px] text-ink-700">Marcus Vance · Marketing Director</p>
        </div>

        <div className="mt-3 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_60px_50px_60px] gap-1 bg-invoicing px-1.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-invoicing-dk">
            <span>DESCRIPTION · TYPE</span>
            <span className="text-right">QTY</span>
            <span className="text-right">RATE</span>
            <span className="text-right">AMOUNT</span>
          </div>
          {[
            ['Brand strategy · Hourly',     '18 hr', '6,500',  '1,38,060'],
            ['Logo exploration · Daily',    '4 day',  '38,000', '1,79,360'],
            ['Brand guidelines · Fixed',    '1 fee', '95,000', '1,12,100'],
            ['Apr–May retainer · Retainer', '2 mo',  '45,000', '1,06,200'],
            ['Milestone 2 · Milestone',     '1 item', '60,000', '70,800'],
            ['Stock licences · Expense',    '1 item', '7,200',  '7,200'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_60px_50px_60px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="truncate">{r[0]}</span>
              <span className="text-right text-ink-500">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right font-bold">{r[3]}</span>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded bg-canvas px-2 py-1 font-mono text-[8px] text-invoicing-dk">
          18 HRS BILLED · 4 DAYS BILLED
        </div>

        <div className="mt-3 ml-auto w-[65%] text-[9px]">
          {[
            ['Subtotal',      '5,68,200'],
            ['Tax (18%)',     '1,01,520'],
            ['Grand total',   '6,76,920'],
            ['Less: advance', '- 80,000'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-0.5 font-mono text-ink-700">
              <span>{k}</span>
              <span className="text-ink-950">{v}</span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-invoicing pt-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-invoicing-dk">Balance due</span>
            <span className="text-[12px] font-bold text-invoicing-dk">INR 5,96,920</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ payment block, terms, and signature in the full PDF</p>
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
            Mixed-rate lines in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            client-ready invoice out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Mix hourly, day-rate, fixed-fee, retainer, milestone, and expense lines on a single invoice. Hours and days roll up automatically. Advance and partial-payment offsets show the real balance due. Bank, UPI, PayPal, and Stripe all in one payment block.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <InvoiceIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Invoice Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  6 lines · 4 rate types
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Invoice #',     'FRL-2026-014'],
                  ['Issued',        '23 May 2026'],
                  ['Due',           '06 Jun 2026 · Net 14'],
                  ['Client',        'Northwind Books Pvt Ltd'],
                  ['Project',       'Brand sprint Apr–May'],
                  ['Hours billed',  '18 hrs · 4 days'],
                  ['Subtotal',      'INR 5,68,200'],
                  ['Advance',       'INR 80,000 received'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-invoicing/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-invoicing">Balance due</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 5,96,920</span>
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <ExportIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT.PDF</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Send-ready
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
  ['01', 'Set the frame',         'Invoice #, issue date, payment terms (Net 7 / 14 / 30 / 60), project name, PO ref. The due date computes automatically.'],
  ['02', 'Mix your rate types',    'Add as many lines as you like — hourly, daily, fixed, retainer, milestone, expense. Each line shows the right unit (hr / day / fee / month / item) on the PDF. Hours and days roll up into a strip below the table.'],
  ['03', 'Offset and send',        'Subtract advances and any prior partial payments to show the real balance due. Add bank / UPI / PayPal / Stripe payment options. Export PDF + 4-sheet XLSX for your records.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From timesheet{' '}
              <em className="font-serif font-normal italic text-crimson-300">to paid invoice.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Freelance work rarely fits one rate. A single engagement is often hourly discovery + daily production + fixed deliverable + monthly retainer + reimbursable expenses — all of which should land on one invoice so the client has one number to pay. This tool handles every line type without forcing you into separate invoices.
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
  { title: '6 rate types in one invoice', desc: 'Hourly · Daily · Fixed · Retainer · Milestone · Expense. Each line\'s unit prints on the PDF — clients see "18 hr × INR 6,500" rather than a bare number.' },
  { title: 'Hours & days auto-rollup',    desc: 'Total hours billed and total days billed compute automatically and print as a strip below the line items. Easier audits, no manual reconciliation.' },
  { title: 'Advance + paid offset',       desc: 'Two separate fields: advance received before work started, and amount paid against partial collections. Both subtract from the total to print a real balance due.' },
  { title: '7 payment terms presets',     desc: 'Due on receipt, Net 7, 14, 15, 30, 45, 60. Pick the one your client signed and the due date computes from the issue date and gets stamped on the PDF and footer.' },
  { title: 'Payment-method block',        desc: 'Bank + IFSC + UPI + PayPal + Stripe link, all on the PDF. Clients pay how they like; you don\'t need a separate "here\'s how to pay me" email.' },
  { title: 'PDF + 4-sheet XLSX',          desc: 'PDF: branded header, bill-to block, line items with type column, hours strip, totals with advance/paid offset, tax breakdown, payment block, terms, signature. XLSX: Summary, Line items, Tax summary, By rate type.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for freelancers</Eyebrow>
          <SectionTitle>
            Every rate{' '}
            <em className="font-serif font-normal italic text-crimson-300">on one invoice.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-invoicing/20 bg-invoicing-bg text-invoicing">
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
  { q: 'How is this different from the regular Invoice Generator?',     a: 'The regular Invoice Generator is a generic itemised invoice — line description, qty, rate, tax. This Freelance Invoice Generator adds a "rate type" column so each line can be hourly / daily / fixed / retainer / milestone / expense, with the right unit (hr / day / fee / month / item) printed on the PDF. It also adds hours-billed rollups, advance-offset, and a richer payment block (UPI / PayPal / Stripe) — all of which freelancers reach for far more often than businesses do.' },
  { q: 'Can I mix taxable and non-taxable lines?',                     a: 'Yes — each line has its own "taxable" checkbox. Common pattern: services taxable at your local rate, reimbursable expenses (stock licences, travel passed-through at cost) marked non-taxable. The tax-breakdown table at the bottom shows the per-rate totals so the client can reconcile cleanly.' },
  { q: 'How do advances and partial payments work?',                  a: 'Two separate fields. "Advance received" is a deposit collected before the work started — quoted as a line above the actual invoice. "Amount paid" is a partial collection against this invoice after it was issued (e.g. client paid 50% on a Net-30 invoice early). Both subtract from the grand total to show a real balance due, and both print as their own rows on the PDF.' },
  { q: 'Do I need to be GST-registered to use this?',                  a: 'No. Set the tax % to 0 on every line if you\'re not tax-registered, and the tax column on the PDF just shows dashes. The tool is also fine for international clients where you don\'t charge local sales tax — just keep tax 0 and add a notes-block clarification ("Services rendered to a non-resident client; no GST chargeable.").' },
  { q: 'What\'s a milestone line?',                                    a: 'A fixed payment tied to a project milestone — typically used when a fixed-fee project is split into stages: "Milestone 1: discovery sign-off · 30%", "Milestone 2: design system handoff · 40%", etc. Each is its own line on the invoice with qty 1, the milestone fee as the rate, and the milestone label as the description. Makes the invoice easy to audit against the signed SOW.' },
  { q: 'Output formats?',                                              a: 'PDF (top accent stripe, your business header, "INVOICE" block top-right with invoice # / issue / due / payment terms / project / PO ref / status badge, bill-to client block, line-item table with description / type / qty / rate / tax / amount, hours-billed strip, right-aligned totals with advance and amount-paid offset rows, balance-due hero line, tax-breakdown summary, optional payment block, optional terms, optional notes, optional signature, thank-you line) and XLSX (4 sheets: Summary, Line items, Tax summary, By rate type).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">freelance invoices.</em>
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
  { name: 'Invoice Generator',         desc: 'General-purpose itemised invoice.',                Icon: InvoiceIcon,    label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'Tax Invoice Generator',     desc: 'HSN/SAC, tax breakdowns, GST-compliant.',           Icon: TaxInvoiceIcon, label: 'INVOICING', path: '/tools/tax-invoice-generator' },
  { name: 'Quotation Generator',       desc: 'Pitch the work before the invoice goes out.',       Icon: QuoteIcon,      label: 'DOCUMENTS', path: '/tools/quotation-generator' },
  { name: 'Recurring Invoice',         desc: 'Set a cadence for monthly retainer invoices.',      Icon: RecurringIcon,  label: 'INVOICING' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-invoicing">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
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

export default function FreelanceInvoiceGeneratorPage() {
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
