"""Recheck the core rules of retained source-based layouts without replacing their geometry."""
import importlib
import json
from pathlib import Path

builder=importlib.import_module('rebuild-ege')
ROOT=builder.ROOT
rows=builder.load(builder.OUT/'sources.json')
results=[]
fields={**{f'page.margins.{s}':('page','margins',s+'Mm') for s in ('top','bottom','left','right')},
        **{f'body.{s}':('typography','body',s) for s in ('fontFamily','fontSizePt','lineHeight','firstLineIndentMm')}}

for path in builder.ARCHIVE.glob('*/*.json'):
    template=builder.load(path)
    if template['status']!='official':
        continue
    documents=[r for r in rows if r['university']==template['universityName'] and Path(r['path']).name in template['source'].get('documentName','')]
    if template['id']=='adu-ziraat-lisans-tr-v1':
        documents=[r for r in rows if r['key']=='ab051fc935a6e82f']
    checks=[];conflicts=[]
    textual_guides=[r for r in documents if __import__('re').search(r'Kilavuz|Klavuz|Guide|Yonerge',Path(r['path']).name,__import__('re').I)]
    for source in textual_guides or documents:
        for key,rule in builder.safe_rules(source).items():
            if key not in fields:
                continue
            keys=fields[key]
            actual=template.get(keys[0],{}).get(keys[1],{}).get(keys[2])
            if actual is None:
                continue
            expected=rule['value']
            match=actual==expected or (isinstance(actual,(int,float)) and isinstance(expected,(int,float)) and abs(actual-expected)<=0.5)
            entry={'field':'.'.join(keys),'template':actual,'sourceValue':expected,'source':source['path'],'evidence':rule['evidence']}
            (checks if match else conflicts).append(entry)
    # This is a core-rule recheck, explicitly not a new visual PASS certificate.
    audit={'checkedAt':'2026-10-23','status':'CORE_RECHECKED' if not conflicts else 'CORE_CONFLICT',
           'layoutRebuilt':False,'visualConformanceRechecked':False,
           'documents':[{'path':r['path'],'sha256':r['sha256']} for r in documents],
           'checkedFields':checks,'conflicts':conflicts}
    template['source']['regionalAudit']=audit
    path.write_text(json.dumps(template,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
    results.append({'id':template['id'],'checkedFields':len(checks),'conflicts':len(conflicts),'sources':len(documents)})
(ROOT/'engine/references/ege-rebuild/retained-layout-audit.json').write_text(json.dumps(results,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print(json.dumps({'layouts':len(results),'checkedCoreFields':sum(r['checkedFields'] for r in results),'conflicts':sum(r['conflicts'] for r in results)}))
