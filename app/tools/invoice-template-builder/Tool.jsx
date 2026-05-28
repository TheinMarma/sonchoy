'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, Plus,
  TemplateIcon, InvoiceIcon, HashIcon, TaxInvoiceIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  CURRENCIES, LAYOUTS, FONTS, ACCENT_STYLES, TABLE_STYLES, DATE_FORMATS, SHOW_TAX_OPTIONS,
  findCurrency, findLayout, findFont, findAccentStyle, findTableStyle, findDateFormat, findShowTaxOption,
  computeSampleTotals, countSections,
  formatNumber, formatMoney, todayISO,
  hexToRgb, isAccentDark,
} from '@/lib/invoice-template/compute'
import { generateTemplateSamplePdf, downloadTemplateJson } from '@/lib/invoice-template/generatePdf'

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
    <div role="dialog" aria-modal="true" aria-label="Live Invoice Template Builder"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[680px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['4',     'Layout presets'],
  ['Live',  'In-browser preview'],
  ['JSON',  'Re-importable'],
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
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-invoicing">Invoicing</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Invoice Template Builder</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-invoicing/30 bg-invoicing-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-invoicing">
            <span className="h-1.5 w-1.5 rounded-full bg-invoicing shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
            Invoicing · Branded layout
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Design it once,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              reuse
            </em>
            <br />
            on every{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              invoice.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Build a branded invoice template — layout, accent colour, font, table style, date format, watermark — preview it live, then download a sample PDF and a JSON template you can re-import into the other invoice generators.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Live preview</span>
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
function ColorInput({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="flex items-stretch gap-2">
        <input type="color" value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-[36px] w-[44px] cursor-pointer rounded-lg border border-line bg-paper p-0.5" />
        <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          placeholder="#B46E05"
          className={`${inputClass} font-mono`} />
      </div>
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

/* ---------- Sample item list ---------- */

function ItemList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const addOne = () => setItems([
    ...items,
    { id: Date.now() + Math.random(), description: '', qty: 1, rate: 0, taxPct: 18 },
  ])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-invoicing">Sample line items ({items.length})</span>
        <button type="button" onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md bg-invoicing-bg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-invoicing transition-colors hover:bg-invoicing/20">
          <Plus size={9} /> Add line
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-[1fr_70px_80px_60px_22px] items-center gap-1.5 rounded-md border border-line bg-paper p-1.5">
            <input type="text" value={it.description || ''}
              onChange={(e) => update(it.id, { description: e.target.value })}
              placeholder="Description"
              className="min-h-[26px] rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[12px] text-ink-900 outline-none focus:border-invoicing/60" />
            <input type="number" step="any" value={it.qty}
              onChange={(e) => update(it.id, { qty: Number(e.target.value) || 0 })}
              placeholder="Qty"
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-invoicing/60" />
            <input type="number" step="any" value={it.rate}
              onChange={(e) => update(it.id, { rate: Number(e.target.value) || 0 })}
              placeholder="Rate"
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-invoicing/60" />
            <input type="number" step="any" value={it.taxPct}
              onChange={(e) => update(it.id, { taxPct: Number(e.target.value) || 0 })}
              placeholder="Tax %"
              className="min-h-[26px] rounded border border-line bg-canvas px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-900 outline-none focus:border-invoicing/60" />
            <button type="button" onClick={() => remove(it.id)} aria-label="Remove"
              className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Live HTML preview ---------- */

function LivePreview({ data }) {
  const layout = findLayout(data.layoutId)
  const accentStyle = findAccentStyle(data.accentStyleId)
  const tableStyle  = findTableStyle(data.tableStyleId)
  const dateFmt     = findDateFormat(data.dateFormatId)
  const showTax     = findShowTaxOption(data.showTaxId)
  const totals      = computeSampleTotals(data)
  const cur         = findCurrency(data.currency)
  const accent      = data.accentColor || '#B46E05'
  const onAccent    = isAccentDark(accent) ? '#FFFFFF' : '#0A0A09'
  const fontStack = data.fontId === 'times'
    ? 'Georgia, "Times New Roman", serif'
    : data.fontId === 'courier'
      ? '"JetBrains Mono", "Courier New", monospace'
      : 'system-ui, -apple-system, sans-serif'

  return (
    <div className="overflow-hidden rounded-md border border-line bg-paper shadow-inner">
      {accentStyle.id === 'stripe' && (
        <div style={{ background: accent, height: 4 }} />
      )}
      <div
        style={{
          background: accentStyle.id === 'band' ? accent : 'transparent',
          color: accentStyle.id === 'band' ? onAccent : '#0A0A09',
          fontFamily: fontStack,
          padding: accentStyle.id === 'band' ? '14px 16px 12px' : '14px 16px 6px',
        }}
      >
        {layout.id === 'modern' ? (
          <>
            <div style={{ fontSize: 22, fontWeight: 700, color: accentStyle.id === 'band' ? onAccent : accent }}>INVOICE</div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>{data.business?.name || 'Your business'}</div>
            <div style={{ marginTop: 2, fontSize: 9, opacity: 0.8 }}>
              {[data.business?.email, data.business?.phone].filter(Boolean).join(' · ')}
            </div>
            <div style={{ marginTop: 6, fontSize: 9, opacity: 0.85 }}>
              Inv # {data.sample?.invoiceNumber || '—'} · {dateFmt.fmt(data.sample?.issueDate)} · Due {dateFmt.fmt(data.sample?.dueDate)}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: layout.id === 'compact' ? 14 : 16, fontWeight: 700 }}>{data.business?.name || 'Your business'}</div>
              <div style={{ marginTop: 2, fontSize: 9, opacity: 0.7 }}>
                {data.business?.address || ''}
              </div>
              <div style={{ marginTop: 2, fontSize: 9, opacity: 0.7 }}>
                {[data.business?.email, data.business?.phone].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: layout.id === 'compact' ? 16 : 20, fontWeight: 700, color: accent }}>INVOICE</div>
              <div style={{ marginTop: 2, fontSize: 9, opacity: 0.75 }}>Inv # {data.sample?.invoiceNumber || '—'}</div>
              <div style={{ fontSize: 9, opacity: 0.75 }}>Date: {dateFmt.fmt(data.sample?.issueDate)}</div>
              <div style={{ fontSize: 9, opacity: 0.75 }}>Due: {dateFmt.fmt(data.sample?.dueDate)}</div>
            </div>
          </div>
        )}
      </div>
      {accentStyle.id === 'rule' && (
        <div style={{ background: accent, height: 1, margin: '6px 16px 0' }} />
      )}

      <div style={{ padding: '10px 16px 14px', fontFamily: fontStack }}>
        <div style={{ fontSize: 7.5, fontWeight: 700, color: accent, letterSpacing: '0.08em' }}>BILL TO</div>
        <div style={{ marginTop: 3, fontSize: 11, fontWeight: 700, color: '#0A0A09' }}>{data.sample?.clientName || 'Client name'}</div>
        <div style={{ marginTop: 1, fontSize: 9, color: '#50504C' }}>{data.sample?.clientEmail}</div>

        {/* Items table */}
        <div style={{
          marginTop: 10,
          border: tableStyle.id === 'outlined' ? `1px solid ${accent}` : 'none',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 40px 60px 60px',
            gap: 4,
            background: tableStyle.id === 'filled' ? accent : 'transparent',
            color: tableStyle.id === 'filled' ? onAccent : accent,
            padding: '5px 8px',
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: '0.08em',
            borderBottom: tableStyle.id === 'minimal' ? `1px solid ${accent}` : 'none',
          }}>
            <span>DESCRIPTION</span>
            <span style={{ textAlign: 'right' }}>QTY</span>
            <span style={{ textAlign: 'right' }}>RATE</span>
            <span style={{ textAlign: 'right' }}>AMOUNT</span>
          </div>
          {totals.lines.map((l, i) => (
            <div key={l.id ?? i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 40px 60px 60px',
              gap: 4,
              padding: '4px 8px',
              fontSize: 9,
              color: '#0A0A09',
              background: tableStyle.id === 'filled' && i % 2 === 1 ? '#FCFCFA' : 'transparent',
              borderTop: tableStyle.id === 'outlined' || tableStyle.id === 'minimal'
                ? '1px solid #DCDAD4'
                : 'none',
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description || '—'}</span>
              <span style={{ textAlign: 'right', color: '#50504C' }}>{formatNumber(l.qty)}</span>
              <span style={{ textAlign: 'right' }}>{formatNumber(l.rate)}</span>
              <span style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumber(l.total)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ marginTop: 8, marginLeft: 'auto', width: '60%', fontSize: 9 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#50504C' }}>
            <span>Subtotal</span>
            <span style={{ color: '#0A0A09' }}>{formatNumber(totals.subtotal)}</span>
          </div>
          {(showTax.id === 'summary' || showTax.id === 'both') && totals.totalTax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, color: '#50504C' }}>
              <span>Tax</span>
              <span style={{ color: '#0A0A09' }}>{formatNumber(totals.totalTax)}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
            paddingTop: 4,
            borderTop: `1px solid ${accent}`,
            fontWeight: 700,
            color: accent,
            fontSize: 11,
          }}>
            <span>TOTAL</span>
            <span>{cur.code} {formatNumber(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const today = todayISO()

const INITIAL = {
  templateName: 'Sonchoy Studio · House style',
  currency: 'INR',

  // Style
  layoutId: 'classic',
  fontId: 'helvetica',
  accentStyleId: 'stripe',
  accentColor: '#B46E05',
  tableStyleId: 'filled',
  dateFormatId: 'long',
  showTaxId: 'both',

  // Brand block
  business: {
    name: 'Sonchoy Studio Pvt Ltd',
    address: '7 Brigade Road, Bengaluru, Karnataka 560001',
    email: 'billing@sonchoystudio.com',
    phone: '+91 80 4567 8901',
    website: 'sonchoystudio.com',
    taxId: 'GSTIN 29ABCDE1234F1Z5',
  },

  // Sample preview content
  sample: {
    invoiceNumber: 'SCY-26-27-0042',
    issueDate: today,
    dueDate: '2026-06-22',
    poRef: 'PO-NWB-019',
    clientName: 'Northwind Books Pvt Ltd',
    clientAddress: 'Brigade Gateway, Malleshwaram, Bengaluru 560055',
    clientEmail: 'marcus@northwindbooks.in',
  },

  sampleItems: [
    { id: 1, description: 'Brand identity sprint · Phase 1',  qty: 1, rate: 250000, taxPct: 18 },
    { id: 2, description: 'Website design & development',     qty: 1, rate: 480000, taxPct: 18 },
    { id: 3, description: 'Launch campaign creative',         qty: 3, rate: 65000,  taxPct: 18 },
  ],

  // Watermark
  includeWatermark: false,
  watermarkText: 'DRAFT',

  // Payment block
  includePaymentBlock: true,
  payment: {
    bankName: 'HDFC Bank · Brigade Road',
    accountName: 'Sonchoy Studio Pvt Ltd',
    accountNumber: 'XXXX XXXX 4421',
    ifsc: 'HDFC0001234',
  },

  // Footer
  includeFooter: true,
  footerLeft: 'Sonchoy Studio · sonchoystudio.com · billing@sonchoystudio.com',
  footerRight: 'Page 1 of 1',
}

let nextId = 100

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  void findLayout(data.layoutId)
  void findFont(data.fontId)
  void findAccentStyle(data.accentStyleId)
  void findTableStyle(data.tableStyleId)
  void findDateFormat(data.dateFormatId)
  void findShowTaxOption(data.showTaxId)
  const totals = useMemo(() => computeSampleTotals(data), [data])
  void totals
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setBusinessField = (k) => (v) => setData((s) => ({ ...s, business: { ...s.business, [k]: v } }))
  const setSampleField   = (k) => (v) => setData((s) => ({ ...s, sample:   { ...s.sample,   [k]: v } }))
  const setPaymentField  = (k) => (v) => setData((s) => ({ ...s, payment:  { ...s.payment,  [k]: v } }))
  const setItems = (items) => setData((s) => ({ ...s, sampleItems: items.map((it) => ({ ...it, id: it.id ?? nextId++ })) }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generateTemplateSamplePdf(data) }  finally { setBusy(null) } }
  const handleJson = async () => { try { setBusy('json'); downloadTemplateJson(data) }       finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-invoicing) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
              <TemplateIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Template · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* Live preview */}
        <div className="mb-4">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">Live preview</p>
          <LivePreview data={data} />
        </div>

        <TextInput label="Template name" value={data.templateName} onChange={setField('templateName')} />

        <div className="my-3.5 h-px bg-line" />

        {/* Style */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Style</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Layout" value={data.layoutId} onChange={setField('layoutId')}
            options={LAYOUTS.map((l) => ({ value: l.id, label: `${l.label} — ${l.desc}` }))} />
          <SelectInput label="Font" value={data.fontId} onChange={setField('fontId')}
            options={FONTS.map((f) => ({ value: f.id, label: f.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="Accent style" value={data.accentStyleId} onChange={setField('accentStyleId')}
            options={ACCENT_STYLES.map((a) => ({ value: a.id, label: `${a.label} — ${a.desc}` }))} />
          <ColorInput label="Accent colour" value={data.accentColor} onChange={setField('accentColor')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="Table style" value={data.tableStyleId} onChange={setField('tableStyleId')}
            options={TABLE_STYLES.map((t) => ({ value: t.id, label: `${t.label} — ${t.desc}` }))} />
          <SelectInput label="Date format" value={data.dateFormatId} onChange={setField('dateFormatId')}
            options={DATE_FORMATS.map((d) => ({ value: d.id, label: d.label }))} />
        </div>
        <div className="mt-2">
          <SelectInput label="Tax display" value={data.showTaxId} onChange={setField('showTaxId')}
            options={SHOW_TAX_OPTIONS.map((s) => ({ value: s.id, label: s.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Brand block */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Brand block</span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <TextInput label="Business name" value={data.business.name} onChange={setBusinessField('name')} />
            <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
              options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
          </div>
          <TextareaInput label="Address" value={data.business.address} onChange={setBusinessField('address')} rows={2} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Email"   value={data.business.email}   onChange={setBusinessField('email')}   mono />
            <TextInput label="Phone"   value={data.business.phone}   onChange={setBusinessField('phone')}   mono />
            <TextInput label="Website" value={data.business.website} onChange={setBusinessField('website')} mono />
          </div>
          <TextInput label="Tax ID / GSTIN" value={data.business.taxId} onChange={setBusinessField('taxId')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Sample content */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Sample invoice content</span>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_140px] gap-2">
            <TextInput label="Sample invoice #" value={data.sample.invoiceNumber} onChange={setSampleField('invoiceNumber')} mono />
            <TextInput label="PO ref"            value={data.sample.poRef}        onChange={setSampleField('poRef')}        mono />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DateInput label="Issue date" value={data.sample.issueDate} onChange={setSampleField('issueDate')} />
            <DateInput label="Due date"   value={data.sample.dueDate}   onChange={setSampleField('dueDate')} />
          </div>
          <TextInput label="Sample client" value={data.sample.clientName} onChange={setSampleField('clientName')} />
          <TextareaInput label="Client address" value={data.sample.clientAddress} onChange={setSampleField('clientAddress')} rows={2} />
          <TextInput label="Client email" value={data.sample.clientEmail} onChange={setSampleField('clientEmail')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Sample items */}
        <ItemList items={data.sampleItems} setItems={setItems} />

        <div className="my-3.5 h-px bg-line" />

        {/* Watermark */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Watermark</span>
        <div className="space-y-2">
          <ToggleRow label="Watermark behind invoice" desc="Faint diagonal text (DRAFT, PAID, etc.)"
            checked={data.includeWatermark} onChange={setField('includeWatermark')} />
          {data.includeWatermark && (
            <TextInput label="Watermark text" value={data.watermarkText} onChange={setField('watermarkText')} placeholder="DRAFT" />
          )}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Payment + Footer */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-invoicing">Payment block &amp; footer</span>
        <div className="space-y-2">
          <ToggleRow label="Payment block" desc="Bank + account on the PDF"
            checked={data.includePaymentBlock} onChange={setField('includePaymentBlock')} />
          <ToggleRow label="Footer line"   desc="Branded footer on every page"
            checked={data.includeFooter} onChange={setField('includeFooter')} />
        </div>
        {data.includePaymentBlock && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Bank"          value={data.payment.bankName}    onChange={setPaymentField('bankName')} />
              <TextInput label="Account name"  value={data.payment.accountName} onChange={setPaymentField('accountName')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Account #"     value={data.payment.accountNumber} onChange={setPaymentField('accountNumber')} mono />
              <TextInput label="IFSC / SWIFT"  value={data.payment.ifsc}          onChange={setPaymentField('ifsc')}          mono />
            </div>
          </div>
        )}
        {data.includeFooter && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <TextInput label="Footer (left)"  value={data.footerLeft}  onChange={setField('footerLeft')} />
            <TextInput label="Footer (right)" value={data.footerRight} onChange={setField('footerRight')} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Big total summary card */}
        <div className="rounded-lg border border-invoicing/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-invoicing">Sample total</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {findLayout(data.layoutId).label} · {findAccentStyle(data.accentStyleId).label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(computeSampleTotals(data).grandTotal, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy === 'pdf' || busy === 'json'}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Sample PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleJson} disabled={busy === 'pdf' || busy === 'json'}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'json' ? '…' : (<>Download template JSON <ArrowRight size={10} /></>)}
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

function TemplateMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md" style={{ background: '#B46E05' }} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">Brigade Road, Bengaluru 560001</p>
            <p className="m-0 text-[9px] text-ink-500">billing@sonchoystudio.com</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[18px] font-bold tracking-[-0.01em]" style={{ color: '#B46E05' }}>INVOICE</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">SCY-26-27-0042</p>
            <p className="m-0 text-[9px] text-ink-500">Date: 23 May 2026</p>
            <p className="m-0 text-[9px] text-ink-500">Due: 22 Jun 2026</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em]" style={{ color: '#B46E05' }}>BILL TO</p>
          <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">Northwind Books Pvt Ltd</p>
          <p className="m-0 text-[9px] text-ink-700">marcus@northwindbooks.in</p>
        </div>

        <div className="mt-3 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[1fr_36px_60px_70px] gap-1 px-1.5 py-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-white" style={{ background: '#B46E05' }}>
            <span>DESCRIPTION</span>
            <span className="text-right">QTY</span>
            <span className="text-right">RATE</span>
            <span className="text-right">AMOUNT</span>
          </div>
          {[
            ['Brand identity sprint',          '1', '2,50,000', '2,95,000'],
            ['Website design & development',   '1', '4,80,000', '5,66,400'],
            ['Launch campaign creative',       '3', '65,000',   '2,30,100'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[1fr_36px_60px_70px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="truncate">{r[0]}</span>
              <span className="text-right">{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right font-bold">{r[3]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 ml-auto w-[60%] text-[9px]">
          <div className="flex items-center justify-between py-0.5 font-mono text-ink-700">
            <span>Subtotal</span>
            <span className="text-ink-950">9,30,000</span>
          </div>
          <div className="flex items-center justify-between py-0.5 font-mono text-ink-700">
            <span>Tax (18%)</span>
            <span className="text-ink-950">1,61,500</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t pt-1 font-mono" style={{ borderColor: '#B46E05' }}>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: '#B46E05' }}>Total</span>
            <span className="text-[12px] font-bold" style={{ color: '#B46E05' }}>INR 10,91,500</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ payment block, watermark, and footer in the full PDF</p>
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
            Style choices in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            reusable template out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Pick a layout, accent, font, table style, and date format. Live preview while you edit. Export a sample invoice PDF for the design review — and a JSON template you can re-import later.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-invoicing-bg text-invoicing">
                    <TemplateIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Template Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Classic · Helvetica
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Template',     'Sonchoy Studio · House style'],
                  ['Layout',       'Classic — brand left, invoice right'],
                  ['Font',         'Helvetica · clean sans'],
                  ['Accent',       'Top stripe · #B46E05'],
                  ['Table',        'Filled header rows'],
                  ['Date format',  '23 May 2026 (long)'],
                  ['Tax display',  'Per-line + summary'],
                  ['Watermark',    'Off'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-invoicing/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-invoicing">Sample total</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 10,91,500</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">SAMPLE.PDF</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Design-ready
                </span>
              </div>
              <TemplateMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Pick the bones',          'Layout (classic / modern / compact / bold), font, accent style (stripe / band / rule / none), and accent colour. Live preview updates with every change.'],
  ['02', 'Set the brand block',     'Business name, address, contact, tax ID. Pick the date format and tax-display rules. Add a watermark if the document is a draft.'],
  ['03', 'Export & re-use',         'Download a sample PDF rendered with your settings, plus a JSON template you can re-import into the other invoice generators (or share with your team).'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From brand kit{' '}
              <em className="font-serif font-normal italic text-crimson-300">to invoice template.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Every freelancer and small studio loses two hours redesigning the same invoice. This tool eliminates that — make the layout decisions once, export the template, and reuse it on every billing cycle without thinking about typography again.
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
  { title: '4 layout presets',         desc: 'Classic (brand left, invoice block right), Modern (big INVOICE title up top), Compact (tight header, more room for line items), Bold (coloured band header).' },
  { title: 'Accent styles + colour',   desc: 'Top stripe, header band, thin rule below the header, or no accent at all. Pick the colour from a swatch picker; black/white contrast auto-adjusts on the band variant.' },
  { title: 'Three table styles',        desc: 'Filled header rows (zebra-striped body), outlined (thin borders), or minimal lines (horizontal rules only). Same data, three very different vibes.' },
  { title: 'Five date formats',         desc: 'ISO (2026-05-23), long (23 May 2026), US (05/23/2026), EU (23/05/2026), or US short (May 23, 2026). The format you pick stamps onto every date on the invoice.' },
  { title: 'Watermark layer',           desc: 'Faint diagonal text behind the invoice (DRAFT, PAID, COPY, VOID). 6% opacity, accent-coloured, rotated -30°. Great for review drafts and archive copies.' },
  { title: 'Sample PDF + JSON template', desc: 'Sample PDF renders your settings against a real invoice (with sample line items). JSON template captures every setting in a re-importable file — share it with your team or load it into other generators.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for brand</Eyebrow>
          <SectionTitle>
            Every choice{' '}
            <em className="font-serif font-normal italic text-crimson-300">— locked in.</em>
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
  { q: 'How is this different from the regular Invoice Generator?',         a: 'The Invoice Generator produces one invoice. This Template Builder produces the visual rules every future invoice should follow — layout, accent, table style, date format. Use this once to lock in your house style; use the Invoice Generator (and friends) to actually bill clients with that style.' },
  { q: 'Can I import this JSON into the Invoice Generator?',                a: 'The JSON file captures every visual setting (layout, accent, font, table style, date format, watermark) plus the brand block (business name, address, tax ID) and the payment block. Other invoice generators on Sonchoy that accept template imports will read these fields directly; for ones that don\'t, the JSON is still a useful brand-style reference you can hand to your designer or developer.' },
  { q: 'What does the watermark do?',                                       a: 'It draws large faint diagonal text behind the invoice content — typically DRAFT, PAID, COPY, or VOID. At 6% opacity it doesn\'t obscure the numbers but makes the document\'s status unmistakable when printed or shared. Skip it on the final issued invoice; use it on every internal draft.' },
  { q: 'Which layout should I pick?',                                       a: 'Classic for traditional finance audiences — looks like every invoice they\'ve seen. Modern for design-forward businesses where you want the document itself to be on-brand. Compact when you have lots of line items and need vertical room. Bold when you want the colour to dominate (e.g. studios, agencies, anyone whose colour is part of recall).' },
  { q: 'Should I use a colour band or a thin rule?',                        a: 'Stripe is the safest choice — looks branded without dominating. Band is high-impact (great for design-forward brands) but eats vertical space. Rule is the most restrained — just a thin coloured line below the header, good for finance and B2B contexts. None is for when you want a completely typographic invoice with no decorative elements.' },
  { q: 'Output formats?',                                                    a: 'Sample PDF (rendered with all your chosen style settings against a real sample invoice — branded header, accent in place, table styled per your choice, date format applied, optional watermark, optional payment block, optional footer) and JSON template (re-importable record of every setting, including the brand block, payment block, footer text, and the watermark configuration).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">templates.</em>
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
  { name: 'Invoice Generator',         desc: 'Issue invoices using your new template.',                Icon: InvoiceIcon,    label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'Invoice Number Generator',  desc: 'Pair the template with a numbering scheme.',             Icon: HashIcon,       label: 'INVOICING', path: '/tools/invoice-number-generator' },
  { name: 'Tax Invoice Generator',     desc: 'GST/VAT-compliant invoice with your branded style.',     Icon: TaxInvoiceIcon, label: 'INVOICING', path: '/tools/tax-invoice-generator' },
  { name: 'Freelance Invoice',         desc: 'Hours/days/retainers — same template, mixed rates.',     Icon: InvoiceIcon,    label: 'INVOICING', path: '/tools/freelance-invoice-generator' },
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
              ? (<Link key={t.name} href={t.path} className={cls}>{inner}</Link>)
              : (<a key={t.name} href="#" className={cls}>{inner}</a>)
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function InvoiceTemplateBuilderTool() {
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
