import re,sys
x=open('orchestration/engine-work/final-closure/long/work/src09.xml',encoding='utf8').read()
tbls=[];depth=0
for m in re.finditer(r'<w:tbl>|</w:tbl>',x):
    if m.group(0)=='<w:tbl>':
        if depth==0: st=m.start()
        depth+=1
    else:
        depth-=1
        if depth==0: tbls.append(x[st:m.end()])
def info(ti):
    t=tbls[ti]
    print('TABLE',ti,len(t))
    print(re.sub(r'w:rsid\w*="[^"]*"|w14:\w+="[^"]*"','',re.search(r'<w:tblPr>.*?</w:tblPr>',t,re.S).group(0))[:600])
    print(re.search(r'<w:tblGrid>.*?</w:tblGrid>',t,re.S).group(0)[:300])
    rows=re.findall(r'<w:tr[ >].*?</w:tr>',t,re.S)
    for ri,r in enumerate(rows):
        h=re.search(r'<w:trHeight[^>]*>',r)
        trp=re.search(r'<w:trPr>.*?</w:trPr>',r,re.S)
        cs=re.findall(r'<w:tc>.*?</w:tc>',r,re.S)
        info=[]
        for c in cs:
            tcpr=re.search(r'<w:tcPr>.*?</w:tcPr>',c,re.S); tp=tcpr.group(0) if tcpr else ''
            fl=[]
            for k in ['vMerge','gridSpan','textDirection','vAlign','noWrap','hideMark']:
                mm=re.search(r'<w:%s[^>]*>'%k,tp)
                if mm: fl.append(re.sub(r'<w:|/?>|w:val=','',mm.group(0)))
            nparas=c.count('<w:p ')+c.count('<w:p>')
            info.append(','.join(fl)+f'#{nparas}')
        txt=re.sub(r'<[^>]+>','',r)[:24]
        print(ri,re.sub(r'<w:|/?>|w:','',trp.group(0))[:90] if trp else None,len(cs),'|'.join(info[:6]),txt)
for a in sys.argv[1:]: info(int(a))
