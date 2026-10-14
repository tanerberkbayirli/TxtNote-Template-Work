import {readFileSync} from 'node:fs';
import {compileThesisDocument} from '../../engine/src/engine.js';
const f=JSON.parse(readFileSync('orchestration/engine-work/mission07/SRC09.fixture.json','utf8'));
const m=compileThesisDocument(f.__template,f.researchData.thesis,f.title,f.content);
const i=+process.argv[2]||14;const s=m.sections[i];
console.log(s.id,s.rules.page.lastLineFit,s.rules.page.lastLineLeadingMm,JSON.stringify(s.rules.lastLineLeadings),JSON.stringify(s.rules.page.margins));
console.log(JSON.stringify(f.__template.typography.lineSpacing), JSON.stringify(f.__template.page.lastLineFit));
