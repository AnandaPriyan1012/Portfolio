import { test as base, expect, type Locator, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'warn' && /GSAP target.*not found/i.test(message.text())) errors.push(message.text())
    })
    await use()
    expect(errors).toEqual([])
  }, { auto: true }],
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('ap-atelier-loader-v4', 'seen')
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
})

async function ready(page: Page) {
  await page.goto('/about')
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  const loaded = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
  expect(loaded).toContain('Syne Variable')
  expect(loaded).toContain('Instrument Sans Variable')
  return page.locator('.about-identity')
}

async function fullyContained(image: Locator) {
  await image.evaluate(node => (node as HTMLImageElement).decode())
  const geometry = await image.evaluate(node => {
    const img = node as HTMLImageElement
    const box = img.getBoundingClientRect(), aperture = img.parentElement!.getBoundingClientRect()
    return { fit: getComputedStyle(img).objectFit, left: box.left - aperture.left, top: box.top - aperture.top, right: aperture.right - box.right, bottom: aperture.bottom - box.bottom }
  })
  expect(geometry.fit).toBe('contain')
  for (const edge of [geometry.left, geometry.top, geometry.right, geometry.bottom]) expect(edge, 'The image box must fit inside the clipping aperture, not only report object-fit:contain').toBeGreaterThanOrEqual(-.5)
}

test('the identity scene keeps one page title, native four-lane navigation and truthful recognition', async ({ page }) => {
  const identity = await ready(page)
  await expect(page.locator('h1')).toHaveText('Ananda Priyan.')
  const tabs = identity.getByRole('tab')
  await expect(tabs).toHaveText(['01Builder', '02Storyteller', '03Swimmer', '04Curious Mind'])
  await tabs.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(identity.getByRole('tab', { name: 'Storyteller', exact: true })).toBeFocused()
  await expect(identity.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'lane-storyteller')
  await page.keyboard.press('End')
  await expect(identity.getByRole('tab', { name: 'Curious Mind', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Home')
  await expect(identity.getByRole('tab', { name: 'Builder', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowLeft')
  await expect(identity.getByRole('tab', { name: 'Curious Mind', exact: true })).toBeFocused()
  await identity.getByRole('tab', { name: 'Swimmer', exact: true }).click()
  await expect(identity.getByRole('tabpanel')).toContainText('I started at CIRS in Class 10')
  const plate = identity.locator('.about-identity-swimming')
  await expect(plate.locator('dt')).toHaveText(['50 m breaststroke', '100 m freestyle'])
  await expect(plate.locator('dd')).toHaveText(['41.48 s', '1 min 6 s'])
  await expect(plate).toContainText('Personal bests recorded in my CV.')
  await identity.locator('.about-identity-perspectives > summary').click()
  await expect(identity.locator('.about-identity-perspectives h4')).toHaveCount(4)
  await expect(page.locator('.achievement')).toHaveCount(4)
  await expect(page.locator('.achievement').first().locator('h3')).toHaveText('ICSC 2026')
  await expect(page.locator('body')).not.toContainText(/isolated about study|prototype boundary|the original mark/i)
})

test('real website captures and both current C4 film frames are uncropped and manually selectable', async ({ page, request }) => {
  const identity = await ready(page)
  const image = identity.locator('.about-identity-aperture > img')
  await expect(image).toHaveAttribute('src', '/media/cirs-home-desktop.webp')
  await fullyContained(image)
  await identity.getByRole('button', { name: 'Vallalar', exact: true }).click()
  await expect(image).toHaveAttribute('src', '/media/vallalar-website-desktop.webp')
  await fullyContained(image)
  await expect(identity.locator('.about-identity-evidence > figcaption')).toContainText('Public review preview')
  await identity.getByRole('tab', { name: 'Storyteller', exact: true }).click()
  const hashes = {
    CCK: ['cck-trailer-still.jpg', 'f6e48a30129b680660a6423512b8513c4a0d310be1ef5c5fb1b5d167c911e6da'],
    'Farewell AA': ['farewell-film-still.jpg', '47c270fc2f27826901933427c3ec3b98602140a1b3dbd073625392f4e24f2d75'],
  }
  for (const [name, [file, hash]] of Object.entries(hashes)) {
    await identity.getByRole('button', { name, exact: true }).click()
    await expect(image).toHaveAttribute('src', `/media/${file}`)
    await fullyContained(image)
    const response = await request.get(`/media/${file}`)
    expect(response.ok()).toBe(true)
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(hash)
  }
  await expect(identity.locator('iframe,video')).toHaveCount(0)
  await identity.getByRole('tab', { name: 'Curious Mind', exact: true }).click()
  await expect(image).toHaveAttribute('src', '/media/atlas-accuflow-home-desktop.webp')
  await fullyContained(image)
  await expect(identity.getByRole('tabpanel')).toContainText('student concepts and early-stage work')
})

test('normal About case links preserve the lane and return position, and browser Back remains usable', async ({ page }) => {
  const identity = await ready(page)
  const link = identity.getByRole('link', { name: 'Read the CIRS project', exact: true })
  await link.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await link.click()
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await expect(page.locator('h1')).toBeFocused()
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(identity.getByRole('tab', { name: 'Builder', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), before)).toBeLessThan(30)
  await expect(link).toBeFocused()
  await expect(link).toBeInViewport()
  expect(await link.getAttribute('tabindex')).toBeNull()
  await identity.getByRole('tab', { name: 'Curious Mind', exact: true }).click()
  await identity.getByRole('link', { name: 'Explore the AccuFlow prototype', exact: true }).click()
  await expect(page).toHaveURL(/\/projects\/accuflow$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/about$/)
  await expect(identity.getByRole('tab', { name: 'Curious Mind', exact: true })).toHaveAttribute('aria-selected', 'true')
})

for (const motion of ['reduce', 'no-preference'] as const) test(`${motion} short-desktop repeated case returns restore the real About origin link without moving its saved position`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width: 1440, height: 720 })
  const identity = await ready(page)
  if (motion === 'no-preference') {
    await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
    await expect(identity.locator('.signature-study')).toHaveAttribute('data-canvas-state', 'rest')
    await expect(identity.getByRole('button', { name: 'Scatter & settle', exact: true })).toBeVisible()
  }
  const headerHeight = (await identity.locator('.about-identity-intro').boundingBox())!.height
  const link = identity.getByRole('link', { name: 'Read the CIRS project', exact: true })
  await link.scrollIntoViewIfNeeded()
  const saved = await page.evaluate(() => scrollY)
  expect(saved).toBeGreaterThan(200)
  for (let pass = 0; pass < 2; pass++) {
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/projects\/cirs$/)
    await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(link).toBeFocused()
    await expect(link).toBeInViewport()
    expect((await identity.locator('.about-identity-intro').boundingBox())!.height).toBeCloseTo(headerHeight, 1)
    expect(await link.getAttribute('tabindex')).toBeNull()
    await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), saved)).toBeLessThan(4)
    // Catch a later image/font/GSAP refresh overwriting an initially correct return.
    await page.waitForTimeout(1100)
    expect(await page.evaluate(y => Math.abs(scrollY - y), saved)).toBeLessThan(4)
  }
  // A real pointer cannot activate a link behind the page-opening mask.
  // Wait for that mask rather than letting automation retry/scroll the link.
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await link.click()
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await page.goBack()
  await expect(identity).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await expect(link).toBeFocused()
  await expect(link).toBeInViewport()
  await page.waitForTimeout(1100)
  expect(await page.evaluate(y => Math.abs(scrollY - y), saved)).toBeLessThan(4)
})

