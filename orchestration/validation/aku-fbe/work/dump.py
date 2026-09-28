import sys; sys.path.insert(0,'/home/user/TxtNote-Template-Work/orchestration/tools')
from pdfmeasure import *
d=open_pdf(sys.argv[1]); pages=[int(x) for x in sys.argv[2].split(',')] if len(sys.argv)>2 and sys.argv[2]!='all' else range(1,len(d)+1)
for pn in pages:
    p=d[pn-1]; print('=== page',pn)
    for l in visual_lines(p):
        print('%7.2f x0=%6.2f x1=%6.2f sz=%s %s %s'%(l['baseline'],l['x0'],l['x1'],l.get('size'),'B' if l.get('bold') else ' ',l['text'][:90]))
