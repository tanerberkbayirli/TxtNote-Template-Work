"""Freeze Mission 03 only when native import and prior-regression gates hold."""
from pathlib import Path
import argparse, collections, hashlib, json, re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'orchestration/engine-work/mission03'
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def log(p):
    b=p.read_bytes(); return b.decode('utf-16' if b.startswith(b'\xff\xfe') else 'utf-8-sig')
def asset(p): return {'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def failed(r):
    return {c['id']:{k:c.get(k) for k in ['status','kind','expected','actual','delta','tolerance']}
            for c in r['checks'] if c['status'] in ['FAIL','CONFLICT']}

def freeze():
    source=read(OUT/'source-verification.json'); oracle=read(OUT/'source-oracle.json')
    expected=read(ROOT/'orchestration/engine-work/mission01/acceptance-v3.json')['missionCoverage']['03']['development']
    assert source['status']=='PASS' and len(source['cases'])==9
    assert {r['id'] for r in source['cases']}==set(expected)
    assert all(r['status']=='PASS' for r in source['cases'])
    dom=read(OUT/'dom-verification.json')
    assert dom['status']=='PASS' and {r['id'] for r in dom['cases']}==set(expected)
    browser=read(OUT/'browser-verification.json')
    assert browser['status']=='PASS' and not browser['pageErrors']
    assert {r['id'] for r in browser['nativeCases']}=={'EDGE_STRUCTURE','EDGE_NOTES'}
    assert all(r['status']=='PASS' for r in browser['nativeCases'])
    unit=log(OUT/'unit-tests.log')
    assert '# tests 769' in unit and '# pass 769' in unit and '# fail 0' in unit
    assert '# skipped 0' in unit and '# cancelled 0' in unit
    build=log(OUT/'build.log'); assert 'built in' in build and 'dist/assets/import.worker-' in build
    previous=read(ROOT/'orchestration/engine-work/mission02/completion.json')
    baseline={}; paths=[]
    for a in previous['assets']:
        if a['path'].startswith('orchestration/engine-work/mission02/final-regression/') and '/check-' in a['path'] and a['path'].endswith('.json'):
            p=ROOT/a['path']; assert sha(p)==a['sha256']; r=read(p); baseline[r['target']]=(p,r)
    assert len(baseline)==23
    current=read(OUT/'regression-manifest.json'); assert len(current['targets'])==23 and not current['wordRequested']
    retry=read(OUT/'retry-serial-manifest.json'); replacements={r['target']:r for r in retry['targets']}
    assert set(replacements)=={r['target'] for r in current['targets'] if r['error']}
    current['targets']=[replacements.get(r['target'],r) for r in current['targets']]
    totals=collections.Counter(); comparisons=[]
    for row in current['targets']:
        assert row['report'] and not row['error'], row
        p=ROOT/row['report']; r=read(p); bp,old=baseline[row['target']]
        assert failed(r)==failed(old), (row['target'],failed(r),failed(old))
        assert r['counts']==old['counts'], (row['target'],r['counts'],old['counts'])
        totals.update(r['counts']); paths.extend([p,bp])
        comparisons.append({'target':row['target'],'status':'UNCHANGED_FROM_MISSION02','counts':r['counts'],'failureIds':sorted(failed(r))})
    assert totals['FAIL']==6 and not totals['CONFLICT']
    for row in oracle['cases']:
        p=ROOT/row['input']['path']; assert sha(p)==row['input']['sha256']; paths.append(p)
    frontend=ROOT/'TxtNote/frontend'
    files=['package.json','package-lock.json','src/thesis/importDocx.js','src/thesis/contentModel.js',
        'src/thesis/engine.js','src/thesis/schema.d.ts','src/thesis/README.md','src/thesis/CAPABILITIES.md',
        'src/thesis/docx/importPackage.js','src/thesis/docx/properties.js','src/thesis/docx/projection.js',
        'src/thesis/docx/import.worker.js','src/features/editor/WordImportReview.jsx',
        'src/features/editor/ThesisEditor.jsx','src/features/editor/ThesisRibbon.jsx','src/features/editor/ribbon/FileTab.jsx',
        'src/features/workarea/DocumentPane.jsx','src/features/canvas/Canvas.jsx','tests/thesis-fixture.jsx',
        'src/lib/thesisDocxImport.test.js','src/lib/fixtures/docxImportFixture.js']
    paths.extend(frontend/f for f in files)
    paths.extend(ROOT/f for f in ['orchestration/MISSION.md','orchestration/engine-work/mission03/.gitignore','orchestration/engine-work/mission03_sources.py','orchestration/engine-work/verify_mission03_sources.mjs',
        'orchestration/engine-work/verify_mission03_dom.mjs','orchestration/engine-work/verify_mission03_browser.mjs','orchestration/engine-work/close_mission03.py'])
    paths.extend(OUT/f for f in ['README.md','source-oracle.json','source-verification.json','dom-verification.json',
        'browser-verification.json','browser-final.png','browser-EDGE_STRUCTURE.png','browser-EDGE_NOTES.png',
        'unit-tests.log','build.log','regression-manifest.json','regression.log','retry-manifest.json','retry.log',
        'retry-final-manifest.json','retry-final.log','retry-serial-manifest.json','retry-serial.log'])
    result={'mission':'03','status':'COMPLETE_DOCX_STRUCTURAL_IMPORT','date':'2026-10-09',
        'scope':'Production DOCX structural import, located preservation reports and legacy DOC conversion guidance. Native-object/Word/PDF visual parity remains in Missions 05–12.',
        'sourceCases':9,'unitTests':769,'unitSkipped':0,'build':'PASS','workerBuild':'PASS',
        'sourceParagraphs':sum(r['bodyParagraphs'] for r in source['cases']),
        'sourceRuns':sum(r['bodyRuns'] for r in source['cases']),
        'sourceTextNodes':sum(r['bodyTextNodes'] for r in source['cases']),
        'packagePartsVerified':sum(r['parts'] for r in source['cases']),
        'sourceSections':sum(r['sections'] for r in source['cases']),
        'browserObjectsReparsed':sum(s['objects'] for c in dom['cases'] for s in c['sections']),
        'browser':browser,'broaderRegressionCounts':dict(totals),'wordRequested':False,
        'regressionStatus':'23 targets unchanged from Mission 02; 6 existing failures and Word-only skips are not passes',
        'retriedTargets':sorted(replacements),'retryExecution':'CHECK_EXPORT_JOBS=1; unchanged pagination gates and measurement tolerances',
        'regressionComparisons':comparisons,'assets':[asset(p) for p in sorted(set(paths))]}
    (OUT/'completion.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def verify():
    contract=read(OUT/'completion.json')
    failures=[r['path'] for r in contract['assets'] if not (ROOT/r['path']).is_file() or sha(ROOT/r['path'])!=r['sha256']]
    result={'status':'FAIL' if failures else 'PASS','mission03':contract['status'],'assetsChecked':len(contract['assets']),'failures':failures}
    (OUT/'completion-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result)); return bool(failures)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--freeze',action='store_true')
    if p.parse_args().freeze: freeze()
    raise SystemExit(verify())
