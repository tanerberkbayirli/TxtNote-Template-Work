/** Font families actually used by visible document text, including inline run
 * overrides. PDF export must not silently draw those runs with another family. */
export function renderedFontFamilies(root){
  if(!root)return [];
  const families=new Set(),seen=new WeakSet(),doc=root.ownerDocument;
  const walker=doc.createTreeWalker(root,4);
  while(walker.nextNode()){
    const node=walker.currentNode,el=node.parentElement;
    if(!node.data.trim()||!el||seen.has(el))continue;seen.add(el);
    if(el.closest('button,input,select,textarea,script,style,svg,math,.katex,.math-formula,.sr-only,[data-export-ignore],[data-thesis-editor-only]'))continue;
    const css=getComputedStyle(el);if(css.display==='none'||css.visibility==='hidden')continue;
    const name=css.fontFamily.split(',')[0].replace(/["']/g,'').trim();if(name)families.add(name);
  }
  return [...families];
}

/** FontFaceSet.check alone also returns true for an absent system family.
 * Compare three fallback metrics; this is an availability diagnostic, whereas
 * PDF export verifies the original SFNT name table and embedding permissions. */
export function missingRenderedFonts(root){
  const ctx=root.ownerDocument.createElement('canvas').getContext('2d'),sample='ÇĞİÖŞÜ çğıöşü AVATAR MWil 0123456789';
  return renderedFontFamilies(root).filter(family=>{
    if(/^(serif|sans-serif|monospace|system-ui)$/i.test(family))return false;
    return ['monospace','serif','sans-serif'].every(base=>{
      ctx.font=`32px ${base}`;const fallback=ctx.measureText(sample).width;
      ctx.font=`32px ${JSON.stringify(family)},${base}`;return Math.abs(ctx.measureText(sample).width-fallback)<.01;
    });
  });
}
