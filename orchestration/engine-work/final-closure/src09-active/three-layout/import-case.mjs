import {readFileSync,writeFileSync} from 'node:fs';
import {importThesisDocx} from '../../../../../engine/src/importDocx.js';
import {installContentDocument} from '../../../../../engine/src/contentModel.js';
import generic from '../../../../../engine/src/templates/generic.js';
const [file,id]=process.argv.slice(2),doc=await importThesisDocx(readFileSync(file));
const note=installContentDocument({title:id,content:'',researchData:{thesis:{templateId:generic.id}}},doc);
writeFileSync(`TxtNote/frontend/tests/generated/${id}.fixture.json`,JSON.stringify({...note,__template:generic}));
