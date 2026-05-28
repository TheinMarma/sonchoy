/* ------------------------------------------------------------------ */
/*  VAT Calculator — computation helpers                               */
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

/* ---- VAT regimes — rate presets per jurisdiction ---- */

export const VAT_REGIMES = [
  {
    id: 'uk',
    label: 'UK · VAT',
    defaultRate: 20,
    defaultCurrency: 'GBP',
    rates: [0, 5, 20],
    note: 'Standard 20% · reduced 5% · zero-rated 0% (e.g. food, books).',
  },
  {
    id: 'ie',
    label: 'Ireland · VAT',
    defaultRate: 23,
    defaultCurrency: 'EUR',
    rates: [0, 9, 13.5, 23],
    note: 'Standard 23% · reduced 13.5% · second reduced 9% · zero 0%.',
  },
  {
    id: 'de',
    label: 'Germany · USt.',
    defaultRate: 19,
    defaultCurrency: 'EUR',
    rates: [0, 7, 19],
    note: 'Standard 19% · reduced 7% (food, books, transport).',
  },
  {
    id: 'fr',
    label: 'France · TVA',
    defaultRate: 20,
    defaultCurrency: 'EUR',
    rates: [0, 2.1, 5.5, 10, 20],
    note: 'Standard 20% · intermediate 10% · reduced 5.5% · super-reduced 2.1%.',
  },
  {
    id: 'es',
    label: 'Spain · IVA',
    defaultRate: 21,
    defaultCurrency: 'EUR',
    rates: [0, 4, 10, 21],
    note: 'Standard 21% · reduced 10% · super-reduced 4%.',
  },
  {
    id: 'ae',
    label: 'UAE · VAT',
    defaultRate: 5,
    defaultCurrency: 'AED',
    rates: [0, 5],
    note: 'Standard 5%. Zero-rated for exports, education, healthcare.',
  },
  {
    id: 'sa',
    label: 'Saudi Arabia · VAT',
    defaultRate: 15,
    defaultCurrency: 'SAR',
    rates: [0, 15],
    note: 'Standard 15%. Zero-rated for exports, certain medicines.',
  },
  {
    id: 'in-gst',
    label: 'India · GST',
    defaultRate: 18,
    defaultCurrency: 'INR',
    rates: [0, 5, 12, 18, 28],
    note: 'GST rates 0/5/12/18/28% depending on HSN/SAC classification.',
  },
  {
    id: 'custom',
    label: 'Custom rates',
    defaultRate: 20,
    defaultCurrency: 'USD',
    rates: [0, 5, 10, 15, 20, 25],
    note: 'Generic rates for ad-hoc calculations.',
  },
]

export function findRegime(id) {
  return VAT_REGIMES.find((r) => r.id === id) || VAT_REGIMES[0]
}

export const MODES = [
  { id: 'add',     label: 'Add VAT to net',      desc: 'Amount entered is net; VAT is added.' },
  { id: 'extract', label: 'Extract VAT from gross', desc: 'Amount entered is gross; VAT is backed out.' },
]

/* ------------------------------------------------------------------ */

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** Compute a single line: returns { net, vat, gross, rate, taxableForRate } */
export function computeLine(item, mode) {
  const amount = Number(item.amount) || 0
  const rate = (Number(item.rate) || 0) / 100

  if (mode === 'extract') {
    const gross = amount
    const net = rate > 0 ? gross / (1 + rate) : gross
    const vat = gross - net
    return {
      net: round2(net),
      vat: round2(vat),
      gross: round2(gross),
      ratePct: Number(item.rate) || 0,
    }
  }
  // add
  const net = amount
  const vat = net * rate
  const gross = net + vat
  return {
    net: round2(net),
    vat: round2(vat),
    gross: round2(gross),
    ratePct: Number(item.rate) || 0,
  }
}

/** Compute aggregates across all lines */
export function computeVAT(data) {
  const mode = data.mode || 'add'
  const lines = (data.items || []).map((it) => ({ ...it, ...computeLine(it, mode) }))

  const totals = lines.reduce(
    (acc, l) => ({
      net: acc.net + l.net,
      vat: acc.vat + l.vat,
      gross: acc.gross + l.gross,
    }),
    { net: 0, vat: 0, gross: 0 }
  )

  // Breakdown by rate (group by ratePct)
  const byRateMap = new Map()
  for (const l of lines) {
    const r = l.ratePct
    const prev = byRateMap.get(r) || { rate: r, net: 0, vat: 0, gross: 0, count: 0 }
    prev.net   += l.net
    prev.vat   += l.vat
    prev.gross += l.gross
    prev.count += 1
    byRateMap.set(r, prev)
  }
  const byRate = Array.from(byRateMap.values())
    .map((r) => ({
      rate: r.rate,
      count: r.count,
      net: round2(r.net),
      vat: round2(r.vat),
      gross: round2(r.gross),
    }))
    .sort((a, b) => a.rate - b.rate)

  return {
    mode,
    lines,
    totalNet:   round2(totals.net),
    totalVat:   round2(totals.vat),
    totalGross: round2(totals.gross),
    byRate,
    countLines: lines.length,
    effectiveRate: totals.net > 0 ? round2((totals.vat / totals.net) * 100) : 0,
  }
}
