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

// ── No-JS contract (browser companion of scripts/audit_no_js.py) ────────────
// The static audit proves the markup carries the content; this proves a real
// engine renders it when scripts never run. framer-motion `initial` styles are
// the recurring regression: they are serialized into the SSR HTML, so a hidden
// headline looks fine in CI (JS on) and invisible for no-JS readers.
{
  const noJsContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
    javaScriptEnabled: false,
  })
  const noJsRoutes = [
    ['home', '/', 400],
    ['canon', '/canon/', 1200],
    ['materials', '/materials/', 1500],
    ['history', '/history/', 600],
  ]

  for (const [slug, route, minWords] of noJsRoutes) {
    const page = await noJsContext.newPage()
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load' })
    const state = await page.evaluate(() => {
      const h1 = document.querySelector('main h1') ?? document.querySelector('h1')
      const style = h1 ? getComputedStyle(h1) : null
      return {
        jsMarker: document.documentElement.classList.contains('js'),
        heading: h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '',
        opacity: style ? Number.parseFloat(style.opacity) : 0,
        visibility: style ? style.visibility : 'missing',
        words: (document.body.textContent ?? '').split(/\s+/).filter(Boolean).length,
      }
    })

    await check(`no-js ${slug}: html.js marker is absent`, async () => assert.equal(state.jsMarker, false))
    await check(`no-js ${slug}: h1 is non-empty and fully opaque`, async () => {
      assert.ok(state.heading.length > 0, 'empty h1 without JS')
      assert.ok(state.opacity >= 0.99, `h1 opacity ${state.opacity} without JS`)
      assert.equal(state.visibility, 'visible')
    })
    await check(`no-js ${slug}: content text is in the document`, async () =>
      assert.ok(state.words >= minWords, `${state.words} words without JS, expected >= ${minWords}`))

    await page.screenshot({ path: path.join(OUTPUT_DIR, `nojs-${slug}.png`) })
    await page.close()
  }

  await noJsContext.close()
}

