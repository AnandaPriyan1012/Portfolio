import { test as base, expect, type Locator, type Page } from '@playwright/test'

const launch = { id: 'cirs-website-launch', title: 'CIRS website launch' }
const bridgeName = 'Read the CIRS website case study'
const variants = [
  { width: 1440, height: 1000, motion: 'no-preference' as const, touch: false },
  { width: 390, height: 844, motion: 'no-preference' as const, touch: true },
  { width: 320, height: 844, motion: 'reduce' as const, touch: true },
]
type Departure = { top: number; hash: string; length: number; occurrence: number; trusted: boolean; pointerType: string }
declare global { interface Window { __studioCaseDeparture?: Departure } }

const test = base.extend<{ traffic: { media: string[]; google: string[] } }>({
  traffic: [async ({ context, page }, use) => {
    const traffic = { media: [] as string[], google: [] as string[] }, errors: string[] = []
    context.on('request', request => {
      if (/\.(?:mp4|webm|m3u8)$/.test(new URL(request.url()).pathname)) traffic.media.push(request.url())
    })
    context.on('page', child => child.on('pageerror', error => errors.push(error.message)))
    page.on('pageerror', error => errors.push(error.message))
    await context.route(/https:\/\/(?:[^/]*\.)?(?:google\.com|googleusercontent\.com|googleapis\.com|gstatic\.com)\//, route => {
      traffic.google.push(route.request().url())
      return route.abort()
    })
    await context.addInitScript(() => {
      // Native popups briefly start at an opaque about:blank origin.
      try { localStorage.setItem('ap-motion', 'on') } catch { /* The actual site sets its preference on navigation. */ }
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
    })
    await use(traffic)
    expect(errors).toEqual([])
    expect(traffic.media, 'No film or autoplay source is requested before Watch').toEqual([])
    expect(traffic.google, 'No Drive/Google embed is requested before Watch').toEqual([])
  }, { auto: true }],
})

test.beforeEach(async ({ request }) => {
  if (process.env.AP_QA_EXPECTED_BUNDLE) {
    const response = await request.get('/')
    expect(await response.text()).toContain(process.env.AP_QA_EXPECTED_BUNDLE)
  }
})

async function settled(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family)))
    .toEqual(expect.arrayContaining(['Syne Variable', 'Instrument Sans Variable']))
}
function bridge(page: Page) {
  return page.locator(`.film-moments[data-film="${launch.id}"]`).getByRole('link', { name: bridgeName, exact: true })
}
async function selected(page: Page) {
  await expect(page.locator('.screening-title-card h3')).toHaveText(launch.title)
  await expect(page.getByRole('radio', { name: launch.title, exact: true })).toBeChecked()
  await expect(page.locator('.screening-projection')).toHaveAttribute('id', launch.id)
  await expect(bridge(page)).toHaveAttribute('href', '/projects/cirs')
  await expect(page.locator('video,iframe')).toHaveCount(0)
}
async function openStudio(page: Page) {
  await page.goto(`/studio#${launch.id}`)
  await settled(page)
  await selected(page)
}
async function passiveCirs(page: Page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/studio#ted-ed-2026')
  await settled(page)
  await expect(page.locator('.screening-title-card h3')).toHaveText('TED-Ed auditions')
  await expect(page.locator('.screening-room')).toHaveAttribute('data-scroll-programme', 'true')
  // Use actual document scrolling, with focus outside the programme/projection,
  // so its IntersectionObserver previews CIRS without a deliberate radio change.
  await page.getByRole('link', { name: 'Ananda Priyan, home', exact: true }).focus()
  await page.locator('[data-film-id="cirs-website-launch"]').evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await selected(page)
  await expect(page).toHaveURL(/\/studio#ted-ed-2026$/)
}
async function enter(page: Page, origin: Locator, method: 'keyboard' | 'pointer', touch: boolean) {
  await origin.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }))
  if (method === 'keyboard') await origin.focus()
  await page.waitForTimeout(250)
  await expect(origin).toBeInViewport()
  await origin.evaluate(node => node.addEventListener('click', event => {
    const peers = [...document.querySelectorAll('main a[href]')].filter(anchor => anchor.getAttribute('href') === node.getAttribute('href'))
    window.__studioCaseDeparture = { top: scrollY, hash: location.hash, length: history.length,
      occurrence: peers.indexOf(node), trusted: event.isTrusted, pointerType: (event as PointerEvent).pointerType ?? '' }
  }, { capture: true, once: true }))
  if (method === 'keyboard') await page.keyboard.press('Enter')
  else if (touch) await origin.tap()
  else await origin.click()
  const departure = await page.evaluate(() => window.__studioCaseDeparture!)
  expect(departure.trusted).toBe(true)
  if (touch && method === 'pointer') expect(departure.pointerType).toBe('touch')
  expect(departure.top).toBeGreaterThan(1000)
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await settled(page)
  await expect(page.locator('h1')).toBeFocused()
  expect(await page.evaluate(() => history.length)).toBe(departure.length + 1)
  return departure
}
async function returned(page: Page, departure: Departure) {
  await expect(page).toHaveURL(/\/studio#cirs-website-launch$/)
  await settled(page)
  try { await selected(page) } catch (error) {
    const state = await page.evaluate(() => ({
      url: location.href, top: scrollY, focus: document.activeElement?.outerHTML.slice(0, 300),
      title: document.querySelector('.screening-title-card h3')?.textContent,
      bridge: Boolean(document.querySelector('.film-moments[data-film="cirs-website-launch"] a[href="/projects/cirs"]')),
      history: history.state?.apPortfolioPosition,
      rows: [...document.querySelectorAll<HTMLElement>('[data-film-id]')].map(node => {
        const bounds = node.getBoundingClientRect()
        return { film: node.dataset.filmId, selected: node.dataset.selected, top: bounds.top, bottom: bounds.bottom,
          midpoint: bounds.top <= innerHeight / 2 && bounds.bottom >= innerHeight / 2 }
      }),
    }))
    await test.info().attach('return-failure-state', { body: JSON.stringify({ departure, ...state }, null, 2), contentType: 'application/json' })
    throw error
  }
  const origin = bridge(page)
  await expect(origin).toBeFocused()
  await expect(origin).toBeInViewport()
  expect(await origin.getAttribute('tabindex')).toBeNull()
  expect(await origin.evaluate(node => node instanceof HTMLAnchorElement && node === document.activeElement)).toBe(true)
  expect(await origin.evaluate(node => [...document.querySelectorAll('main a[href]')]
    .filter(anchor => anchor.getAttribute('href') === node.getAttribute('href')).indexOf(node))).toBe(departure.occurrence)
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), departure.top)).toBeLessThan(4)
  // Complete real frame decodes and repeat the media/layout notifications that
  // formerly reinterpreted a selection fragment as a fresh anchor destination.
  await page.locator('.film-moments img').evaluateAll(async nodes => {
    await Promise.all(nodes.map(node => (node as HTMLImageElement).decode()))
    nodes.forEach(node => node.dispatchEvent(new Event('load')))
    window.dispatchEvent(new Event('resize'))
  })
  await page.waitForTimeout(900)
  await expect(origin).toBeFocused()
  await selected(page)
  expect(Math.abs(await page.evaluate(() => scrollY) - departure.top)).toBeLessThan(4)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
  return { departure, returnedTop: await page.evaluate(() => scrollY), selected: launch.id, hash: await page.evaluate(() => location.hash) }
}

