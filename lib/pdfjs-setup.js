/**
 * Lazy pdf.js loader.
 *
 * Returning a *promise* means modules that import this don't pull
 * `pdfjs-dist` into the Node-side bundle during static prerender (where
 * DOMMatrix is undefined). The dynamic import only resolves at runtime in
 * the browser, when the user actually invokes a PDF operation.
 *
 * Usage:
 *   import { getPdfjs } from '@/lib/pdfjs-setup'
 *   const pdfjsLib = await getPdfjs()
 *   const doc = await pdfjsLib.getDocument(...).promise
 */

let cache = null

export async function getPdfjs() {
  if (cache) return cache
  const mod = await import('pdfjs-dist')
  if (typeof window !== 'undefined' && !mod.GlobalWorkerOptions.workerSrc) {
    mod.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  }
  cache = mod
  return mod
}
