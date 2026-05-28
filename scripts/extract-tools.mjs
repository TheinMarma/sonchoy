#!/usr/bin/env node
/**
 * Parses `components/ToolsSection.jsx` and writes a pure-data export of every
 * tool to `lib/tools-data.js`. The JSX file is a client module (`'use client'`),
 * so its data exports can't be imported directly from server components. This
 * pre-extraction step gives the server side a clean, JSON-safe TOOLS_META
 * array for metadata generation and the build-time sitemap.
 *
 * Run after editing TOOLS:
 *   node scripts/extract-tools.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const SRC  = path.join(ROOT, 'components/ToolsSection.jsx')
const OUT  = path.join(ROOT, 'lib/tools-data.js')

const src = fs.readFileSync(SRC, 'utf8')
const re = /\{\s*group:\s*'([^']+)',\s*cat:\s*'([^']+)',\s*name:\s*'([^']+)',\s*desc:\s*'([^']+)',\s*Icon:\s*\w+(?:,\s*featured:\s*(true|false))?(?:,\s*path:\s*'([^']+)')?\s*\}/g

const tools = []
let m
while ((m = re.exec(src))) {
  if (!m[6]) continue // tools without a path aren't routable yet
  tools.push({
    group:    m[1],
    cat:      m[2],
    name:     m[3],
    desc:     m[4],
    featured: m[5] === 'true',
    path:     m[6],
  })
}

const banner =
  '/* AUTO-GENERATED from components/ToolsSection.jsx by scripts/extract-tools.mjs.\n' +
  ' * Pure data — safe to import from server components for metadata generation.\n' +
  ' * If you add/edit a tool, run `node scripts/extract-tools.mjs` to regenerate. */\n\n'

fs.writeFileSync(OUT, banner + 'export const TOOLS_META = ' + JSON.stringify(tools, null, 2) + '\n')
console.log(`extracted ${tools.length} tools → ${path.relative(ROOT, OUT)}`)
