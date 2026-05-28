'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  ExcelToPdfIcon, CsvIcon, PdfToExcelIcon, InvoicePdfIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

/* Re-uses the Excel → PDF engine. SheetJS handles CSV / TSV the same as
   .xlsx — we just constrain the accept= filter at the picker. The shared
   engine handles auto-orientation, fit-to-width, zebra rows, multi-page
   pagination with repeated headers, and footer page numbers. */
import {
  PAGE_SIZES, ORIENTATIONS, HEADER_MODES, FIT_MODES, FONT_SIZES,
  findPageSize, findOrientation, findHeaderMode, findFitMode, findFontSize,
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
    <div role="dialog" aria-modal="true" aria-label="CSV to PDF Converter"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Auto',  'Column widths'],
  ['Auto',  'Orientation flip'],
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
            <span className="text-convert">Convert</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">CSV to PDF Converter</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · CSV to print-ready PDF
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            CSV rows in,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              print-ready
            </em>
            <br />
            PDF{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop a .csv or .tsv file and the tool renders every row onto a fixed-layout PDF — coloured header band, zebra-striped body, auto-fit columns, automatic landscape for wide tables. Email-ready in seconds without opening Excel.
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
    const first = dropped.find((f) => /\.(csv|tsv|txt)$/i.test(f.name) || f.type === 'text/csv')
    if (first) onPick(first)
  }, [onPick])
  if (file) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2">
        <div className="min-w-0">
          <p className="m-0 truncate text-[12px] font-medium text-ink-950">{file.name}</p>
          <p className="m-0 font-mono text-[10px] text-ink-500">
            {formatBytes(file.size)}
            {file.summary?.[0] ? `  ·  ${file.summary[0].rowCount} rows × ${file.summary[0].colCount} cols` : ''}
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
        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
        onChange={(e) => {
          const first = e.target.files && e.target.files[0]
          if (first) onPick(first)
          e.target.value = ''
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Choose CSV"
      />
      <CsvIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a CSV or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">.csv · .tsv · .txt — SheetJS detects the delimiter automatically</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  pageSizeId:    'a4',
  orientationId: 'auto',
  headerModeId:  'first_row',
  fitModeId:     'fit_width',
  fontSizeId:    'md',
  /* CSV inputs always have a single sheet — the SheetJS reader maps the rows
     onto a sheet called "Sheet1", so we hard-pin sheetMode to "first" inside
     the engine call (the option exists for the Excel tool but isn't useful
     here). */
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
  const [parsed, setParsed] = useState(null)

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
      setProgress({ stage: 'error', pct: 0, message: `Could not read CSV: ${err?.message || err}` })
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

  const preview = useMemo(() => {
    if (!parsed) return null
    const first = parsed.sheets.find((s) => s.rows.length > 0)
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
    }
  }, [parsed, data.headerModeId, data.orientationId])

  const pageSize    = findPageSize(data.pageSizeId)
  const orientation = findOrientation(data.orientationId)
  const headerMode  = findHeaderMode(data.headerModeId)
  const fitMode     = findFitMode(data.fitModeId)
  const fontSize    = findFontSize(data.fontSizeId)

  const handleBuild = async () => {
    if (!fileObj || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      /* Force sheetModeId to 'first' — the SheetJS CSV reader always produces
         exactly one sheet, so the per-sheet mode toggle is irrelevant here. */
      const r = await buildExcelPdf(fileObj, { ...data, sheetModeId: 'first' }, (p) => setProgress(p))
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
              <CsvIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              CSV · {preview ? `${preview.rowCount} rows × ${preview.colCount} cols` : 'no preview'}
            </span>
          </div>
          <button type="button" onClick={reset} disabled={!file}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700 disabled:opacity-50">
            Reset
          </button>
        </div>

        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Source CSV</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        {file && (
          <>
            <div className="my-3.5 h-px bg-line" />

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

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Header row</span>
            <SelectInput label="Header" value={data.headerModeId} onChange={setField('headerModeId')}
              options={HEADER_MODES.map((h) => ({ value: h.id, label: h.label }))} />

            <div className="my-3.5 h-px bg-line" />

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Title &amp; naming</span>
            <div className="space-y-2">
              <TextInput label="Footer title (optional)" value={data.title} onChange={setField('title')} />
              <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
            </div>
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Saves as <span className="text-ink-700">{(data.baseName || 'csv-export').replace(/[^a-z0-9-]+/gi, '-')}.pdf</span>
            </p>

            <div className="my-3.5 h-px bg-line" />

            {preview && (
              <div className="rounded-lg border border-line bg-canvas">
                <p className="m-0 px-3 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
                  Preview · {preview.orientation} · {preview.rowCount} body rows
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

        <div className="rounded-lg border border-line bg-canvas p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Source rows</span>
            <span className="text-ink-950">{file?.summary?.[0]?.rowCount || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Columns</span>
            <span className="text-ink-950">{file?.summary?.[0]?.colCount || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Page</span>
            <span className="text-ink-950">{pageSize.label.split('(')[0].trim()} · {orientation.label.split('(')[0].trim()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Style</span>
            <span className="font-mono text-[12px] font-bold text-convert">
              {headerMode.label.split('(')[0].trim()} · {fontSize.label.split('(')[0].trim()} · {fitMode.label.split(' ').slice(0, 2).join(' ')}
            </span>
          </div>
        </div>

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

        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {pageSize.label.split('(')[0].trim()} · {orientation.id === 'auto' ? 'auto' : orientation.id}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {data.title || (data.baseName ? `${data.baseName}.pdf` : 'CSV.pdf')}
          </div>
        </div>

        <button type="button" onClick={handleBuild}
          disabled={busy || !fileObj}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Building PDF…' : 'Convert CSV to PDF'}
          <ArrowRight size={14} />
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">100% local · nothing uploaded</span>
          <a href="https://go.sonchoy.com/pdfFiller" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-crimson-300 no-underline hover:text-crimson-400">
            Need batch? <ArrowRight size={10} />
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
            <p className="m-0 text-[14px] font-bold text-ink-950">vendor-ledger.csv → .pdf</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">142 rows · 6 columns · A4 landscape · auto-fit</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Page 1 of 3</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

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
                ['02-Apr-26', 'Westline Hardware',  'WL-2604-022', '1,42,200', '25,596', '1,67,796'],
                ['04-Apr-26', 'BlueDart Surface',   'BD-0408-117', '4,500',    '810',    '5,310'],
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

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ 136 more rows · header repeats on every page · footer page numbers + title</p>
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
            CSV rows in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            branded PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop a CSV / TSV file and the tool renders every row onto a fixed-layout PDF — coloured header band, zebra body, auto-fit columns. Wide tables flip to landscape automatically; long tables paginate with the header repeated on every page.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <CsvIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">CSV Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  142 rows · A4
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source',          'vendor-ledger.csv · 142 rows × 6 cols'],
                  ['Page size',       'A4'],
                  ['Orientation',     'Auto (landscape · 6 cols)'],
                  ['Fit',             'Fit columns to page'],
                  ['Header row',      'First row · coloured band'],
                  ['Font size',       'Medium (10pt)'],
                  ['Footer title',    'Vendor ledger Q1 FY26-27'],
                  ['Output name',     'vendor-ledger.pdf'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">1 PDF · 3 pages</span>
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
  ['01', 'Drop the CSV',           'Drag in any .csv, .tsv, or delimited .txt. SheetJS detects the delimiter automatically (comma, semicolon, tab, pipe) and parses the rows in the browser.'],
  ['02', 'Tune the layout',         'Pick page size, orientation (auto detects wide tables), font size, and whether columns auto-fit. Live preview shows the rendered table as-is.'],
  ['03', 'Build & download',        'One click renders every row onto a fixed-layout PDF with a coloured header band, zebra body, and footer page numbers. Multi-page tables repeat the header.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From plain CSV{' '}
              <em className="font-serif font-normal italic text-crimson-300">to branded PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            CSVs are great for systems; PDFs are right for humans. The recipient who needs to read a vendor ledger over coffee doesn&rsquo;t want to open Excel — they want a clean, scannable document. This tool produces exactly that, without opening a spreadsheet app yourself.
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
  { title: 'Any delimiter',             desc: 'Comma, semicolon (EU CSV), tab (TSV), pipe — SheetJS sniffs the delimiter at parse time. No need to pick.' },
  { title: 'Auto orientation',           desc: 'Wide tables (≥ 7 columns) flip to landscape automatically; narrower ones stay portrait. Override with force-portrait or force-landscape.' },
  { title: 'Fit columns to width',       desc: 'Default mode auto-scales column widths so the whole table fits horizontally. Switch to "natural" widths when you want each column at a comfortable read width.' },
  { title: 'Header banner + zebra',      desc: 'First row prints as a coloured banner in the accent colour; body rows alternate with a subtle band. Numeric-looking columns right-align automatically.' },
  { title: 'Multi-page pagination',      desc: 'Long CSVs paginate cleanly with the header row repeated at the top of every new page so column context never gets lost.' },
  { title: '100% in browser',             desc: 'SheetJS reads the CSV locally; jsPDF assembles the PDF locally. Nothing uploaded — your file stays on your machine.' },
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
  { q: 'How is this different from the Excel to PDF tool?',                a: 'Same underlying engine. Excel to PDF accepts .xlsx, .xls, .csv, .tsv — multi-sheet workbooks render each sheet as its own section. CSV to PDF Converter is the streamlined landing for users who only have a CSV — same output, fewer options to scan.' },
  { q: 'What delimiter does my file need?',                                a: 'Whatever you have. SheetJS detects the delimiter automatically — comma, semicolon, tab, pipe. The file extension can be .csv / .tsv / .txt and the tool will still parse correctly.' },
  { q: 'My CSV has commas inside values — will it break?',                a: 'No, as long as the values are properly quoted (e.g. "Acme Robotics, Pvt Ltd"). SheetJS handles RFC 4180 quoting and escapes correctly. If the source CSV isn\'t quote-escaped, you\'ll see commas split mid-value — that\'s an issue with the source file, not this tool.' },
  { q: 'My wide CSV got cropped — what to do?',                            a: 'Two options: bump page size from A4 to A3 (much more horizontal room), or switch fit mode from "natural" to "fit columns to page width" (which scales every column down to fit). Auto orientation will also flip wide tables to landscape automatically.' },
  { q: 'Are numbers right-aligned in the output?',                         a: 'Yes — the renderer auto-detects numeric-looking cells (digits + optional thousands commas + optional decimal + optional %) and right-aligns those columns. Text columns stay left-aligned. No manual config needed.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The CSV is parsed locally by SheetJS, rendered to PDF locally by jsPDF, and saved via the standard file-download mechanism. No upload, no third-party API, no logging.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">CSV → PDF.</em>
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
  { name: 'Excel to PDF',              desc: 'Same engine — handles .xlsx + multi-sheet workbooks.', Icon: ExcelToPdfIcon,  label: 'CONVERT', path: '/tools/excel-to-pdf' },
  { name: 'PDF to CSV',                desc: 'Reverse: extract a tabular PDF into CSV.',             Icon: CsvIcon,         label: 'CONVERT', path: '/tools/pdf-to-csv' },
  { name: 'PDF to Excel',              desc: 'Direct PDF → editable .xlsx workbook.',                Icon: PdfToExcelIcon,  label: 'CONVERT', path: '/tools/pdf-to-excel' },
  { name: 'Invoice PDF → Excel',       desc: 'Pull invoice line items into spreadsheet rows.',       Icon: InvoicePdfIcon,  label: 'CONVERT', path: '/tools/invoice-pdf-to-excel' },
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

export default function CsvToPdfConverterTool() {
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
