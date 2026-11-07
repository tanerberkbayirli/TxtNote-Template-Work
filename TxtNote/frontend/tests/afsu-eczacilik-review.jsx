import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThesisEditor } from '../src/features/editor/ThesisEditor';
import template from '../../../engine/src/templates/afsu-eczacilik-proje.js';
import { createThesisDocument } from '../../../engine/src/document.js';
import '../src/index.css';

const initial = { title: 'ÖRNEK ARAŞTIRMA PROJESİ', content: '<p>Giriş metni.</p>', researchData: { thesis: {
  ...createThesisDocument(template, { universityId:'afsu', instituteId:'eczacilik', degreeType:'undergraduate', language:'tr' }, 2026),
  values: { PROJECT_TITLE:'ÖRNEK ARAŞTIRMA PROJESİ', STUDENT_NAME:'Öğrenci Adı SOYADI', DEPARTMENT_NAME:'Farmasötik Teknoloji', ADVISOR_NAME:'Prof. Dr. Danışman SOYADI', PROJECT_YEAR:'2026', KEYWORDS_TR:'Araştırma, Eczacılık, Proje', KEYWORDS_EN:'Pharmacy, Project, Research' },
} } };
function Review() {
  const [doc, setDoc] = useState(initial);
  const patch = next => setDoc(current => ({ ...current, ...next }));
  return <div style={{ height:'100vh' }}><ThesisEditor {...doc} onDocumentChange={patch} onTitleChange={title=>patch({title})} onContentChange={content=>patch({content})} onResearchDataChange={researchData=>patch({researchData})}/></div>;
}
createRoot(document.getElementById('root')).render(<Review/>);
