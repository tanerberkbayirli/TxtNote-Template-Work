import sys,re; sys.path.insert(0,'/home/user/TxtNote-Template-Work/orchestration/tools')
from pdfmeasure import *
import pymupdf
def labels(d):
    out={}
    for i,p in enumerate(d,1):
        L=visual_lines(p)
        n=[l['text'].strip() for l in L if l['baseline']>281 and l['size']==10.0]
        out[i]=n[0] if n else None
    return out
def words_lines(p):
    """visual lines with words (text as joined by pdfmeasure)."""
    return visual_lines(p)
def run(f):
    d=open_pdf(f); lab=labels(d)
    # TOC pages: find page starting with İÇİNDEKİLER DİZİNİ
    toc=[i for i in lab if visual_lines(d[i-1]) and visual_lines(d[i-1])[0]['text'].startswith('İÇİNDEKİLER')][0]
    rows=[];cur=''
    pn=toc
    while True:
        L=visual_lines(d[pn-1]); started=False
        for l in L:
            if l['baseline']>281 and l['size']==10.0: continue
            t=l['text']
            if t.startswith('İÇİNDEKİLER DİZİNİ') and pn==toc and l['baseline']<40: continue
            if t.strip()=='Sayfa': continue
            cur+=(' ' if cur else '')+t
            m=re.match(r'^(.*?)\s*\.{5,}\s*([ivxlc]+|\d+)\s*$',cur)
            if m: rows.append((m.group(1).strip(),m.group(2),pn)); cur=''
        # next page continues if the next page's first line looks like a toc row
        nxt=pn+1
        if nxt>len(d): break
        Ln=visual_lines(d[nxt-1])
        if Ln and re.search(r'\.{8,}',Ln[0]['text']): pn=nxt; continue
        break
    # heading map
    fails=[];ok=0
    for title,pg,_ in rows:
        norm=lambda s: re.sub(r'\s+','',s)
        found=None
        for i in range(1,len(d)+1):
            if i<=toc-0 and False: pass
            L=visual_lines(d[i-1])
            # heading is first line(s) on the page for chapters, anywhere for sub headings
            txt=[norm(l['text']) for l in L]
            joined=norm(''.join(l['text'] for l in L[:3]))
            if any(norm(title)==t or (norm(title).startswith(t) and len(t)>8 and norm(title) in norm(''.join(txt))) for t in txt) or norm(title) in norm(''.join(txt)):
                # skip pages that are TOC itself, unless title is a toc title
                if i in range(toc,pn+1) and not title.startswith('İÇİNDEKİLER'): continue
                if re.search(r'\.{8,}',''.join(l['text'] for l in L)) and not title.startswith('İÇİNDEKİLER') and i>=toc and i<=pn+6 and any(re.search(r'\.{8,}',l['text']) for l in L): continue
                found=i;break
        real=lab.get(found)
        good = (real==pg)
        ok+=good
        if not good: fails.append((title,pg,found,real))
    return lab,rows,fails,ok
if __name__=='__main__':
    lab,rows,fails,ok=run(sys.argv[1])
    print(len(rows),'rows;',ok,'ok; fails:'); 
    for f in fails: print(f)
    print({k:v for k,v in lab.items()})
