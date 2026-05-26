import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  CsvIcon, PdfToExcelIcon, BankStatementIcon, InvoicePdfIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  DELIMITERS, ENCODINGS, PAGE_MODES, HEADER_MODES,
  ROW_TOLERANCE_PRESETS, COL_TOLERANCE_PRESETS,
  findDelimiter, findPageMode, findHeaderMode,
  findRowTolerance, findColTolerance,
  parseRanges, extractTableFromPage, applyHeaderMode, previewRows,
  formatBytes,
} from '../lib/pdf-to-csv/compute'
import { extractCsv, probePdf } from '../lib/pdf-to-csv/extractCsv'
import { extractTextFromPdf } from '../lib/pdfExtract'

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
    <div role="dialog" aria-modal="true" aria-label="Transaction History PDF to CSV"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Auto', 'Column detection'],
  ['4',    'Delimiter formats'],
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
            <span className="text-convert">Convert</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Transaction History PDF to CSV</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · Table extraction
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Transactions in,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              import-ready CSV
            </em>
            <br />
            {' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              out.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Convert bank, credit-card, and brokerage transaction history PDFs into clean CSV files ready for QuickBooks, Xero, Wave, or your spreadsheet. Auto-detected rows and columns; live preview so you can tune row / column tolerance before exporting.
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
        aria-label="Choose PDF"
      />
      <CsvIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Bank statement, ledger, invoice, vendor report — any tabular PDF</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  pageModeId:     'all',
  pageRangesText: '',
  rowToleranceId: 'normal',
  colToleranceId: 'normal',
  headerModeId:   'first_row',
  delimiterId:    'comma',
  encodingId:     'utf8',
  baseName:       '',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)
  const [fileObj, setFileObj] = useState(null)
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  /* Cached pdfjs extraction so the preview can re-run table detection
     without re-decoding the whole PDF every time the user tweaks a knob. */
  const [extractedItems, setExtractedItems] = useState(null)  // { items, numPages }
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
        setPreviewError('This PDF appears scanned (no text layer). The CSV extractor needs text — try the pdfFiller premium tier for OCR.')
        return
      }
      // Re-extract once so the preview is instant on every option change
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

  /* Compute a live preview of the first selected page using the current
     tolerance + header settings. Memoised on options + extracted items. */
  const preview = useMemo(() => {
    if (!extractedItems) return null
    const rowTol = findRowTolerance(data.rowToleranceId).pt
    const colTol = findColTolerance(data.colToleranceId).pt

    // Pick the first preview page
    let previewPage = 1
    if (data.pageModeId === 'range' && data.pageRangesText) {
      const parsed = parseRanges(data.pageRangesText, extractedItems.numPages)
      const first = [...parsed.pages].sort((a, b) => a - b)[0]
      if (first) previewPage = first
    }
    const items = extractedItems.items.filter((it) => it.page === previewPage)
    const { rows } = extractTableFromPage(items, { rowTolerance: rowTol, colTolerance: colTol })
    const { header, body } = applyHeaderMode(rows, data.headerModeId)
    const bodyPreview = previewRows(body, 8, 22)
    return {
      page: previewPage,
      totalPages: extractedItems.numPages,
      header,
      bodyPreview,
      rowCount: body.length,
      colCount: rows[0]?.length || 0,
    }
  }, [extractedItems, data.rowToleranceId, data.colToleranceId, data.headerModeId, data.pageModeId, data.pageRangesText])

  const customRangeErrors = useMemo(() => {
    if (data.pageModeId !== 'range' || !file?.pages) return []
    return parseRanges(data.pageRangesText, file.pages).errors
  }, [data.pageModeId, data.pageRangesText, file])

  const delimiter = findDelimiter(data.delimiterId)
  const pageMode = findPageMode(data.pageModeId)
  const headerMode = findHeaderMode(data.headerModeId)

  const handleExport = async () => {
    if (!fileObj || busy || file?.isScanned) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await extractCsv(fileObj, data, (p) => setProgress(p))
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
              <CsvIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              CSV · {file?.pages || '—'} pages · {preview ? `${preview.rowCount} rows × ${preview.colCount} cols` : 'no preview'}
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

        {previewError && (
          <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[10.5px] text-warning">
            ⚠ {previewError}
          </div>
        )}

        {file && !file.isScanned && (
          <>
            <div className="my-3.5 h-px bg-line" />

            {/* Pages */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Which pages</span>
            <SelectInput label="Page mode" value={data.pageModeId} onChange={setField('pageModeId')}
              options={PAGE_MODES.map((p) => ({ value: p.id, label: p.label }))} />
            {data.pageModeId === 'range' && (
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

            <div className="my-3.5 h-px bg-line" />

            {/* Detection */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Table detection</span>
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Row tolerance" value={data.rowToleranceId} onChange={setField('rowToleranceId')}
                options={ROW_TOLERANCE_PRESETS.map((r) => ({ value: r.id, label: r.label }))} />
              <SelectInput label="Column tolerance" value={data.colToleranceId} onChange={setField('colToleranceId')}
                options={COL_TOLERANCE_PRESETS.map((c) => ({ value: c.id, label: c.label }))} />
            </div>
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Tighter = more rows / columns detected (good for dense tables). Looser = merge nearby cells (good for sparse layouts).
            </p>
            <div className="mt-2">
              <SelectInput label="Header row" value={data.headerModeId} onChange={setField('headerModeId')}
                options={HEADER_MODES.map((h) => ({ value: h.id, label: h.label }))} />
            </div>

            <div className="my-3.5 h-px bg-line" />

            {/* Output format */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">CSV format</span>
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Delimiter" value={data.delimiterId} onChange={setField('delimiterId')}
                options={DELIMITERS.map((d) => ({ value: d.id, label: d.label }))} />
              <SelectInput label="Encoding" value={data.encodingId} onChange={setField('encodingId')}
                options={ENCODINGS.map((e) => ({ value: e.id, label: e.label }))} />
            </div>
            <div className="mt-2">
              <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
              <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
                Saves as <span className="text-ink-700">{(data.baseName || 'extracted').replace(/[^a-z0-9-]+/gi, '-')}.{delimiter.id === 'tab' ? 'tsv' : 'csv'}</span>
              </p>
            </div>

            <div className="my-3.5 h-px bg-line" />

            {/* Live preview */}
            {preview && (
              <div className="rounded-lg border border-line bg-canvas">
                <p className="m-0 px-3 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
                  Preview · page {preview.page} of {preview.totalPages} · {preview.rowCount} body rows
                </p>
                <div className="overflow-x-auto px-3 pb-3 pt-2">
                  <table className="w-full text-[10.5px]">
                    {preview.header && (
                      <thead>
                        <tr className="text-left font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-500">
                          {preview.header.map((h, i) => (
                            <th key={i} className="py-1 pr-2 font-normal">{h.length > 22 ? `${h.slice(0, 21)}…` : h}</th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody className="font-mono">
                      {preview.bodyPreview.map((r, i) => (
                        <tr key={i} className="border-t border-line">
                          {r.map((c, j) => (
                            <td key={j} className="py-1 pr-2 text-ink-900">{c || '—'}</td>
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
            <span className="text-ink-500">Mode</span>
            <span className="text-ink-950">{pageMode.label}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Header</span>
            <span className="text-ink-950">{headerMode.label}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Format</span>
            <span className="font-mono text-[12px] font-bold text-convert">{delimiter.label}</span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · extracted</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Rows</span>
              <span className="text-ink-950">{result.totalRows}</span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {delimiter.id === 'tab' ? 'TSV' : 'CSV'} · {data.encodingId === 'utf8_bom' ? 'UTF-8 BOM' : 'UTF-8'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {preview ? `${preview.rowCount} row${preview.rowCount === 1 ? '' : 's'} × ${preview.colCount} col${preview.colCount === 1 ? '' : 's'}` : '—'}
          </div>
        </div>

        <button type="button" onClick={handleExport}
          disabled={busy || !fileObj || file?.isScanned}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Extracting…' : `Export ${delimiter.id === 'tab' ? 'TSV' : 'CSV'}`}
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

function CsvMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">vendor-ledger-q1.csv</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">Extracted from 7-page PDF · 142 rows · 6 columns</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">UTF-8 · comma-delimited</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <div className="mt-3 overflow-x-auto rounded border border-line">
          <table className="w-full text-[9.5px]">
            <thead>
              <tr className="bg-canvas text-left font-mono text-[8px] uppercase tracking-[0.08em] text-convert-dk">
                {['Date', 'Vendor', 'Invoice #', 'Amount', 'GST', 'Total'].map((h) => (
                  <th key={h} className="px-1.5 py-1 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {[
                ['02-Apr-26', 'Westline Hardware',  'WL-2604-022', '1,42,200', '25,596', '1,67,796'],
                ['04-Apr-26', 'BlueDart Surface',   'BD-0408-117', '4,500',    '810',    '5,310'],
                ['08-Apr-26', 'Crossword Books',     'CW-0418-088', '2,240',    '0',      '2,240'],
                ['12-Apr-26', 'IndiGo Airlines',     'IG-7741',    '8,420',    '1,180',  '9,600'],
                ['15-Apr-26', 'Trident Hotels',      'TR-2025-44', '18,900',   '2,268',  '21,168'],
                ['18-Apr-26', 'Adobe Inc',           'ADOBE-4421', '1,240',    '223',    '1,463'],
                ['22-Apr-26', 'AWS Marketplace',     'AWS-MAY-26', '11,200',   '2,016',  '13,216'],
              ].map((r) => (
                <tr key={r[2]} className="border-t border-line">
                  {r.map((c, i) => (
                    <td key={i} className={`px-1.5 py-1 ${i === 0 ? 'text-ink-500' : 'text-ink-900'}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ 135 more rows across the full CSV, ready to import into Xero / Tally / QuickBooks</p>
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
            Tabular PDF in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            spreadsheet CSV out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Auto-detect rows and columns from any text-based PDF. Tune row / column tolerance with a live preview before exporting. Choose your delimiter (comma / semicolon / tab / pipe) and encoding for instant import into your accounting tool.
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
                  All pages · UTF-8
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'vendor-ledger-q1.pdf · 7 pages'],
                  ['Page mode',      'All pages, one CSV'],
                  ['Row tolerance',  'Normal (4pt)'],
                  ['Column tolerance', 'Normal (10pt)'],
                  ['Header row',     'First detected row'],
                  ['Delimiter',      'Comma (CSV)'],
                  ['Encoding',       'UTF-8'],
                  ['Output base',    'vendor-ledger-q1'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">142 rows · 6 cols</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT.CSV</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Import-ready
                </span>
              </div>
              <CsvMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the PDF',          'Drag a bank statement, ledger, GST return, or vendor invoice into the picker. The tool reads its text layer in the browser — nothing uploads.'],
  ['02', 'Tune the detection',     'A live preview shows the detected rows and columns. Bump row / column tolerance up for sparse layouts, down for dense ones. Pick where the header row sits.'],
  ['03', 'Export the CSV',         'One click writes a CSV (or TSV / pipe / semicolon-delimited file) in UTF-8, with optional BOM for Excel. Imports straight into Xero, QuickBooks, Tally, or any spreadsheet.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From tabular PDF{' '}
              <em className="font-serif font-normal italic text-crimson-300">to accounting-ready CSV.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Most accounting tools accept CSV imports but most data lives in PDFs. This tool bridges the gap — auto-detected rows and columns, live preview to verify, then a one-click clean export. Use it for monthly statement imports, GST reconciliations, vendor-ledger transfers, and any "PDF only, sorry" data source.
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
  { title: 'Auto row & column detection', desc: 'Groups text items by y-coordinate (rows) and clusters x-positions (columns) per page. Works on most text-based PDFs without manual column anchors.' },
  { title: 'Live preview',                 desc: 'See the first page rendered as a table the moment you tune tolerances. No need to export to find out the detection went wrong.' },
  { title: '4 delimiter formats',          desc: 'Comma (CSV), semicolon (EU CSV), tab (TSV), pipe — pick whatever your downstream tool expects. The file extension auto-matches.' },
  { title: 'UTF-8 + BOM option',           desc: 'Default is plain UTF-8. Flip on the BOM if you\'re opening the file in older Excel on Windows so non-ASCII characters render correctly.' },
  { title: 'Page-mode flexibility',        desc: 'All pages into one CSV (default), per-page sections with headings, or a custom range like "1-3, 5, 9-end". Page-local column anchors per page.' },
  { title: '100% in browser',               desc: 'PDFs, text items, and the generated CSV all stay on your machine. Extraction runs via pdfjs locally — no upload, no third-party APIs, no logging.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for accounting</Eyebrow>
          <SectionTitle>
            Extract tables{' '}
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
  { q: 'Does this work on scanned PDFs?',                                  a: 'No — this tool needs a text layer to extract. If the PDF was created by scanning paper documents (image-only PDF), the extractor will flag it as scanned and stop. For scans, you need an OCR step first; the pdfFiller premium tier handles that. Most modern PDFs (statements emailed by banks, invoices generated by accounting tools) have text layers and work fine.' },
  { q: 'How does the column detection actually work?',                    a: 'For each page, the tool collects every text item with its (x, y) coordinates. Items with similar y are grouped into rows. Then x-positions across the whole page are clustered (using your column tolerance) to discover where columns sit. Each item in each row is bucketed into its nearest column. This works on most uniformly-laid-out tables; weirdly-formatted PDFs may need tolerance tweaks.' },
  { q: 'My table came out with rows that should be cells. What now?',     a: 'That usually means row tolerance is too tight — items that should share a row are landing on separate rows because they\'re a couple of points off vertically. Bump row tolerance from Tight to Normal, or Normal to Loose. The live preview updates instantly.' },
  { q: 'My table came out with too many columns. What now?',              a: 'Opposite problem — column tolerance is too tight, so single columns are getting split. Move column tolerance up from Tight to Normal or Loose. If two visually-separate columns keep merging together, drop it back down.' },
  { q: 'What\'s the difference between comma, semicolon, and TSV?',       a: 'Comma (CSV) is the standard. Semicolon (EU CSV) is required in countries that use comma as the decimal separator (Germany, France, etc.) — Excel parses semicolon-delimited files there by default. TSV (tab) is great when your data contains lots of commas (vendor names, addresses) since tabs are far less likely to appear in values. Pipe is the same idea, even safer.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The PDF is read into memory, parsed by pdfjs locally, tabularised in JavaScript, serialised to CSV in your browser, and saved via the standard file-download mechanism. No upload, no third-party API, no logging.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">extracting tables.</em>
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
  { name: 'Bank Statement → Excel',   desc: 'Structured statement extractor with debit / credit columns.', Icon: BankStatementIcon, label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
  { name: 'Invoice PDF → Excel',      desc: 'Line items, totals, tax columns from any invoice.',           Icon: InvoicePdfIcon,    label: 'CONVERT', path: '/tools/invoice-pdf-to-excel' },
  { name: 'PDF Table Extractor',      desc: 'Every table from any PDF, column types preserved.',          Icon: PdfToExcelIcon,    label: 'CONVERT' },
  { name: 'Unlock PDF Statements',    desc: 'Strip the password first, then extract to CSV.',              Icon: ExportIcon,        label: 'PDF', path: '/tools/unlock-pdf-statements' },
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

export default function TransactionHistoryPdfToCsvPage() {
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
