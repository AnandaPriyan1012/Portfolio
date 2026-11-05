import { test, expect, type Page } from '@playwright/test'

const scene = (page: Page) => page.locator('.community-scroll-runway')
const narrative = (page: Page) => page.locator('.community-narrative')
const proof = (page: Page) => page.locator('#community button.feature-media')
const origin = (page: Page) => page.locator('#community .feature-footer a[href="/projects/community"]')
const sceneId = 'atelier-community-narrative'
const keys = ['service', 'request', 'contribution'] as const
const variants = [
  { width: 1440, height: 1000, touch: false, motion: 'no-preference' as const, method: 'explicit' },
  { width: 390, height: 844, touch: true, motion: 'no-preference' as const, method: 'browser' },
  { width: 320, height: 844, touch: true, motion: 'reduce' as const, method: 'explicit' },
]

test.beforeEach(async ({ page, request }) => {
  if (process.env.AP_QA_EXPECTED_BUNDLE || process.env.AP_QA_EXPECTED_STYLE) {
    const html = await (await request.get('/work')).text()
    if (process.env.AP_QA_EXPECTED_BUNDLE) expect(html).toContain(process.env.AP_QA_EXPECTED_BUNDLE)
    if (process.env.AP_QA_EXPECTED_STYLE) expect(html).toContain(process.env.AP_QA_EXPECTED_STYLE)
  }
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  ;(page as Page & { narrativeErrors?: string[] }).narrativeErrors = errors
})
test.afterEach(async ({ page }) => {
  expect((page as Page & { narrativeErrors?: string[] }).narrativeErrors, 'No uncaught narrative errors').toEqual([])
})
async function settle(page: Page) {
  let previous = await page.evaluate(() => scrollY), stable = 0
  await expect.poll(async () => {
    const next = await page.evaluate(() => scrollY)
    stable = Math.abs(next - previous) < .1 ? stable + 1 : 0; previous = next
    return stable
  }, { intervals: [100] }).toBeGreaterThanOrEqual(4)
}
async function ready(page: Page) {
  await page.goto('/work#community')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  if (process.env.AP_QA_EXPECTED_BUNDLE) await expect(page.locator('script[type="module"]')).toHaveAttribute('src', '/assets/' + process.env.AP_QA_EXPECTED_BUNDLE)
  await expect(narrative(page)).toBeVisible()
  await settle(page)
}
async function triggerState(page: Page) {
  return page.evaluate(async () => {
    const moduleUrl = performance.getEntriesByType('resource').map(item => item.name)
      .find(name => /(?:gsap_ScrollTrigger|motion-vendor)[^/]*\.js(?:\?|$)/.test(name))
    if (!moduleUrl) throw new Error('The already-loaded scroll module was not found')
    const loaded = await import(moduleUrl)
    const trigger = Object.values(loaded).find(value => typeof (value as { getAll?: unknown })?.getAll === 'function') as {
      getAll: () => { vars: { id?: string }; start: number; end: number }[]
    } | undefined
    if (!trigger) throw new Error('The already-loaded ScrollTrigger instance was not found')
    return trigger.getAll().map(item => ({ id: item.vars.id, start: item.start, end: item.end }))
  })
}
async function count(page: Page) { return (await triggerState(page)).filter(item => item.id === sceneId).length }
async function at(page: Page, fraction: number) {
  await expect.poll(() => count(page)).toBe(1)
  const bounds = (await triggerState(page)).find(item => item.id === sceneId)!
  const target = bounds.start + (bounds.end - bounds.start) * fraction
  for (let attempt = 0; attempt < 10; attempt++) {
    const current = await page.evaluate(() => scrollY)
    if (Math.abs(target - current) < 2) break
    await page.mouse.wheel(0, Math.max(-1600, Math.min(1600, target - current)))
    await settle(page)
  }
  expect(Math.abs(await page.evaluate(() => scrollY) - target)).toBeLessThan(3)
  await expect(scene(page)).toHaveAttribute('data-scene-step', fraction < 1 / 3 ? 'service' : fraction < 2 / 3 ? 'request' : 'contribution')
}
async function readable(page: Page) {
  const steps = narrative(page).locator('.service-step')
  await expect(steps).toHaveCount(3)
  await expect(steps.locator('h3').nth(0)).toContainText(/I helped prepare\s*and distribute meals\./)
  await expect(steps.locator('h3').nth(1)).toContainText(/How else\s*could I help\?/)
  await expect(steps.nth(1)).toContainText('The organisers described limited online reach.')
  await expect(steps.locator('h3').nth(2)).toContainText(/A voluntary role,\s*since 2023\./)
  await expect(steps.nth(2)).toContainText('Social Media & Technology Head')
  await expect(steps.nth(2).locator('li')).toHaveText(['Digital storytelling', 'Social-media work', 'Work on the organisation’s website'])
  for (const key of keys) {
    const row = narrative(page).locator(`[data-service-step="${key}"]`)
    await expect(row).toBeVisible()
    expect(await row.evaluate(node => getComputedStyle(node).opacity)).toBe('1')
  }
  await expect(narrative(page).locator('.community-story-node')).toHaveText(['01', '02', '03'])
  for (const node of await narrative(page).locator('.community-story-node,.community-story-thread').all()) await expect(node).toHaveAttribute('aria-hidden', 'true')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
}
async function quiet(page: Page) {
  await expect.poll(() => count(page)).toBe(0)
  await expect(scene(page)).not.toHaveAttribute('data-scene-progress')
  await expect(scene(page)).not.toHaveAttribute('data-scene-step')
  await readable(page)
  expect(await page.locator('#community .community-image-reservation').evaluate(node => getComputedStyle(node).position)).not.toBe('sticky')
  expect(await page.locator('#community .community-image-reservation').evaluate(node => getComputedStyle(node).transform)).toBe('none')
  const boxes = await narrative(page).locator('.service-step').evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return { top: b.top, bottom: b.bottom } }))
  expect(boxes[1].top).toBeGreaterThan(boxes[0].bottom)
  expect(boxes[2].top).toBeGreaterThan(boxes[1].bottom)
}
async function screenshotState(page: Page) {
  return scene(page).evaluate(node => {
    const image = node.querySelector<HTMLImageElement>('img')!, label = node.querySelector('.project-window-label')!
    const bounds = (element: Element) => { const b = element.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height } }
    return { y: scrollY, url: location.href, step: (node as HTMLElement).dataset.sceneStep,
      progress: (node as HTMLElement).dataset.sceneProgress, scene: bounds(node), image: { src: image.currentSrc, ...bounds(image) },
      label: bounds(label), labelText: [...label.querySelectorAll('span')].map(element => ({ text: element.textContent, ...bounds(element) })),
      rail: bounds(document.querySelector('.work-chapter-rail')!), thread: getComputedStyle(node.querySelector('.community-narrative')!).getPropertyValue('--community-thread-progress') }
  })
}

