/* global caches, location, navigator */
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4174').replace(/\/$/, '')
const CHROMIUM_EXECUTABLE_PATH = process.env.CHROMIUM_EXECUTABLE_PATH
const launchOptions = { headless: true }
if (CHROMIUM_EXECUTABLE_PATH) {
  launchOptions.executablePath = CHROMIUM_EXECUTABLE_PATH
  launchOptions.args = ['--no-sandbox', '--disable-dev-shm-usage']
}

const browser = await chromium.launch(launchOptions)
try {
  const context = await browser.newContext({ serviceWorkers: 'allow' })
  try {
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/articles/recipe-kouglof/`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
    })
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(async () => Boolean(
      await caches.match(`${location.origin}/articles/recipe-kouglof/`),
    ))
    const cachedHeading = await page.locator('h1').first().innerText()
    assert.ok(cachedHeading.trim(), 'the visited article must have a real heading before it is cached')

    await context.setOffline(true)
    const response = await page.goto(`${BASE_URL}/articles/recipe-canele/`, { waitUntil: 'domcontentloaded' })
    assert.equal(response?.status(), 503, 'uncached offline navigation must return 503')
    assert.equal(await page.locator('h1').innerText(), 'Нет соединения')
    assert.match(await page.locator('main').innerText(), /страница ещё не сохранена/)

    const cachedResponse = await page.goto(`${BASE_URL}/articles/recipe-kouglof/`, { waitUntil: 'domcontentloaded' })
    assert.equal(cachedResponse?.status(), 200, 'a previously visited article must remain available offline')
    assert.equal(await page.locator('h1').first().innerText(), cachedHeading, 'offline cache hit must preserve the exact article, not the app shell')
    console.log('Service-worker offline navigation returns 503 for an uncached route and preserves exact cached article hits.')
  } finally {
    await context.close()
  }
} finally {
  await browser.close()
}
