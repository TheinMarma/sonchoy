/**
 * Renders an email address (or mailto: link) that Cloudflare's
 * "Email Address Obfuscation" leaves alone.
 *
 * With obfuscation on, the CDN rewrites every address and mailto: link in
 * the HTML into a /cdn-cgi/l/email-protection link, which crawlers fetch
 * as a 404 — Ahrefs reports "Page has links to broken page". Cloudflare
 * skips anything between <!--email_off--> and <!--email_on-->, and since
 * React can't render HTML comments, the markup is injected as raw HTML.
 *
 *   <EmailOff text="hello@sonchoy.com" />
 *   <EmailOff href="mailto:hello@sonchoy.com" text="hello@sonchoy.com" className="…" />
 */
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export default function EmailOff({ text, href, className }) {
  const inner = href
    ? `<a href="${escapeHtml(href)}"${className ? ` class="${escapeHtml(className)}"` : ''}>${escapeHtml(text)}</a>`
    : escapeHtml(text)

  return (
    <span
      className="contents"
      dangerouslySetInnerHTML={{ __html: `<!--email_off-->${inner}<!--email_on-->` }}
    />
  )
}
