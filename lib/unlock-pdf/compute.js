/* ------------------------------------------------------------------ */
/*  Unlock PDF — config helpers                                          */
/* ------------------------------------------------------------------ */

export const QUALITY_PRESETS = [
  { id: 'low',    label: 'Draft (1.0×)',  scale: 1.0, jpegQuality: 0.7  },
  { id: 'medium', label: 'Standard (1.5×)', scale: 1.5, jpegQuality: 0.82 },
  { id: 'high',   label: 'High (2.0×)',   scale: 2.0, jpegQuality: 0.9  },
]

export function findQuality(id) { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/* Map pdfjs's terse error codes to friendly explanations the UI can show. */
export function explainPdfError(err) {
  const msg = String(err?.message || err || '').toLowerCase()
  if (msg.includes('no password given') || msg.includes('password is needed')) {
    return { code: 'NEED_PASSWORD', label: 'This PDF is password-protected. Enter the password to unlock.' }
  }
  if (msg.includes('incorrect password')) {
    return { code: 'BAD_PASSWORD', label: 'That password did not unlock the PDF. Re-check and try again.' }
  }
  if (msg.includes('invalid pdf') || msg.includes('xref') || msg.includes('not a pdf')) {
    return { code: 'INVALID_PDF', label: 'This file does not look like a valid PDF.' }
  }
  return { code: 'OTHER', label: err?.message || 'Could not read the PDF.' }
}
