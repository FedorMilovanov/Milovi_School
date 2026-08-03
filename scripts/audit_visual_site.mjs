import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '')
const OUTPUT_DIR = path.resolve(process.env.VISUAL_QA_DIR ?? 'artifacts/visual-qa')
const failures = []
const passed = []
let checkNumber = 0

await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
await fs.mkdir(OUTPUT_DIR, { recursive: true })

async function check(name, fn) {
  checkNumber += 1
  const label = String(checkNumber).padStart(3, '0')
  try {
    await fn()
    passed.push({ label, name })
    console.log(`✓ [${label}] ${name}`)
  } catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error)
    failures.push({ label, name, message })
    console.error(`✗ [${label}] ${name}\n${message}`)
  }
}

function assertInside(box, width, height, tolerance = 2) {
  assert.ok(box, 'element has no bounding box')
  assert.ok(box.x >= -tolerance, JSON.stringify(box))
  assert.ok(box.y >= -tolerance, JSON.stringify(box))
  assert.ok(box.x + box.width <= width + tolerance, JSON.stringify(box))
  assert.ok(box.y + box.height <= height + tolerance, JSON.stringify(box))
}

async function inspectDocument(page) {
  return page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')]
      .map((element) => element.id)
      .filter(Boolean)
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      duplicateIds: [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))],
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
  const telemetry = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
  }

  page.on('console', (message) => {
    if (message.type() === 'error') telemetry.consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => telemetry.pageErrors.push(error.message))
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(BASE_URL)) {
      telemetry.failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`)
    }
  })
  page.on('response', (response) => {
    if (response.url().startsWith(BASE_URL) && response.status() >= 400) {
      telemetry.badResponses.push(`${response.status()} ${response.url()}`)
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

  await check(`${slug}: route returns HTTP 200`, async () => {
    assert.equal(response?.status(), 200)
  })
  await check(`${slug}: Russian document language is declared`, async () => {
    assert.equal(await desktop.page.locator('html').getAttribute('lang'), 'ru')
  })
  await check(`${slug}: exactly one visible main landmark exists`, async () => {
    assert.equal(await desktop.page.locator('main:visible').count(), 1)
  })
  await check(`${slug}: exactly one visible non-empty h1 exists`, async () => {
    const heading = desktop.page.locator('h1:visible')
    assert.equal(await heading.count(), 1)
    assert.ok((await heading.innerText()).trim().length > 2)
  })
  await check(`${slug}: document has no horizontal overflow`, async () => {
    const state = await inspectDocument(desktop.page)
    assert.ok(state.scrollWidth <= state.clientWidth + 2, JSON.stringify(state))
  })
  await check(`${slug}: document contains no duplicate ids`, async () => {
    assert.deepEqual((await inspectDocument(desktop.page)).duplicateIds, [])
  })
  await check(`${slug}: visible images decode successfully`, async () => {
    assert.deepEqual(await brokenVisibleImages(desktop.page), [])
  })
  await check(`${slug}: title and canonical metadata are unique`, async () => {
    assert.equal(await desktop.page.locator('head > title').count(), 1)
    assert.ok((await desktop.page.title()).trim().length > 8)
    assert.equal(await desktop.page.locator('head link[rel="canonical"]').count(), 1)
  })
}

await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(1400)
const desktopBanner = desktop.page.getByRole('banner')

await check('home desktop: site banner stays inside viewport', async () => {
  assertInside(await desktopBanner.boundingBox(), 1440, 1000)
})
await check('home desktop: brand logo loads at declared size', async () => {
  const logo = desktopBanner.locator('img[alt="Patisserie Russe"]')
  const metrics = await logo.evaluate((image) => ({
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    width: image.getBoundingClientRect().width,
    height: image.getBoundingClientRect().height,
  }))
  assert.ok(metrics.naturalWidth > 0 && metrics.naturalHeight > 0)
  assert.ok(metrics.width >= 40 && metrics.height >= 40, JSON.stringify(metrics))
})
await check('home desktop: four primary navigation links are visible', async () => {
  const nav = desktopBanner.locator('nav:visible')
  assert.equal(await nav.count(), 1)
  for (const name of ['Главная', 'Архив', 'Галерея', 'О проекте']) {
    assert.ok(await nav.getByRole('link', { name, exact: true }).isVisible())
  }
})
await check('home desktop: hero heading has editorial display scale', async () => {
  const size = await desktop.page.locator('#hero h1').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  assert.ok(size >= 56, `font-size=${size}`)
})
await check('home desktop: hero description is fully visible after animation', async () => {
  const description = desktop.page.locator('#hero .hero-text > div p').first()
  const state = await description.evaluate((element) => ({
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
await check('home desktop: categories anchor is reachable', async () => {
  const section = desktop.page.locator('#categories')
  await section.scrollIntoViewIfNeeded()
  assert.ok(await section.isVisible())
})
await check('home desktop: about anchor is reachable', async () => {
  const section = desktop.page.locator('#about')
  await section.scrollIntoViewIfNeeded()
  assert.ok(await section.isVisible())
})
await check('home desktop: sticky header changes state after scrolling', async () => {
  await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  const before = await desktopBanner.getAttribute('class')
  await desktop.page.evaluate(() => window.scrollTo(0, 240))
  await desktop.page.waitForTimeout(420)
  assert.notEqual(await desktopBanner.getAttribute('class'), before)
})
await check('home desktop: theme toggle changes document theme', async () => {
  await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  const toggle = desktopBanner.getByRole('button', { name: /Переключить на (светлую|тёмную) тему/ })
  const before = await desktop.page.locator('html').getAttribute('class')
  await toggle.click()
  assert.notEqual(await desktop.page.locator('html').getAttribute('class'), before)
})
await check('home desktop: theme toggle updates theme-color metadata', async () => {
  const toggle = desktopBanner.getByRole('button', { name: /Переключить на (светлую|тёмную) тему/ })
  const before = await desktop.page.locator('#theme-color-meta').getAttribute('content')
  await toggle.click()
  assert.notEqual(await desktop.page.locator('#theme-color-meta').getAttribute('content'), before)
})
await check('home desktop: command palette opens from search control', async () => {
  await desktopBanner.getByRole('button', { name: 'Открыть поиск' }).click()
  await desktop.page.getByRole('dialog', { name: 'Поиск по материалам' }).waitFor({ state: 'visible' })
})
await check('home desktop: command palette focuses search field', async () => {
  const input = desktop.page.getByRole('dialog', { name: 'Поиск по материалам' }).getByRole('textbox')
  assert.equal(await input.evaluate((element) => document.activeElement === element), true)
})
await check('home desktop: command palette returns relevant results', async () => {
  const dialog = desktop.page.getByRole('dialog', { name: 'Поиск по материалам' })
  await dialog.getByRole('textbox').fill('круассан')
  await desktop.page.waitForTimeout(350)
  assert.match((await dialog.innerText()).toLowerCase(), /круассан|croissant/)
})
await check('home desktop: Escape clears a populated command query', async () => {
  const dialog = desktop.page.getByRole('dialog', { name: 'Поиск по материалам' })
  const input = dialog.getByRole('textbox')
  await desktop.page.keyboard.press('Escape')
  await desktop.page.waitForTimeout(80)
  assert.equal(await input.inputValue(), '')
  assert.ok(await dialog.isVisible())
})
await check('home desktop: close control dismisses the command palette', async () => {
  const dialog = desktop.page.getByRole('dialog', { name: 'Поиск по материалам' })
  await dialog.getByRole('button', { name: 'Закрыть поиск' }).click()
  await dialog.waitFor({ state: 'detached' })
})
await check('home desktop: gallery navigation reaches materials route', async () => {
  await desktopBanner.locator('nav').getByRole('link', { name: 'Галерея', exact: true }).click()
  await desktop.page.waitForURL((url) => url.pathname === '/materials/')
})

await desktop.page.goto(`${BASE_URL}/materials/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(350)
const cards = desktop.page.locator('.cat-img-card-lux')
const materialsBanner = desktop.page.getByRole('banner')

await check('materials desktop: at least 150 cards are rendered', async () => {
  assert.ok(await cards.count() >= 150)
})
await check('materials desktop: gallery uses at least three columns', async () => {
  const columns = await cards.evaluateAll((elements) => {
    const top = Math.round(elements[0].getBoundingClientRect().top)
    return elements.slice(0, 8).filter((element) => Math.abs(Math.round(element.getBoundingClientRect().top) - top) <= 2).length
  })
  assert.ok(columns >= 3, `columns=${columns}`)
})
await check('materials desktop: first-row cards have consistent geometry', async () => {
  const boxes = await cards.evaluateAll((elements) => elements.slice(0, 4).map((element) => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }))
  assert.ok(Math.max(...boxes.map((box) => box.width)) - Math.min(...boxes.map((box) => box.width)) <= 2, JSON.stringify(boxes))
  assert.ok(Math.max(...boxes.map((box) => box.height)) - Math.min(...boxes.map((box) => box.height)) <= 2, JSON.stringify(boxes))
})
await check('materials desktop: cards preserve portrait image ratio', async () => {
  const ratio = await cards.first().locator('.cat-card-img-wrap-lux').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return rect.width / rect.height
  })
  assert.ok(ratio > 0.72 && ratio < 0.88, `ratio=${ratio}`)
})
await check('materials desktop: first twelve titles remain within cards', async () => {
  const clipped = await cards.evaluateAll((elements) => elements.slice(0, 12).filter((card) => {
    const title = card.querySelector('.cat-card-name-lux')
    if (!title) return true
    const outer = card.getBoundingClientRect()
    const inner = title.getBoundingClientRect()
    return inner.left < outer.left - 1 || inner.right > outer.right + 1 || inner.bottom > outer.bottom + 1
  }).length)
  assert.equal(clipped, 0)
})
await check('materials desktop: first twelve card images decode', async () => {
  for (let index = 0; index < 12; index += 1) await cards.nth(index).scrollIntoViewIfNeeded()
  await desktop.page.waitForTimeout(500)
  assert.equal(await cards.locator('img').evaluateAll((images) => images.slice(0, 12).filter((image) => image.naturalWidth === 0).length), 0)
})
await check('materials desktop: article card links are unique', async () => {
  const hrefs = await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('href')).filter(Boolean))
  assert.equal(new Set(hrefs).size, hrefs.length)
})
await check('materials desktop: deliberate hover opens one preview', async () => {
  await cards.first().scrollIntoViewIfNeeded()
  await desktop.page.mouse.move(5, 5)
  await cards.first().hover()
  await desktop.page.waitForTimeout(430)
  assert.equal(await desktop.page.locator('#gallery-preview:visible').count(), 1)
})
await check('materials desktop: preview stays inside viewport', async () => {
  assertInside(await desktop.page.locator('#gallery-preview').boundingBox(), 1440, 1000)
})
await check('materials desktop: preview does not cover site banner', async () => {
  const preview = await desktop.page.locator('#gallery-preview').boundingBox()
  const banner = await materialsBanner.boundingBox()
  assert.ok(preview && banner)
  assert.ok(preview.y >= banner.y + banner.height - 1, JSON.stringify({ preview, banner }))
})
await check('materials desktop: preview image and heading are valid', async () => {
  const preview = desktop.page.locator('#gallery-preview')
  assert.ok((await preview.locator('h2').innerText()).trim().length > 4)
  assert.ok(await preview.locator('img').evaluate((image) => image.naturalWidth > 0))
})
await check('materials desktop: next control changes content', async () => {
  const preview = desktop.page.locator('#gallery-preview')
  const before = (await preview.locator('h2').innerText()).trim()
  await preview.getByRole('button', { name: 'Следующий материал' }).click()
  assert.notEqual((await preview.locator('h2').innerText()).trim(), before)
})
await check('materials desktop: read action targets article route', async () => {
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
const articleParagraph = desktop.page.locator('.article-body .drop-cap > p:visible').first()

await check('article desktop: editorial body paragraph exists', async () => {
  assert.ok(await articleParagraph.isVisible())
  assert.ok((await articleParagraph.innerText()).trim().length > 40)
})
await check('article desktop: body copy uses readable font size', async () => {
  const size = await articleParagraph.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  assert.ok(size >= 16, `font-size=${size}`)
})
await check('article desktop: body copy uses comfortable line height', async () => {
  const metrics = await articleParagraph.evaluate((element) => {
    const style = getComputedStyle(element)
    return { fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight) }
  })
  assert.ok(metrics.lineHeight / metrics.fontSize >= 1.45, JSON.stringify(metrics))
})
await check('article desktop: reading column has comfortable measure', async () => {
  const box = await articleParagraph.boundingBox()
  assert.ok(box)
  assert.ok(box.width >= 420 && box.width <= 900, JSON.stringify(box))
})
await check('article desktop: heading hierarchy contains sections', async () => {
  assert.ok(await desktop.page.locator('.article-body h2:visible, .article-body h3:visible').count() >= 2)
})
await check('article desktop: visible article images decode', async () => {
  const images = desktop.page.locator('article img:visible')
  assert.ok(await images.count() >= 1)
  assert.equal(await images.evaluateAll((items) => items.filter((image) => image.naturalWidth === 0).length), 0)
})
await check('article desktop: visible links have accessible names', async () => {
  const unnamed = await desktop.page.locator('main a:visible').evaluateAll((links) => links.filter((link) => {
    const name = link.getAttribute('aria-label') || link.textContent || link.querySelector('img')?.getAttribute('alt') || ''
    return name.trim().length === 0
  }).length)
  assert.equal(unnamed, 0)
})
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

await check('home mobile: page has no horizontal overflow', async () => {
  const state = await inspectDocument(mobile.page)
  assert.ok(state.scrollWidth <= state.clientWidth + 2, JSON.stringify(state))
})
await check('home mobile: desktop navigation is hidden', async () => {
  assert.equal(await mobileBanner.locator('nav:visible').count(), 0)
})
await check('home mobile: menu trigger is visible and collapsed', async () => {
  const trigger = mobileBanner.getByRole('button', { name: 'Открыть меню' })
  assert.ok(await trigger.isVisible())
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
})
await check('home mobile: header actions provide 44px touch targets', async () => {
  const undersized = await mobileBanner.locator('button:visible').evaluateAll((elements) => elements.filter((element) => {
    const rect = element.getBoundingClientRect()
    return rect.width < 43.5 || rect.height < 43.5
  }).map((element) => ({ label: element.getAttribute('aria-label'), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))
  assert.deepEqual(undersized, [])
})
await check('home mobile: logo and header actions do not overlap', async () => {
  const overlap = await mobileBanner.evaluate((banner) => {
    const logo = banner.querySelector('a[href="/"]')?.getBoundingClientRect()
    const buttons = [...banner.querySelectorAll('button')].filter((button) => getComputedStyle(button).display !== 'none')
    if (!logo) return true
    return buttons.some((button) => {
      const rect = button.getBoundingClientRect()
      return !(rect.left >= logo.right || rect.right <= logo.left || rect.top >= logo.bottom || rect.bottom <= logo.top)
    })
  })
  assert.equal(overlap, false)
})
await check('home mobile: hero description is fully visible', async () => {
  const paragraph = mobile.page.locator('#hero .hero-text > div p').first()
  const state = await paragraph.evaluate((element) => ({
    opacity: Number.parseFloat(element.parentElement ? getComputedStyle(element.parentElement).opacity : '1'),
    textLength: element.textContent?.trim().length ?? 0,
  }))
  assert.ok(state.opacity >= 0.99, JSON.stringify(state))
  assert.ok(state.textLength > 80, JSON.stringify(state))
})
await check('home mobile: opening menu creates modal dialog', async () => {
  await mobileBanner.getByRole('button', { name: 'Открыть меню' }).click()
  const menu = mobile.page.getByRole('dialog', { name: 'Навигационное меню' })
  await menu.waitFor({ state: 'visible' })
  assert.equal(await menu.getAttribute('aria-modal'), 'true')
})
await check('home mobile: open menu locks body scrolling', async () => {
  assert.equal(await mobile.page.locator('body').evaluate((element) => element.style.overflow), 'hidden')
})
await check('home mobile: focus moves inside menu', async () => {
  const menu = mobile.page.getByRole('dialog', { name: 'Навигационное меню' })
  assert.equal(await menu.evaluate((element) => element.contains(document.activeElement)), true)
})
await check('home mobile: menu settles below banner and inside viewport', async () => {
  await mobile.page.waitForTimeout(260)
  const menu = await mobile.page.getByRole('dialog', { name: 'Навигационное меню' }).boundingBox()
  const banner = await mobileBanner.boundingBox()
  assert.ok(menu && banner)
  assert.ok(menu.y >= banner.y + banner.height - 2, JSON.stringify({ menu, banner }))
  assert.ok(menu.y + menu.height <= 846, JSON.stringify({ menu, banner }))
})
await check('home mobile: menu items provide 44px touch targets', async () => {
  const menu = mobile.page.getByRole('dialog', { name: 'Навигационное меню' })
  const undersized = await menu.getByRole('button').evaluateAll((buttons) => buttons.filter((button) => button.getBoundingClientRect().height < 43.5).length)
  assert.equal(undersized, 0)
})
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-mobile-menu.png'), fullPage: false })
await check('home mobile: Escape closes menu and restores scrolling', async () => {
  await mobile.page.keyboard.press('Escape')
  await mobile.page.getByRole('dialog', { name: 'Навигационное меню' }).waitFor({ state: 'detached' })
  assert.notEqual(await mobile.page.locator('body').evaluate((element) => element.style.overflow), 'hidden')
})
await check('home mobile: command palette fits viewport', async () => {
  await mobileBanner.getByRole('button', { name: 'Открыть поиск' }).click()
  const dialog = mobile.page.getByRole('dialog', { name: 'Поиск по материалам' })
  await dialog.waitFor({ state: 'visible' })
  await mobile.page.waitForTimeout(260)
  assertInside(await dialog.boundingBox(), 390, 844)
  await dialog.getByRole('button', { name: 'Закрыть поиск' }).click()
  await dialog.waitFor({ state: 'detached' })
})
await check('home mobile: bottom navigation exposes five actions', async () => {
  const nav = mobile.page.getByRole('navigation', { name: 'Основная навигация' })
  assert.ok(await nav.isVisible())
  assert.equal(await nav.locator('a, button').count(), 5)
})
await check('home mobile: bottom navigation actions have adequate height', async () => {
  const nav = mobile.page.getByRole('navigation', { name: 'Основная навигация' })
  assert.equal(await nav.locator('a, button').evaluateAll((elements) => elements.filter((element) => element.getBoundingClientRect().height < 44).length), 0)
})
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-mobile.png'), fullPage: false })

await mobile.page.goto(`${BASE_URL}/materials/`, { waitUntil: 'networkidle' })
await mobile.page.waitForTimeout(350)
const mobileCards = mobile.page.locator('.cat-img-card-lux')
await check('materials mobile: gallery resolves to one column', async () => {
  const first = await mobileCards.nth(0).boundingBox()
  const second = await mobileCards.nth(1).boundingBox()
  assert.ok(first && second)
  assert.ok(second.y >= first.y + first.height - 2, JSON.stringify({ first, second }))
})
await check('materials mobile: first cards fit viewport width', async () => {
  const boxes = await mobileCards.evaluateAll((elements) => elements.slice(0, 4).map((element) => element.getBoundingClientRect().toJSON()))
  assert.ok(boxes.every((box) => box.x >= -1 && box.x + box.width <= 391), JSON.stringify(boxes))
})
await check('materials mobile: coarse-pointer hover never opens preview', async () => {
  await mobileCards.first().hover()
  await mobile.page.waitForTimeout(500)
  assert.equal(await mobile.page.locator('#gallery-preview').count(), 0)
})
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'materials-mobile.png'), fullPage: false })
await check('materials mobile: tapping card navigates to article', async () => {
  const href = await mobileCards.first().getAttribute('href')
  assert.ok(href)
  await mobileCards.first().tap()
  await mobile.page.waitForURL((url) => url.pathname === href)
})
const mobileArticleParagraph = mobile.page.locator('.article-body .drop-cap > p:visible').first()
await check('article mobile: page has no horizontal overflow', async () => {
  const state = await inspectDocument(mobile.page)
  assert.ok(state.scrollWidth <= state.clientWidth + 2, JSON.stringify(state))
})
await check('article mobile: heading and body fit viewport width', async () => {
  for (const locator of [mobile.page.locator('h1:visible'), mobileArticleParagraph]) {
    const box = await locator.boundingBox()
    assert.ok(box)
    assert.ok(box.x >= -1 && box.x + box.width <= 391, JSON.stringify(box))
  }
})
await check('article mobile: body copy remains readable', async () => {
  const metrics = await mobileArticleParagraph.evaluate((element) => {
    const style = getComputedStyle(element)
    return { fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight) }
  })
  assert.ok(metrics.fontSize >= 16, JSON.stringify(metrics))
  assert.ok(metrics.lineHeight / metrics.fontSize >= 1.45, JSON.stringify(metrics))
})
await check('article mobile: reading bar exposes four controls', async () => {
  const bar = mobile.page.locator('div.fixed.inset-x-0.bottom-0').last()
  assert.equal(await bar.getByRole('button').count(), 4)
})
await check('article mobile: reading-bar controls meet touch target', async () => {
  const bar = mobile.page.locator('div.fixed.inset-x-0.bottom-0').last()
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
await check('materials tablet: gallery resolves to two columns', async () => {
  const boxes = await tabletCards.evaluateAll((elements) => elements.slice(0, 4).map((element) => element.getBoundingClientRect().toJSON()))
  assert.ok(Math.abs(boxes[0].top - boxes[1].top) <= 2, JSON.stringify(boxes))
  assert.ok(boxes[2].top >= boxes[0].bottom - 2, JSON.stringify(boxes))
})
await check('materials tablet: expanded preview remains disabled', async () => {
  await tabletCards.first().hover()
  await tablet.page.waitForTimeout(500)
  assert.equal(await tablet.page.locator('#gallery-preview').count(), 0)
})
await check('materials tablet: page has no horizontal overflow', async () => {
  const state = await inspectDocument(tablet.page)
  assert.ok(state.scrollWidth <= state.clientWidth + 2, JSON.stringify(state))
})
await check('materials tablet: site banner fits viewport', async () => {
  assertInside(await tablet.page.getByRole('banner').boundingBox(), 768, 1024)
})
await tablet.page.screenshot({ path: path.join(OUTPUT_DIR, 'materials-tablet.png'), fullPage: false })

for (const [name, observed] of [['desktop', desktop], ['mobile', mobile]]) {
  await check(`${name}: no uncaught JavaScript errors occurred`, async () => {
    assert.deepEqual(observed.telemetry.pageErrors, [])
  })
  await check(`${name}: no browser console errors occurred`, async () => {
    assert.deepEqual(observed.telemetry.consoleErrors, [])
  })
  await check(`${name}: no same-origin requests failed`, async () => {
    assert.deepEqual(observed.telemetry.failedRequests, [])
  })
  await check(`${name}: no same-origin HTTP 4xx or 5xx occurred`, async () => {
    assert.deepEqual(observed.telemetry.badResponses, [])
  })
}
await check('tablet: no browser or network errors occurred', async () => {
  assert.deepEqual(tablet.telemetry.pageErrors, [])
  assert.deepEqual(tablet.telemetry.consoleErrors, [])
  assert.deepEqual(tablet.telemetry.failedRequests, [])
  assert.deepEqual(tablet.telemetry.badResponses, [])
})

const screenshots = (await fs.readdir(OUTPUT_DIR)).filter((name) => name.endsWith('.png')).sort()
const report = {
  baseUrl: BASE_URL,
  checks: checkNumber,
  passed: passed.length,
  failed: failures.length,
  screenshots,
  failures,
}
await fs.writeFile(path.join(OUTPUT_DIR, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

await Promise.all([desktop.context.close(), mobile.context.close(), tablet.context.close()])
await browser.close()

if (failures.length > 0) {
  console.error(`\nVisual QA failed: ${passed.length}/${checkNumber} checks passed.`)
  process.exitCode = 1
} else {
  console.log(`\nVisual QA completed: ${passed.length}/${checkNumber} checks passed; ${screenshots.length} screenshots captured.`)
}
