'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  CompressIcon, MergeIcon, SplitIcon, ReorderIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  COMPRESSION_PRESETS, COLOR_MODES, PAGE_SIZES,
  findPreset, findColorMode, findPageSize,
  formatBytes, estimateOutputBytes, reportSavings,
} from '@/lib/compress-pdf/compute'
import { compressPdf, probePdf } from '@/lib/compress-pdf/compressPdf'

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
    <div role="dialog" aria-modal="true" aria-label="Compress Invoice PDFs"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['60–80%', 'Typical shrink'],
  ['4',      'Quality presets'],
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
            <span className="text-convert">PDF</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Compress Invoice PDFs</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            PDF · Compress
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Shrink the file{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              — keep it
            </em>
            <br />
            still{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              readable.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Compress invoices, statements, and reports to email-friendly sizes. Four quality presets, optional grayscale, normalise to A4 or US Letter. Typical 60–80% file-size reduction with no loss of readability for financial documents.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Live size estimate</span>
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
function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-line bg-paper px-3 py-2 transition-colors hover:border-line-strong">
      <div className="min-w-0 flex-1 pr-3">
        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">{label}</span>
        {desc && <span className="block truncate text-[11px] text-ink-500">{desc}</span>}
      </div>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer accent-convert" />
    </label>
  )
}

/* ---------- File picker ---------- */

