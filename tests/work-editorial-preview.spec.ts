import { test as base, expect } from '@playwright/test'

const test = base.extend<{ browserErrors: void }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use()
    expect(errors, 'Project selection does not produce browser errors').toEqual([])
  }, { auto: true }],
})

const projects = ['cirs', 'community', 'accuflow'] as const

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('ap-atelier-loader-v4', 'seen'))
})

async function expectChapter(page: import('@playwright/test').Page, project: string) {
  await expect(page).toHaveURL(new RegExp(`/work#${project}$`))
  await expect.poll(async () => (await page.locator(`#${project}`).boundingBox())!.y).toBeGreaterThanOrEqual(0)
  await expect.poll(async () => (await page.locator(`#${project}`).boundingBox())!.y).toBeLessThan(180)
}

for (const width of [1440, 1024]) {
  test(`${width}px index keeps stable editorial rows and the last inspected image`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/work')
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() =>
      document.fonts.check('550 16px "Syne Variable"') &&
      document.fonts.check('400 16px "Instrument Sans Variable"'),
    ), 'Review the index with its actual display and reading fonts').toBe(true)
    const index = page.getByRole('navigation', { name: 'Explore selected projects' })
    const initial = (await index.boundingBox())!
    expect(initial.height, 'The enhanced index fits within the previous 342px index').toBeLessThanOrEqual(342)
    await expect(index.locator('a')).toHaveCount(3)
    await expect(index.locator('button, [tabindex]')).toHaveCount(0)
    await expect(index.locator('.work-index-preview:visible')).toHaveCount(1)
    await expect(index.locator('.work-index-cirs .work-index-preview')).toBeVisible()

    for (const project of projects) {
      const entry = index.locator(`.work-index-${project}`)
      const before = await entry.locator('.work-index-name').boundingBox()
      await entry.hover()
      const preview = entry.locator('.work-index-preview')
      await expect(preview).toBeVisible()
      await expect(index.locator('.work-index-preview:visible')).toHaveCount(1)
      const left = (await entry.boundingBox())!
      const pane = (await preview.boundingBox())!
      await page.mouse.move((left.x + left.width + pane.x) / 2, pane.y + pane.height / 2)
      await expect(preview, 'Moving across the gap keeps the chosen work').toBeVisible()
      await page.mouse.move(2, 100)
      await expect(preview, 'Leaving the index keeps the chosen work').toBeVisible()
      expect(await entry.locator('.work-index-name').boundingBox()).toEqual(before)
      expect(await index.boundingBox()).toEqual(initial)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const project of projects) {
  test(`the ${project} image itself follows its original project anchor`, async ({ page }) => {
    await page.goto('/work')
    const entry = page.locator(`.work-index-${project}`)
    await entry.hover()
    const preview = entry.locator('.work-index-preview')
    await expect(preview).toBeVisible()
    const pane = (await preview.boundingBox())!
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href'), {
      x: pane.x + pane.width / 2, y: pane.y + pane.height / 2,
    })
    expect(hit, 'The image is part of its matching native link').toBe(`#${project}`)
    await preview.click()
    await expectChapter(page, project)
  })

  for (const method of ['modified click', 'middle click'] as const) {
    test(`${method} on the ${project} image opens its native anchor separately`, async ({ page, context }) => {
      await page.goto('/work')
      const entry = page.locator(`.work-index-${project}`)
      await entry.hover()
      const [tab] = await Promise.all([
        context.waitForEvent('page'),
        entry.locator('.work-index-preview').click(method === 'middle click'
          ? { button: 'middle' }
          : { modifiers: ['ControlOrMeta'] }),
      ])
      await expect(tab).toHaveURL(new RegExp(`/work#${project}$`))
      await expect(tab.locator('h1')).toHaveCount(1)
      await expect(page).toHaveURL(/\/work$/)
      await tab.close()
    })
  }
}

test('keyboard focus selects the matching image while the pointer rests on another row', async ({ page }) => {
  await page.goto('/work')
  const index = page.getByRole('navigation', { name: 'Explore selected projects' })
  const cirs = index.locator('.work-index-cirs')
  const vallalar = index.locator('.work-index-community')
  await cirs.hover()
  await cirs.focus()
  await page.keyboard.press('Tab')
  await expect(vallalar).toBeFocused()
  await expect(vallalar.locator('.work-index-preview')).toBeVisible()
  await expect(cirs.locator('.work-index-preview')).toBeHidden()
  await page.keyboard.press('Shift+Tab')
  await expect(cirs).toBeFocused()
  await expect(cirs.locator('.work-index-preview')).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expectChapter(page, 'community')
})

