import { test, expect } from '@playwright/test'

const drawers = [
  { id: 'cirs', name: 'From the homepage to parent questions.', viewer: '.interface-atlas[data-project="cirs"]', tabs: 4 },
  { id: 'community', name: 'Read the bilingual About page.', viewer: '.community-language-study', tabs: 2 },
  { id: 'accuflow', name: 'From product story to guide interface.', viewer: '.interface-atlas[data-project="accuflow"]', tabs: 4 },
] as const

for (const width of [320, 390, 1440]) test(`${width}px Work keeps real evidence optional, keyboard usable and remembered`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await page.emulateMedia({ reducedMotion: width === 1440 ? 'no-preference' : 'reduce' })
  const errors: string[] = [], initialViewerRequests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const observe = (request: { url(): string }) => {
    if (/\/media\/(?:atlas-|vallalar-language-)/.test(request.url())) initialViewerRequests.push(request.url())
  }
  page.on('request', observe)
  await page.goto('/work')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.work-evidence-drawer')).toHaveCount(3)
  await expect(page.locator('.work-evidence-content')).toHaveCount(0)
  await expect(page.locator('#cirs, #community, #accuflow')).toHaveCount(3)
  await expect(page.locator('.community-purpose')).toContainText('After helping prepare and distribute meals')
  await expect(page.locator('.community-purpose')).toContainText('request for a stronger online presence')
  await expect(page.locator('[data-editor-note]')).toHaveCount(0)
  // The visible route deck may load its selected Guide proof; hidden detailed
  // viewers still mount no other Atlas/language capture before disclosure.
  expect(initialViewerRequests.filter(url => !/atlas-accuflow-guide-(?:desktop|mobile)\.webp/.test(url))).toEqual([])
  page.off('request', observe)
  const collapsedHeight = await page.evaluate(() => document.documentElement.scrollHeight)

  for (const entry of drawers) {
    const drawer = page.locator(`#${entry.id}-evidence`)
    const summary = drawer.locator(':scope > summary')
    await expect(drawer).not.toHaveAttribute('open', '')
    await expect(summary).toContainText(entry.name)
    const box = (await summary.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.width).toBeGreaterThanOrEqual(44)
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(drawer).toHaveAttribute('open', '')
    await expect(summary).toBeFocused()
    const viewer = drawer.locator(entry.viewer)
    await expect(viewer.getByRole('tab')).toHaveCount(entry.tabs)
    const first = viewer.getByRole('tab').first()
    await first.focus()
    await page.keyboard.press('End')
    const selected = viewer.getByRole('tab', { selected: true })
    await expect(selected).toBeFocused()
    const selectedName = (await selected.textContent())!
    const capture = viewer.getByRole('tabpanel').locator('img')
    await capture.scrollIntoViewIfNeeded()
    await capture.evaluate(image => (image as HTMLImageElement).decode())
    expect(await capture.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(300)
    await expect(capture).toHaveCSS('object-fit', 'contain')
    await summary.focus()
    await page.keyboard.press('Space')
    await expect(drawer).not.toHaveAttribute('open', '')
    await expect(summary).toBeFocused()
    await expect(summary).toBeInViewport()
    await expect(viewer).toBeHidden()
    await page.keyboard.press('Enter')
    await expect(drawer).toHaveAttribute('open', '')
    await expect(viewer.getByRole('tab', { selected: true })).toHaveText(selectedName)
  }
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(collapsedHeight + 1000)
  for (const entry of drawers) {
    const drawer = page.locator(`#${entry.id}-evidence`)
    await drawer.locator(':scope > summary').focus()
    await page.keyboard.press('Space')
    await expect(drawer).not.toHaveAttribute('open', '')
    await expect(page.locator(`a[href="/projects/${entry.id}"]`).first()).toHaveAttribute('href', `/projects/${entry.id}`)
  }
  await page.locator('.work-index-community').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work#community$/)
  await expect(page.locator('#community')).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  expect(errors).toEqual([])
})

