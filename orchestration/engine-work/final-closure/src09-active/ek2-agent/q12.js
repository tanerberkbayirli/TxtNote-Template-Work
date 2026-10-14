(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>s.getBoundingClientRect());
const z=sheets[0].width/document.querySelector('.thesis-sheet').offsetWidth;
const r=t.rows[14];const rr=r.getClientRects()[0];
const si=sheets.findIndex(s=>rr.top>=s.top-1&&rr.top<s.bottom);const st=sheets[si].top;
const f=v=>Math.round((v-st)/z*.75*100)/100;
const cells=[...r.cells].map(c=>{const cr=c.getBoundingClientRect();return {cell:[f(cr.top),f(cr.bottom)],ps:[...c.querySelectorAll('p')].map(p=>{const b=p.getBoundingClientRect(),s=getComputedStyle(p),a=getComputedStyle(p,'::after');return [f(b.top),f(b.bottom),s.marginTop,s.marginBottom,a.height,a.marginBottom]}),tdAfter:getComputedStyle(c,'::after').height}});
return {sheet:si+1,row:[f(rr.top),f(rr.bottom)],cells,lastRowBottom: f(t.rows[13].getBoundingClientRect().bottom)};})()