// ── Oversized raster guard ──────────────────────────────────────────────────
// Shipping a 512x512 / 203 KB PNG to draw a 44 px logo is invisible to every
// unit test and costs every visitor; the ratio catches that class of defect.
//
// Scope: **eagerly loaded** images only (logo, hero, above-the-fold chrome). That
// is where a wrong size is a correctness bug — it is also the LCP surface. Lazy
// content thumbnails are a different problem: the article page serves
// `recipe-tuiles-amandes.webp` at 1672 px into a 411 px related-card slot
// (4.07x), and the gallery serves 1448-1698 px originals into ~336 px cards
// (~6.8 MB on first view). Those need build-time derivatives plus `srcset`, which
// is tracked in the media issue; hiding the ratio behind a higher threshold would
// have made the gate blind to the very regression it exists for, so the claim is
// narrowed to eager images instead of the threshold being raised. Once `srcset`
// lands for cards, drop the `loading` filter and assert over every image.
// `/materials/` is asserted over *every* image, lazy included: it now ships
// 480/960 px derivatives via `srcset` (6784 KB -> 1428 KB on first view), so the
// ratio holds for cards as well and the route no longer needs the eager-only
// exemption. Other routes still assert eagerly loaded images only, because the
// article page's related cards are not wired to the manifest yet.
// The gallery is held to 3x rather than 4x on purpose: with derivatives wired,
// its cards sit at 480/336 = 1.4x, so 3x is still generous, while a card that
// silently falls back to its 1280 px original lands at 3.8x — i.e. the strict
// ratio is what actually proves the `srcset` wiring, where 4x would not notice.
// Thresholds are pinned to the *fixed* system, not to the size of the old violation:
// measured on the shipped markup (real pixels, see below), home tops out at 1.59x,
// /history/ at 1.26x, /materials/ at 1.43x and /canon/ at 2.17x. Slipping back to a
// full-size source lands at 2.12x, 3.35x, 4.98x and 2.90x respectively, so 2x / 2.5x
// catches every one of them while still leaving the fixed state a wide margin.
// The article route stays "eager only, 4x" because its related cards belong to #68.
const RASTER_ROUTES = [
  ['home', '/', true, 2],
  ['canon', '/canon/', true, 2.5],
  ['history', '/history/', true, 2],
  ['materials', '/materials/', true, 2],
  ['article', '/articles/recipe-kouglof/', false, 4],
]
for (const [slug, route, assertLazy, maxRatio] of RASTER_ROUTES) {
  await desktop.page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' })
  // Layout must be settled before the ratio is meaningful: a lazy image measured
  // mid-reflow reports a transient width and looks like a 20x violation.
  await desktop.page.waitForTimeout(400)
  // Lazy images below the fold have not been fetched yet and report no
  // `currentSrc` at all; measuring them would compare the *attribute* `src` and
  // invent violations that no browser ever performs. Sweep the page first, then
  // measure only images that actually loaded.
  await desktop.page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }
    window.scrollTo(0, 0)
  })
  await desktop.page.waitForLoadState('networkidle')
  await desktop.page.waitForTimeout(600)
  // `naturalWidth` is density-corrected as soon as `srcSet`/`sizes` are in play: a
  // 480 px file declared as `24vw` on a 1440 viewport reports 345. Comparing that
  // number to the rendered box only tests the `sizes` declaration against the
  // layout, never the actual pixels. The bytes are read by decoding `currentSrc` in
  // a detached Image.
  const measured = await desktop.page.evaluate(async () => {
    const rows = []
    for (const image of document.images) {
      const box = image.getBoundingClientRect()
      if (!image.complete || image.naturalWidth === 0) continue
      const src = image.currentSrc || image.getAttribute('src') || ''
      if (!src || box.width < 8) continue
      const probe = new globalThis.Image()
      probe.src = src
      let decoded = true
      try {
        await probe.decode()
      } catch {
        decoded = false
      }
      rows.push({
        src,
        lazy: image.loading === 'lazy',
        rendered: Math.round(box.width),
        served: decoded ? probe.naturalWidth : 0,
      })
    }
    return rows
  })
  // This gate is about *wiring*, and only a non-derivative URL proves a miss: an
  // image that still comes straight from its 1280-1672 px original while sitting in
  // a card-sized box. Candidate granularity (a 960 file chosen for a 432 px slot)
  // is the browser's rounding, not a regression, and is left to the byte budget.
  const oversized = measured
    .filter((row) => (assertLazy || !row.lazy)
      && row.served > 0 && row.rendered > 0
      && !row.src.includes('/images/variants/')
      && row.served / row.rendered > maxRatio)
    .map((row) => `${row.src} served=${row.served} rendered=${row.rendered}`)
  await check(
    `${slug}: no ${assertLazy ? '' : 'eagerly loaded '}image is served from its original at >${maxRatio}x its rendered width`,
    async () => assert.deepEqual(oversized, []),
  )

  // The opposite failure is invisible to an oversampling ratio and costs fidelity:
  // once candidates exist, a `sizes` value that understates the slot makes the
  // browser pick a smaller file than the box (the Canon hero went to 0.63x this
  // way). Ten percent of the rendered width is the allowance; anything below is a
  // soft image that no byte budget would flag.
  if (!assertLazy) continue
  const undersized = measured
    .filter((row) => row.served > 0 && row.rendered >= 32 && row.served + 1 < row.rendered * 0.9)
    .map((row) => `${row.src} served=${row.served} rendered=${row.rendered}`)
  await check(
    `${slug}: no image is served below 90% of its rendered width`,
    async () => assert.deepEqual(undersized, []),
  )
}

