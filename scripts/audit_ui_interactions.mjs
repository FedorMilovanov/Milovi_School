import { URL, pathToFileURL } from 'node:url'
/* global document, window, localStorage, Storage, DOMException, getComputedStyle, navigator */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

// Run against a fresh, unmodified build. External services are not UX fixtures.
// UI_AUDIT_OFFLINE=1 stubs Google Fonts explicitly (fallback-font robustness).
// UI_AUDIT_HISTORY_IMAGE can point to the exact remote cover downloaded separately.
const base = (process.env.BASE_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '')
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  } : {}),
})
const failures = []
let checks = 0
const article = '/articles/recipe-kouglof/'
const create = async (options = {}) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', ...options })
  if (process.env.UI_AUDIT_OFFLINE === '1') {
    await context.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, route => route.fulfill({ contentType: 'text/css', body: '' }))
  }
  if (process.env.UI_AUDIT_HISTORY_IMAGE) {
    const bytes = await readFile(process.env.UI_AUDIT_HISTORY_IMAGE)
    await context.route('https://raw.githubusercontent.com/**/patisserie-history-cover-20261107.webp', route => route.fulfill({ contentType: 'image/webp', body: bytes }))
  }
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  return { context, page }
}
const check = async (name, run, options) => {
  checks++
  const { context, page } = await create(options)
  try { await run(page, context); console.log(`✓ ${name}`) }
  catch (error) { failures.push(name); console.error(`✗ ${name}\n${error.stack ?? error}`) }
  finally { await context.close() }
}
const goto = (page, path = article) => page.goto(base + path, { waitUntil: 'networkidle' })
const openSearch = async page => {
  await page.getByRole('button', { name: 'Открыть поиск', exact: true }).first().click()
  await page.getByRole('dialog').waitFor()
}
const inDialog = page => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))

