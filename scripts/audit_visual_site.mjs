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

const logCheck = async (name, fn) => {
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

const browser = await chromium.launch({ headless: true })

const createObservedPage = async (options) => {
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

const desktop = await createObservedPage({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'dark',
  reducedMotion: 'no-preference',
})

const routeCases = [
  { slug: 'home', path: '/' },
  { slug: 'materials', path: '/materials/' },
  { slug: 'article', path: '/articles/recipe-kouglof/' },
  { slug: 'about', path: '/about/' },
  { slug: 'methodology', path: '/methodology/' },
  { slug: 'sources', path: '/sources/' },
  { slug: 'corrections', path: '/corrections/' },
  { slug: 'editorial-policy', path: '/editorial-policy/' },
  { slug: 'privacy', path: '/privacy/' },
]

const routeSnapshots = new Map()

for (const route of routeCases) {
  const response = await desktop.page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' })
  await desktop.page.waitForTimeout(250)
  routeSnapshots.set(route.slug, { response })

  await logCheck(`${route.slug}: route returns HTTP 200`, async () => {
    assert.equal(response?.status(), 200)
  })

  await logCheck(`${route.slug}: Russian document language is declared`, async () => {
    assert.equal(await desktop.page.locator('html').getAttribute('lang'), 'ru')
  })

  await logCheck(`${route.slug}: exactly one visible main landmark exists`, async () => {
    const visible = desktop.page.locator('main:visible')
    assert.equal(await visible.count(), 1)
  })

  await logCheck(`${route.slug}: exactly one visible h1 exists`, async () => {
    const headings = desktop.page.locator('h1:visible')
    assert.equal(await headings.count(), 1)
    assert.ok((await headings.first().innerText()).trim().length > 2)
  })

  await logCheck(`${route.slug}: document has no horizontal page overflow`, async () => {
    const overflow = await desktop.page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    assert.ok(overflow.scrollWidth <= overflow.clientWidth + 2, JSON.stringify(overflow))
  })

  await logCheck(`${route.slug}: document contains no duplicate element ids`, async () => {
    const duplicateIds = await desktop.page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id).filter(Boolean)
      return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
    })
    assert.deepEqual(duplicateIds, [])
  })

  await logCheck(`${route.slug}: visible images decode successfully`, async () => {
    const broken = await desktop.page.locator('img:visible').evaluateAll(async (images) => {
      await Promise.all(images.map(async (image) => {
        if (!image.complete) {
          await new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', resolve, { once: true })
            setTimeout(resolve, 2500)
          })
        }
      }))
      return images
        .filter((image) => image.naturalWidth === 0 || image.naturalHeight === 0)
        .map((image) => image.getAttribute('src') || '(missing src)')
    })
    assert.deepEqual(broken, [])
  })

  await logCheck(`${route.slug}: title and canonical metadata are unique`, async () => {
    assert.equal(await desktop.page.locator('head > title').count(), 1)
    assert.ok((await desktop.page.title()).trim().length > 8)
    assert.equal(await desktop.page.locator('head link[rel="canonical"]').count(), 1)
  })
}

await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(250)

await logCheck('home desktop: header is visible and remains within viewport', async () => {
  const box = await desktop.page.locator('header').boundingBox()
  assert.ok(box)
  assert.ok(box.y >= -1 && box.y + box.height <= 180)
})

await logCheck('home desktop: brand logo is loaded at declared dimensions', async () => {
  const logo = desktop.page.locator('header img[alt="Patisserie Russe"]')
  assert.equal(await logo.count(), 1)
  const dimensions = await logo.evaluate((image) => ({
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    width: image.getBoundingClientRect().width,
    height: image.getBoundingClientRect().height,
  }))
  assert.ok(dimensions.naturalWidth > 0 && dimensions.naturalHeight > 0)
  assert.ok(dimensions.width >= 40 && dimensions.height >= 40)
})

await logCheck('home desktop: all four primary navigation links are visible', async () => {
  const nav = desktop.page.locator('header nav:visible')
  assert.equal(await nav.count(), 1)
  for (const name of ['Главная', 'Архив', 'Галерея', 'О проекте']) {
    assert.ok(await nav.getByRole('link', { name, exact: true }).isVisible())
  }
})

