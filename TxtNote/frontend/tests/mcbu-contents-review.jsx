import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThesisEditor } from '../src/features/editor/ThesisEditor';
import defaultTemplate from '../../../engine/src/templates/mcbu.js';
import { THESIS_TEMPLATE_REGISTRY } from '../../../engine/src/registry.js';
import { createThesisDocument } from '../../../engine/src/document.js';
import '../src/index.css';
const templateId = new URLSearchParams(location.search).get('template');
const descriptor = THESIS_TEMPLATE_REGISTRY.find(item => item.id === templateId);
const template = descriptor ? (await descriptor.load()).default : defaultTemplate;
const stressRows = new URLSearchParams(location.search).has('stress') ? { manualToc:{enabled:true,rows:[
  {id:'parent',title:'2',page:'10',literalTitle:true},
  {id:'child',title:'2.1',page:'20',literalTitle:true},
  {id:'between',title:'3',page:'15',literalTitle:true},
]}} : {};
if (new URLSearchParams(location.search).get('stress') === 'damaged') stressRows.manualToc.rows = [
  {id:'same',title:'2 Başlık A',page:'10',literalTitle:true},
  {id:'same',title:'2.1 Başlık B',page:'20',literalTitle:true},
  {title:'3 Kimliksiz başlık',page:'15',literalTitle:true},
  null,
];
function Review() {
  const [doc, setDoc] = useState(() => ({ title: 'İÇİNDEKİLER DENEMESİ', content: new URLSearchParams(location.search).has('paras') ? '<h1>Giriş</h1>' + Array.from({ length: Number(new URLSearchParams(location.search).get('paras')) }, (_, i) => `<p>Paragraf ${i + 1}. ` + 'Örnek tez metni cümlesi. '.repeat(12) + '</p>').join('') : '<h1>Giriş</h1><p>Örnek tez metni.</p><h2>Amaç</h2><p>Araştırmanın amacı.</p>', researchData: { thesis: {...createThesisDocument(template, descriptor || { universityId:'mcbu', instituteId:'lee', degreeType:'master', language:'tr' }, 2026),...stressRows} } }));
  const patch = next => setDoc(current => ({ ...current, ...next }));
  return <div style={{ height:'100vh' }}><ThesisEditor documentId="fixture" {...doc} onDocumentChange={patch} onTitleChange={title=>patch({title})} onContentChange={content=>patch({content})} onResearchDataChange={researchData=>patch({researchData})}/></div>;
}
createRoot(document.getElementById('root')).render(<Review/>);
