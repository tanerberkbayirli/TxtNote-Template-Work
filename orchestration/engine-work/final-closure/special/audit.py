import json,glob,re,os,sys,subprocess,time,copy
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0,'C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/measurement-packages')
import pymupdf
R='C:/Users/CASPER/Desktop/TxtNote-Template-Work'
A=R+'/engine/final-closure/special'; W=os.environ.get('AUDIT_WORK_DIR',A+'/work')
RESULTS=os.environ.get('AUDIT_RESULT_PATH',A+'/results.json')
os.makedirs(W,exist_ok=True)
DEADLINE=time.time()+float(sys.argv[1] if len(sys.argv)>1 else 1200)
TR="Dijital Okuryazarlığın Çevrimiçi Öğrenme Ortamlarında Öğretmen Adaylarının Öz Yeterlik Algıları Üzerindeki Etkisinin Karşılaştırmalı Olarak İncelenmesi "
EN="An Examination of the Comparative Effects of Digital Literacy on Pre-Service Teachers Self-Efficacy Perceptions in Online Learning Environments "
def mk(base,n):
    s=(base*10)[:n].rstrip(); return s
fx={}
for f in sorted(glob.glob(R+'/orchestration/specs/*.fixture*.json')):
    b=os.path.basename(f)
    if 'engine-' in b or 'phase52' in b or 'overrides' in b: continue
    d=json.load(open(f,encoding='utf8'));tid=d['researchData']['thesis'].get('templateId')
    if tid in fx or '__template' in d: continue
    fx[tid]=(b,d)
TITLEK=['THESIS_TITLE','THESIS_TITLE_EN','THESIS_TITLE_TR','PROJECT_TITLE','PROJECT_TITLE_EN']
def variant(d,v):
    d=copy.deepcopy(d); val=d['researchData']['thesis']['values']; note=''
    if v.startswith('title'):
        n=int(v[5:]); ks=[k for k in TITLEK if k in val]
        for k in ks: val[k]=mk(EN if k.endswith('_EN') else TR,n)
        d['title']=val[ks[0]] if ks else d.get('title'); 
        if not ks: return None
    elif v=='coadv':
        ks=[k for k in val if k.startswith('CO_ADVISOR')]
        if not ks: return None
        for k in ks:
            if k.endswith('NAME'): val[k]='Prof. Dr. Muhammed Abdurrahman KARAHASANOĞLU-YILDIRIMOĞLU'
            elif 'AFFIL' in k: val[k]='Afyon Kocatepe Üniversitesi Fen-Edebiyat Fakültesi Matematik Bölümü'
            elif k.endswith('TITLE_EN'): val[k]='Prof. Dr.'
            elif k.endswith('TITLE'): val[k]='Prof. Dr.'
            else: val[k]='Prof. Dr. Uzun İsim'
        for k in [k for k in val if k.startswith('ADVISOR') and k.endswith('NAME')]: val[k]='Doç. Dr. Hacı Muhammed Abdurrahman KARAHASANOĞLU-YILDIRIMOĞLU'
    elif v.startswith('jury'):
        n=int(v[4:]); slots={}
        for k in val:
            m=re.match(r'JURY_(?:MEMBER_)?(\d+)(.*)$',k) or (re.match(r'(JURY_CHAIR)()(.*)$',k))
            if k.startswith('JURY_CHAIR') : slots.setdefault(0,[]).append(k)
            else:
                m=re.match(r'JURY_(?:MEMBER_)?(\d+)',k)
                if m: slots.setdefault(int(m.group(1)),[]).append(k)
        # chair counts as one member when present
        order=sorted(slots)
        if len(order)<3: return None
        has_chair=0 in slots
        keep=set(order[:n]) if has_chair else set(order[:n])
        if len(order)<n: return None
        for s,ks in slots.items():
            for k in ks:
                if s in keep:
                    if 'AFFIL' in k or k.endswith('_2') or 'UNIV' in k: val[k]='Afyon Kocatepe Üniversitesi Sağlık Bilimleri Fakültesi'
                    elif 'TITLE' in k and 'NAME' not in k: val[k]='Prof. Dr.'
                    else: val[k]=f'Prof. Dr. Jüri Üyesi Numara {s} UZUNSOYADOĞLU'
                else: val[k]=''
    return d
def sections_special(pages):
    s=set()
    for p in pages:
        if any(l['kind']=='special-block' for l in p['landmarks']): s.update(p['sectionIds'][:1] if len(p['sectionIds'])==1 else [])
    return s
