'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  BankStatementIcon, ReconcileIcon, PercentIcon, VatIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, CATEGORIES,
  findCurrency, findCategory,
  analyseTransactions, buildCategorySummary, buildVendorSummary, buildMonthlySummary,
  countSections, extractVendor, autoCategorise,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/bankStatementAnalyzer/compute'
import { generateBankStatementAnalysisPdf } from '@/lib/bankStatementAnalyzer/generatePdf'
import { generateBankStatementAnalysisXlsx } from '@/lib/bankStatementAnalyzer/generateXlsx'

import { extractTextFromPdf } from '@/lib/pdfExtract'
import { parseStatement } from '@/lib/parseStatement'

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
    <div role="dialog" aria-modal="true" aria-label="Live Bank Statement Analyzer"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[620px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['18',     'Auto-categories'],
  ['Vendor', 'extraction'],
  ['Recurring', 'vs one-off'],
  ['Free',  'Always · no signup'],
]

function ToolHero() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-48 h-[720px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500) 0%, transparent 60%)' }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 60%)' }} />
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
            <span className="text-tax">Tax &amp; Banking</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Bank Statement Analyzer</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Categorisation
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Every line{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — categorised,
            </em>
            <br />
            tagged, and{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              counted.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop a statement PDF (or paste transactions). The analyzer auto-categorises every line, extracts the vendor, flags recurring vs one-off charges, and rolls everything up by category, vendor, and month.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Auto-categorisation</span>
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
  'focus:border-tax/60 focus:ring-2 focus:ring-tax/20 hover:border-line-strong'

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
        className="h-4 w-4 shrink-0 cursor-pointer accent-tax" />
    </label>
  )
}

/* ---------- TransactionList ---------- */

