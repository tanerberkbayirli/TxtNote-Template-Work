import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas} from '../src/features/canvas/Canvas.jsx';
import {DocumentPane} from '../src/features/workarea/DocumentPane.jsx';
import {prepareThesisNote} from '../../../engine/src/contentModel.js';
import '../src/index.css';
function Fixture(){
 const [note,setNote]=useState(()=>JSON.parse(localStorage.getItem('mission04-academic')||'{"title":"Akademik PDF","content":"<p>Akademik özgün içerik.</p>","researchData":{}}'));
 const patch=value=>setNote(old=>{const next=prepareThesisNote({...old,...value});localStorage.setItem('mission04-academic',JSON.stringify(next));return next;});
 window.pdfAcademic={getNote:()=>note};
 const props={note,tab:{id:'academic-test',type:'document',noteType:'academic'},onNoteChange:(_,value)=>patch(value),onTitleChange:(_,title)=>patch({title}),onContentChange:(_,content)=>patch({content})};
 const Surface=new URLSearchParams(location.search).get('surface')==='canvas'?Canvas:DocumentPane;
 return <div style={{height:'100vh'}}><React.Suspense fallback={<p>Yükleniyor…</p>}><Surface {...props}/></React.Suspense></div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
