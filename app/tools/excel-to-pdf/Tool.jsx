'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  ExcelToPdfIcon, CsvIcon, PdfToExcelIcon, InvoicePdfIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  PAGE_SIZES, ORIENTATIONS, SHEET_MODES, HEADER_MODES, FIT_MODES, FONT_SIZES,
  findPageSize, findOrientation, findSheetMode, findHeaderMode, findFitMode, findFontSize,
  formatBytes, previewSheet, resolveOrientation,
} from '@/lib/excel-to-pdf/compute'
import { buildExcelPdf, readWorkbook } from '@/lib/excel-to-pdf/buildPdf'

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
    <div role="dialog" aria-modal="true" aria-label="Excel to PDF"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Multi-sheet', 'Workbook supported'],
  ['Auto',        'Fit columns + orient'],
  ['Local',       '100% in browser'],
  ['Free',        'Always · no signup'],
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
            <span className="text-ink-950">Excel to PDF</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · Spreadsheet to PDF
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Lock a spreadsheet{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              into a
            </em>
            <br />
            print-ready{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              PDF.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop an .xlsx, .xls, or .csv file in and the tool renders every sheet onto a clean, fixed-layout PDF — header row in colour, zebra-striped body, auto-fit columns, automatic landscape for wide tables. Email-ready in seconds.
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

function FileDrop({ file, onPick, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files || [])
    const first = dropped.find((f) => /\.(xlsx|xls|csv|tsv)$/i.test(f.name))
    if (first) onPick(first)
  }, [onPick])
  if (file) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2">
        <div className="min-w-0">
          <p className="m-0 truncate text-[12px] font-medium text-ink-950">{file.name}</p>
          <p className="m-0 font-mono text-[10px] text-ink-500">
            {formatBytes(file.size)}
            {file.summary?.length ? `  ·  ${file.summary.length} sheet${file.summary.length === 1 ? '' : 's'}` : ''}
          </p>
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
        accept=".xlsx,.xls,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        onChange={(e) => {
          const first = e.target.files && e.target.files[0]
          if (first) onPick(first)
          e.target.value = ''
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Choose spreadsheet"
      />
      <ExcelToPdfIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a spreadsheet or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">.xlsx · .xls · .csv · .tsv all supported</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  pageSizeId:    'a4',
  orientationId: 'auto',
  sheetModeId:   'all',
  headerModeId:  'first_row',
  fitModeId:     'fit_width',
  fontSizeId:    'md',
  title:         '',
  baseName:      '',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)
  const [fileObj, setFileObj] = useState(null)
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  /* Cache parsed workbook so the preview can re-render instantly when the
     user tweaks header / font / fit options. */
  const [parsed, setParsed] = useState(null)   // { sheets, summary }

  const handlePick = useCallback(async (raw) => {
    setFileObj(raw); setResult(null); setParsed(null)
    setFile({ name: raw.name, size: raw.size, summary: null })
    setData((s) => ({
      ...s,
      baseName: raw.name.replace(/\.[^.]+$/, ''),
      title:    raw.name.replace(/\.[^.]+$/, ''),
    }))
    setProgress({ stage: 'parsing', pct: 8, message: `Reading ${raw.name}…` })
    try {
      const wb = await readWorkbook(raw)
      setParsed(wb)
      setFile({ name: raw.name, size: raw.size, summary: wb.summary })
      setProgress(null)
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: `Could not read spreadsheet: ${err?.message || err}` })
    }
  }, [])

  const handleClear = () => { setFile(null); setFileObj(null); setParsed(null); setResult(null); setProgress(null) }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => {
    setData({
      ...INITIAL,
      baseName: file?.name?.replace(/\.[^.]+$/, '') || '',
      title:    file?.name?.replace(/\.[^.]+$/, '') || '',
    })
    setProgress(null); setResult(null)
  }

  /* Live preview: pick the first non-empty sheet (or by mode) and render
     a small preview table using the chosen header / font / fit settings. */
  const preview = useMemo(() => {
    if (!parsed) return null
    let toPreview = parsed.sheets.filter((s) => s.rows.length > 0)
    if (data.sheetModeId === 'first')  toPreview = toPreview.slice(0, 1)
    if (data.sheetModeId === 'active') toPreview = toPreview.slice(0, 1)
    const first = toPreview[0]
    if (!first) return null
    const { header, body } = previewSheet(first.rows, data.headerModeId, 6, 18)
    const orientation = resolveOrientation(data.orientationId, first.rows[0]?.length || 0)
    return {
      name: first.name,
      orientation,
      header,
      body,
      rowCount: first.rows.length - (data.headerModeId === 'first_row' ? 1 : 0),
      colCount: first.rows[0]?.length || 0,
      totalSheets: parsed.summary.length,
      sheetsToRender: toPreview.length,
    }
  }, [parsed, data.sheetModeId, data.headerModeId, data.orientationId])

  const pageSize = findPageSize(data.pageSizeId)
  const orientation = findOrientation(data.orientationId)
  const sheetMode = findSheetMode(data.sheetModeId)
  const headerMode = findHeaderMode(data.headerModeId)
  const fitMode = findFitMode(data.fitModeId)
  const fontSize = findFontSize(data.fontSizeId)

  const handleBuild = async () => {
    if (!fileObj || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await buildExcelPdf(fileObj, data, (p) => setProgress(p))
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
              <ExcelToPdfIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Workbook · {file?.summary?.length || '—'} sheet{file?.summary?.length === 1 ? '' : 's'} · {preview ? `${preview.rowCount} rows × ${preview.colCount} cols` : 'no preview'}
            </span>
          </div>
          <button type="button" onClick={reset} disabled={!file}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700 disabled:opacity-50">
            Reset
          </button>
        </div>

        {/* Source */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Source spreadsheet</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        {file?.summary && file.summary.length > 0 && (
          <div className="mt-2 rounded-md border border-line bg-canvas px-3 py-2">
            <p className="m-0 mb-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Sheets in workbook</p>
            <div className="flex flex-wrap gap-1.5">
              {file.summary.map((s) => (
                <span key={s.name}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] ${
                    s.nonEmpty ? 'border-line bg-paper text-ink-700' : 'border-line bg-paper text-ink-500 line-through'
                  }`}
                  title={s.nonEmpty ? `${s.rowCount} rows × ${s.colCount} cols` : 'Empty sheet — will be skipped'}
                >
                  {s.name}
                  <span className="text-ink-500">· {s.rowCount}×{s.colCount}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {file && (
          <>
            <div className="my-3.5 h-px bg-line" />

            {/* Page setup */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Page setup</span>
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Page size" value={data.pageSizeId} onChange={setField('pageSizeId')}
                options={PAGE_SIZES.map((p) => ({ value: p.id, label: p.label }))} />
              <SelectInput label="Orientation" value={data.orientationId} onChange={setField('orientationId')}
                options={ORIENTATIONS.map((o) => ({ value: o.id, label: o.label }))} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SelectInput label="Fit columns" value={data.fitModeId} onChange={setField('fitModeId')}
                options={FIT_MODES.map((f) => ({ value: f.id, label: f.label }))} />
              <SelectInput label="Font size" value={data.fontSizeId} onChange={setField('fontSizeId')}
                options={FONT_SIZES.map((f) => ({ value: f.id, label: f.label }))} />
            </div>

            <div className="my-3.5 h-px bg-line" />

            {/* Sheets & header */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Sheets &amp; header</span>
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Sheets to render" value={data.sheetModeId} onChange={setField('sheetModeId')}
                options={SHEET_MODES.map((s) => ({ value: s.id, label: s.label }))} />
              <SelectInput label="Header row" value={data.headerModeId} onChange={setField('headerModeId')}
                options={HEADER_MODES.map((h) => ({ value: h.id, label: h.label }))} />
            </div>

            <div className="my-3.5 h-px bg-line" />

            {/* Title + naming */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Title &amp; naming</span>
            <div className="space-y-2">
              <TextInput label="Footer title (optional)" value={data.title} onChange={setField('title')} />
              <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
            </div>
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Saves as <span className="text-ink-700">{(data.baseName || 'workbook').replace(/[^a-z0-9-]+/gi, '-')}.pdf</span>
            </p>

            <div className="my-3.5 h-px bg-line" />

            {/* Live preview */}
            {preview && (
              <div className="rounded-lg border border-line bg-canvas">
                <p className="m-0 px-3 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
                  Preview · sheet &quot;{preview.name}&quot; · {preview.orientation} · {preview.sheetsToRender} of {preview.totalSheets} sheet{preview.totalSheets === 1 ? '' : 's'} will render
                </p>
                <div className="overflow-x-auto px-3 pb-3 pt-2">
                  <table className="w-full text-[10.5px]">
                    {preview.header && (
                      <thead>
                        <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.08em] text-convert-dk">
                          {preview.header.map((h, i) => (
                            <th key={i} className="bg-convert/20 py-1 pr-2 font-bold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody className="font-mono">
                      {preview.body.map((r, i) => (
                        <tr key={i} className={i % 2 === 1 ? 'bg-paper/50' : ''}>
                          {r.map((c, j) => (
                            <td key={j} className="py-1 pr-2 text-ink-900">{c || '—'}</td>
                          ))}
                        </tr>
                      ))}
                      {preview.body.length === 0 && (
                        <tr><td className="py-2 text-ink-500">No body rows after the header</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
            <span className="text-ink-500">Source sheets</span>
            <span className="text-ink-950">{file?.summary?.length || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Render mode</span>
            <span className="text-ink-950">{sheetMode.label}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Page</span>
            <span className="text-ink-950">{pageSize.label.split('(')[0].trim()} · {orientation.label.split('(')[0].trim()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Header</span>
            <span className="font-mono text-[12px] font-bold text-convert">
              {headerMode.label} · {fontSize.label.split('(')[0].trim()} · {fitMode.label.split(' ').slice(0, 2).join(' ')}
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
              <span className="text-ink-700">Pages</span>
              <span className="text-ink-950">{result.pages} · {result.sheets} sheet{result.sheets === 1 ? '' : 's'}</span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {pageSize.label.split('(')[0].trim()} · {orientation.id === 'auto' ? 'auto' : orientation.id}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {data.title || (data.baseName ? `${data.baseName}.pdf` : 'Workbook.pdf')}
          </div>
        </div>

        <button type="button" onClick={handleBuild}
          disabled={busy || !fileObj}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Building PDF…' : 'Build PDF from spreadsheet'}
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

function PdfMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Vendor ledger Q1.xlsx</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">3 sheets · A4 landscape · auto-fit columns</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Page 1 of 4</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 text-[13px] font-bold text-ink-950">Sheet 1 · Vendors</p>
        <p className="m-0 mt-0.5 font-mono text-[9px] text-ink-500">142 rows · 6 columns</p>

        <div className="mt-3 overflow-x-auto rounded border border-line">
          <table className="w-full text-[9.5px]">
            <thead>
              <tr className="bg-convert text-left font-mono text-[8px] uppercase tracking-[0.08em] text-white">
                {['Date', 'Vendor', 'Invoice #', 'Amount', 'GST', 'Total'].map((h) => (
                  <th key={h} className="px-1.5 py-1.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {[
                ['02-Apr-26', 'Westline Hardware', 'WL-2604-022', '1,42,200', '25,596', '1,67,796'],
                ['04-Apr-26', 'BlueDart Surface',  'BD-0408-117', '4,500',    '810',    '5,310'],
                ['08-Apr-26', 'Crossword Books',    'CW-0418-088', '2,240',    '0',      '2,240'],
                ['12-Apr-26', 'IndiGo Airlines',    'IG-7741',     '8,420',    '1,180',  '9,600'],
                ['15-Apr-26', 'Trident Hotels',     'TR-2025-44',  '18,900',   '2,268',  '21,168'],
                ['18-Apr-26', 'Adobe Inc',          'ADOBE-4421',  '1,240',    '223',    '1,463'],
              ].map((r, i) => (
                <tr key={r[2]} className={`border-t border-line ${i % 2 === 1 ? 'bg-canvas/50' : ''}`}>
                  {r.map((c, j) => {
                    const isNum = j >= 3
                    return <td key={j} className={`px-1.5 py-1 ${isNum ? 'text-right' : ''} ${j === 0 ? 'text-ink-500' : 'text-ink-900'}`}>{c}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ Sheets "Expenses" and "Reconciliation" follow on subsequent pages</p>
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
            Spreadsheet in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            fixed-layout PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Every sheet renders as its own section with a coloured header row, zebra-striped body, and auto-fit columns. Wide tables flip to landscape automatically; tall tables paginate cleanly with the header repeated on every page.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <ExcelToPdfIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Workbook Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  3 sheets · A4
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source',         'vendor-ledger-q1.xlsx'],
                  ['Sheets',         'Vendors · Expenses · Reconciliation'],
                  ['Page size',      'A4'],
                  ['Orientation',    'Auto (landscape · 6 cols)'],
                  ['Fit',            'Fit columns to page'],
                  ['Header row',     'First row · coloured band'],
                  ['Font size',      'Medium (10pt)'],
                  ['Output name',    'vendor-ledger-q1.pdf'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">1 PDF · 4 pages</span>
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
                  Print-ready
                </span>
              </div>
              <PdfMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the spreadsheet',     'Drag in any .xlsx, .xls, .csv, or .tsv file. The tool parses every sheet with SheetJS in your browser — nothing uploads.'],
  ['02', 'Tune the layout',           'Pick page size, orientation (auto detects wide tables), font size, and whether columns auto-fit to the page width. Live preview renders the first sheet as-is.'],
  ['03', 'Build & download',          'One click renders every non-empty sheet onto its own section with a coloured header row, zebra body, and footer page numbers. Multi-page sheets repeat the header.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From editable sheet{' '}
              <em className="font-serif font-normal italic text-crimson-300">to locked PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Spreadsheets are great for working; PDFs are right for sharing. Auditors, clients, and approvers all want a fixed-layout document that looks the same on every machine — and that opens without Excel installed. This tool produces exactly that.
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
  { title: 'Multi-sheet workbooks',    desc: 'Renders every sheet onto its own section with a name banner. Switch to first-only or first-non-empty when you only want one.' },
  { title: 'Auto orientation',          desc: 'Wide tables (≥ 7 columns) flip to landscape automatically; narrower tables stay portrait. Override with force-portrait or force-landscape.' },
  { title: 'Fit columns to width',      desc: 'Default mode auto-scales column widths so the whole table fits horizontally on the page. Switch to "natural" widths when you want each column at a comfortable read width.' },
  { title: 'Header banner + zebra',     desc: 'First row prints as a coloured banner in the accent colour; body rows alternate with a subtle band. Numeric columns right-align automatically.' },
  { title: 'Multi-page tables',         desc: 'Long sheets paginate cleanly with the header row repeated at the top of each new page so context never gets lost.' },
  { title: '100% in browser',            desc: 'SheetJS reads the workbook locally; jsPDF assembles the PDF locally. Nothing is uploaded — your file stays on your machine.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for sharing</Eyebrow>
          <SectionTitle>
            Lock the layout{' '}
            <em className="font-serif font-normal italic text-crimson-300">— send the PDF.</em>
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
  { q: 'Are formulas preserved?',                                          a: 'Not as live formulas — a PDF is a static document, so formula results get rendered as the computed value at the moment of conversion. The tool reads each cell\'s formatted value (so dates display correctly, percentages stay as percentages, etc.). If you need an editable copy, keep the .xlsx as the source of truth and use the PDF only for sharing.' },
  { q: 'What file formats are supported?',                                  a: '.xlsx (Excel 2007+), .xls (legacy Excel), .csv (comma-separated), and .tsv (tab-separated). All four are parsed by SheetJS in your browser. .ods (OpenOffice) and .numbers (Apple Numbers) need to be exported to one of the supported formats first.' },
  { q: 'My wide table got cropped — what now?',                            a: 'Two options: bump page size from A4 to A3 (gives much more horizontal room), or switch fit mode from "natural widths" to "fit columns to page width". The fit-to-page mode scales every column down so the whole table fits horizontally — readable for most data, cramped for very long text columns.' },
  { q: 'Do hidden sheets / hidden columns get rendered?',                  a: 'The tool reads every sheet and every column SheetJS gives it, including hidden ones. If you have sensitive hidden columns (workings, formulas, etc.) that you don\'t want in the PDF, delete them from the source spreadsheet before converting — or save a "for-PDF" copy of the workbook with only the visible columns.' },
  { q: 'Does cell formatting (colours, fonts, borders) come through?',      a: 'No — this tool produces a clean, uniformly-styled PDF (coloured header band, zebra body, mono font for cells). Cell-level styling from the source spreadsheet isn\'t carried over. If you need pixel-perfect Excel styling, the right tool is Excel\'s "Save as PDF" or LibreOffice\'s PDF export.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The .xlsx / .csv is read into memory, parsed by SheetJS locally, rendered to PDF by jsPDF locally, and saved via the standard file-download mechanism. No upload, no third-party API, no logging.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">converting spreadsheets.</em>
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
  { name: 'PDF to CSV',                desc: 'Reverse: extract a tabular PDF into CSV.',           Icon: CsvIcon,         label: 'CONVERT', path: '/tools/pdf-to-csv' },
  { name: 'Invoice PDF → Excel',       desc: 'Pull invoice line items out as structured rows.',     Icon: InvoicePdfIcon,  label: 'CONVERT', path: '/tools/invoice-pdf-to-excel' },
  { name: 'PDF Table Extractor',       desc: 'Every table from any PDF, columns preserved.',        Icon: PdfToExcelIcon,  label: 'CONVERT' },
  { name: 'CSV to PDF Converter',      desc: 'Just CSVs into branded PDFs without the full Excel.', Icon: ExcelToPdfIcon,  label: 'CONVERT' },
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

export default function ExcelToPdfTool() {
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
