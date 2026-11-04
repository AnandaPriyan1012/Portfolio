import { test as base, expect, type Page } from '@playwright/test'

const films = [
  { id: 'vantara', title: 'Vantara' },
  { id: 'cck-trailer', title: 'CCK trailer' },
  { id: 'farewell-video', title: 'Farewell video' },
  { id: 'ted-ed-2026', title: 'TED-Ed auditions' },
  { id: 'cirs-website-launch', title: 'CIRS website launch' },
] as const

const test = base.extend<{ traffic: string[] }>({
  traffic: [async ({ context }, use) => {
    const traffic: string[] = [], errors: string[] = []
    context.on('request', request => {
      if (/\.mp4(?:\?|$)|drive\.google\.com|googlevideo\.com/.test(request.url())) traffic.push(request.url())
    })
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
    await context.route(/https:\/\/(?:[^/]*\.)?(?:google\.com|googleusercontent\.com|googleapis\.com|gstatic\.com)\//, route => route.abort())
    await use(traffic)
    expect(traffic, 'Artwork links must not request video or a Drive player before Watch').toEqual([])
    expect(errors).toEqual([])
  }, { auto: true }],
})

async function settled(page: Page) {
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
  const fonts = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
  expect(fonts).toContain('Syne Variable')
  expect(fonts).toContain('Instrument Sans Variable')
}

async function selected(page: Page, film: (typeof films)[number]) {
  await expect(page).toHaveURL(new RegExp(`/studio#${film.id}$`))
  await settled(page)
  await expect(page.locator('.screening-title-card h3')).toHaveText(film.title)
  await expect(page.locator('.screening-title-card h3')).toBeFocused()
  await expect(page.getByRole('radio', { name: film.title, exact: true })).toBeChecked()
  await expect(page.locator('video,iframe')).toHaveCount(0)
}

for (const width of [390, 1440]) test.describe(`${width}px Creative artwork handoff`, () => {
  test.use({ viewport: { width, height: width === 390 ? 844 : 1000 }, hasTouch: width === 390, isMobile: width === 390 })
  for (const film of films) test(`${film.title} artwork opens that exact title without starting media`, async ({ page }) => {
    await page.goto('/projects/creative')
    await settled(page)
    const collection = page.locator('.case-film-collection')
    await expect(collection.locator('.case-film-collection-film')).toHaveCount(5)
    await expect(collection.locator('.case-film-collection-featured')).toHaveAttribute('href', '/studio#vantara')
    const link = collection.getByRole('link', { name: `Open ${film.title} in Studio`, exact: true })
    await expect(link).toHaveAttribute('href', `/studio#${film.id}`)
    const bounds = await link.boundingBox()
    expect(bounds!.width).toBeGreaterThanOrEqual(44)
    expect(bounds!.height).toBeGreaterThanOrEqual(44)
    if (width === 390) await link.locator('img').tap()
    else await link.locator('img').click()
    await selected(page, film)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: `Play selected film: ${film.title}`, exact: true })).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
})

test('an artwork link supports native keyboard activation', async ({ page }) => {
  await page.goto('/projects/creative')
  await settled(page)
  const link = page.getByRole('link', { name: 'Open Vantara in Studio', exact: true })
  await link.focus()
  await page.keyboard.press('Enter')
  await selected(page, films[0])
})

for (const film of films.slice(0, 2)) for (const action of ['modified', 'middle'] as const) {
  test(`${action} ${film.title} artwork link opens a native separate tab`, async ({ page, context }) => {
    await page.goto('/projects/creative')
    await settled(page)
    const link = page.getByRole('link', { name: `Open ${film.title} in Studio`, exact: true })
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      link.click(action === 'middle' ? { button: 'middle' } : { modifiers: ['ControlOrMeta'] }),
    ])
    await popup.waitForLoadState('domcontentloaded')
    await selected(popup, film)
    await expect(page).toHaveURL(/\/projects\/creative$/)
    await expect(page.locator('.case-film-collection')).toBeVisible()
    await popup.close()
  })
}

test('an unavailable native source has no Creative artwork handoff', async ({ page }) => {
  await page.route('**/src/content.ts*', async route => {
    const response = await route.fetch()
    await route.fulfill({ response, body: `${await response.text()}\n;creativeMedia.find(film=>film.id==='cirs-website-launch').nativePlaybackApproved=false;\n` })
  })
  await page.goto('/projects/creative')
  await settled(page)
  const collection = page.locator('.case-film-collection')
  await expect(collection.locator('.case-film-collection-film')).toHaveCount(4)
  await expect(collection.getByRole('link', { name: 'Open CIRS website launch in Studio', exact: true })).toHaveCount(0)
  await expect(collection.locator('a[href="/studio#cirsmun-2026"]')).toHaveCount(0)
})
