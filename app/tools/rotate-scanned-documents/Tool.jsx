'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  RotateIcon, MergeIcon, SplitIcon, CompressIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  QUALITY_PRESETS, ROTATION_OPTIONS, PAGE_SELECTIONS,
  findQuality, findRotation, findPageSelection,
  parseRanges, resolveRotations, countRotatedPages, formatBytes,
} from '@/lib/rotate-pdf/compute'
import { rotatePdf, probePdfWithThumbs } from '@/lib/rotate-pdf/rotatePdf'

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
    <div role="dialog" aria-modal="true" aria-label="Rotate Scanned Documents"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['4',     'Rotation steps'],
  ['Per',   'Page or batch'],
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
            <span className="text-ink-950">Rotate Scanned Documents</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            PDF · Rotate
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Sideways scan in,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              upright PDF
            </em>
            <br />
            {' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Fix scanned PDFs that came out sideways or upside-down. Rotate all pages 90° / 180° / 270°, or pick which pages need rotating with per-page thumbnail controls. Output downloads as a fresh PDF — original stays untouched.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Per-page thumbnails</span>
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
function TextareaInput({ label, value, onChange, placeholder, rows = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} min-h-[80px] resize-y leading-[1.45] font-mono text-[11.5px]`} />
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

/* ---------- Pill group for rotation ---------- */

function RotationPills({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {ROTATION_OPTIONS.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onChange(r.id)}
          className={`rounded-md border px-1 py-2 font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors ${
            Number(value) === r.id
              ? 'border-convert bg-convert-bg text-convert'
              : 'border-line bg-paper text-ink-700 hover:border-line-strong'
          }`}
        >
          {r.short}
        </button>
      ))}
    </div>
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
      <RotateIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Scanned, sideways, upside-down — fix it in seconds</p>
    </div>
  )
}

/* ---------- Per-page thumbnail grid ---------- */

function ThumbGrid({ thumbs, rotations, onCycle }) {
  return (
    <div className="max-h-[420px] overflow-y-auto rounded-lg border border-line bg-canvas p-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {thumbs.map((t) => {
          const rot = rotations[t.pageNum] || 0
          return (
            <button
              key={t.pageNum}
              type="button"
              onClick={() => onCycle(t.pageNum)}
              className={`group relative cursor-pointer rounded-md border bg-paper transition-all ${
                rot !== 0 ? 'border-convert ring-2 ring-convert/40' : 'border-line hover:border-convert/60'
              }`}
              title={`Page ${t.pageNum} — currently ${rot}°. Click to rotate +90°.`}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-t-md bg-ink-50">
                <img
                  src={t.dataUrl}
                  alt={`Page ${t.pageNum}`}
                  className="h-full w-full object-contain transition-transform"
                  style={{ transform: `rotate(${rot}deg)` }}
                  draggable={false}
                />
              </div>
              <div className="flex items-center justify-between px-1.5 py-1 font-mono text-[10px]">
                <span className="text-ink-500">p {t.pageNum}</span>
                <span className={rot !== 0 ? 'text-convert font-bold' : 'text-ink-500'}>{rot}°</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  rotation: 90,                        // applied when pageSelectionId !== per_page
  pageSelectionId: 'all',
  pageRangesText: '',
  perPageRotations: {},                // { pageNum: rotation }
  qualityId: 'medium',
  baseName: '',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)
  const [fileObj, setFileObj] = useState(null)
  const [thumbs, setThumbs] = useState([])
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  const handlePick = useCallback(async (raw) => {
    setFileObj(raw); setResult(null); setThumbs([])
    setData((s) => ({ ...s, baseName: raw.name.replace(/\.pdf$/i, ''), perPageRotations: {} }))
    setFile({ name: raw.name, size: raw.size, pages: null })
    setProgress({ stage: 'thumbs', pct: 4, message: `Reading ${raw.name}…` })
    try {
      const info = await probePdfWithThumbs(raw, (p) => setProgress(p))
      setThumbs(info.thumbs)
      setFile({ name: raw.name, size: raw.size, pages: info.pages })
      setProgress(null)
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: `Could not read PDF: ${err?.message || err}` })
    }
  }, [])

  const handleClear = () => {
    setFile(null); setFileObj(null); setThumbs([]); setProgress(null); setResult(null)
    setData(INITIAL)
  }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))

  const reset = () => {
    setData({ ...INITIAL, baseName: file?.name?.replace(/\.pdf$/i, '') || '' })
    setProgress(null); setResult(null)
  }

  /* Per-page: clicking a thumb cycles 0 → 90 → 180 → 270 → 0 */
  const cyclePageRotation = (pageNum) => setData((s) => {
    const cur = Number(s.perPageRotations?.[pageNum]) || 0
    const next = (cur + 90) % 360
    const map = { ...(s.perPageRotations || {}) }
    if (next === 0) delete map[pageNum]
    else            map[pageNum] = next
    return { ...s, perPageRotations: map }
  })

  /* Quick presets that operate on per-page mode */
  const applyToAll = (deg) => setData((s) => {
    const map = {}
    for (let i = 1; i <= (file?.pages || 0); i++) if (deg !== 0) map[i] = deg
    return { ...s, perPageRotations: map }
  })
  const clearAll = () => setData((s) => ({ ...s, perPageRotations: {} }))

  /* Custom-range warnings */
  const customRangeErrors = useMemo(() => {
    if (data.pageSelectionId !== 'custom' || !file?.pages) return []
    return parseRanges(data.pageRangesText, file.pages).errors
  }, [data.pageSelectionId, data.pageRangesText, file])

  /* Resolved rotation map (preview + counts) */
  const resolution = useMemo(
    () => file?.pages ? resolveRotations(data, file.pages) : { map: new Map(), errors: [] },
    [data, file]
  )
  const rotatedCount = countRotatedPages(resolution.map)
  const rotation = findRotation(data.rotation)
  const pageSel = findPageSelection(data.pageSelectionId)
  const quality = findQuality(data.qualityId)

  /* Sync per-page UI with simple-mode selections: when the user is in
     per-page mode, the per-thumb badges and rotation map are the source
     of truth. When in simple mode, the resolution map already reflects
     the chosen selection + single rotation. */
  const effectiveRotations = useMemo(() => {
    const out = {}
    for (const [k, v] of resolution.map.entries()) out[k] = v
    return out
  }, [resolution])

  const handleRotate = async () => {
    if (!fileObj || rotatedCount === 0 || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await rotatePdf(fileObj, data, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <RotateIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Rotate · {file?.pages || '—'} pages · {rotatedCount || '—'} to rotate
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

        {file && (
          <>
            <div className="my-3.5 h-px bg-line" />

            {/* Mode picker */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Which pages to rotate</span>
            <SelectInput label="Selection" value={data.pageSelectionId} onChange={setField('pageSelectionId')}
              options={PAGE_SELECTIONS.map((p) => ({ value: p.id, label: p.label }))} />

            {/* Simple-mode rotation */}
            {data.pageSelectionId !== 'per_page' && (
              <div className="mt-3">
                <span className={labelClass}>Rotation</span>
                <div className="mt-1.5">
                  <RotationPills value={data.rotation} onChange={setField('rotation')} />
                </div>
                <p className="m-0 mt-1.5 font-mono text-[10px] text-ink-500">
                  Will rotate <span className="text-convert">{rotatedCount}</span> of {file?.pages || '—'} pages by {rotation.short}.
                </p>
              </div>
            )}

            {/* Custom ranges */}
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

            {/* Per-page picker */}
            {data.pageSelectionId === 'per_page' && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-500">
                    Click any tile to cycle 0° → 90° → 180° → 270°
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => applyToAll(90)}
                      className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700 hover:border-line-strong hover:text-ink-950">
                      All 90°
                    </button>
                    <button type="button" onClick={() => applyToAll(180)}
                      className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700 hover:border-line-strong hover:text-ink-950">
                      All 180°
                    </button>
                    <button type="button" onClick={() => applyToAll(270)}
                      className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700 hover:border-line-strong hover:text-ink-950">
                      All 270°
                    </button>
                    <button type="button" onClick={clearAll}
                      className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-700 hover:border-line-strong hover:text-ink-950">
                      Clear
                    </button>
                  </div>
                </div>
                {thumbs.length > 0 ? (
                  <ThumbGrid
                    thumbs={thumbs}
                    rotations={effectiveRotations}
                    onCycle={cyclePageRotation}
                  />
                ) : (
                  <p className="m-0 font-mono text-[10px] text-ink-500">Thumbnails rendering…</p>
                )}
              </div>
            )}

            <div className="my-3.5 h-px bg-line" />

            {/* Render + naming */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Render &amp; naming</span>
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Quality" value={data.qualityId} onChange={setField('qualityId')}
                options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
              <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
            </div>
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Saves as <span className="text-ink-700">{(data.baseName || 'rotated').replace(/[^a-z0-9-]+/gi, '-')}__rotated.pdf</span>
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
            <span className="text-ink-500">Source pages</span>
            <span className="text-ink-950">{file?.pages || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Pages to rotate</span>
            <span className="text-ink-950">{rotatedCount || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Mode</span>
            <span className="text-ink-950">{pageSel.label}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Rotation</span>
            <span className="font-mono text-[12px] font-bold text-convert">
              {data.pageSelectionId === 'per_page' ? 'Per-page' : rotation.short}
            </span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · rotated</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Rotated pages</span>
              <span className="text-ink-950">{result.rotatedPages} of {result.pages}</span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {quality.label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {file ? `${rotatedCount} of ${file.pages} rotated` : '—'}
          </div>
        </div>

        <button type="button" onClick={handleRotate}
          disabled={busy || !fileObj || rotatedCount === 0}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Rotating…' : `Rotate ${rotatedCount || ''} page${rotatedCount === 1 ? '' : 's'}`}
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

function RotateMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Vendor invoices · April 2026</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">Scanned packet · 12 pages</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">All pages 90° CW</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">PAGE TILES</p>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded border border-convert/40 bg-canvas">
              <div className="aspect-[3/4] rounded-t bg-paper p-1.5">
                <div className="h-full w-full rounded bg-ink-100" style={{ transform: 'rotate(90deg)' }} />
              </div>
              <div className="flex items-center justify-between px-1 py-0.5 font-mono text-[8px]">
                <span className="text-ink-500">p {i + 1}</span>
                <span className="font-bold text-convert">90°</span>
              </div>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ 4 more tiles · per-page mode lets you cycle each page independently</p>
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
            Wonky scan in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            upright PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Apply 90° / 180° / 270° rotation to every page, just odd/even, just first/last, custom ranges, or per page with thumbnail controls. Click a thumbnail to cycle its rotation; the preview updates instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <RotateIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Rotate Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  All · 90°
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'Vendor invoices Apr 2026.pdf'],
                  ['Pages',          '12'],
                  ['Selection',      'Apply to all pages'],
                  ['Rotation',       '90° clockwise'],
                  ['Quality',        'Standard (1.5×)'],
                  ['Output base',    'vendor-invoices-apr-2026'],
                  ['Will rotate',    '12 of 12 pages'],
                  ['Output name',    'vendor-invoices-apr-2026__rotated.pdf'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">Upright PDF</span>
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
                  Upright
                </span>
              </div>
              <RotateMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the PDF',          'Drag a scanned packet of invoices, statements, or receipts. The tool renders a thumbnail of every page so you can see which need rotating.'],
  ['02', 'Pick a mode',            'Apply 90° / 180° / 270° to all pages, odd-only, even-only, first or last, custom ranges, or per-page (click each tile to cycle its rotation).'],
  ['03', 'Save the upright PDF',   'One click renders every page at the chosen quality, rotated to the new orientation, and downloads a fresh PDF. Original file stays exactly as you uploaded it.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From sideways scan{' '}
              <em className="font-serif font-normal italic text-crimson-300">to readable PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most scanned packets come out with at least one rogue page — fed the wrong way, flipped during stapling, captured in landscape when the rest is portrait. Open the PDF, click the wrong tiles to cycle them right, save the fix. Two minutes instead of asking the office for another scan.
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
  { title: '4 rotation steps',          desc: 'Cardinal rotations only: 0° (no change), 90° clockwise, 180° (upside-down fix), 270° (= 90° anti-clockwise). The four steps cover every sideways scan you\'ll see.' },
  { title: '7 selection modes',          desc: 'All pages, odd-only, even-only (great for two-sided scans flipped wrong), first or last page only, custom ranges like "3-5, 8", or per-page with thumbnail cycling.' },
  { title: 'Per-page click-to-cycle',    desc: 'In per-page mode, every tile shows a live thumbnail. Click once for 90°, twice for 180°, three times for 270°, four times back to 0°. The preview rotates instantly.' },
  { title: 'Quick-apply presets',        desc: 'In per-page mode, "All 90°", "All 180°", "All 270°", and "Clear" buttons let you start from a base rotation and tweak the odd page out — much faster than 30 individual clicks.' },
  { title: 'Original PDF untouched',     desc: 'The tool never overwrites the source — it produces a new PDF with the chosen rotations applied. Re-rotate as many times as you like from the same uploaded file.' },
  { title: '100% in browser',             desc: 'PDF, thumbnails, and the rotated output are all generated locally via the same PDF stack used across Sonchoy. No upload, no third-party APIs, nothing logged.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for fixing scans</Eyebrow>
          <SectionTitle>
            Spin pages{' '}
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
  { q: 'Will the page dimensions change after rotation?',                a: 'Only for 90° and 270° rotations — those swap width and height, so an A4 portrait page becomes A4 landscape (and vice versa) in the output PDF. 0° and 180° rotations preserve the original page size. The PDF will open correctly oriented in every viewer because the page itself is the right shape and size, not just the content rotated inside an old shape.' },
  { q: 'Why does my scanner mix portrait and landscape in the same PDF?', a: 'Auto-feeders sometimes capture pages in their physical orientation rather than re-orienting based on content. Two-sided scans are notorious — page 1 lands portrait, page 2 lands portrait-upside-down (because the page came out flipped). The "Odd pages only" or "Even pages only" selection modes are designed exactly for this case: rotate the bad set 180° and leave the others alone.' },
  { q: 'Is the text searchable after rotation?',                          a: 'No — same trade-off as the other PDF utilities. Each page is rasterised to a JPEG before the rotation is applied, so the output is a sequence of page images. The visible content is identical (just oriented correctly), but Ctrl-F won\'t find words. For searchable rotated output, run OCR on the result.' },
  { q: 'Can I rotate by an arbitrary angle (e.g. 7.5° to fix skew)?',     a: 'No — this tool only supports the four cardinal rotations (0° / 90° / 180° / 270°). Fixing scanner skew (where pages are off by a few degrees due to misalignment) requires a different tool — usually an OCR pass with deskew correction. For most scanned documents, deskew matters less than reading direction; this tool fixes the reading-direction problem.' },
  { q: 'How long does it take?',                                          a: 'Roughly the same as the Merge / Compress tools — about 0.3–0.6 seconds per page at Standard quality. A 12-page packet takes ~5 seconds; a 100-page archive takes ~45 seconds. The progress bar shows live "Page X of N" so you know how much is left.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The PDF is read into memory, each page is rendered to a canvas, optionally rotated via a second canvas, and the output is assembled as a new PDF blob — all in your browser. The download is triggered locally via the standard file-save mechanism. Nothing is uploaded to Sonchoy or any third party.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">rotating pages.</em>
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
  { name: 'Merge Financial PDFs',  desc: 'Combine the rotated PDF with other files.',           Icon: MergeIcon,    label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Split PDF Statements',  desc: 'Slice the rotated PDF into per-month files.',          Icon: SplitIcon,    label: 'PDF', path: '/tools/split-pdf-statements' },
  { name: 'Compress Invoice PDFs', desc: 'Shrink the rotated PDF for email-sending.',            Icon: CompressIcon, label: 'PDF', path: '/tools/compress-invoice-pdfs' },
  { name: 'Bank Statement → Excel', desc: 'Extract transactions once the pages are upright.',    Icon: ExportIcon,   label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
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

export default function RotateScannedDocumentsTool() {
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
