import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {wordFitBudget,fitWordLines,splitOversizedWords,wordMeasureDeltaPx} from '../../../../engine/src/wordLineFit.js';
import {thesisSourceHtml} from '../../../../engine/src/sourceHtml.js';
describe('Word justification decisions and source preservation',()=>{
 it('short final words restrict compression despite many gaps',()=>{
  assert.ok(wordFitBudget(14,3.7,7)<wordFitBudget(14,3.7,26));
  assert.ok(wordFitBudget(14,3.7,26)<.25*14*3.7);
 });
 it('counts typed indentation spaces in the first line width and squeezes them with the other spaces',()=>{
  const words=[{width:40,space:0},{width:40,space:4}];
  // Without the 16 px of leading spaces the line (84) fits 90; with them (100) it needs 10 px of the 25 % budget (3 gaps x 4 x .25 = 3), so it breaks.
  assert.deepEqual(fitWordLines(words,90).map(l=>[l.start,l.end]),[[0,2]]);
  assert.deepEqual(fitWordLines(words,90,0,{count:4,width:16}).map(l=>[l.start,l.end]),[[0,1],[1,2]]);
  const fits=fitWordLines(words,98,0,{count:4,width:16});
  assert.deepEqual(fits.map(l=>[l.start,l.end]),[[0,2]]);
  assert.ok(fits[0].compression>0);
 });
 it('chooses a fitted prefix without compressing the final natural line',()=>{
  const words=[30,30,30,30,30].map(width=>({width,space:4}));
  const lines=fitWordLines(words,97);assert.deepEqual(lines.map(l=>[l.start,l.end]),[[0,3],[3,5]]);
  assert.ok(lines[0].compression>0);assert.equal(lines[1].compression,0);
 });
 it('first-line indentation applies only once and oversized tokens remain intact',()=>{
  const lines=fitWordLines([{width:110,space:0},{width:20,space:4},{width:20,space:4}],100,10);
  assert.deepEqual(lines.map(l=>[l.start,l.end]),[[0,1],[1,3]]);
  assert.equal(lines[0].measure,90);assert.equal(lines[1].measure,100);
 });
 it('strips only transient plain-text wrappers and retains native runs and authored breaks',()=>{
  const html='<p data-txt-node-id="p1"><span data-txt-node-id="r1"><span data-thesis-word-fit="0" style="word-spacing:-1px">Çığ &amp; Işık </span></span><b><span data-thesis-word-fit="1">kalın</span></b><br></p>';
  assert.equal(thesisSourceHtml(html),'<p data-txt-node-id="p1"><span data-txt-node-id="r1">Çığ &amp; Işık </span><b>kalın</b><br></p>');
 });
 it('long glyph fragments preserve text, surrogate pairs and the first-line measure',()=>{
  const text='ab😀cdefgh',advance=(a,b)=>[...text.slice(a,b)].length*10;
  const parts=splitOversizedWords([{start:0,end:text.length,width:90,space:0}],40,text,advance,10);
  assert.deepEqual(parts.map(p=>text.slice(p.start,p.end)),['ab😀','cdef','gh']);
  assert.equal(parts.map(p=>text.slice(p.start,p.end)).join(''),text);
  assert.ok(parts.every(p=>p.space===0));
  assert.deepEqual(fitWordLines(parts,40,10).map(l=>[l.start,l.end]),[[0,1],[1,2],[2,3]]);
 });
 it('a token continuation cannot borrow a fictitious space compression budget',()=>{
  const lines=fitWordLines([{width:100,space:0},{width:2,space:0}],100);
  assert.equal(lines.length,2);assert.equal(lines[0].compression,0);
 });
 it('Word adds no fit tolerance beyond its 25 % space budget and measures twip-rounded margins',()=>{
  // 8 gaps of 4 px, budget 8 px: 0.04 px over breaks, exactly on the budget fits.
  const words=[{width:500,space:0},...Array.from({length:8},()=>({width:30,space:4}))];
  const natural=500+8*34;
  assert.equal(fitWordLines(words,natural-8-.04).length,2);
  assert.equal(fitWordLines(words,natural-8).length,1);
  const delta=wordMeasureDeltaPx({widthMm:210,margins:{leftMm:30,rightMm:25}});
  assert.ok(Math.abs(delta-(439.4-155*72/25.4)*96/72)<1e-9&&delta>0);
  assert.equal(wordMeasureDeltaPx({widthMm:210,margins:{leftMm:30,rightMm:25},docxMargins:{leftMm:20,rightMm:20}}),0);
 });
 it('presentation break opportunities never enter persisted source',()=>{
  assert.equal(thesisSourceHtml('<p><span data-thesis-word-fit="0">https://a</span><wbr data-thesis-word-fit-break=""><span data-thesis-word-fit="1">bc</span></p>'),'<p>https://abc</p>');
 });
});

it("word-fit never measures vertical-writing paragraphs against the cell thickness", async () => {
  // Needs a live layout engine to exercise; the guard itself is the contract (btLr/tbRl header cells were cut mid-word: "Faa|aliyet").
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../../../../engine/src/wordLineLayout.js", import.meta.url), "utf8");
  assert.match(source, /\/\^\(vertical\|sideways\)\/\.test\(css\.writingMode\)/);
});
