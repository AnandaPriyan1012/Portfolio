import { test as base, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use()
    expect(errors, 'No uncaught browser errors during page navigation').toEqual([])
  }, { auto: true }],
})

const pages = [
  { path: '/', page: 'home', heading: /Ananda\s*Priyan/, title: /Ananda Priyan/ },
  { path: '/work', page: 'work', heading: /Selected\s*work\./, title: /Selected work — Ananda Priyan/ },
  { path: '/studio', page: 'studio', heading: /The screening\s*room\./, title: /The screening room — Ananda Priyan/ },
  { path: '/about', page: 'about', heading: /There’s a person\s*behind every project\./, title: /About & contact — Ananda Priyan/ },
] as const

async function navigate(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Open menu', exact: true })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name, exact: true }).click()
}

for (const route of pages) test(`${route.path} opens directly and survives a reload as its own page`, async ({ page }) => {
  await page.goto(route.path)
  await expect(page.locator('main')).toHaveAttribute('data-page', route.page)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveText(route.heading)
  await expect(page).toHaveTitle(route.title)
  await page.reload()
  await expect(page.locator('main')).toHaveAttribute('data-page', route.page)
  await expect(page.locator('h1')).toHaveText(route.heading)
})

test('Home previews the portfolio and keeps complete project, Studio and About chapters on their own routes', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.scroll-opening')).toHaveCount(1)
  const directory = page.getByRole('navigation', { name: 'Explore the portfolio' })
  await expect(directory.getByRole('link')).toHaveCount(3)
  expect(await directory.getByRole('link').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual(['/work', '/studio', '/about'])
  await expect(page.locator('#cirs, #community, #accuflow, #airkart, #studio, #about, #contact, .work-page, .interface-atlas')).toHaveCount(0)
  await directory.getByRole('link', { name: /Explore Work:/ }).click()
  await expect(page).toHaveURL(/\/work$/)
  await expect(page.locator('.scroll-opening, .home-directory')).toHaveCount(0)
  await expect(page.locator('#cirs, #community, #accuflow')).toHaveCount(3)
  await expect(page.locator('#studio, #about, #contact')).toHaveCount(0)
  await expect(page.locator('#airkart')).not.toHaveAttribute('open', '')
})

