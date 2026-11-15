import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4174'
const browser = await chromium.launch({ headless: true })
const findings = []

async function capture(label, viewport, path) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: 'block' })
  const page = await context.newPage()
  await page.goto(`${baseUrl}/?canon-gateway-review=${Date.now()}`, { waitUntil: 'networkidle' })

  const deny = page.locator('.prs-consent__deny')
  if (await deny.count()) {
    if (await deny.isVisible().catch(() => false)) await deny.click()
  }

  const gateway = page.locator('.canon-gateway')
  await gateway.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const state = await gateway.evaluate(async (node) => {
    const ownerDocument = node.ownerDocument
    const view = ownerDocument.defaultView
    const media = node.querySelector('.canon-gateway-media')
    const image = node.querySelector('.canon-gateway-media img')
    const copy = node.querySelector('.canon-gateway-copy')
    const title = node.querySelector('.canon-gateway-title')
    const rect = (element) => {
      if (!element) return null
      const r = element.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
    }
    const style = image && view ? view.getComputedStyle(image) : null
    // The hero is offered through srcSet, so naturalWidth is density-corrected and the
    // browser may legitimately pick a derivative. Decode the winning candidate in a
    // detached Image to learn its real pixels, and keep the owner asset as the only source.
    let served = null
    if (image && image.currentSrc) {
      const probe = new globalThis.Image()
      probe.src = image.currentSrc
      await probe.decode().catch(() => {})
      served = { src: image.currentSrc, width: probe.naturalWidth, height: probe.naturalHeight }
    }
    return {
      gateway: rect(node),
      media: rect(media),
      image: rect(image),
      copy: rect(copy),
      title: rect(title),
      src: image?.getAttribute('src') || '',
      srcset: image?.getAttribute('srcset') || '',
      served,
      renderedWidth: image ? image.getBoundingClientRect().width : 0,
      dpr: view ? view.devicePixelRatio : 1,
      objectFit: style?.objectFit || '',
      objectPosition: style?.objectPosition || '',
      scrollWidth: ownerDocument.documentElement.scrollWidth,
      clientWidth: ownerDocument.documentElement.clientWidth,
    }
  })

  if (state.src !== '/images/canon-sucre/canon-gateway-hero.webp') findings.push(`${label}: wrong image ${state.src}`)
  const candidates = state.srcset.split(',').map((entry) => entry.trim()).filter(Boolean)
  if (!candidates.length) findings.push(`${label}: gateway image is not offered as a responsive set`)
  for (const candidate of candidates) {
    const owner = /^\/images\/canon-sucre\/canon-gateway-hero\.webp (\d+)w$/.exec(candidate)
    const match = /^\/images\/variants\/canon-gateway-hero-(\d+)\.webp (\d+)w$/.exec(candidate)
    if (owner) {
      if (owner[1] !== '1916') findings.push(`${label}: owner asset advertised at the wrong width ${candidate}`)
    } else if (!match) findings.push(`${label}: unexpected srcset candidate ${candidate}`)
    else if (match[1] !== match[2]) findings.push(`${label}: candidate width mismatch ${candidate}`)
  }
  if (!state.served || !state.served.width) findings.push(`${label}: gateway image did not load`)
  else {
    const ratio = state.served.width / state.served.height
    if (Math.abs(ratio - 1916 / 821) > 0.01) findings.push(`${label}: served derivative lost the owner aspect ratio ${state.served.width}x${state.served.height}`)
    if (state.served.width + 1 < state.renderedWidth * state.dpr) findings.push(`${label}: gateway image is served below its slot ${state.served.width} < ${Math.round(state.renderedWidth * state.dpr)}`)
  }
  if (!state.gateway || state.gateway.width < 280 || state.gateway.height < 340) findings.push(`${label}: gateway geometry collapsed`)
  if (state.scrollWidth > state.clientWidth + 1) findings.push(`${label}: horizontal overflow ${state.scrollWidth} > ${state.clientWidth}`)
  if (!state.copy || !state.title) findings.push(`${label}: copy/title missing`)

  if (label === 'desktop') {
    if (state.objectFit !== 'cover') findings.push(`desktop: expected cover, got ${state.objectFit}`)
    if (state.gateway.height > 520) findings.push(`desktop: gateway became poster-like (${state.gateway.height}px)`)
    if (state.copy && state.copy.right > state.gateway.x + state.gateway.width * 0.56) findings.push('desktop: copy intrudes too far into pastry field')
  } else {
    if (state.objectFit !== 'cover') findings.push(`mobile: expected art-directed cover, got ${state.objectFit}`)
    if (!state.objectPosition.startsWith('100%')) findings.push(`mobile: image is not right-anchored (${state.objectPosition})`)
    if (state.media && state.copy && state.media.bottom > state.copy.y + 6) findings.push('mobile: media overlaps copy instead of reading as image-above-copy')
  }

  await gateway.screenshot({ path, type: 'jpeg', quality: 82 })
  const jpeg = await readFile(path)
  console.log(`CANON_GATEWAY_${label.toUpperCase()}_STATE=${JSON.stringify(state)}`)
  console.log(`CANON_GATEWAY_${label.toUpperCase()}_JPEG_BASE64=${jpeg.toString('base64')}`)
  await context.close()
}

try {
  await capture('desktop', { width: 1600, height: 1000 }, '/tmp/canon-gateway-desktop.jpg')
  await capture('mobile', { width: 390, height: 844 }, '/tmp/canon-gateway-mobile.jpg')
} finally {
  await browser.close()
}

if (findings.length) {
  console.error('Canon gateway browser review failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log('Canon gateway exact-head browser geometry and screenshot capture passed')