test('normal-motion restoration is consumed once and later refreshes respect real wheel and keyboard scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1440, height: 720 })
  const identity = await ready(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
  await expect(identity.getByRole('button', { name: 'Scatter & settle', exact: true })).toBeVisible()
  const origin = identity.getByRole('link', { name: 'Read the CIRS project', exact: true })
  await origin.scrollIntoViewIfNeeded()
  const saved = await page.evaluate(() => scrollY)
  await origin.click()
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await expect(origin).toBeFocused()
  await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), saved)).toBeLessThan(4)
  await page.mouse.move(10, 400)
  await page.mouse.wheel(0, 200)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(saved + 140)
  await identity.locator('.about-identity-aperture img').evaluate(node => node.dispatchEvent(new Event('load')))
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(saved + 140)
  await page.keyboard.press('Tab')
  await expect(identity.getByRole('link', { name: 'Explore the Vallalar work', exact: true })).toBeFocused()
  // Finish the wheel gesture before asking the browser for a separate native
  // keyboard page step; overlapping wheel inertia is a different interaction.
  await expect.poll(() => page.evaluate(y => Math.abs(scrollY - (y + 200)), saved)).toBeLessThan(.1)
  const afterWheel = await page.evaluate(() => scrollY)
  await page.keyboard.press('PageDown')
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(afterWheel + 200)
  await identity.locator('.about-identity-aperture img').evaluate(node => node.dispatchEvent(new Event('load')))
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(afterWheel + 200)
})

