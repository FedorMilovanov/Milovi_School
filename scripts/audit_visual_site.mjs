import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '')
const OUTPUT_DIR = path.resolve(process.env.VISUAL_QA_DIR ?? 'artifacts/visual-qa')
const passed = []
const failures = []
let number = 0

await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
await fs.mkdir(OUTPUT_DIR, { recursive: true })

async function check(name, task) {
  number += 1
  const id = String(number).padStart(3, '0')
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

function assertInside(box, width, height, tolerance = 2) {
  assert.ok(box, 'missing bounding box')
  assert.ok(box.x >= -tolerance, JSON.stringify(box))
  assert.ok(box.y >= -tolerance, JSON.stringify(box))
  assert.ok(box.x + box.width <= width + tolerance, JSON.stringify(box))
  assert.ok(box.y + box.height <= height + tolerance, JSON.stringify(box))
}

async function inspect(page) {
  return page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id).filter(Boolean)
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      duplicates: [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))],
    }
  })
}

async function brokenVisibleImages(page) {
  return page.locator('img:visible').evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => {
      if (image.complete) return
      await new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true })
        image.addEventListener('error', resolve, { once: true })
        setTimeout(resolve, 2500)
      })
    }))
    return images
      .filter((image) => image.naturalWidth === 0 || image.naturalHeight === 0)
      .map((image) => image.getAttribute('src') || '(missing src)')
  })
}

const browser = await chromium.launch({ headless: true })

