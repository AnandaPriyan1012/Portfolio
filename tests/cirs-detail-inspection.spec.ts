import { test, expect, type Page } from '@playwright/test'
const source = '/media/cirs-admissions.webp'
const targets = [
  { id: 'portal', label: 'Portal', work: 'Application portal', bounds: [118, 799, 230, 53] },
  { id: 'process', label: 'Process', work: 'Admissions process', bounds: [376, 813, 177, 27] },
  { id: 'enquiries', label: 'Enquiries', work: 'School enquiries', bounds: [117, 881, 961, 95] },
] as const
type Scope = 'work' | 'case'
const tour = (page: Page) => page.locator('.cirs-tour')
const modal = (page: Page) => page.getByRole('dialog', { name: 'CIRS Admissions Guide', exact: true })
const whole = (page: Page) => tour(page).getByRole('button', { name: 'View larger capture: CIRS Admissions Guide', exact: true })
const detail = (page: Page, label: string) => tour(page).getByRole('button', { name: `Inspect ${label} detail`, exact: true })
const variants = [
  { width: 1440, height: 1000, touch: false, motion: 'no-preference' as const },
  { width: 390, height: 844, touch: true, motion: 'no-preference' as const },
  { width: 320, height: 844, touch: true, motion: 'reduce' as const },
]
test.beforeEach(async ({ page, request }) => {
  if (process.env.AP_QA_EXPECTED_BUNDLE || process.env.AP_QA_EXPECTED_STYLE) {
    const html = await (await request.get('/work')).text()
    if (process.env.AP_QA_EXPECTED_BUNDLE) expect(html).toContain(process.env.AP_QA_EXPECTED_BUNDLE)
    if (process.env.AP_QA_EXPECTED_STYLE) expect(html).toContain(process.env.AP_QA_EXPECTED_STYLE)
  }
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  ;(page as Page & { detailErrors?: string[] }).detailErrors = errors
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
})
test.afterEach(async ({ page }) => {
  expect((page as Page & { detailErrors?: string[] }).detailErrors, 'No uncaught detail-inspection errors').toEqual([])
})
async function settle(page: Page) {
  let last = await page.evaluate(() => scrollY), stable = 0
  await expect.poll(async () => { const next = await page.evaluate(() => scrollY); stable = Math.abs(next - last) < .1 ? stable + 1 : 0; last = next; return stable }, { intervals: [100] }).toBeGreaterThanOrEqual(4)
}
async function ready(page: Page, scope: Scope, decode = true) {
  await page.goto(scope === 'work' ? '/work#cirs' : '/projects/cirs#case-cirs-admissions')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  if (process.env.AP_QA_EXPECTED_BUNDLE) await expect(page.locator('script[type="module"]')).toHaveAttribute('src', '/assets/' + process.env.AP_QA_EXPECTED_BUNDLE)
  await expect(tour(page)).toHaveAttribute('data-presentation', scope)
  await tour(page).scrollIntoViewIfNeeded(); await settle(page)
  if (decode) await tour(page).locator('img.cirs-tour-image').evaluate(node => (node as HTMLImageElement).decode())
}
async function activate(page: Page, control: ReturnType<Page['locator']>, touch = false) {
  await control.scrollIntoViewIfNeeded(); await settle(page)
  if (touch) await control.tap(); else { await control.focus(); await page.keyboard.press('Enter') }
}
async function select(page: Page, scope: Scope, target: typeof targets[number], touch = false, aligned = true) {
  const button = tour(page).getByRole('button', { name: scope === 'work' ? target.work : target.label, exact: true })
  await activate(page, button, touch)
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(tour(page)).toHaveAttribute('data-note', target.id)
  if (aligned) await expect.poll(() => tour(page).evaluate((root, bounds) => {
    const image = root.querySelector('.cirs-tour-image')!.getBoundingClientRect(), frame = root.querySelector('.cirs-tour-frame')!.getBoundingClientRect()
    return Math.max(Math.abs(frame.left-image.left-image.width*bounds[0]/1440), Math.abs(frame.top-image.top-image.height*bounds[1]/1000), Math.abs(frame.width-image.width*bounds[2]/1440), Math.abs(frame.height-image.height*bounds[3]/1000))
  }, target.bounds)).toBeLessThan(.75)
  return button
}
async function geometry(page: Page, bounds: readonly number[]) {
  return modal(page).locator('.capture-inspection-viewport').evaluate((node, bounds) => {
    const image = node.querySelector<HTMLImageElement>('.capture-inspection-image')!, r = node.getBoundingClientRect(), b = image.getBoundingClientRect()
    const expected = (start: number, length: number, visible: number, total: number) => Math.max(0, Math.min(Math.max(0,total-visible), length+48<=visible ? start+length/2-visible/2 : start-24))
    return { left: node.scrollLeft, top: node.scrollTop, expectedLeft: expected(bounds[0],bounds[2],node.clientWidth,1440), expectedTop: expected(bounds[1],bounds[3],node.clientHeight,1000), viewport: { left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height }, image: { width:b.width,height:b.height,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,src:image.getAttribute('src') }, target:{ left:b.left+bounds[0],top:b.top+bounds[1],right:b.left+bounds[0]+bounds[2],bottom:b.top+bounds[1]+bounds[3],width:bounds[2],height:bounds[3] } }
  }, bounds)
}
async function openDetail(page: Page, target: typeof targets[number], touch = false) {
  const opener = detail(page, target.label)
  await opener.evaluate(node => node.addEventListener('click', () => { document.documentElement.dataset.testDetailDeparture = String(scrollY) }, { capture: true, once: true }))
  await activate(page, opener, touch)
  const top = Number(await page.locator('html').getAttribute('data-test-detail-departure'))
  await expect(modal(page)).toHaveAttribute('data-inspection-mode', 'detail')
  await expect(modal(page)).toHaveAttribute('data-detail-state', 'aligned')
  await expect(modal(page).locator('.capture-inspection-viewport')).toHaveAttribute('data-zoom', 'actual')
  await expect(modal(page).locator('.capture-inspection-caption')).toContainText(`${target.label} detail`)
  await expect.poll(async () => { const g=await geometry(page,target.bounds);return Math.max(Math.abs(g.left-g.expectedLeft),Math.abs(g.top-g.expectedTop)) }).toBeLessThan(1.2)
  const g=await geometry(page,target.bounds)
  expect(g.image).toMatchObject({width:1440,height:1000,naturalWidth:1440,naturalHeight:1000,src:source})
  expect(g.target.top).toBeGreaterThanOrEqual(g.viewport.top-.5)
  expect(g.target.bottom).toBeLessThanOrEqual(g.viewport.bottom+.5)
  if(target.bounds[2]+48<=g.viewport.width){expect(g.target.left).toBeGreaterThanOrEqual(g.viewport.left-.5);expect(g.target.right).toBeLessThanOrEqual(g.viewport.right+.5)}
  else expect(g.target.left-g.viewport.left).toBeCloseTo(24,0)
  return {opener,top,g}
}
async function close(page: Page, opener: ReturnType<Page['locator']>, top: number, touch=false) {
  if(touch)await modal(page).getByRole('button',{name:'Close capture',exact:true}).tap();else await page.keyboard.press('Escape')
  const immediate = await page.evaluate(() => ({ mounted: document.querySelectorAll('.capture-inspection-dialog').length, open: document.querySelectorAll('.capture-inspection-dialog[open]').length, overflow: document.body.style.overflow }))
  await expect(page.locator('.capture-inspection-dialog')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('')
  await expect(opener).toBeFocused()
  expect(Math.abs(await page.evaluate(()=>scrollY)-top)).toBeLessThan(2)
  expect(await page.evaluate(()=>document.body.style.overflow)).toBe('')
  await page.waitForTimeout(100)
  await expect(opener).toBeFocused();expect(await page.evaluate(()=>document.body.style.overflow)).toBe('')
  expect(Math.abs(await page.evaluate(()=>scrollY)-top)).toBeLessThan(2)
  return { immediate, settled: await page.evaluate(() => ({ mounted: document.querySelectorAll('.capture-inspection-dialog').length, open: document.querySelectorAll('.capture-inspection-dialog[open]').length, overflow: document.body.style.overflow })) }
}
async function touchPan(page: Page, dx: number) {
  const viewport=modal(page).locator('.capture-inspection-viewport'),box=(await viewport.boundingBox())!,x=box.x+box.width*.8,y=box.y+box.height*.5
  const cdp=await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
  for(let step=1;step<=10;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-dx*step/10,y}]})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()
}

