/* ------------------------------------------------------------------ */
/*  Non-Disclosure Agreement — helpers + constants                     */
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

export const NDA_TYPES = [
  { id: 'mutual',  label: 'Mutual NDA',  desc: 'Both parties protect each other\'s information.' },
  { id: 'one-way', label: 'One-way NDA', desc: 'One party discloses, the other receives.' },
]

export const ENTITY_TYPES = [
  { id: 'company',     label: 'Limited company / LLC' },
  { id: 'sole',        label: 'Sole proprietor' },
  { id: 'partnership', label: 'Partnership' },
  { id: 'individual',  label: 'Individual / Freelancer' },
  { id: 'nonprofit',   label: 'Non-profit' },
]

export const CONFIDENTIAL_DEFINITIONS = [
  { id: 'broad',    label: 'Broad — all non-public information' },
  { id: 'specific', label: 'Specific — only listed categories' },
]

export const EXCLUSIONS_MODE = [
  { id: 'standard', label: 'Standard exclusions only' },
  { id: 'custom',   label: 'Add custom exclusions' },
]

export const TERM_OPTIONS = [
  { id: '1',          label: '1 year',      years: 1 },
  { id: '2',          label: '2 years',     years: 2 },
  { id: '3',          label: '3 years',     years: 3 },
  { id: '5',          label: '5 years',     years: 5 },
  { id: '7',          label: '7 years',     years: 7 },
  { id: 'indefinite', label: 'Indefinite (until publicly disclosed)', years: 0 },
]

export function findNdaType(id) {
  return NDA_TYPES.find((t) => t.id === id) || NDA_TYPES[0]
}

export function findTerm(id) {
  return TERM_OPTIONS.find((t) => t.id === id) || TERM_OPTIONS[2]
}

/** Count rendered sections — used for hero stats. */
export function countSections(data) {
  let n = 6 // Parties, Definition, Purpose, Obligations, Exclusions, Term
  if (data.returnRequired || data.destructionAllowed) n++
  if (data.includeNonSolicit) n++
  if (data.includeInjunctiveRelief) n++
  n++ // Governing law
  n++ // Entire agreement
  return n
}
