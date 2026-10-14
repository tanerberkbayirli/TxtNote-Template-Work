import sys;sys.path.insert(0,'orchestration/tools/measurement-packages');import pymupdf
for ext in ['.pdf','.word.pdf']:
 d=pymupdf.open('orchestration/engine-work/final-closure/special/families/aku-fbe-master-tr-v1'+ext)
 print(ext,len(d))
 for n,p in enumerate(d):print(n+1,len(p.get_text()),p.get_text()[:85].replace('\n',' | '),p.get_text()[-85:].replace('\n',' | '))
