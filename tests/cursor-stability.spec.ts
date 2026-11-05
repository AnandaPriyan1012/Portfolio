import { test, expect, type Page } from '@playwright/test'

type Sample = { event: string; trusted: boolean; x: number; y: number; gate?: string; arrow?: string; cursor: string; tag: string; type: string | null; marked: boolean }
declare global { interface Window { __cursorEntries?: Sample[] } }
const errors = new WeakMap<Page,string[]>()
test.use({reducedMotion:'no-preference'})
test.beforeEach(async({page})=>{
  const found:string[]=[];errors.set(page,found);page.on('pageerror',error=>found.push(error.message))
  await page.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8})})
})
test.afterEach(async({page})=>{expect(errors.get(page)||[]).toEqual([])})
async function ready(page:Page,path='/work'){
  await page.goto(path);await expect(page.locator('.state-opening')).toHaveCount(0,{timeout:2100});await expect(page.locator('html')).not.toHaveAttribute('data-opening','active');await page.evaluate(()=>document.fonts.ready)
  if(process.env.AP_EXPECT_BUNDLE)await expect(page.locator('script[type="module"]').first()).toHaveAttribute('src',`/assets/${process.env.AP_EXPECT_BUNDLE}`)
}
async function glass(page:Page,x?:number,y?:number){
  const arrow=page.locator('.glass-arrow-cursor');await expect(arrow).toHaveAttribute('data-visible','true');await expect(page.locator('html')).toHaveAttribute('data-glass-pointer','visible')
  const box=(await arrow.boundingBox())!;expect([box.width,box.height]).toEqual([21,27])
  if(x!==undefined&&y!==undefined){expect(Math.abs(box.x+.75-x)).toBeLessThan(.2);expect(Math.abs(box.y+.75-y)).toBeLessThan(.2);expect(await page.evaluate(({x,y})=>getComputedStyle(document.elementFromPoint(x,y)!).cursor,{x,y})).toBe('none')}
}
async function native(page:Page){await expect(page.locator('html')).not.toHaveAttribute('data-glass-pointer','visible');if(await page.locator('.glass-arrow-cursor').count())await expect(page.locator('.glass-arrow-cursor')).toHaveAttribute('data-visible','false')}

test('trusted ordinary pointer entries suppress native before the next RAF marker update',async({page},testInfo)=>{
  await ready(page);await page.mouse.move(15,400);await glass(page,15,400)
  await page.evaluate(()=>{window.__cursorEntries=[];const record=(event:PointerEvent)=>{if(event.pointerType!=='mouse')return;queueMicrotask(()=>{const hit=document.elementFromPoint(event.clientX,event.clientY);if(!hit)return;window.__cursorEntries!.push({event:event.type,trusted:event.isTrusted,x:event.clientX,y:event.clientY,gate:document.documentElement.dataset.glassPointer,arrow:document.querySelector<HTMLElement>('.glass-arrow-cursor')?.dataset.visible,cursor:getComputedStyle(hit).cursor,tag:hit.tagName,type:hit.getAttribute('type'),marked:!!hit.closest('.glass-pointer-target')})})};window.addEventListener('pointerover',record,true);window.addEventListener('pointermove',record,true)})
  const nav=page.getByRole('navigation',{name:'Main navigation'})
  let lastPoint={x:0,y:0}
  for(const label of ['Work','About','Contact','About','Work','Contact','About','Work']){
    const box=(await nav.getByRole('link',{name:label,exact:true}).boundingBox())!;lastPoint={x:box.x+box.width/2,y:box.y+box.height/2};await page.mouse.move(lastPoint.x,lastPoint.y,{steps:5})
  }
  await glass(page,lastPoint.x,lastPoint.y)
  const samples=await page.evaluate(()=>window.__cursorEntries!),valid=samples.filter(s=>s.trusted&&s.gate==='visible'&&s.arrow==='true')
  await testInfo.attach('trusted-pre-raf-cursor',{body:JSON.stringify(samples),contentType:'application/json'})
  expect(valid.length).toBeGreaterThanOrEqual(12)
  expect(valid.filter(s=>s.cursor!=='none'),'Every validated glass state hides the ordinary native cursor, including unmarked target entries').toEqual([])
})

