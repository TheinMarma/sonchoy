'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  OcrIcon, ReceiptIcon, ScanIcon, InvoicePdfIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  LANGUAGES, OUTPUT_FORMATS, POST_PROCESSING,
  findLanguage, findOutputFormat, findPostProcess,
  detectReceiptFields, postProcessText, serialiseOutput,
  formatBytes,
} from '@/lib/ocr-receipt/compute'
import { runOcr, fileToDataUrl, loadImageSize, downloadText } from '@/lib/ocr-receipt/ocrEngine'

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
    <div role="dialog" aria-modal="true" aria-label="OCR Receipt to Text"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['9',      'Language packs'],
  ['Auto',   'Fields detected'],
  ['Local',  '100% in browser'],
  ['Free',   'Always · no signup'],
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
            <span className="text-ink-950">OCR Receipt to Text</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · Image to text (OCR)
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Receipt photo in,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              searchable
            </em>
            <br />
            text{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop in a JPG / PNG of a printed receipt and the tool runs Tesseract OCR locally in your browser. Get clean plain text, Markdown, or structured JSON with auto-detected vendor, dates, amounts, tax lines, and card-ending fields.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Auto-detected fields</span>
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
            <img src={image.dataUrl} alt="Receipt preview"
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
        aria-label="Choose receipt image"
      />
      <OcrIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a receipt image or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Printed text · JPG / PNG · phone photos work</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  languageId:     'eng',
  outputFormatId: 'txt',
  postProcessId:  'receipt',
  baseName:       '',
}

