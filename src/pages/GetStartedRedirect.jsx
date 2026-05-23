import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { TOOLS } from '../components/ToolsSection'

/* `/get-started` lands a curious visitor on a randomly chosen tool page.

   Source of truth is the TOOLS array in ToolsSection — any tile there with
   a `path` is a live, routed page, so new tools added to the catalogue are
   automatically eligible for the random pick without touching this file.

   The pick is made once on mount (lazy useState initialiser) so the chosen
   URL is stable across re-renders before <Navigate> fires. `replace` keeps
   /get-started out of the back-button history. */
export default function GetStartedRedirect() {
  const [target] = useState(() => {
    const paths = TOOLS.map((t) => t.path).filter(Boolean)
    if (paths.length === 0) return '/#tools'  // safety fallback
    return paths[Math.floor(Math.random() * paths.length)]
  })

  return <Navigate to={target} replace />
}
