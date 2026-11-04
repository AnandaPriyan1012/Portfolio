import { test, expect, type Locator, type Page } from '@playwright/test'

async function ready(page: Page, path: string) {
  await page.goto(path)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
}

async function decoded(image: Locator) {
  await image.scrollIntoViewIfNeeded()
  await image.evaluate(node => Promise.race([
    (node as HTMLImageElement).decode(),
    new Promise((_, reject) => setTimeout(() => reject(Error('Visible evidence image did not decode')), 8000)),
  ]))
  const geometry = await image.evaluate(node => {
    const img = node as HTMLImageElement
    const box = img.getBoundingClientRect(), parent = img.parentElement!.getBoundingClientRect()
    return { width: img.naturalWidth, fit: getComputedStyle(img).objectFit,
      inside: box.left >= parent.left - .5 && box.right <= parent.right + .5,
      path: new URL(img.currentSrc).pathname }
  })
  expect(geometry.width).toBeGreaterThan(300)
  expect(geometry.fit).toBe('contain')
  expect(geometry.inside).toBe(true)
  return geometry.path
}

async function jump(page: Page, label: string, id: string) {
  const link = page.getByRole('navigation', { name: 'Case study chapters' }).getByRole('link', { name: label, exact: true })
  await link.focus()
  await page.keyboard.press('Enter')
  const section = page.locator('#' + id)
  await expect(section).toBeFocused()
  await expect(link).toHaveAttribute('aria-current', 'location')
  const box = (await section.boundingBox())!
  expect(box.y).toBeGreaterThanOrEqual(90)
  expect(box.y).toBeLessThan(210)
  return section
}

