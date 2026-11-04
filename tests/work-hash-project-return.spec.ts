import { test, expect, type Page } from '@playwright/test'

type Departure = { top: number; hash: string; occurrence: number; trusted: boolean }
declare global { interface Window { __workHashDeparture?: Departure } }
const variants = [
  { width: 1440, height: 1000, motion: 'no-preference' as const, touch: false },
  { width: 390, height: 844, motion: 'no-preference' as const, touch: true },
  { width: 320, height: 844, motion: 'reduce' as const, touch: true },
]
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ap-motion', 'on')
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
})
async function settled(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family === 'Syne Variable' && font.status === 'loaded'))).toBe(true)
  if (process.env.AP_QA_EXPECTED_BUNDLE)
    await expect(page.locator('script[type="module"]')).toHaveAttribute('src', `/assets/${process.env.AP_QA_EXPECTED_BUNDLE}`)
}
async function enter(page: Page, touch: boolean) {
  await page.goto('/work'); await settled(page)
  const index = page.getByRole('navigation', { name: 'Explore selected projects', exact: true }).locator('a[href="#accuflow"]')
  await index.focus(); await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work#accuflow$/)
  // Finish the existing native-index smooth anchor move before positioning the
  // actual case opener; this precondition must not manufacture a departure Y.
  await page.waitForTimeout(1200)
  const origin = page.locator('#accuflow').getByRole('link', { name: 'Project notes', exact: true })
  await origin.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }))
  if (!touch) await origin.focus()
  await page.waitForTimeout(250)
  await expect(origin).toBeInViewport()
  await origin.evaluate(node => node.addEventListener('click', event => {
    window.__workHashDeparture = { top: scrollY, hash: location.hash, trusted: event.isTrusted,
      occurrence: [...document.querySelectorAll('main a[href="/projects/accuflow"]')].indexOf(node) }
  }, { capture: true, once: true }))
  if (touch) await origin.tap(); else await page.keyboard.press('Enter')
  const departure = await page.evaluate(() => window.__workHashDeparture!)
  expect(departure.trusted).toBe(true)
  await expect(page).toHaveURL(/\/projects\/accuflow$/); await settled(page)
  return departure
}
for (const variant of variants) test.describe(`${variant.width}px Work hash case return`, () => {
  test.use({ viewport: { width: variant.width, height: variant.height }, reducedMotion: variant.motion,
    hasTouch: variant.touch, isMobile: variant.touch })
  for (const method of ['native', 'explicit'] as const) test(`${method} return retains original project opener, Work hash and exact Y`, async ({ page }, testInfo) => {
    test.setTimeout(45000)
    const departure = await enter(page, variant.touch)
    if (method === 'native') await page.goBack()
    else {
      const back = page.getByRole('button', { name: 'Back to portfolio', exact: true })
      if (variant.touch) await back.tap(); else { await back.focus(); await page.keyboard.press('Enter') }
    }
    await settled(page)
    const origin = page.locator('#accuflow').getByRole('link', { name: 'Project notes', exact: true })
    const state = await page.evaluate(() => ({ url: location.href, top: scrollY, focus: document.activeElement?.outerHTML.slice(0, 300), history: history.state?.apPortfolioPosition }))
    await testInfo.attach('Work-case-return-state', { body: JSON.stringify({ departure, returned: state }, null, 2), contentType: 'application/json' })
    await expect(page).toHaveURL(/\/work#accuflow$/)
    await expect(origin).toBeFocused(); await expect(origin).toBeInViewport()
    expect(await origin.getAttribute('tabindex')).toBeNull()
    await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), departure.top)).toBeLessThan(4)
    await page.locator('#accuflow img').first().evaluate(node => node.dispatchEvent(new Event('load')))
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
    await page.waitForTimeout(900)
    await expect(origin).toBeFocused()
    expect(Math.abs(await page.evaluate(() => scrollY) - departure.top)).toBeLessThan(4)
    expect(await origin.evaluate(node => [...document.querySelectorAll('main a[href="/projects/accuflow"]')].indexOf(node))).toBe(departure.occurrence)
    await testInfo.attach('Work-case-restored-position', { body: JSON.stringify({ departure, returnedTop: await page.evaluate(() => scrollY), hash: await page.evaluate(() => location.hash) }), contentType: 'application/json' })
  })
  test('a fresh Work hash still reaches its section anchor', async ({ page }) => {
    await page.goto('/work#accuflow'); await settled(page)
    await page.waitForTimeout(1200)
    await expect(page).toHaveURL(/\/work#accuflow$/)
    const target = page.locator('#accuflow')
    await expect(target.locator('.feature-heading')).toBeInViewport()
    const distance = () => target.evaluate(node => Math.abs(node.getBoundingClientRect().top -
      Math.ceil(document.querySelector('.site-header')!.getBoundingClientRect().height) - 20))
    await expect.poll(distance).toBeLessThan(4)
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
    await page.waitForTimeout(600)
    expect(await distance()).toBeLessThan(4)
  })
})
