import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  DeliveryIcon, POIcon, InvoiceIcon, ReceiptIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  DN_STATUSES, TRANSPORT_MODES, PACKAGE_TYPES,
  findDnStatus, findTransportMode, findPackageType,
  computeTotals, countSections,
  formatNumber, formatDate, todayISO,
} from '../lib/delivery-note/compute'
import { generateDeliveryNotePdf } from '../lib/delivery-note/generatePdf'
import { generateDeliveryNoteXlsx } from '../lib/delivery-note/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Delivery Note Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[600px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['No price', 'Pack-list only'],
  ['6',         'Transport modes'],
  ['7',         'Package types'],
  ['Free',      'Always · no signup'],
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
            <span className="text-ink-950">Delivery Note Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-business/30 bg-business-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-business">
            <span className="h-1.5 w-1.5 rounded-full bg-business shadow-[0_0_0_4px_rgba(52,208,188,0.25)]" />
            Documents · Dispatch
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Send what shipped{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — no prices,
            </em>
            <br />
            just{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              the goods.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Pack-list PDFs that ship alongside the goods. SKU, qty ordered, qty dispatched, qty pending — no rates, no totals. Vehicle, driver, AWB, package count, gross weight. Signed by sender, countersigned by consignee on receipt.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Pricing kept off the document</span>
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
    { id: Date.now() + Math.random(), sku: '', description: '', qtyOrdered: 1, qtyDispatched: 1, unit: 'ea', weight: 0, batchNo: '' },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-business">Pack list ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-business-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-business transition-colors hover:bg-business/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {items.map((it) => {
          const qtyOrdered    = Number(it.qtyOrdered) || 0
          const qtyDispatched = Number(it.qtyDispatched) || 0
          const qtyPending    = Math.max(0, qtyOrdered - qtyDispatched)
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
                <input type="number" step="any" value={it.qtyOrdered}
                  onChange={(e) => update(it.id, { qtyOrdered: Number(e.target.value) || 0 })}
                  placeholder="Ord"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
                <input type="number" step="any" value={it.qtyDispatched}
                  onChange={(e) => update(it.id, { qtyDispatched: Number(e.target.value) || 0 })}
                  placeholder="Disp"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-business outline-none focus:border-business/60" />
                <input type="text" value={it.unit || 'ea'}
                  onChange={(e) => update(it.id, { unit: e.target.value })}
                  placeholder="Unit"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-center font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
                <input type="number" step="any" value={it.weight}
                  onChange={(e) => update(it.id, { weight: Number(e.target.value) || 0 })}
                  placeholder="kg/unit"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
                <input type="text" value={it.batchNo || ''}
                  onChange={(e) => update(it.id, { batchNo: e.target.value })}
                  placeholder="Batch"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[10.5px]">
                <span className="text-ink-500">Pending</span>
                <span className={`font-bold ${qtyPending > 0 ? 'text-warning' : 'text-business'}`}>
                  {formatNumber(qtyPending)} {it.unit || 'ea'}
                </span>
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
  dnNumber: 'DN-2026-0089',
  dnDate: today,
  poRef: 'PO-2026-0117',
  invoiceRef: 'INV-2026-0241',
  dispatchDate: today,
  expectedDate: '2026-05-26',
  statusId: 'dispatched',

  from: {
    companyName: 'Westline Hardware Supplies Pvt Ltd',
    address: '24 MIDC Industrial Estate, Andheri East, Mumbai 400093',
    email: 'dispatch@westlinehardware.in',
    phone: '+91 22 6677 8800',
    taxId: 'GST 27WXYZA8901P2Z6',
    signatoryName: 'Karthik Iyer',
  },
  to: {
    companyName: 'Sonchoy Studio Pvt Ltd',
    contactName: 'Receiving Desk · 09:00–18:00 Mon–Sat',
    address: 'Plot 14, ITPB Road, Whitefield, Bengaluru 560066',
    phone: '+91 80 4567 8910',
    email: 'receiving@sonchoystudio.com',
  },
  shipFrom: {
    location: 'Westline Mumbai Warehouse · Dock 4',
    contactName: 'Dispatch supervisor',
    address: 'Warehouse Block C, MIDC Industrial Estate, Andheri East, Mumbai',
    phone: '+91 22 6677 8811',
  },

  items: [
    { id: 1, sku: 'WS-D32-OAK',   description: 'Standing desk, 1600×800mm, oak laminate',         qtyOrdered: 6,  qtyDispatched: 6,  unit: 'ea',  weight: 28,   batchNo: 'WS-BATCH-2604' },
    { id: 2, sku: 'CH-MS-04',     description: 'Ergonomic mesh chair, adjustable lumbar',          qtyOrdered: 6,  qtyDispatched: 6,  unit: 'ea',  weight: 18,   batchNo: 'CH-BATCH-1107' },
    { id: 3, sku: 'MN-27-4K',     description: '27-inch 4K IPS monitor, USB-C 90W passthrough',    qtyOrdered: 6,  qtyDispatched: 4,  unit: 'ea',  weight: 9,    batchNo: 'MN-BATCH-0518' },
    { id: 4, sku: 'CB-USB-2M',    description: 'USB-C to USB-C cable, 100W, 2m braided',           qtyOrdered: 12, qtyDispatched: 12, unit: 'ea',  weight: 0.15, batchNo: '' },
    { id: 5, sku: 'PB-PWR-6S',    description: 'Power strip, 6 sockets, surge protected',          qtyOrdered: 6,  qtyDispatched: 6,  unit: 'ea',  weight: 0.6,  batchNo: '' },
  ],

  transportModeId: 'road',
  vehicleNo: 'MH-04-AB-9241',
  awb: '',
  driverName: 'Suresh Pawar',
  driverPhone: '+91 98765 43210',

  packageTypeId: 'mixed',
  packageCount: 14,
  grossWeight: 332,
  dimensions: '14 packages · max 1700×850×220mm',
  marks: 'PO-2026-0117 · Fragile (monitors)',

  includePackageBlock: true,

  includeNotesBlock: true,
  notes: 'Monitors (MN-27-4K) packed in original cartons with foam inserts — handle with care. 2 units pending due to inventory shortfall; second shipment scheduled within 5 working days under DN-2026-0090. Please verify carton count and seal integrity before signing.',

  includeReceiptBlock: true,
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  void findDnStatus(data.statusId)
  void findTransportMode(data.transportModeId)
  void findPackageType(data.packageTypeId)
  const totals = useMemo(() => computeTotals(data), [data])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setFromField     = (k) => (v) => setData((s) => ({ ...s, from:     { ...s.from,     [k]: v } }))
  const setToField       = (k) => (v) => setData((s) => ({ ...s, to:       { ...s.to,       [k]: v } }))
  const setShipFromField = (k) => (v) => setData((s) => ({ ...s, shipFrom: { ...s.shipFrom, [k]: v } }))
  const setItems = (items) => setData((s) => ({ ...s, items: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    items: data.items.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateDeliveryNotePdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateDeliveryNoteXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
              <DeliveryIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              DN · {data.items.length} lines · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="DN #" value={data.dnNumber} onChange={setField('dnNumber')} mono />
          <DateInput label="DN date" value={data.dnDate} onChange={setField('dnDate')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="PO ref (optional)"      value={data.poRef}      onChange={setField('poRef')}      mono />
          <TextInput label="Invoice ref (optional)" value={data.invoiceRef} onChange={setField('invoiceRef')} mono />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <DateInput label="Dispatch date" value={data.dispatchDate} onChange={setField('dispatchDate')} />
          <DateInput label="Expected"      value={data.expectedDate} onChange={setField('expectedDate')} />
          <SelectInput label="Status" value={data.statusId} onChange={setField('statusId')}
            options={DN_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* From */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">From (your business)</span>
        <div className="space-y-2">
          <TextInput label="Company name" value={data.from.companyName} onChange={setFromField('companyName')} />
          <TextareaInput label="Address" value={data.from.address} onChange={setFromField('address')} rows={2} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Email"          value={data.from.email}          onChange={setFromField('email')}          mono />
            <TextInput label="Phone"          value={data.from.phone}          onChange={setFromField('phone')}          mono />
            <TextInput label="Tax ID"         value={data.from.taxId}          onChange={setFromField('taxId')}          mono />
          </div>
          <TextInput label="Dispatch signatory" value={data.from.signatoryName} onChange={setFromField('signatoryName')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Consignee */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Consignee (deliver to)</span>
        <div className="space-y-2">
          <TextInput label="Company name"     value={data.to.companyName} onChange={setToField('companyName')} />
          <TextInput label="Contact / hours"  value={data.to.contactName} onChange={setToField('contactName')} />
          <TextareaInput label="Address" value={data.to.address} onChange={setToField('address')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Phone" value={data.to.phone} onChange={setToField('phone')} mono />
            <TextInput label="Email" value={data.to.email} onChange={setToField('email')} mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Ship from */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Ship from (origin warehouse)</span>
        <div className="space-y-2">
          <TextInput label="Location"      value={data.shipFrom.location}    onChange={setShipFromField('location')} />
          <TextInput label="Contact"       value={data.shipFrom.contactName} onChange={setShipFromField('contactName')} />
          <TextareaInput label="Address" value={data.shipFrom.address} onChange={setShipFromField('address')} rows={2} />
          <TextInput label="Phone" value={data.shipFrom.phone} onChange={setShipFromField('phone')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Transport */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Transport</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Mode" value={data.transportModeId} onChange={setField('transportModeId')}
            options={TRANSPORT_MODES.map((t) => ({ value: t.id, label: t.label }))} />
          <TextInput label="Vehicle no." value={data.vehicleNo} onChange={setField('vehicleNo')} mono />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <TextInput label="AWB / docket"  value={data.awb}         onChange={setField('awb')}         mono />
          <TextInput label="Driver name"   value={data.driverName}  onChange={setField('driverName')} />
          <TextInput label="Driver phone"  value={data.driverPhone} onChange={setField('driverPhone')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Items */}
        <ItemList items={data.items} setItems={setItems} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Optional sections</span>
        <div className="space-y-2">
          <ToggleRow label="Package details block"   desc="Type, count, gross weight, dimensions"
            checked={data.includePackageBlock} onChange={setField('includePackageBlock')} />
          <ToggleRow label="Notes / handling block"  desc="Fragile, batch info, partial-ship notes"
            checked={data.includeNotesBlock} onChange={setField('includeNotesBlock')} />
          <ToggleRow label="Receipt / signature block" desc="Sender + consignee signature lines"
            checked={data.includeReceiptBlock} onChange={setField('includeReceiptBlock')} />
        </div>

        {data.includePackageBlock && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Package type" value={data.packageTypeId} onChange={setField('packageTypeId')}
                options={PACKAGE_TYPES.map((p) => ({ value: p.id, label: p.label }))} />
              <NumberInput label="Package count" value={data.packageCount} onChange={setField('packageCount')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="Gross weight" value={data.grossWeight} onChange={setField('grossWeight')} suffix="kg" />
              <TextInput   label="Dimensions"   value={data.dimensions}  onChange={setField('dimensions')} />
            </div>
            <TextInput label="Marks & numbers" value={data.marks} onChange={setField('marks')} />
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
            <span className="text-ink-500">Total ordered</span>
            <span className="text-ink-950">{formatNumber(totals.totalOrdered)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Total dispatched</span>
            <span className="text-business">{formatNumber(totals.totalDispatched)}</span>
          </div>
          {totals.totalPending > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Total pending</span>
              <span className="text-warning">{formatNumber(totals.totalPending)}</span>
            </div>
          )}
          {totals.totalWeight > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Total weight</span>
              <span className="text-ink-950">{formatNumber(totals.totalWeight)} kg</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Status</span>
            <span className={`font-mono text-[10px] font-bold uppercase ${totals.fullyDispatched ? 'text-business' : 'text-warning'}`}>
              {totals.fullyDispatched ? 'Fully dispatched' : 'Partial dispatch'}
            </span>
          </div>
        </div>

        {/* No-price reminder */}
        <div className="mt-3 rounded-lg border border-business/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-business">Pricing</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              not shown on DN
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[14px] font-semibold text-paper">
            Pack list · {formatNumber(totals.totalDispatched)} units
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Delivery Note PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (2 sheets) <ArrowRight size={10} /></>)}
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

function DnMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-business" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Westline Hardware Supplies</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">Andheri East, Mumbai 400093</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[16px] font-bold tracking-[-0.01em] text-business">DELIVERY NOTE</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">DN-2026-0089 · 23 May 2026</p>
            <p className="m-0 text-[9px] text-ink-500">PO ref: PO-2026-0117</p>
            <span className="mt-1 inline-block rounded bg-success px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-white">DISPATCHED</span>
          </div>
        </div>

        <div className="mt-4 h-px bg-business/40" />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">DELIVER TO</p>
            <p className="m-0 mt-1 text-[10px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
            <p className="m-0 text-[8.5px] text-ink-700">Receiving Desk · 09:00–18:00</p>
            <p className="m-0 text-[8.5px] text-ink-500">ITPB Road, Bengaluru 560066</p>
          </div>
          <div>
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">SHIP FROM</p>
            <p className="m-0 mt-1 text-[10px] font-bold text-ink-950">Mumbai Warehouse · Dock 4</p>
            <p className="m-0 text-[8.5px] text-ink-700">Dispatch supervisor</p>
            <p className="m-0 text-[8.5px] text-ink-500">MIDC, Andheri East, Mumbai</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1 rounded border border-line bg-canvas px-1.5 py-1.5 font-mono text-[8px]">
          <div><span className="text-business-dk font-bold">TRANSPORT</span><br /><span className="text-ink-950">Road</span></div>
          <div><span className="text-business-dk font-bold">VEHICLE</span><br /><span className="text-ink-950">MH-04-AB-9241</span></div>
          <div><span className="text-business-dk font-bold">DRIVER</span><br /><span className="text-ink-950">Suresh Pawar</span></div>
          <div><span className="text-business-dk font-bold">EXPECTED</span><br /><span className="text-ink-950">26 May</span></div>
        </div>

        <div className="mt-3 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[60px_1fr_30px_30px_30px] gap-1 bg-business px-1.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white">
            <span>SKU</span>
            <span>DESCRIPTION</span>
            <span className="text-right">ORD</span>
            <span className="text-right">DISP</span>
            <span className="text-right">PEN</span>
          </div>
          {[
            ['WS-D32-OAK', 'Standing desk, oak laminate',   '6',  '6',  '0'],
            ['CH-MS-04',   'Ergonomic mesh chair',          '6',  '6',  '0'],
            ['MN-27-4K',   '27-inch 4K monitor',            '6',  '4',  '2'],
            ['CB-USB-2M',  'USB-C cable 100W',              '12', '12', '0'],
            ['PB-PWR-6S',  'Power strip 6 sockets',         '6',  '6',  '0'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[60px_1fr_30px_30px_30px] gap-1 border-t border-line px-1.5 py-1.5 font-mono text-[8.5px] text-ink-900">
              <span className="font-bold text-ink-700">{r[0]}</span>
              <span className="truncate">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right text-business-dk font-bold">{r[3]}</span>
              <span className={`text-right ${r[4] !== '0' ? 'text-warning font-bold' : 'text-ink-500'}`}>{r[4]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-business-bg px-2 py-2 font-mono text-[8.5px]">
          <div><span className="text-business-dk font-bold uppercase">Ordered</span><br /><span className="text-ink-950 text-[10px] font-bold">36</span></div>
          <div><span className="text-business-dk font-bold uppercase">Dispatched</span><br /><span className="text-business text-[10px] font-bold">34</span></div>
          <div><span className="text-business-dk font-bold uppercase">Pending</span><br /><span className="text-warning text-[10px] font-bold">2</span></div>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">Pricing not shown — refer to INV-2026-0241</p>
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
            Pack list in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            signed receipt out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Goods-only documentation: SKU, qty ordered, qty dispatched, qty pending — no rates, no totals. Vehicle + driver + AWB strip. Sender signs on dispatch; consignee signs on receipt. Pricing stays on the invoice where it belongs.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
                    <DeliveryIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">DN Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  5 lines · 14 cartons · road
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['DN #',          'DN-2026-0089'],
                  ['Against PO',    'PO-2026-0117'],
                  ['Consignee',     'Sonchoy Studio, Whitefield'],
                  ['Ship from',     'Westline Mumbai · Dock 4'],
                  ['Transport',     'Road · MH-04-AB-9241'],
                  ['Pack list',     '5 SKUs · 34 of 36 units'],
                  ['Gross weight',  '332 kg · 14 cartons'],
                  ['Expected',      '26 May 2026'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-business/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Dispatched</span>
                <span className="font-mono text-[14px] font-semibold text-paper">34 / 36 units</span>
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
              <DnMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pull from the PO',     'Reference the PO number, copy the items being dispatched. The DN re-uses SKU and description but never repeats the price.'],
  ['02', 'Mark dispatched & pending', 'Per line: qty ordered (from PO) and qty actually dispatched. The tool auto-computes pending. Partial shipments stay flagged so receiving knows what to expect later.'],
  ['03', 'Add transport & dispatch', 'Vehicle / AWB / driver / mode. Optional package block (cartons, gross weight, dimensions, marks). PDF is signed by sender, countersigned at the door.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From dock{' '}
              <em className="font-serif font-normal italic text-crimson-300">to door, on paper.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A delivery note is the document that travels physically with the goods. Drivers carry it; receiving signs it; finance reconciles it against the invoice later. Keep it terse: what shipped, how much, against which PO. Pricing belongs on the invoice — and only the invoice.
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
  { title: 'No prices, ever',          desc: 'Pack list only. SKU, qty ordered, qty dispatched, qty pending — and that\'s it. The driver, gate guards, and receiving staff never see what the goods cost.' },
  { title: 'Partial-ship tracking',    desc: 'Each line shows ordered vs dispatched vs pending. Receiving knows immediately what to expect in a follow-up shipment.' },
  { title: '6 transport modes',        desc: 'Road, rail, air, sea, courier, self-pickup. Pair with vehicle no. or AWB so the driver and consignee can match the document to the consignment.' },
  { title: '7 package types',          desc: 'Carton, pallet, crate, envelope, bag, drum, mixed. Plus package count, gross weight, dimensions, and marks-and-numbers for the bill of lading.' },
  { title: 'Batch & weight per line',   desc: 'Capture batch numbers (for traceability) and per-unit weight (auto-computes line weight and total gross). Helpful for pharma, food, hazardous goods.' },
  { title: 'PDF + 2-sheet XLSX',       desc: 'PDF: branded header, two-column consignee + ship-from block, transport strip, pack-list table, totals strip, optional package details, dual signature. XLSX: Summary + Pack list.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for dispatch</Eyebrow>
          <SectionTitle>
            Everything the{' '}
            <em className="font-serif font-normal italic text-crimson-300">driver carries.</em>
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
  { q: 'Why is there no price on the delivery note?',                a: 'Because the delivery note is the document that travels physically with the goods. Drivers, transport agencies, and gate guards handle it. Putting prices on it leaks commercially-sensitive info and makes the document a target for theft. Pricing lives on the invoice — which goes by email, not by truck.' },
  { q: 'What\'s the difference between a delivery note and a packing slip?', a: 'In most accounting workflows, the two are interchangeable — both list SKUs and quantities without prices, and both ship with the goods. "Delivery note" is more common in India / UK / EU; "packing slip" is more common in the US. This generator can serve either role; the document title and structure work for both.' },
  { q: 'What is a partial dispatch?',                                a: 'When you can\'t ship everything on the PO in one go (inventory shortage, multiple suppliers, custom-make items), you dispatch what\'s ready and send a delivery note that shows ordered vs dispatched vs pending. A second DN follows when the rest ships. The PO number ties them together; receiving reconciles totals against the original PO.' },
  { q: 'Do I need batch numbers or weights?',                       a: 'Depends on the goods. For regulated industries (pharma, food, hazardous chemicals), batch traceability is mandatory — every unit must be traceable to its production lot. For weight: rail and air freight are weight-priced, so capturing per-unit weight makes reconciliation with the freight bill possible. For office-equipment dispatch, neither matters; leave them blank.' },
  { q: 'Should I reference the PO and invoice numbers?',            a: 'Always. The PO ref tells receiving what to expect; the invoice ref tells finance what to reconcile against. Many ERP systems will reject a goods-receipt entry if the DN doesn\'t carry a valid PO ref. Always populate both fields if they exist.' },
  { q: 'Output formats?',                                            a: 'PDF (top accent stripe, your branded header, "DELIVERY NOTE" block top-right with DN # / date / PO ref / invoice ref / status badge, consignee + ship-from two-column block, transport strip with mode / vehicle / driver / expected, pack-list table with SKU + description + ordered + dispatched + pending + unit, totals strip, optional package details, optional notes, dual signature block) and XLSX (2 sheets: Summary + Pack list).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">delivery notes.</em>
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
  { name: 'Purchase Order Generator',   desc: 'Buyer-issued order this DN ships against.',           Icon: POIcon,      label: 'DOCUMENTS', path: '/tools/purchase-order-generator' },
  { name: 'Invoice Generator',          desc: 'Bill the consignee once goods are delivered.',         Icon: InvoiceIcon, label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'Receipt Generator',          desc: 'Confirm payment once the invoice clears.',             Icon: ReceiptIcon, label: 'DOCUMENTS', path: '/tools/receipt-generator' },
  { name: 'GST / VAT Invoice',          desc: 'Tax-compliant invoice for the dispatched goods.',      Icon: InvoiceIcon, label: 'INVOICING', path: '/tools/gst-vat-invoice-generator' },
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

export default function DeliveryNoteGeneratorPage() {
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
