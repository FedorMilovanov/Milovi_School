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
let documentCount = 0
let islandDocumentCount = 0
let totalBytes = 0

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
}

if (documentCount === 0) failures.push('No complete HTML documents were generated')
if (islandDocumentCount === 0) failures.push('No hydrated Astro island document was generated')

if (failures.length > 0) {
  throw new Error(`Raw build audit failed:\n- ${failures.join('\n- ')}`)
}

console.log(
  `Raw build audit passed: ${documentCount} documents, ${htmlFiles.length} HTML files, ` +
  `${islandDocumentCount} hydrated island documents, ${totalBytes.toLocaleString('en-US')} bytes, strict UTF-8, no post-processing.`,
)