test.describe('desktop three-moment story', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })
  test('actual wheel reading reverses all three moments without passive navigation or focus changes', async ({ page }, testInfo) => {
    await ready(page)
    const initial = await page.evaluate(() => ({ url: location.href, length: history.length }))
    const observations = []
    for (const fraction of [.16, .5, .84, .5, .16]) {
      await at(page, fraction); await readable(page)
      observations.push(await screenshotState(page))
      expect(await count(page)).toBe(1)
      expect(await page.evaluate(() => ({ url: location.href, length: history.length }))).toEqual(initial)
    }
    expect(observations.map(item => item.step)).toEqual(['service', 'request', 'contribution', 'request', 'service'])
    expect(Number(observations[2].thread)).toBeGreaterThan(Number(observations[0].thread))
    expect(Number(observations[4].thread)).toBeLessThan(Number(observations[2].thread))
    expect(new Set(observations.map(item => item.image.src)).size).toBe(1)
    expect(observations[0].image.src).toContain('/media/vallalar-website-desktop.webp')
    await testInfo.attach('native-forward-reverse-story', { body: JSON.stringify(observations, null, 2), contentType: 'application/json' })
  })
  test('sticky proof clears the real rail and Quick view returns to its unchanged native image action', async ({ page }, testInfo) => {
    await ready(page); await at(page, .84)
    const geometry = await screenshotState(page)
    expect(geometry.label.top - geometry.rail.bottom).toBeGreaterThanOrEqual(19)
    for (const text of geometry.labelText) expect(text.top).toBeGreaterThan(geometry.rail.bottom)
    await proof(page).focus(); await settle(page)
    const before = await page.evaluate(() => scrollY), retained = await proof(page).elementHandle()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Vallalar Sathya Dharmasalai', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(proof(page)).toBeFocused()
    expect(await retained!.evaluate(node => node === document.activeElement)).toBe(true)
    expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(4)
    await at(page, .5); await expect(proof(page)).toBeFocused()
    await at(page, .84); await expect(proof(page)).toBeFocused()
    await testInfo.attach('unobscured-native-proof', { body: JSON.stringify({ geometry, before, after: await page.evaluate(() => scrollY) }), contentType: 'application/json' })
  })
})

