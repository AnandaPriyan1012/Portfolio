import {test,expect,type Page,type BrowserContext} from '@playwright/test'

const errors=new WeakMap<Page,string[]>()
declare global{interface Window{__deskDeparture?:{top:number;trusted:boolean};__deskModified?:{trusted:boolean;preventedBeforeHarness:boolean;href:string|null}}}
const destinations=['/projects/cirs','/projects/community','/projects/accuflow','/studio','/about#contact']
const projectObjects=[['.desk-cirs','/projects/cirs'],['.desk-vallalar','/projects/community'],['.desk-accuflow','/projects/accuflow']] as const
function monitor(page:Page){if(errors.has(page))return;const found:string[]=[];errors.set(page,found);page.on('pageerror',e=>found.push(e.message))}
test.use({reducedMotion:'no-preference'})
test.beforeEach(async({page})=>monitor(page));test.afterEach(async({page})=>expect(errors.get(page)||[]).toEqual([]))
async function capable(context:BrowserContext){await context.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8})})}
async function entry(page:Page){if(process.env.AP_EXPECT_BUNDLE)await expect(page.locator('script[type="module"]').first()).toHaveAttribute('src',`/assets/${process.env.AP_EXPECT_BUNDLE}`)}
async function ready(page:Page){monitor(page);await page.goto('/');await page.evaluate(()=>document.fonts.ready);await entry(page);await page.locator('.desk-cirs img').evaluate(node=>(node as HTMLImageElement).decode())}
async function imageSource(page:Page,selector:string,path:string,natural:number[]){
  const image=page.locator(selector);await image.scrollIntoViewIfNeeded();await image.evaluate(node=>(node as HTMLImageElement).decode())
  const result=await image.evaluate(node=>{const img=node as HTMLImageElement;return{path:new URL(img.currentSrc).pathname,natural:[img.naturalWidth,img.naturalHeight],size:[img.clientWidth,img.clientHeight],clip:getComputedStyle(img).clipPath,alt:img.alt}})
  expect(result.path).toBe(path);expect(result.natural).toEqual(natural);expect(Math.abs(result.size[1]/result.size[0]-natural[1]/natural[0])).toBeLessThan(.006);expect(result.clip).toBe('none');return result
}
async function geometry(page:Page){
  const layout=await page.locator('.desk-surface').evaluate(node=>{const rect=(e:Element)=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y+scrollY,right:r.right,bottom:r.bottom+scrollY,width:r.width,height:r.height}};return{viewport:innerWidth,overflow:document.documentElement.scrollWidth,objects:[...node.querySelectorAll<HTMLAnchorElement>('.desk-object')].map(e=>({href:e.getAttribute('href'),...rect(e)})),labels:[...node.querySelectorAll('.desk-object-caption')].map(rect),nestedScroll:[...node.querySelectorAll<HTMLElement>('.desk-artifact')].map(e=>({overflowY:getComputedStyle(e).overflowY,overflowX:getComputedStyle(e).overflowX,extraWidth:e.scrollWidth-e.clientWidth}))}})
  expect(layout.overflow).toBeLessThanOrEqual(layout.viewport)
  for(const object of layout.objects){expect(object.x).toBeGreaterThanOrEqual(-1);expect(object.right).toBeLessThanOrEqual(layout.viewport+1);expect(object.width).toBeGreaterThanOrEqual(44);expect(object.height).toBeGreaterThanOrEqual(44)}
  for(const collection of[layout.objects,layout.labels])for(let a=0;a<collection.length;a++)for(let b=a+1;b<collection.length;b++){const x=Math.min(collection[a].right,collection[b].right)-Math.max(collection[a].x,collection[b].x),y=Math.min(collection[a].bottom,collection[b].bottom)-Math.max(collection[a].y,collection[b].y);expect(x>1&&y>1,'Native destination boxes and labels do not intersect').toBe(false)}
  for(const item of layout.nestedScroll){expect(['auto','scroll']).not.toContain(item.overflowY);expect(['auto','scroll']).not.toContain(item.overflowX)}
  return layout
}

