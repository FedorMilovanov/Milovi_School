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

function previousSuccessfulPushSha(runs, currentRunNumber) {
  return runs
    .filter((run) => run.event === 'push' && run.head_branch === 'main' &&
      run.conclusion === 'success' && Number.isInteger(run.run_number) &&
      run.run_number < currentRunNumber && isFullSha(run.head_sha) && !isZeroSha(run.head_sha))
    .sort((a, b) => b.run_number - a.run_number)[0]?.head_sha ?? null
}

async function resolveBeforeSha() {
  // Explicit baseline remains available for a deliberate local recovery.
  if (BEFORE_SHA) {
    if (!isFullSha(BEFORE_SHA) || isZeroSha(BEFORE_SHA)) throw new Error('Invalid explicit BEFORE_SHA')
    return BEFORE_SHA
  }

  const repository = process.env.GITHUB_REPOSITORY ?? ''
  const runNumber = Number(process.env.GITHUB_RUN_NUMBER)
  const token = process.env.GITHUB_TOKEN ?? ''
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
      !Number.isSafeInteger(runNumber) || runNumber < 1 || !token) {
    throw new Error('GitHub release baseline context unavailable')
  }

  // A push's immediate parent may never have reached IndexNow. Recover the
  // latest earlier successful push deployment; exclude manual runs (no POST),
  // cancelled/failed runs, the current run and newer runs on a rerun.
  const endpoint = `https://api.github.com/repos/${repository}/actions/workflows/deploy.yml/runs`
  for (let page = 1; page <= 10; page += 1) {
    const response = await globalThis.fetch(
      `${endpoint}?branch=main&event=push&status=success&per_page=100&page=${page}`,
      {
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'x-github-api-version': '2022-11-28',
          'user-agent': 'MiloviSchool-IndexNow/1.0',
        },
        signal: globalThis.AbortSignal.timeout(15000),
      },
    )
    if (!response.ok) throw new Error(`Release baseline lookup returned HTTP ${response.status}`)
    const data = await response.json()
    if (!Array.isArray(data.workflow_runs)) throw new Error('Invalid release baseline response')
    const sha = previousSuccessfulPushSha(data.workflow_runs, runNumber)
    if (sha) return sha
    if (data.workflow_runs.length < 100) break
  }
  throw new Error('No trustworthy earlier successful push deployment; notification not attempted')
}