for (const mode of variants) test.describe(`${mode.width}px native Vallalar case return`, () => {
  test.use({ viewport: { width: mode.width, height: mode.height }, isMobile: mode.touch, hasTouch: mode.touch, reducedMotion: mode.motion })
  test('the original case opener retains exact click-captured Y and native focus', async ({ page }, testInfo) => {
    await ready(page); await readable(page)
    await origin(page).scrollIntoViewIfNeeded(); await settle(page)
    if (!mode.touch) await origin(page).focus()
    await origin(page).evaluate(node => node.addEventListener('click', () => { document.documentElement.dataset.testCommunityDeparture = String(scrollY) }, { once: true, capture: true }))
    if (mode.touch) await origin(page).tap(); else await page.keyboard.press('Enter')
    const departed = Number(await page.locator('html').getAttribute('data-test-community-departure'))
    await expect(page).toHaveURL(/\/projects\/community$/)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await expect(page.locator('h1')).toBeFocused()
    if (mode.method === 'browser') await page.goBack()
    else await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await expect(page).toHaveURL(/\/work#community$/)
    await expect(origin(page)).toBeFocused()
    await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), departed)).toBeLessThan(4)
    await readable(page)
    await testInfo.attach('native-case-return', { body: JSON.stringify({ mode, departed, returned: await page.evaluate(() => scrollY), focused: await origin(page).evaluate(node => node === document.activeElement) }), contentType: 'application/json' })
  })
})

test.describe('390px retained bilingual evidence', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' })
  test('native English and Tamil evidence and its original capture remain independently inspectable', async ({ page }) => {
    await ready(page)
    const drawer = page.locator('#community-evidence'), summary = drawer.locator(':scope > summary')
    await summary.scrollIntoViewIfNeeded(); await settle(page); await summary.tap()
    await expect(drawer).toHaveAttribute('open', '')
    const english = drawer.getByRole('tab', { name: 'English', exact: true })
    await english.scrollIntoViewIfNeeded(); await settle(page); await english.focus(); await page.keyboard.press('End')
    const tamil = drawer.getByRole('tab', { name: /Tamil/ })
    await expect(tamil).toBeFocused(); await expect(tamil).toHaveAttribute('aria-selected', 'true')
    await expect(drawer.getByRole('link', { name: 'Open the Tamil preview', exact: true })).toHaveAttribute('href', 'https://vallalar-sathya-dharmasalai.vercel.app/ta/about/')
    const inspect = drawer.getByRole('button', { name: 'View larger capture: Vallalar · Tamil About page', exact: true })
    await inspect.scrollIntoViewIfNeeded(); await settle(page); await inspect.tap()
    const dialog = page.getByRole('dialog', { name: 'Vallalar · Tamil About page', exact: true })
    await expect(dialog.locator('img')).toHaveAttribute('src', '/media/vallalar-language-ta-mobile.webp')
    await expect.poll(() => dialog.locator('img').evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(390)
    await page.keyboard.press('Escape'); await expect(inspect).toBeFocused()
    await expect(tamil).toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(/\/work#community$/)
    await readable(page)
  })
})

for (const mode of variants.slice(1)) test.describe(`${mode.width}px ordinary story flow`, () => {
  test.use({ viewport: { width: mode.width, height: mode.height }, isMobile: true, hasTouch: true, reducedMotion: mode.motion })
  test('all three moments remain ordered and readable without a desktop narrative trigger', async ({ page }) => {
    await ready(page); await quiet(page)
    const before = await page.evaluate(() => ({ url: location.href, length: history.length }))
    for (const key of keys) {
      const row = narrative(page).locator(`[data-service-step="${key}"]`)
      await row.scrollIntoViewIfNeeded(); await settle(page); await expect(row.locator('h3')).toBeInViewport()
    }
    expect(await page.evaluate(() => ({ url: location.href, length: history.length }))).toEqual(before)
  })
})

test('saved Motion off preserves the complete story in static ordinary flow', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ap-motion', 'off'))
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page); await quiet(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
})
test('forced colors quiet only this community scene and preserve the other Work coordinator', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' })
  await ready(page); await quiet(page)
  await expect(scene(page)).toHaveAttribute('data-community-motion', 'static')
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
  expect((await triggerState(page)).filter(item => item.id === 'atelier-accuflow-assembly')).toHaveLength(1)
})

