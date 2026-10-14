import original from '../../../TxtNote/frontend/vite.config.js';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const overrides=JSON.parse(readFileSync(new URL('./baseline-overrides.json',import.meta.url),'utf8'));
export default {...original,cacheDir:fileURLToPath(new URL('.vite-baseline/',import.meta.url)),root:fileURLToPath(new URL('../../../TxtNote/frontend/',import.meta.url)),plugins:[...original.plugins,{name:'mission02-head-baseline',enforce:'pre',load(id){return overrides[id.split('?')[0].replaceAll('\\','/')] ?? null;}}],server:{...original.server,host:'127.0.0.1',port:5177,hmr:false}};
