import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installContentDocument, editContentNode, prepareThesisNote } from '../../engine/src/contentModel.js';
import { buildNotePayload, noteFromPayload } from '../../TxtNote/frontend/src/features/sync/payload.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = path => JSON.parse(readFileSync(resolve(root,path),'utf8'));
const inputs = read('orchestration/engine-work/mission02/source-inputs.json');
const report = { status:'PASS', scope:inputs.scope, cases:[] };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const collect = document => {
  const counts = {};
  const walk = nodes => { for (const node of nodes || []) {
    const kind = node.properties?.nativeName;
    if (kind) counts[kind] = (counts[kind] || 0) + 1;
    walk(node.children);
  } };
  document.sections.forEach(section => walk(section.nodes));
  Object.values(document.notes).forEach(note => walk(note.nodes));
  return counts;
};
for (const input of inputs.cases) {
  assert.equal(hash(readFileSync(resolve(root,input.input.path))),input.input.sha256);
  const original = read(input.modelFixture);
  const admitted = installContentDocument({title:'Mission02 '+input.id, researchData:{thesis:{templateId:'generic-thesis-tr-v1'}}},original);
  // Edit one real native object, then exercise HTML projection reconciliation,
  // the actual sync payload/checksum and JSON save/reopen twice.
  const first = original.sections[0].nodes[0];
  const edited = editContentNode(admitted,first.id,{properties:{...first.properties,mission02AuthorEdit:'retained'},children:[...first.children,{type:'text',text:' MISSION02_EDIT'}]});
  let loaded = edited;
  for (let pass=0;pass<2;pass++) {
    loaded = noteFromPayload(JSON.parse(JSON.stringify(buildNotePayload({noteId:input.id,note:loaded,deviceId:'mission02',updatedAt:0}))));
    loaded = prepareThesisNote(loaded);
  }
  const actual = loaded.researchData.thesis.document;
  assert.deepEqual(actual,edited.researchData.thesis.document, input.id+' model changed on save/reopen');
  assert.deepEqual(collect(actual),collect(original),input.id+' native structures lost');
  let parts=0;
  for (const [name,part] of Object.entries(actual.source.parts)) {
    assert.equal(hash(Buffer.from(part.base64,'base64')),part.sha256,input.id+': '+name); parts++;
  }
  assert.match(loaded.content,/MISSION02_EDIT/);
  assert.equal(actual.sections[0].nodes[0].properties.mission02AuthorEdit,'retained');
  report.cases.push({id:input.id,sourceSha256:input.input.sha256,status:'PASS',nativeElements:input.nativeElements,originalPackagePartsVerified:parts,nativeCounts:collect(actual)});
}
assert.equal(report.cases.length,6);
writeFileSync(resolve(root,'orchestration/engine-work/mission02/source-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases.length,nativeElements:report.cases.reduce((n,c)=>n+c.nativeElements,0),partsVerified:report.cases.reduce((n,c)=>n+c.originalPackagePartsVerified,0)}));
