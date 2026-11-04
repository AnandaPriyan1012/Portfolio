import { test as base, expect, type Page } from '@playwright/test'

const origins = [
  { id: 'cirs', label: 'Open the CIRS case study', desktop: 'atlas-cirs-admissions-desktop.webp', mobile: 'atlas-cirs-admissions-mobile.webp' },
  { id: 'community', label: 'Open the Vallalar case study', desktop: 'vallalar-language-ta-desktop.webp', mobile: 'vallalar-language-ta-mobile.webp' },
] as const

const test = base.extend<{ guard: void }>({
  guard: [async ({ context, page }, use) => {
    const errors: string[] = [], media: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    context.on('request', request => { if (/\.mp4(?:\?|$)|drive\.google\.com|googlevideo\.com/.test(request.url())) media.push(request.url()) })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true })
    })
    await use()
    expect(errors).toEqual([])
    expect(media, 'Reading the two origin stories loads no video or third-party player').toEqual([])
  }, { auto: true }],
})

async function ready(page: Page) {
  await page.goto('/about')
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
  const loaded = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
  expect(loaded).toContain('Syne Variable')
  expect(loaded).toContain('Instrument Sans Variable')
  return page.locator('.about-origins')
}

for (const width of [320, 390, 1440]) test(`the ${width}px story uses genuine responsive evidence, truthful context and two native case links`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 })
  const section = await ready(page)
  await expect(page.locator('h1')).toHaveText('Ananda Priyan.')
  await expect(section.locator('article')).toHaveCount(2)
  await expect(section.locator('a')).toHaveCount(2)
  await expect(section.locator('button,video,iframe')).toHaveCount(0)
  await expect(section.locator('.about-origin-cirs h3')).toHaveText('I proposed refreshingour school website.')
  await expect(section).toContainText('The school assembled a team.')
  await expect(section).toContainText('After helping prepare and distribute meals')
  await expect(section).toContainText('a role I’ve held since 2023')
  await expect(section).not.toContainText(/official timing|personally translated|increased.*reach|launched.*2023/i)
  await expect(page.getByRole('tablist', { name: 'Explore my different lanes' }).getByRole('tab')).toHaveCount(4)
  for (const origin of origins) {
    const scene = section.locator(`[data-about-origin="${origin.id}"]`)
    const image = scene.locator('img')
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(image => (image as HTMLImageElement).decode())
    const geometry = await image.evaluate(image => {
      const img = image as HTMLImageElement, box = img.getBoundingClientRect(), aperture = img.closest('.about-origin-aperture')!.getBoundingClientRect()
      const scale = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight)
      const visibleHeight = box.height / scale
      const cropTop = (img.naturalHeight - visibleHeight) * .65
      return { src: new URL(img.currentSrc).pathname, fit: getComputedStyle(img).objectFit, position: getComputedStyle(img).objectPosition, complete: img.complete && img.naturalWidth > 0, contained: box.left >= aperture.left - 1 && box.right <= aperture.right + 1 && box.top >= aperture.top - 1 && box.bottom <= aperture.bottom + 1, cropTop, cropBottom: cropTop + visibleHeight }
    })
    const detail = width < 768 && origin.id === 'cirs'
    expect(geometry).toMatchObject({ src: `/media/${width < 768 ? origin.mobile : origin.desktop}`, fit: detail ? 'cover' : 'contain', complete: true, contained: true })
    if (detail) {
      expect(geometry.position).toBe('50% 65%')
      expect(geometry.cropTop).toBeGreaterThan(295)
      expect(geometry.cropTop).toBeLessThan(303)
      expect(geometry.cropBottom).toBeGreaterThan(835)
      expect(geometry.cropBottom).toBeLessThan(843)
      await expect(scene.locator('.about-origin-caption-detail')).toBeVisible()
      await expect(scene.locator('.about-origin-caption-detail')).toHaveText('Admissions detail · Actual website capture · 4 Nov 2026')
      await expect(scene.locator('.about-origin-caption-full')).toBeHidden()
    } else if (origin.id === 'cirs') {
      await expect(scene.locator('.about-origin-caption-detail')).toBeHidden()
      await expect(scene.locator('.about-origin-caption-full')).toBeVisible()
    }
    const link = scene.getByRole('link', { name: origin.label, exact: true })
    await expect(link).toHaveAttribute('href', `/projects/${origin.id}`)
    const bounds = (await link.boundingBox())!
    expect(bounds.height).toBeGreaterThanOrEqual(44)
    await expect(scene.locator('.about-origin-proof > figcaption')).toContainText(origin.id === 'community' ? 'Website review preview' : 'Actual website capture')
    await expect(scene.locator('.about-origin-copy')).toHaveCSS('opacity', '1')
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})

