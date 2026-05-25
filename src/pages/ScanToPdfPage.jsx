import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Plus,
  ScanIcon, ReceiptIcon, MergeIcon, CompressIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  PAGE_SIZES, FILTER_MODES, QUALITY_PRESETS, SORT_OPTIONS,
  findPageSize, findFilter, findQuality, findSortOption,
  formatBytes,
} from '../lib/scan-to-pdf/compute'
import { buildScanPdf, fileToDataUrl, loadImageSize } from '../lib/scan-to-pdf/buildPdf'
import { applyFilter } from '../lib/scan-to-pdf/compute'

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
    <div role="dialog" aria-modal="true" aria-label="Scan to PDF"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Camera',     'Or gallery upload'],
  ['4',          'Scan filters'],
  ['Local',      '100% in browser'],
  ['Free',       'Always · no signup'],
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
            <span className="text-ink-950">Scan to PDF</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · Camera scanner
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Phone-camera scans{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              into one
            </em>
            <br />
            tidy{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              PDF.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Use your phone camera (or upload existing photos) to capture document pages, apply a scan-style filter — grayscale, black &amp; white, or whiteboard — and stitch every page into a single multi-page PDF. Tap to add the next page; download when done.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Works on phone &amp; desktop</span>
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

/* ---------- Capture controls ---------- */

/* Camera + gallery picker. Mobile browsers honour `capture="environment"`
   on the file input to open the rear camera directly. Desktop browsers
   fall back to a normal file picker (gallery upload still works). */
function CaptureControls({ onAdd }) {
  const camRef = useRef(null)
  const galleryRef = useRef(null)
  return (
    <div className="grid grid-cols-2 gap-2">
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          if (files.length) onAdd(files)
          e.target.value = ''
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          if (files.length) onAdd(files)
          e.target.value = ''
        }}
      />
      <button type="button" onClick={() => camRef.current?.click()}
        className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-convert bg-convert-bg px-3 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-convert transition-colors hover:bg-convert/15">
        <ScanIcon /> Open camera
      </button>
      <button type="button" onClick={() => galleryRef.current?.click()}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-paper px-3 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950">
        <Plus size={14} /> Add from gallery
      </button>
    </div>
  )
}

/* ---------- Capture page grid ---------- */

function CaptureGrid({ pages, filterId, onMove, onRemove }) {
  if (pages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-canvas px-4 py-8 text-center">
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">No pages captured yet</p>
        <p className="m-0 mt-1 text-[11px] text-ink-500">Tap "Open camera" above to capture the first page</p>
      </div>
    )
  }
  return (
    <div className="max-h-[420px] overflow-y-auto rounded-lg border border-line bg-canvas p-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {pages.map((p, i) => (
          <div key={p.id} className="relative rounded-md border border-line bg-paper">
            <div className="aspect-[3/4] overflow-hidden rounded-t-md bg-ink-50">
              <FilteredThumb dataUrl={p.dataUrl} filterId={filterId} alt={`Page ${i + 1}`} />
            </div>
            <div className="flex items-center justify-between px-1.5 py-1 font-mono text-[10px]">
              <span className="text-ink-500">#{i + 1}</span>
              <span className="truncate text-ink-700">{p.width ? `${p.width}×${p.height}` : '—'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-line px-1 py-0.5">
              <div className="flex">
                <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} aria-label="Move up"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-canvas hover:text-ink-950 disabled:opacity-30">
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" onClick={() => onMove(i, 1)} disabled={i === pages.length - 1} aria-label="Move down"
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-canvas hover:text-ink-950 disabled:opacity-30">
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <button type="button" onClick={() => onRemove(p.id)} aria-label="Remove"
                className="flex h-5 w-5 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Tiny thumbnail with the scan filter applied client-side for the live
   preview. We use a small canvas so iteration is fast. */
function FilteredThumb({ dataUrl, filterId, alt }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!dataUrl || !canvasRef.current) return
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    const img = new Image()
    img.onload = () => {
      // Aim for ~120px wide for thumb performance
      const targetW = 160
      const scale = targetW / img.naturalWidth
      c.width = Math.max(40, Math.round(img.naturalWidth * scale))
      c.height = Math.max(40, Math.round(img.naturalHeight * scale))
      ctx.drawImage(img, 0, 0, c.width, c.height)
      applyFilter(ctx, c.width, c.height, filterId)
    }
    img.src = dataUrl
  }, [dataUrl, filterId])
  return <canvas ref={canvasRef} className="h-full w-full object-contain" aria-label={alt} />
}

