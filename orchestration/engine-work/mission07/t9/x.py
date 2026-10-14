import json,re,zipfile,sys
a=json.load(open('orchestration/engine-work/mission01/acceptance-v3.json',encoding='utf8'));c=[c for c in a['cases'] if c['id']==sys.argv[1]][0];p=(c.get('input') or c['inputs'][0])['path']
z=zipfile.ZipFile(p);d=z.read('word/document.xml').decode();st=z.read('word/styles.xml').decode()
key=sys.argv[2]
i=d.find(key); s=d.rfind('<w:tbl>',0,i); print(d[s:s+2000]); j=d.find('Accuracy',i); print('....',d[j-1200:j+100])
print('DEFAULTS',re.search(r'<w:docDefaults>.*?</w:docDefaults>',st,re.S).group(0)[:800])
for sid in re.findall(r'<w:tblStyle w:val="([^"]+)"',d[s:s+3000])+['Normal','TableNormal']:
  m=re.search(r'<w:style [^>]*w:styleId="%s".*?</w:style>'%sid,st,re.S); print(sid,m and m.group(0)[:1000])
