import json,sys,time,os
id=sys.argv[1] if len(sys.argv)>1 else 'SRC09'
R='orchestration/engine-work/mission07/result.json'
src=open('orchestration/engine-work/mission07/extract.js',encoding='utf8').read()
t0=time.time()
while time.time()-t0<900:
    if os.path.exists(R): os.remove(R)
    open('orchestration/engine-work/mission07/cmd.js','w',encoding='utf8').write(src)
    t1=time.time()
    while not os.path.exists(R) and time.time()-t1<60: time.sleep(.5)
    time.sleep(.3)
    if os.path.exists(R):
        r=json.load(open(R,encoding='utf8'))
        if r['ok'] and r['v']:
            json.dump(r['v'],open(f'orchestration/engine-work/mission07/{id}.pages.json','w',encoding='utf8'));print('sheets',len(r['v']));break
    time.sleep(8)
