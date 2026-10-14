import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../../TxtNote/frontend/package.json',import.meta.url));
const {unzipSync,strFromU8}=require('fflate'), {DOMParser}=require('@xmldom/xmldom');
const path=process.argv[2]||'orchestration/engine-work/final-closure/long/SRC09.docx';
const bytes=fs.readFileSync(path),files=unzipSync(bytes),report={path,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),parts:[],unresolved:[],duplicates:[]};
for(const [name,data] of Object.entries(files)){
 if(!/^word\/(?:document|header\d+|footer\d+)\.xml$/.test(name))continue;
 const xml=strFromU8(data),doc=new DOMParser().parseFromString(xml,'application/xml'),nodes=Array.from(doc.getElementsByTagName('*'));
 const v=nodes.filter(n=>n.namespaceURI==='urn:schemas-microsoft-com:vml'),ids=new Set();
 for(const n of v)if(n.hasAttribute('id')){const id=n.getAttribute('id');if(ids.has(id))report.duplicates.push({part:name,id});ids.add(id);}
 const refs=[];
 for(const n of nodes)for(const a of Array.from(n.attributes||[]))if(['type','shapeid','idref'].includes(a.localName)&&a.value.startsWith('#')){refs.push(a.value.slice(1));if(!ids.has(a.value.slice(1)))report.unresolved.push({part:name,node:n.nodeName,attribute:a.name,target:a.value});}
 report.parts.push({name,vmlElements:v.length,ids:ids.size,references:refs.length,gfxdata:(xml.match(/gfxdata=/g)||[]).length});
}
report.pass=!report.duplicates.length&&!report.unresolved.length;
fs.writeFileSync('orchestration/engine-work/final-closure/long/SRC09.vml-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
