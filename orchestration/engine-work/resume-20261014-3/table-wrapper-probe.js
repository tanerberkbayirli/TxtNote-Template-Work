(async() => {
 const table=document.querySelector('.txn-docx-9879'),paper=table.closest('.thesis-paper'),scale=paper.getBoundingClientRect().width/paper.offsetWidth;
 const pages=[...document.querySelectorAll('.thesis-sheet')].map(n=>n.getBoundingClientRect());
 const read=()=>['docx-8701','docx-9150','docx-9624','docx-9869'].map(id=>{const r=document.querySelector(`.txn-${id}`).getBoundingClientRect();const i=pages.findIndex(p=>r.top>=p.top&&r.top<p.bottom&&r.left>=p.left&&r.left<p.right);return{id,page:i+1,y:i>=0?(r.top-pages[i].top)/scale*.75:0}});
 const before=read(),wrapper=document.createElement('div');wrapper.dataset.probeTableGuard='';table.before(wrapper);wrapper.append(table);
 const s=document.createElement('style');s.textContent='.txn-docx-9879 td::after{display:none!important}[data-probe-table-guard]{box-decoration-break:clone;padding-bottom:var(--thesis-col-lead);margin-bottom:calc(-1 * var(--thesis-col-lead))}';document.head.append(s);
 const after=read();const fonts=await window.queryLocalFonts();
 return{before,after,fonts:fonts.filter(f=>/mincho|mingliu/i.test(f.family)).map(f=>({family:f.family,postscript:f.postscriptName}))};
})()