for (const width of [320, 390, 1440]) {
  test(`Vallalar evidence is a native indexed bilingual chapter at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const external: string[] = [], errors: string[] = []
    page.on('request', request => { if (!request.url().startsWith(new URL(test.info().project.use.baseURL!).origin)) external.push(request.url()) })
    page.on('pageerror', error => errors.push(error.message))
    await ready(page, '/projects/community')
    const chapter = await jump(page, 'English & Tamil website views', 'case-community-languages')
    await expect(chapter).toContainText('public website review preview')
    await page.keyboard.press('Tab')
    const english = chapter.getByRole('tab', { name: 'English', exact: true })
    await expect(english).toBeFocused()
    const image = chapter.locator('.community-language-capture img')
    expect(await decoded(image)).toBe(`/media/vallalar-language-en-${width < 768 ? 'mobile' : 'desktop'}.webp`)
    await english.focus()
    await page.keyboard.press('ArrowRight')
    const tamil = chapter.getByRole('tab', { name: /Tamil/ })
    await expect(tamil).toBeFocused()
    await expect(tamil).toHaveAttribute('aria-selected', 'true')
    expect(await decoded(image)).toBe(`/media/vallalar-language-ta-${width < 768 ? 'mobile' : 'desktop'}.webp`)
    await expect(chapter.getByRole('link', { name: 'Open the Tamil preview', exact: true })).toHaveAttribute('href', 'https://vallalar-sathya-dharmasalai.vercel.app/ta/about/')
    expect(await chapter.locator('.community-language-panel').evaluate(node => getComputedStyle(node).display)).toBe('block')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    expect(external).toEqual([])
    expect(errors).toEqual([])
  })

  test(`AccuFlow evidence follows four genuine source routes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await ready(page, '/projects/accuflow')
    const chapter = await jump(page, 'Inside the website prototype', 'case-accuflow-interfaces')
    const views = [
      ['Homepage', 'home', ''], ['The product', 'product', 'product'],
      ['How it works', 'workflow', 'how-it-works'], ['The guide', 'guide', 'try'],
    ]
    for (const [label, id, path] of views) {
      const tab = chapter.getByRole('tab', { name: new RegExp(label + '$', 'i') })
      await tab.focus()
      await page.keyboard.press('Enter')
      await expect(tab).toHaveAttribute('aria-selected', 'true')
      const source = width < 768 && id !== 'home' ? 'mobile' : 'desktop'
      expect(await decoded(chapter.locator('.interface-atlas-capture img'))).toBe(`/media/atlas-accuflow-${id}-${source}.webp`)
      await expect(chapter.getByRole('link', { name: 'Open this source view', exact: true })).toHaveAttribute('href', 'https://accuflow-premium-ai.netlify.app/' + path)
    }
    await expect(chapter).toContainText('Website prototype only.')
    expect(await chapter.locator('.interface-atlas-panel').evaluate(node => getComputedStyle(node).display)).toBe('block')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}

test('evidence choices persist across reading cuts and case changes retain one correct index', async ({ page }) => {
  await ready(page, '/projects/community')
  let chapter = await jump(page, 'English & Tamil website views', 'case-community-languages')
  await chapter.getByRole('tab', { name: /Tamil/ }).click()
  await page.getByRole('button', { name: 'Quick cut', exact: true }).click()
  await expect(chapter.getByRole('tab', { name: /Tamil/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.case-stage')).toHaveCount(3)
  await expect(page.locator('#case-community-languages')).toHaveCount(1)
  await page.getByRole('button', { name: 'Director’s cut', exact: true }).click()
  await expect(chapter.getByRole('tab', { name: /Tamil/ })).toHaveAttribute('aria-selected', 'true')
  await page.locator('.case-next-story').click()
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page).toHaveURL(/\/projects\/accuflow$/)
  chapter = await jump(page, 'Inside the website prototype', 'case-accuflow-interfaces')
  await expect(page.getByRole('navigation', { name: 'Case study chapters' })).toHaveCount(1)
  await expect(chapter.getByRole('tab')).toHaveCount(4)
  await page.goBack()
  await expect(page).toHaveURL(/\/projects\/accuflow$/)
  await page.goBack()
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page).toHaveURL(/\/projects\/community/)
  await expect(page.locator('#case-community-languages')).toHaveCount(1)
  await expect(page.locator('#case-community-languages').getByRole('tab', { name: /Tamil/ })).toHaveAttribute('aria-selected', 'true')
  await page.reload()
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page.locator('#case-community-languages').getByRole('tab', { name: /Tamil/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('progressbar')).toHaveCount(1)
})

test('CIRS launch is an approved original poster and an honest, click-only Studio handoff', async ({ page }) => {
  const premature: string[] = []
  page.on('request', request => { if (/\.mp4(?:$|[?#])|google\.com|gstatic/.test(request.url())) premature.push(request.url()) })
  await ready(page, '/projects/cirs')
  const chapter = await jump(page, 'The website launch film', 'case-cirs-launch')
  await expect(chapter.locator('img')).toHaveAttribute('src', '/media/cirs-website-launch-poster.jpg')
  await decoded(chapter.locator('img'))
  const link = chapter.getByRole('link', { name: 'Open the launch film in Studio · 0:38', exact: true })
  await expect(link).toHaveAttribute('href', '/studio#cirs-website-launch')
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await expect(chapter.locator('video,iframe')).toHaveCount(0)
  await expect(chapter).not.toContainText(/Crossroads|directed by|sole creator/i)
  expect(premature).toEqual([])
})

test('validated case evidence preferences restore only known choices and write only on user selection', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('ap-case-evidence-v1', JSON.stringify({ communityLanguage: 'ta', accuflowView: 'guide', unused: 'ignored' }))
    const native = Storage.prototype.setItem
    const state = window as Window & { __caseWrites?: string[] }
    state.__caseWrites = []
    Storage.prototype.setItem = function(key, value) {
      if (key === 'ap-case-evidence-v1') state.__caseWrites!.push(key)
      return native.call(this, key, value)
    }
  })
  await ready(page, '/projects/community')
  await expect(page.getByRole('tab', { name: /Tamil/ })).toHaveAttribute('aria-selected', 'true')
  expect(await page.evaluate(() => (window as Window & { __caseWrites?: string[] }).__caseWrites)).toEqual([])
  await page.locator('.case-next-story').click()
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  const guide = page.getByRole('tab', { name: /The guide$/ })
  await expect(guide).toHaveAttribute('aria-selected', 'true')
  await guide.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('tab', { name: /How it works$/ })).toHaveAttribute('aria-selected', 'true')
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem('ap-case-evidence-v1')!))
  expect(saved).toEqual({ communityLanguage: 'ta', accuflowView: 'workflow' })
  expect(await page.evaluate(() => (window as Window & { __caseWrites?: string[] }).__caseWrites)).toHaveLength(1)
})

test('malformed or unknown evidence preferences preserve the genuine default sources', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('ap-case-evidence-v1', JSON.stringify({ communityLanguage: ['ta'], accuflowView: 'https://example.invalid/source' })))
  await ready(page, '/projects/accuflow')
  await expect(page.getByRole('tab', { name: /Homepage$/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.interface-atlas-capture img')).toHaveAttribute('src', '/media/atlas-accuflow-home-desktop.webp')
  await ready(page, '/projects/community')
  await expect(page.getByRole('tab', { name: 'English', exact: true })).toHaveAttribute('aria-selected', 'true')
})

for (const operation of ['getItem', 'setItem'] as const) {
  test(`denied evidence storage ${operation} keeps selections in memory through leaving and returning`, async ({ page }) => {
    await page.addInitScript(operation => {
      const native = Storage.prototype[operation]
      Object.defineProperty(Storage.prototype, operation, { configurable: true, value: function(key: string, ...args: string[]) {
        if (key === 'ap-case-evidence-v1') throw Error('Synthetic case preference storage denial')
        return (native as (...args: string[]) => unknown).call(this, key, ...args)
      } })
    }, operation)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await ready(page, '/projects/accuflow')
    const chapter = await jump(page, 'Inside the website prototype', 'case-accuflow-interfaces')
    await chapter.getByRole('tab', { name: /The guide$/ }).click()
    const contact = page.locator('.case-closing > button')
    await contact.evaluate(node => node.addEventListener('click', () => {
      ;(window as Window & { __caseContactDeparture?: number }).__caseContactDeparture = scrollY
    }, { capture: true, once: true }))
    await contact.click()
    const departure = await page.evaluate(() => (window as Window & { __caseContactDeparture?: number }).__caseContactDeparture!)
    await expect(page).toHaveURL(/\/about#contact$/)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await page.goBack()
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await expect(page).toHaveURL(/\/projects\/accuflow#case-accuflow-interfaces$/)
    await expect(page.getByRole('tab', { name: /The guide$/ })).toHaveAttribute('aria-selected', 'true')
    // A deliberate fragment keeps the evidence chapter in view on Back.
    // The selected tall Guide capture must survive instead of reverting to
    // the short desktop Homepage capture and changing the reading context.
    expect(departure).toBeGreaterThan(1000)
    await expect(chapter).toBeInViewport()
    expect(errors).toEqual([])
  })
}
