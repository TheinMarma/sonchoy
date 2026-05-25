import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  ImageToPdfIcon, ReceiptIcon, MergeIcon, CompressIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  PAGE_SIZES, FIT_MODES, MARGIN_PRESETS, QUALITY_PRESETS,
  findPageSize, findFitMode, findMarginPreset, findQuality,
  formatBytes,
} from '../lib/jpg-to-pdf/compute'
import { buildJpgReceiptPdf, fileToDataUrl, loadImageSize } from '../lib/jpg-to-pdf/buildPdf'

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
    <div role="dialog" aria-modal="true" aria-label="PNG Receipt to PDF"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['1-click', 'No setup'],
  ['5',       'Page sizes'],
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
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-convert">Convert</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">PNG Receipt to PDF</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · Single-image to PDF
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            One receipt photo{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              in,
            </em>
            <br />
            expense-ready{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              PDF out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drag in a PNG screenshot or scan of a single receipt. The tool sizes the image to A4, US Letter, A5, a narrow receipt strip, or fits the page to the photo — your choice. Optional caption + date, one-click download.
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
              {formatBytes(image.size)}{image.width ? `  ·  ${image.width}×${image.height} px` : ''}
            </p>
          </div>
          <button type="button" onClick={onClear} aria-label="Remove image"
            className="rounded-full border border-line bg-paper px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Change
          </button>
        </div>
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
        accept="image/png,image/jpeg,image/webp,image/heic,image/jpg"
        onChange={(e) => {
          const first = e.target.files && e.target.files[0]
          if (first) onPick(first)
          e.target.value = ''
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Choose receipt image"
      />
      <ImageToPdfIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PNG receipt or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">One receipt at a time · phone photos work</p>
    </div>
  )
}

/* ---------- Live preview ---------- */

function PagePreview({ image, options }) {
  const pageSize = findPageSize(options.pageSizeId)
  const margin = findMarginPreset(options.marginId).pt
  const fit = findFitMode(options.fitModeId)

  // Compute preview aspect ratio + image placement (simplified to CSS-friendly %)
  let pageAspect = 1 / 1.414  // A4 portrait
  if (pageSize.id === 'fit' && image?.width && image?.height) {
    pageAspect = image.width / image.height
  } else if (pageSize.w && pageSize.h) {
    // Pick orientation based on image
    if (image?.width && image?.height) {
      const portraitW = Math.min(pageSize.w, pageSize.h)
      const portraitH = Math.max(pageSize.w, pageSize.h)
      const portraitAspect = portraitW / portraitH
      const imgAspect = image.width / Math.max(1, image.height)
      if (imgAspect > portraitAspect * 1.1) pageAspect = portraitH / portraitW  // landscape
      else pageAspect = portraitW / portraitH
    } else {
      pageAspect = Math.min(pageSize.w, pageSize.h) / Math.max(pageSize.w, pageSize.h)
    }
  }

  const marginPct = margin / 400  // rough %: 24pt of ~600pt page → 4%

  return (
    <div className="relative overflow-hidden rounded-md border border-line bg-paper" style={{ aspectRatio: pageAspect }}>
      {options.includeCaption && (options.caption || options.captionDate) && (
        <div className="absolute left-0 right-0 px-3 pt-2 font-mono text-[7.5px] text-ink-500" style={{ top: `${marginPct * 100 * 0.5}%` }}>
          {[options.caption, options.captionDate].filter(Boolean).join('  ·  ')}
        </div>
      )}
      {image?.dataUrl && (
        <img
          src={image.dataUrl}
          alt="Receipt preview"
          className="absolute"
          style={{
            top: `${marginPct * 100 + (options.includeCaption ? 3 : 0)}%`,
            left: `${marginPct * 100}%`,
            right: `${marginPct * 100}%`,
            bottom: `${marginPct * 100}%`,
            width: `calc(100% - ${marginPct * 200}%)`,
            height: `calc(100% - ${marginPct * 200}% - ${options.includeCaption ? 6 : 0}%)`,
            objectFit: fit.id === 'cover' ? 'cover' : fit.id === 'native' ? 'none' : 'contain',
            objectPosition: 'center',
          }}
        />
      )}
      {options.includeFilename && image?.name && (
        <div className="absolute bottom-1 left-3 right-3 font-mono text-[7px] text-ink-500/70">
          {image.name}
        </div>
      )}
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  pageSizeId:  'a4',
  fitModeId:   'contain',
  marginId:    'normal',
  qualityId:   'medium',

  includeCaption:  true,
  caption:         'Uber to airport',
  captionDate:     todayISO(),

  includeFilename: true,

  baseName: '',
}

function GeneratorPanel() {
  const [image, setImage] = useState(null)    // { file, name, size, dataUrl, width, height }
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  const handlePick = useCallback(async (raw) => {
    setResult(null); setProgress({ stage: 'loading', pct: 30, message: `Reading ${raw.name}…` })
    setData((s) => ({ ...s, baseName: raw.name.replace(/\.[^.]+$/, '') }))
    setImage({ file: raw, name: raw.name, size: raw.size, dataUrl: '', width: null, height: null })
    try {
      const dataUrl = await fileToDataUrl(raw)
      const meta = await loadImageSize(dataUrl)
      setImage({ file: raw, name: raw.name, size: raw.size, dataUrl, width: meta.width, height: meta.height })
      setProgress(null)
    } catch {
      setImage(null)
      setProgress({ stage: 'error', pct: 0, message: 'Could not read image — try a PNG or JPG.' })
    }
  }, [])

  const handleClear = () => { setImage(null); setResult(null); setProgress(null) }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => {
    setData({ ...INITIAL, baseName: image?.name?.replace(/\.[^.]+$/, '') || '' })
    setProgress(null); setResult(null)
  }

  const handleBuild = async () => {
    if (!image || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await buildJpgReceiptPdf(image, data, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const pageSize     = findPageSize(data.pageSizeId)
  const fit          = findFitMode(data.fitModeId)
  const marginPreset = findMarginPreset(data.marginId)
  void findQuality(data.qualityId)

  /* Live preview is rebuilt only when options or image change */
  const previewKey = useMemo(() => `${data.pageSizeId}-${data.fitModeId}-${data.marginId}-${data.includeCaption}-${data.includeFilename}-${data.caption}-${data.captionDate}-${image?.dataUrl?.length || 0}`, [data, image])

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <ImageToPdfIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Receipt · {image?.width ? `${image.width}×${image.height}` : 'no image'} · {pageSize.label.split('(')[0].trim()}
            </span>
          </div>
          <button type="button" onClick={reset} disabled={!image}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700 disabled:opacity-50">
            Reset
          </button>
        </div>

        {/* Receipt image */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Receipt image</span>
        <ImageDrop image={image} onPick={handlePick} onClear={handleClear} />

        {image?.dataUrl && (
          <>
            {/* Live preview */}
            <div className="mt-4">
              <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">Live preview</p>
              <PagePreview key={previewKey} image={image} options={data} />
            </div>

            <div className="my-3.5 h-px bg-line" />

            {/* Page setup */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Page setup</span>
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Page size" value={data.pageSizeId} onChange={setField('pageSizeId')}
                options={PAGE_SIZES.map((p) => ({ value: p.id, label: p.label }))} />
              <SelectInput label="Fit mode" value={data.fitModeId} onChange={setField('fitModeId')}
                options={FIT_MODES.map((f) => ({ value: f.id, label: f.label }))} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SelectInput label="Margin" value={data.marginId} onChange={setField('marginId')}
                options={MARGIN_PRESETS.map((m) => ({ value: m.id, label: m.label }))} />
              <SelectInput label="Quality" value={data.qualityId} onChange={setField('qualityId')}
                options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
            </div>

            <div className="my-3.5 h-px bg-line" />

            {/* Caption */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Caption &amp; metadata</span>
            <div className="space-y-2">
              <ToggleRow label="Caption above receipt"
                desc='e.g. "Uber to airport · 23 May 2026"'
                checked={data.includeCaption} onChange={setField('includeCaption')} />
              {data.includeCaption && (
                <div className="grid grid-cols-[1fr_150px] gap-2">
                  <TextInput label="Caption" value={data.caption} onChange={setField('caption')} placeholder="What this receipt is for" />
                  <DateInput label="Date" value={data.captionDate} onChange={setField('captionDate')} />
                </div>
              )}
              <ToggleRow label="Filename footer" desc="Original filename in the page footer"
                checked={data.includeFilename} onChange={setField('includeFilename')} />
            </div>

            <div className="my-3.5 h-px bg-line" />

            {/* Naming */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">File name</span>
            <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Saves as <span className="text-ink-700">{(data.baseName || 'receipt').replace(/[^a-z0-9-]+/gi, '-')}.pdf</span>
            </p>
          </>
        )}

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
            <span className="text-ink-500">Source</span>
            <span className="text-ink-950">{image ? `${formatBytes(image.size)}${image.width ? ` · ${image.width}×${image.height}` : ''}` : '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Page</span>
            <span className="text-ink-950">{pageSize.label.split('(')[0].trim()} · {fit.label.split('(')[0].trim()}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Margin</span>
            <span className="text-ink-950">{marginPreset.label}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Caption</span>
            <span className="font-mono text-[12px] font-bold text-convert">
              {data.includeCaption ? (data.caption || 'On (empty)') : 'Off'}
            </span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · PDF ready</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Page</span>
              <span className="text-ink-950">{Math.round(result.pageW)} × {Math.round(result.pageH)} pt · {result.orientation}</span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              1 page PDF
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {data.caption || (data.baseName ? `${data.baseName}.pdf` : 'Receipt.pdf')}
          </div>
        </div>

        <button type="button" onClick={handleBuild}
          disabled={busy || !image}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Building PDF…' : 'Build PDF from receipt'}
          <ArrowRight size={14} />
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">100% local · nothing uploaded</span>
          <a href="https://go.sonchoy.com/pdfFiller" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-crimson-300 no-underline hover:text-crimson-400">
            Need to batch many? <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Preview ---------- */

function ReceiptMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">uber-to-airport.pdf</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">A4 portrait · 1 page · 240 KB</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Caption + date on</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 font-mono text-[9px] text-ink-500">Uber to airport · 23 May 2026</p>

        <div className="mt-2 flex h-[280px] items-center justify-center rounded-md border border-line bg-canvas">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-500">
              <ReceiptIcon />
            </div>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">RECEIPT IMAGE</p>
            <p className="m-0 mt-1 text-[9.5px] text-ink-500">centred inside the page margin</p>
          </div>
        </div>

        <p className="m-0 mt-2 font-mono text-[7px] text-ink-500">receipt-2031.png</p>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">Drop in a phone receipt → out as expense-ready PDF in a single click</p>
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
            Phone photo in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            expense PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop one PNG. Pick a page size (A4 / Letter / A5 / fit-to-image / receipt strip), choose how the image fits, optionally print a caption + date at the top — and download a clean single-page PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <ImageToPdfIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Receipt Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  A4 · contain
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source',          'receipt-2031.png · 3024×4032 px · 2.4 MB'],
                  ['Page size',       'A4 portrait'],
                  ['Fit mode',        'Contain (preserve aspect)'],
                  ['Margin',          'Normal (24pt)'],
                  ['Caption',         'Uber to airport'],
                  ['Date',            '23 May 2026'],
                  ['Filename footer', 'On'],
                  ['Output base',     'uber-to-airport'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">1 PDF · 1 page</span>
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
                  Expense-ready
                </span>
              </div>
              <ReceiptMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the image',         'Drag a PNG of a single receipt from your screenshot, scanner, or phone. The tool reads its dimensions in the browser — nothing uploads.'],
  ['02', 'Pick page + fit',         'A4 / Letter / A5 / narrow receipt strip / fit-to-image. Optionally add a "Uber to airport · 23 May" caption at the top.'],
  ['03', 'Download',                'One click stamps the image onto the page, with margin and caption, and saves a single-page PDF. Email it straight to expense.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From wallet shot{' '}
              <em className="font-serif font-normal italic text-crimson-300">to PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Expense systems almost always want a PDF, not a PNG. This tool collapses the in-between step: drop a screenshot or scan, pick a page size, download a clean single-page PDF named whatever you want. Thirty seconds, no signup.
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
  { title: '5 page sizes',           desc: 'A4, US Letter, A5, narrow 80mm receipt strip, or fit-to-image (the page resizes to match the photo exactly).' },
  { title: '3 fit modes',             desc: 'Contain (preserve aspect, default), cover (fill page, may crop), or native (place the image at its source pixel size).' },
  { title: 'Auto orientation',        desc: 'For fixed page sizes, the tool picks portrait or landscape based on the image. Tall phone photos go portrait; wide scans go landscape.' },
  { title: 'Caption & date',           desc: 'Optional one-line caption above the image (e.g. "Uber to airport · 23 May 2026") so the recipient knows what the expense is at a glance.' },
  { title: 'Filename footer',          desc: 'Optional small footer with the source filename for audit trails ("which photo did this come from?").' },
  { title: '100% in browser',           desc: 'Image and PDF stay on your machine — read locally, rendered locally via jsPDF, saved locally. No upload, no third-party API.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for solo expenses</Eyebrow>
          <SectionTitle>
            One receipt{' '}
            <em className="font-serif font-normal italic text-crimson-300">— one click.</em>
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
  { q: 'How is this different from "Receipt Image to PDF"?',              a: 'Receipt Image to PDF is the multi-receipt batch packer — drop 30 photos and get one PDF with a cover sheet, manifest, and one receipt per page. PNG Receipt to PDF is the single-receipt fast lane: one image in, one PDF out, minimal config. Use the batch tool for end-of-month expense packs; use this one when you need to PDF a single receipt fast.' },
  { q: 'What image formats are supported?',                              a: 'PNG is the primary input and keeps full pixel quality — best for screenshots, scans, and any receipt you want to preserve losslessly. JPG / JPEG also work for phone photos. WebP works in most browsers. HEIC (iPhone default) works only in browsers that decode it natively — Safari on macOS / iOS.' },
  { q: 'Why is the output bigger than my source PNG?',                   a: 'PDF adds page metadata and the image gets re-embedded (not just renamed). PNG is already lossless, so the embed preserves quality — the output is typically a similar size to the source. If file size matters, run the output through the Compress Invoice PDFs tool to re-encode with light JPEG compression.' },
  { q: 'Which page size should I pick?',                                 a: 'A4 is the safest default — universal expense system compatibility, looks normal printed. Receipt strip (80mm × 297mm) is great for narrow till receipts that would waste a lot of A4 paper. Fit-to-image when you want a PDF that\'s exactly the receipt with no whitespace (compact archives).' },
  { q: 'Does the caption show on the output?',                           a: 'Yes — it prints as a single line at the top of the page above the image. Optional date appends with a centre-dot separator. Toggle the caption off entirely if you just want the receipt and nothing else.' },
  { q: 'Does my data leave the browser?',                                a: 'Never. Image, dimensions, and the assembled PDF stay on your machine. The tool reads the file via FileReader, places it onto a jsPDF page locally, and triggers the download via the standard mechanism. No upload, no API, no logging.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">single-receipt PDFs.</em>
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
  { name: 'Receipt Image to PDF',   desc: 'Batch many receipts into one ordered packet.',    Icon: ReceiptIcon,  label: 'CONVERT', path: '/tools/receipt-image-to-pdf' },
  { name: 'Expense Report Generator', desc: 'Build a manager-ready expense report PDF.',     Icon: ReceiptIcon,  label: 'DOCUMENTS', path: '/tools/expense-report-generator' },
  { name: 'Merge Financial PDFs',   desc: 'Combine the receipt PDF with other docs.',         Icon: MergeIcon,    label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Compress Invoice PDFs',  desc: 'Shrink the receipt PDF for email-sending.',        Icon: CompressIcon, label: 'PDF', path: '/tools/compress-invoice-pdfs' },
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

export default function PngReceiptToPdfPage() {
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
