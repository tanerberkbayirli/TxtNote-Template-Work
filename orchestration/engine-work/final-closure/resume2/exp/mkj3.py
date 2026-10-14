import sys
src=open('mkjust.py',encoding='utf8').read().split("tail=")[0]
exec(src)
tail=' predictions while comparing the real occurred observations and it contains examples that have been incorrectly classified as negative and are therefore actually positive.'
txt='False Negative: This value is calculated by finding the model’s “False Negative”'
paras=[]
for bold in (True,False):
    lo,hi=(382.4,384.4) if bold else (379.2,380.7)
    n=int(round((hi-lo)/0.05))+1
    for i in range(n):
        W=lo+i*0.05
        right=round((453.5-W)*20)
        runs=[('False Negative:',bold),(txt[len('False Negative:'):]+tail,False)]
        paras.append((runs,right))
build('j3.docx',paras)
print(len(paras))
