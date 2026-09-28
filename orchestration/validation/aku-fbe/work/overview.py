import sys; sys.path.insert(0,'/home/user/TxtNote-Template-Work/orchestration/tools')
from pdfmeasure import *
d=open_pdf(sys.argv[1])
for i,p in enumerate(d,1):
    L=visual_lines(p)
    body=[l for l in L if l['baseline']<280 or l['size']!=10.0]
    nums=[l for l in L if l['baseline']>281 and l['size']==10.0]
    bl=[l for l in L if not(l['baseline']>281 and l['size']==10)]
    first=bl[0] if bl else None; last=bl[-1] if bl else None
    print('%2d n=%2d first %6.2f "%s" | last %6.2f "%s" | num=%s'%(i,len(bl),first['baseline'] if first else 0,first['text'][:34] if first else '',last['baseline'] if last else 0,last['text'][:34] if last else '',[n['text'] for n in nums]))
