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
  CURRENCIES, SUPPLY_TYPES, SHEET_PURPOSES, STANDARD_GST_RATES,
  findCurrency, findSupplyType, findSheetPurpose,
  computeGstTotals, buildRateSummary, buildHsnSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '@/lib/gstCalc/compute'
import { generateGstSheetPdf } from '@/lib/gstCalc/generatePdf'
import { generateGstSheetXlsx } from '@/lib/gstCalc/generateXlsx'

/* ---------- Local helpers ---------- */

const Eyebrow = ({ children, className = '' }) => (
  <p className={`m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300 ${className}`}>{children}</p>
)
const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950 ${className}`}>{children}</h2>
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
    <div role="dialog" aria-modal="true" aria-label="Live GST Calculation Sheet"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[580px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['CGST+SGST', 'or IGST split'],
  ['HSN/SAC',   'Codes per line'],
  ['RCM',       'Reverse-charge ready'],
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
            <span className="text-ink-950">GST Calculation Sheet</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax &amp; Banking · GST workings
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            CGST, SGST, IGST{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — line by line,
            </em>
            <br />
            rate by{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              rate.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Build a GST workings sheet with HSN/SAC codes, multi-rate lines, intra-state vs inter-state splits, and reverse-charge support. Out comes a clean PDF plus a 4-sheet XLSX ready for your accountant or GSTR-3B prep.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> CGST/SGST/IGST auto-split</span>
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
        className="h-4 w-4 shrink-0 cursor-pointer accent-tax" />
    </label>
  )
}

/* ---------- ItemList ---------- */

function ItemList({ items, setItems, defaultRate, defaultSupply }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    {
      id: Date.now() + Math.random(),
      hsn: '', description: '',
      qty: 1, unitPrice: 0, discount: 0,
      gstRatePct: defaultRate ?? 18,
      supplyTypeId: defaultSupply || 'intra',
      reverseCharge: false,
    },
  ])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-tax">Line items</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="space-y-2">
        {items.map((it) => {
          const taxable = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0)
          return (
            <div key={it.id} className="rounded-md border border-line bg-paper p-2">
              <div className="grid grid-cols-[1fr_22px] items-center gap-1.5">
                <input type="text"
                  value={it.description || ''}
                  onChange={(e) => update(it.id, { description: e.target.value })}
                  placeholder="Item / service description"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-900 outline-none focus:border-tax/60" />
                <button type="button" onClick={() => remove(it.id)}
                  aria-label="Remove" className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-[1.1fr_0.7fr_0.9fr_0.7fr_0.7fr] gap-1.5">
                <input type="text" value={it.hsn || ''} onChange={(e) => update(it.id, { hsn: e.target.value })}
                  placeholder="HSN/SAC"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={it.qty} onChange={(e) => update(it.id, { qty: e.target.value })}
                  placeholder="Qty"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={it.unitPrice} onChange={(e) => update(it.id, { unitPrice: e.target.value })}
                  placeholder="Unit price"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <input type="number" step="any" value={it.discount || 0} onChange={(e) => update(it.id, { discount: e.target.value })}
                  placeholder="Discount"
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60" />
                <select value={it.gstRatePct} onChange={(e) => update(it.id, { gstRatePct: Number(e.target.value) })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 font-mono text-[11px] text-ink-900 outline-none focus:border-tax/60">
                  {STANDARD_GST_RATES.map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
              </div>
              <div className="mt-1.5 grid grid-cols-[1fr_1fr_auto] items-center gap-1.5">
                <select value={it.supplyTypeId} onChange={(e) => update(it.id, { supplyTypeId: e.target.value })}
                  className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[11px] text-ink-900 outline-none focus:border-tax/60">
                  {SUPPLY_TYPES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-1 text-[10.5px] text-ink-700">
                  <input type="checkbox" checked={!!it.reverseCharge}
                    onChange={(e) => update(it.id, { reverseCharge: e.target.checked })}
                    className="h-3.5 w-3.5 accent-tax" />
                  RCM
                </label>
                <span className="rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[11px] font-semibold text-tax">
                  {formatNumber(taxable)}
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

const INITIAL = {
  sheetTitle: 'GST Workings — May 2026',
  sheetReference: 'GST-2026-05-0014',
  purposeId: 'outward',
  sheetDate: todayISO(),
  periodLabel: 'May 2026',

  entity: {
    name: 'Sonchoy Studio Pvt Ltd',
    gstin: '29ABCDE1234F1Z5',
    address: '7 Brigade Road, Bengaluru, Karnataka 560001',
    placeOfSupply: 'Karnataka (29)',
  },

  currency: 'INR',
  defaultGstRatePct: 18,
  supplyTypeId: 'intra',

  items: [
    { id: 1, hsn: '998314', description: 'Brand strategy consulting',           qty: 1, unitPrice: 120000, discount: 0,     gstRatePct: 18, supplyTypeId: 'intra', reverseCharge: false },
    { id: 2, hsn: '998314', description: 'Identity design retainer (May)',      qty: 1, unitPrice: 85000,  discount: 0,     gstRatePct: 18, supplyTypeId: 'intra', reverseCharge: false },
    { id: 3, hsn: '998313', description: 'Marketing campaign — out-of-state',   qty: 1, unitPrice: 65000,  discount: 5000,  gstRatePct: 18, supplyTypeId: 'inter', reverseCharge: false },
    { id: 4, hsn: '998599', description: 'Print production reimbursable',       qty: 1, unitPrice: 12000,  discount: 0,     gstRatePct: 12, supplyTypeId: 'intra', reverseCharge: false },
    { id: 5, hsn: '998311', description: 'Freelance translator (RCM)',          qty: 1, unitPrice: 18000,  discount: 0,     gstRatePct: 18, supplyTypeId: 'intra', reverseCharge: true  },
    { id: 6, hsn: '997331', description: 'Export — design services to UK SEZ',  qty: 1, unitPrice: 95000,  discount: 0,     gstRatePct: 0,  supplyTypeId: 'export', reverseCharge: false },
  ],

  includeRateSummary: true,
  includeHsnSummary: true,
  includeReverseChargeBlock: true,

  notes: 'Reverse-charge GST on the freelance translator line is payable by Sonchoy Studio as recipient and excluded from the line total. Export to SEZ is zero-rated. Working for GSTR-1 / 3B filing for May 2026.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const purpose = useMemo(() => findSheetPurpose(data.purposeId), [data.purposeId])
  const { rows, totals } = useMemo(
    () => computeGstTotals(data.items, {
      gstRatePct: data.defaultGstRatePct,
      supplyTypeId: data.supplyTypeId,
    }),
    [data.items, data.defaultGstRatePct, data.supplyTypeId]
  )
  const rateSummary = useMemo(() => buildRateSummary(rows), [rows])
  const hsnSummary  = useMemo(() => buildHsnSummary(rows),  [rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setEntityField = (k) => (v) => setData((s) => ({ ...s, entity: { ...s.entity, [k]: v } }))
  const setItems = (items) => setData((s) => ({ ...s, items: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    items: data.items.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateGstSheetPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateGstSheetXlsx(buildPayload()) } finally { setBusy(null) } }

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
              GST sheet · {data.items.length} lines · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Sheet title" value={data.sheetTitle} onChange={setField('sheetTitle')} placeholder="GST Workings — Month YYYY" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Reference" value={data.sheetReference} onChange={setField('sheetReference')} placeholder="GST-2026-05-0001" mono />
          <DateInput label="Sheet date" value={data.sheetDate} onChange={setField('sheetDate')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Period label" value={data.periodLabel} onChange={setField('periodLabel')} placeholder="May 2026" />
          <SelectInput label="Purpose" value={data.purposeId} onChange={setField('purposeId')}
            options={SHEET_PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Entity */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Registered entity
        </span>
        <div className="space-y-2">
          <TextInput label="Legal name" value={data.entity.name} onChange={setEntityField('name')} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="GSTIN"          value={data.entity.gstin}         onChange={setEntityField('gstin')}         mono />
            <TextInput label="Place of supply" value={data.entity.placeOfSupply} onChange={setEntityField('placeOfSupply')} />
          </div>
          <TextareaInput label="Address" value={data.entity.address} onChange={setEntityField('address')} rows={2} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Defaults */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Defaults for new lines
        </span>
        <div className="grid grid-cols-[1fr_92px_1.4fr] gap-2">
          <SelectInput
            label="Default GST rate"
            value={data.defaultGstRatePct}
            onChange={(v) => setField('defaultGstRatePct')(Number(v))}
            options={STANDARD_GST_RATES.map((r) => ({ value: r, label: `${r}%` }))}
          />
          <SelectInput
            label="Currency"
            value={data.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))}
          />
          <SelectInput
            label="Supply type"
            value={data.supplyTypeId}
            onChange={setField('supplyTypeId')}
            options={SUPPLY_TYPES.map((s) => ({ value: s.id, label: s.label }))}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Items */}
        <ItemList items={data.items} setItems={setItems}
          defaultRate={data.defaultGstRatePct} defaultSupply={data.supplyTypeId} />

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Summary sections
        </span>
        <div className="space-y-2">
          <ToggleRow label="Rate-wise summary" desc="Group by GST rate (CGST/SGST/IGST split)"
            checked={data.includeRateSummary} onChange={setField('includeRateSummary')} />
          <ToggleRow label="HSN/SAC-wise summary" desc="Group by HSN or SAC code"
            checked={data.includeHsnSummary} onChange={setField('includeHsnSummary')} />
          <ToggleRow label="Reverse-charge block" desc="Highlight RCM liability separately"
            checked={data.includeReverseChargeBlock} onChange={setField('includeReverseChargeBlock')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live computed cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Taxable value</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(totals.taxable)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Total GST</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(totals.totalTax)}</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{cur.code}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">CGST + SGST</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(totals.cgst + totals.sgst)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">IGST</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-ink-950">{formatNumber(totals.igst)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">RCM</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] font-semibold text-tax">{formatNumber(totals.reverseChargeTax)}</p>
          </div>
        </div>

        {/* Rate preview */}
        {rateSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Rate breakdown ({rateSummary.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">Rate</th>
                    <th className="py-1 text-right font-normal">Taxable</th>
                    <th className="py-1 text-right font-normal">GST</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {rateSummary.map((r) => (
                    <tr key={r.ratePct} className="border-t border-line">
                      <td className="py-1 text-tax">{formatNumber(r.ratePct)}%</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(r.taxable)}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(r.totalTax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HSN preview */}
        {hsnSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              HSN/SAC breakdown ({hsnSummary.length})
            </p>
            <div className="max-h-32 overflow-y-auto">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                    <th className="py-1 font-normal">HSN</th>
                    <th className="py-1 text-right font-normal">Lines</th>
                    <th className="py-1 text-right font-normal">Taxable</th>
                    <th className="py-1 text-right font-normal">GST</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {hsnSummary.slice(0, 8).map((r) => (
                    <tr key={r.hsn} className="border-t border-line">
                      <td className="py-1 text-ink-700">{r.hsn}</td>
                      <td className="py-1 text-right text-ink-700">{r.count}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(r.taxable)}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(r.totalTax)}</td>
                    </tr>
                  ))}
                  {hsnSummary.length > 8 && (
                    <tr><td colSpan={4} className="py-1 text-center italic text-ink-500">+ {hsnSummary.length - 8} more</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">Invoice total</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {data.items.length} lines
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.lineTotal, data.currency)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Filing period, reconciliation context, RCM notes…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate GST Sheet PDF'}
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

function SheetMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-tax" />
      <div className="p-5">
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">GST CALCULATION SHEET</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">GST Workings — May 2026</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Period: May 2026 · Outward supply</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3">
          <p className="m-0 font-mono text-[7.5px] font-bold uppercase tracking-[0.12em] text-tax">REGISTERED ENTITY</p>
          <p className="m-0 mt-0.5 text-[12px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
          <p className="m-0 text-[9px] text-ink-700">GSTIN: 29ABCDE1234F1Z5 · Karnataka (29)</p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['TAXABLE',    'INR 390,000'],
            ['TOTAL GST',  'INR 64,440'],
            ['CGST+SGST',  'INR 47,160'],
            ['IGST',       'INR 10,800'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[9.5px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">LINE ITEMS</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_50px_60px_50px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>ITEM</span>
            <span className="text-right">TAXABLE</span>
            <span className="text-right">GST</span>
            <span className="text-right">TOTAL</span>
          </div>
          {[
            ['Brand strategy consulting',   '120,000', '21,600', '141,600'],
            ['Identity design retainer',     '85,000', '15,300', '100,300'],
            ['Marketing — out-of-state',     '60,000', '10,800',  '70,800'],
            ['Print production',             '12,000',  '1,440',  '13,440'],
            ['Freelance translator (RCM)',   '18,000',  '3,240*', '18,000'],
            ['Export — SEZ (zero-rated)',    '95,000',      '0',  '95,000'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_50px_60px_50px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="truncate">{r[0]}</span>
              <span className="text-right">{r[1]}</span>
              <span className="text-right font-bold">{r[2]}</span>
              <span className="text-right">{r[3]}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_50px_60px_50px] gap-1 border-t-2 border-tax-bg bg-tax/10 px-1.5 py-1 font-mono text-[8.5px] font-bold text-tax">
            <span>TOTALS</span>
            <span className="text-right">390,000</span>
            <span className="text-right">52,380</span>
            <span className="text-right">439,140</span>
          </div>
        </div>

        <p className="m-0 mt-2 font-mono text-[7.5px] italic text-ink-500">* RCM line — GST payable by recipient, excluded from line total.</p>
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
            Lines in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a filing-ready GST workings sheet.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop in line items with HSN/SAC and GST rate. The tool splits each line into CGST/SGST or IGST based on supply type, handles reverse-charge separately, and rolls up by rate and HSN.
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">GST Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  6 lines · May 2026
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Entity',          'Sonchoy Studio Pvt Ltd · 29ABCDE1234F1Z5'],
                  ['Period',          'May 2026 · Outward supply'],
                  ['Lines',           '6 (incl. 1 RCM, 1 SEZ export)'],
                  ['Rates used',      '0%, 12%, 18%'],
                  ['Supply mix',      '4 intra, 1 inter, 1 export'],
                  ['Taxable value',   'INR 390,000.00'],
                  ['CGST + SGST',     'INR 47,160.00'],
                  ['IGST',            'INR 10,800.00'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Total GST</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 52,380.00</span>
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
                  Filing-ready
                </span>
              </div>
              <SheetMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Add the lines',     'HSN/SAC, description, quantity, unit price, discount. Pick the GST rate from the dropdown and flag intra-state, inter-state, or export.'],
  ['02', 'Auto-split GST',     'Intra-state splits 50/50 into CGST + SGST. Inter-state goes to IGST. Export is zero-rated. Reverse-charge lines exclude GST from the line total.'],
  ['03', 'Export PDF + XLSX',  'PDF has summary cards, line items, rate-wise summary, HSN/SAC summary, and an RCM block. XLSX has Summary, Line Items, By Rate, and By HSN sheets.'],
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
              <em className="font-serif font-normal italic text-crimson-300">GSTR-1 &amp; 3B prep.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A clean workings sheet is what your CA wants at the end of the month — line items with HSN, rate, taxable value, and the CGST/SGST/IGST split. This tool produces exactly that, in PDF for the file and XLSX for the upload.
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
  { title: 'CGST/SGST/IGST split',  desc: 'Intra-state lines split GST 50/50 into CGST and SGST. Inter-state lines go fully to IGST. Both are tracked in the rate summary.' },
  { title: 'HSN/SAC per line',       desc: 'Each line carries its HSN (goods) or SAC (services) code, the rate, and the description. The HSN summary rolls everything up for the workings file.' },
  { title: 'Reverse-charge support', desc: 'Flag any line as RCM. GST is calculated as normal but excluded from the line total — and called out separately in its own block.' },
  { title: 'Standard rate dropdown', desc: 'Rates 0%, 0.25%, 3%, 5%, 12%, 18%, 28% — the full Indian GST slab — plus a 0% option for exempt and zero-rated supplies.' },
  { title: 'Rate &amp; HSN summary',  desc: 'Automatic rollups by GST rate and by HSN/SAC code. Useful for cross-checking against GSTR-1 table 12 (HSN summary) and table 9 (rate-wise).' },
  { title: 'PDF + 4-sheet XLSX',     desc: 'PDF: summary cards, line items, rate summary, HSN summary, RCM block. XLSX: Summary, Line Items, By Rate, By HSN — all numeric, ready for pivots.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for compliance</Eyebrow>
          <SectionTitle>
            Every column the{' '}
            <em className="font-serif font-normal italic text-crimson-300">portal expects.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-tax/20 bg-tax-bg text-tax">
                <Check size={16} />
              </div>
              <h4 className="m-0 mb-2 text-lg font-medium tracking-[-0.015em] text-ink-950" dangerouslySetInnerHTML={{ __html: f.title }} />
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
  { q: 'How is this different from the GST/VAT Invoice Generator?',  a: 'The Invoice Generator produces a single tax invoice for one customer. This Calculation Sheet is a workings document — many lines across one period, grouped by rate and HSN, sized for GSTR-1 / 3B prep and accountant hand-off. Different purpose; same tax engine underneath.' },
  { q: 'When does CGST + SGST apply vs IGST?',                       a: 'Intra-state supplies (same state for supplier and place of supply) attract CGST + SGST, each at half the total rate. Inter-state supplies, or supplies to SEZ / overseas, attract IGST at the full rate. The tool splits this automatically based on the supply type you pick per line.' },
  { q: 'What is reverse charge (RCM)?',                              a: 'Under reverse charge, GST is payable by the recipient instead of the supplier. The supplier raises an invoice without GST; the recipient self-invoices and pays GST directly to the government, claiming ITC. The tool flags RCM lines, excludes GST from the line total, and reports the RCM liability in its own block.' },
  { q: 'What HSN/SAC codes should I use?',                          a: 'HSN (Harmonised System of Nomenclature) for goods; SAC (Services Accounting Code) for services. Businesses with turnover over ₹5 crore must use 6-digit codes; smaller businesses 4-digit. The tool stores whatever you enter — there\'s no built-in code lookup.' },
  { q: 'Can I use this for non-Indian GST?',                        a: 'The CGST/SGST/IGST split is India-specific. For single-rate VAT (UK, EU, Australia, etc.), use the VAT Calculator PDF Export tool instead — same engine, simpler split. The XLSX from this tool can be retooled for any jurisdiction if you ignore the SGST/IGST columns.' },
  { q: 'Output formats?',                                            a: 'PDF (single document with summary cards, line items table, rate summary, HSN summary, and RCM block — auto-paginated) and XLSX (4 sheets: Summary, Line Items, By Rate, By HSN). All numeric columns are real numbers — no pre-formatted strings.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">GST workings.</em>
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
  { name: 'GST/VAT Invoice Generator', desc: 'Compliant GST invoices for individual customers.', Icon: VatIcon,     label: 'INVOICING', path: '/tools/gst-vat-invoice-generator' },
  { name: 'VAT Calculator',            desc: 'Single-rate VAT add/remove with PDF export.',       Icon: VatIcon,     label: 'TAX',       path: '/tools/vat-calculator-pdf-export' },
  { name: 'Tax Calculation Sheet',     desc: 'Per-bracket income-tax breakdown.',                 Icon: PercentIcon, label: 'TAX' },
  { name: 'Payroll Tax Report',        desc: 'Per-employee tax + employer contributions.',        Icon: PayrollIcon, label: 'TAX' },
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

export default function GstCalculationSheetTool() {
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
