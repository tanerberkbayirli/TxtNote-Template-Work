import re,sys
def parse(p):
    pages=[];cur=None
    for l in open(p,encoding='utf-8').read().split('\n'):
        if l.startswith('==='): cur=[];pages.append(cur)
        elif cur is not None and ' | ' in l:
            m=re.match(r'([\d.]+) x0=([\d.]+) x1=([\d.]+) xc=([\d.]+) sz=([\d.]+).*?\| (.*)',l)
            if m: cur.append((float(m[1]),float(m[2]),float(m[3]),m[6]))
    return pages
old,new=sys.argv[1],sys.argv[2]
a=parse(old);b=parse(new)
print(len(a),len(b),'pages')
for i,(pa,pb) in enumerate(zip(a,b),1):
    if len(pa)!=len(pb): print(f'p{i}: line count {len(pa)} -> {len(pb)}'); continue
    for x,y in zip(sorted(pa),sorted(pb)):
        pass
    sa=sorted(pa,key=lambda t:(t[3],t[0]));sb=sorted(pb,key=lambda t:(t[3],t[0]))
    for x,y in zip(sa,sb):
        if x[3]!=y[3] or abs(x[0]-y[0])>0.02:
            print(f'p{i}: dy={y[0]-x[0]:+.2f} dx0={y[1]-x[1]:+.2f} {x[3][:40]!r}')
