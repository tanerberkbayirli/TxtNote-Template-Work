import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceScriptRunFont, sourceScriptFontRequests } from './docx/scriptFonts.js';
import { importedContentCss } from './docx/projection.js';
import { DOMParser } from '@xmldom/xmldom';
import { readRunProperties } from './docx/properties.js';
const run = (text, style={}, xml='') => ({id:'quote',type:'run',children:[{type:'text',text}],properties:{resolvedSource:{fontFamily:'Times New Roman',fontHint:'eastAsia',...style},runPropertiesXml:xml}});
const doc = nodes => ({formatMode:'source',source:{format:'docx'},sections:[{nodes,properties:{rules:{body:{fontFamily:'Times New Roman',fontSizePt:12}}}}]});
test('East Asian hint and explicit font survive run property parsing',()=>{
 const root=new DOMParser().parseFromString('<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:rFonts w:ascii="Times New Roman" w:hint="eastAsia" w:eastAsia="MS Mincho"/></w:rPr>','application/xml').documentElement;
 assert.deepEqual(readRunProperties(root),{fontFamily:'Times New Roman',fontHint:'eastAsia',eastAsiaFontFamily:'MS Mincho'});
});
test('isolated hinted punctuation uses the East Asian face without changing Latin or unhinted text',()=>{
 assert.equal(sourceScriptRunFont(run('“')),'MS Mincho');
 assert.equal(sourceScriptRunFont(run('”',{eastAsiaFontFamily:'SimSun'})),'SimSun');
 assert.equal(sourceScriptRunFont(run('“',{eastAsiaFontFamily:'Times New Roman',fontFamily:'Arial'})),'Arial');
 assert.equal(sourceScriptRunFont(run('“',{fontHint:'default'})),null);
 assert.equal(sourceScriptRunFont(run('Latin “mixed” text')),null);
 assert.equal(sourceScriptRunFont(run('“',{fontHint:undefined},'<w:rPr><w:rFonts w:hint="eastAsia"/></w:rPr>')),'MS Mincho');
});
test('source font requests and preview share the chosen face, preserving stored runs and XML',()=>{
 const input=doc([run('“'),run('”')]),before=JSON.stringify(input);
 assert.deepEqual(sourceScriptFontRequests(input),['MS Mincho']);
 assert.match(importedContentCss(input),/font-family:"MS Mincho"/);
 assert.equal(JSON.stringify(input),before);
 input.formatMode='template';
 assert.deepEqual(sourceScriptFontRequests(input),[]);
 assert.doesNotMatch(importedContentCss(input),/font-family:"MS Mincho"/);
});
test('source list fragments reserve a single Word twip and cancel it in normal flow',()=>{
 const p={id:'list-p',type:'paragraph',children:[],properties:{list:{paragraph:{leftIndentMm:12.7,hangingIndentMm:6.35}},resolvedSource:{lineSpacing:{rule:'auto',value:1.5}},direct:{}}};
 const list={id:'list',type:'list',children:[{id:'item',type:'listItem',children:[p],properties:{}}],properties:{}};
 const css=importedContentCss(doc([list]));
 assert.match(css,/box-decoration-break:clone;padding-bottom:0\.05pt/);
 assert.match(css,/margin-bottom:-0\.05pt/);
 p.properties.resolvedSource.lineSpacing={rule:'exact',value:14};
 assert.doesNotMatch(importedContentCss(doc([list])),/padding-bottom:0\.05pt/);
});
test('the first-line Symbol marker uses one inline strut when paragraph guards clone',()=>{
 const p={id:'list-p',type:'paragraph',children:[{id:'first-run',type:'run',children:[{type:'text',text:'First line'}],properties:{}}],properties:{list:{run:{fontFamily:'Symbol'},paragraph:{leftIndentMm:12.7,hangingIndentMm:6.35}},resolvedSource:{lineSpacing:{rule:'auto',value:1.5}},direct:{}}};
 const list={id:'list',type:'list',children:[{id:'item',type:'listItem',children:[p],properties:{}}],properties:{}};
 const css=importedContentCss(doc([list]));
 assert.match(css,/"list-p"\]\[data-txt-node-id\]\{padding-top:0\}/);
 assert.match(css,/"first-run"\]\[data-txt-node-id\]::before\{content:"";display:inline-block;width:0;height:calc\(/);
 assert.doesNotMatch(css,/"item"\]\[data-txt-node-id\]\{padding-top:/);
});
