'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  SignatureIcon, MergeIcon, LockIcon, CompressIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  QUALITY_PRESETS, TYPE_FONTS, POSITIONS, PAGE_SELECTIONS, SIGNATURE_MODES,
  findQuality, findPosition, findPageSelection,
  buildTypedSignatureDataUrl, formatBytes,
} from '@/lib/sign-pdf/compute'
import { applySignature, probePdf, fileToDataUrl } from '@/lib/sign-pdf/signPdf'

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
    <div role="dialog" aria-modal="true" aria-label="Add Signature to PDF"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[700px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Type',   'Or draw or upload'],
  ['7',      'Position presets'],
  ['Local',  '100% in browser'],
  ['Free',   'Always · no signup'],
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
            <span className="text-ink-950">Add Signature to PDF</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            PDF · Sign
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Type, draw,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              or upload
            </em>
            <br />
            your{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              signature.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Sign contracts, quotes, and proposals in your browser. Type a name in a cursive font, draw with your trackpad, or upload a scanned signature. Drop it on the last page (or any page) at any position. Output is a signed PDF — original stays untouched.
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
function NumberInput({ label, value, onChange, suffix, min, max, step = '1', className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input type="number" inputMode="decimal" step={step}
          min={min} max={max}
          value={value ?? 0}
          onChange={(e) => {
            const v = e.target.value
            if (v === '') return onChange(0)
            const n = Number(v) || 0
            onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n)))
          }}
          className={`${inputClass} text-right font-mono ${suffix ? 'pr-12' : ''}`} />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-500">{suffix}</span>
        )}
      </div>
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
function ColorInput({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="flex items-stretch gap-2">
        <input type="color" value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-[36px] w-[44px] cursor-pointer rounded-lg border border-line bg-paper p-0.5" />
        <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          placeholder="#0A0A09"
          className={`${inputClass} font-mono`} />
      </div>
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
      <SignatureIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Contract, quote, proposal — anything that needs your sign-off</p>
    </div>
  )
}

/* ---------- Drawing canvas ---------- */

function SignaturePad({ dataUrl, onChange, color }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })
  const W = 560, H = 180

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    // Clear once on mount; subsequent draws keep strokes.
    ctx.clearRect(0, 0, c.width, c.height)
  }, [])

  const getPos = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    const touch = e.touches && e.touches[0]
    const clientX = touch ? touch.clientX : e.clientX
    const clientY = touch ? touch.clientY : e.clientY
    return {
      x: ((clientX - r.left) / r.width) * W,
      y: ((clientY - r.top) / r.height) * H,
    }
  }

  const start = (e) => {
    e.preventDefault()
    drawingRef.current = true
    lastRef.current = getPos(e)
  }
  const move = (e) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getPos(e)
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastRef.current.x, lastRef.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    lastRef.current = { x, y }
  }
  const end = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const png = canvasRef.current.toDataURL('image/png')
    onChange(png)
  }
  const clear = () => {
    const c = canvasRef.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    onChange('')
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-line bg-paper">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          className="block w-full cursor-crosshair touch-none"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 font-mono text-[10px] text-ink-500">
          {dataUrl ? 'Signature captured' : 'Draw above with mouse or finger'}
        </p>
        <button type="button" onClick={clear}
          className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
          Clear
        </button>
      </div>
    </div>
  )
}

/* ---------- Live preview of the signed page ---------- */

