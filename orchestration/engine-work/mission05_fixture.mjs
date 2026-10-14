import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
const source=JSON.parse(readFileSync(new URL('orchestration/engine-work/mission05/inputs.json',root),'utf8'));
const fixture=JSON.parse(readFileSync(new URL('orchestration/specs/engine-word-justify.fixture.json',root),'utf8'));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const rich=runs=>runs.map(r=>`<span${r.bold||r.italic?` class="${[r.bold&&'fmt-bold',r.italic&&'fmt-italic'].filter(Boolean).join(' ')}"`:''}>${escape(r.text)}</span>`).join('');
for(let n=1;n<=8;n++){
 const code=`J${String(n).padStart(2,'0')}`,p=[];
 p.push(`<p>${code}-1 ${rich(source.samples.SRC09[(n-1)%4].runs)}</p>`);
 p.push(`<p>${code}-2 ${rich(source.samples.EDGE_STRUCTURE[(n-1)%4].runs)}</p>`);
 const phrase='Çığ ışık İZMİR ÖZDOĞAN AVATAR WAVY Ta To a of ve bu I önemli yöntemler ';
 p.push(`<p>${code}-3 ${Array.from({length:12},(_,i)=>`<span class="${i%3===0?'fmt-bold':i%3===1?'fmt-italic':'fmt-bold fmt-italic'}">${phrase}</span>`).join('')}</p>`);
 p.push(`<p>${code}-4 Kaynak: https://example.invalid/research/${'unbrokenToken'.repeat(12)} ardından Türkçe karakterler ve karışık <b>kalın araştırma</b> <i>italik yöntem</i> metni. ${phrase.repeat(4)}</p>`);
 fixture.researchData.thesis.sectionContent[code]=p.join('');
}
fixture.content=fixture.researchData.thesis.sectionContent.J01;
fixture.__template.id='engine-mission05-typography';fixture.researchData.thesis.templateId=fixture.__template.id;
const checks=JSON.parse(readFileSync(new URL('orchestration/specs/engine-word-justify.checks.json',root),'utf8'));
for(const check of checks){if(check.kind==='line_breaks_match')check.params.includeMeasurements=true;check.source.file='Mission 05 frozen source excerpts and boundary matrix, independent Word render';}
writeFileSync(new URL('orchestration/specs/engine-mission05-typography.fixture.json',root),JSON.stringify(fixture,null,2));
writeFileSync(new URL('orchestration/specs/engine-mission05-typography.checks.json',root),JSON.stringify(checks,null,2));
console.log('Frozen source excerpts, mixed emphasis/TR text, long URL: eight cases');
