import json,re,zipfile,sys
a=json.load(open('orchestration/engine-work/mission01/acceptance-v3.json',encoding='utf8'));c=[c for c in a['cases'] if c['id']==sys.argv[1]][0];p=(c.get('input') or c['inputs'][0])['path']
d=zipfile.ZipFile(p).read('word/document.xml').decode()
i=d.rfind(sys.argv[2]); s=d.rfind('</w:tbl>',0,i); e=d.find('<w:tbl>',s); print(e-s); print(re.sub(r'w14:\w+="[^"]*"|w:rsid\w*="[^"]*"','',d[s:e])[:3000])