function GeneratorPanel() {
  const [image, setImage] = useState(null)    // { file, name, size, dataUrl, width, height }
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)  // { text, confidence, words, fields }

  const handlePick = useCallback(async (raw) => {
    setResult(null); setProgress({ stage: 'reading', pct: 12, message: `Reading ${raw.name}…` })
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

  const handleClear = () => { setImage(null); setResult(null); setProgress(null) }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => {
    setData({ ...INITIAL, baseName: image?.name?.replace(/\.[^.]+$/, '') || '' })
    setProgress(null); setResult(null)
  }

  /* Re-derive post-processed text + detected fields whenever the OCR
     output OR the post-process / language settings change. Cheap pure
     transforms — no need to re-run OCR. */
  const processed = useMemo(() => {
    if (!result) return null
    const tidy = postProcessText(result.text, data.postProcessId)
    const fields = detectReceiptFields(tidy)
    return { text: tidy, fields }
  }, [result, data.postProcessId])

  const language = findLanguage(data.languageId)
  const outputFormat = findOutputFormat(data.outputFormatId)
  const postProcess = findPostProcess(data.postProcessId)

  const handleRun = async () => {
    if (!image?.file || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await runOcr(image.file, { language: language.id }, (p) => setProgress(p))
      setResult(r)
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = () => {
    if (!processed) return
    const payload = serialiseOutput(processed.text, processed.fields, outputFormat.id)
    const fileName = `${(data.baseName || 'receipt').replace(/[^a-z0-9-]+/gi, '-')}.${outputFormat.ext}`
    downloadText(payload, fileName, outputFormat.mime)
  }
  const handleCopy = async () => {
    if (!processed) return
    try { await navigator.clipboard.writeText(processed.text) } catch { /* noop */ }
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
              OCR · {result?.words ? `${result.words} words` : 'no run yet'} · {language.label.split(' + ')[0]}
            </span>
          </div>
          <button type="button" onClick={reset} disabled={!image}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700 disabled:opacity-50">
            Reset
          </button>
        </div>

        {/* Source */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Receipt image</span>
        <ImageDrop image={image} onPick={handlePick} onClear={handleClear} />

        {image && (
          <>
            <div className="my-3.5 h-px bg-line" />

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Recognition</span>
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Language" value={data.languageId} onChange={setField('languageId')}
                options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))} />
              <SelectInput label="Post-processing" value={data.postProcessId} onChange={setField('postProcessId')}
                options={POST_PROCESSING.map((p) => ({ value: p.id, label: p.label }))} />
            </div>
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              First run downloads the OCR engine (~3 MB) from a CDN; subsequent runs reuse the cached engine.
            </p>

            <div className="my-3.5 h-px bg-line" />

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Output</span>
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <SelectInput label="Format" value={data.outputFormatId} onChange={setField('outputFormatId')}
                options={OUTPUT_FORMATS.map((o) => ({ value: o.id, label: o.label }))} />
              <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
            </div>
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Saves as <span className="text-ink-700">{(data.baseName || 'receipt').replace(/[^a-z0-9-]+/gi, '-')}.{outputFormat.ext}</span>
            </p>

            <div className="my-3.5 h-px bg-line" />

            <button type="button" onClick={handleRun}
              disabled={busy}
              className="btn btn-primary btn-lg w-full disabled:cursor-wait disabled:opacity-70">
              {busy ? 'Reading the image…' : (result ? 'Re-run OCR' : 'Extract text from receipt')}
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

        {/* Result — extracted text + detected fields */}
        {processed && (
          <>
            <div className="my-3.5 h-px bg-line" />
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Extracted text</span>
            <pre className="m-0 max-h-[260px] overflow-auto rounded-lg border border-line bg-canvas p-3 font-mono text-[11.5px] leading-[1.5] text-ink-900 whitespace-pre-wrap">{processed.text || '(no text recognised)'}</pre>
            {result?.confidence != null && (
              <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
                Confidence: <span className={result.confidence > 80 ? 'text-success' : result.confidence > 60 ? 'text-warning' : 'text-danger'}>{Math.round(result.confidence)}%</span>
                {' · '}
                {result.words} word{result.words === 1 ? '' : 's'}
              </p>
            )}

            {/* Detected fields */}
            {(processed.fields.vendor || processed.fields.totals.length || processed.fields.dates.length) && (
              <>
                <span className="mt-3 mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Detected fields</span>
                <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[10.5px]">
                  {processed.fields.vendor && (
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-ink-500">Vendor</span>
                      <span className="text-ink-950">{processed.fields.vendor}</span>
                    </div>
                  )}
                  {processed.fields.dates.length > 0 && (
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <span className="text-ink-500">Date{processed.fields.dates.length === 1 ? '' : 's'}</span>
                      <span className="text-right text-ink-950">{processed.fields.dates.slice(0, 3).join(' · ')}</span>
                    </div>
                  )}
                  {processed.fields.totals.length > 0 && (
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <span className="text-ink-500">Amount{processed.fields.totals.length === 1 ? '' : 's'}</span>
                      <span className="text-right text-ink-950">
                        {processed.fields.totals.slice(0, 4).map((t) => t.raw).join(' · ')}
                      </span>
                    </div>
                  )}
                  {processed.fields.taxLines.length > 0 && (
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <span className="text-ink-500">Tax line</span>
                      <span className="text-right text-ink-950 truncate max-w-[60%]">{processed.fields.taxLines[0]}</span>
                    </div>
                  )}
                  {processed.fields.paymentLast4 && (
                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">Card ending</span>
                      <span className="text-ink-950">···· {processed.fields.paymentLast4}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={handleCopy}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950">
                Copy text
              </button>
              <button type="button" onClick={handleDownload}
                className="btn btn-primary inline-flex h-9 items-center justify-center gap-1.5 rounded-md font-mono text-[10px] uppercase tracking-[0.1em]">
                Download .{outputFormat.ext}
                <ArrowRight size={11} />
              </button>
            </div>
          </>
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
            <p className="m-0 text-[14px] font-bold text-ink-950">receipt-2026-05-23.txt</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">142 words · 92% confidence · 6 detected fields</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">eng · receipt mode</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">EXTRACTED TEXT</p>
        <pre className="m-0 mt-1 rounded border border-line bg-canvas p-2 font-mono text-[8.5px] leading-[1.5] text-ink-900 whitespace-pre-wrap">{`BOMBAY CANTEEN
Kamala Mills, Mumbai 400013
GSTIN 27ABCDE1234F1Z9

Bill no: BC-09812
Date: 05-May-2026  Table 14

Tasting menu          1   4,200.00
Wine pairing          2     980.00
Sparkling water       1     250.00
Service charge       --     680.00

Subtotal                  6,110.00
CGST 9%                     549.90
SGST 9%                     549.90
TOTAL                     7,209.80

Card ending 4421
Paid · 05-May-2026 21:14
`}</pre>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">DETECTED FIELDS</p>
        <div className="mt-1 space-y-0.5 font-mono text-[9px]">
          <div className="flex justify-between"><span className="text-ink-500">Vendor</span><span className="text-ink-950">BOMBAY CANTEEN</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Date</span><span className="text-ink-950">05-May-2026</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Total</span><span className="text-ink-950">INR 7,209.80</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Tax</span><span className="text-ink-950">CGST 9% · SGST 9%</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Card</span><span className="text-ink-950">···· 4421</span></div>
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
            Receipt photo in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            searchable text out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Tesseract OCR runs locally in your browser, returns the recognised text, and the tool auto-detects the receipt fields most expense systems care about — vendor, date, amounts, tax, card ending. Export as plain text, Markdown, or structured JSON.
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OCR Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  English · receipt mode
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source',           'IMG_2031.jpg · 3024×4032 px · 1.8 MB'],
                  ['Language',         'English'],
                  ['Post-processing',  'Receipt mode (tidy + group breaks)'],
                  ['Output format',    'Plain text (.txt)'],
                  ['Confidence',       '92% · 142 words'],
                  ['Detected vendor',  'BOMBAY CANTEEN'],
                  ['Detected total',   'INR 7,209.80'],
                  ['File-name base',   'receipt-2026-05-23'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">142 words · 5 fields</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT.TXT</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Searchable
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
  ['01', 'Drop the receipt',        'Drag a JPG / PNG of a printed receipt — phone photo, scan, screenshot — into the picker. The image stays on your machine.'],
  ['02', 'Pick language + extract',  'Choose the language (English by default, English + a second language available for multilingual receipts), and tap "Extract". Tesseract OCR runs locally with a progress bar.'],
  ['03', 'Copy or download',         'The extracted text appears immediately, with auto-detected vendor, date, amounts, and card-ending fields shown alongside. Copy to clipboard or download as .txt / .md / .json.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From image bytes{' '}
              <em className="font-serif font-normal italic text-crimson-300">to readable text.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most "OCR" tools want a signup. This one runs the open-source Tesseract recognition engine entirely in your browser via WebAssembly. The image, the recognition, and the output text all stay on your machine — useful for receipts that you don&rsquo;t want sitting in a third party&rsquo;s logs.
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
  { title: 'In-browser Tesseract OCR',  desc: 'Open-source Tesseract recognition engine runs entirely client-side via WebAssembly. The image bytes never touch a server.' },
  { title: '9 language packs',          desc: 'English by default, plus French / German / Spanish / Italian / Hindi / Portuguese / Japanese / Simplified Chinese paired with English for multilingual receipts.' },
  { title: 'Auto-detected fields',       desc: 'Quick-and-pragmatic regex passes surface vendor (first non-numeric line), dates, currency amounts, tax lines, and card-ending digits.' },
  { title: 'Receipt-aware tidying',     desc: 'Default post-processing collapses Tesseract\'s noisy whitespace runs and groups blank-line breaks so the output reads like the source receipt did.' },
  { title: 'Three output formats',       desc: 'Plain text (.txt) for copy-paste, Markdown (.md) for readable archives with structured field summaries, or JSON (.json) for machine consumption.' },
  { title: 'Confidence score',           desc: 'Tesseract returns a 0–100 confidence per recognition. Green above 80, amber above 60, red below — at a glance, you know whether the OCR is trustworthy.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for receipts</Eyebrow>
          <SectionTitle>
            Read the receipt{' '}
            <em className="font-serif font-normal italic text-crimson-300">— properly.</em>
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
  { q: 'Why is the first run slow?',                                       a: 'The first "Extract" downloads the Tesseract OCR engine (~3 MB of WebAssembly) and the language data (~5 MB for English; multilingual packs are larger) from a public CDN. After that, the engine is cached in the browser and subsequent runs are fast (typically 2–6 seconds per receipt depending on image size).' },
  { q: 'How accurate is the recognition?',                                  a: 'For clean, well-lit, printed receipts: typically 85–95% confidence. Phone-camera receipts under good lighting do well. Crumpled receipts, faded thermal paper (the kind that turns black after a few days), or hand-written notes drop substantially — Tesseract is not great at handwriting. The confidence score on the output indicates how much to trust the result.' },
  { q: 'Does it handle handwritten receipts?',                              a: 'Poorly. Tesseract is trained on printed text; handwriting recognition is a separate harder problem that needs different models (Google Cloud Vision, Microsoft Read API, AWS Textract). For handwritten receipts, the pdfFiller premium tier uses cloud-grade OCR with much better handwriting support.' },
  { q: 'Which language pack should I pick?',                                a: 'English is the right default for most receipts globally (Anglo brands, English on numerical bits). Switch to "English + <language>" when the receipt has substantial non-English text — French for Paris cafe receipts, German for Berlin restaurant receipts, Hindi for some Indian small-shop receipts. Multilingual packs are bigger and slower on first load.' },
  { q: 'Are the detected fields always correct?',                          a: 'No — they\'re quick-and-pragmatic regex passes, not a fine-tuned receipt parser. Treat them as suggestions to pre-fill an expense report row, not as the authoritative answer. Always glance at the full extracted text before using the detected vendor / total / date.' },
  { q: 'Does my data leave the browser?',                                  a: 'Tesseract.js runs entirely in your browser via WebAssembly. The OCR engine itself is loaded from a public CDN (jsDelivr) on first use — that\'s a one-time engine download, not an image upload. Your receipt image bytes, the recognition pass, the detected fields, and the output text all stay on your machine.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">receipt OCR.</em>
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
  { name: 'Receipt Image to PDF',     desc: 'Pack many receipts into a single archive PDF.',         Icon: ReceiptIcon,    label: 'CONVERT', path: '/tools/receipt-image-to-pdf' },
  { name: 'JPG Receipt to PDF',       desc: 'Single receipt → expense-ready PDF.',                    Icon: ReceiptIcon,    label: 'CONVERT', path: '/tools/jpg-receipt-to-pdf' },
  { name: 'Scan to PDF',              desc: 'Camera-capture multi-page documents.',                   Icon: ScanIcon,       label: 'CONVERT', path: '/tools/scan-to-pdf' },
  { name: 'Expense Report Generator', desc: 'Build a structured expense claim from your receipts.',    Icon: InvoicePdfIcon, label: 'DOCUMENTS', path: '/tools/expense-report-generator' },
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

export default function OcrReceiptToTextTool() {
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
