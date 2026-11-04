import { test as base, expect, type Page } from '@playwright/test'

const test = base.extend<{ guard: void }>({
  guard: [async ({ page }, use) => {
    const errors: string[] = [], movies: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (/\.mp4(?:\?|$)|drive\.google\.com|googlevideo\.com/.test(request.url())) movies.push(request.url()) })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 })
      Object.defineProperty(navigator, 'deviceMemory', { value: 8 })
    })
    await use()
    expect(errors).toEqual([])
    expect(movies, 'Inspecting selected-film context never opens a movie or third-party player').toEqual([])
  }, { auto: true }],
})

async function ready(page: Page, id = 'cirs-website-launch') {
  await page.goto(`/studio${id ? `#${id}` : ''}`)
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
  const fonts = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
  expect(fonts).toContain('Syne Variable'); expect(fonts).toContain('Instrument Sans Variable')
}

async function wheelToVantara(page: Page) {
  const row = page.locator('.screening-programme [data-film-id="vantara"]')
  const delta = await row.evaluate(row => { const rect = row.getBoundingClientRect(); return rect.top + rect.height / 2 - innerHeight / 2 })
  await page.mouse.move(12, 480)
  await page.mouse.wheel(0, delta)
  await expect.poll(() => row.evaluate(row => { const rect = row.getBoundingClientRect(); return Math.abs(rect.top + rect.height / 2 - innerHeight / 2) })).toBeLessThan(3)
}

test.describe('normal desktop selected evidence', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('a focused real moment survives scroll preview, then focus exit permits preview again', async ({ page }) => {
    await ready(page)
    await expect(page.locator('#studio')).toHaveAttribute('data-scroll-programme', 'true')
    await page.getByRole('radio', { name: 'CIRS website launch', exact: true }).focus()
    const moment = page.getByRole('button', { name: 'Open CIRS website launch at 00:26', exact: true })
    for (let step = 0; step < 8 && !await moment.evaluate(node => node === document.activeElement); step++) await page.keyboard.press('Tab')
    await expect(moment).toBeFocused()
    const original = await moment.elementHandle()
    await wheelToVantara(page)
    expect(await original!.evaluate(node => ({ connected: node.isConnected, focused: node === document.activeElement }))).toEqual({ connected: true, focused: true })
    await expect(page.locator('.screening-title-card h3')).toHaveText('CIRS website launch')
    await page.getByRole('link', { name: 'Ananda Priyan, home', exact: true }).focus()
    await expect(page.locator('.screening-title-card h3')).toHaveText('Vantara')
  })
  test('the related native action shares the focused evidence guard', async ({ page }) => {
    await ready(page)
    const link = page.getByRole('link', { name: 'Read the CIRS website case study', exact: true })
    await link.focus()
    const original = await link.elementHandle()
    await wheelToVantara(page)
    expect(await original!.evaluate(node => ({ connected: node.isConnected, focused: node === document.activeElement }))).toEqual({ connected: true, focused: true })
    await expect(page.locator('.screening-title-card h3')).toHaveText('CIRS website launch')
  })
  test('initial page-heading focus does not suppress ordinary passive film preview', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('.state-opening')).toHaveCount(0)
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Studio', exact: true }).click()
    await expect(page.locator('.state-opening')).toHaveCount(0)
    const heading = page.locator('.screening-heading h1')
    await expect(heading).toBeFocused()
    const before = await page.evaluate(() => ({ url: location.href, length: history.length }))
    await wheelToVantara(page)
    await expect(page.locator('.screening-title-card h3')).toHaveText('Vantara')
    expect(await page.evaluate(() => ({ url: location.href, length: history.length }))).toEqual(before)
  })
})

for (const width of [320, 390, 1440]) test(`${width}px CIRS context uses the existing frame header and genuine artifacts`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 })
  await ready(page)
  const frames = page.locator('.film-moments'), related = frames.locator('.film-moments-related')
  await expect(related).toContainText('The film shows an Admissions Guide view at 00:26.')
  await expect(related).toContainText('my website work with the school’s team')
  await expect(frames.locator('header .film-moments-related')).toHaveCount(1)
  await expect(frames.getByRole('button')).toHaveCount(3)
  await expect(related.getByRole('link')).toHaveAttribute('href', '/projects/cirs')
  expect((await related.getByRole('link').boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await expect(page.locator('.screening-programme')).toBeAttached()
  const ordered = await page.evaluate(() => Boolean(document.querySelector('.screening-programme')!.compareDocumentPosition(document.querySelector('.film-moments-related')!) & Node.DOCUMENT_POSITION_FOLLOWING))
  expect(ordered).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})

for (const mode of ['light', 'forced-colors'] as const) test(`${mode} preserves the readable native related-work action`, async ({ page }) => {
  if (mode === 'light') await page.addInitScript(() => localStorage.setItem('ap-atelier-theme', 'light'))
  else await page.emulateMedia({ forcedColors: 'active' })
  await ready(page)
  const link = page.getByRole('link', { name: 'Read the CIRS website case study', exact: true })
  await link.focus(); await expect(link).toBeFocused()
  await expect(link).toHaveCSS('outline-style', 'solid')
  await expect(link).toHaveCSS('outline-width', '2px')
})

for (const change of ['approval', 'source'] as const) test(`a ${change} mismatch cannot invent the CIRS time-specific context`, async ({ page }) => {
  await page.route('**/src/content.ts*', async route => {
    const response = await route.fetch(), mutation = change === 'approval' ? 'film.nativePlaybackApproved=false' : "film.videoUrl='/media/vantara-masquerade-web-720p.mp4'"
    await route.fulfill({ response, body: `${await response.text()}\n;{const film=creativeMedia.find(film=>film.id==='cirs-website-launch');${mutation};}\n` })
  })
  await ready(page)
  await expect(page.locator('.film-moments-related')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Read the CIRS website case study', exact: true })).toHaveCount(0)
})

for (const action of ['modified', 'middle'] as const) test(`${action} related-work activation stays native and leaves Studio intact`, async ({ page, context }) => {
  await ready(page)
  const link = page.getByRole('link', { name: 'Read the CIRS website case study', exact: true })
  const [popup] = await Promise.all([context.waitForEvent('page'), link.click(action === 'middle' ? { button: 'middle' } : { modifiers: ['ControlOrMeta'] })])
  await expect(popup).toHaveURL(/\/projects\/cirs$/)
  await expect(page).toHaveURL(/\/studio#cirs-website-launch$/)
  await expect(page.locator('.screening-title-card h3')).toHaveText('CIRS website launch')
  await popup.close()
})

test('the native related-case fallback returns to the deliberate CIRS fragment', async ({ page }) => {
  await ready(page)
  await page.getByRole('link', { name: 'Read the CIRS website case study', exact: true }).click()
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/studio#cirs-website-launch$/)
  await expect(page.locator('.screening-title-card h3')).toHaveText('CIRS website launch')
})
