/* ------------------------------------------------------------------ */
/*  Sign PDF — config + signature-image builder for the "type" mode     */
/* ------------------------------------------------------------------ */

export const QUALITY_PRESETS = [
  { id: 'low',    label: 'Draft (1.0×)',  scale: 1.0, jpegQuality: 0.7  },
  { id: 'medium', label: 'Standard (1.5×)', scale: 1.5, jpegQuality: 0.82 },
  { id: 'high',   label: 'High (2.0×)',   scale: 2.0, jpegQuality: 0.9  },
]

/* The "type" tab renders the typed name onto a transparent canvas using
   one of these script-like fonts. We pin web-safe handwriting analogues
   so output is deterministic across machines. */
export const TYPE_FONTS = [
  { id: 'cursive',  label: 'Cursive (Snell-style)',  family: '"Snell Roundhand", "Apple Chancery", "Lucida Handwriting", cursive', italic: false },
  { id: 'script',   label: 'Script (Brush)',         family: '"Brush Script MT", "Lucida Handwriting", cursive',                  italic: true  },
  { id: 'casual',   label: 'Casual handwriting',     family: '"Bradley Hand", "Comic Sans MS", "Marker Felt", cursive',           italic: false },
  { id: 'serif',    label: 'Italic serif',            family: 'Georgia, "Times New Roman", serif',                                  italic: true  },
]

export const POSITIONS = [
  { id: 'br', label: 'Bottom-right' },
  { id: 'bl', label: 'Bottom-left'  },
  { id: 'bc', label: 'Bottom-centre' },
  { id: 'tr', label: 'Top-right' },
  { id: 'tl', label: 'Top-left' },
  { id: 'c',  label: 'Centre' },
  { id: 'custom', label: 'Custom (X / Y %)' },
]

export const SIGNATURE_MODES = [
  { id: 'type',   label: 'Type your name' },
  { id: 'draw',   label: 'Draw with mouse / finger' },
  { id: 'upload', label: 'Upload signature image' },
]

export function findQuality(id)   { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }
export function findTypeFont(id)  { return TYPE_FONTS.find((f) => f.id === id) || TYPE_FONTS[0] }
export function findPosition(id)  { return POSITIONS.find((p) => p.id === id) || POSITIONS[0] }
export function findMode(id)      { return SIGNATURE_MODES.find((m) => m.id === id) || SIGNATURE_MODES[0] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/* ---- Build a PNG data URL from typed text + chosen font / colour ----
 * Used by both the live preview and the actual PDF stamp. Transparent
 * background so it sits on top of the source page naturally.
 * --------------------------------------------------------------------*/
export function buildTypedSignatureDataUrl(text, options = {}) {
  if (typeof document === 'undefined') return ''
  const font = findTypeFont(options.fontId)
  const color = options.color || '#0A0A09'
  const text2 = String(text || '').trim() || 'Your Name'

  // Render at a generous canvas size; consumers downscale via PDF coords.
  const canvas = document.createElement('canvas')
  const baseHeight = 240   // px — high enough that the typed glyphs stay crisp
  const ctx = canvas.getContext('2d')
  const fontSize = Math.round(baseHeight * 0.65)
  ctx.font = `${font.italic ? 'italic ' : ''}${fontSize}px ${font.family}`

  // Measure width so the canvas hugs the text horizontally
  const metrics = ctx.measureText(text2)
  const padX = 24, padY = 16
  canvas.width = Math.max(40, Math.ceil(metrics.width + padX * 2))
  canvas.height = baseHeight + padY

  // Re-apply font (canvas resize resets context state)
  const ctx2 = canvas.getContext('2d')
  ctx2.clearRect(0, 0, canvas.width, canvas.height)
  ctx2.font = `${font.italic ? 'italic ' : ''}${fontSize}px ${font.family}`
  ctx2.fillStyle = color
  ctx2.textBaseline = 'alphabetic'
  ctx2.fillText(text2, padX, baseHeight)

  return canvas.toDataURL('image/png')
}

/* ---- Resolve where to stamp the signature on the page ----
 * Inputs in page coordinates (W, H in PDF points; sigW, sigH in points).
 * `customX` / `customY` are 0–100 (percent of page) when positionId === 'custom'.
 * Returns { x, y } in PDF points (top-left of the signature image).            */
export function resolveSignaturePlacement(positionId, customX, customY, pageW, pageH, sigW, sigH) {
  const pad = 28
  const pos = findPosition(positionId)
  if (pos.id === 'custom') {
    // customX, customY = 0..100 (% of page width / height to the top-left of sig)
    const x = Math.max(0, Math.min(pageW - sigW, ((Number(customX) || 0) / 100) * pageW))
    const y = Math.max(0, Math.min(pageH - sigH, ((Number(customY) || 0) / 100) * pageH))
    return { x, y }
  }
  switch (pos.id) {
    case 'br': return { x: pageW - sigW - pad,    y: pageH - sigH - pad }
    case 'bl': return { x: pad,                   y: pageH - sigH - pad }
    case 'bc': return { x: (pageW - sigW) / 2,    y: pageH - sigH - pad }
    case 'tr': return { x: pageW - sigW - pad,    y: pad }
    case 'tl': return { x: pad,                   y: pad }
    case 'c':  return { x: (pageW - sigW) / 2,    y: (pageH - sigH) / 2 }
    default:   return { x: pageW - sigW - pad,    y: pageH - sigH - pad }
  }
}

/* ---- Parse "stamp on which pages" (similar to the watermark tool) ---- */

export const PAGE_SELECTIONS = [
  { id: 'last',     label: 'Last page only (default for contracts)' },
  { id: 'first',    label: 'First page only' },
  { id: 'all',      label: 'All pages' },
  { id: 'custom',   label: 'Custom page' },
]

export function findPageSelection(id) { return PAGE_SELECTIONS.find((p) => p.id === id) || PAGE_SELECTIONS[0] }

export function resolveSignedPages(data, totalPages) {
  const sel = findPageSelection(data.pageSelectionId)
  if (!totalPages) return new Set()
  switch (sel.id) {
    case 'last':   return new Set([totalPages])
    case 'first':  return new Set([1])
    case 'all':    { const s = new Set(); for (let i = 1; i <= totalPages; i++) s.add(i); return s }
    case 'custom': {
      const n = Math.max(1, Math.min(totalPages, Number(data.customPage) || totalPages))
      return new Set([n])
    }
    default: return new Set([totalPages])
  }
}