/* ---------- Initial state ---------- */

const INITIAL = {
  pageSizeId: 'a4',
  filterId:   'bw',
  qualityId:  'medium',
  sortId:     'as_captured',
  baseName:   'scan',
}

let nextPageId = 1

function GeneratorPanel() {
  const [pages, setPages] = useState([])         // [{ id, file, name, size, dataUrl, width, height }]
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  const addFiles = useCallback(async (files) => {
    const imgs = files.filter((f) => f.type?.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(f.name))
    if (imgs.length === 0) return
    const seeds = imgs.map((file) => ({
      id: nextPageId++,
      file,
      name: file.name,
      size: file.size,
      dataUrl: '',
      width: null,
      height: null,
    }))
    setPages((prev) => [...prev, ...seeds])
    for (const e of seeds) {
      try {
        const dataUrl = await fileToDataUrl(e.file)
        const meta = await loadImageSize(dataUrl)
        setPages((prev) => prev.map((x) => x.id === e.id ? { ...x, dataUrl, width: meta.width, height: meta.height } : x))
      } catch {
        setPages((prev) => prev.filter((x) => x.id !== e.id))
      }
    }
  }, [])

  const removePage = (id) => setPages((prev) => prev.filter((p) => p.id !== id))
  const movePage = (i, delta) => setPages((prev) => {
    const next = [...prev]
    const t = i + delta
    if (t < 0 || t >= next.length) return prev
    ;[next[i], next[t]] = [next[t], next[i]]
    return next
  })
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => { setPages([]); setData(INITIAL); setProgress(null); setResult(null) }

  /* Apply sort + filter to the page list before passing to the builder. */
  const orderedPages = useMemo(() => {
    if (data.sortId === 'reverse') return [...pages].reverse()
    return pages
  }, [pages, data.sortId])

  const handleBuild = async () => {
    if (busy || pages.length === 0) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await buildScanPdf(orderedPages, data, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const pageSize = findPageSize(data.pageSizeId)
  const filter = findFilter(data.filterId)
  const quality = findQuality(data.qualityId)
  void findSortOption(data.sortId)

  const totalBytes = useMemo(() => pages.reduce((s, p) => s + (p.size || 0), 0), [pages])

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <ScanIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Scan · {pages.length} page{pages.length === 1 ? '' : 's'} · {formatBytes(totalBytes)}
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* Capture */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Capture pages</span>
        <CaptureControls onAdd={addFiles} />
        <p className="m-0 mt-2 font-mono text-[10px] text-ink-500">
          On phones, "Open camera" launches the rear camera directly. On desktop, it falls back to file picker — use "Add from gallery" instead.
        </p>

        <div className="mt-3">
          <CaptureGrid pages={pages} filterId={data.filterId} onMove={movePage} onRemove={removePage} />
        </div>

        {pages.length > 0 && (
          <>
            <div className="my-3.5 h-px bg-line" />

            {/* Scan filter */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Scan filter</span>
            <SelectInput label="Filter" value={data.filterId} onChange={setField('filterId')}
              options={FILTER_MODES.map((f) => ({ value: f.id, label: f.label }))} />
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Live preview updates instantly. B&amp;W gives the smallest file; colour preserves the source.
            </p>

            <div className="my-3.5 h-px bg-line" />

            {/* Page setup */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Page setup</span>
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Page size" value={data.pageSizeId} onChange={setField('pageSizeId')}
                options={PAGE_SIZES.map((p) => ({ value: p.id, label: p.label }))} />
              <SelectInput label="Quality" value={data.qualityId} onChange={setField('qualityId')}
                options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
            </div>
            <div className="mt-2">
              <SelectInput label="Page order" value={data.sortId} onChange={setField('sortId')}
                options={SORT_OPTIONS.map((s) => ({ value: s.id, label: s.label }))} />
            </div>

            <div className="my-3.5 h-px bg-line" />

            {/* Naming */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">File name</span>
            <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Saves as <span className="text-ink-700">{(data.baseName || 'scan').replace(/[^a-z0-9-]+/gi, '-')}.pdf</span>
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
            <span className="text-ink-500">Pages captured</span>
            <span className="text-ink-950">{pages.length}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Source size</span>
            <span className="text-ink-950">{formatBytes(totalBytes)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Filter</span>
            <span className="text-ink-950">{filter.label.split('(')[0].trim()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Page</span>
            <span className="font-mono text-[12px] font-bold text-convert">{pageSize.label.split('(')[0].trim()} · {quality.label.split('(')[0].trim()}</span>
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
              {pages.length} page{pages.length === 1 ? '' : 's'} · {filter.label.split('(')[0].trim()}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {(data.baseName || 'scan').replace(/[^a-z0-9-]+/gi, '-')}.pdf
          </div>
        </div>

        <button type="button" onClick={handleBuild}
          disabled={busy || pages.length === 0}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Building PDF…' : `Build PDF from ${pages.length || ''} page${pages.length === 1 ? '' : 's'}`}
          <ArrowRight size={14} />
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">100% local · nothing uploaded</span>
          <a href="https://go.sonchoy.com/pdfFiller" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-crimson-300 no-underline hover:text-crimson-400">
            Need OCR? <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Preview ---------- */

function ScanMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">contract-scan.pdf</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">6 pages · A4 · black &amp; white · 980 KB</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Captured 6 times</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">CAPTURED PAGES · B&amp;W FILTER</p>
        <div className="mt-1 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded border border-line bg-canvas">
              <div className="relative aspect-[3/4] rounded-t bg-paper">
                <div className="absolute inset-1 grid gap-[2px]">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="h-[2px] rounded-sm bg-ink-800/40" style={{ width: `${60 + (j * 5) % 35}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between px-1 py-0.5 font-mono text-[8px]">
                <span className="text-ink-500">#{i + 1}</span>
                <span className="text-ink-700">A4</span>
              </div>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">B&amp;W filter crisps up text and shrinks the file 70%+ vs colour</p>
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
            Camera shots in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            tidy scan PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Capture pages with your phone camera (or upload from the gallery), apply a scan-style filter — grayscale, black &amp; white, or whiteboard — and stitch them into one multi-page PDF. The filter applies live; reorder pages before exporting.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <ScanIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Scan Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  6 pages · B&amp;W
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Capture',         'Phone rear camera · 6 pages'],
                  ['Page size',       'A4 portrait'],
                  ['Filter',          'Black &amp; white (document)'],
                  ['Quality',         'Standard (balanced)'],
                  ['Page order',      'As captured'],
                  ['Source size',     '7.2 MB raw'],
                  ['Output base',     'contract-scan'],
                  ['Estimated size',  '~980 KB after filter'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">1 PDF · 6 pages</span>
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
                  Scan-ready
                </span>
              </div>
              <ScanMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Capture or upload',      'On phones, tap "Open camera" to capture each page with the rear camera. On desktop, upload from your gallery or scanner output folder. Add as many pages as you need.'],
  ['02', 'Pick a filter',           'Colour (preserve source), grayscale (smaller file), black &amp; white (crisp document text), or whiteboard (boost brightness + contrast). The thumbnails update live.'],
  ['03', 'Build the PDF',           'One click stitches every captured page into a single multi-page PDF at your chosen page size and quality. Reorder, drop pages, or change the filter before exporting.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From phone shots{' '}
              <em className="font-serif font-normal italic text-crimson-300">to one scan PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most "scanner" apps want a signup and an account. This tool gives you the same outcome — capture pages, apply a scan filter, stitch into a PDF — from the browser, with no upload and no account. Works on a phone with the rear camera; works on a laptop with uploaded images.
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
  { title: 'Direct camera capture',     desc: 'On mobile, the "Open camera" button launches the rear camera straight away (via the file input\'s capture hint). One tap per page; no app install.' },
  { title: '4 scan filters',             desc: 'Colour (preserve source), grayscale (smaller, archive-friendly), black &amp; white (crisp text, ~70% smaller), whiteboard (boosted contrast + brightness for darker captures).' },
  { title: 'Live filter preview',        desc: 'Thumbnails re-render with the chosen filter the moment you switch. No guessing whether B&amp;W will eat the receipt header or boost it.' },
  { title: 'Drag-style reorder',         desc: 'Up / down arrows on each thumbnail rearrange page order before export. Remove accidental captures with one click.' },
  { title: 'Auto orientation',           desc: 'Each captured page picks portrait or landscape based on its dimensions. A4 / Letter / A5 / or fit-to-image page sizes.' },
  { title: '100% in browser',             desc: 'Camera capture, filtering, and PDF assembly all run locally via canvas + jsPDF. No upload, no third-party scanner API, no account.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for fast scans</Eyebrow>
          <SectionTitle>
            Pocket scanner{' '}
            <em className="font-serif font-normal italic text-crimson-300">— in your browser.</em>
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
  { q: 'Does this need camera permission?',                              a: 'No special permission. The "Open camera" button triggers a standard file input with a camera capture hint — mobile OS handles the permission prompt the same as any photo upload. Nothing runs in the background; the camera opens only when you tap.' },
  { q: 'Will it OCR the text in my scans?',                              a: 'No — this tool produces image-based scans (each page is a photo embedded in the PDF). Text isn\'t selectable in the output. For OCR (searchable scans), you\'ll need a follow-up step — the pdfFiller premium tier handles that, or any desktop PDF editor with OCR.' },
  { q: 'Which filter should I use?',                                    a: 'Black &amp; white is the right default for document text — crispens letters and shrinks the file dramatically (often 70%+ vs colour). Whiteboard is for darker captures where the source needs brightness lift. Grayscale is a middle ground. Colour preserves photos / illustrations that need to stay in colour.' },
  { q: 'How big can the output file get?',                              a: 'Depends on filter + page count. A 6-page B&amp;W scan typically lands around 1 MB; a 6-page colour scan more like 4–6 MB. Use the Compress Invoice PDFs tool afterwards if you need to email a large scan packet.' },
  { q: 'Does deskewing / edge detection work?',                          a: 'Not in this tool — it captures and filters but does not auto-detect document edges or correct perspective. For deskew + auto-crop, look at native scanner apps (Adobe Scan, Microsoft Lens, Apple Notes scanner). Once you have a clean scan, drop it into Sonchoy\'s PDF utilities for merging, compressing, or rotating.' },
  { q: 'Does my data leave the browser?',                                a: 'Never. Captured images, applied filters, and the assembled PDF all stay on your machine. The browser triggers the download via the standard mechanism. No upload, no third-party scanner API, no logging.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">camera scanning.</em>
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
  { name: 'Receipt Image to PDF',   desc: 'Pack many phone receipts into a single PDF.',         Icon: ReceiptIcon,  label: 'CONVERT', path: '/tools/receipt-image-to-pdf' },
  { name: 'Merge Financial PDFs',   desc: 'Combine the scan with other PDFs.',                    Icon: MergeIcon,    label: 'PDF',     path: '/tools/merge-financial-pdfs' },
  { name: 'Compress Invoice PDFs',  desc: 'Shrink the scan PDF for email-sending.',               Icon: CompressIcon, label: 'PDF',     path: '/tools/compress-invoice-pdfs' },
  { name: 'Rotate Scanned Documents', desc: 'Fix sideways or upside-down scanned pages.',          Icon: ScanIcon,     label: 'PDF',     path: '/tools/rotate-scanned-documents' },
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

export default function ScanToPdfPage() {
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
