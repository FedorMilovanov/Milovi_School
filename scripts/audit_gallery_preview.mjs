import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '')
const MATERIALS_URL = `${BASE_URL}/materials/`
const failures = []
let checkNumber = 0

const logCheck = async (name, fn) => {
  checkNumber += 1
  const label = String(checkNumber).padStart(2, '0')
  try {
    await fn()
    console.log(`✓ [${label}] ${name}`)
  } catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error)
    failures.push({ label, name, message })
    console.error(`✗ [${label}] ${name}\n${message}`)
  }
}

const browser = await chromium.launch({ headless: true })
const desktopContext = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'dark',
})
const page = await desktopContext.newPage()

const consoleErrors = []
const pageErrors = []
const failedSameOriginRequests = []
const badSameOriginResponses = []

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => pageErrors.push(error.message))
page.on('requestfailed', (request) => {
  if (request.url().startsWith(BASE_URL)) {
    failedSameOriginRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`)
  }
})
page.on('response', (response) => {
  if (response.url().startsWith(BASE_URL) && response.status() >= 400) {
    badSameOriginResponses.push(`${response.status()} ${response.url()}`)
  }
})

const preview = () => page.locator('#gallery-preview')
const cards = () => page.locator('.cat-img-card-lux')
const card = (index) => cards().nth(index)

const loadDesktop = async () => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(MATERIALS_URL, { waitUntil: 'networkidle' })
  await cards().first().waitFor({ state: 'visible' })
  await page.waitForTimeout(120)
}

const visiblePointForCard = async (index) => {
  const target = card(index)
  await target.scrollIntoViewIfNeeded()
  const point = await target.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const left = Math.max(rect.left + 10, 10)
    const right = Math.min(rect.right - 10, window.innerWidth - 10)
    const top = Math.max(rect.top + 10, 10)
    const bottom = Math.min(rect.bottom - 10, window.innerHeight - 10)
    if (left >= right || top >= bottom) return null

    const xCandidates = [
      left + (right - left) * 0.5,
      left + Math.min(26, (right - left) * 0.2),
      right - Math.min(26, (right - left) * 0.2),
    ]

    for (let y = top; y <= bottom; y += 16) {
      for (const x of xCandidates) {
        const hit = document.elementFromPoint(x, y)
        if (hit && element.contains(hit)) return { x, y }
      }
    }
    return null
  })
  assert.ok(point, `Card ${index} has no unobstructed point in the viewport`)
  return point
}

const moveToCard = async (index, steps = 5) => {
  const point = await visiblePointForCard(index)
  await page.mouse.move(point.x, point.y, { steps })
  assert.equal(await card(index).evaluate((element) => element.matches(':hover')), true, `Card ${index} did not receive hover`)
}

const openViaHover = async (index = 0) => {
  await page.mouse.move(8, 8)
  await moveToCard(index)
  await page.waitForTimeout(430)
  await preview().waitFor({ state: 'visible', timeout: 2500 })
}

const previewTitle = async () => (await preview().locator('h2').innerText()).trim()
const cardTitle = async (index) => (await card(index).locator('.cat-card-name-lux').innerText()).trim()

await logCheck('materials page renders a substantial gallery', async () => {
  await loadDesktop()
  assert.ok(await cards().count() >= 100)
})

await logCheck('preview is closed on the initial render', async () => {
  await loadDesktop()
  assert.equal(await preview().count(), 0)
})

await logCheck('stationary cursor over a card after reload does not auto-open preview', async () => {
  await loadDesktop()
  await moveToCard(0)
  await page.reload({ waitUntil: 'networkidle' })
  await cards().first().waitFor({ state: 'visible' })
  await page.waitForTimeout(900)
  assert.equal(await preview().count(), 0)
})

await logCheck('quick pass over one card does not open preview', async () => {
  await loadDesktop()
  await moveToCard(0)
  await page.waitForTimeout(100)
  await page.mouse.move(20, 20)
  await page.waitForTimeout(420)
  assert.equal(await preview().count(), 0)
})

await logCheck('quick pass over several cards does not leave a stale preview', async () => {
  await loadDesktop()
  for (let index = 0; index < 4; index += 1) {
    await moveToCard(index, 2)
    await page.waitForTimeout(70)
  }
  await page.mouse.move(20, 20)
  await page.waitForTimeout(420)
  assert.equal(await preview().count(), 0)
})

await logCheck('deliberate hover opens exactly one preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  assert.equal(await preview().count(), 1)
  assert.ok(await preview().isVisible())
})

await logCheck('opened preview title matches the hovered card', async () => {
  await loadDesktop()
  await openViaHover(0)
  assert.equal(await previewTitle(), await cardTitle(0))
})

await logCheck('gallery links do not misuse aria-expanded disclosure state', async () => {
  await loadDesktop()
  await openViaHover(0)
  assert.equal(await card(0).getAttribute('aria-expanded'), null)
})

await logCheck('gallery links do not control a transient hover-only region', async () => {
  await loadDesktop()
  await openViaHover(0)
  assert.equal(await card(0).getAttribute('aria-controls'), null)
})

await logCheck('preview is a named region linked to its visible heading', async () => {
  await loadDesktop()
  await openViaHover(0)
  assert.equal(await preview().getAttribute('role'), 'region')
  const labelledBy = await preview().getAttribute('aria-labelledby')
  assert.ok(labelledBy)
  assert.equal((await page.locator(`#${labelledBy}`).innerText()).trim(), await previewTitle())
})

await logCheck('preview does not announce the entire panel as a live region', async () => {
  await loadDesktop()
  await openViaHover(0)
  assert.equal(await preview().getAttribute('aria-live'), null)
  assert.equal(await preview().getAttribute('aria-atomic'), null)
})

await logCheck('moving to another visible card replaces content without a second panel', async () => {
  await loadDesktop()
  await openViaHover(0)
  const firstTitle = await previewTitle()
  await moveToCard(1)
  await page.waitForTimeout(260)
  assert.notEqual(await previewTitle(), firstTitle)
  assert.equal(await previewTitle(), await cardTitle(1))
  assert.equal(await preview().count(), 1)
})

await logCheck('continued movement inside one card does not restart hover dwell', async () => {
  await loadDesktop()
  await card(0).scrollIntoViewIfNeeded()
  const box = await card(0).boundingBox()
  assert.ok(box)
  await page.mouse.move(8, 8)
  for (let step = 0; step < 6; step += 1) {
    await page.mouse.move(box.x + 40 + step * 18, box.y + 80 + (step % 2) * 18)
    await page.waitForTimeout(70)
  }
  await preview().waitFor({ state: 'visible', timeout: 500 })
  assert.equal(await previewTitle(), await cardTitle(0))
})

await logCheck('close button closes preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  await preview().getByRole('button', { name: 'Свернуть предпросмотр' }).click()
  await preview().waitFor({ state: 'detached' })
})

