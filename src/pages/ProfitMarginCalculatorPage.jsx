import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  PercentIcon, EmiIcon, AmortIcon, VatIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, PURPOSES, SAMPLE_DATA,
  findCurrency, findPurpose,
  computeMargins,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/profitMargin/compute'
import { generateProfitMarginPdf } from '../lib/profitMargin/generatePdf'
import { generateProfitMarginXlsx } from '../lib/profitMargin/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Profit Margin Calculator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[560px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['3',       'Methods'],
  ['5',       'Compounding options'],
  ['Period',  'Row-by-row workings'],
  ['Free',    'Always · no signup'],
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
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-tax">Accounting &amp; Reports</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Profit Margin Calculator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-tax/30 bg-tax-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tax">
            <span className="h-1.5 w-1.5 rounded-full bg-tax shadow-[0_0_0_4px_rgba(132,204,22,0.25)]" />
            Accounting &amp; Reports · Margin workings
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Gross, operating{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — and net,
            </em>
            <br />
            on every{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              revenue line.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop in revenue, COGS, operating expenses, interest, and taxes — get gross, operating, pre-tax, and net margins instantly. Live KPI cards, a clean statement breakdown, and PDF + XLSX exports ready for board meetings or back-of-envelope checks.
          </p>
          <div className="mb-12 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="btn btn-cta btn-xl">
              Launch The Tool <ArrowRight size={16} />
            </button>
            <Link to="/#tools" className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-950/15 bg-ink-950/5 px-7 py-[18px] text-[16px] font-medium leading-none text-ink-950 no-underline backdrop-blur-sm transition-colors hover:bg-ink-950/10 capitalize">
              Explore More Tools
            </Link>
          </div>
          <div className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> No signup, ever</span>
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> 100% local · nothing uploaded</span>
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Gross · operating · net</span>
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

/* ---------- Method picker ---------- */

/* MethodPicker removed — not used in profit margin calculator */

/* ---------- Initial state ---------- */

const INITIAL = { ...SAMPLE_DATA }

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currencyCode), [data.currencyCode])
  const purpose = useMemo(() => findPurpose(data.purposeId), [data.purposeId])
  const m = useMemo(() => computeMargins(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generateProfitMarginPdf(data) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateProfitMarginXlsx(data) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-tax) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
              <PercentIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              {purpose.label} · {cur.code}
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <TextInput label="Label" value={data.label} onChange={setField('label')} placeholder="e.g. SKU-A1042 · Q3 launch" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DateInput label="Period start" value={data.periodStartIso} onChange={setField('periodStartIso')} />
          <DateInput label="Period end" value={data.periodEndIso} onChange={setField('periodEndIso')} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_92px] gap-2">
          <SelectInput label="Purpose" value={data.purposeId} onChange={setField('purposeId')}
            options={PURPOSES.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Currency" value={data.currencyCode} onChange={setField('currencyCode')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Revenue & costs */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tax">
          Revenue & costs
        </span>
        <div className="space-y-2">
          <NumberInput label="Revenue" value={data.revenue} onChange={setField('revenue')} suffix={cur.code} />
          <NumberInput label="Cost of goods sold (COGS)" value={data.cogs} onChange={setField('cogs')} suffix={cur.code} />
          <NumberInput label="Operating expenses" value={data.operatingExpense} onChange={setField('operatingExpense')} suffix={cur.code} />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Other income" value={data.otherIncome} onChange={setField('otherIncome')} suffix={cur.code} />
            <NumberInput label="Interest expense" value={data.interestExpense} onChange={setField('interestExpense')} suffix={cur.code} />
          </div>
          <NumberInput label="Taxes" value={data.taxes} onChange={setField('taxes')} suffix={cur.code} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live KPI cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Gross margin</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-tax">{formatNumber(m.grossMargin)}%</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{formatMoney(m.grossProfit, data.currencyCode)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Operating margin</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(m.operatingMargin)}%</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{formatMoney(m.operatingProfit, data.currencyCode)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Net margin</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(m.netMargin)}%</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">{formatMoney(m.netProfit, data.currencyCode)}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Markup on cost</p>
            <p className="m-0 mt-1 font-mono text-[13px] font-semibold text-ink-950">{formatNumber(m.markup)}%</p>
            <p className="m-0 font-mono text-[9px] text-ink-500">vs COGS</p>
          </div>
        </div>

        {/* Statement preview */}
        <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
            Statement breakdown
          </p>
          <table className="w-full text-[11px]">
            <tbody className="font-mono">
              {[
                ['Revenue',                m.revenue,          true ],
                ['(–) COGS',               m.cogs,             false],
                ['Gross profit',           m.grossProfit,      true ],
                ['(–) Operating expenses', m.operatingExpense, false],
                ['Operating profit',       m.operatingProfit,  true ],
                ['(+) Other income',       m.otherIncome,      false],
                ['(–) Interest expense',   m.interestExpense,  false],
                ['(–) Taxes',              m.taxes,            false],
                ['Net profit',             m.netProfit,        true ],
              ].map(([label, value, emph], i) => (
                <tr key={i} className={`border-t border-line ${emph ? 'bg-tax-bg/30' : ''}`}>
                  <td className={`py-1 ${emph ? 'font-semibold text-ink-950' : 'text-ink-700'}`}>{label}</td>
                  <td className={`py-1 text-right ${emph ? 'font-semibold text-ink-950' : 'text-ink-700'}`}>{formatNumber(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Big net margin */}
        <div className="mt-3 rounded-lg border border-tax/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tax">
              Net margin
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {purpose.label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatNumber(m.netMargin)}% · {formatMoney(m.netProfit, data.currencyCode)}
          </div>
        </div>

        <div className="mt-3">
          <TextareaInput label="Notes (appear in PDF)" value={data.notes} onChange={setField('notes')}
            placeholder="Assumptions, allocation method, accounting basis…" rows={2} />
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Profit Margin PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX workbook <ArrowRight size={10} /></>)}
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
        <p className="m-0 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-500">PROFIT MARGIN REPORT</p>
        <p className="m-0 mt-2 text-[16px] font-bold tracking-[-0.015em] text-ink-950">SKU-A1042 · Hand-bound notebook</p>
        <p className="m-0 mt-0.5 text-[10px] text-ink-500">Single product · USD · Q3 2026</p>
        <div className="mt-2 h-[2px] w-10 rounded bg-tax" />

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['GROSS',     '63.0%'],
            ['OPERATING', '34.6%'],
            ['NET',       '26.6%'],
            ['MARKUP',    '170.3%'],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-line bg-canvas px-2 py-1.5">
              <p className="m-0 font-mono text-[6.5px] font-bold uppercase tracking-[0.08em] text-tax">{k}</p>
              <p className="m-0 mt-0.5 text-[10px] font-bold text-ink-950">{v}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-tax">STATEMENT BREAKDOWN</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_90px] gap-1 bg-tax/20 px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-tax">
            <span>LINE</span>
            <span className="text-right">USD</span>
          </div>
          {[
            ['Revenue',                '50,000.00', true ],
            ['(–) COGS',               '18,500.00', false],
            ['Gross profit',           '31,500.00', true ],
            ['(–) Operating expenses', '14,200.00', false],
            ['Operating profit',       '17,300.00', true ],
            ['(–) Interest expense',      '600.00', false],
            ['(–) Taxes',               '3,200.00', false],
            ['Net profit',             '13,300.00', true ],
          ].map((r, i) => (
            <div key={i} className={`grid grid-cols-[1fr_90px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] ${r[2] ? 'bg-tax/10 font-bold text-ink-950' : 'text-ink-900'}`}>
              <span>{r[0]}</span>
              <span className="text-right">{r[1]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[10px] italic text-ink-500">Gross 63% · Operating 35% · Net 27% — exported as PDF + XLSX</p>
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
            Three numbers in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            a defensible workings sheet out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Principal, rate, and tenure — pick the method and you get the full period-by-period accrual, a yearly summary, and the maturity or final balance figure ready to share or verify.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-tax-bg text-tax">
                    <PercentIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Interest Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Compound · Quarterly
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Method',     'Compound interest'],
                  ['Principal',  'INR 2,50,000.00'],
                  ['Rate',       '7.25% p.a.'],
                  ['Tenure',     '5 years'],
                  ['Compounding', 'Quarterly (20 periods)'],
                  ['Start date', '20 May 2026'],
                  ['Total interest', 'INR 1,09,234.51'],
                  ['Maturity',   'INR 3,59,234.51'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-tax/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tax">Maturity value</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 3,59,234.51</span>
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
                  Workings-grade
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
  ['01', 'Pick the method',    'Simple, compound, or reducing balance. Each suits a different use case — accrual on principal, growth on growth, or amortising debt.'],
  ['02', 'Set the cadence',    'Annual, semi-annual, quarterly, monthly, or daily. The tool computes per-period rate, period dates, and total periods automatically.'],
  ['03', 'Export PDF + XLSX',  'PDF with summary cards, inputs block, yearly summary, full period table, and totals. XLSX has Summary, Schedule, and Yearly sheets — all numeric.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Interest{' '}
              <em className="font-serif font-normal italic text-crimson-300">— shown working.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Banks and lenders give you a single maturity number; this tool shows the path. Each period&rsquo;s opening balance, accrued interest, cumulative interest, and closing balance — defensible numbers you can paste into a dispute, a tax filing, or a finance team review.
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
  { title: 'Three interest methods',    desc: 'Simple (P × r × t), compound (P × (1+r/n)^(nt)), reducing-balance (EMI amortising principal). Pick by use case.' },
  { title: 'Five compound cadences',    desc: 'Annual, semi-annual, quarterly, monthly, daily. The per-period rate divides the annual rate by frequency — same way banks do it.' },
  { title: 'Tenure in years/months/days', desc: 'No need to pre-convert. Enter the tenure in whatever units the contract uses; the tool resolves to total periods automatically.' },
  { title: 'Auto EMI for reducing',      desc: 'Set the EMI to 0 for reducing-balance and the tool computes the equated payment that fully amortises principal over the tenure.' },
  { title: 'Yearly rollup',              desc: 'On top of the period-by-period schedule, a yearly summary table shows interest accrued and year-end balance — useful for tax reporting.' },
  { title: 'PDF + 3-sheet XLSX',         desc: 'PDF: summary cards, inputs, yearly summary, full period table, totals row. XLSX: Summary, Schedule, Yearly — all numeric for further analysis.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Defensible workings</Eyebrow>
          <SectionTitle>
            Every formula{' '}
            <em className="font-serif font-normal italic text-crimson-300">— shown.</em>
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
  { q: 'When should I use simple vs compound interest?',          a: 'Simple interest applies to most short-term loans, statutory late-payment interest, and a few savings products. Compound interest applies to fixed deposits, recurring savings, and most investment products. If you don\'t know, the contract or product brochure says — and the difference becomes large over longer tenures.' },
  { q: 'How is this different from the EMI Schedule tool?',        a: 'EMI Schedule and Loan Amortization are specifically for amortising loans with EMIs. This Interest Calculation Sheet is broader — it also handles simple accrual (penalties, statutory interest) and compound growth (FDs, savings) where there\'s no EMI involved. Reducing-balance method overlaps with EMI, but the focus here is on the interest workings, not the loan structure.' },
  { q: 'What about daily compounding for savings accounts?',      a: 'Set the compound frequency to "Daily". The schedule will have one row per day — handy for short-tenure verification, but expect a long table for multi-year savings. For long tenures, monthly or quarterly compounding usually gives a very close approximation.' },
  { q: 'Why doesn\'t my bank\'s FD calculator match exactly?',    a: 'Almost always within a few currency units. Differences come from how banks handle leap years, day-count conventions (actual/365 vs actual/360 vs 30/360), and rounding at each step. This tool uses 365-day year and standard rounding at each period — same as most retail bank calculators within ~0.1%.' },
  { q: 'Can I model late-payment penalty interest?',              a: 'Yes — use Simple interest with the rate from your contract (or the statutory rate, e.g. UK 8% over base) and tenure in days. The schedule shows daily accrual; the maturity value is the principal plus accumulated interest as at the end date.' },
  { q: 'Output formats?',                                          a: 'PDF (single document with summary cards, inputs block, yearly summary, full period-by-period schedule with totals row, and notes — auto-paginated) and XLSX (3 sheets: Summary, Schedule, Yearly). All numeric — paste straight into a model.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">interest calculations.</em>
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
  { name: 'EMI Schedule PDF',      desc: 'Flat-rate EMI schedules.',                    Icon: EmiIcon,     label: 'TAX', path: '/tools/emi-schedule' },
  { name: 'Loan Amortization',     desc: 'Multi-rate amortization with resets.',        Icon: AmortIcon,   label: 'TAX', path: '/tools/loan-amortization' },
  { name: 'Income Tax Estimator',  desc: 'Annual liability across slabs.',              Icon: PercentIcon, label: 'TAX', path: '/tools/income-tax-estimator' },
  { name: 'GST Calculation Sheet', desc: 'India GST workings with HSN/SAC.',            Icon: VatIcon,     label: 'TAX', path: '/tools/gst-calculation-sheet' },
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
          <Link to="/#tools" className="inline-flex items-center gap-2 font-medium text-[14px] text-crimson-300 underline decoration-crimson-500/40 underline-offset-4 hover:decoration-crimson-300">
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
              ? (<Link key={t.name} to={t.path} className={cls}>{inner}</Link>)
              : (<a key={t.name} href="#" className={cls}>{inner}</a>)
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function ProfitMarginCalculatorPage() {
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
