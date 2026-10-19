import { TOOLS_META } from '@/lib/tools-data'
import { pageMetadata } from '@/lib/seo'

/**
 * Card descriptions in TOOLS_META are written for the tools grid and are
 * mostly 60–80 characters — too short for a meta description (search
 * engines show ~110–160). Each tool's description is extended with a
 * sentence about how that group of tools works.
 */
const GROUP_SUFFIX = {
  conversion: 'Free and private — runs entirely in your browser, so your files are never uploaded.',
  pdf:        'Free and private — your PDFs are processed in your browser and never uploaded.',
  invoicing:  'Free online tool — no signup, no uploads, everything runs right in your browser.',
  documents:  'Free, no signup — fill in the details in your browser and download the finished document.',
  contracts:  'Free, no signup — customise the template in your browser and download the agreement.',
  accounting: 'Free, no signup — build it in your browser and download a clean, shareable report.',
  tax:        'Free, no signup — every figure is worked out in your browser, nothing is uploaded.',
}
const FALLBACK_SUFFIX = 'Free, private, no signup — runs in your browser.'
const MAX_DESCRIPTION = 160

// Rendered through the layout's '%s — Sonchoy' template; keep the full
// <title> within ~60 chars so search results don't truncate it.
const MAX_TITLE = 60
const BRAND_SUFFIX = ' — Sonchoy'

function toolTitle(tool) {
  const long = `${tool.name} — Free Online Tool`
  return (long + BRAND_SUFFIX).length <= MAX_TITLE ? long : `${tool.name} — Free Tool`
}

function toolDescription(tool) {
  const base = tool.desc.trim().replace(/\.?$/, '.')
  const long = `${base} ${GROUP_SUFFIX[tool.group] || FALLBACK_SUFFIX}`
  return long.length <= MAX_DESCRIPTION ? long : `${base} ${FALLBACK_SUFFIX}`
}

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

  return pageMetadata({
    path:        slug,
    title:       toolTitle(tool),
    description: toolDescription(tool),
  })
}
