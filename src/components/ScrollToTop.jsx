import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* Reset scroll position to top whenever the route changes
   (and there's no in-page hash anchor to honour). */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}
