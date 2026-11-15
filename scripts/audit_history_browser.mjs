import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '')
const output = path.resolve(process.env.VISUAL_QA_DIR ?? 'artifacts/visual-qa')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
let checks = 0

try {
  for (const variant of [
    { name: 'desktop', width: 1440, height: 1000, reducedMotion: 'no-preference' },
    { name: 'tablet', width: 768, height: 1024, reducedMotion: 'reduce' },
    { name: 'mobile', width: 390, height: 844, reducedMotion: 'reduce' },
  ]) {
    const context = await browser.newContext({
      viewport: { width: variant.width, height: variant.height },
      colorScheme: 'dark',
      reducedMotion: variant.reducedMotion,
      ...(variant.name === 'mobile' ? { isMobile: true, hasTouch: true } : {}),
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('response', (response) => {
      if (response.url().startsWith(base) && response.status() >= 400) {
        errors.push(response.status() + ' ' + response.url())
      }
    })

    const response = await page.goto(base + '/history/', { waitUntil: 'domcontentloaded' })
    assert.equal(response?.status(), 200, variant.name + ': route does not return 200')
    assert.equal(await page.locator('main:visible').count(), 1, variant.name + ': one main required')
    assert.equal(await page.locator('h1:visible').count(), 1, variant.name + ': one H1 required')
    assert.ok((await page.locator('h1').innerText()).includes('История'), variant.name + ': wrong headline')
    assert.equal(await page.locator('head link[rel="canonical"]').getAttribute('href'), 'https://french.milovicake.ru/history/')
    const hrefs = await page.locator('.history-room a[href^="/articles/"]').evaluateAll((elements) => elements.map((element) => element.getAttribute('href')))
    const unique = new Set(hrefs)
    assert.ok(unique.size >= 19, variant.name + ': history routes missing')
    assert.ok(hrefs.every((href) => /^\/articles\/[a-z0-9-]+\/$/.test(href)), variant.name + ': invalid article hrefs')
    assert.equal(await page.locator('section#profession, section#desserts, section#culture').count(), 3)
    const geometry = await page.evaluate(() => ({
      scrollWidth: globalThis.document.documentElement.scrollWidth,
      viewportWidth: globalThis.document.documentElement.clientWidth,
      duplicatedIds: (() => {
        const ids = [...globalThis.document.querySelectorAll('[id]')].map((el) => el.id)
        return ids.filter((id, index) => ids.indexOf(id) !== index)
      })(),
    }))
    assert.ok(geometry.scrollWidth <= geometry.viewportWidth + 2, variant.name + ': horizontal overflow ' + JSON.stringify(geometry))
    assert.deepEqual(geometry.duplicatedIds, [], variant.name + ': duplicate HTML ids')
    const hero = page.locator('.history-room article img').first()
    await hero.scrollIntoViewIfNeeded()
    await hero.evaluate(async (image) => { await image.decode() })
    // The feature image is served through srcSet, so "naturalWidth >= 1200" (the old
    // full-size bitmap) is not the invariant anymore. What must hold is that the image
    // actually loaded and that the candidate the browser picked is not below the box it
    // covers - a placeholder, a 404 or a thumbnail in the feature slot all still fail.
    // `naturalWidth` is density-corrected once srcSet+sizes are in play (a 480 px file
    // reports ~864 CSS px), so it cannot tell a thumbnail from a full-size bitmap. Decode
    // the winning candidate in a detached Image to get its real pixel width.
    const heroImage = await hero.evaluate(async (image) => {
      const probe = new globalThis.Image()
      probe.src = image.currentSrc
      await probe.decode()
      return {
        currentSrc: image.currentSrc,
        servedWidth: probe.naturalWidth,
        renderedWidth: image.getBoundingClientRect().width,
        dpr: globalThis.devicePixelRatio,
      }
    })
    assert.ok(heroImage.currentSrc, variant.name + ': feature image has no source ' + JSON.stringify(heroImage))
    assert.ok(heroImage.servedWidth > 0, variant.name + ': feature image failed to load ' + JSON.stringify(heroImage))
    assert.ok(
      heroImage.servedWidth + 1 >= heroImage.renderedWidth * heroImage.dpr,
      variant.name + ': feature image is under-sampled for its slot ' + JSON.stringify(heroImage),
    )
    await page.screenshot({ path: path.join(output, 'history-' + variant.name + '.png'), fullPage: false })
    assert.deepEqual(errors, [], variant.name + ': browser errors')
    checks += 12

    if (variant.name === 'mobile') {
      const nav = page.getByRole('button', { name: 'Открыть меню' })
      await nav.click()
      const link = page.getByRole('dialog', { name: 'Навигационное меню' }).getByRole('link', { name: 'История' })
      assert.ok(await link.isVisible(), 'mobile history link missing')
      await page.keyboard.press('Escape')
      await page.getByRole('dialog', { name: 'Навигационное меню' }).waitFor({ state: 'detached', timeout: 2500 })
      checks += 2
    }
    await context.close()
  }
  console.log('OK: history visual/accessibility/browser QA, ' + checks + ' assertions')
} finally {
  await browser.close()
}