test('normal-motion numeric restoration does not override Contact or the AirKart hash handoff', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const identity = await ready(page)
  const navigation = page.getByRole('navigation', { name: 'Main navigation' })
  await navigation.getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page).toHaveURL(/\/about#contact$/)
  await expect(page.locator('#contact h2')).toBeFocused()
  await expect(page.locator('#contact h2')).toBeInViewport()
  await page.waitForTimeout(1100)
  await expect(page.locator('#contact h2')).toBeInViewport()
  await navigation.getByRole('link', { name: 'About', exact: true }).click()
  await identity.getByRole('tab', { name: 'Curious Mind', exact: true }).click()
  await identity.getByRole('link', { name: 'See the AirKart experiment', exact: true }).focus()
  await page.keyboard.press('Enter')
  const summary = page.locator('details#airkart > summary')
  await expect(summary).toBeFocused()
  await expect(summary).toBeInViewport()
  await page.waitForTimeout(1100)
  await expect(summary).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.locator('details#airkart')).toHaveAttribute('open', '')
})

for (const method of ['modified', 'middle'] as const) {
  test(`${method} evidence clicks open a native new tab without changing the About selection`, async ({ page, context }) => {
    const identity = await ready(page)
    await identity.getByRole('tab', { name: 'Curious Mind', exact: true }).click()
    const [tab] = await Promise.all([
      context.waitForEvent('page'),
      identity.getByRole('link', { name: 'Explore the AccuFlow prototype', exact: true }).click(method === 'middle' ? { button: 'middle' } : { modifiers: ['ControlOrMeta'] }),
    ])
    await expect(tab).toHaveURL(/\/projects\/accuflow$/)
    await expect(tab.locator('h1')).toHaveCount(1)
    await expect(page).toHaveURL(/\/about$/)
    await expect(identity.getByRole('tab', { name: 'Curious Mind', exact: true })).toHaveAttribute('aria-selected', 'true')
    await tab.close()
  })
}

