import sys
sys.argv=['x']
exec(open('dump.py').read().split("i=0")[0])
body_els=list(body)
def runs(p):
    out=[]
    for r in p.iter(q('r')):
        rp=r.find(q('rPr'))
        fl=''
        if rp is not None:
            for c in rp:
                t=c.tag.split('}')[1]
                if t in('b','i','caps','vertAlign','color','sz'): fl+=t[0] if t in('b','i') else t+'='+(c.get(q('val')) or '')+','
        t=''.join((x.text or '') if x.tag==q('t') else ('\t' if x.tag==q('tab') else ('<br>' if x.tag==q('br') else '')) for x in r)
        if t: out.append('[%s]%s'%(fl,t))
    return ' '.join(out)
for a in sys.stdin.read().split():
    a=int(a)
    print(a,runs(body_els[a])); print()
