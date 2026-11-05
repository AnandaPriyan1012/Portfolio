import { test, expect, type Page } from '@playwright/test'

const samples = [
  { rate: 4, batch: 2, arrivals: [0, 2.5], waits: [2.5, 0], mean: '1.3 min', credits: '8.0' },
  { rate: 1, batch: 4, arrivals: [0, 10, 20, 30], waits: [30, 20, 10, 0], mean: '15.0 min', credits: '5.0' },
  { rate: 12, batch: 4, arrivals: [0, 5 / 6, 5 / 3, 2.5], waits: [2.5, 5 / 3, 5 / 6, 0], mean: '1.3 min', credits: '5.0' },
] as const
const study = (page: Page) => page.locator('.batch-dispatch-study')
const lab = (page: Page) => page.locator('#airkart details.lab')
const replay = (page: Page) => study(page).locator('.batch-replay')
const step = (page: Page) => study(page).locator('.batch-step')

test.beforeEach(async ({ page, request }) => {
  if (process.env.AP_QA_EXPECTED_BUNDLE || process.env.AP_QA_EXPECTED_STYLE) {
    const html = await (await request.get('/work')).text()
    if (process.env.AP_QA_EXPECTED_BUNDLE) expect(html).toContain(process.env.AP_QA_EXPECTED_BUNDLE)
    if (process.env.AP_QA_EXPECTED_STYLE) expect(html).toContain(process.env.AP_QA_EXPECTED_STYLE)
  }
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
})
async function scrollSettled(page: Page) {
  let previous = await page.evaluate(() => scrollY), stable = 0
  await expect.poll(async () => {
    const next = await page.evaluate(() => scrollY)
    stable = Math.abs(next - previous) < .5 ? stable + 1 : 0; previous = next
    return stable
  }, { intervals: [100] }).toBeGreaterThanOrEqual(3)
}
async function visibleStudy(page: Page) {
  await study(page).scrollIntoViewIfNeeded(); await scrollSettled(page)
  await expect(study(page)).toBeInViewport()
}
async function opened(page: Page) {
  await page.goto('/work'); await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  const outer = page.locator('#airkart > summary')
  await outer.scrollIntoViewIfNeeded(); await scrollSettled(page); await outer.focus(); await page.keyboard.press('Enter')
  await expect(page.locator('#airkart')).toHaveAttribute('open', '')
  const summary = lab(page).locator(':scope > summary')
  await summary.scrollIntoViewIfNeeded(); await scrollSettled(page); await summary.focus(); await page.keyboard.press('Enter')
  await expect(lab(page)).toHaveAttribute('open', '')
  await visibleStudy(page)
  await complete(page, 2)
  await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
}
async function keyInput(page: Page, id: 'arrival-rate' | 'batch-size', value: number) {
  const input = page.locator(`#${id}`)
  await input.scrollIntoViewIfNeeded(); await scrollSettled(page); await input.focus()
  const low = id === 'arrival-rate' ? 1 : 2, high = id === 'arrival-rate' ? 12 : 4
  await page.keyboard.press(value === high ? 'End' : 'Home')
  if (value !== high) for (let n = low; n < value; n += 1) await page.keyboard.press('ArrowRight')
  await expect(input).toHaveValue(String(value)); await expect(input).toBeFocused()
}
async function model(page: Page, sample: typeof samples[number]) {
  await expect(study(page).locator('.batch-order')).toHaveCount(sample.batch)
  for (let index = 0; index < sample.batch; index += 1) {
    const order = study(page).locator('.batch-order').nth(index)
    await expect(order).toHaveAttribute('data-order', String(index + 1))
    await expect(order.locator('dl > div').nth(0).locator('dt')).toHaveText('Planned arrival')
    await expect(order.locator('dl > div').nth(0).locator('dd')).toHaveText(`${sample.arrivals[index].toFixed(1)} min`)
    await expect(order.locator('dl > div').nth(1).locator('dt')).toHaveText('Planned wait')
    await expect(order.locator('dl > div').nth(1).locator('dd')).toHaveText(`${sample.waits[index].toFixed(1)} min`)
    await expect(order).toBeVisible()
  }
  await expect(study(page).locator('.batch-shared-journey')).toContainText(`Shared dispatch at ${sample.arrivals.at(-1)!.toFixed(1)} model min.`)
  await expect(study(page).locator('.batch-cost-explanation')).toContainText(`${sample.credits} demo credits per order.`)
  await expect(lab(page).locator('.lab-metrics strong')).toHaveText([sample.mean, sample.credits])
  await expect(study(page)).toContainText('Batching time, not flight time.')
  await expect(lab(page).locator('.lab-note')).toContainText('not AirKart performance')
}
async function complete(page: Page, count: number) {
  await expect(study(page)).toHaveAttribute('data-phase', 'complete')
  await expect(study(page)).toHaveAttribute('data-playing', 'false')
  await expect(study(page)).toHaveAttribute('data-arrived', String(count))
  await expect(study(page).locator('.batch-order[data-arrived="true"]')).toHaveCount(count)
}
async function press(page: Page, target: ReturnType<typeof replay>, touch = false) {
  await target.scrollIntoViewIfNeeded()
  if (touch) await target.tap(); else { await target.focus(); await page.keyboard.press('Enter') }
  await expect(target).toBeFocused()
}
async function running(page: Page) {
  await expect(study(page)).toHaveAttribute('data-motion', 'on')
  await press(page, replay(page))
  await expect(study(page)).toHaveAttribute('data-playing', 'true')
  await expect(study(page)).toHaveAttribute('data-phase', 'collecting')
  await expect(study(page)).toHaveAttribute('data-arrived', '1')
}

