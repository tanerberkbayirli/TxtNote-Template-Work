import json,pymupdf,functools
doc=pymupdf.open('orchestration/engine-work/final-closure/long/table-only-word.pdf')
segments=[]
for i,p in enumerate(doc):
 ys=sorted({round(x['rect'].y0,2) for x in p.get_drawings() if x['rect'].width>200 and x['rect'].height<1})
 for a,b in zip(ys,ys[1:]):segments.append({'page':i+1,'top':a,'bottom':b,'height':b-a})
table=json.load(open('orchestration/engine-work/final-closure/long/table-only/SRC09_TABLE_ONLY.tables.json',encoding='utf-8-sig'))[0]
# A single source bullet line is 11.5 pt in Word; browser computed pitch is the
# same font metric, scaled by the editor's fit-to-width transform.
scale=table['lists'][0]['height']/11.5
rows=[sum(x['height'] for x in row['rects'])/scale for row in table['allRows']]
@functools.lru_cache(None)
def match(r,s):
 if r==len(rows):return (0,[]) if s==len(segments) else (1e12,[])
 if s==len(segments):return 1e12,[]
 options=[];height=0
 for e in range(s,min(len(segments),s+4)):
  if e>s and segments[e]['page']==segments[e-1]['page']:break
  height+=segments[e]['height']
  cost,path=match(r+1,e+1)
  options.append((cost+abs(height-rows[r]),[(s,e,height)]+path))
 return min(options,key=lambda x:x[0])
cost,path=match(0,0)
report={'status':'DIAGNOSTIC_ALIGNMENT','wordPages':len(doc),'editorPages':30,'scale':scale,'absoluteHeightErrorPt':cost,'rows':[]}
for i,(s,e,h) in enumerate(path):
 report['rows'].append({'row':i+1,'text':table['allRows'][i]['text'],'editorHeightPt':round(rows[i],2),'wordHeightPt':round(h,2),'deltaPt':round(rows[i]-h,2),'wordStartPage':segments[s]['page'],'wordEndPage':segments[e]['page']})
json.dump(report,open('orchestration/engine-work/final-closure/long/table-row-comparison.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
for row in report['rows']:
 if abs(row['deltaPt'])>10:print(row)
print('COST',cost,'Word',len(doc),'editor',30,'rows',len(path))
