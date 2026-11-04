import { test, expect, type Locator, type Page } from '@playwright/test'

const variants = [
  { width: 1440, height: 1000, motion: 'no-preference' as const, touch: false },
  { width: 390, height: 844, motion: 'reduce' as const, touch: true },
  { width: 320, height: 844, motion: 'reduce' as const, touch: true },
]
const titles = { cirs: 'Open the CIRS case study', community: 'Open the Vallalar case study' }
type Project = keyof typeof titles
type Departure = { top: number; href: string | null; occurrence: number; focused: boolean }
declare global { interface Window { __realOriginDeparture?: Departure } }

test.beforeEach(async ({ page, request }) => {
  if (process.env.AP_QA_EXPECTED_BUNDLE) {
    const response = await request.get('/')
    expect(await response.text()).toContain(process.env.AP_QA_EXPECTED_BUNDLE)
  }
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
})
async function settled(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  const fonts = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
  expect(fonts).toContain('Syne Variable')
  expect(fonts).toContain('Instrument Sans Variable')
}
async function about(page: Page) {
  await page.goto('/about')
  await settled(page)
  await expect(page.locator('.about-origins')).toHaveCount(1)
}
function story(page: Page, project: Project) {
  return page.locator('.about-origins').getByRole('link', { name: titles[project], exact: true })
}
function builder(page: Page, project: Project) {
  return page.locator(`.about-identity-links a[href="/projects/${project}"]`)
}
async function enter(page: Page, anchor: Locator, method: 'keyboard' | 'pointer', touch: boolean) {
  await anchor.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }))
  if (method === 'keyboard') await anchor.focus()
  await page.waitForTimeout(150)
  await anchor.evaluate(node => node.addEventListener('click', () => {
    const href = node.getAttribute('href')
    const links = [...document.querySelectorAll('main a[href]')].filter(link => link.getAttribute('href') === href)
    window.__realOriginDeparture = { top: scrollY, href, occurrence: links.indexOf(node), focused: node === document.activeElement }
  }, { capture: true, once: true }))
  if (method === 'keyboard') await page.keyboard.press('Enter')
  else if (touch) await anchor.tap()
  else await anchor.click()
  return page.evaluate(() => window.__realOriginDeparture!)
}
async function returned(page: Page, anchor: Locator, departure: Departure) {
  await expect(page).toHaveURL(/\/about$/)
  await settled(page)
  await expect(anchor).toBeFocused()
  await expect(anchor).toBeInViewport()
  expect(await anchor.getAttribute('tabindex')).toBeNull()
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), departure.top)).toBeLessThan(4)
  await page.locator('.about-origins img').first().evaluate(node => node.dispatchEvent(new Event('load')))
  await page.waitForTimeout(600)
  await expect(anchor).toBeFocused()
  expect(Math.abs(await page.evaluate(() => scrollY) - departure.top)).toBeLessThan(4)
}
async function explicitBack(page: Page) {
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).focus()
  await page.keyboard.press('Enter')
}
async function workNavigation(page: Page) {
  const menu = page.getByRole('button', { name: 'Open menu', exact: true })
  if (await menu.isVisible()) { await menu.focus(); await page.keyboard.press('Enter') }
  const work = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Work', exact: true })
  await work.focus()
  const departure = await page.evaluate(() => scrollY)
  await page.keyboard.press('Enter')
  return departure
}