for (const width of [1440, 390, 320]) test.describe(`${width}px illustrative batch study`, () => {
  const touch = width < 768
  test.use({ viewport: { width, height: touch ? 844 : 1000 }, reducedMotion: width === 320 ? 'reduce' : 'no-preference', isMobile: touch, hasTouch: touch })

  test('native ranges render truthful planned orders and keep the upper teaching example separate', async ({ page }, testInfo) => {
    await opened(page)
    const choice = page.locator('#airkart').getByRole('button', { name: 'Wait for another order', exact: true })
    await choice.scrollIntoViewIfNeeded(); await scrollSettled(page); await choice.focus(); await page.keyboard.press('Enter')
    const upper = page.locator('#airkart .decision-metrics strong')
    await expect(upper).toHaveText(['5 min', '5 credits'])
    const records = []
    for (const sample of samples) {
      await keyInput(page, 'arrival-rate', sample.rate); await keyInput(page, 'batch-size', sample.batch)
      await visibleStudy(page); await complete(page, sample.batch); await model(page, sample)
      await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
      await expect(upper).toHaveText(['5 min', '5 credits'])
      records.push({ rate: sample.rate, batch: sample.batch, mean: sample.mean, credits: sample.credits })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    expect((await replay(page).boundingBox())!.height).toBeGreaterThanOrEqual(44)
    expect((await step(page).boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await testInfo.attach('native-range-and-planned-model-samples', { body: JSON.stringify(records, null, 2), contentType: 'application/json' })
  })

  test('manual stepping advances one arrival and dispatches without starting a timer', async ({ page }) => {
    await opened(page); await keyInput(page, 'batch-size', 4); await visibleStudy(page)
    await press(page, step(page), touch)
    await expect(study(page)).toHaveAttribute('data-arrived', '1'); await expect(study(page)).toHaveAttribute('data-playing', 'false')
    for (let count = 2; count <= 4; count += 1) {
      await expect(step(page)).toHaveText('Next arrival'); await press(page, step(page), touch)
      await expect(study(page)).toHaveAttribute('data-arrived', String(count)); await expect(study(page)).toHaveAttribute('data-playing', 'false')
    }
    await expect(study(page)).toHaveAttribute('data-phase', 'ready')
    await expect(step(page)).toHaveText('Dispatch batch')
    await page.waitForTimeout(800)
    await expect(study(page)).toHaveAttribute('data-phase', 'ready')
    await press(page, step(page), touch); await complete(page, 4)
    await expect(step(page)).toHaveText('Step through'); await expect(step(page)).toBeFocused()
    if (width === 320) await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
  })

  test('only an explicit replay runs one finite batch, with stable focus and sparse live announcements', async ({ page }) => {
    await opened(page); await keyInput(page, 'batch-size', 4); await visibleStudy(page)
    if (width === 320) {
      await expect(study(page)).toHaveAttribute('data-motion', 'off')
      await expect(replay(page)).toHaveText('Restart steps'); await press(page, replay(page), true)
      await expect(study(page)).toHaveAttribute('data-arrived', '1'); await expect(study(page)).toHaveAttribute('data-playing', 'false')
      return
    }
    await expect(study(page)).toHaveAttribute('data-motion', 'on')
    await study(page).evaluate(node => {
      const state = { updates: [] as string[], groups: [] as string[] }; (window as Window & { __batchNotice?: typeof state }).__batchNotice = state
      new MutationObserver(() => state.updates.push(node.querySelector('.batch-study-notice')!.textContent ?? ''))
        .observe(node.querySelector('.batch-study-notice')!, { childList: true, characterData: true, subtree: true })
      new MutationObserver(() => state.groups.push((node as HTMLElement).dataset.groupAnimation ?? ''))
        .observe(node, { attributes: true, attributeFilter: ['data-group-animation'] })
    })
    await page.waitForTimeout(2300); await complete(page, 4)
    expect(await page.evaluate(() => (window as Window & { __batchNotice?: { updates: string[] } }).__batchNotice!.updates)).toEqual([])
    expect(await page.evaluate(() => (window as Window & { __batchNotice?: { groups: string[] } }).__batchNotice!.groups)).toEqual([])
    const nativeNode = await replay(page).elementHandle()
    await press(page, replay(page), touch)
    await expect(study(page)).toHaveAttribute('data-playing', 'true')
    await expect(study(page)).toHaveAttribute('data-arrived', '1')
    await expect(replay(page)).toHaveText('Stop replay')
    await expect(study(page)).toHaveAttribute('data-phase', 'complete', { timeout: 4500 })
    await complete(page, 4); await expect(replay(page)).toBeFocused()
    expect(await nativeNode!.evaluate(node => node === document.querySelector('.batch-replay'))).toBe(true)
    const notices = await page.evaluate(() => (window as Window & { __batchNotice?: { updates: string[] } }).__batchNotice!.updates)
    expect(notices.length).toBeLessThanOrEqual(2)
    expect(notices[0]).toContain('Replay started'); expect(notices.at(-1)).toContain('Batch complete')
    expect(await page.evaluate(() => (window as Window & { __batchNotice?: { groups: string[] } }).__batchNotice!.groups)).toContain('true')
    await page.waitForTimeout(800); await complete(page, 4)
    expect(await study(page).evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
  })
})

test('Stop and manual takeover cancel automatic continuation while retaining the same command focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await opened(page)
  await keyInput(page, 'batch-size', 4); await visibleStudy(page); await running(page)
  await press(page, replay(page)); await complete(page, 4)
  await expect(replay(page)).toBeFocused()
  await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
  await running(page); await press(page, step(page))
  await expect(study(page)).toHaveAttribute('data-playing', 'false')
  const count = await study(page).getAttribute('data-arrived')
  await page.waitForTimeout(900)
  await expect(study(page)).toHaveAttribute('data-arrived', count!)
  await expect(step(page)).toBeFocused()
})

test('native input during replay resets to a complete new model without moving slider focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await opened(page)
  await keyInput(page, 'batch-size', 4); await visibleStudy(page); await running(page)
  const input = page.locator('#arrival-rate'); await input.focus(); await page.keyboard.press('Home')
  await expect(input).toHaveValue('1'); await expect(input).toBeFocused()
  await complete(page, 4); await visibleStudy(page); await model(page, samples[1])
  await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
  await page.waitForTimeout(900); await complete(page, 4)
})

for (const selector of ['#airkart details.lab', '#airkart'] as const) test(`native collapse of ${selector} stops the example and reopening never autoplays`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await opened(page)
  await keyInput(page, 'batch-size', 4); await visibleStudy(page); await running(page)
  const summary = page.locator(`${selector} > summary`)
  await summary.scrollIntoViewIfNeeded(); await summary.focus(); await page.keyboard.press('Space')
  await expect(page.locator(selector)).not.toHaveAttribute('open', '')
  await complete(page, 4); await expect(summary).toBeFocused()
  await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
  await page.keyboard.press('Enter'); await visibleStudy(page); await complete(page, 4)
  await page.waitForTimeout(800); await complete(page, 4)
})

test('leaving the viewport stops replay and returning does not start it again', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await opened(page)
  await keyInput(page, 'batch-size', 4); await visibleStudy(page); await running(page)
  await page.mouse.move(2, 400); await page.mouse.wheel(0, -2200)
  await expect(study(page)).not.toBeInViewport()
  await complete(page, 4); await scrollSettled(page); await visibleStudy(page)
  await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
  await page.waitForTimeout(800); await complete(page, 4)
})

