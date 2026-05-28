import { TOOLS_META } from '@/lib/tools-data'

/**
 * Build a Next.js metadata object for a given tool route.
 *
 * Each tool page exports:
 *   export const metadata = generateToolMetadata('/tools/<slug>')
 *
 * The tool's name + desc come from TOOLS_META (auto-extracted from
 * ToolsSection.jsx). Re-run `node scripts/extract-tools.mjs` after editing
 * TOOLS to refresh.
 */
export function generateToolMetadata(slug) {
  const tool = TOOLS_META.find((t) => t.path === slug)
  if (!tool) return {}

  const title = `${tool.name} — Free Online Tool`
  const description = tool.desc
  const canonical = slug.endsWith('/') ? slug : `${slug}/`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title:       `${title} · Sonchoy`,
      description,
      url:         canonical,
      type:        'website',
      siteName:    'Sonchoy',
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${title} · Sonchoy`,
      description,
    },
  }
}
