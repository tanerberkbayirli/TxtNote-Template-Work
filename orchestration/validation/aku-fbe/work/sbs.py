import sys,pymupdf
from PIL import Image
R='/home/user/TxtNote-Template-Work/orchestration/'
def sbs(items,out,dpi=75):
    ims=[]
    for f,pn in items:
        d=pymupdf.open(f); pix=d[pn-1].get_pixmap(dpi=dpi); ims.append(Image.frombytes('RGB',(pix.width,pix.height),pix.samples))
    W=sum(i.width for i in ims)+10*(len(ims)-1); H=max(i.height for i in ims)
    c=Image.new('RGB',(W,H),(200,200,200)); x=0
    for i in ims: c.paste(i,(x,0)); x+=i.width+10
    c.save(R+'validation/aku-fbe/renders/'+out)
if __name__=='__main__':
    a=sys.argv; out=a[1]; items=[(a[i],int(a[i+1])) for i in range(2,len(a),2)]; sbs(items,out)