for (const mode of ['reduced', 'forced', 'motion-off'] as const) test(`${mode} interrupts a running replay with a meaningful static example`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await opened(page)
  await keyInput(page, 'batch-size', 4); await visibleStudy(page); await running(page)
  if (mode === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' })
  else if (mode === 'forced') await page.emulateMedia({ forcedColors: 'active' })
  else {
    const toggle = page.getByRole('button', { name: 'Motion on', exact: true })
    await toggle.scrollIntoViewIfNeeded(); await toggle.click()
  }
  await complete(page, 4); await visibleStudy(page)
  await expect(study(page)).toHaveAttribute('data-motion', 'off')
  await expect(replay(page)).toHaveText('Restart steps')
  await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
})

for (const mode of ['motion-off', 'forced', 'low-power'] as const) test(`${mode} initially exposes planned data and manual interaction without playback`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    reducedMotion: 'no-preference', forcedColors: mode === 'forced' ? 'active' : 'none' })
  await context.addInitScript(mode => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => mode === 'low-power' ? 2 : 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => mode === 'low-power' ? 2 : 8 })
    if (mode === 'motion-off') localStorage.setItem('ap-motion', 'off')
  }, mode)
  const page = await context.newPage()
  try {
    await opened(page); await model(page, samples[0])
    await expect(study(page)).toHaveAttribute('data-motion', 'off')
    await press(page, replay(page), true)
    await expect(study(page)).toHaveAttribute('data-arrived', '1'); await expect(study(page)).toHaveAttribute('data-playing', 'false')
    await press(page, step(page), true); await expect(study(page)).toHaveAttribute('data-phase', 'ready')
    await press(page, step(page), true); await complete(page, 2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  } finally { await context.close() }
})

