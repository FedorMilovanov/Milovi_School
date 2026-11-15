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

    await context.setOffline(true)
    const response = await page.goto(`${BASE_URL}/articles/recipe-canele/`, { waitUntil: 'domcontentloaded' })
    assert.equal(response?.status(), 503, 'uncached offline navigation must return 503')
    assert.equal(await page.locator('h1').innerText(), 'Нет соединения')
    assert.match(await page.locator('main').innerText(), /страница ещё не сохранена/)
    console.log('Service-worker offline navigation returns the dedicated 503 page, not the homepage shell.')
  } finally {
    await context.close()
  }
} finally {
  await browser.close()
}
