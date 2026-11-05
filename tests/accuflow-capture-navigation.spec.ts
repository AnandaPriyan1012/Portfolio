import {test,expect,type Page} from '@playwright/test'
type Scope='deck'|'case'|'atlas'
const ids=['home','product','workflow','guide'] as const
const variants=[{width:1440,height:1000,touch:false,motion:'no-preference' as const},{width:390,height:844,touch:true,motion:'no-preference' as const},{width:320,height:844,touch:true,motion:'reduce' as const}]
const root=(page:Page,scope:Scope)=>page.locator(scope==='deck'?'.accu-route-deck':scope==='case'?'.case-project-evidence .interface-atlas[data-project="accuflow"]':'#accuflow-evidence .interface-atlas[data-project="accuflow"]')
const labels=(scope:Scope)=>scope==='deck'?['Home','Product','How it works','Try it']:['Homepage','The product','How it works','The guide']
const top=(page:Page,scope:Scope,index:number)=>scope==='deck'?root(page,scope).getByRole('button',{name:`Show AccuFlow ${labels(scope)[index]}`,exact:true}):root(page,scope).getByRole('tab',{name:labels(scope)[index],exact:true})
const pager=(page:Page,scope:Scope)=>root(page,scope).locator('nav.capture-navigation')
const image=(page:Page,scope:Scope)=>root(page,scope).locator(scope==='deck'?'.accu-route-screen img':'.interface-atlas-capture img')
test.beforeEach(async({page,request})=>{
 if(process.env.AP_QA_EXPECTED_BUNDLE||process.env.AP_QA_EXPECTED_STYLE){const html=await(await request.get('/work')).text();if(process.env.AP_QA_EXPECTED_BUNDLE)expect(html).toContain(process.env.AP_QA_EXPECTED_BUNDLE);if(process.env.AP_QA_EXPECTED_STYLE)expect(html).toContain(process.env.AP_QA_EXPECTED_STYLE)}
 await page.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8})})
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));(page as Page&{captureErrors?:string[]}).captureErrors=errors
})
test.afterEach(async({page})=>expect((page as Page&{captureErrors?:string[]}).captureErrors,'No uncaught capture-journey errors').toEqual([]))
async function settled(page:Page){let previous=await page.evaluate(()=>scrollY),n=0;await expect.poll(async()=>{const next=await page.evaluate(()=>scrollY);n=Math.abs(next-previous)<.1?n+1:0;previous=next;return n},{intervals:[100]}).toBeGreaterThanOrEqual(4)}
async function ready(page:Page,scope:Scope){
 await page.goto(scope==='case'?'/projects/accuflow#case-accuflow-interfaces':'/work#accuflow');await page.locator('.state-opening').waitFor({state:'detached'});await page.evaluate(()=>document.fonts.ready)
 if(process.env.AP_QA_EXPECTED_BUNDLE)await expect(page.locator('script[type="module"]')).toHaveAttribute('src','/assets/'+process.env.AP_QA_EXPECTED_BUNDLE)
 if(scope==='atlas'){const drawer=page.locator('#accuflow-evidence'),summary=drawer.locator(':scope>summary');await summary.scrollIntoViewIfNeeded();await settled(page);await summary.focus();await page.keyboard.press('Enter');await expect(drawer).toHaveAttribute('open','')}
 await expect(root(page,scope)).toBeVisible();await expect(pager(page,scope)).toBeVisible();await settled(page)
}
async function chosen(page:Page,scope:Scope,index:number,decode=true){
 await expect(top(page,scope,index)).toHaveAttribute(scope==='deck'?'aria-pressed':'aria-selected','true')
 await expect(pager(page,scope).locator('.capture-navigation-current')).toContainText(`${String(index+1).padStart(2,'0')} / 04 captured views`)
 await expect(pager(page,scope).locator('.capture-navigation-current')).toContainText(labels(scope)[index])
 const source=root(page,scope).locator(scope==='deck'?'.accu-route-source':'.interface-atlas-notes>a')
 await expect(source).toHaveAttribute('href','https://accuflow-premium-ai.netlify.app'+['/','/product','/how-it-works','/try'][index])
 if(decode){await image(page,scope).evaluate(node=>(node as HTMLImageElement).decode());const expected=`/media/atlas-accuflow-${ids[index]}-${index===0||page.viewportSize()!.width>=768?'desktop':'mobile'}.webp`;expect(await image(page,scope).evaluate(node=>new URL((node as HTMLImageElement).currentSrc).pathname)).toBe(expected)}
}
async function chooseTop(page:Page,scope:Scope,index:number,touch=false){const control=top(page,scope,index);await control.scrollIntoViewIfNeeded();await settled(page);if(touch)await control.tap();else{await control.focus();await page.keyboard.press('Enter')};await chosen(page,scope,index);await expect(control).toBeFocused()}
async function clearance(page:Page,scope:Scope,index:number){
 const record=await top(page,scope,index).evaluate((node,scope)=>{const b=node.getBoundingClientRect(),header=document.querySelector(scope==='case'?'.case-topbar':'.atelier-navigation')!.getBoundingClientRect(),rail=scope==='case'?null:document.querySelector('.work-chapter-rail')!.getBoundingClientRect();return{top:b.top,bottom:b.bottom,headerBottom:Math.max(header.bottom,rail?.bottom??0),height:innerHeight}} ,scope)
 expect(record.top).toBeGreaterThanOrEqual(record.headerBottom+7);expect(record.bottom).toBeLessThan(record.height)
 await expect(root(page,scope).locator(scope==='deck'?'.accu-route-screen':'.interface-atlas-capture picture')).toBeInViewport()
 return record
}
async function advance(page:Page,scope:Scope,index:number,direction:'next'|'previous',touch=false,decode=true){
 const action=pager(page,scope).locator(`.capture-${direction}`);await expect(action).toHaveAccessibleName(`${direction==='next'?'Next':'Previous'} capture: ${labels(scope)[index]}`)
 await action.scrollIntoViewIfNeeded();await settled(page)
 const before=await page.evaluate(()=>({url:location.href,length:history.length}))
 if(touch)await action.tap();else{await action.focus();await page.keyboard.press('Enter')}
 await chosen(page,scope,index,decode);await expect(top(page,scope,index)).toBeFocused();const geometry=await clearance(page,scope,index);if(decode)await expect(image(page,scope)).toBeInViewport()
 expect(await page.evaluate(()=>({url:location.href,length:history.length}))).toEqual(before)
 return{index,id:ids[index],geometry,url:before.url,y:await page.evaluate(()=>scrollY)}
}

