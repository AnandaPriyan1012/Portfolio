import { test as base, expect, type Page } from '@playwright/test'

const test = base.extend<{ cursorErrors: void }>({
  cursorErrors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use()
    expect(errors, 'Pointer transitions do not cause browser errors').toEqual([])
  }, { auto: true }],
})
test.use({ reducedMotion: 'no-preference' })
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('ap-atelier-loader-v4', 'seen')
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true })
  })
})

async function glassAt(page: Page, x: number, y: number) {
  const arrow = page.locator('.glass-arrow-cursor')
  await expect(arrow).toHaveCount(1)
  await expect(arrow).toHaveAttribute('data-visible', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-glass-pointer', 'visible')
  const box = (await arrow.boundingBox())!
  expect(box.width).toBe(21)
  expect(box.height).toBe(27)
  expect(Math.abs(box.x + .75 - x)).toBeLessThan(.2)
  expect(Math.abs(box.y + .75 - y)).toBeLessThan(.2)
  expect(await page.evaluate(({ x, y }) => getComputedStyle(document.elementFromPoint(x, y)!).cursor, { x, y })).toBe('none')
}
async function native(page: Page) {
  await expect(page.locator('html')).not.toHaveAttribute('data-glass-pointer', 'visible')
  await expect(page.locator('.glass-pointer-target')).toHaveCount(0)
  if (await page.locator('.glass-arrow-cursor').count()) await expect(page.locator('.glass-arrow-cursor')).toHaveAttribute('data-visible', 'false')
}

for (const path of ['/', '/work', '/studio', '/about', '/projects/cirs', '/projects/community', '/projects/accuflow', '/projects/airkart', '/projects/creative', '/not-in-the-story']) {
  test(`${path} has one smaller ready arrow, with no invented initial position`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('.glass-arrow-cursor')).toHaveCount(1)
    await native(page)
    await page.mouse.move(15, 400)
    await glassAt(page, 15, 400)
    await page.mouse.move(1438, 998)
    await glassAt(page, 1438, 998)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('the same host and last real position survive keyboard SPA routes, cases, back and 404', async ({ page }) => {
  await page.goto('/work')
  await page.mouse.move(15, 400)
  await glassAt(page, 15, 400)
  await page.locator('.glass-arrow-cursor').evaluate(el => el.setAttribute('data-instance-proof', 'original'))
  for (const label of ['Studio', 'About', 'Work']) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toHaveAttribute('data-page', label.toLowerCase())
    await glassAt(page, 15, 400)
    await expect(page.locator('.glass-arrow-cursor')).toHaveAttribute('data-instance-proof', 'original')
  }
  await page.locator('#cirs .story-links a[href="/projects/cirs"]').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await glassAt(page, 15, 400)
  await expect(page.locator('.glass-arrow-cursor')).toHaveAttribute('data-instance-proof', 'original')
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work$/)
  await glassAt(page, 15, 400)
  await page.evaluate(() => { history.pushState({}, '', '/not-in-the-story'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.locator('.notfound-page')).toBeVisible()
  await glassAt(page, 15, 400)
  await expect(page.locator('.glass-arrow-cursor')).toHaveAttribute('data-instance-proof', 'original')
})

test('stationary pointer remains positioned through scrolling and ordinary clicks', async ({ page }) => {
  await page.goto('/work')
  await page.mouse.move(15, 400)
  await page.mouse.click(15, 400)
  await glassAt(page, 15, 400)
  await page.mouse.wheel(0, 700)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500)
  await glassAt(page, 15, 400)
  await page.mouse.wheel(0, -700)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(50)
  await glassAt(page, 15, 400)
})

test('a reused navigation link retains the native-hiding marker after its route class changes', async ({ page }) => {
  await page.goto('/work')
  const link = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Studio', exact: true })
  await link.hover()
  const r = (await link.boundingBox())!, point = { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  await link.click()
  await expect(page).toHaveURL(/\/studio$/)
  await glassAt(page, point.x, point.y)
  await link.evaluate(el => el.className = 'synthetic-react-class-update')
  await glassAt(page, point.x, point.y)
})

test('Escape closing a narrow desktop menu resamples the surface under its stationary pointer', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 })
  await page.goto('/work')
  await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  const link = page.locator('#site-nav a[href="/studio"]')
  await link.hover()
  const r = (await link.boundingBox())!, point = { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  await glassAt(page, point.x, point.y)
  await page.keyboard.press('Escape')
  await expect(link).toBeHidden()
  await glassAt(page, point.x, point.y)
  expect(await link.evaluate(el => el.classList.contains('glass-pointer-target'))).toBe(false)
})

