import{describe,it}from'node:test';import assert from'node:assert/strict';
import{sourceFlowTableIds}from'./tableSemantics.js';import{thesisSourceHtml}from'./sourceHtml.js';
describe('source table fragment guards',()=>{
 it('keeps floating, complex vertical merges, nested and short tables on their existing path',()=>{
  const row={type:'row',properties:{rowPropertiesXml:'<w:trPr><w:trHeight w:val="4000"/></w:trPr>'}};
  const table=(id,children=[],properties={})=>({id,type:'table',children:[row,...children],properties});
  const d={source:{format:'docx'},formatMode:'source',sections:[{properties:{page:{heightMm:80,margins:{topMm:10,bottomMm:10}}},nodes:[table('plain'),table('float',[],{tablePropertiesXml:'<w:tblPr><w:tblpPr w:tblpY="0"/></w:tblPr>'}),table('merge',[{type:'cell',attributes:{rowspan:'3'}}]),table('nested',[{type:'cell',children:[table('inner')]}]),table('multi',[{type:'cell',children:[1,2].map(i=>({type:'paragraph',children:[{type:'text',text:String(i)}]}))}]),{id:'short',type:'table',children:[]}]}]};
  assert.deepEqual([...sourceFlowTableIds(d)],['plain']);
  assert.deepEqual([...sourceFlowTableIds({...d,formatMode:'template'})],[]);
  assert.deepEqual([...sourceFlowTableIds({...d,source:{format:'pdf'}})],[]);
 });
 it('removes only the fragment wrapper when saving native tables and their authored content',()=>{
  const table='<table data-txt-node-id="t"><tbody><tr><td><p>Unchanged &amp; source</p></td></tr></tbody></table>';
  assert.equal(thesisSourceHtml(`<txt-table-flow>${table}</txt-table-flow><p>AFTER</p>`),`${table}<p>AFTER</p>`);
 });
});
