const radians=degrees=>degrees*Math.PI/180;
function dimensions(box,angle,estimatedWidth){
  const a=Math.abs(Math.cos(radians(angle))),b=Math.abs(Math.sin(radians(angle))),det=a*a-b*b;
  if(Math.abs(det)>1e-6)return {width:Math.max(0,(a*box.width-b*box.height)/det),height:Math.max(0,(a*box.height-b*box.width)/det)};
  const width=estimatedWidth||box.width,height=Math.max(0,(box.height-b*width)/(a||1));return{width,height};
}
const bounds=points=>({left:Math.min(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),right:Math.max(...points.map(p=>p[0])),bottom:Math.max(...points.map(p=>p[1]))});
function frame(box,angle,estimatedWidth){
  const {width,height}=dimensions(box,angle,estimatedWidth),c=Math.cos(radians(angle)),s=Math.sin(radians(angle));
  const rotate=(x,y)=>[c*x-s*y,s*x+c*y];
  const extent=bounds([[0,0],rotate(width,0),rotate(0,height),rotate(width,height)]);
  return{width,height,origin:[box.left-extent.left,box.top-extent.top],rotate};
}
/** CSS angle (clockwise in page coordinates), unrotated font ascent. */
export function orientedTextGeometry(box,angle,ascent,estimatedWidth){
  const f=frame(box,angle,estimatedWidth),baseline=f.rotate(0,ascent);
  return{x:f.origin[0]+baseline[0],baseline:f.origin[1]+baseline[1],width:f.width,height:box.height,angle:-angle};
}
/** Content-box clipping of a rotated frame (exact for orthogonal rotations). */
export function insetRotatedRect(box,angle,{left=0,top=0,right=0,bottom=0}){
  const f=frame(box,angle),points=[[left,top],[f.width-right,top],[left,f.height-bottom],[f.width-right,f.height-bottom]].map(p=>{const q=f.rotate(...p);return[q[0]+f.origin[0],q[1]+f.origin[1]];});
  const r=bounds(points);return{left:r.left,top:r.top,width:Math.max(0,r.right-r.left),height:Math.max(0,r.bottom-r.top)};
}
