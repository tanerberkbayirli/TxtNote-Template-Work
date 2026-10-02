import docx, os
from docx.shared import Pt
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
def build(name, hdr, rowkeep, nrows=6, filler=44):
    d=docx.Document(); body=d.element.body
    for p in list(d.paragraphs): body.remove(p._p)
    for i in range(filler): d.add_paragraph(f"filler {i}")
    c=d.add_paragraph("CAPTION"); c.paragraph_format.keep_with_next=True
    t=d.add_table(rows=nrows,cols=2)
    for ri,r in enumerate(t.rows):
        trPr=r._tr.get_or_add_trPr()
        trPr.append(OxmlElement('w:cantSplit'))
        if hdr and ri==0: trPr.append(OxmlElement('w:tblHeader'))
        for cell in r.cells:
            cell.paragraphs[0].text=f"R{ri}"
            if rowkeep and ri<nrows-1: cell.paragraphs[0].paragraph_format.keep_with_next=True
    d.save(os.path.join("kn3",name+".docx"))
for f in range(22,27):
  build(f"h1_k0_f{f}",True,False,filler=f)
  build(f"h0_k0_f{f}",False,False,filler=f)
  build(f"h1_k1_f{f}",True,True,filler=f)
