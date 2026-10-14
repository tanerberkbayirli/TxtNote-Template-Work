// Read-only baseline serving: override only this task's changed browser modules
// with their exact HEAD bytes, without checking out or modifying the workspace.
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const paths=['src/thesis/engine.js','src/features/editor/ThesisEditor.jsx','src/features/editor/ThesisSectionPages.jsx','src/features/editor/RichTextBody.jsx','src/lib/academicDocument.js','src/features/sync/payload.js','src/app/App.jsx','src/thesis/sourceHtml.js','tests/thesis-fixture.jsx'];
const overrides={};
for(const path of paths)overrides[resolve(root,'TxtNote/frontend',path).replaceAll('\\','/')]=execFileSync('git',['show','HEAD:TxtNote/frontend/'+path],{cwd:root,encoding:'utf8'});
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
writeFileSync(resolve(root,'orchestration/engine-work/mission02/baseline-overrides.json'),JSON.stringify(overrides));
writeFileSync(resolve(root,'orchestration/engine-work/mission02/baseline-provenance.json'),JSON.stringify({revision,modules:Object.entries(overrides).map(([path,source])=>({path,sha256:createHash('sha256').update(source).digest('hex')}))},null,2)+'\n');
console.log('Baseline modules recorded: '+paths.length);
