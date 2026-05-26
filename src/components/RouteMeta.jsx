import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { TOOLS } from './ToolsSection'

/**
 * Per-route metadata updater.
 *
 * The site is a single-page app, so `index.html` ships one fixed <title>
 * and <meta description>. That hurts Lighthouse SEO (every URL should have
 * its own title + description) and breaks social-share previews.
 *
 * This component watches the router's pathname and on every change:
 *   • sets document.title
 *   • updates / creates <meta name="description">
 *   • updates / creates <link rel="canonical">
 *   • updates / creates Open Graph + Twitter card tags
 *
 * Per-route data is derived from the existing TOOLS array (exported from
 * ToolsSection) so new tools get metadata automatically when they're added
 * with a `path` + `desc`. The home page and a few special routes have
 * hand-tuned entries below.
 */

const SITE_NAME    = 'Sonchoy'
const SITE_ORIGIN  = 'https://sonchoy.com'
const DEFAULT_TITLE       = 'Sonchoy — Free, fast PDF tools for everyday document work'
const DEFAULT_DESCRIPTION =
  "Convert, edit, and generate PDFs in seconds. 100+ free finance & PDF tools — and a doorway to advanced features through pdfFiller's free trial."

const STATIC_META = {
  '/':              { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  '/get-started':   { title: 'Pick a tool — Sonchoy', description: 'Jumping you into one of our finance or PDF tools at random. Free, no signup.' },
}

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function resolveMeta(pathname) {
  if (STATIC_META[pathname]) return STATIC_META[pathname]

  // Look up tool by path
  const tool = TOOLS.find((t) => t.path === pathname)
  if (tool) {
    return {
      title:       `${tool.name} — Free Online Tool · Sonchoy`,
      description: tool.desc,
    }
  }
  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }
}

export default function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const { title, description } = resolveMeta(pathname)
    const canonical = `${SITE_ORIGIN}${pathname === '/' ? '/' : pathname}`

    document.title = title
    setMeta('description', description)
    setCanonical(canonical)

    // Open Graph
    setMeta('og:title',        title,        'property')
    setMeta('og:description',  description,  'property')
    setMeta('og:url',          canonical,    'property')
    setMeta('og:type',         'website',    'property')
    setMeta('og:site_name',    SITE_NAME,    'property')

    // Twitter
    setMeta('twitter:card',        'summary_large_image')
    setMeta('twitter:title',       title)
    setMeta('twitter:description', description)
  }, [pathname])

  return null
}
