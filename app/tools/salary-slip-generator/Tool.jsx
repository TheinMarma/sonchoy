'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  PayslipIcon, PayrollIcon, ExpenseIcon, ReportIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, PAY_FREQUENCIES, PAYMENT_MODES, EMPLOYMENT_TYPES,
  findCurrency, findPayFrequency, findPaymentMode, findEmploymentType,
  computeTotals, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/salary-slip/compute'
import { generateSalarySlipPdf } from '@/lib/salary-slip/generatePdf'
import { generateSalarySlipXlsx } from '@/lib/salary-slip/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Salary Slip Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[620px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['YTD',    'Year-to-date totals'],
  ['4',      'Pay frequencies'],
  ['Auto',   'LOP & net pay'],
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
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-business">Documents</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Salary Slip Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-business/30 bg-business-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-business">
            <span className="h-1.5 w-1.5 rounded-full bg-business shadow-[0_0_0_4px_rgba(52,208,188,0.25)]" />
            Documents · Payroll
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Earnings, deductions,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              YTD —
            </em>
            <br />
            one clean{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              payslip.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Branded payslips with side-by-side earnings &amp; deductions, statutory + tax + other deduction types, automatic LOP days, gross / net / take-home math, year-to-date totals, bank-credit block, and HR-finance sign-off.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> YTD-aware</span>
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

/* ---------- Earning / Deduction lists ---------- */

function EarningsList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), label: '', amount: 0, ytd: 0, taxable: true },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-business">Earnings ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-business-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-business transition-colors hover:bg-business/20">
          <Plus size={9} /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-[1fr_90px_90px_60px_22px] items-center gap-1.5 rounded-md border border-line bg-paper p-1.5">
            <input type="text" value={it.label || ''}
              onChange={(e) => update(it.id, { label: e.target.value })}
              placeholder="Label (e.g. Basic)"
              className="min-h-[26px] rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[12px] text-ink-900 outline-none focus:border-business/60" />
            <input type="number" step="any" value={it.amount}
              onChange={(e) => update(it.id, { amount: Number(e.target.value) || 0 })}
              placeholder="Amount"
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
            <input type="number" step="any" value={it.ytd}
              onChange={(e) => update(it.id, { ytd: Number(e.target.value) || 0 })}
              placeholder="YTD"
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-500 outline-none focus:border-business/60" />
            <label className="inline-flex items-center justify-center gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700">
              <input type="checkbox" checked={!!it.taxable}
                onChange={(e) => update(it.id, { taxable: e.target.checked })}
                className="h-3 w-3 accent-business" /> Tax
            </label>
            <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeductionsList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), label: '', amount: 0, ytd: 0, type: 'other' },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-business">Deductions ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-business-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-business transition-colors hover:bg-business/20">
          <Plus size={9} /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-[1fr_90px_90px_80px_22px] items-center gap-1.5 rounded-md border border-line bg-paper p-1.5">
            <input type="text" value={it.label || ''}
              onChange={(e) => update(it.id, { label: e.target.value })}
              placeholder="Label (e.g. PF)"
              className="min-h-[26px] rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[12px] text-ink-900 outline-none focus:border-business/60" />
            <input type="number" step="any" value={it.amount}
              onChange={(e) => update(it.id, { amount: Number(e.target.value) || 0 })}
              placeholder="Amount"
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-business/60" />
            <input type="number" step="any" value={it.ytd}
              onChange={(e) => update(it.id, { ytd: Number(e.target.value) || 0 })}
              placeholder="YTD"
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-500 outline-none focus:border-business/60" />
            <select value={it.type} onChange={(e) => update(it.id, { type: e.target.value })}
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10.5px] text-ink-900 outline-none focus:border-business/60">
              <option value="statutory">Statutory</option>
              <option value="tax">Tax</option>
              <option value="other">Other</option>
            </select>
            <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const today = todayISO()

