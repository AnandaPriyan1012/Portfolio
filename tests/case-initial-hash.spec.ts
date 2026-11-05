import { test, expect, type Page } from '@playwright/test'
const variants=[{width:1440,height:1000,touch:false,motion:'no-preference' as const},{width:390,height:844,touch:true,motion:'no-preference' as const},{width:320,height:844,touch:true,motion:'reduce' as const}]
async function settled(page:Page){await page.locator('.state-opening').waitFor({state:'detached'});await page.evaluate(()=>document.fonts.ready);if(process.env.AP_QA_EXPECTED_BUNDLE)await expect(page.locator('script[type="module"]')).toHaveAttribute('src','/assets/'+process.env.AP_QA_EXPECTED_BUNDLE)}
for(const variant of variants)test.describe(`${variant.width}px initial case hash`,()=>{
 test.use({viewport:{width:variant.width,height:variant.height},hasTouch:variant.touch,isMobile:variant.touch,reducedMotion:variant.motion})
 for(const [project,id]of[['cirs','case-cirs-admissions'],['accuflow','case-accuflow-interfaces']]as const)test(`${project} direct entry and reload reach the actual chapter and native focus`,async({page},testInfo)=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8})})
  await page.goto(`/projects/${project}#${id}`)
  for(const arrival of['entry','reload']){
   if(arrival==='reload')await page.reload()
   await settled(page)
   const chapter=page.locator('#'+id)
   const before=await page.evaluate(id=>({url:location.href,y:scrollY,target:document.getElementById(id)?.getBoundingClientRect().top,focus:document.activeElement?.outerHTML.slice(0,200)}),id)
   await testInfo.attach(arrival+'-initial-state',{body:JSON.stringify(before),contentType:'application/json'})
   await expect(chapter).toBeFocused();await expect(chapter.locator('h2')).toBeInViewport()
   await expect(page.getByRole('navigation',{name:'Case study chapters'}).locator('[aria-current="location"]')).toHaveAttribute('href','#'+id)
   const top=await page.evaluate(()=>scrollY);expect(top).toBeGreaterThan(1000)
   await page.locator('.case-media img').evaluate(async node=>{await(node as HTMLImageElement).decode();node.dispatchEvent(new Event('load'))})
   await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await page.waitForTimeout(600)
   await expect(chapter).toBeFocused();expect(Math.abs(await page.evaluate(()=>scrollY)-top)).toBeLessThan(4)
   await testInfo.attach(arrival+'-verified',{body:JSON.stringify({id,top,afterRefresh:await page.evaluate(()=>scrollY)}),contentType:'application/json'})
  }
 })
})
