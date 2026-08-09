import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '')
const OUTPUT_DIR = path.resolve(process.env.VISUAL_QA_DIR ?? 'artifacts/visual-qa')
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

async function assertMediaDecode(page) {
  const images = page.locator('.canon-work-image')
  for (let index = 0; index < await images.count(); index += 1) {
    await images.nth(index).scrollIntoViewIfNeeded()
  }
  await page.waitForTimeout(500)
  const broken = await images.evaluateAll((nodes) => nodes
    .filter((image) => image.naturalWidth === 0 || image.naturalHeight === 0)
    .map((image) => image.getAttribute('src') || '(missing src)'))
  assert.deepEqual(broken, [])
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

const desktopResponse = await desktop.page.goto(`${BASE_URL}/canon/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(500)

await check('desktop: Canon route returns HTTP 200', async () => assert.equal(desktopResponse?.status(), 200))
await check('desktop: exactly 15 Canon works render', async () => assert.equal(await desktop.page.locator('.canon-work').count(), 15))
await check('desktop: exactly three acts render', async () => assert.equal(await desktop.page.locator('.canon-act').count(), 3))
await check('desktop: every act contains five works', async () => {
  const counts = await desktop.page.locator('.canon-act').evaluateAll((acts) => acts.map((act) => act.querySelectorAll('.canon-work').length))
  assert.deepEqual(counts, [5, 5, 5])
})
await check('desktop: Canon index exposes 15 unique destinations', async () => {
  const hrefs = await desktop.page.locator('.canon-index-link').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter(Boolean))
  assert.equal(hrefs.length, 15)
  assert.equal(new Set(hrefs).size, 15)
})
await check('desktop: act rail is visible', async () => assert.ok(await desktop.page.locator('.canon-act-rail').isVisible()))
await check('desktop: page has no horizontal overflow', async () => assertNoHorizontalOverflow(desktop.page))
await check('desktop: all real Canon media decode', async () => assertMediaDecode(desktop.page))
await check('desktop: work grid resolves explicit columns and rows', async () => {
  const placements = await desktop.page.locator('.canon-work').evaluateAll((works) => works.map((work) => {
    const style = globalThis.getComputedStyle(work)
    return {
      columnStart: style.gridColumnStart,
      columnEnd: style.gridColumnEnd,
      rowStart: style.gridRowStart,
    }
  }))
  assert.equal(placements.length, 15)
  for (const placement of placements) {
    assert.match(placement.columnStart, /^\d+$/, JSON.stringify(placement))
    assert.match(placement.columnEnd, /^(?:span\s+)?\d+$/, JSON.stringify(placement))
    assert.match(placement.rowStart, /^[12]$/, JSON.stringify(placement))
  }
})
await check('desktop: works do not geometrically overlap inside an act', async () => {
  const acts = desktop.page.locator('.canon-act')
  for (let actIndex = 0; actIndex < await acts.count(); actIndex += 1) {
    const boxes = await acts.nth(actIndex).locator('.canon-work').evaluateAll((works) => works.map((work) => work.getBoundingClientRect().toJSON()))
    for (let left = 0; left < boxes.length; left += 1) {
      for (let right = left + 1; right < boxes.length; right += 1) {
        assert.ok(overlapArea(boxes[left], boxes[right]) <= 4, JSON.stringify({ actIndex, left, right, boxes: [boxes[left], boxes[right]] }))
      }
    }
  }
})
await check('desktop: both media states are rendered intentionally', async () => {
  const images = await desktop.page.locator('.canon-work .canon-work-image').count()
  const catalogue = await desktop.page.locator('.canon-work .canon-catalogue-plate').count()
  assert.equal(images + catalogue, 15)
  assert.ok(images >= 13, `images=${images}`)
  assert.ok(catalogue <= 2, `catalogue=${catalogue}`)
})

await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'canon-desktop-hero.png'), fullPage: false })
await desktop.page.locator('#canon-act-forme').scrollIntoViewIfNeeded()
await desktop.page.waitForTimeout(250)
await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'canon-desktop-act.png'), fullPage: false })

const mobile = await observedPage(browser, {
  viewport: { width: 390, height: 844 },
  colorScheme: 'dark',
  reducedMotion: 'no-preference',
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
})
const mobileResponse = await mobile.page.goto(`${BASE_URL}/canon/`, { waitUntil: 'networkidle' })
await mobile.page.waitForTimeout(450)

await check('mobile: Canon route returns HTTP 200', async () => assert.equal(mobileResponse?.status(), 200))
await check('mobile: page has no horizontal overflow', async () => assertNoHorizontalOverflow(mobile.page))
await check('mobile: all 15 works remain present', async () => assert.equal(await mobile.page.locator('.canon-work').count(), 15))
await check('mobile: desktop act rail is hidden', async () => assert.equal(await mobile.page.locator('.canon-act-rail:visible').count(), 0))
await check('mobile: work layout collapses to one column', async () => {
  const boxes = await mobile.page.locator('#canon-act-forme .canon-work').evaluateAll((works) => works.slice(0, 3).map((work) => work.getBoundingClientRect().toJSON()))
  assert.equal(boxes.length, 3)
  const widths = boxes.map((box) => box.width)
  assert.ok(Math.max(...widths) - Math.min(...widths) <= 2, JSON.stringify(boxes))
  assert.ok(boxes[1].top >= boxes[0].bottom - 2, JSON.stringify(boxes))
  assert.ok(boxes[2].top >= boxes[1].bottom - 2, JSON.stringify(boxes))
})
await check('mobile: Canon index collapses to one column', async () => {
  const boxes = await mobile.page.locator('.canon-index-link').evaluateAll((links) => links.slice(0, 3).map((link) => link.getBoundingClientRect().toJSON()))
  assert.equal(boxes.length, 3)
  assert.ok(boxes[1].top >= boxes[0].bottom - 2, JSON.stringify(boxes))
  assert.ok(boxes[2].top >= boxes[1].bottom - 2, JSON.stringify(boxes))
})
await check('mobile: all real Canon media decode', async () => assertMediaDecode(mobile.page))

await mobile.page.locator('#canon-act-forme').scrollIntoViewIfNeeded()
await mobile.page.waitForTimeout(250)
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'canon-mobile.png'), fullPage: false })

const reduced = await observedPage(browser, {
  viewport: { width: 1024, height: 900 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
})
await reduced.page.goto(`${BASE_URL}/canon/`, { waitUntil: 'networkidle' })
await reduced.page.waitForTimeout(300)
await check('reduced motion: all Canon works remain fully visible', async () => {
  const opacity = await reduced.page.locator('.canon-work').evaluateAll((works) => works.map((work) => Number.parseFloat(globalThis.getComputedStyle(work).opacity)))
  assert.equal(opacity.length, 15)
  assert.ok(opacity.every((value) => value >= 0.99), JSON.stringify(opacity))
})
await check('reduced motion: page has no horizontal overflow', async () => assertNoHorizontalOverflow(reduced.page))

await assertTelemetry('desktop Canon', desktop.telemetry)
await assertTelemetry('mobile Canon', mobile.telemetry)
await assertTelemetry('reduced-motion Canon', reduced.telemetry)

const report = {
  baseUrl: BASE_URL,
  checks: number,
  passed: passed.length,
  failed: failures.length,
  screenshots: ['canon-desktop-hero.png', 'canon-desktop-act.png', 'canon-mobile.png'],
  failures,
}
await fs.writeFile(path.join(OUTPUT_DIR, 'canon-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

await Promise.all([desktop.context.close(), mobile.context.close(), reduced.context.close()])
await browser.close()

if (failures.length > 0) {
  console.error(`\nCanon visual QA failed: ${passed.length}/${number} checks passed.`)
  process.exitCode = 1
} else {
  console.log(`\nCanon visual QA completed: ${passed.length}/${number} checks passed.`)
}