await logCheck('closed preview does not instantly reopen under the unchanged cursor', async () => {
  await loadDesktop()
  await openViaHover(0)
  await preview().getByRole('button', { name: 'Свернуть предпросмотр' }).click()
  await page.waitForTimeout(850)
  assert.equal(await preview().count(), 0)
})

await logCheck('leaving and deliberately hovering again re-enables the preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  await preview().getByRole('button', { name: 'Свернуть предпросмотр' }).click()
  await page.mouse.move(20, 20)
  await page.waitForTimeout(520)
  await openViaHover(0)
  assert.ok(await preview().isVisible())
})

await logCheck('Escape closes preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  await page.keyboard.press('Escape')
  await preview().waitFor({ state: 'detached' })
})

await logCheck('synthetic wheel input without scrolling does not close preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 })))
  await page.waitForTimeout(180)
  assert.ok(await preview().isVisible())
})

await logCheck('programmatic page scroll closes preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  await page.evaluate(() => window.scrollBy(0, 80))
  await preview().waitFor({ state: 'detached' })
})

await logCheck('window blur closes preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await preview().waitFor({ state: 'detached' })
})

await logCheck('click outside gallery and preview closes preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  await page.locator('h1').click({ position: { x: 5, y: 5 } })
  await preview().waitFor({ state: 'detached' })
})

await logCheck('clicking the gallery background gap closes preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  await page.locator('main .grid').first().dispatchEvent('pointerdown', { pointerType: 'mouse' })
  await preview().waitFor({ state: 'detached' })
})

