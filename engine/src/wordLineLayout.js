import {fitWordLines,splitOversizedWords,hyphenBreakOffsets,wordMeasureDeltaPx} from './wordLineFit.js';
import {thesisSourceHtml} from './sourceHtml.js';
const KNOWN=new Set(['times new roman','arial','calibri']);
const cache=new WeakMap(),fontVersions=new WeakMap();
const sourceMemo=new WeakMap(),appliedFast=new WeakMap();
const settledRoots=new WeakMap();
const styleVersions=new WeakMap();
const environmentVersions=new WeakMap();
function sourceOf(p){const html=p.innerHTML,known=sourceMemo.get(p);if(known&&known[0]===html)return known[1];const out=thesisSourceHtml(html);sourceMemo.set(p,[html,out]);return out;}
const family=s=>s.split(',')[0].replace(/["']/g,'').trim().toLowerCase();
// Canvas quantizes small font sizes. Measure at exactly 1000 px, then scale the
// original point size; Word's 0.05 pt binary-search thresholds confirm these
// font-program advances for TNR/Arial/Calibri, including unbroken URL suffixes.
export const canvasRunFont=style=>`${style.fontStyle} ${style.fontWeight} 1000px ${style.fontFamily}`;
function fontVersion(doc){
  if(!fontVersions.has(doc)){const value={version:0};fontVersions.set(doc,value);doc.fonts?.addEventListener('loadingdone',()=>value.version++);}
  return fontVersions.get(doc).version;
}
const BLOCK='p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th,pre,figcaption';
// A caret at a paragraph boundary has the same flat text offset at the end of one block and the
// start of the next, so the bookmark is block-relative (Enter used to land back in the first half).
function selectionBookmark(root){
  const s=root.ownerDocument.getSelection();if(!s?.anchorNode||!root.contains(s.anchorNode)||!root.contains(s.focusNode))return null;
  const point=(node,index)=>{
    const from=(node.nodeType===1?node:node.parentElement)?.closest(BLOCK);const base=from&&root.contains(from)?from:root;
    const r=root.ownerDocument.createRange();r.selectNodeContents(base);r.setEnd(node,index);
    return {block:base===root?null:base,offset:r.toString().length};
  };
  return {anchor:point(s.anchorNode,s.anchorOffset),focus:point(s.focusNode,s.focusOffset)};
}
function restoreSelection(root,mark){
  if(!mark)return;
  const locate=({block,offset})=>{if(block&&!(block.isConnected&&root.contains(block)))return null;const base=block||root;let index=offset;
    const w=root.ownerDocument.createTreeWalker(base,4);let n,last;
    while(n=w.nextNode()){last=n;if(index<=n.length)return [n,index];index-=n.length;}return last?[last,last.length]:[base,0];};
  const a=locate(mark.anchor),f=locate(mark.focus);if(!a||!f)return;root.ownerDocument.getSelection()?.setBaseAndExtent(a[0],a[1],f[0],f[1]);
}

/** Per-line space compression only. Wrap plain text pieces inside their original
 * run elements: authored styles, links, IDs and text are never cloned or moved
 * across runs. Source serialization unwraps these transient spans. */
export function layoutWordJustification(root,model){
  if(!root||!model||root.__thesisComposing)return false;
  const doc=root.ownerDocument,version=fontVersion(doc),ctx=doc.createElement('canvas').getContext('2d'),widthCache=new Map();
  ctx.fontKerning='none';let changed=false,mark=null;
  const unwrap=p=>{p.querySelectorAll('wbr[data-thesis-word-fit-break]').forEach(n=>n.remove());const spans=[...p.querySelectorAll('span[data-thesis-word-fit]')];
    if(spans.length){if(!changed)mark=selectionBookmark(root);spans.forEach(span=>span.replaceWith(...span.childNodes));p.normalize();changed=true;}cache.delete(p);appliedFast.delete(p);};
  // Read every paragraph first, mutate afterwards: interleaved reads and writes force one layout per paragraph.
  const todo=[],fastQueue=[];
  // One document pass instead of a :is() selector per section (that was O(sections x nodes) on every measurement).
  const sections=new Map((model.sections||[]).map(section=>[String(section.id),section]));
  const styleText=[...doc.querySelectorAll('style')].map(node=>node.textContent).join('\u0000');
  let styles=styleVersions.get(doc);
  if(!styles){styles={text:styleText,version:0};styleVersions.set(doc,styles);}
  else if(styles.text!==styleText){styles.text=styleText;styles.version++;}
  const styleEpoch=styles.version;
  const inherited=getComputedStyle(root);
  const environment=[inherited.font,inherited.letterSpacing,inherited.wordSpacing,inherited.textTransform,
    ...[...doc.styleSheets].map(sheet=>`${sheet.href||''}:${sheet.disabled}:${sheet.media?.mediaText||''}`)];
  for(let node=root.parentElement;node;node=node.parentElement)environment.push(node.className,node.getAttribute('style'),node.getAttribute('dir'));
  const environmentKey=environment.join('|');
  let environmentState=environmentVersions.get(root);
  if(!environmentState){environmentState={key:environmentKey,version:0};environmentVersions.set(root,environmentState);}
  else if(environmentState.key!==environmentKey){environmentState.key=environmentKey;environmentState.version++;}
  // Fixed-point confirmation measures the same DOM on successive frames. Reuse
  // the settled line presentation only if nothing in that DOM, its source model,
  // font generation, stylesheet or available width has changed. takeRecords()
  // observes synchronous edits before the observer callback can run.
  let settled=settledRoots.get(root);
  if(!settled&&typeof MutationObserver!=='undefined'){
    settled={dirty:true};
    settled.observer=new MutationObserver(()=>{settled.dirty=true;});
    settled.observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true});
    settledRoots.set(root,settled);
  }
  const rootWidth=root.getBoundingClientRect().width;
  if(settled){
    if(settled.observer.takeRecords().length)settled.dirty=true;
    if(!settled.dirty&&settled.model===model&&settled.version===version&&settled.styleEpoch===styleEpoch&&settled.width===rootWidth&&settled.environmentKey===environmentKey)return false;
  }
  const hostsBySection=new Map();
  for(const p of root.querySelectorAll('.thesis-body :is(p,h1,h2,h3,h4,h5,h6)')){
    const host=p.closest('[data-thesis-section],[data-thesis-flow-section]');if(!host)continue;
    const id=host.getAttribute('data-thesis-section')??host.getAttribute('data-thesis-flow-section');
    if(!sections.has(id))continue;
    (hostsBySection.get(id)||hostsBySection.set(id,[]).get(id)).push(p);
  }
  for(const [id,hosts] of hostsBySection){
    const section=sections.get(id);
    for(const p of hosts){
      // Opaque drawing paragraphs can contain megabytes of image/XML markup.
      // They never enter this line fitter, so do not serialize innerHTML or
      // measure their computed typography for an unused fast-cache key.
      if(p.tagName!=='P'||section.rules.justify==='browser'||p.querySelector('br,img,svg,math,.math-formula,[data-thesis-tab],[data-thesis-mirror-narrow],[contenteditable="false"]')||p.closest('[data-thesis-generated]')){todo.push(()=>unwrap(p));continue;}
      // A paragraph whose markup and governing style are unchanged since its last settled layout is skipped outright.
      let fastKey=null;
      if(p.tagName==='P'){const c=getComputedStyle(p);fastKey=[version,styleEpoch,environmentState.version,c.width,c.textIndent,c.textAlign,c.fontFamily,c.fontSize,c.fontWeight,c.fontStyle,c.letterSpacing,c.wordSpacing,c.textTransform,c.direction,c.paddingLeft,c.paddingRight,section.rules.justify].join('|');
        const done=appliedFast.get(p);if(done&&done.key===fastKey&&done.html===p.innerHTML)continue;}
      // Nested table paragraphs belong to their own layout; tabs, equations and
      // page-fragment mirror floats keep their existing specialized paths.
      // A no-wrap paragraph (w:noWrap cell) never breaks, so there is no line fit to compute.
      // A vertical-writing paragraph (w:textDirection btLr/tbRl cell) has its measure on the block axis: css.width is the cell's thickness, not
      // the line length. Fitting against it cut words mid-word ("Faa|aliyet"); the browser lays these lines out natively.
      const css=getComputedStyle(p);if(css.textAlign!=='justify'||css.whiteSpace==='nowrap'||/^(vertical|sideways)/.test(css.writingMode)||!KNOWN.has(family(css.fontFamily))){todo.push(()=>unwrap(p));continue;}
      const width=parseFloat(css.width)-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth);
      if(!(width>0)){todo.push(()=>unwrap(p));continue;}
      const entries=[];let text='';const walker=doc.createTreeWalker(p,4);
      while(walker.nextNode()){
        const node=walker.currentNode;if(!node.length)continue;
        const style=getComputedStyle(node.parentElement),font=canvasRunFont(style);
        entries.push({node,start:text.length,end:text.length+node.length,font,kerning:style.fontKerning==='normal'?'normal':'none',size:Math.round(parseFloat(style.fontSize)*.75*1000)/1000/ .75,spacing:parseFloat(style.letterSpacing)||0,transform:style.textTransform});text+=node.data;
      }
      if(!text.trim()||/[\t\r\n]/.test(text)||entries.some(e=>e.transform!=='none')){todo.push(()=>unwrap(p));continue;}
      const signature=JSON.stringify([sourceOf(p),width,css.textIndent,version,entries.map(e=>[e.font,e.size,e.spacing,e.kerning]).filter((v,i,a)=>!i||JSON.stringify(v)!==JSON.stringify(a[i-1]))]);
      if(cache.get(p)===signature){fastQueue.push([p,fastKey]);continue;}
      const advance=(start,end)=>{
        let result=0;
        for(const entry of entries){const a=Math.max(start,entry.start),b=Math.min(end,entry.end);if(a>=b)continue;
          const value=text.slice(a,b),key=entry.font+'|'+entry.kerning+'|'+value;let measured=widthCache.get(key);
          if(measured===undefined){ctx.font=entry.font;ctx.fontKerning=entry.kerning;measured=ctx.measureText(value).width;widthCache.set(key,measured);}
          result+=measured*entry.size/1000+entry.spacing*value.length;
        }return result;
      };
      const matches=[...text.matchAll(/[^ \r\n]+/g)];
      const tokens=matches.flatMap((m,i)=>{
        const space=i?advance(matches[i-1].index+matches[i-1][0].length,m.index):0,end=m.index+m[0].length;
        const cuts=[m.index,...hyphenBreakOffsets(text,m.index,end),end];
        return cuts.slice(0,-1).map((from,k)=>({start:from,end:cuts[k+1],width:advance(from,cuts[k+1]),space:k?0:space}));
      });
      const words=splitOversizedWords(tokens,width,text,advance,parseFloat(css.textIndent)||0);
      // Word fits against its twip-rounded page geometry (wordMeasureDeltaPx); the compression reserve absorbs the tiny difference.
      const leading=matches.length&&matches[0].index>0?{count:matches[0].index,width:advance(0,matches[0].index)}:null;
      const lines=fitWordLines(words,width+wordMeasureDeltaPx(section.rules.page),parseFloat(css.textIndent)||0,leading);
      todo.push(()=>{
      if(!changed)mark=selectionBookmark(root);
      // Unwrap existing presentation without touching authored elements.
      for(const span of p.querySelectorAll('span[data-thesis-word-fit]'))span.replaceWith(...span.childNodes);
      p.querySelectorAll('wbr[data-thesis-word-fit-break]').forEach(n=>n.remove());
      p.normalize();
      const nodes=[];let base=0;const texts=doc.createTreeWalker(p,4);
      while(texts.nextNode()){const node=texts.currentNode;nodes.push({node,start:base,end:base+node.length});base+=node.length;}
      for(const {node,start,end} of nodes){
        const fragment=doc.createDocumentFragment();let at=start;
        for(let n=0;n<lines.length&&at<end;n++){
          const line=lines[n],limit=n+1<lines.length?words[lines[n+1].start].start:text.length;
          if(limit<=at)continue;
          // Word also compresses an overfull final line. Restore natural spaces
          // only when its natural advance fits the measure.
          const tail=n===lines.length-1&&line.compression>0&&line.natural<=line.measure;
          do {
            const word=Math.max(line.start,words.findLastIndex(w=>w.start<=at));
            const oversized=words[word].fragment;
            const stop=(tail||oversized)&&word+1<words.length?words[word+1].start:Math.min(limit,...words.filter(w=>w.fragment&&w.start>at).map(w=>w.start));
            const to=Math.min(end,limit,stop);
            const span=doc.createElement('span');span.dataset.thesisWordFit=String(n);
            span.style.wordSpacing=`${-line.compression}px`;span.style.fontKerning='inherit';
            if(oversized){span.style.whiteSpace='nowrap';if(at===words[word].start&&word>0&&words[word].space===0){const br=doc.createElement('wbr');br.dataset.thesisWordFitBreak='';fragment.append(br);}}
            if(tail&&word>line.start){span.style.position='relative';span.style.left=`${(word-line.start)*line.compression}px`;}
            span.textContent=text.slice(at,to);fragment.append(span);at=to;
          }while(at<Math.min(end,limit));
        }
        if(at<end)fragment.append(doc.createTextNode(text.slice(at,end)));
        node.replaceWith(fragment);
      }
      cache.set(p,signature);fastQueue.push([p,fastKey]);changed=true;
      });
    }
  }
  for(const apply of todo)apply();
  for(const [p,key] of fastQueue)appliedFast.set(p,{key,html:p.innerHTML});
  if(changed)restoreSelection(root,mark);
  if(settled){settled.observer.takeRecords();Object.assign(settled,{dirty:false,model,version,styleEpoch,width:rootWidth,environmentKey});}
  return changed;
}
