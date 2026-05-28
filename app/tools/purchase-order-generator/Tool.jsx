'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  POIcon, QuoteIcon, InvoiceIcon, DeliveryIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, PO_STATUSES, PO_TYPES, DELIVERY_TERMS, PAYMENT_TERMS, DISCOUNT_TYPES,
  findCurrency, findPoStatus, findPoType, findDeliveryTerm, findPaymentTerm, findDiscountType,
  computeTotals, buildTaxSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/purchase-order/compute'
import { generatePurchaseOrderPdf } from '@/lib/purchase-order/generatePdf'
import { generatePurchaseOrderXlsx } from '@/lib/purchase-order/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Purchase Order Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[600px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['4',        'PO types'],
  ['6',        'Status states'],
  ['Incoterm', 'Delivery terms'],
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
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-business">Documents</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Purchase Order Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-business/30 bg-business-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-business">
            <span className="h-1.5 w-1.5 rounded-full bg-business shadow-[0_0_0_4px_rgba(52,208,188,0.25)]" />
            Documents · Procurement
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Tell vendors exactly{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              what to ship,
            </em>
            <br />
            where, and by{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              when.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Itemised purchase orders with vendor block, ship-to address, delivery and payment terms, per-line SKU/qty/unit/rate/tax, totals, signature block. Numbered, dated, and ready to email your supplier in 30 seconds.
          </p>
          <div className="mb-12 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="btn btn-cta btn-xl">
              Launch The Tool <ArrowRight size={16} />
            </button>
            <Link href="/#tools" className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-950/15 bg-ink-950/5 px-7 py-[18px] text-[16px] font-medium leading-none text-ink-950 no-underline backdrop-blur-sm transition-colors hover:bg-ink-950/10 capitalize">
              Explore More Tools
            </Link>
          </div>
          <div className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> No signup, ever</span>
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> 100% local · nothing uploaded</span>
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Incoterm presets</span>
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
    { id: Date.now() + Math.random(), sku: '', description: '', qty: 1, unit: 'ea', rate: 0, discount: 0, taxPct: 0 },
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
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
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
              <div className="grid grid-cols-[80px_1fr_22px] items-center gap-1.5">
                <input type="text" value={it.sku || ''}
                  onChange={(e) => update(it.id, { sku: e.target.value })}
                  placeholder="SKU"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
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
              <div className="mt-1.5 grid grid-cols-5 gap-1">
                <input type="number" step="any" value={it.qty}
                  onChange={(e) => update(it.id, { qty: Number(e.target.value) || 0 })}
                  placeholder="Qty"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
                <input type="text" value={it.unit || 'ea'}
                  onChange={(e) => update(it.id, { unit: e.target.value })}
                  placeholder="Unit"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-center font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
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
  poNumber: 'PO-2026-0117',
  poDate: today,
  requiredDate: '2026-06-22',
  quoteRef: 'Q-2026-0042',
  poTypeId: 'standard',
  statusId: 'sent',
  currency: 'INR',

  buyer: {
    companyName: 'Sonchoy Studio Pvt Ltd',
    address: '7 Brigade Road, Bengaluru, Karnataka 560001',
    email: 'procurement@sonchoystudio.com',
    phone: '+91 80 4567 8901',
    website: 'sonchoystudio.com',
    taxId: 'GST 29ABCDE1234F1Z5',
    signatoryName: 'Riya Banerjee',
    signatoryTitle: 'Head of Operations',
  },
  vendor: {
    companyName: 'Westline Hardware Supplies Pvt Ltd',
    contactName: 'Karthik Iyer · Sales Manager',
    address: '24 MIDC Industrial Estate, Andheri East, Mumbai 400093',
    email: 'sales@westlinehardware.in',
    phone: '+91 22 6677 8800',
    taxId: 'GST 27WXYZA8901P2Z6',
  },
  shipTo: {
    companyName: 'Sonchoy Studio · Whitefield Office',
    contactName: 'Receiving Desk · 09:00–18:00 Mon–Sat',
    address: 'Plot 14, ITPB Road, Whitefield, Bengaluru 560066',
    email: 'receiving@sonchoystudio.com',
    phone: '+91 80 4567 8910',
  },

  items: [
    { id: 1, sku: 'WS-D32-OAK',   description: 'Standing desk, 1600×800mm, oak laminate',         qty: 6,  unit: 'ea',  rate: 38500, discount: 0,    taxPct: 18 },
    { id: 2, sku: 'CH-MS-04',     description: 'Ergonomic mesh chair, adjustable lumbar',          qty: 6,  unit: 'ea',  rate: 21500, discount: 6000, taxPct: 18 },
    { id: 3, sku: 'MN-27-4K',     description: '27-inch 4K IPS monitor, USB-C 90W passthrough',    qty: 6,  unit: 'ea',  rate: 32800, discount: 0,    taxPct: 18 },
    { id: 4, sku: 'CB-USB-2M',    description: 'USB-C to USB-C cable, 100W, 2m braided',           qty: 12, unit: 'ea',  rate: 850,   discount: 0,    taxPct: 18 },
    { id: 5, sku: 'PB-PWR-6S',    description: 'Power strip, 6 sockets, surge protected',          qty: 6,  unit: 'ea',  rate: 2200,  discount: 0,    taxPct: 18 },
  ],

  deliveryTermId: 'fob_dest',
  paymentTermId: 'net_30',
  shipVia: 'BlueDart Surface · multi-box',

  poDiscountType: 'none',
  poDiscountValue: 0,
  shipping: 4500,
  adjustment: 0,

  includeDeliveryBlock:  true,
  includeTermsBlock:     true,
  terms: 'Goods to be delivered to the Whitefield receiving desk between 09:00 and 18:00, Monday to Saturday. Vendor to confirm dispatch tracking within 24 hours of pickup. Any short-shipment or damaged goods to be reported within 48 hours of receipt and replaced at no additional cost. Pricing locked at the agreed quote (Q-2026-0042); no surcharges accepted without prior written approval from the buyer.',

  includeNotesBlock: true,
  notes: 'Please consolidate all 5 SKUs into a single dispatch. Label each carton with the PO number and the line-item SKU. Include a packing slip listing per-SKU quantities for verification at receiving.',

  includeSignatureBlock: true,
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  void findPoStatus(data.statusId)
  void findPoType(data.poTypeId)
  void findDeliveryTerm(data.deliveryTermId)
  void findPaymentTerm(data.paymentTermId)
  void findDiscountType(data.poDiscountType)
  const totals = useMemo(() => computeTotals(data), [data])
  const taxSummary = useMemo(() => buildTaxSummary(totals.lines), [totals.lines])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setBuyerField  = (k) => (v) => setData((s) => ({ ...s, buyer:  { ...s.buyer,  [k]: v } }))
  const setVendorField = (k) => (v) => setData((s) => ({ ...s, vendor: { ...s.vendor, [k]: v } }))
  const setShipToField = (k) => (v) => setData((s) => ({ ...s, shipTo: { ...s.shipTo, [k]: v } }))
  const setItems = (items) => setData((s) => ({ ...s, items: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    items: data.items.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generatePurchaseOrderPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generatePurchaseOrderXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
              <POIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              PO · {data.items.length} lines · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="PO #" value={data.poNumber} onChange={setField('poNumber')} mono />
          <DateInput label="PO date" value={data.poDate} onChange={setField('poDate')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DateInput label="Required by" value={data.requiredDate} onChange={setField('requiredDate')} />
          <TextInput label="Quote ref (optional)" value={data.quoteRef} onChange={setField('quoteRef')} mono />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="PO type" value={data.poTypeId} onChange={setField('poTypeId')}
            options={PO_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
          <SelectInput label="Status" value={data.statusId} onChange={setField('statusId')}
            options={PO_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Buyer */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Buyer (your business)</span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <TextInput label="Company name" value={data.buyer.companyName} onChange={setBuyerField('companyName')} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <TextareaInput label="Address" value={data.buyer.address} onChange={setBuyerField('address')} rows={2} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Email"   value={data.buyer.email}   onChange={setBuyerField('email')}   mono />
            <TextInput label="Phone"   value={data.buyer.phone}   onChange={setBuyerField('phone')}   mono />
            <TextInput label="Website" value={data.buyer.website} onChange={setBuyerField('website')} mono />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Tax ID / GSTIN" value={data.buyer.taxId} onChange={setBuyerField('taxId')} mono />
            <TextInput label="Signatory" value={data.buyer.signatoryName} onChange={setBuyerField('signatoryName')} />
          </div>
          <TextInput label="Signatory title" value={data.buyer.signatoryTitle} onChange={setBuyerField('signatoryTitle')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Vendor */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Vendor</span>
        <div className="space-y-2">
          <TextInput label="Company name"  value={data.vendor.companyName}  onChange={setVendorField('companyName')} />
          <TextInput label="Contact name"  value={data.vendor.contactName}  onChange={setVendorField('contactName')} />
          <TextareaInput label="Address" value={data.vendor.address} onChange={setVendorField('address')} rows={2} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Email"  value={data.vendor.email}  onChange={setVendorField('email')}  mono />
            <TextInput label="Phone"  value={data.vendor.phone}  onChange={setVendorField('phone')}  mono />
            <TextInput label="Tax ID" value={data.vendor.taxId}  onChange={setVendorField('taxId')}  mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Ship-to */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Ship to</span>
        <div className="space-y-2">
          <TextInput label="Location"     value={data.shipTo.companyName}  onChange={setShipToField('companyName')} />
          <TextInput label="Contact / hours" value={data.shipTo.contactName} onChange={setShipToField('contactName')} />
          <TextareaInput label="Address" value={data.shipTo.address} onChange={setShipToField('address')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email" value={data.shipTo.email} onChange={setShipToField('email')} mono />
            <TextInput label="Phone" value={data.shipTo.phone} onChange={setShipToField('phone')} mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Delivery & payment */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Delivery &amp; payment</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Delivery terms" value={data.deliveryTermId} onChange={setField('deliveryTermId')}
            options={DELIVERY_TERMS.map((d) => ({ value: d.id, label: d.label }))} />
          <SelectInput label="Payment terms" value={data.paymentTermId} onChange={setField('paymentTermId')}
            options={PAYMENT_TERMS.map((p) => ({ value: p.id, label: p.label }))} />
        </div>
        <div className="mt-2">
          <TextInput label="Ship via" value={data.shipVia} onChange={setField('shipVia')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Items */}
        <ItemList items={data.items} setItems={setItems} />

        <div className="my-3.5 h-px bg-line" />

        {/* Discount / shipping / adjustment */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">PO-level adjustments</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="PO discount" value={data.poDiscountType} onChange={setField('poDiscountType')}
            options={DISCOUNT_TYPES.map((d) => ({ value: d.id, label: d.label }))} />
          {data.poDiscountType !== 'none' && (
            <NumberInput label="Discount value" value={data.poDiscountValue} onChange={setField('poDiscountValue')}
              suffix={data.poDiscountType === 'percent' ? '%' : cur.code} />
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <NumberInput label="Shipping / freight" value={data.shipping}   onChange={setField('shipping')}   suffix={cur.code} />
          <NumberInput label="Adjustment"          value={data.adjustment} onChange={setField('adjustment')} suffix={cur.code} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Optional sections</span>
        <div className="space-y-2">
          <ToggleRow label="Delivery / payment strip" desc="Highlighted band on the PDF"
            checked={data.includeDeliveryBlock} onChange={setField('includeDeliveryBlock')} />
          <ToggleRow label="Terms & conditions block" desc="Standard procurement terms"
            checked={data.includeTermsBlock} onChange={setField('includeTermsBlock')} />
          <ToggleRow label="Notes / instructions"     desc="Packing, labelling, special handling"
            checked={data.includeNotesBlock} onChange={setField('includeNotesBlock')} />
          <ToggleRow label="Signature block"          desc="Buyer + vendor acknowledgement"
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
          {totals.poDiscount > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">PO discount</span>
              <span className="text-ink-950">- {formatNumber(totals.poDiscount)}</span>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">PO total</span>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-business">PO total</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {formatNumber(totals.totalQty)} units · req {formatDate(data.requiredDate) || '—'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.grandTotal, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Purchase Order PDF'}
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

function PoMock() {
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
            <p className="m-0 text-[16px] font-bold tracking-[-0.01em] text-business">PURCHASE ORDER</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">PO-2026-0117 · 23 May 2026</p>
            <p className="m-0 text-[9px] text-ink-500">Required by: 22 Jun 2026</p>
            <span className="mt-1 inline-block rounded bg-info px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-white">SENT TO VENDOR</span>
          </div>
        </div>

        <div className="mt-4 h-px bg-business/40" />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">VENDOR</p>
            <p className="m-0 mt-1 text-[10px] font-bold text-ink-950">Westline Hardware Supplies Pvt Ltd</p>
            <p className="m-0 text-[8.5px] text-ink-700">Karthik Iyer · Sales Manager</p>
            <p className="m-0 text-[8.5px] text-ink-500">Andheri East, Mumbai 400093</p>
          </div>
          <div>
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">SHIP TO</p>
            <p className="m-0 mt-1 text-[10px] font-bold text-ink-950">Whitefield Office</p>
            <p className="m-0 text-[8.5px] text-ink-700">Receiving · 09:00–18:00</p>
            <p className="m-0 text-[8.5px] text-ink-500">ITPB Road, Bengaluru 560066</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded border border-line bg-canvas px-2 py-1.5 font-mono text-[8px]">
          <div><span className="text-business-dk font-bold">DELIVERY</span><br /><span className="text-ink-950">FOB Destination</span></div>
          <div><span className="text-business-dk font-bold">PAYMENT</span><br /><span className="text-ink-950">Net 30</span></div>
          <div><span className="text-business-dk font-bold">SHIP VIA</span><br /><span className="text-ink-950">BlueDart Surface</span></div>
        </div>

        <div className="mt-3 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_28px_50px_56px] gap-1 bg-business px-1.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white">
            <span>DESCRIPTION</span>
            <span className="text-right">QTY</span>
            <span className="text-right">RATE</span>
            <span className="text-right">AMOUNT</span>
          </div>
          {[
            ['Standing desk, oak laminate',   '6',  '38,500',  '2,72,580'],
            ['Ergonomic mesh chair',          '6',  '21,500',  '1,45,140'],
            ['27-inch 4K IPS monitor',        '6',  '32,800',  '2,32,224'],
            ['USB-C cable, 100W, 2m',         '12', '850',     '12,036'],
            ['Power strip, 6 sockets',        '6',  '2,200',   '15,576'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_28px_50px_56px] gap-1 border-t border-line px-1.5 py-1.5 font-mono text-[8.5px] text-ink-900">
              <span className="truncate">{r[0]}</span>
              <span className="text-right">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right font-bold">{r[3]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 ml-auto w-[60%] text-[9px]">
          {[
            ['Subtotal',     '5,77,420'],
            ['Tax (18%)',    '1,03,936'],
            ['Shipping',     '4,500'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-0.5 font-mono text-ink-700">
              <span>{k}</span>
              <span className="text-ink-950">{v}</span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-business pt-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-business-dk">PO total</span>
            <span className="text-[12px] font-bold text-business-dk">INR 6,85,856</span>
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
            vendor-ready PO out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Itemised purchase orders with SKU, qty, unit, rate, and per-line tax; vendor + ship-to blocks; delivery and payment terms strip; totals with tax breakdown; signature acknowledgement. The same structure your accounting system expects on receipt.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
                    <POIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">PO Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  5 lines · Net 30 · FOB
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['PO #',         'PO-2026-0117'],
                  ['Type',         'Standard PO'],
                  ['Vendor',       'Westline Hardware Supplies'],
                  ['Ship to',      'Whitefield Office, Bengaluru'],
                  ['Line items',   '5 SKUs (desk, chair, monitor, cable, strip)'],
                  ['Subtotal',     'INR 5,77,420'],
                  ['Delivery',     'FOB Destination · BlueDart'],
                  ['Payment',      'Net 30 days'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-business/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">PO total</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 6,85,856</span>
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
              <PoMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Fill in the parties',  'Buyer, vendor, ship-to. Three address blocks because the goods rarely go where the buyer sits.'],
  ['02', 'Add SKUs & terms',     'One row per item: SKU, description, qty, unit, rate, tax %. Pick delivery (FOB / EXW / CIF / DDP) and payment terms (Net 15/30/60/COD/advance).'],
  ['03', 'Send to vendor',       'PDF: branded header, vendor + ship-to blocks, delivery strip, line-item table, totals with tax breakdown, terms, signature. XLSX with Summary, Line items, Tax summary.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From spec sheet{' '}
              <em className="font-serif font-normal italic text-crimson-300">to confirmed order.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A purchase order is a one-page contract: what, how many, at what price, where to ship, when to deliver, who pays for freight, and how the buyer settles up. Get it wrong and the vendor ships late, ships wrong, or invoices a different number. This tool keeps every field in one place.
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
  { title: 'Three address blocks',     desc: 'Buyer, vendor, ship-to. Goods often go to a warehouse, plant, or remote office different from the buying entity.' },
  { title: 'Per-line SKU + unit',      desc: 'Each line carries a SKU, description, qty, unit (ea / kg / box / hr), rate, line discount, tax %. Matches what accounting and the vendor expect.' },
  { title: '4 PO types',                desc: 'Standard, Blanket, Contract, Service. Pick the right kind for one-off orders, recurring drawdowns, long-term contracts, or labour-only POs.' },
  { title: 'Incoterm presets',         desc: 'FOB Destination, FOB Origin, EXW, CIF, DDP, or custom. The PDF shows the delivery term prominently so freight risk is unambiguous.' },
  { title: 'Payment term presets',     desc: 'Net 15 / 30 / 45 / 60, COD, advance, or 50% / 50%. The vendor knows exactly when the cheque clears.' },
  { title: 'PDF + 3-sheet XLSX',       desc: 'PDF: branded header, two-column vendor + ship-to, delivery strip, line-item table with SKU, totals, terms, dual signature block. XLSX: Summary, Line items, Tax summary.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for procurement</Eyebrow>
          <SectionTitle>
            Every field the{' '}
            <em className="font-serif font-normal italic text-crimson-300">vendor needs.</em>
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
  { q: 'How is a PO different from an invoice or a quote?',         a: 'A quote is the vendor pitching pricing to the buyer. A PO is the buyer formally agreeing and committing: ship these SKUs, in this quantity, at this price, to this address, by this date. The invoice is the vendor billing later. The PO number ties all three together — quote-ref, PO #, and the eventual invoice should reference each other.' },
  { q: 'What\'s the difference between the four PO types?',          a: 'Standard PO is a one-off purchase with fixed scope and pricing. Blanket PO is a single PO that authorises multiple drawdowns over a period (e.g., 100 units to be released as needed across the year). Contract PO is a long-term agreement with locked pricing. Service PO covers labour or services rather than physical goods. The PDF stamps the type so the vendor and your finance team know the kind.' },
  { q: 'Which delivery (incoterm) should I pick?',                  a: 'FOB Destination — vendor pays freight and risk transfers when the goods arrive. FOB Origin — buyer pays freight from vendor\'s dock. EXW — buyer picks up. CIF — vendor handles cost, insurance, freight to a port. DDP — vendor delivers to the buyer\'s door with all duties paid. If unsure, FOB Destination is the safest for buyers; the vendor owns the goods until they\'re received.' },
  { q: 'What payment term is standard?',                            a: 'Net 30 (pay within 30 days of invoice) is the most common B2B default. Net 15 / Net 45 / Net 60 shift the timeline. COD is cash-on-delivery for trust-building first orders. Advance is 100% upfront (rare). 50% / 50% splits — half on PO, half on delivery — is common for custom-made items.' },
  { q: 'Do I need a separate Ship-To block?',                       a: 'Yes, almost always. The buyer entity (head office, billing address) is rarely where the goods physically land. A separate ship-to block tells the vendor exactly where the receiving dock is, who to ask for at the door, and what hours the dock accepts deliveries. Without it, you\'ll get pallets sitting in the wrong reception.' },
  { q: 'Output formats?',                                            a: 'PDF (top accent stripe, your branded header, "PURCHASE ORDER" block top-right with PO # / date / required-by / quote-ref / type / status badge, vendor + ship-to two-column block, delivery / payment / ship-via strip, line-item table with SKU + qty + unit + rate + tax + amount, right-aligned totals with tax breakdown, optional terms / notes / dual signature) and XLSX (3 sheets: Summary, Line items, Tax summary).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">purchase orders.</em>
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
  { name: 'Quotation Generator',        desc: 'Vendor-side priced quote you can accept into a PO.', Icon: QuoteIcon,    label: 'DOCUMENTS', path: '/tools/quotation-generator' },
  { name: 'Invoice Generator',          desc: 'Bill the vendor or convert a confirmed PO.',          Icon: InvoiceIcon,  label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'Delivery Note Generator',    desc: 'Pack-list that ships alongside the PO goods.',        Icon: DeliveryIcon, label: 'DOCUMENTS' },
  { name: 'GST / VAT Invoice',          desc: 'Tax-compliant invoice once goods arrive.',            Icon: InvoiceIcon,  label: 'INVOICING', path: '/tools/gst-vat-invoice-generator' },
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
          <Link href="/#tools" className="inline-flex items-center gap-2 font-medium text-[14px] text-crimson-300 underline decoration-crimson-500/40 underline-offset-4 hover:decoration-crimson-300">
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
              ? (<Link key={t.name} href={t.path} className={cls}>{inner}</Link>)
              : (<a key={t.name} href="#" className={cls}>{inner}</a>)
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function PurchaseOrderGeneratorTool() {
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
