import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  ExpenseIcon, ReceiptIcon, ReportIcon, InvoiceIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, REPORT_STATUSES, EXPENSE_CATEGORIES, PAYMENT_METHODS,
  findCurrency, findReportStatus, findCategory, findPaymentMethod,
  computeTotals, buildCategorySummary, buildPaymentSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/expense-report/compute'
import { generateExpenseReportPdf } from '../lib/expense-report/generatePdf'
import { generateExpenseReportXlsx } from '../lib/expense-report/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Expense Report Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[620px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['11',     'Categories'],
  ['6',      'Payment methods'],
  ['Auto',   'Reimbursable split'],
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
            <span className="text-ink-950">Expense Report Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-business/30 bg-business-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-business">
            <span className="h-1.5 w-1.5 rounded-full bg-business shadow-[0_0_0_4px_rgba(52,208,188,0.25)]" />
            Documents · Reimbursement
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Pile of receipts in{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — one clean
            </em>
            <br />
            report{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Categorised expense reports for reimbursement claims, audit trails, and client billbacks. 11 categories, 6 payment methods, automatic reimbursable / non-reimbursable / billable splits, cash-advance offset, manager &amp; finance sign-off blocks.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Auto category rollup</span>
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
    {
      id: Date.now() + Math.random(),
      date: todayISO(),
      vendor: '',
      description: '',
      categoryId: 'other',
      paymentMethodId: 'personal_card',
      amount: 0,
      tax: 0,
      reimbursable: true,
      billable: false,
      projectCode: '',
      receiptRef: '',
      notes: '',
    },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-business">Expense lines ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-business-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-business transition-colors hover:bg-business/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
        {items.map((it) => {
          const total = (Number(it.amount) || 0) + (Number(it.tax) || 0)
          return (
            <div key={it.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[110px_1fr_22px] items-center gap-1.5">
                <input type="date" value={it.date || ''}
                  onChange={(e) => update(it.id, { date: e.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-business/60 [color-scheme:dark]" />
                <input type="text" value={it.vendor || ''}
                  onChange={(e) => update(it.id, { vendor: e.target.value })}
                  placeholder="Vendor"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-business/60" />
                <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <input type="text" value={it.description || ''}
                onChange={(e) => update(it.id, { description: e.target.value })}
                placeholder="Description (optional)"
                className="mt-1.5 min-h-[26px] w-full rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[11.5px] text-ink-900 outline-none focus:border-business/60" />
              <div className="mt-1.5 grid grid-cols-2 gap-1">
                <select value={it.categoryId} onChange={(e) => update(it.id, { categoryId: e.target.value })}
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] text-ink-900 outline-none focus:border-business/60">
                  {EXPENSE_CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                </select>
                <select value={it.paymentMethodId} onChange={(e) => update(it.id, { paymentMethodId: e.target.value })}
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] text-ink-900 outline-none focus:border-business/60">
                  {PAYMENT_METHODS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
                </select>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1">
                <input type="number" step="any" value={it.amount}
                  onChange={(e) => update(it.id, { amount: Number(e.target.value) || 0 })}
                  placeholder="Amount"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
                <input type="number" step="any" value={it.tax}
                  onChange={(e) => update(it.id, { tax: Number(e.target.value) || 0 })}
                  placeholder="Tax"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
                <input type="text" value={it.receiptRef || ''}
                  onChange={(e) => update(it.id, { receiptRef: e.target.value })}
                  placeholder="Receipt #"
                  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] text-ink-900 outline-none focus:border-business/60" />
              </div>
              <div className="mt-1.5 grid grid-cols-[1fr_1fr_70px] items-center gap-1">
                <label className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-700">
                  <input type="checkbox" checked={!!it.reimbursable}
                    onChange={(e) => update(it.id, { reimbursable: e.target.checked })}
                    className="h-3 w-3 accent-business" /> Reimbursable
                </label>
                <label className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-700">
                  <input type="checkbox" checked={!!it.billable}
                    onChange={(e) => update(it.id, { billable: e.target.checked })}
                    className="h-3 w-3 accent-business" /> Billable
                </label>
                <input type="text" value={it.projectCode || ''}
                  onChange={(e) => update(it.id, { projectCode: e.target.value })}
                  placeholder="Proj #"
                  className="min-h-[24px] rounded border border-line bg-canvas px-1.5 py-0 font-mono text-[10px] text-ink-900 outline-none focus:border-business/60" />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[10.5px]">
                <span className="text-ink-500">Line total</span>
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
  reportNumber: 'EXP-2026-0078',
  reportDate: today,
  periodFrom: '2026-05-04',
  periodTo:   '2026-05-22',
  purpose:    'Mumbai client visit · Northwind Books onboarding',
  statusId:   'submitted',
  currency:   'INR',

  company: {
    name: 'Sonchoy Studio Pvt Ltd',
    address: '7 Brigade Road, Bengaluru, Karnataka 560001',
    email: 'finance@sonchoystudio.com',
    phone: '+91 80 4567 8901',
  },
  claimant: {
    name: 'Priya Mehta',
    employeeId: 'SCY-1042',
    title: 'Senior Account Manager',
    department: 'Client Services',
    email: 'priya@sonchoystudio.com',
    costCenter: 'CS-WEST',
  },
  approver: {
    name: 'Vikram Shah',
    title: 'Director of Client Services',
    department: 'Client Services',
    email: 'vikram@sonchoystudio.com',
  },

  items: [
    { id: 1, date: '2026-05-04', vendor: 'IndiGo Airlines',     description: 'BLR → BOM return (economy)',           categoryId: 'travel',        paymentMethodId: 'corp_card',     amount: 8420,  tax: 1180, reimbursable: true,  billable: true,  projectCode: 'NWB-001', receiptRef: 'IG-7741', notes: '' },
    { id: 2, date: '2026-05-04', vendor: 'Trident Nariman Pt.', description: '3 nights, deluxe twin',                categoryId: 'lodging',       paymentMethodId: 'corp_card',     amount: 18900, tax: 2268, reimbursable: true,  billable: true,  projectCode: 'NWB-001', receiptRef: 'TR-2025-44', notes: '' },
    { id: 3, date: '2026-05-05', vendor: 'Bombay Canteen',      description: 'Client dinner · 4 pax',                 categoryId: 'meals',         paymentMethodId: 'corp_card',     amount: 7860,  tax: 1414, reimbursable: true,  billable: true,  projectCode: 'NWB-001', receiptRef: 'BC-09812', notes: '' },
    { id: 4, date: '2026-05-05', vendor: 'Uber India',          description: 'Hotel → Northwind office · 2 trips',     categoryId: 'transport',     paymentMethodId: 'personal_card', amount: 940,   tax: 0,    reimbursable: true,  billable: true,  projectCode: 'NWB-001', receiptRef: 'UB-44219', notes: '' },
    { id: 5, date: '2026-05-06', vendor: 'Crossword Kemps Corner', description: 'Reference books for client research', categoryId: 'office',        paymentMethodId: 'personal_card', amount: 2240,  tax: 0,    reimbursable: true,  billable: false, projectCode: '',        receiptRef: 'CW-882',    notes: '' },
    { id: 6, date: '2026-05-07', vendor: 'Vodafone Idea',       description: 'Roaming top-up for week',                categoryId: 'communications', paymentMethodId: 'personal_card', amount: 800,   tax: 144,  reimbursable: true,  billable: false, projectCode: '',        receiptRef: 'VI-72211',  notes: '' },
    { id: 7, date: '2026-05-08', vendor: 'Starbucks BKC',       description: 'Personal coffee — not claimed',          categoryId: 'meals',         paymentMethodId: 'personal_card', amount: 480,   tax: 86,   reimbursable: false, billable: false, projectCode: '',        receiptRef: '',          notes: 'Personal' },
    { id: 8, date: '2026-05-21', vendor: 'Figma Inc',           description: 'Monthly subscription for design team',  categoryId: 'software',      paymentMethodId: 'corp_card',     amount: 1240,  tax: 223,  reimbursable: true,  billable: false, projectCode: '',        receiptRef: 'FIG-5512',  notes: '' },
  ],

  cashAdvance: 15000,

  includeCategoryBreakdown: true,
  includePaymentBreakdown:  true,
  includeNotesBlock: true,
  notes: 'Mumbai trip 04–06 May for Northwind Books onboarding kickoff. Most travel + lodging + client-dinner items are billable to the Northwind project (NWB-001). Cash advance of INR 15,000 drawn on 03 May; balance due for reimbursement.',

  includeApprovalBlock: true,
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  void findReportStatus(data.statusId)
  void findCategory
  void findPaymentMethod
  const totals = useMemo(() => computeTotals(data), [data])
  const catSummary = useMemo(() => buildCategorySummary(totals.lines), [totals.lines])
  const pmSummary  = useMemo(() => buildPaymentSummary(totals.lines), [totals.lines])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setCompanyField  = (k) => (v) => setData((s) => ({ ...s, company:  { ...s.company,  [k]: v } }))
  const setClaimantField = (k) => (v) => setData((s) => ({ ...s, claimant: { ...s.claimant, [k]: v } }))
  const setApproverField = (k) => (v) => setData((s) => ({ ...s, approver: { ...s.approver, [k]: v } }))
  const setItems = (items) => setData((s) => ({ ...s, items: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    items: data.items.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateExpenseReportPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateExpenseReportXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
              <ExpenseIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Report · {data.items.length} lines · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Report #" value={data.reportNumber} onChange={setField('reportNumber')} mono />
          <DateInput label="Report date" value={data.reportDate} onChange={setField('reportDate')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DateInput label="Period from" value={data.periodFrom} onChange={setField('periodFrom')} />
          <DateInput label="Period to"   value={data.periodTo}   onChange={setField('periodTo')} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px_140px] gap-2">
          <TextInput label="Purpose" value={data.purpose} onChange={setField('purpose')} />
          <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          <SelectInput label="Status" value={data.statusId} onChange={setField('statusId')}
            options={REPORT_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Company */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Company</span>
        <div className="space-y-2">
          <TextInput label="Company name" value={data.company.name} onChange={setCompanyField('name')} />
          <TextareaInput label="Address" value={data.company.address} onChange={setCompanyField('address')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email" value={data.company.email} onChange={setCompanyField('email')} mono />
            <TextInput label="Phone" value={data.company.phone} onChange={setCompanyField('phone')} mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Claimant */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Claimant</span>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Name"        value={data.claimant.name}       onChange={setClaimantField('name')} />
            <TextInput label="Employee ID" value={data.claimant.employeeId} onChange={setClaimantField('employeeId')} mono />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Title"      value={data.claimant.title}      onChange={setClaimantField('title')} />
            <TextInput label="Department" value={data.claimant.department} onChange={setClaimantField('department')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email"       value={data.claimant.email}       onChange={setClaimantField('email')}      mono />
            <TextInput label="Cost centre" value={data.claimant.costCenter}  onChange={setClaimantField('costCenter')} mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Approver */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Approver / finance</span>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Name"  value={data.approver.name}  onChange={setApproverField('name')} />
            <TextInput label="Title" value={data.approver.title} onChange={setApproverField('title')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email"      value={data.approver.email}      onChange={setApproverField('email')} mono />
            <TextInput label="Department" value={data.approver.department} onChange={setApproverField('department')} />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Items */}
        <ItemList items={data.items} setItems={setItems} />

        <div className="my-3.5 h-px bg-line" />

        {/* Cash advance */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Cash advance &amp; sections</span>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Cash advance drawn" value={data.cashAdvance} onChange={setField('cashAdvance')} suffix={cur.code} />
        </div>
        <div className="mt-3 space-y-2">
          <ToggleRow label="Category breakdown" desc="Rollup table on PDF"
            checked={data.includeCategoryBreakdown} onChange={setField('includeCategoryBreakdown')} />
          <ToggleRow label="Payment-method breakdown" desc="By card / cash / UPI"
            checked={data.includePaymentBreakdown} onChange={setField('includePaymentBreakdown')} />
          <ToggleRow label="Notes block" desc="Free-text rationale"
            checked={data.includeNotesBlock} onChange={setField('includeNotesBlock')} />
          <ToggleRow label="Approval block" desc="Claimant + approver signatures"
            checked={data.includeApprovalBlock} onChange={setField('includeApprovalBlock')} />
        </div>
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
          {totals.nonReimbursable > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Non-reimbursable</span>
              <span className="text-ink-950">- {formatNumber(totals.nonReimbursable)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Reimbursable</span>
            <span className="text-ink-950">{formatNumber(totals.reimbursable)}</span>
          </div>
          {totals.cashAdvance > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Less: advance</span>
              <span className="text-ink-950">- {formatNumber(totals.cashAdvance)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Net due</span>
            <span className="font-mono text-[14px] font-bold text-business">{cur.code} {formatNumber(totals.netDue)}</span>
          </div>
          {totals.billable > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500 italic">Billable to client</span>
              <span className="text-ink-700 italic">{formatNumber(totals.billable)}</span>
            </div>
          )}
        </div>

        {catSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">By category</p>
            <div className="space-y-1.5">
              {catSummary.map((c) => (
                <div key={c.id} className="flex items-center gap-2 font-mono text-[10.5px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: `rgb(${c.color.join(',')})` }} />
                  <span className="flex-1 text-ink-900">{c.label}</span>
                  <span className="text-ink-500">{formatNumber(c.pct)}%</span>
                  <span className="w-20 text-right text-ink-950">{formatNumber(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pmSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">By payment</p>
            <div className="space-y-1.5">
              {pmSummary.map((p) => (
                <div key={p.id} className="flex items-center gap-2 font-mono text-[10.5px]">
                  <span className="flex-1 text-ink-900">{p.label}</span>
                  <span className="text-ink-500">{p.count}×</span>
                  <span className="w-20 text-right text-ink-950">{formatNumber(p.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-business/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-business">Net due to claimant</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.items.length} items
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.netDue, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Expense Report PDF'}
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

function ReportMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-business" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">Brigade Road, Bengaluru 560001</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[16px] font-bold tracking-[-0.01em] text-business">EXPENSE REPORT</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">EXP-2026-0078 · 23 May 2026</p>
            <p className="m-0 text-[9px] text-ink-500">Period: 04–22 May 2026</p>
            <span className="mt-1 inline-block rounded bg-info px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-white">SUBMITTED</span>
          </div>
        </div>

        <div className="mt-4 h-px bg-business/40" />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">CLAIMANT</p>
            <p className="m-0 mt-1 text-[10px] font-bold text-ink-950">Priya Mehta</p>
            <p className="m-0 text-[8.5px] text-ink-700">Senior Account Manager · SCY-1042</p>
            <p className="m-0 text-[8.5px] text-ink-500">Client Services · CS-WEST</p>
          </div>
          <div>
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">APPROVER</p>
            <p className="m-0 mt-1 text-[10px] font-bold text-ink-950">Vikram Shah</p>
            <p className="m-0 text-[8.5px] text-ink-700">Director of Client Services</p>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[50px_1fr_60px_60px] gap-1 bg-business px-1.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white">
            <span>DATE</span>
            <span>VENDOR · CATEGORY</span>
            <span className="text-right">AMOUNT</span>
            <span className="text-right">TOTAL</span>
          </div>
          {[
            ['04 May', 'IndiGo Airlines · Travel',       '8,420',  '9,600'],
            ['04 May', 'Trident Nariman Pt · Lodging',   '18,900', '21,168'],
            ['05 May', 'Bombay Canteen · Meals',         '7,860',  '9,274'],
            ['05 May', 'Uber India · Transport',          '940',    '940'],
            ['08 May', 'Starbucks · Personal',            '480',    '566'],
          ].map((r) => (
            <div key={r[0] + r[1]} className="grid grid-cols-[50px_1fr_60px_60px] gap-1 border-t border-line px-1.5 py-1.5 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-500">{r[0]}</span>
              <span className="truncate">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right font-bold">{r[3]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 ml-auto w-[65%] text-[9px]">
          {[
            ['Grand total',          '46,575'],
            ['Non-reimbursable',     '- 566'],
            ['Reimbursable',         '46,009'],
            ['Less: cash advance',   '- 15,000'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-0.5 font-mono text-ink-700">
              <span>{k}</span>
              <span className="text-ink-950">{v}</span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-business pt-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-business-dk">Net due</span>
            <span className="text-[12px] font-bold text-business-dk">INR 31,009</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ category &amp; payment breakdowns and signatures in the full PDF</p>
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
            Receipts in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            manager-ready report out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Itemised expense lines with date, vendor, category, payment method, amount, tax. Automatic reimbursable / non-reimbursable / billable splits. Cash advance offset. Manager &amp; finance sign-off block. Sent for approval in under a minute.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
                    <ExpenseIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Expense Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  8 lines · INR
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Report #',      'EXP-2026-0078'],
                  ['Period',        '04 – 22 May 2026'],
                  ['Claimant',      'Priya Mehta · SCY-1042'],
                  ['Purpose',       'Mumbai · Northwind onboarding'],
                  ['Items',         '8 lines · 6 categories'],
                  ['Grand total',   'INR 46,575'],
                  ['Cash advance',  'INR 15,000 (offset)'],
                  ['Billable',      'INR 41,952 to NWB-001'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-business/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Net due</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 31,009</span>
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
                  Approve-ready
                </span>
              </div>
              <ReportMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Capture every receipt',  'One row per receipt: date, vendor, description, category, payment method, amount, tax, receipt ref. Tag reimbursable / billable / project code per line.'],
  ['02', 'Set advance & approver', 'Cash advance drawn before the trip is netted against the reimbursable subtotal. Pick the approver block (manager or finance).'],
  ['03', 'Export & submit',         'PDF: branded header, claimant + approver block, line-item table with category pills, totals with reimbursable & billable splits, by-category and by-payment breakdowns, signature block. XLSX with 4 sheets.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From wallet pile{' '}
              <em className="font-serif font-normal italic text-crimson-300">to approved claim.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Expense reports usually fail in the gap between "I have receipts somewhere" and "finance can reconcile this." This tool keeps the structure straight: every line is dated, categorised, tagged, and totalled. Submission becomes a one-click PDF instead of a Friday-afternoon panic.
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
  { title: '11 expense categories',     desc: 'Travel, lodging, meals, transport, fuel, office, software, comms, training, entertainment, other. Each gets its own colour pill on the PDF and rolls up in the breakdown.' },
  { title: 'Reimbursable vs not',       desc: 'Per-line checkbox. Personal coffee on a business trip stays in the report but never enters the reimbursable subtotal. Auditors love it.' },
  { title: 'Billable to client',        desc: 'Tag lines as billable with a project code. The PDF shows a "billable to client" total under the net due — easy invoice-back to the client.' },
  { title: 'Cash advance offset',       desc: 'Subtract a pre-trip advance from the reimbursable subtotal. The net-due figure is what finance actually pays out.' },
  { title: 'Category & payment rollups', desc: 'Two breakdown tables on the PDF: spend by category (with %) and spend by payment method (corp card / personal / cash / UPI).' },
  { title: 'PDF + 4-sheet XLSX',        desc: 'PDF: branded header, claimant + approver block, line-item table with category pills, totals, breakdowns, dual signature. XLSX: Summary, Line items, By category, By payment.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for finance</Eyebrow>
          <SectionTitle>
            Every field the{' '}
            <em className="font-serif font-normal italic text-crimson-300">approver expects.</em>
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
  { q: 'How is this different from the Expense Tracker Sheet?', a: 'The Tracker Sheet is for ongoing logging — every business expense as it happens, across the year. This Expense Report Generator is for a single claim or trip: you take a slice of receipts, categorise them, and produce a PDF for approval and reimbursement. Many teams use both: log everything in the tracker, then export a slice into a report when reimbursement time comes.' },
  { q: 'What counts as reimbursable?',                          a: 'Anything paid out-of-pocket by the employee on a company-approved expense (travel, client meals, software bought personally, etc.). What doesn\'t count: personal items, items already paid on a corporate card (the company already paid the vendor), or items outside the approved policy. Each line gets its own reimbursable checkbox so you can include policy-edge items but flag them clearly.' },
  { q: 'What\'s a billable expense?',                            a: 'An expense that you\'ll later charge back to a client. Common on consulting and professional-services engagements where travel or out-of-pocket project costs are billed at cost (sometimes with a markup) on the client invoice. Tag the line as billable, attach the project code, and the PDF shows a total billable amount separately from the reimbursable total.' },
  { q: 'Should I subtract the cash advance from the report?',   a: 'Yes — that\'s why the field exists. If you drew a INR 15,000 advance before the trip and the reimbursable subtotal is INR 46,000, the net due to you from finance is INR 31,000 (and you don\'t return any of the advance separately). If the advance was larger than the actual spend, the net-due goes negative and you owe the company the difference.' },
  { q: 'Should I attach the original receipts?',                a: 'Yes, separately. The PDF report is the categorised summary that finance approves. Most policies require scanned receipts (or the original paper) attached or filed alongside the report for audit. The receipt-ref field on each line lets you cross-reference the original.' },
  { q: 'Output formats?',                                        a: 'PDF (top accent stripe, branded company header, "EXPENSE REPORT" block top-right with report # / date / period / purpose / status badge, claimant + approver two-column block, line-item table with category colour-pills, right-aligned totals with reimbursable / non-reimbursable / cash-advance / net-due rows, optional category and payment-method breakdown tables, optional notes, dual signature block) and XLSX (4 sheets: Summary, Line items, By category, By payment).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">expense reports.</em>
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
  { name: 'Expense Tracker Sheet',     desc: 'Log every expense across the year in XLSX.',          Icon: ExpenseIcon, label: 'ACCOUNTING', path: '/tools/expense-tracker-sheet' },
  { name: 'Receipt Generator',         desc: 'Issue receipts you can attach to the report.',         Icon: ReceiptIcon, label: 'DOCUMENTS',  path: '/tools/receipt-generator' },
  { name: 'Business Expense Breakdown', desc: 'Category-level spend across the company.',            Icon: ReportIcon,  label: 'ACCOUNTING', path: '/tools/business-expense-breakdown' },
  { name: 'Invoice Generator',         desc: 'Bill back the billable lines to the client.',          Icon: InvoiceIcon, label: 'INVOICING',  path: '/tools/invoice-generator' },
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

export default function ExpenseReportGeneratorPage() {
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