for(const scope of ['work','case'] as const)for(const mode of variants)test.describe(`${scope} ${mode.width}px source detail`,()=>{
  test.use({viewport:{width:mode.width,height:mode.height},isMobile:mode.touch,hasTouch:mode.touch,reducedMotion:mode.motion})
  test('each deliberate note inspects its original coordinates and both native openers retain their purpose',async({page},testInfo)=>{
    await ready(page,scope)
    await expect(detail(page,'Portal')).toHaveCount(0)
    await expect(whole(page)).toBeVisible()
    const observations=[]
    for(const target of targets){
      await select(page,scope,target,mode.touch)
      const {opener,top,g}=await openDetail(page,target,mode.touch)
      if(mode.touch&&target.id==='enquiries'){
        const region=modal(page).locator('.capture-inspection-viewport'),before=await region.evaluate(node=>node.scrollLeft)
        await touchPan(page,110);await expect.poll(()=>region.evaluate(node=>node.scrollLeft)).toBeGreaterThan(before+20)
      }
      const closure = await close(page,opener,top,mode.touch)
      observations.push({target:target.id,...g,closure})
      await expect(tour(page)).toHaveAttribute('data-note',target.id)
    }
    const ordinary=whole(page);await activate(page,ordinary,mode.touch)
    await expect(modal(page)).toHaveAttribute('data-inspection-mode','whole')
    await expect(modal(page).locator('.capture-inspection-viewport')).toHaveAttribute('data-zoom','fit')
    await expect(modal(page).locator('img')).toHaveAttribute('src',source)
    const top=await page.evaluate(()=>scrollY);await close(page,ordinary,top,mode.touch)
    await testInfo.attach('original-selected-coordinate-inspections',{body:JSON.stringify({scope,mode,observations},null,2),contentType:'application/json'})
  })
})

