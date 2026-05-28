'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  CashFlowIcon, PnlIcon, BalanceIcon, ReportIcon, BudgetIcon, ForecastIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, METHODS,
  OPERATING_PRESETS, INVESTING_PRESETS, FINANCING_PRESETS,
  computeCashFlow, describePeriod, findCurrency,
  formatNumber, formatMoney,
} from '@/lib/cashflow/compute'
import { generateCashFlowPdf } from '@/lib/cashflow/generatePdf'
import { generateCashFlowXlsx } from '@/lib/cashflow/generateXlsx'

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

/* ---------- 1) Tool hero (homepage style — popup-launched) ---------- */

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
      aria-label="Live Cash Flow Statement"
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
  ['3',    'Activity sections'],
  ['FCF',  'Free Cash Flow surfaced'],
  ['PDF+', 'XLSX exports'],
  ['Free', 'Always · no signup'],
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
          style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 60%)' }}
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
            <span className="text-accounting">Accounting</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Cash Flow Statement</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(99,102,241,0.25)]" />
            Accounting · Cash visibility
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Cash flow statements{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              that tie
            </em>
            <br />
            to the{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              bank.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Operating, investing, financing — three sections, three subtotals. Type your line items; we reconcile to the closing cash balance and surface Free Cash Flow in the same breath.
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
              <Check className="text-crimson-400" /> Live reconcile
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

/* ---------- Editable form input building blocks ---------- */

const labelClass = 'font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-500'
const inputClass =
  'w-full min-h-[36px] rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950 ' +
  'placeholder:text-ink-400 outline-none transition-colors ' +
  'focus:border-accounting/60 focus:ring-2 focus:ring-accounting/20 hover:border-line-strong'

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

function NumberInput({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        value={value ?? 0}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={`${inputClass} text-right font-mono`}
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

/* ---------- Cash flow section group ---------- */

function FlowGroup({ title, accent = false, lines, setLines, total, presets = [] }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = (presetLabel = '') =>
    setLines([...lines, { id: Date.now() + Math.random(), description: presetLabel, amount: 0 }])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${accent ? 'text-accounting' : 'text-ink-500'}`}>
          {title}
        </span>
        <div className="flex items-center gap-1">
          {presets.length > 0 && (
            <select
              value=""
              onChange={(e) => { if (e.target.value) addOne(e.target.value); e.target.value = '' }}
              className="cursor-pointer rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700 outline-none hover:border-line-strong"
              aria-label="Add preset line"
            >
              <option value="">+ preset…</option>
              {presets.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => addOne()}
            className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20"
          >
            <Plus size={9} />
            Add row
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {lines.length === 0 && (
          <div className="rounded-md border border-dashed border-line-strong bg-canvas/40 px-3 py-3 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            No lines yet — add a row to begin
          </div>
        )}
        {lines.map((ln) => (
          <div
            key={ln.id}
            className="grid grid-cols-[1fr_104px_22px] items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1.5"
          >
            <input
              type="text"
              value={ln.description}
              onChange={(e) => update(ln.id, { description: e.target.value })}
              placeholder="Description (e.g. Net income)"
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 hover:border-line focus:border-accounting/60 focus:bg-canvas"
            />
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={ln.amount}
              onChange={(e) => update(ln.id, { amount: e.target.value })}
              placeholder="0"
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none hover:border-line focus:border-accounting/60 focus:bg-canvas"
            />
            <button
              type="button"
              onClick={() => remove(ln.id)}
              aria-label="Remove row"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {total !== undefined && (
        <div className="mt-2 flex items-center justify-between rounded-md border border-accounting/25 bg-accounting-bg/40 px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">Net cash from {title.toLowerCase()}</span>
          <span className={`font-mono text-[12px] font-semibold ${total >= 0 ? 'text-accounting' : 'text-crimson-300'}`}>
            {total < 0 ? `(${formatNumber(Math.abs(total))})` : formatNumber(total)}
          </span>
        </div>
      )}
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  companyName: 'Sonchoy Studio Ltd.',
  periodLabel: '',
  periodStart: '2026-04-01',
  periodEnd:   '2026-06-30',
  currency: 'USD',
  method: 'indirect',

  openingCash: 142500,

  operating: [
    { id: 1, description: 'Net income',                       amount: 49580 },
    { id: 2, description: 'Depreciation & amortisation',      amount: 8400 },
    { id: 3, description: 'Stock-based compensation',         amount: 3200 },
    { id: 4, description: 'Changes in accounts receivable',   amount: -12400 },
    { id: 5, description: 'Changes in accounts payable',      amount: 5800 },
    { id: 6, description: 'Changes in accrued expenses',      amount: 2100 },
  ],
  investing: [
    { id: 7, description: 'Purchase of property & equipment', amount: -18000 },
    { id: 8, description: 'Capitalised software',             amount: -6400 },
  ],
  financing: [
    { id: 9,  description: 'Proceeds from debt',              amount: 25000 },
    { id: 10, description: 'Repayment of debt',               amount: -8000 },
    { id: 11, description: 'Dividends paid',                  amount: -4500 },
  ],

  notes: 'Indirect method. Cash includes short-term deposits maturing within 90 days.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const t = useMemo(() => computeCashFlow(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setLines = (k) => (lines) =>
    setData((s) => ({ ...s, [k]: lines.map((l) => ({ ...l, id: l.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    openingCash: Number(data.openingCash) || 0,
    operating: data.operating.map(({ id, ...rest }) => ({ ...rest, amount: Number(rest.amount) || 0 })),
    investing: data.investing.map(({ id, ...rest }) => ({ ...rest, amount: Number(rest.amount) || 0 })),
    financing: data.financing.map(({ id, ...rest }) => ({ ...rest, amount: Number(rest.amount) || 0 })),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateCashFlowPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateCashFlowXlsx(buildPayload()) } finally { setBusy(null) } }

  const operatingPresets = data.method === 'direct' ? OPERATING_PRESETS.direct : OPERATING_PRESETS.indirect

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-accounting) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
              <CashFlowIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Cash Flow
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

        {/* Company + period */}
        <TextInput
          label="Company name"
          value={data.companyName}
          onChange={setField('companyName')}
          placeholder="Your Company Ltd."
        />
        <div className="mt-2 grid grid-cols-[1fr_92px] gap-2">
          <TextInput
            label="Period label (optional)"
            value={data.periodLabel}
            onChange={setField('periodLabel')}
            placeholder="Q2 2026"
          />
          <SelectInput
            label="Currency"
            value={data.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DateInput label="Period start" value={data.periodStart} onChange={setField('periodStart')} />
          <DateInput label="Period end"   value={data.periodEnd}   onChange={setField('periodEnd')} />
        </div>
        <div className="mt-2">
          <SelectInput
            label="Method"
            value={data.method}
            onChange={setField('method')}
            options={METHODS.map((m) => ({ value: m.id, label: m.label }))}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Opening cash */}
        <NumberInput
          label="Cash & equivalents — opening"
          value={data.openingCash}
          onChange={setField('openingCash')}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Operating */}
        <FlowGroup
          title="Operating activities"
          accent
          lines={data.operating}
          setLines={setLines('operating')}
          total={t.netOperating}
          presets={operatingPresets}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Investing */}
        <FlowGroup
          title="Investing activities"
          accent
          lines={data.investing}
          setLines={setLines('investing')}
          total={t.netInvesting}
          presets={INVESTING_PRESETS}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Financing */}
        <FlowGroup
          title="Financing activities"
          accent
          lines={data.financing}
          setLines={setLines('financing')}
          total={t.netFinancing}
          presets={FINANCING_PRESETS}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Reconciliation strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-line bg-paper px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Opening cash</span>
            <span className="font-mono text-[12px] text-ink-800">{formatNumber(t.openingCash)}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-line bg-paper px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Net change in cash</span>
            <span className={`font-mono text-[12px] ${t.netChange >= 0 ? 'text-accounting' : 'text-crimson-300'}`}>
              {t.netChange < 0 ? `(${formatNumber(Math.abs(t.netChange))})` : formatNumber(t.netChange)}
            </span>
          </div>
        </div>

        {/* Closing cash (big) */}
        <div className="mt-3 rounded-lg border border-accounting/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">
              Closing cash
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              FCF {t.freeCashFlow < 0 ? `(${formatNumber(Math.abs(t.freeCashFlow))})` : formatNumber(t.freeCashFlow)}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(t.closingCash, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Method, scope of cash, comparatives, accounting policies…"
            rows={2}
          />
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70"
        >
          {busy === 'pdf' ? 'Generating…' : 'Generate Cash Flow PDF'}
          <ArrowRight size={14} />
        </button>

        {/* Secondary export */}
        <button
          type="button"
          onClick={handleXlsx}
          disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60"
        >
          {busy === 'xlsx' ? '…' : (<>Export XLSX <ArrowRight size={10} /></>)}
        </button>

        {/* Footer */}
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
            Need consolidated?
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Static preview ---------- */

function CashFlowMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Cash Flow Statement
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">Indirect · USD</span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Sonchoy Studio Ltd.</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">For the period: Apr–Jun 2026</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
          <BrandMark size={14} className="text-paper" />
        </span>
      </div>

      {/* Ratios strip */}
      <div className="mb-5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Opening',   '142,500.00'],
          ['Net change', '+45,180.00'],
          ['Free CF',    '+33,580.00'],
          ['Closing',    '187,680.00'],
        ].map(([k, v]) => (
          <div key={k} className="bg-canvas px-2 py-3">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{v}</p>
          </div>
        ))}
      </div>

      <table className="w-full text-[11px]">
        <tbody>
          {[
            { type: 'opening', label: 'Cash & equivalents — opening', amount: '142,500.00' },
            { type: 'h', label: 'Operating activities' },
            ['Net income',                       '49,580.00'],
            ['Depreciation & amortisation',      '8,400.00'],
            ['Stock-based compensation',         '3,200.00'],
            ['Changes in accounts receivable',   '(12,400.00)'],
            ['Changes in accounts payable',      '5,800.00'],
            ['Changes in accrued expenses',      '2,100.00'],
            { type: 'st', label: 'Net cash from operating',  amount: '56,680.00', pos: true },

            { type: 'h', label: 'Investing activities' },
            ['Purchase of property & equipment', '(18,000.00)'],
            ['Capitalised software',             '(6,400.00)'],
            { type: 'st', label: 'Net cash from investing',  amount: '(24,400.00)', neg: true },

            { type: 'h', label: 'Financing activities' },
            ['Proceeds from debt',               '25,000.00'],
            ['Repayment of debt',                '(8,000.00)'],
            ['Dividends paid',                   '(4,500.00)'],
            { type: 'st', label: 'Net cash from financing',  amount: '12,500.00', pos: true },

            { type: 'st', label: 'Net change in cash',       amount: '44,780.00', pos: true },
          ].map((row, i) => {
            if (row.type === 'opening') {
              return (
                <tr key={i} className="border-b border-ink-700">
                  <td className="py-1.5 px-1 font-semibold text-ink-950">{row.label}</td>
                  <td className="py-1.5 px-1 text-right font-mono font-semibold text-ink-950">{row.amount}</td>
                </tr>
              )
            }
            if (row.type === 'h') {
              return (
                <tr key={i} className="bg-canvas">
                  <td colSpan={2} className="py-1.5 px-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                    {row.label}
                  </td>
                </tr>
              )
            }
            if (row.type === 'st') {
              return (
                <tr key={i} className="border-y border-ink-700">
                  <td className="py-1.5 px-1 font-semibold text-ink-950">{row.label}</td>
                  <td className={`py-1.5 px-1 text-right font-mono font-semibold ${row.pos ? 'text-accounting' : 'text-crimson-300'}`}>{row.amount}</td>
                </tr>
              )
            }
            return (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1.5 px-1 text-ink-800">{row[0]}</td>
                <td className={`py-1.5 px-1 text-right font-mono ${String(row[1]).startsWith('(') ? 'text-crimson-300' : 'text-ink-700'}`}>{row[1]}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Closing cash box */}
      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accounting">Closing cash</span>
          <span className="font-mono text-[18px] font-semibold text-paper">USD 187,280.00</span>
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
            From your line items{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a reconciled cash story.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Three sections, three subtotals, one closing balance — always tied to the bank. Negative cash shows in (parentheses), Free Cash Flow surfaces alongside.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Form mockup */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <CashFlowIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Cash Flow Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Q2 2026 · USD
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Method',           'Indirect'],
                  ['Opening cash',     '142,500.00'],
                  ['Operating lines',  '6 entries · +56,680.00'],
                  ['Investing lines',  '2 entries · −24,400.00'],
                  ['Financing lines',  '3 entries · +12,500.00'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-accounting/25 bg-accounting/25 text-center">
                {[
                  ['Δ Cash',  '+44,780'],
                  ['Free CF', '+33,580'],
                  ['Close',   '187,280'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-accounting-bg px-2 py-2">
                    <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
                    <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-accounting">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Closing cash</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 187,280.00</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 rotate-90 items-center justify-center rounded-full border border-crimson-500/40 bg-canvas text-crimson-300 shadow-[0_4px_18px_-4px_rgba(237,40,40,0.4)] lg:rotate-0">
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Output */}
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
                  Board-ready
                </span>
              </div>
              <CashFlowMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Set opening cash',        'Your cash & equivalents at the start of the period — the anchor every other line reconciles back to.'],
  ['02', 'Type the three sections', 'Operating (with presets for the indirect method), investing, financing. Negatives are cash out; we render them in (parentheses).'],
  ['03', 'Download the PDF',         'Three subtotals, net change, closing cash, and Free Cash Flow at the bottom — plus a matching .xlsx for your model.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three sections to{' '}
              <em className="font-serif font-normal italic text-crimson-300">one closing balance.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            The closing balance is computed from your opening balance and the three section subtotals — you can verify against your bank statement before sharing with anyone.
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
  { title: 'Indirect or direct method',  desc: 'Indirect starts from Net Income; direct lists cash receipts and payments. Switch in one click; presets adapt.' },
  { title: 'Three subtotals',            desc: 'Net cash from operating, investing, and financing — each tied out separately and summed to the net change.' },
  { title: 'Opening → closing reconcile', desc: 'Opening cash + net change = closing cash. The number on the PDF should match your bank balance to the cent.' },
  { title: 'Free Cash Flow',             desc: 'Operating cash minus CapEx (auto-detected from your investing lines) — surfaced as a separate callout.' },
  { title: '(Parentheses) negatives',    desc: 'Accounting-style negative formatting throughout, in danger-red for at-a-glance scanning.' },
  { title: 'Preset line library',        desc: 'Drop common rows in one click — depreciation, working-capital changes, CapEx, debt proceeds, dividends.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built to reconcile</Eyebrow>
          <SectionTitle>
            Every line a treasurer{' '}
            <em className="font-serif font-normal italic text-crimson-300">actually checks.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-accounting/20 bg-accounting-bg text-accounting">
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
  { q: 'What\'s the difference between operating, investing, and financing?',  a: 'Operating is cash from the core business (revenue collection, supplier payments, salaries). Investing is cash spent or received on long-term assets — equipment, investments, acquisitions. Financing is cash from lenders, shareholders, and dividend payments.' },
  { q: 'Indirect or direct method — which should I use?',                       a: 'Indirect is the most common: starts from Net Income then adjusts for non-cash items (D&A, stock comp, working-capital changes). Direct lists actual cash receipts and payments. Most board packs and audited financials use indirect; cash-management dashboards often use direct.' },
  { q: 'Why are some numbers in parentheses?',                                  a: 'Standard accounting convention — parentheses indicate negative numbers (cash out). For example, "(18,000.00)" means $18,000 of cash leaving the business. The tool renders these in red for at-a-glance scanning.' },
  { q: 'How is Free Cash Flow calculated?',                                     a: 'Free Cash Flow = Net cash from operating activities − Capital Expenditure. We auto-detect CapEx from investing lines that mention property, equipment, software, or "capex".' },
  { q: 'Should opening + net change always equal closing cash?',                a: 'Yes — that\'s the integrity check. If your bank statement doesn\'t match, your line items don\'t fully reconcile, and you\'ll see the gap in the closing-cash callout.' },
  { q: 'Output formats?',                                                       a: 'PDF (board-ready, with subtotals, ratios strip, and Free Cash Flow callout) and .xlsx (formula-friendly, with line items laid out for easy linking into your model).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">cash flow statements.</em>
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
  { name: 'Profit & Loss Statement', desc: 'Revenue, COGS, OPEX with auto-margins.',           Icon: PnlIcon,      label: 'ACCOUNTING', path: '/tools/profit-loss-statement' },
  { name: 'Balance Sheet Generator', desc: 'Assets, liabilities, equity — tied out to the cent.', Icon: BalanceIcon, label: 'ACCOUNTING', path: '/tools/balance-sheet-generator' },
  { name: 'Financial Forecast',      desc: 'Project revenue and expenses forward.',            Icon: ForecastIcon, label: 'ACCOUNTING' },
  { name: 'Budget Planning Sheet',   desc: 'Build budgets line-by-line with variance tracking.', Icon: BudgetIcon,  label: 'ACCOUNTING' },
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
            const inner = (
              <>
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting">
                  {t.label}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accounting-bg text-accounting">
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

export default function CashFlowStatementTool() {
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
