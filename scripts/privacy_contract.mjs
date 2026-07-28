import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('dist')
const failures = []
const fail = (message) => failures.push(message)
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const hasMeta = (html, attribute, name, content) => {
  const tagPattern = /<meta\b[^>]*>/gi
  for (const match of html.matchAll(tagPattern)) {
    const tag = match[0]
    const namePattern = new RegExp(`\\b${escapeRegExp(attribute)}=["']${escapeRegExp(name)}["']`, 'i')
    const contentPattern = new RegExp(`\\bcontent=["']${escapeRegExp(content)}["']`, 'i')
    if (namePattern.test(tag) && contentPattern.test(tag)) return true
  }
  return false
}

if (!fs.existsSync(root)) fail('dist is missing; run npm run build first')

const requiredPages = [
  'privacy/index.html',
  'editorial-policy/index.html',
  'sources/index.html',
  'corrections/index.html',
  '404.html',
  'index.html',
]
for (const file of requiredPages) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing built policy surface: ${file}`)
}

const htmlFiles = []
if (fs.existsSync(root)) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full)
    }
  }
  walk(root)
}

const directAnalyticsTokens = [
  'https://www.googletagmanager.com/gtag/js',
  'https://mc.yandex.ru/metrika/tag.js',
  'https://mc.yandex.ru/watch/',
]
for (const file of htmlFiles) {
  const relative = path.relative(root, file)
  const text = fs.readFileSync(file, 'utf8')
  for (const token of directAnalyticsTokens) {
    if (text.includes(token)) fail(`${relative}: third-party analytics URL is embedded in HTML: ${token}`)
  }
}

if (fs.existsSync(path.join(root, '404.html'))) {
  const notFound = read('404.html')
  if (/<link\s+rel=["']canonical["']/i.test(notFound)) fail('404.html must not emit canonical')
  if (/<meta\s+property=["']og:url["']/i.test(notFound)) fail('404.html must not emit og:url')
  if (!hasMeta(notFound, 'name', 'robots', 'noindex, follow')) {
    fail('404.html must remain noindex, follow')
  }
}

if (fs.existsSync(path.join(root, 'index.html'))) {
  const home = read('index.html')
  if (home.includes('SearchAction') || home.includes('search_term_string')) {
    fail('obsolete SearchAction schema remains on the homepage')
  }
  for (const href of ['/privacy/', '/editorial-policy/', '/sources/', '/corrections/']) {
    if (!home.includes(`href="${href}"`)) fail(`homepage footer missing policy link: ${href}`)
  }
}

const gaId = (process.env.PUBLIC_GA_ID ?? '').trim()
const yandexId = (process.env.PUBLIC_YANDEX_METRIKA_ID ?? '').trim()
const analyticsEnabled = Boolean(gaId || yandexId)
for (const file of htmlFiles) {
  const relative = path.relative(root, file)
  const text = fs.readFileSync(file, 'utf8')
  const hasLocalLoader = text.includes('/analytics-consent.js')
  if (analyticsEnabled && !hasLocalLoader) fail(`${relative}: configured analytics lacks local consent loader`)
  if (!analyticsEnabled && hasLocalLoader) fail(`${relative}: consent loader rendered without configured analytics`)
}

const verification = [
  ['PUBLIC_GOOGLE_SITE_VERIFICATION', 'google-site-verification'],
  ['PUBLIC_YANDEX_SITE_VERIFICATION', 'yandex-verification'],
  ['PUBLIC_BING_SITE_VERIFICATION', 'msvalidate.01'],
]
if (fs.existsSync(path.join(root, 'index.html'))) {
  const home = read('index.html')
  for (const [envName, metaName] of verification) {
    const value = (process.env[envName] ?? '').trim()
    if (value && !hasMeta(home, 'name', metaName, value)) {
      fail(`configured verification token was not rendered: ${envName}`)
    }
  }
}

const releasePath = path.join(root, 'release.json')
if (!fs.existsSync(releasePath)) {
  fail('release.json is missing')
} else {
  try {
    const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'))
    const expectedSha = (process.env.PUBLIC_RELEASE_SHA ?? 'development').trim()
    if (release.repository !== 'FedorMilovanov/Milovi_School') fail('release.json repository drift')
    if (release.sha !== expectedSha) fail(`release.json SHA drift: ${release.sha} != ${expectedSha}`)
  } catch (error) {
    fail(`release.json is invalid: ${error.message}`)
  }
}

const loaderPath = path.join(root, 'analytics-consent.js')
if (!fs.existsSync(loaderPath)) fail('analytics-consent.js is missing from dist')
else {
  const loader = fs.readFileSync(loaderPath, 'utf8')
  for (const marker of ['milovi_school_analytics_consent_v1', 'window.MiloviSchoolConsent']) {
    if (!loader.includes(marker)) fail(`analytics loader missing marker: ${marker}`)
  }
}

if (failures.length) {
  console.error('Privacy/trust contract FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Privacy/trust contract OK: ${htmlFiles.length} HTML documents checked`)
