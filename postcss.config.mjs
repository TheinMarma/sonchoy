/** PostCSS config for Next.js + Tailwind v4.
 *  Next.js doesn't go through Vite's `@tailwindcss/vite` plugin, so we use
 *  the PostCSS pipeline here. Both pipelines coexist in this repo during
 *  the migration.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
