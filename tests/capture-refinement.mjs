import { chromium } from '@playwright/test'
import { copyFile, writeFile, mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
const measurements = {}
await mkdir('/tmp/refinement-video', { recursive: true })

async function wheelTo(page, selector, offset = 108) {
  await page.mouse.move(4, 600)
  const distance = () => page.locator(selector).evaluate((node, inset) => {
    const desired = Math.min(document.documentElement.scrollHeight - innerHeight, Math.max(0, node.getBoundingClientRect().top + scrollY - inset))
    return desired - scrollY
  }, offset)
  for (let i = 0; i < 40; i++) {
    const delta = await distance()
    if (Math.abs(delta) < 8) {
      await page.waitForTimeout(300)
      if (Math.abs(await distance()) < 8) return
      continue
    }
    await page.mouse.wheel(0, Math.sign(delta) * Math.min(Math.abs(delta), 800))
    await page.waitForTimeout(100)
  }
  if (Math.abs(await distance()) > 16) throw new Error(`Could not reach ${selector}`)
}

for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: 'dark', reducedMotion: 'no-preference',
    ...(name === 'mobile' ? { isMobile: true, hasTouch: true } : {}),
    recordVideo: { dir: '/tmp/refinement-video', size: { width, height } },
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:5173/')
  await page.evaluate(() => document.fonts.ready)
  for (const selector of ['.hero-room img', '.cirs-browser-image', 'header .ap-signature'])
    await page.locator(selector).evaluate(node => node.decode())
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.screenshot({ path: `docs/refinement-${name}-start.png` })
  const scenes = []
  const sample = async stage => {
    scenes.push(await page.evaluate(stageName => ({
      stage: stageName,
      y: scrollY,
      overflow: document.documentElement.scrollWidth - innerWidth,
      engine: document.querySelector('main').dataset.scrollEngine,
      active: document.querySelector('.main-nav [aria-current="location"]')?.textContent.trim(),
      headerHeight: document.querySelector('.site-header').getBoundingClientRect().height,
      material: document.querySelector('main').dataset.materialWorld,
    }), stage))
  }
  await sample('start')
  if (name === 'desktop') {
    await page.mouse.wheel(0, 330)
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'docs/refinement-desktop-handoff.png' })
    await page.mouse.wheel(0, 650)
    await page.waitForTimeout(900)
    await page.screenshot({ path: 'docs/refinement-desktop-middle.png' })
    await sample('expanded-cirs')
    await page.mouse.wheel(0, -1100)
    await page.waitForTimeout(1100)
  }
  for (const section of ['cirs', 'community', 'accuflow', 'studio', 'about', 'contact']) {
    await wheelTo(page, `#${section}`, name === 'mobile' ? 84 : 96)
    if (section === 'community' || section === 'accuflow')
      await page.locator(`#${section} .real-project-media`).evaluate(node => node.decode())
    await page.waitForTimeout(220)
    await sample(section)
    await page.screenshot({ path: `docs/refinement-${name}-${section === 'contact' ? 'end' : section}.png` })
  }
  if (errors.length) throw new Error(errors.join('\n'))
  if (scenes.some(scene => scene.overflow > 0)) throw new Error(`${name} overflow`)
  measurements[name] = { scenes, errors }
  const video = page.video()
  await context.close()
  await copyFile(await video.path(), `docs/refinement-${name}-scroll.webm`)
}
await browser.close()
await writeFile('docs/refinement-measurements.json', JSON.stringify(measurements, null, 2) + '\n')
console.log(JSON.stringify(measurements, null, 2))
