(()=>{const out={};const ex=[];
for(const p of document.querySelectorAll('.thesis-page-flow p')){const rs=[...p.getClientRects()];if(rs.length<2)continue;
 const lh=parseFloat(getComputedStyle(p).lineHeight)*1.2044;
 const pat=rs.map(r=>Math.round(r.height/lh)).join('+');out[pat]=(out[pat]||0)+1;if(ex.length<400&&/^(1\+1|1\+2|2\+1|1\+3|3\+1|1\+1\+1)$/.test(pat))ex.push([pat,p.textContent.slice(0,40)]);}
return {out,ex:ex.slice(0,12)}})()
