import sys,fitz
w=fitz.open('orchestration/engine-work/mission01/references/SRC09/word.pdf')
for p in map(int,sys.argv[1:]):
    pg=w[p-1]; ys=[]
    for d in pg.get_drawings():
        r=d['rect']
        if r.width>300 and r.height<2: ys.append(round(r.y0,1))
    ys=sorted(set(ys)); print(p,ys)
