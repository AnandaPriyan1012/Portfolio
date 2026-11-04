import { test as base, expect, type Page } from '@playwright/test'

const launch = { id: 'cirs-website-launch', title: 'CIRS website launch', path: '/media/cirs-website-launch-web.mp4' }
const test = base.extend<{ traffic: { mp4: string[]; google: string[] } }>({
  traffic: [async ({ page }, use) => {
    const traffic = { mp4: [] as string[], google: [] as string[] }, errors: string[] = []
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.pathname.endsWith('.mp4')) traffic.mp4.push(url.pathname)
    })
    page.on('pageerror', error => errors.push(error.message))
    await page.route(/https:\/\/(?:[^/]*\.)?(?:google\.com|googleusercontent\.com|googleapis\.com|gstatic\.com)\//, route => {
      traffic.google.push(route.request().url())
      return route.abort()
    })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
    })
    await use(traffic)
    expect(errors).toEqual([])
    expect(traffic.google).toEqual([])
  }, { auto: true }],
})

async function settled(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  const loaded = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
  expect(loaded).toContain('Syne Variable')
  expect(loaded).toContain('Instrument Sans Variable')
}

async function linked(page: Page, title = launch.title, id = launch.id) {
  const heading = page.locator('.screening-title-card h3')
  await expect(heading).toHaveText(title)
  await expect(heading).toBeFocused()
  await expect(heading).toBeInViewport()
  await expect(page.locator('.screening-projection')).toHaveAttribute('id', id)
  await expect(page.getByRole('radio', { name: title, exact: true })).toBeChecked()
  return heading
}

for (const variant of [
  { width: 1440, touch: false, motion: 'no-preference' as const },
  { width: 390, touch: true, motion: 'reduce' as const },
  { width: 320, touch: true, motion: 'reduce' as const },
]) test.describe(`${variant.width}px linked film`, () => {
  test.use({ viewport: { width: variant.width, height: variant.touch ? 844 : 1000 }, hasTouch: variant.touch, isMobile: variant.touch, reducedMotion: variant.motion })
  test('direct entry and reload select the approved launch film without media or focus drift', async ({ page, traffic }) => {
    await page.goto(`/studio#${launch.id}`)
    await settled(page)
    await linked(page)
    await page.waitForTimeout(350)
    await linked(page)
    expect(traffic.mp4).toEqual([])
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: `Play selected film: ${launch.title}`, exact: true })).toBeFocused()
    await page.reload()
    await settled(page)
    await linked(page)
    expect(traffic.mp4).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(variant.width)
  })
  test('the actual CIRS case handoff reaches its selected film with a native next Watch action', async ({ page, traffic }) => {
    await page.goto('/projects/cirs')
    await settled(page)
    const handoff = page.locator('#case-cirs-launch a[href="/studio#cirs-website-launch"]')
    await handoff.scrollIntoViewIfNeeded()
    await handoff.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/studio#cirs-website-launch$/)
    await settled(page)
    await linked(page)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: `Play selected film: ${launch.title}`, exact: true })).toBeFocused()
    expect(traffic.mp4).toEqual([])
    await page.goBack()
    await settled(page)
    await expect(page).toHaveURL(/\/projects\/cirs$/)
    await expect(page.locator('#case-cirs-launch')).toHaveCount(1)
  })
})

test('native fragment Back and Forward change only the selected approved film and preserve title focus', async ({ page, traffic }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`/studio#${launch.id}`)
  await settled(page)
  await linked(page)
  // A native link exercises fragment navigation rather than invoking component
  // state or dispatching synthetic history events from the test.
  await page.evaluate(() => {
    const link = document.createElement('a')
    link.href = '#ted-ed-2026'
    link.textContent = 'Native film link fixture'
    document.querySelector('.screening-heading')!.appendChild(link)
  })
  await page.getByRole('link', { name: 'Native film link fixture', exact: true }).click()
  await linked(page, 'TED-Ed auditions', 'ted-ed-2026')
  await page.goBack()
  await linked(page)
  await page.goForward()
  await linked(page, 'TED-Ed auditions', 'ted-ed-2026')
  expect(traffic.mp4).toEqual([])
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Play selected film: TED-Ed auditions', exact: true })).toBeFocused()
})

