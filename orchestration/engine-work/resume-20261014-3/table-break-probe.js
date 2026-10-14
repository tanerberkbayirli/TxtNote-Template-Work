(() => ['docx-9150','docx-9624'].map(id=>{
 const r=document.querySelector(`.thesis-page-flow tr[data-txt-node-id="${id}"]`),flow=r.closest('.thesis-page-flow'),paper=r.closest('.thesis-paper');
 const css=n=>{const s=getComputedStyle(n);return{before:s.breakBefore,after:s.breakAfter,inside:s.breakInside,minimum:s.getPropertyValue('--thesis-source-row-min'),height:s.height,columnHeight:s.columnHeight,lead:s.getPropertyValue('--thesis-col-lead')}};
 const out={id,attributes:[...r.attributes].map(a=>[a.name,a.value]),css:css(r),flow:css(flow),paper:paper.dataset,children:[...r.querySelectorAll('[data-thesis-fn-stamp], [data-thesis-row-tail]')].map(n=>n.outerHTML),before:r.getBoundingClientRect().top,cells:[...r.cells].map(c=>({css:css(c),after:getComputedStyle(c,'::after').height,attrs:c.outerHTML.slice(0,160)}))};
 r.removeAttribute('data-thesis-row-min-break');out.withoutForcedBreak=r.getBoundingClientRect().top;
 return out;
}))()
