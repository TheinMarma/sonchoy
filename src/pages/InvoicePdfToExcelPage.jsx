import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Upload, Plus,
  InvoicePdfIcon, BankStatementIcon, CsvIcon, OcrIcon, TableIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'
import { extractTextFromPdf, isLikelyScanned } from '../lib/pdfExtract'
import { parseInvoice } from '../lib/parseInvoice'
import { buildWorkbook, downloadWorkbook, suggestedFilename } from '../lib/buildWorkbook'

const MAX_BYTES = 25 * 1024 * 1024 /* 25 MB */

/* ---------- Local helpers ---------- */

const Eyebrow = ({ children, className = '' }) => (
  <p className={`m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-crimson-300 ${className}`}>
    {children}
  </p>
)

const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`m-0 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-ink-950 ${className}`}>
    {children}
  </h2>
)

function formatNumber(value, currency = null) {
  if (value == null || value === '') return '—'
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d,.\-]/g, ''))
  if (isNaN(num)) return String(value)
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currency ? `${currency} ${formatted}` : formatted
}

/* ---------- Sample data shown in the preview before any upload ---------- */

const SAMPLE_INVOICE = {
  fileName: 'sample-invoice.pdf',
  invoiceNumber: 'INV-26-0142',
  issueDate: '2026-05-31',
  dueDate: '2026-06-14',
  currency: 'USD',
  vendor: 'Sonchoy Studio · 7 Old Street · London EC1V 9HL',
  buyer: 'Northwind Books Ltd. · accounts@northwind.co',
  subtotal: 21720,
  tax: 4344,
  total: 26064,
  discount: null,
  shipping: null,
  confidence: 96,
  lineItems: [
    { description: 'Brand strategy & identity sprint',     quantity: 1,  unitPrice: 8400,  total: 8400 },
    { description: 'Web design — landing & onboarding',    quantity: 2,  unitPrice: 5200,  total: 10400 },
    { description: 'Implementation support, May',          quantity: 12, unitPrice: 150,   total: 1800 },
    { description: 'Hosting & monitoring (Q2 prepay)',     quantity: 3,  unitPrice: 480,   total: 1440 },
    { description: 'Stock photography licence renewal',    quantity: 1,  unitPrice: 320,   total: 320 },
  ],
}

/* ---------- File processing pipeline ---------- */

async function processPdf(file) {
  if (!file) throw new Error('Please choose a PDF file.')
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (!isPdf) throw new Error('Only PDF files are supported. Try a different upload.')
  if (file.size > MAX_BYTES) throw new Error('File is larger than 25 MB. Try the pdfFiller premium tier for bigger files.')

  let extracted
  try {
    extracted = await extractTextFromPdf(file)
  } catch (e) {
    console.error('[invoice-pdf-to-excel] pdf.js failed:', e)
    throw new Error(`Couldn't read the PDF — ${e?.message || 'unknown error'}.`)
  }

  const { items, numPages, totalChars } = extracted
  console.info('[invoice-pdf-to-excel] extracted', {
    pages: numPages,
    items: items.length,
    chars: totalChars,
  })

  if (isLikelyScanned(items, totalChars)) {
    const err = new Error(
      `This looks like a scanned PDF (only ${totalChars} characters of text found across ${numPages} page${numPages === 1 ? '' : 's'}). OCR isn't available on the free tier — try pdfFiller premium for scanned invoices.`,
    )
    err.code = 'SCANNED'
    throw err
  }

  const invoice = parseInvoice(items, file.name)
  invoice.numPages = numPages
  console.info('[invoice-pdf-to-excel] parsed', {
    invoiceNumber: invoice.invoiceNumber,
    total: invoice.total,
    lineItems: invoice.lineItems.length,
    confidence: invoice.confidence,
  })
  return invoice
}

/* ---------- 1) Tool hero ---------- */