test('an actual hidden document cancels replay and visibility return does not resume it', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await opened(page)
  await keyInput(page, 'batch-size', 4); await visibleStudy(page); await running(page)
  const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront()
  try {
    test.skip(await page.evaluate(() => !document.hidden), 'This headless browser keeps background tabs visible; no genuine hidden-document signal is available.')
    await expect.poll(() => page.evaluate(() => document.hidden)).toBe(true)
    await complete(page, 4)
  } finally { await other.close(); await page.bringToFront() }
  await page.waitForTimeout(800); await complete(page, 4)
})

test('route unmount removes the running study and return starts a static default model', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await opened(page)
  await keyInput(page, 'batch-size', 4); await visibleStudy(page); await running(page)
  const about = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About', exact: true })
  await about.click(); await expect(page).toHaveURL(/\/about$/)
  await expect(study(page)).toHaveCount(0)
  await page.goBack(); await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page.locator('#airkart')).not.toHaveAttribute('open', '')
  const outer = page.locator('#airkart > summary'); await outer.scrollIntoViewIfNeeded(); await outer.focus(); await page.keyboard.press('Enter')
  const summary = lab(page).locator(':scope > summary'); await summary.scrollIntoViewIfNeeded(); await summary.focus(); await page.keyboard.press('Enter')
  await visibleStudy(page); await complete(page, 2); await model(page, samples[0])
})

test('the compact experiment stays outside C17 selected-work context and does not write navigation state', async ({ page }) => {
  await opened(page)
  await expect(page.locator('.work-chapter-rail')).toHaveAttribute('data-visible', 'false')
  const before = await page.evaluate(() => ({ url: location.href, length: history.length }))
  await press(page, step(page)); await press(page, step(page)); await press(page, step(page))
  expect(await page.evaluate(() => ({ url: location.href, length: history.length }))).toEqual(before)
  await expect(page.locator('.work-chapter-rail')).toHaveAttribute('data-visible', 'false')
  await expect(page.locator('#airkart')).toContainText('student exploration')
})

