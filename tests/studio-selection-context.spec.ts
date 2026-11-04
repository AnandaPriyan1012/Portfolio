import { test, expect, type Page, type Locator } from '@playwright/test'

const variants = [
  { width: 1440, height: 1000, touch: false, motion: 'no-preference' as const },
  { width: 390, height: 844, touch: true, motion: 'reduce' as const },
  { width: 320, height: 844, touch: true, motion: 'reduce' as const },
]

type ChoiceSnapshot = { top: number; length: number; state: { apPortfolioPosition: { key: string; url: string; top: number }; filmChoiceSentinel: { preserved: boolean } } }
declare global { interface Window { __filmChoice?: ChoiceSnapshot; __filmChoiceEvents?: string[] } }

async function settled(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  const loaded = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
  expect(loaded).toContain('Syne Variable')
  expect(loaded).toContain('Instrument Sans Variable')
}

async function setup(page: Page) {
  const errors: string[] = [], media: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => {
    const path = new URL(request.url()).pathname
    if (path.endsWith('.mp4') && !path.includes('atmosphere')) media.push(path)
  })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
  return { errors, media }
}

async function recordChoice(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded()
  await target.focus()
  await page.waitForTimeout(250)
  await target.evaluate(node => {
    history.replaceState({ ...history.state, filmChoiceSentinel: { preserved: true } }, '')
    window.__filmChoiceEvents = []
    const capture = () => {
      window.__filmChoice = { top: scrollY, length: history.length, state: structuredClone(history.state) }
    }
    node.addEventListener('click', capture, { capture: true, once: true })
    for (const type of ['hashchange', 'ap:pathnamechange', 'ap:openingchange']) {
      window.addEventListener(type, () => window.__filmChoiceEvents!.push(type), { once: true })
    }
  })
}

async function preservedChoice(page: Page, target: Locator, id: string) {
  await expect(page).toHaveURL(new RegExp(`/studio#${id}$`))
  await expect(target).toBeFocused()
  const before = await page.evaluate(() => window.__filmChoice!)
  const after = await page.evaluate(() => ({ top: scrollY, length: history.length, state: history.state,
    cached: JSON.parse(sessionStorage.getItem('ap-history-positions-v1') ?? '[]'), events: window.__filmChoiceEvents }))
  expect(Math.abs(after.top - before.top)).toBeLessThan(4)
  expect(after.length).toBe(before.length)
  expect(after.state.filmChoiceSentinel).toEqual({ preserved: true })
  expect(after.state.apPortfolioPosition.key).toBe(before.state.apPortfolioPosition.key)
  expect(after.state.apPortfolioPosition.url).toBe(`/studio#${id}`)
  expect(Math.abs(after.state.apPortfolioPosition.top - before.top)).toBeLessThan(4)
  expect(after.cached.find((entry: { key: string }) => entry.key === before.state.apPortfolioPosition.key)).toMatchObject({ url: `/studio#${id}`, top: after.state.apPortfolioPosition.top })
  expect(after.events).toEqual([])
  await page.waitForTimeout(600)
  expect(Math.abs(await page.evaluate(() => scrollY) - before.top)).toBeLessThan(4)
  await expect(target).toBeFocused()
  return { before, after }
}

