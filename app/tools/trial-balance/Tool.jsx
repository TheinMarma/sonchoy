'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  ReconcileIcon, PnlIcon, BalanceIcon, ReportIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, ACCOUNT_TYPES, TB_PURPOSES,
  findCurrency, findAccountType, findTbPurpose,
  computeTrialBalance, buildTypeSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/trialBalance/compute'
import { generateTrialBalancePdf } from '@/lib/trialBalance/generatePdf'
import { generateTrialBalanceXlsx } from '@/lib/trialBalance/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Trial Balance Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Dr = Cr',  'Auto-balance check'],
  ['8',        'Account types'],
  ['Grouped',  'or flat listing'],
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
            <span className="text-ink-950">Trial Balance Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(129,140,248,0.25)]" />
            Accounting · Audit-ready
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Debits = Credits{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — balanced
            </em>
            <br />
            and{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              certified.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop in every ledger account with its balance. The tool checks the two columns tie, groups by account type, and produces an auditor-ready PDF with a certification block plus a four-sheet XLSX you can hand to your CA.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Auto-balance check</span>
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

/* ---------- AccountList ---------- */

function AccountList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), code: '', name: '', typeId: 'asset', debit: 0, credit: 0 },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-accounting">Ledger accounts ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20">
          <Plus size={9} /> Add account
        </button>
      </div>
      <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {items.map((a) => (
          <div key={a.id} className="rounded-md border border-line bg-paper p-2">
            <div className="grid grid-cols-[80px_1fr_22px] items-center gap-1.5">
              <input type="text" value={a.code || ''}
                onChange={(e) => update(a.id, { code: e.target.value })}
                placeholder="Code"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              <input type="text" value={a.name || ''}
                onChange={(e) => update(a.id, { name: e.target.value })}
                placeholder="Account name"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-accounting/60" />
              <button type="button" onClick={() => remove(a.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 grid grid-cols-[1.2fr_1fr_1fr] gap-1.5">
              <select value={a.typeId}
                onChange={(e) => update(a.id, { typeId: e.target.value })}
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-accounting/60">
                {ACCOUNT_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
              <input type="number" step="any" value={a.debit || 0}
                onChange={(e) => update(a.id, { debit: Number(e.target.value) || 0 })}
                placeholder="Debit"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
              <input type="number" step="any" value={a.credit || 0}
                onChange={(e) => update(a.id, { credit: Number(e.target.value) || 0 })}
                placeholder="Credit"
                className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-accounting/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  reportTitle: 'Trial Balance — Year ended 31 Mar 2026',
  reference: 'TB-2026-FY-0042',
  entityName: 'Sonchoy Studio Pvt Ltd',
  periodLabel: 'As at 31 Mar 2026',
  purposeId: 'year-end',
  currency: 'INR',

  preparedByName: 'Priya Shah · Finance Lead',
  approvedByName: 'Alex Hartwell · MD',

  accounts: [
    // Assets (debit normal)
    { id: 1,  code: '1000', name: 'Cash at bank — HDFC Current',  typeId: 'asset',     debit: 845000,  credit: 0 },
    { id: 2,  code: '1010', name: 'Cash on hand',                  typeId: 'asset',     debit: 18500,   credit: 0 },
    { id: 3,  code: '1100', name: 'Accounts receivable',           typeId: 'asset',     debit: 612000,  credit: 0 },
    { id: 4,  code: '1200', name: 'Prepaid rent',                  typeId: 'asset',     debit: 90000,   credit: 0 },
    { id: 5,  code: '1500', name: 'Office equipment',              typeId: 'asset',     debit: 420000,  credit: 0 },
    { id: 6,  code: '1510', name: 'Accumulated depreciation — equipment', typeId: 'contra', debit: 0, credit: 84000 },
    // Liabilities (credit normal)
    { id: 7,  code: '2000', name: 'Accounts payable',              typeId: 'liability', debit: 0,       credit: 215000 },
    { id: 8,  code: '2100', name: 'GST payable',                   typeId: 'liability', debit: 0,       credit: 48400 },
    { id: 9,  code: '2200', name: 'Salary payable',                typeId: 'liability', debit: 0,       credit: 92500 },
    { id: 10, code: '2500', name: 'Bank loan — long term',         typeId: 'liability', debit: 0,       credit: 350000 },
    // Equity (credit normal)
    { id: 11, code: '3000', name: 'Share capital',                 typeId: 'equity',    debit: 0,       credit: 500000 },
    { id: 12, code: '3100', name: 'Retained earnings (opening)',   typeId: 'equity',    debit: 0,       credit: 235600 },
    // Revenue (credit normal)
    { id: 13, code: '4000', name: 'Service revenue',               typeId: 'revenue',   debit: 0,       credit: 2840000 },
    { id: 14, code: '4100', name: 'Interest income',               typeId: 'revenue',   debit: 0,       credit: 18500 },
    // Expenses (debit normal)
    { id: 15, code: '5000', name: 'Salaries and wages',            typeId: 'expense',   debit: 1450000, credit: 0 },
    { id: 16, code: '5100', name: 'Rent expense',                  typeId: 'expense',   debit: 360000,  credit: 0 },
    { id: 17, code: '5200', name: 'Marketing expense',             typeId: 'expense',   debit: 145000,  credit: 0 },
    { id: 18, code: '5300', name: 'Software subscriptions',        typeId: 'expense',   debit: 96000,   credit: 0 },
    { id: 19, code: '5400', name: 'Depreciation expense',          typeId: 'expense',   debit: 84000,   credit: 0 },
    { id: 20, code: '5500', name: 'Bank charges & interest',       typeId: 'expense',   debit: 28500,   credit: 0 },
    { id: 21, code: '5900', name: 'Office supplies',               typeId: 'expense',   debit: 35000,   credit: 0 },
  ],

  includeTypeSummary: true,
  includeGrouping: true,
  includeCertification: true,

  notes: 'Trial balance extracted from the GL on 1 Apr 2026 for year ended 31 Mar 2026. Subject to audit adjustments. Accumulated depreciation shown as a contra-asset.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const purpose = useMemo(() => findTbPurpose(data.purposeId), [data.purposeId])
  const computed = useMemo(() => computeTrialBalance(data.accounts), [data.accounts])
  const typeSummary = useMemo(() => buildTypeSummary(computed.rows), [computed.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setAccounts = (items) => setData((s) => ({ ...s, accounts: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    accounts: data.accounts.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateTrialBalancePdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateTrialBalanceXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <ReconcileIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Trial balance · {data.accounts.length} accounts · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Report title" value={data.reportTitle} onChange={setField('reportTitle')} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference" value={data.reference} onChange={setField('reference')} mono />
          <SelectInput label="Purpose" value={data.purposeId} onChange={setField('purposeId')}
            options={TB_PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Entity name" value={data.entityName} onChange={setField('entityName')} />
          <TextInput label="Period label" value={data.periodLabel} onChange={setField('periodLabel')} placeholder="As at 31 Mar 2026" />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
          <TextInput label="Prepared by" value={data.preparedByName} onChange={setField('preparedByName')} />
          <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>
        <div className="mt-2">
          <TextInput label="Approved by" value={data.approvedByName} onChange={setField('approvedByName')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Accounts */}
        <AccountList items={data.accounts} setItems={setAccounts} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Layout
        </span>
        <div className="space-y-2">
          <ToggleRow label="Group accounts by type" desc="Assets, liabilities, equity, revenue, expenses (otherwise flat by code)"
            checked={data.includeGrouping} onChange={setField('includeGrouping')} />
          <ToggleRow label="Type summary table" desc="Roll up debits/credits per type"
            checked={data.includeTypeSummary} onChange={setField('includeTypeSummary')} />
          <ToggleRow label="Certification block" desc="Auditor-style statement with signature lines"
            checked={data.includeCertification} onChange={setField('includeCertification')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Balance status */}
        <div className={`rounded-lg border px-3 py-3 ${computed.inBalance ? 'border-success/40 bg-success/10' : 'border-crimson-500/40 bg-crimson-500/10'}`}>
          <div className="flex items-center justify-between">
            <span className={`font-mono text-[10px] uppercase tracking-[0.1em] ${computed.inBalance ? 'text-success' : 'text-crimson-400'}`}>
              {computed.inBalance ? 'In balance' : `Out of balance · ${formatNumber(Math.abs(computed.difference))}`}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              Dr {formatNumber(computed.totals.debit)} · Cr {formatNumber(computed.totals.credit)}
            </span>
          </div>
        </div>

        {/* Live cards */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total debits</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(computed.totals.debit)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total credits</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(computed.totals.credit)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Accounts</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-accounting">{computed.rows.length}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">total</p>
          </div>
        </div>

        {/* Type breakdown */}
        {typeSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              By account type ({typeSummary.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Type</th>
                    <th className="py-1 text-right font-normal">Accts</th>
                    <th className="py-1 text-right font-normal">Debit</th>
                    <th className="py-1 text-right font-normal">Credit</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {typeSummary.map((t) => (
                    <tr key={t.typeId} className="border-t border-line">
                      <td className="py-1 text-ink-700">{t.label}</td>
                      <td className="py-1 text-right text-ink-700">{t.count}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(t.debit)}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(t.credit)}</td>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">Grand total</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {purpose.label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(computed.totals.debit, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Adjustment context, audit flags, source of trial balance…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Trial Balance PDF'}
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

function TbMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-accounting" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">TRIAL BALANCE</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Trial Balance — FY 2025/26</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Sonchoy Studio Pvt Ltd · As at 31 Mar 2026</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-accounting" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['DEBITS',     'INR 41,90,000',  'text-ink-950'],
            ['CREDITS',    'INR 41,90,000',  'text-ink-950'],
            ['DIFFERENCE', '0.00',           'text-success'],
            ['STATUS',     'IN BALANCE',     'text-success'],
          ].map(([k, v, color]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-accounting">{k}</p>
              <p className={`m-0 mt-0.5 text-[9.5px] font-bold ${color}`}>{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-accounting">ACCOUNTS BY TYPE</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[40px_1fr_60px_60px] gap-1 bg-accounting/15 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-accounting">
            <span>CODE</span><span>ACCOUNT</span>
            <span className="text-right">DEBIT</span>
            <span className="text-right">CREDIT</span>
          </div>
          {[
            ['', 'ASSETS', '', '', true],
            ['1000', 'Cash at bank — HDFC Current',  '8,45,000', '—'],
            ['1100', 'Accounts receivable',           '6,12,000', '—'],
            ['1500', 'Office equipment',              '4,20,000', '—'],
            ['', 'LIABILITIES', '', '', true],
            ['2000', 'Accounts payable',              '—', '2,15,000'],
            ['2500', 'Bank loan — long term',         '—', '3,50,000'],
            ['', 'REVENUE', '', '', true],
            ['4000', 'Service revenue',               '—', '28,40,000'],
          ].map((r, i) => (
            r[4]
              ? (
                <div key={i} className="grid grid-cols-[40px_1fr_60px_60px] gap-1 border-t border-line bg-accounting/5 px-1.5 py-1 font-mono text-[7.5px] font-bold uppercase tracking-[0.08em] text-accounting">
                  <span></span><span>{r[1]}</span><span></span><span></span>
                </div>
              )
              : (
                <div key={i} className="grid grid-cols-[40px_1fr_60px_60px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
                  <span className="text-ink-500">{r[0]}</span>
                  <span className="truncate">{r[1]}</span>
                  <span className="text-right">{r[2]}</span>
                  <span className="text-right">{r[3]}</span>
                </div>
              )
          ))}
          <div className="grid grid-cols-[40px_1fr_60px_60px] gap-1 border-t-2 border-accounting/40 bg-accounting/10 px-1.5 py-1 font-mono text-[8.5px] font-bold text-accounting">
            <span></span><span>GRAND TOTAL</span>
            <span className="text-right">41,90,000</span>
            <span className="text-right">41,90,000</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ certification block with signature lines in the full PDF</p>
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
            GL accounts in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            balanced, certified trial balance out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop in every account with its closing balance. The tool sorts by code, groups by type, subtotals each group, checks debits equal credits, and produces an auditor-ready PDF with a certification block.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <ReconcileIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Trial Balance Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  21 accounts · Year-end
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Entity',         'Sonchoy Studio Pvt Ltd'],
                  ['Period',         'Year ended 31 Mar 2026'],
                  ['Accounts',       '21 GL accounts'],
                  ['Account types',  '6 (asset, liability, equity, revenue, expense, contra)'],
                  ['Total debits',   'INR 41,90,000'],
                  ['Total credits',  'INR 41,90,000'],
                  ['Balance check',  'IN BALANCE ✓'],
                  ['Prepared by',    'Priya Shah · Finance Lead'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Grand total</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 41,90,000</span>
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
                  Auditor-ready
                </span>
              </div>
              <TbMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop in your accounts',  'Code, name, type (asset/liability/equity/revenue/expense/contra), debit, credit. The tool sorts and validates as you type.'],
  ['02', 'Watch the balance check', 'Total debits and total credits must agree. The status card turns red the moment they don\'t — usually a typo in a single account.'],
  ['03', 'Export PDF + XLSX',       'PDF: summary cards, grouped accounts with subtotals, type rollup, certification block, signatures. XLSX: 4 sheets including a working-trial-balance layout.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              The check that{' '}
              <em className="font-serif font-normal italic text-crimson-300">double-entry guarantees.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            In a correctly-posted ledger, total debits always equal total credits — that&rsquo;s what makes it double-entry. The trial balance is the proof you carry into close, audit, or financial-statement prep. This tool produces it and certifies it in two clicks.
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
  { title: '8 account types',           desc: 'Asset, liability, equity, revenue, expense, contra, gain, loss. Each tagged with its normal side (debit or credit) for working-paper clarity.' },
  { title: 'Auto-balance check',         desc: 'Status flips between IN BALANCE (green) and OUT OF BALANCE (red, with the exact difference) the moment you edit anything.' },
  { title: 'Grouped or flat',            desc: 'Group accounts by type with subtotals per group, or list them flat by account code. Match the format your auditor prefers.' },
  { title: 'Certification block',         desc: 'Optional auditor-style certification block with signature lines for "prepared by" and "approved by". Print on letterhead and it\'s file-ready.' },
  { title: 'Per-type rollup',             desc: 'Standalone summary table showing total debits, credits, and net per account type — useful for trend analysis or sanity-checking the lead schedules.' },
  { title: 'PDF + 4-sheet XLSX',          desc: 'PDF: summary cards + grouped accounts + type rollup + certification + notes. XLSX: Summary, Accounts (flat), By Type, By Type · Detail (working TB).' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for audit</Eyebrow>
          <SectionTitle>
            Every column the{' '}
            <em className="font-serif font-normal italic text-crimson-300">auditor</em> opens with.
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
  { q: 'Why must total debits equal total credits?',                  a: 'Every transaction in a double-entry ledger has equal debit and credit sides. When you sum all account balances, they\'re combinations of those equal pairs — so the totals must agree. If they don\'t, there\'s a posting error: a one-sided entry, a typo, or a transposed digit somewhere in the GL.' },
  { q: 'What do I do if it\'s out of balance?',                       a: 'Common causes: (a) a single account entered as both debit AND credit when it should be one side only; (b) a transposed digit (842 vs 824 — the difference will be divisible by 9); (c) an account omitted entirely. The "By Type" summary is a fast diagnostic.' },
  { q: 'What\'s a "contra" account?',                                 a: 'A contra account has a normal side opposite to its parent. Accumulated depreciation is a contra-asset (sits on the credit side but reduces the asset total). Sales returns is a contra-revenue. The tool tracks the normal side so the working trial balance presents these correctly.' },
  { q: 'Should I include opening balances or closing balances?',     a: 'Closing balances for a year-end / month-end trial balance — what\'s in the ledger as at the period-end date. For an opening trial balance (start of a new fiscal year), use the prior period\'s closing balances. The tool doesn\'t distinguish; you just feed it the right numbers.' },
  { q: 'How is this different from the Balance Sheet Generator?',     a: 'Trial Balance is a working paper: every account, both sides shown, debits = credits. Balance Sheet is a financial statement: assets / liabilities / equity only, presented at year-end with grouping and disclosures. You typically prepare the TB first, then derive the BS from it.' },
  { q: 'Output formats?',                                              a: 'PDF (summary cards, balance status, grouped accounts with subtotals OR flat listing, grand total with double-rule line, type rollup, certification block with signature lines, notes — auto-paginated) and XLSX (4 sheets: Summary, Accounts, By Type, By Type · Detail).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">trial balances.</em>
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
  { name: 'Profit & Loss Statement',     desc: 'P&L from a CSV or trial balance.',     Icon: PnlIcon,     label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
  { name: 'Balance Sheet Generator',     desc: 'Assets, liabilities, equity tied out.', Icon: BalanceIcon, label: 'ACCOUNTING', path: '/tools/balance-sheet-generator' },
  { name: 'Income Statement Generator',  desc: 'Revenue, expenses, net income.',        Icon: ReportIcon,  label: 'ACCOUNTING', path: '/tools/income-statement-generator' },
  { name: 'General Ledger Generator',    desc: 'Per-account ledger detail.',            Icon: ReportIcon,  label: 'ACCOUNTING' },
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

export default function TrialBalanceTool() {
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
