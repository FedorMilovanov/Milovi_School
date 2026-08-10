import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '')
const OUTPUT_DIR = path.resolve(process.env.VISUAL_QA_DIR ?? 'artifacts/visual-qa')
const EXPECTED_MILESTONES = 16
const EXPECTED_WORKS = 15
const passed = []
const failures = []
let number = 0

await fs.mkdir(OUTPUT_DIR, { recursive: true })

async function check(name, task) {
  number += 1
  const id = String(number).padStart(2, '0')
  try {
    await task()
    passed.push({ id, name })
    console.log(`✓ [${id}] ${name}`)
  } catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error)
    failures.push({ id, name, message })
    console.error(`✗ [${id}] ${name}\n${message}`)
  }
}

async function observedPage(browser, options) {
  const context = await browser.newContext(options)
  const page = await context.newPage()
  const telemetry = { console: [], page: [], requests: [], responses: [] }
  page.on('console', (message) => {
    if (message.type() === 'error') telemetry.console.push(message.text())
  })
  page.on('pageerror', (error) => telemetry.page.push(error.message))
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(BASE_URL)) {
      telemetry.requests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`)
    }
  })
  page.on('response', (response) => {
    if (response.url().startsWith(BASE_URL) && response.status() >= 400) {
      telemetry.responses.push(`${response.status()} ${response.url()}`)
    }
  })
  return { context, page, telemetry }
}

function overlapArea(a, b) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return width * height
}

async function assertNoHorizontalOverflow(page) {
  const state = await page.evaluate(() => ({
    scrollWidth: globalThis.document.documentElement.scrollWidth,
    clientWidth: globalThis.document.documentElement.clientWidth,
  }))
  assert.ok(state.scrollWidth <= state.clientWidth + 2, JSON.stringify(state))
}

async function scrollEvidenceToTop(page, selector, offset = 104) {
  const locator = page.locator(selector)
  await locator.scrollIntoViewIfNeeded()
  await locator.evaluate((node, targetOffset) => {
    node.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' })
    const scroller = globalThis.document.scrollingElement ?? globalThis.document.documentElement
    scroller.scrollTop = Math.max(0, scroller.scrollTop - targetOffset)
  }, offset)
  await page.waitForTimeout(250)
}

async function assertEvidenceStartsInViewport(page, selector, minTop, maxTop) {
  const state = await page.locator(selector).evaluate((node) => {
    const rect = node.getBoundingClientRect()
    return {
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: globalThis.innerHeight,
    }
  })
  assert.ok(state.top >= minTop && state.top < maxTop, JSON.stringify(state))
  assert.ok(state.bottom > 0 && state.top < state.viewportHeight, JSON.stringify(state))
}

async function assertTelemetry(name, telemetry) {
  await check(`${name}: no uncaught JavaScript errors`, async () => assert.deepEqual(telemetry.page, []))
  await check(`${name}: no browser console errors`, async () => assert.deepEqual(telemetry.console, []))
  await check(`${name}: no same-origin request failures`, async () => assert.deepEqual(telemetry.requests, []))
  await check(`${name}: no same-origin HTTP 4xx or 5xx`, async () => assert.deepEqual(telemetry.responses, []))
}

const browser = await chromium.launch({ headless: true })
const desktop = await observedPage(browser, {
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'dark',
  reducedMotion: 'no-preference',
})

const response = await desktop.page.goto(`${BASE_URL}/canon/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(350)
await check('desktop research: Canon route returns HTTP 200', async () => assert.equal(response?.status(), 200))
await check('desktop research: exactly one documentary chronology renders', async () => assert.equal(await desktop.page.locator('.canon-research').count(), 1))
await check('desktop research: exactly 16 bounded milestones render', async () => assert.equal(await desktop.page.locator('.canon-research-milestone').count(), EXPECTED_MILESTONES))
await check('desktop research: Tatin LÉGENDE / DOCUMENT renders once', async () => assert.equal(await desktop.page.locator('.canon-legend-document').count(), 1))
await check('desktop research: no historical image or facsimile is published', async () => assert.equal(await desktop.page.locator('.canon-research img, .canon-research picture, .canon-research source').count(), 0))
await check('desktop research: links cover all 15 Canon objects', async () => {
  const hrefs = await desktop.page.locator('.canon-research a[href^="#canon-"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter(Boolean))
  assert.equal(new Set(hrefs).size, EXPECTED_WORKS, JSON.stringify(hrefs))
})
await check('desktop research: every work link resolves', async () => {
  const broken = await desktop.page.locator('.canon-research a[href^="#canon-"]').evaluateAll((links) => links
    .map((link) => link.getAttribute('href'))
    .filter((href) => !href || !globalThis.document.querySelector(href)))
  assert.deepEqual(broken, [])
})
await check('desktop research: legend and document panes remain side-by-side', async () => {
  const boxes = await desktop.page.locator('.canon-legend-pane, .canon-document-pane').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()))
  assert.equal(boxes.length, 2)
  assert.ok(Math.abs(boxes[0].top - boxes[1].top) <= 2, JSON.stringify(boxes))
  assert.ok(boxes[1].left >= boxes[0].right - 2, JSON.stringify(boxes))
})
await check('desktop research: page has no horizontal overflow', async () => assertNoHorizontalOverflow(desktop.page))

