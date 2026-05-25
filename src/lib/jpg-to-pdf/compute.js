/* ------------------------------------------------------------------ */
/*  JPG Receipt → PDF — single-image, single-PDF helpers                */
/*                                                                       */
/*  Streamlined cousin of the multi-image Receipt Image → PDF tool.     */
/*  One image in, one tidy expense-ready PDF out — with sensible        */
/*  defaults that work without any configuration at all.                */
/* ------------------------------------------------------------------ */

export const PAGE_SIZES = [
  { id: 'a4',          label: 'A4 (210 × 297 mm)',          w: 595.28, h: 841.89 },
  { id: 'letter',      label: 'US Letter',                  w: 612,    h: 792    },
  { id: 'a5',          label: 'A5 (148 × 210 mm)',          w: 419.53, h: 595.28 },
  { id: 'fit',         label: 'Fit page to receipt',         w: 0,      h: 0 },
  { id: 'receipt',     label: 'Receipt strip · 80mm × 297mm', w: 226.77, h: 841.89 },
]

export const FIT_MODES = [
  { id: 'contain', label: 'Fit inside page (preserve aspect)' },
  { id: 'cover',   label: 'Fill page (may crop)' },
  { id: 'native',  label: 'Native size (centred)' },
]

export const MARGIN_PRESETS = [
  { id: 'none',   label: 'None',          pt: 0 },
  { id: 'tight',  label: 'Tight (8pt)',   pt: 8 },
  { id: 'normal', label: 'Normal (24pt)', pt: 24 },
  { id: 'wide',   label: 'Wide (48pt)',   pt: 48 },
]

export const QUALITY_PRESETS = [
  { id: 'low',    label: 'Draft (lighter PDF)',  jpegQuality: 0.7 },
  { id: 'medium', label: 'Standard (balanced)',  jpegQuality: 0.85 },
  { id: 'high',   label: 'High (sharper text)',  jpegQuality: 0.92 },
]

export function findPageSize(id)     { return PAGE_SIZES.find((p) => p.id === id) || PAGE_SIZES[0] }
export function findFitMode(id)      { return FIT_MODES.find((f) => f.id === id) || FIT_MODES[0] }
export function findMarginPreset(id) { return MARGIN_PRESETS.find((m) => m.id === id) || MARGIN_PRESETS[2] }
export function findQuality(id)      { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / (1024 * 1024)).toFixed(2)} MB`
}

/* ---- Placement maths --------------------------------------------------
 * Decide the rectangle the image occupies inside the page's content
 * box. Returns { x, y, w, h } in PDF points (inside the margin).         */
export function resolvePlacement(fitId, imgW, imgH, slotX, slotY, slotW, slotH) {
  const aspect = imgW / Math.max(1, imgH)
  if (fitId === 'native') {
    return {
      x: slotX + (slotW - imgW) / 2,
      y: slotY + (slotH - imgH) / 2,
      w: imgW,
      h: imgH,
    }
  }
  if (fitId === 'cover') {
    const slotAspect = slotW / slotH
    if (aspect > slotAspect) {
      // Image wider than slot → fill height, overflow horizontally (centred)
      const h = slotH
      const w = h * aspect
      return { x: slotX - (w - slotW) / 2, y: slotY, w, h }
    } else {
      const w = slotW
      const h = w / aspect
      return { x: slotX, y: slotY - (h - slotH) / 2, w, h }
    }
  }
  // contain (default)
  const slotAspect = slotW / slotH
  if (aspect > slotAspect) {
    const w = slotW
    const h = w / aspect
    return { x: slotX, y: slotY + (slotH - h) / 2, w, h }
  } else {
    const h = slotH
    const w = h * aspect
    return { x: slotX + (slotW - w) / 2, y: slotY, w, h }
  }
}

/* Derive a sensible orientation for fixed page sizes — landscape if the
   image's aspect is wider than 1 *and* the chosen page is portrait. */
export function pickOrientation(pageSize, imgW, imgH) {
  if (pageSize.w === 0) {
    // 'fit' mode — orientation is whatever the image is
    return imgW > imgH ? 'landscape' : 'portrait'
  }
  const portraitW = Math.min(pageSize.w, pageSize.h)
  const portraitH = Math.max(pageSize.w, pageSize.h)
  const portraitAspect = portraitW / portraitH
  const imgAspect = imgW / Math.max(1, imgH)
  // Use landscape if the image is sufficiently wider than the portrait page
  return imgAspect > portraitAspect * 1.1 ? 'landscape' : 'portrait'
}
