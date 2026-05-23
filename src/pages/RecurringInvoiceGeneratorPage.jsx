import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  RecurringIcon, InvoiceIcon, TaxInvoiceIcon, QuoteIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, FREQUENCIES, PAYMENT_TERMS, RECURRING_STATUSES,
  END_CONDITIONS, AUTO_SEND_MODES, DISCOUNT_TYPES,
  findCurrency, findStatus, findFrequency, findPaymentTerm, findEndCondition, findAutoSend, findDiscountType,
  computeInvoiceTotals, projectSchedule, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/recurring-invoice/compute'
import { generateRecurringInvoicePdf } from '../lib/recurring-invoice/generatePdf'
import { generateRecurringInvoiceXlsx } from '../lib/recurring-invoice/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Recurring Invoice Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['6',       'Frequencies'],
  ['Auto',    'Due-date math'],
  ['ARR',     'Annualised view'],
  ['Free',    'Always · no signup'],
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
            <span className="text-ink-950">Recurring Invoice Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-invoicing/30 bg-invoicing-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-invoicing">
            <span className="h-1.5 w-1.5 rounded-full bg-invoicing shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
            Invoicing · Retainers &amp; subscriptions
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Set a cadence{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — we draft
            </em>
            <br />
            every{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              cycle&rsquo;s invoice.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Build a recurring-invoice schedule for retainers, subscriptions, and managed-services contracts. Pick the cadence, start date, and end condition; the tool projects every upcoming invoice, computes annualised revenue, and exports the full schedule alongside the per-cycle template.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Auto invoice numbering</span>
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
    { id: Date.now() + Math.random(), description: '', qty: 1, rate: 0, taxPct: 18, taxable: true },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-invoicing">Template lines ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-invoicing-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-invoicing transition-colors hover:bg-invoicing/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
        {items.map((it) => {
          const qty = Number(it.qty) || 0
          const rate = Number(it.rate) || 0
          const taxable = it.taxable && (Number(it.taxPct) || 0) > 0
          const total = qty * rate * (1 + (taxable ? (Number(it.taxPct) || 0) / 100 : 0))
          return (
            <div key={it.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
                <input type="text" value={it.description || ''}
                  onChange={(e) => update(it.id, { description: e.target.value })}
                  placeholder="Description (e.g. Monthly retainer · Tier 2)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-invoicing/60" />
                <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
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
                  <span className="text-ink-500">Per cycle</span>
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
  scheduleId: 'RCR-2026-008',
  statusId: 'active',
  currency: 'INR',

  frequencyId: 'monthly',
  paymentTermId: 'net_15',
  startDate: '2026-06-01',
  endConditionId: 'after_count',
  occurrenceCount: 12,
  endDate: '',
  autoSendModeId: 'email_draft',

  invoiceNumberPrefix: 'NWB-RTN',
  invoiceNumberStart: 1,

  from: {
    name: 'Alex Hartwell',
    businessName: 'Hartwell Studio Pvt Ltd',
    address: '12 Lavelle Road, Bengaluru, Karnataka 560001',
    email: 'billing@hartwellstudio.com',
    phone: '+91 98456 71203',
    website: 'hartwellstudio.com',
    taxId: 'GSTIN 29ABCDE1234F1Z5',
  },
  to: {
    companyName: 'Northwind Books Pvt Ltd',
    contactName: 'Marcus Vance · Marketing Director',
    address: 'Brigade Gateway, Malleshwaram, Bengaluru 560055',
    email: 'marcus@northwindbooks.in',
    taxId: 'GSTIN 29XYZAB5678C1Z2',
  },

  items: [
    { id: 1, description: 'Monthly retainer · brand & content advisory (10 hrs)', qty: 1, rate: 65000, taxPct: 18, taxable: true },
    { id: 2, description: 'Monthly retainer · design production (8 hrs)',          qty: 1, rate: 48000, taxPct: 18, taxable: true },
    { id: 3, description: 'Software & tooling pass-through',                       qty: 1, rate: 4500,  taxPct: 18, taxable: true },
  ],

  discountType: 'none',
  discountValue: 0,

  includePaymentBlock: true,
  payment: {
    bankName: 'HDFC Bank · Brigade Road branch',
    accountName: 'Hartwell Studio Pvt Ltd',
    accountNumber: 'XXXX XXXX 7102',
    ifsc: 'HDFC0001234',
    upi: 'hartwell@hdfcbank',
    autopayLink: 'https://buy.stripe.com/hartwell-recurring-nwb',
  },

  includeTermsBlock: true,
  terms: 'Each cycle\'s invoice is issued on the first business day of the month and is due Net 15. Payment by bank transfer or auto-pay via the Stripe link above. Late payment incurs interest at 1.5% per month or part-month after the due date. Either party may end this engagement with 30 days\' written notice; cancellation takes effect at the end of the current billing cycle.',

  includeNotesBlock: true,
  notes: 'Recurring retainer for the Northwind Books brand & content engagement, locked in at FY 2026-27 rates. Hours not used in a given month do not roll over to the next month. Additional work outside the retainer is quoted and invoiced separately.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  void findStatus(data.statusId)
  void findFrequency(data.frequencyId)
  void findPaymentTerm(data.paymentTermId)
  void findEndCondition(data.endConditionId)
  void findAutoSend(data.autoSendModeId)
  void findDiscountType(data.discountType)
  void computeInvoiceTotals(data)
  const projection = useMemo(() => projectSchedule(data, 12), [data])
  const totals = projection.totals
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

  const handlePdf  = async () => { try { setBusy('pdf');  generateRecurringInvoicePdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateRecurringInvoiceXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
              <RecurringIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Schedule · {data.items.length} lines · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Schedule #" value={data.scheduleId} onChange={setField('scheduleId')} mono />
          <SelectInput label="Status" value={data.statusId} onChange={setField('statusId')}
            options={RECURRING_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Cadence */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Cadence &amp; lifespan</span>
        <div className="grid grid-cols-3 gap-2">
          <SelectInput label="Frequency" value={data.frequencyId} onChange={setField('frequencyId')}
            options={FREQUENCIES.map((f) => ({ value: f.id, label: f.label }))} />
          <DateInput label="Start date" value={data.startDate} onChange={setField('startDate')} />
          <SelectInput label="Payment terms" value={data.paymentTermId} onChange={setField('paymentTermId')}
            options={PAYMENT_TERMS.map((p) => ({ value: p.id, label: p.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="End condition" value={data.endConditionId} onChange={setField('endConditionId')}
            options={END_CONDITIONS.map((e) => ({ value: e.id, label: e.label }))} />
          {data.endConditionId === 'after_count' && (
            <NumberInput label="Occurrence count" value={data.occurrenceCount} onChange={setField('occurrenceCount')} suffix="cycles" />
          )}
          {data.endConditionId === 'on_date' && (
            <DateInput label="End date" value={data.endDate} onChange={setField('endDate')} />
          )}
        </div>
        <div className="mt-2">
          <SelectInput label="Auto-send" value={data.autoSendModeId} onChange={setField('autoSendModeId')}
            options={AUTO_SEND_MODES.map((a) => ({ value: a.id, label: a.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px_120px] gap-2">
          <TextInput label="Invoice # prefix" value={data.invoiceNumberPrefix} onChange={setField('invoiceNumberPrefix')} mono />
          <NumberInput label="Start at" value={data.invoiceNumberStart} onChange={setField('invoiceNumberStart')} />
          <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* From */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">From (your business)</span>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Your name" value={data.from.name} onChange={setFromField('name')} />
            <TextInput label="Business name" value={data.from.businessName} onChange={setFromField('businessName')} />
          </div>
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

        {/* Discount */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Per-cycle discount</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Discount" value={data.discountType} onChange={setField('discountType')}
            options={DISCOUNT_TYPES.map((d) => ({ value: d.id, label: d.label }))} />
          {data.discountType !== 'none' && (
            <NumberInput label="Discount value" value={data.discountValue} onChange={setField('discountValue')}
              suffix={data.discountType === 'percent' ? '%' : cur.code} />
          )}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Optional sections */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Optional sections</span>
        <div className="space-y-2">
          <ToggleRow label="How-to-pay block" desc="Bank / UPI / auto-pay link on each PDF"
            checked={data.includePaymentBlock} onChange={setField('includePaymentBlock')} />
          <ToggleRow label="Terms block" desc="Net days, late fee, cancellation clause"
            checked={data.includeTermsBlock} onChange={setField('includeTermsBlock')} />
          <ToggleRow label="Notes block" desc="Engagement context"
            checked={data.includeNotesBlock} onChange={setField('includeNotesBlock')} />
        </div>
        {data.includePaymentBlock && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Bank"          value={data.payment.bankName}    onChange={setPaymentField('bankName')} />
              <TextInput label="Account name"  value={data.payment.accountName} onChange={setPaymentField('accountName')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Account #"     value={data.payment.accountNumber} onChange={setPaymentField('accountNumber')} mono />
              <TextInput label="IFSC / SWIFT"  value={data.payment.ifsc}          onChange={setPaymentField('ifsc')}          mono />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="UPI / PayID"    value={data.payment.upi}         onChange={setPaymentField('upi')}         mono />
              <TextInput label="Auto-pay link"  value={data.payment.autopayLink} onChange={setPaymentField('autopayLink')} mono />
            </div>
          </div>
        )}
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

        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
          <div>
            <p className="m-0 mb-0.5 text-[9px] uppercase tracking-[0.1em] text-ink-500">Per cycle</p>
            <p className="m-0 text-ink-950">{cur.code} {formatNumber(totals.grandTotal)}</p>
          </div>
          <div>
            <p className="m-0 mb-0.5 text-[9px] uppercase tracking-[0.1em] text-ink-500">Annualised</p>
            <p className="m-0 text-ink-950">{cur.code} {formatNumber(projection.annualisedRevenue || 0)}</p>
          </div>
          <div>
            <p className="m-0 mb-0.5 text-[9px] uppercase tracking-[0.1em] text-ink-500">Occurrences</p>
            <p className="m-0 text-ink-950">{projection.plannedCount == null ? 'Open-ended' : projection.plannedCount}</p>
          </div>
          <div>
            <p className="m-0 mb-0.5 text-[9px] uppercase tracking-[0.1em] text-ink-500">Lifetime value</p>
            <p className="m-0 text-ink-950">{projection.totalProjectedRevenue == null ? '—' : `${cur.code} ${formatNumber(projection.totalProjectedRevenue)}`}</p>
          </div>
        </div>

        {/* Schedule preview */}
        {projection.occurrences.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Next {projection.occurrences.length} {projection.occurrences.length === 1 ? 'invoice' : 'invoices'}
              {projection.plannedCount != null && projection.plannedCount > projection.occurrences.length
                ? `  ·  of ${projection.plannedCount}`
                : ''}
            </p>
            <div className="max-h-[180px] overflow-y-auto pr-1">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">#</th>
                    <th className="py-1 font-normal">Invoice</th>
                    <th className="py-1 font-normal">Issue</th>
                    <th className="py-1 font-normal">Due</th>
                    <th className="py-1 text-right font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {projection.occurrences.map((o) => (
                    <tr key={o.n} className="border-t border-line">
                      <td className="py-1 text-ink-500">{o.n}</td>
                      <td className="py-1 text-ink-950">{o.invoiceNumber}</td>
                      <td className="py-1 text-ink-700">{formatDate(o.issueDate)}</td>
                      <td className="py-1 text-ink-700">{formatDate(o.dueDate)}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-invoicing/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-invoicing">Lifetime value</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {projection.plannedCount == null ? 'open-ended' : `${projection.plannedCount} × ${formatMoney(totals.grandTotal, data.currency)}`}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {projection.totalProjectedRevenue == null
              ? `${formatMoney(projection.annualisedRevenue || 0, data.currency)} / yr`
              : formatMoney(projection.totalProjectedRevenue, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Schedule PDF'}
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

function ScheduleMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-invoicing" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Hartwell Studio Pvt Ltd</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">Lavelle Road, Bengaluru 560001</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[14px] font-bold tracking-[-0.01em] text-invoicing">RECURRING INVOICE</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">RCR-2026-008</p>
            <p className="m-0 text-[9px] text-ink-500">Monthly · Net 15</p>
            <span className="mt-1 inline-block rounded bg-success px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-white">ACTIVE</span>
          </div>
        </div>

        <div className="mt-4 h-px bg-invoicing/40" />

        <div className="mt-3">
          <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-invoicing-dk">BILL TO</p>
          <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">Northwind Books Pvt Ltd</p>
          <p className="m-0 text-[9px] text-ink-700">Marcus Vance · Marketing Director</p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1 rounded border border-line bg-canvas px-1.5 py-1.5 font-mono text-[8px]">
          <div><span className="text-invoicing-dk font-bold">PER CYCLE</span><br /><span className="text-ink-950 text-[10px] font-bold">INR 1,38,650</span></div>
          <div><span className="text-invoicing-dk font-bold">ANNUALISED</span><br /><span className="text-ink-950 text-[10px] font-bold">INR 16,63,800</span></div>
          <div><span className="text-invoicing-dk font-bold">OCCURRENCES</span><br /><span className="text-ink-950 text-[10px] font-bold">12</span></div>
          <div><span className="text-invoicing-dk font-bold">LIFETIME</span><br /><span className="text-ink-950 text-[10px] font-bold">INR 16,63,800</span></div>
        </div>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-invoicing-dk">PROJECTED SCHEDULE</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[16px_60px_50px_50px_60px] gap-1 bg-canvas px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-invoicing-dk">
            <span>#</span><span>INVOICE</span><span>ISSUE</span><span>DUE</span><span className="text-right">AMOUNT</span>
          </div>
          {[
            ['1', 'NWB-RTN-0001', '01 Jun', '16 Jun'],
            ['2', 'NWB-RTN-0002', '01 Jul', '16 Jul'],
            ['3', 'NWB-RTN-0003', '01 Aug', '16 Aug'],
            ['4', 'NWB-RTN-0004', '01 Sep', '16 Sep'],
            ['5', 'NWB-RTN-0005', '01 Oct', '16 Oct'],
            ['6', 'NWB-RTN-0006', '01 Nov', '16 Nov'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[16px_60px_50px_50px_60px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-500">{r[0]}</span>
              <span>{r[1]}</span>
              <span className="text-ink-700">{r[2]}</span>
              <span className="text-ink-700">{r[3]}</span>
              <span className="text-right font-bold">1,38,650</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-2 text-[8.5px] italic text-ink-500">+ 6 more occurrences and full payment / terms blocks in the PDF</p>
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
            One template in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            every cycle&rsquo;s invoice out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Set the per-cycle template once. The tool projects every upcoming invoice with its issue date, due date, and auto-numbered invoice ID. Annualised revenue and lifetime value compute as you type.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <RecurringIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Schedule Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Monthly · 12 cycles
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Schedule #',     'RCR-2026-008'],
                  ['Frequency',      'Monthly · starting 01 Jun 2026'],
                  ['Payment terms',  'Net 15'],
                  ['End condition',  'After 12 occurrences'],
                  ['Client',         'Northwind Books Pvt Ltd'],
                  ['Template lines', '3 (retainer + production + tooling)'],
                  ['Per-cycle total', 'INR 1,38,650'],
                  ['Annualised',     'INR 16,63,800'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-invoicing/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-invoicing">Lifetime value</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 16,63,800</span>
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
                  Schedule-ready
                </span>
              </div>
              <ScheduleMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Set the cadence',        'Frequency (weekly / bi-weekly / monthly / quarterly / half-year / annual), start date, payment terms. The due-date math is automatic — every cycle\'s due date computes from its issue date and the payment terms.'],
  ['02', 'Pick the lifespan',       'End after N cycles, end on a specific date, or run open-ended until cancelled. Open-ended schedules show annualised revenue; bounded schedules also show a finite lifetime value.'],
  ['03', 'Define the template',     'Add per-cycle line items. The same template generates every invoice — auto-numbered (NWB-RTN-0001, 0002, 0003 …). Add a how-to-pay block, terms, and notes once and they print on every cycle.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From signed retainer{' '}
              <em className="font-serif font-normal italic text-crimson-300">to recurring revenue.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Recurring revenue dies when invoicing slips. This tool fixes that with a single canonical template, automatic per-cycle invoice numbers, and a projected schedule the client can countersign. Set it once; bill it every cycle.
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
  { title: '6 cadence presets',         desc: 'Weekly, bi-weekly, monthly, quarterly, half-year, annual. Pick one and the schedule projects every issue and due date forward.' },
  { title: 'Three end conditions',       desc: 'End after N occurrences (e.g. 12 monthly retainer cycles), end on a specific date (annual contract expiring 31 Mar), or run open-ended until cancelled (subscription).' },
  { title: 'Auto invoice numbering',     desc: 'Set a prefix (NWB-RTN) and a starting number (0001). Every projected invoice picks up the next number automatically — no clashes, no manual sequencing.' },
  { title: 'Annualised + lifetime view', desc: 'See per-cycle total, annualised revenue (cycles per year × per-cycle), planned occurrences, and lifetime projected value. Bounded schedules show finite LTV; open-ended schedules show annualised run-rate.' },
  { title: 'Send-mode presets',          desc: 'Draft only (you send manually), email draft to me (I review before sending), auto-send (tool emails the client every cycle). Picks your invoicing-discipline level.' },
  { title: 'PDF + 3-sheet XLSX',         desc: 'PDF: branded header, schedule details, bill-to, hero stats, template line items, projected schedule table (24-row preview), payment block, terms, notes. XLSX: Summary, Template, full Schedule.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for retainers</Eyebrow>
          <SectionTitle>
            One template{' '}
            <em className="font-serif font-normal italic text-crimson-300">— every cycle.</em>
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
  { q: 'How does the projected schedule differ from auto-sent invoices?', a: 'The schedule is a forward-looking plan — every invoice that will issue under this cadence, with its number, issue date, due date, and amount. The PDF you generate today shows the schedule so the client knows exactly what to expect over the contract term. Whether each cycle\'s invoice is actually sent automatically depends on the send-mode you pick (draft / email draft / auto-send) and whether your billing stack supports auto-send.' },
  { q: 'What\'s the difference between weekly and bi-weekly?',           a: 'Weekly = 52 invoices per year (every 7 days). Bi-weekly = 26 invoices per year (every 14 days). Choose carefully — the annualised revenue figure changes substantially: a weekly INR 10,000 retainer is INR 5.2 lakh per year; a bi-weekly INR 10,000 retainer is INR 2.6 lakh per year.' },
  { q: 'Why are open-ended schedules shown as "annualised" instead of "lifetime"?', a: 'Lifetime value requires a finite endpoint. For "never until cancelled" subscriptions, we don\'t know when (or if) it ends, so we show the annualised run-rate instead — cycles per year × per-cycle total. That\'s the right number for projecting recurring revenue at the company level.' },
  { q: 'How does invoice numbering work?',                                 a: 'You set a prefix (e.g. NWB-RTN) and a starting number (e.g. 1). The tool pads the number to four digits and increments per occurrence: NWB-RTN-0001 on the first cycle, NWB-RTN-0002 on the second, and so on. The numbers are predictable so your accounting system can be told to expect them, and the client sees a clean sequence each month.' },
  { q: 'Can I have a per-cycle discount?',                                 a: 'Yes — set the discount type (percentage or flat) and value. The discount applies to every cycle, so a 10% discount on a monthly INR 1,38,650 retainer reduces every monthly invoice by INR 13,865. The total project value reflects the discounted per-cycle amount.' },
  { q: 'Output formats?',                                                   a: 'PDF (top accent stripe, your business header, "RECURRING INVOICE" block top-right with schedule # / frequency / start / payment terms / end condition / auto-send mode / status, bill-to block, four-tile hero stats (per cycle, annualised, occurrences, lifetime value), template line items with per-cycle total bar, projected schedule table for the next 24 occurrences, optional payment block, optional terms, optional notes) and XLSX (3 sheets: Summary, Template, Schedule — Schedule contains up to 200 projected occurrences for the full term).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">recurring invoices.</em>
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
  { name: 'Invoice Generator',         desc: 'One-off itemised invoice for non-recurring work.', Icon: InvoiceIcon,    label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'Freelance Invoice',         desc: 'Mix hours, days, retainers on one invoice.',       Icon: InvoiceIcon,    label: 'INVOICING', path: '/tools/freelance-invoice-generator' },
  { name: 'Tax Invoice Generator',     desc: 'HSN/SAC, GST-compliant single invoice.',           Icon: TaxInvoiceIcon, label: 'INVOICING', path: '/tools/tax-invoice-generator' },
  { name: 'Quotation Generator',       desc: 'Quote the retainer before the schedule starts.',   Icon: QuoteIcon,      label: 'DOCUMENTS', path: '/tools/quotation-generator' },
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

export default function RecurringInvoiceGeneratorPage() {
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