test.describe('desktop native AP OS cover', () => {
  test.use({ viewport: { width: 1440, height: 1200 }, reducedMotion: 'no-preference' })
  test('an AP OS overlay cancels replay and closing it preserves overlay-opener focus without restarting', async ({ page }, testInfo) => {
    await opened(page); await keyInput(page, 'batch-size', 4); await visibleStudy(page)
    const opener = page.getByRole('button', { name: 'AP OS', exact: true })
    const setup = await opener.evaluate(node => {
      const command = document.querySelector('.batch-replay')!.getBoundingClientRect(), target = node.getBoundingClientRect()
      const header = document.querySelector('.site-header')!.getBoundingClientRect()
      const low = Math.max(0, Math.max(command.bottom, target.bottom) + scrollY - innerHeight + 50)
      const high = Math.min(command.top, target.top) + scrollY - header.bottom - 35
      return { low, high, height: innerHeight }
    })
    expect(setup.high).toBeGreaterThanOrEqual(setup.low)
    const top = Math.min(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight), (setup.low + setup.high) / 2)
    await page.mouse.move(2, 400); await page.mouse.wheel(0, top - await page.evaluate(() => scrollY)); await scrollSettled(page)
    await expect(replay(page)).toBeInViewport(); await expect(opener).toBeInViewport(); await expect(study(page)).toBeInViewport()
    await running(page)
    await opener.focus(); await page.keyboard.press('Enter')
    const overlay = page.getByRole('dialog', { name: 'AP OS', exact: true })
    await expect(overlay).toBeVisible()
    await expect(study(page)).toHaveAttribute('data-playing', 'false', { timeout: 1000 })
    await complete(page, 4); await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
    expect(await overlay.evaluate(node => node.contains(document.activeElement))).toBe(true)
    await page.waitForTimeout(500)
    expect(await overlay.evaluate(node => node.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape'); await expect(overlay).toHaveCount(0); await expect(opener).toBeFocused()
    await page.waitForTimeout(800); await complete(page, 4); await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
    await testInfo.attach('visible-study-and-native-OS-control', { body: JSON.stringify(setup, null, 2), contentType: 'application/json' })
  })
})

test.describe('390px native menu cover', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' })
  test('the phone menu cancels replay and returns focus without restarting the model', async ({ page }) => {
    await opened(page); await keyInput(page, 'batch-size', 4); await visibleStudy(page); await running(page)
    const opener = page.locator('.atelier-navigation .menu-button')
    await expect(opener).toHaveAccessibleName('Open menu')
    await opener.tap(); await expect(opener).toHaveAttribute('aria-expanded', 'true')
    await expect(study(page)).toHaveAttribute('data-playing', 'false', { timeout: 1000 })
    await complete(page, 4); await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
    expect(await page.locator('.site-header').evaluate(node => node.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape'); await expect(opener).toHaveAttribute('aria-expanded', 'false'); await expect(opener).toBeFocused()
    await page.waitForTimeout(800); await complete(page, 4); await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
  })
})

test('all 36 native range combinations bind the planned rows and independent aggregate math without autoplay', async ({ page }, testInfo) => {
  test.setTimeout(60000)
  await opened(page)
  const rate = page.locator('#arrival-rate'), states = []
  for (const count of [2, 3, 4]) {
    await keyInput(page, 'batch-size', count)
    await rate.scrollIntoViewIfNeeded(); await scrollSettled(page); await rate.focus(); await page.keyboard.press('Home')
    for (let value = 1; value <= 12; value += 1) {
      if (value > 1) await page.keyboard.press('ArrowRight')
      await expect(rate).toHaveValue(String(value)); await expect(rate).toBeFocused()
      const arrivals = Array.from({ length: count }, (_, i) => i * (10 / value))
      const departure = arrivals.at(-1)!, waits = arrivals.map(arrival => departure - arrival)
      // Sum integer wait numerators before division so an exact half is not rounded down by summation error.
      const waitNumerators = Array.from({ length: count }, (_, i) => (count - 1 - i) * 10)
      const mean = (waitNumerators.reduce((sum, numerator) => sum + numerator, 0) / (value * count)).toFixed(1)
      const credits = ((12 + 2 * count) / count).toFixed(1)
      await expect(study(page).locator('.batch-order')).toHaveCount(count)
      const expected = arrivals.flatMap((arrival, index) => [`${arrival.toFixed(1)} min`, `${waits[index].toFixed(1)} min`])
      await expect(study(page).locator('.batch-order dd')).toHaveText(expected)
      await expect(lab(page).locator('.lab-metrics strong')).toHaveText([`${mean} min`, credits])
      await expect(study(page).locator('.batch-cost-explanation')).toContainText(`${credits} demo credits per order.`)
      await complete(page, count); await expect(study(page)).toHaveAttribute('data-group-animation', 'false')
      states.push({ rate: value, batch: count, arrivals, waits, mean, credits })
    }
  }
  expect(states).toHaveLength(36)
  await testInfo.attach('native-DOM-all-36-model-combinations', { body: JSON.stringify(states, null, 2), contentType: 'application/json' })
})
