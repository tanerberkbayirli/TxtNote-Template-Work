import {describe,it} from 'node:test';import assert from 'node:assert/strict';
import {importedContentCss} from '../thesis/docx/projection.js';
const paragraph=(id,properties={},children=[])=>({id,type:'paragraph',tag:'p',properties,children});
const doc=(nodes,styles={})=>({source:{format:'docx'},formatMode:'source',styles,sections:[{nodes,properties:{rules:{body:{fontFamily:'Times New Roman',fontSizePt:12}}}}]});
describe('imported source paragraph spacing',()=>{
 it('restores ordinary word spaces for explicitly non-justified source paragraphs',()=>{
  const css=importedContentCss(doc([paragraph('p',{resolvedSource:{align:'center'}},[{type:'text',text:'İnsan Kaynakları Müdürü'}])]));
  assert.match(css,/"p"\]\[data-txt-node-id\]\{text-align:center;word-spacing:0/);
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
