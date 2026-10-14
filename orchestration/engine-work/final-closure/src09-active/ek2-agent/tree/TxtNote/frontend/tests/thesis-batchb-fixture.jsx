import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ThesisEditor} from '../src/features/editor/ThesisEditor';
import '../src/index.css';
// Batch B engine-extension fixture: like thesis-fixture.jsx, but the stored document carries its own
// template (`__template`, see batchb-fixture.mjs) which is served through the editor's templateRegistry seam.
const key='txtnote-thesis-regression';
function Fixture() {
 const [doc,setDoc]=useState(()=>JSON.parse(localStorage.getItem(key)||'null'));
 const registry=React.useMemo(()=>{const t=doc?.__template;return t?[{id:t.id,templateVersion:t.templateVersion,universityId:t.universityId,universityName:t.universityName,instituteId:t.instituteId,degreeType:t.degreeType,language:t.language,load:async()=>t}]:undefined;},[]);
 const patch=(next)=>setDoc(current=>{const value={...current,...next};localStorage.setItem(key,JSON.stringify(value));return value;});
 window.thesisTest={getDoc:()=>JSON.parse(localStorage.getItem(key)||'null')};
 if(!doc)return <p>Belge yok</p>;
 const {__template,...props}=doc;
 return <div style={{height:'100vh',display:'flex',flexDirection:'column'}}><div style={{flex:1,minHeight:0}}><ThesisEditor {...props} templateRegistry={registry} onTitleChange={title=>patch({title})} onContentChange={content=>patch({content})} onResearchDataChange={researchData=>patch({researchData})}/></div></div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