for (const variant of variants) test.describe(`${variant.width}px deliberate Studio choice`, () => {
  test.use({ viewport: { width: variant.width, height: variant.height }, isMobile: variant.touch,
    hasTouch: variant.touch, reducedMotion: variant.motion })

  test('radio choices retain native position, focus and history metadata while making reload and Back truthful', async ({ page }, testInfo) => {
    test.setTimeout(60000)
    const traffic = await setup(page)
    await page.goto('/about')
    await settled(page)
    const menu = page.getByRole('button', { name: 'Open menu', exact: true })
    if (await menu.isVisible()) await menu.click()
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Studio', exact: true }).click()
    await settled(page)
    const samples = []
    for (const [id, title] of [['vantara', 'Vantara'], ['ted-ed-2026', 'TED-Ed auditions']]) {
      const radio = page.getByRole('radio', { name: title, exact: true })
      await recordChoice(page, radio)
      if (variant.touch) await radio.tap()
      else await page.keyboard.press('Space')
      await expect(radio).toBeChecked()
      await expect(page.locator('.screening-title-card h3')).toHaveText(title)
      samples.push(await preservedChoice(page, radio, id))
    }
    await page.goBack()
    await settled(page)
    await expect(page).toHaveURL(/\/about$/)
    await page.goForward()
    await settled(page)
    await expect(page).toHaveURL(/\/studio#ted-ed-2026$/)
    await expect(page.locator('.screening-title-card h3')).toHaveText('TED-Ed auditions')
    await page.reload()
    await settled(page)
    await expect(page.locator('.screening-title-card h3')).toHaveText('TED-Ed auditions')
    await expect(page.getByRole('radio', { name: 'TED-Ed auditions', exact: true })).toBeChecked()
    expect(await page.evaluate(() => history.state.filmChoiceSentinel)).toEqual({ preserved: true })
    expect(traffic.media).toEqual([])
    expect(traffic.errors).toEqual([])
    await testInfo.attach('manual-film-choice-history', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' })
  })

  test('each playable programme row has a direct Watch action that selects its film and closes back to its stable opener', async ({ page }, testInfo) => {
    const traffic = await setup(page)
    await page.goto('/studio')
    await settled(page)
    const programme = page.locator('.screening-programme')
    await expect(programme.locator('.screening-programme-watch')).toHaveCount(5)
    await expect(page.locator('[data-film-id="cirsmun-2026"] button')).toHaveCount(0)
    await expect(page.getByRole('radio', { name: 'CIRSMUN 2026', exact: true })).toBeDisabled()
    const watch = programme.getByRole('button', { name: 'Watch CIRS website launch', exact: true })
    expect(await watch.evaluate(node => node.closest('label'))).toBeNull()
    await recordChoice(page, watch)
    const bounds = (await watch.boundingBox())!
    expect(bounds.width).toBeGreaterThanOrEqual(44)
    expect(bounds.height).toBeGreaterThanOrEqual(44)
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(variant.width)
    await expect(watch).toBeInViewport()
    expect(traffic.media).toEqual([])
    if (variant.touch) await watch.tap()
    else await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'CIRS website launch', exact: true })
    await expect(dialog).toBeVisible()
    const video = dialog.locator('video.actual-video')
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
    const metadata = await video.evaluate(node => {
      const film = node as HTMLVideoElement
      return { path: new URL(film.currentSrc).pathname, duration: film.duration, paused: film.paused, autoplay: film.autoplay, error: film.error?.code ?? null }
    })
    expect(metadata).toEqual({ path: '/media/cirs-website-launch-web.mp4', duration: 38, paused: true, autoplay: false, error: null })
    await expect(page.getByRole('radio', { name: 'CIRS website launch', exact: true })).toBeChecked()
    const opener = await watch.elementHandle()
    await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.locator('video.actual-video')).toHaveCount(0)
    expect(await opener!.evaluate(node => node.isConnected && document.activeElement === node)).toBe(true)
    await preservedChoice(page, watch, 'cirs-website-launch')
    expect(traffic.media.every(path => path === '/media/cirs-website-launch-web.mp4')).toBe(true)
    expect(traffic.errors).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(variant.width)
    await page.screenshot({ path: `/workspace/cycle-eleven-audit/accessibility/fixed-watch-${variant.width}.png` })
    await testInfo.attach('row-watch-native-metadata', { body: JSON.stringify(metadata, null, 2), contentType: 'application/json' })
  })
})

test('passive desktop scroll previews never rewrite film URLs or add history entries', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await setup(page)
  await page.goto('/studio')
  await settled(page)
  await expect(page.locator('#studio')).toHaveAttribute('data-scroll-programme', 'true')
  await page.getByRole('link', { name: 'Ananda Priyan, home', exact: true }).focus()
  const before = await page.evaluate(() => ({ url: location.href, length: history.length, key: history.state.apPortfolioPosition.key }))
  await page.locator('[data-film-id="ted-ed-2026"]').evaluate(node => {
    const rect = node.getBoundingClientRect()
    scrollTo({ top: scrollY + rect.top + rect.height / 2 - innerHeight / 2, behavior: 'instant' })
  })
  await expect(page.locator('.screening-title-card h3')).toHaveText('TED-Ed auditions')
  expect(await page.evaluate(() => ({ url: location.href, length: history.length, key: history.state.apPortfolioPosition.key }))).toEqual(before)
})

test('programme Watch remains keyboard reachable in forced colors without unlocking unavailable films', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ forcedColors: 'active' })
  await setup(page)
  await page.goto('/studio')
  await settled(page)
  const radio = page.getByRole('radio', { name: 'TED-Ed auditions', exact: true })
  await radio.focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('Tab')
  const watch = page.getByRole('button', { name: 'Watch TED-Ed auditions', exact: true })
  await expect(watch).toBeFocused()
  await expect(watch).toBeInViewport()
  await expect(watch).toHaveCSS('outline-style', 'solid')
  await expect(watch).toHaveCSS('outline-width', '2px')
  await expect(page.locator('[data-film-id="cirsmun-2026"] button')).toHaveCount(0)
})

test('deliberate film choices retain an existing query and normalized trailing-slash route', async ({ page }) => {
  await setup(page)
  await page.goto('/studio/?source=portfolio#vantara')
  await settled(page)
  const ted = page.getByRole('radio', { name: 'TED-Ed auditions', exact: true })
  await ted.focus()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/\/studio\/\?source=portfolio#ted-ed-2026$/)
  expect(await page.evaluate(() => history.state.apPortfolioPosition.url)).toBe('/studio/#ted-ed-2026')
  await expect(ted).toBeFocused()
  await page.reload()
  await settled(page)
  await expect(page.locator('.screening-title-card h3')).toHaveText('TED-Ed auditions')
})
