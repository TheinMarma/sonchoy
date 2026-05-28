'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  WatermarkIcon, MergeIcon, SplitIcon, CompressIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  WATERMARK_PRESETS, POSITIONS, QUALITY_PRESETS, FONTS, PAGE_SELECTIONS,
  findPreset, findPosition, findQuality, findPageSelection,
  hexToRgb, parseRanges, resolveWatermarkedPages, formatBytes,
} from '@/lib/watermark-pdf/compute'
import { applyWatermark, probePdf, fileToDataUrl } from '@/lib/watermark-pdf/watermarkPdf'

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
    <div role="dialog" aria-modal="true" aria-label="Add Watermark to Invoice"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[680px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['7',     'Watermark presets'],
  ['Text',  'or logo image'],
  ['Local', '100% in browser'],
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
            <span className="text-ink-950">Add Watermark to Invoice</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            PDF · Stamp
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            DRAFT, PAID,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              or your logo —
            </em>
            <br />
            on every{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              page.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Stamp invoices, statements, and reports with a watermark in one click. Text presets (DRAFT, PAID, COPY, VOID, CONFIDENTIAL, SAMPLE) or upload your own logo. Pick the position, opacity, colour, and which pages — output downloads as a new PDF.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> 8 position presets</span>
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
function NumberInput({ label, value, onChange, suffix, min, max, step = '1', className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input type="number" inputMode="decimal" step={step}
          min={min} max={max}
          value={value ?? 0}
          onChange={(e) => {
            const v = e.target.value
            if (v === '') return onChange(0)
            const n = Number(v) || 0
            onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n)))
          }}
          className={`${inputClass} text-right font-mono ${suffix ? 'pr-12' : ''}`} />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-500">{suffix}</span>
        )}
      </div>
    </div>
  )
}
function TextareaInput({ label, value, onChange, placeholder, rows = 3, mono = true, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} min-h-[80px] resize-y leading-[1.45] ${mono ? 'font-mono text-[11.5px]' : ''}`} />
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
      <WatermarkIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Any PDF · watermark stamps on every page (or selected pages)</p>
    </div>
  )
}

/* ---------- Logo picker ---------- */

function LogoPicker({ dataUrl, onPick, onClear }) {
  const inputRef = useRef(null)
  if (dataUrl) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <img src={dataUrl} alt="Logo preview" className="h-10 w-10 shrink-0 rounded-sm border border-line bg-paper object-contain p-0.5" />
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">Logo loaded</span>
        </div>
        <button type="button" onClick={onClear}
          className="rounded-full border border-line bg-paper px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
          Change
        </button>
      </div>
    )
  }
  return (
    <div className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-canvas px-4 py-5 transition-colors hover:border-line-strong">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={async (e) => {
          const first = e.target.files && e.target.files[0]
          if (first) {
            const url = await fileToDataUrl(first)
            onPick(url)
          }
          e.target.value = ''
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Choose logo"
      />
      <p className="m-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">Drop a PNG or JPG logo</p>
      <p className="m-0 text-[10px] text-ink-500">Transparent PNG works best for overlays</p>
    </div>
  )
}

/* ---------- Live preview ---------- */

function WatermarkPreview({ options, position }) {
  const [r, g, b] = hexToRgb(options.color)
  const colorRgba = `rgba(${r}, ${g}, ${b}, ${Math.max(0.02, Math.min(1, options.opacity))})`
  const text = String(options.text || 'WATERMARK').toUpperCase()
  const fontStack = options.fontId === 'times' ? 'Georgia, serif'
    : options.fontId === 'courier' ? '"JetBrains Mono", monospace'
    : 'system-ui, sans-serif'

  const stampStyle = (() => {
    const base = { position: 'absolute', color: colorRgba, fontFamily: fontStack, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none' }
    const fontSize = Math.max(8, options.size * 0.4)
    const pad = 14
    switch (position.id) {
      case 'top_right':    return { ...base, top: pad, right: pad, fontSize, textAlign: 'right' }
      case 'top_left':     return { ...base, top: pad, left: pad, fontSize }
      case 'bottom_right': return { ...base, bottom: pad, right: pad, fontSize, textAlign: 'right' }
      case 'bottom_left':  return { ...base, bottom: pad, left: pad, fontSize }
      case 'header':       return { ...base, top: pad, left: '50%', transform: 'translateX(-50%)', fontSize }
      case 'footer':       return { ...base, bottom: pad, left: '50%', transform: 'translateX(-50%)', fontSize }
      case 'tile':
      case 'center':
      default:             return {
        ...base,
        top: '50%', left: '50%',
        transform: `translate(-50%, -50%) rotate(${options.angle}deg)`,
        fontSize: fontSize * 1.4,
      }
    }
  })()

  return (
    <div className="relative aspect-[1/1.414] overflow-hidden rounded-md border border-line bg-paper">
      {/* Fake invoice content */}
      <div className="absolute inset-0 p-4 text-[8px] text-ink-500">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[10px] font-bold text-ink-950">Your Business Pvt Ltd</p>
            <p className="m-0">123 Some Street, City</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[10px] font-bold text-ink-950">INVOICE</p>
            <p className="m-0">INV-2026-0042</p>
          </div>
        </div>
        <div className="my-3 h-px bg-line" />
        <p className="m-0 font-bold text-[7px] uppercase tracking-[0.1em] text-ink-500">BILL TO</p>
        <p className="m-0 mt-1 text-[9px] font-bold text-ink-950">Client Name Pvt Ltd</p>
        <div className="mt-3 space-y-1">
          {[
            ['Service A',      'INR 1,20,000'],
            ['Service B',      'INR 80,000'],
            ['Tax (18%)',      'INR 36,000'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-line/50 pb-0.5">
              <span>{k}</span>
              <span className="text-ink-900">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded bg-canvas px-2 py-1">
          <span className="font-bold text-[7px] uppercase">TOTAL</span>
          <span className="font-bold text-[9px] text-ink-950">INR 2,36,000</span>
        </div>
      </div>

      {/* Watermark layer */}
      {options.mode === 'image' && options.imageDataUrl ? (
        <img
          src={options.imageDataUrl}
          alt="Logo watermark preview"
          style={{
            position: 'absolute',
            ...(position.id === 'center' || position.id === 'tile'
              ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
              : position.id === 'top_right'    ? { top: 12, right: 12 }
              : position.id === 'top_left'     ? { top: 12, left: 12 }
              : position.id === 'bottom_right' ? { bottom: 12, right: 12 }
              : position.id === 'bottom_left'  ? { bottom: 12, left: 12 }
              : position.id === 'header'       ? { top: 12, left: '50%', transform: 'translateX(-50%)' }
              : position.id === 'footer'       ? { bottom: 12, left: '50%', transform: 'translateX(-50%)' }
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            ),
            width: `${(options.imageWidthPct || 0.4) * 100}%`,
            opacity: options.opacity,
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div style={stampStyle}>{text}</div>
      )}
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  mode: 'text',                  // 'text' | 'image'
  presetId: 'draft',
  text: 'DRAFT',
  fontId: 'helvetica',
  color: '#B46E05',
  opacity: 0.1,
  angle: -30,
  size: 110,

  imageDataUrl: '',
  imageWidthPct: 0.4,

  positionId: 'center',
  qualityId: 'medium',

  pageSelectionId: 'all',
  pageRangesText: '',
  baseName: '',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)
  const [fileObj, setFileObj] = useState(null)
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  const handlePick = useCallback(async (raw) => {
    setFileObj(raw); setResult(null)
    setFile({ name: raw.name, size: raw.size, pages: null })
    setData((s) => ({ ...s, baseName: raw.name.replace(/\.pdf$/i, '') }))
    setProgress({ stage: 'probing', pct: 4, message: `Reading ${raw.name}…` })
    try {
      const info = await probePdf(raw)
      setFile({ name: raw.name, size: raw.size, pages: info.pages })
      setProgress(null)
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: `Could not read PDF: ${err?.message || err}` })
    }
  }, [])
  const handleClear = () => { setFile(null); setFileObj(null); setProgress(null); setResult(null) }

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))

  const handlePresetChange = (id) => {
    const preset = findPreset(id)
    setData((s) => ({
      ...s,
      presetId: id,
      ...(id !== 'custom' && {
        text: preset.text,
        color: preset.color,
        opacity: preset.opacity,
        angle: preset.angle,
        size: preset.size,
      }),
    }))
  }
  const handleLogoPick = (dataUrl) => setData((s) => ({ ...s, imageDataUrl: dataUrl, mode: 'image' }))
  const handleLogoClear = () => setData((s) => ({ ...s, imageDataUrl: '' }))

  const reset = () => {
    setData({ ...INITIAL, baseName: file?.name?.replace(/\.pdf$/i, '') || '' })
    setProgress(null); setResult(null)
  }

  const position = findPosition(data.positionId)
  const pageSel  = findPageSelection(data.pageSelectionId)
  const quality  = findQuality(data.qualityId)

  const targeted = useMemo(() => {
    if (!file?.pages) return { pages: new Set(), errors: [] }
    return resolveWatermarkedPages(data, file.pages)
  }, [data, file])

  const handleApply = async () => {
    if (!fileObj || busy) return
    if (data.mode === 'text' && !data.text.trim()) return
    if (data.mode === 'image' && !data.imageDataUrl) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await applyWatermark(fileObj, data, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  // Validation messages for the custom page-range box
  const customRangeErrors = useMemo(() => {
    if (data.pageSelectionId !== 'custom' || !file?.pages) return []
    return parseRanges(data.pageRangesText, file.pages).errors
  }, [data.pageSelectionId, data.pageRangesText, file])

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <WatermarkIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Watermark · {file?.pages || '—'} pages · {targeted.pages.size || '—'} stamped
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* Live preview */}
        <div className="mb-4">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">Preview</p>
          <WatermarkPreview options={data} position={position} />
        </div>

        {/* Source PDF */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Source PDF</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        <div className="my-3.5 h-px bg-line" />

        {/* Mode tabs */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Watermark type</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'text',  label: 'Text watermark' },
            { id: 'image', label: 'Logo / image' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setField('mode')(m.id)}
              className={`rounded-md border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                data.mode === m.id
                  ? 'border-convert bg-convert-bg text-convert'
                  : 'border-line bg-paper text-ink-700 hover:border-line-strong'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Text mode controls */}
        {data.mode === 'text' && (
          <>
            <div className="mt-3 space-y-2">
              <SelectInput label="Preset" value={data.presetId} onChange={handlePresetChange}
                options={WATERMARK_PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
              <TextInput label="Watermark text" value={data.text} onChange={setField('text')} placeholder="DRAFT" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <SelectInput label="Font" value={data.fontId} onChange={setField('fontId')}
                options={FONTS.map((f) => ({ value: f.id, label: f.label }))} />
              <ColorInput label="Colour" value={data.color} onChange={setField('color')} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <NumberInput label="Opacity" value={data.opacity} onChange={setField('opacity')} step="0.01" min={0.02} max={1} suffix="0–1" />
              <NumberInput label="Angle"   value={data.angle}   onChange={setField('angle')}   step="1"    min={-90} max={90} suffix="deg" />
              <NumberInput label="Size"    value={data.size}    onChange={setField('size')}    step="2"    min={8}   max={300} suffix="pt" />
            </div>
          </>
        )}

        {/* Image mode controls */}
        {data.mode === 'image' && (
          <>
            <div className="mt-3">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">Logo / image</span>
              <LogoPicker dataUrl={data.imageDataUrl} onPick={handleLogoPick} onClear={handleLogoClear} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberInput label="Width" value={data.imageWidthPct} onChange={setField('imageWidthPct')} step="0.05" min={0.05} max={1} suffix="× page" />
              <NumberInput label="Opacity" value={data.opacity} onChange={setField('opacity')} step="0.01" min={0.02} max={1} suffix="0–1" />
            </div>
          </>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Placement */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Placement</span>
        <SelectInput label="Position" value={data.positionId} onChange={setField('positionId')}
          options={POSITIONS.map((p) => ({ value: p.id, label: p.label }))} />

        <div className="my-3.5 h-px bg-line" />

        {/* Page selection */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Pages to watermark</span>
        <SelectInput label="Selection" value={data.pageSelectionId} onChange={setField('pageSelectionId')}
          options={PAGE_SELECTIONS.map((p) => ({ value: p.id, label: p.label }))} />
        {data.pageSelectionId === 'custom' && (
          <div className="mt-2">
            <TextareaInput
              label="Page ranges"
              value={data.pageRangesText}
              onChange={setField('pageRangesText')}
              placeholder="1-3, 5, 9-end"
              rows={3}
            />
            {customRangeErrors.length > 0 && (
              <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[10.5px] text-warning">
                ⚠ {customRangeErrors[0]}
              </div>
            )}
          </div>
        )}
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
          {targeted.pages.size > 0
            ? `Will stamp ${targeted.pages.size} of ${file?.pages || '—'} pages.`
            : 'No pages selected for watermarking.'}
        </p>

        <div className="my-3.5 h-px bg-line" />

        {/* Quality + naming */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Render &amp; naming</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Quality" value={data.qualityId} onChange={setField('qualityId')}
            options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
          <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
        </div>
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
          Saves as <span className="text-ink-700">{(data.baseName || 'watermarked').replace(/[^a-z0-9-]+/gi, '-')}__watermarked.pdf</span>
        </p>

        <div className="my-3.5 h-px bg-line" />

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

        {/* Totals */}
        <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Source pages</span>
            <span className="text-ink-950">{file?.pages || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Pages stamped</span>
            <span className="text-ink-950">{targeted.pages.size || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Mode</span>
            <span className="text-ink-950">{data.mode === 'image' ? 'Logo / image' : 'Text'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Position</span>
            <span className="font-mono text-[12px] font-bold text-convert">{position.label}</span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Watermarked</span>
              <span className="text-ink-950">{result.watermarkedPages} of {result.pages}</span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {quality.label} · {pageSel.label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {file ? `${targeted.pages.size} page${targeted.pages.size === 1 ? '' : 's'} stamped` : '—'}
          </div>
        </div>

        <button type="button" onClick={handleApply}
          disabled={busy || !fileObj || targeted.pages.size === 0 || (data.mode === 'image' && !data.imageDataUrl)}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Stamping…' : `Apply watermark to ${targeted.pages.size || ''} page${targeted.pages.size === 1 ? '' : 's'}`}
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

function StampMock() {
  return (
    <div className="relative rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">Bengaluru · GSTIN 29ABCDE1234F1Z5</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[16px] font-bold tracking-[-0.01em] text-convert">INVOICE</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">INV-2026-0042 · 23 May 2026</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <div className="mt-3">
          <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">BILL TO</p>
          <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">Northwind Books Pvt Ltd</p>
        </div>

        <div className="mt-3 space-y-1">
          {[
            ['Brand identity', 'INR 2,50,000'],
            ['Website build',  'INR 4,80,000'],
            ['Tax (18%)',       'INR 1,31,400'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-line/50 py-0.5 font-mono text-[9px]">
              <span className="text-ink-700">{k}</span>
              <span className="text-ink-950">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between rounded bg-canvas px-2 py-1">
          <span className="font-bold font-mono text-[8px] uppercase">TOTAL</span>
          <span className="font-bold font-mono text-[10px] text-ink-950">INR 8,61,400</span>
        </div>

        {/* Watermark stamp */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            color: 'rgba(180, 110, 5, 0.18)',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 60,
            letterSpacing: '0.05em',
            pointerEvents: 'none',
          }}
        >
          DRAFT
        </span>
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
            PDF in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            stamped PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop a PDF, pick a preset like DRAFT or PAID, see a live preview, pick which pages get stamped. The output is a fresh PDF with the watermark embedded — original untouched.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <WatermarkIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Watermark Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Text · DRAFT
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'INV-2026-0042.pdf · 1 page'],
                  ['Mode',           'Text watermark'],
                  ['Preset',         'DRAFT'],
                  ['Colour',         '#B46E05 · amber'],
                  ['Opacity',        '0.10 · faint'],
                  ['Position',       'Centre (diagonal -30°)'],
                  ['Pages',          'All (1 of 1)'],
                  ['Output base',    'INV-2026-0042'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Stamp</span>
                <span className="font-mono text-[14px] font-semibold text-paper">DRAFT (centred)</span>
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
                  Stamped
                </span>
              </div>
              <StampMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the PDF',          'Drag an invoice, statement, or report in. The tool reads its page count in the browser — nothing uploads.'],
  ['02', 'Pick the stamp',         'Choose a preset (DRAFT / PAID / COPY / VOID / CONFIDENTIAL / SAMPLE) or type custom text. Or switch to image mode and upload your logo for a corner overlay.'],
  ['03', 'Place & save',           'Pick a position (centre / corner / header / footer / tiled), tune opacity, decide which pages get stamped, and save the result as a fresh PDF.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From plain invoice{' '}
              <em className="font-serif font-normal italic text-crimson-300">to clearly-stamped.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Status confusion is expensive: a draft invoice paid early, a PAID stamp missing from an archive copy, a confidential report forwarded without a marker. Stamping every page in 30 seconds eliminates the ambiguity for everyone downstream.
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
  { title: '7 text presets',          desc: 'DRAFT, PAID, COPY, VOID, CONFIDENTIAL, SAMPLE — preset colour, opacity, and angle calibrated for the meaning of each stamp. Plus a free-form custom-text option.' },
  { title: 'Image / logo overlay',     desc: 'Switch to image mode and upload a PNG or JPG. Use it as a brand watermark (light, centred) or a discrete corner mark. Transparent PNG works best.' },
  { title: '8 position presets',       desc: 'Centre (diagonal), tiled across the page, four corners, plus centred-along-the-top and centred-along-the-bottom. Pick the right placement for the meaning.' },
  { title: 'Fine-grained colour & opacity', desc: 'Hex colour picker. Opacity slider from 0.02 (barely visible) to 1.0 (full ink). Angle from -90° to 90° for text watermarks. Live preview updates with every change.' },
  { title: 'Page selection',           desc: 'Stamp all pages, first only, last only, odd-only, even-only, or custom ranges like "1-3, 5, 9-end". Useful for stamping just the cover or just internal pages.' },
  { title: '100% in browser',           desc: 'Source PDF never uploads. The watermark is composited onto each rendered page in your browser via the same PDF stack used across Sonchoy. Original file stays untouched.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for status clarity</Eyebrow>
          <SectionTitle>
            Stamp{' '}
            <em className="font-serif font-normal italic text-crimson-300">— don&rsquo;t guess.</em>
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
  { q: 'Is the watermark removable from the output PDF?',                a: 'No — the watermark is composited onto each page during render, so it becomes part of the page image. Someone determined to remove it would have to re-render the page from scratch (and lose every text-layer benefit), or open the source PDF in a vector-aware tool. For documents where the watermark is the legal marker (DRAFT, VOID), this is what you want.' },
  { q: 'Will the original PDF be modified?',                              a: 'Never. The tool reads the source PDF into memory, applies the watermark on copies of the rendered pages, and saves a new PDF. The original file on your disk is untouched — you can re-watermark with different settings as many times as you like.' },
  { q: 'Why is the output bigger than the source?',                       a: 'Because every page is rasterised before the watermark is stamped — same approach as the Merge / Compress tools. Drop to the Draft quality preset if the output is too large for email; bump to High if print fidelity matters. For minimum file size, use grayscale + Draft (in the Compress tool) after watermarking.' },
  { q: 'Can I tile the watermark across the whole page?',                 a: 'Yes — set position to "Tiled across page" and the watermark text repeats in a diagonal grid covering the whole page. Useful for sensitive documents where one stamp isn\'t enough (e.g., CONFIDENTIAL on a 30-page legal exhibit).' },
  { q: 'Does the logo overlay support transparent PNGs?',                 a: 'Yes — transparent PNGs are the recommended format for image watermarks. The tool reads the alpha channel and renders the image with its native transparency, then multiplies by the opacity slider on top of that. JPG works but you\'ll see the rectangular background.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The PDF, logo image, and resulting watermarked PDF are all read, processed, and saved entirely in your browser. No upload step, no third-party APIs. Nothing is logged or transmitted to Sonchoy.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">stamping PDFs.</em>
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
  { name: 'Merge Financial PDFs',  desc: 'Combine watermarked files into a packet.',          Icon: MergeIcon,    label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Split PDF Statements',  desc: 'Split a packet, then watermark each part.',          Icon: SplitIcon,    label: 'PDF', path: '/tools/split-pdf-statements' },
  { name: 'Compress Invoice PDFs', desc: 'Shrink the stamped PDF for email-sending.',          Icon: CompressIcon, label: 'PDF', path: '/tools/compress-invoice-pdfs' },
  { name: 'Reorder PDF Pages',     desc: 'Rearrange before stamping the cover.',               Icon: ExportIcon,   label: 'PDF', path: '/tools/reorder-pdf-pages' },
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

export default function AddWatermarkToInvoiceTool() {
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
