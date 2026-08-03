import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const file = path.resolve('dist/materials/index.html')
const html = await readFile(file, 'utf8')
const headClose = html.indexOf('</head>')
const bodyOpen = html.indexOf('<body')
const islandStyle = '<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>'

assert.ok(headClose > 0, 'Generated gallery must contain </head>')
assert.ok(bodyOpen > headClose, 'Generated gallery must contain <body> after </head>')
assert.ok(html.slice(0, headClose).includes(islandStyle), 'Astro island display style must be placed in <head>')
assert.ok(!html.slice(bodyOpen).includes(islandStyle), 'Astro island display style must not remain in <body>')

const imageTags = html.match(/<img\b[^>]*>/gi) ?? []
assert.ok(imageTags.length >= 20, `Expected at least 20 gallery images, found ${imageTags.length}`)
for (const tag of imageTags) {
  assert.ok(!/\bsizes\s*=/.test(tag) || /\bsrcset\s*=/.test(tag), `sizes requires srcset: ${tag.slice(0, 180)}`)
}

assert.ok(!/<span\b[^>]*\baria-label\s*=/i.test(html), 'Generic span must not carry aria-label in generated gallery HTML')

const articleLinks = [...html.matchAll(/href=["'](\/articles\/[^"']+\/["'])/gi)]
  .map((match) => match[1].slice(0, -1))
assert.ok(new Set(articleLinks).size >= 100, `Expected at least 100 unique article links, found ${new Set(articleLinks).size}`)

console.log(`Generated gallery HTML audit passed: ${imageTags.length} images and ${new Set(articleLinks).size} unique article links.`)
