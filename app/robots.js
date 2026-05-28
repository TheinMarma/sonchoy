/**
 * robots.txt — Next.js file convention. Output goes to /out/robots.txt at build.
 * Replaces the static /public/robots.txt from the Vite era.
 */
export const dynamic = 'force-static'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/get-started',
      },
    ],
    sitemap: 'https://sonchoy.com/sitemap.xml',
    host: 'https://sonchoy.com',
  }
}
