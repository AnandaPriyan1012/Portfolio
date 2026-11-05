import { test, expect, type Page, type BrowserContext } from '@playwright/test'

const seen = new WeakMap<Page, string[]>()
async function ready(page: Page, path = '/') {
  const errors: string[] = []; seen.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(path)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  if (process.env.AP_EXPECT_BUNDLE) expect(await page.locator('script[type="module"]').first().getAttribute('src')).toBe(`/assets/${process.env.AP_EXPECT_BUNDLE}`)
  if (process.env.AP_EXPECT_STYLE) await expect(page.locator(`link[href="/assets/${process.env.AP_EXPECT_STYLE}"]`)).toHaveCount(1)
  if (path === '/') {
    await page.locator('.opening-specimen img').evaluateAll(nodes => Promise.all(nodes.map(node => (node as HTMLImageElement).decode())))
    await page.locator('.cirs-browser-image').first().evaluate(node => (node as HTMLImageElement).decode())
    await settle(page)
  }
}
async function capable(context: BrowserContext) {
  await context.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 }); Object.defineProperty(navigator, 'deviceMemory', { value: 8 }) })
}
async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => {
    let previous = scrollY, quiet = 0
    const frame = () => { quiet = Math.abs(scrollY - previous) < .1 ? quiet + 1 : 0; previous = scrollY; if (quiet >= 10) resolve(); else requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
  }))
}
async function wheelY(page: Page, target: number) {
  await page.mouse.move(10, 450)
  for (let step = 0; step < 10; step++) {
    const remaining = target - await page.evaluate(() => scrollY)
    if (Math.abs(remaining) <= 1) break
    await page.mouse.wheel(0, remaining)
    await settle(page)
  }
  await expect.poll(async () => Math.abs(target - await page.evaluate(() => scrollY))).toBeLessThanOrEqual(1)
}
async function physicalLayout(page: Page, desktop: boolean) {
  const layout = await page.evaluate(() => {
    const selectors = ['.hero-story-copy h1','.opening-personal','.hero-factual-intro','.view-work-button','.opening-studio-link','.opening-specimen-community','.opening-specimen-accuflow','.home-cirs-proof','.opening-edition']
    const rect = (element: Element) => { const r = element.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right } }
    const boxes = Object.fromEntries(selectors.map(selector => [selector,rect(document.querySelector(selector)!)]))
    const text = [...document.querySelectorAll('.hero-story-copy h1,.opening-personal,.hero-factual-intro,.opening-actions > *')].flatMap(element => {
      const range = document.createRange(); range.selectNodeContents(element)
      return [...range.getClientRects()].filter(r => r.width && r.height).map(r => ({x:r.x,y:r.y,right:r.right,bottom:r.bottom}))
    })
    const artifacts = [...document.querySelectorAll('.opening-specimen-heading,.opening-specimen-capture,.opening-specimen figcaption')].map(rect)
    const overlaps = text.flatMap((a, i) => artifacts.filter(b => Math.min(a.right,b.right)-Math.max(a.x,b.x)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1).map(b => ({i,a,b})))
    const controls = [...document.querySelectorAll('.opening-actions > :is(a,button)')].map(element => {
      const r = element.getBoundingClientRect(), hit = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)
      return {text:element.textContent,width:r.width,height:r.height,reachable:!!hit && (hit===element || element.contains(hit))}
    })
    return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,boxes,overlaps,controls}
  })
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width)
  expect(layout.overlaps, 'The actual text and actions do not overlap project headings, captures or captions').toEqual([])
  for (const [selector, box] of Object.entries(layout.boxes)) {
    expect(box.x, `${selector} left`).toBeGreaterThanOrEqual(-1)
    expect(box.right, `${selector} right`).toBeLessThanOrEqual(layout.width + 1)
    if (desktop) expect(box.bottom, `${selector} stays inside the first viewport`).toBeLessThanOrEqual(layout.height + 1)
  }
  if (!desktop) expect(layout.boxes['.opening-edition'].bottom, 'The edition line precedes the actual specimen cards').toBeLessThanOrEqual(Math.min(layout.boxes['.opening-specimen-community'].y,layout.boxes['.opening-specimen-accuflow'].y))
  for (const control of layout.controls) { expect(control.width).toBeGreaterThanOrEqual(44); expect(control.height).toBeGreaterThanOrEqual(44); expect(control.reachable).toBe(true) }
  return layout
}
test.afterEach(async ({page}) => { expect(seen.get(page) || [], 'No uncaught page errors').toEqual([]) })

