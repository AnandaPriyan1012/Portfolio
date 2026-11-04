import { test, expect, type Page, type Locator } from '@playwright/test'

async function ready(page: Page, path: string) {
  await page.goto(path)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
}

async function fitInside(image: Locator) {
  await image.evaluate(node => (node as HTMLImageElement).decode())
  const geometry = await image.evaluate(node => {
    const img = node as HTMLImageElement, frame = img.parentElement!
    const a = img.getBoundingClientRect(), b = frame.getBoundingClientRect()
    return { fit: getComputedStyle(img).objectFit, edges: [a.left-b.left,a.top-b.top,b.right-a.right,b.bottom-a.bottom] }
  })
  expect(geometry.fit).toBe('contain')
  for (const edge of geometry.edges) expect(edge).toBeGreaterThanOrEqual(-.5)
}

async function openWorkEvidence(page: Page, project: string) {
  const drawer = page.locator(`.work-evidence-drawer[data-project="${project}"]`)
  if (await drawer.count() && await drawer.getAttribute('open') === null)
    await drawer.locator(':scope > summary').tap()
}

test('an AP opening leaves unopened capture controls out of the page focus sequence', async ({ page }) => {
  await ready(page,'/projects/cirs')
  await expect(page.locator('.capture-inspection-dialog')).toHaveCount(0)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link',{name:'Skip to case study',exact:true})).toBeFocused()
  const back = page.getByRole('button',{name:'Back to portfolio',exact:true})
  await back.focus()
  const top = await page.evaluate(() => scrollY)
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('ap:openingchange',{detail:{active:true}})))
  await expect(back).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link',{name:'Back to case-study beginning',exact:true})).toBeFocused()
  expect(await page.evaluate(y => Math.abs(scrollY-y),top)).toBeLessThan(2)
})

test('keyboard inspection keeps the entire original, scrolls at actual size and returns to its native opener', async ({ page }) => {
  await ready(page, '/projects/cirs')
  const opener = page.getByRole('button', { name: 'View larger capture: CIRS Admissions Guide', exact: true })
  await expect(page.locator('.capture-inspection-dialog')).toHaveCount(0)
  await opener.focus()
  const before = await page.evaluate(() => scrollY)
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'CIRS Admissions Guide', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Close capture', exact: true })).toBeFocused()
  const image = dialog.locator('img')
  await expect(image).toHaveAttribute('src', '/media/cirs-admissions.webp')
  await fitInside(image)
  expect(await image.evaluate(node => [(node as HTMLImageElement).naturalWidth,(node as HTMLImageElement).naturalHeight])).toEqual([1440,1000])
  for (const target of await dialog.locator('button,a').all()) {
    const box = (await target.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  const zoom = dialog.getByRole('button', { name: 'Actual size (100%)', exact: true })
  await zoom.focus()
  await page.keyboard.press('Space')
  await expect(dialog.locator('.capture-inspection-viewport')).toHaveAttribute('data-zoom', 'actual')
  expect(await image.evaluate(node => [node.getBoundingClientRect().width,node.getBoundingClientRect().height])).toEqual([1440,1000])
  const region = dialog.getByRole('region', { name: 'Capture inspection area', exact: true })
  await region.focus()
  await page.keyboard.press('PageDown')
  await expect.poll(() => region.evaluate(node => node.scrollTop)).toBeGreaterThan(20)
  expect(await page.evaluate(top => Math.abs(scrollY - top), before)).toBeLessThan(2)
  await dialog.getByRole('button', { name: 'Fit whole image', exact: true }).click()
  await fitInside(image)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
  expect(await page.evaluate(top => Math.abs(scrollY - top), before)).toBeLessThan(2)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})

for (const width of [320, 390]) {
  test(`touch inspection at ${width}px retains the original CIRS coordinates and allows a real pan`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: {width,height:844}, hasTouch: true, isMobile: true, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL })
    const page = await context.newPage()
    try {
      await ready(page, '/projects/cirs')
      const opener = page.getByRole('button', { name: 'View larger capture: CIRS Admissions Guide', exact: true })
      await opener.tap()
      const underlyingY = await page.evaluate(() => scrollY)
      const dialog = page.getByRole('dialog', { name: 'CIRS Admissions Guide', exact: true })
      const image = dialog.locator('img')
      await fitInside(image)
      await expect(image).toHaveAttribute('src','/media/cirs-admissions.webp')
      await dialog.getByRole('button', { name: 'Actual size (100%)', exact: true }).tap()
      const region = dialog.getByRole('region', { name: 'Capture inspection area', exact: true })
      const box = (await region.boundingBox())!, x = box.x + box.width * .72, y = box.y + box.height * .72
      const cdp = await context.newCDPSession(page)
      async function pan(dx: number, dy: number) {
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
        for (let step = 1; step <= 7; step++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-dx*step/7,y:y-dy*step/7}]})
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
      }
      await pan(140,0)
      await expect.poll(() => region.evaluate(node => node.scrollLeft)).toBeGreaterThan(20)
      await pan(0,140)
      await expect.poll(() => region.evaluate(node => node.scrollTop)).toBeGreaterThan(20)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await dialog.getByRole('button', { name: 'Close capture', exact: true }).tap()
      await expect(dialog).toHaveCount(0)
      await expect(opener).toBeFocused()
      await expect(page).toHaveURL(/\/projects\/cirs$/)
      await expect(page.getByRole('button', {name:'Director’s cut',exact:true})).toHaveAttribute('aria-pressed','true')
      await expect(page.locator('.cirs-tour')).toHaveAttribute('data-note','overview')
      expect(await page.evaluate(top => Math.abs(scrollY-top), underlyingY)).toBeLessThan(2)
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
    } finally { await context.close() }
  })
}

