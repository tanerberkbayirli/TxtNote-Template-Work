import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const doc=JSON.parse(await readFile("C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/validation/aku-optional-audit/aku-sosyoloji.fixture.json","utf8"));
const browser=await chromium.launch({executablePath:process.env.THESIS_BROWSER_EXECUTABLE,args:["--enable-blink-features=MulticolColumnWrapping","--font-render-hinting=none"]});
try {
 const context=await browser.newContext({viewport:{width:1400,height:1000},deviceScaleFactor:1});
 await context.grantPermissions(["local-fonts"],{origin:"http://127.0.0.1:5175"});
 const page=await context.newPage();
 await page.goto("http://127.0.0.1:5175/tests/thesis.html");
 await page.evaluate(value=>{localStorage.clear();localStorage.setItem("txtnote-thesis-regression",value)},JSON.stringify(doc));
 await page.reload();
 await page.locator(".thesis-sheet").first().waitFor({timeout:60000});
 const zoom=page.getByLabel("Yakınlaştır",{exact:true});if(await zoom.count())await zoom.selectOption("100");
 await page.evaluate(()=>document.fonts.ready);
 let prev="",changes=[];
 for(let i=0;i<24;i++){
  await page.waitForTimeout(500);
  const state=await page.evaluate(()=>{
   const root=document.querySelector(".thesis-paper");
   const rects=[...document.querySelectorAll(".thesis-paper .thesis-page-flow .thesis-body :is(p,h1,h2,h3,h4,caption,figcaption)")].flatMap((node)=>{
    const r=node.ownerDocument.createRange();r.selectNodeContents(node);
    return [...r.getClientRects()].filter(x=>x.width&&x.height).map(x=>[+x.x.toFixed(2),+x.y.toFixed(2),+x.width.toFixed(2),+x.height.toFixed(2)]);
   });
   return {fonts:document.fonts.status,tnr:document.fonts.check("12pt \"Times New Roman\""),sheets:document.querySelectorAll(".thesis-sheet").length,flowHeights:[...document.querySelectorAll(".thesis-paper .thesis-page-flow")].map(x=>+x.offsetHeight.toFixed(2)),rects};
  });
  const signature=JSON.stringify({sheets:state.sheets,flowHeights:state.flowHeights,rects:state.rects});
  const hash=createHash("sha256").update(signature).digest("hex");
  if(hash!==prev)changes.push({tMs:(i+1)*500,hash,fonts:state.fonts,tnr:state.tnr,sheets:state.sheets,flowHeights:state.flowHeights.slice(-4),rectCount:state.rects.length,first:state.rects.slice(0,2),last:state.rects.slice(-2)});
  prev=hash;
 }
 console.log(JSON.stringify(changes));
} finally {await browser.close()}