await logCheck('home desktop: primary heading has editorial display scale', async () => {
  const fontSize = await desktop.page.locator('h1:visible').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  assert.ok(fontSize >= 42, `font-size=${fontSize}`)
})

await logCheck('home desktop: categories anchor exists and is not hidden', async () => {
  const categories = desktop.page.locator('#categories')
  assert.equal(await categories.count(), 1)
  await categories.scrollIntoViewIfNeeded()
  assert.ok(await categories.isVisible())
})

await logCheck('home desktop: about anchor exists and is not hidden', async () => {
  const about = desktop.page.locator('#about')
  assert.equal(await about.count(), 1)
  await about.scrollIntoViewIfNeeded()
  assert.ok(await about.isVisible())
})

await logCheck('home desktop: sticky header changes state after scrolling', async () => {
  await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  const before = await desktop.page.locator('header').getAttribute('class')
  await desktop.page.evaluate(() => window.scrollTo(0, 240))
  await desktop.page.waitForTimeout(420)
  const after = await desktop.page.locator('header').getAttribute('class')
  assert.notEqual(after, before)
})

await logCheck('home desktop: theme toggle changes the document theme', async () => {
  await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  const toggle = desktop.page.getByRole('button', { name: /Переключить на (светлую|тёмную) тему/ })
  const before = await desktop.page.locator('html').getAttribute('class')
  await toggle.click()
  const after = await desktop.page.locator('html').getAttribute('class')
  assert.notEqual(after, before)
})

await logCheck('home desktop: theme toggle updates browser theme-color metadata', async () => {
  const toggle = desktop.page.getByRole('button', { name: /Переключить на (светлую|тёмную) тему/ })
  const before = await desktop.page.locator('#theme-color-meta').getAttribute('content')
  await toggle.click()
  const after = await desktop.page.locator('#theme-color-meta').getAttribute('content')
  assert.notEqual(after, before)
})

await logCheck('home desktop: command palette opens from the search control', async () => {
  await desktop.page.getByRole('button', { name: 'Открыть поиск' }).click()
  await desktop.page.getByRole('dialog').waitFor({ state: 'visible' })
  assert.ok(await desktop.page.getByRole('dialog').isVisible())
})

await logCheck('home desktop: command palette focuses its search field', async () => {
  const dialog = desktop.page.getByRole('dialog')
  const input = dialog.getByRole('textbox')
  assert.ok(await input.isVisible())
  assert.equal(await input.evaluate((element) => document.activeElement === element), true)
})

await logCheck('home desktop: command palette returns results for a real query', async () => {
  const dialog = desktop.page.getByRole('dialog')
  const input = dialog.getByRole('textbox')
  await input.fill('круассан')
  await desktop.page.waitForTimeout(350)
  assert.match((await dialog.innerText()).toLowerCase(), /круассан|croissant/)
})

await logCheck('home desktop: Escape closes the command palette', async () => {
  await desktop.page.keyboard.press('Escape')
  await desktop.page.getByRole('dialog').waitFor({ state: 'detached' })
})

await logCheck('home desktop: gallery navigation reaches the materials route', async () => {
  await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  await desktop.page.locator('header nav:visible').getByRole('link', { name: 'Галерея', exact: true }).click()
  await desktop.page.waitForURL((url) => url.pathname === '/materials/')
})

