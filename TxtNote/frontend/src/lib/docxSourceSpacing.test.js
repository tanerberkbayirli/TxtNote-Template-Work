import {describe,it} from 'node:test';import assert from 'node:assert/strict';
import {importedContentCss} from '../../../../engine/src/docx/projection.js';
const paragraph=(id,properties={},children=[])=>({id,type:'paragraph',tag:'p',properties,children});
const doc=(nodes,styles={})=>({source:{format:'docx'},formatMode:'source',styles,sections:[{nodes,properties:{rules:{body:{fontFamily:'Times New Roman',fontSizePt:12}}}}]});
describe('imported source paragraph spacing',()=>{
 it('enables source kerning only at its declared font-size threshold and respects zero',()=>{
  const run={id:'r',type:'run',tag:'span',properties:{resolvedSource:{fontSizePt:12,kerningMinPt:1.5}},children:[{type:'text',text:'AV'}]};
  const d=doc([paragraph('p',{},[run])]);
  assert.match(importedContentCss(d),/"r"\]\[data-txt-node-id\]\{font-size:12pt;font-kerning:normal/);
  for(const threshold of[0,15]){run.properties.resolvedSource.kerningMinPt=threshold;assert.match(importedContentCss(d),/"r"\]\[data-txt-node-id\]\{font-size:12pt;font-kerning:none/)}
 });
 it('lets source tabs wrap at the text edge instead of hanging trailing whitespace',()=>{
  const d=doc([paragraph('p',{},[{id:'tab',type:'tab',tag:'span',children:[{type:'text',text:'\t'}]}])]);
  assert.match(importedContentCss(d),/"tab"\]\[data-txt-node-id\]\{white-space:break-spaces\}/);
  assert.match(importedContentCss(d),/"tab"\]\[data-txt-node-id\]::before\{content:"";display:inline-block;width:0\}/);
  assert.equal(d.sections[0].nodes[0].children[0].children[0].text,'\t');
  d.sections[0].nodes[0].children.push({type:'text',text:'following content'});
  assert.doesNotMatch(importedContentCss(d),/white-space:break-spaces/);
  d.sections[0].nodes[0].children.pop();
  d.formatMode='template';assert.doesNotMatch(importedContentCss(d),/white-space:break-spaces/);
 });
 it('applies a repeating source tab interval at paragraphs above the editor whitespace default',()=>{
  const d=doc([paragraph('p')]);d.source.defaultTabStopMm=12.488333333333333;
  assert.match(importedContentCss(d),/\.thesis-paper \.thesis-body p\{tab-size:12\.488333333333333mm\}/);
  d.formatMode='template';assert.doesNotMatch(importedContentCss(d),/tab-size:/);
  d.formatMode='source';d.source.defaultTabStopMm=Infinity;assert.doesNotMatch(importedContentCss(d),/tab-size:/);
  delete d.source.defaultTabStopMm;assert.doesNotMatch(importedContentCss(d),/tab-size:/);
 });
 it('keeps an empty page-section marker on the preceding paragraph without deleting source',()=>{
  const marker=paragraph('section-end',{paragraphPropertiesXml:'<w:pPr><w:sectPr/></w:pPr>'});
  const d=doc([paragraph('blank'),marker]);
  d.sections.push({properties:{breakType:'nextPage'},nodes:[paragraph('after')]});
  const before=JSON.stringify(d);
  assert.match(importedContentCss(d),/p\[data-txt-node-id="section-end"\]\[data-txt-node-id\]\{display:none !important\}/);
  assert.equal(JSON.stringify(d),before);
  marker.children=[{type:'text',text:'Authored section ending'}];
  assert.doesNotMatch(importedContentCss(d),/p\[data-txt-node-id="section-end"\]\[data-txt-node-id\]\{display:none/);
  marker.children=[];d.sections[1].properties.breakType='continuous';
  assert.doesNotMatch(importedContentCss(d),/p\[data-txt-node-id="section-end"\]\[data-txt-node-id\]\{display:none/);
  d.sections[1].properties.breakType='nextPage';d.sections[0].nodes[0]={type:'table',children:[]};
  assert.match(importedContentCss(d),/p\[data-txt-node-id="section-end"\]\[data-txt-node-id\]\{display:none/);
  marker.properties.paragraphPropertiesXml='<w:pPr/>';
  assert.doesNotMatch(importedContentCss(d),/p\[data-txt-node-id="section-end"\]\[data-txt-node-id\]\{display:none/);
 });
 it('restores ordinary word spaces for explicitly non-justified source paragraphs',()=>{
  const css=importedContentCss(doc([paragraph('p',{resolvedSource:{align:'center'}},[{type:'text',text:'İnsan Kaynakları Müdürü'}])]));
  assert.match(css,/"p"\]\[data-txt-node-id\]\{text-align:center;word-spacing:0/);
 });
 it('does not add a line for a section mark inside a content control, while keeping ordinary table tails and native data',()=>{
  const marker=paragraph('sdt-end',{paragraphPropertiesXml:'<w:pPr><w:sectPr/></w:pPr>'});
  const control={id:'control',type:'container',properties:{nativeName:'sdt'},children:[paragraph('entry',{},[{type:'text',text:'Last index entry'}]),marker]};
  const d=doc([control]);d.sections.push({properties:{breakType:'oddPage'},nodes:[paragraph('next')]});
  const before=JSON.stringify(d);
  assert.match(importedContentCss(d),/p\[data-txt-node-id="sdt-end"\]\[data-txt-node-id\]\{display:none !important\}/);
  assert.equal(JSON.stringify(d),before);
  control.children[0]={type:'table',children:[]};
  assert.match(importedContentCss(d),/p\[data-txt-node-id="sdt-end"\]\[data-txt-node-id\]\{display:none/);
  marker.properties.paragraphPropertiesXml='';
  assert.doesNotMatch(importedContentCss(d),/p\[data-txt-node-id="sdt-end"\]\[data-txt-node-id\]\{display:none/);
 });
 it('preserves Caption spacing at a section boundary while retaining plain paragraph suppression',()=>{
  const d=doc([paragraph('old',{resolvedSource:{spaceAfterPt:6}})],{C:{name:'caption'}});
  d.sections.push({properties:{breakType:'nextPage',rules:{body:{}}},nodes:[paragraph('caption',{styleId:'C',resolvedSource:{spaceBeforePt:18,spaceAfterPt:6}})]});
  const css=importedContentCss(d);
  assert.match(css,/p:first-child:not\(\[data-docx-style="C"\]\)\{margin-top:0 !important\}/);
  assert.match(css,/"caption"\]\[data-txt-node-id\]\{[^}]*margin-top:12pt/);
 });
 it('uses the measured Word 12 pt Times script baseline without growing its line box',()=>{
  const p=paragraph('p',{resolvedSource:{}},['subscript','superscript'].map((verticalAlign,i)=>({id:'r'+i,type:'run',properties:{resolvedSource:{fontFamily:'Times New Roman',fontSizePt:12,verticalAlign}},children:[{type:'text',text:'i'}]})));
  const css=importedContentCss(doc([p]));
  assert.match(css,/font-size:8\.04pt;line-height:0;vertical-align:baseline;position:relative;top:0\.96pt/);
  assert.match(css,/font-size:8\.04pt;line-height:0;vertical-align:baseline;position:relative;top:-4\.56pt/);
  p.children[0].properties.resolvedSource.fontSizePt=18;
  assert.match(importedContentCss(doc([p])),/vertical-align:sub;font-size:smaller/);
 });
});
