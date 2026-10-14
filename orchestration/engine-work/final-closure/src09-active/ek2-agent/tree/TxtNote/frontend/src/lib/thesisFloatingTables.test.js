import { describe,it } from 'node:test';
import assert from 'node:assert/strict';
import {floatingTablePosition} from '../thesis/docx/floatingTables.js';
describe('source floating table positions',()=>{
 it('reads signed twips and distinguishes a floating table from an inline table',()=>{
  assert.equal(floatingTablePosition('<w:tblPr><w:tblW w:w="5000"/></w:tblPr>'),null);
  assert.deepEqual(floatingTablePosition('<w:tblPr><w:tblpPr w:vertAnchor="text" w:horzAnchor="margin" w:tblpXSpec="center" w:tblpY="89"/></w:tblPr>'),{topPt:4.45,leftPt:0,horizontal:'margin',align:'center'});
  assert.equal(floatingTablePosition('<w:tblpPr w:tblpX="-20" w:tblpY="-40"/>').topPt,-2);
 });
 it('leaves page-relative and aligned vertical tables to their existing layout',()=>{
  assert.equal(floatingTablePosition('<w:tblpPr w:vertAnchor="page" w:tblpY="89"/>'),null);
  assert.equal(floatingTablePosition('<w:tblpPr w:tblpYSpec="bottom"/>'),null);
  assert.equal(floatingTablePosition('<w:tblpPr w:tblpY="bad"/>'),null);
 });
});
