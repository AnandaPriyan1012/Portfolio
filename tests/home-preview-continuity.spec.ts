import { test, expect, type Page } from '@playwright/test'

declare global { interface Window { __homeDeparture?: number } }
const variants = [
  { width: 1440, height: 1000, motion: 'no-preference' as const, touch: false },
  { width: 390, height: 844, motion: 'reduce' as const, touch: true },
  { width: 320, height: 844, motion: 'reduce' as const, touch: true },
]

async function loaded(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family === 'Syne Variable' && font.status === 'loaded'))).toBe(true)
}
async function home(page: Page) { await page.goto('/'); await loaded(page) }
async function choose(page: Page, label: string) {
  const control = page.getByRole('button', { name: label, exact: true })
  await control.scrollIntoViewIfNeeded(); await control.click()
}
async function enterPreview(page: Page) {
  const link = page.locator('a[data-home-origin="selected-preview"]')
  await link.scrollIntoViewIfNeeded(); await link.focus()
  await page.waitForTimeout(100)
  await link.evaluate(node => node.addEventListener('click', () => { window.__homeDeparture = scrollY }, { capture: true, once: true }))
  await page.keyboard.press('Enter')
  return page.evaluate(() => window.__homeDeparture!)
}
async function restored(page: Page, top: number, href: string) {
  await expect(page).toHaveURL(/\/$/); await loaded(page)
  const link = page.locator('a[data-home-origin="selected-preview"]')
  await expect(link).toHaveAttribute('href', href)
  await expect(link).toBeFocused(); await expect(link).toBeInViewport()
  expect(await link.getAttribute('tabindex')).toBeNull()
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), top)).toBeLessThan(4)
}

for (const variant of variants) {
  test(`${variant.width}px contextual project action preserves Home selection, native focus and exact return position`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: variant.width, height: variant.height },
      reducedMotion: variant.motion, isMobile: variant.touch, hasTouch: variant.touch })
    const page = await context.newPage()
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
    try {
      await home(page); await choose(page, 'Preview Vallalar capture')
      await expect(page.locator('.ap-select-caption')).toHaveAttribute('href', '/projects/community')
      const before = await enterPreview(page)
      expect(before).toBeGreaterThan(1000)
      await expect(page).toHaveURL(/\/projects\/community$/); await loaded(page)
      await expect(page.locator('h1')).toBeFocused()
      await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
      await restored(page, before, '/projects/community')
      await expect(page.getByRole('button', { name: 'Preview Vallalar capture', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await page.keyboard.press('Tab')
      await expect(page.locator('.home-directory-pages a[href="/work"]')).toBeFocused()
      expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1000)
      const second = await enterPreview(page)
      await loaded(page); await page.goBack()
      await restored(page, second, '/projects/community')
      await page.reload(); await loaded(page)
      await expect(page.getByRole('button', { name: 'Preview Vallalar capture', exact: true })).toHaveAttribute('aria-pressed', 'true')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(variant.width)
      expect(errors).toEqual([])
    } finally { await context.close() }
  })

  test(`${variant.width}px contextual film opens its exact approved Studio entry while primary routes stay direct`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: variant.width, height: variant.height },
      reducedMotion: variant.motion, isMobile: variant.touch, hasTouch: variant.touch })
    const page = await context.newPage(); const premature: string[] = []
    page.on('request', request => { const url = request.url(); if (/\/(?:vantara-masquerade-web|teded-auditions-web|cirs-website-launch-web).*\.mp4|google\.com|googleusercontent|gstatic/.test(url)) premature.push(url) })
    try {
      await home(page); await choose(page, 'Preview Studio'); await choose(page, 'Preview TED-Ed auditions poster')
      await expect(page.locator('.ap-select-caption')).toHaveAttribute('href', '/studio#ted-ed-2026')
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Preview CIRS website launch poster', exact: true })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(page.locator('.ap-select-caption')).toBeFocused()
      await expect(page.locator('.home-directory')).toHaveAttribute('data-selection', 'studio')
      const top = await enterPreview(page)
      await expect(page).toHaveURL(/\/studio#ted-ed-2026$/); await loaded(page)
      await expect(page.locator('.screening-title-card h3')).toHaveText('TED-Ed auditions')
      await expect(page.locator('.screening-title-card h3')).toBeFocused()
      await page.keyboard.press('Tab'); await expect(page.locator('.screening-play')).toBeFocused()
      expect(premature).toEqual([])
      await page.goBack(); await restored(page, top, '/studio#ted-ed-2026')
      await expect(page.getByRole('button', { name: 'Preview TED-Ed auditions poster', exact: true })).toHaveAttribute('aria-pressed', 'true')
      const primary = page.getByRole('navigation', { name: 'Explore the portfolio', exact: true }).getByRole('link')
      expect(await primary.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual(['/work', '/studio', '/about'])
      await page.locator('.home-directory-pages a[href="/studio"]').click(); await loaded(page)
      await expect(page).toHaveURL(/\/studio$/)
      await expect(page.locator('.screening-title-card h3')).toHaveText('CCK trailer')
      expect(premature).toEqual([])
    } finally { await context.close() }
  })
}

