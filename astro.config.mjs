import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const siteUrl = 'https://french.milovicake.ru'

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
          const hash = createHash('sha256')
          const walk = async (dirPath) => {
            const entries = await fs.readdir(dirPath, { withFileTypes: true })
            entries.sort((a, b) => a.name.localeCompare(b.name))
            for (const entry of entries) {
              const full = path.join(dirPath, entry.name)
              if (full === swPath) continue
              if (entry.isDirectory()) {
                await walk(full)
              } else if (entry.isFile()) {
                const rel = path.relative(dir.pathname, full).replaceAll(path.sep, '/')
                hash.update(rel)
                hash.update(await fs.readFile(full))
              }
            }
          }
          await walk(dir.pathname)
          const stamp = hash.digest('hex').slice(0, 16)
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

/**
 * Post-process Astro's sitemap with image discovery and trustworthy lastmod.
 *
 * Google removed image:caption/image:title/image:geo_location/image:license from
 * its current image-sitemap specification. We intentionally emit only image:loc.
 * lastmod is added only for article URLs whose generated Article JSON-LD exposes
 * a real dateModified value; static pages are not given synthetic timestamps.
 */
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
  const absoluteImage = (value) => {
    const decoded = htmlDecode(value)
    if (!decoded) return ''
    if (/^https:\/\//i.test(decoded)) return decoded
    if (decoded.startsWith('/')) return `${siteUrl}${decoded}`
    return ''
  }

  return {
    name: 'milovi-image-sitemap',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const dist = dir.pathname
        const sitemapPath = path.join(dist, 'sitemap-0.xml')
        let sitemapXml = await readText(sitemapPath)
        if (!sitemapXml) return

        const pageMetadata = new Map()
        const articlesDir = path.join(dist, 'articles')
        const articleIds = await fs.readdir(articlesDir).catch(() => [])

        for (const id of articleIds) {
          const html = await readText(path.join(articlesDir, id, 'index.html'))
          if (!html) continue
          const loc = `${siteUrl}/articles/${id}/`
          const image = absoluteImage(html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? '')
          const dateModified = html.match(/"dateModified"\s*:\s*"([^"]+)"/)?.[1] ?? ''
          pageMetadata.set(loc, {
            images: image ? [image] : [],
            lastmod: /^\d{4}-\d{2}-\d{2}(?:T[^"<]+)?$/.test(dateModified) ? dateModified : '',
          })
        }

        const canonHtml = await readText(path.join(dist, 'canon', 'index.html'))
        if (canonHtml) {
          const canonImages = []
          const imageMatches = canonHtml.matchAll(/<img[^>]+src="([^"]+)"/g)
          for (const match of imageMatches) {
            const image = absoluteImage(match[1])
            if (!image.includes('/images/canon-sucre/')) continue
            if (!canonImages.includes(image)) canonImages.push(image)
          }
          pageMetadata.set(`${siteUrl}/canon/`, { images: canonImages, lastmod: '' })
        }

        // Be defensive if the sitemap generator changes namespace defaults.
        if (!sitemapXml.includes('xmlns:image=')) {
          sitemapXml = sitemapXml.replace(
            /<urlset\b/,
            '<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
          )
        }

        let imageCount = 0
        let lastmodCount = 0
        const updated = sitemapXml.replace(/<url><loc>([^<]+)<\/loc>(.*?)<\/url>/gs, (block, rawLoc, rawRest) => {
          const loc = htmlDecode(rawLoc)
          const data = pageMetadata.get(loc)
          if (!data) return block

          // A fresh Astro build should not contain these, but stripping them keeps
          // the post-processor idempotent and removes legacy deprecated image tags.
          let rest = rawRest.replace(/<image:image>[\s\S]*?<\/image:image>/g, '')
          rest = rest.replace(/<lastmod>[^<]+<\/lastmod>/g, '')

          const lastmod = data.lastmod ? `<lastmod>${xmlEscape(data.lastmod)}</lastmod>` : ''
          if (lastmod) lastmodCount += 1

          const images = data.images
            .filter((image, index, list) => image && list.indexOf(image) === index)
            .map((image) => {
              imageCount += 1
              return `<image:image><image:loc>${xmlEscape(image)}</image:loc></image:image>`
            })
            .join('')

          return `<url><loc>${rawLoc}</loc>${lastmod}${rest}${images}</url>`
        })

        if (updated !== sitemapXml) {
          await fs.writeFile(sitemapPath, updated, 'utf8')
          console.log(`[milovi-image-sitemap] Added ${imageCount} image URLs and ${lastmodCount} trustworthy lastmod values`)
        }
      },
    },
  }
}

export default defineConfig({
  site: siteUrl,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    react({
      // React 18 streaming can split multibyte UTF-8 sequences at chunk
      // boundaries during static generation. Astro exposes this compatibility
      // mode specifically for deterministic, non-streaming island SSR.
      experimentalDisableStreaming: true,
    }),
    sitemap(),
    enhanceImageSitemap(),
    bumpServiceWorkerVersion(),
  ],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('react-dom') || id.includes('react')) {
              return 'react'
            }
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
