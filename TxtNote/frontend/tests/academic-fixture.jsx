import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AcademicEditor} from '../src/features/editor/AcademicEditor';
import '../src/index.css';
const key='txtnote-academic-regression';
function Fixture() {
 const [doc,setDoc]=useState(()=>JSON.parse(localStorage.getItem(key)||'{"title":"Test belgesi","content":"Biçim testi","researchData":{}}'));
 const patch=(next)=>setDoc(current=>{const value={...current,...next};localStorage.setItem(key,JSON.stringify(value));return value;});
 window.academicTest={setDoc:patch,getDoc:()=>doc};
 return <div style={{height:'100vh'}}><AcademicEditor {...doc} onTitleChange={title=>patch({title})} onContentChange={content=>patch({content})} onResearchDataChange={researchData=>patch({researchData})}/></div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
