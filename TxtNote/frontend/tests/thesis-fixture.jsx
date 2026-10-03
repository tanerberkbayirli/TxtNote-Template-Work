import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ThesisEditor} from '../src/features/editor/ThesisEditor';
import {THESIS_TEMPLATE_REGISTRY} from '../src/thesis/registry.js';
import {FIXTURE_REGISTRY} from '../src/lib/thesisFixtures.js';
import '../src/index.css';
const registry=[...THESIS_TEMPLATE_REGISTRY,...FIXTURE_REGISTRY];
// Görev 5B regression fixture: Fixture University A thesis (test-only fixtures are appended to the real registry) with localStorage persistence.
// "Başka not" unmounts the editor like switching notes in the app.
const key='txtnote-thesis-regression';
const initial={title:'Test tezi',content:'',researchData:{thesis:{templateId:'fixture-university-a-master-tr-v1',templateVersion:'1.0.0',selection:{universityId:'fixture-university-a',instituteId:'graduate',degreeType:'master',language:'tr'},values:{YEAR:'2026'},sectionContent:{},enabledSections:[]}}};
function Fixture() {
 const [doc,setDoc]=useState(()=>JSON.parse(localStorage.getItem(key)||JSON.stringify(initial)));
 const [other,setOther]=useState(false);
 const patch=(next)=>setDoc(current=>{const value={...current,...next};localStorage.setItem(key,JSON.stringify(value));return value;});
 window.thesisTest={getDoc:()=>JSON.parse(localStorage.getItem(key)||'null')};
 return <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
  <button id="switch-note" onClick={()=>setOther(v=>!v)}>{other?'Teze dön':'Başka not'}</button>
  <div style={{flex:1,minHeight:0}}>{other?<p id="other-note">Başka not</p>:<ThesisEditor {...doc} templateRegistry={registry} onTitleChange={title=>patch({title})} onContentChange={content=>patch({content})} onResearchDataChange={researchData=>patch({researchData})}/>}</div>
 </div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
