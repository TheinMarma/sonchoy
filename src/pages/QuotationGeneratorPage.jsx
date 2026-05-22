import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  QuoteIcon, InvoiceIcon, POIcon, DeliveryIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, QUOTE_STATUSES, VALIDITY_PRESETS, DISCOUNT_TYPES,
  findCurrency, findQuoteStatus, findValidityPreset, findDiscountType,
  computeTotals, buildTaxSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO, addDays,
} from '../lib/quotation/compute'
import { generateQuotationPdf } from '../lib/quotation/generatePdf'
import { generateQuotationXlsx } from '../lib/quotation/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Quotation Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[600px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Itemised', 'Multi-line quote'],
  ['Validity', 'Auto expiry date'],
  ['Tax',      'Per-line + summary'],
  ['Free',     'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 60%)' }} />
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
            <span className="text-business">Documents</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Quotation Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-business/30 bg-business-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-business">
            <span className="h-1.5 w-1.5 rounded-full bg-business shadow-[0_0_0_4px_rgba(52,208,188,0.25)]" />
            Documents · Sales quotes
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Pitch-ready quotes{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — line by line,
            </em>
            <br />
            tax by{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              tax.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Itemised quotations with per-line tax, discount, and totals; quote-level discount; auto-computed validity expiry; tax-rate summary; optional signature block. Same data structure as the invoice generator — easy to convert when the client says yes.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Auto-validity expiry</span>
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
  'focus:border-business/60 focus:ring-2 focus:ring-business/20 hover:border-line-strong'

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
        className="h-4 w-4 shrink-0 cursor-pointer accent-business" />
    </label>
  )
}

/* ---------- ItemList ---------- */