for (const variant of variants) test.describe(`${variant.width}px Studio project return`, () => {
  test.use({ viewport: { width: variant.width, height: variant.height }, reducedMotion: variant.motion,
    hasTouch: variant.touch, isMobile: variant.touch })

  test('keyboard case bridge and explicit Back retain exact film, native anchor focus and Y after layout refresh', async ({ page, traffic }, testInfo) => {
    test.setTimeout(60000)
    await openStudio(page)
    const departure = await enter(page, bridge(page), 'keyboard', variant.touch)
    expect(departure.hash).toBe(`#${launch.id}`)
    const back = page.getByRole('button', { name: 'Back to portfolio', exact: true })
    await back.focus(); await page.keyboard.press('Enter')
    const record = await returned(page, departure)
    expect(traffic.media).toEqual([]); expect(traffic.google).toEqual([])
    await testInfo.attach('keyboard-explicit-return', { body: JSON.stringify(record, null, 2), contentType: 'application/json' })
    await testInfo.attach('returned-Studio', { body: await page.screenshot(), contentType: 'image/png' })
  })

  test('real pointer or touch bridge survives native Back/Forward and a later explicit return', async ({ page, traffic }, testInfo) => {
    test.setTimeout(60000)
    await openStudio(page)
    const departure = await enter(page, bridge(page), 'pointer', variant.touch)
    await page.goBack()
    const first = await returned(page, departure)
    await page.goForward()
    await expect(page).toHaveURL(/\/projects\/cirs$/)
    await settled(page)
    await page.getByRole('button', { name: 'Back to portfolio', exact: true })[variant.touch ? 'tap' : 'click']()
    const second = await returned(page, departure)
    expect(traffic.media).toEqual([]); expect(traffic.google).toEqual([])
    await testInfo.attach('pointer-native-and-explicit-return', { body: JSON.stringify({ input: variant.touch ? 'touch' : 'mouse', first, second }, null, 2), contentType: 'application/json' })
  })
})

test('a passive CIRS preview canonicalizes the other film fragment only when its case bridge is deliberately activated', async ({ page }, testInfo) => {
  test.setTimeout(60000)
  await passiveCirs(page)
  const departure = await enter(page, bridge(page), 'keyboard', false)
  expect(departure.hash).toBe('#ted-ed-2026')
  await page.goBack()
  const record = await returned(page, departure)
  expect(await page.evaluate(() => history.length)).toBe(departure.length + 1)
  await testInfo.attach('passive-preview-canonical-bridge-return', { body: JSON.stringify(record, null, 2), contentType: 'application/json' })
})

for (const method of ['modified', 'middle'] as const) test(`CIRS case bridge preserves native ${method} opening and the original Studio context`, async ({ page, context }) => {
  // A different canonical fragment detects an accidental selectFilm side effect
  // in a modified-click handler even when the original page does not navigate.
  await passiveCirs(page)
  const origin = bridge(page)
  await origin.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  const before = await page.evaluate(() => ({ url: location.href, top: scrollY, length: history.length }))
  const [popup] = await Promise.all([context.waitForEvent('page'), origin.click(method === 'middle' ? { button: 'middle' } : { modifiers: ['ControlOrMeta'] })])
  await popup.waitForLoadState('domcontentloaded')
  await expect(popup).toHaveURL(/\/projects\/cirs$/)
  await settled(popup)
  expect(await page.evaluate(() => ({ url: location.href, top: scrollY, length: history.length }))).toEqual(before)
  await selected(page)
  await popup.close()
})