def analyse(tag):
    L=json.load(open(f'{W}/{tag}.layout.json',encoding='utf8'));pages=L['engineLayout']['pages']
    sp=sections_special(pages)
    idx=[i for i,p in enumerate(pages) if len(p['sectionIds'])==1 and p['sectionIds'][0] in sp]
    # special pages only up to the first non-special page? keep front matter + any
    doc=pymupdf.open(f'{W}/{tag}.pdf'); mm=72/25.4
    ov=[];om=[];per={}
    for i in idx:
        pg=doc[i]; H=pg.rect.height; Wd=pg.rect.width
        lines=[]
        for b in pg.get_text('dict')['blocks']:
            for ln in b.get('lines',[]):
                t=''.join(s['text'] for s in ln['spans']).strip()
                if not t: continue
                sz=max(s['size'] for s in ln['spans']); bl=ln['spans'][0]['origin'][1]
                x0,x1=ln['bbox'][0],ln['bbox'][2]
                lines.append((t,x0,bl-0.75*sz,x1,bl+0.2*sz))
        for a in range(len(lines)):
            for c in range(a+1,len(lines)):
                A_,B_=lines[a],lines[c]
                xo=min(A_[3],B_[3])-max(A_[1],B_[1]); yo=min(A_[4],B_[4])-max(A_[2],B_[2])
                if xo>1 and yo>0.25*min(A_[4]-A_[2],B_[4]-B_[2]): ov.append((pages[i]['sectionIds'][0],A_[0][:30],B_[0][:30]))
        for t,x0,y0,x1,y1 in lines:
            if y1>H-12*mm or y0<12*mm or x0<12*mm or x1>Wd-12*mm: om.append((pages[i]['sectionIds'][0],t[:30],round(y0/mm),round(y1/mm)))
        per[pages[i]['sectionIds'][0]]=per.get(pages[i]['sectionIds'][0],0)+1
    # clipped textOps from engine
    clip=sum(1 for i in idx for o in pages[i].get('textOps',[]) if o.get('clipped'))
    return dict(per=per,n=len(idx),overlaps=ov[:8],n_ov=len(ov),oom=om[:8],n_oom=len(om),clipped=clip,total=len(pages))
results=[]
def job(args):
    tid,v=args
    if time.time()>DEADLINE: return dict(target=args[0],variant=args[1],status='not-run',note='audit deadline reached')
    b,d=fx[tid]; dd=variant(d,v) if v!='base' else d
    if dd is None: return dict(target=tid,variant=v,status='n/a',note='no such keys in fixture')
    if os.environ.get('AUDIT_SPECIAL_ONLY'):
        dd['content']='<p>Araştırma metni.</p>'
        dd['researchData']['thesis']['sectionContent']={k:'<p>Özel sayfa denetimi.</p>' for k in dd['researchData']['thesis'].get('sectionContent',{})}
    tag=f'{tid}__{v}'; fp=f'{W}/{tag}.json'
    json.dump(dd,open(fp,'w',encoding='utf8'),ensure_ascii=False)
    r=type('R',(),{'stdout':'','stderr':''})()
    if not os.environ.get('AUDIT_REUSE') or not os.path.exists(f'{W}/{tag}.layout.json'):
        env=os.environ.copy()
        env.setdefault('PLAYWRIGHT_MODULE',R+'/orchestration/tools/node_modules/playwright')
        env.setdefault('THESIS_BROWSER_EXECUTABLE','C:/Program Files/Google/Chrome/Application/chrome.exe')
        try:
            r=subprocess.run(['node',R+'/orchestration/tools/export.mjs',fp,f'{W}/{tag}',env.get('THESIS_BASE_URL','http://127.0.0.1:5175')],cwd=R,env=env,capture_output=True,text=True,encoding='utf8',timeout=150)
        except subprocess.TimeoutExpired:
            return dict(target=tid,variant=v,status='export-fail',note='export timeout (150 seconds)')
        if r.returncode:
            return dict(target=tid,variant=v,status='export-fail',note=(r.stdout+r.stderr)[-300:])
    if not os.path.exists(f'{W}/{tag}.pdf'): return dict(target=tid,variant=v,status='export-fail',note=(r.stdout+r.stderr)[-300:])
    try: a=analyse(tag)
    except Exception as e: return dict(target=tid,variant=v,status='analyse-fail',note=repr(e))
    for ext in ('docx',): pass
    return dict(target=tid,variant=v,status='ok',**a)
VARS=['base','title400','coadv','jury5','title120','jury3','jury7','title250']
VARS=os.environ.get('AUDIT_VARIANTS',','.join(VARS)).split(',')
jobs=[(t,v) for v in VARS for t in fx if not os.environ.get('AUDIT_TARGETS') or t in os.environ['AUDIT_TARGETS'].split(',')]
def j2(a):
    r=job(a)
    if r:
        out.append(r)
        print(len(out),r['target'],r['variant'],r['status'],flush=True)
        if len(out)%5==0: json.dump(out,open(RESULTS,'w',encoding='utf8'),ensure_ascii=False,indent=1)
    return r
out=[]
with ThreadPoolExecutor(int(os.environ.get('AUDIT_WORKERS','1'))) as ex: list(ex.map(j2,jobs))
json.dump(out,open(RESULTS,'w',encoding='utf8'),ensure_ascii=False,indent=1)
print(len(out),'done')



