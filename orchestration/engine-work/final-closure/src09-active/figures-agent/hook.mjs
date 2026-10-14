// node loader hook: applies patch specs (PATCHES env, comma list of modules exporting [{file,find,replace}]) to source files.
import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
let patches=null;
export async function load(url,context,next){
  const r=await next(url,context);
  if(!url.startsWith('file:')||!r.source)return r;
  if(!patches){patches=[];for(const f of (process.env.PATCHES||'').split(',').filter(Boolean))patches.push(...(await import(pathToFileURL(resolve(f)).href)).default);}
  let text=null;
  for(const p of patches){if(url.endsWith('/'+p.file)||url.endsWith('/frontend/'+p.file)){text??=r.source.toString();if(!text.includes(p.find)){console.error('PATCH MISS',p.file)}else text=text.replace(p.find,()=>p.replace);}}
  return text===null?r:{...r,source:text};
}
