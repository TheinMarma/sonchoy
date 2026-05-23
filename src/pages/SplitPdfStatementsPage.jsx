import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  SplitIcon, MergeIcon, CompressIcon, ReorderIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  SPLIT_MODES, QUALITY_PRESETS,
  findSplitMode, findQuality,
  resolveRanges, computeTotals, formatBytes,
} from '../lib/split-pdf/compute'
import { splitPdf, probePdf } from '../lib/split-pdf/splitPdf'
import { generateSplitManifestXlsx } from '../lib/split-pdf/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Split PDF Statements"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['4',     'Split modes'],
  ['Range', 'Per-month labels'],
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
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-convert">PDF</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Split PDF Statements</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            PDF · Split
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            One long statement{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              into
            </em>
            <br />
            many neat{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              files.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Break a long bank statement, GST return, or report PDF into per-month, per-account, or per-page files. Pick page ranges with friendly labels, split evenly into N parts, or one PDF per page. Everything runs in your browser.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Live range preview</span>
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
function NumberInput({ label, value, onChange, suffix, min, max, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input type="number" inputMode="numeric" step="1"
          min={min} max={max}
          value={value ?? 0}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Math.max(min ?? -Infinity, Math.min(max ?? Infinity, Number(e.target.value) || 0)))}
          className={`${inputClass} text-right font-mono ${suffix ? 'pr-12' : ''}`} />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-500">{suffix}</span>
        )}
      </div>
    </div>
  )
}
function TextareaInput({ label, value, onChange, placeholder, rows = 4, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} min-h-[100px] resize-y leading-[1.45] font-mono text-[11.5px]`} />
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
      <SplitIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Bank statements, GST returns, ledgers, packets — anything</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  splitModeId: 'ranges',
  qualityId:   'medium',
  rangesText:  '1-10: Apr 2026\n11-20: May 2026\n21-30: Jun 2026',
  evenParts:   3,
  everyN:      10,
  includePageNumbers: true,
  baseName:    'statement',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)         // { name, size, pages? }
  const [fileObj, setFileObj] = useState(null)   // raw File ref (kept separately so we don't re-render its bytes)
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)

  const handlePick = useCallback(async (raw) => {
    setFileObj(raw)
    setFile({ name: raw.name, size: raw.size, pages: null })
    setProgress({ stage: 'probing', pct: 5, message: `Reading ${raw.name}…` })
    try {
      const info = await probePdf(raw)
      setFile({ name: raw.name, size: raw.size, pages: info.pages })
      setProgress(null)
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: `Could not read PDF: ${err?.message || err}` })
    }
  }, [])

  const handleClear = () => { setFile(null); setFileObj(null); setProgress(null) }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => { setData(INITIAL); setProgress(null) }

  const totalPages = file?.pages || 0
  const resolved = useMemo(() => resolveRanges(data, totalPages), [data, totalPages])
  const totals = useMemo(() => computeTotals(resolved.ranges), [resolved.ranges])
  const mode = findSplitMode(data.splitModeId)
  const quality = findQuality(data.qualityId)

  const handleSplit = async () => {
    if (!fileObj || resolved.ranges.length === 0 || busy) return
    setBusy(true); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      await splitPdf(fileObj, resolved.ranges, data, (p) => setProgress(p))
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const handleXlsx = () => {
    if (resolved.ranges.length === 0) return
    generateSplitManifestXlsx(data, resolved.ranges, {
      name: file?.name,
      pages: file?.pages,
      size: formatBytes(file?.size || 0),
    })
  }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <SplitIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Split · {totals.files || '—'} file{totals.files === 1 ? '' : 's'} · {totals.pages || '—'} page{totals.pages === 1 ? '' : 's'}
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* Source PDF */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Source PDF</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        <div className="my-3.5 h-px bg-line" />

        {/* Split mode */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">How to split</span>
        <SelectInput label="Mode" value={data.splitModeId} onChange={setField('splitModeId')}
          options={SPLIT_MODES.map((m) => ({ value: m.id, label: `${m.label} — ${m.desc}` }))} />

        {mode.id === 'ranges' && (
          <div className="mt-2 space-y-2">
            <TextareaInput
              label="Ranges (one per line — supports labels and 'end')"
              value={data.rangesText}
              onChange={setField('rangesText')}
              placeholder="1-10: Apr 2026&#10;11-20: May 2026&#10;21-end: Jun 2026"
              rows={5}
            />
            <p className="m-0 font-mono text-[10px] text-ink-500">
              Formats: <span className="text-ink-700">1-12</span>, <span className="text-ink-700">5</span>, <span className="text-ink-700">1-12: Jan 2026</span>, <span className="text-ink-700">20-end</span>
            </p>
          </div>
        )}
        {mode.id === 'even' && (
          <div className="mt-2">
            <NumberInput label="Split into N parts" value={data.evenParts} onChange={setField('evenParts')} suffix="parts" min={1} max={50} />
          </div>
        )}
        {mode.id === 'every_n' && (
          <div className="mt-2">
            <NumberInput label="Pages per part" value={data.everyN} onChange={setField('everyN')} suffix="pages" min={1} max={500} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Rendering */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Rendering &amp; naming</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Quality" value={data.qualityId} onChange={setField('qualityId')}
            options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
          <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
        </div>
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
          Files save as <span className="text-ink-700">{data.baseName || 'split'}__01__&lt;label&gt;.pdf</span> and so on.
        </p>
        <div className="mt-2 space-y-2">
          <ToggleRow label="Page numbers on each part" desc="Footer on every output page"
            checked={data.includePageNumbers} onChange={setField('includePageNumbers')} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Resolved ranges preview */}
        {resolved.ranges.length > 0 && (
          <div className="mb-3 rounded-lg border border-line bg-canvas">
            <p className="m-0 px-3 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
              Plan · {resolved.ranges.length} file{resolved.ranges.length === 1 ? '' : 's'}
            </p>
            <div className="max-h-[200px] overflow-y-auto px-3 pb-3 pt-2">
              <table className="w-full text-[10.5px]">
                <thead>
                  <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">
                    <th className="py-1 font-normal">#</th>
                    <th className="py-1 font-normal">Label</th>
                    <th className="py-1 text-right font-normal">Pages</th>
                    <th className="py-1 text-right font-normal">Range</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {resolved.ranges.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1 text-ink-500">{i + 1}</td>
                      <td className="py-1 text-ink-950 truncate max-w-[160px]">{r.label}</td>
                      <td className="py-1 text-right text-ink-700">{r.end - r.start + 1}</td>
                      <td className="py-1 text-right text-ink-500">{r.start}–{r.end}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {resolved.errors.length > 0 && (
          <div className="mb-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[10.5px] text-warning">
            ⚠  {resolved.errors.length} range warning{resolved.errors.length === 1 ? '' : 's'}
            <ul className="m-0 mt-1 list-none pl-0 text-[10px]">
              {resolved.errors.slice(0, 5).map((e, i) => (<li key={i}>· {e}</li>))}
              {resolved.errors.length > 5 && <li>· + {resolved.errors.length - 5} more</li>}
            </ul>
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

        {/* Totals */}
        <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Source pages</span>
            <span className="text-ink-950">{totalPages || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Output files</span>
            <span className="text-ink-950">{totals.files || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Total output pages</span>
            <span className="text-ink-950">{totals.pages || '—'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Mode</span>
            <span className="font-mono text-[12px] font-bold text-convert">{mode.label}</span>
          </div>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {quality.label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {totals.files} file{totals.files === 1 ? '' : 's'}
          </div>
        </div>

        <button type="button" onClick={handleSplit}
          disabled={busy || !fileObj || resolved.ranges.length === 0}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Splitting…' : `Split into ${totals.files} file${totals.files === 1 ? '' : 's'}`}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx}
          disabled={busy || resolved.ranges.length === 0}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          Export plan XLSX <ArrowRight size={10} />
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

function SplitMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">HDFC bank statement</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">Apr–Jun 2026 · 30 pages</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">→ 3 output files</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">SPLIT PLAN</p>
        <div className="mt-1 overflow-hidden rounded border border-line">
          <div className="grid grid-cols-[20px_1fr_50px_50px] gap-1 bg-canvas px-1.5 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-convert">
            <span>#</span>
            <span>LABEL</span>
            <span className="text-right">PAGES</span>
            <span className="text-right">RANGE</span>
          </div>
          {[
            ['1', 'Apr 2026', '10', '1–10'],
            ['2', 'May 2026', '10', '11–20'],
            ['3', 'Jun 2026', '10', '21–30'],
          ].map((r) => (
            <div key={r[0]} className="grid grid-cols-[20px_1fr_50px_50px] gap-1 border-t border-line px-1.5 py-1 font-mono text-[8.5px] text-ink-900">
              <span className="text-ink-500">{r[0]}</span>
              <span>{r[1]}</span>
              <span className="text-right">{r[2]}</span>
              <span className="text-right text-ink-500">{r[3]}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">OUTPUT FILES</p>
        <div className="mt-1 space-y-1 font-mono text-[9px]">
          <div className="rounded border border-line bg-canvas px-2 py-1 text-ink-950">statement__01__Apr-2026.pdf</div>
          <div className="rounded border border-line bg-canvas px-2 py-1 text-ink-950">statement__02__May-2026.pdf</div>
          <div className="rounded border border-line bg-canvas px-2 py-1 text-ink-950">statement__03__Jun-2026.pdf</div>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ matching XLSX plan with the same labels and page ranges</p>
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
            One PDF in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            many labelled files out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Pick ranges with friendly labels (Apr 2026, May 2026, …) or auto-split evenly. The tool builds a plan you can preview, then saves one PDF per range — file names are auto-numbered and slug-safe.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <SplitIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Split Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Ranges · 3 parts
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',    'HDFC statement · 30 pages'],
                  ['Mode',          'Custom page ranges'],
                  ['Ranges',        '1-10, 11-20, 21-30'],
                  ['Labels',        'Apr · May · Jun 2026'],
                  ['Quality',       'Standard (1.5×)'],
                  ['Page numbers',  'On (per part)'],
                  ['File-name base', 'statement'],
                  ['Output',        '3 PDFs + XLSX plan'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">3 files</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Ready
                </span>
              </div>
              <SplitMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the PDF',          'Drag a long bank statement, GST return, or report into the picker. The tool reads its page count in the browser — nothing uploads.'],
  ['02', 'Choose how to split',    'Custom ranges with month labels (1-12: Jan 2026), even N parts, every N pages, or one PDF per page. The plan preview updates live.'],
  ['03', 'Save the slices',        'One click renders each range as its own PDF, named like statement__01__Apr-2026.pdf. Optional XLSX manifest with the full plan for your records.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From one big PDF{' '}
              <em className="font-serif font-normal italic text-crimson-300">to a tidy folder.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Banks like to send 12 months of statements as a single 200-page PDF. Auditors and accountants like one file per month. This tool bridges the gap: paste a range list, get cleanly-labelled monthly files in under a minute.
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
  { title: '4 split modes',           desc: 'Custom ranges (with labels), even N parts, every N pages, or one PDF per page. Pick the one that matches the document\'s structure.' },
  { title: 'Per-month labels',         desc: 'Ranges accept "1-12: Jan 2026" syntax. The label slug becomes part of the output filename — no manual renaming after.' },
  { title: '"end" keyword',            desc: 'Use "20-end" instead of counting to the last page. The tool resolves "end" against the actual page count automatically.' },
  { title: 'Live plan preview',         desc: 'As you type ranges, see the resolved plan with file count, page count, and per-range labels. Parse warnings surface inline.' },
  { title: 'Quality presets',           desc: 'Draft (small file size), Standard (good default), High, and Print (sharpest for physical printing). Same trade-offs as the merge tool.' },
  { title: 'XLSX manifest',             desc: 'Optional spreadsheet listing the source file, every output range, page count, and the predicted filename. Great for handoff to accounting.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for monthly splits</Eyebrow>
          <SectionTitle>
            Slice{' '}
            <em className="font-serif font-normal italic text-crimson-300">— by your rules.</em>
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
  { q: 'Is the text searchable in the split PDFs?',              a: 'In this tool, no — each page is rasterised to a JPEG before being written into the output PDF (same approach as the Merge tool, for the same reasons). If you need text-searchable output, run OCR after splitting, or open each part in a PDF editor that supports text recognition.' },
  { q: 'How big are the output files?',                          a: 'Roughly proportional to page count × the chosen quality scale squared. Standard (1.5×) typically yields ~80–120 KB per page. A 10-page monthly statement is around 1 MB; a 30-page quarterly statement is around 3 MB at Standard quality.' },
  { q: 'What happens if my ranges overlap or skip pages?',       a: 'Overlapping ranges are allowed — the same page can appear in two output files. Skipped pages are also fine — pages not covered by any range simply aren\'t included in any output file. The plan preview shows exactly what each output file will contain so you can confirm before splitting.' },
  { q: 'Why are downloads spaced out?',                           a: 'Browsers tend to block "popup bursts" — if many downloads fire in a single tick, the browser flags it as suspicious and only allows the first one. The tool paces downloads ~180 ms apart so all parts save reliably without prompting the user. For 10+ parts, this means a few seconds of staggered saving.' },
  { q: 'What\'s in the XLSX manifest?',                          a: 'Two sheets. Summary: source filename, page count, size, mode, quality, output file count, total output pages. Plan: one row per output file with #, label, start page, end page, page count, and the predicted filename — perfect to hand to your accountant alongside the split files.' },
  { q: 'Does my data leave the browser?',                        a: 'Never. The source PDF is read into memory, page-rasterised, and re-emitted as new PDFs — all in your browser, using the same PDF stack that powers the rest of Sonchoy. No upload step, no server round-trip, no logging.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">splitting PDFs.</em>
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
  { name: 'Merge Financial PDFs',  desc: 'Reverse: combine many PDFs into one packet.',         Icon: MergeIcon,     label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Compress Invoice PDFs', desc: 'Shrink the split files for email-sending.',           Icon: CompressIcon,  label: 'PDF' },
  { name: 'Reorder PDF Pages',     desc: 'Rearrange pages before splitting.',                   Icon: ReorderIcon,   label: 'PDF' },
  { name: 'Bank Statement → Excel', desc: 'Extract transaction tables from each split file.',    Icon: ExportIcon,    label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
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

export default function SplitPdfStatementsPage() {
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
