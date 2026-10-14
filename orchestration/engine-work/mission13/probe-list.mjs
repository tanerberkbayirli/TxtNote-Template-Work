import {readFileSync} from 'node:fs';
import {importThesisDocx} from '../../../engine/src/importDocx.js';
import {installContentDocument} from '../../../engine/src/contentModel.js';
import generic from '../../../engine/src/templates/generic.js';
const bytes=readFileSync('Butun-Sablonlar/Ege/Yaşar Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/Yasar_Lisansustu_Tez_Sablonu_EN_2024-11-19.docx');
const doc=await importThesisDocx(bytes,{fileName:'x.docx'});
const note=installContentDocument({title:'x',researchData:{thesis:{templateId:generic.id}}},doc);
const secs=note.researchData.thesis.sectionContent||{};
for(const [k,h] of Object.entries(secs)){const i=h.indexOf('Net Cargo Weight: This');if(i>=0){console.log(k,h.slice(i-300,i+900));}}
console.log(typeof note.content, (note.content||'').indexOf('Net Cargo Weight: This'));
