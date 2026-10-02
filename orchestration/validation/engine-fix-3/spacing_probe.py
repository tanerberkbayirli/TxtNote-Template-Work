# Minimal probe: Word gap between paragraph A (after X) and B (before Y), by compat mode.
import docx, sys, re, subprocess, os, pymupdf
from docx.shared import Pt
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
cases=[("a20_b30",20,30,False,15),("a30_b20",30,20,False,15),("a20_b20",20,20,False,15),("a20_b20_m14",20,20,False,14),("a20_b20_m12",20,20,False,12),("a20_b20_ctx",20,20,True,15)]
for name,a,b,ctx,mode in cases:
    d=docx.Document(); 
    body=d.element.body
    for p in list(d.paragraphs): body.remove(p._p)
    s=d.settings.element
    cp=s.find(qn('w:compat'))
    if cp is None: cp=OxmlElement('w:compat'); s.append(cp)
    for c in list(cp): cp.remove(c)
    cs=OxmlElement('w:compatSetting'); cs.set(qn('w:name'),'compatibilityMode'); cs.set(qn('w:uri'),'http://schemas.microsoft.com/office/word'); cs.set(qn('w:val'),str(mode)); cp.append(cs)
    st=d.styles['Normal']; st.font.name='Arial'; st.font.size=Pt(12)
    for i,(bef,aft) in enumerate([(0,a),(b,0),(0,0)]):
        p=d.add_paragraph(f"LINE{i}"); p.paragraph_format.space_before=Pt(bef); p.paragraph_format.space_after=Pt(aft)
        if ctx:
            pPr=p._p.get_or_add_pPr(); e=OxmlElement('w:contextualSpacing'); pPr.append(e)
    d.save(os.path.abspath(name+".docx"))