for (const variant of variants) test.describe(`${variant.width}px real About origin return`, () => {
  test.use({ viewport: { width: variant.width, height: variant.height }, reducedMotion: variant.motion,
    isMobile: variant.touch, hasTouch: variant.touch })
  for (const project of ['cirs', 'community'] as const) test(`${project} story and Builder links retain distinct native focus and exact Y`, async ({ page }, testInfo) => {
    test.setTimeout(60000)
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
    await about(page)
    const first = story(page, project), second = builder(page, project)
    expect(await page.locator(`main a[href="/projects/${project}"]`).count()).toBeGreaterThanOrEqual(2)
    const occurrences = await first.evaluate(node => {
      const links = [...document.querySelectorAll('main a[href]')].filter(link => link.getAttribute('href') === node.getAttribute('href'))
      const later = document.querySelector(`.about-identity-links a[href="${node.getAttribute('href')}"]`)
      return { story: links.indexOf(node), builder: links.indexOf(later!) }
    })
    expect(occurrences.story).toBeGreaterThanOrEqual(0)
    expect(occurrences.builder).toBeGreaterThan(occurrences.story)
    const records = []
    for (const [anchor, method] of [[first, 'keyboard'], [second, 'pointer']] as const) {
      const departure = await enter(page, anchor, method, variant.touch)
      expect(departure.occurrence).toBe(method === 'keyboard' ? occurrences.story : occurrences.builder)
      await expect(page).toHaveURL(new RegExp(`/projects/${project}$`))
      await settled(page)
      await expect(page.locator('h1')).toBeFocused()
      await explicitBack(page)
      await returned(page, anchor, departure)
      records.push({ method: variant.touch && method === 'pointer' ? 'touch' : method, departure, returnedTop: await page.evaluate(() => scrollY) })
    }
    expect(errors).toEqual([])
    await testInfo.attach('real-story-and-builder-origins', { body: JSON.stringify(records, null, 2), contentType: 'application/json' })
    if (project === 'cirs') await page.screenshot({ path: `/workspace/cycle-thirteen-audit/ux/real-builder-return-${variant.width}.png` })
  })

  test('Swimmer stays selected through real story case returns and ordinary browser history', async ({ page }, testInfo) => {
    test.setTimeout(60000)
    await about(page)
    const swimmer = page.getByRole('tab', { name: 'Swimmer', exact: true })
    await swimmer.focus(); await page.keyboard.press('Enter')
    await expect(swimmer).toHaveAttribute('aria-selected', 'true')
    const records = []
    for (const [project, nativeBack] of [['cirs', false], ['community', true]] as const) {
      const origin = story(page, project)
      const departure = await enter(page, origin, 'keyboard', variant.touch)
      await settled(page)
      if (nativeBack) await page.goBack()
      else await explicitBack(page)
      await returned(page, origin, departure)
      await expect(swimmer).toHaveAttribute('aria-selected', 'true')
      await expect(page.locator('.about-identity-swimming dd')).toHaveText(['41.48 s', '1 min 6 s'])
      records.push({ project, nativeBack, departure })
    }
    await page.locator('.about-identity-swimming').scrollIntoViewIfNeeded()
    const top = await workNavigation(page)
    await expect(page).toHaveURL(/\/work$/); await settled(page)
    await page.goBack(); await settled(page)
    await expect(page).toHaveURL(/\/about$/)
    await expect(swimmer).toHaveAttribute('aria-selected', 'true')
    await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), top)).toBeLessThan(4)
    await page.waitForTimeout(600)
    expect(Math.abs(await page.evaluate(() => scrollY) - top)).toBeLessThan(4)
    await testInfo.attach('swimmer-state-and-native-history', { body: JSON.stringify({ records, genericHistoryTop: top }), contentType: 'application/json' })
  })
})

test('the real story CTA returns correctly when pointer activation leaves native focus on another project', async ({ page }) => {
  await about(page)
  await builder(page, 'community').focus()
  const origin = story(page, 'cirs')
  await origin.evaluate(node => node.addEventListener('mousedown', event => event.preventDefault(), { once: true }))
  const departure = await enter(page, origin, 'pointer', false)
  expect(departure.focused).toBe(false)
  await settled(page)
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await returned(page, origin, departure)
})

for (const project of ['cirs', 'community'] as const) for (const method of ['modified', 'middle'] as const)
  test(`${project} real story preserves native ${method} opening`, async ({ page, context }) => {
    await about(page)
    const origin = story(page, project)
    await origin.scrollIntoViewIfNeeded()
    const before = await page.evaluate(() => ({ url: location.href, top: scrollY, length: history.length }))
    const [popup] = await Promise.all([context.waitForEvent('page'), origin.click(method === 'middle' ? { button: 'middle' } : { modifiers: ['ControlOrMeta'] })])
    await popup.waitForLoadState('domcontentloaded')
    await expect(popup).toHaveURL(new RegExp(`/projects/${project}$`))
    expect(await page.evaluate(() => ({ url: location.href, top: scrollY, length: history.length }))).toEqual(before)
    await popup.close()
  })
