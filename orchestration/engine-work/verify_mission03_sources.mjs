import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from '../../TxtNote/frontend/node_modules/fflate/esm/index.mjs';
import { importThesisDocx } from '../../engine/src/importDocx.js';
import { installContentDocument } from '../../engine/src/contentModel.js';
import { buildNotePayload, noteFromPayload } from '../../TxtNote/frontend/src/features/sync/payload.js';
import generic from '../../engine/src/templates/generic.js';
import { compileThesisDocument } from '../../engine/src/engine.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const oracle=JSON.parse(readFileSync(resolve(root,'orchestration/engine-work/mission03/source-oracle.json')));
const hash=b=>createHash('sha256').update(b).digest('hex');
const text=n=>n.type==='text'?n.text.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&amp;','&'):(n.children||[]).map(text).join('');
function story(nodes){
  const counts={},texts=[],paragraphStyles=[];let equations=0;
  const visit=n=>{ const p=n.properties||{};if(p.nativeNamespace?.includes('/wordprocessingml/')){counts[p.nativeName]=(counts[p.nativeName]||0)+1;if(p.nativeName==='t')texts.push(text(n));if(p.nativeName==='p'&&p.nativeAttributes&&p.styleId)paragraphStyles.push(p.styleId);}
    if(n.type==='equation')equations++;(n.children||[]).forEach(visit);};nodes.forEach(visit);return {counts,text:texts,paragraphStyles,equations};
}
const result={status:'PASS',scope:'Production DOCX adapter; independent XML counts/text, mapping and package preservation. Visual native-object parity is deferred.',cases:[]};
for(const source of oracle.cases){
  const bytes=readFileSync(resolve(root,source.input.path));assert.equal(hash(bytes),source.input.sha256);
  const doc=await importThesisDocx(bytes,{fileName:source.input.path.split('/').pop()});
  const original=unzipSync(Buffer.from(doc.source.packageBase64,'base64'));
  assert.deepEqual(Object.keys(original).sort(),Object.keys(source.parts).sort());
  for(const [part,sha]of Object.entries(source.parts))assert.equal(hash(original[part]),sha,source.id+' part '+part);
  const actual=story(doc.sections.flatMap(s=>s.nodes)),expected=source.stories['word/document.xml'];
  for(const [key,count]of Object.entries(expected.counts))assert.equal(actual.counts[key]||0,count,source.id+' main '+key);
  assert.deepEqual(actual.text,expected.text,source.id+' main ordered text');assert.equal(actual.equations,expected.equations,source.id+' equations');
  const explicitStyles=[];const collectStyles=n=>{if(n.properties?.nativeName==='p'&&n.properties.explicitStyleId)explicitStyles.push(n.properties.explicitStyleId);(n.children||[]).forEach(collectStyles);};doc.sections.forEach(s=>s.nodes.forEach(collectStyles));
  assert.deepEqual(explicitStyles,expected.paragraphStyles,source.id+' paragraph style mapping');
  const flattened=[];const flatten=n=>{flattened.push(n);(n.children||[]).forEach(flatten);};doc.sections.forEach(s=>s.nodes.forEach(flatten));
  for(const [name,key]of [['p','paragraphDirect'],['r','runDirect']]){
    const nodes=flattened.filter(n=>n.properties?.nativeName===name);
    expected[key].forEach((properties,i)=>{for(const [key,value]of Object.entries(properties))assert.deepEqual(nodes[i].properties.direct[key],value,source.id+' direct '+name+' '+i+' '+key);});
  }
  assert.equal(doc.sections.length,source.sections.length,source.id+' sections');
  source.sections.forEach((s,i)=>{const p=doc.sections[i].properties.page;for(const [a,k]of [['w','widthMm'],['h','heightMm']])if(s.size[a])assert.equal(p[k],Number(s.size[a])*25.4/1440);for(const [a,k]of [['left','leftMm'],['right','rightMm'],['top','topMm'],['bottom','bottomMm']])if(s.margins[a])assert.equal(p.margins[k],Number(s.margins[a])*25.4/1440);});
  for(const id of source.styleIds)assert.ok(doc.styles[id],source.id+' missing style '+id);
  for(const [id,parent]of Object.entries(source.styleInheritance))assert.equal(doc.styles[id].basedOn,parent,source.id+' style parent '+id);
  for(const [part,expectedStory]of Object.entries(source.stories)){
    if(part==='word/document.xml')continue;
    let nodes;
    if(/(?:foot|end)notes/.test(part))nodes=Object.values(doc.notes).filter(n=>part.includes(n.kind+'s')).flatMap(n=>n.nodes);
    else {const refs=doc.sections.flatMap(s=>Object.values(s.properties.headerFooterReferences.header).concat(Object.values(s.properties.headerFooterReferences.footer)));nodes=refs.find(r=>r.part===part)?.nodes;if(!nodes){assert.equal(expectedStory.text.length,0,source.id+' unused story '+part);continue;}}
    const actualStory=story(nodes);for(const [key,count]of Object.entries(expectedStory.counts))assert.equal(actualStory.counts[key]||0,count,source.id+' '+part+' '+key);assert.deepEqual(actualStory.text,expectedStory.text,source.id+' '+part+' text');
  }
  let note=installContentDocument({title:source.id,researchData:{thesis:{templateId:generic.id}}},doc);
  const before=JSON.stringify(note.researchData.thesis.document);
  note=noteFromPayload(JSON.parse(JSON.stringify(buildNotePayload({noteId:source.id,note,deviceId:'mission03',updatedAt:0}))));
  assert.equal(JSON.stringify(note.researchData.thesis.document),before,source.id+' save/load');
  const compiled=compileThesisDocument(generic,note.researchData.thesis,note.title,note.content);
  assert.equal(compiled.sections.length,doc.sections.length,source.id+' editor sections');
  assert.ok(doc.source.unsupported.every(i=>i.locator&&i.code&&i.preserved));
  result.cases.push({id:source.id,status:'PASS',sections:doc.sections.length,bodyParagraphs:actual.counts.p||0,bodyRuns:actual.counts.r||0,bodyTextNodes:actual.text.length,parts:Object.keys(original).length,issues:doc.source.unsupported.length,sourceSha256:doc.source.sha256});
  console.log(source.id+' PASS');
}
writeFileSync(resolve(root,'orchestration/engine-work/mission03/source-verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,cases:result.cases.length}));
