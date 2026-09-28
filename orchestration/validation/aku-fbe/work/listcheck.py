import sys,re; sys.path.insert(0,'/home/user/TxtNote-Template-Work/orchestration/tools'); sys.path.insert(0,'/home/user/TxtNote-Template-Work/orchestration/validation/aku-fbe/work')
from pdfmeasure import *
from toccheck import labels
def run(f):
    d=open_pdf(f); lab=labels(d)
    # list rows
    rows=[]; 
    listpages=[i for i in range(1,len(d)+1) if (lambda L: L and re.match(r'(ŞEKİLLER|ÇİZELGELER|RESİMLER) DİZİNİ',L[0]['text']))(visual_lines(d[i-1]))]
    for lp in listpages:
        cur=''
        i=lp
        while True:
            L=visual_lines(d[i-1])
            for l in L:
                if l['baseline']>281 and l['size']==10.0: continue
                t=l['text']
                if re.match(r'(ŞEKİLLER|ÇİZELGELER|RESİMLER) DİZİNİ',t) or t.strip()=='Sayfa': continue
                cur+=(' ' if cur else '')+t
                m=re.match(r'^(.*?)\s*\.{5,}\s*(\d+)\s*$',cur)
                if m: rows.append((m.group(1).strip(),m.group(2),lp)); cur=''
            break
    # captions in body (11pt lines starting with label)
    caps=[]
    for i in range(1,len(d)+1):
        if lab[i] is None or not lab[i].isdigit(): continue
        cur=None
        for l in visual_lines(d[i-1]):
            if l['size']==11.0 and re.match(r'^(Şekil|Çizelge|Resim) \d+\.\d+',l['text']) or (l['size']==11.0 and re.match(r'^(Şekil|Çizelge|Resim)\d+\.\d+',l['text'].replace(' ',''))):
                caps.append((re.sub(r'\s+',' ',l['text']),lab[i],i))
    return rows,caps
for f in sys.argv[1:]:
    rows,caps=run(f); print(f); 
    for r in rows: print(' LIST',r)
    for c in caps: print(' CAP ',c[0][:60],c[1],c[2])
