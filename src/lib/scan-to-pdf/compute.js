/* ------------------------------------------------------------------ */
/*  Scan to PDF — capture + scan-style filter config                     */
/*                                                                       */
/*  Uses the device camera (via the file input's capture attribute, or  */
/*  getUserMedia when available) to grab pages, applies a "scan-like"   */
/*  filter — grayscale + contrast + small threshold — then stitches the */
/*  result into a multi-page PDF.                                        */
/* ------------------------------------------------------------------ */

export const PAGE_SIZES = [
  { id: 'a4',     label: 'A4 (210 × 297 mm)',  w: 595.28, h: 841.89 },
  { id: 'letter', label: 'US Letter',          w: 612,    h: 792    },
  { id: 'a5',     label: 'A5 (148 × 210 mm)',  w: 419.53, h: 595.28 },
  { id: 'fit',    label: 'Fit page to capture (no resize)' },
]

export const FILTER_MODES = [
  { id: 'colour',    label: 'Colour (preserve source)' },
  { id: 'grayscale', label: 'Grayscale (smaller file)' },
  { id: 'bw',        label: 'Black & white (document scan)' },
  { id: 'whiteboard', label: 'Whiteboard (boost contrast + brighten)' },
]

export const QUALITY_PRESETS = [
  { id: 'low',    label: 'Draft (lighter PDF)',    scale: 0.85, jpegQuality: 0.7 },
  { id: 'medium', label: 'Standard (balanced)',    scale: 1.0,  jpegQuality: 0.82 },
  { id: 'high',   label: 'High (sharper text)',    scale: 1.2,  jpegQuality: 0.92 },
]

export const SORT_OPTIONS = [
  { id: 'as_captured', label: 'As captured' },
  { id: 'reverse',     label: 'Reverse capture order' },
]

export function findPageSize(id)  { return PAGE_SIZES.find((p) => p.id === id) || PAGE_SIZES[0] }
export function findFilter(id)    { return FILTER_MODES.find((f) => f.id === id) || FILTER_MODES[0] }
export function findQuality(id)   { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }
export function findSortOption(id){ return SORT_OPTIONS.find((s) => s.id === id) || SORT_OPTIONS[0] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / (1024 * 1024)).toFixed(2)} MB`
}

/* ---- Filter implementations ---------------------------------------
 * Each takes an ImageData and mutates it in place. Pure JS so we don't
 * need WebGL / Canvas filter strings (Safari support is patchy).         */

export function applyFilter(ctx, w, h, filterId) {
  if (filterId === 'colour') return  // no-op
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data

  if (filterId === 'grayscale') {
    for (let i = 0; i < d.length; i += 4) {
      const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      d[i] = d[i + 1] = d[i + 2] = luma
    }
  } else if (filterId === 'bw') {
    /* Adaptive-ish threshold: scale luma, push mid-tones to white so paper
       looks paper-white, push dark tones to true black so text crisps up. */
    for (let i = 0; i < d.length; i += 4) {
      const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      // S-curve: anything below 100 becomes black-ish; anything above 170 becomes white
      let out
      if      (luma < 100) out = Math.max(0, luma - 30)
      else if (luma > 170) out = Math.min(255, luma + 40)
      else                 out = luma
      d[i] = d[i + 1] = d[i + 2] = out
    }
  } else if (filterId === 'whiteboard') {
    /* Strong brightness + contrast for whiteboard / chalkboard captures.
       Helps when the camera underexposes a backlit board. */
    for (let i = 0; i < d.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let v = d[i + c]
        v = (v - 128) * 1.4 + 128 + 22  // contrast 1.4×, brightness +22
        d[i + c] = Math.max(0, Math.min(255, v))
      }
    }
  }
  ctx.putImageData(img, 0, 0)
}
