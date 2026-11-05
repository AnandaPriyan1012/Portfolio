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
    await page.locator('.hero-room img').evaluate(node => (node as HTMLImageElement).decode())
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
    const selectors = ['.hero-story-copy h1','.hero-factual-intro','.view-work-button','.opening-studio-link','.home-cirs-proof']
    const rect = (element: Element) => { const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right} }
    const boxes=Object.fromEntries(selectors.map(selector=>[selector,rect(document.querySelector(selector)!)]))
    const controls=[...document.querySelectorAll('.hero-story-copy > :is(a,button)')].map(element=>{const r=element.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {text:element.textContent,width:r.width,height:r.height,reachable:!!hit&&(hit===element||element.contains(hit))}})
    return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,boxes,controls,room:rect(document.querySelector('.hero-room')!),font:getComputedStyle(document.querySelector('h1')!).fontFamily}
  })
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width)
  expect(layout.font).toContain('AP Pixelify')
  for(const [selector,box]of Object.entries(layout.boxes)){
    expect(box.x,`${selector} left`).toBeGreaterThanOrEqual(-1)
    expect(box.right,`${selector} right`).toBeLessThanOrEqual(layout.width+1)
    if(desktop)expect(box.bottom,`${selector} stays inside the first viewport`).toBeLessThanOrEqual(layout.height+1)
  }
  for(const control of layout.controls){expect(control.width).toBeGreaterThanOrEqual(44);expect(control.height).toBeGreaterThanOrEqual(44);expect(control.reachable).toBe(true)}
  return layout
}
test.afterEach(async({page})=>{expect(seen.get(page)||[],'No uncaught page errors').toEqual([])})

test('the familiar glass room retains its readable retro title through an 850px wheel and reverses from the real school proof',async({page,context},testInfo)=>{
  await capable(context);await page.emulateMedia({reducedMotion:'no-preference'});await ready(page)
  await expect(page.locator('.retro-opening')).toHaveCount(1)
  await expect(page.locator('.opening-film-frame,.opening-specimen')).toHaveCount(0)
  await expect(page.locator('.hero-optical-pane')).toHaveCount(1)
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  const initial=await physicalLayout(page,true),url=page.url()
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','campus')
  await expect(page.locator('.hero-room')).toHaveAttribute('aria-hidden','true')
  const runway=await page.locator('.scroll-opening').evaluate(node=>node.parentElement!.getBoundingClientRect().height-node.getBoundingClientRect().height)
  expect(runway).toBeCloseTo(1600,0)
  await wheelY(page,850)
  const mid=await page.evaluate(()=>({hero:+getComputedStyle(document.querySelector('.hero-story-copy')!).opacity,room:+getComputedStyle(document.querySelector('.hero-room')!).opacity,progress:document.querySelector<HTMLElement>('.scroll-opening')!.dataset.progress}))
  expect(mid.hero,'The title still reads after the same 850px gesture that erased the previous opening').toBeGreaterThan(.25)
  expect(mid.hero).toBeLessThan(.5)
  expect(mid.room).toBeGreaterThan(.3)
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','campus')
  await wheelY(page,runway*.94)
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','admissions')
  await expect(page.locator('.cirs-browser-body')).toHaveAttribute('href','https://cirschool.org/admissions.html')
  expect((await page.locator('.cirs-visual-frame').boundingBox())!.width).toBeGreaterThan(initial.boxes['.home-cirs-proof'].width+300)
  await expect.poll(()=>page.locator('.hero-story-copy').evaluate(node=>+getComputedStyle(node).opacity)).toBeLessThan(.01)
  await expect.poll(()=>page.locator('.cirs-scene-captions').evaluate(node=>+getComputedStyle(node).opacity)).toBeGreaterThan(.95)
  expect(page.url()).toBe(url)
  await wheelY(page,0)
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','campus')
  await expect.poll(()=>page.locator('.hero-room').evaluate(node=>+getComputedStyle(node).opacity)).toBeGreaterThan(.99)
  await expect.poll(()=>page.locator('.hero-story-copy').evaluate(node=>+getComputedStyle(node).opacity)).toBeGreaterThan(.99)
  await testInfo.attach('retro-wheel-journey',{body:JSON.stringify({initial,runway,mid,finalY:await page.evaluate(()=>scrollY)}),contentType:'application/json'})
})

