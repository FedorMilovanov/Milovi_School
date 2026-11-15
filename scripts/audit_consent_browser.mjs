/* global URL, document, localStorage, window */
import { chromium } from 'playwright'

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4174').replace(/\/$/, '')
const CHROMIUM_EXECUTABLE_PATH = process.env.CHROMIUM_EXECUTABLE_PATH
const STUB_EXTERNAL_TEST_ENDPOINTS = process.env.STUB_EXTERNAL_TEST_ENDPOINTS === '1'
const CONSENT_KEY = 'milovi_school_analytics_consent_v1'
const ANALYTICS_URL = /googletagmanager\.com|google-analytics\.com|mc\.yandex\.ru|metrika\.yandex/i
const TEST_ENDPOINT_URL = /^(?:https:\/\/)?(?:www\.googletagmanager\.com|www\.google-analytics\.com|mc\.yandex\.ru|fonts\.googleapis\.com|fonts\.gstatic\.com)(?:\/|$)/i

function stubTestEndpoints(page) {
  if (!STUB_EXTERNAL_TEST_ENDPOINTS) return
  page.route(TEST_ENDPOINT_URL, (route) => {
    const host = new URL(route.request().url()).hostname
    const contentType = host === 'fonts.googleapis.com'
      ? 'text/css'
      : host === 'fonts.gstatic.com'
        ? 'application/octet-stream'
        : 'application/javascript'
    return route.fulfill({ status: 200, contentType, body: '' })
  })
}

function watchAnalyticsRequests(page) {
  const requests = []
  page.on('request', (request) => {
    if (ANALYTICS_URL.test(request.url())) requests.push(request.url())
  })
  return requests
}

const launchOptions = { headless: true }
if (CHROMIUM_EXECUTABLE_PATH) {
  launchOptions.executablePath = CHROMIUM_EXECUTABLE_PATH
  launchOptions.args = ['--no-sandbox', '--disable-dev-shm-usage']
}
const browser = await chromium.launch(launchOptions)
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