const INITIAL = {
  slipNumber: 'PSL-2026-05-1042',
  payPeriod: 'May 2026',
  payDate: today,
  payFrequencyId: 'monthly',
  paymentModeId: 'bank',
  currency: 'INR',

  company: {
    name: 'Sonchoy Studio Pvt Ltd',
    address: '7 Brigade Road, Bengaluru, Karnataka 560001',
    email: 'payroll@sonchoystudio.com',
    phone: '+91 80 4567 8901',
    taxId: 'PAN AABCS1234F',
  },
  employee: {
    name: 'Priya Mehta',
    employeeId: 'SCY-1042',
    designation: 'Senior Account Manager',
    department: 'Client Services',
    dateOfJoining: '2023-04-17',
    employmentTypeId: 'full_time',
    taxId: 'PAN ABMPM4521K',
    uan: '100912345678',
    location: 'Bengaluru',
    manager: 'Vikram Shah',
    email: 'priya@sonchoystudio.com',
  },
  employmentTypeId: 'full_time',

  workingDays: 22,
  presentDays: 22,
  leaveBalance: 14,

  earnings: [
    { id: 1, label: 'Basic salary',          amount: 60000, ytd: 120000, taxable: true  },
    { id: 2, label: 'House rent allowance',  amount: 24000, ytd: 48000,  taxable: true  },
    { id: 3, label: 'Conveyance allowance',  amount: 1600,  ytd: 3200,   taxable: false },
    { id: 4, label: 'Medical allowance',     amount: 1250,  ytd: 2500,   taxable: false },
    { id: 5, label: 'Special allowance',     amount: 18900, ytd: 37800,  taxable: true  },
    { id: 6, label: 'Performance bonus',     amount: 8000,  ytd: 16000,  taxable: true  },
  ],
  deductions: [
    { id: 1, label: 'Provident fund (PF)',   amount: 7200, ytd: 14400, type: 'statutory' },
    { id: 2, label: 'Professional tax',      amount: 200,  ytd: 400,   type: 'statutory' },
    { id: 3, label: 'Income tax (TDS)',      amount: 9800, ytd: 19600, type: 'tax' },
    { id: 4, label: 'Health insurance',      amount: 1500, ytd: 3000,  type: 'other' },
  ],

  reimbursement: 2400,

  bank: {
    bankName: 'HDFC Bank',
    accountName: 'Priya Mehta',
    accountNumber: 'XXXX XXXX 4421',
    ifsc: 'HDFC0001234',
    utr: 'HDFC2026052300441',
  },

  preparedBy: {
    name: 'Anita Rao',
    title: 'HR & Payroll Lead',
  },

  includeAttendanceBlock: true,
  includeBankBlock:       true,
  includeNotesBlock:      true,
  notes: 'May 2026 payroll. All deductions reflect statutory rates effective FY 2026-27. PF contribution 12% on basic; TDS computed on projected annual income with declared investment proofs.',

  includeSignatureBlock:  true,
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  void findPayFrequency(data.payFrequencyId)
  void findPaymentMode(data.paymentModeId)
  void findEmploymentType(data.employmentTypeId)
  const totals = useMemo(() => computeTotals(data), [data])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setCompanyField  = (k) => (v) => setData((s) => ({ ...s, company:  { ...s.company,  [k]: v } }))
  const setEmployeeField = (k) => (v) => setData((s) => ({ ...s, employee: { ...s.employee, [k]: v } }))
  const setBankField     = (k) => (v) => setData((s) => ({ ...s, bank:     { ...s.bank,     [k]: v } }))
  const setPrepField     = (k) => (v) => setData((s) => ({ ...s, preparedBy: { ...s.preparedBy, [k]: v } }))
  const setEarnings   = (items) => setData((s) => ({ ...s, earnings:   items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const setDeductions = (items) => setData((s) => ({ ...s, deductions: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    earnings:   data.earnings.map(({ id, ...rest }) => rest),
    deductions: data.deductions.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateSalarySlipPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateSalarySlipXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
              <PayslipIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Payslip · {data.earnings.length}+{data.deductions.length} · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Slip #"      value={data.slipNumber} onChange={setField('slipNumber')} mono />
          <TextInput label="Pay period"  value={data.payPeriod}  onChange={setField('payPeriod')} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <DateInput label="Pay date" value={data.payDate} onChange={setField('payDate')} />
          <SelectInput label="Frequency" value={data.payFrequencyId} onChange={setField('payFrequencyId')}
            options={PAY_FREQUENCIES.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Mode" value={data.paymentModeId} onChange={setField('paymentModeId')}
            options={PAYMENT_MODES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Company */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Company</span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <TextInput label="Company name" value={data.company.name} onChange={setCompanyField('name')} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <TextareaInput label="Address" value={data.company.address} onChange={setCompanyField('address')} rows={2} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Email"  value={data.company.email}  onChange={setCompanyField('email')}  mono />
            <TextInput label="Phone"  value={data.company.phone}  onChange={setCompanyField('phone')}  mono />
            <TextInput label="Tax ID" value={data.company.taxId}  onChange={setCompanyField('taxId')}  mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Employee */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Employee</span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_140px] gap-2">
            <TextInput label="Name" value={data.employee.name} onChange={setEmployeeField('name')} />
            <TextInput label="Employee ID" value={data.employee.employeeId} onChange={setEmployeeField('employeeId')} mono />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Designation" value={data.employee.designation} onChange={setEmployeeField('designation')} />
            <TextInput label="Department"  value={data.employee.department}  onChange={setEmployeeField('department')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DateInput label="Date of joining" value={data.employee.dateOfJoining} onChange={setEmployeeField('dateOfJoining')} />
            <SelectInput label="Employment" value={data.employmentTypeId} onChange={setField('employmentTypeId')}
              options={EMPLOYMENT_TYPES.map((e) => ({ value: e.id, label: e.label }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="PAN / Tax ID" value={data.employee.taxId} onChange={setEmployeeField('taxId')} mono />
            <TextInput label="UAN / PF #"   value={data.employee.uan}   onChange={setEmployeeField('uan')}   mono />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Location"   value={data.employee.location} onChange={setEmployeeField('location')} />
            <TextInput label="Reports to" value={data.employee.manager}  onChange={setEmployeeField('manager')} />
          </div>
          <TextInput label="Email" value={data.employee.email} onChange={setEmployeeField('email')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Attendance */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Attendance</span>
        <div className="grid grid-cols-3 gap-2">
          <NumberInput label="Working days" value={data.workingDays} onChange={setField('workingDays')} />
          <NumberInput label="Present days" value={data.presentDays} onChange={setField('presentDays')} />
          <NumberInput label="Leave balance" value={data.leaveBalance} onChange={setField('leaveBalance')} />
        </div>
        {totals.lopDays > 0 && (
          <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-1.5 font-mono text-[10.5px] text-warning">
            LOP: {totals.lopDays} day(s) · approx loss {formatNumber(totals.lopDeduction)} {cur.code}
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Earnings */}
        <EarningsList items={data.earnings} setItems={setEarnings} />

        <div className="my-3.5 h-px bg-line" />

        {/* Deductions */}
        <DeductionsList items={data.deductions} setItems={setDeductions} />

        <div className="my-3.5 h-px bg-line" />

        {/* Reimbursement */}
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Reimbursements (non-taxable)" value={data.reimbursement} onChange={setField('reimbursement')} suffix={cur.code} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Bank */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Bank credit</span>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Bank name"    value={data.bank.bankName}      onChange={setBankField('bankName')} />
            <TextInput label="Account name" value={data.bank.accountName}   onChange={setBankField('accountName')} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Account #" value={data.bank.accountNumber} onChange={setBankField('accountNumber')} mono />
            <TextInput label="IFSC / SWIFT" value={data.bank.ifsc}       onChange={setBankField('ifsc')}          mono />
            <TextInput label="UTR / Ref"    value={data.bank.utr}        onChange={setBankField('utr')}           mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Sign-off */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Prepared by</span>
        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Name"  value={data.preparedBy.name}  onChange={setPrepField('name')} />
          <TextInput label="Title" value={data.preparedBy.title} onChange={setPrepField('title')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Optional sections</span>
        <div className="space-y-2">
          <ToggleRow label="Attendance strip" desc="Working / present / LOP days"
            checked={data.includeAttendanceBlock} onChange={setField('includeAttendanceBlock')} />
          <ToggleRow label="Bank credit block" desc="Where the salary was paid"
            checked={data.includeBankBlock} onChange={setField('includeBankBlock')} />
          <ToggleRow label="Notes block" desc="Free-text payroll notes"
            checked={data.includeNotesBlock} onChange={setField('includeNotesBlock')} />
          <ToggleRow label="Signature block" desc="HR + Finance sign-off"
            checked={data.includeSignatureBlock} onChange={setField('includeSignatureBlock')} />
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
            <span className="text-ink-500">Gross earnings</span>
            <span className="text-ink-950">{formatNumber(totals.grossEarnings)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Total deductions</span>
            <span className="text-ink-950">- {formatNumber(totals.totalDeductions)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-line pt-1">
            <span className="text-ink-500">Net pay</span>
            <span className="font-bold text-ink-950">{formatNumber(totals.netPay)}</span>
          </div>
          {totals.reimbursement > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">+ Reimbursements</span>
              <span className="text-ink-950">{formatNumber(totals.reimbursement)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Take-home</span>
            <span className="font-mono text-[14px] font-bold text-business">{cur.code} {formatNumber(totals.takeHome)}</span>
          </div>
        </div>

        {/* YTD strip */}
        <div className="mt-3 rounded-lg border border-line bg-canvas p-3 font-mono text-[10.5px]">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">Year-to-date</p>
          <div className="grid grid-cols-3 gap-1">
            <div>
              <span className="block text-[8.5px] uppercase text-ink-500">Gross</span>
              <span className="text-ink-950">{formatNumber(totals.grossYtd)}</span>
            </div>
            <div>
              <span className="block text-[8.5px] uppercase text-ink-500">Ded.</span>
              <span className="text-ink-950">{formatNumber(totals.totalDeductionsYtd)}</span>
            </div>
            <div>
              <span className="block text-[8.5px] uppercase text-ink-500">Net</span>
              <span className="text-business">{formatNumber(totals.netYtd)}</span>
            </div>
          </div>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-business/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-business">Net pay this period</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.payPeriod || ''}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.takeHome, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Salary Slip PDF'}
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

function PayslipMock() {
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
            <p className="m-0 text-[16px] font-bold tracking-[-0.01em] text-business">SALARY SLIP</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">PSL-2026-05-1042</p>
            <p className="m-0 text-[9px] text-ink-500">Pay period: May 2026</p>
            <p className="m-0 text-[9px] text-ink-500">Monthly · Bank transfer</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-business/40" />

        <div className="mt-3">
          <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">EMPLOYEE</p>
          <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">Priya Mehta · SCY-1042</p>
          <p className="m-0 text-[9px] text-ink-700">Senior Account Manager · Client Services</p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1 rounded border border-line bg-canvas px-1.5 py-1.5 font-mono text-[8px]">
          <div><span className="text-business-dk font-bold">WORKING</span><br /><span className="text-ink-950">22</span></div>
          <div><span className="text-business-dk font-bold">PRESENT</span><br /><span className="text-ink-950">22</span></div>
          <div><span className="text-business-dk font-bold">LOP</span><br /><span className="text-ink-950">0</span></div>
          <div><span className="text-business-dk font-bold">LEAVE</span><br /><span className="text-ink-950">14</span></div>
        </div>

        <div className="mt-3 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-2 gap-px bg-business">
            <div className="bg-business px-1.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white">EARNINGS</div>
            <div className="bg-business px-1.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white">DEDUCTIONS</div>
          </div>
          {[
            [['Basic salary', '60,000'],    ['PF (statutory)', '7,200']],
            [['HRA', '24,000'],              ['Professional tax', '200']],
            [['Conveyance', '1,600'],        ['Income tax (TDS)', '9,800']],
            [['Medical', '1,250'],           ['Health insurance', '1,500']],
            [['Special allowance', '18,900'], ['', '']],
            [['Performance bonus', '8,000'], ['', '']],
          ].map((r, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-px border-t border-line bg-line">
              <div className="flex items-center justify-between bg-paper px-1.5 py-1 font-mono text-[8.5px]">
                <span className="text-ink-900">{r[0][0]}</span>
                <span className="text-ink-950">{r[0][1]}</span>
              </div>
              <div className="flex items-center justify-between bg-paper px-1.5 py-1 font-mono text-[8.5px]">
                <span className="text-ink-900">{r[1][0]}</span>
                <span className={r[1][0] === 'Income tax (TDS)' ? 'text-danger' : 'text-ink-950'}>{r[1][1]}</span>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-px border-t border-line bg-business">
            <div className="flex items-center justify-between bg-business px-1.5 py-1.5 font-mono text-[8.5px] font-bold text-white">
              <span>GROSS</span><span>INR 1,13,750</span>
            </div>
            <div className="flex items-center justify-between bg-business px-1.5 py-1.5 font-mono text-[8.5px] font-bold text-white">
              <span>DEDUCTIONS</span><span>INR 18,700</span>
            </div>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border-2 border-business">
          <div className="bg-business px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-white">Net pay this period</div>
          <div className="bg-paper px-3 py-2">
            <p className="m-0 text-right font-mono text-[20px] font-bold text-business-dk">INR 97,450</p>
          </div>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ YTD, bank credit, and signature blocks in the full PDF</p>
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
            Salary structure in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            employee-ready payslip out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Side-by-side earnings and deductions, each with current-period and year-to-date columns. Net pay headlined; bank credit and YTD strip underneath. Statutory, tax, and other deduction types colour-coded so finance and the employee both read the same thing.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
                    <PayslipIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Payslip Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  6E · 4D · INR
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Slip #',         'PSL-2026-05-1042'],
                  ['Employee',       'Priya Mehta · SCY-1042'],
                  ['Pay period',     'May 2026 · monthly'],
                  ['Working days',   '22 / 22 · 0 LOP'],
                  ['Gross earnings', 'INR 1,13,750'],
                  ['Deductions',     'INR 18,700'],
                  ['Reimbursements', 'INR 2,400'],
                  ['Take-home',      'INR 97,450'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-business/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Net pay</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 97,450</span>
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
                  Email-ready
                </span>
              </div>
              <PayslipMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Set the period',         'Pay period (e.g. May 2026), pay date, frequency (monthly / bi-weekly / weekly), payment mode. The slip number is the audit handle.'],
  ['02', 'Build the structure',    'Earnings rows (basic, HRA, allowances, bonus) and deductions rows (PF, professional tax, TDS, other). Each line carries current-period and YTD amounts.'],
  ['03', 'Export & share',         'PDF: branded header, employee block, optional attendance strip, two-column earnings/deductions table, net-pay hero card, YTD strip, optional bank credit + signatures. XLSX with 3 sheets.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From CTC sheet{' '}
              <em className="font-serif font-normal italic text-crimson-300">to monthly payslip.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A payslip is a document the employee reads carefully and the finance team archives forever. It needs to be readable in two glances (net pay, deductions) and audit-trail-complete in twenty (every component, statutory ref, YTD). This tool produces both in the same PDF.
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
  { title: 'Side-by-side layout',       desc: 'Earnings on the left, deductions on the right. Each row has amount + YTD. Gross totals and deduction totals print on a single colour bar at the bottom of the table.' },
  { title: 'Statutory · Tax · Other',   desc: 'Every deduction gets a type. Statutory (PF, ESI, PT), Tax (TDS, withholding), Other (insurance, loan). The PDF highlights tax in red so the employee finds it instantly.' },
  { title: 'YTD on every line',         desc: 'Each earning and deduction shows its year-to-date amount alongside the current period. Plus a YTD strip with gross / deductions / net for the year.' },
  { title: 'LOP attendance',            desc: 'Working days vs present days computes loss-of-pay days automatically. A warning strip shows the LOP deduction estimate so you can adjust the basic before exporting.' },
  { title: 'Bank credit block',         desc: 'Bank name, account name, masked account no., IFSC/SWIFT, and the UTR / reference number. Employees love seeing the UTR — it\'s proof the bank transfer happened.' },
  { title: 'PDF + 3-sheet XLSX',        desc: 'PDF: branded header, employee details, attendance strip, two-column earnings/deductions, net-pay hero card, YTD strip, bank block, signatures. XLSX: Summary, Earnings, Deductions.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for HR</Eyebrow>
          <SectionTitle>
            Every line the{' '}
            <em className="font-serif font-normal italic text-crimson-300">employee reads.</em>
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
  { q: 'Does this calculate TDS / income tax for me?',                a: 'No — this is a payslip generator, not a payroll calculator. You enter the deduction amounts your payroll process already produced (TDS, PF, PT). The tool formats them into a compliant payslip. For TDS estimation, see the Income Tax Estimator and Tax Calculation Sheet tools.' },
  { q: 'Is this compliant with Indian / US / UK payroll formats?',     a: 'It produces a standard payslip layout that satisfies the audit requirements for most jurisdictions: employer + employee identification, pay period, gross earnings broken down by component, statutory deductions identified separately from tax, net pay, and YTD. Specific statutory disclosures (e.g. ESIC particulars for India, NI category for UK) can be added in the notes block.' },
  { q: 'What\'s the difference between LOP and leave?',                a: 'Leave is paid time off (vacation, sick, casual). LOP — Loss of Pay — is unpaid absence beyond the leave balance. If working days = 22 and present days = 20 and the employee had 0 paid leave taken, then LOP = 2 days, deducted pro-rata from gross. The tool shows the LOP estimate but doesn\'t auto-deduct — you adjust the basic salary line yourself if needed.' },
  { q: 'Why are some earnings marked taxable and others not?',         a: 'Indian payroll splits earnings into taxable (basic, HRA, special allowance, bonus) and non-taxable (conveyance, medical, LTA — subject to limits and proofs). The "taxable" checkbox controls the colour treatment on the PDF; the tool also computes a taxable-earnings subtotal in the XLSX summary for tax-calculation cross-checks.' },
  { q: 'Should I include the bank credit block?',                      a: 'Recommended. Employees value seeing where the salary was paid and the UTR reference, especially the first few months on a new account. For payslips going to legal or visa applications, the bank credit block makes the document more credible. Skip it only if you\'re generating a draft for internal review.' },
  { q: 'Output formats?',                                              a: 'PDF (top accent stripe, branded company header, "SALARY SLIP" block top-right with slip # / pay period / pay date / frequency / mode, employee details two-column block, optional attendance strip, two-column earnings/deductions table with current + YTD, net-pay hero card, YTD strip, optional bank credit block, optional notes, dual HR/finance signature block, system-generated footer) and XLSX (3 sheets: Summary, Earnings, Deductions).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">salary slips.</em>
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
  { name: 'Payroll Summary Generator',  desc: 'Roll up payslips into a payroll-run report.',          Icon: PayrollIcon, label: 'ACCOUNTING', path: '/tools/payroll-summary' },
  { name: 'Payroll Tax Report',         desc: 'Withholding & contributions report.',                   Icon: PayrollIcon, label: 'TAX',        path: '/tools/payroll-tax-report' },
  { name: 'Expense Report Generator',   desc: 'Reimbursement claim that pairs with the payslip.',      Icon: ExpenseIcon, label: 'DOCUMENTS',  path: '/tools/expense-report-generator' },
  { name: 'Monthly Financial Summary',  desc: 'Roll the month\'s payroll into the management report.',  Icon: ReportIcon,  label: 'ACCOUNTING', path: '/tools/monthly-financial-summary' },
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

export default function SalarySlipGeneratorTool() {
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
