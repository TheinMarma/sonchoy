import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  ReorderIcon, MergeIcon, SplitIcon, CompressIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  QUALITY_PRESETS, findQuality,
  parseOrderText, compactOrderString,
  reverseOrder, moveItem, removeItem, shuffleArray, detectIsModified,
  formatBytes,
} from '../lib/reorder-pdf/compute'
/* `parsedFromText.order` is intentionally unused — we only surface errors;
   the "Apply" button re-parses on click so the user can review before
   replacing the current order. */
import { reorderPdf, probePdfWithThumbs } from '../lib/reorder-pdf/reorderPdf'

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
    <div role="dialog" aria-modal="true" aria-label="Reorder PDF Pages"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[700px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Drag',   'To reorder visually'],
  ['Spec',   'Or type 1-5, 8, 6-7'],
  ['Thumbs', 'Live page previews'],
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
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-convert">PDF</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Reorder PDF Pages</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            PDF · Rearrange
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Drag pages into{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              the right
            </em>
            <br />
            sequence{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              fast.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drag thumbnail tiles to rearrange pages, drop unwanted pages, or type an order like "3, 1, 2, 5-end". One-click presets for reverse, odd-only, even-only, or shuffle. Output downloads as a new PDF — original stays untouched.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Drag-to-reorder</span>
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
      <ReorderIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Any PDF · pages render as drag-to-reorder thumbnails</p>
    </div>
  )
}

/* ---------- Thumbnail grid ---------- */

function ThumbGrid({ thumbs, order, onMove, onRemove }) {
  const [dragFrom, setDragFrom] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const handleDragStart = (idx) => (e) => {
    setDragFrom(idx)
    // Firefox needs setData to allow dragging
    try { e.dataTransfer.setData('text/plain', String(idx)) } catch { /* noop */ }
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (idx) => (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(idx)
  }
  const handleDrop = (idx) => (e) => {
    e.preventDefault()
    if (dragFrom != null && dragFrom !== idx) onMove(dragFrom, idx)
    setDragFrom(null); setDragOver(null)
  }
  const handleDragEnd = () => { setDragFrom(null); setDragOver(null) }

  return (
    <div className="max-h-[420px] overflow-y-auto rounded-lg border border-line bg-canvas p-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {order.map((pageNum, idx) => {
          const thumb = thumbs.find((t) => t.pageNum === pageNum)
          if (!thumb) return null
          const isOver = dragOver === idx
          const isDragging = dragFrom === idx
          return (
            <div
              key={`${pageNum}-${idx}`}
              draggable
              onDragStart={handleDragStart(idx)}
              onDragOver={handleDragOver(idx)}
              onDrop={handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`group relative cursor-grab rounded-md border bg-paper transition-all ${
                isOver ? 'border-convert ring-2 ring-convert/40' :
                isDragging ? 'border-line opacity-40' : 'border-line hover:border-convert/60'
              }`}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-t-md bg-ink-50">
                <img
                  src={thumb.dataUrl}
                  alt={`Page ${pageNum} thumbnail`}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
              <div className="flex items-center justify-between px-1.5 py-1 font-mono text-[10px]">
                <span className="text-ink-500">#{idx + 1}</span>
                <span className="text-ink-950">p {pageNum}</span>
              </div>
              {/* Hover controls */}
              <div className="pointer-events-none absolute inset-0 flex items-start justify-end gap-0.5 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  aria-label="Remove page"
                  className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full bg-paper/95 text-ink-700 shadow-sm transition-colors hover:bg-crimson-500 hover:text-white"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL_OPTIONS = {
  qualityId: 'medium',
  includePageNumbers: false,
  baseName: '',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)
  const [fileObj, setFileObj] = useState(null)
  const [thumbs, setThumbs] = useState([])           // [{ pageNum, dataUrl }]
  const [order, setOrder] = useState([])             // [1, 3, 2, ...]
  const [orderText, setOrderText] = useState('')     // free-text spec input
  const [options, setOptions] = useState(INITIAL_OPTIONS)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  const handlePick = useCallback(async (raw) => {
    setFileObj(raw); setResult(null); setThumbs([]); setOrder([])
    setFile({ name: raw.name, size: raw.size, pages: null })
    setOptions((s) => ({ ...s, baseName: raw.name.replace(/\.pdf$/i, '') }))
    setProgress({ stage: 'thumbs', pct: 1, message: 'Rendering thumbnails…' })
    try {
      const info = await probePdfWithThumbs(raw, (p) => setProgress(p))
      setThumbs(info.thumbs)
      setOrder(info.thumbs.map((t) => t.pageNum))
      setFile({ name: raw.name, size: raw.size, pages: info.pages })
      setProgress(null)
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: `Could not read PDF: ${err?.message || err}` })
    }
  }, [])

  const handleClear = () => {
    setFile(null); setFileObj(null); setThumbs([]); setOrder([]); setOrderText('')
    setProgress(null); setResult(null)
  }

  const setOpt = (k) => (v) => setOptions((s) => ({ ...s, [k]: v }))

  const handleMove = (from, to) => setOrder((o) => moveItem(o, from, to))
  const handleRemovePage = (idx) => setOrder((o) => removeItem(o, idx))

  const applyOrderText = () => {
    if (!file?.pages || !orderText.trim()) return
    const { order: parsedOrder } = parseOrderText(orderText, file.pages)
    if (parsedOrder.length > 0) setOrder(parsedOrder)
  }
  const presetReverse = () => setOrder((o) => reverseOrder(o))
  const presetShuffle = () => setOrder((o) => shuffleArray(o))
  const presetReset   = () => file?.pages && setOrder(Array.from({ length: file.pages }, (_, i) => i + 1))

  const reset = () => {
    setOptions({ ...INITIAL_OPTIONS, baseName: file?.name?.replace(/\.pdf$/i, '') || '' })
    if (file?.pages) setOrder(Array.from({ length: file.pages }, (_, i) => i + 1))
    setOrderText(''); setProgress(null); setResult(null)
  }

  const parsedFromText = useMemo(
    () => file?.pages ? parseOrderText(orderText, file.pages) : { order: [], errors: [] },
    [orderText, file]
  )
  const isModified = useMemo(
    () => file?.pages ? detectIsModified(file.pages, order) : false,
    [file, order]
  )
  const compact = useMemo(() => compactOrderString(order), [order])

  const handleApply = async () => {
    if (!fileObj || order.length === 0 || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await reorderPdf(fileObj, order, options, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const quality = findQuality(options.qualityId)

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <ReorderIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Reorder · {order.length || '—'} of {file?.pages || '—'} · {isModified ? 'modified' : 'unchanged'}
            </span>
          </div>
          <button type="button" onClick={reset} disabled={!file}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700 disabled:opacity-50">
            Reset
          </button>
        </div>

        {/* Source */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Source PDF</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        {/* Thumbnail grid */}
        {thumbs.length > 0 && (
          <>
            <div className="my-3.5 h-px bg-line" />
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">
                Page order · drag to rearrange
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={presetReverse}
                  className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700 hover:border-line-strong hover:text-ink-950">
                  Reverse
                </button>
                <button type="button" onClick={presetShuffle}
                  className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700 hover:border-line-strong hover:text-ink-950">
                  Shuffle
                </button>
                <button type="button" onClick={presetReset}
                  className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700 hover:border-line-strong hover:text-ink-950">
                  Reset order
                </button>
              </div>
            </div>
            <ThumbGrid thumbs={thumbs} order={order} onMove={handleMove} onRemove={handleRemovePage} />
          </>
        )}

        {/* Order spec input */}
        {file?.pages > 0 && (
          <>
            <div className="my-3.5 h-px bg-line" />
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">
              Or type an order spec
            </span>
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <TextInput
                label="Spec"
                value={orderText}
                onChange={setOrderText}
                placeholder="3, 1, 2, 5-end · reverse · odd · even · all"
                mono
              />
              <button type="button" onClick={applyOrderText}
                disabled={!orderText.trim() || parsedFromText.errors.length > 0}
                className="inline-flex h-[36px] items-center justify-center gap-1 rounded-md border border-line bg-paper px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-60">
                Apply
              </button>
            </div>
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Syntax: <span className="text-ink-700">3, 1, 2</span>  ·  <span className="text-ink-700">1-5, 8</span>  ·  <span className="text-ink-700">20-end</span>  ·  keywords <span className="text-ink-700">all</span>, <span className="text-ink-700">reverse</span>, <span className="text-ink-700">odd</span>, <span className="text-ink-700">even</span>
            </p>
            {parsedFromText.errors.length > 0 && (
              <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[10.5px] text-warning">
                ⚠ {parsedFromText.errors.length} warning{parsedFromText.errors.length === 1 ? '' : 's'}: {parsedFromText.errors[0]}
              </div>
            )}
            {compact && (
              <p className="m-0 mt-2 font-mono text-[10.5px] text-ink-700">
                <span className="text-ink-500">Current order:</span> {compact.length > 80 ? `${compact.slice(0, 79)}…` : compact}
              </p>
            )}
          </>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Rendering */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Rendering &amp; naming</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Quality" value={options.qualityId} onChange={setOpt('qualityId')}
            options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
          <TextInput label="File-name base" value={options.baseName} onChange={setOpt('baseName')} mono />
        </div>
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
          Saves as <span className="text-ink-700">{(options.baseName || 'reordered').replace(/[^a-z0-9-]+/gi, '-')}__reordered.pdf</span>
        </p>
        <div className="mt-2 space-y-2">
          <ToggleRow label="Page numbers" desc="Footer on every output page"
            checked={options.includePageNumbers} onChange={setOpt('includePageNumbers')} />
        </div>

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
            <span className="text-ink-500">Output pages</span>
            <span className="text-ink-950">{order.length || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Status</span>
            <span className={isModified ? 'text-convert' : 'text-ink-700'}>
              {isModified ? 'Modified order' : 'Same as source'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Quality</span>
            <span className="font-mono text-[12px] font-bold text-convert">{quality.label}</span>
          </div>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {result?.outputBytes ? formatBytes(result.outputBytes) : (isModified ? 'with new order' : 'unchanged')}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {order.length} page{order.length === 1 ? '' : 's'}
          </div>
        </div>

        <button type="button" onClick={handleApply}
          disabled={busy || !fileObj || order.length === 0}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Reordering…' : `Save ${order.length} page${order.length === 1 ? '' : 's'} in new order`}
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

function ReorderMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Q1 management report.pdf</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">12 pages · 2.4 MB</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Order modified</p>
            <p className="m-0 mt-1 font-mono text-[9px] text-ink-500">Spec: 12, 1-5, 6-11</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">PAGE TILES</p>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {[
            { n: 1, src: 12, label: 'Cover' },
            { n: 2, src: 1,  label: 'Exec summary' },
            { n: 3, src: 2,  label: 'Revenue' },
            { n: 4, src: 3,  label: 'Expenses' },
            { n: 5, src: 4,  label: 'Net' },
            { n: 6, src: 5,  label: 'KPI table' },
            { n: 7, src: 6,  label: 'Commentary' },
            { n: 8, src: 7,  label: 'Risks' },
          ].map((p) => (
            <div key={p.n} className="rounded border border-line bg-canvas">
              <div className="aspect-[3/4] rounded-t bg-paper p-1.5 text-[7px] text-ink-500">
                {p.label}
              </div>
              <div className="flex items-center justify-between px-1 py-0.5 font-mono text-[8px]">
                <span className="text-ink-500">#{p.n}</span>
                <span className="text-ink-950">p{p.src}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ 4 more tiles · "Cover" page moved from p.12 → p.1, originals follow</p>
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
            Out-of-order PDF in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            tidy sequence out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Page thumbnails render as drag tiles you can rearrange or delete. Or type an order spec like "12, 1-11" to move the cover page to the front. Original PDF stays untouched.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <ReorderIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Reorder Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Drag · spec
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'Q1 management report.pdf'],
                  ['Pages',          '12'],
                  ['Action',         'Move p.12 (cover) to front'],
                  ['Order spec',     '12, 1-11'],
                  ['Result order',   '12, 1, 2, 3, 4, 5, 6, 7, …'],
                  ['Quality',        'Standard (1.5×)'],
                  ['Output base',    'q1-report'],
                  ['Modified',       'Yes · 12 of 12 pages'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">12 pages, reordered</span>
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
                  Send-ready
                </span>
              </div>
              <ReorderMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the PDF',          'Drag any PDF in. The tool renders a thumbnail for every page so you can identify them visually — no more squinting at page numbers.'],
  ['02', 'Rearrange',              'Drag tiles to reorder. Hover any tile to remove it from the output. Or type a spec like "12, 1-11" to move the cover page to the front in one shot.'],
  ['03', 'Save the new order',     'One click renders the pages in your new sequence and downloads a fresh PDF. The original stays exactly as you uploaded it — nothing is overwritten.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From scrambled pages{' '}
              <em className="font-serif font-normal italic text-crimson-300">to clean sequence.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Scanned PDFs come out of the scanner upside-down, in the wrong order, with a stray blank page. Cover pages get put at the back because that\'s how the printer fed it. Fix it once, save a clean copy, and never explain to the client why the cover is on page 12.
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
  { title: 'Drag-to-reorder thumbs', desc: 'Every page renders as a tile you can drag to a new position. Visual identification means you don\'t have to remember "page 7 was the revenue chart".' },
  { title: 'Order spec language',     desc: 'For big PDFs (40+ pages) typing is faster than dragging. Spec syntax: "3, 1, 2", ranges like "1-5, 8", keywords "all", "reverse", "odd", "even", and the "end" anchor.' },
  { title: 'Remove pages on hover',   desc: 'Hover any tile and click the × badge to drop a page from the output. Great for deleting accidental blank pages or scanner separator sheets.' },
  { title: 'One-click presets',       desc: 'Reverse the entire order with one button. Shuffle for stress-testing. Reset order returns to 1..N if you want to start over.' },
  { title: 'Quality presets',         desc: 'Same scale options as the Merge / Split / Compress tools — Draft to Print. Pick the one that matches the use case for the reordered PDF.' },
  { title: '100% in browser',          desc: 'Source PDF never uploads. Thumbnails and the reordered output are generated locally via the same PDF stack used across Sonchoy. Original file stays untouched.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for rearranging</Eyebrow>
          <SectionTitle>
            Drag, type,{' '}
            <em className="font-serif font-normal italic text-crimson-300">or both.</em>
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
  { q: 'Will the original PDF be modified?',                              a: 'No. The tool reads the source PDF into memory, renders pages in the new order, and saves the result as a new PDF file. The original file on your disk is never touched. If you accidentally rearrange the wrong way, just re-upload the original and start over.' },
  { q: 'Is the text searchable in the reordered PDF?',                    a: 'No — same trade-off as the other PDF utility tools (Merge, Split, Compress). Each page is rasterised to a JPEG image before being written into the new PDF, so text becomes part of the page image. The content looks identical but Ctrl-F won\'t find words. For searchable output, run OCR on the result.' },
  { q: 'Can I duplicate a page or include the same page twice?',          a: 'Yes — the same page number can appear multiple times in the order. Drag the tile and clone via the order spec: "1, 1, 2, 3" will include page 1 twice. Useful for things like inserting a divider page between sections of a report.' },
  { q: 'What does the order spec syntax support?',                        a: 'Comma- or newline-separated entries. Each entry can be a single page (5), a range (1-5), a reverse range (8-3 → descending), or the "end" keyword for the last page (20-end). Plus four shortcut keywords: "all" (1..N original order), "reverse" (N..1), "odd" (odd-numbered pages only), "even" (even-numbered only). Out-of-range entries surface as warnings without breaking the parse.' },
  { q: 'Why are thumbnails so small?',                                    a: 'Each thumbnail is rendered at 0.18× the source size to keep memory usage low — a 50-page PDF takes ~5–8 MB of memory for thumbnails instead of 50–80 MB at full resolution. Tile size in the grid scales with the page aspect ratio, so portrait pages look portrait and landscape pages look landscape.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The source PDF is read into memory, rendered to canvas elements, and re-emitted as a new PDF blob — all in your browser. The download is triggered locally via the standard file-save mechanism. Nothing is uploaded to Sonchoy or any third party at any point.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">reordering pages.</em>
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
  { name: 'Merge Financial PDFs',   desc: 'Combine many PDFs, then reorder the result.',         Icon: MergeIcon,    label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Split PDF Statements',   desc: 'Slice a long PDF into months before reordering.',     Icon: SplitIcon,    label: 'PDF', path: '/tools/split-pdf-statements' },
  { name: 'Compress Invoice PDFs',  desc: 'Shrink the reordered PDF for email.',                  Icon: CompressIcon, label: 'PDF', path: '/tools/compress-invoice-pdfs' },
  { name: 'Bank Statement → Excel', desc: 'Extract transaction tables from each page.',           Icon: ExportIcon,   label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
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
              ? (<Link key={t.name} to={t.path} className={cls}>{inner}</Link>)
              : (<a key={t.name} href="#" className={cls}>{inner}</a>)
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export default function ReorderPdfPagesPage() {
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
