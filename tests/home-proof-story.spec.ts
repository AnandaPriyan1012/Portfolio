import { test, expect, type Page } from '@playwright/test'

type View = 'campus' | 'admissions'
type Departure = { top: number; href: string | null; source: string | null; trusted: boolean }
declare global { interface Window { __proofDeparture?: Departure } }

const assets = {
  campus: { desktop: '/media/atlas-cirs-home-desktop.webp', mobile: '/media/atlas-cirs-home-mobile.webp', href: 'https://cirschool.org' },
  admissions: { desktop: '/media/atlas-cirs-admissions-desktop.webp', mobile: '/media/atlas-cirs-admissions-mobile.webp', href: 'https://cirschool.org/admissions.html' },
} as const

test.beforeEach(async ({ page, request }) => {
  if (process.env.AP_QA_EXPECTED_BUNDLE) {
    const response = await request.get('/')
    expect(await response.text()).toContain(process.env.AP_QA_EXPECTED_BUNDLE)
  }
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
})

async function settled(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family)))
    .toEqual(expect.arrayContaining(['Syne Variable', 'Instrument Sans Variable']))
}
async function home(page: Page) { await page.goto('/'); await settled(page) }
function frame(page: Page) { return page.locator('.cirs-visual-frame') }
function origin(page: Page) { return page.locator('[data-home-origin="cirs-scene"]') }
function source(page: Page) { return page.locator('.cirs-browser-body') }
function choose(page: Page, view: View) {
  return frame(page).getByRole('button', { name: view === 'campus' ? 'Show Campus overview' : 'Show Admissions Guide', exact: true })
}
function proofImage(page: Page, view: View) {
  return frame(page).locator(`[data-proof-layer="${view}"] img`)
}

// Native wheel input drives the actual ScrollTrigger/Lenis coordinator. The
// timeline's diagnostic attribute is observed, never assigned by the fixture.
async function wheelToPhase(page: Page, wanted: number) {
  const scene = page.locator('.scroll-opening')
  await page.mouse.move(4, 450)
  const delta = await scene.evaluate((node, phase) => {
    const spacer = node.parentElement!.getBoundingClientRect(), bounds = node.getBoundingClientRect()
    const top = spacer.top + scrollY + (spacer.height - bounds.height) * phase
    return top - scrollY
  }, wanted)
  await page.mouse.wheel(0, delta)
  await expect.poll(async () => Math.abs(Number(await scene.getAttribute('data-progress')) - wanted)).toBeLessThan(.008)
  let previous = await page.evaluate(() => scrollY), stable = 0
  await expect.poll(async () => {
    const next = await page.evaluate(() => scrollY)
    stable = Math.abs(next - previous) < .5 ? stable + 1 : 0
    previous = next
    return stable
  }, { intervals: [100] }).toBeGreaterThanOrEqual(3)
}

async function evidence(page: Page, view: View, mobile: boolean) {
  const link = source(page)
  await expect(link).toHaveAttribute('href', assets[view].href)
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(frame(page)).toHaveAttribute('data-effective-proof', view)
  const image = proofImage(page, view)
  await image.evaluate(node => (node as HTMLImageElement).decode())
  const measured = await image.evaluate(node => {
    const image = node as HTMLImageElement, bounds = image.getBoundingClientRect()
    const outer = image.closest('a')!.getBoundingClientRect()
    return { path: new URL(image.currentSrc).pathname, alt: image.alt,
      opacity: Number(getComputedStyle(image.closest('picture')!).opacity),
      natural: [image.naturalWidth, image.naturalHeight], fit: getComputedStyle(image).objectFit,
      bounds: { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, width: bounds.width, height: bounds.height },
      outer: { left: outer.left, right: outer.right, top: outer.top, bottom: outer.bottom } }
  })
  expect(measured.path).toBe(assets[view][mobile ? 'mobile' : 'desktop'])
  expect(measured.natural).toEqual([mobile ? 390 : 1440, 1000])
  expect(measured.alt.toLowerCase()).toContain(view === 'campus' ? 'homepage' : 'admissions')
  expect(measured.alt).toContain('4 November 2026')
  expect(measured.fit).toBe('contain')
  expect(measured.opacity).toBeGreaterThan(.99)
  expect(measured.bounds.left).toBeGreaterThanOrEqual(measured.outer.left - 1)
  expect(measured.bounds.right).toBeLessThanOrEqual(measured.outer.right + 1)
  expect(measured.bounds.top).toBeGreaterThanOrEqual(measured.outer.top - 1)
  expect(measured.bounds.bottom).toBeLessThanOrEqual(measured.outer.bottom + 1)
  return measured
}

