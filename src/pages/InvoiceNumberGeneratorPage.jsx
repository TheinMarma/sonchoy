import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  HashIcon, InvoiceIcon, TemplateIcon, RecurringIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  NUMBERING_SCHEMES, FISCAL_YEAR_STARTS, PAD_LENGTHS, SEPARATORS, CASES,
  findScheme, findFiscalStart, findPad, findSeparator, findCase,
  buildInvoiceNumber, generateSeries, findDuplicates, countSections,
  todayISO,
} from '../lib/invoice-number/compute'
import { generateInvoiceNumberPdf } from '../lib/invoice-number/generatePdf'
import { generateInvoiceNumberXlsx } from '../lib/invoice-number/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Invoice Number Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[620px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['6',     'Numbering schemes'],
  ['Dup',   'Conflict check'],
  ['Bulk',  'Up to 100 in series'],
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
          style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 60%)' }} />
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
            <span className="text-invoicing">Invoicing</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Invoice Number Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-invoicing/30 bg-invoicing-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-invoicing">
            <span className="h-1.5 w-1.5 rounded-full bg-invoicing shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
            Invoicing · Numbering scheme
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Never duplicate{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              an invoice
            </em>
            <br />
            number{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              again.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Sequential, fiscal-year, calendar-year, monthly, date-stamped, or client-coded — pick a scheme, set your prefix, and generate the next 100 invoice numbers in one go. Paste your existing log and the tool flags conflicts before they hit your books.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Duplicate-aware</span>
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
  'focus:border-invoicing/60 focus:ring-2 focus:ring-invoicing/20 hover:border-line-strong'

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
        className={`${inputClass} min-h-[58px] resize-y leading-[1.4] font-mono`} />
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
        className="h-4 w-4 shrink-0 cursor-pointer accent-invoicing" />
    </label>
  )
}

/* ---------- Initial state ---------- */

const today = todayISO()

