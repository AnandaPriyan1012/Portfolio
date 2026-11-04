import { test, expect, type Page } from '@playwright/test'

async function about(page: Page) {
  await page.goto('/about')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  const fonts = await page.evaluate(() => [...document.fonts].filter(item => item.status === 'loaded').map(item => item.family))
  expect(fonts).toContain('Syne Variable')
  expect(fonts).toContain('Instrument Sans Variable')
  return page.locator('.about-identity')
}

for (const variant of [
  { width: 1440, motion: 'no-preference' as const, touch: false },
  { width: 390, motion: 'reduce' as const, touch: true },
  { width: 320, motion: 'reduce' as const, touch: true },
]) {
  test(`${variant.width}px selected film opens its canonical Studio entry and Back restores its native context`, async ({ browser }) => {
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL,
      viewport: { width: variant.width, height: 900 }, reducedMotion: variant.motion,
      hasTouch: variant.touch, isMobile: variant.touch })
    const page = await context.newPage()
    const premature: string[] = [], errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.pathname.endsWith('.mp4') || /google|gstatic|googleusercontent/.test(url.hostname)) premature.push(url.href)
    })
    try {
      const identity = await about(page)
      await identity.getByRole('tab', { name: 'Storyteller', exact: true }).click()
      for (const [label, id, poster] of [
        ['CCK trailer', 'cck-trailer', '/media/cck-trailer-still.jpg'],
        ['Farewell AA', 'farewell-video', '/media/farewell-film-still.jpg'],
      ]) {
        await identity.getByRole('button', { name: label === 'CCK trailer' ? 'CCK' : label, exact: true }).click()
        const link = identity.getByRole('link', { name: `Open ${label} in Studio`, exact: true })
        await expect(link).toHaveAttribute('href', `/studio#${id}`)
        await link.focus()
        await page.waitForTimeout(200)
        const top = await page.evaluate(() => scrollY)
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`/studio#${id}$`))
        await page.locator('.state-opening').waitFor({ state: 'detached' })
        const title = page.locator('.screening-title-card h3')
        await expect(title).toHaveText(id === 'cck-trailer' ? 'CCK trailer' : 'Farewell video')
        await expect(title).toBeFocused()
        await expect(page.locator('.screening-still')).toHaveAttribute('src', poster)
        await page.keyboard.press('Tab')
        await expect(page.locator('.screening-play')).toBeFocused()
        await page.goBack()
        await expect(page).toHaveURL(/\/about$/)
        await page.locator('.state-opening').waitFor({ state: 'detached' })
        await expect(identity.getByRole('tab', { name: 'Storyteller', exact: true })).toHaveAttribute('aria-selected', 'true')
        await expect(identity.locator('.about-identity-aperture img')).toHaveAttribute('src', poster)
        await expect(link).toBeFocused()
        await expect(link).toBeInViewport()
        expect(await link.getAttribute('tabindex')).toBeNull()
        await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), top)).toBeLessThan(4)
      }
      expect(premature).toEqual([])
      expect(errors).toEqual([])
    } finally { await context.close() }
  })
}

for (const width of [320, 390]) for (const mode of ['normal', 'reduced', 'light', 'forced-colors']) {
  test(`${width}px ${mode} shows unique CV-qualified personal bests fully within the swimming plate`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: mode === 'normal' ? 'no-preference' : 'reduce',
      forcedColors: mode === 'forced-colors' ? 'active' : 'none' })
    if (mode === 'light') await page.addInitScript(() => localStorage.setItem('ap-atelier-theme', 'light'))
    const identity = await about(page)
    await identity.getByRole('tab', { name: 'Swimmer', exact: true }).click()
    const plate = identity.locator('.about-identity-swimming')
    await plate.scrollIntoViewIfNeeded()
    await expect(plate.locator('dt')).toHaveText(['50 m breaststroke', '100 m freestyle'])
    await expect(plate.locator('dd')).toHaveText(['41.48 s', '1 min 6 s'])
    await expect(plate).toContainText('Personal bests recorded in my CV.')
    await expect(identity.getByRole('tabpanel')).toContainText('school swimming team from 2024 to 2026')
    const bounds = await plate.evaluate(node => {
      const outer = node.getBoundingClientRect()
      return [...node.querySelectorAll('dt,dd,.about-identity-swim-notes > p')].map(item => {
        const box = item.getBoundingClientRect()
        return { left: box.left - outer.left, right: outer.right - box.right,
          top: box.top - outer.top, bottom: outer.bottom - box.bottom,
          fontSize: parseFloat(getComputedStyle(item).fontSize), color: getComputedStyle(item).color }
      })
    })
    for (const item of bounds) {
      expect(Math.min(item.left, item.right, item.top, item.bottom)).toBeGreaterThanOrEqual(0)
      expect(item.fontSize).toBeGreaterThanOrEqual(11)
      expect(item.color).not.toBe('rgba(0, 0, 0, 0)')
    }
    const relay = identity.locator('.about-swim-records')
    await relay.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(relay).toContainText('My CV also records a relay-team bronze')
    await expect(relay.locator('dl')).toHaveCount(0)
    await expect(identity.getByRole('tabpanel').locator('dd')).toHaveCount(2)
    await page.keyboard.press('Space')
    await expect(relay).not.toHaveAttribute('open', '')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}