for(const scope of['deck','case','atlas']as const)for(const mode of variants)test.describe(`${scope} ${mode.width}px capture journey`,()=>{
 test.use({viewport:{width:mode.width,height:mode.height},isMobile:mode.touch,hasTouch:mode.touch,reducedMotion:mode.motion})
 test('finishing a real capture can continue forward and reverse with a visible native handoff and no wrap',async({page},testInfo)=>{
  await ready(page,scope);await chosen(page,scope,scope==='deck'?3:0)
  await chooseTop(page,scope,0,mode.touch);await expect(pager(page,scope).locator('.capture-previous')).toBeDisabled()
  const observations=[]
  for(const index of[1,2,3]){observations.push(await advance(page,scope,index,'next',mode.touch));if(index===1&&scope!=='deck'){const stored=await page.evaluate(scope=>JSON.parse(sessionStorage.getItem(scope==='case'?'ap-case-evidence-v1':'ap-work-evidence-v1')!),scope);expect(scope==='case'?stored.accuflowView:stored.accuflow.view).toBe('product')}}
  await expect(pager(page,scope).locator('.capture-next')).toBeDisabled()
  for(const index of[2,1,0])observations.push(await advance(page,scope,index,'previous',mode.touch))
  await expect(pager(page,scope).locator('.capture-previous')).toBeDisabled();await expect(pager(page,scope).getByRole('button')).toHaveCount(2)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mode.width)
  await testInfo.attach('deliberate-captured-route-sequence',{body:JSON.stringify({scope,mode,observations},null,2),contentType:'application/json'})
 })
})

test('ordinary top choices and passive reading keep their existing focus and do not run the footer handoff',async({page})=>{
 await page.setViewportSize({width:390,height:844});await ready(page,'deck')
 const choice=top(page,'deck',1);await choice.scrollIntoViewIfNeeded();await settled(page);await choice.focus();const before=await page.evaluate(()=>scrollY);await page.keyboard.press('Enter');await chosen(page,'deck',1);await expect(choice).toBeFocused();expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(4)
 const location=await page.evaluate(()=>({url:location.href,length:history.length}));await page.mouse.wheel(0,500);await settled(page);await expect(choice).toBeFocused();await chosen(page,'deck',1);expect(await page.evaluate(()=>({url:location.href,length:history.length}))).toEqual(location)
})

