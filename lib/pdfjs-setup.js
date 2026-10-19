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
 *
 * Uses pdf.js's *legacy* build: since v6 the default build relies on very
 * new JS (e.g. `Map.prototype.getOrInsertComputed`) and fails in browsers
 * that don't have it yet (Chrome 141 among them). The legacy build ships
 * polyfills for those.
 * `public/pdf.worker.min.mjs` must be copied from the same legacy build
 * (node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs) after upgrades.
 */

let cache = null

export async function getPdfjs() {
  if (cache) return cache
  const mod = await import('pdfjs-dist/legacy/build/pdf.mjs')
  if (typeof window !== 'undefined' && !mod.GlobalWorkerOptions.workerSrc) {
    mod.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  }
  cache = mod
  return mod
}