for (const action of ['modified', 'middle'] as const) test(`${action} selected-film action retains native new-tab behavior`, async ({ page, context }) => {
  const identity = await about(page)
  await identity.getByRole('tab', { name: 'Storyteller', exact: true }).click()
  await identity.getByRole('button', { name: 'Farewell AA', exact: true }).click()
  const link = identity.getByRole('link', { name: 'Open Farewell AA in Studio', exact: true })
  const [popup] = await Promise.all([context.waitForEvent('page'), action === 'modified'
    ? link.click({ modifiers: ['Control'] }) : link.click({ button: 'middle' })])
  await popup.waitForLoadState('domcontentloaded')
  await popup.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(popup).toHaveURL(/\/studio#farewell-video$/)
  await expect(popup.locator('.screening-title-card h3')).toHaveText('Farewell video')
  await expect(page).toHaveURL(/\/about$/)
  await expect(identity.getByRole('button', { name: 'Farewell AA', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await popup.close()
})

test('a genuine poster cannot make an unapproved playback source a film-specific action', async ({ page }) => {
  const canonical = 'https://drive.google.com/file/d/1zxuYX1UAG8FwYlfYhWP-SAnP4jaRx5MN/preview'
  let fixtureApplications = 0
  await page.route(url => url.pathname === '/src/content.ts' || /^\/assets\/index-[^/]+\.js$/.test(url.pathname), async route => {
    const response = await route.fetch(), code = await response.text()
    expect(code).toContain(canonical)
    await route.fulfill({ response, body: code.replaceAll(canonical, 'https://example.invalid/unapproved-film') })
    fixtureApplications += 1
  })
  const identity = await about(page)
  expect(fixtureApplications, 'The unapproved playback fixture must run in the active build mode').toBeGreaterThan(0)
  await identity.getByRole('tab', { name: 'Storyteller', exact: true }).click()
  await identity.getByRole('button', { name: 'Farewell AA', exact: true }).click()
  await expect(identity.locator('.about-identity-aperture img')).toHaveAttribute('src', '/media/farewell-film-still.jpg')
  await expect(identity.getByRole('link', { name: 'Explore the film collection', exact: true })).toHaveAttribute('href', '/studio')
  await expect(identity.getByRole('link', { name: 'Open Farewell AA in Studio', exact: true })).toHaveCount(0)
  await expect(page.locator('iframe,video')).toHaveCount(0)
})

for (const method of ['getItem', 'setItem'] as const) test(`denied ${method} keeps selected-film return context in memory`, async ({ page }) => {
  await page.addInitScript(method => {
    const native = Storage.prototype[method]
    Storage.prototype[method] = function (key: string, ...args: string[]) {
      if (this === sessionStorage && key === 'ap-about-evidence-v1') throw new DOMException('Synthetic unavailable preference storage', 'SecurityError')
      return Reflect.apply(native, this, [key, ...args])
    } as typeof Storage.prototype[typeof method]
  }, method)
  const identity = await about(page)
  await identity.getByRole('tab', { name: 'Storyteller', exact: true }).click()
  await identity.getByRole('button', { name: 'Farewell AA', exact: true }).click()
  const link = identity.getByRole('link', { name: 'Open Farewell AA in Studio', exact: true })
  await link.click()
  await expect(page).toHaveURL(/\/studio#farewell-video$/)
  await page.goBack()
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(identity.getByRole('button', { name: 'Farewell AA', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(link).toHaveAttribute('href', '/studio#farewell-video')
})

test('only known source choices are restored and initial rendering does not write preferences', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('ap-about-evidence-v1') === null)
      sessionStorage.setItem('ap-about-evidence-v1', JSON.stringify({ builder: 'unknown-source', storyteller: 'not-a-film' }))
    const native = Storage.prototype.setItem
    ;(window as Window & { aboutPreferenceWrites?: number }).aboutPreferenceWrites = 0
    Storage.prototype.setItem = function (key, value) {
      if (this === sessionStorage && key === 'ap-about-evidence-v1') (window as Window & { aboutPreferenceWrites: number }).aboutPreferenceWrites++
      return native.call(this, key, value)
    }
  })
  const identity = await about(page)
  await expect(identity.getByRole('button', { name: 'CIRS', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await identity.getByRole('tab', { name: 'Storyteller', exact: true }).click()
  await expect(identity.getByRole('button', { name: 'CCK', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => (window as Window & { aboutPreferenceWrites: number }).aboutPreferenceWrites)).toBe(0)
  await identity.getByRole('button', { name: 'Farewell AA', exact: true }).click()
  expect(await page.evaluate(() => (window as Window & { aboutPreferenceWrites: number }).aboutPreferenceWrites)).toBe(1)
  await page.reload()
  await identity.getByRole('tab', { name: 'Storyteller', exact: true }).click()
  await expect(identity.getByRole('button', { name: 'Farewell AA', exact: true })).toHaveAttribute('aria-pressed', 'true')
})
