import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThesisEditor } from '../src/features/editor/ThesisEditor';
import { prepareThesisNote } from '../../../engine/src/contentModel.js';
import original from './generated/TESTTEZ_ORIGINAL_20261026.fixture.json';
import '../src/index.css';
const key = 'txtnote-testtez-original-20261026';
function RebuiltThesis() {
 const [note,setNote]=useState(()=>prepareThesisNote(JSON.parse(localStorage.getItem(key)||JSON.stringify(original))));
 const patch=next=>setNote(current=>{const value=prepareThesisNote({...current,...next});localStorage.setItem(key,JSON.stringify(value));return value;});
 return <div style={{height:'100vh',display:'flex',flexDirection:'column'}}><ThesisEditor {...note} onDocumentChange={patch} onTitleChange={title=>patch({title})} onContentChange={content=>patch({content})} onResearchDataChange={researchData=>patch({researchData})}/></div>;
}
createRoot(document.getElementById('root')).render(<RebuiltThesis/>);
