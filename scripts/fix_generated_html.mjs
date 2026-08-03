import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DIST_DIR = path.resolve('dist')
const ASTRO_ISLAND_STYLE = '<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>'

const collectHtmlFiles = async (directory) => {
  const entries = await readdir(directory)
  const files = []

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry)
    const info = await stat(absolutePath)
    if (info.isDirectory()) {
      files.push(...await collectHtmlFiles(absolutePath))
    } else if (entry.endsWith('.html')) {
      files.push(absolutePath)
    }
  }

  return files
}

const files = await collectHtmlFiles(DIST_DIR)
let changedFiles = 0
let movedStyles = 0
let skippedNonDocumentFiles = 0

for (const file of files) {
  const html = await readFile(file, 'utf8')
  const headCloseIndex = html.indexOf('</head>')
  const bodyOpenIndex = html.indexOf('<body')

  if (headCloseIndex === -1 || bodyOpenIndex === -1 || bodyOpenIndex < headCloseIndex) {
    // Search-engine ownership files may intentionally use an .html suffix while
    // containing only a verification token. They are not HTML documents and
    // must be copied byte-for-byte; malformed real documents still fail loudly.
    const claimsDocumentStructure = /<!doctype\s+html|<html\b|<head\b|<body\b/i.test(html)
    if (!claimsDocumentStructure) {
      skippedNonDocumentFiles += 1
      continue
    }
    throw new Error(`Cannot safely post-process malformed HTML: ${path.relative(DIST_DIR, file)}`)
  }

  const head = html.slice(0, headCloseIndex)
  const bodyAndTail = html.slice(headCloseIndex)
  const occurrences = bodyAndTail.split(ASTRO_ISLAND_STYLE).length - 1

  if (occurrences === 0) continue

  const cleanBodyAndTail = bodyAndTail.split(ASTRO_ISLAND_STYLE).join('')
  const cleanHead = head.includes(ASTRO_ISLAND_STYLE) ? head : `${head}${ASTRO_ISLAND_STYLE}`
  const nextHtml = `${cleanHead}${cleanBodyAndTail}`

  if (nextHtml.slice(nextHtml.indexOf('<body')).includes(ASTRO_ISLAND_STYLE)) {
    throw new Error(`Astro island style still remains in body: ${path.relative(DIST_DIR, file)}`)
  }

  await writeFile(file, nextHtml, 'utf8')
  changedFiles += 1
  movedStyles += occurrences
}

if (changedFiles === 0) {
  throw new Error('Astro island style marker was not found in generated HTML; verify the Astro output contract')
}

console.log(`Moved ${movedStyles} Astro island style tag(s) into <head> across ${changedFiles} HTML file(s); skipped ${skippedNonDocumentFiles} non-document verification file(s).`)
