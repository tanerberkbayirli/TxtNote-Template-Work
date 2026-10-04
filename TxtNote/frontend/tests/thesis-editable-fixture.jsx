import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ThesisEditor} from '../src/features/editor/ThesisEditor';
import '../src/index.css';
// Editable layout fixture: Demo University D (seeded, editable cover and jury page) with localStorage persistence.
const key='txtnote-thesis-editable';
const initial={title:'Düzenlenebilir kapak',content:'',researchData:{thesis:{templateId:'demo-university-d-master-tr-v1',templateVersion:'1.0.0',selection:{universityId:'demo-university-d',instituteId:'graduate',degreeType:'master',language:'tr'},values:{YEAR:'2026'},sectionContent:{},enabledSections:[]}}};
function Fixture() {
 const [doc,setDoc]=useState(()=>JSON.parse(localStorage.getItem(key)||JSON.stringify(initial)));
 const patch=(next)=>setDoc(current=>{const value={...current,...next};localStorage.setItem(key,JSON.stringify(value));return value;});
 window.thesisTest={getDoc:()=>JSON.parse(localStorage.getItem(key)||'null')};
 return <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
  <div style={{flex:1,minHeight:0}}><ThesisEditor {...doc} onTitleChange={title=>patch({title})} onContentChange={content=>patch({content})} onResearchDataChange={researchData=>patch({researchData})}/></div>
 </div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