test('a delayed genuine image cannot pull focus back after the reader continues with native Tab',async({page},testInfo)=>{
 await page.setViewportSize({width:390,height:844});let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve});let held=0
 await page.route(url=>/\/atlas-accuflow-product-(?:mobile|desktop)\.webp$/.test(url.pathname),async route=>{held++;await gate;await route.fallback()})
 try{
  await ready(page,'deck');await chooseTop(page,'deck',0);await advance(page,'deck',1,'next',false,false)
  await page.keyboard.press('Tab');const continuation=top(page,'deck',2);await expect(continuation).toBeFocused();const y=await page.evaluate(()=>scrollY);release();await image(page,'deck').evaluate(node=>(node as HTMLImageElement).decode());await page.waitForTimeout(350);await expect(continuation).toBeFocused();expect(Math.abs(await page.evaluate(()=>scrollY)-y)).toBeLessThan(4);await chosen(page,'deck',1);expect(held).toBeGreaterThan(0)
  await testInfo.attach('native-Tab-before-delayed-capture',{body:JSON.stringify({held,y,after:await page.evaluate(()=>scrollY),focus:'How it works top key; Product remains selected'}),contentType:'application/json'})
 }finally{release()}
})

test('an unavailable Product image preserves a real source and the next captured route still works',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route(url=>url.pathname==='/media/atlas-accuflow-product-mobile.webp',route=>route.abort('failed'))
 await ready(page,'deck');await chooseTop(page,'deck',0);await advance(page,'deck',1,'next',false,false)
 await expect(root(page,'deck').locator('.accu-route-unavailable')).toContainText('The Product capture could not load.')
 await expect(root(page,'deck').locator('.accu-route-source')).toHaveAttribute('href','https://accuflow-premium-ai.netlify.app/product')
 await advance(page,'deck',2,'next');await expect(root(page,'deck').locator('.accu-route-unavailable')).toHaveCount(0)
})

for(const scope of['deck','atlas']as const)test(`${scope} footer selection survives a real case visit with exact original Work focus and Y`,async({page},testInfo)=>{
 await page.setViewportSize({width:390,height:844});await ready(page,scope);await chooseTop(page,scope,0);await advance(page,scope,1,'next')
 const origin=page.locator('#accuflow .feature-footer a[href="/projects/accuflow"]');await origin.scrollIntoViewIfNeeded();await settled(page);await origin.focus();await origin.evaluate(node=>node.addEventListener('click',()=>{document.documentElement.dataset.testCaptureDeparture=String(scrollY)},{once:true,capture:true}));await page.keyboard.press('Enter');const departed=Number(await page.locator('html').getAttribute('data-test-capture-departure'))
 await page.locator('.state-opening').waitFor({state:'detached'});await expect(page).toHaveURL(/\/projects\/accuflow$/)
 await page.getByRole('button',{name:'Back to portfolio',exact:true}).click();await page.locator('.state-opening').waitFor({state:'detached'});await expect(page).toHaveURL(/\/work#accuflow$/);await expect(origin).toBeFocused();await expect.poll(()=>page.evaluate(y=>Math.abs(scrollY-y),departed)).toBeLessThan(4)
 await chosen(page,scope,1);await expect(origin).toBeFocused();await testInfo.attach('footer-choice-case-return',{body:JSON.stringify({scope,departed,returned:await page.evaluate(()=>scrollY)}),contentType:'application/json'})
})

for(const mode of['motion-off','forced-colors']as const)test(`${mode} keeps deliberate capture continuation readable and native`,async({page})=>{
 if(mode==='motion-off')await page.addInitScript(()=>localStorage.setItem('ap-motion','off'));else await page.emulateMedia({forcedColors:'active'})
 await ready(page,'deck');await chooseTop(page,'deck',0);await advance(page,'deck',1,'next');await expect(top(page,'deck',1)).toBeFocused();await expect(root(page,'deck').locator('.accu-route-footer a')).toHaveCount(2)
})