test('the real project plates unfold and reverse into the genuine CIRS proof on native wheel input', async ({ page, context }, testInfo) => {
  await capable(context); await page.emulateMedia({reducedMotion:'no-preference'}); await ready(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine','gsap-lenis')
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  const initial = await physicalLayout(page,true)
  const originalTransform = await page.locator('.opening-specimen-community').evaluate(node => getComputedStyle(node).transform)
  const url = page.url()
  const distance = await page.evaluate(async () => {
    const source = performance.getEntriesByType('resource').map(entry=>entry.name).find(name=>/(?:gsap_ScrollTrigger|motion-vendor)[^/]*\.js(?:\?|$)/.test(name))!
    const loaded = await import(/* @vite-ignore */ source)
    const coordinator = Object.values(loaded).find((value:any)=>typeof value?.getAll === 'function') as any
    const trigger = coordinator.getAll().find((item:any)=>item.vars.id==='atelier-cirs-opening')
    return { start: trigger.start, end: trigger.end }
  })
  await wheelY(page,distance.start+(distance.end-distance.start)*.28)
  expect(await page.locator('.opening-specimen-community').evaluate(node => getComputedStyle(node).transform)).not.toBe(originalTransform)
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','campus')
  await wheelY(page,distance.start+(distance.end-distance.start)*.82)
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','admissions')
  await expect(page.locator('.cirs-browser-body')).toHaveAttribute('href','https://cirschool.org/admissions.html')
  expect((await page.locator('.cirs-visual-frame').boundingBox())!.width).toBeGreaterThan(initial.boxes['.home-cirs-proof'].width+300)
  await expect.poll(()=>page.locator('.project-opening-stage').evaluate(node=>Number(getComputedStyle(node).opacity))).toBeLessThan(.01)
  await expect.poll(()=>page.locator('.cirs-scene-captions').evaluate(node=>Number(getComputedStyle(node).opacity))).toBeGreaterThan(.95)
  expect(page.url()).toBe(url)
  await wheelY(page,0)
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','campus')
  await expect.poll(()=>page.locator('.project-opening-stage').evaluate(node=>Number(getComputedStyle(node).opacity))).toBeGreaterThan(.99)
  await expect.poll(async()=>Math.abs((await page.locator('.cirs-visual-frame').boundingBox())!.width-initial.boxes['.home-cirs-proof'].width)).toBeLessThan(1)
  await testInfo.attach('opening-wheel-journey',{body:JSON.stringify({initial,distance,finalY:await page.evaluate(()=>scrollY)}),contentType:'application/json'})
})

test('short capable desktops keep actual text, native actions and both whole previews inside the first fold', async ({ browser,baseURL },testInfo) => {
  const evidence=[]
  for(const viewport of [{width:1440,height:844},{width:1100,height:760}]){
    const context=await browser.newContext({baseURL,viewport,reducedMotion:'no-preference'});await capable(context)
    const page=await context.newPage();await ready(page)
    await expect(page.locator('.pin-spacer')).toHaveCount(1)
    evidence.push(await physicalLayout(page,true))
    expect(seen.get(page)).toEqual([]);await context.close()
  }
  await testInfo.attach('short-desktop-reading-layout',{body:JSON.stringify(evidence),contentType:'application/json'})
})

for(const width of [390,320]) test(`${width}px visitors read identity, complete project specimens and a full CIRS mobile capture in normal flow`,async({browser,baseURL},testInfo)=>{
  const context=await browser.newContext({baseURL,viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:width===320?'reduce':'no-preference'});await capable(context)
  const page=await context.newPage();await ready(page)
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  const layout=await physicalLayout(page,false)
  const actions=layout.boxes['.view-work-button'], community=layout.boxes['.opening-specimen-community'], accu=layout.boxes['.opening-specimen-accuflow'], proof=layout.boxes['.home-cirs-proof']
  expect(actions.bottom).toBeLessThan(Math.min(community.y,accu.y))
  expect(Math.max(community.bottom,accu.bottom)).toBeLessThan(proof.y)
  for(const image of await page.locator('.opening-specimen img').all()){await expect(image).toHaveCSS('object-fit','contain');expect(await image.evaluate(node=>(node as HTMLImageElement).naturalWidth)).toBe(1440)}
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','admissions')
  expect(proof.height).toBeGreaterThan(750)
  expect(await page.locator('.cirs-browser-image').evaluate(node=>(node as HTMLImageElement).currentSrc)).toMatch(/atlas-cirs-admissions-mobile\.webp$/)
  await page.getByRole('button',{name:'View Work',exact:true}).tap()
  await expect(page).toHaveURL(/\/work$/);await page.locator('.state-opening').waitFor({state:'detached'})
  await page.goBack();await page.locator('.state-opening').waitFor({state:'detached'})
  await expect(page.getByRole('heading',{name:'Ananda Priyan',exact:true})).toBeVisible()
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  expect(seen.get(page)).toEqual([])
  await testInfo.attach('phone-opening-reading-layout',{body:JSON.stringify(layout),contentType:'application/json'});await context.close()
})

test('the native film link keeps its exact Home opener and scroll position through Studio and browser history',async({page,context},testInfo)=>{
  await capable(context);await page.emulateMedia({reducedMotion:'no-preference'});await ready(page)
  const opener=page.locator('.opening-studio-link')
  await page.getByRole('button',{name:'View Work',exact:true}).focus();await page.keyboard.press('Tab');await expect(opener).toBeFocused()
  const y=await page.evaluate(()=>scrollY)
  await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/studio$/);await page.locator('.state-opening').waitFor({state:'detached'})
  await expect(page.getByRole('heading',{level:1})).toHaveText(/The screening\s+room\./)
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await page.goBack();await page.locator('.state-opening').waitFor({state:'detached'})
  await expect(opener).toBeFocused();await expect.poll(async()=>Math.abs(await page.evaluate(()=>scrollY)-y)).toBeLessThan(4)
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'View Work',exact:true})).toBeFocused()
  await testInfo.attach('native-studio-opening-return',{body:JSON.stringify({beforeY:y,afterY:await page.evaluate(()=>scrollY)}),contentType:'application/json'})
})

