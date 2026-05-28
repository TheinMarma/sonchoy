'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  MergeIcon, SplitIcon, CompressIcon, ReorderIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  PAGE_SIZES, QUALITY_PRESETS, COVER_MODES, ORIENTATIONS,
  findQuality,
  formatBytes, computeTotals,
} from '@/lib/merge-pdfs/compute'
import { mergePdfs, probePdf } from '@/lib/merge-pdfs/mergePdfs'

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
    <div role="dialog" aria-modal="true" aria-label="Merge Financial PDFs"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[680px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Unlimited', 'Files per merge'],
  ['Local',     '100% in browser'],
  ['Cover',     'Auto-generated TOC'],
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
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-convert">PDF</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Merge Financial PDFs</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            PDF · Combine
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Many PDFs in,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              one tidy
            </em>
            <br />
            packet{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Combine invoices, statements, reports, and receipts into a single send-ready packet. Drag in any number of PDFs, reorder, optionally add a branded cover sheet with a table of contents, and download.
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

/* ---------- File list ---------- */

let nextFileId = 1

function FileList({ entries, onAddFiles, onRemove, onMove }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files || [])
    if (dropped.length) onAddFiles(dropped)
  }, [onAddFiles])

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
          accept="application/pdf,.pdf"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (files.length) onAddFiles(files)
            e.target.value = ''
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Add PDF files"
        />
        <MergeIcon />
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">
          Drop PDFs here or click to browse
        </p>
        <p className="m-0 text-[11px] text-ink-500">Add as many as you need · they merge in the order shown</p>
      </div>

      {entries.length > 0 && (
        <div className="mt-3 max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
          {entries.map((f, i) => (
            <div key={f.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-2 rounded-md border border-line bg-paper px-2 py-1.5">
              <span className="text-center font-mono text-[10px] text-ink-500">{i + 1}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12px] font-medium text-ink-950">{f.name}</span>
                  {f.status === 'probing' && <span className="font-mono text-[9px] uppercase text-ink-500">reading…</span>}
                  {f.status === 'error'   && <span className="font-mono text-[9px] uppercase text-danger">read failed</span>}
                </div>
                <div className="font-mono text-[10px] text-ink-500">
                  {f.pages != null ? `${f.pages} page${f.pages === 1 ? '' : 's'}` : '—'}  ·  {formatBytes(f.size)}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} aria-label="Move up"
                  className="flex h-6 w-6 items-center justify-center rounded text-ink-500 transition-colors hover:bg-canvas hover:text-ink-950 disabled:opacity-30">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2l3 4H2z" fill="currentColor" /></svg>
                </button>
                <button type="button" onClick={() => onMove(i, 1)} disabled={i === entries.length - 1} aria-label="Move down"
                  className="flex h-6 w-6 items-center justify-center rounded text-ink-500 transition-colors hover:bg-canvas hover:text-ink-950 disabled:opacity-30">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8L2 4h6z" fill="currentColor" /></svg>
                </button>
                <button type="button" onClick={() => onRemove(f.id)} aria-label="Remove"
                  className="flex h-6 w-6 items-center justify-center rounded text-ink-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Generator panel ---------- */

const INITIAL_OPTIONS = {
  title: 'Q1 2026 — Financial packet',
  subtitle: 'Invoices, bank statements, and management report',
  preparedBy: 'Sonchoy Studio · Finance team',
  preparedDate: todayISO(),

  pageSizeId: 'auto',
  qualityId: 'medium',
  coverModeId: 'toc',
  orientationId: 'auto',
  includePageNumbers: true,
  includeFileBreaks: true,
}

function GeneratorPanel() {
  const [entries, setEntries] = useState([])  // [{ id, name, size, pages, file, status }]
  const [options, setOptions] = useState(INITIAL_OPTIONS)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)

  const totals = useMemo(() => computeTotals(entries), [entries])

  const addFiles = useCallback(async (files) => {
    const pdfFiles = files.filter((f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf')
    if (pdfFiles.length === 0) return
    const newEntries = pdfFiles.map((file) => ({
      id: nextFileId++,
      name: file.name,
      size: file.size,
      pages: null,
      file,
      status: 'probing',
    }))
    setEntries((prev) => [...prev, ...newEntries])
    // Probe each in parallel; update as they resolve.
    for (const e of newEntries) {
      try {
        const info = await probePdf(e.file)
        setEntries((prev) => prev.map((x) => x.id === e.id ? { ...x, pages: info.pages, status: 'ready' } : x))
      } catch {
        setEntries((prev) => prev.map((x) => x.id === e.id ? { ...x, status: 'error' } : x))
      }
    }
  }, [])

  const removeFile = (id) => setEntries((prev) => prev.filter((f) => f.id !== id))
  const moveFile = (index, delta) => setEntries((prev) => {
    const next = [...prev]
    const target = index + delta
    if (target < 0 || target >= next.length) return prev
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
  const reset = () => { setEntries([]); setOptions(INITIAL_OPTIONS); setProgress(null) }
  const setOpt = (k) => (v) => setOptions((s) => ({ ...s, [k]: v }))

  const handleMerge = async () => {
    if (entries.length === 0 || busy) return
    setBusy(true); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      await mergePdfs(
        entries.filter((e) => e.status !== 'error').map((e) => e.file),
        options,
        (p) => setProgress(p),
      )
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err && err.message ? err.message : err) })
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
              <MergeIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Merge · {totals.count} file{totals.count === 1 ? '' : 's'} · {totals.pages || '—'} page{totals.pages === 1 ? '' : 's'}
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* File list */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Source PDFs</span>
        <FileList
          entries={entries}
          onAddFiles={addFiles}
          onRemove={removeFile}
          onMove={moveFile}
        />

        <div className="my-3.5 h-px bg-line" />

        {/* Cover sheet */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Cover sheet</span>
        <div className="space-y-2">
          <SelectInput label="Cover mode" value={options.coverModeId} onChange={setOpt('coverModeId')}
            options={COVER_MODES.map((c) => ({ value: c.id, label: c.label }))} />
          {options.coverModeId !== 'none' && (
            <>
              <TextInput label="Packet title" value={options.title} onChange={setOpt('title')} />
              <TextInput label="Subtitle (optional)" value={options.subtitle} onChange={setOpt('subtitle')} />
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Prepared by" value={options.preparedBy} onChange={setOpt('preparedBy')} />
                <DateInput label="Prepared date" value={options.preparedDate} onChange={setOpt('preparedDate')} />
              </div>
            </>
          )}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Rendering */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Rendering</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Page size" value={options.pageSizeId} onChange={setOpt('pageSizeId')}
            options={PAGE_SIZES.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectInput label="Orientation" value={options.orientationId} onChange={setOpt('orientationId')}
            options={ORIENTATIONS.map((o) => ({ value: o.id, label: o.label }))} />
        </div>
        <div className="mt-2">
          <SelectInput label="Quality" value={options.qualityId} onChange={setOpt('qualityId')}
            options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
        </div>
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
          Higher quality = sharper text + larger file. Standard is fine for most financial docs.
        </p>

        <div className="my-3.5 h-px bg-line" />

        {/* Extras */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Extras</span>
        <div className="space-y-2">
          <ToggleRow label="Page numbers" desc="Footer on every output page"
            checked={options.includePageNumbers} onChange={setOpt('includePageNumbers')} />
          <ToggleRow label="Divider pages between files" desc="Lightweight break between source PDFs"
            checked={options.includeFileBreaks} onChange={setOpt('includeFileBreaks')} />
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
              <div
                className={`h-full transition-[width] ${progress.stage === 'error' ? 'bg-danger' : 'bg-convert'}`}
                style={{ width: `${Math.max(2, Math.min(100, progress.pct))}%` }}
              />
            </div>
            <p className="m-0 mt-1.5 truncate font-mono text-[10px] text-ink-700">{progress.message}</p>
          </div>
        )}

        {/* Totals */}
        <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Files</span>
            <span className="text-ink-950">{totals.count}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Pages</span>
            <span className="text-ink-950">{totals.pages || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Source size</span>
            <span className="text-ink-950">{formatBytes(totals.bytes)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
            <span className="font-mono text-[12px] font-bold text-convert">1 merged PDF</span>
          </div>
        </div>

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Packet</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {findQuality(options.qualityId).label}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[16px] font-semibold text-paper">
            {options.title || 'Merged.pdf'}
          </div>
        </div>

        <button type="button" onClick={handleMerge} disabled={busy || entries.length === 0}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Merging…' : `Merge ${entries.length || ''} PDF${entries.length === 1 ? '' : 's'} → 1 file`}
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
            <p className="m-0 text-[16px] font-bold text-ink-950">Q1 2026 — Financial packet</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">Invoices, bank statements, and management report</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">9 files · 47 pages</p>
            <p className="m-0 mt-1 font-mono text-[9px] text-ink-500">Prepared 23 May 2026</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">TABLE OF CONTENTS</p>
        <div className="mt-1 space-y-1 font-mono text-[10px]">
          {[
            ['1.', 'INV-2026-0041 — Northwind Books.pdf', '3 pp'],
            ['2.', 'INV-2026-0042 — BrightBox Analytics.pdf', '2 pp'],
            ['3.', 'INV-2026-0043 — Lumen Software.pdf', '2 pp'],
            ['4.', 'HDFC bank statement · Mar–May 2026.pdf', '14 pp'],
            ['5.', 'Citi bank statement · Mar–May 2026.pdf', '11 pp'],
            ['6.', 'GST return GSTR-3B · Apr 2026.pdf', '4 pp'],
            ['7.', 'GST return GSTR-3B · May 2026.pdf', '4 pp'],
            ['8.', 'Payroll summary · Apr–May 2026.pdf', '3 pp'],
            ['9.', 'Q1 management report.pdf', '4 pp'],
          ].map(([n, name, pp]) => (
            <div key={n} className="flex items-center justify-between border-b border-line pb-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-ink-500">{n}</span>
                <span className="truncate text-ink-950">{name}</span>
              </div>
              <span className="text-ink-500">{pp}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ each source PDF rendered in full after the cover sheet</p>
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
            Many PDFs in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            one organised packet out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drag in invoices, bank statements, GST returns, payroll summaries, and reports. The tool prepends a branded cover with a table of contents, optionally drops a divider between each source file, and renders every page at your chosen quality.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <MergeIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Merge Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  9 files
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Title',         'Q1 2026 — Financial packet'],
                  ['Subtitle',      'Invoices, statements, GST, report'],
                  ['Source files',  '9 PDFs · 47 source pages'],
                  ['Page size',     'Match source pages'],
                  ['Quality',       'Standard (1.5×)'],
                  ['Cover',         'Cover + table of contents'],
                  ['Page numbers',  'On'],
                  ['Dividers',      'On'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">1 merged PDF</span>
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
                  Packet-ready
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
  ['01', 'Add the PDFs',           'Drag a folder of invoices, bank statements, reports — or click to browse. The tool reads each file\'s page count and size in the browser. Nothing uploads.'],
  ['02', 'Order & label',          'Re-order with up/down arrows. Add a packet title and subtitle for the cover; the table of contents builds automatically from the file order.'],
  ['03', 'Merge & download',       'One click renders every page at your chosen quality, prepends the cover, and saves a single PDF. Drafts get dividers between files; every page gets a footer if you want it.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From scattered PDFs{' '}
              <em className="font-serif font-normal italic text-crimson-300">to one packet.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Auditors, lenders, and boards expect a single PDF — not a folder. Building that packet by hand (open, print-to-PDF, repeat) wastes an afternoon. Drag everything in, pick a title, and download the assembled packet in under a minute. Nothing leaves your browser.
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
  { title: 'Drag & re-order',       desc: 'Drop any number of PDFs at once. Each row shows its filename, page count, and size. Up/down arrows re-order before merging.' },
  { title: 'Branded cover sheet',    desc: 'Auto-generated cover with title, subtitle, prepared-by, date, and a table of contents listing every source file with its page count. Skip if you just want a raw merge.' },
  { title: 'Divider pages',          desc: 'Optional lightweight divider page between each source file ("FILE 2 OF 9 — Citi bank statement…"). Easy navigation in long packets.' },
  { title: 'Quality presets',        desc: 'Draft (small file size), Standard (good default), High, and Print (sharpest for physical printing). Trade file size for fidelity.' },
  { title: 'Page-size normalisation', desc: 'Keep each page at its source size, or scale everything to A4 or US Letter for a uniform look. Force portrait or landscape if you need consistency.' },
  { title: '100% in browser',         desc: 'Files never upload. Merging runs entirely on your machine using the same PDF stack that powers the other Sonchoy tools. Nothing hits a server, ever.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for finance packets</Eyebrow>
          <SectionTitle>
            Tidy{' '}
            <em className="font-serif font-normal italic text-crimson-300">— by default.</em>
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
  { q: 'Is the text searchable in the merged PDF?',                       a: 'In this tool, no — every page is rasterised to a JPEG before being written into the output PDF. That means the merged file is a sequence of images, not text. The trade-off is that merging works uniformly across every kind of source (including scanned, secured, or oddly-encoded PDFs) without needing a second PDF library. If you need a fully-searchable merge, run the source PDFs through an OCR step first or open the merged file in a PDF editor that supports OCR.' },
  { q: 'How big is the output file?',                                     a: 'Roughly proportional to the source page count × the chosen quality scale squared. Standard (1.5×) typically yields ~80–120 KB per page; High (2.0×) ~150–220 KB per page; Print (2.5×) ~250–350 KB per page. For a 50-page packet, Standard is a sensible default that opens quickly in mail clients and previews.' },
  { q: 'What happens with very long PDFs?',                               a: 'The merge engine processes one page at a time and frees memory as it goes, so 200+ page packets work — they just take longer. Watch the progress bar; the rendering stage shows "Page X of N" so you know roughly how long is left.' },
  { q: 'Can I merge password-protected PDFs?',                            a: 'Only if the password is the open password and the PDF allows content extraction. If the PDF is fully locked, the read step fails and the file is marked as "read failed" in the list — remove it or unlock it before merging. The PDF Unlock tool can help if you have the password.' },
  { q: 'Does my data leave the browser?',                                 a: 'Never. Every step (file read, page rasterisation, output assembly) runs in your browser using JavaScript libraries that ship in the page bundle. The merged PDF is generated as a Blob in memory and saved via the browser\'s normal "Save File" mechanism. Nothing is uploaded to Sonchoy or any third party.' },
  { q: 'What\'s on the cover sheet?',                                     a: 'Packet title (large), optional subtitle, prepared-by name, prepared-date, the total file count and source page count, and a numbered list of every file with its page count (this becomes a "table of contents" with the right option enabled). Skip the cover entirely if you want a no-frills merge.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">PDF merging.</em>
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
  { name: 'Invoice PDF Exporter',   desc: 'Bulk-generate then merge invoices into one batch.',     Icon: ExportIcon,    label: 'INVOICING', path: '/tools/invoice-pdf-exporter' },
  { name: 'Split PDF Statements',   desc: 'Reverse: cut one PDF into per-month files.',             Icon: SplitIcon,     label: 'PDF' },
  { name: 'Compress Invoice PDFs',  desc: 'Shrink a merged packet for email-sending.',              Icon: CompressIcon,  label: 'PDF' },
  { name: 'Reorder PDF Pages',      desc: 'Rearrange pages inside an existing PDF.',                Icon: ReorderIcon,   label: 'PDF' },
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

export default function MergeFinancialPdfsTool() {
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
