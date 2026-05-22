import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check,
  ReceiptIcon, InvoiceIcon, QuoteIcon, POIcon, ExportIcon,
} from '../components/icons'
import PromoBento from '../components/promos/PromoBento'
import CalloutStatHook from '../components/callouts/CalloutStatHook'

import {
  CURRENCIES, PAYMENT_METHODS, RECEIPT_TYPES,
  findCurrency, findPaymentMethod, findReceiptType,
  computeReceipt, countSections,
  formatNumber, formatMoney, formatDate, todayISO,
} from '../lib/receipt/compute'
import { generateReceiptPdf } from '../lib/receipt/generatePdf'
import { generateReceiptXlsx } from '../lib/receipt/generateXlsx'

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
    <div role="dialog" aria-modal="true" aria-label="Live Receipt Generator"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-md md:px-8 md:py-12">
      <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-[540px]">
        <GeneratorPanel />
      </div>
    </div>
  )
}

const HERO_STATS = [
  ['9',         'Payment methods'],
  ['7',         'Receipt types'],
  ['Auto',      'Balance tracking'],
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
          style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 60%)' }} />
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
            <span className="text-business">Documents</span>
            <span className="text-ink-400">/</span>
            <span className="text-ink-950">Receipt Generator</span>
          </nav>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-business/30 bg-business-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-business">
            <span className="h-1.5 w-1.5 rounded-full bg-business shadow-[0_0_0_4px_rgba(52,208,188,0.25)]" />
            Documents · Payment receipts
          </span>
          <h1 className="mb-7 max-w-[1000px] font-medium text-[44px] leading-[1.02] tracking-[-0.035em] text-ink-950 md:text-[80px] md:leading-[0.98]">
            Payment in,{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              receipt out
            </em>
            <br />
            in{' '}
            <em className="font-serif font-normal italic tracking-[-0.015em] text-crimson-300">
              30 seconds.
            </em>
          </h1>
          <p className="mb-10 max-w-[640px] text-xl leading-[1.55] text-ink-700">
            Clean payment-acknowledgement receipts the moment a client clears an invoice. Branded header, big amount block, amount-in-words, payment-method details, auto-computed outstanding balance, signature line.
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
            <span className="inline-flex items-center gap-1.5"><Check className="text-crimson-400" /> Amount in words</span>
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
  'focus:border-business/60 focus:ring-2 focus:ring-business/20 hover:border-line-strong'

function TextInput({ label, value, onChange, placeholder, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} ${mono ? 'font-mono' : ''}`} />
    </div>
  )
}
function NumberInput({ label, value, onChange, suffix, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input type="number" inputMode="decimal" step="any"
          value={value ?? 0}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={`${inputClass} text-right font-mono ${suffix ? 'pr-12' : ''}`} />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-500">{suffix}</span>
        )}
      </div>
    </div>
  )
}
function TextareaInput({ label, value, onChange, placeholder, rows = 2, className = '' }) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <span className={labelClass}>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputClass} min-h-[58px] resize-y leading-[1.4]`} />
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
        className="h-4 w-4 shrink-0 cursor-pointer accent-business" />
    </label>
  )
}

/* ---------- Initial state ---------- */

const INITIAL = {
  receiptNumber: 'RCP-2026-0042',
  receiptDate: todayISO(),
  receiptTypeId: 'payment',
  invoiceReference: 'INV-2026-0241',
  poNumber: '',
  currency: 'INR',

  from: {
    companyName: 'Sonchoy Studio Pvt Ltd',
    address: '7 Brigade Road, Bengaluru, Karnataka 560001',
    email: 'accounts@sonchoystudio.com',
    phone: '+91 80 4567 8901',
    taxId: 'GST 29ABCDE1234F1Z5',
    signatoryName: 'Alex Hartwell',
    signatoryTitle: 'Managing Director',
  },
  to: {
    name: 'Northwind Books Pvt Ltd',
    address: 'Brigade Gateway, Malleshwaram, Bengaluru 560055',
    email: 'marcus@northwindbooks.in',
    phone: '+91 80 2345 6789',
    taxId: 'GST 29XYZAB5678C1Z2',
  },

  amountReceived: 250000,
  includeTax: true,
  taxRatePct: 18,

  paymentMethodId: 'bank',
  transactionId: 'HDFC/UTR/202605231837421',
  bankName: 'HDFC Bank · NEFT',
  chequeNumber: '',

  includePaymentDetails: true,
  includeOutstanding: true,
  outstandingBefore: 600000,

  includeSignature: true,
  purpose: 'Part payment against invoice INV-2026-0241 — Brand identity design (Milestone 1)',
  notes: 'Receipt issued without prejudice to the unpaid balance. Receipt valid only on realisation of bank transfer credit.',
}