await scrollEvidenceToTop(desktop.page, '.canon-research-head')
await check('desktop research: entry heading is visible in entry evidence', async () => {
  await assertEvidenceStartsInViewport(desktop.page, '.canon-research-head', 70, 190)
})
await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'canon-desktop-research-entry.png'), fullPage: false })

await scrollEvidenceToTop(desktop.page, '.canon-legend-document')
await check('desktop research: Tatin split is visible in dedicated evidence', async () => {
  await assertEvidenceStartsInViewport(desktop.page, '.canon-legend-document', 70, 190)
})
await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'canon-desktop-research-tatin.png'), fullPage: false })

const mobile = await observedPage(browser, {
  viewport: { width: 390, height: 844 },
  colorScheme: 'dark',
  reducedMotion: 'no-preference',
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
})
await mobile.page.goto(`${BASE_URL}/canon/`, { waitUntil: 'networkidle' })
await mobile.page.waitForTimeout(300)
await check('mobile research: exactly one chronology and 16 milestones remain', async () => {
  assert.equal(await mobile.page.locator('.canon-research').count(), 1)
  assert.equal(await mobile.page.locator('.canon-research-milestone').count(), EXPECTED_MILESTONES)
})
await check('mobile research: legend and document panes stack without overlap', async () => {
  const boxes = await mobile.page.locator('.canon-legend-pane, .canon-document-pane').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()))
  assert.equal(boxes.length, 2)
  assert.ok(boxes[1].top >= boxes[0].bottom - 2, JSON.stringify(boxes))
})
await check('mobile research: page has no horizontal overflow', async () => assertNoHorizontalOverflow(mobile.page))

await scrollEvidenceToTop(mobile.page, '.canon-research-head', 92)
await check('mobile research: entry heading is visible in entry evidence', async () => {
  await assertEvidenceStartsInViewport(mobile.page, '.canon-research-head', 60, 220)
})
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'canon-mobile-research-entry.png'), fullPage: false })

await scrollEvidenceToTop(mobile.page, '.canon-legend-document', 92)
await check('mobile research: Tatin split starts inside dedicated evidence viewport', async () => {
  await assertEvidenceStartsInViewport(mobile.page, '.canon-legend-document', 60, 220)
})
await check('mobile research: scroll-to-top control does not cover document copy', async () => {
  const button = mobile.page.locator('button[aria-label="Наверх"]')
  await button.waitFor({ state: 'visible' })
  const buttonBox = await button.evaluate((node) => node.getBoundingClientRect().toJSON())
  const copyBoxes = await mobile.page.locator('.canon-document-pane p').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()))
  assert.ok(copyBoxes.length > 0)
  for (const copyBox of copyBoxes) {
    assert.ok(overlapArea(buttonBox, copyBox) <= 1, JSON.stringify({ buttonBox, copyBox }))
  }
})
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'canon-mobile-research-tatin.png'), fullPage: false })

await assertTelemetry('desktop research', desktop.telemetry)
await assertTelemetry('mobile research', mobile.telemetry)

const report = {
  baseUrl: BASE_URL,
  checks: number,
  passed: passed.length,
  failed: failures.length,
  screenshots: [
    'canon-desktop-research-entry.png',
    'canon-desktop-research-tatin.png',
    'canon-mobile-research-entry.png',
    'canon-mobile-research-tatin.png',
  ],
  failures,
}
await fs.writeFile(path.join(OUTPUT_DIR, 'canon-research-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

await Promise.all([desktop.context.close(), mobile.context.close()])
await browser.close()

if (failures.length > 0) {
  console.error(`\nCanon Research visual QA failed: ${passed.length}/${number} checks passed.`)
  process.exitCode = 1
} else {
  console.log(`\nCanon Research visual QA completed: ${passed.length}/${number} checks passed.`)
}