for (const mode of ['forced-colors', 'reduced-motion'] as const) test(`${mode} recreates one scene after a real preference change without losing native focus`, async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page); await at(page, .5); await proof(page).focus()
  const retained = await proof(page).elementHandle(), counts = [await count(page)]
  if (mode === 'forced-colors') await page.emulateMedia({ forcedColors: 'active' })
  else await page.emulateMedia({ reducedMotion: 'reduce' })
  await quiet(page); counts.push(await count(page))
  await expect(proof(page)).toBeFocused()
  if (mode === 'forced-colors') await page.emulateMedia({ forcedColors: 'none' })
  else await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect.poll(() => count(page)).toBe(1); counts.push(await count(page))
  await at(page, .84); await expect(proof(page)).toBeFocused()
  expect(await retained!.evaluate(node => node === document.activeElement)).toBe(true)
  expect(counts).toEqual([1, 0, 1])
  await readable(page)
  await testInfo.attach('preference-scene-lifecycle', { body: JSON.stringify({ mode, counts, state: await screenshotState(page) }), contentType: 'application/json' })
})

test('leaving Work removes the scene and a native return recreates exactly one owner', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page); await at(page, .84)
  await origin(page).scrollIntoViewIfNeeded(); await settle(page); await origin(page).focus(); await page.keyboard.press('Enter')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect.poll(() => count(page)).toBe(0)
  await page.goBack(); await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(origin(page)).toBeFocused()
  await expect.poll(() => count(page)).toBe(1)
  await at(page, .5); await readable(page)
})

test('responsive cleanup keeps the same native proof and the settled scene does no idle DOM work', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page); await at(page, .5); await proof(page).focus()
  const retained = await proof(page).elementHandle(), observations = []
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    await proof(page).scrollIntoViewIfNeeded(); await settle(page)
    await expect(proof(page)).toBeFocused()
    const expected = width < 1024 ? 0 : 1
    await expect.poll(() => count(page)).toBe(expected)
    if (expected) await at(page, .5); else await quiet(page)
    observations.push({ width, count: await count(page) })
  }
  expect(await retained!.evaluate(node => node === document.activeElement)).toBe(true)
  await settle(page); await page.waitForTimeout(350)
  const mutations = await scene(page).evaluate(async node => {
    let total = 0; const observer = new MutationObserver(items => { total += items.length })
    observer.observe(node, { attributes: true, subtree: true, childList: true, characterData: true })
    await new Promise(resolve => setTimeout(resolve, 500)); observer.disconnect(); return total
  })
  expect(mutations).toBe(0)
  expect(await count(page)).toBe(1)
  await testInfo.attach('responsive-single-owner-idle', { body: JSON.stringify({ observations, mutations }), contentType: 'application/json' })
})
