import sys
sys.path.insert(0,'orchestration/tools')
from pdfmeasure import *
B='orchestration/validation/aku-matematik-lisans/self-1/'
docs={'ED':open_pdf(B+'mat.pdf'),'WD':open_pdf(B+'mat.word.pdf'),'OF':open_pdf('orchestration/artifacts/aku-matematik-lisans/source/official.pdf')}
def show(tag,pg,n=12,flt=None):
    d=docs[tag]
    L=[l for l in visual_lines(d[pg-1])]
    print(f'--{tag} p{pg}')
    for l in L[:n]:
        print(f"  x0={l['x0']:.1f} x1={l['x1']:.1f} bl={l['baseline']:.2f} sz={l['size']:.1f} {'B' if l['bold'] else ' '} {l['text'][:48]}")
if __name__=='__main__':
    args=sys.argv[1:]
    for a in args:
        tag,pg=a.split(':'); show(tag,int(pg),int(sys.argv[0] and 14))
