import re,sys
from lxml import etree
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns={'w':W}
def q(t):return '{%s}%s'%(W,t)
doc=etree.parse('x/word/document.xml')
body=doc.getroot().find(q('body'))
def attrs(e):
    return ' '.join(f"{k.split('}')[1]}={v}" for k,v in e.attrib.items())
def ppr(p):
    pp=p.find(q('pPr'))
    if pp is None: return ''
    out=[]
    for c in pp:
        t=c.tag.split('}')[1]
        if t in('rPr','sectPr'):continue
        out.append(f"{t}[{attrs(c)}]" if not len(c) else f"{t}[{attrs(c)}|{'/'.join(x.tag.split('}')[1]+':'+attrs(x) for x in c)}]")
    return ' '.join(out)
def rpr(r):
    rp=r.find(q('rPr'))
    if rp is None:return ''
    return ','.join(c.tag.split('}')[1]+('='+list(c.attrib.values())[0] if c.attrib else '') for c in rp)
i=0
for el in body:
    t=el.tag.split('}')[1]
    if t=='p':
        txt=''.join(x.text or '' for x in el.iter(q('t')))
        sp=el.find('.//'+q('sectPr'))
        extra=[]
        if el.find('.//'+q('drawing')) is not None or el.find('.//'+q('pict')) is not None: extra.append('DRAWING')
        if el.find('.//'+q('fldChar')) is not None or el.find('.//'+q('fldSimple')) is not None: extra.append('FIELD:'+'|'.join((x.text or '') for x in el.iter(q('instrText')))[:50])
        if el.find('.//'+q('br')) is not None: extra.append('BR:'+','.join(x.get(q('type'),'') for x in el.iter(q('br'))))
        runs=el.findall(q('r'))
        rp=rpr(runs[0]) if runs else ''
        print(f"P{i} {ppr(el)} {{{rp}}} {' '.join(extra)} :: {txt[:70]!r}")
        if sp is not None:
            print('  SECT', etree.tostring(sp).decode()[:900].replace('xmlns:w="%s" '%W,''))
    elif t=='tbl':
        print(f"T{i} TABLE rows={len(el.findall(q('tr')))} "+etree.tostring(el.find(q('tblPr'))).decode()[:300])
    elif t=='sectPr':
        print('FINAL SECT', etree.tostring(el).decode()[:900])
    i+=1