await logCheck('moving away from card and panel closes after the grace delay', async () => {
  await loadDesktop()
  await openViaHover(0)
  await page.mouse.move(20, 20)
  await page.waitForTimeout(360)
  assert.equal(await preview().count(), 0)
})

await logCheck('moving from card into preview keeps it open', async () => {
  await loadDesktop()
  await openViaHover(0)
  const box = await preview().boundingBox()
  assert.ok(box)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 2 })
  await page.waitForTimeout(380)
  assert.ok(await preview().isVisible())
})

await logCheck('Next button changes preview material', async () => {
  await loadDesktop()
  await openViaHover(0)
  const before = await previewTitle()
  await preview().getByRole('button', { name: 'Следующий материал' }).click()
  assert.notEqual(await previewTitle(), before)
})

await logCheck('preview navigation keeps the chosen dock stable', async () => {
  await loadDesktop()
  await openViaHover(0)
  const before = await preview().getAttribute('data-dock')
  await preview().getByRole('button', { name: 'Следующий материал' }).click()
  assert.equal(await preview().getAttribute('data-dock'), before)
})

await logCheck('Previous button reverses Next navigation', async () => {
  await loadDesktop()
  await openViaHover(0)
  const before = await previewTitle()
  await preview().getByRole('button', { name: 'Следующий материал' }).click()
  await preview().getByRole('button', { name: 'Предыдущий материал' }).click()
  assert.equal(await previewTitle(), before)
})

await logCheck('ArrowRight changes preview material', async () => {
  await loadDesktop()
  await openViaHover(0)
  const before = await previewTitle()
  await page.keyboard.press('ArrowRight')
  assert.notEqual(await previewTitle(), before)
})

await logCheck('ArrowLeft reverses ArrowRight navigation', async () => {
  await loadDesktop()
  await openViaHover(0)
  const before = await previewTitle()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowLeft')
  assert.equal(await previewTitle(), before)
})

await logCheck('keyboard focus does not open a hover-only preview', async () => {
  await loadDesktop()
  await card(0).focus()
  await page.waitForTimeout(420)
  assert.equal(await preview().count(), 0)
})

await logCheck('focused gallery link still navigates with Enter', async () => {
  await loadDesktop()
  const href = await card(0).getAttribute('href')
  assert.ok(href)
  await card(0).focus()
  await page.keyboard.press('Enter')
  await page.waitForURL((url) => url.pathname === href, { timeout: 5000 })
})

await logCheck('all preview controls have accessible button names', async () => {
  await loadDesktop()
  await openViaHover(0)
  const names = await preview().getByRole('button').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label') || button.textContent?.trim() || ''))
  assert.ok(names.length >= 3)
  assert.ok(names.every(Boolean))
})

await logCheck('preview image has non-empty alternative text', async () => {
  await loadDesktop()
  await openViaHover(0)
  const alt = await preview().locator('img').getAttribute('alt')
  assert.ok(alt && alt.trim().length > 0)
})

await logCheck('all gallery card links point to unique article URLs', async () => {
  await loadDesktop()
  const hrefs = await cards().evaluateAll((elements) => elements.map((element) => element.getAttribute('href') || ''))
  assert.ok(hrefs.every((href) => /^\/articles\/[^/]+\/$/.test(href)))
  assert.equal(new Set(hrefs).size, hrefs.length)
})

await logCheck('plain card click still navigates to its article', async () => {
  await loadDesktop()
  const href = await card(0).getAttribute('href')
  assert.ok(href)
  await card(0).click()
  await page.waitForURL((url) => url.pathname === href, { timeout: 5000 })
})

await logCheck('Read material button navigates to the previewed article', async () => {
  await loadDesktop()
  await openViaHover(0)
  const href = await card(0).getAttribute('href')
  assert.ok(href)
  await preview().getByRole('link', { name: /Читать материал/ }).click()
  await page.waitForURL((url) => url.pathname === href, { timeout: 5000 })
})

