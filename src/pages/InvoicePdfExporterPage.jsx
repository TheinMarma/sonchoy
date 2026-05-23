import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  ExportIcon, InvoiceIcon, HashIcon, TemplateIcon, RecurringIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, EXPORT_MODES, PAGE_SIZES, SORT_OPTIONS, PARSE_FORMATS,
  findCurrency, findExportMode, findPageSize, findSortOption, findParseFormat,
  parseRows, sortRows, totalForRow, computeBatchTotals, buildStatusSummary, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/invoice-pdf-exporter/compute'
import { generateBatchInvoicePdf } from '../lib/invoice-pdf-exporter/generatePdf'
import { generateBatchManifestXlsx } from '../lib/invoice-pdf-exporter/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Invoice PDF Exporter"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[680px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Bulk',  'Up to 200 invoices'],
  ['One',   'Combined PDF'],
  ['CSV',   'Paste & parse'],
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
            <span className="text-ink-950">Invoice PDF Exporter</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-invoicing/30 bg-invoicing-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-invoicing">
            <span className="h-1.5 w-1.5 rounded-full bg-invoicing shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
            Invoicing · Batch export
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Many drafts in,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              one archive
            </em>
            <br />
            PDF{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Paste a CSV or TSV of invoice rows. The tool parses them, sorts by your choice, and renders a single multi-page PDF — cover sheet + manifest + one invoice per page — plus a matching XLSX manifest for your accountant.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> DRAFT watermark on drafts</span>
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
function TextareaInput({ label, value, onChange, placeholder, rows = 2, mono = true, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} min-h-[120px] resize-y leading-[1.45] ${mono ? 'font-mono text-[11.5px]' : ''}`} />
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

const SAMPLE_CSV = `invoiceNumber,issueDate,dueDate,clientName,description,qty,rate,taxPct,status
SCY-26-27-0041,2026-05-15,2026-06-14,Northwind Books Pvt Ltd,Brand identity sprint · Phase 1,1,250000,18,sent
SCY-26-27-0042,2026-05-16,2026-06-15,Northwind Books Pvt Ltd,Website design & development,1,480000,18,sent
SCY-26-27-0043,2026-05-18,2026-06-17,BrightBox Analytics,Q1 advisory retainer,3,65000,18,draft
SCY-26-27-0044,2026-05-19,2026-06-18,Lumen Software Inc,SaaS onboarding & training,2,85000,18,draft
SCY-26-27-0045,2026-05-20,2026-06-19,Halcyon Foods Ltd,Brand audit & strategy,1,120000,18,draft
SCY-26-27-0046,2026-05-21,2026-06-20,Acme Robotics Pvt Ltd,Trade-show booth design,1,180000,18,sent
SCY-26-27-0047,2026-05-22,2026-06-21,Cascade Media Group,Monthly content retainer,1,95000,18,paid
SCY-26-27-0048,2026-05-22,2026-06-21,Northwind Books Pvt Ltd,Photography & content shoot,2,85000,18,partial`

const INITIAL = {
  batchId: 'BATCH-2026-05-W4',
  batchDate: today,
  currency: 'INR',

  exportModeId: 'one_pdf',
  pageSizeId: 'a4',
  sortId: 'invoice_asc',
  parseFormatId: 'csv',

  company: {
    name: 'Sonchoy Studio Pvt Ltd',
    address: '7 Brigade Road, Bengaluru, Karnataka 560001',
    email: 'billing@sonchoystudio.com',
    phone: '+91 80 4567 8901',
    taxId: 'GSTIN 29ABCDE1234F1Z5',
  },

  csvText: SAMPLE_CSV,

  includeStatusSummary: true,
  includeNotesBlock: true,
  notes: 'Week 4 batch of May 2026. Drafts to be reviewed by Friday EOD; sent invoices already with clients awaiting payment. The "partial" status row reflects a 50% advance already received; the second tranche is still due against the invoice total.',
}

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  void findExportMode(data.exportModeId)
  void findPageSize(data.pageSizeId)
  void findSortOption(data.sortId)
  void findParseFormat(data.parseFormatId)

  const parsed = useMemo(() => parseRows(data.csvText, data.parseFormatId), [data.csvText, data.parseFormatId])
  const rows   = useMemo(() => sortRows(parsed.rows, data.sortId), [parsed.rows, data.sortId])
  const totals = useMemo(() => computeBatchTotals(rows), [rows])
  const statusSummary = useMemo(() => buildStatusSummary(rows), [rows])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setCompanyField = (k) => (v) => setData((s) => ({ ...s, company: { ...s.company, [k]: v } }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generateBatchInvoicePdf(data) }    finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateBatchManifestXlsx(data) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
              <ExportIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Batch · {rows.length} invoices · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Batch #" value={data.batchId} onChange={setField('batchId')} mono />
          <DateInput label="Prepared on" value={data.batchDate} onChange={setField('batchDate')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Export settings */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Export settings</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Mode" value={data.exportModeId} onChange={setField('exportModeId')}
            options={EXPORT_MODES.map((m) => ({ value: m.id, label: m.label }))} />
          <SelectInput label="Page size" value={data.pageSizeId} onChange={setField('pageSizeId')}
            options={PAGE_SIZES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_120px_120px] gap-2">
          <SelectInput label="Sort" value={data.sortId} onChange={setField('sortId')}
            options={SORT_OPTIONS.map((s) => ({ value: s.id, label: s.label }))} />
          <SelectInput label="Parse" value={data.parseFormatId} onChange={setField('parseFormatId')}
            options={PARSE_FORMATS.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* CSV input */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Invoice rows</span>
        <p className="m-0 mb-2 font-mono text-[10px] text-ink-500">
          Columns: <span className="text-ink-700">invoiceNumber, issueDate, dueDate, clientName, description, qty, rate, taxPct, status</span>. First row may be a header.
        </p>
        <TextareaInput
          label={`${data.parseFormatId === 'tsv' ? 'TSV' : 'CSV'} input`}
          value={data.csvText}
          onChange={setField('csvText')}
          rows={10}
          placeholder="SCY-26-27-0041,2026-05-15,2026-06-14,Northwind Books,Brand identity,1,250000,18,sent"
        />
        {parsed.errors.length > 0 && (
          <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[10.5px] text-warning">
            ⚠  {parsed.errors.length} parse warning{parsed.errors.length === 1 ? '' : 's'}
            <ul className="m-0 mt-1 max-h-[80px] list-none overflow-y-auto pl-2 text-[10px]">
              {parsed.errors.slice(0, 6).map((e, i) => (<li key={i}>· {e}</li>))}
              {parsed.errors.length > 6 && <li>· + {parsed.errors.length - 6} more</li>}
            </ul>
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Company */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Issuing business</span>
        <div className="space-y-2">
          <TextInput label="Company name" value={data.company.name} onChange={setCompanyField('name')} />
          <TextInput label="Address" value={data.company.address} onChange={setCompanyField('address')} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Email"  value={data.company.email} onChange={setCompanyField('email')} mono />
            <TextInput label="Phone"  value={data.company.phone} onChange={setCompanyField('phone')} mono />
            <TextInput label="Tax ID" value={data.company.taxId} onChange={setCompanyField('taxId')} mono />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Optional sections */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Optional sections</span>
        <div className="space-y-2">
          <ToggleRow label="Status summary table" desc="By status (draft / sent / paid / overdue)"
            checked={data.includeStatusSummary} onChange={setField('includeStatusSummary')} />
          <ToggleRow label="Notes block" desc="Free-text notes on the cover sheet"
            checked={data.includeNotesBlock} onChange={setField('includeNotesBlock')} />
        </div>
        {data.includeNotesBlock && (
          <div className="mt-2">
            <TextareaInput label="Notes" value={data.notes} onChange={setField('notes')} rows={3} mono={false} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Totals */}
        <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Invoices</span>
            <span className="text-ink-950">{totals.invoices}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Subtotal</span>
            <span className="text-ink-950">{formatNumber(totals.subtotal)}</span>
          </div>
          {totals.tax > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Tax</span>
              <span className="text-ink-950">{formatNumber(totals.tax)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-invoicing">Batch total</span>
            <span className="font-mono text-[14px] font-bold text-invoicing">{cur.code} {formatNumber(totals.total)}</span>
          </div>
        </div>

        {/* Status summary preview */}
        {statusSummary.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">By status</p>
            <div className="space-y-1">
              {statusSummary.map((s) => (
                <div key={s.status} className="flex items-center justify-between font-mono text-[10.5px]">
                  <span className="text-ink-900 uppercase">{s.status}</span>
                  <span className="text-ink-500">{s.count}×</span>
                  <span className="w-24 text-right text-ink-950">{formatNumber(s.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parsed preview */}
        {rows.length > 0 && (
          <div className="mt-3 rounded-lg border border-line bg-canvas">
            <p className="m-0 px-3 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Parsed preview · sorted by {findSortOption(data.sortId).label}
            </p>
            <div className="max-h-[240px] overflow-y-auto px-3 pb-3 pt-2">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">
                    <th className="py-1 font-normal">#</th>
                    <th className="py-1 font-normal">Invoice</th>
                    <th className="py-1 font-normal">Client</th>
                    <th className="py-1 font-normal">Status</th>
                    <th className="py-1 text-right font-normal">Total</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {rows.map((r, i) => (
                    <tr key={r.id} className="border-t border-line">
                      <td className="py-1 text-ink-500">{i + 1}</td>
                      <td className="py-1 text-ink-950">{r.invoiceNumber}</td>
                      <td className="py-1 text-ink-700 truncate max-w-[180px]">{r.clientName}</td>
                      <td className="py-1 text-ink-500 uppercase">{r.status || 'draft'}</td>
                      <td className="py-1 text-right text-ink-950">{formatNumber(totalForRow(r))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-invoicing/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-invoicing">Batch total</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {rows.length} invoices · {findExportMode(data.exportModeId).label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.total, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null || rows.length === 0}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : `Generate Batch PDF (${rows.length} invoice${rows.length === 1 ? '' : 's'})`}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null || rows.length === 0}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export manifest XLSX <ArrowRight size={10} /></>)}
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

function BatchMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-invoicing" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">Brigade Road, Bengaluru 560001</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[14px] font-bold tracking-[-0.01em] text-invoicing">BATCH EXPORT</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">BATCH-2026-05-W4</p>
            <p className="m-0 text-[9px] text-ink-500">Prepared 23 May 2026</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-invoicing/40" />

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded border border-line bg-canvas p-2">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-invoicing-dk">INVOICES</p>
            <p className="m-0 mt-1 text-[14px] font-bold text-ink-950">8</p>
          </div>
          <div className="rounded border border-line bg-canvas p-2">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-invoicing-dk">SUBTOTAL</p>
            <p className="m-0 mt-1 text-[14px] font-bold text-ink-950">INR 12,75,000</p>
          </div>
          <div className="rounded bg-invoicing p-2 text-white">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em]">TOTAL</p>
            <p className="m-0 mt-1 text-[14px] font-bold">INR 15,04,500</p>
          </div>
        </div>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-invoicing-dk">MANIFEST</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[16px_70px_1fr_40px_60px] gap-1 bg-invoicing px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-invoicing-dk">
            <span>#</span><span>INV</span><span>CLIENT</span><span>STATUS</span><span className="text-right">TOTAL</span>
          </div>
          {[
            ['1', 'SCY-0041', 'Northwind Books',    'sent',    '2,95,000'],
            ['2', 'SCY-0042', 'Northwind Books',    'sent',    '5,66,400'],
            ['3', 'SCY-0043', 'BrightBox Analytics', 'draft',  '2,30,100'],
            ['4', 'SCY-0044', 'Lumen Software',     'draft',   '2,00,600'],
            ['5', 'SCY-0045', 'Halcyon Foods',      'draft',   '1,41,600'],
            ['6', 'SCY-0046', 'Acme Robotics',      'sent',    '2,12,400'],
            ['7', 'SCY-0047', 'Cascade Media',      'paid',    '1,12,100'],
            ['8', 'SCY-0048', 'Northwind Books',    'partial', '2,00,600'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[16px_70px_1fr_40px_60px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-500">{r[0]}</span>
              <span>{r[1]}</span>
              <span className="truncate">{r[2]}</span>
              <span className="text-ink-500 uppercase">{r[3]}</span>
              <span className="text-right font-bold">{r[4]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ 8 single-page invoices (one per row) and status summary in the full PDF</p>
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
            CSV rows in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            multi-invoice PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Cover sheet with batch totals and a manifest table, followed by one branded invoice page per row. Drafts get a faint DRAFT watermark. The matching XLSX manifest goes straight into accounting.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <ExportIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Batch Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  CSV · 8 rows
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Batch #',     'BATCH-2026-05-W4'],
                  ['Mode',        'Single multi-page PDF'],
                  ['Page size',   'A4'],
                  ['Sort',        'Invoice # — ascending'],
                  ['Invoices',    '8 (3 draft · 4 sent · 1 paid)'],
                  ['Subtotal',    'INR 12,75,000'],
                  ['Tax',         'INR 2,29,500'],
                  ['Batch total', 'INR 15,04,500'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-invoicing/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-invoicing">Batch total</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 15,04,500</span>
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
                  Archive-ready
                </span>
              </div>
              <BatchMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Paste your CSV',         'Nine columns: invoice #, issue date, due date, client, description, qty, rate, tax %, status. Header row optional — the tool auto-detects it. Up to 200 rows per batch.'],
  ['02', 'Sort + check',           'Pick a sort (invoice #, date, client, amount). Watch the parsed preview update live; warnings show inline for missing fields. Status summary rolls up draft / sent / paid / overdue automatically.'],
  ['03', 'Export the archive',     'Single multi-page PDF: cover sheet → manifest → one full invoice per row. Drafts get a faint DRAFT watermark. XLSX manifest with all rows + status rollup for your accountant.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From spreadsheet{' '}
              <em className="font-serif font-normal italic text-crimson-300">to archive PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Month-end means dozens of draft invoices waiting to ship. Doing them one at a time wastes an afternoon. Paste them all once, render a single archive PDF, and hand a clean manifest to finance — the whole month closed in 30 seconds.
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
  { title: 'CSV / TSV paste',          desc: 'Paste from Excel, Google Sheets, your billing system, or hand-write rows. Quoted cells handled. Header row auto-detected.' },
  { title: 'Live parse warnings',       desc: 'Missing invoice numbers, empty client names, malformed rows — flagged inline as you type. No silent skips.' },
  { title: '7 sort options',            desc: 'As entered, invoice # asc/desc, issue-date asc/desc, client A–Z, amount largest first. Sort once on the cover; every per-invoice page follows.' },
  { title: 'DRAFT watermark on drafts', desc: 'Any row with status "draft" gets a large faint DRAFT watermark diagonally across the invoice page. Sent / paid / overdue invoices print clean.' },
  { title: 'Status summary',            desc: 'Counts and totals broken out by status (draft, sent, paid, partial, overdue). Easy month-end reconciliation against your books.' },
  { title: 'PDF + XLSX manifest',       desc: 'PDF: cover sheet, manifest table, one full invoice per row. XLSX: Summary, Manifest, By status, Errors. Hand the XLSX to your accountant; archive the PDF.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for month-end</Eyebrow>
          <SectionTitle>
            Many at once{' '}
            <em className="font-serif font-normal italic text-crimson-300">— still clean.</em>
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
  { q: 'Why batch-export instead of generating each invoice one by one?',  a: 'Two reasons. (1) Speed — a 30-invoice month-end run takes 30 seconds instead of an hour. (2) Auditability — one archive PDF with a cover sheet, manifest, and per-invoice pages is far easier to file and reference later than 30 separate PDF attachments. The XLSX manifest pairs with your accounting workflow.' },
  { q: 'What columns does the CSV expect?',                                a: 'Nine, in order: invoiceNumber, issueDate (YYYY-MM-DD), dueDate, clientName, description, qty, rate, taxPct, status. The header row is optional — if the first row contains the word "invoice", we treat it as a header and skip it. Tax % can be 0 or omitted for non-taxable lines; status defaults to "draft" if blank.' },
  { q: 'How are line items handled? Each row is one invoice, not one line.',  a: 'Correct — the batch exporter is for high-volume cases where each invoice has a single billable line. For multi-line invoices (e.g. an itemised retainer with 6 sub-deliverables), use the standard Invoice Generator one at a time. The batch tool is the right fit for monthly retainer invoices, single-service consulting bills, or any flow where one line per invoice is the norm.' },
  { q: 'Why does DRAFT get a watermark?',                                  a: 'So nobody mistakes a draft invoice for the issued version. Drafts often need review or amendments before they go to the client; printing them with a faint diagonal DRAFT mark makes the status unmistakable across the room. Drop a row\'s status to "sent" or "paid" and the watermark disappears.' },
  { q: 'What\'s the upper limit on batch size?',                            a: 'The tool caps at 200 rows per batch. Beyond that, the resulting PDF becomes unwieldy to email or store, and the in-browser render slows down noticeably. For 200+ invoices, split into multiple batches by week or by client tier.' },
  { q: 'Output formats?',                                                    a: 'PDF (cover sheet with batch metadata, three headline tiles (invoices / subtotal / batch total), manifest table with every row, optional by-status summary, optional notes, then one branded invoice page per CSV row in your chosen sort order, with DRAFT watermark on drafts) and XLSX (4 sheets: Summary, Manifest, By status, Errors).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">batch exports.</em>
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
  { name: 'Invoice Generator',         desc: 'Issue one richly itemised invoice at a time.',           Icon: InvoiceIcon,   label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'Invoice Number Generator',  desc: 'Plan the numbering scheme behind the batch.',            Icon: HashIcon,      label: 'INVOICING', path: '/tools/invoice-number-generator' },
  { name: 'Invoice Template Builder',  desc: 'Lock in the visual style of every batched invoice.',     Icon: TemplateIcon,  label: 'INVOICING', path: '/tools/invoice-template-builder' },
  { name: 'Recurring Invoice',         desc: 'For retainer cycles instead of ad-hoc batches.',         Icon: RecurringIcon, label: 'INVOICING', path: '/tools/recurring-invoice-generator' },
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

export default function InvoicePdfExporterPage() {
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
