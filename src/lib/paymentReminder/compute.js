/* ------------------------------------------------------------------ */
/*  Payment Reminder Letter — helpers + constants                      */
/* ------------------------------------------------------------------ */

import {
  CURRENCIES, findCurrency,
  formatMoney, formatNumber, formatDate,
  todayISO,
} from '../invoice/format'

export {
  CURRENCIES, findCurrency,
  formatMoney, formatNumber, formatDate,
  todayISO,
}

/* ---- Constants ---- */

export const REMINDER_STAGES = [
  {
    id: 'gentle',
    label: 'Friendly · pre-due',
    tag: 'GENTLE REMINDER',
    tone: 'friendly',
    subject: (data) => `Friendly reminder — invoice ${data.invoiceNumber || ''} due soon`,
    body: (data) => [
      `Hi ${data.recipientName || data.client?.name || 'there'},`,
      ``,
      `Hope you're doing well. This is a friendly reminder that invoice ${data.invoiceNumber || ''} for ${data.currencyCode || 'USD'} ${data.amountFormatted} is due on ${data.dueDateFormatted}.`,
      ``,
      `No action needed if payment is already in flight — just sending this as a heads-up so it doesn't get lost in the inbox shuffle. If you need another copy of the invoice, let me know and I'll resend it.`,
      ``,
      `Thanks again for your business — it's appreciated.`,
    ],
  },
  {
    id: 'first',
    label: 'First reminder · 1–14 days late',
    tag: 'PAYMENT REMINDER',
    tone: 'polite',
    subject: (data) => `Payment reminder — invoice ${data.invoiceNumber || ''}`,
    body: (data) => [
      `Hi ${data.recipientName || data.client?.name || 'there'},`,
      ``,
      `I'm writing to follow up on invoice ${data.invoiceNumber || ''} for ${data.currencyCode || 'USD'} ${data.amountFormatted}, which was due on ${data.dueDateFormatted} and now appears to be ${data.daysOverdue} day${data.daysOverdue === 1 ? '' : 's'} overdue.`,
      ``,
      `It's possible this has crossed in the mail with your payment, or perhaps the invoice didn't reach the right person. Could you confirm whether payment has been issued, or let me know if you need another copy?`,
      ``,
      `If there's anything blocking the payment on your side, I'd rather hear about it sooner than later — happy to talk through it.`,
    ],
  },
  {
    id: 'second',
    label: 'Second reminder · 15–30 days late',
    tag: 'SECOND REMINDER',
    tone: 'firm',
    subject: (data) => `Second reminder — invoice ${data.invoiceNumber || ''} now ${data.daysOverdue} days overdue`,
    body: (data) => [
      `Dear ${data.recipientName || data.client?.name || 'Client'},`,
      ``,
      `This is a second reminder regarding invoice ${data.invoiceNumber || ''} for ${data.currencyCode || 'USD'} ${data.amountFormatted}, which was due on ${data.dueDateFormatted} and is now ${data.daysOverdue} days overdue.`,
      ``,
      `Despite our earlier reminder, we have not received payment or a response. Please arrange for payment to be made within the next 7 days, or contact us immediately to discuss a payment plan if the full amount cannot be settled at this time.`,
      ``,
      `Payment may be remitted via the details below. If payment has already been sent, please disregard this notice and forward us the remittance advice so we can reconcile our records.`,
    ],
  },
  {
    id: 'final',
    label: 'Final notice · 30+ days late',
    tag: 'FINAL NOTICE',
    tone: 'final',
    subject: (data) => `FINAL NOTICE — invoice ${data.invoiceNumber || ''} (${data.daysOverdue} days overdue)`,
    body: (data) => [
      `Dear ${data.recipientName || data.client?.name || 'Client'},`,
      ``,
      `This is a FINAL NOTICE regarding invoice ${data.invoiceNumber || ''} for ${data.currencyCode || 'USD'} ${data.amountFormatted}, which was due on ${data.dueDateFormatted} and is now ${data.daysOverdue} days overdue.`,
      ``,
      `Despite previous reminders, this invoice remains unpaid and no satisfactory response has been received. We require full payment within ${data.finalNoticeDays || 7} days of the date of this letter.`,
      ``,
      `If the full balance — including any late-payment interest as set out below — is not received by ${data.finalDeadlineFormatted}, we will, without further notice, take one or more of the following steps: (a) suspend further services and deliverables; (b) refer the matter to a debt-recovery agency; and (c) pursue legal proceedings to recover the debt together with all reasonable collection costs and legal fees.`,
      ``,
      `We would prefer to resolve this matter without escalation. Please contact us immediately if there is any reason payment cannot be made.`,
    ],
  },
]

export const DELIVERY_METHODS = [
  { id: 'email',    label: 'Email' },
  { id: 'letter',   label: 'Printed letter' },
  { id: 'both',     label: 'Email + posted letter' },
]

export const SIGN_OFFS = [
  { id: 'kind',         label: 'Kind regards' },
  { id: 'best',         label: 'Best regards' },
  { id: 'sincerely',    label: 'Yours sincerely' },
  { id: 'faithfully',   label: 'Yours faithfully' },
  { id: 'regards',      label: 'Regards' },
]

/* ---- Helpers ---- */

export function findStage(id) {
  return REMINDER_STAGES.find((s) => s.id === id) || REMINDER_STAGES[1]
}

export function findDelivery(id) {
  return DELIVERY_METHODS.find((d) => d.id === id) || DELIVERY_METHODS[0]
}

export function findSignOff(id) {
  return SIGN_OFFS.find((s) => s.id === id) || SIGN_OFFS[0]
}

/** Calendar days between two ISO dates (b - a). */
export function daysBetween(aIso, bIso) {
  if (!aIso || !bIso) return 0
  const a = new Date(aIso)
  const b = new Date(bIso)
  if (Number.isNaN(a.valueOf()) || Number.isNaN(b.valueOf())) return 0
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

/** Add days to ISO date → ISO date. */
export function addDays(iso, days) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return ''
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** Simple per-annum interest, prorated by days overdue. */
export function computeLateInterest(amount, ratePct, daysOverdue) {
  const principal = Number(amount) || 0
  const r = (Number(ratePct) || 0) / 100
  const days = Math.max(0, Number(daysOverdue) || 0)
  return round2(principal * r * (days / 365))
}

/** Build the templated subject + body for the selected stage. */
export function buildLetterCopy(data) {
  const stage = findStage(data.stageId)
  const currency = findCurrency(data.currency || 'USD')
  const amountFormatted = formatNumber(Number(data.amount) || 0)
  const dueDateFormatted = formatDate(data.dueDate)
  const daysOverdue = Math.max(0, daysBetween(data.dueDate, data.letterDate))
  const finalDeadline = addDays(data.letterDate, Number(data.finalNoticeDays) || 7)
  const finalDeadlineFormatted = formatDate(finalDeadline)

  const ctx = {
    ...data,
    currencyCode: currency.code,
    amountFormatted,
    dueDateFormatted,
    daysOverdue,
    finalDeadlineFormatted,
  }

  return {
    stage,
    subject: stage.subject(ctx),
    paragraphs: stage.body(ctx),
    interest: data.includeInterest ? computeLateInterest(data.amount, data.interestRate, daysOverdue) : 0,
    daysOverdue,
    finalDeadline,
    finalDeadlineFormatted,
  }
}
