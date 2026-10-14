import {readFileSync,writeFileSync} from 'node:fs';
import {importThesisDocx} from '../../../../../engine/src/importDocx.js';
import {installContentDocument} from '../../../../../engine/src/contentModel.js';
import generic from '../../../../../engine/src/templates/generic.js';
const doc=await importThesisDocx(readFileSync('orchestration/engine-work/final-closure/src09-resume/math/excerpt.docx'));
const note=installContentDocument({title:'SRC09_EQUATION_EXCERPT',content:'',researchData:{thesis:{templateId:generic.id}}},doc);
writeFileSync('TxtNote/frontend/tests/generated/SRC09_EQUATION_EXCERPT.fixture.json',JSON.stringify({...note,__template:generic}));
console.log('Fresh source excerpt imported');