test('same-case native history closes a selected detail without a queued stale-opener focus jump',async({page},testInfo)=>{
  await page.goto('/projects/cirs');await page.locator('.state-opening').waitFor({state:'detached'});await page.evaluate(()=>document.fonts.ready)
  const chapter=page.getByRole('navigation',{name:'Case study chapters'}).getByRole('link',{name:'The Admissions page',exact:true})
  await chapter.focus();const departed=await page.evaluate(()=>scrollY);await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#case-cirs-admissions$/)
  await select(page,'case',targets[0]);await openDetail(page,targets[0])
  await page.goBack();await expect(page).toHaveURL(/\/projects\/cirs$/);await expect(page.locator('.capture-inspection-dialog')).toHaveCount(0)
  await expect(chapter).toBeFocused();await expect.poll(()=>page.evaluate(y=>Math.abs(scrollY-y),departed)).toBeLessThan(4)
  await page.waitForTimeout(500);await expect(chapter).toBeFocused();expect(Math.abs(await page.evaluate(()=>scrollY)-departed)).toBeLessThan(4)
  expect(await page.evaluate(()=>document.body.style.overflow)).toBe('')
  await testInfo.attach('selected-detail-same-case-history',{body:JSON.stringify({departed,returned:await page.evaluate(()=>scrollY)}),contentType:'application/json'})
})

test('real route Back removes a selected detail before the AP opening and restores the Work source',async({page},testInfo)=>{
  await page.goto('/work');await page.locator('.state-opening').waitFor({state:'detached'});await page.evaluate(()=>document.fonts.ready)
  const origin=page.locator('#cirs .story-links a[href="/projects/cirs"]');await origin.scrollIntoViewIfNeeded();await settle(page);await origin.focus()
  await origin.evaluate(node=>node.addEventListener('click',()=>{document.documentElement.dataset.testWorkDeparture=String(scrollY)},{once:true,capture:true}))
  await page.keyboard.press('Enter');const departed=Number(await page.locator('html').getAttribute('data-test-work-departure'));await page.locator('.state-opening').waitFor({state:'detached'})
  await select(page,'case',targets[0]);await openDetail(page,targets[0])
  await page.goBack();await page.locator('.state-opening').waitFor({state:'detached'});await expect(page).toHaveURL(/\/work$/)
  await expect(page.locator('.capture-inspection-dialog')).toHaveCount(0);await expect(origin).toBeFocused();await expect.poll(()=>page.evaluate(y=>Math.abs(scrollY-y),departed)).toBeLessThan(4)
  expect(await page.evaluate(()=>document.body.style.overflow)).toBe('')
  await testInfo.attach('selected-detail-route-cleanup',{body:JSON.stringify({departed,returned:await page.evaluate(()=>scrollY)}),contentType:'application/json'})
})

test('a trusted viewport key cancels a genuinely pending source alignment before decode completes',async({page},testInfo)=>{
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve});let held=0
  await page.route(url=>url.pathname===source,async route=>{held++;await gate;await route.fallback()})
  try{
    await ready(page,'case',false);await select(page,'case',targets[0],false,false)
    await activate(page,detail(page,'Portal'))
    await expect(modal(page)).toHaveAttribute('data-detail-state','pending')
    const region=modal(page).locator('.capture-inspection-viewport');await region.focus();await page.keyboard.press('ArrowRight')
    await expect(modal(page)).toHaveAttribute('data-detail-state','cancelled')
    const before=await region.evaluate(node=>({left:node.scrollLeft,top:node.scrollTop}));release()
    await modal(page).locator('img').evaluate(node=>(node as HTMLImageElement).decode())
    await page.waitForTimeout(350);await expect(modal(page)).toHaveAttribute('data-detail-state','cancelled')
    expect(await region.evaluate(node=>({left:node.scrollLeft,top:node.scrollTop}))).toEqual(before)
    expect(held).toBeGreaterThan(0)
    await testInfo.attach('real-pending-decode-cancellation',{body:JSON.stringify({held,before,after:await region.evaluate(node=>({left:node.scrollLeft,top:node.scrollTop}))}),contentType:'application/json'})
  }finally{release()}
})