test('the illustrated desk uses only genuine work, one identity and two licensed self-hosted fonts',async({page,context},testInfo)=>{
  await capable(context);const generated:string[]=[];page.on('request',r=>{if(/\.mp4(?:[?#]|$)|atelier-room|amber-architecture|glass-corridor|screening-room-loop|ap-pixelify/.test(r.url()))generated.push(r.url())});await ready(page)
  await expect(page.getByRole('heading',{level:1,name:/Web work for my school\.\s*Stories for the screen\./})).toBeInViewport()
  await expect(page.locator('.site-header[data-desk] .navigation-caption')).toHaveText('Ananda Priyan');await expect(page.locator('.site-header nav,.site-header .menu-button,.site-footer nav,.site-footer .wordmark')).toHaveCount(0)
  await expect(page.locator('.desk-opening')).not.toContainText('Ananda Priyan');await expect(page.locator('.desk-surface > a')).toHaveCount(5)
  expect(await page.locator('.desk-object').evaluateAll(nodes=>nodes.map(e=>e.getAttribute('href')))).toEqual(destinations)
  await expect(page.locator('.desk-opening canvas,.desk-opening video,.desk-opening iframe,.desk-opening button,.hero-room,.hero-ambient-film,.pin-spacer,.state-opening')).toHaveCount(0)
  const sources=[];sources.push(await imageSource(page,'.desk-cirs img','/media/atlas-cirs-home-desktop.webp',[1440,1000]));sources.push(await imageSource(page,'.desk-vallalar img','/media/vallalar-language-en-desktop.webp',[1440,500]));sources.push(await imageSource(page,'.desk-accuflow img','/media/atlas-accuflow-guide-desktop.webp',[1440,1000]))
  expect(await page.locator('.desk-films img').evaluateAll(nodes=>nodes.map(e=>e.getAttribute('src')))).toEqual(['/media/film-thumbnails/vantara-masquerade-poster-320.webp','/media/film-thumbnails/teded-auditions-poster-320.webp','/media/film-thumbnails/cirs-website-launch-poster-320.webp'])
  await expect(page.locator('.desk-contact img')).toHaveAttribute('src','/media/ap-signature.png');await expect(page.locator('.desk-vallalar')).toContainText('Website review preview');await expect(page.locator('.desk-accuflow')).toContainText('Website prototype')
  const fonts=await page.evaluate(()=>({heading:getComputedStyle(document.querySelector('#desk-title')!).fontFamily,body:getComputedStyle(document.querySelector('.desk-object-caption p')!).fontFamily,loaded:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family)}))
  expect(fonts.heading).toContain('Fraunces Variable');expect(fonts.body).toContain('Instrument Sans Variable');expect([...new Set(fonts.loaded)].sort()).toEqual(['Fraunces Variable','Instrument Sans Variable']);expect(generated).toEqual([])
  await testInfo.attach('genuine-desk-sources',{body:JSON.stringify({sources,fonts,generated}),contentType:'application/json'})
})

test('desktop labels and native object links remain separate, reachable and keyboard-visible',async({page},testInfo)=>{
  await ready(page);const layout=await geometry(page);await page.locator('.desk-work-link').focus()
  for(const object of await page.locator('.desk-object').all()){
    await page.keyboard.press('Tab');await expect(object).toBeFocused();expect(await object.evaluate(node=>parseFloat(getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(2)
    const point=await object.evaluate(node=>{const r=node.getBoundingClientRect();return{x:r.left+r.width/2,y:Math.max(90,Math.min(innerHeight-25,r.top+r.height/2))}})
    expect(await object.evaluate((node,p)=>{const hit=document.elementFromPoint(p.x,p.y);return!!hit&&(hit===node||node.contains(hit))},point),'The visible native object can receive a real pointer').toBe(true)
  }
  await expect(page.locator('.desk-work-link')).toHaveAttribute('href','/work');await testInfo.attach('desk-native-geometry',{body:JSON.stringify(layout),contentType:'application/json'})
})

for(const width of[390,320,768])test(`${width}px desk keeps full genuine landscape captures, clear labels and five normal-flow destinations`,async({browser,baseURL},testInfo)=>{
  const context=await browser.newContext({baseURL,viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:width===320?'reduce':'no-preference'});const page=await context.newPage();await ready(page)
  await expect(page.locator('.site-header[data-desk] .navigation-caption')).toHaveCount(1);await expect(page.locator('.site-header[data-desk] .navigation-caption')).toBeVisible();await expect(page.locator('.site-header[data-desk] .navigation-caption')).toHaveText('Ananda Priyan')
  const source=await imageSource(page,'.desk-cirs img','/media/atlas-cirs-home-desktop.webp',[1440,1000]);const guide=await imageSource(page,'.desk-accuflow img','/media/atlas-accuflow-guide-desktop.webp',[1440,1000]);const layout=await geometry(page)
  for(const object of await page.locator('.desk-object').all()){
    const placement=await object.evaluate(node=>{const a=node.querySelector('.desk-artifact')!.getBoundingClientRect(),caption=node.querySelector('.desk-object-caption')!.getBoundingClientRect();return{artifactTop:a.top,captionBottom:caption.bottom,contact:node.classList.contains('desk-contact')}})
    if(!placement.contact)expect(placement.captionBottom).toBeLessThanOrEqual(placement.artifactTop+1)
  }
  await expect(page.locator('.state-opening,.pin-spacer,.hero-ambient-film,.site-header .menu-button')).toHaveCount(0)
  await expect(page.locator('.desk-object')).toHaveCount(5);await expect(page.locator('.desk-cirs')).toHaveAttribute('href','/projects/cirs')
  expect(errors.get(page)).toEqual([]);await testInfo.attach('phone-desk-flow',{body:JSON.stringify({source,guide,layout}),contentType:'application/json'});await context.close()
})

test('all three case objects return to their exact native desk origin and reading position',async({page},testInfo)=>{
  const results=[]
  for(const[selector,path]of projectObjects){
    await ready(page);const object=page.locator(selector);await object.scrollIntoViewIfNeeded();await object.focus();await object.evaluate(node=>node.addEventListener('click',event=>window.__deskDeparture={top:scrollY,trusted:event.isTrusted},{once:true,capture:true}))
    await page.keyboard.press('Enter');const departure=await page.evaluate(()=>window.__deskDeparture!);expect(departure.trusted).toBe(true);await expect(page).toHaveURL(new RegExp(`${path}$`))
    await page.getByRole('button',{name:'Back to portfolio',exact:true}).click();await expect(page).toHaveURL(/\/$/);await expect(object).toBeFocused();await expect.poll(async()=>Math.abs(await page.evaluate(()=>scrollY)-departure.top)).toBeLessThan(4)
    results.push({selector,departure,returned:await page.evaluate(()=>scrollY)})
  }
  await testInfo.attach('three-native-desk-origins',{body:JSON.stringify(results),contentType:'application/json'})
})

test('film and contact objects keep their real destinations, native modifier contract and Home history',async({page},testInfo)=>{
  await ready(page);const film=page.locator('.desk-films');await film.scrollIntoViewIfNeeded()
  // Observe component handling, then cancel only the browser popup default.
  // This does not claim verification of an external/native popup transport.
  await page.evaluate(()=>{const listen=(event:MouseEvent)=>{const a=(event.target as Element).closest('.desk-films');if(!event.ctrlKey||!a)return;window.__deskModified={trusted:event.isTrusted,preventedBeforeHarness:event.defaultPrevented,href:a.getAttribute('href')};event.preventDefault();document.removeEventListener('click',listen)};document.addEventListener('click',listen)})
  await film.click({modifiers:['Control']});const modified=await page.evaluate(()=>window.__deskModified!);expect(modified).toEqual({trusted:true,preventedBeforeHarness:false,href:'/studio'});await expect(page).toHaveURL(/\/$/)
  const returns=[]
  for(const[selector,path]of[['.desk-films','/studio'],['.desk-contact','/about#contact']]as const){
    const link=page.locator(selector);await link.scrollIntoViewIfNeeded();await link.focus();await link.evaluate(node=>node.addEventListener('click',event=>window.__deskDeparture={top:scrollY,trusted:event.isTrusted},{once:true,capture:true}));await page.keyboard.press('Enter');const departure=await page.evaluate(()=>window.__deskDeparture!)
    await expect(page).toHaveURL(new RegExp(`${path}$`));if(path==='/studio')await expect(page.getByRole('heading',{level:1})).toHaveText(/The screening\s+room\./);else await expect(page.locator('#contact h2')).toBeInViewport()
    await expect(page.locator('.state-opening,#studio video,#studio iframe')).toHaveCount(0);await page.goBack();await expect(page).toHaveURL(/\/$/);await expect(link).toBeFocused();await expect.poll(async()=>Math.abs(await page.evaluate(()=>scrollY)-departure.top)).toBeLessThan(4);returns.push({selector,departure,returned:await page.evaluate(()=>scrollY)})
  }
  await testInfo.attach('desk-destination-history',{body:JSON.stringify({modified,returns}),contentType:'application/json'})
})

test('one failed genuine capture leaves an honest object and all destination links usable',async({page})=>{
  await page.route('**/atlas-cirs-home-desktop.webp',route=>route.abort());await page.goto('/');await entry(page);await expect(page.locator('.desk-cirs .desk-image-fallback')).toContainText('Website capture unavailable. Project details are still available through this link.')
  await expect(page.locator('.desk-object')).toHaveCount(5);await expect(page.locator('.desk-vallalar img')).toHaveCount(1);await expect(page.locator('.desk-contact')).toHaveAttribute('href','/about#contact')
  await expect(page.locator('.desk-opening')).not.toContainText(/available for work|open to work|accepting projects|process hotspot/i)
  await page.locator('.desk-cirs').click();await expect(page).toHaveURL(/\/projects\/cirs$/)
})

test('quiet preferences keep real work and keyboard focus without ambient media or a camera sequence',async({browser,baseURL})=>{
  for(const mode of['reduced','forced','off','save-data']as const){
    const context=await browser.newContext({baseURL,viewport:{width:1440,height:1000},reducedMotion:mode==='reduced'?'reduce':'no-preference',forcedColors:mode==='forced'?'active':'none'})
    if(mode==='off')await context.addInitScript(()=>localStorage.setItem('ap-motion','off'));if(mode==='save-data')await context.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true}}))
    const page=await context.newPage();await ready(page);await expect(page.locator('.desk-object')).toHaveCount(5);await expect(page.locator('.desk-opening canvas,.desk-opening video,.pin-spacer,.state-opening,.hero-ambient-film,.glass-arrow-cursor')).toHaveCount(0)
    await page.locator('.desk-work-link').focus();await page.keyboard.press('Tab');await expect(page.locator('.desk-cirs')).toBeFocused();expect(errors.get(page)).toEqual([]);await context.close()
  }
})
