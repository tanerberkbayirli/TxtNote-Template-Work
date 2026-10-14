import {readFileSync,writeFileSync} from 'node:fs';
import {importThesisDocx} from '../../../../engine/src/importDocx.js';
import {installContentDocument} from '../../../../engine/src/contentModel.js';
import generic from '../../../../engine/src/templates/generic.js';
const name=process.argv[2]||'synth';
const d=await importThesisDocx(readFileSync(`orchestration/engine-work/mission07/synthetic/${name}.docx`));
const n=installContentDocument({title:name,content:'',researchData:{thesis:{templateId:generic.id}}},d);
writeFileSync(`TxtNote/frontend/tests/generated/${name}.fixture.json`,JSON.stringify({...n,__template:generic}));
console.log(name,d.sections.length);
