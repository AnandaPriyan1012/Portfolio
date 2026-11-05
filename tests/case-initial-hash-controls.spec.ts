import { test, expect, type Page } from '@playwright/test'

const errors = new WeakMap<Page, string[]>()
declare global { interface Window { __c17InitialHashDeparture?: number } }

test.beforeEach(async ({ page }) => {
  const messages: string[] = []
  errors.set(page, messages)
  page.on('pageerror', error => messages.push(error.message))
  await page.addInitScript(() => {
    localStorage.setItem('ap-motion', 'on')
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
})
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]) })

async function settled(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family)))
    .toEqual(expect.arrayContaining(['Syne Variable', 'Instrument Sans Variable']))
  if (process.env.AP_QA_EXPECTED_BUNDLE)
    await expect(page.locator('script[type="module"]')).toHaveAttribute('src', `/assets/${process.env.AP_QA_EXPECTED_BUNDLE}`)
}

test('unknown, malformed and nonchapter fragments never force an initial chapter arrival', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const hash of ['#not-a-case-chapter', '#%E0%A4%A', '#case-top', '#root']) {
    await page.goto('/projects/cirs' + hash)
    await settled(page)
    await page.waitForTimeout(500)
    expect(new URL(page.url()).hash).toBe(hash)
    expect(await page.evaluate(() => scrollY)).toBe(0)
    await expect(page.locator('[data-reader-chapter]:focus')).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: 'Case study chapters' }).locator('[aria-current="location"]')).toHaveCount(0)
  }
})

test('fresh unhashed entry and the native next-case link keep the case beginning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/projects/cirs')
  await settled(page)
  expect(await page.evaluate(() => scrollY)).toBe(0)
  const next = page.locator('.case-next-story')
  await expect(next).toHaveAttribute('href', '/projects/community')
  await next.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/community$/)
  await settled(page)
  await expect(page.locator('h1')).toBeFocused()
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await page.locator('.case-media img').evaluate(node => (node as HTMLImageElement).decode())
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await expect(page.locator('h1')).toBeFocused()
})

for (const input of ['wheel', 'keyboard'] as const) test(`genuine ${input} input cancels a pending initial arrival before held image readiness`, async ({ page }, testInfo) => {
  test.setTimeout(45000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  let release!: () => void, started!: () => void
  const hold = new Promise<void>(resolve => { release = resolve })
  const requested = new Promise<void>(resolve => { started = resolve })
  const imagePath = '**/media/cirs-home-desktop.webp'
  await page.route(imagePath, async route => {
    started()
    await hold
    await route.continue()
  })
  try {
    await page.goto('/projects/cirs#case-cirs-admissions', { waitUntil: 'domcontentloaded' })
    await page.locator('.case-page').waitFor({ state: 'attached' })
    await requested
    const back = page.getByRole('button', { name: 'Back to portfolio', exact: true })
    await back.focus()
    if (input === 'wheel') {
      // Position above the held hero so ordinary image scroll anchoring cannot
      // masquerade as the initial-chapter correction this input must cancel.
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.mouse.move(10, 300)
      await page.mouse.wheel(0, 240)
    } else await page.keyboard.press('Home')
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await page.waitForTimeout(180)
    const preferred = await page.evaluate(() => ({ top: scrollY, hash: location.hash }))
    await expect(back).toBeFocused()
    release()
    await page.waitForLoadState('load')
    await page.locator('.case-media img').evaluate(node => (node as HTMLImageElement).decode())
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(900)
    await expect(back).toBeFocused()
    await expect(page.locator('#case-cirs-admissions')).not.toBeFocused()
    expect(new URL(page.url()).hash).toBe(preferred.hash)
    expect(Math.abs(await page.evaluate(() => scrollY) - preferred.top)).toBeLessThan(4)
    await testInfo.attach('cancelled-initial-arrival', { body: JSON.stringify({ input, preferred, finalTop: await page.evaluate(() => scrollY) }), contentType: 'application/json' })
  } finally {
    release()
    await page.unroute(imagePath)
  }
})

test('mounted native chapter history and capture dismissal retain exact native source focus and Y', async ({ page }, testInfo) => {
  test.setTimeout(45000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/projects/cirs')
  await settled(page)
  await page.locator('.case-media img').evaluate(node => (node as HTMLImageElement).decode())
  const admissions = page.getByRole('navigation', { name: 'Case study chapters' })
    .getByRole('link', { name: 'The Admissions page', exact: true })
  await admissions.focus()
  await admissions.evaluate(node => node.addEventListener('click', () => { window.__c17InitialHashDeparture = scrollY }, { capture: true, once: true }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#case-cirs-admissions$/)
  await expect(page.locator('#case-cirs-admissions')).toBeFocused()
  await expect(admissions).toHaveAttribute('aria-current', 'location')
  const departure = await page.evaluate(() => window.__c17InitialHashDeparture!)
  const opener = page.getByRole('button', { name: 'View larger capture: CIRS Admissions Guide', exact: true })
  await opener.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'CIRS Admissions Guide', exact: true })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await expect(admissions).toBeFocused()
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), departure)).toBeLessThan(4)
  await page.waitForTimeout(700)
  await expect(admissions).toBeFocused()
  expect(Math.abs(await page.evaluate(() => scrollY) - departure)).toBeLessThan(4)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  await page.goForward()
  await expect(page).toHaveURL(/#case-cirs-admissions$/)
  await expect(page.locator('#case-cirs-admissions')).toBeInViewport()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await testInfo.attach('mounted-native-history', { body: JSON.stringify({ departure, exactNativeSourceFocusRestored: true, forwardDidNotReopenCapture: true }), contentType: 'application/json' })
})
