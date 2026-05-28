'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus, BrandMark,
  PnlIcon, CashFlowIcon, BalanceIcon, ReportIcon, BudgetIcon, ForecastIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, OPEX_CATEGORIES,
  computePnL, describePeriod, findCurrency,
  formatNumber, formatMoney,
  todayISO,
} from '@/lib/pnl/compute'
import { generatePnlPdf } from '@/lib/pnl/generatePdf'
import { generatePnlXlsx } from '@/lib/pnl/generateXlsx'

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
      aria-label="Live Profit & Loss Statement"
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
  ['3',     'Margin tiers'],
  ['OPEX',  'Grouped by category'],
  ['PDF+',  'XLSX exports'],
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
            <span className="text-ink-950">Profit &amp; Loss Statement</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accounting/30 bg-accounting-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accounting">
            <span className="h-1.5 w-1.5 rounded-full bg-accounting shadow-[0_0_0_4px_rgba(99,102,241,0.25)]" />
            Accounting · Financial reporting
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Profit &amp; Loss statements{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              stakeholders
            </em>
            <br />
            actually{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              read.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Type revenue and expenses; we compute gross, operating, and net margins, group OPEX by category, and ship a clean presentation-grade PDF — ready for your board deck or the bank.
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
              <Check className="text-crimson-400" /> Presentation-ready
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

function TextInput({ label, value, onChange, placeholder, hint, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <div className="flex items-center justify-between">
        <span className={labelClass}>{label}</span>
        {hint && (
          <span className="rounded border border-line/60 bg-canvas px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-400">
            {hint}
          </span>
        )}
      </div>
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

/* ---------- Line-items group component ---------- */

function LineGroup({
  title, accent = false, lines, setLines, total,
  showCategory = false, categories = OPEX_CATEGORIES,
  disabledRemoveWhenSingle = false,
}) {
  const update = (id, patch) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) =>
    setLines(disabledRemoveWhenSingle && lines.length <= 1 ? lines : lines.filter((l) => l.id !== id))
  const addOne = () =>
    setLines([...lines, { id: Date.now() + Math.random(), description: '', amount: 0, ...(showCategory ? { category: categories[0] } : {}) }])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${accent ? 'text-accounting' : 'text-ink-500'}`}>
          {title}
        </span>
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-accounting-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-accounting transition-colors hover:bg-accounting/20"
        >
          <Plus size={9} />
          Add row
        </button>
      </div>

      <div className="space-y-1.5">
        {lines.map((ln) => (
          <div
            key={ln.id}
            className={`grid ${showCategory ? 'grid-cols-[1fr_120px_84px_22px]' : 'grid-cols-[1fr_96px_22px]'} items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1.5`}
          >
            <input
              type="text"
              value={ln.description}
              onChange={(e) => update(ln.id, { description: e.target.value })}
              placeholder="Description"
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 hover:border-line focus:border-accounting/60 focus:bg-canvas"
            />
            {showCategory && (
              <select
                value={ln.category || categories[0]}
                onChange={(e) => update(ln.id, { category: e.target.value })}
                className="min-h-[28px] cursor-pointer rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[11px] text-ink-700 outline-none hover:border-line focus:border-accounting/60 focus:bg-canvas"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={ln.amount}
              onChange={(e) => update(ln.id, { amount: e.target.value })}
              className="min-h-[28px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right font-mono text-[12px] text-ink-900 outline-none hover:border-line focus:border-accounting/60 focus:bg-canvas"
            />
            <button
              type="button"
              onClick={() => remove(ln.id)}
              disabled={disabledRemoveWhenSingle && lines.length <= 1}
              aria-label="Remove row"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-500"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {total !== undefined && (
        <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">Subtotal</span>
          <span className="font-mono text-[12px] font-semibold text-ink-950">{formatNumber(total)}</span>
        </div>
      )}
    </div>
  )
}

/* ---------- Stateful P&L generator ---------- */

const INITIAL = {
  companyName: 'Sonchoy Studio Ltd.',
  periodStart: '2026-04-01',
  periodEnd:   '2026-06-30',
  currency: 'USD',

  revenue: [
    { id: 1, description: 'Product sales',  amount: 184000 },
    { id: 2, description: 'Service revenue', amount: 56000 },
    { id: 3, description: 'Licensing',      amount: 12000 },
  ],
  cogs: [
    { id: 4, description: 'Materials & components',  amount: 42000 },
    { id: 5, description: 'Manufacturing & freight', amount: 18000 },
  ],
  operatingExpenses: [
    { id: 6,  description: 'Engineering salaries',         category: 'Salaries & wages',          amount: 64000 },
    { id: 7,  description: 'Sales & marketing salaries',   category: 'Salaries & wages',          amount: 28000 },
    { id: 8,  description: 'London office rent',           category: 'Rent & utilities',          amount: 9600 },
    { id: 9,  description: 'Brand & digital marketing',    category: 'Marketing & advertising',   amount: 14500 },
    { id: 10, description: 'SaaS stack',                   category: 'Software & subscriptions',  amount: 6200 },
    { id: 11, description: 'Legal & accounting',           category: 'Professional fees',         amount: 4800 },
  ],
  otherIncome: [
    { id: 12, description: 'Interest income',  amount: 720 },
  ],
  otherExpenses: [
    { id: 13, description: 'Interest expense', amount: 1240 },
  ],
  taxExpense: 14400,
  notes: 'Numbers presented are unaudited. Comparatives available on request.',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const t = useMemo(() => computePnL(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setLines = (k) => (lines) => setData((s) => ({ ...s, [k]: lines.map((l) => ({ ...l, id: l.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const buildPayload = () => ({
    ...data,
    revenue: data.revenue.map(({ id, ...rest }) => rest),
    cogs: data.cogs.map(({ id, ...rest }) => rest),
    operatingExpenses: data.operatingExpenses.map(({ id, ...rest }) => rest),
    otherIncome: data.otherIncome.map(({ id, ...rest }) => rest),
    otherExpenses: data.otherExpenses.map(({ id, ...rest }) => rest),
  })

  const handlePdf  = async () => { try { setBusy('pdf');  generatePnlPdf(buildPayload()) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generatePnlXlsx(buildPayload()) } finally { setBusy(null) } }

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
              <PnlIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              New P&amp;L
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
            value={data.periodLabel || ''}
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

        <div className="my-3.5 h-px bg-line" />

        {/* Revenue */}
        <LineGroup
          title="Revenue"
          accent
          lines={data.revenue}
          setLines={setLines('revenue')}
          total={t.revenue}
          disabledRemoveWhenSingle
        />

        <div className="my-3.5 h-px bg-line" />

        {/* COGS */}
        <LineGroup
          title="Cost of goods sold"
          lines={data.cogs}
          setLines={setLines('cogs')}
          total={t.cogs}
        />

        {/* Gross profit teaser */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/25 bg-accounting-bg/60 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">Gross profit</span>
          <div className="text-right">
            <span className="font-mono text-[13px] font-semibold text-accounting">{formatNumber(t.grossProfit)}</span>
            <span className="ml-2 font-mono text-[10px] text-ink-500">{t.grossMargin}%</span>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* OPEX */}
        <LineGroup
          title="Operating expenses"
          lines={data.operatingExpenses}
          setLines={setLines('operatingExpenses')}
          total={t.opex}
          showCategory
        />

        {/* Operating income teaser */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/25 bg-accounting-bg/60 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">Operating income</span>
          <div className="text-right">
            <span className={`font-mono text-[13px] font-semibold ${t.operatingIncome >= 0 ? 'text-accounting' : 'text-crimson-300'}`}>
              {formatNumber(t.operatingIncome)}
            </span>
            <span className="ml-2 font-mono text-[10px] text-ink-500">{t.operatingMargin}%</span>
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Other income / expenses */}
        <LineGroup
          title="Other income"
          lines={data.otherIncome}
          setLines={setLines('otherIncome')}
          total={t.otherIncome}
        />
        <div className="h-3" />
        <LineGroup
          title="Other expenses"
          lines={data.otherExpenses}
          setLines={setLines('otherExpenses')}
          total={t.otherExpenses}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Tax */}
        <div className="flex items-end gap-2">
          <TextInput
            label="Tax expense"
            value={data.taxExpense}
            onChange={(v) => setField('taxExpense')(Number(v) || 0)}
            placeholder="0"
            mono
          />
          <div className="mb-1 flex h-9 min-w-[80px] items-center justify-center rounded-md border border-line bg-canvas px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            {t.effectiveTaxRate}% eff.
          </div>
        </div>

        {/* Net income (big) */}
        <div className="mt-3 rounded-lg border border-accounting/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accounting">
              Net income
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {t.netMargin}% margin
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(t.netIncome, data.currency)}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3">
          <TextareaInput
            label="Notes (optional)"
            value={data.notes}
            onChange={setField('notes')}
            placeholder="Audit status, comparatives, accounting policies…"
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
          {busy === 'pdf' ? 'Generating…' : 'Generate P&L PDF'}
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

function PnlMock() {
  // Sample numbers
  const rev = 252000
  const cogs = 60000
  const gp = rev - cogs
  const opex = 127100
  const oi = gp - opex
  const tax = 14400
  const net = oi - tax + 720 - 1240
  return (
    <div className="rounded-md border border-line bg-paper p-6">
      <div className="mb-5 -mx-6 -mt-6 flex items-center justify-between bg-ink-950 px-6 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accounting">
          Profit &amp; Loss Statement
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-paper/70">USD</span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[18px] font-medium text-ink-950">Sonchoy Studio Ltd.</p>
          <p className="m-0 mt-1 text-[11px] text-ink-500">For the period: Apr–Jun 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-950 text-paper">
            <BrandMark size={14} className="text-paper" />
          </span>
        </div>
      </div>

      {/* Ratios strip */}
      <div className="mb-5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Revenue', formatNumber(rev)],
          ['Gross %', `${((gp / rev) * 100).toFixed(1)}%`],
          ['Op. %',   `${((oi / rev) * 100).toFixed(1)}%`],
          ['Net %',   `${((net / rev) * 100).toFixed(1)}%`],
        ].map(([k, v]) => (
          <div key={k} className="bg-canvas px-2 py-3">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
            <p className="m-0 mt-1 font-mono text-[14px] font-semibold text-ink-950">{v}</p>
          </div>
        ))}
      </div>

      {/* Body */}
      <table className="w-full text-[11px]">
        <tbody>
          {[
            { type: 'h', label: 'Revenue' },
            ['Product sales',   '184,000.00'],
            ['Service revenue', '56,000.00'],
            ['Licensing',       '12,000.00'],
            { type: 'st', label: 'Total revenue', amount: formatNumber(rev), pos: true },

            { type: 'h', label: 'Cost of goods sold' },
            ['Materials & components',  '−42,000.00'],
            ['Manufacturing & freight', '−18,000.00'],
            { type: 'st', label: 'Gross profit', amount: formatNumber(gp), pos: true },

            { type: 'h', label: 'Operating expenses' },
            ['Salaries & wages',       '−92,000.00'],
            ['Rent & utilities',       '−9,600.00'],
            ['Marketing & advertising', '−14,500.00'],
            ['Software & subscriptions', '−6,200.00'],
            ['Professional fees',      '−4,800.00'],
            { type: 'st', label: 'Operating income', amount: formatNumber(oi), pos: true },

            ['Interest income',  '720.00'],
            ['Interest expense', '−1,240.00'],
            ['Tax expense',      `−${formatNumber(tax)}`],
          ].map((row, i) => {
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
                <td className="py-1.5 px-1 text-right font-mono text-ink-700">{row[1]}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Net income box */}
      <div className="mt-4 rounded-md bg-ink-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accounting">Net income</span>
          <span className="font-mono text-[18px] font-semibold text-paper">USD {formatNumber(net)}</span>
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
            From line items{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a board-ready P&amp;L.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Revenue, COGS, OPEX (grouped by category), and other items — reconciled into gross, operating, and net margins. Numbers tie out before you hit Generate.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Form mockup */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accounting-bg text-accounting">
                    <PnlIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    P&amp;L Form
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Q2 2026 · USD
                </span>
              </div>

              <div className="space-y-2">
                {[
                  ['Company',           'Sonchoy Studio Ltd.'],
                  ['Period',            'Apr–Jun 2026'],
                  ['Revenue lines',     '3 entries · 252,000.00'],
                  ['COGS lines',        '2 entries · 60,000.00'],
                  ['OPEX lines',        '6 entries · 127,100.00'],
                  ['Tax expense',       '14,400.00 · 22.8% eff.'],
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
                  ['Gross %', '76.2%'],
                  ['Op. %',   '25.8%'],
                  ['Net %',   '19.7%'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-accounting-bg px-2 py-2">
                    <p className="m-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500">{k}</p>
                    <p className="m-0 mt-0.5 font-mono text-[13px] font-semibold text-accounting">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-accounting/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accounting">Net income</span>
                <span className="font-mono text-[14px] font-semibold text-paper">USD 49,580.00</span>
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
              <PnlMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Type the lines',     'Revenue, COGS, OPEX (with category), other items, tax. Sensible defaults so you can ship a draft in 60 seconds.'],
  ['02', 'Margins compute live', 'Gross, operating, and net margins update on every keystroke — see profitability before you generate.'],
  ['03', 'Download the PDF',     'A presentation-grade P&L with category breakdown, ratios strip, and a clean Net Income callout — plus a matching .xlsx.'],
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
              <em className="font-serif font-normal italic text-crimson-300">numbers to narrative.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Type the trial balance directly, or paste a CSV column. Either way, every subtotal reconciles automatically — gross profit + operating income + net income are always in agreement.
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
  { title: 'Three margin tiers',     desc: 'Gross, operating, and net margins computed live and printed at the top of every PDF.' },
  { title: 'OPEX by category',        desc: 'Each operating-expense line carries a category — totals are grouped & percentage-broken at the bottom.' },
  { title: 'Other income / expenses', desc: 'Interest income, interest expense, depreciation, FX — clean section separate from operating.' },
  { title: 'Effective tax rate',      desc: 'Tax expense / pre-tax income → effective rate, printed alongside the tax line.' },
  { title: 'Period flexibility',      desc: 'Month, quarter, half-year, year, or custom range — labelled cleanly in the header.' },
  { title: 'Currency aware',          desc: 'USD, EUR, GBP, INR + 30 more — stamped on every monetary cell and the Net Income callout.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for stakeholders</Eyebrow>
          <SectionTitle>
            Every number a board{' '}
            <em className="font-serif font-normal italic text-crimson-300">expects to see.</em>
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
  { q: 'What goes in COGS vs. Operating expenses?',  a: 'COGS is anything directly tied to producing the revenue you booked — materials, manufacturing labour, shipping. OPEX is everything else — salaries not tied to production, rent, marketing, software, professional fees. The gross-margin tier separates the two.' },
  { q: 'Do margins update automatically?',           a: 'Yes — gross margin, operating margin, and net margin all recompute on every keystroke. The ratios strip at the top of the PDF reflects the moment you hit Generate.' },
  { q: 'Can I include depreciation / amortisation?', a: 'Yes — either as an operating-expense line (preferred for EBITDA carve-outs) or as an "Other expense" line below operating income. The category dropdown has slots for both styles.' },
  { q: 'How is the effective tax rate calculated?',  a: 'Tax expense ÷ pre-tax income, printed next to the tax line. If pre-tax income is zero or negative, the rate is shown as 0% — the underlying line stays accurate.' },
  { q: 'Does this work for multi-currency?',         a: 'The P&L is single-currency. If you operate in multiple, translate everything to your reporting currency before entry. For consolidated multi-entity reporting, see the pdfFiller premium tier.' },
  { q: 'Output formats?',                            a: 'PDF (presentation-ready, with category breakdown) and .xlsx (formula-friendly, with the breakdown laid out for easy linking into your model).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">P&amp;L statements.</em>
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
  { name: 'Cash Flow Statement',        desc: 'Operating, investing, and financing cash flows.',     Icon: CashFlowIcon, label: 'ACCOUNTING', path: '/tools/cash-flow-statement' },
  { name: 'Balance Sheet Generator',    desc: 'Assets, liabilities, equity — tied out to the cent.', Icon: BalanceIcon,  label: 'ACCOUNTING', path: '/tools/balance-sheet-generator' },
  { name: 'Financial Forecast',         desc: 'Project revenue and expenses forward.',               Icon: ForecastIcon, label: 'ACCOUNTING' },
  { name: 'Budget Planning Sheet',      desc: 'Build budgets line-by-line with variance tracking.',  Icon: BudgetIcon,   label: 'ACCOUNTING' },
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

export default function ProfitLossStatementTool() {
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
