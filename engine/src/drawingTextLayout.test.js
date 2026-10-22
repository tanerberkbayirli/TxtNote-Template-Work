import {it} from 'node:test';
import assert from 'node:assert/strict';
import {drawingTextLines} from './docx/drawingTextLayout.js';
import {drawingGroupPreview,drawingShapePreview} from './docx/drawingPreview.js';
import {DOMParser} from '@xmldom/xmldom';
import {thesisSourceHtml} from './sourceHtml.js';
it('does not save measured presentation lines or their source visibility stamp',()=>{
 const source='<svg><g data-docx-group-text="source"><text>Native text</text></g></svg>';
 const measured='<svg><g data-docx-group-text="source" visibility="hidden" data-thesis-group-text-source=""><text>Native text</text></g><g data-thesis-group-text-layer=""><text>Native</text><text>text</text></g></svg>';
 assert.equal(thesisSourceHtml(measured),source);
});
it('retains the minimum native Word end-mark size on thin lines',()=>{
 for(const [weight,length]of [[.5,6],[.75,6],[1.5,6],[3,9],[6,18]]){
  const view=drawingShapePreview({widthPt:200,heightPt:0,geometry:'straightConnector1',line:'#000000',lineWidthPt:weight,tailEnd:{type:'triangle',width:'med',length:'med'}});
  const points=view.children[1].attributes.points.split(' ').map(p=>p.split(',').map(Number));
  assert.equal(200-Math.min(...points.map(p=>p[0])),length);
  assert.equal(Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1])),length);
 }
});
it('wraps words and overlong labels without dropping characters or rich runs',()=>{
 const first={text:'Economy ',size:10},second={text:'and jobs',size:12,bold:true};
 const p={runs:[first,second]}, measure=s=>s.length;
 const lines=drawingTextLines(p,5,measure);
 assert.deepEqual(lines.map(l=>l.map(p=>p.text).join('')),['Econo','my ','and ','jobs']);
 assert.ok(lines.flat().find(p=>p.text==='jobs').run.bold);
 assert.equal(drawingTextLines(p,5,measure,false).length,1);
});
it('keeps bent connectors open and places arrowheads along the terminal segment',()=>{
 const view=drawingShapePreview({widthPt:80,heightPt:70,geometry:'bentConnector3',geometryAdjustments:{adj1:-40324},flipH:true,line:'#000000',tailEnd:{type:'triangle',width:'med',length:'med'}});
 assert.equal(view.children[0].tag,'polyline');
 assert.equal(view.children[0].attributes.fill,'none');
 const points=view.children[0].attributes.points.split(' ').map(p=>p.split(',').map(Number));
 assert.deepEqual(points[0],[80,0]);assert.deepEqual(points.at(-1),[0,70]);assert.ok(points[1][0]>80);
 const tip=view.children[1].attributes.points.split(' ')[1];assert.equal(tip,'0,70');
});
it('projects numeric custom connector paths with source rotation and an independent text frame',()=>{
 const xml='<d:sp xmlns:d="urn:test" xmlns:a="urn:drawing"><d:spPr><a:xfrm rot="5400000"><a:off x="127000" y="254000"/><a:ext cx="254000" cy="127000"/></a:xfrm><a:custGeom><a:pathLst><a:path><a:moveTo><a:pt x="0" y="63500"/></a:moveTo><a:lnTo><a:pt x="254000" y="63500"/></a:lnTo></a:path></a:pathLst></a:custGeom><a:noFill/></d:spPr><d:txBody><a:bodyPr anchor="ctr"/><a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="1400"/><a:t>Label</a:t></a:r></a:p></d:txBody><d:txXfrm><a:off x="381000" y="508000"/><a:ext cx="508000" cy="254000"/></d:txXfrm></d:sp>';
 const v=drawingGroupPreview(new DOMParser().parseFromString(xml,'text/xml').documentElement,{widthPt:100,heightPt:100});
 assert.equal(v.children[0].attributes.transform,'rotate(90 20 25)');
 assert.equal(v.children[0].children[0].attributes.d,'M10 25L30 25');
 const model=JSON.parse(v.children[1].attributes['data-docx-group-text']);
 assert.equal(model.x,30);assert.equal(model.width,40);assert.equal(model.anchor,'ctr');assert.equal(model.paragraphs[0].runs[0].size,14);
});