async function enterCase(page: Page, touch: boolean, keyboard: boolean) {
  const link = origin(page)
  await link.scrollIntoViewIfNeeded()
  if (keyboard) await link.focus()
  await expect(link).toBeInViewport()
  await link.evaluate(node => node.addEventListener('click', event => {
    window.__proofDeparture = { top: scrollY, href: node.getAttribute('href'),
      source: document.querySelector('.cirs-browser-body')?.getAttribute('href') ?? null, trusted: event.isTrusted }
  }, { capture: true, once: true }))
  if (keyboard) await page.keyboard.press('Enter')
  else if (touch) await link.tap()
  else await link.click()
  const departure = await page.evaluate(() => window.__proofDeparture!)
  expect(departure.trusted).toBe(true)
  expect(departure.href).toBe('/projects/cirs')
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await settled(page)
  await expect(page.locator('h1')).toBeFocused()
  return departure
}

async function returned(page: Page, departure: Departure) {
  await expect(page).toHaveURL(/\/$/)
  await settled(page)
  try {
    await expect(origin(page)).toBeFocused()
    await expect(origin(page)).toBeInViewport()
    expect(await origin(page).getAttribute('tabindex')).toBeNull()
    await expect(source(page)).toHaveAttribute('href', departure.source!)
    await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), departure.top)).toBeLessThan(4)
  } catch (error) {
    const state = await page.evaluate(() => ({ top: scrollY, active: document.activeElement?.outerHTML.slice(0, 300),
      source: document.querySelector('.cirs-browser-body')?.getAttribute('href'),
      proof: document.querySelector<HTMLElement>('.cirs-visual-frame')?.dataset, history: history.state }))
    await test.info().attach('home-proof-return-state', { body: JSON.stringify({ departure, ...state }, null, 2), contentType: 'application/json' })
    throw error
  }
  // A late real capture refresh must keep numeric restoration and native focus.
  await source(page).locator('.cirs-browser-image').evaluate(node => node.dispatchEvent(new Event('load')))
  await page.waitForTimeout(500)
  await expect(origin(page)).toBeFocused()
  expect(Math.abs(await page.evaluate(() => scrollY) - departure.top)).toBeLessThan(4)
}

