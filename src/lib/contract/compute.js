/* ------------------------------------------------------------------ */
/*  Client Contract — helpers + standard clause text                   */
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

export const ENTITY_TYPES = [
  { id: 'company',    label: 'Limited company / LLC' },
  { id: 'sole',       label: 'Sole proprietor' },
  { id: 'partnership', label: 'Partnership' },
  { id: 'freelance',  label: 'Freelancer / Individual' },
  { id: 'nonprofit',  label: 'Non-profit' },
]

export const TERM_TYPES = [
  { id: 'fixed',    label: 'Fixed term (with end date)' },
  { id: 'ongoing',  label: 'Ongoing (rolling)' },
]

export const FEE_STRUCTURES = [
  { id: 'fixed',     label: 'Fixed project fee' },
  { id: 'hourly',    label: 'Hourly rate' },
  { id: 'retainer',  label: 'Monthly retainer' },
  { id: 'milestone', label: 'Milestone-based' },
]

export const PAYMENT_TERMS = [
  { id: 'net-7',     label: 'Net 7',      days: 7  },
  { id: 'net-14',    label: 'Net 14',     days: 14 },
  { id: 'net-30',    label: 'Net 30',     days: 30 },
  { id: 'net-60',    label: 'Net 60',     days: 60 },
  { id: 'on-receipt', label: 'On receipt', days: 0 },
]

export const IP_OWNERSHIP = [
  { id: 'client',   label: 'Assigned to Client on full payment' },
  { id: 'provider', label: 'Retained by Provider; Client receives licence' },
  { id: 'joint',    label: 'Joint ownership' },
]

export const DISPUTE_RESOLUTION = [
  { id: 'courts',     label: 'Courts of governing jurisdiction' },
  { id: 'arbitration', label: 'Binding arbitration' },
  { id: 'mediation',  label: 'Mediation first, then arbitration' },
]

/* ---- Computed helpers ---- */

export function findFeeStructure(id) {
  return FEE_STRUCTURES.find((f) => f.id === id) || FEE_STRUCTURES[0]
}
export function findPaymentTerm(id) {
  return PAYMENT_TERMS.find((p) => p.id === id) || PAYMENT_TERMS[2]
}
export function findIpOwnership(id) {
  return IP_OWNERSHIP.find((p) => p.id === id) || IP_OWNERSHIP[0]
}
export function findDisputeRes(id) {
  return DISPUTE_RESOLUTION.find((p) => p.id === id) || DISPUTE_RESOLUTION[0]
}

/** Count how many sections will be rendered (used in hero stats). */
export function countSections(data) {
  let n = 4 // Parties, Scope, Term, Fees always present
  if (data.includeIP) n++
  if (data.includeConfidentiality) n++
  if (data.includeNonCompete) n++
  if (data.includeWarranties) n++
  if (data.includeLiabilityCap) n++
  if (data.includeIndemnification) n++
  n++ // Governing Law / Dispute always present
  if (data.customClauses && data.customClauses.length > 0) n += data.customClauses.length
  return n
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** Total milestone amount (if milestone-based) */
export function computeMilestoneTotal(milestones) {
  if (!Array.isArray(milestones)) return 0
  return round2(milestones.reduce((s, m) => s + (Number(m?.amount) || 0), 0))
}
