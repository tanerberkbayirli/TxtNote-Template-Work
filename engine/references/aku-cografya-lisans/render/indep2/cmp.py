import re,sys
def load(f):
    pages={};cur=None
    for l in open(f,encoding='utf8'):
        m=re.match(r'--- p (\d+)',l)
        if m: cur=int(m.group(1));pages[cur]=[];continue
        m=re.match(r'\s*([\d.]+) x0=\s*([\d.]+) x1=\s*([\d.]+) sz=(\S+) b=(\S+) (.*)',l)
        if m and cur: pages[cur].append((float(m[1]),float(m[2]),float(m[3]),m[4],m[5],m[6].strip()))
    return pages
R='orchestration/artifacts/aku-cografya-lisans/render/indep2/'
S=load(R+'src-all.txt');L=load(R+sys.argv[1]+'-all.txt')
lo,hi=int(sys.argv[2]),int(sys.argv[3]); off=int(sys.argv[4]) if len(sys.argv)>4 else 0
for p in range(lo,hi+1):
    q=p+off
    print('== src p',p,'ours p',q,'src',len(S.get(p,[])),'ours',len(L.get(q,[])))
    for i in range(max(len(S.get(p,[])),len(L.get(q,[])))):
        a=S[p][i] if i<len(S.get(p,[])) else None;b=L[q][i] if i<len(L.get(q,[])) else None
        f=lambda t:f"{t[0]:6.2f} {t[1]:6.2f} {t[2]:6.2f} {t[3]:>4}{'B' if t[4]=='True' else ' '} {t[5][:26]:26}" if t else ' '*52
        d=''
        if a and b: d=f"d={b[0]-a[0]:+.2f}/{b[1]-a[1]:+.2f}/{b[2]-a[2]:+.2f}"
        print(f(a),'|',f(b),d)
