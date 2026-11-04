import {test, expect, type Page} from '@playwright/test'

const variants = [
  {width:1440,height:1000,motion:'no-preference' as const,touch:false},
  {width:390,height:844,motion:'no-preference' as const,touch:true},
  {width:320,height:844,motion:'reduce' as const,touch:true},
]
declare global {interface Window {__captureHistoryDeparture?:number;__captureNavigationEvents?:{type:string;trusted:boolean}[]}}
async function ready(page:Page) {
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8})
    Object.defineProperty(navigator,'deviceMemory',{get:()=>8})
  })
  await page.goto('/projects/cirs')
  await page.locator('.state-opening').waitFor({state:'detached'})
  await page.evaluate(()=>document.fonts.ready)
  const fonts=await page.evaluate(()=>[...document.fonts].filter(font=>font.status==='loaded').map(font=>font.family))
  expect(fonts).toContain('Syne Variable');expect(fonts).toContain('Instrument Sans Variable')
  await page.locator('.case-media img').evaluate(node=>(node as HTMLImageElement).decode())
}
function chapterLink(page:Page,name:string|RegExp) {
  return page.getByRole('navigation',{name:'Case study chapters'}).getByRole('link',{name,exact:typeof name==='string'})
}
async function jump(page:Page,name:string|RegExp,id:string) {
  const link=chapterLink(page,name)
  await link.focus()
  await link.evaluate(node=>node.addEventListener('click',()=>{window.__captureHistoryDeparture=scrollY},{capture:true,once:true}))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp('#'+id+'$'))
  await expect(page.locator('#'+id)).toBeFocused()
  return page.evaluate(()=>window.__captureHistoryDeparture!)
}
async function open(page:Page,touch:boolean) {
  const opener=page.getByRole('button',{name:'View larger capture: CIRS Admissions Guide',exact:true})
  await opener.scrollIntoViewIfNeeded()
  if(touch)await opener.tap()
  else {await opener.focus();await page.keyboard.press('Enter')}
  const dialog=page.getByRole('dialog',{name:'CIRS Admissions Guide',exact:true})
  await expect(dialog).toBeVisible()
  await dialog.locator('img').evaluate(node=>(node as HTMLImageElement).decode())
  expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden')
  return {opener,dialog,top:await page.evaluate(()=>scrollY)}
}
async function unlocked(page:Page) {
  await expect(page.locator('.capture-inspection-dialog')).toHaveCount(0)
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  expect(await page.evaluate(()=>document.body.style.overflow)).toBe('')
  await expect(page.locator('.state-opening')).toHaveCount(0)
}
for(const variant of variants)test.describe(`${variant.width}px ${variant.motion} inspection history`,()=>{
  test.use({viewport:{width:variant.width,height:variant.height},reducedMotion:variant.motion,isMobile:variant.touch,hasTouch:variant.touch})
  test('native same-case Back releases the inspector and restores the real history focus/Y; Forward cannot reopen it',async({page},testInfo)=>{
    await ready(page)
    const departure=await jump(page,'The Admissions page','case-cirs-admissions')
    const {opener}=await open(page,variant.touch)
    await page.goBack()
    await expect(page).toHaveURL(/\/projects\/cirs$/)
    await unlocked(page)
    const original=chapterLink(page,'The Admissions page')
    await expect(original).toBeFocused()
    await expect(original).toBeInViewport()
    await expect.poll(()=>page.evaluate(top=>Math.abs(scrollY-top),departure)).toBeLessThan(4)
    await page.waitForTimeout(700)
    await expect(original).toBeFocused()
    expect(Math.abs(await page.evaluate(()=>scrollY)-departure)).toBeLessThan(4)
    await page.goForward()
    await expect(page).toHaveURL(/#case-cirs-admissions$/)
    await unlocked(page)
    await expect(page.locator('#case-cirs-admissions')).toBeInViewport()
    // A navigation dismissal must not suppress a future explicit close.
    const reopened=await open(page,variant.touch)
    if(variant.touch)await reopened.dialog.getByRole('button',{name:'Close capture',exact:true}).tap()
    else await page.keyboard.press('Escape')
    await unlocked(page)
    await expect(opener).toBeFocused()
    expect(Math.abs(await page.evaluate(()=>scrollY)-reopened.top)).toBeLessThan(2)
    await testInfo.attach('same-case-history-restoration',{body:JSON.stringify({departure,returnedToNativeChapterLink:true,forwardDidNotReopen:true}),contentType:'application/json'})
  })
  test('native Back to an earlier chapter closes the top layer without a queued opener-focus jump',async({page},testInfo)=>{
    await ready(page)
    await jump(page,/Web development & creative work$/,'case-cirs-role')
    await jump(page,'The Admissions page','case-cirs-admissions')
    const {opener}=await open(page,variant.touch)
    await page.goBack()
    await expect(page).toHaveURL(/#case-cirs-role$/)
    await unlocked(page)
    const role=page.locator('#case-cirs-role')
    await expect(role).toBeInViewport()
    const top=await page.evaluate(()=>scrollY)
    await page.waitForTimeout(700)
    await expect(role).toBeInViewport()
    expect(Math.abs(await page.evaluate(()=>scrollY)-top)).toBeLessThan(4)
    await expect(opener).not.toBeFocused()
    await page.keyboard.press('Tab')
    const continuation=await page.evaluate(()=>({tag:document.activeElement?.tagName,text:document.activeElement?.textContent,href:document.activeElement?.getAttribute('href')}))
    expect(continuation).toMatchObject({tag:'BUTTON',text:'Portal'})
    await testInfo.attach('native-next-tab-after-history',{body:JSON.stringify(continuation),contentType:'application/json'})
  })
  test('a real same-document fragment navigation while inspecting follows the new chapter with no stale modal',async({page})=>{
    await ready(page)
    await jump(page,'The Admissions page','case-cirs-admissions')
    await open(page,variant.touch)
    await page.evaluate(()=>{
      window.__captureNavigationEvents=[]
      for(const type of ['popstate','hashchange'])window.addEventListener(type,event=>window.__captureNavigationEvents!.push({type,trusted:event.isTrusted}),{once:true})
    })
    await page.goto('/projects/cirs#case-cirs-role')
    await expect(page).toHaveURL(/#case-cirs-role$/)
    await unlocked(page)
    await expect(page.locator('#case-cirs-role')).toBeInViewport()
    expect(await page.evaluate(()=>window.__captureNavigationEvents?.some(event=>event.type==='hashchange'&&event.trusted))).toBe(true)
  })
})