function GeneratorPanel() {
  const [data, setData] = useState(INITIAL)
  const [busy, setBusy] = useState(null)

  const cur = useMemo(() => findCurrency(data.currency), [data.currency])
  const method = useMemo(() => findPaymentMethod(data.paymentMethodId), [data.paymentMethodId])
  const totals = useMemo(() => computeReceipt(data), [data])
  const sections = useMemo(() => countSections(data), [data])

  const setField = (k) => (v) => setData((s) => ({ ...s, [k]: v }))
  const setFromField = (k) => (v) => setData((s) => ({ ...s, from: { ...s.from, [k]: v } }))
  const setToField = (k) => (v) => setData((s) => ({ ...s, to: { ...s.to, [k]: v } }))
  const reset = () => setData({ ...INITIAL })

  const handlePdf  = async () => { try { setBusy('pdf');  generateReceiptPdf(data) }  finally { setBusy(null) } }
  const handleXlsx = async () => { try { setBusy('xlsx'); generateReceiptXlsx(data) } finally { setBusy(null) } }

  return (
    <aside className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-business) 0%, transparent 70%)' }} />

      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
              <ReceiptIcon size={13} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Receipt · {sections} sections
            </span>
          </div>
          <button type="button" onClick={reset}
            className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500 hover:border-line-strong hover:text-ink-700">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextInput label="Receipt #" value={data.receiptNumber} onChange={setField('receiptNumber')} mono />
          <DateInput label="Date" value={data.receiptDate} onChange={setField('receiptDate')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectInput label="Receipt type" value={data.receiptTypeId} onChange={setField('receiptTypeId')}
            options={RECEIPT_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
          <SelectInput label="Currency" value={data.currency} onChange={setField('currency')}
            options={CURRENCIES.map((cy) => ({ value: cy.code, label: cy.code }))} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput label="Invoice reference (optional)" value={data.invoiceReference} onChange={setField('invoiceReference')} mono />
          <TextInput label="PO reference (optional)" value={data.poNumber} onChange={setField('poNumber')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* From */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Issuer (from)</span>
        <div className="space-y-2">
          <TextInput label="Company name" value={data.from.companyName} onChange={setFromField('companyName')} />
          <TextareaInput label="Address" value={data.from.address} onChange={setFromField('address')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email" value={data.from.email} onChange={setFromField('email')} mono />
            <TextInput label="Phone" value={data.from.phone} onChange={setFromField('phone')} mono />
          </div>
          <TextInput label="Tax ID / GSTIN" value={data.from.taxId} onChange={setFromField('taxId')} mono />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Signatory name" value={data.from.signatoryName} onChange={setFromField('signatoryName')} />
            <TextInput label="Signatory title" value={data.from.signatoryTitle} onChange={setFromField('signatoryTitle')} />
          </div>
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* To */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Received from</span>
        <div className="space-y-2">
          <TextInput label="Payer name" value={data.to.name} onChange={setToField('name')} />
          <TextareaInput label="Address" value={data.to.address} onChange={setToField('address')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Email" value={data.to.email} onChange={setToField('email')} mono />
            <TextInput label="Phone" value={data.to.phone} onChange={setToField('phone')} mono />
          </div>
          <TextInput label="Tax ID" value={data.to.taxId} onChange={setToField('taxId')} mono />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Amount */}
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-business">Amount received</span>
        <NumberInput label="Net amount" value={data.amountReceived} onChange={setField('amountReceived')} suffix={cur.code} />
        <div className="mt-2">
          <ToggleRow label="Include tax line"
            desc="Adds a tax line on the receipt at the given rate"
            checked={data.includeTax} onChange={setField('includeTax')} />
        </div>
        {data.includeTax && (
          <div className="mt-2">
            <NumberInput label="Tax rate" value={data.taxRatePct} onChange={setField('taxRatePct')} suffix="%" />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Payment method */}
        <ToggleRow label="Include payment details" desc="Method, transaction ref, bank channel"
          checked={data.includePaymentDetails} onChange={setField('includePaymentDetails')} />
        {data.includePaymentDetails && (
          <div className="mt-3 rounded-lg border border-business/20 bg-business-bg/30 p-3 space-y-2">
            <SelectInput label="Payment method" value={data.paymentMethodId} onChange={setField('paymentMethodId')}
              options={PAYMENT_METHODS.map((m) => ({ value: m.id, label: m.label }))} />
            <TextInput label="Transaction reference" value={data.transactionId} onChange={setField('transactionId')} mono />
            {(method.id === 'bank' || method.id === 'upi' || method.id === 'card') && (
              <TextInput label="Bank / channel" value={data.bankName} onChange={setField('bankName')} />
            )}
            {method.id === 'cheque' && (
              <TextInput label="Cheque number" value={data.chequeNumber} onChange={setField('chequeNumber')} mono />
            )}
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        {/* Outstanding tracker */}
        <ToggleRow label="Track outstanding balance"
          desc="Show balance before / after this payment"
          checked={data.includeOutstanding} onChange={setField('includeOutstanding')} />
        {data.includeOutstanding && (
          <div className="mt-2">
            <NumberInput label="Outstanding before this payment" value={data.outstandingBefore} onChange={setField('outstandingBefore')} suffix={cur.code} />
          </div>
        )}

        <div className="my-3.5 h-px bg-line" />

        <ToggleRow label="Signature block"
          desc="Issuer signature + receipt-date acknowledgement"
          checked={data.includeSignature} onChange={setField('includeSignature')} />

        <div className="my-3.5 h-px bg-line" />

        <TextInput label="Purpose / received towards" value={data.purpose} onChange={setField('purpose')} />
        <div className="mt-2">
          <TextareaInput label="Notes (appears in PDF)" value={data.notes} onChange={setField('notes')} rows={2} />
        </div>

        <div className="my-3.5 h-px bg-line" />

        {/* Live total card */}
        <div className="rounded-lg border border-business/30 bg-business-bg/40 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business-dk">Total received</span>
            {data.includeOutstanding && totals.outstandingBefore > 0 && (
              <span className={`font-mono text-[10px] uppercase tracking-[0.08em] ${totals.outstandingAfter > 0 ? 'text-ink-500' : 'text-success'}`}>
                {totals.outstandingAfter > 0 ? `Balance ${cur.code} ${formatNumber(totals.outstandingAfter)}` : 'Settled in full'}
              </span>
            )}
          </div>
          <div className="mt-1 text-right font-mono text-[20px] font-bold text-business-dk">
            {cur.code} {formatNumber(totals.totalReceived)}
          </div>
          {totals.tax > 0 && (
            <p className="m-0 mt-1 text-right font-mono text-[10px] text-ink-500">
              Net {formatNumber(totals.amount)} · Tax {formatNumber(totals.tax)}
            </p>
          )}
        </div>

        <div className="mt-3 rounded-lg border border-business/40 bg-ink-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-business">Receipt amount</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">{method.label}</span>
          </div>
          <div className="mt-1 text-right font-mono text-[18px] font-semibold text-paper">
            {formatMoney(totals.totalReceived, data.currency)}
          </div>
        </div>

        <button type="button" onClick={handlePdf} disabled={busy !== null}
          className="btn btn-primary btn-lg mt-4 w-full disabled:cursor-wait disabled:opacity-70">
          {busy === 'pdf' ? 'Generating…' : 'Generate Receipt PDF'}
          <ArrowRight size={14} />
        </button>
        <button type="button" onClick={handleXlsx} disabled={busy !== null}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-mono text-[10px] uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-line-strong hover:text-ink-950 disabled:cursor-wait disabled:opacity-60">
          {busy === 'xlsx' ? '…' : (<>Export XLSX <ArrowRight size={10} /></>)}
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

function ReceiptMock() {
  return (
    <div className="rounded-md border border-line bg-paper">
      <div className="h-1 rounded-t-md bg-business" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-bold text-ink-950">Sonchoy Studio Pvt Ltd</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">7 Brigade Road, Bengaluru 560001</p>
            <p className="m-0 text-[9px] text-ink-500">GST 29ABCDE1234F1Z5</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[18px] font-bold tracking-[-0.01em] text-business-dk">RECEIPT</p>
            <p className="m-0 mt-1 text-[9px] text-ink-500">RCP-2026-0042 · 23 May 2026</p>
            <p className="m-0 text-[9px] text-ink-500">For invoice: INV-2026-0241</p>
            <span className="mt-1 inline-block rounded bg-success px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-white">PAID</span>
          </div>
        </div>

        <div className="mt-3 h-px bg-business/40" />

        <div className="mt-3">
          <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">RECEIVED FROM</p>
          <p className="m-0 mt-1 text-[12px] font-bold text-ink-950">Northwind Books Pvt Ltd</p>
          <p className="m-0 text-[9px] text-ink-700">Brigade Gateway, Malleshwaram, Bengaluru 560055</p>
          <p className="m-0 text-[9px] text-ink-700">GST 29XYZAB5678C1Z2</p>
        </div>

        <div className="mt-3 rounded-md border border-business/40 bg-business/5 px-3 py-2.5">
          <p className="m-0 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">AMOUNT RECEIVED</p>
          <p className="m-0 mt-1 text-right text-[20px] font-bold text-ink-950">INR 2,95,000.00</p>
          <p className="m-0 mt-0.5 text-[8.5px] italic text-ink-500">INR Two Lakh Ninety-Five Thousand only</p>
          <div className="mt-1 flex items-center justify-between border-t border-line pt-1 text-[8.5px]">
            <span className="text-ink-500">Net 2,50,000 · Tax (18%) 45,000</span>
            <span className="font-bold text-business-dk">Balance: INR 3,50,000</span>
          </div>
        </div>

        <p className="m-0 mt-3 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-business-dk">PAYMENT DETAILS</p>
        <div className="mt-1 rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[9px]">
          {[
            ['Payment method',   'Bank transfer'],
            ['Transaction ref',  'HDFC/UTR/202605231837421'],
            ['Bank / channel',   'HDFC Bank · NEFT'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-t border-line py-1 first:border-t-0">
              <span className="text-ink-500">{k}</span>
              <span className="font-mono text-ink-950">{v}</span>
            </div>
          ))}
        </div>

        <p className="m-0 mt-3 text-[9px] text-ink-700">
          <span className="font-bold text-ink-950">Received towards: </span>
          Part payment against invoice INV-2026-0241 — Brand identity design (Milestone 1)
        </p>

        <p className="m-0 mt-3 text-[9.5px] italic text-ink-500">+ signature block and date acknowledgement in the full PDF</p>
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
            Payment in{' '}
            <em className="font-serif font-normal italic text-crimson-300">→</em>{' '}
            clean receipt out.
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-[560px] text-lg leading-[1.55] text-ink-600">
            Single-page receipt with a big amount block, amount-in-words, optional tax line, payment-method details, outstanding-balance tracker, and signature line. PDF and XLSX exports.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-line bg-paper p-1">
            <div className="rounded-xl bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
                    <ReceiptIcon size={13} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Receipt Form</span>
                </div>
                <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-500">
                  Payment · Bank transfer
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Receipt #',       'RCP-2026-0042'],
                  ['Type',            'Payment receipt'],
                  ['For invoice',     'INV-2026-0241'],
                  ['Received from',   'Northwind Books Pvt Ltd'],
                  ['Net amount',      'INR 2,50,000'],
                  ['Tax (18%)',       'INR 45,000'],
                  ['Total received',  'INR 2,95,000'],
                  ['Outstanding',     'INR 3,50,000 remaining'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-[5px]">
                    <span className={labelClass}>{k}</span>
                    <div className="flex min-h-[36px] items-center rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] text-ink-950">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-business/30 bg-ink-950 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-business">Total received</span>
                <span className="font-mono text-[14px] font-semibold text-paper">INR 2,95,000.00</span>
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-business-bg text-business">
                    <ExportIcon />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">OUTPUT.PDF</span>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-success">
                  Send-ready
                </span>
              </div>
              <ReceiptMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3) How it works ---------- */

const STEPS = [
  ['01', 'Fill in the parties',  'Your business as issuer, the payer as recipient. Receipt number and date default to today; override as needed.'],
  ['02', 'Enter the payment',     'Amount received, optional tax line, payment method, transaction reference. Outstanding balance auto-computes if you provide the pre-payment balance.'],
  ['03', 'Export & send',         'PDF (single page with branded header, big amount block, payment details, signature) or XLSX for your records. Email straight to the payer.'],
]

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 grid grid-cols-1 items-end gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Eyebrow className="mb-4">02 — How it works</Eyebrow>
            <SectionTitle>
              The acknowledgement{' '}
              <em className="font-serif font-normal italic text-crimson-300">clients expect.</em>
            </SectionTitle>
          </div>
          <p className="m-0 text-lg leading-[1.55] text-ink-600 md:max-w-[480px] md:justify-self-end">
            A receipt closes the loop on a payment — both sides have proof, the invoice is marked paid, and the bookkeeping has a paper trail. This tool generates a clean one in 30 seconds, with the details auditors and tax authorities care about.
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
  { title: '7 receipt types',        desc: 'Payment, rent, donation, deposit / security, advance payment, refund, other. The type label appears top-right on the PDF.' },
  { title: '9 payment methods',      desc: 'Bank transfer, UPI/wallet, card, cash, cheque, PayPal, Stripe, crypto, other. Method-specific fields (cheque number, bank channel) show conditionally.' },
  { title: 'Big amount block',       desc: 'The amount the client cares about most — large, on its own card, with optional tax breakdown underneath. Hard to miss.' },
  { title: 'Amount in words',        desc: 'Auto-generated English word form of the total (e.g. "Two Lakh Ninety-Five Thousand"). Standard practice for receipts above a certain threshold.' },
  { title: 'Outstanding tracker',    desc: 'Enter the pre-payment balance; the receipt shows what\'s left after. If fully settled, a "PAID IN FULL" badge appears top-right.' },
  { title: 'PDF + XLSX',             desc: 'PDF: branded header, parties, amount block, payment-method block, signature block, footer with receipt number and date. XLSX: full single-sheet capture of every field.' },
]

function Features() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-4">03 — Built for clean records</Eyebrow>
          <SectionTitle>
            Every receipt the{' '}
            <em className="font-serif font-normal italic text-crimson-300">auditor</em> expects.
          </SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-business/20 bg-business-bg text-business">
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
  { q: 'How is a receipt different from an invoice?',                    a: 'An invoice is a request for payment ("you owe us"); a receipt is acknowledgement of payment ("we got it"). The invoice goes out first when work is done; the receipt goes out after the client clears it. Many businesses skip the receipt entirely; doing it builds trust and gives both sides clean records.' },
  { q: 'Do I need to issue a receipt by law?',                            a: 'It varies by jurisdiction. In India, GST-registered businesses must issue a "payment receipt" or "Bill of Supply" for receipts above certain thresholds. In the US, businesses are required to provide receipts on request. In the EU, receipts are part of VAT-compliant invoicing. The safe answer: yes, always issue one — it costs nothing and the audit trail is invaluable.' },
  { q: 'What\'s the "outstanding before" field for?',                     a: 'Optional. If you enter how much the client owed before this payment, the receipt shows the remaining balance after. Useful for partial payments where the invoice isn\'t fully cleared. The PDF will say "Balance remaining: …" or "PAID IN FULL" depending.' },
  { q: 'Should I include the tax line?',                                  a: 'For GST/VAT-applicable receipts, yes — show net amount and tax separately. For cash-receipt-only situations (rent, deposits, refunds), often no. The tool defaults to including a tax line; uncheck if not needed.' },
  { q: 'What goes in the "purpose" field?',                              a: 'A one-line description of what the payment was for — "Part payment against invoice INV-2026-0241", "May 2026 rent", "Security deposit for 6-month lease", etc. It\'s what the receipt is actually acknowledging.' },
  { q: 'Output formats?',                                                  a: 'PDF (single-page receipt with top accent stripe, branded issuer header, "RECEIPT" block top-right with number/date/invoice ref/type and PAID badge, "Received from" block, amount card with amount-in-words and tax breakdown, optional outstanding balance, payment-method details table, purpose & notes, signature block) and XLSX (single sheet capturing every field for your records).' },
]

function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <Eyebrow className="mb-4">04 — Common questions</Eyebrow>
          <SectionTitle>
            Everything about{' '}
            <em className="font-serif font-normal italic text-crimson-300">receipts.</em>
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
  { name: 'Invoice Generator',     desc: 'Send the request, then issue a receipt on payment.', Icon: InvoiceIcon, label: 'INVOICING', path: '/tools/invoice-generator' },
  { name: 'Quotation Generator',   desc: 'Itemised quotes that convert to invoices.',         Icon: QuoteIcon,   label: 'DOCUMENTS', path: '/tools/quotation-generator' },
  { name: 'GST / VAT Invoice',     desc: 'Tax-compliant invoicing with reverse charge.',      Icon: InvoiceIcon, label: 'INVOICING', path: '/tools/gst-vat-invoice-generator' },
  { name: 'Tax Invoice Generator', desc: 'HSN/SAC + tax breakdowns + signatures.',             Icon: InvoiceIcon, label: 'INVOICING', path: '/tools/tax-invoice-generator' },
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
                <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.08em] text-business">{t.label}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-business-bg text-business">
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

export default function ReceiptGeneratorPage() {
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
