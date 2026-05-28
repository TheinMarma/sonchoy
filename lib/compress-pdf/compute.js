/* ------------------------------------------------------------------ */
/*  Compress PDF — re-rasterise pages at a smaller DPI / lower JPEG     */
/*  quality to shrink invoice / statement / report PDFs for email.      */
/* ------------------------------------------------------------------ */

/* Each preset maps to a render scale and JPEG quality. Scale is the
   multiplier applied to the source viewport at 72 dpi — so 1.0× is
   roughly screen quality, 2.0× is roughly print. Smaller numbers mean
   smaller files. */
export const COMPRESSION_PRESETS = [
  { id: 'extreme', label: 'Extreme  ·  email-friendly',   desc: 'Smallest file · 0.85× · JPEG 60', scale: 0.85, jpegQuality: 0.60 },
  { id: 'high',    label: 'High  ·  recommended default', desc: 'Strong shrink with readable text · 1.1× · JPEG 70', scale: 1.10, jpegQuality: 0.70 },
  { id: 'medium',  label: 'Medium  ·  balanced',          desc: 'Crisp screen viewing · 1.5× · JPEG 80', scale: 1.50, jpegQuality: 0.80 },
  { id: 'low',     label: 'Low  ·  near-original',        desc: 'Light shrink, near-source fidelity · 2.0× · JPEG 88', scale: 2.00, jpegQuality: 0.88 },
]

export const COLOR_MODES = [
  { id: 'colour',     label: 'Full colour' },
  { id: 'grayscale',  label: 'Grayscale (smaller)' },
]

export const PAGE_SIZES = [
  { id: 'auto',   label: 'Match source pages' },
  { id: 'a4',     label: 'Normalise to A4' },
  { id: 'letter', label: 'Normalise to US Letter' },
]

export function findPreset(id)    { return COMPRESSION_PRESETS.find((p) => p.id === id) || COMPRESSION_PRESETS[1] }
export function findColorMode(id) { return COLOR_MODES.find((c) => c.id === id) || COLOR_MODES[0] }
export function findPageSize(id)  { return PAGE_SIZES.find((p) => p.id === id) || PAGE_SIZES[0] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** Estimate output bytes — order-of-magnitude, not exact.
 *  Heuristic: every page is ~ (width × height × scale²) JPEG-compressed bytes.
 *  Calibrated against real-world test outputs at standard 595×842 A4 page.
 *  Returns a single number; UI uses it for a rough "before vs after" hint.   */
export function estimateOutputBytes(pages, avgWidthPt, avgHeightPt, preset, isGrayscale) {
  const presetObj = findPreset(typeof preset === 'string' ? preset : preset?.id)
  if (!pages) return 0
  const pixelsPerPage = (avgWidthPt || 595) * (avgHeightPt || 842) * (presetObj.scale ** 2)
  // ~1.4 bytes per pixel at JPEG quality 0.7 in colour; grayscale ~0.5×
  const bpp = 1.4 * (presetObj.jpegQuality / 0.7) * (isGrayscale ? 0.55 : 1)
  return Math.round(pixelsPerPage * bpp * pages)
}

/** Convenience: report the savings vs the original file size. */
export function reportSavings(originalBytes, estimatedBytes) {
  if (!originalBytes || !estimatedBytes) return { pct: 0, smaller: true }
  const smaller = estimatedBytes < originalBytes
  const pct = Math.round(((originalBytes - estimatedBytes) / originalBytes) * 100)
  return { pct: Math.max(-999, Math.min(99, pct)), smaller }
}