test('manual pan and viewport resizing never snap an aligned detail back over the reader’s choice',async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});await ready(page,'case');await select(page,'case',targets[0]);await openDetail(page,targets[0])
  const region=modal(page).locator('.capture-inspection-viewport'),box=(await region.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(-4000,-4000)
  await expect.poll(()=>region.evaluate(node=>Math.max(node.scrollLeft,node.scrollTop))).toBeLessThan(1)
  const observations=[]
  for(const width of[320,768,390]){await page.setViewportSize({width,height:844});await page.waitForTimeout(150);const position=await region.evaluate(node=>({left:node.scrollLeft,top:node.scrollTop}));expect(position).toEqual({left:0,top:0});observations.push({width,...position})}
  await testInfo.attach('one-shot-alignment-after-native-pan',{body:JSON.stringify(observations),contentType:'application/json'})
})

test('a failed pending original releases its inspection and leaves the genuine Admissions source reachable',async({page})=>{
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve})
  await page.route(url=>url.pathname===source,async route=>{await gate;await route.abort('failed')})
  try{
    await ready(page,'case',false);await select(page,'case',targets[0],false,false);await activate(page,detail(page,'Portal'))
    await expect(modal(page)).toHaveAttribute('data-detail-state','pending');release()
    await expect(page.locator('.capture-inspection-dialog')).toHaveCount(0)
    await expect(tour(page).getByRole('status')).toContainText('The capture could not load.')
    expect(await page.evaluate(()=>document.body.style.overflow)).toBe('')
    await expect(page.getByRole('link',{name:'Visit the Admissions Guide',exact:true})).toHaveAttribute('href','https://cirschool.org/admissions.html')
  }finally{release()}
})

for(const mode of['motion-off','forced-colors']as const)test(`${mode} keeps deliberate source detail and whole-image inspection usable`,async({page})=>{
  if(mode==='motion-off')await page.addInitScript(()=>localStorage.setItem('ap-motion','off'))
  else await page.emulateMedia({forcedColors:'active'})
  await ready(page,'work');await select(page,'work',targets[1]);const opened=await openDetail(page,targets[1]);await close(page,opened.opener,opened.top)
  await activate(page,whole(page));await expect(modal(page).locator('.capture-inspection-viewport')).toHaveAttribute('data-zoom','fit')
})

test('new Work map choices keep native Tab and Space behavior without passive selection on scroll',async({page})=>{
  await ready(page,'work');const first=tour(page).getByRole('button',{name:targets[0].work,exact:true});await first.focus();await page.keyboard.press('Space');await expect(first).toHaveAttribute('aria-pressed','true')
  await page.keyboard.press('Tab');const second=tour(page).getByRole('button',{name:targets[1].work,exact:true});await expect(second).toBeFocused();await page.keyboard.press('Enter');await expect(second).toHaveAttribute('aria-pressed','true')
  await page.mouse.wheel(0,250);await settle(page);await expect(second).toBeFocused();await expect(tour(page)).toHaveAttribute('data-note','process')
  await page.keyboard.press('Enter');await expect(tour(page)).toHaveAttribute('data-note','overview');await expect(detail(page,'Process')).toHaveCount(0);await expect(whole(page)).toBeVisible()
})

test('Case reading cuts preserve the chosen note and its real detail source',async({page})=>{
  await ready(page,'case');await select(page,'case',targets[0])
  for(const name of['Quick cut','Director’s cut']){
    await activate(page,page.getByRole('button',{name,exact:true}));await expect(tour(page)).toHaveAttribute('data-note','portal')
    const opened=await openDetail(page,targets[0]);await close(page,opened.opener,opened.top)
  }
})


test('native fit and actual-size commands keep the entire source available without reapplying a selected detail',async({page})=>{
  await page.setViewportSize({width:390,height:844});await ready(page,'case');await select(page,'case',targets[0]);await openDetail(page,targets[0])
  const fit=modal(page).getByRole('button',{name:'Fit whole image',exact:true});await fit.focus();await page.keyboard.press('Space')
  const region=modal(page).locator('.capture-inspection-viewport');await expect(region).toHaveAttribute('data-zoom','fit')
  await expect(modal(page).locator('img')).toHaveAttribute('src',source);await expect(modal(page).locator('img')).toHaveCSS('object-fit','contain')
  const actual=modal(page).getByRole('button',{name:'Actual size (100%)',exact:true});await expect(actual).toBeFocused();await page.keyboard.press('Space')
  await expect(region).toHaveAttribute('data-zoom','actual');await page.waitForTimeout(250)
  expect(await region.evaluate(node=>({left:node.scrollLeft,top:node.scrollTop}))).toEqual({left:0,top:0})
})
