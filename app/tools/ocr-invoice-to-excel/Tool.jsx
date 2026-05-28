'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  OcrIcon, InvoicePdfIcon, BankStatementIcon, ReceiptIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  LANGUAGES, findLanguage,
  detectInvoiceFields, fieldsConfidence,
  buildInvoiceWorkbook, downloadWorkbook,
  formatBytes,
} from '@/lib/ocr-invoice/compute'
/* Re-use the OCR engine from the OCR-receipt module. Tesseract.js is
   loaded dynamically the first time the user clicks "Extract", so this
   import doesn't bloat the page bundle. */
import { runOcr, fileToDataUrl, loadImageSize } from '@/lib/ocr-receipt/ocrEngine'

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
    <div role="dialog" aria-modal="true" aria-label="OCR Invoice to Excel"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['9',       'Language packs'],
  ['Header',  'Auto-extracted'],
  ['Local',   '100% in browser'],
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
          style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 60%)' }} />
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
            <span className="text-convert">Convert</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">OCR Invoice to Excel</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · OCR · Invoice
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Photo of an invoice{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              in,
            </em>
            <br />
            structured{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              .xlsx out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop a JPG / PNG of a printed invoice. Tesseract OCR runs in your browser, then a field detector pulls out invoice number, PO ref, dates, vendor, buyer, tax IDs, subtotal, tax, and total — all into a clean three-sheet .xlsx (Summary · Amounts · Raw text).
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Three-sheet workbook</span>
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
  'focus:border-convert/60 focus:ring-2 focus:ring-convert/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} ${mono ? 'font-mono' : ''}`} />
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

/* ---------- File picker ---------- */

function ImageDrop({ image, onPick, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files || [])
    const first = dropped.find((f) => f.type?.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(f.name))
    if (first) onPick(first)
  }, [onPick])
  if (image) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2">
          <div className="min-w-0">
            <p className="m-0 truncate text-[12px] font-medium text-ink-950">{image.name}</p>
            <p className="m-0 font-mono text-[10px] text-ink-500">
              {formatBytes(image.size)}{image.width ? ` · ${image.width}×${image.height} px` : ''}
            </p>
          </div>
          <button type="button" onClick={onClear} aria-label="Remove image"
            className="rounded-full border border-line bg-paper px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Change
          </button>
        </div>
        {image.dataUrl && (
          <div className="overflow-hidden rounded-md border border-line bg-paper">
            <img src={image.dataUrl} alt="Invoice preview"
              className="max-h-[280px] w-full object-contain"
              draggable={false} />
          </div>
        )}
      </div>
    )
  }
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${
        dragging ? 'border-convert bg-convert-bg' : 'border-line bg-canvas hover:border-line-strong'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/jpg"
        onChange={(e) => {
          const first = e.target.files && e.target.files[0]
          if (first) onPick(first)
          e.target.value = ''
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Choose invoice image"
      />
      <OcrIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop an invoice image or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Printed text · JPG / PNG · scan or phone photo</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  languageId: 'eng',
  baseName:   '',
}

function GeneratorPanel() {
  const [image, setImage] = useState(null)
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [ocr, setOcr] = useState(null)         // { text, confidence, words }
  const [result, setResult] = useState(null)   // { outputBytes, fileName, sheets }

  const handlePick = useCallback(async (raw) => {
    setOcr(null); setResult(null)
    setProgress({ stage: 'reading', pct: 12, message: `Reading ${raw.name}…` })
    setData((s) => ({ ...s, baseName: raw.name.replace(/\.[^.]+$/, '') }))
    setImage({ file: raw, name: raw.name, size: raw.size, dataUrl: '', width: null, height: null })
    try {
      const dataUrl = await fileToDataUrl(raw)
      const meta = await loadImageSize(dataUrl)
      setImage({ file: raw, name: raw.name, size: raw.size, dataUrl, width: meta.width, height: meta.height })
      setProgress(null)
    } catch {
      setImage(null)
      setProgress({ stage: 'error', pct: 0, message: 'Could not read image — try a JPG or PNG.' })
    }
  }, [])

  const handleClear = () => { setImage(null); setOcr(null); setResult(null); setProgress(null) }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => {
    setData({ ...INITIAL, baseName: image?.name?.replace(/\.[^.]+$/, '') || '' })
    setProgress(null); setResult(null); setOcr(null)
  }

  /* Field detection re-runs cheaply on the current OCR output any time the
     output changes. (Language change requires a re-OCR.) */
  const fields = useMemo(() => ocr ? detectInvoiceFields(ocr.text) : null, [ocr])
  const fieldConfidence = useMemo(() => fields ? fieldsConfidence(fields, ocr?.confidence) : 0, [fields, ocr])

  const language = findLanguage(data.languageId)

  const handleRun = async () => {
    if (!image?.file || busy) return
    setBusy(true); setOcr(null); setResult(null)
    setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await runOcr(image.file, { language: language.id }, (p) => setProgress(p))
      setOcr(r)
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const handleExport = () => {
    if (!fields || !ocr) return
    const wb = buildInvoiceWorkbook(fields, ocr.text, image?.name)
    const out = downloadWorkbook(wb, data.baseName || 'invoice')
    setResult({ outputBytes: out.blob.size, fileName: out.fileName, sheets: fields.candidateAmounts?.length ? 3 : 2 })
  }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <OcrIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              OCR · {ocr?.words ? `${ocr.words} words` : 'no run yet'} · {fields ? `${fieldConfidence}% conf.` : '—'}
            </span>
          </div>
          <button type="button" onClick={reset} disabled={!image}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700 disabled:opacity-50">
            Reset
          </button>
        </div>

        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Invoice image</span>
        <ImageDrop image={image} onPick={handlePick} onClear={handleClear} />

        {image && (
          <>
            <div className="my-3.5 h-px bg-line" />

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Recognition</span>
            <SelectInput label="Language" value={data.languageId} onChange={setField('languageId')}
              options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))} />
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              First run downloads the OCR engine (~3 MB) from a CDN; subsequent runs reuse the cached engine.
            </p>

            <div className="my-3.5 h-px bg-line" />

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Output</span>
            <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Saves as <span className="text-ink-700">{(data.baseName || 'invoice').replace(/[^a-z0-9-]+/gi, '-')}.xlsx</span>
            </p>

            <div className="my-3.5 h-px bg-line" />

            <button type="button" onClick={handleRun}
              disabled={busy}
              className="btn btn-primary btn-lg w-full disabled:cursor-wait disabled:opacity-70">
              {busy ? 'Reading the image…' : (ocr ? 'Re-run OCR' : 'Extract invoice fields')}
              <ArrowRight size={14} />
            </button>
          </>
        )}

        {/* Progress */}
        {progress && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em]">
              <span className={progress.stage === 'error' ? 'text-danger' : 'text-convert'}>{progress.stage}</span>
              <span className="text-ink-500">{Math.round(progress.pct)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
              <div className={`h-full transition-[width] ${progress.stage === 'error' ? 'bg-danger' : 'bg-convert'}`}
                style={{ width: `${Math.max(2, Math.min(100, progress.pct))}%` }} />
            </div>
            <p className="m-0 mt-1.5 truncate font-mono text-[10px] text-ink-700">{progress.message}</p>
          </div>
        )}

        {/* Detected fields */}
        {fields && (
          <>
            <div className="my-3.5 h-px bg-line" />
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Detected invoice fields</span>
            <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[10.5px]">
              {[
                ['Invoice #',     fields.invoiceNumber],
                ['PO #',          fields.poNumber],
                ['Issue date',    fields.issueDate],
                ['Due date',      fields.dueDate],
                ['Vendor',        fields.vendor],
                ['Buyer',         fields.buyer],
                ['Tax ID',        fields.taxId?.value ? `${fields.taxId.kind} ${fields.taxId.value}` : ''],
                ['Email',         fields.contact?.email],
                ['Phone',         fields.contact?.phone],
                ['Subtotal',      fields.subtotal ? `${fields.subtotal.currency} ${fields.subtotal.value.toLocaleString()}` : ''],
                ['Tax',           fields.tax      ? `${fields.tax.currency} ${fields.tax.value.toLocaleString()}` : ''],
                ['Total',         fields.total    ? `${fields.total.currency} ${fields.total.value.toLocaleString()}` : ''],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 border-b border-line/50 py-0.5 last:border-b-0">
                  <span className="text-ink-500">{k}</span>
                  <span className={`text-right ${v ? 'text-ink-950' : 'text-ink-500 italic'}`}>{v || 'not found'}</span>
                </div>
              ))}
            </div>
            {fields.candidateAmounts?.length > 0 && (
              <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
                + {fields.candidateAmounts.length} amount{fields.candidateAmounts.length === 1 ? '' : 's'} detected in total. All of them land on the &quot;Amounts&quot; sheet of the workbook.
              </p>
            )}

            <div className="my-3.5 h-px bg-line" />

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Raw OCR text</span>
            <pre className="m-0 max-h-[220px] overflow-auto rounded-lg border border-line bg-canvas p-3 font-mono text-[11.5px] leading-[1.5] text-ink-900 whitespace-pre-wrap">{ocr.text || '(no text recognised)'}</pre>
            {ocr?.confidence != null && (
              <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
                OCR confidence: <span className={ocr.confidence > 80 ? 'text-success' : ocr.confidence > 60 ? 'text-warning' : 'text-danger'}>{Math.round(ocr.confidence)}%</span>
                {' · '}field-fill confidence: <span className={fieldConfidence > 70 ? 'text-success' : fieldConfidence > 50 ? 'text-warning' : 'text-danger'}>{fieldConfidence}%</span>
              </p>
            )}

            <button type="button" onClick={handleExport}
              className="btn btn-primary btn-lg mt-4 w-full">
              Export 3-sheet .xlsx workbook
              <ArrowRight size={14} />
            </button>
          </>
        )}

        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · workbook saved</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Sheets</span>
              <span className="text-ink-950">{result.sheets}</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">100% local · nothing uploaded</span>
          <a href="https://go.sonchoy.com/pdfFiller" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-crimson-300 no-underline hover:text-crimson-400">
            Need batch? <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Preview ---------- */

function OutputMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">invoice-INV-2026-0042.xlsx</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">3 sheets · Summary · Amounts · Raw text</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">field-fill 82% · OCR 91%</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">SUMMARY SHEET</p>
        <div className="mt-1 space-y-0.5 font-mono text-[9.5px]">
          {[
            ['Invoice number', 'INV-2026-0042'],
            ['PO number',      'PO-NWB-019'],
            ['Issue date',     '23 May 2026'],
            ['Due date',       '06 Jun 2026'],
            ['Vendor',         'Sonchoy Studio Pvt Ltd'],
            ['Buyer',          'Northwind Books Pvt Ltd'],
            ['Tax ID',         'GST 29ABCDE1234F1Z5'],
            ['Email',          'billing@sonchoystudio.com'],
            ['Subtotal',       'INR 5,68,200'],
            ['Tax',            'INR 1,01,520'],
            ['Total',          'INR 6,69,720'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-line/50 py-0.5">
              <span className="text-ink-500">{k}</span>
              <span className="text-ink-950">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {['Summary', 'Amounts', 'Raw text'].map((s, i) => (
            <span key={s} className={`rounded border px-1.5 py-0.5 font-mono text-[8px] ${i === 0 ? 'border-convert bg-convert-bg text-convert' : 'border-line bg-paper text-ink-500'}`}>
              {s}
            </span>
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
            Invoice photo in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            three-sheet workbook out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Tesseract OCR runs locally, a field detector pulls out invoice number / PO / dates / vendor / buyer / tax IDs / subtotal / tax / total, and the result is a three-sheet .xlsx workbook (Summary, Amounts, Raw text) — ready for an accountant to review.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <OcrIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Invoice OCR Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  English · 91% OCR
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source',           'INV-2026-0042.jpg · 2480×3508 · 1.4 MB'],
                  ['Language',         'English'],
                  ['Invoice number',   'INV-2026-0042 (detected)'],
                  ['Issue date',       '23 May 2026 (detected)'],
                  ['Vendor',           'Sonchoy Studio Pvt Ltd'],
                  ['Total',            'INR 6,69,720'],
                  ['Tax ID',           'GST 29ABCDE1234F1Z5'],
                  ['Output base',      'invoice-INV-2026-0042'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">3-sheet .xlsx</span>
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <ExportIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT.XLSX</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Accountant-ready
                </span>
              </div>
              <OutputMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the invoice image', 'JPG / PNG of a printed invoice — phone photo or scan. The image stays on your machine.'],
  ['02', 'OCR + detect fields',     'Tesseract reads the text locally; a field detector pulls out invoice #, dates, vendor, buyer, tax IDs, subtotal / tax / total. Confidence shown for both passes.'],
  ['03', 'Export the workbook',     'One click writes a three-sheet .xlsx: Summary (header fields), Amounts (every detected currency value), Raw text (full OCR output, one line per row).'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From paper invoice{' '}
              <em className="font-serif font-normal italic text-crimson-300">to working workbook.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most vendor invoices arrive as PDFs you can copy text from — the standard Invoice PDF → Excel tool is the right fit. This tool is for the harder case: a scanned or photographed paper invoice with no text layer. OCR plus a field detector gets you 80% of the way; spot-check the remaining 20%.
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
  { title: 'In-browser OCR',             desc: 'Tesseract runs locally via WebAssembly. Your invoice image bytes never touch a server.' },
  { title: 'Invoice-aware field detector', desc: 'Regex passes for invoice number, PO ref, issue date, due date, vendor, buyer, GST / VAT / EIN / TIN / PAN tax IDs, contact info, subtotal, tax, and total.' },
  { title: 'Three-sheet workbook',        desc: 'Summary (header fields ready to import), Amounts (every detected currency value with position), Raw text (one row per OCR line for audit).' },
  { title: 'Number-typed cells',          desc: 'Subtotal, tax, and total land as real number cells in the Summary sheet, so SUM and AVG formulas just work.' },
  { title: 'Two confidence scores',        desc: 'OCR confidence (how confident Tesseract is about the recognition) and field-fill confidence (how many of the key invoice fields were populated).' },
  { title: '100% in browser',              desc: 'Image, OCR, field detection, and workbook assembly all run locally. Tesseract.js loads from a public CDN on first use; that\'s the only network step.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for AP teams</Eyebrow>
          <SectionTitle>
            Paper invoice{' '}
            <em className="font-serif font-normal italic text-crimson-300">— digital row.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-convert/20 bg-convert-bg text-convert">
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
  { q: 'How is this different from Invoice PDF → Excel?',                  a: 'Invoice PDF → Excel works on PDFs with a text layer (most digitally-created invoices). It\'s fast and accurate. This OCR tool works on images and scanned invoices that have no text layer — it has to read the pixels first. OCR is slower and less accurate than reading a text layer, so use the PDF tool whenever possible and only fall back to this one for true paper invoices.' },
  { q: 'How accurate is the field detection?',                              a: 'On clean printed invoices, 80–90% of key fields land correctly on first pass. Invoice number, issue date, vendor, total are usually right. Buyer, tax IDs, and PO refs depend heavily on the invoice layout; some templates put them in places the regex passes don\'t look. Always review the Summary sheet before importing into accounting.' },
  { q: 'What invoice layouts work best?',                                  a: 'Clean printed invoices with labelled fields ("Invoice #:", "Date:", "Total:") work very well. Highly stylised "designy" invoices with non-standard labels score lower. Scanned faxed invoices score lower still. Phone-photo invoices under good lighting are fine; tilted, blurry, or shadow-heavy phones photos significantly hurt OCR accuracy.' },
  { q: 'Are subtotal / tax / total real number cells in the output?',       a: 'Yes — the Summary sheet stores them as number-typed cells so SUM and AVG formulas work. The currency is captured in the adjacent cell as text. If the detector got confused (e.g., picked up a line-item total instead of the grand total), the cell will be wrong but still typed correctly.' },
  { q: 'What does the Amounts sheet contain?',                              a: 'Every currency-prefixed value the OCR detected, with its source position in the raw text. Useful for cross-checking: if the Summary sheet shows the wrong total, look at the Amounts sheet to find the correct one and copy it over.' },
  { q: 'Does my data leave the browser?',                                  a: 'Tesseract.js runs entirely in your browser via WebAssembly. The OCR engine itself is loaded from a public CDN (jsDelivr) on first use — that\'s a one-time engine download, not an image upload. Your invoice image, the recognition pass, the field detection, and the output workbook all stay on your machine.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">invoice OCR.</em>
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
  { name: 'OCR Receipt to Text',     desc: 'Same OCR engine, receipt-focused output.',           Icon: OcrIcon,            label: 'CONVERT', path: '/tools/ocr-receipt-to-text' },
  { name: 'Invoice PDF → Excel',     desc: 'For PDFs with a text layer (most digital invoices).', Icon: InvoicePdfIcon,    label: 'CONVERT', path: '/tools/invoice-pdf-to-excel' },
  { name: 'Bank Statement → Excel',  desc: 'Reconciled transaction tables from statements.',     Icon: BankStatementIcon, label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
  { name: 'Receipt Image to PDF',    desc: 'Pack many invoice photos into one archive PDF.',     Icon: ReceiptIcon,        label: 'CONVERT', path: '/tools/receipt-image-to-pdf' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-convert">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-convert-bg text-convert">
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

export default function OcrInvoiceToExcelTool() {
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