for (const width of [320, 390]) test(`all four pages remain reachable through the ${width}px mobile menu`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 })
  await page.goto('/')
  for (const [name, path, pageName] of [['Work', '/work', 'work'], ['Studio', '/studio', 'studio'], ['About', '/about', 'about'], ['Contact', '/about#contact', 'about']]) {
    await navigate(page, name)
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.locator('main')).toHaveAttribute('data-page', pageName)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('#site-nav')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} fits ${width}px`).toBeLessThanOrEqual(width)
    await expect(page.locator('.pin-spacer')).toHaveCount(0)
  }
  const email = page.locator('#contact').getByRole('link', { name: 'anandapriyan1012@gmail.com', exact: true })
  await expect(email).toHaveAttribute('href', 'mailto:anandapriyan1012@gmail.com')
  const emailBox = (await email.boundingBox())!
  expect(emailBox.width).toBeGreaterThanOrEqual(44)
  expect(emailBox.height).toBeGreaterThanOrEqual(44)
  await page.getByRole('link', { name: 'Ananda Priyan, home', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('h1')).toHaveText(/Ananda\s*Priyan/)
})

test('cross-page browser back and forward restore the correct content without duplicate hero pins', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await navigate(page, 'Work')
  await expect(page.locator('main')).toHaveAttribute('data-page', 'work')
  await expect(page.locator('.pin-spacer, .scroll-opening')).toHaveCount(0)
  await navigate(page, 'Studio')
  await expect(page.locator('main')).toHaveAttribute('data-page', 'studio')
  await page.goBack()
  await expect(page.locator('main')).toHaveAttribute('data-page', 'work')
  await page.goBack()
  await expect(page.locator('main')).toHaveAttribute('data-page', 'home')
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await page.goForward()
  await expect(page.locator('main')).toHaveAttribute('data-page', 'work')
  await expect(page.locator('.pin-spacer, .scroll-opening')).toHaveCount(0)
  await expect(page.locator('#cirs')).toHaveCount(1)
})

test('case studies entered from Work return to Work and direct case links have the same useful default', async ({ page }) => {
  await page.goto('/work')
  const chapter = page.locator('#community')
  await chapter.getByRole('link', { name: 'Read the case study', exact: true }).click()
  await expect(page).toHaveURL(/\/projects\/community$/)
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await expect(page).toHaveURL(/\/work$/)
  await expect(page.locator('h1')).toHaveText(/Selected\s*work\./)
  await expect(chapter).toBeInViewport()
  await page.goto('/projects/accuflow')
  await page.reload()
  await expect(page.locator('h1')).toContainText('AccuFlow')
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await expect(page).toHaveURL(/\/work$/)
  await expect(page.locator('h1')).toHaveText(/Selected\s*work\./)
})

for (const [anchor, destination] of [['cirs', '/work'], ['community', '/work'], ['accuflow', '/work'], ['studio', '/studio'], ['about', '/about'], ['contact', '/about']]) {
  test(`legacy /#${anchor} reaches ${destination} and retains its destination`, async ({ page }) => {
    await page.goto(`/#${anchor}`)
    await expect(page).toHaveURL(new RegExp(`${destination}#${anchor}$`))
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator(`#${anchor}`)).toBeInViewport()
    await expect(page.locator('.scroll-opening')).toHaveCount(0)
    await page.reload()
    await expect(page).toHaveURL(new RegExp(`${destination}#${anchor}$`))
    await expect(page.locator(`#${anchor}`)).toBeInViewport()
  })
}

