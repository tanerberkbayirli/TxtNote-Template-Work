import re,sys
from lxml import etree
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns={'w':W}
q=lambda t:'{%s}%s'%(W,t)
tree=etree.parse('x/word/document.xml')
body=tree.getroot().find(q('body'))
def attrs(e):
    return ' '.join('%s=%s'%(k.split('}')[1],v) for k,v in e.attrib.items()) if e is not None else ''
def ppr(p):
    pp=p.find(q('pPr'))
    if pp is None: return ''
    out=[]
    for c in pp:
        t=c.tag.split('}')[1]
        if t in('rPr','sectPr'): continue
        out.append(t+'('+attrs(c)+')' if c.attrib else t)
        if t=='tabs': out[-1]='tabs['+';'.join(attrs(x) for x in c)+']'
    return ' '.join(out)
def rpr_of(p):
    s=set()
    for r in p.iter(q('r')):
        rp=r.find(q('rPr'))
        if rp is not None:
            for c in rp:
                t=c.tag.split('}')[1]
                if t in('rFonts','sz','b','i','caps','color') : s.add(t+'('+attrs(c)+')')
    return ' '.join(sorted(s))
def sect(sp):
    o=[]
    for c in sp:
        t=c.tag.split('}')[1]
        o.append(t+'('+attrs(c)+')')
    return ' | '.join(o)
def text(p):
    out=''
    for e in p.iter():
        if e.tag==q('t'): out+=e.text or ''
        elif e.tag==q('instrText'): out+='{'+(e.text or '')+'}'
        elif e.tag==q('tab'): out+='\t'
        elif e.tag==q('br'): out+='<br %s>'%(e.get(q('type')) or '')
        elif e.tag==q('drawing'): out+='<DRAWING>'
        elif e.tag==q('pict'): out+='<PICT>'
    return out
i=0
for el in body:
    t=el.tag.split('}')[1]
    if t=='p':
        pp=el.find(q('pPr'))
        st=pp.find(q('pStyle')).get(q('val')) if pp is not None and pp.find(q('pStyle')) is not None else '-'
        sp=pp.find(q('sectPr')) if pp is not None else None
        print(i,'P[%s]'%st,repr(text(el)[:110]),'::',ppr(el),'::',rpr_of(el))
        if sp is not None: print('   SECT:',sect(sp))
    elif t=='tbl':
        print(i,'TBL rows',len(el.findall(q('tr'))), repr(''.join(x.text or '' for x in el.iter(q('t')))[:100]))
    elif t=='sectPr':
        print(i,'FINAL SECT:',sect(el))
    i+=1
