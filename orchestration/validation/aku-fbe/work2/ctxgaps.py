import sys,os,re; sys.path.insert(0,"/home/user/TxtNote-Template-Work/orchestration/tools")
from pdfmeasure import *
def gaps(pdf):
    d=open_pdf(pdf); out={}
    L=[]
    for i,p in enumerate(d):
        for l in visual_lines(p): L.append((i+1,l))
    first=min(pg for pg,l in L if re.match(r"^1\. G",l["text"]) and l["bold"])
    L=[(pg,l) for pg,l in L if pg>=first]
    def find(rx,after=None):
        for pg,l in L:
            if re.match(rx,l["text"]): return pg,l
    def eqline(name):
        for pg,l in L:
            if re.match(r'^%s = p\w?\s*(\(\d+\.\d+\))?$'%name,l["text"]) : return pg,l
    def g(a,b): return round(b[1]["baseline"]-a[1]["baseline"],2) if a and b and a[0]==b[0] else None
    E={n:eqline(n) for n in ["qa","qb","qc","qd","qe","qf","qg","qh","qi","qj","qk","ql","qm","qn","qo","qs"]}
    m=lambda rx: find(rx)
    out["A para->eq"]=g(m("A1"),E["qa"]); out["A eq->para"]=g(E["qa"],m("A2"))
    out["B head->eq"]=g(m(r"2\.1 ?B"),E["qb"]) or g(m(r"^2\.\d ?B"),E["qb"]); out["B eq->para"]=g(E["qb"],m("B2"))
    out["C para->eq1"]=g(m("C1"),E["qc"]); out["C eq1->eq2"]=g(E["qc"],E["qd"]); out["C eq2->para"]=g(E["qd"],m("C2"))
    out["D caption->eq"]=g(m(r"Şekil 2\.1 D"),E["qe"]); out["D eq->para"]=g(E["qe"],m("D2"))
    # last table row before eq f: find line "3 4" on that page
    def tl(rx,pg):
        c=[l for p_,l in L if p_==pg and re.match(rx,l["text"])]; return (pg,c[-1]) if c else None
    if E["qf"]: out["E table->eq"]=g(tl(r"^3 4$",E["qf"][0]),E["qf"]); out["E eq->para"]=g(E["qf"],m("E2"))
    if E["qg"]: out["F note->eq"]=g(m(r"Not: F"),E["qg"]); out["F eq->para"]=g(E["qg"],m("F2"))
    out["G eq->heading"]=g(E["qh"],m(r"^2\.\d ?G")); 
    if E["qi"]: out["H eq->caption(fig)"]=g(E["qi"],m(r"Şekil 2\.2 H"))
    if E["qj"]: out["I eq->table caption"]=g(E["qj"],m(r"Çizelge 2\.3 I"))
    if E["qk"]: out["K eq at page top: baseline-33.95"]=round(E["qk"][1]["baseline"]-33.95,2); out["K eq->para"]=g(E["qk"],m("K2"))
    if E["ql"]: out["M list->eq"]=g(m(r"• M liste 2"),E["ql"])
    if E["qm"]: out["N eq->list"]=g(E["qm"],m(r"• N liste 1"))
    if E["qn"]: out["O fn-para->eq"]=g(m("O1"),E["qn"]); out["O eq->para"]=g(E["qn"],m("O2"))
    if E["qo"]: out["P eq->note"]=g(E["qo"],m(r"Not: P"))
    if E["qs"]: out["S chapter head->eq"]=g(m(r"^3\. "),E["qs"]); out["S eq->para"]=g(E["qs"],m("S2"))
    q=[(pg,l) for pg,l in L if re.match(r'^q =$',l["text"])]
    return out
if __name__=="__main__":
    for f in sys.argv[1:]:
        print(os.path.basename(f)); 
        for k,v in gaps(f).items(): print(f"   {k:38s} {v}")