function TransactionList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), date: todayISO(), description: '', debit: 0, credit: 0, balance: null, categoryId: '' },
  ])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">Transactions ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20">
          <Plus size={9} /> Add row
        </button>
      </div>
      <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {items.map((t) => {
          const auto = autoCategorise(t)
          const effective = t.categoryId || auto
          const cat = findCategory(effective)
          return (
            <div key={t.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[100px_1fr_22px] items-center gap-1.5">
                <input type="date" value={t.date || ''}
                  onChange={(e) => update(t.id, { date: e.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-700 outline-none [color-scheme:dark] focus:border-tax/60" />
                <input type="text" value={t.description || ''}
                  onChange={(e) => update(t.id, { description: e.target.value })}
                  placeholder="Description"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-tax/60" />
                <button type="button" onClick={() => remove(t.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-[1fr_1fr_1fr] gap-1.5">
                <input type="number" step="any" value={t.debit || 0}
                  onChange={(e) => update(t.id, { debit: Number(e.target.value) || 0 })}
                  placeholder="Debit"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={t.credit || 0}
                  onChange={(e) => update(t.id, { credit: Number(e.target.value) || 0 })}
                  placeholder="Credit"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={t.balance ?? ''}
                  onChange={(e) => update(t.id, { balance: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Balance"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <select value={effective}
                  onChange={(e) => update(t.id, { categoryId: e.target.value })}
                  className="min-h-[28px] flex-1 rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60">
                  {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                </select>
                {!t.categoryId && (
                  <span className="rounded-md border border-tax/30 bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax">
                    Auto
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const DEMO_TRANSACTIONS = [
  { date: '2026-04-01', description: 'NORTHWIND BOOKS LTD PAYROLL APR2026',   debit: 0,       credit: 8200,  balance: 12400 },
  { date: '2026-04-02', description: 'TESCO STORES 4421 LONDON',              debit: 142.30,  credit: 0,     balance: 12257.70 },
  { date: '2026-04-03', description: 'NETFLIX MONTHLY SUBSCRIPTION',          debit: 17.99,   credit: 0,     balance: 12239.71 },
  { date: '2026-04-05', description: 'UBER TRIP REF 1882123',                 debit: 18.40,   credit: 0,     balance: 12221.31 },
  { date: '2026-04-06', description: 'SHELL PETROL STATION 8829',             debit: 62.00,   credit: 0,     balance: 12159.31 },
  { date: '2026-04-08', description: 'SAINSBURYS HOLBORN',                    debit: 88.15,   credit: 0,     balance: 12071.16 },
  { date: '2026-04-10', description: 'BRITISH GAS DIRECT DEBIT',              debit: 142.50,  credit: 0,     balance: 11928.66 },
  { date: '2026-04-12', description: 'SPOTIFY UK',                            debit: 9.99,    credit: 0,     balance: 11918.67 },
  { date: '2026-04-14', description: 'AMAZON.CO.UK*1U2P88KQ1',                debit: 49.99,   credit: 0,     balance: 11868.68 },
  { date: '2026-04-15', description: 'PRET A MANGER VICTORIA',                debit: 8.40,    credit: 0,     balance: 11860.28 },
  { date: '2026-04-17', description: 'NETFLIX MONTHLY SUBSCRIPTION REVERSAL', debit: 0,       credit: 17.99, balance: 11878.27 },
  { date: '2026-04-19', description: 'TFL TRAVEL CHARGES',                    debit: 24.80,   credit: 0,     balance: 11853.47 },
  { date: '2026-04-22', description: 'TESCO STORES 4421 LONDON',              debit: 119.20,  credit: 0,     balance: 11734.27 },
  { date: '2026-04-24', description: 'HMRC SELF ASSESSMENT TAX',              debit: 1820.00, credit: 0,     balance: 9914.27 },
  { date: '2026-04-25', description: 'TRANSFER TO SAVINGS A/C 33421',         debit: 500.00,  credit: 0,     balance: 9414.27 },
  { date: '2026-04-28', description: 'AMAZON.CO.UK*1V3P9881',                 debit: 28.40,   credit: 0,     balance: 9385.87 },
  { date: '2026-04-29', description: 'BUPA HEALTH INSURANCE MONTHLY',         debit: 78.50,   credit: 0,     balance: 9307.37 },
  { date: '2026-04-30', description: 'UBER TRIP REF 1882555',                 debit: 14.20,   credit: 0,     balance: 9293.17 },
  { date: '2026-04-30', description: 'BANK MAINTENANCE CHARGE',               debit: 4.00,    credit: 0,     balance: 9289.17 },
  { date: '2026-04-30', description: 'INTEREST CREDIT',                       debit: 0,       credit: 2.13,  balance: 9291.30 },
]

const INITIAL = {
  analysisTitle: 'Bank Statement Analysis — Apr 2026',
  reference: 'BSA-2026-04-0042',
  accountHolder: 'Marcus Vance',
  bank: 'Lloyds Bank',
  accountNumber: '****6411',
  periodLabel: 'Apr 2026',
  currency: 'GBP',

  transactions: DEMO_TRANSACTIONS.map((t, i) => ({ ...t, id: i + 1, categoryId: '' })),

  includeCategorySummary: true,
  includeVendorSummary: true,
  includeMonthlySummary: false,
  includeRecurringBlock: true,

  notes: 'Demo data — apr 2026. Categorisation rules pick up Netflix/Spotify/Bupa as recurring; Tesco appears twice and is flagged as recurring groceries. HMRC tax payment isolated. Override any category in the form to refine.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const computed = useMemo(() => analyseTransactions(data.transactions), [data.transactions])
  const categorySummary = useMemo(() => buildCategorySummary(computed.rows), [computed.rows])
  const vendorSummary   = useMemo(() => buildVendorSummary(computed.rows, 8),  [computed.rows])
  const monthlySummary  = useMemo(() => buildMonthlySummary(computed.rows),    [computed.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setTransactions = (items) => setData((s) => ({ ...s, transactions: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL, transactions: DEMO_TRANSACTIONS.map((t, i) => ({ ...t, id: i + 1, categoryId: '' })) })

  const handleFile = async (file) => {
    if (!file) return
    setUploadError(null)
    setBusy('parse')
    try {
      const { items } = await extractTextFromPdf(file)
      const parsed = parseStatement(items, file.name)
      if (!parsed.transactions || parsed.transactions.length === 0) {
        setUploadError('No transactions detected. The PDF may be scanned or in an unsupported format.')
        return
      }
      setData((s) => ({
        ...s,
        bank: parsed.bank || s.bank,
        accountHolder: parsed.accountHolder || s.accountHolder,
        accountNumber: parsed.accountNumber || s.accountNumber,
        periodLabel: parsed.period || s.periodLabel,
        currency: parsed.currency || s.currency,
        transactions: parsed.transactions.map((t, i) => ({
          id: i + 1,
          date: t.date || '',
          description: t.description || '',
          debit: Number(t.debit) || 0,
          credit: Number(t.credit) || 0,
          balance: t.balance != null ? Number(t.balance) : null,
          categoryId: '',
        })),
      }))
    } catch (err) {
      setUploadError(err?.message || 'Failed to parse the PDF.')
    } finally {
      setBusy(null)
    }
  }

  const buildPayload = () => ({
    ...data,
    transactions: data.transactions.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateBankStatementAnalysisPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateBankStatementAnalysisXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <BankStatementIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Analyser · {data.transactions.length} txns · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* PDF upload */}
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-dashed border-tax/40 bg-tax-bg/20 px-3 py-3 text-[12px] text-ink-700 hover:border-tax/60 hover:bg-tax-bg/40">
          <span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Upload statement PDF</span>
            <span className="ml-2 text-ink-500">100% local — text-based PDFs only</span>
          </span>
          <input type="file" accept="application/pdf" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])} />
          <span className="rounded-md bg-tax px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-950">
            {busy === 'parse' ? 'Parsing…' : 'Choose file'}
          </span>
        </label>
        {uploadError && (
          <p className="m-0 mt-2 text-[11px] text-crimson-400">{uploadError}</p>
        )}

        <div className="my-3.5 h-px bg-line" />

        <TextInput label="Analysis title" value={data.analysisTitle} onChange={setField('analysisTitle')} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference" value={data.reference} onChange={setField('reference')} mono />
          <TextInput label="Period label" value={data.periodLabel} onChange={setField('periodLabel')} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <TextInput label="Account holder" value={data.accountHolder} onChange={setField('accountHolder')} />
          <TextInput label="Bank"           value={data.bank}          onChange={setField('bank')} />
          <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>
        <div className="mt-2">
          <TextInput label="Account number" value={data.accountNumber} onChange={setField('accountNumber')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Transactions */}
        <TransactionList items={data.transactions} setItems={setTransactions} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Summary sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="By category"       desc="Spend grouped by auto-detected category"
            checked={data.includeCategorySummary} onChange={setField('includeCategorySummary')} />
          <ToggleRow label="Top vendors"        desc="Highest-spend vendors with recurring flag"
            checked={data.includeVendorSummary}   onChange={setField('includeVendorSummary')} />
          <ToggleRow label="By month"           desc="Monthly inflow / outflow / net"
            checked={data.includeMonthlySummary}  onChange={setField('includeMonthlySummary')} />
          <ToggleRow label="Recurring vs one-off" desc="Highlight the recurring portion of spend"
            checked={data.includeRecurringBlock}  onChange={setField('includeRecurringBlock')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Inflows</p>
            <p className="m-0 mt-1 font-mono text-[12.5px] font-semibold text-success">{formatNumber(computed.totals.totalCredit)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Outflows</p>
            <p className="m-0 mt-1 font-mono text-[12.5px] font-semibold text-crimson-400">{formatNumber(computed.totals.totalDebit)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Net</p>
            <p className={`m-0 mt-1 font-mono text-[12.5px] font-semibold ${computed.totals.net >= 0 ? 'text-success' : 'text-crimson-400'}`}>
              {computed.totals.net >= 0 ? '+' : '-'}{formatNumber(Math.abs(computed.totals.net))}
            </p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-tax/30 bg-tax-bg/40 px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-tax">Recurring spend</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-ink-950">{formatNumber(computed.totals.recurringDebit)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">One-off spend</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-ink-950">{formatNumber(computed.totals.oneOffDebit)}</p>
          </div>
        </div>

        {/* Category preview */}
        {categorySummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              By category ({categorySummary.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Category</th>
                    <th className="py-1 text-right font-normal">Txns</th>
                    <th className="py-1 text-right font-normal">Spend</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {categorySummary.map((c) => (
                    <tr key={c.categoryId} className="border-t border-line">
                      <td className="py-1 text-ink-700">{c.label}</td>
                      <td className="py-1 text-right text-ink-700">{c.count}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(c.debit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top vendors preview */}
        {vendorSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Top vendors ({vendorSummary.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Vendor</th>
                    <th className="py-1 text-right font-normal">Txns</th>
                    <th className="py-1 text-right font-normal">Spend</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {vendorSummary.map((v, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1 text-ink-700">
                        {v.vendor.slice(0, 24)}
                        {v.recurring && <span className="ml-1 rounded bg-tax-bg px-1 font-mono text-[7.5px] uppercase tracking-[0.08em] text-tax">R</span>}
                      </td>
                      <td className="py-1 text-right text-ink-700">{v.count}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(v.debit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">Net flow</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.transactions.length} transactions
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {computed.totals.net >= 0 ? '+' : '-'}{formatMoney(Math.abs(computed.totals.net), data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Context, anomalies to flag, category overrides explained…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Analysis PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX (5 sheets) <ArrowRight size={10} /></>)}
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

function AnalysisMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">BANK STATEMENT ANALYSIS</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Bank Statement Analysis — Apr 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Marcus Vance · Lloyds Bank · ****6411</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['INFLOWS',   'GBP 8,220'],
            ['OUTFLOWS',  'GBP 3,032'],
            ['NET',       '+GBP 5,188'],
            ['TXNS',      '20'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">BY CATEGORY</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_60px_60px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>CATEGORY</span><span className="text-right">TXNS</span>
            <span className="text-right">SPEND</span>
          </div>
          {[
            ['Tax / govt',         '1', '1,820'],
            ['Groceries',          '2',   '261'],
            ['Utilities',          '1',   '143'],
            ['Transport',          '3',   '105'],
            ['Health / medical',   '1',    '79'],
            ['Shopping',           '2',    '78'],
            ['Subscriptions',      '2',    '28'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_60px_60px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span>{r[0]}</span>
              <span className="text-right text-ink-700">{r[1]}</span>
              <span className="text-right font-bold">{r[2]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">RECURRING vs ONE-OFF</p>
        <div className="mt-1 rounded border border-line bg-canvas px-2 py-2">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-ink-700">Recurring (subscriptions, bills)</span>
            <span className="font-mono font-bold text-ink-950">GBP 358</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[9px]">
            <span className="text-ink-700">One-off</span>
            <span className="font-mono font-bold text-ink-950">GBP 2,674</span>
          </div>
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
            Raw statement in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            categorised analysis out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Every line tagged with a category and vendor. Top spend by category, top vendors with recurring flags, and a clean recurring-vs-one-off breakdown of where the money really goes.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <BankStatementIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Analyzer Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  20 txns · Apr 2026
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source',         'Upload PDF or paste rows'],
                  ['Account',        'Lloyds Bank · ****6411'],
                  ['Auto-categories', '18 (groceries, transport, etc.)'],
                  ['Vendor extract', 'Heuristic + recurring detection'],
                  ['Inflows',        'GBP 8,220.12'],
                  ['Outflows',       'GBP 3,032.95'],
                  ['Recurring',      'GBP 358.48 (subs + bills)'],
                  ['Net flow',       '+GBP 5,187.17'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Net flow</span>
                <span className="font-mono text-[14px] font-semibold text-paper">+GBP 5,187.17</span>
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
                  Insight-ready
                </span>
              </div>
              <AnalysisMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop a statement',  'Upload a text-based PDF — the parser pulls dates, descriptions, debits, credits, and balances. Or paste/edit rows directly in the form.'],
  ['02', 'Auto-categorise',    'Rules match common vendors (Tesco, Uber, Netflix, HMRC, etc.) and tag each line with a category. Override any row in the table.'],
  ['03', 'Export PDF + XLSX',  'PDF: summary cards, category rollup, top vendors, recurring block, full transactions. XLSX: 5 sheets ready for further analysis or accountant hand-off.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Statement noise{' '}
              <em className="font-serif font-normal italic text-crimson-300">→ signal.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A bank statement is 200 lines of cryptic vendor strings. This tool turns them into category totals, top-vendor rankings, and a recurring-vs-one-off split — the same shape your accountant or CFO would build by hand in an hour.
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
  { title: 'PDF statement import',     desc: 'Drop a text-based statement PDF — parser pulls dates, descriptions, debits, credits, balances, and account header info into the table.' },
  { title: '18 spend categories',      desc: 'Income, groceries, dining, transport, travel, utilities, rent, subscriptions, shopping, health, entertainment, fees, tax, investments, transfers, etc.' },
  { title: 'Vendor extraction',        desc: 'Heuristic strip-and-take of the leading 2–4 words of each description — turns "TESCO STORES 4421 LONDON" into "Tesco Stores".' },
  { title: 'Recurring detection',      desc: 'Vendors appearing 2+ times in the period get flagged as recurring. Powers the recurring-vs-one-off breakdown and helps spot subscription creep.' },
  { title: 'Category override',         desc: 'Auto-categorisation is rules-based — override any row from the dropdown if it gets it wrong. The category is then preserved in PDF and XLSX output.' },
  { title: 'PDF + 5-sheet XLSX',       desc: 'PDF: summary cards + category rollup + top vendors + monthly + recurring block + full transactions. XLSX: Summary, Transactions, By Category, Vendors, Monthly.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for clarity</Eyebrow>
          <SectionTitle>
            From{' '}
            <em className="font-serif font-normal italic text-crimson-300">200 lines</em>{' '}
            to 10 numbers.
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-tax/20 bg-tax-bg text-tax">
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
  { q: 'Is my statement data uploaded anywhere?',                a: 'No. The PDF is parsed entirely in your browser using pdf.js — nothing is sent to a server. Same for the XLSX and PDF exports: they\'re built locally and saved straight to your device.' },
  { q: 'How is this different from Bank Statement PDF to Excel?', a: 'The PDF-to-Excel tool just converts: same data, new format. This Analyzer adds the value layer on top — categorisation, vendor extraction, recurring detection, and the rollups by category and vendor that turn raw data into a spending picture.' },
  { q: 'What about scanned (image-based) PDFs?',                  a: 'Auto-parsing only works on text-based statement PDFs, which almost all modern banks export. Scanned statements would need OCR first — not currently supported. You can always paste or type rows manually if needed.' },
  { q: 'Why is my Amazon purchase categorised as Shopping but it was groceries?', a: 'Rules-based categorisation gets common cases right but misses ambiguous vendors. Override any row from the dropdown in the form — the override is preserved into the PDF and XLSX exports.' },
  { q: 'What counts as "recurring"?',                             a: 'A vendor that appears 2 or more times in the same statement gets flagged. So weekly grocery runs at Tesco show as recurring, while a one-off Amazon purchase doesn\'t. For longer-term recurrence detection, run multiple months and compare.' },
  { q: 'Output formats?',                                          a: 'PDF (single document with summary cards, category rollup, top vendors, monthly breakdown, recurring block, full transaction table, notes — auto-paginated) and XLSX (5 sheets: Summary, Transactions, By Category, Vendors, Monthly). All numeric.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">statement analysis.</em>
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
  { name: 'Bank Statement PDF to Excel', desc: 'Convert without categorisation.',           Icon: BankStatementIcon, label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
  { name: 'Bank Reconciliation Sheet',   desc: 'Match book balance to bank balance.',       Icon: ReconcileIcon,     label: 'ACCOUNTING' },
  { name: 'Income Tax Estimator',        desc: 'Annual liability across slabs.',            Icon: PercentIcon,       label: 'TAX', path: '/tools/income-tax-estimator' },
  { name: 'GST Calculation Sheet',       desc: 'India GST workings with HSN/SAC.',          Icon: VatIcon,           label: 'TAX', path: '/tools/gst-calculation-sheet' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-tax">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-tax-bg text-tax">
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

export default function BankStatementAnalyzerTool() {
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
