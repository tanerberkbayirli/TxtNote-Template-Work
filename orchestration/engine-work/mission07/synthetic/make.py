import random,sys
from docx import Document
from docx.shared import Pt,Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
random.seed(int(sys.argv[1]) if len(sys.argv)>1 else 7)
out=sys.argv[2] if len(sys.argv)>2 else 'orchestration/engine-work/mission07/synthetic/synth.docx'
d=Document()
s=d.sections[0];s.page_width=Cm(21);s.page_height=Cm(29.7)
for a in('left_margin','right_margin','top_margin','bottom_margin'):setattr(s,a,Cm(2.5))
n=d.styles['Normal'];n.font.name='Times New Roman';n.font.size=Pt(12)
n.paragraph_format.line_spacing=1.5;n.paragraph_format.space_after=Pt(6);n.paragraph_format.space_before=Pt(0)
for h,sz in(('Heading 1',16),('Heading 2',14)):
    st=d.styles[h];st.font.name='Times New Roman';st.font.size=Pt(sz);st.font.bold=True
    from docx.shared import RGBColor;st.font.color.rgb=RGBColor(0,0,0)
    st.paragraph_format.space_before=Pt(12);st.paragraph_format.space_after=Pt(6);st.paragraph_format.keep_with_next=True
W='bilimsel çalışma yöntem analiz sonuç veri kuram model örnek değişken ölçüm gözlem hipotez katılımcı örneklem tablo bulgu tartışma literatür kavram süreç etki'.split()
def txt(nw):return ' '.join(random.choice(W) for _ in range(nw)).capitalize()+'.'
def para(nw,**k):
    p=d.add_paragraph(txt(nw));p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
    if k.get('keep_lines'):p.paragraph_format.keep_together=True
    return p
sec=0
for ch in range(1,4):
    d.add_heading(f'{ch}. Bölüm {ch}',1)
    for sub in range(1,4):
        d.add_heading(f'{ch}.{sub} Alt başlık {sub}',2)
        for _ in range(random.randint(2,4)):
            para(random.choice([35,50,60,75,90,110]))
        para(random.choice([45,60]),keep_lines=True)
        if ch==2 and sub==2:
            t=d.add_table(rows=12,cols=3);t.style='Table Grid'
            for i,r in enumerate(t.rows):
                for j,c in enumerate(r.cells):c.text=f'Satır {i+1} hücre {j+1} '+txt(random.randint(1,6))
        for i in range(random.choice([3,4,5])):
            p=d.add_paragraph(txt(random.randint(6,30)),style='List Bullet')
        para(random.choice([30,40,55,70]))
d.save(out)
