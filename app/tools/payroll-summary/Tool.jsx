'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  PayrollIcon, PayslipIcon, ReportIcon, PnlIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, DEPARTMENTS, PAYROLL_FREQUENCIES, SUMMARY_PURPOSES,
  findCurrency, findDepartment, findPayrollFrequency, findSummaryPurpose,
  computeSummary, buildDepartmentSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/payrollSummary/compute'
import { generatePayrollSummaryPdf } from '@/lib/payrollSummary/generatePdf'
import { generatePayrollSummaryXlsx } from '@/lib/payrollSummary/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Payroll Summary Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Landscape', 'PDF · full table'],
  ['Gross→Net', 'Per employee'],
  ['Employer', 'Cost rolled up'],
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
          style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 60%)' }} />
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
            <span className="text-accounting">Accounting</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Payroll Summary Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(129,140,248,0.25)]" />
            Accounting · Multi-employee payroll
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Whole payroll{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — one page,
            </em>
            <br />
            every{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              line.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop in every employee with their gross pay, deductions, and tax. The tool computes net pay per person, employer PF/ESI/gratuity, and the full true cost — plus a department rollup and prior-period comparison.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Gross-to-net per employee</span>
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
  'focus:border-accounting/60 focus:ring-2 focus:ring-accounting/20 hover:border-line-strong'

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
        className="h-4 w-4 shrink-0 cursor-pointer accent-accounting" />
    </label>
  )
}

/* ---------- EmployeeList ---------- */

