import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {firstShapeLineY,anchorOverflowsPage} from '../../../../engine/src/docx/drawingWrap.js';
describe('Word empty anchor line clearance',()=>{
 it('moves a paragraph-relative frame which fits a page but overflows the remaining room',()=>{
  assert.equal(anchorOverflowsPage(720,202,71,760),true);
  assert.equal(anchorOverflowsPage(71,202,71,760),false);
  assert.equal(anchorOverflowsPage(720,30,71,760),false);
  assert.equal(anchorOverflowsPage(720,800,71,760),false);
 });
 it('keeps the line when a side corridor is wide enough',()=>{
  assert.equal(firstShapeLineY([{left:50,right:100,top:0,bottom:40}],150,20,32),0);
 });
 it('unions rectangles over the whole line height, even if their vertical bands differ',()=>{
  const boxes=[{left:0,right:80,top:0,bottom:15},{left:70,right:150,top:10,bottom:40}];
  assert.equal(firstShapeLineY(boxes,150,20,32),15);
 });
 it('uses the first available corridor rather than always the last shape bottom',()=>{
  const boxes=[{left:0,right:80,top:0,bottom:40},{left:70,right:150,top:0,bottom:20}];
  assert.equal(firstShapeLineY(boxes,150,20,32),20);
 });
 it('ignores shapes outside the column and completed bands',()=>{
  assert.equal(firstShapeLineY([{left:160,right:200,top:0,bottom:40},{left:0,right:150,top:-50,bottom:0}],150,20,32),0);
 });
 it('clears consecutive full bands and tolerates a narrow column',()=>{
  assert.equal(firstShapeLineY([{left:-1,right:151,top:0,bottom:20},{left:0,right:150,top:20,bottom:50}],150,20,32),50);
  assert.equal(firstShapeLineY([],20,20,32),0);
 });
});
