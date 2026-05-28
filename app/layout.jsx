import './globals.css'
import TopNav from '@/components/TopNav'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import CursorGlow from '@/components/CursorGlow'
import BackToTop from '@/components/BackToTop'

/**
 * Root layout — server component. This is where the SEO-critical metadata
 * lives in the rendered HTML *before* any JS runs. Individual pages export
 * their own `metadata` (or `generateMetadata`) to override per-route fields.
 */

const SITE_ORIGIN = 'https://sonchoy.com'
const SITE_NAME   = 'Sonchoy'
const DEFAULT_TITLE       = '90+ Free Invoice, PDF & Accounting Tools — Sonchoy'
const DEFAULT_DESCRIPTION =
  'Generate invoices, convert PDFs to Excel, build financial reports, and extract bank statements — instantly, in your browser. 90+ free finance & PDF tools, no signup.'

export const metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default:  DEFAULT_TITLE,
    template: '%s — Sonchoy',
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'invoice generator', 'PDF to Excel', 'bank statement to Excel',
    'free PDF tools', 'accounting software', 'tax calculator',
    'financial reports', 'free online tools',
  ],
  authors: [{ name: SITE_NAME }],
  applicationName: SITE_NAME,
  robots: {
    index: true, follow: true,
    googleBot: {
      index: true, follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: { canonical: '/' },
  openGraph: {
    type:        'website',
    siteName:    SITE_NAME,
    url:         SITE_ORIGIN,
    title:       DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card:        'summary_large_image',
    title:       DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  icons: {
    icon: '/favicon.svg',
  },
  verification: {
    other: { 'verification': '26b26528c61aaf7c9d260766dc513658' },
  },
}

export default function RootLayout({ children }) {
  return (
    // `suppressHydrationWarning` on <html> and <body> silences mismatches
    // caused by browser extensions that inject classes/attributes onto these
    // tags after page load (e.g. Dark Reader's `class="hydrated"`, Grammarly's
    // data-attrs). It only scopes the suppression to attributes on these two
    // elements — the rest of the tree still hydrates with full checks.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fonts — preconnect + parallel stylesheet (faster than @import in CSS). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
        />

        {/* GA bootstrap (Consent Mode v2 defaults to denied for ad signals). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent','default',{
                ad_storage:'denied', ad_user_data:'denied',
                ad_personalization:'denied', analytics_storage:'granted'
              });
              gtag('js', new Date());
              gtag('config','G-KVWPT8FMTS',{
                allow_google_signals:false,
                allow_ad_personalization_signals:false,
                ads_data_redaction:true
              });
              window.addEventListener('load', function(){
                var s=document.createElement('script');
                s.async=true;
                s.src='https://www.googletagmanager.com/gtag/js?id=G-KVWPT8FMTS';
                document.head.appendChild(s);
              });
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ScrollToTop />
        <CursorGlow />
        <TopNav />
        {children}
        <Footer />
        <BackToTop />
      </body>
    </html>
  )
}