test('the earlier luxury geometry and native retro actions fit ordinary and minimum capable desktops',async({browser,baseURL},testInfo)=>{
  const evidence=[]
  for(const viewport of [{width:1440,height:844},{width:1100,height:760}]){
    const context=await browser.newContext({baseURL,viewport,reducedMotion:'no-preference'});await capable(context)
    const page=await context.newPage();await ready(page)
    await expect(page.locator('.pin-spacer')).toHaveCount(1)
    evidence.push(await physicalLayout(page,true))
    await expect(page.locator('.hero-room img')).toHaveAttribute('src','/media/atelier-room-wide.webp')
    await expect(page.getByRole('heading',{level:1,name:'Ananda Priyan',exact:true})).toBeInViewport()
    await expect(page.locator('.opening-studio-link')).toHaveAttribute('href','/studio')
    expect(seen.get(page)).toEqual([]);await context.close()
  }
  await testInfo.attach('retro-first-fold',{body:JSON.stringify(evidence),contentType:'application/json'})
})

for(const width of [390,320])test(`${width}px visitors retain the glass composition, native actions and a full school proof without pinning`,async({browser,baseURL},testInfo)=>{
  const context=await browser.newContext({baseURL,viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:width===320?'reduce':'no-preference'});await capable(context)
  const page=await context.newPage();await ready(page)
  await expect(page.locator('.pin-spacer,.hero-ambient-film')).toHaveCount(0)
  const layout=await physicalLayout(page,false)
  expect(await page.locator('.hero-room img').evaluate(node=>(node as HTMLImageElement).currentSrc)).toMatch(/atelier-room-portrait\.webp$/)
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','admissions')
  expect(layout.boxes['.home-cirs-proof'].height).toBeGreaterThan(750)
  expect(await page.locator('.cirs-browser-image').evaluate(node=>(node as HTMLImageElement).currentSrc)).toMatch(/atlas-cirs-admissions-mobile\.webp$/)
  await page.getByRole('button',{name:'View Work',exact:true}).tap();await expect(page).toHaveURL(/\/work$/)
  await page.locator('.state-opening').waitFor({state:'detached'});await page.goBack();await page.locator('.state-opening').waitFor({state:'detached'})
  await expect(page.getByRole('heading',{name:'Ananda Priyan',exact:true})).toBeVisible()
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  expect(seen.get(page)).toEqual([])
  await testInfo.attach('retro-phone-layout',{body:JSON.stringify(layout),contentType:'application/json'});await context.close()
})

test('the native Films link returns to its exact Home opener and scroll position',async({page,context},testInfo)=>{
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
  await testInfo.attach('native-retro-films-return',{body:JSON.stringify({beforeY:y,afterY:await page.evaluate(()=>scrollY)}),contentType:'application/json'})
})

test('responsive and quiet changes preserve native opening focus while respecting deliberate focus outside it',async({page,context})=>{
  await capable(context);await page.emulateMedia({reducedMotion:'no-preference'});await ready(page)
  const opener=page.locator('.opening-studio-link')
  await page.getByRole('button',{name:'View Work',exact:true}).focus();await page.keyboard.press('Tab');await expect(opener).toBeFocused()
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.pin-spacer')).toHaveCount(0);await expect(opener).toBeFocused()
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('.pin-spacer')).toHaveCount(1);await expect(opener).toBeFocused()
  await page.setViewportSize({width:1024,height:1000});await expect(page.locator('.pin-spacer')).toHaveCount(0);await expect(opener).toBeFocused()
  await page.setViewportSize({width:1440,height:1000});await expect(page.locator('.pin-spacer')).toHaveCount(1);await expect(opener).toBeFocused()
  const nav=page.getByRole('navigation',{name:'Main navigation'})
  await nav.getByRole('link',{name:'About',exact:true}).focus();await page.keyboard.press('Tab')
  const outside=nav.getByRole('link',{name:'Contact',exact:true});await expect(outside).toBeFocused()
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.pin-spacer')).toHaveCount(0);await expect(outside).toBeFocused()
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('.pin-spacer')).toHaveCount(1);await expect(outside).toBeFocused()
})

