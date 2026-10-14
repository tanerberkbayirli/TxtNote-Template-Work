import json,sys,fitz,subprocess,os
id,dirn,wp,op=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
doc=fitz.open(f'../../mission01/references/{id}/word.pdf')
def wlines(n):
    pg=doc[n-1];L={}
    for w in pg.get_text('words'):
        L.setdefault(round(w[1]/2),[]).append(w)
    out=[]
    for k in sorted(L):
        ws=sorted(L[k],key=lambda w:w[0]);out.append((round(ws[0][1],1),' '.join(w[4] for w in ws)[:95]))
    return out
for n in (wp-1,wp):
    L=wlines(n);print(f'--- WORD page {n}: first 4 / last 7');
    for r in L[:4]:print(r)
    print('   ...');
    for r in L[-7:]:print(r)
env=dict(os.environ,PYTHONIOENCODING='utf-8')
for n in (op-1,op):
    out=subprocess.run(['node','probe2.mjs',id,str(n)],capture_output=True,text=True,encoding='utf-8',env=env).stdout.splitlines()
    print(f'--- OURS page {n}: first 4 / last 7')
    for r in out[1:5]:print(r[:100])
    print('   ...')
    for r in out[-7:]:print(r[:100])