test('class replacement and stationary nested layout retain the same ready arrow without marker gaps',async({page},testInfo)=>{
  await ready(page,'/not-in-the-story')
  await page.evaluate(()=>{const panel=document.createElement('section');panel.id='cursor-layout-fixture';panel.style.cssText='position:fixed;left:200px;top:250px;width:600px;height:260px;z-index:200;background:#ddd;color:#111';panel.innerHTML='<button id="cursor-layout-action" style="width:100%;height:130px">Action fixture</button><p>Ordinary lower surface fixture</p>';document.body.append(panel)})
  await page.mouse.move(400,310);await glass(page,400,310)
  await page.locator('.glass-arrow-cursor').evaluate(node=>node.setAttribute('data-stability-proof','same'))
  const replacement=await page.locator('#cursor-layout-action').evaluate(node=>{node.className='replacement-fixture-class';return{cursor:getComputedStyle(node).cursor,marker:node.classList.contains('glass-pointer-target')}})
  expect(replacement.cursor).toBe('none')
  await page.locator('#cursor-layout-fixture').evaluate(node=>{node.innerHTML='<p id="cursor-layout-new" style="margin:0;height:260px">New ordinary surface beneath the stationary pointer</p>'})
  await glass(page,400,310);await expect(page.locator('.glass-arrow-cursor')).toHaveAttribute('data-stability-proof','same')
  await testInfo.attach('class-and-layout-fixture',{body:JSON.stringify(replacement),contentType:'application/json'})
})