async function observedPage(options) {
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

const desktop = await observedPage({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'dark',
  reducedMotion: 'no-preference',
})

const routes = [
  ['home', '/'],
  ['materials', '/materials/'],
  ['article', '/articles/recipe-kouglof/'],
  ['about', '/about/'],
  ['methodology', '/methodology/'],
  ['sources', '/sources/'],
  ['corrections', '/corrections/'],
  ['editorial-policy', '/editorial-policy/'],
  ['privacy', '/privacy/'],
]

for (const [slug, route] of routes) {
  const response = await desktop.page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' })
  await desktop.page.waitForTimeout(250)

  await check(`${slug}: HTTP 200`, async () => assert.equal(response?.status(), 200))
  await check(`${slug}: document language is ru`, async () => assert.equal(await desktop.page.locator('html').getAttribute('lang'), 'ru'))
  await check(`${slug}: one visible main landmark`, async () => assert.equal(await desktop.page.locator('main:visible').count(), 1))
  await check(`${slug}: one visible non-empty h1`, async () => {
    const heading = desktop.page.locator('h1:visible')
    assert.equal(await heading.count(), 1)
    assert.ok((await heading.innerText()).trim().length > 2)
  })
  await check(`${slug}: no horizontal overflow`, async () => {
    const state = await inspect(desktop.page)
    assert.ok(state.scrollWidth <= state.clientWidth + 2, JSON.stringify(state))
  })
  await check(`${slug}: no duplicate ids`, async () => assert.deepEqual((await inspect(desktop.page)).duplicates, []))
  await check(`${slug}: visible images decode`, async () => assert.deepEqual(await brokenVisibleImages(desktop.page), []))
  await check(`${slug}: unique title and canonical`, async () => {
    assert.equal(await desktop.page.locator('head > title').count(), 1)
    assert.ok((await desktop.page.title()).trim().length > 8)
    assert.equal(await desktop.page.locator('head link[rel="canonical"]').count(), 1)
  })
}

await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(1400)
const desktopBanner = desktop.page.getByRole('banner')

await check('home desktop: banner stays inside viewport', async () => assertInside(await desktopBanner.boundingBox(), 1440, 1000))
await check('home desktop: logo loads at declared visual size', async () => {
  const logo = desktopBanner.locator('img[alt="Patisserie Russe"]')
  const dimensions = await logo.evaluate((image) => ({
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    width: image.getBoundingClientRect().width,
    height: image.getBoundingClientRect().height,
  }))
  assert.ok(dimensions.naturalWidth > 0 && dimensions.naturalHeight > 0)
  assert.ok(dimensions.width >= 40 && dimensions.height >= 40, JSON.stringify(dimensions))
})
await check('home desktop: four main navigation links are visible', async () => {
  const nav = desktopBanner.locator('nav:visible')
  for (const label of ['Главная', 'Архив', 'Галерея', 'О проекте']) {
    assert.ok(await nav.getByRole('link', { name: label, exact: true }).isVisible())
  }
})
await check('home desktop: hero title has display scale', async () => {
  const size = await desktop.page.locator('#hero h1').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  assert.ok(size >= 56, `font-size=${size}`)
})
await check('home desktop: hero description is fully visible', async () => {
  const paragraph = desktop.page.locator('#hero .hero-text > div p').first()
  const state = await paragraph.evaluate((element) => ({
    opacity: Number.parseFloat(element.parentElement ? getComputedStyle(element.parentElement).opacity : '1'),
    textLength: element.textContent?.trim().length ?? 0,
  }))
  assert.ok(state.opacity >= 0.99, JSON.stringify(state))
  assert.ok(state.textLength > 80, JSON.stringify(state))
})
await check('home desktop: both hero calls to action are visible', async () => {
  assert.ok(await desktop.page.getByRole('link', { name: 'Открыть архив', exact: true }).isVisible())
  assert.ok(await desktop.page.getByRole('link', { name: /Milovi Cake/ }).last().isVisible())
})
await check('home desktop: theme toggle changes document class', async () => {
  const toggle = desktopBanner.getByRole('button', { name: /Переключить на (светлую|тёмную) тему/ })
  const before = await desktop.page.locator('html').getAttribute('class')
  await toggle.click()
  assert.notEqual(await desktop.page.locator('html').getAttribute('class'), before)
})
await check('home desktop: theme toggle changes theme-color', async () => {
  const toggle = desktopBanner.getByRole('button', { name: /Переключить на (светлую|тёмную) тему/ })
  const before = await desktop.page.locator('#theme-color-meta').getAttribute('content')
  await toggle.click()
  assert.notEqual(await desktop.page.locator('#theme-color-meta').getAttribute('content'), before)
})
await check('home desktop: search opens command palette', async () => {
  await desktopBanner.getByRole('button', { name: 'Открыть поиск' }).click()
  await desktop.page.getByRole('dialog', { name: 'Поиск по материалам' }).waitFor({ state: 'visible' })
})
await check('home desktop: search input receives focus', async () => {
  const input = desktop.page.getByRole('dialog', { name: 'Поиск по материалам' }).getByRole('textbox')
  assert.equal(await input.evaluate((element) => document.activeElement === element), true)
})
await check('home desktop: real query returns relevant results', async () => {
  const dialog = desktop.page.getByRole('dialog', { name: 'Поиск по материалам' })
  await dialog.getByRole('textbox').fill('круассан')
  await desktop.page.waitForTimeout(350)
  assert.match((await dialog.innerText()).toLowerCase(), /круассан|croissant/)
})
await check('home desktop: first Escape clears populated query', async () => {
  const dialog = desktop.page.getByRole('dialog', { name: 'Поиск по материалам' })
  const input = dialog.getByRole('textbox')
  await desktop.page.keyboard.press('Escape')
  await desktop.page.waitForTimeout(100)
  assert.equal(await input.inputValue(), '')
  assert.ok(await dialog.isVisible())
})
await check('home desktop: second Escape closes empty palette', async () => {
  const dialog = desktop.page.getByRole('dialog', { name: 'Поиск по материалам' })
  await desktop.page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'detached' })
})
await check('home desktop: gallery navigation reaches materials', async () => {
  await desktopBanner.locator('nav').getByRole('link', { name: 'Галерея', exact: true }).click()
  await desktop.page.waitForURL((url) => url.pathname === '/materials/')
})

