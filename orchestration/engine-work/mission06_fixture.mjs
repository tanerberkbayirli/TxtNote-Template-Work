import {readFileSync,writeFileSync} from 'node:fs';
const f=JSON.parse(readFileSync('orchestration/specs/engine-word-structure.fixture.json','utf8'));
const t=f.__template;t.id='engine-mission06';t.page.numbering={enabled:true,position:'bottom',align:'center',format:'arabic',restart:false};
t.page.header={distanceMm:10,content:'ODD HEADER',firstContent:'FIRST HEADER',evenContent:'EVEN HEADER'};
t.page.footer={distanceMm:10,content:'ODD FOOTER',firstContent:'FIRST FOOTER',evenContent:'EVEN FOOTER'};
const numbering=(enabled,format='arabic',restart=false,startAt=1)=>({enabled,format,restart,startAt});
t.sections=[
{id:'cover',num:numbering(false)},
{id:'front',num:numbering(true,'roman-lower',true)},
{id:'main',num:numbering(true,'arabic',true),pages:3},
{id:'landscape',num:numbering(true),start:'evenPage',landscape:true,pages:2},
{id:'appendix',num:numbering(true,'arabic',true,7),start:'oddPage'},
{id:'end',num:numbering(false),start:'evenPage'}
].map(({id,num,start,landscape,pages=1})=>({id,type:id==='main'?'mainContent':'custom',title:id,showTitle:false,group:'body',mode:'editable',status:'required',pageBreakBefore:start||true,overrides:{page:{numbering:num,...(landscape?{widthMm:297,heightMm:210,orientation:'landscape',margins:{leftMm:18,rightMm:22,topMm:16,bottomMm:20}}:{})}},__pages:pages}));
f.researchData.thesis={templateId:t.id,sectionContent:{}};
for(const s of t.sections){const content=Array.from({length:s.__pages},(_,i)=>`<p>${s.id.toUpperCase()}_PAGE_${i+1}</p>`).join('<hr class="academic-page-break" data-academic-page-break="true">');if(s.id==='main')f.content=content;else f.researchData.thesis.sectionContent[s.id]=content;delete s.__pages;}
writeFileSync('orchestration/engine-work/mission06/geometry.fixture.json',JSON.stringify(f,null,2));