/* Wraps the existing Uploader in a Sonchoy-standard launch modal — same
   visual shell as every other tool page (bg-black/90 + backdrop-blur,
   Esc to close, click-outside dismisses). */
function LiveDemoModal({ open, onClose, children }) {
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
    <div role="dialog" aria-modal="true" aria-label="Invoice PDF Extractor"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        {children}
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['95–99%', 'Line-item accuracy'],
  ['Multi',  'GST · VAT · sales tax'],
  ['Local',  '100% in browser'],
  ['Free',   '25 MB free tier'],
]

function ToolHero({ uploader }) {
  const [open, setOpen] = useState(false)
  /* Auto-close the modal when the upload succeeds — the user is then
     scrolled to the preview section by the page-level handler. */
  useEffect(() => {
    if (uploader?.status === 'success') setOpen(false)
  }, [uploader?.status])

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
            <span className="text-ink-950">Invoice PDF to Excel</span>
          </nav>

          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            Convert · Document extraction
          </span>

          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Invoice PDF{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              to Excel,
            </em>
            <br />
            in{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              seconds.
            </em>
          </h1>

          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Drop in any invoice PDF and pull every line item, vendor field, tax row, and total out into a clean .xlsx workbook — formatted, totalled, and ready to drop into your accounting software.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Confidence score per row</span>
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

      <LiveDemoModal open={open} onClose={() => setOpen(false)}>
        <Uploader {...uploader} />
      </LiveDemoModal>
    </>
  )
}

/* ---------- 2) Uploader card (interactive) ---------- */

function Uploader({ status, fileMeta, error, onPick, onDrop, onReset, onDownload }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const triggerBrowse = () => inputRef.current?.click()

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) onPick(f)
    e.target.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) onDrop(f)
  }

  return (
    <aside className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }}
      />

      <div className="relative rounded-2xl border border-line bg-surface p-7 shadow-xl">
        <div className="mb-5 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em]">
          <span className="inline-flex items-center gap-2 text-ink-500">
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'parsing' ? 'animate-pulse bg-crimson-400' : status === 'success' ? 'bg-success' : status === 'error' ? 'bg-danger' : 'bg-convert'}`} />
            {status === 'parsing' && 'Reading invoice…'}
            {status === 'success' && 'Extraction complete'}
            {status === 'error' && 'Extraction failed'}
            {status === 'idle' && 'Upload your invoice'}
          </span>
          <span className="rounded-full border border-line bg-canvas px-2 py-0.5 text-ink-500">
            Free · 25 MB
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden
        />

        {/* IDLE / DRAG state */}
        {(status === 'idle' || status === 'parsing') && (
          <div
            onClick={status === 'idle' ? triggerBrowse : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={status === 'idle' ? 0 : -1}
            onKeyDown={(e) => {
              if (status === 'idle' && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                triggerBrowse()
              }
            }}
            className={`cursor-pointer rounded-xl border-[1.5px] border-dashed p-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 ${
              dragOver
                ? 'border-convert bg-convert-bg/50'
                : 'border-line-strong bg-canvas hover:border-convert/60 hover:bg-convert-bg/30'
            } ${status === 'parsing' ? 'cursor-wait' : ''}`}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-line bg-surface text-convert">
              {status === 'parsing' ? (
                <span className="block h-6 w-6 animate-spin rounded-full border-2 border-convert border-t-transparent" />
              ) : (
                <Upload size={28} />
              )}
            </div>
            <h3 className="mb-1 text-lg font-medium tracking-[-0.015em] text-ink-950">
              {status === 'parsing' ? 'Extracting line items…' : 'Drop your invoice PDF'}
            </h3>
            <p className="mb-5 text-[13px] text-ink-500">
              {status === 'parsing' ? (
                <>parsing <code className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-700">{fileMeta?.name}</code></>
              ) : (
                <>or <code className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-700">click to browse</code> from your device</>
              )}
            </p>
            {status === 'idle' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); triggerBrowse() }}
                className="btn btn-primary btn-lg"
              >
                <Plus size={14} />
                Choose a PDF
              </button>
            )}
            {status === 'parsing' && (
              <p className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500">
                runs locally · no upload
              </p>
            )}
          </div>
        )}

        {/* SUCCESS state */}
        {status === 'success' && fileMeta && (
          <div className="rounded-xl border border-success/40 bg-success-bg/40 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
              <Check size={22} />
            </div>
            <h3 className="m-0 mb-1 text-lg font-medium tracking-[-0.015em] text-ink-950">
              Ready to download
            </h3>
            <p className="m-0 mb-5 text-[13px] text-ink-600">
              <code className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-700">
                {fileMeta.name}
              </code>
              {' · '}
              {fileMeta.lineItems} line items
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={onDownload} className="btn btn-primary btn-lg">
                Download .xlsx
                <ArrowRight size={14} />
              </button>
              <button type="button" onClick={onReset} className="btn btn-secondary btn-lg">
                Convert another
              </button>
            </div>
          </div>
        )}

        {/* ERROR state */}
        {status === 'error' && (
          <div className="rounded-xl border border-danger/40 bg-danger-bg/40 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 9v4M12 17h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <h3 className="m-0 mb-1 text-lg font-medium tracking-[-0.015em] text-ink-950">
              Couldn't extract that file
            </h3>
            <p className="m-0 mb-5 text-[13px] text-ink-700">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={onReset} className="btn btn-primary btn-lg">
                Try another PDF
              </button>
              <a
                href="https://go.sonchoy.com/pdfFiller"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg"
              >
                Use pdfFiller premium
              </a>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div className="flex flex-wrap gap-1.5">
            {['PDF', '25 MB MAX', '1 FILE'].map((f) => (
              <span
                key={f}
                className="rounded border border-line bg-canvas px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-600"
              >
                {f}
              </span>
            ))}
          </div>
          <a
            href="https://go.sonchoy.com/pdfFiller"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-crimson-300 no-underline hover:text-crimson-400"
          >
            Need batch?
            <ArrowRight size={11} />
          </a>
        </div>
      </div>
    </aside>
  )
}

/* ---------- 3) Preview — shows real or sample data ---------- */

function PreviewSection({ invoice, isReal }) {
  const lineItemsForPreview = invoice.lineItems.slice(0, 6)
  const moreCount = invoice.lineItems.length - lineItemsForPreview.length

  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[760px] text-center">
          <Eyebrow className="mb-4">{isReal ? '01 — Your extracted data' : '01 — What you get back'}</Eyebrow>
          <SectionTitle>
            {isReal ? (
              <>From your invoice{' '}
                <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
                this spreadsheet.</>
            ) : (
              <>From PDF{' '}
                <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
                structured spreadsheet.</>
            )}
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            {isReal
              ? 'Below is a preview of what we pulled out. Click "Download .xlsx" above to grab the full workbook with Header, Line Items, and Confidence sheets.'
              : 'Every line item, tax row, and total — split into clean columns. No copy-paste, no manual cleanup.'}
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          {/* Input — invoice metadata card */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <InvoicePdfIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    {isReal ? 'INPUT.PDF' : 'SAMPLE.PDF'}
                  </span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                  {invoice.numPages ? `${invoice.numPages} page${invoice.numPages === 1 ? '' : 's'}` : '3 pages'}
                  {' · '}
                  {invoice.fileName?.length > 20 ? invoice.fileName.slice(0, 17) + '…' : invoice.fileName || 'sample'}
                </span>
              </div>

              <div className="rounded-md border border-line bg-canvas p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="m-0 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">
                      Invoice
                    </p>
                    <p className="m-0 mt-1 truncate text-[15px] font-medium text-ink-950">
                      {invoice.invoiceNumber || '—'}
                    </p>
                  </div>
                  <p className="m-0 shrink-0 text-right text-[11px] text-ink-500">
                    {invoice.issueDate || '—'}
                    {invoice.dueDate && (
                      <>
                        <br />Due {invoice.dueDate}
                      </>
                    )}
                  </p>
                </div>

                <dl className="m-0 grid grid-cols-1 gap-y-3 text-[11px] sm:grid-cols-2">
                  <div>
                    <dt className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">From</dt>
                    <dd className="m-0 text-[12px] leading-[1.5] text-ink-800">{invoice.vendor || '—'}</dd>
                  </div>
                  <div>
                    <dt className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Bill to</dt>
                    <dd className="m-0 text-[12px] leading-[1.5] text-ink-800">{invoice.buyer || '—'}</dd>
                  </div>
                </dl>

                <div className="mt-4 border-t border-line pt-3">
                  <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-[11px]">
                    <dt className="text-ink-500">Subtotal</dt>
                    <dd className="m-0 text-right font-mono text-ink-800">
                      {formatNumber(invoice.subtotal)}
                    </dd>
                    <dt className="text-ink-500">Tax</dt>
                    <dd className="m-0 text-right font-mono text-ink-800">
                      {formatNumber(invoice.tax)}
                    </dd>
                    <dt className="border-t border-line pt-2 font-medium text-ink-950">Total</dt>
                    <dd className="m-0 border-t border-line pt-2 text-right font-mono font-medium text-ink-950">
                      {formatNumber(invoice.total, invoice.currency)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 rotate-90 items-center justify-center rounded-full border border-crimson-500/40 bg-canvas text-crimson-300 shadow-[0_4px_18px_-4px_rgba(237,40,40,0.4)] lg:rotate-0">
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Output — line items table */}
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-business-bg text-business">
                    <TableIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                    OUTPUT.XLSX
                  </span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  {invoice.confidence}% confidence
                </span>
              </div>

              <div className="overflow-hidden rounded-md border border-line">
                <table className="w-full text-[10px]">
                  <thead className="bg-canvas">
                    <tr>
                      {['#', 'Description', 'Qty', 'Unit', 'Amount'].map((h) => (
                        <th
                          key={h}
                          className="border-b border-r border-line px-2 py-2 text-left font-mono font-medium uppercase tracking-[0.06em] text-ink-500 last:border-r-0"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItemsForPreview.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-ink-500">
                          No line items detected
                        </td>
                      </tr>
                    )}
                    {lineItemsForPreview.map((it, n) => (
                      <tr key={n} className="bg-paper/50">
                        <td className="border-b border-r border-line px-2 py-2 font-mono text-ink-500">
                          {String(n + 1).padStart(3, '0')}
                        </td>
                        <td className="border-b border-r border-line px-2 py-2 text-ink-800 truncate max-w-[180px]" title={it.description}>
                          {it.description || '—'}
                        </td>
                        <td className="border-b border-r border-line px-2 py-2 text-right text-ink-700">
                          {it.quantity ?? '—'}
                        </td>
                        <td className="border-b border-r border-line px-2 py-2 text-right font-mono text-ink-700">
                          {formatNumber(it.unitPrice)}
                        </td>
                        <td className="border-b border-line px-2 py-2 text-right font-mono font-medium text-ink-950">
                          {formatNumber(it.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {moreCount > 0 && (
                <p className="m-0 mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                  + {moreCount} more line item{moreCount === 1 ? '' : 's'} in the .xlsx
                </p>
              )}
              {moreCount <= 0 && (
                <p className="m-0 mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                  + Header / Confidence sheets included
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 4) How it works ---------- */

const STEPS = [
  ['01', 'Drop the PDF',     'Drag your invoice — single or multi-page — onto the upload tile, or browse for a file. PDF up to 25 MB on the free tier.'],
  ['02', 'We parse the rows', 'Tables, line items, tax breakdowns, and totals are detected and structured. Confidence scored per cell so you see what to verify.'],
  ['03', 'Download the .xlsx', 'A clean workbook with line items, summary, and vendor sheet. Files are deleted from our servers within an hour.'],
]

function HowItWorks() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              Three steps from{' '}
              <em className="font-serif font-normal italic text-crimson-300">PDF to spreadsheet.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            No setup, no signup. Drop your file, wait a few seconds, download the .xlsx — works for one-off vendor invoices and end-of-month batches alike.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(([num, title, desc]) => (
            <div key={num} className="rounded-xl border border-line bg-surface p-8">
              <div className="mb-4 font-serif text-[56px] font-normal italic leading-none text-crimson-300">
                {num}
              </div>
              <h4 className="m-0 mb-2 text-xl font-medium tracking-[-0.015em] text-ink-950">
                {title}
              </h4>
              <p className="m-0 text-md leading-[1.55] text-ink-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 5) What gets extracted ---------- */

const EXTRACTED = [
  { title: 'Vendor & buyer details',     desc: 'Names, addresses, tax IDs, contact info — into named cells you can reference.' },
  { title: 'Invoice header fields',      desc: 'Invoice number, issue date, due date, payment terms, currency.' },
  { title: 'Line items',                 desc: 'Description, quantity, unit price, line total — one row each.' },
  { title: 'Tax breakdowns',             desc: 'GST / VAT / Sales-tax rates, base amounts, and computed tax columns.' },
  { title: 'Totals & balances',          desc: 'Subtotal, discount, shipping, tax, grand total, balance due.' },
  { title: 'Confidence per cell',        desc: 'Each extracted value carries a 0–100 score so you know what to spot-check.' },
]

function Extracted() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — What gets extracted</Eyebrow>
          <SectionTitle>
            Every cell that{' '}
            <em className="font-serif font-normal italic text-crimson-300">a human</em> would type.
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {EXTRACTED.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-convert/20 bg-convert-bg text-convert">
                <Check size={16} />
              </div>
              <h4 className="m-0 mb-2 text-lg font-medium tracking-[-0.015em] text-ink-950">
                {f.title}
              </h4>
              <p className="m-0 text-md leading-[1.55] text-ink-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 7) FAQ ---------- */

const FAQS = [
  { q: 'What kind of invoice PDFs work?', a: 'Anything text-based: PDFs exported from accounting software, vendor portals, freelance platforms, or invoice generators. Scanned (image-only) PDFs need OCR — that\'s available on the pdfFiller premium tier.' },
  { q: 'How accurate is the line-item extraction?', a: 'Typically 95–99% on clean, text-based invoices. Each cell ships with a confidence score in the .xlsx so you can highlight low-confidence rows for review. Structured tables (most modern invoices) score highest.' },
  { q: 'Does it preserve tax columns and currencies?', a: 'Yes. GST, VAT, Sales-tax, and reverse-charge breakdowns are detected and split into their own columns. Currency code is captured from the invoice header and stamped on every monetary cell.' },
  { q: 'What happens to my file?', a: 'Extraction runs entirely in your browser — your file never leaves your device. Nothing is uploaded to our servers, nothing is stored, nothing is shared.' },
  { q: 'Can I do batch conversion?', a: 'The free tier handles one PDF at a time, up to 25 MB. For batch (100+ files at once), OCR on scans, or accounting-software push, the pdfFiller premium tier is free for 30 days.' },
  { q: 'Output formats?', a: 'Default is .xlsx with a Line Items sheet, a Header sheet (vendor, buyer, totals), and a Confidence sheet. .csv export is one click away.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">extracting invoices.</em>
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {FAQS.map(({ q, a }, idx) => (
            <div key={q} className="bg-surface p-8">
              <h4 className="m-0 mb-3 flex items-start gap-3 text-lg font-medium tracking-[-0.015em] text-ink-950">
                <span className="mt-1 shrink-0 font-mono text-[11px] tracking-[0.1em] text-crimson-300">
                  {String(idx + 1).padStart(2, '0')}
                </span>
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

/* ---------- 8) Related tools ---------- */

const RELATED = [
  { name: 'Bank Statement PDF to Excel', desc: 'Reconciled transaction tables — dates, amounts, balances.', Icon: BankStatementIcon, label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
  { name: 'PDF to CSV',                  desc: 'Tabular PDFs into CSV — accounting-software friendly.',     Icon: CsvIcon,            label: 'CONVERT' },
  { name: 'OCR Invoice to Excel',        desc: 'Scanned invoices into structured Excel rows.',              Icon: OcrIcon,            label: 'CONVERT' },
  { name: 'PDF Table Extractor',         desc: 'Pull every table out of any PDF with column types kept.',  Icon: TableIcon,          label: 'CONVERT' },
]

function RelatedTools() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="mb-3">05 — Related tools</Eyebrow>
            <SectionTitle>
              Often used{' '}
              <em className="font-serif font-normal italic text-crimson-300">together.</em>
            </SectionTitle>
          </div>
          <Link
            to="/#tools"
            className="inline-flex items-center gap-2 font-medium text-[14px] text-crimson-300 underline decoration-crimson-500/40 underline-offset-4 hover:decoration-crimson-300"
          >
            Browse all 91 tools
            <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((t) => {
            const inner = (
              <>
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-convert">
                  {t.label}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-convert-bg text-convert">
                  <t.Icon />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-md font-medium tracking-[-0.01em] text-ink-950">
                    {t.name}
                  </h4>
                  <p className="m-0 text-xs leading-[1.5] text-ink-500">{t.desc}</p>
                </div>
              </>
            )
            const cls =
              'group relative flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md'
            return t.path ? (
              <Link key={t.name} to={t.path} className={cls}>{inner}</Link>
            ) : (
              <a key={t.name} href="#" className={cls}>{inner}</a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page (state container) ---------- */

export default function InvoicePdfToExcelPage() {
  const [status, setStatus] = useState('idle') // idle | parsing | success | error
  const [invoice, setInvoice] = useState(null) // parsed result
  const [error, setError] = useState(null)
  const [fileMeta, setFileMeta] = useState(null) // { name, size, lineItems }

  const handleFile = useCallback(async (file) => {
    setStatus('parsing')
    setError(null)
    setFileMeta({ name: file.name, size: file.size })
    try {
      const result = await processPdf(file)
      setInvoice(result)
      setFileMeta({ name: file.name, size: file.size, lineItems: result.lineItems.length })
      setStatus('success')
      // Smooth-scroll to the preview so the user sees what was extracted
      requestAnimationFrame(() => {
        document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong while reading that PDF.')
      setStatus('error')
    }
  }, [])

  const handleReset = useCallback(() => {
    setStatus('idle')
    setInvoice(null)
    setError(null)
    setFileMeta(null)
  }, [])

  const handleDownload = useCallback(() => {
    if (!invoice) return
    const wb = buildWorkbook(invoice)
    downloadWorkbook(wb, suggestedFilename(invoice.fileName))
  }, [invoice])

  const previewInvoice = status === 'success' && invoice ? invoice : SAMPLE_INVOICE
  const isReal = status === 'success' && invoice != null

  return (
    <>
      <ToolHero
        uploader={{
          status,
          fileMeta,
          error,
          onPick: handleFile,
          onDrop: handleFile,
          onReset: handleReset,
          onDownload: handleDownload,
        }}
      />
      <div id="preview">
        <PreviewSection invoice={previewInvoice} isReal={isReal} />
      </div>
      <CalloutStatHook />
      <HowItWorks />
      <Extracted />
      <PromoBento tone="canvas" />
      <FAQ />
      <RelatedTools />
    </>
  )
}
