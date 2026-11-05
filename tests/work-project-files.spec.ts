import { test, expect, type Page } from '@playwright/test'

const files = [
  { id: 'cirs', title: 'CIRS', status: 'Official school website · Live', contribution: 'Page design and web development with the school’s team, including Admissions and phone layouts.' },
  { id: 'community', title: 'Vallalar', status: 'Voluntary since 2023 · Website review preview', contribution: 'Voluntary Social Media & Technology Head: digital storytelling, social media and website work.' },
  { id: 'accuflow', title: 'AccuFlow', status: 'Exploratory prototype', contribution: 'A six-page product website and conversational-interface prototype for pressure-point information.' },
] as const
const captures = ['/media/atlas-cirs-admissions-desktop.webp', '/media/vallalar-language-en-desktop.webp', '/media/vallalar-language-ta-desktop.webp', '/media/atlas-accuflow-guide-desktop.webp']

async function settled(page: Page) {
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
}
async function openFiles(page: Page) {
  await page.goto('/work')
  await settled(page)
  await page.locator('.work-project-files img').evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())))
}

for (const width of [320, 390, 1024, 1200, 1440]) test(`${width}px project files show complete real captures and readable contributions without hovering`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await openFiles(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Open the project files.' })).toBeVisible()
  const index = page.getByRole('navigation', { name: 'Explore selected projects', exact: true })
  await expect(index.locator('a')).toHaveCount(3)
  await expect(index.locator('button,[tabindex]')).toHaveCount(0)
  const sourceFacts = await index.locator('img').evaluateAll(images => images.map(node => {
    const image = node as HTMLImageElement
    const style = getComputedStyle(image), rect = image.getBoundingClientRect()
    return { src: new URL(image.currentSrc).pathname, loaded: image.complete && image.naturalWidth > 0, fit: style.objectFit,
      visibility: style.visibility, opacity: style.opacity, ratio: rect.width / rect.height, naturalRatio: image.naturalWidth / image.naturalHeight }
  }))
  expect(sourceFacts.map(source => source.src)).toEqual(captures)
  for (const source of sourceFacts) {
    expect(source.loaded).toBe(true)
    expect(source.fit).toBe('contain')
    expect(source.visibility).toBe('visible')
    expect(source.opacity).toBe('1')
    expect(Math.abs(source.ratio - source.naturalRatio)).toBeLessThan(.02)
  }
  for (const file of files) {
    const link = index.locator(`.work-index-${file.id}`)
    await expect(link).toHaveAttribute('href', `#${file.id}`)
    await expect(link.locator('h2')).toHaveText(file.title)
    await expect(link.locator('.work-file-status')).toHaveText(file.status)
    await expect(link.locator('dd')).toHaveText(file.contribution)
    const facts = await link.evaluate(node => {
      const box = node.getBoundingClientRect(), source = node.querySelector('figure')!.getBoundingClientRect()
      return [...node.querySelectorAll<HTMLElement>('.work-file-status,dd')].map(copy => {
        const rect = copy.getBoundingClientRect()
        return { font: parseFloat(getComputedStyle(copy).fontSize), clipped: copy.scrollHeight > copy.clientHeight + 1,
          inCard: rect.left >= box.left && rect.right <= box.right && rect.bottom <= box.bottom,
          overlapsCapture: rect.left < source.right && rect.right > source.left && rect.top < source.bottom && rect.bottom > source.top }
      })
    })
    for (const fact of facts) {
      expect(fact.font).toBeGreaterThanOrEqual(11)
      expect(fact.clipped).toBe(false)
      expect(fact.inCard).toBe(true)
      expect(fact.overlapsCapture).toBe(false)
    }
    const artifactFit = await link.locator('figure').evaluate(figure => {
      const box = figure.getBoundingClientRect(), caption = figure.querySelector('figcaption')!.getBoundingClientRect()
      return [...figure.querySelectorAll('.work-file-capture')].map(source => {
        const rect = source.getBoundingClientRect()
        return { contained: rect.left >= box.left && rect.right <= box.right && rect.top >= box.top && rect.bottom <= box.bottom,
          clearOfCaption: rect.bottom <= caption.top - 3 }
      })
    })
    for (const source of artifactFit) {
      expect(source.contained).toBe(true)
      expect(source.clearOfCaption).toBe(true)
    }
    if (width >= 1024) await expect(link).toBeInViewport({ ratio: .99 })
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  if (width === 1440 || width === 390) await testInfo.attach(`project-files-${width}`, { body: await page.screenshot(), contentType: 'image/png' })
  const target = index.locator('a[href="#community"]')
  await target.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work#community$/)
  await expect(page.locator('#community .feature-heading')).toBeInViewport()
  expect(errors).toEqual([])
})

for (const width of [390, 1440]) test(`${width}px native file anchor and case-study return keep the actual chapter opener`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await openFiles(page)
  await page.locator('.work-project-files a[href="#accuflow"]').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work#accuflow$/)
  const origin = page.locator('#accuflow').getByRole('link', { name: 'Project notes', exact: true })
  await origin.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await origin.focus()
  const departure = await page.evaluate(() => scrollY)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/accuflow$/)
  await settled(page)
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await expect(page).toHaveURL(/\/work#accuflow$/)
  await settled(page)
  await expect(origin).toBeFocused()
  await expect(origin).toBeInViewport()
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), departure)).toBeLessThan(4)
})

test('failed source keeps its file, status and native project link usable', async ({ page }) => {
  await page.route('**/media/atlas-cirs-admissions-desktop.webp', route => route.abort())
  await page.goto('/work')
  await settled(page)
  const link = page.locator('.work-project-files a[href="#cirs"]')
  await expect(link.locator('.work-file-unavailable')).toContainText('Capture unavailable')
  await expect(link.locator('.work-file-status')).toHaveText('Official school website · Live')
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work#cirs$/)
  await expect(page.locator('#cirs')).toBeInViewport()
})