for (const origin of origins) test(`keyboard opens the ${origin.id} case from its origin story`, async ({ page }) => {
  const section = await ready(page)
  const link = section.getByRole('link', { name: origin.label, exact: true })
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/projects/${origin.id}$`))
  await expect(page.locator('main h1')).toBeVisible()
})

for (const action of ['modified', 'middle'] as const) test(`${action} origin links keep their native new-tab behavior`, async ({ page, context }) => {
  const section = await ready(page)
  for (const origin of origins) {
    const [popup] = await Promise.all([context.waitForEvent('page'), section.getByRole('link', { name: origin.label, exact: true }).click(action === 'middle' ? { button: 'middle' } : { modifiers: ['ControlOrMeta'] })])
    await expect(popup).toHaveURL(new RegExp(`/projects/${origin.id}$`))
    await expect(page).toHaveURL(/\/about$/)
    await popup.close()
  }
})

for (const mode of ['reduced', 'motion off', 'forced colors', 'Save Data', 'low CPU', 'low memory', 'phone'] as const) test(`${mode} keeps the stories static and readable`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference', forcedColors: mode === 'forced colors' ? 'active' : 'none' })
  if (mode === 'motion off') await page.addInitScript(() => localStorage.setItem('ap-motion', 'off'))
  if (mode === 'Save Data') await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: Object.assign(new EventTarget(), { saveData: true }), configurable: true }))
  if (mode === 'low CPU') await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 }))
  if (mode === 'low memory') await page.addInitScript(() => Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 }))
  if (mode === 'phone') await page.setViewportSize({ width: 390, height: 844 })
  const section = await ready(page)
  await expect(section).toHaveAttribute('data-origins-motion', 'static')
  for (const glass of await section.locator('.about-origin-glass').all()) await expect(glass).toHaveCSS('transform', 'none')
  for (const copy of await section.locator('.about-origin-copy').all()) await expect(copy).toHaveCSS('opacity', '1')
  const link = section.getByRole('link', { name: origins[1].label, exact: true })
  await link.focus()
  await expect(link).toBeFocused()
  await expect(link).not.toHaveCSS('outline-style', 'none')
})

test('desktop scroll stages only the proof planes, then reduced motion clears the transforms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const section = await ready(page)
  await expect(section).toHaveAttribute('data-origins-motion', 'staged')
  const scene = section.locator('[data-about-origin="cirs"]'), glass = scene.locator('.about-origin-glass')
  const top = await scene.evaluate(scene => scene.getBoundingClientRect().top + window.scrollY)
  await page.evaluate(top => window.scrollTo(0, top - innerHeight + 80), top)
  await page.waitForTimeout(120)
  const start = await glass.evaluate(glass => getComputedStyle(glass).transform)
  await page.evaluate(top => window.scrollTo(0, top + 150), top)
  await expect.poll(() => glass.evaluate(glass => getComputedStyle(glass).transform)).not.toBe(start)
  await expect(scene.locator('.about-origin-copy')).toHaveCSS('transform', 'none')
  await expect(scene.locator('.about-origin-copy')).toHaveCSS('opacity', '1')
  await expect(section.locator('.pin-spacer')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(section).toHaveAttribute('data-origins-motion', 'static')
  for (const proof of await section.locator('.about-origin-glass').all()) await expect(proof).toHaveCSS('transform', 'none')
})

test('an unavailable capture preserves its reserved frame and the matching real case action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  let release = () => {}
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/media/atlas-cirs-admissions-mobile.webp', async route => { await held; await route.abort() })
  await page.goto('/about', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
  const scene = page.locator('[data-about-origin="cirs"]'), aperture = scene.locator('.about-origin-aperture')
  await aperture.scrollIntoViewIfNeeded()
  const before = await aperture.boundingBox()
  release()
  await expect(scene.locator('.about-origin-fallback')).toBeVisible()
  expect(await aperture.boundingBox()).toEqual(before)
  await scene.getByRole('link', { name: origins[0].label, exact: true }).click()
  await expect(page).toHaveURL(/\/projects\/cirs$/)
})
