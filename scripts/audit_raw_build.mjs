import { promises as fs } from 'node:fs'
import path from 'node:path'

// This audit is intentionally read-only: it validates Astro's untouched output
// and must never repair, normalize or rewrite generated production files.
const DIST_DIR = path.resolve('dist')
const ASTRO_ISLAND_STYLE = '<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>'
const decoder = new TextDecoder('utf-8', { fatal: true })

const files = []

async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath)
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }
}

await fs.access(DIST_DIR).catch(() => {
  throw new Error('dist/ is missing; run the production build before audit:build')
})
await walk(DIST_DIR)

const htmlFiles = files.filter((file) => file.endsWith('.html'))
if (htmlFiles.length === 0) throw new Error('No generated HTML files found in dist/')

const failures = []
const serviceWorkerPath = path.join(DIST_DIR, 'sw.js')
try {
  const serviceWorker = await fs.readFile(serviceWorkerPath, 'utf8')
  const version = serviceWorker.match(/const CACHE_VERSION\s*=\s*['"](v[a-f0-9]{16})['"]/)
  if (!version) failures.push('dist/sw.js is missing its generated 16-character build hash')
  if (serviceWorker.includes('__BUILD_HASH__')) failures.push('dist/sw.js contains an unresolved build-hash placeholder')
  if (!serviceWorker.includes('patisserie-precache-') || !serviceWorker.includes('patisserie-runtime-')) {
    failures.push('dist/sw.js is missing versioned cache names')
  }
} catch {
  failures.push('dist/sw.js is missing; the build must fail closed when service-worker versioning cannot run')
}
let documentCount = 0
let islandDocumentCount = 0
let totalBytes = 0
let srcsetCandidates = 0

// Every same-origin `srcset` candidate is a promise that a file exists. The manifest
// (`src/data/imageVariants.generated.ts`) is committed while the derivatives themselves
// are generated, so a stale manifest - or a build that skipped the generator - would
// ship broken images that only a browser would notice. This audit is read-only and
// resolves the promise against the untouched output.
const DIST_FILES = new Set(files.map((file) => path.normalize(file)))

for (const file of htmlFiles) {
  const relative = path.relative(DIST_DIR, file).replaceAll(path.sep, '/')
  const bytes = await fs.readFile(file)
  totalBytes += bytes.byteLength

  if (bytes.includes(0)) {
    failures.push(`${relative}: contains U+0000/NUL bytes`)
    continue
  }

  let html
  try {
    html = decoder.decode(bytes)
  } catch (error) {
    failures.push(`${relative}: is not strict UTF-8 (${error instanceof Error ? error.message : String(error)})`)
    continue
  }

  if (html.includes('\uFFFD')) failures.push(`${relative}: contains Unicode replacement characters`)
  if (/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(html)) {
    failures.push(`${relative}: contains forbidden control characters`)
  }

  const isDocument = /<!doctype\s+html/i.test(html)
  if (!isDocument) continue
  documentCount += 1

  if (!/<html\b[^>]*\blang=["']ru["']/i.test(html)) {
    failures.push(`${relative}: document does not declare lang="ru"`)
  }
  if (!/<meta\s+charset=["']?utf-8/i.test(html)) {
    failures.push(`${relative}: document does not declare UTF-8 charset`)
  }
  if (!/<meta\s+name=["']viewport["']/i.test(html)) {
    failures.push(`${relative}: document is missing viewport metadata`)
  }

  const markerCount = html.split(ASTRO_ISLAND_STYLE).length - 1
  if (markerCount > 1) {
    failures.push(`${relative}: Astro island style marker appears ${markerCount} times`)
  }
  if (markerCount === 1) islandDocumentCount += 1

  const relatedStyle = html.match(/<style>astro-island,astro-slot,astro-static-slot\{[^<]*<\/style>/g) ?? []
  if (relatedStyle.some((style) => style !== ASTRO_ISLAND_STYLE)) {
    failures.push(`${relative}: Astro island style marker was altered`)
  }

  for (const [, value] of html.matchAll(/\ssrcset="([^"]*)"/gi)) {
    for (const entry of value.split(',')) {
      const url = entry.trim().split(/\s+/)[0]
      if (!url || url.startsWith('data:') || !url.startsWith('/')) continue
      srcsetCandidates += 1
      const candidate = path.normalize(path.join(DIST_DIR, url.split(/[?#]/)[0]))
      if (!DIST_FILES.has(candidate)) {
        failures.push(`${relative}: srcset candidate is missing from dist: ${url}`)
      }
    }
  }

  // `sizes` only means something together with `srcset`; a lone `sizes` is dead
  // markup that silently disables the responsive selection it was added for.
  for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
    const hasSizes = /\ssizes=/i.test(tag)
    const hasSrcset = /\ssrcset=/i.test(tag)
    if (hasSizes && !hasSrcset) failures.push(`${relative}: <img> declares sizes without srcset`)
  }
}

if (documentCount === 0) failures.push('No complete HTML documents were generated')
if (islandDocumentCount === 0) failures.push('No hydrated Astro island document was generated')

if (failures.length > 0) {
  throw new Error(`Raw build audit failed:\n- ${failures.join('\n- ')}`)
}

console.log(
  `Raw build audit passed: ${documentCount} documents, ${htmlFiles.length} HTML files, ` +
  `${islandDocumentCount} hydrated island documents, ${totalBytes.toLocaleString('en-US')} bytes, ` +
  `${srcsetCandidates} srcset candidates resolved, strict UTF-8, no post-processing.`,
)
