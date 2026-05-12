import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// https://french.milovicake.ru
//
// Custom integration: at the end of the build, replace `__BUILD_HASH__`
// in dist/sw.js with a fresh value so every deploy invalidates the cache
// and triggers UpdateNotification.tsx for returning visitors.
function bumpServiceWorkerVersion() {
  return {
    name: 'milovi-sw-version',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const swPath = path.join(dir.pathname, 'sw.js')
        try {
          const original = await fs.readFile(swPath, 'utf8')
          const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
          const updated = original.replace('__BUILD_HASH__', `v${stamp}`)
          if (updated !== original) {
            await fs.writeFile(swPath, updated, 'utf8')
            // eslint-disable-next-line no-console
            console.log(`[milovi-sw-version] Cache bumped → v${stamp}`)
          }
        } catch (err) {
          // sw.js not present in dist (e.g. removed) — nothing to do
          if ((err && /** @type {NodeJS.ErrnoException} */ (err).code) !== 'ENOENT') {
            // eslint-disable-next-line no-console
            console.warn('[milovi-sw-version] Failed to bump SW version:', err)
          }
        }
      },
    },
  }
}

export default defineConfig({
  site: 'https://french.milovicake.ru',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap(),
    bumpServiceWorkerVersion(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