test.describe('the real desktop Home proof timeline', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })

  test('forward and reverse wheel input dissolve the two genuine sources within the existing pin', async ({ page }, testInfo) => {
    await home(page)
    await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
    await expect(frame(page)).toHaveAttribute('data-proof-mode', 'scroll')
    await expect(page.locator('.pin-spacer')).toHaveCount(1)
    await wheelToPhase(page, .60)
    const campus = await evidence(page, 'campus', false)
    const initialHeight = await page.locator('.pin-spacer').evaluate(node => node.getBoundingClientRect().height)
    expect(initialHeight).toBeLessThanOrEqual(2102)
    await wheelToPhase(page, .69)
    const blend = await frame(page).evaluate(node => {
      const layer = (view: string) => Number(getComputedStyle(node.querySelector(`[data-proof-layer="${view}"]`)!).opacity)
      return { progress: Number(getComputedStyle(node).getPropertyValue('--home-proof-progress')), campus: layer('campus'), admissions: layer('admissions') }
    })
    expect(blend.progress).toBeGreaterThan(0)
    expect(blend.progress).toBeLessThan(1)
    expect(blend.campus).toBeGreaterThan(0)
    expect(blend.admissions).toBeGreaterThan(0)
    await wheelToPhase(page, .84)
    const admissions = await evidence(page, 'admissions', false)
    expect((await frame(page).boundingBox())!.height).toBeGreaterThan(400)
    await expect(page.locator('.cirs-scene-captions')).toBeInViewport()
    await wheelToPhase(page, .60)
    await evidence(page, 'campus', false)
    expect(await page.locator('.pin-spacer').evaluate(node => node.getBoundingClientRect().height)).toBeCloseTo(initialHeight, 0)
    await testInfo.attach('native-forward-reverse-proof', { body: JSON.stringify({ campus, blend, admissions, pinHeight: initialHeight }, null, 2), contentType: 'application/json' })
  })

  test('a keyboard choice outranks scroll and focused controls until Follow scroll is deliberately resumed', async ({ page }) => {
    await home(page)
    await wheelToPhase(page, .84)
    const campus = choose(page, 'campus')
    await campus.focus(); await page.keyboard.press('Enter')
    await expect(frame(page)).toHaveAttribute('data-proof-owner', 'manual')
    await evidence(page, 'campus', false)
    await page.keyboard.press('Tab')
    await expect(choose(page, 'admissions')).toBeFocused()
    await wheelToPhase(page, .59)
    await wheelToPhase(page, .85)
    await expect(choose(page, 'admissions')).toBeFocused()
    await evidence(page, 'campus', false)
    await page.keyboard.press('Tab')
    const follow = frame(page).getByRole('button', { name: 'Follow scroll', exact: true })
    await expect(follow).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(follow).toHaveAttribute('aria-pressed', 'true')
    await evidence(page, 'admissions', false)
    await wheelToPhase(page, .59)
    await expect(follow).toBeFocused()
    await evidence(page, 'campus', false)
  })

  test('the focused native source link keeps its page stable across the scroll threshold', async ({ page }) => {
    await home(page)
    await wheelToPhase(page, .60)
    await source(page).focus()
    await expect(frame(page)).toHaveAttribute('data-proof-owner', 'focus')
    await wheelToPhase(page, .84)
    await expect(frame(page)).toHaveAttribute('data-proof-view', 'admissions')
    await expect(source(page)).toBeFocused()
    await evidence(page, 'campus', false)
    // Shift+Tab reaches the actual Follow scroll control without moving focus
    // through a remounted source anchor or invoking an external website.
    await page.keyboard.press('Shift+Tab')
    await expect(frame(page).getByRole('button', { name: 'Follow scroll', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await evidence(page, 'admissions', false)
  })
})

for (const variant of [
  { width: 1440, height: 1000, touch: false, motion: 'no-preference' as const },
  { width: 390, height: 844, touch: true, motion: 'no-preference' as const },
  { width: 320, height: 844, touch: true, motion: 'reduce' as const },
]) test.describe(`${variant.width}px Home proof case continuity`, () => {
  test.use({ viewport: { width: variant.width, height: variant.height }, reducedMotion: variant.motion,
    isMobile: variant.touch, hasTouch: variant.touch })
  test('manual source, exact native opener and Y survive explicit case Back and browser history', async ({ page }, testInfo) => {
    await home(page)
    if (!variant.touch) await wheelToPhase(page, .84)
    else await choose(page, 'campus').scrollIntoViewIfNeeded()
    const results = []
    for (const [view, nativeBack] of [['campus', false], ['admissions', true]] as const) {
      const control = choose(page, view)
      if (variant.touch) await control.tap()
      else { await control.focus(); await page.keyboard.press('Enter') }
      await expect(frame(page)).toHaveAttribute('data-proof-owner', 'manual')
      await evidence(page, view, variant.touch)
      const departure = await enterCase(page, variant.touch, !nativeBack)
      if (nativeBack) await page.goBack()
      else {
        const back = page.getByRole('button', { name: 'Back to portfolio', exact: true })
        await back.focus(); await page.keyboard.press('Enter')
      }
      await returned(page, departure)
      await expect(frame(page)).toHaveAttribute('data-proof-owner', 'manual')
      await evidence(page, view, variant.touch)
      await page.keyboard.press('Tab')
      await expect(choose(page, 'campus')).toBeFocused()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(variant.width)
      results.push({ view, nativeBack, departure, returnedTop: await page.evaluate(() => scrollY) })
    }
    await testInfo.attach('native-case-return-context', { body: JSON.stringify(results, null, 2), contentType: 'application/json' })
  })
})

for (const mode of ['phone390', 'phone320', 'reduced', 'motion-off', 'forced-colors'] as const) {
  test(`${mode} starts with a full normal-flow Admissions proof and no pinned runway`, async ({ browser, baseURL }, testInfo) => {
    const phone = mode.startsWith('phone'), width = mode === 'phone320' ? 320 : phone ? 390 : 1440
    const context = await browser.newContext({ baseURL, viewport: { width, height: phone ? 844 : 1000 },
      isMobile: phone, hasTouch: phone, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
      forcedColors: mode === 'forced-colors' ? 'active' : 'none' })
    await context.addInitScript(off => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
      if (off) localStorage.setItem('ap-motion', 'off')
    }, mode === 'motion-off')
    const page = await context.newPage()
    try {
      await home(page)
      await expect(frame(page)).toHaveAttribute('data-proof-mode', 'static')
      await expect(page.locator('.pin-spacer')).toHaveCount(0)
      await frame(page).scrollIntoViewIfNeeded()
      const measured = await evidence(page, 'admissions', phone)
      expect(await frame(page).evaluate(node => getComputedStyle(node).position)).toBe('relative')
      expect(measured.bounds.height).toBeGreaterThan(phone ? 650 : 600)
      expect(measured.bounds.width / measured.bounds.height).toBeCloseTo(phone ? .39 : 1.44, 2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await expect(origin(page)).toHaveAttribute('href', '/projects/cirs')
      for (const view of ['campus', 'admissions'] as const) expect((await choose(page, view).boundingBox())!.height).toBeGreaterThanOrEqual(44)
      if (phone) {
        await choose(page, 'campus').tap()
        await evidence(page, 'campus', true)
      }
      await testInfo.attach('normal-flow-proof', { body: JSON.stringify({ mode, measured }, null, 2), contentType: 'application/json' })
    } finally { await context.close() }
  })
}

test('changing to reduced motion removes the pin and manual view survives the quiet layout', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await home(page)
  await wheelToPhase(page, .84)
  await choose(page, 'campus').focus(); await page.keyboard.press('Enter')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(frame(page)).toHaveAttribute('data-proof-mode', 'static')
  await expect(choose(page, 'campus')).toBeFocused()
  await evidence(page, 'campus', false)
  expect((await source(page).boundingBox())!.height).toBeGreaterThan(600)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(frame(page)).toHaveAttribute('data-proof-mode', 'scroll')
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await expect(choose(page, 'campus')).toBeFocused()
  await evidence(page, 'campus', false)
})

