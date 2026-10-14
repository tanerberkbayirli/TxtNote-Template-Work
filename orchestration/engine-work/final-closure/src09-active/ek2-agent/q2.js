(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sheets=[...document.querySelectorAll('.thesis-sheet')];
const s0=sheets[0].getBoundingClientRect();
const stack=sheets[0].parentElement;
const rows=[...t.rows].slice(0,24).map((r,i)=>({i,t:r.textContent.slice(0,30),top:Math.round(r.getClientRects()[0].top),h:r.getClientRects().map?undefined:0,hs:[...r.getClientRects()].map(x=>Math.round(x.height))}));
return {sheetTops:sheets.slice(155,160).map(s=>[Math.round(s.getBoundingClientRect().top),Math.round(s.getBoundingClientRect().height)]),rows};})()