function EmployeeList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    {
      id: Date.now() + Math.random(),
      employeeId: '', name: '', role: '', departmentId: 'engineering',
      basic: 0, allowances: 0, overtime: 0, bonus: 0,
      pf: 0, esi: 0, professionalTax: 0, incomeTax: 0,
      loanDeduction: 0, otherDeduction: 0,
      employerPf: 0, employerEsi: 0, gratuity: 0, otherEmployerCost: 0,
    },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">Employees ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20">
          <Plus size={9} /> Add employee
        </button>
      </div>
      <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
        {items.map((e) => {
          const gross = (Number(e.basic) || 0) + (Number(e.allowances) || 0) + (Number(e.overtime) || 0) + (Number(e.bonus) || 0)
          const deduct = (Number(e.pf) || 0) + (Number(e.esi) || 0) + (Number(e.professionalTax) || 0) + (Number(e.incomeTax) || 0) + (Number(e.loanDeduction) || 0) + (Number(e.otherDeduction) || 0)
          const net = Math.max(0, gross - deduct)
          return (
            <div key={e.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[80px_1fr_22px] items-center gap-1.5">
                <input type="text" value={e.employeeId || ''}
                  onChange={(ev) => update(e.id, { employeeId: ev.target.value })}
                  placeholder="ID"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="text" value={e.name || ''}
                  onChange={(ev) => update(e.id, { name: ev.target.value })}
                  placeholder="Name"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-accounting/60" />
                <button type="button" onClick={() => remove(e.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <input type="text" value={e.role || ''}
                  onChange={(ev) => update(e.id, { role: ev.target.value })}
                  placeholder="Role"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <select value={e.departmentId}
                  onChange={(ev) => update(e.id, { departmentId: ev.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60">
                  {DEPARTMENTS.map((d) => (<option key={d.id} value={d.id}>{d.label}</option>))}
                </select>
              </div>

              <p className="m-0 mt-2 font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Gross components</p>
              <div className="mt-1 grid grid-cols-4 gap-1">
                <input type="number" step="any" value={e.basic}      onChange={(ev) => update(e.id, { basic: Number(ev.target.value) || 0 })}      placeholder="Basic"      className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.allowances} onChange={(ev) => update(e.id, { allowances: Number(ev.target.value) || 0 })} placeholder="Allow"      className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.overtime}   onChange={(ev) => update(e.id, { overtime: Number(ev.target.value) || 0 })}   placeholder="OT"         className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.bonus}      onChange={(ev) => update(e.id, { bonus: Number(ev.target.value) || 0 })}      placeholder="Bonus"      className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              </div>

              <p className="m-0 mt-2 font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Employee deductions</p>
              <div className="mt-1 grid grid-cols-3 gap-1">
                <input type="number" step="any" value={e.pf}              onChange={(ev) => update(e.id, { pf: Number(ev.target.value) || 0 })}              placeholder="PF"     className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.esi}             onChange={(ev) => update(e.id, { esi: Number(ev.target.value) || 0 })}             placeholder="ESI"    className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.professionalTax} onChange={(ev) => update(e.id, { professionalTax: Number(ev.target.value) || 0 })} placeholder="PT"     className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.incomeTax}       onChange={(ev) => update(e.id, { incomeTax: Number(ev.target.value) || 0 })}       placeholder="Tax"    className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.loanDeduction}   onChange={(ev) => update(e.id, { loanDeduction: Number(ev.target.value) || 0 })}   placeholder="Loan"   className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.otherDeduction}  onChange={(ev) => update(e.id, { otherDeduction: Number(ev.target.value) || 0 })}  placeholder="Other"  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              </div>

              <p className="m-0 mt-2 font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">Employer-side contributions</p>
              <div className="mt-1 grid grid-cols-4 gap-1">
                <input type="number" step="any" value={e.employerPf}        onChange={(ev) => update(e.id, { employerPf: Number(ev.target.value) || 0 })}        placeholder="ER PF"   className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.employerEsi}       onChange={(ev) => update(e.id, { employerEsi: Number(ev.target.value) || 0 })}       placeholder="ER ESI"  className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.gratuity}          onChange={(ev) => update(e.id, { gratuity: Number(ev.target.value) || 0 })}          placeholder="Grat."   className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
                <input type="number" step="any" value={e.otherEmployerCost} onChange={(ev) => update(e.id, { otherEmployerCost: Number(ev.target.value) || 0 })} placeholder="Other"   className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              </div>

              <div className="mt-1.5 flex items-center justify-between rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[10.5px]">
                <span className="text-ink-500">
                  Gross <span className="text-ink-950">{formatNumber(gross)}</span>
                  {' · '}Deduct <span className="text-ink-950">{formatNumber(deduct)}</span>
                </span>
                <span className="font-bold text-success">Net {formatNumber(net)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  reportTitle: 'Payroll Summary — May 2026',
  reference: 'PAY-2026-05-0042',
  entityName: 'Sonchoy Studio Pvt Ltd',
  periodLabel: 'May 2026',
  purposeId: 'monthly',
  frequencyId: 'monthly',
  currency: 'INR',

  employees: [
    { id: 1, employeeId: 'EMP-001', name: 'Priya Shah',     role: 'Engineering Lead',     departmentId: 'engineering', basic: 180000, allowances: 60000,  overtime: 0,      bonus: 0,      pf: 21600, esi: 0,    professionalTax: 200, incomeTax: 28500, loanDeduction: 0,    otherDeduction: 0, employerPf: 21600, employerEsi: 0,    gratuity: 8654, otherEmployerCost: 4500 },
    { id: 2, employeeId: 'EMP-002', name: 'Arjun Mehta',     role: 'Senior Engineer',      departmentId: 'engineering', basic: 140000, allowances: 45000,  overtime: 8500,   bonus: 0,      pf: 16800, esi: 0,    professionalTax: 200, incomeTax: 18200, loanDeduction: 5000, otherDeduction: 0, employerPf: 16800, employerEsi: 0,    gratuity: 6731, otherEmployerCost: 4500 },
    { id: 3, employeeId: 'EMP-003', name: 'Rahul Kapoor',    role: 'Engineer',             departmentId: 'engineering', basic: 95000,  allowances: 30000,  overtime: 0,      bonus: 0,      pf: 11400, esi: 1875, professionalTax: 200, incomeTax: 8500,  loanDeduction: 0,    otherDeduction: 500, employerPf: 11400, employerEsi: 5938, gratuity: 4567, otherEmployerCost: 4500 },
    { id: 4, employeeId: 'EMP-004', name: 'Neha Iyer',       role: 'Design Lead',          departmentId: 'design',      basic: 130000, allowances: 40000,  overtime: 0,      bonus: 0,      pf: 15600, esi: 0,    professionalTax: 200, incomeTax: 14500, loanDeduction: 0,    otherDeduction: 0, employerPf: 15600, employerEsi: 0,    gratuity: 6250, otherEmployerCost: 4500 },
    { id: 5, employeeId: 'EMP-005', name: 'Sara Khan',       role: 'Senior Designer',      departmentId: 'design',      basic: 85000,  allowances: 25000,  overtime: 0,      bonus: 10000,  pf: 10200, esi: 2063, professionalTax: 200, incomeTax: 5500,  loanDeduction: 0,    otherDeduction: 0, employerPf: 10200, employerEsi: 6531, gratuity: 4087, otherEmployerCost: 4500 },
    { id: 6, employeeId: 'EMP-006', name: 'Marcus Vance',    role: 'Sales Director',       departmentId: 'sales',       basic: 150000, allowances: 50000,  overtime: 0,      bonus: 25000,  pf: 18000, esi: 0,    professionalTax: 200, incomeTax: 22500, loanDeduction: 0,    otherDeduction: 0, employerPf: 18000, employerEsi: 0,    gratuity: 7212, otherEmployerCost: 4500 },
    { id: 7, employeeId: 'EMP-007', name: 'Anita Desai',     role: 'Operations Mgr',       departmentId: 'operations',  basic: 105000, allowances: 35000,  overtime: 0,      bonus: 0,      pf: 12600, esi: 1313, professionalTax: 200, incomeTax: 10500, loanDeduction: 0,    otherDeduction: 0, employerPf: 12600, employerEsi: 4156, gratuity: 5048, otherEmployerCost: 4500 },
    { id: 8, employeeId: 'EMP-008', name: 'Vikram Singh',    role: 'Finance Manager',      departmentId: 'finance',     basic: 110000, allowances: 35000,  overtime: 0,      bonus: 0,      pf: 13200, esi: 0,    professionalTax: 200, incomeTax: 11200, loanDeduction: 0,    otherDeduction: 0, employerPf: 13200, employerEsi: 0,    gratuity: 5288, otherEmployerCost: 4500 },
    { id: 9, employeeId: 'EMP-009', name: 'Alex Hartwell',   role: 'Managing Director',    departmentId: 'leadership',  basic: 240000, allowances: 80000,  overtime: 0,      bonus: 0,      pf: 28800, esi: 0,    professionalTax: 200, incomeTax: 52000, loanDeduction: 0,    otherDeduction: 0, employerPf: 28800, employerEsi: 0,    gratuity: 11538, otherEmployerCost: 4500 },
  ],

  priorTotals: { gross: 1685000, net: 1428000, ctc: 1838500 },

  includeDepartmentSummary: true,
  includeDeductionsBreakdown: true,
  includeEmployerContributions: true,
  includePriorComparison: true,

  notes: 'May 2026 payroll · 9 active employees. Bonus payment for sales director (₹25K), engineering retention bonus (₹10K). One new hire (Rahul Kapoor) joined mid-April — first full month of pay. Headcount stable; total CTC up 2.1% MoM driven by allowance review effective 1 May.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const purpose = useMemo(() => findSummaryPurpose(data.purposeId), [data.purposeId])
  const result = useMemo(() => computeSummary(data), [data])
  const departments = useMemo(() => buildDepartmentSummary(result.rows), [result.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setPriorField = (k) => (v) => setData((s) => ({ ...s, priorTotals: { ...(s.priorTotals || {}), [k]: v } }))
  const setEmployees = (items) => setData((s) => ({ ...s, employees: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    employees: data.employees.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generatePayrollSummaryPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generatePayrollSummaryXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <PayrollIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Payroll · {data.employees.length} employees · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Report title" value={data.reportTitle} onChange={setField('reportTitle')} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference"   value={data.reference}   onChange={setField('reference')} mono />
          <TextInput label="Period label" value={data.periodLabel} onChange={setField('periodLabel')} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
          <TextInput label="Entity name" value={data.entityName} onChange={setField('entityName')} />
          <SelectInput label="Currency"  value={data.currency}   onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="Frequency" value={data.frequencyId} onChange={setField('frequencyId')}
            options={PAYROLL_FREQUENCIES.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Purpose"   value={data.purposeId}   onChange={setField('purposeId')}
            options={SUMMARY_PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Employees */}
        <EmployeeList items={data.employees} setItems={setEmployees} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Optional sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Department summary"        desc="Headcount + totals per department"
            checked={data.includeDepartmentSummary}      onChange={setField('includeDepartmentSummary')} />
          <ToggleRow label="Deductions breakdown"      desc="PF / ESI / PT / income tax / loan / other"
            checked={data.includeDeductionsBreakdown}    onChange={setField('includeDeductionsBreakdown')} />
          <ToggleRow label="Employer contributions"    desc="Employer PF / ESI / gratuity rollup"
            checked={data.includeEmployerContributions}  onChange={setField('includeEmployerContributions')} />
          <ToggleRow label="Prior-period comparison"   desc="Gross, net, CTC vs prior period"
            checked={data.includePriorComparison}        onChange={setField('includePriorComparison')} />
        </div>

        {data.includePriorComparison && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <NumberInput label="Prior gross" value={data.priorTotals?.gross || 0} onChange={setPriorField('gross')} suffix={cur.code} />
            <NumberInput label="Prior net"   value={data.priorTotals?.net || 0}   onChange={setPriorField('net')}   suffix={cur.code} />
            <NumberInput label="Prior CTC"   value={data.priorTotals?.ctc || 0}   onChange={setPriorField('ctc')}   suffix={cur.code} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Gross wages</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(result.totals.gross)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Net paid out</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-success">{formatNumber(result.totals.net)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Headcount</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-accounting">{result.rows.length}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Deductions</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(result.totals.totalDeductions)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">Employer cost</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(result.totals.employerTotal)}</p>
          </div>
        </div>

        {/* Department preview */}
        {departments.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              By department ({departments.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Dept</th>
                    <th className="py-1 text-right font-normal">HC</th>
                    <th className="py-1 text-right font-normal">Gross</th>
                    <th className="py-1 text-right font-normal">CTC</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {departments.map((d) => (
                    <tr key={d.departmentId} className="border-t border-line">
                      <td className="py-1 text-ink-700">{d.label}</td>
                      <td className="py-1 text-right text-ink-700">{d.headcount}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(d.gross)}</td>
                      <td className="py-1 text-right text-accounting">{formatNumber(d.ctc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-accounting/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">Total cost-to-company</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.periodLabel || 'period'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(result.totals.ctc, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Hiring changes, bonus drivers, special items…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Payroll PDF'}
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

function ReportMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-accounting" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">PAYROLL SUMMARY</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Payroll Summary — May 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Sonchoy Studio Pvt Ltd · 9 employees · monthly</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-accounting" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['HEADCOUNT',  '9'],
            ['GROSS',      'INR 17.2L'],
            ['NET',        'INR 14.6L'],
            ['CTC',        'INR 18.8L'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-accounting">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">EMPLOYEE DETAIL</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_60px_60px_60px] gap-1 bg-accounting/15 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-accounting">
            <span>EMPLOYEE</span>
            <span className="text-right">GROSS</span>
            <span className="text-right">DEDUCT</span>
            <span className="text-right">NET</span>
          </div>
          {[
            ['Alex Hartwell · MD',         '3,20,000', '81,000', '2,39,000'],
            ['Priya Shah · Eng Lead',      '2,40,000', '50,300', '1,89,700'],
            ['Marcus Vance · Sales',       '2,25,000', '40,700', '1,84,300'],
            ['Arjun Mehta · Sr Eng',       '1,93,500', '40,200', '1,53,300'],
            ['Neha Iyer · Design Lead',    '1,70,000', '30,300', '1,39,700'],
            ['+ 4 more...',                '',         '',       ''],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_60px_60px_60px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="truncate">{r[0]}</span>
              <span className="text-right">{r[1]}</span>
              <span className="text-right text-ink-700">{r[2]}</span>
              <span className="text-right text-success font-bold">{r[3]}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_60px_60px_60px] gap-1 border-t-2 border-accounting/40 bg-accounting/10 px-1.5 py-1 font-mono text-[8.5px] font-bold text-accounting">
            <span>TOTAL</span>
            <span className="text-right">17,18,500</span>
            <span className="text-right">2,57,938</span>
            <span className="text-right">14,60,562</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[10px] italic text-ink-500">+ department rollup, deductions breakdown, employer contributions, MoM comparison in the full PDF</p>
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
            Employee rows in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            full payroll roll-up out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            One row per employee with their gross, deductions, net pay, and employer contributions. Plus department rollups, deductions and employer-contribution breakdowns, and prior-period comparison.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <PayrollIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Payroll Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  9 employees · May 2026
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Entity',          'Sonchoy Studio Pvt Ltd'],
                  ['Period',          'May 2026 (monthly)'],
                  ['Headcount',       '9 (across 6 departments)'],
                  ['Gross wages',     'INR 17,18,500'],
                  ['Total deductions', 'INR 2,57,938'],
                  ['Net paid out',    'INR 14,60,562'],
                  ['Employer cost',   'INR 1,87,613'],
                  ['Total CTC',       'INR 18,77,613'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Cost-to-company</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 18,77,613</span>
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
                  Audit-ready
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
  ['01', 'Drop in the employees', 'Per employee: ID, name, department, gross components, deductions, employer contributions. The tool computes net pay and CTC for each.'],
  ['02', 'See the totals',         'Gross wages, total deductions, net paid out, total employer cost — all rolled up. Department breakdown shows headcount and cost per team.'],
  ['03', 'Export PDF + XLSX',      'PDF: full landscape table + department summary + deductions/employer breakdowns + MoM comparison. XLSX: Summary, Employees, By Department.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              The view{' '}
              <em className="font-serif font-normal italic text-crimson-300">finance hands</em>{' '}
              to the CFO.
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Individual payslips tell each employee their story. This tool tells the company&rsquo;s story — one row per employee with every gross, deduction, and contribution line, plus department-level rollups for the people who think in totals.
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
  { title: 'Multi-employee view',         desc: 'One row per employee with basic, allowances, overtime, bonus, all deductions, employer-side PF/ESI/gratuity, net pay, and CTC.' },
  { title: 'Department rollup',            desc: '8 standard departments (engineering, design, sales, ops, finance, leadership, support, other). Headcount, gross, net, CTC per team.' },
  { title: 'Deductions breakdown',         desc: 'PF, ESI, professional tax, income tax, loan deductions, other deductions — each rolled up across the whole company.' },
  { title: 'Employer contributions',       desc: 'Employer PF, employer ESI, gratuity provision, other employer costs. The full hidden cost of payroll, not just the salaries.' },
  { title: 'Prior-period comparison',      desc: 'Optional MoM comparison block: gross, net, CTC with absolute and percentage variance. Useful for month-end review.' },
  { title: 'PDF + 3-sheet XLSX',           desc: 'PDF (landscape) with full table + rollups + comparison. XLSX: Summary, Employees, By Department — every column numeric.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for monthly close</Eyebrow>
          <SectionTitle>
            The whole{' '}
            <em className="font-serif font-normal italic text-crimson-300">people line</em> — quantified.
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-accounting/20 bg-accounting-bg text-accounting">
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
  { q: 'How is this different from the Salary Slip Generator?',     a: 'The Salary Slip Generator produces a single-employee payslip — what each employee receives. This Payroll Summary covers all employees in one document — what finance and the CFO need. The former is per-person communication; the latter is company-level reporting.' },
  { q: 'And vs the Payroll Tax Report?',                            a: 'The Payroll Tax Report focuses specifically on tax withholding — what gets remitted to the tax authority. This Payroll Summary covers the full payroll picture: wages, all deductions (not just tax), and employer contributions. Use both: this for finance close, the tax report for filing.' },
  { q: 'What numbers should I put for employer PF?',                a: 'In India, employer PF is typically 12% of basic salary (capped at ₹1,800/month for many cases). Calculate manually or use your payroll software\'s figures. The tool doesn\'t enforce a formula — just takes the numbers you provide.' },
  { q: 'What is "CTC" (cost-to-company)?',                          a: 'Gross wages + all employer-side contributions (employer PF, employer ESI, gratuity provision, other employer costs). It\'s the total annual cost of an employee to the company — used for budgeting, salary bands, and offer letters.' },
  { q: 'Can I use this for non-Indian payroll?',                    a: 'Yes — the PF/ESI/PT labels are India-specific, but the columns are flexible. For US payroll, use them as Social Security, Medicare, state tax. For UK, NI and PAYE. The XLSX columns export with the same names; you can rename them downstream.' },
  { q: 'Output formats?',                                            a: 'PDF (landscape orientation to fit the wide employee detail table, plus optional department summary, deductions breakdown, employer contributions, MoM comparison, notes — auto-paginated) and XLSX (3 sheets: Summary, Employees, By Department). All numeric columns are real numbers.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">payroll summaries.</em>
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
  { name: 'Salary Slip Generator',     desc: 'Per-employee payslip PDF.',                Icon: PayslipIcon, label: 'DOCUMENTS' },
  { name: 'Payroll Tax Report',        desc: 'Tax withholding for filing.',              Icon: PayrollIcon, label: 'TAX', path: '/tools/payroll-tax-report' },
  { name: 'Monthly Financial Summary', desc: 'Full P&L + KPIs on one page.',             Icon: ReportIcon,  label: 'ACCOUNTING', path: '/tools/monthly-financial-summary' },
  { name: 'Business Expense Breakdown', desc: 'Expenses by category + MoM.',             Icon: ReportIcon,  label: 'ACCOUNTING', path: '/tools/business-expense-breakdown' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accounting-bg text-accounting">
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

export default function PayrollSummaryTool() {
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