// ── Search status dialog: modal contract + index validation ──────────────────
// /canon/ fetches /article-index.json the first time search opens. Two failure
// modes are invisible to unit tests and to any happy-path browser pass:
//
//   1. a failed fetch leaves a dialog that *says* `aria-modal="true"` but ignores
//      Escape, lets Tab walk out and does not lock the page behind it — an
//      announcement is not behaviour;
//   2. a partial payload (`[{id, title}]`) was accepted and rendered as a card
//      with an empty category and "· мин" instead of a recoverable error.
//
// Both are fault-injected here so the contract cannot silently rot again.
//
// Every await lives inside a `check()`, so a navigation or selector timeout
// becomes a named failure instead of an uncaught rejection that aborts the run
// without saying which assertion died.
{
  const dialogContext = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'dark' })

  // The site can legitimately have more than one dialog in the DOM: when
  // PUBLIC_GA_ID / PUBLIC_YANDEX_METRIKA_ID are configured (as the workflow
  // does) the analytics consent dialog mounts on load. Scope every assertion to
  // the search status dialog by its own label.
  const SEARCH_DIALOG = '[role="dialog"][aria-labelledby="canon-search-loading-title"]'
  const TRIGGER = 'button[aria-label="Открыть поиск"]'

  const openSearch = async (page) => {
    await page.locator(TRIGGER).first().click({ timeout: 15_000 })
    await page.waitForSelector(SEARCH_DIALOG, { timeout: 15_000 })
  }

  const errorPage = await dialogContext.newPage()
  await check('search 503: page loads with the index endpoint failing', async () => {
    await errorPage.route('**/article-index.json', (route) => route.fulfill({ status: 503, body: 'unavailable' }))
    await errorPage.goto(`${BASE_URL}/canon/`, { waitUntil: 'load' })
    await openSearch(errorPage)
    await errorPage.waitForSelector(`${SEARCH_DIALOG} [role="alert"]`, { timeout: 15_000 })
  })
  await check('search 503: dialog is exactly one and shows an error', async () =>
    assert.equal(await errorPage.locator(SEARCH_DIALOG).count(), 1))
  await check('search 503: focus moves inside the dialog', async () =>
    assert.equal(await errorPage.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null), true))
  await check('search 503: page behind the dialog does not scroll', async () =>
    assert.equal(await errorPage.evaluate(() => document.body.style.overflow), 'hidden'))
  await check('search 503: Tab stays inside the dialog', async () => {
    await errorPage.keyboard.press('Tab')
    assert.equal(await errorPage.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null), true)
  })
  await check('search 503: Escape closes the dialog', async () => {
    await errorPage.keyboard.press('Escape')
    await errorPage.waitForSelector(SEARCH_DIALOG, { state: 'detached', timeout: 5_000 })
    assert.equal(await errorPage.locator(SEARCH_DIALOG).count(), 0)
  })
  await check('search 503: focus returns to the trigger', async () =>
    assert.equal(await errorPage.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Открыть поиск'))
  await check('search 503: scroll lock is released', async () =>
    assert.notEqual(await errorPage.evaluate(() => document.body.style.overflow), 'hidden'))
  await errorPage.close()

  const partialPage = await dialogContext.newPage()
  await check('search partial index: page loads with a truncated payload', async () => {
    await partialPage.route('**/article-index.json', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'recipe-kouglof', title: 'Куглоф' }]),
    }))
    await partialPage.goto(`${BASE_URL}/canon/`, { waitUntil: 'load' })
    await openSearch(partialPage)
    await partialPage.waitForTimeout(1000)
  })
  await check('search partial index: invalid payload surfaces a recoverable error', async () =>
    assert.equal(await partialPage.locator(`${SEARCH_DIALOG} [role="alert"]`).count(), 1))
  await check('search partial index: no half-rendered result card', async () => {
    const text = await partialPage.locator(SEARCH_DIALOG).innerText()
    assert.equal(/·\s*мин/.test(text), false, text.replace(/\n+/g, ' / ').slice(0, 120))
  })
  await partialPage.close()

  const validPage = await dialogContext.newPage()
  await check('search happy path: the real index still opens a usable palette', async () => {
    await validPage.goto(`${BASE_URL}/canon/`, { waitUntil: 'load' })
    await validPage.locator(TRIGGER).first().click({ timeout: 15_000 })
    // Wait for the palette itself, not for "some dialog". The loading dialog
    // (`canon-search-loading-title`) is transient: matching it and reading text a
    // moment later raced with its unmount and made this check flaky. The palette
    // has its own stable label.
    const PALETTE = '[role="dialog"][aria-label="Поиск по материалам"]'
    await validPage.waitForSelector(PALETTE, { state: 'visible', timeout: 20_000 })
    await validPage.waitForTimeout(600)
    assert.equal(await validPage.locator(`${PALETTE} [role="alert"]`).count(), 0)
    const text = await validPage.locator(PALETTE).innerText()
    assert.ok(text.trim().length > 0, 'empty palette')
    await validPage.close()
  })
  await dialogContext.close()
}