test('responsive and preference changes clean up the one Home story without erasing the native film action',async({page,context},testInfo)=>{
  await capable(context);await page.emulateMedia({reducedMotion:'no-preference'});await ready(page)
  const opener=page.locator('.opening-studio-link')
  await page.getByRole('button',{name:'View Work',exact:true}).focus();await page.keyboard.press('Tab');await expect(opener).toBeFocused()
  await page.emulateMedia({reducedMotion:'reduce'})
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine','static');await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(opener).toBeFocused()
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await expect(opener).toBeFocused()
  await page.setViewportSize({width:1024,height:1000});await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(opener).toBeFocused()
  await expect(page.locator('.opening-specimen')).toHaveCount(2)
  await page.setViewportSize({width:1440,height:1000});await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await expect(opener).toBeFocused()
  await expect(opener).toHaveAttribute('href','/studio')
  const nav=page.getByRole('navigation',{name:'Main navigation'})
  await nav.getByRole('link',{name:'About',exact:true}).focus();await page.keyboard.press('Tab')
  const outside=nav.getByRole('link',{name:'Contact',exact:true});await expect(outside).toBeFocused()
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(outside).toBeFocused()
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await expect(outside).toBeFocused()
  await page.waitForTimeout(200);await expect(outside).toBeFocused()
  await testInfo.attach('opening-lifecycle',{body:JSON.stringify({pins:await page.locator('.pin-spacer').count(),active:await page.evaluate(()=>document.activeElement?.outerHTML)}),contentType:'application/json'})
})

test('an unavailable peripheral prototype capture leaves the real CIRS story and honest project context usable',async({page,context})=>{
  await capable(context);await page.emulateMedia({reducedMotion:'no-preference'})
  await page.route('**/accuflow-prototype-desktop.webp',route=>route.abort())
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message))
  await page.goto('/');await page.locator('.state-opening').waitFor({state:'detached'});await page.evaluate(()=>document.fonts.ready)
  await expect(page.locator('.opening-specimen-accuflow')).toContainText('The website capture could not load. Explore Work for the project context.')
  await expect(page.locator('.opening-specimen-accuflow')).toContainText('Website & interaction prototype')
  await expect(page.locator('.opening-specimen-community img')).toBeVisible()
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','campus')
  await page.getByRole('button',{name:'View Work',exact:true}).click();await expect(page).toHaveURL(/\/work$/)
  expect(errors).toEqual([])
})