test('native modal controls rehost the same arrow into the top layer and restore it on close', async ({ page }) => {
  await page.goto('/work')
  await page.locator('#cirs').getByRole('button', { name: 'Quick view', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'CIRS Website', exact: true })
  const close = dialog.getByRole('button', { name: 'Close dialog', exact: true })
  await close.hover()
  const r = (await close.boundingBox())!, point = { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  await glassAt(page, point.x, point.y)
  expect(await page.locator('.glass-cursor-layer').evaluate(el => el.parentElement?.tagName)).toBe('DIALOG')
  await close.click()
  await expect(dialog).toHaveCount(0)
  await glassAt(page, point.x, point.y)
  expect(await page.locator('.glass-cursor-layer').evaluate(el => el.parentElement?.tagName)).toBe('BODY')
})

test('opening overlay immediately yields native, remembers movement and resumes after DOM removal', async ({ page }) => {
  await page.goto('/work')
  await page.mouse.move(300, 400)
  await glassAt(page, 300, 400)
  await page.evaluate(() => {
    const overlay = document.createElement('div')
    overlay.id = 'synthetic-opening'
    overlay.dataset.cursor = 'none'
    overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:10000'
    document.documentElement.dataset.opening = 'active'
    document.body.append(overlay)
    dispatchEvent(new CustomEvent('ap:openingchange', { detail: { active: true } }))
  })
  await native(page)
  await page.mouse.move(900, 700)
  await native(page)
  await page.evaluate(() => {
    delete document.documentElement.dataset.opening
    dispatchEvent(new CustomEvent('ap:openingchange', { detail: { active: false } }))
    requestAnimationFrame(() => document.getElementById('synthetic-opening')!.remove())
  })
  await glassAt(page, 900, 700)
})

test('native text editing and drag selection work and restore the arrow when selection clears', async ({ page }) => {
  await page.goto('/not-in-the-story')
  await page.evaluate(() => {
    const panel = document.createElement('div')
    panel.id = 'native-fixture'
    panel.style.cssText = 'position:fixed;top:200px;left:200px;width:600px;padding:20px;background:#ddd;color:#111;z-index:100'
    panel.innerHTML = '<input aria-label="Native input"><textarea aria-label="Native textarea"></textarea><div contenteditable="true" role="textbox" aria-label="Native editor">Edit this text</div><p id="selection-text">Select these words with a normal mouse drag.</p>'
    document.body.append(panel)
  })
  for (const name of ['Native input', 'Native textarea', 'Native editor']) {
    const editor = page.getByRole('textbox', { name, exact: true })
    await editor.hover()
    await native(page)
    await editor.fill('Native editing still works')
  }
  const text = page.locator('#selection-text'), box = (await text.boundingBox())!
  await page.mouse.move(box.x + 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + Math.min(300, box.width - 3), box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => page.evaluate(() => getSelection()?.toString() ?? '')).not.toBe('')
  await native(page)
  await page.evaluate(() => getSelection()?.removeAllRanges())
  await page.mouse.move(15, 400)
  await glassAt(page, 15, 400)
})

test('stationary hit testing follows nested scrolling and a newly exposed provider iframe', async ({ page }) => {
  await page.goto('/not-in-the-story')
  await page.evaluate(() => {
    const scroller = document.createElement('div')
    scroller.id = 'nested-scroll'
    scroller.style.cssText = 'position:fixed;left:200px;top:200px;width:400px;height:200px;overflow:auto;z-index:100;background:#ddd'
    scroller.innerHTML = '<button style="display:block;width:100%;height:200px">Native fixture action</button><input aria-label="Scrolled native input" style="display:block;width:100%;height:200px">'
    document.body.append(scroller)
  })
  await page.mouse.move(350, 300)
  await glassAt(page, 350, 300)
  await page.locator('#nested-scroll').evaluate(el => el.scrollTop = 200)
  await native(page)
  await page.locator('#nested-scroll').evaluate(el => el.scrollTop = 0)
  await glassAt(page, 350, 300)
  await page.locator('#nested-scroll').evaluate(el => {
    el.innerHTML = '<iframe title="Synthetic provider frame" srcdoc="<button>Provider native control</button>" style="position:absolute;inset:0;width:100%;height:100%"></iframe><button id="provider-shield" style="position:absolute;inset:0;width:100%;height:100%">Loading shield fixture</button>'
  })
  await glassAt(page, 350, 300)
  await page.locator('#provider-shield').evaluate(el => el.remove())
  await native(page)
  await page.mouse.move(15, 400)
  await glassAt(page, 15, 400)
})

test('native video controls yield the pointer while adjacent modal controls retain glass', async ({ page }) => {
  await page.goto('/work')
  await page.locator('#cirs').getByRole('button', { name: 'Quick view', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'CIRS Website', exact: true })
  await dialog.evaluate(el => {
    const video = document.createElement('video')
    video.id = 'native-video-fixture'; video.controls = true
    video.style.cssText = 'position:fixed;left:400px;top:300px;width:400px;height:250px;background:#111'
    el.append(video)
  })
  await page.locator('#native-video-fixture').hover()
  await native(page)
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).hover()
  await expect(page.locator('.glass-arrow-cursor')).toHaveAttribute('data-visible', 'true')
})

