(()=>{
 let page=0;
 return [...document.querySelectorAll('.thesis-paper')].map(p=>{const flow=p.querySelector('.thesis-page-flow');const c=+p.dataset.thesisPageCount||0;const start=page+1;page+=c;const cs=flow&&getComputedStyle(flow);return {id:p.dataset.thesisSection,start,count:c,h:cs&&cs.height,w:cs&&cs.width,odd:p.dataset.thesisOddPagePad,flowCss:flow&&flow.getAttribute('style')}});
})()