await desktop.page.goto(`${BASE_URL}/materials/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(350)
const desktopCards = desktop.page.locator('.cat-img-card-lux')

await check('materials desktop: at least 150 cards render', async () => assert.ok(await desktopCards.count() >= 150))
await check('materials desktop: first row has at least three columns', async () => {
  const columns = await desktopCards.evaluateAll((cards) => {
    const top = Math.round(cards[0].getBoundingClientRect().top)
    return cards.slice(0, 8).filter((card) => Math.abs(Math.round(card.getBoundingClientRect().top) - top) <= 2).length
  })
  assert.ok(columns >= 3, `columns=${columns}`)
})
await check('materials desktop: first-row cards have consistent width', async () => {
  const widths = await desktopCards.evaluateAll((cards) => cards.slice(0, 4).map((card) => card.getBoundingClientRect().width))
  assert.ok(Math.max(...widths) - Math.min(...widths) <= 2, JSON.stringify(widths))
})
await check('materials desktop: card article links are unique', async () => {
  const hrefs = await desktopCards.evaluateAll((cards) => cards.map((card) => card.getAttribute('href')).filter(Boolean))
  assert.equal(new Set(hrefs).size, hrefs.length)
})
await check('materials desktop: first twelve card images decode', async () => {
  for (let index = 0; index < 12; index += 1) await desktopCards.nth(index).scrollIntoViewIfNeeded()
  await desktop.page.waitForTimeout(500)
  assert.equal(await desktopCards.locator('img').evaluateAll((images) => images.slice(0, 12).filter((image) => image.naturalWidth === 0).length), 0)
})
await check('materials desktop: deliberate hover opens one preview', async () => {
  await desktopCards.first().scrollIntoViewIfNeeded()
  await desktop.page.mouse.move(5, 5)
  await desktopCards.first().hover()
  await desktop.page.waitForTimeout(430)
  assert.equal(await desktop.page.locator('#gallery-preview:visible').count(), 1)
})
await check('materials desktop: preview stays inside viewport', async () => assertInside(await desktop.page.locator('#gallery-preview').boundingBox(), 1440, 1000))
await check('materials desktop: next button changes preview material', async () => {
  const preview = desktop.page.locator('#gallery-preview')
  const before = (await preview.locator('h2').innerText()).trim()
  await preview.getByRole('button', { name: 'Следующий материал' }).click()
  assert.notEqual((await preview.locator('h2').innerText()).trim(), before)
})
await check('materials desktop: read action points to an article', async () => {
  const href = await desktop.page.locator('#gallery-preview').getByRole('link', { name: /Читать материал/ }).getAttribute('href')
  assert.ok(href && /^\/articles\/[^/]+\/$/.test(href), href ?? 'missing href')
})
await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'materials-desktop-preview.png'), fullPage: false })
await check('materials desktop: Escape closes preview', async () => {
  await desktop.page.keyboard.press('Escape')
  await desktop.page.locator('#gallery-preview').waitFor({ state: 'detached' })
})

await desktop.page.goto(`${BASE_URL}/articles/recipe-kouglof/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(400)
const desktopParagraph = desktop.page.locator('.article-body .drop-cap > p:visible').first()
await check('article desktop: editorial paragraph exists', async () => assert.ok((await desktopParagraph.innerText()).trim().length > 40))
await check('article desktop: body font is at least 16px', async () => {
  const size = await desktopParagraph.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  assert.ok(size >= 16, `font-size=${size}`)
})
await check('article desktop: line height is comfortable', async () => {
  const metrics = await desktopParagraph.evaluate((element) => {
    const style = getComputedStyle(element)
    return { size: Number.parseFloat(style.fontSize), line: Number.parseFloat(style.lineHeight) }
  })
  assert.ok(metrics.line / metrics.size >= 1.45, JSON.stringify(metrics))
})
await check('article desktop: reading column has comfortable measure', async () => {
  const box = await desktopParagraph.boundingBox()
  assert.ok(box)
  assert.ok(box.width >= 420 && box.width <= 900, JSON.stringify(box))
})
await check('article desktop: section heading hierarchy exists', async () => assert.ok(await desktop.page.locator('.article-body h2:visible, .article-body h3:visible').count() >= 2))
await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'article-desktop.png'), fullPage: false })

await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(1400)
await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-desktop-dark.png'), fullPage: false })
await desktopBanner.getByRole('button', { name: /Переключить на (светлую|тёмную) тему/ }).click()
await desktop.page.waitForTimeout(250)
await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-desktop-light.png'), fullPage: false })

const mobile = await observedPage({
  viewport: { width: 390, height: 844 },
  colorScheme: 'dark',
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
})
await mobile.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
await mobile.page.waitForTimeout(1400)
const mobileBanner = mobile.page.getByRole('banner')

