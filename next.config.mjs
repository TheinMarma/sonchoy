import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export → produces `out/` with plain HTML+JS, deployable to
  // Hostinger (or any static host).
  output: 'export',

  // Trailing slashes match the directory-based layout
  // `out/tools/<slug>/index.html`, served cleanly by Apache.
  trailingSlash: true,

  // Static export doesn't have an image optimizer.
  images: { unoptimized: true },

  reactStrictMode: true,

  // Pin the workspace root so Next.js doesn't pick up a stray lockfile
  // higher up the filesystem.
  outputFileTracingRoot: __dirname,

  // Don't fail the build on lint — we'll clean up incrementally.
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
