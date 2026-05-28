'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  VatIcon, PercentIcon, PayrollIcon, ReconcileIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, VAT_REGIMES, MODES,
  computeVAT, findRegime, findCurrency,
  formatNumber, formatMoney, todayISO,
} from '@/lib/vatCalc/compute'
import { generateVATCalcPdf } from '@/lib/vatCalc/generatePdf'
import { generateVATCalcXlsx } from '@/lib/vatCalc/generateXlsx'

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
      aria-label="Live VAT Calculator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[540px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['8',     'Jurisdictions built in'],
  ['2-way', 'Add or extract VAT'],
  ['PDF+',  'XLSX with breakdown'],
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
            <span className="text-ink-950">VAT Calculator PDF Export</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Tax · VAT working sheet
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            VAT,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              line by line.
            </em>
            <br />
            Exported as a{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              clean PDF.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Type your line items and rates; we compute net, VAT, and gross — line-by-line and totalled. Switch between "add VAT" and "extract VAT" modes, mix rates within one document, and ship an itemised PDF + XLSX.
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
              <Check className="text-crimson-400" /> Mixed rates supported
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

function TextInput({ label, value, onChange, placeholder, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
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

/* ---------- Line item row ---------- */

function ItemRow({ item, regime, mode, onUpdate, onRemove }) {
  const amount = Number(item.amount) || 0
  const rate = (Number(item.rate) || 0) / 100
  // Live-computed preview
  let net, vat, gross
  if (mode === 'extract') {
    gross = amount
    net = rate > 0 ? gross / (1 + rate) : gross
    vat = gross - net
  } else {
    net = amount
    vat = net * rate
    gross = net + vat
  }

  return (
    <div className="rounded-lg border border-line bg-paper p-2.5">
      {/* Row 1: Description + Amount + Rate + Remove */}
      <div className="mb-1.5 grid grid-cols-[1fr_92px_72px_22px] items-center gap-1.5">
        <input
          type="text"
          value={item.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Description"
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-[12px] text-ink-950 outline-none placeholder:text-ink-400 hover:border-line-strong focus:border-tax/60"
        />
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={item.amount}
          onChange={(e) => onUpdate({ amount: e.target.value })}
          placeholder={mode === 'extract' ? 'Gross' : 'Net'}
          className="min-h-[28px] rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[12px] font-semibold text-ink-950 outline-none hover:border-line-strong focus:border-tax/60"
        />
        <select
          value={item.rate}
          onChange={(e) => onUpdate({ rate: Number(e.target.value) })}
          className="min-h-[28px] cursor-pointer rounded-md border border-line bg-canvas px-1.5 py-1 text-right font-mono text-[11px] font-semibold text-tax outline-none hover:border-line-strong focus:border-tax/60"
        >
          {regime.rates.map((r) => (
            <option key={r} value={r}>{r}%</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove line"
          className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Row 2: net / vat / gross live readout */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Net',   net],
          ['VAT',   vat],
          ['Gross', gross],
        ].map(([k, v]) => (
          <div key={k} className="bg-canvas px-2 py-1.5">
            <p className="m-0 font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className={`m-0 mt-0.5 font-mono text-[11px] ${k === 'Gross' ? 'font-semibold text-ink-950' : k === 'VAT' ? 'text-tax' : 'text-ink-700'}`}>
              {formatNumber(v)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  documentName: 'Quote · Project Apollo',
  reference: 'Q-2026-0042',
  customerName: 'Northwind Books Ltd.',
  date: todayISO(),
  regimeId: 'uk',
  currency: 'GBP',
  mode: 'add',

  items: [
    { id: 1, description: 'Brand strategy & identity sprint',  amount: 8400, rate: 20 },
    { id: 2, description: 'Web design — landing & onboarding', amount: 5200, rate: 20 },
    { id: 3, description: 'Educational content licensing',     amount: 1200, rate: 0  },
    { id: 4, description: 'Print materials',                    amount: 480,  rate: 5  },
  ],

  notes: 'VAT working sheet — verify rates against the latest HMRC notices before invoicing.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const regime = useMemo(() => findRegime(data.regimeId), [data.regimeId])
  const t = useMemo(() => computeVAT(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))

  const updateItem = (id, patch) =>
    setData((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
  const removeItem = (id) =>
    setData((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }))
  const addItem = () =>
    setData((s) => ({
      ...s,
      items: [...s.items, { id: nextId++, description: '', amount: 0, rate: regime.defaultRate }],
    }))
  const reset = () => setData({ ...INITIAL })

  const onRegimeChange = (id) => {
    const r = findRegime(id)
    setData((s) => ({
      ...s,
      regimeId: id,
      currency: r.defaultCurrency,
      items: s.items.map((it) => ({
        ...it,
        rate: r.rates.includes(Number(it.rate)) ? it.rate : r.defaultRate,
      })),
    }))
  }

  const buildPayload = () => ({
    ...data,
    items: data.items.map(({ id, ...rest }) => ({
      ...rest,
      amount: Number(rest.amount) || 0,
      rate: Number(rest.rate) || 0,
    })),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateVATCalcPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateVATCalcXlsx(buildPayload()) } finally { setBusy(null) } }

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
              <VatIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              VAT Calculator
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

        {/* Document meta */}
        <TextInput
          label="Document name"
          value={data.documentName}
          onChange={setField('documentName')}
          placeholder="Quote · Project X"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput
            label="Reference"
            value={data.reference}
            onChange={setField('reference')}
            placeholder="Q-2026-0001"
          />
          <DateInput label="Date" value={data.date} onChange={setField('date')} />
        </div>
        <div className="mt-2">
          <TextInput
            label="For (optional)"
            value={data.customerName}
            onChange={setField('customerName')}
            placeholder="Client name"
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Regime + currency */}
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <SelectInput
            label="Jurisdiction"
            value={data.regimeId}
            onChange={onRegimeChange}
            options={VAT_REGIMES.map((r) => ({ value: r.id, label: r.label }))}
          />
          <SelectInput
            label="Currency"
            value={data.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>

        {/* Mode toggle */}
        <div className="mt-2">
          <span className={`${labelClass} mb-[5px] block`}>Mode</span>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            {MODES.map((m) => {
              const active = data.mode === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setField('mode')(m.id)}
                  className={`px-3 py-2 text-left transition-colors ${active ? 'bg-tax-bg' : 'bg-paper hover:bg-canvas'}`}
                >
                  <span className={`block font-mono text-[10px] uppercase tracking-[0.1em] ${active ? 'text-tax' : 'text-ink-500'}`}>
                    {m.label}
                  </span>
                  <span className={`mt-0.5 block text-[11px] leading-[1.3] ${active ? 'text-ink-950' : 'text-ink-500'}`}>
                    {m.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Items */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
            Line items · {data.items.length}
          </span>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 rounded-md bg-tax-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-tax transition-colors hover:bg-tax/20"
          >
            <Plus size={9} />
            Add line
          </button>
        </div>

        <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
          {data.items.length === 0 && (
            <div className="rounded-md border border-dashed border-line-strong bg-canvas/40 px-3 py-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              No lines yet — add one to begin
            </div>
          )}
          {data.items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              regime={regime}
              mode={data.mode}
              onUpdate={(patch) => updateItem(it.id, patch)}
              onRemove={() => removeItem(it.id)}
            />
          ))}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Totals strip */}
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-tax/25 bg-tax/25 text-center">
          {[
            ['Net',   formatNumber(t.totalNet)],
            ['VAT',   formatNumber(t.totalVat)],
            ['Gross', formatNumber(t.totalGross)],
          ].map(([k, v]) => (
            <div key={k} className="bg-tax-bg px-2 py-2.5">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
              <p className={`m-0 mt-0.5 font-mono ${k === 'Gross' ? 'text-[14px] font-semibold text-ink-950' : 'text-[13px] font-semibold text-tax'}`}>
                {v}
              </p>
            </div>
          ))}
        </div>

        {/* Breakdown by rate */}
        {t.byRate.length > 1 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Breakdown by rate
            </p>
            <div className="space-y-1">
              {t.byRate.map((r) => (
                <div key={r.rate} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono font-semibold text-tax">{r.rate}%</span>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-[10px] text-ink-500">{r.count} line{r.count === 1 ? '' : 's'}</span>
                    <span className="font-mono text-ink-700">VAT {formatNumber(r.vat)}</span>
                    <span className="font-mono font-semibold text-ink-900">{formatNumber(r.gross)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">
              Total gross
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              VAT {formatNumber(t.totalVat)} · {t.countLines} lines
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(t.totalGross, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Assumptions, exemptions claimed, references…"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate VAT PDF'}
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={handleXlsx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'xlsx' ? '…' : (<>Export XLSX <ArrowRight size={10} /></>)}
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
            Need full invoices?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function VATMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          VAT Calculation
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">
          UK · Add VAT · GBP
        </span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Quote · Project Apollo</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">Ref Q-2026-0042 · For Northwind Books Ltd.</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
          <BrandMark size={14} className="text-paper" />
        </span>
      </div>

      {/* Stats strip */}
      <div className="mb-5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Net',   '15,280.00'],
          ['VAT',   '2,744.00'],
          ['Gross', '18,024.00'],
          ['Lines', '4'],
        ].map(([k, v]) => (
          <div key={k} className="bg-canvas px-2 py-3">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className="m-0 mt-1 font-mono text-[12px] font-semibold text-ink-950">{v}</p>
          </div>
        ))}
      </div>

      {/* Mini table */}
      <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Line items</p>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-ink-950 text-paper">
            <th className="py-1.5 px-2 text-left font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-tax">Description</th>
            <th className="py-1.5 px-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Rate</th>
            <th className="py-1.5 px-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Net</th>
            <th className="py-1.5 px-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">VAT</th>
            <th className="py-1.5 px-2 text-right font-mono text-[8.5px] font-medium uppercase tracking-[0.08em]">Gross</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Brand strategy & identity sprint',  '20%', '8,400.00', '1,680.00', '10,080.00'],
            ['Web design — landing & onboarding', '20%', '5,200.00', '1,040.00', '6,240.00'],
            ['Educational content licensing',     '0%',  '1,200.00', '—',        '1,200.00'],
            ['Print materials',                   '5%',  '480.00',   '24.00',    '504.00'],
          ].map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-canvas' : ''}>
              <td className="py-1 px-2 text-ink-900 truncate max-w-[180px]">{r[0]}</td>
              <td className="py-1 px-2 text-right font-mono text-tax font-semibold">{r[1]}</td>
              <td className="py-1 px-2 text-right font-mono text-ink-700">{r[2]}</td>
              <td className="py-1 px-2 text-right font-mono text-ink-700">{r[3]}</td>
              <td className="py-1 px-2 text-right font-mono font-semibold text-ink-900">{r[4]}</td>
            </tr>
          ))}
          <tr className="border-y border-ink-700 bg-paper">
            <td className="py-1.5 px-2 font-semibold text-ink-950" colSpan={2}>Totals</td>
            <td className="py-1.5 px-2 text-right font-mono font-semibold text-ink-950">15,280</td>
            <td className="py-1.5 px-2 text-right font-mono font-semibold text-tax">2,744</td>
            <td className="py-1.5 px-2 text-right font-mono font-semibold text-ink-950">18,024</td>
          </tr>
        </tbody>
      </table>

      {/* Total block */}
      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-tax">Total gross</span>
          <span className="font-mono text-[18px] font-semibold text-paper">GBP 18,024.00</span>
        </div>
      </div>

      {/* Breakdown by rate */}
      <div className="mt-3 rounded-md border border-line bg-canvas px-3 py-2">
        <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">By rate</p>
        <div className="space-y-0.5 text-[10px]">
          {[
            ['20%', '2 lines', '2,720.00'],
            ['5%',  '1 line',  '24.00'],
            ['0%',  '1 line',  '0.00'],
          ].map(([rate, count, vat]) => (
            <div key={rate} className="flex items-center justify-between">
              <span className="font-mono font-semibold text-tax">{rate}</span>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-ink-500">{count}</span>
                <span className="text-ink-900">VAT {vat}</span>
              </div>
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
            From mixed-rate lines{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a reconciled VAT sheet.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Per-line net, VAT, gross, and a breakdown by rate band — exactly the breakdown an auditor or client wants in writing.
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    VAT Calculator Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  UK · Add VAT
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Document',    'Quote · Project Apollo'],
                  ['Jurisdiction', 'UK · VAT (20% standard)'],
                  ['Mode',         'Add VAT to net amounts'],
                  ['Lines',        '4 (mix of 20% / 5% / 0%)'],
                  ['Net total',    '15,280.00'],
                  ['VAT total',    '2,744.00'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-tax/25 bg-tax/25 text-center">
                {[
                  ['Net',   '15,280'],
                  ['VAT',   '2,744'],
                  ['Gross', '18,024'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-tax-bg px-2 py-2">
                    <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
                    <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-tax">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Total gross</span>
                <span className="font-mono text-[14px] font-semibold text-paper">GBP 18,024.00</span>
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
              <VATMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick a jurisdiction', 'UK, Ireland, Germany, France, Spain, UAE, Saudi, India GST — or set up custom rates for any country.'],
  ['02', 'Add line items',      'Each line has a description, amount, and rate. Mix rates freely; the totals reconcile by band at the bottom.'],
  ['03', 'Download the sheet',  'PDF with itemised lines + rate-band breakdown, plus a matching .xlsx for your books.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three steps from{' '}
              <em className="font-serif font-normal italic text-crimson-300">rates to receipts.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            The "Add VAT" vs "Extract VAT" toggle handles both common cases: pricing without VAT (you add it) and pricing with VAT (you back it out for accounting).
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
  { title: '8 jurisdictions',            desc: 'UK, IE, DE, FR, ES, UAE, KSA, India GST — plus a custom-rate mode for anywhere else.' },
  { title: 'Add or extract VAT',         desc: 'Add VAT to net pricing OR extract VAT from gross totals (e.g. accounting for inclusive prices).' },
  { title: 'Mixed rates per document',   desc: 'Standard, reduced, and zero-rated items all live in one calculation — totalled by band at the bottom.' },
  { title: 'Rate band breakdown',        desc: 'Per-rate summary: how many lines, total net, total VAT, total gross — for clean filing references.' },
  { title: 'Currency aware',             desc: 'GBP, EUR, AED, SAR, INR + 30 more — stamped on every monetary cell and the total callout.' },
  { title: 'Live line preview',          desc: 'Each row shows its net / VAT / gross inline as you type — no waiting for the PDF to see numbers.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for daily VAT work</Eyebrow>
          <SectionTitle>
            Every band a{' '}
            <em className="font-serif font-normal italic text-crimson-300">CA</em> needs to file.
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
  { q: 'Is this an invoice?',                                       a: 'No — it\'s a calculation working sheet. Use it to prepare numbers for quotes, internal pricing, or accounting reconciliation. For full branded VAT invoices, see the GST/VAT Invoice Generator tool.' },
  { q: 'Add VAT vs Extract VAT — which mode?',                       a: 'Use "Add VAT" when prices are net (you charge price + VAT on top — common B2B). Use "Extract VAT" when prices are gross (price already includes VAT — common consumer retail) and you need to know how much of the total is VAT.' },
  { q: 'Can I mix rates in one document?',                          a: 'Yes. Each line carries its own rate, and the bottom breakdown groups totals by rate band — useful for filing where you need separate totals for standard, reduced, and zero-rated supplies.' },
  { q: 'How is "Extract VAT" math done?',                            a: 'Net = Gross ÷ (1 + rate). VAT = Gross − Net. So a £120 gross at 20% → Net £100, VAT £20. The PDF shows each row\'s split independently.' },
  { q: 'What about reverse charge?',                                 a: 'For reverse charge (B2B cross-border services), set the rate to 0% and add a note. For the legal wording required by HMRC / Article 196 etc., use the GST/VAT Invoice Generator which adds the regulation-specific reverse-charge note.' },
  { q: 'Output formats?',                                            a: 'PDF (itemised working sheet with rate-band breakdown) and .xlsx (single sheet with every line plus the breakdown table — easy to paste into your books).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">VAT calculation.</em>
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
  { name: 'Tax Calculation Sheet',     desc: 'Progressive income-tax slabs across regimes.', Icon: PercentIcon,  label: 'TAX',       path: '/tools/tax-calculation-sheet' },
  { name: 'GST / VAT Invoice',         desc: 'Compliant invoices with multi-rate tax.',     Icon: VatIcon,      label: 'INVOICING', path: '/tools/gst-vat-invoice-generator' },
  { name: 'Payroll Tax Report',        desc: 'Employer withholding summaries.',             Icon: PayrollIcon,  label: 'TAX' },
  { name: 'Bank Reconciliation Sheet', desc: 'Book vs. statement match.',                   Icon: ReconcileIcon, label: 'TAX' },
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
            const isInvoicing = t.label === 'INVOICING'
            const labelColor = isTax ? 'text-tax' : (isInvoicing ? 'text-invoicing' : 'text-business')
            const iconBg = isTax ? 'bg-tax-bg text-tax' : (isInvoicing ? 'bg-invoicing-bg text-invoicing' : 'bg-business-bg text-business')
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

export default function VATCalculatorPDFExportTool() {
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