await logCheck('preview stays fully inside desktop viewport', async () => {
  await loadDesktop()
  await openViaHover(0)
  const box = await preview().boundingBox()
  assert.ok(box)
  const viewport = page.viewportSize()
  assert.ok(viewport)
  assert.ok(box.x >= 0 && box.y >= 0)
  assert.ok(box.x + box.width <= viewport.width + 1)
  assert.ok(box.y + box.height <= viewport.height + 1)
})

await logCheck('materials page has no horizontal overflow', async () => {
  await loadDesktop()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert.ok(overflow <= 1, `Horizontal overflow: ${overflow}px`)
})

await logCheck('document contains no duplicate element IDs', async () => {
  await loadDesktop()
  const duplicates = await page.evaluate(() => {
    const counts = new Map()
    for (const element of document.querySelectorAll('[id]')) {
      const id = element.id
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    return [...counts.entries()].filter(([, count]) => count > 1)
  })
  assert.deepEqual(duplicates, [])
})

await logCheck('narrow desktop viewport disables expanded preview', async () => {
  await page.setViewportSize({ width: 700, height: 900 })
  await page.goto(MATERIALS_URL, { waitUntil: 'networkidle' })
  await cards().first().waitFor({ state: 'visible' })
  await moveToCard(0)
  await page.waitForTimeout(500)
  assert.equal(await preview().count(), 0)
  assert.equal(await card(0).getAttribute('aria-controls'), null)
})

await logCheck('resizing below preview breakpoint closes an open preview', async () => {
  await loadDesktop()
  await openViaHover(0)
  await page.setViewportSize({ width: 700, height: 900 })
  await preview().waitFor({ state: 'detached' })
})

await logCheck('touch/coarse-pointer context never opens expanded preview', async () => {
  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const touchPage = await touchContext.newPage()
  await touchPage.goto(MATERIALS_URL, { waitUntil: 'networkidle' })
  const first = touchPage.locator('.cat-img-card-lux').first()
  await first.waitFor({ state: 'visible' })
  await first.dispatchEvent('pointerenter', { pointerType: 'touch' })
  await first.dispatchEvent('pointermove', { pointerType: 'touch' })
  await touchPage.waitForTimeout(500)
  assert.equal(await touchPage.locator('#gallery-preview').count(), 0)
  await touchContext.close()
})

await logCheck('reduced-motion preference disables preview entrance animations', async () => {
  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })
  const reducedPage = await reducedContext.newPage()
  await reducedPage.goto(MATERIALS_URL, { waitUntil: 'networkidle' })
  const first = reducedPage.locator('.cat-img-card-lux').first()
  await first.waitFor({ state: 'visible' })
  const box = await first.boundingBox()
  assert.ok(box)
  await reducedPage.mouse.move(8, 8)
  await reducedPage.mouse.move(box.x + box.width / 2, box.y + 70, { steps: 4 })
  await reducedPage.waitForTimeout(430)
  const panel = reducedPage.locator('#gallery-preview')
  await panel.waitFor({ state: 'visible' })
  const animationNames = await panel.evaluate((element) => {
    const cardElement = element.querySelector('.gallery-preview-card')
    const imageElement = element.querySelector('.gallery-preview-image')
    return [
      cardElement ? getComputedStyle(cardElement).animationName : 'missing',
      imageElement ? getComputedStyle(imageElement).animationName : 'missing',
    ]
  })
  assert.deepEqual(animationNames, ['none', 'none'])
  await reducedContext.close()
})

await logCheck('no uncaught page errors occurred during interaction audit', async () => {
  assert.deepEqual(pageErrors, [])
})

await logCheck('no browser console errors occurred during interaction audit', async () => {
  assert.deepEqual(consoleErrors, [])
})

await logCheck('no same-origin network requests failed', async () => {
  assert.deepEqual(failedSameOriginRequests, [])
})

await logCheck('no same-origin responses returned HTTP 4xx/5xx', async () => {
  assert.deepEqual(badSameOriginResponses, [])
})

await desktopContext.close()
await browser.close()

console.log(`\nGallery browser audit completed: ${checkNumber - failures.length}/${checkNumber} checks passed.`)

if (failures.length > 0) {
  console.error('\nFailures:')
  for (const failure of failures) {
    console.error(`- [${failure.label}] ${failure.name}\n${failure.message}`)
  }
  process.exit(1)
}