await check('home mobile: no horizontal overflow', async () => {
  const state = await inspect(mobile.page)
  assert.ok(state.scrollWidth <= state.clientWidth + 2, JSON.stringify(state))
})
await check('home mobile: desktop nav is hidden', async () => assert.equal(await mobileBanner.locator('nav:visible').count(), 0))
await check('home mobile: header buttons provide 44px touch targets', async () => {
  const small = await mobileBanner.locator('button:visible').evaluateAll((buttons) => buttons.filter((button) => {
    const rect = button.getBoundingClientRect()
    return rect.width < 43.5 || rect.height < 43.5
  }).length)
  assert.equal(small, 0)
})
await check('home mobile: menu opens as modal dialog', async () => {
  await mobileBanner.getByRole('button', { name: 'Открыть меню' }).click()
  const dialog = mobile.page.getByRole('dialog', { name: 'Навигационное меню' })
  await dialog.waitFor({ state: 'visible' })
  assert.equal(await dialog.getAttribute('aria-modal'), 'true')
})
await check('home mobile: open menu locks body scroll', async () => assert.equal(await mobile.page.locator('body').evaluate((body) => body.style.overflow), 'hidden'))
await check('home mobile: menu sits below banner inside viewport', async () => {
  await mobile.page.waitForTimeout(260)
  const menu = await mobile.page.getByRole('dialog', { name: 'Навигационное меню' }).boundingBox()
  const banner = await mobileBanner.boundingBox()
  assert.ok(menu && banner)
  assert.ok(menu.y >= banner.y + banner.height - 2, JSON.stringify({ menu, banner }))
  assert.ok(menu.y + menu.height <= 846, JSON.stringify({ menu, banner }))
})
await check('home mobile: menu items provide 44px touch targets', async () => {
  const menu = mobile.page.getByRole('dialog', { name: 'Навигационное меню' })
  assert.equal(await menu.getByRole('button').evaluateAll((buttons) => buttons.filter((button) => button.getBoundingClientRect().height < 43.5).length), 0)
})
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-mobile-menu.png'), fullPage: false })
await check('home mobile: Escape closes menu and unlocks body', async () => {
  await mobile.page.keyboard.press('Escape')
  await mobile.page.getByRole('dialog', { name: 'Навигационное меню' }).waitFor({ state: 'detached' })
  assert.notEqual(await mobile.page.locator('body').evaluate((body) => body.style.overflow), 'hidden')
})
await check('home mobile: search palette fits viewport and closes with Escape', async () => {
  await mobileBanner.getByRole('button', { name: 'Открыть поиск' }).click()
  const dialog = mobile.page.getByRole('dialog', { name: 'Поиск по материалам' })
  await dialog.waitFor({ state: 'visible' })
  await mobile.page.waitForTimeout(260)
  assertInside(await dialog.boundingBox(), 390, 844)
  await mobile.page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'detached' })
})
await check('home mobile: bottom navigation has five actions', async () => {
  const nav = mobile.page.getByRole('navigation', { name: 'Основная навигация' })
  assert.ok(await nav.isVisible())
  assert.equal(await nav.locator('a, button').count(), 5)
})
await check('home mobile: bottom navigation targets are at least 44px high', async () => {
  const nav = mobile.page.getByRole('navigation', { name: 'Основная навигация' })
  assert.equal(await nav.locator('a, button').evaluateAll((items) => items.filter((item) => item.getBoundingClientRect().height < 44).length), 0)
})
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-mobile.png'), fullPage: false })

