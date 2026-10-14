(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 const s=sheets[16], r=s.getBoundingClientRect();
 const stack=s.closest('[aria-label="Belge sayfaları"]');
 const info={n:sheets.length,sheet:{w:r.width,h:r.height,top:r.top},zoom:getComputedStyle(s.parentElement).transform};
 const flow=s.querySelector('.thesis-page-flow'); 
 info.flow=flow&&{h:flow.getBoundingClientRect().height,cls:flow.className};
 return info;
})()
