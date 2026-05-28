'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  ReportIcon, PdfToExcelIcon, BankStatementIcon, InvoicePdfIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

/* Re-uses the PDF → Excel engine. Financial reports (P&L, balance sheet,
   cash flow) tend to be multi-section PDFs where each statement lives on
   its own page, so the default landing here is sheet-per-page mode. */
import {
  PAGE_MODES, HEADER_MODES, ROW_TOLERANCE_PRESETS, COL_TOLERANCE_PRESETS, NUMBER_MODES,
  findPageMode, findHeaderMode, findRowTolerance, findColTolerance, findNumberMode,
  parseRanges, extractTableFromPage, applyHeaderMode, previewRows,
  formatBytes, coerceCell,
} from '@/lib/pdf-to-excel/compute'
import { buildXlsxFromPdf, probePdf } from '@/lib/pdf-to-excel/extractXlsx'
import { extractTextFromPdf } from '@/lib/pdfExtract'

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
    <div role="dialog" aria-modal="true" aria-label="Financial Report PDF to Excel"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['P&L',     'Balance · cash flow'],
  ['Number',  'Cells stay numeric'],
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
            <Link href="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link href="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-convert">Convert</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Financial Report PDF to Excel</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · Financial statements
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            P&amp;L, balance sheet,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              cash flow —
            </em>
            <br />
            into{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              .xlsx.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop a multi-statement financial report PDF — annual report, management pack, audit-firm output — and the tool extracts each statement onto its own sheet with real number cells. P&amp;L → "Page 2", Balance Sheet → "Page 3", Cash Flow → "Page 4", all editable.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> One sheet per statement</span>
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
        className={`${inputClass} min-h-[72px] resize-y leading-[1.45] font-mono text-[11.5px]`} />
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
    const first = dropped.find((f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf')
    if (first) onPick(first)
  }, [onPick])
  if (file) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2">
        <div className="min-w-0">
          <p className="m-0 truncate text-[12px] font-medium text-ink-950">{file.name}</p>
          <p className="m-0 font-mono text-[10px] text-ink-500">
            {formatBytes(file.size)}
            {file.pages ? `  ·  ${file.pages} pages` : ''}
            {file.isScanned ? '  ·  scanned (text layer missing)' : ''}
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
        accept="application/pdf,.pdf"
        onChange={(e) => {
          const first = e.target.files && e.target.files[0]
          if (first) onPick(first)
          e.target.value = ''
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Choose financial report PDF"
      />
      <ReportIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a financial report PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Annual report, board pack, audit output — anything with P&amp;L / BS / CF</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

/* Financial reports are mostly multi-statement: P&L on one page, balance
   sheet on the next, cash flow on the next. The default lands on
   sheet-per-page so each statement gets its own named sheet. */
const INITIAL = {
  pageModeId:     'sheet_per_page',
  pageRangesText: '',
  rowToleranceId: 'normal',
  colToleranceId: 'loose',     // financial statements have wide whitespace between line item & amount → loose works better
  headerModeId:   'first_row',
  numberModeId:   'auto',
  baseName:       '',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)
  const [fileObj, setFileObj] = useState(null)
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [extractedItems, setExtractedItems] = useState(null)
  const [previewError, setPreviewError] = useState(null)

  const handlePick = useCallback(async (raw) => {
    setFileObj(raw); setResult(null); setExtractedItems(null); setPreviewError(null)
    setFile({ name: raw.name, size: raw.size, pages: null, isScanned: false })
    setData((s) => ({ ...s, baseName: raw.name.replace(/\.pdf$/i, ''), pageRangesText: '' }))
    setProgress({ stage: 'probing', pct: 4, message: `Reading ${raw.name}…` })
    try {
      const info = await probePdf(raw)
      setFile({ name: raw.name, size: raw.size, pages: info.pages, isScanned: info.isScanned })
      setProgress(null)
      if (info.isScanned) {
        setPreviewError('This PDF appears scanned (no text layer). The extractor needs text — try the pdfFiller premium tier for OCR on scanned reports.')
        return
      }
      const ex = await extractTextFromPdf(raw)
      setExtractedItems({ items: ex.items, numPages: ex.numPages })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: `Could not read PDF: ${err?.message || err}` })
    }
  }, [])

  const handleClear = () => {
    setFile(null); setFileObj(null); setExtractedItems(null)
    setProgress(null); setResult(null); setPreviewError(null)
  }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => {
    setData({ ...INITIAL, baseName: file?.name?.replace(/\.pdf$/i, '') || '' })
    setProgress(null); setResult(null)
  }

  const preview = useMemo(() => {
    if (!extractedItems) return null
    const rowTol = findRowTolerance(data.rowToleranceId).pt
    const colTol = findColTolerance(data.colToleranceId).pt
    let previewPage = 1
    if (data.pageModeId === 'range_one_sheet' && data.pageRangesText) {
      const parsed = parseRanges(data.pageRangesText, extractedItems.numPages)
      const first = [...parsed.pages].sort((a, b) => a - b)[0]
      if (first) previewPage = first
    }
    const items = extractedItems.items.filter((it) => it.page === previewPage)
    const { rows } = extractTableFromPage(items, { rowTolerance: rowTol, colTolerance: colTol })
    const { header, body } = applyHeaderMode(rows, data.headerModeId)
    const bodyPreview = previewRows(body, 10, 26)
    const numberFlags = bodyPreview.map((r) => r.map((c) => {
      if (data.numberModeId !== 'auto') return false
      const coerced = coerceCell(c)
      return coerced.t === 'n'
    }))
    return {
      page: previewPage,
      totalPages: extractedItems.numPages,
      header,
      bodyPreview,
      numberFlags,
      rowCount: body.length,
      colCount: rows[0]?.length || 0,
    }
  }, [extractedItems, data.rowToleranceId, data.colToleranceId, data.headerModeId, data.pageModeId, data.pageRangesText, data.numberModeId])

  const customRangeErrors = useMemo(() => {
    if (data.pageModeId !== 'range_one_sheet' || !file?.pages) return []
    return parseRanges(data.pageRangesText, file.pages).errors
  }, [data.pageModeId, data.pageRangesText, file])

  const pageMode = findPageMode(data.pageModeId)
  const headerMode = findHeaderMode(data.headerModeId)
  const numberMode = findNumberMode(data.numberModeId)

  const handleExport = async () => {
    if (!fileObj || busy || file?.isScanned) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await buildXlsxFromPdf(fileObj, data, (p) => setProgress(p))
      setResult(r)
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
              <ReportIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Report · {file?.pages || '—'} pages · {preview ? `${preview.rowCount} rows × ${preview.colCount} cols` : 'no preview'}
            </span>
          </div>
          <button type="button" onClick={reset} disabled={!file}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700 disabled:opacity-50">
            Reset
          </button>
        </div>

        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Financial report PDF</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        {previewError && (
          <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[10.5px] text-warning">
            ⚠ {previewError}
          </div>
        )}

        {file && !file.isScanned && (
          <>
            <div className="my-3.5 h-px bg-line" />

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Pages &amp; sheets</span>
            <SelectInput label="Page mode" value={data.pageModeId} onChange={setField('pageModeId')}
              options={PAGE_MODES.map((p) => ({ value: p.id, label: p.label }))} />
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Sheet-per-page is the right default for multi-statement reports — each statement gets its own sheet.
            </p>
            {data.pageModeId === 'range_one_sheet' && (
              <div className="mt-2">
                <TextareaInput
                  label="Page ranges"
                  value={data.pageRangesText}
                  onChange={setField('pageRangesText')}
                  placeholder="2-4 (just P&L, balance, cash flow)"
                  rows={3}
                />
                {customRangeErrors.length > 0 && (
                  <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[10.5px] text-warning">
                    ⚠ {customRangeErrors[0]}
                  </div>
                )}
              </div>
            )}

            <div className="my-3.5 h-px bg-line" />

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Table detection</span>
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Row tolerance" value={data.rowToleranceId} onChange={setField('rowToleranceId')}
                options={ROW_TOLERANCE_PRESETS.map((r) => ({ value: r.id, label: r.label }))} />
              <SelectInput label="Column tolerance" value={data.colToleranceId} onChange={setField('colToleranceId')}
                options={COL_TOLERANCE_PRESETS.map((c) => ({ value: c.id, label: c.label }))} />
            </div>
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Financial statements typically need loose column tolerance — line item descriptions can extend across what would otherwise be detected as separate columns.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SelectInput label="Header row" value={data.headerModeId} onChange={setField('headerModeId')}
                options={HEADER_MODES.map((h) => ({ value: h.id, label: h.label }))} />
              <SelectInput label="Number cells" value={data.numberModeId} onChange={setField('numberModeId')}
                options={NUMBER_MODES.map((n) => ({ value: n.id, label: n.label }))} />
            </div>

            <div className="my-3.5 h-px bg-line" />

            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">File name</span>
            <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Saves as <span className="text-ink-700">{(data.baseName || 'financial-report').replace(/[^a-z0-9-]+/gi, '-')}.xlsx</span>
            </p>

            <div className="my-3.5 h-px bg-line" />

            {preview && (
              <div className="rounded-lg border border-line bg-canvas">
                <p className="m-0 px-3 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
                  Preview · page {preview.page} of {preview.totalPages} · {preview.rowCount} body rows · cells in <span className="text-success">green</span> become number-typed
                </p>
                <div className="overflow-x-auto px-3 pb-3 pt-2">
                  <table className="w-full text-[10.5px]">
                    {preview.header && (
                      <thead>
                        <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">
                          {preview.header.map((h, i) => (
                            <th key={i} className="py-1 pr-2 font-normal">{h.length > 26 ? `${h.slice(0, 25)}…` : h}</th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody className="font-mono">
                      {preview.bodyPreview.map((r, i) => (
                        <tr key={i} className="border-t border-line">
                          {r.map((c, j) => (
                            <td key={j} className={`py-1 pr-2 ${preview.numberFlags[i][j] ? 'text-success font-medium' : 'text-ink-900'}`}>
                              {c || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {preview.bodyPreview.length === 0 && (
                        <tr><td className="py-2 text-ink-500">No rows detected on this page</td></tr>
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
            <span className="text-ink-500">Source pages</span>
            <span className="text-ink-950">{file?.pages || '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Mode</span>
            <span className="text-ink-950">{pageMode.label}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Header</span>
            <span className="text-ink-950">{headerMode.label}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Number cells</span>
            <span className="font-mono text-[12px] font-bold text-convert">{numberMode.label.split('(')[0].trim()}</span>
          </div>
        </div>

        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · workbook ready</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Statement sheets</span>
              <span className="text-ink-950">{result.sheets} (+ _meta)</span>
            </div>
          </div>
        )}

        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              .xlsx · sheet-per-statement
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {preview ? `${preview.rowCount} row${preview.rowCount === 1 ? '' : 's'} × ${preview.colCount} col${preview.colCount === 1 ? '' : 's'}` : '—'}
          </div>
        </div>

        <button type="button" onClick={handleExport}
          disabled={busy || !fileObj || file?.isScanned}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Extracting…' : 'Export financial report .xlsx'}
          <ArrowRight size={14} />
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">100% local · nothing uploaded</span>
          <a href="https://go.sonchoy.com/pdfFiller" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-crimson-300 no-underline hover:text-crimson-400">
            Need OCR for scans? <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 2) Preview ---------- */

function XlsxMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">annual-report-fy26.xlsx</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">3 statement sheets + _meta · numbers as numbers</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Sheet: Profit &amp; Loss</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <div className="mt-3 overflow-x-auto rounded border border-line">
          <table className="w-full text-[9.5px]">
            <thead>
              <tr className="bg-canvas text-left font-mono text-[8px] uppercase tracking-[0.08em] text-convert-dk">
                {['Line item', 'FY26 (current)', 'FY25 (prior)', 'Δ %'].map((h) => (
                  <th key={h} className="px-1.5 py-1 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {[
                ['Revenue from operations',  44200000, 38500000, 14.81],
                ['Other income',             1820000,  1620000,  12.35],
                ['Total revenue',            46020000, 40120000, 14.71],
                ['Cost of materials',       -18400000, -16200000, 13.58],
                ['Employee benefits',       -14200000, -12800000, 10.94],
                ['Depreciation',             -2400000,  -2280000,  5.26],
                ['Other expenses',           -3600000,  -3450000,  4.35],
                ['Profit before tax',         7420000,   5390000, 37.66],
              ].map((r, i) => (
                <tr key={i} className="border-t border-line">
                  {r.map((c, j) => {
                    const isNum = j >= 1
                    return (
                      <td key={j} className={`px-1.5 py-1 ${isNum ? 'text-right text-success font-medium' : 'text-ink-900'}`}>
                        {isNum ? (j === 3 ? `${c.toFixed(2)}%` : Number(c).toLocaleString()) : c}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {['Profit & Loss', 'Balance Sheet', 'Cash Flow', '_meta'].map((s, i) => (
            <span key={s} className={`rounded border px-1.5 py-0.5 font-mono text-[8px] ${i === 0 ? 'border-convert bg-convert-bg text-convert' : 'border-line bg-paper text-ink-500'}`}>
              {s}
            </span>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">Every numeric cell is real number-typed. Switch between sheets for each statement.</p>
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
            Annual report in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            multi-sheet workbook out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Each financial statement (P&amp;L, balance sheet, cash flow, equity reconciliation) becomes its own named sheet. Numbers come through as number-typed cells so SUM, AVG, and YoY % formulas just work without re-typing.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <ReportIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Report Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Sheet per statement
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'annual-report-fy26.pdf · 4 pages'],
                  ['Page mode',      'One sheet per page'],
                  ['Row tolerance',  'Normal (4pt)'],
                  ['Column tolerance', 'Loose (20pt) — statement-friendly'],
                  ['Header row',     'First detected row'],
                  ['Number cells',   'Auto-detect'],
                  ['Output base',    'annual-report-fy26'],
                  ['Output',         '3 statements + _meta'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">1 .xlsx · 4 sheets</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT.XLSX</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Editable
                </span>
              </div>
              <XlsxMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the report',        'Drag in any annual report, audit-firm output, or management pack PDF. The tool extracts the text layer locally with pdfjs — nothing uploads.'],
  ['02', 'Tune the detection',      'Default settings (sheet-per-page + loose column tolerance) work for most multi-statement reports. The live preview shows the table the moment you change anything.'],
  ['03', 'Export the workbook',     'One click writes a proper .xlsx with one sheet per statement (P&amp;L, balance sheet, cash flow), number-typed cells, and a _meta audit sheet.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From annual report PDF{' '}
              <em className="font-serif font-normal italic text-crimson-300">to working workbook.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Auditors hand you a beautiful PDF; you need to model the numbers in Excel. Re-typing 200 line items is a half-day exercise that introduces mistakes. This tool turns the PDF into an editable workbook in 30 seconds — every numeric cell stays numeric so the moment you open it, formulas work.
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
  { title: 'Statement-aware defaults',   desc: 'Defaults to sheet-per-page mode + loose column tolerance because that combo nails most multi-statement reports out of the box. Override if your source needs tighter detection.' },
  { title: 'Real number cells',           desc: 'Currency-prefixed, comma-thousands, accounting-negative ("(1,200.00)"), percentage cells all detected and upgraded to real number-typed cells. YoY % formulas work the moment you open the file.' },
  { title: 'Sheet per statement',         desc: 'P&L on its own sheet, balance sheet on the next, cash flow on the next. Matches the source PDF\'s navigation; no scrolling through one giant flat sheet to find the right statement.' },
  { title: 'Custom page range',           desc: 'Skip cover pages and audit reports with a range like "2-4" to grab just the financial statement section. Page-local column anchors per page mean each statement\'s columns line up correctly.' },
  { title: '_meta audit sheet',            desc: 'Every workbook includes a tiny _meta sheet recording source file, page count, mode, tolerance, and number-coercion choice. Useful audit-trail for FP&amp;A / auditing colleagues.' },
  { title: '100% in browser',              desc: 'PDF parsed with pdfjs locally, workbook written with SheetJS locally, downloaded via the browser. No upload, no third-party API, no logging.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for FP&amp;A</Eyebrow>
          <SectionTitle>
            P&amp;L &middot; BS &middot; CF{' '}
            <em className="font-serif font-normal italic text-crimson-300">— each on its own sheet.</em>
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
  { q: 'How is this different from PDF to Excel?',                        a: 'Same engine, different defaults + framing. PDF to Excel is the generic tool. Financial Report PDF to Excel pre-selects sheet-per-page mode and loose column tolerance — the right settings for multi-statement reports straight out of the box. If you\'re extracting a vendor ledger or transaction list, PDF to Excel is the better landing.' },
  { q: 'Does it understand P&L vs Balance Sheet vs Cash Flow structurally?', a: 'No — it treats each page as a table and extracts the rows + columns it finds. The convention that each statement lives on its own page is what gives you "one sheet per statement" in the output. If two statements share a page, they\'ll both land on the same sheet; if a statement spans two pages, it\'ll split across two sheets (paste them together in Excel).' },
  { q: 'Will negative numbers in parentheses come through correctly?',     a: 'Yes. Accounting-format negatives like "(1,234.56)" are detected and converted to -1234.56 as real number cells. Same for currency-prefixed values (₹, $, €, £, ¥) and percentages (12.5% → 0.125 with % formatting applied).' },
  { q: 'What about prior-year comparison columns?',                       a: 'They come through as separate columns — typically "FY26 (current)" and "FY25 (prior)" become two number columns. You can drop a third column in Excel for YoY % delta or growth, and the formula will work because both source columns are real numbers, not strings.' },
  { q: 'My report has multi-line line items — does that break the extraction?', a: 'Sometimes. If a line item description wraps to a second line ("Cost of materials consumed and inventory adjustments"), the second line may land on its own row in the output. Quick fix: open the .xlsx in Excel and concatenate the two rows. Better fix: try row tolerance "Loose" which groups wrapped lines together more often.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The PDF is parsed locally by pdfjs, tabularised in JavaScript, and serialised to .xlsx locally by SheetJS. The browser triggers the download. No upload, no third-party API, no logging.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">extracting reports.</em>
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
  { name: 'PDF to Excel',              desc: 'Generic engine — for non-financial tabular PDFs.',     Icon: PdfToExcelIcon,    label: 'CONVERT', path: '/tools/pdf-to-excel' },
  { name: 'PDF to XLSX Converter',     desc: 'Same engine — alternative landing.',                   Icon: PdfToExcelIcon,    label: 'CONVERT', path: '/tools/pdf-to-xlsx-converter' },
  { name: 'Invoice PDF → Excel',       desc: 'Line items, totals, tax from invoice PDFs.',           Icon: InvoicePdfIcon,    label: 'CONVERT', path: '/tools/invoice-pdf-to-excel' },
  { name: 'Bank Statement → Excel',    desc: 'Reconciled transaction table with debit / credit.',     Icon: BankStatementIcon, label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
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

export default function FinancialReportPdfToExcelTool() {
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
