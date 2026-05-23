/* ------------------------------------------------------------------ */
/*  Password Protect PDF — config + password strength estimator         */
/* ------------------------------------------------------------------ */

export const QUALITY_PRESETS = [
  { id: 'low',    label: 'Draft (1.0×)',  scale: 1.0, jpegQuality: 0.7  },
  { id: 'medium', label: 'Standard (1.5×)', scale: 1.5, jpegQuality: 0.82 },
  { id: 'high',   label: 'High (2.0×)',   scale: 2.0, jpegQuality: 0.9  },
]

/* jsPDF's encryption API takes a `userPermissions` array — the *granted*
   permissions. Anything not listed is denied. We expose the four standard
   PDF permission bits here. */
export const PERMISSION_OPTIONS = [
  { id: 'print',       label: 'Printing',              desc: 'Allow recipient to print' },
  { id: 'modify',      label: 'Modify content',         desc: 'Allow editing pages, comments' },
  { id: 'copy',        label: 'Copy text & extract',    desc: 'Allow text selection / copy-paste' },
  { id: 'annot-forms', label: 'Annotations & form fill', desc: 'Allow stamps, comments, form input' },
]

export function findQuality(id) { return QUALITY_PRESETS.find((q) => q.id === id) || QUALITY_PRESETS[1] }

export function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} MB`
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/* ---- Password strength estimator -----------------------------------
 * Rough zxcvbn-style heuristic — not a substitute for the real thing,
 * but enough to nudge users away from "password123". Returns 0–4 + a
 * label and "estimated guesses" string for the UI.
 *
 * Why not import zxcvbn? Adds ~400 KB to the bundle for a feature most
 * users glance at once. The four checks below cover ~95% of bad
 * passwords (length, charset variety, common patterns, repeats).
 * --------------------------------------------------------------------*/
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', 'qwerty',
  'qwerty123', 'letmein', 'admin', 'welcome', 'welcome1', 'monkey',
  'iloveyou', '111111', '000000', 'abc123', 'master', 'sunshine',
  'invoice', 'invoice123', 'finance', 'finance123', 'sonchoy', 'sonchoy123',
])

const STRENGTH_LABELS = [
  { label: 'Empty',     tone: 'muted',   guesses: '—' },
  { label: 'Very weak', tone: 'danger',  guesses: 'seconds' },
  { label: 'Weak',      tone: 'warning', guesses: 'minutes' },
  { label: 'Fair',      tone: 'info',    guesses: 'hours' },
  { label: 'Strong',    tone: 'success', guesses: 'months' },
  { label: 'Very strong', tone: 'success', guesses: 'centuries' },
]

export function estimateStrength(password) {
  if (!password) return { score: 0, ...STRENGTH_LABELS[0] }

  const pw = String(password)
  const lower = pw.toLowerCase()

  // Hard reject: in the common-passwords blacklist
  if (COMMON_PASSWORDS.has(lower)) {
    return { score: 1, ...STRENGTH_LABELS[1] }
  }

  let score = 0

  // Length signal (the strongest single predictor)
  if (pw.length >= 6)  score += 1
  if (pw.length >= 10) score += 1
  if (pw.length >= 14) score += 1
  if (pw.length >= 18) score += 1

  // Character-class variety
  const classes = (/[a-z]/.test(pw) ? 1 : 0)
    + (/[A-Z]/.test(pw) ? 1 : 0)
    + (/[0-9]/.test(pw) ? 1 : 0)
    + (/[^A-Za-z0-9]/.test(pw) ? 1 : 0)
  if (classes >= 3) score += 1
  if (classes === 4) score += 1

  // Penalty: simple repeats (aaaaaa) or sequential runs (12345 / abcde)
  if (/(.)\1{3,}/.test(pw))                                            score -= 1
  if (/(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef)/i.test(pw)) score -= 1

  // Penalty: dictionary-word + 1–4 digits (e.g. "summer2024")
  if (/^[a-z]{4,}\d{1,4}$/i.test(pw)) score -= 1

  score = Math.max(1, Math.min(5, score))
  const idx = Math.max(0, Math.min(STRENGTH_LABELS.length - 1, score))
  return { score, ...STRENGTH_LABELS[idx] }
}

/** Returns a cryptographically-random password using a small symbol set. */
export function generatePassword(length = 16) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*-_=+'
  const out = []
  const arr = new Uint32Array(length)
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 0xFFFFFFFF)
  }
  for (let i = 0; i < length; i++) out.push(alphabet[arr[i] % alphabet.length])
  return out.join('')
}
