'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  VatIcon, PercentIcon, PayrollIcon, EmiIcon, AmortIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, DEDUCTION_CATEGORIES, PROOF_STATUSES, SUMMARY_PURPOSES,
  findCurrency, findCategory, findProofStatus, findSummaryPurpose,
  computeDeductions, buildCategorySummary, buildSectionSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/taxDeductionSummary/compute'
import { generateTaxDeductionPdf } from '@/lib/taxDeductionSummary/generatePdf'
import { generateTaxDeductionXlsx } from '@/lib/taxDeductionSummary/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Tax Deduction Summary"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[600px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['9',         'Categories'],
  ['Per-section', 'Limit & headroom'],
  ['Audit',     'Proof-status tracking'],
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
            <span className="text-ink-950">Tax Deduction Summary</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · Audit trail
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Every deduction{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — with the proof
            </em>
            <br />
            to back it{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              up.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            A clean, section-wise summary of every deduction claimed — with category limits, unused headroom, proof-document references, and verification status. Built for filing, audit support, or employer declarations.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Proof status tracking</span>
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

/* ---------- DeductionList ---------- */

const STATUS_TONE = {
  verified: 'text-success',
  pending:  'text-yellow-500',
  missing:  'text-crimson-400',
  'n/a':    'text-ink-500',
}

function DeductionList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    {
      id: Date.now() + Math.random(),
      section: '', sectionLabel: '',
      categoryId: 'investment',
      description: '',
      amount: 0, limit: 0,
      proofRef: '',
      proofStatusId: 'pending',
    },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">Claimed deductions</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20">
          <Plus size={9} /> Add deduction
        </button>
      </div>
      <div className="space-y-2">
        {items.map((it) => {
          const amount = Number(it.amount) || 0
          const limit  = Number(it.limit)  || 0
          const claimable = limit > 0 ? Math.min(amount, limit) : amount
          return (
            <div key={it.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
                <input type="text" value={it.description || ''}
                  onChange={(e) => update(it.id, { description: e.target.value })}
                  placeholder="What is being claimed"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-tax/60" />
                <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-[80px_1fr_1fr] gap-1.5">
                <input type="text" value={it.section || ''}
                  onChange={(e) => update(it.id, { section: e.target.value })}
                  placeholder="Section"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="text" value={it.sectionLabel || ''}
                  onChange={(e) => update(it.id, { sectionLabel: e.target.value })}
                  placeholder="Section label (e.g. Life insurance premium)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <select value={it.categoryId}
                  onChange={(e) => update(it.id, { categoryId: e.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60">
                  {DEDUCTION_CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                </select>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <input type="number" step="any" value={it.amount}
                  onChange={(e) => update(it.id, { amount: e.target.value })}
                  placeholder="Amount"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={it.limit}
                  onChange={(e) => update(it.id, { limit: e.target.value })}
                  placeholder="Limit (0 = no cap)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
              </div>
              <div className="mt-1.5 grid grid-cols-[1fr_140px] gap-1.5">
                <input type="text" value={it.proofRef || ''}
                  onChange={(e) => update(it.id, { proofRef: e.target.value })}
                  placeholder="Proof reference (e.g. invoice no, policy no)"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <select value={it.proofStatusId}
                  onChange={(e) => update(it.id, { proofStatusId: e.target.value })}
                  className={`min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] outline-none focus:border-tax/60 ${STATUS_TONE[it.proofStatusId] || 'text-ink-950'}`}>
                  {PROOF_STATUSES.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
                </select>
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[10.5px]">
                <span className="text-ink-500">
                  Claimable {limit > 0 && amount > limit && <span className="text-crimson-400">(capped)</span>}
                </span>
                <span className="font-semibold text-tax">{formatNumber(claimable)}</span>
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
  summaryTitle: 'Tax Deduction Summary — AY 2025/26',
  reference: 'TDS-2026-0117',
  purposeId: 'filing',
  taxpayerName: 'Marcus Vance',
  taxYear: 'AY 2025/26 (FY 2024/25)',

  taxpayer: {
    taxId: 'PAN ABCDE1234F',
    address: 'Flat 4B, Brigade Gateway, Bengaluru 560055',
    email: 'marcus@northwindbooks.com',
  },

  currency: 'INR',

  deductions: [
    { id: 1, section: '80C',   sectionLabel: 'ELSS — Axis Long Term Equity',  categoryId: 'investment', description: 'Equity-linked savings scheme (3-yr lock-in)', amount: 80000, limit: 150000, proofRef: 'AXS-ELSS-882134', proofStatusId: 'verified' },
    { id: 2, section: '80C',   sectionLabel: 'PPF deposit',                   categoryId: 'investment', description: 'Public Provident Fund annual contribution',  amount: 70000, limit: 0,      proofRef: 'PPF-9234561',    proofStatusId: 'verified' },
    { id: 3, section: '80C',   sectionLabel: 'Life insurance premium',         categoryId: 'insurance',  description: 'LIC Jeevan Anand · annual premium',          amount: 24000, limit: 0,      proofRef: 'LIC-PREM-44211', proofStatusId: 'verified' },
    { id: 4, section: '80D',   sectionLabel: 'Health insurance — self',         categoryId: 'insurance',  description: 'Star Health Family Floater',                amount: 18500, limit: 25000,  proofRef: 'STAR-HI-7723',   proofStatusId: 'verified' },
    { id: 5, section: '80D',   sectionLabel: 'Health insurance — parents',      categoryId: 'insurance',  description: 'Parental health policy (senior citizens)',   amount: 32000, limit: 50000,  proofRef: 'STAR-HI-8901',   proofStatusId: 'pending'  },
    { id: 6, section: '80E',   sectionLabel: 'Education loan interest',         categoryId: 'education',  description: 'Interest paid on education loan',            amount: 18000, limit: 0,      proofRef: 'HDFC-EL-INT-FY25', proofStatusId: 'verified' },
    { id: 7, section: '80G',   sectionLabel: 'Donation — registered NGO',       categoryId: 'charity',    description: 'CRY (Child Rights and You) · 50%',           amount: 25000, limit: 0,      proofRef: 'CRY-RCPT-2026-103', proofStatusId: 'missing'  },
    { id: 8, section: '24(b)', sectionLabel: 'Home loan interest',              categoryId: 'housing',    description: 'Interest on self-occupied home loan',        amount: 215000, limit: 200000, proofRef: 'SBI-HOMELOAN-CERT', proofStatusId: 'verified' },
    { id: 9, section: 'HRA',   sectionLabel: 'House rent allowance',            categoryId: 'housing',    description: 'Section 10(13A) HRA exemption — rented flat', amount: 180000, limit: 0,    proofRef: 'RENT-AGT-2025-LL', proofStatusId: 'pending'  },
  ],

  includeCategorySummary: true,
  includeSectionSummary: true,
  includeProofAudit: true,

  notes: 'Prepared for ITR filing. ₹25,000 80G donation receipt awaiting digital copy from CRY — flagged. Home loan interest exceeds ₹2L cap by ₹15K — only ₹2L claimable. HRA exemption to be re-verified against rent receipts on file before filing.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const purpose = useMemo(() => findSummaryPurpose(data.purposeId), [data.purposeId])
  const computed = useMemo(() => computeDeductions(data.deductions), [data.deductions])
  const categorySummary = useMemo(() => buildCategorySummary(computed.rows), [computed.rows])
  const sectionSummary  = useMemo(() => buildSectionSummary(computed.rows),  [computed.rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setTaxpayerField = (k) => (v) => setData((s) => ({ ...s, taxpayer: { ...s.taxpayer, [k]: v } }))
  const setDeductions = (items) => setData((s) => ({ ...s, deductions: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    deductions: data.deductions.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateTaxDeductionPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateTaxDeductionXlsx(buildPayload()) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <VatIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Deductions · {data.deductions.length} items · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Summary title" value={data.summaryTitle} onChange={setField('summaryTitle')} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference" value={data.reference} onChange={setField('reference')} mono />
          <TextInput label="Tax year" value={data.taxYear} onChange={setField('taxYear')} placeholder="AY 2025/26" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Taxpayer name" value={data.taxpayerName} onChange={setField('taxpayerName')} />
          <SelectInput label="Purpose" value={data.purposeId} onChange={setField('purposeId')}
            options={SUMMARY_PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Taxpayer */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Taxpayer details
        </span>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Tax ID / PAN" value={data.taxpayer.taxId} onChange={setTaxpayerField('taxId')} mono />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <TextareaInput label="Address" value={data.taxpayer.address} onChange={setTaxpayerField('address')} rows={2} />
          <TextInput label="Email" value={data.taxpayer.email} onChange={setTaxpayerField('email')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Deductions */}
        <DeductionList items={data.deductions} setItems={setDeductions} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Summary sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Category summary" desc="Roll up by deduction category"
            checked={data.includeCategorySummary} onChange={setField('includeCategorySummary')} />
          <ToggleRow label="Section-code summary" desc="Roll up by section code (80C, 80D, etc.)"
            checked={data.includeSectionSummary} onChange={setField('includeSectionSummary')} />
          <ToggleRow label="Proof-document audit" desc="Verified / pending / missing counts"
            checked={data.includeProofAudit} onChange={setField('includeProofAudit')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total claimable</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(computed.totals.claimable)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Unused headroom</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(computed.totals.unused)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-success">Verified</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-success">{computed.verifiedCount}</p>
          </div>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-yellow-600">Pending</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-yellow-600">{computed.pendingCount}</p>
          </div>
          <div className="rounded-lg border border-crimson-500/40 bg-crimson-500/10 px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-crimson-400">Missing</p>
            <p className="m-0 mt-0.5 font-mono text-[12px] font-bold text-crimson-400">{computed.missingCount}</p>
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
                    <th className="py-1 text-right font-normal">Items</th>
                    <th className="py-1 text-right font-normal">Claimable</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {categorySummary.map((c) => (
                    <tr key={c.categoryId} className="border-t border-line">
                      <td className="py-1 text-ink-700">{c.label}</td>
                      <td className="py-1 text-right text-ink-700">{c.count}</td>
                      <td className="py-1 text-right text-tax">{formatNumber(c.claimable)}</td>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">Total deductions claimable</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {computed.rows.length} items
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(computed.totals.claimable, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Audit flags, follow-ups, filing context…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Deduction Summary PDF'}
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

function SummaryMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">TAX DEDUCTION SUMMARY</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">Tax Deduction Summary — AY 2025/26</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Marcus Vance · PAN ABCDE1234F</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['CLAIMED',     'INR 4,84,500'],
            ['LIMIT',       'INR 4,25,000'],
            ['UNUSED',      'INR 30,000'],
            ['VERIFIED',    '5 / 9'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[9.5px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">CLAIMED DEDUCTIONS</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[40px_1fr_70px_60px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>SEC</span><span>DESCRIPTION</span>
            <span className="text-right">CLAIM</span>
            <span className="text-right">STATUS</span>
          </div>
          {[
            ['80C',   'ELSS — Axis',                  '80,000', 'Verified',  'text-success'],
            ['80C',   'PPF deposit',                  '70,000', 'Verified',  'text-success'],
            ['80D',   'Parental health insurance',    '32,000', 'Pending',   'text-yellow-500'],
            ['80E',   'Education loan interest',      '18,000', 'Verified',  'text-success'],
            ['80G',   'CRY donation',                 '25,000', 'Missing',   'text-crimson-400'],
            ['24(b)', 'Home loan interest (capped)', '2,00,000', 'Verified', 'text-success'],
            ['HRA',   'HRA exemption',               '1,80,000', 'Pending',  'text-yellow-500'],
          ].map((r) => (
            <div key={r[1]} className="grid grid-cols-[40px_1fr_70px_60px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-700">{r[0]}</span>
              <span className="truncate">{r[1]}</span>
              <span className="text-right font-bold text-tax">{r[2]}</span>
              <span className={`text-right ${r[4]}`}>{r[3]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {[
            ['VERIFIED', '5', 'text-success', 'border-success/40 bg-success/10'],
            ['PENDING',  '2', 'text-yellow-500', 'border-yellow-500/40 bg-yellow-500/10'],
            ['MISSING',  '1', 'text-crimson-400', 'border-crimson-500/40 bg-crimson-500/10'],
          ].map(([k, v, t, c]) => (
            <div key={k} className={`rounded border px-2 py-1.5 ${c}`}>
              <p className={`m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] ${t}`}>{k}</p>
              <p className={`m-0 mt-0.5 text-[10px] font-bold ${t}`}>{v}</p>
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
            Receipts in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            an audit-ready summary out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            One line per deduction with section code, limit, claimable amount, proof reference, and verification status. Rolled up by category and section — and flagged where proof is missing.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <VatIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Deduction Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  9 items · AY 2025/26
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Taxpayer',      'Marcus Vance · PAN ABCDE1234F'],
                  ['Tax year',      'AY 2025/26 (FY 2024/25)'],
                  ['Purpose',       'Filing preparation'],
                  ['Sections used', '80C, 80D, 80E, 80G, 24(b), HRA'],
                  ['Total claimed', 'INR 4,84,500.00'],
                  ['Total limit',   'INR 4,25,000.00'],
                  ['Headroom',      'INR 30,000.00'],
                  ['Proof status',  '5 verified · 2 pending · 1 missing'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Total claimable</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 4,84,500.00</span>
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
              <SummaryMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Add each claim',     'Section code, description, category, amount, limit, proof reference. Limit can be left as 0 for uncapped sections like home loan principal.'],
  ['02', 'Track proof status',  'Mark each item Verified, Pending, Missing, or Not Required. The summary shows counts at a glance — missing items get flagged in red.'],
  ['03', 'Export PDF + XLSX',   'PDF: summary cards, full deductions table, category rollup, section rollup, proof-audit block, notes. XLSX has 4 numeric sheets ready for the CA.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Built for{' '}
              <em className="font-serif font-normal italic text-crimson-300">filings &amp; audits.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most deduction errors aren&rsquo;t mistakes in the maths — they&rsquo;re missing receipts. This tool tracks both. Every claim sits next to its proof reference and verification status, and the audit block tells you what&rsquo;s still outstanding before you file.
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
  { title: 'Section + limit per claim',  desc: 'Each deduction carries its section code (80C, 80D, etc.), its statutory limit, and the amount you\'re claiming. The tool caps claimable at the limit automatically.' },
  { title: 'Unused-headroom view',        desc: 'For capped sections, see how much room you have left under the limit. Useful for last-minute investment decisions before year-end.' },
  { title: 'Proof-status tracking',       desc: 'Verified, Pending, Missing, or Not Required — per claim. Counts roll up to the audit block, and missing items get a warning in the PDF.' },
  { title: '9 categories',                desc: 'Investments, insurance, housing, medical, education, charity, pension, business expenses, other. Roll up by category to see where your tax-saving sits.' },
  { title: 'Two rollups',                 desc: 'By category (the way you think about it) and by section code (the way the return is structured). Both included in the PDF and XLSX.' },
  { title: 'PDF + 4-sheet XLSX',          desc: 'PDF: summary cards + deductions table + category rollup + section rollup + proof audit + notes. XLSX: Summary, Deductions, By Category, By Section.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Audit-trail-first</Eyebrow>
          <SectionTitle>
            Every claim,{' '}
            <em className="font-serif font-normal italic text-crimson-300">backed by paper.</em>
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
  { q: 'How is this different from the Income Tax Estimator?',         a: 'The Estimator computes your total tax across slabs using a single total-deductions figure. This Summary breaks that figure down section-by-section and tracks proof for each — what the estimator treats as one number, the summary explains.' },
  { q: 'Can I use this for non-Indian tax systems?',                   a: 'Yes — section codes are free-text, so you can use UK self-assessment categories (charity / pension contributions / professional fees), US Schedule A line items, or any other jurisdiction\'s scheme. The proof-status and limit logic works the same way.' },
  { q: 'What does "limit = 0" mean?',                                   a: 'It means the section has no statutory cap — the full amount you enter is claimable. Use it for uncapped categories like NPS (80CCD(1B) above ₹50K) or HRA exemption (capped only by formula, not a flat number).' },
  { q: 'What if a claim exceeds the limit?',                           a: 'The "claimable" column is automatically capped at the limit; the form shows "(capped)" next to the input. The unused-headroom column shows zero. Your actual receipt is preserved in the amount field — handy if you need to defend why you claimed less.' },
  { q: 'Should I share this with my CA / employer?',                   a: 'Yes — that\'s what it\'s for. Export PDF for a clean hand-off, or XLSX if your CA wants to manipulate the numbers. For employer declarations (India Form 12BB), the section-by-section structure maps directly.' },
  { q: 'Output formats?',                                               a: 'PDF (single document with summary cards, full deductions table, category rollup, section rollup, proof-audit block, notes — auto-paginated) and XLSX (4 sheets: Summary, Deductions, By Category, By Section). All numeric columns are real numbers.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">deduction summaries.</em>
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
  { name: 'Income Tax Estimator',  desc: 'Annual liability across slabs.',         Icon: PercentIcon, label: 'TAX', path: '/tools/income-tax-estimator' },
  { name: 'Tax Calculation Sheet', desc: 'Per-bracket workings for accountant.',   Icon: PercentIcon, label: 'TAX', path: '/tools/tax-calculation-sheet' },
  { name: 'GST Calculation Sheet', desc: 'India GST workings with HSN/SAC.',       Icon: VatIcon,     label: 'TAX', path: '/tools/gst-calculation-sheet' },
  { name: 'Sales Tax Report',      desc: 'US/CA sales-tax filings by state.',      Icon: PercentIcon, label: 'TAX', path: '/tools/sales-tax-report' },
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

export default function TaxDeductionSummaryTool() {
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