test('resizing a running scene to phone produces a readable native-flow proof and genuine phone source', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await home(page)
  await wheelToPhase(page, .84)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(frame(page)).toHaveAttribute('data-proof-mode', 'static')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await frame(page).scrollIntoViewIfNeeded()
  const measured = await evidence(page, 'admissions', true)
  expect(measured.bounds.height).toBeGreaterThan(700)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('enabling forced colors removes an existing pin without discarding the native source choice', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' })
  await home(page)
  await wheelToPhase(page, .84)
  await choose(page, 'campus').focus(); await page.keyboard.press('Enter')
  await page.emulateMedia({ forcedColors: 'active' })
  await expect(frame(page)).toHaveAttribute('data-proof-mode', 'static')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(choose(page, 'campus')).toBeFocused()
  await evidence(page, 'campus', false)
  expect((await source(page).boundingBox())!.height).toBeGreaterThan(600)
})

for (const failed of ['campus', 'admissions'] as const) test(`a failed ${failed} image cannot remove the other real Home source`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const stem = failed === 'campus' ? 'home' : 'admissions'
  await page.route(new RegExp(`/media/atlas-cirs-${stem}-(?:desktop|mobile)\\.webp$`), route => route.abort())
  await home(page)
  await wheelToPhase(page, .84)
  const available = failed === 'campus' ? 'admissions' : 'campus'
  await expect(choose(page, failed)).toHaveAttribute('aria-disabled', 'true')
  await expect(frame(page)).toHaveAttribute('data-proof-mode', 'scroll')
  await evidence(page, available, false)
  await choose(page, available).focus(); await page.keyboard.press('Enter')
  await expect(origin(page)).toHaveAttribute('href', '/projects/cirs')
  await evidence(page, available, false)
})

test('two unavailable sources yield usable native source and case links without an empty pin', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route(/\/media\/atlas-cirs-(?:home|admissions)-(?:desktop|mobile)\.webp$/, route => route.abort())
  await home(page)
  await frame(page).scrollIntoViewIfNeeded()
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(frame(page)).toHaveAttribute('data-proof-mode', 'static')
  await expect(frame(page).locator('.home-proof-fallback')).toContainText('The captures could not load')
  await expect(source(page)).toHaveAttribute('href', /https:\/\/cirschool\.org(?:\/admissions\.html)?$/)
  await expect(origin(page)).toHaveAttribute('href', '/projects/cirs')
  await origin(page).focus(); await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/cirs$/)
})
