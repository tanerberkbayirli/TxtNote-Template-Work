import sys,json
sys.path.insert(0,'.')
import importlib.util
src=open('mkjust.py',encoding='utf8').read().split("tail=")[0]
exec(src)
tail=' predictions while comparing the real occurred observations and it contains examples that have been incorrectly classified as negative and are therefore actually positive.'
variants={
 'A':'False Negative: This value is calculated by finding the model’s “False Negative”',
 'B':"False Negative: This value is calculated by finding the model's \"False Negative\"",
 'C':'False Negative: This value is calculated by finding the model False Negative',
 'D':'False Negative: This value is calculated by finding the model’s False Negative',
}
paras=[];meta=[]
for key,txt in variants.items():
    for i in range(0,41):
        W=372+i*0.5
        right=round((453.5-W)*20)
        paras.append(([(txt+tail,False)],right));meta.append((key,W,txt))
build('j2.docx',paras)
json.dump({'variants':variants},open('j2.json','w'))