function ItemList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), description: '', qty: 1, rate: 0, discount: 0, taxPct: 0 },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-business">Line items ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-business-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-business transition-colors hover:bg-business/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
        {items.map((it) => {
          const qty = Number(it.qty) || 0
          const rate = Number(it.rate) || 0
          const discount = Number(it.discount) || 0
          const taxPct = Number(it.taxPct) || 0
          const gross = qty * rate
          const taxable = Math.max(0, gross - discount)
          const tax = taxable * taxPct / 100
          const total = taxable + tax
          return (
            <div key={it.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
                <input type="text" value={it.description || ''}
                  onChange={(e) => update(it.id, { description: e.target.value })}
                  placeholder="Description"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-business/60" />
                <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                <input type="number" step="any" value={it.qty}
                  onChange={(e) => update(it.id, { qty: Number(e.target.value) || 0 })}
                  placeholder="Qty"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
                <input type="number" step="any" value={it.rate}
                  onChange={(e) => update(it.id, { rate: Number(e.target.value) || 0 })}
                  placeholder="Rate"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
                <input type="number" step="any" value={it.discount}
                  onChange={(e) => update(it.id, { discount: Number(e.target.value) || 0 })}
                  placeholder="Disc"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
                <input type="number" step="any" value={it.taxPct}
                  onChange={(e) => update(it.id, { taxPct: Number(e.target.value) || 0 })}
                  placeholder="Tax %"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[10.5px]">
                <span className="text-ink-500">Line</span>
                <span className="font-bold text-business">{formatNumber(total)}</span>
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
  quoteNumber: 'Q-2026-0042',
  quoteDate: today,
  poNumber: '',
  subject: 'Brand identity and digital launch package for Northwind Books',
  statusId: 'draft',
  currency: 'INR',

  from: {
    companyName: 'Sonchoy Studio Pvt Ltd',
    address: '7 Brigade Road, Bengaluru, Karnataka 560001',
    email: 'hello@sonchoystudio.com',
    phone: '+91 80 4567 8901',
    website: 'sonchoystudio.com',
    taxId: 'GST 29ABCDE1234F1Z5',
    signatoryName: 'Alex Hartwell',
  },
  to: {
    companyName: 'Northwind Books Pvt Ltd',
    contactName: 'Marcus Vance · Marketing Director',
    address: 'Brigade Gateway, Malleshwaram, Bengaluru 560055',
    email: 'marcus@northwindbooks.in',
    taxId: 'GST 29XYZAB5678C1Z2',
  },

  items: [
    { id: 1, description: 'Brand identity design — logo, type, colour, voice', qty: 1,  rate: 250000, discount: 0,     taxPct: 18 },
    { id: 2, description: 'Website design & development (12 pages, responsive)', qty: 1, rate: 480000, discount: 25000, taxPct: 18 },
    { id: 3, description: 'Brand launch campaign creative (3 ad sets)',         qty: 3,  rate: 65000,  discount: 0,     taxPct: 18 },
    { id: 4, description: 'Photography & content shoot (2 days)',               qty: 2,  rate: 85000,  discount: 0,     taxPct: 18 },
    { id: 5, description: 'Six-month launch retainer (strategy + production)',  qty: 6,  rate: 120000, discount: 0,     taxPct: 18 },
  ],

  validityPresetId: '30',
  validityCustomDays: '',

  quoteDiscountType: 'percent',
  quoteDiscountValue: 5,
  shipping: 0,
  adjustment: 0,

  includeTermsBlock: true,
  terms: '50% advance on acceptance, 40% on website go-live, 10% on retainer-end signoff. Out-of-pocket costs (photography crew expenses, stock licences) billed at cost with prior approval. Quotation subject to acceptance within the validity period above; pricing locked once 50% advance received.',

  includeNotesBlock: true,
  notes: 'Thanks for considering Sonchoy Studio. The above scope reflects our discussion on 18 May. Any change in scope (additional pages, extra ad sets, shoot days) will be quoted separately as a change order.',

  includeSignatureBlock: true,
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const status = useMemo(() => findQuoteStatus(data.statusId), [data.statusId])
  const totals = useMemo(() => computeTotals(data), [data])
  const taxSummary = useMemo(() => buildTaxSummary(totals.lines), [totals.lines])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setFromField = (k) => (v) => setData((s) => ({ ...s, from: { ...s.from, [k]: v } }))
  const setToField = (k) => (v) => setData((s) => ({ ...s, to: { ...s.to, [k]: v } }))
  const setItems = (items) => setData((s) => ({ ...s, items: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    items: data.items.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateQuotationPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateQuotationXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
              <QuoteIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Quote · {data.items.length} lines · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Quote #" value={data.quoteNumber} onChange={setField('quoteNumber')} mono />
          <DateInput label="Quote date" value={data.quoteDate} onChange={setField('quoteDate')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="PO # (optional)" value={data.poNumber} onChange={setField('poNumber')} mono />
          <SelectInput label="Status" value={data.statusId} onChange={setField('statusId')}
            options={QUOTE_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        </div>
        <div className="mt-2">
          <TextInput label="Subject (optional)" value={data.subject} onChange={setField('subject')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* From */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">From (your business)</span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <TextInput label="Company name" value={data.from.companyName} onChange={setFromField('companyName')} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <TextareaInput label="Address" value={data.from.address} onChange={setFromField('address')} rows={2} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Email"   value={data.from.email}   onChange={setFromField('email')}   mono />
            <TextInput label="Phone"   value={data.from.phone}   onChange={setFromField('phone')}   mono />
            <TextInput label="Website" value={data.from.website} onChange={setFromField('website')} mono />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Tax ID / GSTIN" value={data.from.taxId} onChange={setFromField('taxId')} mono />
            <TextInput label="Signatory name" value={data.from.signatoryName} onChange={setFromField('signatoryName')} />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* To */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">To (client)</span>
        <div className="space-y-2">
          <TextInput label="Company name"  value={data.to.companyName}  onChange={setToField('companyName')} />
          <TextInput label="Contact name"  value={data.to.contactName}  onChange={setToField('contactName')} />
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

        {/* Validity */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Validity</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Preset" value={data.validityPresetId} onChange={setField('validityPresetId')}
            options={VALIDITY_PRESETS.map((v) => ({ value: v.id, label: v.label }))} />
          <NumberInput label="Custom days (override)" value={data.validityCustomDays} onChange={setField('validityCustomDays')} suffix="days" />
        </div>
        <div className="mt-2 rounded-md border border-line bg-canvas px-3 py-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Expires</span>
            <span className="font-mono font-semibold text-business">{formatDate(totals.expiryDate) || '—'}</span>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Discount / shipping / adjustment */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Discount, shipping &amp; adjustment</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Quote discount" value={data.quoteDiscountType} onChange={setField('quoteDiscountType')}
            options={DISCOUNT_TYPES.map((d) => ({ value: d.id, label: d.label }))} />
          {data.quoteDiscountType !== 'none' && (
            <NumberInput label="Discount value" value={data.quoteDiscountValue} onChange={setField('quoteDiscountValue')}
              suffix={data.quoteDiscountType === 'percent' ? '%' : cur.code} />
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <NumberInput label="Shipping / handling" value={data.shipping}   onChange={setField('shipping')}   suffix={cur.code} />
          <NumberInput label="Adjustment"          value={data.adjustment} onChange={setField('adjustment')} suffix={cur.code} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Optional sections</span>
        <div className="space-y-2">
          <ToggleRow label="Terms & conditions block" desc="Standard terms / payment milestones"
            checked={data.includeTermsBlock} onChange={setField('includeTermsBlock')} />
          <ToggleRow label="Notes block"               desc="Free-text notes for the client"
            checked={data.includeNotesBlock} onChange={setField('includeNotesBlock')} />
          <ToggleRow label="Signature block"           desc="Provider + client signature lines"
            checked={data.includeSignatureBlock} onChange={setField('includeSignatureBlock')} />
        </div>
        {data.includeTermsBlock && (
          <div className="mt-2">
            <TextareaInput label="Terms" value={data.terms} onChange={setField('terms')} rows={3} />
          </div>
        )}
        {data.includeNotesBlock && (
          <div className="mt-2">
            <TextareaInput label="Notes" value={data.notes} onChange={setField('notes')} rows={2} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Totals */}
        <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Subtotal</span>
            <span className="text-ink-950">{formatNumber(totals.subtotal)}</span>
          </div>
          {totals.lineDiscounts > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Line discounts</span>
              <span className="text-ink-950">- {formatNumber(totals.lineDiscounts)}</span>
            </div>
          )}
          {totals.quoteDiscount > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Quote discount</span>
              <span className="text-ink-950">- {formatNumber(totals.quoteDiscount)}</span>
            </div>
          )}
          {totals.totalTax > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Tax</span>
              <span className="text-ink-950">{formatNumber(totals.totalTax)}</span>
            </div>
          )}
          {totals.shipping > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Shipping</span>
              <span className="text-ink-950">{formatNumber(totals.shipping)}</span>
            </div>
          )}
          {totals.adjustment !== 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Adjustment</span>
              <span className="text-ink-950">{formatNumber(totals.adjustment)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Total</span>
            <span className="font-mono text-[14px] font-bold text-business">{cur.code} {formatNumber(totals.grandTotal)}</span>
          </div>
        </div>

        {taxSummary.length > 0 && (
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
                    <td className="py-1 text-right text-business">{formatNumber(t.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-business/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-business">Quote total</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              Valid {totals.validityDays} days
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.grandTotal, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Quotation PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (3 sheets) <ArrowRight size={10} /></>)}
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

function QuoteMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-business" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">7 Brigade Road, Bengaluru 560001</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[18px] font-bold tracking-[-0.01em] text-business">QUOTATION</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">Q-2026-0042 · 23 May 2026</p>
            <p className="m-0 text-[9px] text-ink-500">Valid until: 22 Jun 2026</p>
            <span className="mt-1 inline-block rounded bg-ink-500 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-white">DRAFT</span>
          </div>
        </div>

        <div className="mt-4 h-px bg-business/40" />

        <div className="mt-3">
          <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">QUOTATION FOR</p>
          <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">Northwind Books Pvt Ltd</p>
          <p className="m-0 text-[9px] text-ink-700">Marcus Vance · Marketing Director</p>
        </div>

        <p className="m-0 mt-3 text-[10px]">
          <span className="font-bold text-ink-950">Subject: </span>
          <span className="text-ink-700">Brand identity and digital launch package for Northwind Books</span>
        </p>

        <div className="mt-3 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_36px_60px_60px] gap-1 bg-business px-1.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white">
            <span>DESCRIPTION</span>
            <span className="text-right">QTY</span>
            <span className="text-right">RATE</span>
            <span className="text-right">AMOUNT</span>
          </div>
          {[
            ['Brand identity design',         '1',  '2,50,000', '2,95,000'],
            ['Website design & development',  '1',  '4,80,000', '5,36,900'],
            ['Brand launch campaign creative', '3', '65,000',   '2,30,100'],
            ['Photography & content shoot',   '2',  '85,000',   '2,00,600'],
            ['Six-month launch retainer',     '6',  '1,20,000', '8,49,600'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_36px_60px_60px] gap-1 border-t border-line px-1.5 py-1.5 font-mono text-[8.5px] text-ink-900">
              <span className="truncate">{r[0]}</span>
              <span className="text-right">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right font-bold">{r[3]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 ml-auto w-[60%] text-[9px]">
          {[
            ['Subtotal',       '17,82,300'],
            ['Quote discount (5%)', '- 89,115'],
            ['Tax (18%)',      '3,04,775'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-0.5 font-mono text-ink-700">
              <span>{k}</span>
              <span className="text-ink-950">{v}</span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-business pt-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-business-dk">Total</span>
            <span className="text-[12px] font-bold text-business-dk">INR 19,97,960</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ terms, notes, and signature blocks in the full PDF</p>
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
            Line items in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            client-ready quotation out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Itemised quotes with per-line discount and tax, quote-level adjustments, validity window, terms, and signature blocks. The same data structure as the invoice generator — easy to convert once accepted.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
                    <QuoteIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Quotation Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  5 lines · 30-day validity
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Quote #',     'Q-2026-0042'],
                  ['Subject',     'Brand identity + digital launch'],
                  ['Client',      'Northwind Books Pvt Ltd'],
                  ['Line items',  '5 (identity, web, campaign, shoot, retainer)'],
                  ['Subtotal',    'INR 17,82,300'],
                  ['Discount',    '5% quote-level discount'],
                  ['Tax',         '18% GST per line'],
                  ['Validity',    '30 days · expires 22 Jun 2026'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-business/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Total quoted</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 19,97,960</span>
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
                  Send-ready
                </span>
              </div>
              <QuoteMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Fill in the basics',  'Quote number, date, your business, your client, subject. The header block is what the client sees first.'],
  ['02', 'Add line items',       'One row per deliverable: description, qty, rate, per-line discount, per-line tax %. Totals roll up automatically.'],
  ['03', 'Export & send',        'PDF (single-page header with quote-number block, line items, totals with tax breakdown, terms, notes, signatures). XLSX with Summary, Line items, Tax summary.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From line items{' '}
              <em className="font-serif font-normal italic text-crimson-300">to signed deal.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A good quotation is half presentation, half precision. The presentation invites the client to say yes; the precision means the eventual invoice matches what they accepted. This tool handles both — your quote becomes an invoice with zero re-typing once they sign.
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
  { title: 'Itemised lines',          desc: 'Per-line description, qty, rate, discount (flat amount), tax %. Subtotal, tax, and line total compute live.' },
  { title: 'Quote-level discount',    desc: 'Apply a percentage or flat-amount discount on top of line-level discounts. Two layers of negotiation room.' },
  { title: 'Validity & expiry',        desc: 'Pick 7 / 14 / 30 / 60 / 90 days from a preset or enter custom days. Expiry date computes and stamps onto the PDF and footer.' },
  { title: 'Tax-rate summary',         desc: 'Mixed tax rates across lines? The footer shows a per-rate breakdown — taxable amount and tax per rate, separately.' },
  { title: '5 statuses',                desc: 'Draft / Sent / Accepted / Rejected / Expired. The status badge appears top-right on the PDF in colour.' },
  { title: 'PDF + 3-sheet XLSX',       desc: 'PDF: branded header, client block, line-item table, totals, terms, notes, signature block. XLSX: Summary, Line items, Tax summary.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for sales</Eyebrow>
          <SectionTitle>
            Every line the{' '}
            <em className="font-serif font-normal italic text-crimson-300">client needs.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-business/20 bg-business-bg text-business">
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
  { q: 'How is this different from the Business Proposal Generator?', a: 'A proposal is a narrative document — context, approach, pricing, story. A quotation is the pricing piece on its own — itemised, with totals, validity, tax. Use the proposal to win the work; use the quote to confirm exact pricing. Many sales cycles use both: proposal upfront, quote at agreement.' },
  { q: 'How does the validity period work?',                          a: 'Pick a preset (7 / 14 / 30 / 60 / 90 days) or enter a custom number. The tool adds that to the quote date to compute the expiry. The expiry appears at the top-right of the PDF and in the footer. Standard practice is 30 days; pricing assumptions get stale after that.' },
  { q: 'Can I have different tax rates per line?',                   a: 'Yes — every line has its own tax % field. The footer then shows a tax-rate summary breaking out taxable amount and tax per rate. Useful when some items are standard-rated and others are zero-rated (services vs goods, exports, etc.).' },
  { q: 'What\'s the difference between line discount and quote discount?', a: 'Line discount is a flat amount subtracted from one specific line (e.g., bundled bonus on one item). Quote discount is a percentage or flat amount on the subtotal of everything (e.g., 5% off the whole engagement). They\'re applied in that order: line discounts first, then quote discount on the subtotal.' },
  { q: 'Should I use shipping & adjustment?',                        a: 'Shipping for physical-goods quotes where delivery cost is a separate line. Adjustment for round-off (e.g., make total a clean number), small surcharges, or last-minute negotiated tweaks. Both default to 0; the rows only show on the PDF if non-zero.' },
  { q: 'Output formats?',                                            a: 'PDF (top accent stripe, your company header, "QUOTATION" block top-right with quote number/date/expiry/status badge, client block, subject line, line-item table with discount + tax columns, right-aligned totals with tax breakdown footer, optional terms / notes / signature blocks, page footer with quote # and expiry) and XLSX (3 sheets: Summary, Line items, Tax summary).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">quotations.</em>
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
  { name: 'Invoice Generator',          desc: 'Convert accepted quotes to invoices.',     Icon: InvoiceIcon, label: 'INVOICING' },
  { name: 'Proforma Invoice Generator', desc: 'Pre-invoice quotation for shipments.',     Icon: InvoiceIcon, label: 'INVOICING' },
  { name: 'Purchase Order Generator',   desc: 'Buyer-side issued order.',                  Icon: POIcon,      label: 'DOCUMENTS' },
  { name: 'Delivery Challan',           desc: 'Goods-dispatch documentation.',             Icon: DeliveryIcon, label: 'DOCUMENTS' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-business">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-business-bg text-business">
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

export default function QuotationGeneratorPage() {
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
