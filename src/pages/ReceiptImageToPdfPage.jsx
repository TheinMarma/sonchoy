import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  ReceiptIcon, MergeIcon, CompressIcon, ImageToPdfIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  PAGE_SIZES, FIT_MODES, ORIENTATIONS, LAYOUTS, SORT_OPTIONS, QUALITY_PRESETS, MARGIN_PRESETS,
  findPageSize, findFitMode, findOrientation, findLayout, findSortOption, findQuality, findMarginPreset,
  formatBytes, computeImageTotals, sortImages,
} from '../lib/receipt-image-to-pdf/compute'
import { buildReceiptPdf, fileToDataUrl, loadImageSize } from '../lib/receipt-image-to-pdf/buildPdf'

/* ---------- Local helpers ---------- */

const Eyebrow = ({ children, className = '' }) => (
  <p className={`m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300 ${className}`}>{children}</p>
)
const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950 ${className}`}>{children}</h2>
)

function todayISO() { return new Date().toISOString().slice(0, 10) }

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
    <div role="dialog" aria-modal="true" aria-label="Receipt Image to PDF"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Unlimited', 'Receipts per packet'],
  ['5',         'Page sizes'],
  ['Local',     '100% in browser'],
  ['Free',      'Always · no signup'],
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
            <span className="text-convert">Convert</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Receipt Image to PDF</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · Phone photos to PDF
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Phone-camera receipts{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              in,
            </em>
            <br />
            archive-ready{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              PDF out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drag in every JPG or PNG receipt from a business trip, expense report, or month-end batch. The tool stitches them into a single ordered, archive-friendly PDF — A4, Letter, or a narrow receipt strip — with optional cover sheet and captions.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Drag &amp; reorder</span>
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
        className="h-4 w-4 shrink-0 cursor-pointer accent-convert" />
    </label>
  )
}

/* ---------- Image grid ---------- */

let nextImageId = 1

function ImageGrid({ entries, onAdd, onRemove, onMove }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files || [])
    if (dropped.length) onAdd(dropped)
  }, [onAdd])

  return (
    <div>
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
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (files.length) onAdd(files)
            e.target.value = ''
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Add receipt images"
        />
        <ReceiptIcon />
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">
          Drop JPG / PNG receipts here or click to browse
        </p>
        <p className="m-0 text-[11px] text-ink-500">Phone photos work · order matches the PDF page order</p>
      </div>

      {entries.length > 0 && (
        <div className="mt-3 grid max-h-[420px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
          {entries.map((im, i) => (
            <div key={im.id} className="relative rounded-md border border-line bg-paper">
              <div className="aspect-[3/4] overflow-hidden rounded-t-md bg-ink-50">
                {im.dataUrl ? (
                  <img src={im.dataUrl} alt={im.name} className="h-full w-full object-contain" draggable={false} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-ink-500">loading…</div>
                )}
              </div>
              <div className="flex items-center justify-between px-1.5 py-1 font-mono text-[10px]">
                <span className="text-ink-500">#{i + 1}</span>
                <span className="truncate text-ink-700">{im.width ? `${im.width}×${im.height}` : '—'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line px-1 py-0.5">
                <div className="flex">
                  <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} aria-label="Move up"
                    className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-canvas hover:text-ink-950 disabled:opacity-30">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button type="button" onClick={() => onMove(i, 1)} disabled={i === entries.length - 1} aria-label="Move down"
                    className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-canvas hover:text-ink-950 disabled:opacity-30">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
                <button type="button" onClick={() => onRemove(im.id)} aria-label="Remove"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <p className="m-0 truncate px-1 pb-1 font-mono text-[9px] text-ink-500" title={im.name}>{im.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  title: 'Q1 2026 receipts',
  subtitle: 'Travel + client meals · expense report attachments',
  preparedBy: 'Sonchoy Studio · Finance team',
  preparedDate: todayISO(),

  pageSizeId:    'a4',
  fitModeId:     'contain',
  orientationId: 'auto',
  layoutId:      'one_per_page',
  sortId:        'as_added',
  qualityId:     'medium',
  marginId:      'normal',

  includeCover:       true,
  includeCaptions:    true,
  includePageNumbers: true,

  baseName: 'q1-2026-receipts',
}

function GeneratorPanel() {
  const [entries, setEntries] = useState([])    // [{ id, file, name, size, dataUrl, width, height, lastModified }]
  const [options, setOptions] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  const totals = useMemo(() => computeImageTotals(entries), [entries])
  const sorted = useMemo(() => sortImages(entries, options.sortId), [entries, options.sortId])

  const addFiles = useCallback(async (files) => {
    const imgFiles = files.filter((f) => f.type?.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(f.name))
    if (imgFiles.length === 0) return
    const newEntries = imgFiles.map((file) => ({
      id: nextImageId++,
      file,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      dataUrl: '',
      width: null,
      height: null,
    }))
    setEntries((prev) => [...prev, ...newEntries])
    // Read + measure in parallel
    for (const e of newEntries) {
      try {
        const dataUrl = await fileToDataUrl(e.file)
        const meta = await loadImageSize(dataUrl)
        setEntries((prev) => prev.map((x) => x.id === e.id ? { ...x, dataUrl, width: meta.width, height: meta.height } : x))
      } catch {
        setEntries((prev) => prev.filter((x) => x.id !== e.id))
      }
    }
  }, [])

  const removeImage = (id) => setEntries((prev) => prev.filter((e) => e.id !== id))
  const moveImage = (index, delta) => setEntries((prev) => {
    const next = [...prev]
    const target = index + delta
    if (target < 0 || target >= next.length) return prev
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
  const setOpt = (k) => (v) => setOptions((s) => ({ ...s, [k]: v }))
  const reset = () => { setEntries([]); setOptions(INITIAL); setResult(null); setProgress(null) }

  const handleBuild = async () => {
    if (busy || sorted.length === 0) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await buildReceiptPdf(sorted, options, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const pageSize = findPageSize(options.pageSizeId)
  const layout = findLayout(options.layoutId)
  const fit = findFitMode(options.fitModeId)
  void findOrientation(options.orientationId)
  void findSortOption(options.sortId)
  void findQuality(options.qualityId)
  void findMarginPreset(options.marginId)

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <ReceiptIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Packet · {totals.count} receipt{totals.count === 1 ? '' : 's'} · {formatBytes(totals.bytes)}
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* Receipt images */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Receipt images</span>
        <ImageGrid
          entries={entries}
          onAdd={addFiles}
          onRemove={removeImage}
          onMove={moveImage}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Cover sheet */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Cover sheet</span>
        <ToggleRow label="Add cover sheet" desc="Title + receipt manifest at the front"
          checked={options.includeCover} onChange={setOpt('includeCover')} />
        {options.includeCover && (
          <div className="mt-3 space-y-2">
            <TextInput label="Packet title" value={options.title} onChange={setOpt('title')} />
            <TextInput label="Subtitle (optional)" value={options.subtitle} onChange={setOpt('subtitle')} />
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Prepared by" value={options.preparedBy} onChange={setOpt('preparedBy')} />
              <DateInput label="Date" value={options.preparedDate} onChange={setOpt('preparedDate')} />
            </div>
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Layout */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Page layout</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Page size" value={options.pageSizeId} onChange={setOpt('pageSizeId')}
            options={PAGE_SIZES.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Layout" value={options.layoutId} onChange={setOpt('layoutId')}
            options={LAYOUTS.map((l) => ({ value: l.id, label: l.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="Fit mode" value={options.fitModeId} onChange={setOpt('fitModeId')}
            options={FIT_MODES.map((f) => ({ value: f.id, label: f.label }))} />
          <SelectInput label="Orientation" value={options.orientationId} onChange={setOpt('orientationId')}
            options={ORIENTATIONS.map((o) => ({ value: o.id, label: o.label }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="Margin" value={options.marginId} onChange={setOpt('marginId')}
            options={MARGIN_PRESETS.map((m) => ({ value: m.id, label: m.label }))} />
          <SelectInput label="Quality" value={options.qualityId} onChange={setOpt('qualityId')}
            options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Sort + extras */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Sort &amp; extras</span>
        <SelectInput label="Sort receipts by" value={options.sortId} onChange={setOpt('sortId')}
          options={SORT_OPTIONS.map((s) => ({ value: s.id, label: s.label }))} />
        <div className="mt-3 space-y-2">
          <ToggleRow label="Filename caption" desc="Print the filename below each receipt"
            checked={options.includeCaptions} onChange={setOpt('includeCaptions')} />
          <ToggleRow label="Page numbers" desc="Footer on every page"
            checked={options.includePageNumbers} onChange={setOpt('includePageNumbers')} />
        </div>
        <div className="mt-3">
          <TextInput label="File-name base" value={options.baseName} onChange={setOpt('baseName')} mono />
          <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
            Saves as <span className="text-ink-700">{(options.baseName || 'receipts').replace(/[^a-z0-9-]+/gi, '-')}.pdf</span>
          </p>
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
            <span className="text-ink-500">Receipts</span>
            <span className="text-ink-950">{totals.count}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Source size</span>
            <span className="text-ink-950">{formatBytes(totals.bytes)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Page size</span>
            <span className="text-ink-950">{pageSize.label.split('(')[0].trim()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Layout</span>
            <span className="font-mono text-[12px] font-bold text-convert">
              {layout.label} · {fit.label.split('(')[0].trim()}
            </span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · packet ready</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Pages</span>
              <span className="text-ink-950">{result.pages}</span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {options.includeCover ? 'cover + ' : ''}{totals.count} page{totals.count === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {options.title || 'Receipts.pdf'}
          </div>
        </div>

        <button type="button" onClick={handleBuild}
          disabled={busy || totals.count === 0}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Building PDF…' : `Build PDF from ${totals.count || ''} receipt${totals.count === 1 ? '' : 's'}`}
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

function PacketMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[16px] font-bold text-ink-950">Q1 2026 receipts</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">Travel + client meals · expense report attachments</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">14 receipts · A4</p>
            <p className="m-0 mt-1 font-mono text-[9px] text-ink-500">Prepared 23 May 2026</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">RECEIPTS IN THIS PACKET</p>
        <div className="mt-1 space-y-1 font-mono text-[10px]">
          {[
            ['1.',  'IMG_2031.jpg — Uber to airport',       '3024×4032'],
            ['2.',  'IMG_2032.jpg — Lounge access',         '3024×4032'],
            ['3.',  'IMG_2033.jpg — Hotel check-in',         '4032×3024'],
            ['4.',  'IMG_2034.jpg — Client dinner · Day 1', '3024×4032'],
            ['5.',  'IMG_2041.png — Cab back',              '2160×3840'],
            ['6.',  'IMG_2042.jpg — Coffee meeting',         '3024×4032'],
            ['7.',  'IMG_2049.jpg — Office supplies',        '3024×4032'],
            ['8.',  'IMG_2052.jpg — Stationery',             '3024×4032'],
          ].map(([n, name, dim]) => (
            <div key={n} className="flex items-center justify-between border-b border-line pb-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-ink-500">{n}</span>
                <span className="truncate text-ink-950">{name}</span>
              </div>
              <span className="text-ink-500">{dim}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ 6 more receipts on subsequent pages, one per page with filename captions</p>
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
            Phone photos in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            archive packet out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop in JPG / PNG receipts from a phone, scanner, or download folder. The tool sizes them to A4 / Letter / receipt strip, lays them one-per-page or in a 2-up / 4-up grid, and prepends a branded cover sheet with a manifest.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <ReceiptIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Packet Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  14 receipts · A4
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Title',         'Q1 2026 receipts'],
                  ['Subtitle',      'Travel + client meals'],
                  ['Receipts',      '14 images (12 JPG · 2 PNG)'],
                  ['Page size',     'A4 portrait'],
                  ['Layout',        'One receipt per page'],
                  ['Fit',           'Contain (preserve aspect)'],
                  ['Cover sheet',   'Yes · with manifest'],
                  ['Captions',      'Filename below each receipt'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">1 PDF · 15 pages</span>
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
                  Archive-ready
                </span>
              </div>
              <PacketMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the images',        'Drag a folder of JPG / PNG receipts from your phone, scanner, or download folder. Each one renders as a thumbnail you can reorder or remove.'],
  ['02', 'Set the layout',          'Pick a page size (A4 / Letter / A5 / 80mm receipt strip / fit-to-image), a layout (one-per-page or 2-up / 4-up grid), and a fit mode (contain / cover / native).'],
  ['03', 'Build & download',        'One click stitches every receipt into a single PDF in your chosen order, with optional cover sheet, captions, and page numbers. Nothing uploads.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From phone roll{' '}
              <em className="font-serif font-normal italic text-crimson-300">to archive PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most expense reports die in the gap between "I have 30 receipt photos somewhere" and "finance needs a single PDF". This tool collapses the gap to one minute — drop the photos in, set a layout, download the packet.
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
  { title: '5 page sizes',              desc: 'A4, US Letter, A5, narrow 80mm receipt strip, or fit-to-each-image (every receipt gets a page sized to its own dimensions).' },
  { title: '3 layouts',                  desc: 'One receipt per page (clean and standard), 2-up grid (stacked, saves paper), or 4-up grid (2 columns × 2 rows, archive-dense).' },
  { title: '4 fit modes',                desc: 'Contain (default, preserves aspect with letterbox), cover (fills page, may crop), stretch (fills, may distort), or native (centred at original size).' },
  { title: 'Optional cover sheet',       desc: 'Title, subtitle, prepared-by, date, plus an auto-generated manifest listing every receipt with its dimensions. Skip for a no-frills packet.' },
  { title: 'Drag & reorder',             desc: 'Move thumbnails up or down with arrow buttons. Sort by filename, file date, or as-added. Remove individual receipts at any time.' },
  { title: '100% in browser',             desc: 'Images, dimensions, and the assembled PDF are all read, processed, and saved locally via the same PDF stack used across Sonchoy. Nothing uploads.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for expense reports</Eyebrow>
          <SectionTitle>
            Tidy receipts{' '}
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
  { q: 'What image formats are supported?',                              a: 'JPG / JPEG and PNG work everywhere. WebP works in most browsers. HEIC (the default iPhone format) works only in browsers that decode HEIC natively — Safari on macOS / iOS. On Chrome / Firefox you may need to convert HEIC to JPG first; most phones do this when emailing or AirDropping.' },
  { q: 'What about file size limits?',                                   a: 'No hard limit, but browser memory is finite. 30–50 receipts at phone-camera resolution (~3000×4000 each) work comfortably. For larger batches, split into two packets or downscale the source images first.' },
  { q: 'Why pick "fit each receipt" page size?',                          a: 'For native-feel PDFs where each receipt occupies its own correctly-sized page. Great for archiving raw scans where you don\'t want any letterboxing or scaling. The downside: page sizes vary across the PDF, which some accounting systems dislike. Default to A4 unless you have a specific reason.' },
  { q: 'Do thumbnails get scaled for the PDF?',                          a: 'No — the thumbnails in the picker are just for the UI. The PDF uses the full-resolution image data. So a 4032×3024 phone photo gets embedded at full resolution; the on-page rendering is driven by the fit mode (contain, cover, etc.) inside the chosen slot.' },
  { q: 'Can I add captions from a CSV (e.g. amounts + dates)?',          a: 'Not in this tool — the only auto-caption is the filename. For richer captioned packets (amount + date per receipt), use the Expense Report Generator tool: it takes structured rows and produces a tabular report you can attach to your image packet.' },
  { q: 'Does my data leave the browser?',                                a: 'Never. Images, metadata, and the assembled PDF stay on your machine. All decoding, layout, and PDF generation runs in your browser via canvas + jsPDF. The download is triggered locally via the standard file-save mechanism. Nothing is uploaded to Sonchoy or any third party.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">receipt packets.</em>
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
  { name: 'Expense Report Generator', desc: 'Pair the receipt PDF with a structured claim.',     Icon: ReceiptIcon,    label: 'DOCUMENTS', path: '/tools/expense-report-generator' },
  { name: 'Merge Financial PDFs',     desc: 'Combine the receipt packet with other PDFs.',         Icon: MergeIcon,      label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Compress Invoice PDFs',    desc: 'Shrink the receipt PDF for email-sending.',           Icon: CompressIcon,   label: 'PDF', path: '/tools/compress-invoice-pdfs' },
  { name: 'JPG Receipt to PDF',       desc: 'Single-receipt photo to PDF, fast.',                   Icon: ImageToPdfIcon, label: 'CONVERT' },
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

export default function ReceiptImageToPdfPage() {
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
