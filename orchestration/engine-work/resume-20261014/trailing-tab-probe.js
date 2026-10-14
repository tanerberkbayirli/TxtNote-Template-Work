(async()=>{
 const p=document.querySelector('p[data-txt-node-id="docx-4123"]');
 const before={height:p.getBoundingClientRect().height,size:getComputedStyle(p).tabSize,whitespace:getComputedStyle(p).whiteSpace,tabs:[...p.querySelectorAll('span[data-txt-node-id]')].filter(n=>n.textContent==='\t').map(n=>({id:n.dataset.txtNodeId,r:n.getBoundingClientRect().toJSON(),css:getComputedStyle(n).whiteSpace}))};
 const tab=document.querySelector('[data-txt-node-id="docx-4121"]');tab.style.whiteSpace='break-spaces';
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const after={height:p.getBoundingClientRect().height,tab:tab.getBoundingClientRect().toJSON(),pageErrors:[]};
 return{before,after};
})()

