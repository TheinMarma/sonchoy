import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus, BrandMark,
  BalanceIcon, PnlIcon, CashFlowIcon, ReportIcon, BudgetIcon, ForecastIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES,
  CURRENT_ASSET_PRESETS, NON_CURRENT_ASSET_PRESETS,
  CURRENT_LIAB_PRESETS, NON_CURRENT_LIAB_PRESETS,
  EQUITY_PRESETS,
  computeBalance, asOfLabel, findCurrency,
  formatNumber, formatMoney,
} from '../lib/balance/compute'
import { generateBalanceSheetPdf } from '../lib/balance/generatePdf'
import { generateBalanceSheetXlsx } from '../lib/balance/generateXlsx'

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
      aria-label="Live Balance Sheet Generator"
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
  ['A = L + E', 'Live integrity check'],
  ['5',         'Key ratios computed'],
  ['PDF+',      'XLSX exports'],
  ['Free',      'Always · no signup'],
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
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-accounting">Accounting</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Balance Sheet Generator</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(99,102,241,0.25)]" />
            Accounting · Financial position
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Balance sheets that{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              tie out
            </em>
            <br />
            to the{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              cent.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Assets, liabilities, equity — three sections, one equation. Type the lines; we sum each group, surface the key ratios, and tell you immediately when the books don't balance.
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
              to="/#tools"
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
              <Check className="text-crimson-400" /> Audit-grade format
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

/* ---------- Line group with presets ---------- */

function LineGroup({ title, accent = false, lines, setLines, total, presets = [], compact = false }) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => setLines(lines.filter((l) => l.id !== id))
  const addOne = (presetLabel = '') =>
    setLines([...lines, { id: Date.now() + Math.random(), description: presetLabel, amount: 0 }])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${accent ? 'text-accounting' : 'text-ink-700'}`}>
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
            Add
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {lines.length === 0 && (
          <div className="rounded-md border border-dashed border-line-strong bg-canvas/40 px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            No lines — add one
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
              placeholder="Description"
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

      {total !== undefined && !compact && (
        <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Subtotal</span>
          <span className="font-mono text-[12px] font-semibold text-ink-950">{formatNumber(total)}</span>
        </div>
      )}
    </div>
  )
}

/* ---------- Stateful generator ---------- */

const INITIAL = {
  companyName: 'Sonchoy Studio Ltd.',
  asOfDate: '2026-06-30',
  asOfLabel: '',
  currency: 'USD',

  currentAssets: [
    { id: 1, description: 'Cash & cash equivalents', amount: 187280 },
    { id: 2, description: 'Accounts receivable',     amount: 42400 },
    { id: 3, description: 'Inventory',               amount: 28600 },
    { id: 4, description: 'Prepaid expenses',        amount: 8200 },
  ],
  nonCurrentAssets: [
    { id: 5, description: 'Property, plant & equipment', amount: 96000 },
    { id: 6, description: 'Intangible assets',           amount: 24000 },
    { id: 7, description: 'Long-term investments',       amount: 18000 },
  ],
  currentLiabilities: [
    { id: 8,  description: 'Accounts payable',          amount: 31200 },
    { id: 9,  description: 'Accrued expenses',          amount: 14800 },
    { id: 10, description: 'Short-term debt',           amount: 12000 },
    { id: 11, description: 'Deferred revenue',          amount: 9400 },
  ],
  nonCurrentLiabilities: [
    { id: 12, description: 'Long-term debt',            amount: 64000 },
    { id: 13, description: 'Lease liabilities',         amount: 18000 },
  ],
  equity: [
    { id: 14, description: 'Share capital',             amount: 50000 },
    { id: 15, description: 'Share premium / APIC',      amount: 30000 },
    { id: 16, description: 'Retained earnings',         amount: 175080 },
  ],

  notes: 'Numbers are unaudited. Prepared in accordance with the entity\'s standard accounting policies.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const t = useMemo(() => computeBalance(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setLines = (k) => (lines) =>
    setData((s) => ({ ...s, [k]: lines.map((l) => ({ ...l, id: l.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    currentAssets:         data.currentAssets.map(({ id, ...r }) => ({ ...r, amount: Number(r.amount) || 0 })),
    nonCurrentAssets:      data.nonCurrentAssets.map(({ id, ...r }) => ({ ...r, amount: Number(r.amount) || 0 })),
    currentLiabilities:    data.currentLiabilities.map(({ id, ...r }) => ({ ...r, amount: Number(r.amount) || 0 })),
    nonCurrentLiabilities: data.nonCurrentLiabilities.map(({ id, ...r }) => ({ ...r, amount: Number(r.amount) || 0 })),
    equity:                data.equity.map(({ id, ...r }) => ({ ...r, amount: Number(r.amount) || 0 })),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generateBalanceSheetPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateBalanceSheetXlsx(buildPayload()) } finally { setBusy(null) } }

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
              <BalanceIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New Balance Sheet
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

        {/* Company + date */}
        <TextInput label="Company name" value={data.companyName} onChange={setField('companyName')} placeholder="Your Company Ltd." />
        <div className="mt-2 grid grid-cols-[1fr_92px] gap-2">
          <DateInput label="As of date" value={data.asOfDate} onChange={setField('asOfDate')} />
          <SelectInput
            label="Currency"
            value={data.currency}
            onChange={setField('currency')}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* ASSETS */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
            Assets
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            {formatNumber(t.totalAssets)}
          </span>
        </div>
        <LineGroup
          title="Current"
          lines={data.currentAssets}
          setLines={setLines('currentAssets')}
          total={t.currentAssets}
          presets={CURRENT_ASSET_PRESETS}
          compact
        />
        <div className="mt-3">
          <LineGroup
            title="Non-current"
            lines={data.nonCurrentAssets}
            setLines={setLines('nonCurrentAssets')}
            total={t.nonCurrentAssets}
            presets={NON_CURRENT_ASSET_PRESETS}
            compact
          />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-md border border-accounting/25 bg-accounting-bg/40 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">Total assets</span>
          <span className="font-mono text-[13px] font-semibold text-accounting">{formatNumber(t.totalAssets)}</span>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* LIABILITIES */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
            Liabilities
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            {formatNumber(t.totalLiab)}
          </span>
        </div>
        <LineGroup
          title="Current"
          lines={data.currentLiabilities}
          setLines={setLines('currentLiabilities')}
          total={t.currentLiab}
          presets={CURRENT_LIAB_PRESETS}
          compact
        />
        <div className="mt-3">
          <LineGroup
            title="Non-current"
            lines={data.nonCurrentLiabilities}
            setLines={setLines('nonCurrentLiabilities')}
            total={t.nonCurrentLiab}
            presets={NON_CURRENT_LIAB_PRESETS}
            compact
          />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-md border border-accounting/25 bg-accounting-bg/40 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">Total liabilities</span>
          <span className="font-mono text-[13px] font-semibold text-accounting">{formatNumber(t.totalLiab)}</span>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* EQUITY */}
        <LineGroup
          title="Equity"
          accent
          lines={data.equity}
          setLines={setLines('equity')}
          total={t.equity}
          presets={EQUITY_PRESETS}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Balance check */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-line bg-paper px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Liab. + Equity</span>
            <span className="font-mono text-[12px] text-ink-800">{formatNumber(t.totalLiabAndEquity)}</span>
          </div>
          <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${t.isBalanced ? 'border-success/40 bg-success/10' : 'border-crimson-500/40 bg-crimson-500/10'}`}>
            <span className={`font-mono text-[10px] uppercase tracking-[0.1em] ${t.isBalanced ? 'text-success' : 'text-crimson-300'}`}>
              {t.isBalanced ? '✓ Balanced' : '⚠ Out of balance'}
            </span>
            <span className={`font-mono text-[12px] font-semibold ${t.isBalanced ? 'text-success' : 'text-crimson-300'}`}>
              {t.isBalanced ? '0.00' : (t.balanceDiff < 0 ? `(${formatNumber(Math.abs(t.balanceDiff))})` : formatNumber(t.balanceDiff))}
            </span>
          </div>
        </div>

        {/* Ratios */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ['Current ratio',  `${t.currentRatio.toFixed(2)}x`],
            ['Quick ratio',    `${t.quickRatio.toFixed(2)}x`],
            ['D/E',            `${t.debtToEquity.toFixed(2)}x`],
            ['Equity %',       `${t.equityRatio.toFixed(1)}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-line bg-paper px-3 py-2">
              <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
              <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-accounting">{v}</p>
            </div>
          ))}
        </div>

        {/* Total Assets (big) */}
        <div className="mt-3 rounded-lg border border-accounting/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">Total assets</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              WC {formatNumber(t.workingCapital)}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(t.totalAssets, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Accounting policies, audit status, comparatives…"
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
          {busy === 'pdf' ? 'Generating…' : 'Generate Balance Sheet PDF'}
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

function BalanceMock() {
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Balance Sheet
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">USD</span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Sonchoy Studio Ltd.</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">As of: 30 June 2026</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
          <BrandMark size={14} className="text-paper" />
        </span>
      </div>

      {/* Ratios strip */}
      <div className="mb-5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Assets',     '404,480'],
          ['Current',    '1.84x'],
          ['D/E',         '0.59x'],
          ['Equity %',    '63.2%'],
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
            { type: 'h', label: 'Assets' },
            { type: 'sh', label: 'Current assets' },
            ['Cash & cash equivalents', '187,280.00'],
            ['Accounts receivable',     '42,400.00'],
            ['Inventory',               '28,600.00'],
            ['Prepaid expenses',        '8,200.00'],
            { type: 'st', label: 'Total current assets', amount: '266,480.00' },
            { type: 'sh', label: 'Non-current assets' },
            ['Property, plant & equipment', '96,000.00'],
            ['Intangible assets',           '24,000.00'],
            ['Long-term investments',       '18,000.00'],
            { type: 'st', label: 'Total non-current assets', amount: '138,000.00' },
            { type: 'big', label: 'TOTAL ASSETS', amount: '404,480.00' },

            { type: 'h', label: 'Liabilities' },
            { type: 'sh', label: 'Current liabilities' },
            ['Accounts payable',  '31,200.00'],
            ['Accrued expenses',  '14,800.00'],
            ['Short-term debt',   '12,000.00'],
            ['Deferred revenue',  '9,400.00'],
            { type: 'st', label: 'Total current liabilities', amount: '67,400.00' },
            { type: 'sh', label: 'Non-current liabilities' },
            ['Long-term debt',    '64,000.00'],
            ['Lease liabilities', '18,000.00'],
            { type: 'st', label: 'Total non-current liabilities', amount: '82,000.00' },
            { type: 'big', label: 'TOTAL LIABILITIES', amount: '149,400.00' },

            { type: 'h', label: 'Equity' },
            ['Share capital',        '50,000.00'],
            ['Share premium / APIC', '30,000.00'],
            ['Retained earnings',    '175,080.00'],
            { type: 'big', label: 'TOTAL EQUITY', amount: '255,080.00' },
          ].map((row, i) => {
            if (row.type === 'h') {
              return (
                <tr key={i} className="bg-canvas">
                  <td colSpan={2} className="py-1.5 px-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-accounting">
                    {row.label}
                  </td>
                </tr>
              )
            }
            if (row.type === 'sh') {
              return (
                <tr key={i}>
                  <td colSpan={2} className="py-1.5 px-1 font-mono text-[9px] italic text-ink-500">
                    {row.label}
                  </td>
                </tr>
              )
            }
            if (row.type === 'st') {
              return (
                <tr key={i} className="border-y border-line">
                  <td className="py-1.5 px-1 font-medium text-ink-900">{row.label}</td>
                  <td className="py-1.5 px-1 text-right font-mono font-medium text-ink-950">{row.amount}</td>
                </tr>
              )
            }
            if (row.type === 'big') {
              return (
                <tr key={i} className="border-y-2 border-ink-700">
                  <td className="py-2 px-1 font-bold text-ink-950">{row.label}</td>
                  <td className="py-2 px-1 text-right font-mono font-bold text-accounting">{row.amount}</td>
                </tr>
              )
            }
            return (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1.5 px-1 text-ink-800">{row[0]}</td>
                <td className="py-1.5 px-1 text-right font-mono text-ink-700">{row[1]}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accounting">Total Liab. + Equity</span>
          <span className="font-mono text-[18px] font-semibold text-paper">USD 404,480.00</span>
        </div>
        <p className="m-0 mt-1 text-right font-mono text-[9px] uppercase tracking-[0.08em] text-success">
          ✓ Balanced
        </p>
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
            From line items{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a balanced statement.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Three sections, two sub-sections per side, the accounting equation reconciled at the bottom — plus key ratios at the top so reviewers don't have to do the math.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Form mockup */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <BalanceIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    Balance Sheet Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  30 Jun 2026 · USD
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Total assets',      '404,480.00'],
                  ['Total liabilities', '149,400.00'],
                  ['Total equity',      '255,080.00'],
                  ['Working capital',   '199,080.00'],
                  ['Current ratio',     '1.84x'],
                  ['Debt-to-equity',    '0.59x'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-success/40 bg-success/10 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-success">✓ Balanced</span>
                <span className="font-mono text-[12px] font-semibold text-success">0.00</span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Total assets</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 404,480.00</span>
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
                  Audit-grade
                </span>
              </div>
              <BalanceMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the date',         'Balance sheets are always "as of" a point in time. Pick the date and a fresh PDF reflects that exact snapshot.'],
  ['02', 'Type the three sides',  'Assets, liabilities, equity — with current vs non-current sub-sections on both sides. Preset libraries make common lines one click.'],
  ['03', 'Confirm balance',       'The check at the bottom turns green when A = L + E. Out-of-balance gaps surface in red so you know exactly how much is missing.'],
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
              <em className="font-serif font-normal italic text-crimson-300">A = L + E.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            The accounting equation isn't optional — it's the integrity check. Every line you type runs through it, and the PDF only ships green when the books actually balance.
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
  { title: 'Live balance check',     desc: 'Assets vs Liabilities + Equity reconciled on every keystroke — green when balanced, red when not.' },
  { title: 'Current / non-current',   desc: 'Both assets and liabilities split into current and non-current sub-sections, matching every accounting standard.' },
  { title: 'Five key ratios',         desc: 'Current ratio, quick ratio, debt-to-equity, equity %, and working capital — auto-computed and printed.' },
  { title: 'Preset line library',     desc: 'Drop common rows in one click — AR, AP, PP&E, retained earnings, deferred revenue — for each section.' },
  { title: 'Working capital surfaced', desc: 'Current assets − current liabilities, printed alongside totals so liquidity is never hidden.' },
  { title: 'Currency aware',          desc: 'USD, EUR, GBP, INR + 30 more — stamped on every monetary cell and the Total Assets callout.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for reviewers</Eyebrow>
          <SectionTitle>
            Every figure an auditor{' '}
            <em className="font-serif font-normal italic text-crimson-300">tries to break.</em>
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
  { q: 'What does "balanced" actually mean?',           a: 'The accounting equation: Total Assets = Total Liabilities + Total Equity. If the two sides match to the cent, the balance sheet is balanced. If not, something is double-counted, missing, or mis-categorised — and our checker tells you exactly how much by.' },
  { q: 'What\'s the difference between current and non-current?', a: 'Current items convert to (or are settled in) cash within 12 months — receivables, payables, short-term debt. Non-current span longer than 12 months — property, long-term debt, intangibles. The split drives current/quick ratio analysis.' },
  { q: 'How are the ratios calculated?',                a: 'Current ratio = Current Assets ÷ Current Liabilities. Quick ratio excludes inventory and prepaids. D/E = Total Liab ÷ Total Equity. Equity ratio = Equity ÷ Total Assets. Working capital = Current Assets − Current Liabilities.' },
  { q: 'Can I include intangibles and goodwill?',       a: 'Yes — they live under Non-current assets. The preset library has slots for both. Note that some analysts compute "tangible equity" by subtracting goodwill from equity; you can do this manually using the .xlsx export.' },
  { q: 'What if my books are out of balance?',          a: 'The footer banner will turn red and show the exact gap (e.g. "Out of balance by 1,250.00"). Common causes: a line was typed in the wrong section, retained earnings hasn\'t been updated with the latest P&L, or a sign is flipped.' },
  { q: 'Output formats?',                              a: 'PDF (audit-grade, with key-metrics table) and .xlsx (formula-friendly, perfect for linking into a three-statement model).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">balance sheets.</em>
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
  { name: 'Cash Flow Statement',     desc: 'Operating, investing, and financing cash flows.',  Icon: CashFlowIcon, label: 'ACCOUNTING', path: '/tools/cash-flow-statement' },
  { name: 'Financial Forecast',      desc: 'Project revenue and expenses forward.',            Icon: ForecastIcon, label: 'ACCOUNTING' },
  { name: 'Budget Planning Sheet',   desc: 'Build budgets line-by-line with variance tracking.', Icon: BudgetIcon, label: 'ACCOUNTING' },
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
            to="/#tools"
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
              <Link key={t.name} to={t.path} className={cls}>{inner}</Link>
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

export default function BalanceSheetGeneratorPage() {
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