// ── Reveal fail-open ─────────────────────────────────────────────────────────
// `.reveal` starts hidden under `html.js`, and `html.js` only proves that the
// inline pre-paint script ran. If the island that owns the observer never mounts
// (blocked, failed, or throwing bundle), those sections stay `opacity: 0` while
// the marker keeps telling CSS to hide them. Blocking the bundles is the only
// honest way to test it: here the page must recover to visible within the stall
// window instead of serving an invisible section.
{
  const revealContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' })
  const reveal = async (blockBundles) => {
    const page = await revealContext.newPage()
    await page.route('**/*', (route) => route.request().url().startsWith(BASE_URL) ? route.continue() : route.abort())
    if (blockBundles) await page.route('**/_astro/*.js', (route) => route.abort())
    await page.goto(`${BASE_URL}/`, { waitUntil: 'load' })
    await page.waitForTimeout(blockBundles ? 3600 : 1500)
    const state = await page.evaluate(() => {
      const elements = [...document.querySelectorAll('.reveal')]
      return {
        total: elements.length,
        hidden: elements.filter((element) => Number.parseFloat(getComputedStyle(element).opacity) < 0.5).length,
        marker: document.documentElement.classList.contains('js'),
      }
    })
    await page.close()
    return state
  }

  const healthy = await reveal(false)
  await check('reveal: healthy page keeps the animation marker', async () =>
    assert.equal(healthy.marker, true))
  await check('reveal: nothing stays invisible on a healthy page', async () =>
    assert.equal(healthy.hidden, 0, `${healthy.hidden}/${healthy.total} reveal blocks invisible`))

  const blocked = await reveal(true)
  await check('reveal: blocked bundles drop the marker (fail-open)', async () =>
    assert.equal(blocked.marker, false))
  await check('reveal: blocked bundles do not hide content', async () =>
    assert.equal(blocked.hidden, 0, `${blocked.hidden}/${blocked.total} reveal blocks still invisible`))

  await revealContext.close()
}

// ── A broken derivative falls back in one hop ───────────────────────────────
// With a `srcSet` still attached, assigning `src` alone leaves `currentSrc` on the
// failed candidate and every re-selection fires `error` again (retry storm). The
// components must drop the candidates, land on the placeholder, and stop retrying.
{
  const brokenContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const broken = await brokenContext.newPage()
  const hits = new Map()
  await broken.route('**/*', (route) => route.request().url().startsWith(BASE_URL) ? route.continue() : route.abort())
  await broken.route('**/images/variants/cat-recipes-*', (route) => {
    const url = route.request().url()
    hits.set(url, (hits.get(url) ?? 0) + 1)
    return route.fulfill({ status: 404, contentType: 'text/plain', body: 'gone' })
  })
  await broken.goto(`${BASE_URL}/`, { waitUntil: 'load' })
  const tile = broken.locator('.cat-img').first()
  await tile.scrollIntoViewIfNeeded()
  await broken.waitForTimeout(2500)
  const tiles = await broken.evaluate(() => [...document.querySelectorAll('.cat-img')].map((image) => ({
    currentSrc: image.currentSrc || '',
    hasSrcset: image.hasAttribute('srcset'),
    applied: image.dataset.fallbackApplied === '1',
  })))
  const recovered = tiles.filter((entry) => entry.applied)
  const attempts = [...hits.values()].reduce((sum, count) => sum + count, 0)

  await check('image fallback: a broken derivative lands on the placeholder', async () => {
    assert.ok(recovered.length > 0, 'no tile applied the fallback: ' + JSON.stringify(tiles.slice(0, 2)))
    assert.ok(recovered.every((entry) => entry.currentSrc.endsWith('/images/placeholder.svg')), JSON.stringify(recovered))
  })
  await check('image fallback: the failed candidate list is dropped', async () =>
    assert.ok(recovered.every((entry) => !entry.hasSrcset), 'srcset survived the fallback: ' + JSON.stringify(recovered)))
  await check('image fallback: the failure is not retried in a loop', async () =>
    assert.ok(attempts > 0 && attempts <= 4, `broken candidates requested ${attempts} times (expected 1-4)`))

  await brokenContext.close()
}

process.on('unhandledRejection', (error) => {
  const detail = String(error instanceof Error ? error.stack ?? error.message : error)
    .split('\n').filter((line) => line.trim() && !/^\s+at\s/.test(line)).slice(0, 3).join(' | ')
    .replace(/[%\r\n]/g, ' ').replace(/::/g, ':').slice(0, 400)
  console.error(`::error title=visual-qa::${detail}`)
  process.exit(1)
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
  // GitHub turns `::error` workflow commands into check annotations, which are
  // readable through the checks API. Without them a red gate is only diagnosable
  // from the raw job log — and the log link expires and is not always reachable.
  for (const failure of failures) {
    const detail = (failure.message ?? '')
      .split('\n')
      .filter((line) => line.trim().length > 0 && !/^\s+at\s/.test(line))
      .slice(0, 4)
      .join(' | ')
    const clean = (value) => value.replace(/[%\r\n]/g, ' ').replace(/::/g, ':').slice(0, 400)
    console.error(`::error title=${failure.id} ${clean(failure.name)}::${clean(detail || 'failed')}`)
  }
  console.error(`\nVisual QA failed: ${passed.length}/${number} checks passed.`)
  process.exitCode = 1
} else {
  console.log(`\nVisual QA completed: ${passed.length}/${number} checks passed; ${screenshots.length} screenshots captured.`)
}