for (const hash of ['', '#not-a-film', '#cirsmun-2026', '#%E0%A4%A', '#masquerade-trailer']) {
  test(`plain or unsupported fragment ${hash || '(none)'} retains the normal ready-film fallback`, async ({ page, traffic }) => {
    await page.goto(`/studio${hash}`)
    await settled(page)
    await expect(page.locator('.screening-title-card h3')).toHaveText('CCK trailer')
    await expect(page.getByRole('radio', { name: 'CIRSMUN 2026', exact: true })).toBeDisabled()
    await expect(page.locator('iframe,video')).toHaveCount(0)
    expect(traffic.mp4).toEqual([])
  })
}

test('a deep link cannot unlock a source whose native approval is absent', async ({ page, traffic }) => {
  await page.route('**/src/content.ts*', async route => {
    const response = await route.fetch()
    await route.fulfill({ response, body: `${await response.text()}\n;creativeMedia.find(film=>film.id==='cirs-website-launch').nativePlaybackApproved=false;\n` })
  })
  await page.goto(`/studio#${launch.id}`)
  await settled(page)
  await expect(page.locator('.screening-title-card h3')).toHaveText('CCK trailer')
  await expect(page.getByRole('radio', { name: launch.title, exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: `Play selected film: ${launch.title}`, exact: true })).toHaveCount(0)
  expect(traffic.mp4).toEqual([])
})

test('the linked launch stays click-only, then its real native file plays and closes back to Watch', async ({ page, traffic }) => {
  await page.goto(`/studio#${launch.id}`)
  await settled(page)
  await linked(page)
  expect(traffic.mp4).toEqual([])
  await page.keyboard.press('Tab')
  const watch = page.getByRole('button', { name: `Play selected film: ${launch.title}`, exact: true })
  await expect(watch).toBeFocused()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: launch.title, exact: true })
  const video = dialog.locator('video.actual-video')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
  const state = await video.evaluate(node => {
    const video = node as HTMLVideoElement
    return { src: new URL(video.currentSrc).pathname, duration: video.duration, paused: video.paused, autoplay: video.autoplay, error: video.error?.code ?? null }
  })
  expect(state).toEqual({ src: launch.path, duration: 38, paused: true, autoplay: false, error: null })
  expect(traffic.mp4.every(path => path === launch.path)).toBe(true)
  await video.focus()
  await page.keyboard.press('Space')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(.2)
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect(watch).toBeFocused()
  await expect(page.locator('dialog video')).toHaveCount(0)
})

test('the existing generic Creative case handoff still opens the ordinary Studio programme', async ({ page, traffic }) => {
  await page.goto('/projects/creative')
  await settled(page)
  const studio = page.getByRole('link', { name: 'Browse Studio', exact: true })
  await studio.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/studio$/)
  await settled(page)
  await expect(page.locator('.screening-title-card h3')).toHaveText('CCK trailer')
  expect(traffic.mp4).toEqual([])
})

test('modified launch links open the linked film natively and preserve the CIRS case', async ({ page, context, traffic }) => {
  await page.goto('/projects/cirs')
  await settled(page)
  const handoff = page.locator('#case-cirs-launch a[href="/studio#cirs-website-launch"]')
  const [popup] = await Promise.all([context.waitForEvent('page'), handoff.click({ modifiers: ['Control'] })])
  await popup.waitForLoadState('domcontentloaded')
  await settled(popup)
  await expect(popup).toHaveURL(/\/studio#cirs-website-launch$/)
  await linked(popup)
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  expect(traffic.mp4).toEqual([])
  await popup.close()
})
