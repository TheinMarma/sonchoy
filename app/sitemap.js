import { TOOLS_META } from '@/lib/tools-data'
import { SITE_ORIGIN as SITE, withTrailingSlash } from '@/lib/seo'

/**
 * sitemap.xml — Next.js file convention.
 *
 * Pulls every routable tool from the single source of truth (TOOLS_META,
 * auto-extracted from ToolsSection.jsx) and joins the static pages. New
 * tools land in the sitemap automatically on the next build.
 *
 * Every URL carries the trailing slash the static export serves
 * (`trailingSlash: true`) — slashless URLs 301/308-redirect, and search
 * engines flag redirecting sitemap entries.
 */

export const dynamic = 'force-static'

export default function sitemap() {
  const lastModified = new Date()
  const staticPages = [
    { url: `${SITE}/`,          priority: 1.0, changeFrequency: 'weekly' },
    { url: `${SITE}/tools/`,    priority: 0.8, changeFrequency: 'weekly' },
    { url: `${SITE}/about/`,    priority: 0.6, changeFrequency: 'monthly' },
    { url: `${SITE}/contact/`,  priority: 0.6, changeFrequency: 'monthly' },
    { url: `${SITE}/terms/`,    priority: 0.4, changeFrequency: 'yearly' },
    { url: `${SITE}/privacy/`,  priority: 0.4, changeFrequency: 'yearly' },
  ]

  const toolPages = TOOLS_META.map((tool) => ({
    url:             `${SITE}${withTrailingSlash(tool.path)}`,
    priority:        tool.featured ? 0.9 : 0.7,
    changeFrequency: 'monthly',
  }))

  return [...staticPages, ...toolPages].map((entry) => ({
    ...entry,
    lastModified,
  }))
}