function FileDrop({ file, onPick, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files || [])
    const first = dropped.find((f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf')
    if (first) onPick(first)
  }, [onPick])
  if (file) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2">
        <div className="min-w-0">
          <p className="m-0 truncate text-[12px] font-medium text-ink-950">{file.name}</p>
          <p className="m-0 font-mono text-[10px] text-ink-500">{formatBytes(file.size)}{file.pages ? `  ·  ${file.pages} pages` : ''}</p>
        </div>
        <button type="button" onClick={onClear} aria-label="Remove file"
          className="rounded-full border border-line bg-paper px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
          Change
        </button>
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
        accept="application/pdf,.pdf"
        onChange={(e) => {
          const first = e.target.files && e.target.files[0]
          if (first) onPick(first)
          e.target.value = ''
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Choose PDF"
      />
      <CompressIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Invoices, statements, reports — anything PDF</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  presetId: 'high',
  colorModeId: 'colour',
  pageSizeId: 'auto',
  includePageNumbers: false,
  baseName: '',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)        // { name, size, pages, width, height }
  const [fileObj, setFileObj] = useState(null)
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)    // { outputBytes, fileName }

  const handlePick = useCallback(async (raw) => {
    setFileObj(raw); setResult(null)
    setFile({ name: raw.name, size: raw.size, pages: null, width: 595, height: 842 })
    setData((s) => ({ ...s, baseName: raw.name.replace(/\.pdf$/i, '') }))
    setProgress({ stage: 'probing', pct: 4, message: `Reading ${raw.name}…` })
    try {
      const info = await probePdf(raw)
      setFile({ name: raw.name, size: raw.size, pages: info.pages, width: info.width, height: info.height })
      setProgress(null)
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: `Could not read PDF: ${err?.message || err}` })
    }
  }, [])
  const handleClear = () => { setFile(null); setFileObj(null); setProgress(null); setResult(null) }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => { setData({ ...INITIAL, baseName: file?.name?.replace(/\.pdf$/i, '') || '' }); setProgress(null); setResult(null) }

  const preset = findPreset(data.presetId)
  const isGrayscale = data.colorModeId === 'grayscale'

  const estimateBytes = useMemo(
    () => estimateOutputBytes(file?.pages || 0, file?.width, file?.height, preset, isGrayscale),
    [file, preset, isGrayscale]
  )
  const savings = useMemo(
    () => reportSavings(file?.size || 0, estimateBytes),
    [file, estimateBytes]
  )

  const handleCompress = async () => {
    if (!fileObj || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await compressPdf(fileObj, data, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const actualSavings = result?.outputBytes && file?.size
    ? reportSavings(file.size, result.outputBytes)
    : null

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <CompressIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Compress · {file?.pages || '—'} page{file?.pages === 1 ? '' : 's'} · {preset.label.split('·')[0].trim()}
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* Source */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Source PDF</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        <div className="my-3.5 h-px bg-line" />

        {/* Compression */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Compression</span>
        <SelectInput label="Preset" value={data.presetId} onChange={setField('presetId')}
          options={COMPRESSION_PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">{preset.desc}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SelectInput label="Colour" value={data.colorModeId} onChange={setField('colorModeId')}
            options={COLOR_MODES.map((c) => ({ value: c.id, label: c.label }))} />
          <SelectInput label="Page size" value={data.pageSizeId} onChange={setField('pageSizeId')}
            options={PAGE_SIZES.map((p) => ({ value: p.id, label: p.label }))} />
        </div>
        <div className="mt-2 space-y-2">
          <ToggleRow label="Page numbers" desc="Footer on every page after compression"
            checked={data.includePageNumbers} onChange={setField('includePageNumbers')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Naming */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">File name</span>
        <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono placeholder="invoice-may-2026" />
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
          Saves as <span className="text-ink-700">{(data.baseName || 'compressed').replace(/[^a-z0-9-]+/gi, '-')}__compressed.pdf</span>
        </p>

        <div className="my-3.5 h-px bg-line" />

        {/* Estimate */}
        {file && (
          <div className="mb-3 rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">Estimated savings</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Original</span>
              <span className="text-ink-950">{formatBytes(file.size)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">After compression (est.)</span>
              <span className="text-ink-950">{formatBytes(estimateBytes)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Savings (est.)</span>
              <span className={`font-mono text-[14px] font-bold ${savings.pct > 0 ? 'text-success' : 'text-warning'}`}>
                {savings.pct > 0 ? '▼ ' : (savings.pct < 0 ? '▲ ' : '')}{Math.abs(savings.pct)}%
              </span>
            </div>
            <p className="m-0 mt-1 font-mono text-[9.5px] text-ink-500">
              Estimate based on page size + preset. Actual size shown after compression.
            </p>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="mb-3 rounded-lg border border-line bg-canvas p-3">
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

        {/* Actual result */}
        {result && actualSavings && (
          <div className="mb-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · actual size</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-success">Real savings</span>
              <span className="font-mono text-[14px] font-bold text-success">
                {actualSavings.pct > 0 ? '▼ ' : (actualSavings.pct < 0 ? '▲ ' : '')}{Math.abs(actualSavings.pct)}%
              </span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {preset.label.split('·')[0].trim()}{isGrayscale ? ' · grayscale' : ''}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {file ? formatBytes(result?.outputBytes || estimateBytes) : '—'}
          </div>
        </div>

        <button type="button" onClick={handleCompress}
          disabled={busy || !fileObj}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Compressing…' : `Compress ${file?.pages ? `${file.pages} page${file.pages === 1 ? '' : 's'}` : 'PDF'}`}
          <ArrowRight size={14} />
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

function CompressMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">HDFC monthly statement</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">May 2026 · 14 pages</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Preset: High</p>
            <p className="m-0 mt-1 font-mono text-[9px] text-ink-500">Colour · auto size</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded border border-line bg-canvas p-2">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-convert">ORIGINAL</p>
            <p className="m-0 mt-1 text-[14px] font-bold text-ink-950">4.8 MB</p>
          </div>
          <div className="rounded border border-line bg-canvas p-2">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-convert">COMPRESSED</p>
            <p className="m-0 mt-1 text-[14px] font-bold text-ink-950">980 KB</p>
          </div>
          <div className="rounded bg-success p-2 text-white">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em]">SAVED</p>
            <p className="m-0 mt-1 text-[14px] font-bold">▼ 80%</p>
          </div>
        </div>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">SAMPLE OUTPUT FILES</p>
        <div className="mt-1 space-y-1 font-mono text-[9px]">
          <div className="flex items-center justify-between rounded border border-line bg-canvas px-2 py-1 text-ink-950">
            <span>hdfc-may-2026__compressed.pdf</span>
            <span className="text-success">980 KB</span>
          </div>
          <div className="flex items-center justify-between rounded border border-line bg-canvas px-2 py-1 text-ink-950">
            <span>invoice-INV-0247__compressed.pdf</span>
            <span className="text-success">180 KB</span>
          </div>
          <div className="flex items-center justify-between rounded border border-line bg-canvas px-2 py-1 text-ink-950">
            <span>q1-report__compressed.pdf</span>
            <span className="text-success">1.2 MB</span>
          </div>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">Result is image-rasterised but identical-looking. Perfect for email attachments and archive storage.</p>
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
            Big PDF in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            email-sized PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop a PDF, pick a preset, see a live size estimate. The High preset is the right default for most invoices and statements — readable on screen, ~60–80% smaller than the source.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <CompressIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Compress Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  High · colour
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'HDFC May 2026 · 14 pages'],
                  ['Original size',  '4.8 MB'],
                  ['Preset',         'High  ·  recommended'],
                  ['Colour',         'Full colour'],
                  ['Page size',      'Match source pages'],
                  ['Page numbers',   'Off'],
                  ['Output base',    'hdfc-may-2026'],
                  ['Estimated size', '~980 KB (▼ 80%)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">~980 KB</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT.PDF</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Email-ready
                </span>
              </div>
              <CompressMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the PDF',           'Drag an invoice, statement, or report into the picker. The tool reads its page count and dimensions in the browser — nothing uploads.'],
  ['02', 'Pick a preset',           'High is the right default for most financial PDFs. Drop to Extreme for email-size emergencies; bump to Medium / Low when print fidelity matters.'],
  ['03', 'Compress & download',     'One click rasterises each page at the chosen DPI + JPEG quality and re-emits a single compressed PDF. Real before/after size shown after save.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From bloated PDF{' '}
              <em className="font-serif font-normal italic text-crimson-300">to attachable file.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most "10 MB invoice attachment" emails fail because the underlying PDF was scanned at print DPI for screen viewing — wasting 80% of the bytes. This tool re-renders the pages at the right DPI for the use case, keeping the document readable while making the file dramatically smaller.
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
  { title: '4 compression presets',     desc: 'Extreme (smallest), High (recommended default), Medium (balanced), Low (near-source). Each preset sets a scale and JPEG quality calibrated for financial documents.' },
  { title: 'Grayscale toggle',           desc: 'Convert to grayscale before re-encoding for roughly an additional 30–45% file-size reduction. Invoices and statements rarely need colour — bank logos still read fine.' },
  { title: 'Page-size normalisation',    desc: 'Keep each page at its source size, or normalise everything to A4 or US Letter for consistent print-ready output. Useful when scanned pages came in at odd sizes.' },
  { title: 'Live size estimate',         desc: 'See the estimated output size + savings % as you change presets. Estimate updates instantly — no need to compress to find out it\'s too big.' },
  { title: 'Real before/after',           desc: 'After compression, the tool reports the actual output size and real savings %, calculated from the rendered PDF blob — not just the estimate.' },
  { title: '100% in browser',             desc: 'Files never upload. Compression runs entirely on your machine via the same PDF stack used by Merge / Split. Nothing hits a server, ever.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for attachments</Eyebrow>
          <SectionTitle>
            Smaller{' '}
            <em className="font-serif font-normal italic text-crimson-300">— still readable.</em>
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
  { q: 'Why do my invoice PDFs end up so large in the first place?',  a: 'Most invoice and statement PDFs are produced by scanning at 300 DPI (print resolution) or by enterprise accounting tools that embed full-colour PNGs of each page. That\'s overkill for on-screen reading and email — 100–150 DPI is plenty. This tool re-renders at the right DPI for the use case, which is where the 60–80% file-size savings come from.' },
  { q: 'Is the text still searchable after compression?',             a: 'No — same trade-off as the Merge and Split tools. The compressed PDF is a series of JPEG-encoded page images, so any text becomes part of the image. The visible content is identical, but Ctrl-F won\'t find words. For searchable compressed output, run OCR on the result, or use a desktop PDF tool that supports lossless compression of text-and-image PDFs.' },
  { q: 'Which preset should I pick?',                                 a: 'High is the recommended default — about 60–80% smaller than the source with no perceptible quality loss for invoices, statements, or text-heavy reports. Drop to Extreme for "must email this 12 MB file right now" emergencies. Bump to Medium or Low when print fidelity matters (e.g., the recipient is going to print and archive in physical files).' },
  { q: 'Does grayscale ruin the look of bank logos and brand colours?', a: 'It does remove colour, obviously, but for the vast majority of financial documents grayscale is fine: text reads identically, tables remain legible, and most logos still scan as monochrome marks. If colour is critical (e.g. a marketing PDF with brand identity), leave it on Full colour. If you\'re just archiving statements, grayscale typically buys an extra 30–45% shrink on top of the preset.' },
  { q: 'How accurate is the estimated output size?',                  a: 'Within ~20% for most invoices and statements. Documents with heavy graphics, embedded logos, or unusual page sizes can deviate further. The "actual size" panel that appears after compression shows the exact figure — refer to that for the real number, not the estimate.' },
  { q: 'Does my data leave the browser?',                              a: 'Never. The source file is read into memory, page-rasterised in a canvas element, re-encoded as JPEG, and assembled into a new PDF blob — all in your browser. The download is triggered locally via the browser\'s standard file-save mechanism. Nothing is uploaded to Sonchoy or any third party.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">PDF compression.</em>
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
  { name: 'Merge Financial PDFs',  desc: 'Combine many PDFs, then compress the packet.',         Icon: MergeIcon,    label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Split PDF Statements',  desc: 'Slice a long PDF before compressing each part.',        Icon: SplitIcon,    label: 'PDF', path: '/tools/split-pdf-statements' },
  { name: 'Reorder PDF Pages',     desc: 'Rearrange pages before sending.',                       Icon: ReorderIcon,  label: 'PDF' },
  { name: 'Bank Statement → Excel', desc: 'Extract transaction tables from the source.',           Icon: ExportIcon,   label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
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

export default function CompressInvoicePdfsTool() {
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
