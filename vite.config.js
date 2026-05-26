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

/**
 * Build-time sitemap generator. Parses `src/components/ToolsSection.jsx`
 * for every `path: '/tools/...'` entry and emits a `sitemap.xml` into the
 * build output. Keeps the sitemap in sync with the live tool list with
 * zero manual upkeep — adding a new tool to TOOLS automatically adds it
 * to the sitemap on the next build.
 */
function emitSitemap() {
  const SITE_ORIGIN = 'https://sonchoy.com'
  return {
    name: 'emit-sitemap',
    apply: 'build',
    generateBundle() {
      const src = fs.readFileSync(
        path.resolve('src/components/ToolsSection.jsx'),
        'utf8',
      )
      const paths = new Set(['/'])
      const re = /path:\s*'(\/tools\/[a-z0-9-]+)'/g
      let m
      while ((m = re.exec(src))) paths.add(m[1])

      const today = new Date().toISOString().slice(0, 10)
      const urls = [...paths].map((p) => {
        const priority = p === '/' ? '1.0' : '0.7'
        const changefreq = p === '/' ? 'weekly' : 'monthly'
        return `  <url>
    <loc>${SITE_ORIGIN}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
      }).join('\n')

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml })
    },
  }
}

/**
 * Mark the entry module script as high-priority so the browser starts
 * fetching it the moment the HTML pre-loader scanner discovers it — before
 * any in-body content is parsed. Shortens the critical chain by letting
 * JS download overlap with HTML parsing more aggressively.
 */
function prioritizeEntryScript() {
  return {
    name: 'prioritize-entry-script',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<script\s+type="module"\s+crossorigin\s+src="(\/assets\/[^"]+\.js)"><\/script>/,
          (_, src) => `<script type="module" crossorigin fetchpriority="high" src="${src}"></script>`,
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineEntryCss(), prioritizeEntryScript(), emitSitemap()],
})