for (const project of ['cirs', 'accuflow']) test(`${project} interface views expose real source captures and complete keyboard navigation`, async ({ page }) => {
  await page.goto('/work')
  const atlas = page.locator(`.interface-atlas[data-project="${project}"]`)
  const tabs = atlas.getByRole('tab')
  await expect(tabs).toHaveCount(4)
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
  await tabs.first().focus()
  for (const key of ['ArrowRight', 'End', 'Home']) {
    await page.keyboard.press(key)
    const selected = atlas.getByRole('tab', { selected: true })
    await expect(selected).toBeFocused()
    await expect(atlas.getByRole('tabpanel')).toHaveCount(1)
    const capture = atlas.getByRole('tabpanel').locator('img')
    await capture.scrollIntoViewIfNeeded()
    await capture.evaluate(node => (node as HTMLImageElement).decode())
    expect(await capture.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(300)
    await expect(atlas.getByRole('link', { name: 'Open this source view' })).toHaveAttribute('href', project === 'cirs' ? /^https:\/\/cirschool\.org\// : /^https:\/\/accuflow-premium-ai\.netlify\.app\//)
  }
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
  await expect(atlas).toContainText('Public interface capture')
  if (project === 'accuflow') await expect(atlas).toContainText('Website prototype only')
})

test('production has physical entry points for all four pages and preserves the five case routes', async () => {
  for (const path of ['index.html', 'work/index.html', 'studio/index.html', 'about/index.html', ...['cirs', 'community', 'accuflow', 'creative', 'airkart'].map(id => `projects/${id}/index.html`)]) {
    const html = await readFile(`dist/${path}`, 'utf8')
    expect(html, path).toContain('<div id="root"></div>')
    expect(html, path).toMatch(/<script[^>]+type="module"[^>]+src="\/assets\//)
    expect(html, path).not.toContain('404 — Ananda Priyan')
  }
})

test('the Home source composes an opening and directory without mounting complete chapters', async () => {
  const source = await readFile('src/App.tsx', 'utf8')
  const home = source.match(/mainPage === "home" &&[\s\S]*?(?=\{mainPage === "work")/)?.[0]
  expect(home, 'Home has an explicit route branch').toBeTruthy()
  expect(home).toContain('<ScrollOpening')
  expect(home).toContain('<HomeDirectory')
  expect(home).not.toMatch(/<WorkPage|<ScreeningRoom|<About|id="contact"|id="airkart"/)
  const directory = await readFile('src/components/HomeDirectory.tsx', 'utf8')
  expect(directory).not.toMatch(/<WorkPage|<ScreeningRoom|<About|id="contact"|id="airkart"/)
})

test('Vallalar language tabs change the genuine capture and source by keyboard and fit phones', async ({ page }) => {
  await page.goto('/work')
  const study = page.locator('.community-language-study')
  await expect(study.getByRole('tab')).toHaveCount(2)
  await expect(study.getByRole('tabpanel')).toHaveCount(1)
  const english = study.getByRole('tab', { name: 'English', exact: true })
  await expect(english).toHaveAttribute('aria-selected', 'true')
  await expect(study.getByRole('link', { name: 'Open the English preview' })).toHaveAttribute('href', 'https://vallalar-sathya-dharmasalai.vercel.app/en/about/')
  await english.focus()
  await page.keyboard.press('ArrowRight')
  const tamil = study.getByRole('tab', { name: /Tamil/ })
  await expect(tamil).toBeFocused()
  await expect(tamil).toHaveAttribute('aria-selected', 'true')
  const capture = study.getByRole('tabpanel').locator('img')
  await expect(capture).toHaveAttribute('src', '/media/vallalar-language-ta-desktop.webp')
  await capture.scrollIntoViewIfNeeded()
  await capture.evaluate(node => (node as HTMLImageElement).decode())
  expect(await capture.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(300)
  await expect(study.getByRole('link', { name: 'Open the Tamil preview' })).toHaveAttribute('href', 'https://vallalar-sathya-dharmasalai.vercel.app/ta/about/')
  await expect(study).toContainText('Website review preview')
  await expect(study).toContainText('Social Media & Technology Head, since 2023')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => capture.evaluate(node => (node as HTMLImageElement).currentSrc)).toContain('vallalar-language-ta-mobile.webp')
  await capture.evaluate(node => (node as HTMLImageElement).decode())
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await tamil.focus()
  await page.keyboard.press('Home')
  await expect(english).toBeFocused()
  await expect(english).toHaveAttribute('aria-selected', 'true')
  await expect(study.getByRole('link', { name: 'Open the English preview' })).toHaveAttribute('href', 'https://vallalar-sathya-dharmasalai.vercel.app/en/about/')
})

test('Next project and next page links carry visitors through real cases, Studio and contact', async ({ page }) => {
  await page.goto('/projects/cirs')
  const next = page.locator('.case-next-story')
  await expect(next).toHaveAttribute('href', '/projects/community')
  await expect(next).toContainText('Next project')
  await next.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/community$/)
  await expect(page.locator('h1')).toContainText('Vallalar Sathya Dharmasalai')
  await expect(next).toHaveAttribute('href', '/projects/accuflow')
  await next.click()
  await expect(page).toHaveURL(/\/projects\/accuflow$/)
  await expect(page.locator('h1')).toContainText('AccuFlow')
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await expect(page).toHaveURL(/\/work$/)
  const studio = page.getByRole('link', { name: 'Next page: Studio', exact: true })
  await expect(studio).toHaveAttribute('href', '/studio')
  await studio.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/studio$/)
  await expect(page.locator('h1')).toHaveText(/The screening\s*room\./)
  const contact = page.locator('.screening-contact a')
  await expect(contact).toHaveAttribute('href', '/about#contact')
  await contact.click()
  await expect(page).toHaveURL(/\/about#contact$/)
  await expect(page.locator('#contact').getByRole('link', { name: 'anandapriyan1012@gmail.com', exact: true })).toBeInViewport()
})
