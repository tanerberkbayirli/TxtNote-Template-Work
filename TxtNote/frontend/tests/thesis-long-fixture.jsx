import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {ThesisEditor} from '../src/features/editor/ThesisEditor';
import '../src/index.css';
// Task 7 long-document fixture: loads tests/generated/<id>.fixture.json (too large for localStorage) into memory.
const id=new URLSearchParams(location.search).get('id')||'SRC09';
function Fixture() {
 const [doc,setDoc]=useState(null);
 useEffect(()=>{fetch(`/tests/generated/${id}.fixture.json`).then(r=>r.json()).then(setDoc);},[]);
 const registry=React.useMemo(()=>{const t=doc?.__template;return t?[{id:t.id,templateVersion:t.templateVersion,universityId:t.universityId,universityName:t.universityName,instituteId:t.instituteId,degreeType:t.degreeType,language:t.language,load:async()=>t}]:undefined;},[doc===null]);
 const patch=(next)=>setDoc(current=>({...current,...next}));
 window.thesisTest={getDoc:()=>doc};
 if(!doc)return <p>Belge yükleniyor</p>;
 const {__template,...props}=doc;
 return <div style={{height:'100vh',display:'flex',flexDirection:'column'}}><div style={{flex:1,minHeight:0}}><ThesisEditor {...props} templateRegistry={registry} onTitleChange={title=>patch({title})} onContentChange={content=>patch({content})} onResearchDataChange={researchData=>patch({researchData})}/></div></div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
