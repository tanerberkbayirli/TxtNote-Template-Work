"""Close Mission 04 only with source, UI, production CSP and regression evidence."""
from pathlib import Path
import argparse,collections,hashlib,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'orchestration/engine-work/mission04'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def asset(p):return {'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def log(p):
    b=p.read_bytes();return b.decode('utf-16' if b.startswith(b'\xff\xfe') else 'utf-8-sig')
def failed(r):return {c['id']:{k:c.get(k) for k in ['status','kind','expected','actual','delta','tolerance']} for c in r['checks'] if c['status'] in ['FAIL','CONFLICT']}
def freeze():
    paths=[]
    inputs=read(OUT/'inputs.json');assert {r['id'] for r in inputs}=={'SRC02','EDGE_SCAN'}
    for row in inputs:
        p=ROOT/row['input']['path'];assert sha(p)==row['input']['sha256'];paths.append(p)
        for ref in row['references'].values():
            p=ROOT/ref['path'];assert sha(p)==ref['sha256'];paths.append(p)
    source=read(OUT/'source-verification.json');oracle=read(OUT/'oracle-verification.json')
    for evidence in [source,oracle]:
        assert evidence['status']=='PASS' and {c['id'] for c in evidence['cases']}=={'SRC02','EDGE_SCAN'}
        assert all(c['status']=='PASS' for c in evidence['cases'])
    assert {c['id']:c['pages'] for c in source['cases']}=={'SRC02':43,'EDGE_SCAN':3}
    assert not source['errors'] and not source['externalRequests']
    for case in oracle['cases']:
        assert case['exactOriginalPdfPreserved'] and case['allExtractedTokensPreservedExactlyOnce']
        assert len(case['pages'])==next(c['physicalPages'] for c in inputs if c['id']==case['id'])
    browser=read(OUT/'browser-verification.json');academic=read(OUT/'academic-verification.json');csp=read(OUT/'csp-verification.json')
    assert browser['status']=='PASS' and not browser['pageErrors'] and not browser['externalRequests']
    for key in ['previewCancel','invalidInputPreserved','acknowledgementRequired','textRoleOrderAndCellCorrection','atomicApply','editReloadPreserved','cancelPreserved']:assert browser[key]
    assert academic['status']=='PASS' and {c['surface'] for c in academic['cases']}=={'pane','canvas'}
    for row in academic['cases']:
        assert row['status']=='PASS' and row['pages']==3 and not row['pageErrors'] and not row['externalRequests']
        for k in ['setupCancelPreserved','stagedContentPreserved','acknowledgementRequired','realRouterAllPages','reloadAllPages']:assert row[k]
    assert csp['status']=='PASS' and csp['productionBundle'] and csp['pages']==3 and not csp['violations'] and not csp['externalRequests']
    assert csp['csp']==read(ROOT/'TxtNote/src-tauri/tauri.conf.json')['app']['security']['csp']
    unit=log(OUT/'unit-tests.log')
    for line in ['# tests 778','# pass 778','# fail 0','# skipped 0','# cancelled 0']:assert line in unit,line
    build=log(OUT/'build.log');assert 'built in' in build and 'dist/assets/importPdf-' in build
    bundles=read(OUT/'bundled-assets.json');assert bundles['status']=='PASS'
    for row in bundles['files']:
        p=ROOT/'TxtNote/frontend/public'/row['path'];assert sha(p)==row['sha256'] and p.stat().st_size==row['bytes'];paths.append(p)
    previous=read(ROOT/'orchestration/engine-work/mission03/completion.json');baseline={}
    for row in previous['assets']:
        if row['path'].startswith('orchestration/engine-work/mission03/') and '/check-' in row['path'] and row['path'].endswith('.json'):
            p=ROOT/row['path'];assert sha(p)==row['sha256'];r=read(p);baseline[r['target']]=(p,r)
    assert len(baseline)==23,len(baseline)
    current={}
    for folder in ['regression','resume-regression','retry-regression']:
        for p in sorted((OUT/folder).glob('*/check-*.json')):
            r=read(p);current[r['target']]=(p,r)
    assert set(current)==set(baseline),(set(baseline)-set(current),set(current)-set(baseline))
    resume=read(OUT/'resume-manifest.json');assert len(resume['targets'])==7 and not resume['wordRequested']
    retry=read(OUT/'retry-manifest.json');assert len(retry['targets'])==1 and not retry['wordRequested']
    replacements={r['target']:r for r in retry['targets']}
    assert set(replacements)=={r['target'] for r in resume['targets'] if r['error']}
    assert all(r['report'] and not r['error'] for r in [replacements.get(r['target'],r) for r in resume['targets']])
    totals=collections.Counter();comparisons=[]
    for target,(p,r) in sorted(current.items()):
        bp,old=baseline[target];assert r['counts']==old['counts'],(target,r['counts'],old['counts'])
        assert failed(r)==failed(old),(target,failed(r),failed(old))
        totals.update(r['counts']);paths.extend([p,bp])
        comparisons.append({'target':target,'status':'UNCHANGED_FROM_MISSION03','counts':r['counts'],'failureIds':sorted(failed(r)),'report':p.relative_to(ROOT).as_posix()})
    assert totals['FAIL']==6 and not totals['CONFLICT']
    frontend=ROOT/'TxtNote/frontend'
    files=['package.json','package-lock.json','src/thesis/importPdf.js','src/thesis/pdf/model.js','src/thesis/pdf/structure.js',
        'src/thesis/docx/projection.js','src/thesis/schema.d.ts','src/thesis/README.md','src/thesis/CAPABILITIES.md',
        'src/features/editor/PdfImportReview.jsx','src/features/editor/AcademicEditor.jsx','src/features/editor/AcademicTools.jsx',
        'src/features/editor/ThesisEditor.jsx','src/features/editor/ThesisRibbon.jsx','src/features/editor/ribbon/FileTab.jsx',
        'src/features/canvas/Canvas.jsx','src/features/workarea/DocumentPane.jsx','src/lib/thesisPdfImport.test.js',
        'tests/pdf-academic.html','tests/pdf-academic.jsx']
    paths.extend(frontend/f for f in files)
    paths.extend(ROOT/f for f in ['TxtNote/src-tauri/tauri.conf.json','orchestration/MISSION.md','orchestration/engine-work/close_mission04.py','orchestration/engine-work/mission04_assets.py',
        'orchestration/engine-work/mission04_oracle.py','orchestration/engine-work/verify_mission04_sources.mjs','orchestration/engine-work/verify_mission04_browser.mjs',
        'orchestration/engine-work/verify_mission04_academic.mjs','orchestration/engine-work/verify_mission04_csp.mjs'])
    paths.extend(OUT/f for f in ['README.md','.gitignore','inputs.json','bundled-assets.json','source-verification.json','oracle-verification.json',
        'browser-verification.json','academic-verification.json','csp-verification.json','unit-tests.log','build.log',
        'browser-review.png','browser-final.png','academic-pane.png','academic-canvas.png','regression.log','resume-regression.log','resume-manifest.json',
        'regression/aku-fbe/run/check.log','resume-regression/engine-word-style-precedence/run/check.log',
        'retry-manifest.json','retry-regression.log','checkpoint.json'])
    result={'mission':'04','status':'COMPLETE_CONTROLLED_PDF_IMPORT','date':'2026-10-09','sourceCases':2,'physicalPages':46,'unitTests':778,'unitSkipped':0,'build':'PASS',
        'scope':'Controlled editable PDF import with located uncertainties; exact original bytes and extracted tokens preserved. Arbitrary PDF semantics and visual parity are not certified.',
        'source':source,'oracleStatus':oracle['status'],'browser':browser,'academic':academic,'productionCsp':csp,
        'broaderRegressionCounts':dict(totals),'wordRequested':False,'regressionComparisons':comparisons,
        'retryNote':'AKU FBE first export stopped by unchanged pagination guard; style-precedence base download timed out in resumed run. Fresh serial retries completed; original failed attempts retained. No gate or tolerance changes.',
        'holdoutsUsed':False,'assets':[asset(p) for p in sorted(set(paths))]}
    (OUT/'completion.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def verify():
    contract=read(OUT/'completion.json')
    failures=[a['path'] for a in contract['assets'] if not (ROOT/a['path']).is_file() or sha(ROOT/a['path'])!=a['sha256']]
    result={'status':'FAIL' if failures else 'PASS','mission04':contract['status'],'assetsChecked':len(contract['assets']),'failures':failures}
    (OUT/'completion-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result));return bool(failures)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--freeze',action='store_true')
    if p.parse_args().freeze:freeze()
    raise SystemExit(verify())