test('unavailable decorative room and film assets cannot block the actual school proof or native Work action',async({page,context})=>{
  await capable(context);await page.emulateMedia({reducedMotion:'no-preference'})
  await page.route(/\/media\/(?:atelier-room-[^/]+\.webp|amber-architecture-loop\.mp4)$/,route=>route.abort())
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message))
  await page.goto('/');await page.locator('.state-opening').waitFor({state:'detached'});await page.evaluate(()=>document.fonts.ready)
  await expect(page.locator('.hero-ambient-film')).toHaveCount(0)
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await expect(page.locator('.home-cirs-proof')).toHaveAttribute('data-effective-proof','campus')
  await page.locator('.cirs-browser-image').evaluate(node=>(node as HTMLImageElement).decode())
  expect(await page.locator('.cirs-browser-image').evaluate(node=>(node as HTMLImageElement).naturalWidth)).toBe(1440)
  await page.getByRole('button',{name:'View Work',exact:true}).click();await expect(page).toHaveURL(/\/work$/)
  expect(errors).toEqual([])
})

test('the route curtain fades within its existing lifetime and real input dismisses it immediately',async({page,context},testInfo)=>{
  await capable(context);await page.emulateMedia({reducedMotion:'no-preference'});await ready(page)
  await page.evaluate(()=>{const state={start:0,frames:[] as {ms:number;opacity:number|null;path:string}[],done:false};(window as any).__curtainQA=state;document.querySelector('.opening-studio-link')!.addEventListener('click',()=>{state.start=performance.now();const tick=()=>{const mask=document.querySelector('.state-opening');state.frames.push({ms:performance.now()-state.start,opacity:mask?+getComputedStyle(mask).opacity:null,path:location.pathname});if(!state.done)requestAnimationFrame(tick)};requestAnimationFrame(tick)},{once:true})})
  await page.locator('.opening-studio-link').click();await expect(page).toHaveURL(/\/studio$/)
  await page.locator('.state-opening').waitFor({state:'detached',timeout:2500})
  const frames=await page.evaluate(()=>{const s=(window as any).__curtainQA;s.done=true;return s.frames as {ms:number;opacity:number|null;path:string}[]})
  const routeFrames=frames.filter(f=>f.path==='/studio'),visible=routeFrames.filter(f=>f.opacity!==null)
  await testInfo.attach('curtain-frames-before-assertion',{body:JSON.stringify(frames),contentType:'application/json'})
  expect(visible.some(f=>f.opacity!>.05&&f.opacity!<.95),'The actual final curtain frames fade rather than jump from black').toBe(true)
  expect(visible.at(-1)!.ms).toBeLessThan(1900)
  const nav=page.getByRole('navigation',{name:'Main navigation'})
  await nav.getByRole('link',{name:'About',exact:true}).click();await expect(page.locator('.state-opening')).toBeVisible()
  const started=Date.now();await page.keyboard.press('Escape');await page.locator('.state-opening').waitFor({state:'detached'});const escapeMs=Date.now()-started;expect(escapeMs).toBeLessThan(350)
  await nav.getByRole('link',{name:'Work',exact:true}).click();await expect(page.locator('.state-opening')).toBeVisible()
  const wheelStarted=Date.now();await page.mouse.wheel(0,120);await page.locator('.state-opening').waitFor({state:'detached'});const wheelMs=Date.now()-wheelStarted;expect(wheelMs).toBeLessThan(350)
  await testInfo.attach('finite-gentle-curtain',{body:JSON.stringify({frames,escapeMs,wheelMs}),contentType:'application/json'})
})