test('actual transparent Studio radio rows use glass while click and native arrow-key selection still work',async({page},testInfo)=>{
  await ready(page,'/studio#vantara')
  const choice=page.getByRole('radio',{name:'TED-Ed auditions',exact:true});await choice.scrollIntoViewIfNeeded();const box=(await choice.boundingBox())!,point={x:box.x+box.width/2,y:box.y+box.height/2}
  await page.mouse.move(point.x,point.y);await glass(page,point.x,point.y)
  const hit=await page.evaluate(({x,y})=>{const node=document.elementFromPoint(x,y)!;return{tag:node.tagName,type:node.getAttribute('type'),cursor:getComputedStyle(node).cursor} },point)
  expect(hit.tag).toBe('INPUT');expect(hit.type).toBe('radio');expect(hit.cursor).toBe('none')
  await page.mouse.click(point.x,point.y);await expect(choice).toBeChecked();await expect(page).toHaveURL(/\/studio#ted-ed-2026$/);await glass(page,point.x,point.y)
  await choice.focus();await page.keyboard.press('ArrowDown');await expect(page.getByRole('radio',{name:'CIRS website launch',exact:true})).toBeChecked();await expect(page).toHaveURL(/\/studio#cirs-website-launch$/);await glass(page,point.x,point.y)
  await expect(page.locator('#studio video, #studio iframe')).toHaveCount(0)
  const disabled=page.getByRole('radio',{name:'CIRSMUN 2026',exact:true});await disabled.scrollIntoViewIfNeeded();await disabled.hover({force:true});await native(page)
  expect(await disabled.evaluate(node=>getComputedStyle(node).cursor)).not.toBe('none')
  await testInfo.attach('real-studio-radio-hit',{body:JSON.stringify(hit),contentType:'application/json'})
})

test('editing, specialized inputs, native media and disabled controls retain native cursors while button-like inputs stay glass',async({page},testInfo)=>{
  await ready(page,'/not-in-the-story')
  await page.evaluate(()=>{const panel=document.createElement('section');panel.id='cursor-native-fixture';panel.style.cssText='position:fixed;left:100px;top:170px;width:1100px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:14px;z-index:200;background:#ddd;color:#111';panel.innerHTML='<button id="cursor-entry">Ordinary entry</button><input id="cursor-text" aria-label="Cursor text"><textarea id="cursor-area" aria-label="Cursor textarea"></textarea><select id="cursor-select" aria-label="Cursor select"><option>One</option></select><input id="cursor-range" type="range" aria-label="Cursor range"><input id="cursor-date" type="date" aria-label="Cursor date"><input id="cursor-file" type="file" aria-label="Cursor file"><input id="cursor-color" type="color" aria-label="Cursor color"><video id="cursor-video" controls></video><button id="cursor-disabled" disabled>Disabled</button><div id="cursor-editor" contenteditable="true" role="textbox">Editor</div><div id="cursor-readonly" contenteditable="false">Ordinary non-editable content</div><input id="cursor-check" type="checkbox" aria-label="Cursor checkbox"><input id="cursor-button" type="button" value="Input action"><div id="cursor-drag" class="os-window-titlebar">OS drag handle</div>';for(const e of panel.children)(e as HTMLElement).style.cssText+=';min-height:55px;min-width:100px;';document.body.append(panel)})
  const records=[]
  for(const id of ['cursor-text','cursor-area','cursor-select','cursor-range','cursor-date','cursor-file','cursor-color','cursor-video','cursor-disabled','cursor-editor','cursor-drag']){
    await page.locator('#cursor-entry').hover();await glass(page)
    const control=page.locator(`#${id}`);await control.hover({force:true});await native(page)
    const cursor=await control.evaluate(node=>getComputedStyle(node).cursor);expect(cursor,`${id} retains native cursor`).not.toBe('none');records.push({id,cursor})
  }
  await page.getByRole('textbox',{name:'Cursor text',exact:true}).fill('Text editing remains native')
  await expect(page.getByRole('textbox',{name:'Cursor text',exact:true})).toHaveValue('Text editing remains native')
  for(const id of ['cursor-readonly','cursor-check','cursor-button']){await page.locator(`#${id}`).hover();await glass(page);expect(await page.locator(`#${id}`).evaluate(node=>getComputedStyle(node).cursor)).toBe('none')}
  await page.locator('#cursor-check').click();await expect(page.locator('#cursor-check')).toBeChecked()
  await testInfo.attach('native-exceptions-fixture',{body:JSON.stringify(records),contentType:'application/json'})
})

test('native modal content keeps glass, its browser backdrop yields native, and the restored route opening preserves the stationary pointer',async({page},testInfo)=>{
  await ready(page);await page.locator('#cirs').getByRole('button',{name:'Quick view',exact:true}).click()
  const dialog=page.getByRole('dialog',{name:'CIRS Website',exact:true}),close=dialog.getByRole('button',{name:'Close dialog',exact:true})
  await close.hover();const box=(await close.boundingBox())!,point={x:box.x+box.width/2,y:box.y+box.height/2};await glass(page,point.x,point.y)
  expect(await page.locator('.glass-cursor-layer').evaluate(node=>node.parentElement?.tagName)).toBe('DIALOG')
  expect(await dialog.evaluate(node=>getComputedStyle(node,'::backdrop').cursor),'Browser-owned backdrop remains native even while inner controls use glass').not.toBe('none')
  await page.mouse.move(5,500);await native(page)
  await close.hover();await glass(page,point.x,point.y);await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await glass(page,point.x,point.y)
  const films=page.locator('a[href="/studio"]:visible').first();await expect(films).toHaveCount(1);await films.focus();await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/studio$/)
  const stage=page.locator('.state-opening');await expect(stage).toHaveAttribute('data-route','/studio',{timeout:1200});await expect(stage).toHaveCSS('background-color','rgb(0, 0, 0)');await expect(stage).toHaveCSS('opacity','1');await native(page)
  await page.keyboard.press('Escape');await expect(stage).toHaveCount(0,{timeout:2100});await expect(page.locator('html')).not.toHaveAttribute('data-opening','active');await glass(page,point.x,point.y)
  await testInfo.attach('top-layer-stationary-point',{body:JSON.stringify(point),contentType:'application/json'})
})
