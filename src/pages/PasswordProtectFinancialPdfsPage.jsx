import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  LockIcon, UnlockIcon, MergeIcon, CompressIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  QUALITY_PRESETS, PERMISSION_OPTIONS,
  findQuality, formatBytes,
  estimateStrength, generatePassword,
} from '../lib/protect-pdf/compute'
import { protectPdf, probePdf } from '../lib/protect-pdf/protectPdf'

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
    <div role="dialog" aria-modal="true" aria-label="Password Protect Financial PDFs"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[680px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['Strong', 'PDF encryption'],
  ['4',      'Permission bits'],
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
            <Link to="/" className="text-ink-700 no-underline hover:text-ink-950">Home</Link>
            <span className="text-ink-400">/</span>
            <Link to="/#tools" className="text-ink-700 no-underline hover:text-ink-950">Tools</Link>
            <span className="text-ink-400">/</span>
            <span className="text-convert">PDF</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Password Protect Financial PDFs</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-convert/30 bg-convert-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-convert">
            <span className="h-1.5 w-1.5 rounded-full bg-convert shadow-[0_0_0_4px_rgba(96,165,250,0.25)]" />
            PDF · Encrypt
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Lock sensitive{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              ledgers
            </em>
            <br />
            with a{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              password.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Encrypt payslips, balance sheets, board reports, and bank statements before sharing. Set a user password to open, an owner password for control, and granular permissions: allow printing but block editing, allow copy but block forms, etc.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Strength meter</span>
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
function PermissionRow({ id, label, desc, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-line bg-paper px-3 py-2 transition-colors hover:border-line-strong">
      <div className="min-w-0 flex-1 pr-3">
        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">{label}</span>
        <span className="block text-[11px] text-ink-500">{desc}</span>
      </div>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(id, e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer accent-convert" />
    </label>
  )
}

/* ---------- Password field with show/hide + strength bar ---------- */

function PasswordField({ label, value, onChange, placeholder, showStrength = false }) {
  const [visible, setVisible] = useState(false)
  const strength = useMemo(() => estimateStrength(value || ''), [value])
  const segments = 5
  const filled = Math.max(0, Math.min(segments, strength.score))
  const toneClass = {
    danger:  'bg-danger',
    warning: 'bg-warning',
    info:    'bg-info',
    success: 'bg-success',
    muted:   'bg-line',
  }[strength.tone] || 'bg-line'

  return (
    <div className="flex flex-col gap-[5px]">
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          spellCheck={false}
          className={`${inputClass} font-mono pr-14`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-500 transition-colors hover:bg-canvas hover:text-ink-700"
        >
          {visible ? 'hide' : 'show'}
        </button>
      </div>
      {showStrength && (
        <div className="mt-1.5">
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full ${i < filled ? toneClass : 'bg-line'}`}
              />
            ))}
          </div>
          <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
            <span className={`font-bold ${
              strength.tone === 'danger' ? 'text-danger' :
              strength.tone === 'warning' ? 'text-warning' :
              strength.tone === 'info' ? 'text-info' :
              strength.tone === 'success' ? 'text-success' : 'text-ink-500'
            }`}>
              {strength.label}
            </span>
            <span className="text-ink-500"> · est. crack time {strength.guesses}</span>
          </p>
        </div>
      )}
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
      <LockIcon />
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">Drop a PDF or click to browse</p>
      <p className="m-0 text-[11px] text-ink-500">Any PDF · output will require the password to open</p>
    </div>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  userPassword: '',
  ownerPassword: '',
  useDifferentOwner: false,
  permissions: ['print'],            // default: allow print, block everything else
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

  const togglePermission = (id, on) => setData((s) => ({
    ...s,
    permissions: on
      ? [...new Set([...(s.permissions || []), id])]
      : (s.permissions || []).filter((x) => x !== id),
  }))

  const generateAndUse = () => {
    const pw = generatePassword(16)
    setData((s) => ({ ...s, userPassword: pw, ...(s.useDifferentOwner ? {} : { ownerPassword: '' }) }))
  }

  const reset = () => {
    setData({ ...INITIAL, baseName: file?.name?.replace(/\.pdf$/i, '') || '' })
    setProgress(null); setResult(null)
  }

  const userStrength = useMemo(() => estimateStrength(data.userPassword || ''), [data.userPassword])

  const ownerToUse = data.useDifferentOwner
    ? data.ownerPassword
    : data.userPassword

  const canSubmit = !!fileObj && !!data.userPassword && data.userPassword.length >= 4

  const handleProtect = async () => {
    if (!canSubmit || busy) return
    setBusy(true); setResult(null); setProgress({ stage: 'init', pct: 0, message: 'Starting…' })
    try {
      const r = await protectPdf(fileObj, {
        ...data,
        ownerPassword: ownerToUse,
      }, (p) => setProgress(p))
      setResult(r)
      setProgress({ stage: 'done', pct: 100, message: `Saved ${r.fileName}` })
    } catch (err) {
      setProgress({ stage: 'error', pct: 0, message: String(err?.message || err) })
    } finally {
      setBusy(false)
    }
  }

  const quality = findQuality(data.qualityId)
  const grantedCount = (data.permissions || []).length
  const blockedCount = PERMISSION_OPTIONS.length - grantedCount

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-convert) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
              <LockIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Protect · {file?.pages || '—'} pages · {grantedCount} allowed
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        {/* Source */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Source PDF</span>
        <FileDrop file={file} onPick={handlePick} onClear={handleClear} />

        <div className="my-3.5 h-px bg-line" />

        {/* Passwords */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Passwords</span>
        <PasswordField
          label="User password (required to open)"
          value={data.userPassword}
          onChange={setField('userPassword')}
          placeholder="Set a strong password"
          showStrength
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={generateAndUse}
            className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950"
          >
            Generate strong password
          </button>
          {data.userPassword && (
            <button
              type="button"
              onClick={async () => {
                try { await navigator.clipboard.writeText(data.userPassword) } catch { /* noop */ }
              }}
              className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950"
            >
              Copy
            </button>
          )}
        </div>

        <div className="mt-3 rounded-md border border-line bg-paper px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={data.useDifferentOwner}
              onChange={(e) => setField('useDifferentOwner')(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-convert"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700">
              Set a different owner password
            </span>
          </label>
          <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
            Owner password unlocks the permission restrictions. Leave off to use the user password for both.
          </p>
        </div>
        {data.useDifferentOwner && (
          <div className="mt-2">
            <PasswordField
              label="Owner password (controls permissions)"
              value={data.ownerPassword}
              onChange={setField('ownerPassword')}
              placeholder="A separate password for owners"
            />
          </div>
        )}

        {userStrength.tone === 'danger' && data.userPassword && (
          <div className="mt-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-[10.5px] text-danger">
            ⚠ This password is in a common-passwords list. Pick something less guessable.
          </div>
        )}
        {userStrength.score > 0 && userStrength.score < 3 && (
          <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[10.5px] text-warning">
            ⚠ Weak password — consider longer (14+ chars) or with more character classes.
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Permissions */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">
          Permissions ({grantedCount} allowed, {blockedCount} blocked)
        </span>
        <div className="space-y-2">
          {PERMISSION_OPTIONS.map((p) => (
            <PermissionRow
              key={p.id}
              id={p.id}
              label={p.label}
              desc={p.desc}
              checked={(data.permissions || []).includes(p.id)}
              onChange={togglePermission}
            />
          ))}
        </div>
        <p className="m-0 mt-2 font-mono text-[10px] text-ink-500">
          Ticked = allowed in the locked PDF. Unticked = blocked. PDF viewers honour these flags;
          the owner password (or any owner-mode override) bypasses them.
        </p>

        <div className="my-3.5 h-px bg-line" />

        {/* Quality + naming */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-convert">Render &amp; naming</span>
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Quality" value={data.qualityId} onChange={setField('qualityId')}
            options={QUALITY_PRESETS.map((q) => ({ value: q.id, label: q.label }))} />
          <TextInput label="File-name base" value={data.baseName} onChange={setField('baseName')} mono />
        </div>
        <p className="m-0 mt-1 font-mono text-[10px] text-ink-500">
          Saves as <span className="text-ink-700">{(data.baseName || 'protected').replace(/[^a-z0-9-]+/gi, '-')}__protected.pdf</span>
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
            <span className="text-ink-500">User password</span>
            <span className={data.userPassword ? 'text-ink-950' : 'text-danger'}>
              {data.userPassword ? `${data.userPassword.length} chars · ${userStrength.label}` : 'Required'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink-500">Owner password</span>
            <span className="text-ink-950">{data.useDifferentOwner ? 'Separate' : 'Same as user'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Permissions</span>
            <span className="font-mono text-[12px] font-bold text-convert">{grantedCount} allowed · {blockedCount} blocked</span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3 font-mono text-[11px]">
            <p className="m-0 mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">Done · encrypted</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-700">Output</span>
              <span className="text-ink-950">{formatBytes(result.outputBytes)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-ink-700">Pages</span>
              <span className="text-ink-950">{result.pages}</span>
            </div>
            <p className="m-0 mt-1.5 text-[10.5px] text-success">
              Send the password through a different channel from the PDF (e.g. Signal, SMS).
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
            Encrypted PDF
          </div>
        </div>

        <button type="button" onClick={handleProtect}
          disabled={busy || !canSubmit}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy ? 'Encrypting…' : `Protect ${file?.pages ? `${file.pages} page${file.pages === 1 ? '' : 's'}` : 'PDF'}`}
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

function LockMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-convert" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Q1 board report.pdf</p>
            <p className="m-0 mt-1 text-[10px] text-ink-500">14 pages · 1.8 MB</p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[9px] text-ink-500">Status: encrypted</p>
            <p className="m-0 mt-1 font-mono text-[9px] text-ink-500">Strong user password</p>
          </div>
        </div>

        <div className="mt-4 h-px bg-convert/40" />

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded border border-line bg-canvas p-2 text-center">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-convert">USER</p>
            <p className="m-0 mt-1 text-[11px] font-bold text-ink-950">Required</p>
          </div>
          <div className="rounded border border-line bg-canvas p-2 text-center">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-convert">OWNER</p>
            <p className="m-0 mt-1 text-[11px] font-bold text-ink-950">Separate</p>
          </div>
          <div className="rounded bg-convert p-2 text-center text-white">
            <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.08em]">PERMS</p>
            <p className="m-0 mt-1 text-[11px] font-bold">1 of 4</p>
          </div>
        </div>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-convert">PERMISSIONS</p>
        <div className="mt-1 space-y-1 font-mono text-[10px]">
          {[
            ['Printing',         'Allowed'],
            ['Modify content',   'Blocked'],
            ['Copy / extract',   'Blocked'],
            ['Annotations',      'Blocked'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded border border-line bg-canvas px-2 py-1">
              <span className="text-ink-700">{k}</span>
              <span className={v === 'Allowed' ? 'text-success font-bold' : 'text-danger font-bold'}>
                {v}
              </span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">Opens in any PDF viewer; password prompt appears immediately. Send the password through a separate channel.</p>
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
            Open PDF in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            encrypted PDF out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Pick a password, choose which permissions to grant, and the tool re-emits the PDF with encryption applied. Any standards-compliant viewer (Adobe, Preview, Chrome) prompts for the password before showing a single page.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-convert-bg text-convert">
                    <LockIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Protect Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  1 of 4 allowed
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Source PDF',     'Q1 board report.pdf · 14 pages'],
                  ['User password',  '14 chars · Strong'],
                  ['Owner password', 'Separate (16 chars)'],
                  ['Permissions',    'Print allowed'],
                  ['Blocked',        'Modify · Copy · Forms'],
                  ['Quality',        'Standard (1.5×)'],
                  ['File base',      'Q1-board-report'],
                  ['Output',         'Q1-board-report__protected.pdf'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-convert/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-convert">Output</span>
                <span className="font-mono text-[14px] font-semibold text-paper">Encrypted PDF</span>
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
                  Locked
                </span>
              </div>
              <LockMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Drop the PDF',          'Drag a payslip, ledger, board report, or bank statement in. The tool reads its page count in the browser — nothing uploads.'],
  ['02', 'Set a strong password',  'The user password is required to open the PDF. The strength meter rates it in real-time; the "Generate strong password" button creates a 16-character random one.'],
  ['03', 'Grant permissions',      'Tick what the recipient is allowed to do: print, modify, copy text, fill forms. Anything unticked is blocked. Save the encrypted PDF.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              From sensitive PDF{' '}
              <em className="font-serif font-normal italic text-crimson-300">to shareable one.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            Finance teams ship sensitive numbers all day — payslips, board packs, ledgers — and most of them go out unencrypted via email. A single mis-typed recipient address can leak everything. Locking the PDF with a password sent through a separate channel reduces that blast radius to zero.
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
  { title: 'User + owner passwords',     desc: 'User password gates opening the PDF; owner password unlocks the permission restrictions on top. Use the same value for both (simple), or split them when the producer and recipient are different parties.' },
  { title: '4 permission bits',           desc: 'Print, modify, copy text, fill forms — each independently allowed or blocked. Ship a print-allowed-only payslip; ship a fully-locked board pack; whatever the engagement needs.' },
  { title: 'Live strength meter',         desc: 'Five-bar zxcvbn-style meter rates the password in real-time. Common-password blacklist (password123, qwerty, etc.) triggers a warning even if the password looks long enough.' },
  { title: 'One-click strong generator',  desc: 'Cryptographically-random 16-character password mixing letters, digits, and symbols. Visually-confusing characters (0/O/I/l) are excluded so typing the password from a printout still works.' },
  { title: 'Send-the-password reminder',  desc: 'After encryption the success panel reminds you to send the password through a different channel from the PDF itself (Signal, SMS, phone call) — never on the same email thread.' },
  { title: '100% in browser',              desc: 'PDF read, encrypted, and saved entirely on your machine. The password never leaves your browser. No upload step, no third-party APIs.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for safer sending</Eyebrow>
          <SectionTitle>
            Encrypt{' '}
            <em className="font-serif font-normal italic text-crimson-300">— with intent.</em>
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
  { q: 'What\'s the difference between the user and owner passwords?',  a: 'The user password gates whether you can open the PDF at all. The owner password, if different, additionally gates whether the permission restrictions (no-copy, no-modify, etc.) are enforced. Typical pattern: use the same value for both — recipients see one password prompt and the permissions apply. Use different values when you need to grant some recipients elevated edit rights without re-issuing the file.' },
  { q: 'How strong is the encryption?',                                 a: 'PDF encryption uses the standard PDF security handler. Modern viewers (Adobe Acrobat, Apple Preview, Chrome, Firefox) honour the password prompt and the permission bits. The encryption is only as strong as the password — a 4-character password is brute-forceable in seconds; a 16-character random one would take centuries on today\'s hardware. Use the strength meter and the "Generate" button to pick a good one.' },
  { q: 'Can the password be recovered if I forget it?',                  a: 'No — and that\'s the point. We do not store the password anywhere, ever. If you lose it, the PDF is effectively destroyed: nothing short of a brute-force attack will open it again. The good news: you still have the original source file (we never modify it), so re-encrypting with a new password is always an option.' },
  { q: 'Do the permission bits actually stop motivated attackers?',     a: 'Honest answer: only mostly. The bits are enforced by every standards-compliant PDF viewer, so any normal recipient (Adobe, Preview, Chrome) will be blocked from copying or editing. But a determined adversary with the PDF bytes can use rasterising tools to bypass the bits (since they can render and re-save). For data that absolutely must not leak, treat the permission bits as deterrents — not as DRM.' },
  { q: 'How should I send the password to the recipient?',              a: 'Through a different channel from the PDF itself. If you email the locked PDF, send the password via Signal, SMS, WhatsApp, or a quick phone call — anywhere that isn\'t the same email account. This way, a single compromised inbox (yours or theirs) doesn\'t hand over both the document and the key. For high-stakes sends, use a passphrase you agreed on in person previously.' },
  { q: 'Does my data leave the browser?',                                a: 'Never. The PDF is read into memory, encrypted with the password locally, and saved as a new file via the browser\'s standard download mechanism. The password is never transmitted; it lives only in this browser tab and inside the encrypted PDF you generate. Close the tab and the password is gone from memory.' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">PDF encryption.</em>
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
  { name: 'Unlock PDF',             desc: 'Reverse: remove a known password from a PDF.',         Icon: UnlockIcon,    label: 'PDF' },
  { name: 'Merge Financial PDFs',   desc: 'Combine, then encrypt the resulting packet.',           Icon: MergeIcon,     label: 'PDF', path: '/tools/merge-financial-pdfs' },
  { name: 'Compress Invoice PDFs',  desc: 'Shrink the encrypted PDF for email-sending.',           Icon: CompressIcon,  label: 'PDF', path: '/tools/compress-invoice-pdfs' },
  { name: 'Watermark Invoice',      desc: 'Add a DRAFT / CONFIDENTIAL stamp before locking.',     Icon: ExportIcon,    label: 'PDF', path: '/tools/add-watermark-to-invoice' },
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

export default function PasswordProtectFinancialPdfsPage() {
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
