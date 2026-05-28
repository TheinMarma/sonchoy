'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/* Reset scroll position on route change.
   When there's an in-page hash, scroll to that element instead of the top.
   The element may not exist yet during route transitions (e.g. lazy-loaded
   homepage tools section), so we retry a few times with a short delay.

   Next.js note: `usePathname()` excludes the hash, so we read the hash
   directly from `window.location.hash`. The effect re-runs on pathname
   change; for in-page hash navigation we additionally listen to
   `hashchange` to handle clicks while staying on the same route. */
export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    handleScroll()
    window.addEventListener('hashchange', handleScroll)
    return () => window.removeEventListener('hashchange', handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return null
}

function handleScroll() {
  const hash = typeof window !== 'undefined' ? window.location.hash : ''

  if (!hash) {
    window.scrollTo({ top: 0, behavior: 'auto' })
    return
  }

  const id = hash.replace(/^#/, '').split('?')[0]
  if (!id) {
    window.scrollTo({ top: 0, behavior: 'auto' })
    return
  }

  let attempts = 0
  const maxAttempts = 30  // ~1.5s total
  const tryScroll = () => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'auto', block: 'start' })
      return
    }
    attempts += 1
    if (attempts < maxAttempts) {
      setTimeout(tryScroll, 50)
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  tryScroll()
}
