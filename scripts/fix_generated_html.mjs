import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DIST_DIR = path.resolve('dist')
const ASTRO_ISLAND_STYLE = '<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>'
const INVALID_NUL = '\u0000'

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
let styleChangedFiles = 0
let movedStyles = 0
let removedNulBytes = 0
let nulChangedFiles = 0
let skippedNonDocumentFiles = 0

for (const file of files) {
  const originalHtml = await readFile(file, 'utf8')

  // Search-engine ownership files may intentionally use an .html suffix while
  // containing only a verification token. They are not HTML documents and must
  // stay byte-for-byte unchanged; malformed real documents still fail loudly.
  const claimsDocumentStructure = /<!doctype\s+html|<html\b|<head\b|<body\b/i.test(originalHtml)
  if (!claimsDocumentStructure) {
    skippedNonDocumentFiles += 1
    continue
  }

  // U+0000 is forbidden in HTML. A rare upstream/static-rendering chunk defect
  // has inserted isolated NUL code points into otherwise correct text. Removing
  // them is lossless here: the surrounding Unicode characters remain intact,
  // while browsers, validators, crawlers and JSON consumers receive valid UTF-8.
  const nulCount = originalHtml.split(INVALID_NUL).length - 1
  let html = nulCount > 0 ? originalHtml.replaceAll(INVALID_NUL, '') : originalHtml
  if (nulCount > 0) {
    removedNulBytes += nulCount
    nulChangedFiles += 1
  }

  const headCloseIndex = html.indexOf('</head>')
  const bodyOpenIndex = html.indexOf('<body')

  if (headCloseIndex === -1 || bodyOpenIndex === -1 || bodyOpenIndex < headCloseIndex) {
    throw new Error(`Cannot safely post-process malformed HTML: ${path.relative(DIST_DIR, file)}`)
  }

  const head = html.slice(0, headCloseIndex)
  const bodyAndTail = html.slice(headCloseIndex)
  const occurrences = bodyAndTail.split(ASTRO_ISLAND_STYLE).length - 1

  if (occurrences > 0) {
    const cleanBodyAndTail = bodyAndTail.split(ASTRO_ISLAND_STYLE).join('')
    const cleanHead = head.includes(ASTRO_ISLAND_STYLE) ? head : `${head}${ASTRO_ISLAND_STYLE}`
    html = `${cleanHead}${cleanBodyAndTail}`
    movedStyles += occurrences
    styleChangedFiles += 1
  }

  if (html.slice(html.indexOf('<body')).includes(ASTRO_ISLAND_STYLE)) {
    throw new Error(`Astro island style still remains in body: ${path.relative(DIST_DIR, file)}`)
  }
  if (html.includes(INVALID_NUL)) {
    throw new Error(`Invalid NUL byte still remains in generated HTML: ${path.relative(DIST_DIR, file)}`)
  }

  if (html !== originalHtml) {
    await writeFile(file, html, 'utf8')
    changedFiles += 1
  }
}

if (movedStyles === 0) {
  throw new Error('Astro island style marker was not found in generated HTML; verify the Astro output contract')
}

console.log(
  `Moved ${movedStyles} Astro island style tag(s) into <head> across ${styleChangedFiles} HTML file(s); `
  + `removed ${removedNulBytes} invalid NUL byte(s) across ${nulChangedFiles} HTML file(s); `
  + `wrote ${changedFiles} changed HTML file(s); skipped ${skippedNonDocumentFiles} non-document verification file(s).`,
)