test('no cursor writes continue at rest, and blur cannot resurrect a phantom point', async ({ page }) => {
  await page.goto('/not-in-the-story')
  await page.mouse.move(15, 400)
  await glassAt(page, 15, 400)
  await page.waitForTimeout(180)
  const writes = await page.locator('.glass-arrow-cursor').evaluate(el => new Promise<number>(resolve => {
    let count = 0
    const observer = new MutationObserver(records => count += records.length)
    observer.observe(el, { attributes: true })
    setTimeout(() => { observer.disconnect(); resolve(count) }, 350)
  }))
  expect(writes, 'The observer and frame scheduler do not feed themselves').toBe(0)
  await page.evaluate(() => dispatchEvent(new Event('blur')))
  await native(page)
  await page.evaluate(() => dispatchEvent(new Event('focus')))
  await native(page)
  await page.mouse.move(16, 400)
  await glassAt(page, 16, 400)
})

for (const mode of ['reduced', 'forced colors', 'save data', 'low power', 'no optics'] as const) {
  test(`${mode} retains a fully native pointer`, async ({ page }) => {
    if (mode === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' })
    if (mode === 'forced colors') await page.emulateMedia({ forcedColors: 'active' })
    if (mode === 'save data') await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) }))
    if (mode === 'low power') await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 }))
    if (mode === 'no optics') await page.addInitScript(() => {
      const supports = CSS.supports.bind(CSS)
      CSS.supports = ((property: string, value?: string) => property.includes('backdrop-filter') ? false : supports(property, value!)) as typeof CSS.supports
    })
    await page.goto('/work')
    await page.mouse.move(300, 400)
    await expect(page.locator('.glass-arrow-cursor')).toHaveCount(0)
    await native(page)
  })
}

test('motion preference changes use coordinates updated during the native fallback', async ({ page }) => {
  await page.goto('/work')
  await page.mouse.move(15, 400)
  await glassAt(page, 15, 400)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.glass-arrow-cursor')).toHaveCount(0)
  await page.mouse.move(20, 600)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await glassAt(page, 20, 600)
})

test.describe('touch fallback', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
  test('phone keeps native interaction without a glass host or hiding gate', async ({ page }) => {
    await page.goto('/work')
    await expect(page.locator('.glass-arrow-cursor')).toHaveCount(0)
    await page.getByRole('navigation', { name: 'Explore selected projects' }).locator('a[href="#community"]').tap()
    await expect(page).toHaveURL(/#community$/)
    await native(page)
  })
})
