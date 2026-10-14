"""Freeze Mission 05 only after exact Word, font, UI and regression gates pass."""
from pathlib import Path
import argparse,collections,hashlib,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'orchestration/engine-work/mission05'
def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def asset(path):return {'path':path.relative_to(ROOT).as_posix(),'sha256':sha(path)}
def log(path):
    b=path.read_bytes();return b.decode('utf-16' if b.startswith(b'\xff\xfe') else 'utf-8-sig')
def report(folder):
    paths=sorted(folder.glob('check-*.json'));assert len(paths)==1,(folder,paths)
    return read(paths[0])
def failids(r):return {c['id'] for c in r['checks'] if c['status'] in ['FAIL','CONFLICT']}
def freeze(dry_run=False):
    paths=[];inputs=read(OUT/'inputs.json')
    assert set(inputs['coverage'])=={'SRC09','EDGE_STRUCTURE','SYN01','SYN02','SYN05'}
    for row in inputs['inputs']:
        for source in row['sources']:
            p=ROOT/source['path'];assert sha(p)==source['sha256'],p;paths.append(p)
    assert {k:len(v) for k,v in inputs['samples'].items()}=={'SRC09':4,'EDGE_STRUCTURE':4}
    baseline=report(OUT/'baseline-justify');assert baseline['counts']=={'PASS':19,'FAIL':3}
    assert failids(baseline)=={'J03-Arial-10-justify-line-breaks','J03-Arial-10-justify-last-line-words','J04-Arial-12-justify-line-breaks'}
    typography=report(OUT/'final-typography');assert typography['wordRequested'] and typography['counts']=={'PASS':22}
    word=read(OUT/'final-word-manifest.json')
    assert word['wordRequested'] and len(word['targets'])==6
    expected={'engine-word-justify':22,'engine-word-pagefit':213,'engine-word-parity':148,'engine-word-structure':136,'engine-word-style-precedence':64,'phase52-justify':34}
    assert {r['target']:r['counts'].get('PASS',0) for r in word['targets']}==expected
    for row in word['targets']:
        assert not row['error'] and row['exitCode']==0 and row['counts']=={'PASS':expected[row['target']]}
        r=read(ROOT/row['report']);assert r['wordRequested'] and r['exportMode']=='fresh'
    original=read(ROOT/next(r['report'] for r in word['targets'] if r['target']=='engine-word-justify'))
    # The overall fingerprint includes implementation code, which changed.
    # Frozen fixture/check SHA256 values above must remain identical instead.
    assert original['sourceProvenance']['officialSourceFingerprint']==baseline['sourceProvenance']['officialSourceFingerprint']
    assert original['variants']['default']['fixture']==baseline['variants']['default']['fixture']
    browser=read(OUT/'browser-verification.json');assert browser['status']=='PASS' and not browser['pageErrors']
    for key in ['editUndoRedoReload','cleanPersistedSource','inlineFontEmbedded','missingFontVisible','missingFontExportRejected']:assert browser[key],key
    assert all(browser['presentation'].values())
    families=collections.Counter(f['family'] for f in browser['matrixFonts'])
    assert families=={'Times New Roman':4,'Arial':4,'Calibri':4},families
    for f in browser['matrixFonts']+browser['inlineFonts']:assert f['embedded'] and f['name']==f['postscript'] and not f['fsType']&2
    lines=read(OUT/'editor-pdf-lines.json');assert lines['status']=='PASS' and len(lines['cases'])==8
    assert sum(c['lines'] for c in lines['cases'])==204 and all(c['status']=='PASS' for c in lines['cases'])
    for c in typography['checks']:
        if c['kind']=='line_breaks_match':assert lines['lines'][c['id'][:3]]==c['actual']['measuredLines']['pdf']==c['actual']['measuredLines']['word']
    measured=read(OUT/'measurement-verification.json');assert measured['status']=='PASS' and measured['baselineJ03J04StillFail']
    assert sha(ROOT/measured['wordPdf'])==measured['sha256']
    visual=read(OUT/'visual-review.json');assert visual['status']=='PASS' and visual['pages']==8
    assert sha(OUT/'final-typography/run/default.pdf')==visual['pdfSha256']
    probes=read(OUT/'word-probe-output.json');canvas=read(OUT/'canvas-probe.json');assert len(probes)==len(canvas)==6
    for p in probes:
        c=next(c for c in canvas if c['font']+'-'+c['id']==p['id']);assert p['maxRejectedWidthPt']-.001<=c['natural']<=p['minWidthPt']+.001,(p,c['natural'])
    units=log(OUT/'unit-tests-verified.log')
    for text in ['# tests 785','# pass 785','# fail 0','# cancelled 0','# skipped 0']:assert text in units,text
    assert 'built in' in log(OUT/'build-verified.log')
    old={}
    for row in read(ROOT/'orchestration/engine-work/mission04/completion.json')['assets']:
        if row['path'].startswith('orchestration/engine-work/mission04/') and '/check-' in row['path'] and row['path'].endswith('.json'):
            p=ROOT/row['path'];assert sha(p)==row['sha256'];r=read(p);old[r['target']]=r
    assert len(old)==23,len(old)
    run=read(OUT/'regression-manifest.json');assert len(run['targets'])==23 and not run['wordRequested']
    retries=read(OUT/'retry-manifest.json');assert not retries['wordRequested']
    assert {r['target'] for r in retries['targets']}=={r['target'] for r in run['targets'] if r['error']}
    replacements={r['target']:r for r in retries['targets']};totals=collections.Counter();comparisons=[]
    for row in run['targets']:
        row=replacements.get(row['target'],row);assert row['report'] and not row['error'],row
        now=read(ROOT/row['report']);before=old[now['target']]
        assert failids(now)<=failids(before),(now['target'],failids(now)-failids(before))
        oldchecks={c['id']:c for c in before['checks']}
        assert {c['id'] for c in now['checks']}==set(oldchecks),now['target']
        for c in now['checks']:
            previous=oldchecks[c['id']]
            for key in ['kind','expected','tolerance','required']:assert c.get(key)==previous.get(key),(now['target'],c['id'],key)
            if previous['status']=='PASS':assert c['status']=='PASS',(now['target'],c['id'],c['status'])
            if c['status']=='SKIPPED':assert previous['status']=='SKIPPED',(now['target'],c['id'])
        totals.update(now['counts']);comparisons.append({'target':now['target'],'counts':now['counts'],'failureIds':sorted(failids(now)),
            'previousFailureIds':sorted(failids(before)),'report':row['report'],'status':'NO_NEW_FAILURES_OR_SKIPS'})
    assert not totals['CONFLICT']
    if dry_run:
        print(json.dumps({'status':'PASS','gate':'Mission 05 completion prerequisites','broaderRegressionCounts':dict(totals),'retryTargets':sorted(replacements)}));return
    paths.extend(p for p in OUT.rglob('*') if p.is_file() and not p.name.startswith('completion') and p.name not in ['debug.json','browser-failure.png'])
    paths.extend(ROOT/p for p in ['orchestration/MISSION.md','orchestration/engine-work/close_mission05.py','orchestration/engine-work/mission05_sources.py','orchestration/engine-work/mission05_fixture.mjs',
        'orchestration/engine-work/mission05_probe.mjs','orchestration/engine-work/mission05_compare_probe.py','orchestration/engine-work/mission05_debug.mjs','orchestration/engine-work/mission05_measure.mjs','orchestration/engine-work/mission05_word_probe.ps1',
        'orchestration/engine-work/mission05_measurement.py','orchestration/engine-work/verify_mission05_browser.mjs','orchestration/engine-work/verify_mission05_lines.mjs',
        'orchestration/specs/engine-mission05-typography.fixture.json','orchestration/specs/engine-mission05-typography.checks.json','orchestration/tools/pdfmeasure.py'])
    paths.extend(ROOT/'TxtNote/frontend'/p for p in ['src/thesis/wordLineFit.js','src/thesis/wordLineLayout.js','src/thesis/sourceHtml.js','src/thesis/engineCss.js',
        'src/thesis/renderedFonts.js','src/thesis/layoutPdf.js','src/features/editor/ThesisEditor.jsx','src/lib/thesisWordLineFit.test.js','src/lib/thesisJustify.test.js',
        'src/thesis/README.md','src/thesis/CAPABILITIES.md','src/thesis/wordBaseline.js','src/thesis/paragraphTabs.js','src/lib/academicFonts.js','src/lib/systemPdfFonts.js',
        'tests/pdf-font-compliance.mjs'])
    result={'mission':'05','status':'COMPLETE_FIXED_CORPUS_FONT_AND_LINE_FITTING','date':'2026-10-09','holdoutsUsed':False,
        'scope':'Exact line strings in the fixed corpus; genuine font programs and visible missing-font rejection. Source excerpts do not certify full-thesis pagination or arbitrary fonts/shaping.',
        'baselineCounts':baseline['counts'],'originalJustifyCounts':original['counts'],'typographyCounts':typography['counts'],'editorPdfWordLines':204,
        'wordRegressionCounts':{'PASS':sum(expected.values())},'unitTests':785,'unitSkipped':0,'build':'PASS','browser':browser['status'],
        'measurementReaderCorrection':measured,'broaderRegressionCounts':dict(totals),'regressionComparisons':comparisons,
        'retryTargets':sorted(replacements),'assets':[asset(p) for p in sorted(set(paths))]}
    (OUT/'completion.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def verify():
    contract=read(OUT/'completion.json');failures=[a['path'] for a in contract['assets'] if not (ROOT/a['path']).is_file() or sha(ROOT/a['path'])!=a['sha256']]
    result={'status':'FAIL' if failures else 'PASS','mission05':contract['status'],'assetsChecked':len(contract['assets']),'failures':failures}
    (OUT/'completion-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result));return bool(failures)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--freeze',action='store_true');p.add_argument('--check',action='store_true');args=p.parse_args()
    if args.check:freeze(dry_run=True);raise SystemExit(0)
    if args.freeze:freeze()
    raise SystemExit(verify())
