import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  PdfToExcelIcon, InvoicePdfIcon, BankStatementIcon, CsvIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  PAGE_MODES, HEADER_MODES, ROW_TOLERANCE_PRESETS, COL_TOLERANCE_PRESETS, NUMBER_MODES,
  findPageMode, findHeaderMode, findRowTolerance, findColTolerance, findNumberMode,
  parseRanges, extractTableFromPage, applyHeaderMode, previewRows,
  formatBytes, coerceCell,
} from '../lib/pdf-to-excel/compute'
import { buildXlsxFromPdf, probePdf } from '../lib/pdf-to-excel/extractXlsx'
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
    <div role="dialog" aria-modal="true" aria-label="PDF Table Extractor"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[720px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Auto',  'Number cells detected'],
  ['Multi', 'Sheet-per-page mode'],
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
            <span className="text-ink-950">PDF Table Extractor</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · Table extraction
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Every table in a PDF,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              extracted
            </em>
            <br />
            with{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              types intact.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop any text-based PDF and the tool detects every table on every page — preserving headers, column types, and numeric formatting. Export to a proper .xlsx workbook (one sheet per page, or flattened) ready to sort, pivot, and edit.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Number-typed cells</span>
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
      <PdfToExcelIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Ledger, statement, GST return, vendor invoice — any tabular PDF</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  pageModeId:     'all_one_sheet',
  pageRangesText: '',
  rowToleranceId: 'normal',
  colToleranceId: 'normal',
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
  /* Cache the pdfjs text-items so the preview can re-run detection
     without re-decoding the PDF on every option change. */
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
        setPreviewError('This PDF appears scanned (no text layer). The XLSX extractor needs text — try the pdfFiller premium tier for OCR.')
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

  /* Live preview — choose the first relevant page, run the table detector,
     and apply the header mode + number-coercion preview. */
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
    const bodyPreview = previewRows(body, 8, 22)
    // Mark cells that would be coerced to numbers in the output
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
              <PdfToExcelIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              XLSX · {file?.pages || '—'} pages · {preview ? `${preview.rowCount} rows × ${preview.colCount} cols` : 'no preview'}
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
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Pages &amp; sheets</span>
            <SelectInput label="Page mode" value={data.pageModeId} onChange={setField('pageModeId')}
              options={PAGE_MODES.map((p) => ({ value: p.id, label: p.label }))} />
            {data.pageModeId === 'range_one_sheet' && (
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
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SelectInput label="Header row" value={data.headerModeId} onChange={setField('headerModeId')}
                options={HEADER_MODES.map((h) => ({ value: h.id, label: h.label }))} />
              <SelectInput label="Number cells" value={data.numberModeId} onChange={setField('numberModeId')}
                options={NUMBER_MODES.map((n) => ({ value: n.id, label: n.label }))} />
            </div>
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Auto-detect upgrades currency / decimal / accounting-formatted strings to real number cells (so SUM works in Excel).
            </p>

            <div className="my-3.5 h-px bg-line" />

            {/* Naming */}
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">File name</span>
            <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
            <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
              Saves as <span className="text-ink-700">{(data.baseName || 'extracted').replace(/[^a-z0-9-]+/gi, '-')}.xlsx</span>
            </p>

            <div className="my-3.5 h-px bg-line" />

            {/* Live preview */}
            {preview && (
              <div className="rounded-lg border border-line bg-canvas">
                <p className="m-0 px-3 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">
                  Preview · page {preview.page} of {preview.totalPages} · {preview.rowCount} body rows · cells in {' '}
                  <span className="text-success">green</span> become number-typed
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
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Number cells</span>
            <span className="font-mono text-[12px] font-bold text-convert">{numberMode.label.split('(')[0].trim()}</span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · workbook ready</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Sheets</span>
              <span className="text-ink-950">{result.sheets} (+ _meta)</span>
            </div>
          </div>
        )}

        {/* Big total */}
        <div className="mt-3 rounded-lg border border-convert/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-convert">Will save</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              .xlsx · {pageMode.id === 'sheet_per_page' ? 'multi-sheet' : 'single sheet'}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {preview ? `${preview.rowCount} row${preview.rowCount === 1 ? '' : 's'} × ${preview.colCount} col${preview.colCount === 1 ? '' : 's'}` : '—'}
          </div>
        </div>

        <button type="button" onClick={handleExport}
          disabled={busy || !fileObj || file?.isScanned}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Extracting…' : 'Export .xlsx workbook'}
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
            <p className="m-0 text-[14px] font-bold text-ink-950">vendor-ledger-q1.xlsx</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">Extracted from 7-page PDF · 142 rows · 6 columns · numbers as numbers</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Sheet: Extracted</p>
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
                ['02-Apr-26', 'Westline Hardware', 'WL-2604-022', 142200, 25596, 167796],
                ['04-Apr-26', 'BlueDart Surface',  'BD-0408-117', 4500,   810,   5310],
                ['08-Apr-26', 'Crossword Books',    'CW-0418-088', 2240,   0,     2240],
                ['12-Apr-26', 'IndiGo Airlines',    'IG-7741',     8420,   1180,  9600],
                ['15-Apr-26', 'Trident Hotels',     'TR-2025-44',  18900,  2268,  21168],
                ['18-Apr-26', 'Adobe Inc',          'ADOBE-4421',  1240,   223,   1463],
                ['22-Apr-26', 'AWS Marketplace',    'AWS-MAY-26',  11200,  2016,  13216],
              ].map((r) => (
                <tr key={r[2]} className="border-t border-line">
                  {r.map((c, i) => {
                    const isNum = i >= 3
                    return (
                      <td key={i} className={`px-1.5 py-1 ${isNum ? 'text-right text-success font-medium' : (i === 0 ? 'text-ink-500' : 'text-ink-900')}`}>
                        {isNum ? c.toLocaleString() : c}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ 135 more rows · numeric cells are real numbers (SUM, AVG, sort all work)</p>
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
            editable workbook out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Auto-detect rows and columns from any text-based PDF, then export a real .xlsx — not just a CSV with a different extension. Numbers come through as number cells; one sheet per page or all pages flattened, your choice.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <PdfToExcelIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">XLSX Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  All pages · auto numbers
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'vendor-ledger-q1.pdf · 7 pages'],
                  ['Page mode',      'All pages → one sheet'],
                  ['Row tolerance',  'Normal (4pt)'],
                  ['Column tolerance', 'Normal (10pt)'],
                  ['Header row',     'First detected row'],
                  ['Number cells',   'Auto-detect (recommended)'],
                  ['Output base',    'vendor-ledger-q1'],
                  ['Output',         '142 rows × 6 cols + _meta'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">1 .xlsx · 2 sheets</span>
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
  ['01', 'Drop the PDF',          'Drag a ledger, statement, report, or vendor invoice in. The tool reads its text layer locally with pdfjs — nothing uploads.'],
  ['02', 'Tune the detection',     'Live preview shows the table the moment you change settings. Cells flagged in green become real number cells in the output.'],
  ['03', 'Export the workbook',    'One click writes a proper .xlsx — one sheet per page or all pages combined — with a _meta sheet recording how the extraction was configured.'],
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
              <em className="font-serif font-normal italic text-crimson-300">to working spreadsheet.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            The difference between a CSV export and a proper .xlsx is whether the recipient can immediately SUM a column. This tool coerces numbers to number cells so the workbook is genuinely editable — pivot it, sort it, chart it without manual re-typing.
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
  { title: 'Real number cells',         desc: 'Currency-prefixed, comma-thousands, EU-decimal, accounting-negative, percentage — all detected and upgraded to number-typed cells. SUM and AVG work without manual cleanup.' },
  { title: 'Sheet-per-page or combined', desc: 'Render every page as its own named sheet (great for multi-section reports), or flatten everything into one sheet (great for long tables that span pages).' },
  { title: 'Live preview with flagged cells', desc: 'See the first page rendered as a table the moment you tune tolerances. Cells in green will become real numbers in the output — adjust before exporting.' },
  { title: 'Custom range support',       desc: 'Skip the cover or appendices by extracting just "2-5, 7" — page-local column anchors per page so each section\'s columns line up.' },
  { title: '_meta sheet for audit',       desc: 'Every output workbook includes a tiny _meta sheet recording the source file, mode, tolerance, header setting, and number-coercion choice. Reproducibility for free.' },
  { title: '100% in browser',             desc: 'PDFs and the assembled workbook never touch the network. Extraction runs via pdfjs, output assembled via SheetJS — entirely locally.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for accounting</Eyebrow>
          <SectionTitle>
            Real .xlsx{' '}
            <em className="font-serif font-normal italic text-crimson-300">— not CSV in disguise.</em>
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
  { q: 'How is this different from PDF to CSV?',                          a: 'Both use the same table detector under the hood. CSV is a flat text format; .xlsx is a real workbook with typed cells, multiple sheets, column widths, and number formats. Use PDF to CSV when the downstream tool expects CSV (most accounting systems). Use PDF to Excel when you want a real spreadsheet you can open, sort, pivot, and edit in Excel / Numbers / Google Sheets without further cleanup.' },
  { q: 'Why are some cells flagged green in the preview?',                a: 'Those are the cells the number-coercion step will upgrade to actual number cells in the output. Currency-prefixed values ("INR 4,521.50"), accounting negatives ("(1,200.00)"), and percentages ("12.5%") all get detected and converted. Cells in default colour stay as strings.' },
  { q: 'Does this work on scanned PDFs?',                                 a: 'No — this tool needs a text layer. Scanned (image-only) PDFs need an OCR step first; the pdfFiller premium tier handles that. Most modern PDFs (statements, invoices, GST returns) have text layers and work fine.' },
  { q: 'What\'s the _meta sheet?',                                         a: 'A small one-page sheet at the end of the workbook that records the source PDF name, page count, mode, tolerance, header setting, and number-coercion choice. Useful for audit trails ("how was this extracted?") and for sharing with colleagues who need to know whether to trust the numbers.' },
  { q: 'My table came out badly — what should I tweak first?',            a: 'Two knobs: row tolerance (if too tight, items that should share a row land on separate rows; loosen it) and column tolerance (if too tight, single columns get split into many; loosen it). The live preview shows the result instantly so you can iterate without exporting.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The PDF is read with pdfjs locally, tabularised in JavaScript, and serialised to .xlsx with SheetJS locally. The browser triggers the download. No upload, no third-party API, no logging.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">extracting workbooks.</em>
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
  { name: 'PDF to CSV',                desc: 'Same table detector, CSV output instead of .xlsx.',     Icon: CsvIcon,           label: 'CONVERT', path: '/tools/pdf-to-csv' },
  { name: 'Invoice PDF → Excel',       desc: 'Structured line items + totals from invoice PDFs.',     Icon: InvoicePdfIcon,    label: 'CONVERT', path: '/tools/invoice-pdf-to-excel' },
  { name: 'Bank Statement → Excel',    desc: 'Statement extractor with debit / credit columns.',      Icon: BankStatementIcon, label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
  { name: 'Excel to PDF',              desc: 'Reverse: spreadsheet into a fixed-layout PDF.',         Icon: ExportIcon,        label: 'CONVERT', path: '/tools/excel-to-pdf' },
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

export default function PdfTableExtractorPage() {
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