test('current Atlas and bilingual choices open their matching genuine mobile capture without preloading movies or Google', async ({ browser }) => {
  const context = await browser.newContext({ viewport: {width:390,height:844}, hasTouch:true,isMobile:true,reducedMotion:'reduce',baseURL:test.info().project.use.baseURL })
  const page = await context.newPage(), premature: string[] = []
  page.on('request', request => { const u = new URL(request.url()); if (u.pathname.endsWith('.mp4') || /google|gstatic|googleusercontent/.test(u.hostname)) premature.push(u.href) })
  try {
    await ready(page,'/work')
    await openWorkEvidence(page,'accuflow')
    const atlas = page.locator('.interface-atlas[data-project="accuflow"]')
    await atlas.getByRole('tab',{name:/The product/}).tap()
    const product = atlas.getByRole('button',{name:'View larger capture: AccuFlow · The product',exact:true})
    await product.tap()
    let dialog = page.getByRole('dialog',{name:'AccuFlow · The product',exact:true})
    await expect(dialog.locator('img')).toHaveAttribute('src','/media/atlas-accuflow-product-mobile.webp')
    await fitInside(dialog.locator('img'))
    await page.setViewportSize({width:1440,height:1000})
    await expect(dialog.locator('img')).toHaveAttribute('src','/media/atlas-accuflow-product-mobile.webp')
    await dialog.getByRole('button',{name:'Close capture',exact:true}).click()
    await page.setViewportSize({width:390,height:844})
    await openWorkEvidence(page,'community')
    const bilingual = page.locator('.community-language-study')
    await bilingual.getByRole('tab',{name:/Tamil/}).tap()
    await bilingual.getByRole('button',{name:'View larger capture: Vallalar · Tamil About page',exact:true}).tap()
    dialog = page.getByRole('dialog',{name:'Vallalar · Tamil About page',exact:true})
    await expect(dialog.locator('img')).toHaveAttribute('src','/media/vallalar-language-ta-mobile.webp')
    await fitInside(dialog.locator('img'))
    await expect(dialog.getByRole('link',{name:'Open original image',exact:true})).toHaveAttribute('href','/media/vallalar-language-ta-mobile.webp')
    await page.keyboard.press('Escape')
    expect(premature).toEqual([])
  } finally { await context.close() }
})

test('dragging away from Close or cancelling a touch cannot activate it', async ({ browser }) => {
  const context = await browser.newContext({ viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',baseURL:test.info().project.use.baseURL })
  const page = await context.newPage()
  try {
    await ready(page,'/projects/cirs')
    await page.getByRole('button',{name:'View larger capture: CIRS Admissions Guide',exact:true}).tap()
    const dialog = page.getByRole('dialog',{name:'CIRS Admissions Guide',exact:true})
    const close = dialog.getByRole('button',{name:'Close capture',exact:true})
    const box = (await close.boundingBox())!, x=box.x+box.width/2,y=box.y+box.height/2
    const cdp = await context.newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-50,y:y+70}]})
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]})
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
    await expect(dialog).toBeVisible()
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})
    await expect(dialog).toBeVisible()
    await close.tap()
    await expect(dialog).toHaveCount(0)
  } finally { await context.close() }
})

test('browser Back removes the native capture top layer before the black AP opening and cannot resurrect it', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'})
  await page.addInitScript(() => {
    Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8})
    Object.defineProperty(navigator,'deviceMemory',{get:()=>8})
    ;(window as Window & { __captureOpening?: boolean[] }).__captureOpening = []
    window.addEventListener('ap:openingchange',event => {
      if (!(event as CustomEvent<{active:boolean}>).detail?.active) return
      requestAnimationFrame(() => {
        ;(window as Window & { __captureOpening?: boolean[] }).__captureOpening?.push(!document.querySelector('.capture-inspection-dialog[open]'))
      })
    })
  })
  await ready(page,'/work')
  await page.locator('a[href="/projects/cirs"]').first().click()
  await page.locator('.state-opening').waitFor({state:'detached'})
  await page.getByRole('button',{name:'View larger capture: CIRS Admissions Guide',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'CIRS Admissions Guide',exact:true})).toBeVisible()
  await page.goBack()
  await expect(page.locator('.state-opening')).toBeVisible()
  await expect(page.locator('.capture-inspection-dialog[open]')).toHaveCount(0)
  await page.locator('.state-opening').waitFor({state:'detached'})
  await expect(page).toHaveURL(/\/work$/)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  await page.goForward()
  await page.locator('.state-opening').waitFor({state:'detached'})
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await expect(page.locator('.capture-inspection-dialog')).toHaveCount(0)
  const states = await page.evaluate(() => (window as Window & {__captureOpening?:boolean[]}).__captureOpening)
  expect(states?.length).toBeGreaterThan(1)
  expect(states?.every(Boolean)).toBe(true)
})