const INITIAL = {
  schemeName: 'Sonchoy Studio · FY 2026-27 series',
  schemeId: 'fiscal',
  fiscalStartId: 'apr',
  prefix: 'SCY',
  suffix: '',
  separatorId: 'dash',
  padId: '4',
  caseId: 'upper',
  startNumber: 1,
  clientCode: '',
  issueDate: today,

  businessName: 'Sonchoy Studio Pvt Ltd',
  businessTaxId: 'GSTIN 29ABCDE1234F1Z5',
  preparedBy: 'Nikhil Sharma · Head of Finance',

  previewCount: 12,

  usedNumbersText: 'SCY-26-27-0001\nSCY-25-26-0148\nSCY-25-26-0149',

  includeRulesBlock: true,
  rules: 'Invoice numbers reset on 1 April each year (FY start). Prefix locked at "SCY"; client-specific work uses the "client-coded" scheme with a 3-letter client tag. Numbers must be padded to four digits and joined with single dashes. Voided invoice numbers stay logged — never reissue.',

  includeAuditBlock: true,
}

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const scheme = useMemo(() => findScheme(data.schemeId), [data.schemeId])
  void findFiscalStart(data.fiscalStartId)
  void findPad(data.padId)
  void findSeparator(data.separatorId)
  void findCase(data.caseId)
  const sample = useMemo(() => buildInvoiceNumber(data, 0), [data])
  const series = useMemo(() => generateSeries(data, Number(data.previewCount) || 12), [data])
  const usedList = useMemo(
    () => (data.usedNumbersText || '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
    [data.usedNumbersText]
  )
  const dupes = useMemo(() => findDuplicates(series, usedList), [series, usedList])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generateInvoiceNumberPdf(data) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateInvoiceNumberXlsx(data) } finally { setBusy(null) } }
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(series.map((s) => s.number).join('\n'))
      setBusy('copied')
      setTimeout(() => setBusy(null), 1200)
    } catch {
      setBusy(null)
    }
  }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
              <HashIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Scheme · {scheme.label} · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* Live sample */}
        <div className="mb-4 rounded-lg border border-invoicing/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-invoicing">Next number</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              starts at {data.startNumber}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[22px] font-semibold tracking-[-0.01em] text-paper">
            {sample}
          </div>
        </div>

        <TextInput label="Scheme name" value={data.schemeName} onChange={setField('schemeName')} />

        <div className="my-3.5 h-px bg-line" />

        {/* Format */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Format</span>
        <SelectInput label="Numbering scheme" value={data.schemeId} onChange={setField('schemeId')}
          options={NUMBERING_SCHEMES.map((s) => ({ value: s.id, label: `${s.label} — ${s.desc}` }))} />
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">{scheme.desc}</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <TextInput label="Prefix" value={data.prefix} onChange={setField('prefix')} mono placeholder="e.g. SCY" />
          <TextInput label="Suffix (optional)" value={data.suffix} onChange={setField('suffix')} mono placeholder="" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <SelectInput label="Separator" value={data.separatorId} onChange={setField('separatorId')}
            options={SEPARATORS.map((s) => ({ value: s.id, label: s.label }))} />
          <SelectInput label="Pad length" value={data.padId} onChange={setField('padId')}
            options={PAD_LENGTHS.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Case" value={data.caseId} onChange={setField('caseId')}
            options={CASES.map((c) => ({ value: c.id, label: c.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <NumberInput label="Starts at" value={data.startNumber} onChange={setField('startNumber')} />
          <DateInput label="Effective date" value={data.issueDate} onChange={setField('issueDate')} />
        </div>
        {(scheme.id === 'fiscal' || scheme.id === 'client') && (
          <div className="mt-2">
            <SelectInput label="Fiscal year starts" value={data.fiscalStartId} onChange={setField('fiscalStartId')}
              options={FISCAL_YEAR_STARTS.map((f) => ({ value: f.id, label: f.label }))} />
          </div>
        )}
        {scheme.id === 'client' && (
          <div className="mt-2">
            <TextInput label="Client code" value={data.clientCode} onChange={setField('clientCode')} mono placeholder="e.g. NWB" />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Conflict check */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Conflict check (optional)</span>
        <TextareaInput
          label="Paste existing invoice numbers — one per line"
          value={data.usedNumbersText}
          onChange={setField('usedNumbersText')}
          rows={4}
          placeholder="SCY-25-26-0148&#10;SCY-25-26-0149"
        />
        {dupes.length > 0 && (
          <div className="mt-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-[10.5px] text-danger">
            ⚠  {dupes.length} conflict{dupes.length === 1 ? '' : 's'} with the list above. Bump &ldquo;Starts at&rdquo; or change the scheme.
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Series */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Series preview</span>
        <NumberInput label="How many to generate" value={data.previewCount} onChange={setField('previewCount')} suffix="numbers" />

        <div className="mt-3 max-h-[260px] overflow-y-auto rounded-lg border border-line bg-canvas">
          <table className="w-full text-[10.5px]">
            <thead className="sticky top-0 bg-canvas">
              <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-500">
                <th className="px-3 py-1.5 font-normal">#</th>
                <th className="px-3 py-1.5 font-normal">Invoice number</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {series.map((s) => {
                const conflict = dupes.includes(s.number)
                return (
                  <tr key={s.index} className="border-t border-line">
                    <td className="px-3 py-1.5 text-ink-500">{s.index}</td>
                    <td className={`px-3 py-1.5 ${conflict ? 'text-danger font-bold' : 'text-ink-950'}`}>
                      {s.number}{conflict && <span className="ml-2 text-[8.5px] uppercase tracking-[0.08em]">conflict</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={handleCopy}
          className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950">
          {busy === 'copied' ? 'Copied!' : 'Copy series to clipboard'}
        </button>

        <div className="my-3.5 h-px bg-line" />

        {/* Business */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Audit details</span>
        <div className="space-y-2">
          <TextInput label="Business name" value={data.businessName} onChange={setField('businessName')} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Tax ID"      value={data.businessTaxId} onChange={setField('businessTaxId')} mono />
            <TextInput label="Prepared by" value={data.preparedBy}    onChange={setField('preparedBy')} />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Section toggles */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Optional sections</span>
        <div className="space-y-2">
          <ToggleRow label="Internal numbering rules" desc="When the sequence resets, who can override, etc."
            checked={data.includeRulesBlock} onChange={setField('includeRulesBlock')} />
          <ToggleRow label="Audit signature block"     desc="Finance + preparer sign-off lines"
            checked={data.includeAuditBlock} onChange={setField('includeAuditBlock')} />
        </div>
        {data.includeRulesBlock && (
          <div className="mt-2">
            <TextareaInput label="Rules" value={data.rules} onChange={setField('rules')} rows={4} />
          </div>
        )}

        <button type="button" onClick={handlePdf} disabled={busy === 'pdf' || busy === 'xlsx'}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Scheme PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy === 'pdf' || busy === 'xlsx'}
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

function SchemeMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-invoicing" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">GSTIN 29ABCDE1234F1Z5</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[14px] font-bold tracking-[-0.01em] text-invoicing">NUMBERING SCHEME</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">FY 2026-27 series</p>
            <p className="m-0 text-[9px] text-ink-500">Effective 23 May 2026</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-invoicing/40" />

        <div className="mt-3 overflow-hidden rounded-lg border-2 border-invoicing">
          <div className="bg-invoicing px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-invoicing-dk">Next invoice number</div>
          <div className="bg-paper px-3 py-3">
            <p className="m-0 text-left font-mono text-[24px] font-bold tracking-[-0.01em] text-ink-950">SCY-26-27-0001</p>
          </div>
        </div>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-invoicing-dk">FORMAT</p>
        <div className="mt-1 grid grid-cols-2 gap-1 font-mono text-[8.5px]">
          {[
            ['Scheme',     'Fiscal year'],
            ['Prefix',     'SCY'],
            ['Separator',  'Dash'],
            ['Pad length', '4 digits'],
            ['Starts at',  '1'],
            ['FY starts',  'April'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-line py-1">
              <span className="text-ink-500">{k}</span>
              <span className="text-ink-950">{v}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-invoicing-dk">SERIES PREVIEW (12)</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[20px_1fr] gap-1 bg-canvas px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-invoicing-dk">
            <span>#</span><span>NUMBER</span>
          </div>
          {[
            ['1',  'SCY-26-27-0001'],
            ['2',  'SCY-26-27-0002'],
            ['3',  'SCY-26-27-0003'],
            ['4',  'SCY-26-27-0004'],
            ['5',  'SCY-26-27-0005'],
            ['6',  'SCY-26-27-0006'],
            ['…', '…'],
            ['12', 'SCY-26-27-0012'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[20px_1fr] gap-1 border-t border-line px-2 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-500">{r[0]}</span>
              <span>{r[1]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ rules block, conflict check, and audit signature in the PDF</p>
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
            Scheme rules in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            audit-ready PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Pick a numbering scheme, set your prefix and start number, generate up to 100 invoice numbers, and cross-check against your existing log. Export a PDF for the finance binder and an XLSX series for your billing system.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <HashIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Scheme Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Fiscal · 12 preview
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Scheme name',  'Sonchoy Studio · FY 2026-27 series'],
                  ['Format',       'Fiscal year reset'],
                  ['Prefix',       'SCY'],
                  ['Separator',    'Dash · 4-digit pad'],
                  ['Starts at',    '1 → SCY-26-27-0001'],
                  ['Effective',    '23 May 2026'],
                  ['Used numbers', '3 logged · 0 conflict'],
                  ['Preview',      'Next 12 generated'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-invoicing/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-invoicing">Next number</span>
                <span className="font-mono text-[14px] font-semibold text-paper">SCY-26-27-0001</span>
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <ExportIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT.PDF</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Audit-ready
                </span>
              </div>
              <SchemeMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick a scheme',          'Sequential, fiscal year, calendar year, year + month, date-stamped, or client-coded. Each scheme answers a different question about when the counter resets.'],
  ['02', 'Set the format',          'Prefix, suffix, separator (dash, slash, dot, underscore, or none), pad length (3–6 digits), case. The next number renders live as you type.'],
  ['03', 'Cross-check & export',    'Paste your existing invoice log; the tool flags any conflicts in red. Export the scheme as a PDF (for the finance binder) and the series as XLSX (drop into your billing system).'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From scheme rule{' '}
              <em className="font-serif font-normal italic text-crimson-300">to numbered series.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Duplicate invoice numbers are the easiest way to fail an audit. The fix is a written scheme — a single rule everyone follows — plus a duplicate-check before any new number goes out. This tool packages both.
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
  { title: '6 numbering schemes',      desc: 'Sequential · Fiscal year · Calendar year · Year + month · Date-stamped · Client-coded. Each scheme answers a different "when does this counter reset" question.' },
  { title: 'Fiscal-year aware',         desc: 'India (Apr–Mar), US Federal (Oct–Sep), calendar (Jan–Dec), or July-start. The fiscal-year tag updates per the issue date so April 2026 invoices stamp as 26-27 automatically.' },
  { title: 'Duplicate check',           desc: 'Paste your existing invoice log; the tool diffs against the next-N series and flags conflicts in red. No more "Invoice 0247 already exists" emails from your accountant.' },
  { title: 'Format playground',         desc: 'Prefix, suffix, separator (dash / slash / dot / underscore / none), pad length (3–6 digits), case (UPPER / lower / as-entered). Render the next number live as you tweak.' },
  { title: 'Client-coded variant',      desc: 'For agencies billing many clients, the "client-coded" scheme inserts a 3-letter tag (NWB, ACME, etc.) between the prefix and the FY counter — easy reconciliation per client.' },
  { title: 'PDF + 3-sheet XLSX',        desc: 'PDF: branded header, format-choices table, next-number hero, series preview with conflict markers, rules block, audit signatures. XLSX: Summary, Series, Used numbers.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for finance</Eyebrow>
          <SectionTitle>
            One scheme,{' '}
            <em className="font-serif font-normal italic text-crimson-300">zero duplicates.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-invoicing/20 bg-invoicing-bg text-invoicing">
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
  { q: 'Why do invoice numbers need to be unique and sequential?', a: 'Sequential, gap-free invoice numbering is a standard audit requirement in most jurisdictions — it makes it impossible to quietly remove an invoice from the books. In India under GST, invoice numbers must be consecutive and unique per fiscal year. In the UK and EU, VAT invoices must carry sequential numbers. Even outside formal regulation, your accountant or auditor will expect them; gaps and duplicates are immediate red flags.' },
  { q: 'When does the fiscal-year counter reset?',                  a: 'On the first day of your chosen fiscal year. India: 1 April. US Federal: 1 October. Calendar: 1 January. The tool picks the FY tag based on the "effective date" you set — an invoice issued in March 2027 stamps as 26-27; one issued 2 April 2027 stamps as 27-28. The counter inside that FY restarts at "Starts at" (typically 1).' },
  { q: 'What does the client-coded scheme do?',                     a: 'It inserts a per-client tag between the prefix and the fiscal-year counter: e.g. SCY-NWB-26-27-0001 for Northwind, SCY-ACME-26-27-0001 for Acme. Useful for agencies and managed-services firms that want per-client sub-sequences while keeping a single global prefix. Each client effectively gets its own counter.' },
  { q: 'How does the duplicate check work?',                        a: 'Paste your existing log of issued invoice numbers (one per line, or comma-separated) into the "conflict check" box. The tool diffs that list against the next-N numbers in your generated series and highlights any match in red — both in the on-page preview and on the exported PDF. Bump the "Starts at" number or change the scheme until the conflicts clear.' },
  { q: 'Can I copy the series straight into my billing system?',    a: 'Yes — the "Copy series to clipboard" button puts a newline-separated list on your clipboard, ready to paste into a Google Sheet, Excel, or any billing tool. The XLSX export also includes a dedicated "Series" sheet with column headers, which most accounting tools can ingest directly.' },
  { q: 'Output formats?',                                            a: 'PDF (top accent stripe, branded business header, "INVOICE NUMBER SCHEME" block top-right with scheme name / effective date / format, large next-invoice-number hero card, format-choices table, series preview table with conflict markers in red, optional rules block, optional dual audit-signature block) and XLSX (3 sheets: Summary, Series, Used numbers).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">invoice numbering.</em>
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
  { name: 'Invoice Generator',           desc: 'Generate an actual invoice using your new scheme.',     Icon: InvoiceIcon,    label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'Recurring Invoice',           desc: 'Auto-applies a number prefix to every cycle.',          Icon: RecurringIcon,  label: 'INVOICING', path: '/tools/recurring-invoice-generator' },
  { name: 'Freelance Invoice',           desc: 'Mix rate types on one numbered invoice.',                Icon: InvoiceIcon,    label: 'INVOICING', path: '/tools/freelance-invoice-generator' },
  { name: 'Invoice Template Builder',    desc: 'Pair the scheme with a reusable branded layout.',        Icon: TemplateIcon,   label: 'INVOICING' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-invoicing">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
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

export default function InvoiceNumberGeneratorPage() {
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
