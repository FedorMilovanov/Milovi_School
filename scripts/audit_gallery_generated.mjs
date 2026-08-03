import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { TextDecoder } from 'node:util'

const FILE = 'dist/materials/index.html'
const bytes = await readFile(FILE)
const html = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
let count = 0

const check = (name, condition, detail = '') => {
  count += 1
  if (!condition) {
    const suffix = detail ? `: ${detail}` : ''
    throw new Error(`✗ [${String(count).padStart(2, '0')}] ${name}${suffix}`)
  }
  console.log(`✓ [${String(count).padStart(2, '0')}] ${name}`)
}

const nulPositions = []
for (let index = bytes.indexOf(0); index !== -1; index = bytes.indexOf(0, index + 1)) {
  nulPositions.push(index)
}
if (nulPositions.length > 0) {
  console.error(`Generated gallery contains ${nulPositions.length} NUL byte(s) at offsets: ${nulPositions.slice(0, 20).join(', ')}`)
  for (const position of nulPositions.slice(0, 10)) {
    const start = Math.max(0, position - 160)
    const end = Math.min(bytes.length, position + 160)
    const context = bytes.subarray(start, end).toString('utf8').replaceAll('\u0000', '<NUL>')
    console.error(`NUL context @ ${position}: ${JSON.stringify(context)}`)
  }
}

const lower = html.toLowerCase()
const headOpen = lower.indexOf('<head')
const headClose = lower.indexOf('</head>')
const bodyOpen = lower.indexOf('<body')
const bodyClose = lower.lastIndexOf('</body>')
const body = bodyOpen >= 0 ? html.slice(bodyOpen, bodyClose >= 0 ? bodyClose : undefined) : ''

check('generated materials HTML is non-empty', html.length > 10_000, `${html.length} bytes`)
check('generated materials HTML has no NUL bytes', nulPositions.length === 0, `${nulPositions.length} NUL bytes`)
check('document starts with an HTML5 doctype', /^<!doctype html>/i.test(html.trimStart()))
check('document language is Russian', /<html\b[^>]*\blang=["']ru["']/i.test(html))
check('head element exists', headOpen >= 0 && headClose > headOpen)
check('body element exists', bodyOpen > headClose && bodyClose > bodyOpen)
check('only one body element is emitted', (lower.match(/<body\b/g) ?? []).length === 1)
check('only one closing body tag is emitted', (lower.match(/<\/body>/g) ?? []).length === 1)
const islandStyle = '<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>'
check('Astro island display rule is emitted exactly once', html.split(islandStyle).length - 1 === 1)
check('Astro hydration style is left in framework-owned output', body.includes(islandStyle))
check('no aria-label is attached to a generic span', !/<span\b[^>]*\baria-label=/i.test(html))

const imageTags = html.match(/<img\b[^>]*>/gi) ?? []
check('gallery emits a substantial image set', imageTags.length >= 20, `${imageTags.length} images`)
check('every image has an alt attribute', imageTags.every((tag) => /\balt=["'][^"']*["']/i.test(tag)))
check('sizes is never emitted without srcset', imageTags.every((tag) => !/\bsizes=/i.test(tag) || /\bsrcset=/i.test(tag)))
check('lazy images declare async decoding', imageTags.filter((tag) => /\bloading=["']lazy["']/i.test(tag)).every((tag) => /\bdecoding=["']async["']/i.test(tag)))

const hrefs = [...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map((match) => match[1])
const articleHrefs = hrefs.filter((href) => /^\/articles\/[^/]+\/$/.test(href))
check('server HTML exposes at least 100 article links', articleHrefs.length >= 100, `${articleHrefs.length} links`)
check('all server-rendered article links are unique', new Set(articleHrefs).size === articleHrefs.length)
check('all gallery article links are root-relative and trailing-slashed', articleHrefs.every((href) => /^\/articles\/[a-z0-9-]+\/$/.test(href)))
check('no empty href attributes are emitted', !hrefs.some((href) => href.trim() === ''))
check('no insecure absolute resources are emitted', !/(?:src|href)=["']http:\/\//i.test(html))

check('materials page has exactly one title', (lower.match(/<title>/g) ?? []).length === 1)
check('materials page has exactly one canonical link', (lower.match(/rel=["']canonical["']/g) ?? []).length === 1)
check('canonical points to the live materials URL', /<link\b[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/french\.milovicake\.ru\/materials\/["']/i.test(html) || /<link\b[^>]*href=["']https:\/\/french\.milovicake\.ru\/materials\/["'][^>]*rel=["']canonical["']/i.test(html))
check('materials page is indexable', !/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))
check('gallery heading is server-rendered', html.includes('Галерея материалов'))
check('exactly one h1 is emitted', (lower.match(/<h1\b/g) ?? []).length === 1)
check('a semantic main element is emitted', /<main\b/i.test(html))
check('the materials main region keeps its stable id', /<main\b[^>]*\bid=["']materials["']/i.test(html))
check('closed preview is absent from initial server HTML', !/\bid=["']gallery-preview["']/i.test(html))

const galleryCardTags = html.match(/<a\b(?=[^>]*\bclass=["'][^"']*\bcat-img-card-lux\b[^"']*["'])[^>]*>/gi) ?? []
check('server HTML exposes all gallery card anchors', galleryCardTags.length >= 100, `${galleryCardTags.length} cards`)
check('no gallery card claims to be expanded initially', galleryCardTags.every((tag) => !/\baria-expanded=["']true["']/i.test(tag)))
check('closed gallery cards do not control an absent preview', galleryCardTags.every((tag) => !/\baria-controls=["']gallery-preview["']/i.test(tag)))

check('production stylesheet is linked', /<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["']/i.test(html))
check('hydration/runtime script is emitted', /<script\b/i.test(html))

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1])
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
check('document contains no duplicate ids', duplicateIds.length === 0, [...new Set(duplicateIds)].join(', '))

assert.ok(count >= 30)
console.log(`\nGenerated gallery HTML audit passed: ${count} checks.`)
