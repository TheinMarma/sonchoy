import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Inline the main CSS bundle directly into index.html at build time.
 *
 * Why: a render-blocking <link rel="stylesheet"> costs a full round trip on
 *      first paint. Inlining keeps the CSS on the same TCP/QUIC connection
 *      as the HTML, so the browser can parse + paint in one shot. Lighthouse
 *      stops flagging "render-blocking stylesheet" and FCP/LCP drop by the
 *      same margin (~150ms on a 3G connection).
 *
 * We only inline the *entry* CSS chunk (the one referenced from index.html);
 * any code-split CSS for lazy routes still loads on demand.
 */
function inlineEntryCss() {
  return {
    name: 'inline-entry-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx?.bundle
        if (!bundle) return html

        // Find the css asset that the HTML actually links to.
        const linkRe = /<link\s+[^>]*rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/i
        const match = html.match(linkRe)
        if (!match) return html

        const href = match[1]
        const fileName = href.replace(/^\//, '')
        const asset = bundle[fileName]
        if (!asset || asset.type !== 'asset') return html

        const css = asset.source.toString()
        return html.replace(match[0], `<style>${css}</style>`)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineEntryCss()],
})