test('remaining evidence links reach genuine case, Studio and experiment destinations', async ({ page }) => {
  const identity = await ready(page)
  for (const item of [
    { lane: 'Builder', link: 'Explore the Vallalar work', path: /\/projects\/community$/ },
    { lane: 'Storyteller', link: 'Open CCK trailer in Studio', path: /\/studio#cck-trailer$/ },
    { lane: 'Curious Mind', link: 'See the AirKart experiment', path: /\/work#airkart$/ },
  ]) {
    await identity.getByRole('tab', { name: item.lane, exact: true }).click()
    await identity.getByRole('link', { name: item.link, exact: true }).click()
    await expect(page).toHaveURL(item.path)
    await page.goBack()
    await expect(page).toHaveURL(/\/about$/)
    await expect(identity.getByRole('tab', { name: item.lane, exact: true })).toHaveAttribute('aria-selected', 'true')
  }
})

test('the keyboard AirKart handoff focuses its visible native summary and preserves Enter/Space', async ({ page }) => {
  const identity = await ready(page)
  await identity.getByRole('tab', { name: 'Curious Mind', exact: true }).click()
  await identity.getByRole('link', { name: 'See the AirKart experiment', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work#airkart$/)
  const details = page.locator('details#airkart')
  const summary = details.locator(':scope > summary')
  await expect(summary).toBeFocused()
  await expect(summary).toBeInViewport()
  expect(await summary.getAttribute('tabindex')).toBeNull()
  await page.keyboard.press('Enter')
  await expect(details).toHaveAttribute('open', '')
  await page.keyboard.press('Space')
  await expect(details).not.toHaveAttribute('open')
  await expect(summary).toBeFocused()
})

test('the pane handoff is finite while headings stay still and saved Motion Off remains authoritative', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const identity = await ready(page)
  const scene = identity.locator('#about')
  await expect(scene).toHaveAttribute('data-transition', 'rest')
  await identity.getByRole('tab', { name: 'Storyteller', exact: true }).click()
  await expect(scene).toHaveAttribute('data-transition', 'playing')
  expect(await scene.locator('.about-identity-evidence').evaluate(node => node.getAnimations().length)).toBeGreaterThan(0)
  expect(await scene.evaluate(node => getComputedStyle(node).transform)).toBe('none')
  expect(await identity.locator('.about-identity-copy').evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0)
  await expect(scene).toHaveAttribute('data-transition', 'rest')
  expect(await scene.evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
  await page.getByRole('button', { name: 'Motion on', exact: true }).click()
  await identity.getByRole('tab', { name: 'Builder', exact: true }).click()
  await expect(scene).toHaveAttribute('data-transition', 'static')
  await expect(identity.locator('.signature-study canvas')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
  await identity.getByRole('tab', { name: 'Curious Mind', exact: true }).click()
  await expect(scene).toHaveAttribute('data-transition', 'static')
  expect(await scene.evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0)
})

for (const mode of ['light', 'forced-colors', 'reduced'] as const) {
  test(`${mode} preserves readable content, exact AP and ordinary controls`, async ({ page }) => {
    if (mode === 'forced-colors') await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' })
    else if (mode === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' })
    if (mode === 'light') await page.addInitScript(() => localStorage.setItem('ap-atelier-theme', 'light'))
    const identity = await ready(page)
    await expect(identity.locator('.signature-study img')).toHaveAttribute('src', '/media/ap-signature.png')
    for (const lane of ['Builder', 'Storyteller', 'Swimmer', 'Curious Mind']) {
      await identity.getByRole('tab', { name: lane, exact: true }).click()
      await expect(identity.getByRole('tabpanel')).toBeVisible()
      const color = await identity.locator('.about-identity-copy > p:not(.section-label)').first().evaluate(node => getComputedStyle(node).color)
      expect(color).not.toBe('rgba(0, 0, 0, 0)')
    }
    if (mode !== 'light') {
      await expect(identity.locator('#about')).toHaveAttribute('data-transition', 'static')
      await expect(identity.locator('.signature-study canvas')).toHaveCount(0)
    }
  })
}

test('touch layouts at 320px and 390px keep the AP and copy apart and every source fully contained', async ({ browser }) => {
  for (const width of [320, 390]) {
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: { width, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'no-preference' })
    const page = await context.newPage()
    try {
      await page.addInitScript(() => sessionStorage.setItem('ap-atelier-loader-v4', 'seen'))
      const identity = await ready(page)
      const mark = (await identity.locator('.about-identity-signature').boundingBox())!
      const intro = (await identity.locator('.about-identity-name > p:last-child').boundingBox())!
      expect(mark.y + mark.height).toBeLessThanOrEqual(intro.y + 1)
      for (const lane of ['Builder', 'Storyteller', 'Swimmer', 'Curious Mind']) {
        await identity.getByRole('tab', { name: lane, exact: true }).tap()
        await expect(identity.locator('#about')).toHaveAttribute('data-transition', 'static')
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        expect((await identity.locator('.about-identity-evidence').boundingBox())!.height).toBeLessThanOrEqual(420)
        for (const img of await identity.locator('.about-identity-aperture img').all()) {
          await fullyContained(img)
        }
      }
      for (const control of await identity.getByRole('tab').all()) expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      await identity.getByRole('tab', { name: 'Builder', exact: true }).tap()
      await identity.getByRole('button', { name: 'Vallalar', exact: true }).tap()
      await expect(identity.locator('.about-identity-evidence > figcaption')).toContainText('Public review preview')
    } finally { await context.close() }
  }
})

test('height changes refresh Contact scrolling and native disclosure without accumulating About observers', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    const Native = ResizeObserver
    const observed = new Map<ResizeObserver, Set<Element>>()
    window.ResizeObserver = class extends Native {
      constructor(callback: ResizeObserverCallback) { super(callback); observed.set(this, new Set()) }
      observe(target: Element, options?: ResizeObserverOptions) { observed.get(this)?.add(target); super.observe(target, options) }
      unobserve(target: Element) { observed.get(this)?.delete(target); super.unobserve(target) }
      disconnect() { observed.delete(this); super.disconnect() }
    }
    ;(window as Window & { aboutObserverCount: () => number }).aboutObserverCount = () => [...observed.values()].filter(targets => [...targets].some(target => target.id === 'about')).length
  })
  const identity = await ready(page)
  await expect.poll(() => page.evaluate(() => (window as Window & { aboutObserverCount: () => number }).aboutObserverCount())).toBe(2)
  await identity.getByRole('tab', { name: 'Swimmer', exact: true }).click()
  await expect(identity.locator('#about')).toHaveAttribute('data-transition', 'rest')
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await expect.poll(() => page.locator('#contact').evaluate(node => parseFloat(getComputedStyle(node).getPropertyValue('--contact-exposure')))).toBeGreaterThan(.98)
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true })).toHaveAttribute('aria-current', 'location')
  await identity.locator('.about-identity-perspectives > summary').click()
  await identity.locator('.about-identity-perspectives > summary').click()
  for (let pass = 0; pass < 2; pass++) {
    await identity.getByRole('tab', { name: 'Storyteller', exact: true }).click()
    await identity.getByRole('link', { name: 'Open CCK trailer in Studio', exact: true }).click()
    await expect.poll(() => page.evaluate(() => (window as Window & { aboutObserverCount: () => number }).aboutObserverCount())).toBe(0)
    await page.goBack()
    await expect(identity).toBeVisible()
    await expect.poll(() => page.evaluate(() => (window as Window & { aboutObserverCount: () => number }).aboutObserverCount())).toBe(2)
  }
})
