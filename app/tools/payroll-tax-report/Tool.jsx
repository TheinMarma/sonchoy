'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  PayrollIcon, PercentIcon, VatIcon, ReconcileIcon, ExportIcon, PayslipIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, PAYROLL_REGIMES, PAY_FREQUENCIES,
  computePayroll, findRegime, findCurrency,
  formatNumber, formatMoney, todayISO,
} from '@/lib/payrollTax/compute'
import { generatePayrollTaxPdf } from '@/lib/payrollTax/generatePdf'
import { generatePayrollTaxXlsx } from '@/lib/payrollTax/generateXlsx'

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

/* ---------- 1) Tool hero ---------- */

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
      aria-label="Live Payroll Tax Report"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[560px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['4',     'Regimes (US/UK/IN/DE)'],
  ['Auto',  'Net & total cost calc'],
  ['PDF+',  'XLSX filing summary'],
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
          style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 60%)' }}
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
            <span className="text-tax">Tax &amp; Banking</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Payroll Tax Report</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax · Employer filing
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Withholdings,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              row by row.
            </em>
            <br />
            Remittance{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              totalled.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Log each employee's gross, income-tax withholding, social contribution, and employer match. We total it all per bucket and ship a filing-ready PDF — exactly the summary a payroll filing needs.
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
              <Check className="text-crimson-400" /> Regime-aware columns
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

/* ---------- Form input building blocks ---------- */

const labelClass = 'font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500'
const inputClass =
  'w-full min-h-[36px] rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950 ' +
  'placeholder:text-ink-400 outline-none transition-colors ' +
  'focus:border-tax/60 focus:ring-2 focus:ring-tax/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
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

function DateInput({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
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

/* ---------- Employee row ---------- */

function EmployeeRow({ employee, regimeCols, onUpdate, onRemove }) {
  const gross           = Number(employee.gross) || 0
  const incomeTax       = Number(employee.incomeTax) || 0
  const socialContrib   = Number(employee.socialContrib) || 0
  const medicare        = Number(employee.medicare) || 0
  const employerContrib = Number(employee.employerContrib) || 0
  const deductions = incomeTax + socialContrib + medicare
  const netPay = gross - deductions
  const totalCost = gross + employerContrib

  return (
    <div className="rounded-lg border border-line bg-paper p-2.5">
      {/* Row 1: Name + ID + Remove */}
      <div className="mb-1.5 grid grid-cols-[1fr_92px_22px] items-center gap-1.5">
        <input
          type="text"
          value={employee.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Employee name"
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] font-semibold text-ink-950 outline-none placeholder:font-normal placeholder:text-ink-400 hover:border-line-strong focus:border-tax/60"
        />
        <input
          type="text"
          value={employee.employeeId || ''}
          onChange={(e) => onUpdate({ employeeId: e.target.value })}
          placeholder="Emp ID"
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none placeholder:text-ink-400 hover:border-line-strong focus:border-tax/60"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove employee"
          className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Row 2: Gross + tax buckets — 4 columns */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { key: 'gross',           label: 'Gross' },
          { key: 'incomeTax',       label: regimeCols.incomeTax },
          { key: 'socialContrib',   label: regimeCols.socialContrib },
          { key: 'medicare',        label: regimeCols.medicare },
        ].map((col) => (
          <div key={col.key} className="rounded-md border border-line bg-canvas">
            <span className="block px-1.5 pt-1 font-mono text-[8.5px] uppercase tracking-[0.06em] text-ink-500 truncate">
              {col.label}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={employee[col.key]}
              onChange={(e) => onUpdate({ [col.key]: e.target.value })}
              placeholder="0"
              className="min-h-[24px] w-full bg-transparent px-1.5 pb-1.5 text-right font-mono text-[11.5px] font-semibold text-ink-950 outline-none placeholder:font-normal placeholder:text-ink-400"
            />
          </div>
        ))}
      </div>

      {/* Row 3: Employer + live read-outs */}
      <div className="mt-1.5 grid grid-cols-[1fr_72px_72px_72px] gap-1.5">
        <div className="rounded-md border border-line bg-canvas">
          <span className="block px-1.5 pt-1 font-mono text-[8.5px] uppercase tracking-[0.06em] text-ink-500 truncate">
            {regimeCols.employerContrib}
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={employee.employerContrib}
            onChange={(e) => onUpdate({ employerContrib: e.target.value })}
            placeholder="0"
            className="min-h-[24px] w-full bg-transparent px-1.5 pb-1.5 text-right font-mono text-[11.5px] font-semibold text-ink-950 outline-none placeholder:font-normal placeholder:text-ink-400"
          />
        </div>
        <div className="rounded-md bg-crimson-500/5 px-1.5 py-1 text-center">
          <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.06em] text-ink-500">Withheld</p>
          <p className="m-0 mt-0.5 font-mono text-[11.5px] font-semibold text-crimson-300">{formatNumber(deductions)}</p>
        </div>
        <div className="rounded-md bg-success/10 px-1.5 py-1 text-center">
          <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.06em] text-ink-500">Net</p>
          <p className="m-0 mt-0.5 font-mono text-[11.5px] font-semibold text-success">{formatNumber(netPay)}</p>
        </div>
        <div className="rounded-md bg-tax-bg px-1.5 py-1 text-center">
          <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.06em] text-ink-500">Cost</p>
          <p className="m-0 mt-0.5 font-mono text-[11.5px] font-semibold text-tax">{formatNumber(totalCost)}</p>
        </div>
      </div>
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  employerName: 'Sonchoy Studio Ltd.',
  taxId: '12-3456789',
  periodLabel: '',
  periodStart: '2026-05-01',
  periodEnd:   '2026-05-31',
  currency: 'USD',
  regimeId: 'us',
  payFrequency: 'Monthly',

  employees: [
    { id: 1, name: 'Alex Hartwell',    employeeId: 'EMP-001', gross: 9500, incomeTax: 1425, socialContrib: 589, medicare: 137, employerContrib: 726 },
    { id: 2, name: 'Sam Chen',         employeeId: 'EMP-002', gross: 8200, incomeTax: 1148, socialContrib: 508, medicare: 119, employerContrib: 627 },
    { id: 3, name: 'Riya Patel',       employeeId: 'EMP-003', gross: 7400, incomeTax: 1036, socialContrib: 459, medicare: 107, employerContrib: 566 },
    { id: 4, name: 'Jordan Williams',  employeeId: 'EMP-004', gross: 6800, incomeTax: 952,  socialContrib: 421, medicare: 99,  employerContrib: 520 },
    { id: 5, name: 'Priya Nair',       employeeId: 'EMP-005', gross: 5500, incomeTax: 660,  socialContrib: 341, medicare: 80,  employerContrib: 421 },
  ],

  notes: 'Filed monthly. Federal withholding per W-4 elections. FICA match (6.2% SS + 1.45% Medicare) included as employer cost.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const regime = useMemo(() => findRegime(data.regimeId), [data.regimeId])
  const t = useMemo(() => computePayroll(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))

  const updateEmployee = (id, patch) =>
    setData((s) => ({ ...s, employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const removeEmployee = (id) =>
    setData((s) => ({ ...s, employees: s.employees.filter((e) => e.id !== id) }))
  const addEmployee = () =>
    setData((s) => ({
      ...s,
      employees: [
        ...s.employees,
        {
          id: nextId++,
          name: '',
          employeeId: '',
          gross: 0,
          incomeTax: 0,
          socialContrib: 0,
          medicare: 0,
          employerContrib: 0,
        },
      ],
    }))
  const reset = () => setData({ ...INITIAL })

  const onRegimeChange = (id) => {
    const r = findRegime(id)
    setData((s) => ({ ...s, regimeId: id, currency: r.defaultCurrency }))
  }

  const buildPayload = () => ({
    ...data,
    employees: data.employees.map(({ id, ...rest }) => ({
      ...rest,
      gross: Number(rest.gross) || 0,
      incomeTax: Number(rest.incomeTax) || 0,
      socialContrib: Number(rest.socialContrib) || 0,
      medicare: Number(rest.medicare) || 0,
      employerContrib: Number(rest.employerContrib) || 0,
    })),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generatePayrollTaxPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generatePayrollTaxXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <PayrollIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Payroll Tax · {regime.label.split(' · ')[0]}
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700"
          >
            Reset
          </button>
        </div>

        {/* Employer + tax ID */}
        <TextInput
          label="Employer name"
          value={data.employerName}
          onChange={setField('employerName')}
          placeholder="Your Company Ltd."
        />
        <div className="mt-2 grid grid-cols-[1fr_92px] gap-2">
          <TextInput
            label="Employer Tax ID / EIN"
            value={data.taxId}
            onChange={setField('taxId')}
            placeholder="12-3456789"
            mono
          />
          <SelectInput
            label="Currency"
            value={data.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>

        {/* Regime + frequency */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput
            label="Regime"
            value={data.regimeId}
            onChange={onRegimeChange}
            options={PAYROLL_REGIMES.map((r) => ({ value: r.id, label: r.label }))}
          />
          <SelectInput
            label="Pay frequency"
            value={data.payFrequency}
            onChange={setField('payFrequency')}
            options={PAY_FREQUENCIES.map((f) => ({ value: f.label, label: f.label }))}
          />
        </div>

        {/* Period */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DateInput label="Period start" value={data.periodStart} onChange={setField('periodStart')} />
          <DateInput label="Period end"   value={data.periodEnd}   onChange={setField('periodEnd')} />
        </div>
        <div className="mt-2">
          <TextInput
            label="Period label (optional)"
            value={data.periodLabel}
            onChange={setField('periodLabel')}
            placeholder="May 2026"
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Employees */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
            Employees · {data.employees.length}
          </span>
          <button
            type="button"
            onClick={addEmployee}
            className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20"
          >
            <Plus size={9} />
            Add employee
          </button>
        </div>

        <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
          {data.employees.length === 0 && (
            <div className="rounded-md border border-dashed border-line-strong bg-canvas/40 px-3 py-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              No employees yet — add one to begin
            </div>
          )}
          {data.employees.map((e) => (
            <EmployeeRow
              key={e.id}
              employee={e}
              regimeCols={regime.columns}
              onUpdate={(patch) => updateEmployee(e.id, patch)}
              onRemove={() => removeEmployee(e.id)}
            />
          ))}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Totals strip */}
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Gross payroll',  formatNumber(t.gross)],
            ['Total withheld', formatNumber(t.deductions)],
            ['Net paid',       formatNumber(t.netPay)],
            ['Employer cost',  formatNumber(t.totalCost)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-line bg-paper px-3 py-2">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
              <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-tax">{v}</p>
            </div>
          ))}
        </div>

        {/* Withholding breakdown */}
        <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
            To remit · {regime.label}
          </p>
          <div className="space-y-1">
            {[
              [regime.columns.incomeTax,     t.incomeTax],
              [regime.columns.socialContrib, t.socialContrib],
              [regime.columns.medicare,      t.medicare],
              [regime.columns.employerContrib, t.employerContrib],
            ]
              .filter(([, v]) => v > 0)
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-ink-700">{k}</span>
                  <span className="font-mono font-semibold text-ink-900">{formatNumber(v)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Rates */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ['Eff. tax %',        `${t.effectiveTaxRate}%`],
            ['Total deduct %',     `${t.effectiveDeductRate}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-line bg-paper px-3 py-2 text-center">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
              <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-tax">{v}</p>
            </div>
          ))}
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">
              Total employer cost
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {t.countEmployees} employees · {t.employerCostRate}% burden
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(t.totalCost, data.currency || regime.defaultCurrency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Filing reference, election notes, period adjustments…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Payroll Tax PDF'}
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={handleXlsx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'xlsx' ? '…' : (<>Export XLSX (Detail + Summary) <ArrowRight size={10} /></>)}
        </button>

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
            Need full payslips?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function PayrollMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Payroll Tax Report
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">
          US Federal · 5 employees · USD
        </span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Sonchoy Studio Ltd.</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">EIN 12-3456789 · May 2026 · Monthly</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
          <BrandMark size={14} className="text-paper" />
        </span>
      </div>

      {/* Stats strip */}
      <div className="mb-5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Gross',     '37,400'],
          ['Withheld',  '7,981',  'text-crimson-300'],
          ['Net',       '29,419', 'text-success'],
          ['Em. cost',  '40,259', 'text-tax'],
        ].map(([k, v, tone]) => (
          <div key={k} className="bg-canvas px-2 py-3">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className={`m-0 mt-1 font-mono text-[12px] font-semibold ${tone || 'text-ink-950'}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Mini employee table */}
      <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Employees</p>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-ink-950 text-paper">
            <th className="py-1.5 px-1 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-tax">Name</th>
            <th className="py-1.5 px-1 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Gross</th>
            <th className="py-1.5 px-1 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">FIT</th>
            <th className="py-1.5 px-1 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">FICA</th>
            <th className="py-1.5 px-1 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Net</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Alex Hartwell',     '9,500', '1,425', '726',   '7,349'],
            ['Sam Chen',          '8,200', '1,148', '627',   '6,425'],
            ['Riya Patel',        '7,400', '1,036', '566',   '5,798'],
            ['Jordan Williams',   '6,800', '952',   '520',   '5,328'],
            ['Priya Nair',        '5,500', '660',   '421',   '4,419'],
          ].map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-canvas' : ''}>
              <td className="py-1 px-1 font-medium text-ink-950 truncate max-w-[140px]">{r[0]}</td>
              <td className="py-1 px-1 text-right font-mono text-ink-900">{r[1]}</td>
              <td className="py-1 px-1 text-right font-mono text-crimson-300">{r[2]}</td>
              <td className="py-1 px-1 text-right font-mono text-crimson-300">{r[3]}</td>
              <td className="py-1 px-1 text-right font-mono font-semibold text-success">{r[4]}</td>
            </tr>
          ))}
          <tr className="border-y border-ink-700 bg-paper">
            <td className="py-1.5 px-1 font-semibold text-ink-950">Totals</td>
            <td className="py-1.5 px-1 text-right font-mono font-semibold text-ink-950">37,400</td>
            <td className="py-1.5 px-1 text-right font-mono font-semibold text-crimson-300">5,221</td>
            <td className="py-1.5 px-1 text-right font-mono font-semibold text-crimson-300">2,760</td>
            <td className="py-1.5 px-1 text-right font-mono font-semibold text-success">29,419</td>
          </tr>
        </tbody>
      </table>

      {/* Filing summary */}
      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-tax">To remit · IRS</span>
          <span className="font-mono text-[14px] font-semibold text-paper">USD 10,741</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded bg-ink-700/30 text-center">
          {[
            ['Fed. tax',  '5,221'],
            ['FICA (ee)', '2,760'],
            ['FICA (er)', '2,760'],
          ].map(([k, v]) => (
            <div key={k} className="bg-ink-950 px-2 py-1">
              <p className="m-0 font-mono text-[8px] uppercase tracking-[0.06em] text-ink-500">{k}</p>
              <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-paper">{v}</p>
            </div>
          ))}
        </div>
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
            From every payroll row{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a remittance plan.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Per-employee withholdings rolled up by bucket — income tax, social security, employer contributions — formatted for the filing portal.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <PayrollIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Payroll Tax Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  US · May 2026
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Employer',      'Sonchoy Studio Ltd.'],
                  ['Regime',        'US Federal · Monthly'],
                  ['Employees',     '5 active'],
                  ['Gross payroll', '37,400.00'],
                  ['Total withheld', '7,981.00 (21.3%)'],
                  ['Employer match', '2,860.00'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Employer cost</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 40,259.00</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    OUTPUT.PDF
                  </span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Filing-ready
                </span>
              </div>
              <PayrollMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick a regime',          'US Federal, UK PAYE/NIC, India TDS/EPF, Germany — column labels and remittance bucket names adapt automatically.'],
  ['02', 'Type per employee',      'Gross + income tax + social contribution + other deduction + employer contribution. Net pay computes inline.'],
  ['03', 'Download the report',   'Landscape PDF with employee detail rows + filing summary (employee + employer remittance buckets) + 2-sheet XLSX.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three steps to{' '}
              <em className="font-serif font-normal italic text-crimson-300">filing-ready totals.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            The hard part of payroll filing is getting per-bucket totals right. The PDF separates employee withholdings from employer contributions so each remittance is unambiguous.
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

/* ---------- 4) Features ---------- */

const FEATURES = [
  { title: '4 regimes built in',         desc: 'US Federal (FIT + FICA), UK PAYE/NIC, India TDS/EPF, Germany — column labels adapt per regime.' },
  { title: 'Per-employee detail',        desc: 'Each row carries name, ID, gross, three withholding buckets, and employer contribution. Net + total cost compute live.' },
  { title: 'Bucket totals for filing',   desc: 'Employee withholdings (FIT, SS, Medicare) and employer match shown as separate filing buckets at the bottom.' },
  { title: 'Effective rate metrics',     desc: 'Effective tax rate (income-tax ÷ gross) and total deduction rate (all withholdings ÷ gross) printed alongside.' },
  { title: 'Employer cost burden',       desc: 'Total cost (gross + employer contributions) shown so HR sees the true loaded employee cost.' },
  { title: 'Landscape PDF + 2-sheet XLSX', desc: 'Landscape PDF (more horizontal columns) + Detail and Filing Summary XLSX sheets.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for payroll teams</Eyebrow>
          <SectionTitle>
            Every column a{' '}
            <em className="font-serif font-normal italic text-crimson-300">filing portal</em> wants.
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-tax/20 bg-tax-bg text-tax">
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
  { q: 'What does "employer contribution" cover?',           a: 'In the US, FICA match: 6.2% Social Security + 1.45% Medicare. In the UK, employer NIC. In India, employer EPF 12% + ESI if applicable. In Germany, employer social insurance match. Lump all of these into the "employer contribution" column for the period.' },
  { q: 'Does this calculate the withholdings for me?',        a: 'No — type the actual withheld amounts from each paycheck. This tool aggregates and formats them for filing. For per-paycheck withholding calculation (tax-tables, brackets, allowances), use your payroll software or run withholding tables manually.' },
  { q: 'Can I use it for one-off contractors?',               a: 'Yes — but for 1099 contractors (US) or self-employed (UK), withholdings are usually zero. Track gross + any voluntary tax withheld. The form still produces a clean summary.' },
  { q: 'How do bonuses and reimbursements fit?',              a: 'For supplemental pay (bonuses, commissions), add a separate "Bonus" row per employee with the special-rate withholding applied. Non-taxable reimbursements (mileage, expense) don\'t belong here — use the Expense Tracker instead.' },
  { q: 'What about state / provincial tax?',                  a: 'Combine state + federal income tax into the "income tax" column, or use the "Other deduction" column for state separately. For a more granular view, run the report twice — once for federal, once for state filings.' },
  { q: 'Output formats?',                                     a: 'PDF (landscape, with per-employee detail rows + a filing summary section separating employee withholdings from employer contributions) and .xlsx (Detail sheet + Filing Summary sheet).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">payroll tax filing.</em>
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
  { name: 'Tax Calculation Sheet',     desc: 'Progressive income-tax slabs by regime.', Icon: PercentIcon,   label: 'TAX', path: '/tools/tax-calculation-sheet' },
  { name: 'VAT Calculator PDF Export', desc: 'Inline VAT/sales-tax calculation.',       Icon: VatIcon,       label: 'TAX', path: '/tools/vat-calculator-pdf-export' },
  { name: 'Bank Reconciliation Sheet', desc: 'Book vs. statement match.',               Icon: ReconcileIcon, label: 'TAX' },
  { name: 'Salary Slip Generator',     desc: 'Per-employee payslips with deductions.',  Icon: PayslipIcon,   label: 'DOCUMENTS' },
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
            const isTax = t.label === 'TAX'
            const labelColor = isTax ? 'text-tax' : 'text-business'
            const iconBg = isTax ? 'bg-tax-bg text-tax' : 'bg-business-bg text-business'
            const inner = (
              <>
                <span className={`absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] ${labelColor}`}>
                  {t.label}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-md ${iconBg}`}>
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

export default function PayrollTaxReportTool() {
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
