/**
 * Shared SEO constants + a metadata builder for static pages.
 *
 * Next.js merges metadata shallowly: a page that sets `openGraph` replaces
 * the root layout's `openGraph` entirely. Every page therefore needs the
 * full set of OG fields (title, type, url, image, site name) — this helper
 * makes sure none get dropped.
 */
export const SITE_ORIGIN = 'https://sonchoy.com'
export const SITE_NAME   = 'Sonchoy'

export const OG_IMAGE = {
  url:    '/og-image.png',
  width:  1200,
  height: 630,
  alt:    'Sonchoy — 90+ free invoice, PDF & accounting tools',
}

/** Force the trailing slash the static export serves (`trailingSlash: true`). */
export function withTrailingSlash(path) {
  return path.endsWith('/') ? path : `${path}/`
}

/**
 * @param {object} opts
 * @param {string} opts.path         Route, e.g. '/about/'
 * @param {string} opts.title        Page title (the layout template appends " — Sonchoy")
 * @param {string} opts.description  Meta description, ideally 110–160 chars
 * @param {string} [opts.socialTitle] Title for OG/Twitter cards (defaults to "<title> — Sonchoy")
 */
export function pageMetadata({ path, title, description, socialTitle }) {
  const canonical = withTrailingSlash(path)
  const cardTitle = socialTitle || `${title} — ${SITE_NAME}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type:        'website',
      siteName:    SITE_NAME,
      locale:      'en_US',
      url:         canonical,
      title:       cardTitle,
      description,
      images:      [OG_IMAGE],
    },
    twitter: {
      card:        'summary_large_image',
      title:       cardTitle,
      description,
      images:      [OG_IMAGE.url],
    },
  }
}