function changedFiles(beforeSha) {
  if (!isFullSha(beforeSha) || isZeroSha(beforeSha) || !isFullSha(CURRENT_SHA) || isZeroSha(CURRENT_SHA)) {
    throw new Error('Invalid release diff endpoints')
  }
  // The standard checkout is shallow. Fetch only the missing prior commit
  // from the public origin when a failed/cancelled release created a gap.
  try {
    execFileSync('git', ['cat-file', '-e', `${beforeSha}^{commit}`], { stdio: 'ignore' })
  } catch {
    execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', beforeSha], { stdio: 'ignore' })
  }
  const output = execFileSync('git', ['diff', '--name-only', beforeSha, CURRENT_SHA], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return output.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
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

async function selectUrls(files, allUrls) {
  if (!files || files.length === 0) return []

  const allSitePatterns = [
    /^src\/layouts\//,
    /^src\/styles\/global\.css$/,
    // Shared JSON-LD serializer: every page's structured data goes through it.
    /^src\/utils\/jsonld\.ts$/,
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
    /^src\/data\/(articles|deepContents|articleExpansions|articleOverrides|canonArticles|canonArticleContents|canonArticleAppendices|library)\./,
    /^src\/data\/articleExpansionParts\/[^/]+\.ts$/,
  ]
  if (files.some((file) => articleWidePatterns.some((pattern) => pattern.test(file)))) {
    for (const url of articles) selected.add(url)
    // The catalog and homepage also consume libraryClientMeta (including
    // titles, excerpts and content-derived reading time). Preserve the
    // existing conservative article-wide policy for these shared inputs.
    for (const url of allUrls) {
      if (['/', '/materials/'].includes(new globalThis.URL(url).pathname)) selected.add(url)
    }
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

  const historyPatterns = [/^src\/data\/history/, /^src\/components\/(?:History|history)/]
  if (files.some((file) => historyPatterns.some((pattern) => pattern.test(file)))) {
    const historyPage = allUrls.find((url) => new globalThis.URL(url).pathname === '/history/')
    if (historyPage) selected.add(historyPage)
    // History essays are article routes too: notify only the ids that the
    // changed files actually declare, never the whole corpus.
    const declared = await declaredArticleIds(files.filter((file) => historyPatterns.some((pattern) => pattern.test(file))))
    for (const id of declared) {
      const url = allUrls.find((candidate) => new globalThis.URL(candidate).pathname === `/articles/${id}/`)
      if (url) selected.add(url)
    }
  }

  const staticRouteMap = new Map([
    ['src/pages/index.astro', '/'],
    ['src/pages/history.astro', '/history/'],
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


/**
 * Article ids declared by the given source files. Two shapes exist in the
 * corpus and both have to be recognised, otherwise a data edit silently
 * notifies only the hub page:
 *
 *   1. article records:            `id: 'some-slug'`
 *   2. keyed registries:           `"some-slug": { ... }`
 *      (`historyEvidence.ts` is keyed this way, and `library.ts` folds every
 *      evidence record into that article's generated body — so an evidence edit
 *      changes 19 article routes, not just `/history/`.)
 *
 * The quoted-key pattern requires an object value (`{`), which excludes the
 * per-record array keys (`"verified": [`, `"sources": [`). Candidates are then
 * resolved against the live sitemap by the caller, so a key that is not an
 * article simply drops out instead of producing a 404 notification.
 */
async function declaredArticleIds(files) {
  const ids = new Set()
  for (const file of files) {
    if (!/\.(?:ts|tsx|astro)$/.test(file)) continue
    let source
    try {
      source = await readFile(path.resolve(file), 'utf8')
    } catch {
      continue
    }
    for (const match of source.matchAll(/\bid:\s*'([a-z0-9][a-z0-9-]{2,})'/g)) ids.add(match[1])
    for (const match of source.matchAll(/^\s*["']([a-z0-9][a-z0-9-]{2,})["']\s*:\s*\{/gm)) ids.add(match[1])
  }
  return ids
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
  if (!isFullSha(CURRENT_SHA) || isZeroSha(CURRENT_SHA)) {
    throw new Error('CURRENT_SHA is unavailable or invalid')
  }

  const beforeSha = await resolveBeforeSha()
  console.log(`[indexnow] Baseline ${beforeSha} -> ${CURRENT_SHA}`)
  const files = changedFiles(beforeSha)

  const allUrls = await liveCanonicalUrls()
  const urlList = await selectUrls(files, allUrls)
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

/**
 * Offline selection test: `node scripts/notify_indexnow.mjs --self-test`.
 *
 * The deployment path cannot be exercised in CI (it needs the live sitemap and a
 * deploy), so the selection logic — the part that decides *which* URLs are
 * announced — is pinned here with fixtures instead. Runs without network and
 * without git.
 */
async function selfTest() {
  const urls = [
    'https://fixture.invalid/',
    'https://fixture.invalid/history/',
    'https://fixture.invalid/canon/',
    'https://fixture.invalid/materials/',
    'https://fixture.invalid/articles/stohrer-1730/',
    'https://fixture.invalid/articles/laduree-1862/',
    'https://fixture.invalid/images/logo.png',
  ]
  const pathnames = async (files) => new Set((await selectUrls(files, urls)).map((url) => new globalThis.URL(url).pathname))
  const failures = []
  const expect = async (name, files, predicate) => {
    const selected = await pathnames(files)
    if (!predicate(selected)) failures.push(`${name}: got ${JSON.stringify([...selected].sort())}`)
  }

  // A keyed evidence-registry edit must reach the affected article routes, not
  // just the hub. This is the regression the review found.
  await expect('historyEvidence edit → history + evidence articles', ['src/data/historyEvidence.ts'],
    (set) => set.has('/history/') && set.has('/articles/stohrer-1730/') && set.has('/articles/laduree-1862/'))
  await expect('historyEvidence edit does not over-submit', ['src/data/historyEvidence.ts'],
    (set) => !set.has('/canon/') && !set.has('/articles/unknown-slug/'))

  // Unrelated media must not notify anything.
  await expect('logo edit → no URLs', ['public/images/logo.png'], (set) => set.size === 0)

  // A static page maps to exactly itself.
  await expect('materials page → /materials/', ['src/pages/materials.astro'],
    (set) => set.size === 1 && set.has('/materials/'))

  // An article-catalogue edit still notifies the whole article corpus.
  await expect('catalogue edit → every article', ['src/data/articles.ts'],
    (set) => set.has('/articles/stohrer-1730/') && set.has('/articles/laduree-1862/'))

  // Article expansions are split into physical files; changing only a part
  // must not silently skip notification. Shared metadata affects the hubs.
  await expect('expansion part edit → articles and library hubs', ['src/data/articleExpansionParts/part11.ts'],
    (set) => set.size === 4 && set.has('/') && set.has('/materials/') &&
      set.has('/articles/stohrer-1730/') && set.has('/articles/laduree-1862/'))
  await expect('Canon appendices edit → articles and library hubs', ['src/data/canonArticleAppendices.ts'],
    (set) => set.size === 4 && set.has('/') && set.has('/materials/'))
  await expect('catalogue edit → library hubs', ['src/data/articles.ts'],
    (set) => set.has('/') && set.has('/materials/') && !set.has('/history/') && !set.has('/canon/'))
  await expect('unrelated data path does not accidentally match expansion parts', ['src/data/articleExpansionPartsArchive/part11.ts'],
    (set) => set.size === 0)

  // The quoted-key pattern must not pick up array keys such as "sources": [.
  await expect('registry never yields non-slug keys', ['src/data/historyEvidence.ts'],
    (set) => ![...set].some((p) => p.includes('/articles/verified/') || p.includes('/articles/sources/')))

  const shaA = 'a'.repeat(40)
  const shaB = 'b'.repeat(40)
  const shaC = 'c'.repeat(40)
  const run = (run_number, head_sha, overrides = {}) => ({
    run_number, head_sha, event: 'push', head_branch: 'main', conclusion: 'success', ...overrides,
  })
  const baselineCases = [
    ['normal push', [run(10, shaA)], 11, shaA],
    ['cancelled intermediate', [run(11, shaB, { conclusion: 'cancelled' }), run(10, shaA)], 12, shaA],
    ['failed notification', [run(11, shaB, { conclusion: 'failure' }), run(10, shaA)], 12, shaA],
    ['manual release', [run(11, shaB, { event: 'workflow_dispatch' }), run(10, shaA)], 12, shaA],
    ['rerun excludes current and future', [run(13, shaC), run(12, shaB), run(10, shaA)], 12, shaA],
    ['unordered results', [run(10, shaA), run(11, shaB)], 12, shaB],
    ['other branch or invalid SHA', [run(11, shaB, { head_branch: 'feature' }), run(10, '0'.repeat(40)), run(9, shaA)], 12, shaA],
    ['missing baseline fails closed', [run(12, shaB)], 12, null],
  ]
  for (const [name, runs, number, expected] of baselineCases) {
    if (previousSuccessfulPushSha(runs, number) !== expected) failures.push(`baseline: ${name}`)
  }

  if (failures.length > 0) {
    console.error(`[indexnow] self-test FAILED (${failures.length}):`)
    for (const failure of failures) console.error(` - ${failure}`)
    process.exitCode = 1
    return
  }
  console.log(`[indexnow] self-test passed: 10 selection cases + 8 release baseline cases`)
}

if (process.argv.includes('--self-test')) {
  selfTest().catch((error) => {
    console.error(`[indexnow] self-test crashed: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
} else {
  main().catch((error) => {
    console.error(`[indexnow] ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
