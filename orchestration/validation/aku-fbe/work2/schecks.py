import sys,os,re,json,collections
sys.path.insert(0,"/home/user/TxtNote-Template-Work/orchestration/tools")
from pdfmeasure import *
from checks import R,G,T,PT
def near(a,b,tol): return abs(a-b)<=tol
def cmp_list(actual,expected,tol):
    if len(actual)!=len(expected): return False,f"count {len(actual)} vs {len(expected)}"
    d=[round(a-e,2) for a,e in zip(actual,expected)]
    return all(abs(x)<=tol for x in d),d
def specials(pdf,variant,deg):
    d=open_pdf(pdf); P=[]
    for i,p in enumerate(d):
        P.append({"i":i+1,"L":visual_lines(p),"p":p})
    C=[]
    L1=P[0]["L"]
    # outer cover
    x0=min(l["x0"] for l in L1); x1=max(l["x1"] for l in L1); top=min(l["baseline"]-0.891*l["size"]*PT for l in L1); bot=max(l["baseline"]+0.216*l["size"]*PT for l in L1)
    ctr=[round((l["x0"]+l["x1"])/2,2) for l in L1]
    ok=x0>=55-0.25 and x1<=155+0.25 and top>=210-0.25 and bot<=275+0.25
    C.append(R("outer-cover-page","outer cover: text inside x 55-155, y 210-275, centred on 105, TNR 12",f"{G} p.32 dimension arrows","x 55-155; y 210-275",f"x {x0:.2f}-{x1:.2f}; y {top:.2f}-{bot:.2f}; centres {min(ctr)}-{max(ctr)}","-","0.25 mm","PASS" if ok and all(abs(c-105)<=0.5 for c in ctr) else "FAIL","default fixture (2-line title, second advisor); longer titles: LIMITATION"))
    C.append(R("outer-cover-first-baseline","first title baseline 215.53 (INFERRED from p.32 illustration)",f"{G} p.32; spec","215.53",f"{L1[0]['baseline']:.2f}",f"{L1[0]['baseline']-215.53:.2f}","0.5 mm","PASS" if near(L1[0]['baseline'],215.53,0.5) else "FAIL"))
    # inner cover (page 2)
    L=P[1]["L"]
    exp=[50.38,58.94,93.02,127.10,135.61,161.15,186.71,195.22,212.28,220.80,246.37,263.39]
    act=[l["baseline"] for l in L if l["size"]==14]
    ok,dd=cmp_list(act,exp,0.5)
    C.append(R("inner-cover-lines","inner cover 14 pt bold centred baselines",f"{G} p.33 (measured)",exp,[round(a,2) for a in act],dd,"0.5 mm","PASS" if ok else "FAIL"))
    proj=[l for l in L if l["size"]==12]
    C.append(R("inner-cover-project-line","project line 12 pt regular centred baseline 33.87 (33.95 model)",f"{G} p.33","33.95",[round(l['baseline'],2) for l in proj],[round(l['baseline']-33.95,2) for l in proj],"0.5 mm","PASS" if proj and near(proj[0]['baseline'],33.95,0.5) else "FAIL"))
    C.append(R("inner-cover-size-bold","all lines except project line 14pt bold",f"{G} p.33","14 bold",sorted({(l['size'],l['bold']) for l in L if l['size']!=12}),"-","0.1 pt","PASS" if all(l['size']==14 and l['bold'] for l in L if l['size']!=12) else "FAIL"))
    ctr=[(l["x0"]+l["x1"])/2 for l in L]; 
    C.append(R("inner-cover-centre","centred on 105",f"{G} p.33","105.0",f"{min(ctr):.2f}-{max(ctr):.2f}","-","0.5 mm","PASS" if all(abs(c-105)<=0.6 for c in ctr) else "FAIL"))
    txt=" ".join(l["text"] for l in L)
    C.append(R("degree-strings-inner","degree string on covers","spec degree-strings",deg[0],deg[0] in txt,"-","exact","PASS" if deg[0] in txt else "FAIL"))
    # approval page (3)
    L=P[2]["L"]
    def bl(rx): 
        m=[l for l in L if re.match(rx,l["text"])]; return m[0] if m else None
    t=bl(r"^TEZ ONAY")
    C.append(R("approval-title","TEZ ONAY SAYFASI bold centred baseline 33.96",f"{G} p.34","33.96",f"{t['baseline']:.2f} bold={t['bold']} centre {(t['x0']+t['x1'])/2:.2f}",f"{t['baseline']-33.96:.2f}","0.5 mm","PASS" if near(t['baseline'],33.96,0.5) and t['bold'] and near((t['x0']+t['x1'])/2,105,0.6) else "FAIL"))
    s=[l for l in L if 45<l["baseline"]<49][0]
    C.append(R("approval-text","sentence first baseline 48.48, x0 30.0",f"{G} p.34","48.48 / 30.0",f"{s['baseline']:.2f} / {s['x0']:.2f}",f"{s['baseline']-48.48:.2f} / {s['x0']-30:.2f}","0.5 mm","PASS" if near(s['baseline'],48.48,0.5) and near(s['x0'],30,0.5) else "FAIL"))
    adv=bl(r"^Danışman"); colon=[sp for sp in adv["spans"] if sp["text"].startswith(":")][0]
    C.append(R("approval-advisor","Danışman row baseline 92.30, colon x0 67.47",f"{G} p.34 / template tab","92.30 / 67.47",f"{adv['baseline']:.2f} / {colon['x0']:.2f}",f"{adv['baseline']-92.30:.2f} / {colon['x0']-67.47:.2f}","0.5 mm","PASS" if near(adv['baseline'],92.30,0.5) and near(colon['x0'],67.47,0.5) else "FAIL"))
    jur=[l for l in L if re.match(r"^(Başkan|Üye)",l["text"])]
    pit=[round(b["baseline"]-a["baseline"],2) for a,b in zip(jur,jur[1:])]
    lab=jur[0]["spans"][0]["x0"]
    if len(jur)==5:
        C.append(R("approval-jury","jury rows: first 114.19, label x0 42.49, colon 67.47, pitch 14.29 (template)",f"{T} approval rows; {G} p.34","114.19/42.49/67.47/14.29",f"{jur[0]['baseline']:.2f}/{lab:.2f}/pitch {pit}",f"{jur[0]['baseline']-114.19:.2f}","0.5 mm","PASS" if near(jur[0]['baseline'],114.19,0.5) and near(lab,42.49,0.5) and all(near(x,14.29,0.3) for x in pit) else "FAIL","spec decision #7 (guide example pitch 12.91 mm, box 154 wide)"))
    else:
        C.append(R("approval-jury-7","7 jurors (PhD with second advisor): non-source compact layout, text must stay above 267",f"{G} p.34 callout (7 jurors)","NOT_SPECIFIED pitch; last text <= 267",f"first {jur[0]['baseline']:.2f} pitch {pit} last director line {L[-1]['baseline']:.2f}","-","-","NOT_SPECIFIED"))
    # frame
    dr=drawings_mm(P[2]["p"]); tops=sorted({round(x['top'],2) for x in dr if x['width'] in (0.75,3.0,None)})
    thin=[x for x in dr if x['width'] and abs(x['width']-0.75)<0.01]; thick=[x for x in dr if x['width'] and abs(x['width']-3.0)<0.01]
    xs=[x['x0'] for x in thin]+[x['x1'] for x in thin]
    hthin=sorted([x for x in thin if abs(x['bottom']-x['top'])<0.01],key=lambda q:q['top']); hthick=sorted([x for x in thick if abs(x['bottom']-x['top'])<0.01],key=lambda q:q['top'])
    top_thin=hthin[0]; top_thick=hthick[0]
    outer_ok=(top_thin['top']<top_thick['top'])  # thin outside (above), thick inside
    left=min(xs); right=max(xs)
    C.append(R("approval-frame-widths","thin 0.75 pt outside, thick 3 pt inside (Word thickThin/thinThick pair)",f"{G} p.34 drawing (0.25 mm thin + 1.06 mm thick fills); {T} sz 24","thin 0.75 outside, thick 3.0 inside",f"thin lines {len(thin)}, thick {len(thick)}, top thin y {top_thin['top']:.2f} < top thick y {top_thick['top']:.2f}","-","exact","PASS" if len(thin)==4 and len(thick)==4 and outer_ok else "FAIL"))
    C.append(R("approval-frame-x","outer edges x 27.32 / 178.91 (template table)",f"{T} approval table / spec","27.32 / 178.91",f"{left:.2f} / {right:.2f}",f"{left-27.32:.2f} / {right-178.91:.2f}","0.5 mm","PASS" if near(left,27.32,0.5) and near(right,178.91,0.5) else "FAIL","guide example box is 27.31-181.39 (154 wide): spec decision #7 chose the template"))
    if len(jur)==5: C.append(R("approval-box-top","frame top edge 189.0 (guide 189.04 outer / 189.17 line centre)",f"{G} p.34 drawing","189.0-189.17",f"thin line centre {top_thin['top']:.2f}",f"{top_thin['top']-189.17:.2f}","0.5 mm","PASS" if near(top_thin['top'],189.17,0.5) else "FAIL"))
    else: C.append(R("approval-box-top-7","frame top for 7-juror compact layout","-","NOT_SPECIFIED",f"{top_thin['top']:.2f}","-","-","NOT_SPECIFIED"))
    bottom=max(x['bottom'] for x in thin)
    C.append(R("approval-frame-bottom","frame bottom above 267 (page text area)","spec page.margins.bottom","<=267",f"{bottom:.2f}",f"{bottom-267:.2f}","0.5 mm","PASS" if bottom<=267.5 else "FAIL"))
    # director block order
    lines=[l["text"] for l in L if l["baseline"]>190]
    C.append(R("approval-director-block","dots, name, 'Enstitü Müdürü' centred (template order)",f"{T} approval","dots / name / Enstitü Müdürü",lines[-3:],"-","exact","PASS" if lines[-1]=="Enstitü Müdürü" and lines[-3].startswith("……") else "FAIL"))
    # ethics (4)
    L=P[3]["L"]
    exp=[33.96,41.24,55.84,70.37,136.20,150.82,172.70]
    key=[l for l in L if re.match(r"^(BİLİMSEL|Afyon Kocatepe|Fen Bilimleri|- Tez içindeki|beyan ederim|\d\d / \d\d|Çağrı)",l["text"])]
    act=[l["baseline"] for l in key]
    ok,dd=cmp_list(act,exp,0.5)
    C.append(R("ethics-lines","ethics page baselines",f"{G} p.35",exp,[round(a,2) for a in act],dd,"0.5 mm","PASS" if ok else "FAIL"))
    ind=[l for l in L if l["text"].startswith("Fen Bilimleri Enstitüsü, tez")][0]
    C.append(R("ethics-indent","intro first-line indent 12.5 mm",f"{G} p.35 x0 42.51","42.5",f"{ind['x0']:.2f}",f"{ind['x0']-42.5:.2f}","0.5 mm","PASS" if near(ind['x0'],42.5,0.5) else "FAIL"))
    # ÖZET(5) ABSTRACT(6)
    def abstract(pg,deg_s,lang):
        L=P[pg]["L"]
        exp=[33.96,41.16,55.72,75.23,82.56,89.85,97.17,104.45,111.78,126.38]
        # title lines two: 55.72,60.63 then rest shifts by 4.91 ; guide has (Tez Başlığı DEVAM) 60.63; name 75.23 (2-line title)
        act=[l["baseline"] for l in L[:10] if l["baseline"]<130]
        act=act[:1]+act[1:2]+[l["baseline"] for l in L if 55<l["baseline"]<56]+[l["baseline"] for l in L if 75<l["baseline"]<76]+[l["baseline"] for l in L if 82<l["baseline"]<83]+[l["baseline"] for l in L if 89<l["baseline"]<90]+[l["baseline"] for l in L if 97<l["baseline"]<98]+[l["baseline"] for l in L if 104<l["baseline"]<105]+[l["baseline"] for l in L if 111<l["baseline"]<112.5]+[l["baseline"] for l in L if 126<l["baseline"]<127]
        ok,dd=cmp_list(act,exp,0.5)
        return ok,dd,[round(a,2) for a in act],L
    ok,dd,act,L=abstract(4,deg[1],"tr")
    C.append(R("abstract-lines-tr","ÖZET header block baselines (2-line title)",f"{G} p.36",[33.96,41.16,55.72,75.23,82.56,89.85,97.17,104.45,111.78,126.38],act,dd,"0.5 mm","PASS" if ok else "FAIL"))
    ok,dd,act,L=abstract(5,deg[2],"en")
    C.append(R("abstract-lines-en","ABSTRACT header block baselines (2-line title)",f"{G} p.37",[33.96,41.16,55.72,75.23,82.56,89.85,97.17,104.45,111.78,126.38],act,dd,"0.5 mm","PASS" if ok else "FAIL"))
    t6=" ".join(l["text"] for l in P[4]["L"][:3]); t7=" ".join(l["text"] for l in P[5]["L"][:3])
    C.append(R("degree-strings-abstract","ÖZET / ABSTRACT degree strings",f"{G} p.36-37",[deg[1],deg[2]],[deg[1] in t6,deg[2] in t7],"-","exact","PASS" if deg[1] in t6 and deg[2] in t7 else "FAIL"))
    # tail: keywords -> year (per guide text) 
    for pg,nm,kw in ((4,"tr","Anahtar Kelimeler"),(5,"en","Keywords")):
        L=P[pg]["L"]; k=[l for l in L if l["text"].startswith(kw)][0]; y=[l for l in L if re.match(r"^\d{4}, \S+ \+ \d+ (sayfa|pages)",l["text"])][0]
        kl=[l for l in L if l["baseline"]>k["baseline"] and l["baseline"]<y["baseline"]-1]
        last_k=(kl[-1] if kl else k)
        prev=[l for l in L if l["baseline"]<k["baseline"]-1 and l["baseline"]>120][-1]
        g1=(k["baseline"]-prev["baseline"])/PT; g2=(y["baseline"]-last_k["baseline"])/PT
        C.append(R(f"abstract-tail-{nm}","last text line -> Anahtar Kelimeler -> year/pages (+41.4pt each; keywords before year per guide p.18 text)",f"{G} p.18 §4.2.3",'41.4/41.4',f"{g1:.2f}/{g2:.2f}",f"{g1-41.4:.2f}/{g2-41.4:.2f}","0.2 pt","PASS" if near(g1,41.4,0.2) and near(g2,41.4,0.2) else "FAIL","needsConfirmation: guide example page shows the opposite order"))
    # ack
    L=P[6]["L"]; last=[l for l in L if l["baseline"]<125 and l["x0"]<31][-1]; name=[l for l in L if l["text"].startswith(("Çağrı","Ayşe"))][0]
    g=(name["baseline"]-last["baseline"])/PT
    C.append(R("ack-signature","TEŞEKKÜR: last text baseline -> student name (right aligned to 180) 62.1 pt",f"{T} 2 empty lines","62.1",f"{g:.2f} x1 {name['x1']:.2f}",f"{g-62.1:.2f}","0.2 pt","PASS" if near(g,62.1,0.2) and near(name['x1'],180,0.5) else "FAIL"))
    # frontmatter titles
    tt=[]
    for pg in (4,5,6,7):
        l=[x for x in P[pg]["L"] if x["bold"] and x["baseline"]<36][0]; tt.append((l["text"],round(l["baseline"],2),round((l["x0"]+l["x1"])/2,2),l["size"]))
    C.append(R("frontmatter-titles","centred bold 12pt at 33.96",f"{G} p.36-39","33.96 / 105",tt,"-","0.5 mm","PASS" if all(near(b,33.96,0.5) and near(c,105,0.6) and s==12 for _,b,c,s in tt) else "FAIL"))
    # TOC
    L=P[7]["L"]
    say=[l for l in L if l["text"]=="Sayfa"][0]
    C.append(R("toc-sayfa","'Sayfa' bold right-aligned x1 180, baseline 41.23",f"{G} p.39","41.23 / 180.0",f"{say['baseline']:.2f} / {say['x1']:.2f} bold={say['bold']}",f"{say['baseline']-41.23:.2f} / {say['x1']-180:.2f}","0.5 mm","PASS" if near(say['baseline'],41.23,0.5) and near(say['x1'],180,0.5) and say['bold'] else "FAIL"))
    rows=[l for l in L if "...." in l["text"]]
    lvl={}
    for l in rows:
        m=re.match(r"^(\d+(?:\.\d+)*)",l["text"]); 
        k=(m.group(1).count(".")+1) if m and l["text"][len(m.group(1)):len(m.group(1))+1]!="." else 1
        if m and re.match(r"^\d+\. ",l["text"]): k=1
        lvl.setdefault(k,[]).append(round(l["x0"],2))
    exp={1:30.0,2:35.0,3:40.0,4:45.0}
    ok=all(all(near(x,exp[k],0.5) for x in v) for k,v in lvl.items())
    C.append(R("toc-indent","TOC entry x0 per level",f"{T} TOC1-5 / {G} p.39","30/35/40/45",{k:(min(v),max(v)) for k,v in lvl.items()},"-","0.5 mm","PASS" if ok else "FAIL"))
    ends=[l["x1"] for l in rows]
    C.append(R("toc-leader","dot leaders; page numbers right at 179.84",f"{G} p.39 / {T} tab 8504","179.84",f"x1 {min(ends):.2f}-{max(ends):.2f}; leaders in all {len(rows)} rows","-","0.5 mm","PASS" if all(near(e,179.84,0.5) for e in ends) else "FAIL"))
    ys=[l["baseline"] for l in rows if l["x0"]<47]; pit=[round((b-a)/PT,2) for a,b in zip(ys,ys[1:])]
    C.append(R("toc-pitch","TOC row pitch 20.7",f"{G} p.39","20.7",f"{min(pit)}-{max(pit)}","-","0.2 pt","PASS" if all(near(p,20.7,0.2) for p in pit) else "FAIL"))
    # lists pages 10(symbols)? find pages by title
    def page_of(t): 
        return [p for p in P if any(l["bold"] and l["text"]==t for l in p["L"])][0]
    for t,nm in (("ŞEKİLLER DİZİNİ","fig"),("ÇİZELGELER DİZİNİ","tab"),("RESİMLER DİZİNİ","photo")):
        pg=page_of(t); L=pg["L"]
        rows=[l for l in L if re.match(r"^(Şekil|Çizelge|Resim) \d",l["text"])]
        sayfa=[l for l in L if l["text"]=="Sayfa"][0]
        pit=[round((b["baseline"]-a["baseline"])/PT,2) for a,b in zip(L[2:],L[3:]) if b["baseline"]<250 and a["x0"]<31]
        lab_bold=all(any(s["bold"] for s in r["spans"]) for r in rows)
        C.append(R(f"list-{nm}","list page: title 33.96, 'Sayfa' 41.24 right, first row 48.48, bold label, single spacing + 6pt (19.8 pt between rows)",f"{G} p.41-42; {T} image2.jpg",'33.96/41.24/48.48; 19.8',f"title {L[0]['baseline']:.2f}; Sayfa {sayfa['baseline']:.2f} x1 {sayfa['x1']:.2f}; first row {rows[0]['baseline']:.2f}; pitches {pit[:4]}; label bold {lab_bold}","-","0.5 mm / 0.2 pt","PASS" if near(L[0]['baseline'],33.96,0.5) and near(sayfa['baseline'],41.24,0.5) and near(rows[0]['baseline'],48.55,0.5) and lab_bold else "FAIL","guide example rows are 20.7 pt / 0 after; template screenshot 19.8 (spec decision #8)"))
    return C
if __name__=="__main__":
    v=sys.argv[3]; deg=("YÜKSEK LİSANS TEZİ","Yüksek Lisans Tezi","M.Sc. Thesis") if v=="master" else ("DOKTORA TEZİ","Doktora Tezi","Ph.D. Thesis")
    for c in specials(sys.argv[1],v,deg): print(c['result'],c['id'],'|',str(c['actual'])[:160],'|',str(c['difference'])[:60])