await desktop.page.goto(`${BASE_URL}/materials/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(250)
const cards = desktop.page.locator('.cat-img-card-lux')

await logCheck('materials desktop: at least 150 gallery cards are server-rendered', async () => {
  assert.ok(await cards.count() >= 150)
})

await logCheck('materials desktop: gallery uses at least three columns', async () => {
  const columns = await cards.evaluateAll((elements) => {
    const tops = elements.slice(0, 8).map((element) => Math.round(element.getBoundingClientRect().top))
    const firstTop = tops[0]
    return tops.filter((top) => Math.abs(top - firstTop) <= 2).length
  })
  assert.ok(columns >= 3, `columns=${columns}`)
})

await logCheck('materials desktop: first row cards have consistent geometry', async () => {
  const boxes = await cards.evaluateAll((elements) => elements.slice(0, 4).map((element) => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height, top: rect.top }
  }))
  const widthSpread = Math.max(...boxes.map((box) => box.width)) - Math.min(...boxes.map((box) => box.width))
  const heightSpread = Math.max(...boxes.map((box) => box.height)) - Math.min(...boxes.map((box) => box.height))
  assert.ok(widthSpread <= 2, JSON.stringify(boxes))
  assert.ok(heightSpread <= 2, JSON.stringify(boxes))
})

await logCheck('materials desktop: cards preserve portrait image proportions', async () => {
  const ratio = await cards.first().locator('.cat-card-img-wrap-lux').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return rect.width / rect.height
  })
  assert.ok(ratio > 0.72 && ratio < 0.88, `ratio=${ratio}`)
})

await logCheck('materials desktop: visible card titles remain inside card bounds', async () => {
  const clipped = await cards.evaluateAll((elements) => elements.slice(0, 12).filter((card) => {
    const title = card.querySelector('.cat-card-name-lux')
    if (!(title instanceof HTMLElement)) return true
    const cardRect = card.getBoundingClientRect()
    const titleRect = title.getBoundingClientRect()
    return titleRect.left < cardRect.left - 1 || titleRect.right > cardRect.right + 1 || titleRect.bottom > cardRect.bottom + 1
  }).length)
  assert.equal(clipped, 0)
})

await logCheck('materials desktop: first twelve card images load without fallback breakage', async () => {
  for (let index = 0; index < 12; index += 1) {
    await cards.nth(index).scrollIntoViewIfNeeded()
  }
  await desktop.page.waitForTimeout(500)
  const broken = await cards.locator('img').evaluateAll((images) => images.slice(0, 12).filter((image) => image.naturalWidth === 0).length)
  assert.equal(broken, 0)
})

await logCheck('materials desktop: deliberate hover opens a preview panel', async () => {
  await cards.first().scrollIntoViewIfNeeded()
  await desktop.page.mouse.move(5, 5)
  await cards.first().hover()
  await desktop.page.waitForTimeout(430)
  await desktop.page.locator('#gallery-preview').waitFor({ state: 'visible' })
})

await logCheck('materials desktop: preview panel remains completely inside viewport', async () => {
  const box = await desktop.page.locator('#gallery-preview').boundingBox()
  assert.ok(box)
  assert.ok(box.x >= 0 && box.y >= 0)
  assert.ok(box.x + box.width <= 1440 + 1)
  assert.ok(box.y + box.height <= 1000 + 1)
})

await logCheck('materials desktop: preview panel does not cover the sticky header', async () => {
  const previewBox = await desktop.page.locator('#gallery-preview').boundingBox()
  const headerBox = await desktop.page.locator('header').boundingBox()
  assert.ok(previewBox && headerBox)
  assert.ok(previewBox.y >= headerBox.y + headerBox.height - 1)
})

await logCheck('materials desktop: preview panel has a loaded image and visible title', async () => {
  const preview = desktop.page.locator('#gallery-preview')
  assert.ok((await preview.locator('h2').innerText()).trim().length > 4)
  const image = preview.locator('img')
  assert.ok(await image.isVisible())
  assert.ok(await image.evaluate((element) => element.naturalWidth > 0))
})

await logCheck('materials desktop: preview navigation changes visible content', async () => {
  const preview = desktop.page.locator('#gallery-preview')
  const before = (await preview.locator('h2').innerText()).trim()
  await preview.getByRole('button', { name: 'Следующий материал' }).click()
  const after = (await preview.locator('h2').innerText()).trim()
  assert.notEqual(after, before)
})

await logCheck('materials desktop: preview read link targets an article route', async () => {
  const href = await desktop.page.locator('#gallery-preview').getByRole('link', { name: /Читать материал/ }).getAttribute('href')
  assert.ok(href && /^\/articles\/[^/]+\/$/.test(href), href ?? 'missing href')
})

await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'materials-desktop-preview.png'), fullPage: false })
await desktop.page.keyboard.press('Escape')

await desktop.page.goto(`${BASE_URL}/articles/recipe-kouglof/`, { waitUntil: 'networkidle' })
await desktop.page.waitForTimeout(300)

await logCheck('article desktop: article heading is visible below the sticky header', async () => {
  const heading = await desktop.page.locator('h1:visible').boundingBox()
  const header = await desktop.page.locator('header').boundingBox()
  assert.ok(heading && header)
  assert.ok(heading.y >= header.y + header.height - 1)
})

await logCheck('article desktop: main content contains substantial editorial text', async () => {
  const text = (await desktop.page.locator('main').innerText()).replace(/\s+/g, ' ').trim()
  assert.ok(text.length >= 2500, `length=${text.length}`)
})

await logCheck('article desktop: body copy uses a readable base font size', async () => {
  const paragraph = desktop.page.locator('main p:visible').first()
  const fontSize = await paragraph.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  assert.ok(fontSize >= 16, `font-size=${fontSize}`)
})

await logCheck('article desktop: paragraphs use comfortable line height', async () => {
  const paragraph = desktop.page.locator('main p:visible').first()
  const metrics = await paragraph.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
    }
  })
  assert.ok(metrics.lineHeight / metrics.fontSize >= 1.35, JSON.stringify(metrics))
})

await logCheck('article desktop: heading hierarchy contains section headings', async () => {
  assert.ok(await desktop.page.locator('main h2:visible, main h3:visible').count() >= 2)
})

await logCheck('article desktop: visible content images decode successfully', async () => {
  const images = desktop.page.locator('main img:visible')
  const count = await images.count()
  assert.ok(count >= 1)
  const broken = await images.evaluateAll((items) => items.filter((image) => image.naturalWidth === 0).length)
  assert.equal(broken, 0)
})

await logCheck('article desktop: readable text column does not span the entire viewport', async () => {
  const paragraphBox = await desktop.page.locator('main p:visible').first().boundingBox()
  assert.ok(paragraphBox)
  assert.ok(paragraphBox.width >= 280 && paragraphBox.width <= 1000, JSON.stringify(paragraphBox))
})

await logCheck('article desktop: all visible links have non-empty accessible names', async () => {
  const unnamed = await desktop.page.locator('main a:visible').evaluateAll((links) => links.filter((link) => {
    const label = link.getAttribute('aria-label') || link.textContent || link.querySelector('img')?.getAttribute('alt') || ''
    return label.trim().length === 0
  }).length)
  assert.equal(unnamed, 0)
})

await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'article-desktop.png'), fullPage: false })

await desktop.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-desktop-dark.png'), fullPage: false })
await desktop.page.getByRole('button', { name: /Переключить на (светлую|тёмную) тему/ }).click()
await desktop.page.waitForTimeout(180)
await desktop.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-desktop-light.png'), fullPage: false })

const mobile = await createObservedPage({
  viewport: { width: 390, height: 844 },
  colorScheme: 'dark',
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
})

await mobile.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
await mobile.page.waitForTimeout(250)

await logCheck('home mobile: page has no horizontal overflow at 390px', async () => {
  const size = await mobile.page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
  assert.ok(size[0] <= size[1] + 2, JSON.stringify(size))
})

await logCheck('home mobile: desktop navigation is hidden', async () => {
  assert.equal(await mobile.page.locator('header nav:visible').count(), 0)
})

await logCheck('home mobile: menu trigger is visible and exposes collapsed state', async () => {
  const trigger = mobile.page.getByRole('button', { name: 'Открыть меню' })
  assert.ok(await trigger.isVisible())
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
})

await logCheck('home mobile: header action controls meet minimum touch size', async () => {
  const controls = mobile.page.locator('header button:visible')
  const undersized = await controls.evaluateAll((elements) => elements.filter((element) => {
    const rect = element.getBoundingClientRect()
    return rect.width < 40 || rect.height < 40
  }).map((element) => ({ label: element.getAttribute('aria-label'), rect: element.getBoundingClientRect().toJSON() })))
  assert.deepEqual(undersized, [])
})

await logCheck('home mobile: logo and action controls do not overlap', async () => {
  const overlap = await mobile.page.evaluate(() => {
    const logo = document.querySelector('header a[href="/"]')?.getBoundingClientRect()
    const buttons = [...document.querySelectorAll('header button')].filter((button) => getComputedStyle(button).display !== 'none')
    if (!logo) return true
    return buttons.some((button) => {
      const rect = button.getBoundingClientRect()
      return !(rect.left >= logo.right || rect.right <= logo.left || rect.top >= logo.bottom || rect.bottom <= logo.top)
    })
  })
  assert.equal(overlap, false)
})

await logCheck('home mobile: opening menu creates a modal navigation dialog', async () => {
  await mobile.page.getByRole('button', { name: 'Открыть меню' }).click()
  const menu = mobile.page.getByRole('dialog', { name: 'Навигационное меню' })
  await menu.waitFor({ state: 'visible' })
  assert.equal(await menu.getAttribute('aria-modal'), 'true')
})

await logCheck('home mobile: open menu locks body scrolling', async () => {
  assert.equal(await mobile.page.locator('body').evaluate((element) => element.style.overflow), 'hidden')
})

await logCheck('home mobile: focus moves inside the opened menu', async () => {
  const inside = await mobile.page.getByRole('dialog', { name: 'Навигационное меню' }).evaluate((dialog) => dialog.contains(document.activeElement))
  assert.equal(inside, true)
})

await logCheck('home mobile: menu fits between header and viewport bottom', async () => {
  const menu = await mobile.page.getByRole('dialog', { name: 'Навигационное меню' }).boundingBox()
  const header = await mobile.page.locator('header').boundingBox()
  assert.ok(menu && header)
  assert.ok(menu.y >= header.y + header.height - 2)
  assert.ok(menu.y + menu.height <= 844 + 2)
})

await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-mobile-menu.png'), fullPage: false })

await logCheck('home mobile: Escape closes menu and restores scrolling', async () => {
  await mobile.page.keyboard.press('Escape')
  await mobile.page.getByRole('dialog', { name: 'Навигационное меню' }).waitFor({ state: 'detached' })
  assert.notEqual(await mobile.page.locator('body').evaluate((element) => element.style.overflow), 'hidden')
})

await logCheck('home mobile: command palette fits inside the viewport', async () => {
  await mobile.page.getByRole('button', { name: 'Открыть поиск' }).click()
  const dialog = mobile.page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible' })
  const box = await dialog.boundingBox()
  assert.ok(box)
  assert.ok(box.x >= -1 && box.y >= -1)
  assert.ok(box.x + box.width <= 391)
  assert.ok(box.y + box.height <= 845)
  await mobile.page.keyboard.press('Escape')
})

await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'home-mobile.png'), fullPage: false })

await mobile.page.goto(`${BASE_URL}/materials/`, { waitUntil: 'networkidle' })
await mobile.page.waitForTimeout(250)
const mobileCards = mobile.page.locator('.cat-img-card-lux')

await logCheck('materials mobile: gallery remains one column wide', async () => {
  const first = await mobileCards.nth(0).boundingBox()
  const second = await mobileCards.nth(1).boundingBox()
  assert.ok(first && second)
  assert.ok(second.y >= first.y + first.height - 2)
})

await logCheck('materials mobile: cards fit the viewport without clipping', async () => {
  const boxes = await mobileCards.evaluateAll((elements) => elements.slice(0, 4).map((element) => element.getBoundingClientRect().toJSON()))
  assert.ok(boxes.every((box) => box.x >= -1 && box.x + box.width <= 391), JSON.stringify(boxes))
})

await logCheck('materials mobile: touch interaction never opens hover preview', async () => {
  await mobileCards.first().tap({ position: { x: 10, y: 10 }, noWaitAfter: true })
  await mobile.page.waitForTimeout(500)
  assert.equal(await mobile.page.locator('#gallery-preview').count(), 0)
})

await mobile.page.goto(`${BASE_URL}/materials/`, { waitUntil: 'networkidle' })
await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'materials-mobile.png'), fullPage: false })

await logCheck('materials mobile: tapping a card navigates to its article', async () => {
  const href = await mobile.page.locator('.cat-img-card-lux').first().getAttribute('href')
  assert.ok(href)
  await mobile.page.locator('.cat-img-card-lux').first().tap()
  await mobile.page.waitForURL((url) => url.pathname === href)
})

await logCheck('article mobile: article page has no horizontal overflow', async () => {
  const size = await mobile.page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
  assert.ok(size[0] <= size[1] + 2, JSON.stringify(size))
})

await logCheck('article mobile: heading and first paragraph fit within viewport', async () => {
  const boxes = await Promise.all([
    mobile.page.locator('h1:visible').boundingBox(),
    mobile.page.locator('main p:visible').first().boundingBox(),
  ])
  for (const box of boxes) {
    assert.ok(box)
    assert.ok(box.x >= -1 && box.x + box.width <= 391, JSON.stringify(box))
  }
})

await logCheck('article mobile: body copy remains readable', async () => {
  const metrics = await mobile.page.locator('main p:visible').first().evaluate((element) => {
    const style = getComputedStyle(element)
    return { fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight) }
  })
  assert.ok(metrics.fontSize >= 16)
  assert.ok(metrics.lineHeight / metrics.fontSize >= 1.35)
})

await mobile.page.screenshot({ path: path.join(OUTPUT_DIR, 'article-mobile.png'), fullPage: false })

const tablet = await createObservedPage({
  viewport: { width: 768, height: 1024 },
  colorScheme: 'dark',
  hasTouch: true,
})
await tablet.page.goto(`${BASE_URL}/materials/`, { waitUntil: 'networkidle' })
await tablet.page.waitForTimeout(250)

await logCheck('materials tablet: gallery resolves to two columns', async () => {
  const cards = tablet.page.locator('.cat-img-card-lux')
  const boxes = await cards.evaluateAll((elements) => elements.slice(0, 4).map((element) => element.getBoundingClientRect().toJSON()))
  assert.ok(Math.abs(boxes[0].top - boxes[1].top) <= 2, JSON.stringify(boxes))
  assert.ok(boxes[2].top >= boxes[0].bottom - 2, JSON.stringify(boxes))
})

await logCheck('materials tablet: expanded hover preview remains disabled', async () => {
  await tablet.page.locator('.cat-img-card-lux').first().hover()
  await tablet.page.waitForTimeout(500)
  assert.equal(await tablet.page.locator('#gallery-preview').count(), 0)
})

await logCheck('materials tablet: page has no horizontal overflow', async () => {
  const size = await tablet.page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
  assert.ok(size[0] <= size[1] + 2, JSON.stringify(size))
})

await tablet.page.screenshot({ path: path.join(OUTPUT_DIR, 'materials-tablet.png'), fullPage: false })

await logCheck('desktop run: no uncaught JavaScript errors occurred', async () => {
  assert.deepEqual(desktop.telemetry.pageErrors, [])
})

await logCheck('desktop run: no browser console errors occurred', async () => {
  assert.deepEqual(desktop.telemetry.consoleErrors, [])
})

await logCheck('desktop run: no same-origin requests failed', async () => {
  assert.deepEqual(desktop.telemetry.failedRequests, [])
})

await logCheck('desktop run: no same-origin HTTP 4xx or 5xx responses occurred', async () => {
  assert.deepEqual(desktop.telemetry.badResponses, [])
})

await logCheck('mobile run: no uncaught JavaScript errors occurred', async () => {
  assert.deepEqual(mobile.telemetry.pageErrors, [])
})

await logCheck('mobile run: no browser console errors occurred', async () => {
  assert.deepEqual(mobile.telemetry.consoleErrors, [])
})

await logCheck('mobile run: no same-origin requests failed', async () => {
  assert.deepEqual(mobile.telemetry.failedRequests, [])
})

await logCheck('mobile run: no same-origin HTTP 4xx or 5xx responses occurred', async () => {
  assert.deepEqual(mobile.telemetry.badResponses, [])
})

await logCheck('tablet run: no browser or network errors occurred', async () => {
  assert.deepEqual(tablet.telemetry.pageErrors, [])
  assert.deepEqual(tablet.telemetry.consoleErrors, [])
  assert.deepEqual(tablet.telemetry.failedRequests, [])
  assert.deepEqual(tablet.telemetry.badResponses, [])
})

const report = {
  baseUrl: BASE_URL,
  checks: checkNumber,
  passed: passed.length,
  failed: failures.length,
  screenshots: (await fs.readdir(OUTPUT_DIR)).filter((name) => name.endsWith('.png')).sort(),
  failures,
}
await fs.writeFile(path.join(OUTPUT_DIR, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

await Promise.all([desktop.context.close(), mobile.context.close(), tablet.context.close()])
await browser.close()

if (failures.length > 0) {
  console.error(`\nVisual QA failed: ${passed.length}/${checkNumber} checks passed.`)
  process.exitCode = 1
} else {
  console.log(`\nVisual QA completed: ${passed.length}/${checkNumber} checks passed; ${report.screenshots.length} screenshots captured.`)
}
