import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

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
          const stamp = `${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 17)}-${randomUUID().slice(0, 8)}`
          const updated = original.replaceAll('__BUILD_HASH__', `v${stamp}`)
          if (updated !== original) {
            await fs.writeFile(swPath, updated, 'utf8')
            console.log(`[milovi-sw-version] Cache bumped → v${stamp}`)
          }
        } catch (err) {
          // sw.js not present in dist (e.g. removed) — nothing to do
          if ((err && /** @type {NodeJS.ErrnoException} */ (err).code) !== 'ENOENT') {
            console.warn('[milovi-sw-version] Failed to bump SW version:', err)
          }
        }
      },
    },
  }
}

function enhanceImageSitemap() {
  const xmlEscape = (value = '') => String(value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  const htmlDecode = (value = '') => String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  const readText = async (file) => fs.readFile(file, 'utf8').catch(() => '')
  const stripTags = (value = '') => htmlDecode(String(value).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())

  return {
    name: 'milovi-image-sitemap',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const dist = dir.pathname
        const sitemapPath = path.join(dist, 'sitemap-0.xml')
        const sitemap = await readText(sitemapPath)
        if (!sitemap || sitemap.includes('<image:image>')) return

        const imageByLoc = new Map()
        const articlesDir = path.join(dist, 'articles')
        let articleIds = []
        try {
          articleIds = await fs.readdir(articlesDir)
        } catch (_) {
          return
        }

        for (const id of articleIds) {
          const html = await readText(path.join(articlesDir, id, 'index.html'))
          if (!html) continue
          const loc = `https://french.milovicake.ru/articles/${id}/`
          const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
          if (!image) continue
          const rawTitle = html.match(/<meta property="og:image:alt" content="([^"]+)"/)?.[1]
            ?? html.match(/<title>(.*?)<\/title>/)?.[1]
            ?? ''
          const rawCaption = html.match(/<figcaption[^>]*>(.*?)<\/figcaption>/s)?.[1]
            ?? html.match(/<meta name="description" content="([^"]+)"/)?.[1]
            ?? rawTitle
          const captionText = stripTags(rawCaption)
          imageByLoc.set(loc, {
            image: htmlDecode(image),
            title: stripTags(rawTitle).replace(/\s+—\s+Patisserie Russe$/i, ''),
            // Guard: if regex accidentally captured a large HTML chunk, fall back to title
            caption: captionText.length <= 500 ? captionText : stripTags(rawTitle),
          })
        }

        const updated = sitemap.replace(/<url><loc>([^<]+)<\/loc>(.*?)<\/url>/gs, (block, loc, rest) => {
          const data = imageByLoc.get(loc)
          if (!data) return block
          return `<url><loc>${loc}</loc>${rest}<image:image><image:loc>${xmlEscape(data.image)}</image:loc><image:title>${xmlEscape(data.title)}</image:title><image:caption>${xmlEscape(data.caption)}</image:caption></image:image></url>`
        })

        if (updated !== sitemap) {
          await fs.writeFile(sitemapPath, updated, 'utf8')
          console.log(`[milovi-image-sitemap] Added image metadata for ${imageByLoc.size} article URLs`)
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
    enhanceImageSitemap(),
    bumpServiceWorkerVersion(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('framer-motion')) {
              return 'framer-motion'
            }
            if (id.includes('fuse.js')) {
              return 'search'
            }
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
        },
      },
      // Vite default. Bumping it hides legitimate weight-creep regressions;
      // if a chunk approaches 500 KB it should be split (e.g. via manualChunks)
      // rather than silenced.
      chunkSizeWarningLimit: 500,
    },
  },
})