test('resizing across the enhancement breakpoint preserves content and the last choice', async ({ page }) => {
  await page.goto('/work')
  const index = page.getByRole('navigation', { name: 'Explore selected projects' })
  await index.locator('.work-index-community').hover()
  await expect(index.locator('.work-index-community .work-index-preview')).toBeVisible()
  // Reflow may legitimately put a different row under a stationary pointer.
  // Test retained selection separately from a new pointer entry caused by resize.
  await page.mouse.move(2, 100)
  await page.setViewportSize({ width: 899, height: 1000 })
  await expect(index.locator('.work-index-preview:visible')).toHaveCount(3)
  await page.setViewportSize({ width: 900, height: 1000 })
  await expect(index.locator('.work-index-preview:visible')).toHaveCount(1)
  await expect(index.locator('.work-index-community .work-index-preview')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('enabled motion settles only the image pane and immediately respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/work')
  await page.evaluate(() => document.fonts.ready)
  const entry = page.locator('.work-index-cirs')
  const preview = entry.locator('.work-index-preview')
  const titleBefore = await entry.locator('.work-index-name').boundingBox()
  const resting = await preview.evaluate(el => getComputedStyle(el).transform)
  expect(resting).toContain('matrix3d')
  await entry.focus()
  await expect.poll(() => preview.evaluate(el => getComputedStyle(el).transform)).not.toBe(resting)
  expect(await entry.locator('.work-index-name').boundingBox()).toEqual(titleBefore)
  await page.getByRole('button', { name: 'Motion on', exact: true }).click()
  await expect.poll(() => preview.evaluate(el => getComputedStyle(el).transform)).not.toContain('matrix3d')
  await page.getByRole('button', { name: 'Motion off', exact: true }).click()
  await expect.poll(() => preview.evaluate(el => getComputedStyle(el).transform)).toContain('matrix3d')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => preview.evaluate(el => getComputedStyle(el).transform)).not.toContain('matrix3d')
  await expect(preview).toBeVisible()
})

test.describe('coarse-pointer fallback', () => {
  test.use({ hasTouch: true, isMobile: true })
  for (const width of [390, 1024]) {
    test(`${width}px touch keeps all original previews and direct project links`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/work')
      const index = page.getByRole('navigation', { name: 'Explore selected projects' })
      await expect(index.locator('.work-index-preview:visible')).toHaveCount(3)
      for (const project of projects) {
        await expect(index.locator(`.work-index-${project} .work-index-name`)).toBeVisible()
      }
      const previewSizes = await index.locator('.work-index-preview').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().width))
      expect(previewSizes.every(value => value <= (width < 768 ? 90 : 148))).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await index.locator('.work-index-community').tap()
      await expectChapter(page, 'community')
    })
  }
})

for (const mode of ['reduced', 'motion off', 'light', 'forced colors'] as const) {
  test(`${mode} preserves usable preview and keyboard focus`, async ({ page }) => {
    if (mode === 'forced colors') await page.emulateMedia({ forcedColors: 'active' })
    if (mode === 'light') await page.addInitScript(() => localStorage.setItem('ap-atelier-theme', 'light'))
    if (mode === 'motion off') {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.addInitScript(() => localStorage.setItem('ap-motion', 'off'))
    }
    await page.goto('/work')
    const entry = page.locator('.work-index-community')
    await entry.focus()
    await expect(entry).toBeFocused()
    await expect(entry.locator('.work-index-preview')).toBeVisible()
    const styles = await entry.evaluate(el => ({
      outlineStyle: getComputedStyle(el).outlineStyle,
      outlineWidth: parseFloat(getComputedStyle(el).outlineWidth),
      transform: getComputedStyle(el.querySelector('.work-index-preview')!).transform,
    }))
    expect(styles.outlineStyle).not.toBe('none')
    expect(styles.outlineWidth).toBeGreaterThan(0)
    if (mode !== 'light') expect(styles.transform).not.toContain('matrix3d')
    await page.keyboard.press('Enter')
    await expectChapter(page, 'community')
  })
}

test('delayed images retain a reserved preview frame and stable index geometry', async ({ page }) => {
  let releaseImages = () => {}
  const ready = new Promise<void>(resolve => { releaseImages = resolve })
  await page.route(/\/media\/(?:cirs-home-desktop|vallalar-website-desktop|accuflow-prototype-desktop)\.webp$/, async route => {
    await ready
    await route.continue()
  })
  await page.goto('/work', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => document.fonts.ready)
  const index = page.getByRole('navigation', { name: 'Explore selected projects' })
  const entry = index.locator('.work-index-community')
  await entry.focus()
  const before = { index: await index.boundingBox(), frame: await entry.locator('.work-index-preview').boundingBox() }
  releaseImages()
  await expect.poll(() => index.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true)
  expect({ index: await index.boundingBox(), frame: await entry.locator('.work-index-preview').boundingBox() }).toEqual(before)
})

test('an unavailable project image leaves its title and native project link usable', async ({ page }) => {
  await page.route('**/media/vallalar-website-desktop.webp', route => route.abort())
  await page.goto('/work')
  const entry = page.locator('.work-index-community')
  await entry.focus()
  await expect(entry.locator('.work-index-name')).toBeVisible()
  await expect(entry.locator('.work-index-note')).toContainText('Voluntary since 2023')
  await page.keyboard.press('Enter')
  await expectChapter(page, 'community')
})