try {
  const deniedContext = await browser.newContext({ serviceWorkers: 'block' })
  try {
    const page = await deniedContext.newPage()
    stubTestEndpoints(page)
    const requests = watchAnalyticsRequests(page)
    await page.goto(`${BASE_URL}/?consent-audit=denied`, { waitUntil: 'domcontentloaded' })
    await page.locator('.prs-consent').waitFor({ state: 'visible' })
    await page.waitForTimeout(400)

    const initial = await page.evaluate(() => ({
      footerCount: document.querySelectorAll('footer').length,
      trustLinks: ['/privacy/', '/editorial-policy/', '/sources/', '/corrections/']
        .map((href) => Boolean(document.querySelector(`a[href="${href}"]`))),
      stats: [...document.querySelectorAll('#stats .stat-num')]
        .map((node) => ({ target: Number(node.dataset.statTarget), label: node.getAttribute('aria-label') })),
      directAnalyticsScripts: [...document.scripts]
        .filter((script) => /googletagmanager\.com|mc\.yandex\.ru/i.test(script.src)).length,
    }))

    check(requests.length === 0, 'analytics requested before consent')
    check(initial.footerCount === 1, `homepage has ${initial.footerCount} footers`)
    check(initial.trustLinks.every(Boolean), `trust links incomplete: ${initial.trustLinks.join(',')}`)
    check(
      initial.stats.length === 4 && initial.stats.every((item) => item.target > 0 && Number(item.label?.replace('%', '')) > 0),
      `homepage statistics are not truthful: ${JSON.stringify(initial.stats)}`,
    )
    check(initial.directAnalyticsScripts === 0, 'direct analytics script exists before consent')

    await page.locator('.prs-consent__deny').click()
    await page.waitForFunction((key) => localStorage.getItem(key) === 'denied', CONSENT_KEY)
    check(requests.length === 0, 'analytics requested after denial')

    await page.goto(`${BASE_URL}/privacy/?consent-audit=denied`, { waitUntil: 'domcontentloaded' })
    check(!(await page.locator('.prs-consent').isVisible().catch(() => false)), 'denial was not retained across native page navigation')
    const privacyControl = page.getByRole('button', { name: 'Открыть настройки аналитики' })
    check(await privacyControl.count() === 1, 'privacy page lacks settings control after denial')
    if (await privacyControl.count() === 1) {
      await privacyControl.click()
      const dialog = page.locator('.prs-consent')
      check(await dialog.isVisible(), 'privacy settings control does not reopen consent dialog')
      await dialog.locator('.prs-consent__deny').click()
      check(await privacyControl.evaluate((node) => node === document.activeElement), 'closing consent did not restore focus to its opener')
    }
    check(requests.length === 0, 'analytics requested while consent remained denied')
  } finally {
    await deniedContext.close()
  }

  const allowedContext = await browser.newContext({ serviceWorkers: 'block' })
  try {
    const page = await allowedContext.newPage()
    stubTestEndpoints(page)
    const requests = watchAnalyticsRequests(page)
    await page.goto(`${BASE_URL}/?consent-audit=allowed`, { waitUntil: 'domcontentloaded' })
    await page.locator('.prs-consent__allow').waitFor({ state: 'visible' })
    check(requests.length === 0, 'analytics requested before the allow choice')

    await page.locator('.prs-consent__allow').click()
    await page.waitForFunction(() => Boolean(
      document.querySelector('script[data-prs-ga]') && document.querySelector('script[data-prs-ym]'),
    ))
    await page.waitForTimeout(250)
    check(
      requests.some((url) => /googletagmanager\.com/.test(url)) && requests.some((url) => /mc\.yandex\.ru/.test(url)),
      'granting consent did not request both configured analytics providers',
    )
    const granted = await page.evaluate((key) => ({
      settings: Boolean(document.querySelector('.prs-consent-settings')),
      choice: localStorage.getItem(key),
    }), CONSENT_KEY)
    check(granted.settings && granted.choice === 'granted', `granted choice was not saved: ${JSON.stringify(granted)}`)

    await page.goto(`${BASE_URL}/privacy/?consent-audit=allowed`, { waitUntil: 'domcontentloaded' })
    const privacyControl = page.getByRole('button', { name: 'Открыть настройки аналитики' })
    check(await privacyControl.count() === 1, 'privacy page lacks settings control after grant')
    if (await privacyControl.count() === 1) {
      await privacyControl.click()
      const dialog = page.locator('.prs-consent')
      check(await dialog.isVisible(), 'privacy settings control does not reopen consent dialog')
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        dialog.locator('.prs-consent__deny').click(),
      ])
      await page.waitForFunction((key) => localStorage.getItem(key) === 'denied', CONSENT_KEY)
      const revoked = await page.evaluate((key) => ({
        panelVisible: Boolean(document.querySelector('.prs-consent:not([hidden])')),
        ga: Boolean(document.querySelector('script[data-prs-ga]')),
        yandex: Boolean(document.querySelector('script[data-prs-ym]')),
        choice: localStorage.getItem(key),
        loaderChoice: window.MiloviSchoolConsent?.getChoice(),
      }), CONSENT_KEY)
      check(
        !revoked.panelVisible && !revoked.ga && !revoked.yandex && revoked.choice === 'denied' && revoked.loaderChoice === 'denied',
        `revoked consent was not persisted across reload: ${JSON.stringify(revoked)}`,
      )
    }
  } finally {
    await allowedContext.close()
  }
} finally {
  await browser.close()
}

if (failures.length) {
  throw new Error(`Consent lifecycle audit failed:\n- ${failures.join('\n- ')}`)
}

console.log('Consent lifecycle audit passed: pre-consent block, persisted denial, grant, revocation, and focus restoration.')
if (STUB_EXTERNAL_TEST_ENDPOINTS) {
  console.log('Test-only endpoint substitutions: Google Analytics/Tag Manager, Yandex Metrika, Google Fonts CSS and font hosts returned empty local responses.')
}