test('a direct evidence hash reaches its native summary without auto-opening a viewer', async ({ page }) => {
  await page.goto('/work#community-evidence')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  const drawer = page.locator('#community-evidence')
  await expect(drawer).not.toHaveAttribute('open', '')
  await expect(drawer.locator(':scope > summary')).toBeInViewport()
  await expect(drawer.locator('.work-evidence-content')).toHaveCount(0)
  await drawer.locator(':scope > summary').focus()
  await page.keyboard.press('Enter')
  await expect(drawer).toHaveAttribute('open', '')
  await expect(drawer.getByRole('tab', { name: 'English', exact: true })).toBeVisible()
})

for (const width of [390, 1440]) test(`${width}px case returns preserve open evidence, selected views and the original Work position`, async ({ page }) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width, height: 900 })
  await page.emulateMedia({ reducedMotion: width === 1440 ? 'no-preference' : 'reduce' })
  await page.goto('/work')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  const cirs = page.locator('#cirs-evidence')
  await cirs.locator('summary').focus()
  await page.keyboard.press('Enter')
  const questions = cirs.getByRole('tab', { name: 'Parent questions', exact: true })
  await questions.focus()
  await page.keyboard.press('Enter')
  await expect(questions).toHaveAttribute('aria-selected', 'true')
  const community = page.locator('#community-evidence')
  await community.locator('summary').focus()
  await page.keyboard.press('Enter')
  const tamil = community.getByRole('tab', { name: /Tamil/ })
  await tamil.focus()
  await page.keyboard.press('Enter')
  await expect(tamil).toHaveAttribute('aria-selected', 'true')

  for (const returnType of ['explicit', 'browser']) {
    // The lower case link follows both expanded viewers, including the
    // different Tamil capture height. Restore the reading layout before Y.
    const origin = page.locator('#accuflow').getByRole('link', { name: 'Project notes', exact: true })
    await origin.focus()
    await expect(origin).toBeInViewport()
    await page.waitForTimeout(250)
    const before = await page.evaluate(() => scrollY)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/projects\/accuflow$/)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    if (returnType === 'explicit') await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
    else await page.goBack()
    await expect(page).toHaveURL(/\/work$/)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await expect(cirs).toHaveAttribute('open', '')
    await expect(community).toHaveAttribute('open', '')
    await expect(questions).toHaveAttribute('aria-selected', 'true')
    await expect(tamil).toHaveAttribute('aria-selected', 'true')
    await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), before)).toBeLessThan(4)
    await expect(origin).toBeInViewport()
    await expect(origin).toBeFocused()
  }
  const beforeReload = await page.evaluate(() => scrollY)
  await page.reload()
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(cirs).toHaveAttribute('open', '')
  await expect(community).toHaveAttribute('open', '')
  await expect(questions).toHaveAttribute('aria-selected', 'true')
  await expect(tamil).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), beforeReload)).toBeLessThan(4)
})

test('denied evidence storage keeps open and selected Work views in memory through a case visit', async ({ page }) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key === 'ap-work-evidence-v1') throw new DOMException('Blocked test storage', 'SecurityError')
      return get.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'ap-work-evidence-v1') throw new DOMException('Blocked test storage', 'SecurityError')
      return set.call(this, key, value)
    }
  })
  await page.goto('/work')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  const drawer = page.locator('#cirs-evidence')
  await drawer.locator('summary').focus()
  await page.keyboard.press('Enter')
  const last = drawer.getByRole('tab', { name: 'Parent questions', exact: true })
  await last.focus()
  await page.keyboard.press('Enter')
  const origin = page.locator('#community').getByRole('link', { name: 'Read the case study', exact: true })
  await origin.focus()
  const before = await page.evaluate(() => scrollY)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/community$/)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.goBack()
  await expect(page).toHaveURL(/\/work$/)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(drawer).toHaveAttribute('open', '')
  await expect(last).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), before)).toBeLessThan(4)
  await expect(origin).toBeFocused()
})
