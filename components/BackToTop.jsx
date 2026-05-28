'use client'

import { useEffect, useState } from 'react'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onClick = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={onClick}
      className={`fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-crimson-500/40 bg-surface/80 text-crimson-300 shadow-[0_8px_24px_-6px_rgba(237,40,40,0.45)] backdrop-blur-md transition-all duration-300 hover:border-crimson-500 hover:bg-crimson-500 hover:text-white hover:shadow-[0_8px_28px_-4px_rgba(237,40,40,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/60 sm:bottom-6 sm:right-6 ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-3 opacity-0 pointer-events-none'
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 14V4M4 8l5-5 5 5" />
      </svg>
    </button>
  )
}
