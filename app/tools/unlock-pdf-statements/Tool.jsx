'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check,
  UnlockIcon, LockIcon, MergeIcon, CompressIcon, ExportIcon,
} from '@/components/icons'
import PromoBento from '@/components/promos/PromoBento'
import CalloutStatHook from '@/components/callouts/CalloutStatHook'

import {
  QUALITY_PRESETS, findQuality, formatBytes, explainPdfError,
} from '@/lib/unlock-pdf/compute'
import { unlockPdf, probePdf } from '@/lib/unlock-pdf/unlockPdf'

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
    <div role="dialog" aria-modal="true" aria-label="Unlock PDF Statements"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[640px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['You own', 'The password'],
  ['1-click', 'Strip security'],
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
            <span className="text-convert">PDF</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Unlock PDF Statements</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            PDF · Decrypt
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Locked statement{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              + your password
            </em>
            <br />
            ={' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              unlocked PDF.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Strip the password from bank statements, payslips, and reports you already have access to. Enter the password, the tool decrypts the PDF in your browser, and saves a clean unencrypted copy ready for data extraction or archiving.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Password never transmitted</span>
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

/* ---------- Password field ---------- */

function PasswordField({ label, value, onChange, placeholder, autoFocus = false }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col gap-[5px]">
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          spellCheck={false}
          className={`${inputClass} pr-14 font-mono`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500 transition-colors hover:bg-canvas hover:text-ink-700"
        >
          {visible ? 'hide' : 'show'}
        </button>
      </div>
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
            {file.status === 'encrypted' ? '  ·  encrypted'
              : file.status === 'unencrypted' ? '  ·  no password'
              : ''}
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
        aria-label="Choose locked PDF"
      />
      <UnlockIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a locked PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">You must already know the password — this isn&rsquo;t a cracker</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  password: '',
  qualityId: 'medium',
  baseName: '',
}

function GeneratorPanel() {
  const [file, setFile] = useState(null)         // { name, size, pages, status }
  const [fileObj, setFileObj] = useState(null)
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [pwError, setPwError] = useState(null)   // 'NEED_PASSWORD' | 'BAD_PASSWORD' | null

  /* When the user picks a file, try probing it without a password first.
     If that throws "password needed", we surface the password field.
     If that succeeds, the PDF wasn't encrypted at all — we tell the user. */
  const handlePick = useCallback(async (raw) => {
    setFileObj(raw); setResult(null); setPwError(null)
    setFile({ name: raw.name, size: raw.size, pages: null, status: 'probing' })
    setData((s) => ({ ...s, password: '', baseName: raw.name.replace(/\.pdf$/i, '') }))
    setProgress({ stage: 'probing', pct: 4, message: `Reading ${raw.name}…` })
    try {
      const info = await probePdf(raw, '')
      setFile({ name: raw.name, size: raw.size, pages: info.pages, status: 'unencrypted' })
      setPwError(null)
      setProgress(null)
    } catch (err) {
      const reason = explainPdfError(err)
      if (reason.code === 'NEED_PASSWORD') {
        setFile({ name: raw.name, size: raw.size, pages: null, status: 'encrypted' })
        setPwError('NEED_PASSWORD')
        setProgress(null)
      } else {
        setProgress({ stage: 'error', pct: 0, message: reason.label })
      }
    }
  }, [])

  /* When the password changes (and the file is in the encrypted state),
     re-probe to discover page count. This gives the user immediate feedback
     on whether the password is correct, before they hit "Unlock". */
  useEffect(() => {
    if (!fileObj || file?.status !== 'encrypted' || !data.password) return
    let cancelled = false
    ;(async () => {
      try {
        const info = await probePdf(fileObj, data.password)
        if (cancelled) return
        setFile((f) => ({ ...f, pages: info.pages }))
        setPwError(null)
      } catch (err) {
        if (cancelled) return
        const reason = explainPdfError(err)
        if (reason.code === 'BAD_PASSWORD') setPwError('BAD_PASSWORD')
        else if (reason.code === 'NEED_PASSWORD') setPwError('NEED_PASSWORD')
        else setPwError('OTHER')
      }
    })()
    return () => { cancelled = true }
  }, [fileObj, data.password, file?.status])

  const handleClear = () => {
    setFile(null); setFileObj(null); setProgress(null); setResult(null); setPwError(null)
  }
  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const reset = () => {
    setData({ ...INITIAL, baseName: file?.name?.replace(/\.pdf$/i, '') || '' })
    setProgress(null); setResult(null); setPwError(file?.status === 'encrypted' ? 'NEED_PASSWORD' : null)
  }

  const quality = findQuality(data.qualityId)
  const canSubmit = !!fileObj
    && (file?.status === 'unencrypted' || (file?.status === 'encrypted' && data.password && !pwError))

  const handleUnlock = async () => {
    if (!canSubmit || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await unlockPdf(fileObj, data, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      const reason = explainPdfError(err)
      setPwError(reason.code === 'BAD_PASSWORD' ? 'BAD_PASSWORD' : null)
      setProgress({ stage: 'error', pct: 0, message: reason.label })
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
              <UnlockIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Unlock · {file?.pages || '—'} pages · {file?.status === 'encrypted' ? 'encrypted' : file?.status === 'unencrypted' ? 'open' : 'no file'}
            </span>
          </div>
          <button type="button" onClick={reset} disabled={!file}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700 disabled:opacity-50">
            Reset
          </button>
        </div>

        {/* Ownership notice */}
        <div className="mb-4 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 font-mono text-[10.5px] text-ink-700">
          <span className="font-semibold uppercase tracking-[0.08em] text-warning">Only unlock PDFs you own.</span>
          <span className="block mt-0.5 text-ink-700">
            This tool requires you to supply the correct password — it doesn&rsquo;t crack or guess. Use it on
            your own bank statements, payslips, or reports where you already know the password.
          </span>
        </div>

        {/* Source */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Locked PDF</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        {file?.status === 'unencrypted' && (
          <div className="mt-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 font-mono text-[10.5px] text-info">
            ℹ This PDF doesn&rsquo;t have a password set. Unlocking will still re-emit a clean copy.
          </div>
        )}

        {file?.status === 'encrypted' && (
          <>
            <div className="my-3.5 h-px bg-line" />
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Password</span>
            <PasswordField
              label="Enter the PDF password"
              value={data.password}
              onChange={setField('password')}
              placeholder="Required to decrypt"
              autoFocus
            />
            {pwError === 'BAD_PASSWORD' && (
              <div className="mt-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-[10.5px] text-danger">
                ⚠ Incorrect password. Bank statement passwords are often a PAN + DOB or account-number combo.
                Check the bank&rsquo;s email for the format.
              </div>
            )}
            {pwError === 'NEED_PASSWORD' && !data.password && (
              <div className="mt-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 font-mono text-[10.5px] text-info">
                ℹ Enter the password above to continue.
              </div>
            )}
            {!pwError && data.password && file?.pages && (
              <div className="mt-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 font-mono text-[10.5px] text-success">
                ✓ Password accepted · {file.pages} page{file.pages === 1 ? '' : 's'} ready to unlock
              </div>
            )}
          </>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Quality + naming */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Render &amp; naming</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Quality" value={data.qualityId} onChange={setField('qualityId')}
            options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
          <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
        </div>
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
          Saves as <span className="text-ink-700">{(data.baseName || 'unlocked').replace(/[^a-z0-9-]+/gi, '-')}__unlocked.pdf</span>
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
            <span className="text-ink-500">Source status</span>
            <span className={file?.status === 'encrypted' ? 'text-warning' : 'text-ink-700'}>
              {file?.status === 'encrypted' ? 'Encrypted' : file?.status === 'unencrypted' ? 'No password set' : '—'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Password</span>
            <span className="text-ink-950">
              {file?.status === 'unencrypted' ? 'Not needed'
                : data.password && !pwError ? `${data.password.length} chars · accepted`
                : data.password && pwError === 'BAD_PASSWORD' ? 'Incorrect'
                : 'Required'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
            <span className="font-mono text-[12px] font-bold text-convert">Unencrypted PDF</span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · unlocked</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Pages</span>
              <span className="text-ink-950">{result.pages}</span>
            </div>
            <p className="m-0 mt-1.5 text-[10.5px] text-success">
              The output PDF has no password and no permission restrictions.
            </p>
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
            Unlocked PDF
          </div>
        </div>

        <button type="button" onClick={handleUnlock}
          disabled={busy || !canSubmit}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Unlocking…' : `Unlock ${file?.pages ? `${file.pages} page${file.pages === 1 ? '' : 's'}` : 'PDF'}`}
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

function UnlockMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">HDFC bank statement.pdf</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">May 2026 · 14 pages</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-warning">Was: encrypted</p>
            <p className="m-0 mt-1 font-mono text-[9px] text-success">Now: open</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded border border-line bg-canvas p-2 text-center">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-convert">SOURCE</p>
            <p className="m-0 mt-1 text-[11px] font-bold text-warning">Locked</p>
          </div>
          <div className="rounded border border-line bg-canvas p-2 text-center">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-convert">PASSWORD</p>
            <p className="m-0 mt-1 text-[11px] font-bold text-ink-950">Accepted</p>
          </div>
          <div className="rounded bg-success p-2 text-center text-white">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em]">OUTPUT</p>
            <p className="m-0 mt-1 text-[11px] font-bold">Unlocked</p>
          </div>
        </div>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">SECURITY</p>
        <div className="mt-1 space-y-1 font-mono text-[10px]">
          {[
            ['User password',     'Stripped'],
            ['Owner password',    'Stripped'],
            ['Print restriction', 'Cleared'],
            ['Copy restriction',  'Cleared'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded border border-line bg-canvas px-2 py-1">
              <span className="text-ink-700">{k}</span>
              <span className="text-success font-bold">{v}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">Output is unencrypted, ready to feed into the Bank Statement → Excel extractor or archive in plain form.</p>
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
            Locked PDF in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            unlocked PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Provide the password you already know. The tool decrypts the PDF in your browser using pdfjs, then saves a fresh copy with the security removed — ready for data extraction, archive, or further editing.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <UnlockIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Unlock Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Encrypted · 14 pages
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'HDFC bank statement.pdf'],
                  ['Status',         'Encrypted · password required'],
                  ['Pages',          '14'],
                  ['Password',       '11 chars · accepted'],
                  ['Quality',        'Standard (1.5×)'],
                  ['File base',      'HDFC-may-2026'],
                  ['Output name',    'HDFC-may-2026__unlocked.pdf'],
                  ['Security',       'Will be removed entirely'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">Unencrypted PDF</span>
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
                  Open
                </span>
              </div>
              <UnlockMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the locked PDF',  'Drag a password-protected bank statement, payslip, or report into the picker. The tool detects whether the file needs a password in the browser — nothing uploads.'],
  ['02', 'Enter the password',    'Type the password you already know. The tool re-probes after each keystroke so you find out immediately whether the password is right (no need to wait until "Unlock").'],
  ['03', 'Save an open copy',     'Click Unlock. The PDF decrypts locally, every page rasterises, and a fresh PDF saves with no password and no permission restrictions.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From locked statement{' '}
              <em className="font-serif font-normal italic text-crimson-300">to clean copy.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Banks email statements password-protected so a stray inbox forward doesn&rsquo;t leak account numbers. That&rsquo;s great until you need to extract transactions, run them through the PDF → Excel tool, or just archive the file without re-typing the password every six months. Strip the security on the copy you keep; the original email stays locked.
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
  { title: 'Live password feedback',     desc: 'The tool re-probes the PDF as you type — green check the moment the password is right, red warning the moment it isn’t. Saves clicking Unlock to find out.' },
  { title: 'Handles bank password formats', desc: 'Most banks use combos like PAN-number + date-of-birth (DDMM) or account-number + name. Common formats fail with a clear error pointing you to check the bank’s email template.' },
  { title: 'Detects unencrypted PDFs',    desc: 'If the PDF doesn’t actually have a password set (some banks email unprotected statements), the tool skips the password prompt and goes straight to a clean re-emit.' },
  { title: 'Strips all permission bits',  desc: 'No-print, no-copy, no-modify flags all get cleared along with the password. The output is fully open — print it, copy text, edit, sign — same as any unencrypted PDF.' },
  { title: 'Ownership-first design',       desc: 'The tool requires you to supply the password — it doesn’t crack or guess. Built for unlocking your own statements, not bypassing security on someone else’s.' },
  { title: '100% in browser',              desc: 'Source PDF, password, and unlocked output never touch the network. Decryption runs locally via pdfjs. Nothing is logged or transmitted, ever.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for owned PDFs</Eyebrow>
          <SectionTitle>
            Strip the password{' '}
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
  { q: 'Can this tool crack passwords I don’t know?',                 a: 'No. This is a decrypt tool, not a cracker — you must supply the correct password yourself. The tool will tell you if the password is wrong, but it has no brute-force or dictionary mode. If you’ve genuinely lost the password to your own PDF, you’ll need a specialist tool (and patience), or contact the original issuer for a re-send.' },
  { q: 'My bank statement password isn’t working — what do I try?',    a: 'Bank passwords usually follow one of: the first 4 letters of the account holder’s name + last 4 of account number; PAN number (uppercase, no spaces); customer ID + date of birth (DDMM); or registered mobile number. Check the bank’s email that delivered the statement — they almost always describe the format somewhere in the body or footnote.' },
  { q: 'Is the unlocked PDF identical to the original?',                  a: 'Visually yes, but the text isn’t selectable in the output — every page is rasterised to a JPEG (same approach as the Merge / Compress tools) and then placed on a fresh page. The numbers, transactions, dates all look identical; what you lose is the underlying text layer. For text-searchable output, OCR the unlocked PDF after.' },
  { q: 'Why rasterise instead of preserving the original PDF stream?',     a: 'Preserving the original requires a different PDF library that can rewrite encrypted streams directly — adding ~400 KB to the page bundle. Rasterising uses the same toolchain as every other PDF utility on Sonchoy and works uniformly across every PDF the browser can read, including ones with unusual fonts, encryption variants, or content streams. The trade-off is text-layer loss.' },
  { q: 'Is it legal to unlock a PDF I received?',                          a: 'It depends on jurisdiction and on whether you have the right to access the underlying content. For your own bank statements (delivered to you, with the password you were given), unlocking is normal. For documents shared with you with explicit restrictions on copying or extraction, stripping those restrictions may violate the implicit agreement under which you received them. When in doubt, ask the sender.' },
  { q: 'Does my data leave the browser?',                                  a: 'Never. The PDF, the password, and the unlocked output all stay on your machine. The decryption is performed by pdfjs (a Mozilla project) running in your browser tab; the password lives in JavaScript memory only and is discarded the moment the tab closes. No upload, no third-party API, no logging.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">unlocking PDFs.</em>
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
  { name: 'Bank Statement → Excel', desc: 'Run the unlocked PDF through the extractor.',           Icon: ExportIcon,    label: 'CONVERT', path: '/tools/bank-statement-pdf-to-excel' },
  { name: 'Password Protect PDF',   desc: 'Reverse: re-lock the unlocked copy if needed.',          Icon: LockIcon,      label: 'PDF', path: '/tools/password-protect-financial-pdfs' },
  { name: 'Merge Financial PDFs',   desc: 'Combine the unlocked PDF with others.',                  Icon: MergeIcon,     label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Compress Invoice PDFs',  desc: 'Shrink the unlocked PDF for archive.',                   Icon: CompressIcon,  label: 'PDF', path: '/tools/compress-invoice-pdfs' },
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

export default function UnlockPdfStatementsTool() {
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