try {
  for (const mode of ['light', 'dark', 'no-js']) {
    await check(`header wordmark never paints into controls: ${mode}`, async (page, context) => {
      if (mode !== 'no-js') await context.addInitScript(theme => localStorage.setItem('theme', theme), mode)
      await goto(page)
      for (const width of [320, 360, 390, 420, 768, 1024, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        const label = page.locator('header .logo-text-lux')
        const spans = await label.locator(':scope > span').evaluateAll(elements => elements.filter(el => el.getClientRects().length).map(el => ({
          width: el.clientWidth,
          clipped: el.scrollWidth > el.clientWidth + 1,
          overflow: getComputedStyle(el).overflowX,
          ellipsis: getComputedStyle(el).textOverflow,
        })))
        assert.ok(spans.every(span => span.width >= 24), `brand has no usable text space at ${width}`)
        assert.ok(spans.every(span => !span.clipped || (span.overflow === 'hidden' && span.ellipsis === 'ellipsis')), `wordmark paints outside its assigned width at ${width}`)
        const search = page.getByRole('button', { name: 'Открыть поиск', exact: true }).first()
        assert.ok(await search.evaluate(el => { const box = el.getBoundingClientRect(); return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest('button') === el }))
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth <= 2))
      }
      assert.equal(await page.locator('header .logo-text-lux').getAttribute('title'), 'Pâtisserie Russe')
      assert.match(await page.locator('header a').first().innerText(), /Pâtisserie Russe/)
    }, { javaScriptEnabled: mode !== 'no-js' })
  }
  await check('mobile Escape closes menu, preserves article and restores trigger', async page => {
    await goto(page)
    const trigger = page.getByRole('button', { name: 'Открыть меню', exact: true })
    await trigger.click()
    await page.getByRole('dialog', { name: 'Навигационное меню' }).waitFor()
    assert.ok(await inDialog(page))
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    assert.equal(new URL(page.url()).pathname, article)
    assert.ok(await trigger.evaluate(el => el === document.activeElement))
    assert.equal(await page.locator('[inert]').count(), 0)
  })
  for (const theme of ['dark', 'light']) {
    await check(`normal motion: repeated menu/search cycles restore focus and unlock background in ${theme}`, async (page, context) => {
      await context.addInitScript(theme => localStorage.setItem('theme', theme), theme)
      await goto(page)
      for (let cycle = 0; cycle < 6; cycle++) {
        const menu = page.getByRole('button', { name: 'Открыть меню', exact: true })
        await menu.click()
        await page.getByRole('dialog').waitFor()
        await page.waitForFunction(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
        for (let tab = 0; tab < 12; tab++) {
          await page.keyboard.press(tab % 2 ? 'Shift+Tab' : 'Tab')
          assert.ok(await inDialog(page))
        }
        await page.keyboard.press('Escape')
        await page.getByRole('dialog').waitFor({ state: 'detached' })
        assert.ok(await menu.evaluate(el => el === document.activeElement))
        await openSearch(page)
        await page.getByRole('dialog').locator('input').waitFor()
        assert.ok(await inDialog(page), 'search must own focus as soon as its input is visible')
        await page.keyboard.press('Escape')
        await page.getByRole('dialog').waitFor({ state: 'detached' })
        assert.equal(await page.locator('[inert]').count(), 0)
        assert.equal(await page.evaluate(() => document.body.style.overflow), '')
        assert.ok(await page.getByRole('button', { name: 'Открыть поиск', exact: true }).evaluate(el => el === document.activeElement))
      }
      assert.equal(new URL(page.url()).pathname, article)
    }, { reducedMotion: 'no-preference' })
  }
  await check('short/zoom-equivalent viewport: menu is scrollable and closes by keyboard', async page => {
    await goto(page)
    await page.getByRole('button', { name: 'Открыть меню', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const geometry = await dialog.evaluate(el => ({ client: el.clientHeight, scroll: el.scrollHeight, bottom: el.getBoundingClientRect().bottom }))
    assert.ok(geometry.bottom <= 402)
    await dialog.getByRole('button', { name: 'Закрыть меню', exact: true }).focus()
    await page.keyboard.press('Enter')
    await dialog.waitFor({ state: 'detached' })
  }, { viewport: { width: 320, height: 400 } })
  await check('search Enter on Close never opens a result', async page => {
    await goto(page)
    await openSearch(page)
    await page.getByRole('dialog').locator('input').fill('круассан')
    const close = page.getByRole('button', { name: 'Закрыть поиск', exact: true })
    await close.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    assert.equal(new URL(page.url()).pathname, article)
    assert.ok(await page.getByRole('button', { name: 'Открыть поиск', exact: true }).evaluate(el => el === document.activeElement))
  })
  await check('search Enter on filter uses filter; Enter in input opens result', async page => {
    await goto(page)
    await openSearch(page)
    const dialog = page.getByRole('dialog')
    const input = dialog.locator('input')
    await input.fill('круассан')
    const recipes = dialog.getByRole('button', { name: /RCРецепты/ })
    await recipes.focus()
    await page.keyboard.press('Enter')
    assert.ok(await dialog.isVisible())
    assert.equal(new URL(page.url()).pathname, article)
    await input.focus()
    await page.keyboard.press('Enter')
    await page.waitForURL(url => url.pathname !== article)
    assert.ok(new URL(page.url()).pathname.startsWith('/articles/'))
  })
  await check('loading/error/retry keep focus contained and restore it after close', async (page, context) => {
    let failed = true
    await context.route('**/article-index.json', async route => {
      if (failed) { await new Promise(resolve => globalThis.setTimeout(resolve, 350)); await route.fulfill({ status: 503, body: 'unavailable' }) }
      else await route.continue()
    })
    await goto(page)
    await openSearch(page)
    assert.ok(await inDialog(page))
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
    await page.getByRole('alert').waitFor()
    for (let n = 0; n < 7; n++) { await page.keyboard.press('Tab'); assert.ok(await inDialog(page)) }
    await page.keyboard.press('Shift+Tab')
    assert.ok(await inDialog(page))
    failed = false
    await page.getByRole('button', { name: 'Повторить загрузку' }).click()
    await page.getByRole('dialog').locator('input').waitFor()
    assert.ok(await inDialog(page))
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    assert.equal(await page.locator('[inert]').count(), 0)
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
  })
  await check('invalid search payload stays in recoverable error dialog', async (page, context) => {
    await context.route('**/article-index.json', route => route.fulfill({ contentType: 'application/json', body: '[{"id":"x","title":"Incomplete"}]' }))
    await goto(page)
    await openSearch(page)
    await page.getByRole('alert').waitFor()
    assert.ok(await inDialog(page))
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    assert.equal(new URL(page.url()).pathname, article)
  })
  await check('lazy search chunk failure preserves the article and offers recovery', async (page, context) => {
    await context.route('**/CommandPalette.*.js', route => route.abort())
    await goto(page)
    await openSearch(page)
    await page.getByRole('alert').waitFor()
    assert.equal(await page.locator('main h1').count(), 1)
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    assert.equal(await page.locator('[inert]').count(), 0)
  })
  await check('failed primary and fallback images never create a retry loop', async (page, context) => {
    let releasePrimary
    const hydrated = new Promise(resolve => { releasePrimary = resolve })
    let fallbackRequests = 0
    await context.route('**/images/articles/recipe-kouglof.webp', async route => {
      await hydrated
      await route.fulfill({ status: 503, body: 'Primary image unavailable' })
    })
    await context.route(/\/_astro\/pastry-chef\.[^/]+\.jpg$/, route => {
      fallbackRequests++
      return route.fulfill({ status: 503, body: 'Fallback unavailable' })
    })
    await page.goto(base + article, { waitUntil: 'domcontentloaded' })
    // A real theme interaction ensures React has attached the image handler.
    await page.getByRole('button', { name: /Переключить на .*тему/ }).click()
    releasePrimary()
    await page.waitForFunction(() => {
      const image = document.querySelector('img[fetchpriority="high"]')
      return image?.complete && image.getAttribute('src').includes('/_astro/pastry-chef.')
    })
    await page.waitForTimeout(400)
    assert.equal(fallbackRequests, 1, 'a failed fallback must not request itself repeatedly')
    assert.equal(await page.locator('h1').count(), 1)
    assert.ok((await page.locator('.article-body').innerText()).length > 2000)
  })
  await check('an image that failed before hydration recovers to a working fallback', async (page, context) => {
    await context.route('**/images/articles/recipe-kouglof.webp', route => route.fulfill({ status: 503, body: 'Early image failure' }))
    await context.route('**/_astro/*.js', async route => {
      await new Promise(resolve => globalThis.setTimeout(resolve, 350))
      await route.continue()
    })
    await goto(page)
    await page.waitForFunction(() => {
      const image = document.querySelector('img[fetchpriority="high"]')
      return image?.complete && image.naturalWidth > 0 && image.getAttribute('src').includes('/_astro/pastry-chef.')
    })
    assert.equal(await page.locator('h1').count(), 1)
  })
  await check('source URLs with parentheses survive SSR exactly', async page => {
    const cases = [
      ['financier-histoire', 'https://fr.wikipedia.org/wiki/Financier_(p%C3%A2tisserie)'],
      ['millefeuille-histoire', 'https://commons.wikimedia.org/wiki/File:The_modern_cook_(IA_moderncook02lach).pdf'],
      ['stohrer-1730', 'https://commons.wikimedia.org/wiki/File:The_modern_cook_(IA_moderncook02lach).pdf'],
    ]
    for (const [id, href] of cases) {
      await goto(page, `/articles/${id}/`)
      assert.ok(await page.locator('.article-body a').evaluateAll((links, expected) => links.some(link => link.getAttribute('href') === expected), href))
    }
  })
  await check('reload preserves native reading position; related navigation preserves source progress', async page => {
    await goto(page)
    await page.evaluate(() => window.scrollTo(0, 3000))
    await page.waitForTimeout(2100)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(200)
    assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - 3000) < 150)
    const link = page.locator('a[href^="/articles/"]').filter({ has: page.locator('h3') }).last()
    if (await link.count()) {
      await link.scrollIntoViewIfNeeded()
      const before = await page.evaluate(() => window.scrollY)
      await link.click()
      await page.waitForURL(url => url.pathname !== article)
      const saved = await page.evaluate(() => Number(localStorage.getItem('article-progress:recipe-kouglof')))
      assert.ok(saved > before - 200)
    }
  })
  await check('native Back/Forward restores each article position after modal use', async page => {
    await goto(page)
    await openSearch(page)
    await page.getByRole('dialog').locator('input').waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    const related = page.locator('a[href^="/articles/"]').filter({ has: page.locator('h3') }).last()
    await related.scrollIntoViewIfNeeded()
    const sourceY = await page.evaluate(() => window.scrollY)
    await related.click()
    await page.waitForURL(url => url.pathname !== article)
    const targetPath = new URL(page.url()).pathname
    await page.mouse.wheel(0, 1800)
    await page.waitForFunction(() => window.scrollY > 1000)
    const targetY = await page.evaluate(() => window.scrollY)
    await page.goBack({ waitUntil: 'networkidle' })
    assert.equal(new URL(page.url()).pathname, article)
    await page.waitForFunction(y => Math.abs(window.scrollY - y) < 200, sourceY)
    assert.equal(await page.locator('[inert]').count(), 0)
    assert.equal(await page.getByRole('dialog').count(), 0)
    await page.goForward({ waitUntil: 'networkidle' })
    assert.equal(new URL(page.url()).pathname, targetPath)
    await page.waitForFunction(y => Math.abs(window.scrollY - y) < 200, targetY)
    assert.equal(await page.evaluate(() => document.body.style.overflow), '')
  })
  await check('saved progress offers resume; anchor entry wins over saved progress', async (page, context) => {
    await context.addInitScript(() => localStorage.setItem('article-progress:recipe-kouglof', '3000'))
    await goto(page)
    await page.getByRole('button', { name: 'Продолжить с прошлого места' }).click()
    assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - 3000) < 100)
    const id = await page.locator('.article-body h2[id]').last().getAttribute('id')
    await goto(page, article + '#' + id)
    assert.equal(await page.getByRole('button', { name: 'Продолжить с прошлого места' }).count(), 0)
    assert.ok(await page.evaluate(id => { const top = document.getElementById(id).getBoundingClientRect().top; return top >= 0 && top < window.innerHeight }, id))
  })
  await check('storage denial does not crash article/menu/search', async (page, context) => {
    await context.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new DOMException('denied', 'SecurityError') }
      Storage.prototype.setItem = () => { throw new DOMException('denied', 'SecurityError') }
    })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await goto(page)
    await openSearch(page)
    await page.getByRole('dialog').locator('input').fill('крем')
    await page.getByRole('button', { name: 'Закрыть поиск' }).click()
    assert.deepEqual(errors, [])
  })
  await check('desktop focus mode has a persistent exit, including after reload', async page => {
    await goto(page)
    const toggle = page.getByRole('button', { name: 'Режим фокуса', exact: true })
    await toggle.click()
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true')
    assert.ok(await toggle.isVisible())
    assert.ok(await toggle.evaluate(el => el === document.activeElement))
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true')
    await toggle.focus()
    await page.keyboard.press('Enter')
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false')
    assert.ok(await page.locator('.article-ui aside').first().isVisible())
  }, { viewport: { width: 1440, height: 1000 } })
  await check('Escape dismisses focus-mode contents before article navigation', async page => {
    await goto(page)
    await page.getByRole('button', { name: 'Режим фокуса', exact: true }).click()
    const summary = page.locator('summary').filter({ hasText: 'Разделы' })
    await summary.click()
    await page.locator('details[open] button').first().focus()
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('details[open]').count(), 0)
    assert.equal(new URL(page.url()).pathname, article)
    assert.ok(await summary.evaluate(el => el === document.activeElement))
  }, { viewport: { width: 1440, height: 1000 } })
  await check('Escape dismisses mobile contents and restores its trigger', async page => {
    await goto(page)
    const trigger = page.getByRole('button', { name: /^Содержание/ })
    await trigger.click()
    await page.locator('#mobile-toc-list button').first().focus()
    await page.keyboard.press('Escape')
    await page.locator('#mobile-toc-list').waitFor({ state: 'detached' })
    assert.equal(new URL(page.url()).pathname, article)
    assert.ok(await trigger.evaluate(el => el === document.activeElement))
  })
  await check('expanded mobile contents is a valid list and transfers keyboard focus to heading', async page => {
    await goto(page)
    await page.getByRole('button', { name: /^Содержание/ }).click()
    const list = page.locator('#mobile-toc-list ol')
    assert.ok(await list.locator(':scope > li').count() > 2)
    await list.locator('button').first().focus()
    await page.keyboard.press('Enter')
    await page.locator('#mobile-toc-list').waitFor({ state: 'detached' })
    await page.waitForFunction(() => ['H2', 'H3'].includes(document.activeElement.tagName))
    assert.equal(new URL(page.url()).pathname, article)
  })
  await check('touch reading controls expose pressed state and bookmarks survive reload', async page => {
    await goto(page)
    const save = page.getByRole('button', { name: 'Сохранить', exact: true })
    await save.tap()
    assert.equal(await page.getByRole('button', { name: 'Сохранено', exact: true }).getAttribute('aria-pressed'), 'true')
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.getByRole('button', { name: 'Сохранено', exact: true }).getAttribute('aria-pressed'), 'true')
    const bigger = page.getByRole('button', { name: 'Больше', exact: true })
    await bigger.tap()
    assert.equal(await page.getByRole('button', { name: 'Меньше', exact: true }).getAttribute('aria-pressed'), 'true')
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.getByRole('button', { name: 'Меньше', exact: true }).getAttribute('aria-pressed'), 'true')
    assert.ok(await page.locator('html').evaluate(el => el.classList.contains('pref-large-text')))
  }, { isMobile: true, hasTouch: true })
  for (const [errorName, initiallySaved] of [['QuotaExceededError', false], ['SecurityError', true]]) {
    await check(`bookmark ${errorName}: no false success or optimistic state`, async (page, context) => {
      await context.addInitScript(({ errorName, initiallySaved }) => {
        if (initiallySaved) localStorage.setItem('article-saved:recipe-kouglof', 'true')
        Storage.prototype.setItem = function () { throw new DOMException('Storage write denied', errorName) }
      }, { errorName, initiallySaved })
      await goto(page)
      const button = page.getByRole('button', { name: initiallySaved ? 'Сохранено' : 'Сохранить', exact: true })
      await button.click()
      await page.getByRole('status').filter({ hasText: 'Не удалось изменить закладки' }).waitFor()
      assert.equal(await button.getAttribute('aria-pressed'), String(initiallySaved))
      assert.equal(await page.getByText(initiallySaved ? 'Убрано из закладок' : 'Добавлено в закладки', { exact: true }).count(), 0)
      // The header control uses the same persistence result as the mobile bar.
      await page.getByRole('button', { name: initiallySaved ? 'Убрать из закладок' : 'Добавить в закладки', exact: true }).click()
      assert.equal(await button.getAttribute('aria-pressed'), String(initiallySaved))
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal(await button.getAttribute('aria-pressed'), String(initiallySaved))
    })
  }
  await check('bookmarks synchronize across tabs without moving reading position', async (page, context) => {
    await goto(page)
    const other = await context.newPage()
    await goto(other)
    await other.mouse.wheel(0, 1500)
    await other.waitForFunction(() => window.scrollY > 1000)
    const before = await other.evaluate(() => window.scrollY)
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
    await other.getByRole('button', { name: 'Сохранено', exact: true }).waitFor()
    assert.ok(Math.abs(await other.evaluate(() => window.scrollY) - before) < 5)
    await other.getByRole('button', { name: 'Сохранено', exact: true }).click()
    await page.getByRole('button', { name: 'Сохранить', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
    await other.getByRole('button', { name: 'Сохранено', exact: true }).waitFor()
    await other.evaluate(() => localStorage.clear())
    await page.getByRole('button', { name: 'Сохранить', exact: true }).waitFor()
  })
  await check('arrow-key result is announced while native result buttons remain operable', async page => {
    await goto(page)
    await openSearch(page)
    const input = page.getByRole('dialog').locator('input')
    await input.fill('крем')
    const announcement = page.locator('[data-search-active-announcement]')
    await page.waitForFunction(() => document.querySelector('[data-search-active-announcement]')?.textContent.includes('Enter'))
    const before = await announcement.innerText()
    await input.press('ArrowDown')
    await page.waitForFunction(previous => document.querySelector('[data-search-active-announcement]')?.textContent !== previous, before)
    const after = await announcement.innerText()
    assert.match(after, /2 из/)
    assert.ok(await input.evaluate(el => el === document.activeElement))
    assert.equal(await input.getAttribute('aria-controls'), 'cp-results')
    assert.equal(await page.getByRole('region', { name: 'Результаты поиска' }).count(), 1)
    const activeTitle = await page.locator('#cp-item-1 p').first().innerText()
    assert.ok(after.includes(activeTitle))
    await page.locator('#cp-item-1').focus()
    await page.keyboard.press('Enter')
    await page.waitForURL(url => url.pathname !== article)
  })
  await check('clipboard denial gives an accessible failure message, not silent success', async (page, context) => {
    await context.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new DOMException('denied', 'NotAllowedError') } } }))
    await goto(page)
    await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).first().click()
    await page.getByRole('status').filter({ hasText: 'Не удалось скопировать' }).waitFor()
    assert.equal(await page.getByText('Ссылка скопирована', { exact: true }).count(), 0)
  })
  for (const outcome of ['NotAllowedError', 'AbortError', 'success']) {
    await check(`native share ${outcome}: accurate accessible feedback`, async (page, context) => {
      await context.addInitScript(outcome => {
        Object.defineProperty(navigator, 'share', { configurable: true, value: async data => {
          window.sessionStorage.setItem('ui-audit-share', JSON.stringify(data))
          if (outcome !== 'success') throw new DOMException('Share test outcome', outcome)
        } })
      }, outcome)
      await goto(page)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.getByRole('button', { name: 'Поделиться', exact: true }).click()
      const shared = await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('ui-audit-share')))
      assert.equal(shared.url, base + article)
      assert.ok(shared.title.length > 0)
      if (outcome === 'NotAllowedError') {
        await page.getByRole('status').filter({ hasText: 'Не удалось поделиться' }).waitFor()
        assert.equal(await page.getByText('Поделились статьёй', { exact: true }).count(), 0)
      } else if (outcome === 'success') {
        await page.getByRole('status').filter({ hasText: 'Поделились статьёй' }).waitFor()
      } else {
        assert.equal((await page.getByRole('status').allTextContents()).join('').trim(), '')
      }
      assert.deepEqual(errors, [])
    })
  }
  await check('article and policy remain readable without JS; source links still intact', async page => {
    await goto(page)
    assert.ok((await page.locator('.article-body').innerText()).length > 2000)
    assert.equal(await page.locator('h1').evaluate(el => getComputedStyle(el).opacity), '1')
    await goto(page, '/privacy/')
    assert.ok((await page.locator('.policy-copy').innerText()).length > 500)
  }, { javaScriptEnabled: false })
  for (const javaScriptEnabled of [false, true]) {
    await check(`trust-page titles reflow at narrow widths, JS=${javaScriptEnabled}`, async page => {
      for (const path of ['/privacy/', '/editorial-policy/', '/sources/', '/corrections/']) {
        await goto(page, path)
        for (const width of [320, 360, 390]) {
          await page.setViewportSize({ width, height: 800 })
          const geometry = await page.locator('h1').evaluate(el => ({
            pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
            titleOverflow: el.scrollWidth - el.clientWidth,
          }))
          assert.ok(geometry.pageOverflow <= 2, `${path} at ${width}: page overflow ${geometry.pageOverflow}`)
          assert.ok(geometry.titleOverflow <= 2, `${path} at ${width}: title overflow ${geometry.titleOverflow}`)
        }
      }
    }, { javaScriptEnabled, viewport: { width: 320, height: 800 } })
  }
  await check('policy headings follow explicit theme, not OS preference', async (page, context) => {
    for (const theme of ['dark', 'light']) {
      await context.addInitScript(theme => localStorage.setItem('theme', theme), theme)
      await goto(page, '/privacy/')
      const color = await page.locator('.policy-copy h2').first().evaluate(el => getComputedStyle(el).color)
      assert.equal(color, theme === 'dark' ? 'rgb(245, 245, 244)' : 'rgb(28, 25, 23)')
    }
  }, { colorScheme: 'dark' })
  await check('recipe adaptation is prose, not a quotation disclaimer; genuine notices remain', async page => {
    for (const id of ['recipe-tarte-tropezienne', 'recipe-clafoutis-cerises', 'ansel-cronut-origin', 'recipe-paris-brest-classique', 'ansel-time', 'recipe-tarte-citron-meringuee', 'perret-madeleine-18h', 'lignac-equinoxe', 'grolet-raspberry-rose', 'perret-madeleine']) {
      await goto(page, `/articles/${id}/`)
      const notices = await page.locator('aside.my-10.rounded-lg').allTextContents()
      assert.ok(notices.every(text => /смысловое переложение|не дословн/i.test(text)), `${id}: recipe adaptation rendered as a disclaimer`)
    }
    await goto(page, '/articles/recipe-macarons-herme/')
    assert.ok(await page.locator('aside.my-10.rounded-lg').filter({ hasText: 'не дословная цитата' }).count() > 0)
  })
  if (process.env.UI_AUDIT_AXE_MODULE) {
    const { default: AxeBuilder } = await import(pathToFileURL(process.env.UI_AUDIT_AXE_MODULE).href)
    for (const theme of ['dark', 'light']) {
      await check(`axe: article, search and menu in ${theme} theme`, async (page, context) => {
        await context.addInitScript(theme => localStorage.setItem('theme', theme), theme)
        await goto(page)
        const audit = async name => {
          await page.waitForTimeout(250)
          const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
          assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.html) })), [], name)
        }
        await audit('article')
        await page.getByRole('button', { name: /^Содержание/ }).click()
        await audit('expanded contents')
        await page.getByRole('button', { name: /^Содержание/ }).click()
        await openSearch(page)
        await page.getByRole('dialog').locator('input').waitFor()
        await audit('idle search')
        await page.getByRole('dialog').locator('input').fill('крем')
        await audit('search results')
        await page.getByRole('button', { name: 'Закрыть поиск' }).click()
        await page.getByRole('button', { name: 'Открыть меню', exact: true }).click()
        await audit('menu')
      })
    }
  } else console.log('axe not requested; set UI_AUDIT_AXE_MODULE to an installed @axe-core/playwright entry point')
  const index = JSON.parse(await readFile(new URL('../dist/article-index.json', import.meta.url), 'utf8'))
  await check('article corpus: no horizontal page overflow or JS crashes at 320/360 CSS px', async page => {
    const ids = process.env.UI_AUDIT_FULL === '1' ? index.map(item => item.id) : ['recipe-millefeuille-inverser', 'recipe-croissant-poilane', 'recipe-pecan-chocolate-creme-brulee', 'cuisine-fond-brun']
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    for (const [position, id] of ids.entries()) {
      if (position && position % 25 === 0) console.log(`  corpus progress: ${position}/${ids.length}`)
      await goto(page, `/articles/${id}/`)
      for (const width of [320, 360]) {
        await page.setViewportSize({ width, height: 800 })
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        assert.ok(overflow <= 2, `${id} at ${width}: overflow ${overflow}px`)
      }
    }
    assert.deepEqual(errors, [])
    console.log(`  corpus checked: ${ids.length} articles × 2 widths`)
  })
} finally { await browser.close() }
console.log(`UI browser audit: ${checks - failures.length}/${checks} passed. External fonts ${process.env.UI_AUDIT_OFFLINE === '1' ? 'stubbed explicitly' : 'not stubbed'}.`)
if (failures.length) process.exitCode = 1
