/* ------------------------------------------------------------------ */
/*  Receipt Image to PDF — config + image metadata helpers              */
/* ------------------------------------------------------------------ */

export const PAGE_SIZES = [
  { id: 'a4',     label: 'A4 (210 × 297 mm)',   w: 595.28, h: 841.89 },
  { id: 'letter', label: 'US Letter',           w: 612,    h: 792    },
  { id: 'a5',     label: 'A5 (148 × 210 mm)',   w: 419.53, h: 595.28 },
  { id: 'receipt', label: 'Receipt strip · 80mm × 297mm', w: 226.77, h: 841.89 },
  { id: 'fit',    label: 'Fit each receipt (no page size)' },
]

export const FIT_MODES = [
  { id: 'contain', label: 'Fit inside page (preserves aspect, may letterbox)' },
  { id: 'cover',   label: 'Fill page (preserves aspect, may crop)' },
  { id: 'stretch', label: 'Stretch to fill (may distort)' },
  { id: 'native',  label: 'Native size (centred on page)' },
]

export const ORIENTATIONS = [
  { id: 'auto',     label: 'Auto (match image)' },
  { id: 'portrait', label: 'Force portrait' },
  { id: 'landscape', label: 'Force landscape' },
]

export const LAYOUTS = [
  { id: 'one_per_page', label: 'One receipt per page' },
  { id: 'grid_2',       label: '2-up grid (2 per page)' },
  { id: 'grid_4',       label: '4-up grid (4 per page)' },
]

export const SORT_OPTIONS = [
  { id: 'as_added',  label: 'As added' },
  { id: 'filename',  label: 'Filename (A–Z)' },
  { id: 'date_asc',  label: 'File date (oldest first)' },
  { id: 'date_desc', label: 'File date (newest first)' },
]

export const QUALITY_PRESETS = [
  { id: 'low',     label: 'Draft (lighter PDF)',     jpegQuality: 0.7 },
  { id: 'medium',  label: 'Standard (balanced)',     jpegQuality: 0.82 },
  { id: 'high',    label: 'High (sharper text)',     jpegQuality: 0.9 },
  { id: 'print',   label: 'Print (largest file)',    jpegQuality: 0.95 },
]

/* Image margin around each receipt on its page (in PDF points). */
export const MARGIN_PRESETS = [
  { id: 'none',   label: 'None',          pt: 0 },
  { id: 'tight',  label: 'Tight (8pt)',   pt: 8 },
  { id: 'normal', label: 'Normal (20pt)', pt: 20 },
  { id: 'wide',   label: 'Wide (40pt)',   pt: 40 },
]

export function findPageSize(id)    { return PAGE_SIZES.find((p) => p.id === id) || PAGE_SIZES[0] }
export function findFitMode(id)     { return FIT_MODES.find((f) => f.id === id) || FIT_MODES[0] }
export function findOrientation(id) { return ORIENTATIONS.find((o) => o.id === id) || ORIENTATIONS[0] }
export function findLayout(id)      { return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0] }
export function findSortOption(id)  { return SORT_OPTIONS.find((s) => s.id === id) || SORT_OPTIONS[0] }
export function findQuality(id)     { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }
export function findMarginPreset(id) { return MARGIN_PRESETS.find((m) => m.id === id) || MARGIN_PRESETS[2] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/* ---- Image-list helpers --------------------------------------------
 * Each entry is shaped { id, file, name, size, dataUrl, width, height, lastModified }.
 * Sort + total helpers operate on the user-facing list before we hand it
 * to the PDF builder. -------------------------------------------------*/

export function computeImageTotals(images) {
  let bytes = 0
  for (const im of images || []) bytes += Number(im.size) || 0
  return { count: (images || []).length, bytes }
}

export function sortImages(images, sortId) {
  const copy = [...(images || [])]
  switch (sortId) {
    case 'filename':  return copy.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }))
    case 'date_asc':  return copy.sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0))
    case 'date_desc': return copy.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
    default:          return copy
  }
}

/* Decide the placement rectangle for an image inside a target page based
   on the chosen fit mode. Returns { x, y, w, h } in PDF points. */
export function resolveImageRect(fitId, imgW, imgH, slotX, slotY, slotW, slotH) {
  const aspect = imgW / Math.max(1, imgH)
  if (fitId === 'stretch') {
    return { x: slotX, y: slotY, w: slotW, h: slotH }
  }
  if (fitId === 'native') {
    return {
      x: slotX + (slotW - imgW) / 2,
      y: slotY + (slotH - imgH) / 2,
      w: imgW,
      h: imgH,
    }
  }
  if (fitId === 'cover') {
    // Scale so the image fills the slot; crop happens because we still draw
    // at the slot's coords (jsPDF doesn't crop, but visually the image fills).
    const slotAspect = slotW / slotH
    if (aspect > slotAspect) {
      const h = slotH
      const w = h * aspect
      return { x: slotX - (w - slotW) / 2, y: slotY, w, h }
    } else {
      const w = slotW
      const h = w / aspect
      return { x: slotX, y: slotY - (h - slotH) / 2, w, h }
    }
  }
  // 'contain' (default)
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
