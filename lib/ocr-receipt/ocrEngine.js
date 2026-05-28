/* ------------------------------------------------------------------ */
/*  OCR engine — Tesseract.js loader + runner                           */
/*                                                                       */
/*  Tesseract is ~3 MB of WASM + JS. To keep the page bundle small, we  */
/*  load it via a CDN <script> the first time the user actually clicks  */
/*  "Extract" — subsequent runs reuse the loaded library.               */
/*                                                                       */
/*  The CDN URL is pinned to a major version so an upstream breaking    */
/*  change can't silently land. The page surfaces a clear error if the  */
/*  network blocks the CDN.                                              */
/* ------------------------------------------------------------------ */

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'

let loadPromise = null

/** Dynamically load Tesseract.js from the CDN. Resolves with `window.Tesseract`. */
export function loadTesseract() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Tesseract requires a browser.'))
  if (window.Tesseract) return Promise.resolve(window.Tesseract)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    // Bail if the page is offline — give a friendly error instead of a hang.
    if (!navigator.onLine) {
      reject(new Error('Looks like you\'re offline. OCR needs to load the recognition engine from the network on first use.'))
      return
    }
    const existing = document.querySelector(`script[src="${TESSERACT_CDN}"]`)
    if (existing) {
      existing.addEventListener('load',  () => resolve(window.Tesseract))
      existing.addEventListener('error', () => reject(new Error('Could not load the OCR engine from the network.')))
      return
    }
    const script = document.createElement('script')
    script.src = TESSERACT_CDN
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload  = () => {
      if (window.Tesseract) resolve(window.Tesseract)
      else                  reject(new Error('OCR engine loaded but the global was not exposed.'))
    }
    script.onerror = () => reject(new Error('Could not load the OCR engine from the network (CDN blocked?).'))
    document.head.appendChild(script)
  })

  return loadPromise
}

/** File → data URL helper (re-used across the page). */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Run OCR on an image File or data URL.
 * `onProgress` receives `{ stage, pct, message }` updates so the UI can
 * show a live progress bar while Tesseract initialises + recognises.
 */
export async function runOcr(source, options = {}, onProgress = () => {}) {
  const language = options.language || 'eng'
  onProgress({ stage: 'loading', pct: 5, message: 'Loading OCR engine…' })

  const Tesseract = await loadTesseract()

  onProgress({ stage: 'initialising', pct: 18, message: `Initialising ${language} recognition model…` })

  /* Tesseract v5 recognise signature:
       recognise(image, lang, { logger: (m) => ... })
     The logger sends progress events like
       { status: 'recognizing text', progress: 0.42 } */
  const result = await Tesseract.recognize(source, language, {
    logger: (m) => {
      if (!m) return
      const p = typeof m.progress === 'number' ? m.progress : 0
      // Map Tesseract's 0..1 over our 25–95 range
      const pct = 25 + Math.round(p * 70)
      onProgress({ stage: m.status || 'working', pct, message: `${m.status || 'working'} · ${Math.round(p * 100)}%` })
    },
  })

  onProgress({ stage: 'done', pct: 100, message: 'Extraction complete' })
  return {
    text: result?.data?.text || '',
    confidence: result?.data?.confidence ?? null,
    words: result?.data?.words?.length ?? 0,
  }
}

/* ---- Image loader (for dimensions in the preview) ---- */

export function loadImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

/** Convenience: download a string as a file. */
export function downloadText(text, fileName, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return blob.size
}
