import{test}from'node:test';import assert from'node:assert/strict';import{orientedTextGeometry,insetRotatedRect}from'./pdfTextGeometry.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('a -90 degree source text frame rotates its baseline and preserves the full word advance',()=>{
 const r=orientedTextGeometry({left:100,top:200,width:18,height:72},-90,14);close(r.x,114);close(r.baseline,272);close(r.width,72);close(r.angle,90);
});
test('content-box padding rotates with the frame instead of clipping the vertical word horizontally',()=>{
 const r=insetRotatedRect({left:100,top:200,width:36,height:96},-90,{left:10,right:10,top:4,bottom:4});close(r.left,104);close(r.top,210);close(r.width,28);close(r.height,76);
});
test('horizontal and 180 degree text use the same physical rectangle',()=>{
 const r=orientedTextGeometry({left:100,top:200,width:72,height:18},180,14);close(r.x,172);close(r.baseline,204);close(r.width,72);
 const h=orientedTextGeometry({left:100,top:200,width:72,height:18},0,14);close(h.x,100);close(h.baseline,214);
});
