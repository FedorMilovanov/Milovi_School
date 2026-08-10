#!/usr/bin/env node

/**
 * Notify IndexNow only after a release is live and only for URLs that may have
 * changed in the source diff. This is deliberately deployment-time tooling:
 * indexing notification must never alter the generated site or block a build.
 */

import { execFileSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const LIVE_BASE = (process.env.LIVE_BASE ?? 'https://french.milovicake.ru').replace(/\/$/, '')
const BEFORE_SHA = (process.env.BEFORE_SHA ?? '').trim()
const CURRENT_SHA = (process.env.CURRENT_SHA ?? '').trim()
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
const HOST = new globalThis.URL(LIVE_BASE).host

const isZeroSha = (value) => /^0{40}$/.test(value)
const isFullSha = (value) => /^[0-9a-f]{40}$/i.test(value)

async function discoverKey() {
  const entries = await readdir(path.resolve('public'), { withFileTypes: true })
  const candidates = entries
    .filter((entry) => entry.isFile() && /^[A-Za-z0-9-]{8,128}\.txt$/.test(entry.name))
    .map((entry) => entry.name)

  const valid = []
  for (const name of candidates) {
    const stem = name.slice(0, -4)
    const value = (await readFile(path.resolve('public', name), 'utf8')).trim()
    if (value === stem) valid.push({ key: value, filename: name })
  }

  if (valid.length !== 1) {
    throw new Error(`Expected exactly one root IndexNow key file, found ${valid.length}`)
  }
  return valid[0]
}

function changedFiles() {
  if (!isFullSha(BEFORE_SHA) || isZeroSha(BEFORE_SHA) || !isFullSha(CURRENT_SHA)) return null
  try {
    const output = execFileSync('git', ['diff', '--name-only', BEFORE_SHA, CURRENT_SHA], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return output.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
  } catch {
    console.warn(`[indexnow] Could not diff ${BEFORE_SHA}..${CURRENT_SHA}; skip notification rather than over-submit.`)
    return null
  }
}

async function liveCanonicalUrls() {
  const response = await globalThis.fetch(`${LIVE_BASE}/sitemap-0.xml`, {
    headers: { 'user-agent': 'MiloviSchool-IndexNow/1.0' },
  })
  if (!response.ok) throw new Error(`Live sitemap returned HTTP ${response.status}`)
  const xml = await response.text()
  const urls = [...xml.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .filter((url) => {
      try {
        const parsed = new globalThis.URL(url)
        return parsed.host === HOST && !parsed.pathname.startsWith('/images/')
      } catch {
        return false
      }
    })
  return [...new Set(urls)]
}

function selectUrls(files, allUrls) {
  if (!files || files.length === 0) return []

  const allSitePatterns = [
    /^src\/layouts\//,
    /^src\/styles\/global\.css$/,
    /^src\/components\/(Header|Footer|PolicyFooter|AnalyticsConsent|ScrollToTop|CommandPalette)/,
    /^astro\.config\.mjs$/,
    /^package(?:-lock)?\.json$/,
    /^public\/robots\.txt$/,
  ]
  if (files.some((file) => allSitePatterns.some((pattern) => pattern.test(file)))) {
    return allUrls
  }

  const selected = new Set()
  const articles = allUrls.filter((url) => new globalThis.URL(url).pathname.startsWith('/articles/'))

  const articleWidePatterns = [
    /^src\/pages\/articles\//,
    /^src\/components\/Article/,
    /^src\/data\/(articles|deepContents|articleExpansions|articleOverrides|canonArticles|canonArticleContents|library)\./,
  ]
  if (files.some((file) => articleWidePatterns.some((pattern) => pattern.test(file)))) {
    for (const url of articles) selected.add(url)
  }

  const canonPatterns = [
    /^src\/pages\/canon\.astro$/,
    /^src\/components\/Canon/,
    /^src\/data\/canon(?:-|\.)/,
    /^src\/styles\/canon/,
    /^public\/images\/canon-sucre\//,
  ]
  if (files.some((file) => canonPatterns.some((pattern) => pattern.test(file)))) {
    const canon = allUrls.find((url) => new globalThis.URL(url).pathname === '/canon/')
    if (canon) selected.add(canon)
    // Canon membership/navigation can affect all fifteen mapped article pages.
    for (const url of articles) selected.add(url)
  }

  const staticRouteMap = new Map([
    ['src/pages/index.astro', '/'],
    ['src/pages/about.astro', '/about/'],
    ['src/pages/materials.astro', '/materials/'],
    ['src/pages/methodology.astro', '/methodology/'],
    ['src/pages/privacy.astro', '/privacy/'],
    ['src/pages/sources.astro', '/sources/'],
    ['src/pages/corrections.astro', '/corrections/'],
    ['src/pages/editorial-policy.astro', '/editorial-policy/'],
  ])
  for (const file of files) {
    const pathname = staticRouteMap.get(file)
    if (!pathname) continue
    const url = allUrls.find((candidate) => new globalThis.URL(candidate).pathname === pathname)
    if (url) selected.add(url)
  }

  return [...selected]
}

async function postIndexNow(payload) {
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await globalThis.fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'user-agent': 'MiloviSchool-IndexNow/1.0',
        },
        body: JSON.stringify(payload),
      })
      const text = await response.text()
      if (response.status === 200 || response.status === 202) {
        console.log(`[indexnow] ${payload.urlList.length} URL(s) accepted with HTTP ${response.status}`)
        return
      }
      lastError = new Error(`HTTP ${response.status}${text ? `: ${text.slice(0, 300)}` : ''}`)
      if (response.status !== 429 && response.status < 500) break
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => globalThis.setTimeout(resolve, attempt * 3000))
  }
  throw lastError ?? new Error('IndexNow request failed')
}

async function main() {
  if (!isFullSha(CURRENT_SHA)) {
    console.log('[indexnow] CURRENT_SHA is unavailable; skipping deployment notification.')
    return
  }

  const files = changedFiles()
  if (files === null) {
    console.log('[indexnow] No trustworthy before/after diff; skipping rather than submitting unchanged URLs.')
    return
  }

  const allUrls = await liveCanonicalUrls()
  const urlList = selectUrls(files, allUrls)
  if (urlList.length === 0) {
    console.log(`[indexnow] ${files.length} changed source file(s), but no public content URL requires notification.`)
    return
  }
  if (urlList.length > 10_000) throw new Error(`IndexNow URL batch exceeds protocol limit: ${urlList.length}`)

  const { key, filename } = await discoverKey()
  const keyLocation = `${LIVE_BASE}/${filename}`
  const keyResponse = await globalThis.fetch(keyLocation, { headers: { 'user-agent': 'MiloviSchool-IndexNow/1.0' } })
  const liveKey = keyResponse.ok ? (await keyResponse.text()).trim() : ''
  if (liveKey !== key) throw new Error(`Live IndexNow key verification failed at ${keyLocation}`)

  await postIndexNow({
    host: HOST,
    key,
    keyLocation,
    urlList,
  })
}

main().catch((error) => {
  console.error(`[indexnow] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
