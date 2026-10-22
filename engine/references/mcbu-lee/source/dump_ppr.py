import docx,re,sys
sys.stdout.reconfigure(encoding='utf-8')
d=docx.Document('guide.docx')
from docx.text.paragraph import Paragraph
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W='{%s}'%ns['w']
def a(e,k): return e.get(W+k) if e is not None else None
i=0
lo=int(sys.argv[1]);hi=int(sys.argv[2])
for el in d.element.body.iterchildren():
    if lo<=i<=hi and el.tag==W+'p':
        p=Paragraph(el,d)
        ppr=el.find('w:pPr',ns)
        out=[]
        if ppr is not None:
            for t in ['pStyle','jc','spacing','ind','keepNext','pageBreakBefore','numPr','tabs']:
                e=ppr.find('w:'+t,ns)
                if e is not None: out.append(t+':'+','.join(f"{k.split('}')[1]}={v}" for k,v in e.attrib.items()) if t!='tabs' else 'tabs:'+';'.join(f"{a(x,'val')}@{a(x,'pos')}" for x in e))
        runs=[]
        for r in p.runs:
            rp=r._r.find('w:rPr',ns)
            f=[]
            if rp is not None:
                for t in ['b','i','caps','sz','rFonts']:
                    e=rp.find('w:'+t,ns)
                    if e is not None:
                        f.append(t+('='+(a(e,'val') or a(e,'ascii') or '') ))
            runs.append(f"[{','.join(f)}]{r.text[:50]!r}")
        has_draw = 'DRAWING' if el.xpath('.//w:drawing') else ''
        print(i,' '.join(out),has_draw,' '.join(runs[:6]))
    i+=1
