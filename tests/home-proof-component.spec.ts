import { test as base, expect, type Page } from '@playwright/test'

const test = base.extend<{ errors: void }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 })
      Object.defineProperty(navigator, 'deviceMemory', { value: 8 })
    })
    await use(); expect(errors).toEqual([])
  }, { auto: true }],
})

async function ready(page: Page, decode = true) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
  const proof = page.locator('.home-cirs-proof')
  await proof.scrollIntoViewIfNeeded()
  if (decode) {
    for (const image of await proof.locator('img').all()) await image.evaluate(image => (image as HTMLImageElement).decode())
    await expect(proof.locator('.home-proof-fallback')).toHaveCount(0)
  }
  return proof
}

// Exercises the documented component boundary. Actual scroll integration is
// covered by home-proof-story.spec.ts, rather than synthesized by this helper.
async function metadata(page: Page, mode: 'scroll' | 'static', view: 'campus' | 'admissions', progress: number) {
  await page.locator('.home-cirs-proof').evaluate((proof, state) => {
    const frame = proof as HTMLElement
    frame.dataset.proofMode = state.mode; frame.dataset.proofView = state.view
    frame.style.setProperty('--home-proof-progress', String(state.progress))
    frame.dispatchEvent(new Event('ap:cirs-proof-change'))
  }, { mode, view, progress })
}

test('the root opacity variable blends valid sources while one effective source keeps semantics aligned', async ({ page }) => {
  const proof = await ready(page)
  await expect(proof).toHaveAttribute('data-effective-proof', 'admissions')
  await metadata(page, 'scroll', 'campus', .25)
  await expect(proof).toHaveAttribute('data-proof-blend', 'true')
  await expect(proof.locator('.cirs-browser-image')).toHaveCount(1)
  await expect(proof.locator('.cirs-browser-image')).toHaveAttribute('alt', /Actual public CIRS homepage/)
  await expect(proof.locator('.cirs-browser-body')).toHaveAttribute('href', 'https://cirschool.org')
  await expect(proof.locator('[data-proof-layer="campus"]')).toHaveCSS('opacity', '0.75')
  await expect(proof.locator('[data-proof-layer="admissions"]')).toHaveCSS('opacity', '0.25')
  await metadata(page, 'scroll', 'admissions', .75)
  await expect(proof).toHaveAttribute('data-effective-proof', 'admissions')
  await expect(proof.locator('.home-proof-address')).toHaveText('cirschool.org/admissions.html')
  await expect(proof.locator('.cirs-browser-body')).toHaveAttribute('aria-label', 'Visit the CIRS Admissions Guide')
  await expect(proof.locator('[data-proof-layer="campus"]')).toHaveAttribute('aria-hidden', 'true')
  await expect(proof.locator('[data-proof-layer="admissions"]')).toHaveAttribute('aria-hidden', 'false')
})

test('manual and external-link focus override scroll; the stable case link does not freeze stale restoration state', async ({ page }) => {
  const proof = await ready(page)
  await metadata(page, 'scroll', 'campus', 0)
  await proof.getByRole('button', { name: 'Show Admissions Guide', exact: true }).click()
  await metadata(page, 'scroll', 'campus', 0)
  await expect(proof).toHaveAttribute('data-effective-proof', 'admissions')
  await expect(proof).toHaveAttribute('data-proof-owner', 'manual')
  await proof.getByRole('button', { name: 'Follow scroll', exact: true }).click()
  await expect(proof).toHaveAttribute('data-effective-proof', 'campus')
  await proof.locator('.cirs-browser-body').focus()
  await metadata(page, 'scroll', 'admissions', 1)
  await expect(proof).toHaveAttribute('data-effective-proof', 'campus')
  await expect(proof.locator('.cirs-browser-body')).toHaveAttribute('href', 'https://cirschool.org')
  await expect(proof.locator('[data-proof-layer="campus"]')).toHaveCSS('opacity', '1')
  await proof.getByRole('link', { name: 'Read the CIRS case study', exact: true }).focus()
  await expect(proof).toHaveAttribute('data-effective-proof', 'admissions')
  await expect(proof).not.toHaveAttribute('data-proof-owner', 'focus')
})

