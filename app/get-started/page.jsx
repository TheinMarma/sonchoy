'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TOOLS } from '@/components/ToolsSection'

/**
 * Visiting /get-started picks one tool at random from the TOOLS array and
 * client-redirects to it. New tools are picked up automatically as soon as
 * they get a `path` in TOOLS.
 *
 * Runs only on the client because Math.random + window history are not
 * deterministic for static prerender. The static HTML for this route still
 * renders the small "Loading tool…" placeholder for crawlers.
 */
export default function GetStartedRedirect() {
  const router = useRouter()

  useEffect(() => {
    const eligible = TOOLS.filter((t) => typeof t.path === 'string' && t.path)
    if (!eligible.length) return
    const target = eligible[Math.floor(Math.random() * eligible.length)].path
    router.replace(target)
  }, [router])

  return (
    <main className="mx-auto max-w-[640px] px-6 py-24 text-center">
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-crimson-300">
        Get started
      </p>
      <h1 className="m-0 mt-3 text-3xl font-medium tracking-[-0.02em] text-ink-950 md:text-4xl">
        Loading a random tool…
      </h1>
      <p className="mt-4 text-[15px] leading-[1.6] text-ink-700">
        If nothing happens in a second,{' '}
        <a href="/" className="text-crimson-300 no-underline hover:text-crimson-400">
          head back home
        </a>{' '}
        and pick one yourself.
      </p>
    </main>
  )
}
