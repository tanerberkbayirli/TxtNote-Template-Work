import sys,re; sys.path.insert(0,'/home/user/TxtNote-Template-Work/orchestration/tools'); sys.path.insert(0,'/home/user/TxtNote-Template-Work/orchestration/validation/aku-fbe/work')
from pdfmeasure import *
from toccheck import labels
PT=25.4/72
def run(f,verbose=True):
    d=open_pdf(f); lab=labels(d); out=[]
    for i,p in enumerate(d,1):
        if not lab[i] or not lab[i].isdigit(): continue
        L=[l for l in visual_lines(p) if not (l['baseline']>281 and l['size']==10.0)]
        for k,l in enumerate(L):
            t=l['text']
            if l['bold'] and l['size']==12.0 and re.match(r'^\d+(\.\d+)*\.?\s?\S',t) and not t.startswith(('Çizelge','Şekil','Resim')):
                prev=L[k-1] if k>0 else None; nxt=L[k+1] if k+1<len(L) else None
                # skip continuation lines of wrapped headings (gap<8)
                if prev and l['baseline']-prev['baseline']<6: continue
                lvl=len(re.match(r'^(\d+(?:\.\d+)*)',t).group(1).split('.'))
                g0=(l['baseline']-prev['baseline']) if prev else None
                # gap after: to first line after the (possibly wrapped) heading
                j=k+1
                while j<len(L) and L[j]['bold'] and L[j]['baseline']-L[j-1]['baseline']<6: j+=1
                g1=(L[j]['baseline']-L[j-1]['baseline']) if j<len(L) else None
                out.append((i,lab[i],lvl,t[:30],round(l['baseline'],2),prev and (round(g0,2),prev['size'],prev['text'][:22]),g1 and round(g1,2)))
    return out
if __name__=='__main__':
    for r in run(sys.argv[1]): print(r)
