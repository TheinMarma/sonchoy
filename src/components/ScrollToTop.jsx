import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* Reset scroll position on route change.
   When there's an in-page hash, scroll to that element instead of the top.
   The element may not exist yet during route transitions (e.g. lazy-loaded
   homepage tools section), so we retry a few times with a short delay. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
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
        // Give up and just go to the top
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    }

    tryScroll()
  }, [pathname, hash])

  return null
}