for (const width of [320, 390]) test(`${width}px project previews use their genuine phone captures in a portrait stage`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 }); await home(page)
  for (const [name, path, height] of [
    ['CIRS', '/media/cirs-home-mobile.webp', 844], ['Vallalar', '/media/vallalar-language-en-mobile.webp', 420],
    ['AccuFlow', '/media/accuflow-prototype-mobile.webp', 844],
  ] as const) {
    await choose(page, `Preview ${name} capture`)
    const image = page.locator('.ap-select-art img'); await image.scrollIntoViewIfNeeded()
    await image.evaluate(node => (node as HTMLImageElement).decode())
    const data = await image.evaluate(node => { const img = node as HTMLImageElement; return { path: new URL(img.currentSrc).pathname, size: [img.naturalWidth, img.naturalHeight], fit: getComputedStyle(img).objectFit } })
    expect(data).toEqual({ path, size: [390, height], fit: 'contain' })
    expect((await page.locator('.ap-select-art-window').boundingBox())!.height).toBeGreaterThanOrEqual(300)
    expect((await page.locator('.ap-select-caption').boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await expect(page.locator('.ap-select-art figcaption')).not.toContainText('Desktop')
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})

for (const method of ['getItem', 'setItem'] as const) test(`denied ${method} keeps selected Home work and its return context in memory`, async ({ page }) => {
  await page.addInitScript(method => {
    const original = Storage.prototype[method]
    Storage.prototype[method] = function(key: string, ...args: string[]) {
      if (key === 'ap-home-preview-v1') throw new DOMException('Denied', 'SecurityError')
      return (original as (...args: string[]) => any).apply(this, [key, ...args])
    } as typeof original
  }, method)
  await home(page); await choose(page, 'Preview AccuFlow capture')
  const top = await enterPreview(page); await loaded(page)
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await restored(page, top, '/projects/accuflow')
})

test('malformed preview preferences cannot select an unknown project or film', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('ap-home-preview-v1', JSON.stringify({ selection: 'bad', work: 'unknown', film: 'cirsmun-2026' })))
  await home(page)
  await expect(page.locator('.home-directory')).toHaveAttribute('data-selection', 'work')
  await expect(page.locator('.ap-select-caption')).toHaveAttribute('href', '/projects/cirs')
  await choose(page, 'Preview Studio')
  await expect(page.locator('.ap-select-caption')).toHaveAttribute('href', '/studio#vantara')
})

test('posters cannot expose a film-specific Home action when native approval is absent', async ({ page }) => {
  let mutations = 0
  // Vite serves the transformed content module; production bundles the same
  // declarations into its hashed entry. Exercise the same readiness gate in both.
  await page.route(/\/(?:src\/content\.ts|assets\/index-[^/]+\.js)(?:\?.*)?$/, async route => {
    const response = await route.fetch(); const source = await response.text()
    let changed = 0
    const replaced = source.replace(/\bnativePlaybackApproved\s*:\s*(?:true\b|!0\b)/g, () => {
      changed += 1
      return 'nativePlaybackApproved:false'
    })
    expect(changed, 'The fixture must remove the three actual native approvals').toBe(3)
    mutations += changed
    await route.fulfill({ response, body: replaced })
  })
  await home(page)
  expect(mutations, 'The readiness mutation must execute in this runtime').toBeGreaterThanOrEqual(3)
  await choose(page, 'Preview Studio')
  await expect(page.getByRole('group', { name: 'Preview film posters' }).getByRole('button')).toHaveCount(0)
  await expect(page.locator('.ap-select-caption')).toHaveAttribute('href', '/studio')
  await expect(page.locator('.ap-select-art-film')).toHaveCount(0)
})

for (const modifier of ['Control', 'Middle'] as const) test(`context link preserves native ${modifier} opening and Home selection`, async ({ page, context }) => {
  await home(page); await choose(page, 'Preview Vallalar capture')
  const origin = page.locator('.ap-select-caption')
  const popupPromise = context.waitForEvent('page')
  await origin.click(modifier === 'Middle' ? { button: 'middle' } : { modifiers: ['Control'] })
  const popup = await popupPromise
  await expect(popup).toHaveURL(/\/projects\/community$/)
  await expect(page).toHaveURL(/\/$/)
  await expect(origin).toHaveAttribute('href', '/projects/community')
  await popup.close()
})
