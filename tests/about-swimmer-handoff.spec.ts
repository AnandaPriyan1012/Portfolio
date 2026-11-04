import { test, expect, type Page } from '@playwright/test'

const variants = [
  { width: 390, motion: 'no-preference' as const },
  { width: 320, motion: 'no-preference' as const },
  { width: 390, motion: 'reduce' as const },
]

test.beforeEach(async ({ page, request }) => {
  if (process.env.AP_QA_EXPECTED_BUNDLE) expect(await (await request.get('/')).text()).toContain(process.env.AP_QA_EXPECTED_BUNDLE)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
})
async function ready(page: Page, path = '/about') {
  await page.goto(path)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  const fonts = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
  expect(fonts).toContain('Syne Variable')
  expect(fonts).toContain('Instrument Sans Variable')
}
async function arrived(page: Page) {
  await expect(page).toHaveURL(/\/about#about$/)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  const heading = page.locator('#about > h2')
  const swimmer = page.getByRole('tab', { name: 'Swimmer', exact: true })
  await expect(swimmer).toHaveAttribute('aria-selected', 'true')
  await expect(heading).toBeFocused()
  await expect(heading).toBeInViewport()
  await expect.poll(async () => (await heading.boundingBox())!.y).toBeGreaterThanOrEqual(60)
  await expect.poll(async () => (await heading.boundingBox())!.y).toBeLessThan(180)
  await expect(page.locator('.about-identity-swimming dd')).toHaveText(['41.48 s', '1 min 6 s'])
  await page.waitForTimeout(1000)
  await expect(heading).toBeFocused()
  await expect(heading).toBeInViewport()
  expect((await heading.boundingBox())!.y).toBeLessThan(180)
  await page.keyboard.press('Tab')
  await expect(swimmer).toBeFocused()
  await expect(swimmer).toBeInViewport()
}
for (const variant of variants) test.describe(`${variant.width}px ${variant.motion} Swimmer handoff`, () => {
  test.use({ viewport: { width: variant.width, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: variant.motion })
  test('the same-page footer tour reaches the visible selected lane after its layout refresh', async ({ page }, testInfo) => {
    await ready(page)
    await expect(page.getByRole('tab', { name: 'Builder', exact: true })).toHaveAttribute('aria-selected', 'true')
    const launcher = page.getByRole('button', { name: 'Take the 60-second tour', exact: true })
    await launcher.focus(); await page.keyboard.press('Enter')
    for (let step = 0; step < 4; step++) await page.getByRole('button', { name: 'Next tour chapter', exact: true }).click()
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1000)
    await page.getByRole('button', { name: 'Meet the swimmer', exact: true }).click()
    await arrived(page)
    await expect(page.locator('.tour-panel')).toHaveCount(0)
    await testInfo.attach('footer-tour-swimmer-visible-destination', { body: JSON.stringify({ y: await page.evaluate(() => scrollY), heading: await page.locator('#about > h2').boundingBox() }), contentType: 'application/json' })
  })
  test('the same-page AP OS handoff reaches the visible selected lane from Builder', async ({ page }) => {
    await ready(page)
    await expect(page.getByRole('tab', { name: 'Builder', exact: true })).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('button', { name: 'AP OS', exact: true }).tap()
    await page.getByRole('button', { name: 'Open Swimming', exact: true }).tap()
    await page.getByRole('button', { name: 'Meet the person', exact: true }).tap()
    await arrived(page)
    await expect(page.getByRole('dialog', { name: 'AP OS', exact: true })).toHaveCount(0)
  })
})

test('a normal-motion phone cross-page tour still reaches the existing Swimmer destination', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
  await ready(page, '/work')
  await page.getByRole('button', { name: 'Take the 60-second tour', exact: true }).tap()
  for (let step = 0; step < 4; step++) await page.getByRole('button', { name: 'Next tour chapter', exact: true }).tap()
  await page.getByRole('button', { name: 'Meet the swimmer', exact: true }).tap()
  await arrived(page)
  await context.close()
})
