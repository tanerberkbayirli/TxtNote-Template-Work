"""Preserve a paused checkpoint; default verifies it without changing the snapshot."""
from pathlib import Path
import argparse,datetime,hashlib,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'orchestration/engine-work/mission04'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--freeze',action='store_true');args=parser.parse_args()
    if args.freeze:
        relative=[
            'orchestration/MISSION.md','orchestration/engine-work/checkpoint_mission04.py','orchestration/engine-work/mission04_oracle.py',
            'orchestration/engine-work/verify_mission04_sources.mjs','orchestration/engine-work/verify_mission04_browser.mjs','orchestration/engine-work/verify_mission04_csp.mjs',
            'TxtNote/frontend/package.json','TxtNote/frontend/package-lock.json','TxtNote/src-tauri/tauri.conf.json',
            'engine/src/importPdf.js','engine/src/pdf/structure.js',
            'engine/src/pdf/model.js','engine/src/docx/projection.js',
            'engine/src/schema.d.ts','TxtNote/frontend/src/features/editor/PdfImportReview.jsx',
            'TxtNote/frontend/src/features/editor/ThesisEditor.jsx','TxtNote/frontend/src/features/editor/ThesisRibbon.jsx',
            'TxtNote/frontend/src/features/editor/ribbon/FileTab.jsx','TxtNote/frontend/src/features/editor/AcademicEditor.jsx',
            'TxtNote/frontend/src/features/editor/AcademicTools.jsx','TxtNote/frontend/src/features/workarea/DocumentPane.jsx',
            'TxtNote/frontend/src/features/canvas/Canvas.jsx','TxtNote/frontend/src/lib/thesisPdfImport.test.js',
            'TxtNote/frontend/tests/pdf-academic.html','TxtNote/frontend/tests/pdf-academic.jsx']
        paths=[ROOT/p for p in relative]
        for directory in [OUT,ROOT/'TxtNote/frontend/public/ocr',ROOT/'TxtNote/frontend/public/pdf-assets']:
            paths.extend(p for p in directory.rglob('*') if p.is_file() and p.name!='checkpoint.json' and 'run' not in p.relative_to(directory).parts)
        reports=[]
        for p in (OUT/'regression').glob('*/check-*.json'):
            r=json.loads(p.read_text(encoding='utf-8'));reports.append({'target':r['target'],'counts':r['counts'],'path':p.relative_to(ROOT).as_posix()})
        snapshot={'mission':'04','status':'PAUSED_AT_USER_REQUEST','complete':False,
            'savedAt':datetime.datetime.now().astimezone().isoformat(),
            'reason':'User asked to stop at a checkpoint for a break.',
            'resumeInstructions':'orchestration/engine-work/mission04/README.md',
            'verified':{'unitTests':778,'unitFailures':0,'unitSkipped':0,'sourceCases':2,'sourcePhysicalPages':46,
                'browserPdfFlow':'PASS','productionCspOcr':'PASS'},
            'unverifiedLatestChanges':['Academic PDF to multipage thesis routing in Canvas/DocumentPane','Academic tools explanation and new academic test fixture'],
            'generalRegression':{'status':'INTERRUPTED_AT_USER_REQUEST','reports':reports,'fullManifestExists':(OUT/'regression-manifest.json').exists(),
                'errorNeedingInvestigation':'AKU FBE export pagination-ready failure; do not classify as preexisting without evidence'},
            'assets':[{'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)} for p in sorted(set(paths))]}
        (OUT/'checkpoint.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    snapshot=json.loads((OUT/'checkpoint.json').read_text(encoding='utf-8'))
    failures=[a['path'] for a in snapshot['assets'] if not (ROOT/a['path']).is_file() or sha(ROOT/a['path'])!=a['sha256']]
    print(json.dumps({'status':'FAIL' if failures else 'PASS','checkpoint':snapshot['status'],'assetsChecked':len(snapshot['assets']),'failures':failures}));return bool(failures)
if __name__=='__main__':raise SystemExit(main())