await mobile.page.goto(`${BASE_URL}/materials/`, { waitUntil: 'networkidle' })
await mobile.page.waitForTimeout(350)
const mobileCards = mobile.page.locator('.cat-img-card-lux')
await check('materials mobile: cards form one column', async () => {
  const first = await mobileCards.nth(0).boundingBox()
  const second = await mobileCards.nth(1).boundingBox()
  assert.ok(first && second)
  assert.ok(second.y >= first.y + first.height - 2, JSON.stringify({ first, second }))
})
await check('materials mobile: hover preview stays disabled', async () => {
  await mobileCards.first().hover()
  await mobile.page.waitForTimeout(500)
  assert.equal(await mobile.page.locator('#gallery-preview').count(), 0)
})
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'materials-mobile.png'), fullPage: false })
await check('materials mobile: card tap opens article', async () => {
  const href = await mobileCards.first().getAttribute('href')
  assert.ok(href)
  await mobileCards.first().tap()
  await mobile.page.waitForURL((url) => url.pathname === href)
})
const mobileParagraph = mobile.page.locator('.article-body .drop-cap > p:visible').first()
await check('article mobile: no horizontal overflow', async () => {
  const state = await inspect(mobile.page)
  assert.ok(state.scrollWidth <= state.clientWidth + 2, JSON.stringify(state))
})
await check('article mobile: body copy remains readable', async () => {
  const metrics = await mobileParagraph.evaluate((element) => {
    const style = getComputedStyle(element)
    return { size: Number.parseFloat(style.fontSize), line: Number.parseFloat(style.lineHeight) }
  })
  assert.ok(metrics.size >= 16, JSON.stringify(metrics))
  assert.ok(metrics.line / metrics.size >= 1.45, JSON.stringify(metrics))
})
await check('article mobile: reading bar has four adequate controls', async () => {
  const bar = mobile.page.locator('div.fixed.inset-x-0.bottom-0').last()
  assert.equal(await bar.getByRole('button').count(), 4)
  assert.equal(await bar.getByRole('button').evaluateAll((buttons) => buttons.filter((button) => button.getBoundingClientRect().height < 44).length), 0)
})
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'article-mobile.png'), fullPage: false })

const tablet = await observedPage({
  viewport: { width: 768, height: 1024 },
  colorScheme: 'dark',
  hasTouch: true,
})
await tablet.page.goto(`${BASE_URL}/materials/`, { waitUntil: 'networkidle' })
await tablet.page.waitForTimeout(350)
const tabletCards = tablet.page.locator('.cat-img-card-lux')
await check('materials tablet: cards form two columns', async () => {
  const boxes = await tabletCards.evaluateAll((cards) => cards.slice(0, 4).map((card) => card.getBoundingClientRect().toJSON()))
  assert.ok(Math.abs(boxes[0].top - boxes[1].top) <= 2, JSON.stringify(boxes))
  assert.ok(boxes[2].top >= boxes[0].bottom - 2, JSON.stringify(boxes))
})
await check('materials tablet: expanded preview stays disabled', async () => {
  await tabletCards.first().hover()
  await tablet.page.waitForTimeout(500)
  assert.equal(await tablet.page.locator('#gallery-preview').count(), 0)
})
await check('materials tablet: no horizontal overflow', async () => {
  const state = await inspect(tablet.page)
  assert.ok(state.scrollWidth <= state.clientWidth + 2, JSON.stringify(state))
})
await check('materials tablet: banner fits viewport', async () => assertInside(await tablet.page.getByRole('banner').boundingBox(), 768, 1024))
await tablet.page.screenshot({ path: path.join(OUTPUT_DIR, 'materials-tablet.png'), fullPage: false })

for (const [name, observed] of [['desktop', desktop], ['mobile', mobile]]) {
  await check(`${name}: no uncaught JavaScript errors`, async () => assert.deepEqual(observed.telemetry.page, []))
  await check(`${name}: no browser console errors`, async () => assert.deepEqual(observed.telemetry.console, []))
  await check(`${name}: no same-origin request failures`, async () => assert.deepEqual(observed.telemetry.requests, []))
  await check(`${name}: no same-origin HTTP 4xx or 5xx`, async () => assert.deepEqual(observed.telemetry.responses, []))
}
await check('tablet: no browser or network errors', async () => {
  assert.deepEqual(tablet.telemetry.page, [])
  assert.deepEqual(tablet.telemetry.console, [])
  assert.deepEqual(tablet.telemetry.requests, [])
  assert.deepEqual(tablet.telemetry.responses, [])
})

const screenshots = (await fs.readdir(OUTPUT_DIR)).filter((name) => name.endsWith('.png')).sort()
const report = {
  baseUrl: BASE_URL,
  checks: number,
  passed: passed.length,
  failed: failures.length,
  screenshots,
  failures,
}
await fs.writeFile(path.join(OUTPUT_DIR, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

await Promise.all([desktop.context.close(), mobile.context.close(), tablet.context.close()])
await browser.close()

if (failures.length > 0) {
  console.error(`\nVisual QA failed: ${passed.length}/${number} checks passed.`)
  process.exitCode = 1
} else {
  console.log(`\nVisual QA completed: ${passed.length}/${number} checks passed; ${screenshots.length} screenshots captured.`)
}