function SignedPagePreview({ data, sigDataUrl }) {
  const pos = findPosition(data.positionId)
  const customX = Number(data.customX) || 0
  const customY = Number(data.customY) || 0
  const widthPct = Math.max(0.05, Math.min(1, Number(data.widthPct) || 0.25))

  let style = { position: 'absolute', pointerEvents: 'none' }
  const widthCss = `${widthPct * 100}%`
  switch (pos.id) {
    case 'br': style = { ...style, bottom: 18, right: 18 }; break
    case 'bl': style = { ...style, bottom: 18, left: 18 };  break
    case 'bc': style = { ...style, bottom: 18, left: '50%', transform: 'translateX(-50%)' }; break
    case 'tr': style = { ...style, top: 18, right: 18 }; break
    case 'tl': style = { ...style, top: 18, left: 18 }; break
    case 'c':  style = { ...style, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }; break
    case 'custom':
      style = { ...style, top: `${customY}%`, left: `${customX}%` }
      break
    default:
      style = { ...style, bottom: 18, right: 18 }
  }

  return (
    <div className="relative aspect-[1/1.414] overflow-hidden rounded-md border border-line bg-paper">
      <div className="absolute inset-0 p-4 text-[8.5px] text-ink-500">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[10px] font-bold text-ink-950">Service Agreement</p>
            <p className="m-0">Sonchoy Studio Pvt Ltd · Northwind Books Pvt Ltd</p>
          </div>
          <div className="text-right text-[8px]">
            <p className="m-0">Ref: SCY-NWB-26-001</p>
            <p className="m-0">Dated: 23 May 2026</p>
          </div>
        </div>
        <div className="my-2 h-px bg-line" />
        <p className="m-0 text-[8px] text-ink-700">
          This agreement sets out the terms between the parties for the provision of brand and design
          services across the period 23 May 2026 to 22 May 2027. The Service Provider agrees to deliver
          the scope described in Schedule A, against the fees set out in Schedule B, on the timelines
          set out in Schedule C.
        </p>
        <p className="m-0 mt-2 text-[8px] text-ink-700">
          The Client agrees to make payments per the schedule below, and to provide timely access to
          stakeholders, brand assets, and decision-makers needed for the work. Either party may terminate
          with 30 days written notice; obligations accrued before termination remain due.
        </p>
        <p className="m-0 mt-2 text-[8px] text-ink-500">
          ... terms continue across 6 more pages including Schedule A (scope of work), Schedule B (fees),
          Schedule C (timelines), Schedule D (acceptance criteria) ...
        </p>
        <div className="absolute bottom-4 right-4 text-right text-[7.5px] text-ink-500">
          <p className="m-0 font-mono">x ____________________________</p>
          <p className="m-0 mt-0.5">Service Provider signature</p>
        </div>
      </div>

      {sigDataUrl && (
        <img
          src={sigDataUrl}
          alt="Signature preview"
          style={{ ...style, width: widthCss }}
        />
      )}
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  mode: 'type',                  // 'type' | 'draw' | 'upload'
  // Typed mode
  typedText: 'Alex Hartwell',
  typedFontId: 'cursive',
  typedColor: '#0A0A09',
  // Drawn mode
  drawnDataUrl: '',
  drawColor: '#0A0A09',
  // Uploaded mode
  uploadedDataUrl: '',
  // Placement
  positionId: 'br',
  customX: 60,
  customY: 80,
  widthPct: 0.25,
  // Page selection
  pageSelectionId: 'last',
  customPage: 1,
  // Caption / metadata
  includeCaption: true,
  signerName: 'Alex Hartwell',
  signedDate: todayISO(),
  // Render
  qualityId: 'medium',
  baseName: '',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)
  const [fileObj, setFileObj] = useState(null)
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  /* Read file, get page count + first page dims */
  const handlePick = useCallback(async (raw) => {
    setFileObj(raw); setResult(null)
    setFile({ name: raw.name, size: raw.size, pages: null })
    setData((s) => ({ ...s, baseName: raw.name.replace(/\.pdf$/i, '') }))
    setProgress({ stage: 'probing', pct: 4, message: `Reading ${raw.name}…` })
    try {
      const info = await probePdf(raw)
      setFile({ name: raw.name, size: raw.size, pages: info.pages })
      setProgress(null)
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: `Could not read PDF: ${err?.message || err}` })
    }
  }, [])
  const handleClear = () => { setFile(null); setFileObj(null); setProgress(null); setResult(null) }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))

  const reset = () => {
    setData({ ...INITIAL, baseName: file?.name?.replace(/\.pdf$/i, '') || '' })
    setProgress(null); setResult(null)
  }

  /* Compute the signature data URL based on the active mode. Re-runs only
     when the relevant inputs change, so type-mode font tweaks are instant. */
  const signatureDataUrl = useMemo(() => {
    if (data.mode === 'type') {
      return buildTypedSignatureDataUrl(data.typedText, { fontId: data.typedFontId, color: data.typedColor })
    }
    if (data.mode === 'draw')   return data.drawnDataUrl || ''
    if (data.mode === 'upload') return data.uploadedDataUrl || ''
    return ''
  }, [data.mode, data.typedText, data.typedFontId, data.typedColor, data.drawnDataUrl, data.uploadedDataUrl])

  const position = findPosition(data.positionId)
  const pageSel = findPageSelection(data.pageSelectionId)
  const quality = findQuality(data.qualityId)

  const hasSignature = !!signatureDataUrl
  const canSubmit = !!fileObj && hasSignature && (file?.pages || 0) > 0

  const handleSign = async () => {
    if (!canSubmit || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await applySignature(fileObj, { ...data, signatureDataUrl }, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const handleUpload = async (file0) => {
    if (!file0) return
    const url = await fileToDataUrl(file0)
    setData((s) => ({ ...s, uploadedDataUrl: url, mode: 'upload' }))
  }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <SignatureIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Sign · {file?.pages || '—'} pages · {hasSignature ? 'ready' : 'no signature'}
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* Live preview */}
        <div className="mb-4">
          <p className="m-0 mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">Live preview</p>
          <SignedPagePreview data={data} sigDataUrl={signatureDataUrl} />
        </div>

        {/* Source */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Source PDF</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        <div className="my-3.5 h-px bg-line" />

        {/* Signature mode tabs */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Your signature</span>
        <div className="grid grid-cols-3 gap-2">
          {SIGNATURE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setField('mode')(m.id)}
              className={`rounded-md border px-2 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                data.mode === m.id
                  ? 'border-convert bg-convert-bg text-convert'
                  : 'border-line bg-paper text-ink-700 hover:border-line-strong'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {data.mode === 'type' && (
          <div className="mt-3 space-y-2">
            <TextInput label="Type your name" value={data.typedText} onChange={setField('typedText')} placeholder="e.g. Alex Hartwell" />
            <div className="grid grid-cols-2 gap-2">
              <SelectInput label="Font" value={data.typedFontId} onChange={setField('typedFontId')}
                options={TYPE_FONTS.map((f) => ({ value: f.id, label: f.label }))} />
              <ColorInput label="Ink colour" value={data.typedColor} onChange={setField('typedColor')} />
            </div>
            {signatureDataUrl && (
              <div className="rounded-md border border-line bg-canvas p-3">
                <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Preview</p>
                <img src={signatureDataUrl} alt="Typed signature preview"
                  className="block h-12 w-auto object-contain" />
              </div>
            )}
          </div>
        )}

        {data.mode === 'draw' && (
          <div className="mt-3 space-y-2">
            <ColorInput label="Ink colour" value={data.drawColor} onChange={setField('drawColor')} />
            <SignaturePad dataUrl={data.drawnDataUrl} onChange={(url) => setField('drawnDataUrl')(url)} color={data.drawColor} />
          </div>
        )}

        {data.mode === 'upload' && (
          <div className="mt-3 space-y-2">
            <label className="block">
              <span className={labelClass}>Signature image (PNG or JPG)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={async (e) => {
                  const first = e.target.files && e.target.files[0]
                  await handleUpload(first)
                  e.target.value = ''
                }}
                className={`${inputClass} mt-1.5 cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-canvas file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase file:text-ink-700`}
              />
            </label>
            {data.uploadedDataUrl && (
              <div className="rounded-md border border-line bg-canvas p-3">
                <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-500">Loaded image</p>
                <img src={data.uploadedDataUrl} alt="Uploaded signature preview"
                  className="block h-16 w-auto object-contain" />
              </div>
            )}
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Placement */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Placement</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Position" value={data.positionId} onChange={setField('positionId')}
            options={POSITIONS.map((p) => ({ value: p.id, label: p.label }))} />
          <NumberInput label="Width" value={data.widthPct} onChange={setField('widthPct')}
            step="0.05" min={0.05} max={1} suffix="× page" />
        </div>
        {position.id === 'custom' && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberInput label="X position" value={data.customX} onChange={setField('customX')}
              step="1" min={0} max={100} suffix="%" />
            <NumberInput label="Y position" value={data.customY} onChange={setField('customY')}
              step="1" min={0} max={100} suffix="%" />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Page selection */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Which page</span>
        <SelectInput label="Sign on" value={data.pageSelectionId} onChange={setField('pageSelectionId')}
          options={PAGE_SELECTIONS.map((p) => ({ value: p.id, label: p.label }))} />
        {pageSel.id === 'custom' && (
          <div className="mt-2">
            <NumberInput label="Page number" value={data.customPage} onChange={setField('customPage')}
              step="1" min={1} max={file?.pages || 1} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Caption */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Caption (optional)</span>
        <div className="space-y-2">
          <ToggleRow label="Print caption under signature" desc='e.g. "Signed by Alex Hartwell · 23 May 2026"'
            checked={data.includeCaption} onChange={setField('includeCaption')} />
          {data.includeCaption && (
            <>
              <TextInput label="Signer name" value={data.signerName} onChange={setField('signerName')} />
              <DateInput label="Signed date" value={data.signedDate} onChange={setField('signedDate')} />
            </>
          )}
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Render + naming */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Render &amp; naming</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Quality" value={data.qualityId} onChange={setField('qualityId')}
            options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
          <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
        </div>
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
          Saves as <span className="text-ink-700">{(data.baseName || 'signed').replace(/[^a-z0-9-]+/gi, '-')}__signed.pdf</span>
        </p>

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
            <span className="text-ink-950">{data.mode === 'type' ? 'Typed' : data.mode === 'draw' ? 'Drawn' : 'Uploaded'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Signature ready</span>
            <span className={hasSignature ? 'text-success' : 'text-warning'}>{hasSignature ? 'Yes' : 'Not yet'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Position</span>
            <span className="font-mono text-[12px] font-bold text-convert">{position.label}</span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · signed</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Signed pages</span>
              <span className="text-ink-950">{result.signedPages} of {result.pages}</span>
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
            Signed PDF
          </div>
        </div>

        <button type="button" onClick={handleSign}
          disabled={busy || !canSubmit}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Signing…' : `Sign ${file?.pages ? `${file.pages} page${file.pages === 1 ? '' : 's'}` : 'PDF'}`}
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

function SignedMock() {
  return (
    <div className="relative rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Service Agreement</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">Sonchoy Studio Pvt Ltd · Northwind Books Pvt Ltd</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Ref SCY-NWB-26-001</p>
            <p className="m-0 mt-1 font-mono text-[9px] text-ink-500">Dated 23 May 2026</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <p className="m-0 mt-3 text-[10px] text-ink-700 leading-[1.6]">
          This agreement sets out the terms between the parties for the provision of brand and design
          services across the period 23 May 2026 to 22 May 2027. The Service Provider agrees to deliver
          the scope described in Schedule A, against the fees set out in Schedule B, on the timelines
          set out in Schedule C.
        </p>

        <p className="m-0 mt-2 text-[10px] text-ink-700 leading-[1.6]">
          Either party may terminate with 30 days written notice; obligations accrued before
          termination remain due. The agreement is governed by the laws of Karnataka, India.
        </p>

        <div className="mt-6 space-y-1 text-[8.5px] text-ink-500">
          <p className="m-0 font-mono">x ____________________________</p>
          <p className="m-0">Service Provider</p>
        </div>

        {/* Typed signature overlay */}
        <div className="absolute bottom-8 left-5" style={{ fontFamily: '"Snell Roundhand", "Apple Chancery", cursive', fontSize: 32, color: '#0A0A09', lineHeight: 1 }}>
          Alex Hartwell
        </div>
        <p className="absolute bottom-3 left-5 font-mono text-[8.5px] text-ink-500">Signed by Alex Hartwell · 23 May 2026</p>
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
            Contract in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            signed PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Drop a contract, quote, or proposal. Type a name in a cursive font, draw a signature with your trackpad, or upload a scanned one. Place it on any page at any position — output is a fresh signed PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <SignatureIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Sign Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Type · cursive
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'Service-agreement.pdf · 7 pages'],
                  ['Mode',           'Type — Snell-style cursive'],
                  ['Name',           'Alex Hartwell'],
                  ['Position',       'Bottom-left (last page)'],
                  ['Width',          '25% of page'],
                  ['Caption',        'Signed by Alex Hartwell · 23 May 2026'],
                  ['Page',           'Last page only'],
                  ['Output base',    'service-agreement'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">Signed PDF</span>
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
                  Signed
                </span>
              </div>
              <SignedMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the PDF',          'Drag the contract, quote, or proposal in. The tool reads its page count in the browser — nothing uploads.'],
  ['02', 'Capture your signature', 'Type your name in a cursive font, draw with your trackpad, or upload a scanned signature image. Live preview shows the result instantly.'],
  ['03', 'Place & save',           'Pick a position (corner / centre / custom %), pick the page (last is default for contracts), optionally add a "Signed by X · date" caption, and save.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From unsigned draft{' '}
              <em className="font-serif font-normal italic text-crimson-300">to signed PDF.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Signing a contract used to mean print → ink → scan → email. This tool collapses the loop to one click: drop the PDF, capture your signature once, place it, save. The original PDF stays untouched; the output is a clean signed copy.
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
  { title: 'Three capture modes',       desc: 'Type your name in a cursive / script / casual / italic-serif font, draw on a canvas with your mouse or finger, or upload a scanned PNG / JPG of your wet signature.' },
  { title: '7 position presets',         desc: 'Bottom-right (default), bottom-left, bottom-centre, top corners, centre, plus a custom X / Y % position when the contract has a specific signature box.' },
  { title: 'Page selection',             desc: 'Last page only is the default for contracts. Switch to first page, all pages, or a specific page number when the template demands it.' },
  { title: 'Adjustable width',           desc: 'Set the signature width as a percentage of the page (5–100%). Default 25% — big enough to read, small enough to fit a corner. Aspect ratio is preserved automatically.' },
  { title: 'Optional caption',           desc: 'Auto-print "Signed by <name> · <date>" beneath the signature for audit-friendly output. Falls on the correct side of the signature based on position.' },
  { title: '100% in browser',             desc: 'Your signature image, the source PDF, and the signed output never touch the network. Everything renders locally via canvas + jsPDF. Nothing is uploaded or logged.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for contracts</Eyebrow>
          <SectionTitle>
            Sign{' '}
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
  { q: 'Is this a legally-binding e-signature?',                          a: 'In many jurisdictions, a signed PDF (an image of a signature affixed by the signatory with intent to sign) carries legal weight equivalent to a wet signature — under e-IDAS in the EU, the ESIGN Act in the US, the IT Act in India. But "intent" is the key word: a court will look at whether you genuinely signed. For high-stakes contracts (employment, M&A, real-estate), use a dedicated e-signature service with audit trail and identity verification, not a static image overlay.' },
  { q: 'Will the signature stay where I placed it on every device?',       a: 'Yes — once the signed PDF is saved, the signature image is permanently embedded at the chosen page coordinates. Every PDF viewer will render it identically (the same pixels, in the same place). Where rendering differs is the typed-mode font choice: if you typed "Alex Hartwell" in Snell Roundhand, your output uses a real Snell-rendered PNG, not the system font reference — so it looks the same on Windows where Snell isn\'t installed.' },
  { q: 'Can I sign multiple times on the same document?',                  a: 'In one pass, no — the tool applies a single signature per run. To sign in multiple positions or with multiple signatories, run the tool once per signature: first signatory signs the unsigned PDF, second signatory uses the output of step 1 as their input, and so on. Each pass adds one more signature; the previous ones stay embedded.' },
  { q: 'What\'s the difference between typing and uploading?',             a: 'Typing renders your name in a cursive font and creates a transparent PNG on the fly — fast, no scanner needed, but the result looks like a font (because it is). Uploading a scanned PNG of your wet signature looks far more like a real signature, but requires a scanner / phone-capture step beforehand. Drawing falls in the middle — natural-looking strokes if you have a stylus or trackpad, less so with a mouse.' },
  { q: 'Will the signature be searchable or selectable in the output?',    a: 'The signature itself is an image (PNG), so it won\'t be selectable as text. The rest of the PDF content also rasterises during the sign process (same approach as the other PDF utilities), so text-layer content becomes part of each page image. For text-selectable output with embedded signatures, use a dedicated PDF editor.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The PDF, signature image, and signed output stay on your machine. All canvas drawing, image generation, and PDF rendering happens locally in your browser tab. No upload, no third-party API, no logging. Close the tab and the signature is gone from memory.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">PDF signing.</em>
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
  { name: 'Password Protect PDF',  desc: 'Encrypt the signed PDF before sending.',                Icon: LockIcon,      label: 'PDF', path: '/tools/password-protect-financial-pdfs' },
  { name: 'Merge Financial PDFs',  desc: 'Combine the signed PDF with annexures.',                 Icon: MergeIcon,     label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Compress Invoice PDFs', desc: 'Shrink the signed PDF for email-sending.',               Icon: CompressIcon,  label: 'PDF', path: '/tools/compress-invoice-pdfs' },
  { name: 'Watermark Invoice',     desc: 'Add a SIGNED stamp to the cover after signing.',         Icon: ExportIcon,    label: 'PDF', path: '/tools/add-watermark-to-invoice' },
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

export default function AddSignatureToPdfTool() {
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