test('a requested but undecoded page retains the actual valid proof, href and alt until ready', async ({ page }) => {
  let release = () => {}
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/media/atlas-cirs-admissions-desktop.webp', async route => { await held; await route.continue() })
  const proof = await ready(page, false)
  await proof.locator('[data-proof-layer="campus"] img').evaluate(image => (image as HTMLImageElement).decode())
  await proof.getByRole('button', { name: 'Show Campus overview', exact: true }).click()
  await expect(proof).toHaveAttribute('data-effective-proof', 'campus')
  await metadata(page, 'scroll', 'admissions', 1)
  await proof.getByRole('button', { name: 'Follow scroll', exact: true }).click()
  await expect(proof).toHaveAttribute('data-effective-proof', 'campus')
  await expect(proof.locator('.cirs-browser-body')).toHaveAttribute('href', 'https://cirschool.org')
  await expect(proof.locator('.cirs-browser-image')).toHaveAttribute('alt', /Actual public CIRS homepage/)
  await expect(proof.locator('.home-proof-fallback')).toHaveCount(0)
  release()
  await expect(proof).toHaveAttribute('data-effective-proof', 'admissions')
  await expect(proof.locator('.cirs-browser-body')).toHaveAttribute('href', 'https://cirschool.org/admissions.html')
})

test('Follow scroll keeps its focused node when the host changes to a quiet mode', async ({ page }) => {
  const proof = await ready(page)
  await metadata(page, 'scroll', 'campus', 0)
  const follow = proof.getByRole('button', { name: 'Follow scroll', exact: true })
  await follow.click()
  const node = await follow.elementHandle()
  await metadata(page, 'static', 'admissions', 1)
  expect(await node!.evaluate(node => ({ connected: node.isConnected, focused: node === document.activeElement }))).toEqual({ connected: true, focused: true })
  await expect(follow).toHaveAttribute('aria-disabled', 'true')
  await proof.getByRole('link', { name: 'Read the CIRS case study', exact: true }).focus()
  await expect(follow).toHaveCount(0)
})

test('one failed view leaves the other usable and does not disable the capable scene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route('**/media/atlas-cirs-admissions-desktop.webp', route => route.abort())
  const proof = await ready(page, false)
  await expect(proof.getByRole('button', { name: 'Show Admissions Guide', exact: true })).toHaveAttribute('aria-disabled', 'true')
  await expect(proof).toHaveAttribute('data-effective-proof', 'campus')
  await expect(proof.locator('.home-proof-fallback')).toHaveCount(0)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
})

test('both failed views produce an honest reserved fallback and notify the host', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route(/\/media\/atlas-cirs-(?:home|admissions)-desktop\.webp$/, route => route.abort())
  const proof = await ready(page, false)
  await expect(proof.locator('.home-proof-caption')).toHaveText('Website captures unavailable')
  await expect(proof.locator('.home-proof-fallback')).toContainText('The captures could not load.')
  await expect(proof.getByRole('link', { name: 'Read the CIRS case study', exact: true })).toHaveAttribute('href', '/projects/cirs')
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
})

test('an explicit view choice survives ordinary SPA unmount and return without storage or URL flags', async ({ page }) => {
  const proof = await ready(page)
  await proof.getByRole('button', { name: 'Show Campus overview', exact: true }).click()
  await expect(proof).toHaveAttribute('data-proof-owner', 'manual')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Work', exact: true }).click()
  await expect(page).toHaveURL(/\/work$/)
  await page.getByRole('link', { name: 'Ananda Priyan, home', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(proof).toHaveAttribute('data-effective-proof', 'campus')
  await expect(proof).toHaveAttribute('data-proof-owner', 'manual')
})
