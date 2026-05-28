#!/usr/bin/env node
/**
 * Bulk migration: for every tool route in /tmp/sonchoy-tool-routes.json,
 * copy the legacy page file into `app/tools/<slug>/Tool.jsx`, rewrite its
 * imports / Link props, rename the default export, and emit a tiny
 * server-side `page.jsx` that exports metadata + renders <Tool />.
 *
 * Idempotent — safe to re-run after editing the source file.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const LEGACY = path.join(ROOT, 'legacy-src/pages')
const APP_TOOLS = path.join(ROOT, 'app/tools')

const routes = JSON.parse(fs.readFileSync('/tmp/sonchoy-tool-routes.json', 'utf8'))

// Tools we've already migrated by hand — skip them so we don't clobber.
const ALREADY_DONE = new Set([
  '/tools/invoice-generator',
])

function pascalToCamel(s) {
  return s[0].toLowerCase() + s.slice(1)
}

function toolNameFromComponent(component) {
  // 'InvoicePdfToExcelPage' -> 'InvoicePdfToExcelTool'
  return component.replace(/Page$/, 'Tool')
}

function transform(source) {
  let s = source

  // 1) Prepend 'use client' if not already present.
  if (!/^'use client'/.test(s)) {
    s = `'use client'\n\n${s}`
  }

  // 2) Swap react-router-dom imports.
  s = s.replace(
    /import\s*\{\s*Link\s*\}\s*from\s*'react-router-dom'/g,
    "import Link from 'next/link'",
  )
  s = s.replace(
    /import\s*\{\s*Navigate\s*\}\s*from\s*'react-router-dom'/g,
    "import { redirect } from 'next/navigation'",
  )
  // Catch-all combined imports — fall back to a manual TODO comment.
  s = s.replace(
    /import\s*\{[^}]*\}\s*from\s*'react-router-dom'.*/g,
    (match) => `/* TODO: manual migration needed — original import was: ${match} */`,
  )

  // 3) Swap relative ../components and ../lib for the @/ alias.
  s = s.replace(/from\s+'\.\.\/components\//g, "from '@/components/")
  s = s.replace(/from\s+'\.\.\/lib\//g, "from '@/lib/")

  // 4) Convert <Link to=...> to <Link href=...>.
  s = s.replace(/(<Link[^>]*?)\sto=/g, '$1 href=')

  return s
}

let migrated = 0
let skipped = 0
let errors = []

for (const route of routes) {
  if (ALREADY_DONE.has(route.path)) {
    skipped++
    continue
  }

  const slug = route.path.replace(/^\/tools\//, '')
  const legacyPath = path.join(LEGACY, `${route.file}.jsx`)
  if (!fs.existsSync(legacyPath)) {
    errors.push(`Missing legacy file for ${route.path}: ${legacyPath}`)
    continue
  }

  const targetDir = path.join(APP_TOOLS, slug)
  fs.mkdirSync(targetDir, { recursive: true })

  // Write Tool.jsx
  const source = fs.readFileSync(legacyPath, 'utf8')
  let transformed = transform(source)

  // Rename `export default function FooPage()` → `function FooTool()`
  const newName = toolNameFromComponent(route.component)
  transformed = transformed.replace(
    new RegExp(`export default function ${route.component}\\s*\\(`),
    `export default function ${newName}(`,
  )

  fs.writeFileSync(path.join(targetDir, 'Tool.jsx'), transformed)

  // Write page.jsx
  const page = `import { generateToolMetadata } from '@/lib/tool-metadata'
import Tool from './Tool'

export const metadata = generateToolMetadata('${route.path}')

export default function Page() {
  return <Tool />
}
`
  fs.writeFileSync(path.join(targetDir, 'page.jsx'), page)

  migrated++
}

console.log(`Migrated: ${migrated}`)
console.log(`Skipped (already done): ${skipped}`)
if (errors.length) {
  console.log('\nErrors:')
  for (const e of errors) console.log('  -', e)
}
