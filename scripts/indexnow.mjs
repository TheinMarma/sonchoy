#!/usr/bin/env node
/**
 * Submits URLs to IndexNow (Bing, Yandex, Seznam, Naver, …) so changed pages
 * get recrawled quickly. Run it AFTER a deploy, once the new pages are live:
 *
 *   npm run indexnow                  # every URL in out/sitemap.xml
 *   npm run indexnow -- /tools/foo/   # only the given paths / URLs
 *
 * The key is verified by the search engines against
 * https://sonchoy.com/<KEY>.txt, which ships from /public.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT    = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const HOST    = 'sonchoy.com'
const ORIGIN  = `https://${HOST}`
const KEY     = 'b0de216beb7986fcf36c443051e789c3'
const SITEMAP = path.join(ROOT, 'out/sitemap.xml')

function urlsFromSitemap() {
  if (!fs.existsSync(SITEMAP)) {
    console.error(`${path.relative(ROOT, SITEMAP)} not found — run \`npm run build\` first.`)
    process.exit(1)
  }
  const xml = fs.readFileSync(SITEMAP, 'utf8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
}

const args = process.argv.slice(2)
const urlList = args.length
  ? args.map((a) => (a.startsWith('http') ? a : `${ORIGIN}${a.startsWith('/') ? '' : '/'}${a}`))
  : urlsFromSitemap()

if (!urlList.length) {
  console.error('No URLs to submit.')
  process.exit(1)
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method:  'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body:    JSON.stringify({
    host:        HOST,
    key:         KEY,
    keyLocation: `${ORIGIN}/${KEY}.txt`,
    urlList,
  }),
})

// 200 = accepted, 202 = accepted (key validation pending).
if (res.ok) {
  console.log(`IndexNow: submitted ${urlList.length} URLs (HTTP ${res.status}).`)
} else {
  console.error(`IndexNow: HTTP ${res.status} — ${await res.text()}`)
  process.exit(1)
}
