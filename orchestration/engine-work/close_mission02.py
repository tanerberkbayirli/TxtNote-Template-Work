"""Freeze and reverify Mission 02 evidence; no renderer tolerances are changed."""
from pathlib import Path
import argparse, collections, hashlib, json, re, subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'orchestration/engine-work/mission02'

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def log(path):
    data = path.read_bytes()
    return data.decode('utf-16' if data.startswith(b'\xff\xfe') else 'utf-8-sig')

def asset(path):
    return {'path': path.relative_to(ROOT).as_posix(), 'sha256': sha(path)}

def latest(directory):
    return max(directory.glob('check-*.json'), key=lambda p: p.stat().st_mtime)

def failures(report):
    return {r['id']: {k: r.get(k) for k in ['status', 'kind', 'expected', 'actual', 'delta', 'tolerance']}
            for r in report['checks'] if r['status'] in ['FAIL', 'CONFLICT']}

def freeze():
    source = read(OUT/'source-verification.json')
    assert source['status'] == 'PASS' and len(source['cases']) == 6
    assert sum(c['nativeElements'] for c in source['cases']) == 74581
    assert sum(c['originalPackagePartsVerified'] for c in source['cases']) == 174
    browser = read(OUT/'browser-verification.json')
    assert browser['status'] == 'PASS' and browser['pageErrors'] == []
    projection = read(OUT/'projection-verification.json')
    assert projection == {'status': 'PASS', 'sections': 247, 'failures': []}
    unit = log(OUT/'unit-tests.log')
    assert '# tests 759' in unit and '# pass 759' in unit and '# fail 0' in unit
    assert '# skipped 0' in unit and '# cancelled 0' in unit
    assert re.search(r'built in', log(OUT/'build.log'))
    manifest = read(OUT/'final-current-manifest.json')
    assert len(manifest['targets']) == 23 and not manifest['wordRequested']
    retry = read(OUT/'final-retry-manifest.json')
    replacements = {r['target']: r for r in retry['targets']}
    assert set(replacements) == {r['target'] for r in manifest['targets'] if r['error']}
    manifest['targets'] = [replacements.get(r['target'], r) for r in manifest['targets']]
    totals = collections.Counter()
    comparisons, paths = [], []
    for row in manifest['targets']:
        assert row['report'] and not row['error'], row
        p = ROOT/row['report']; report = read(p); paths.append(p)
        totals.update(report['counts'])
        current = failures(report)
        if current or row['target'] == 'afsu-eczacilik-proje':
            bp = latest(OUT/'baseline-regression'/row['target'])
            baseline = read(bp); paths.append(bp)
            assert current == failures(baseline), (row['target'], current, failures(baseline))
            assert report['counts'] == baseline['counts'], row['target']
            comparisons.append({'target': row['target'], 'status': 'UNCHANGED_FROM_HEAD',
                                'failureIds': sorted(current), 'baseline': bp.relative_to(ROOT).as_posix()})
    assert totals['FAIL'] == 6 and not totals['CONFLICT']
    provenance = read(OUT/'baseline-provenance.json')
    assert len(provenance['modules']) == 9
    for module in provenance['modules']:
        relative = Path(module['path']).relative_to(ROOT).as_posix()
        original = subprocess.check_output(['git', 'show', provenance['revision']+':'+relative], cwd=ROOT)
        assert hashlib.sha256(original).hexdigest() == module['sha256']
    inputs = read(OUT/'source-inputs.json')
    for case in inputs['cases']:
        p = ROOT/case['input']['path']
        assert sha(p) == case['input']['sha256']; paths.append(p)
    frontend = ROOT/'TxtNote/frontend'
    relative_code = ['src/app/App.jsx', 'src/features/editor/RichTextBody.jsx',
        'src/features/editor/ThesisEditor.jsx', 'src/features/editor/ThesisSectionPages.jsx',
        'src/features/sync/payload.js', 'src/features/sync/payload.test.js',
        'src/lib/academicDocument.js', 'src/lib/thesisContentModel.test.js', 'src/lib/thesisBatchB.test.js',
        'src/thesis/contentModel.js', 'src/thesis/contentMarkup.js', 'src/thesis/sourceHtml.js',
        'src/thesis/engine.js', 'src/thesis/schema.d.ts', 'tests/thesis-fixture.jsx']
    paths += [frontend/p for p in relative_code]
    paths += [ROOT/p for p in ['orchestration/engine-work/mission02_source_inputs.py', 'orchestration/engine-work/verify_mission02_sources.mjs',
        'orchestration/engine-work/verify_mission02_browser.mjs', 'orchestration/engine-work/verify_mission02_projection.mjs',
        'orchestration/engine-work/mission02_baseline.mjs', 'orchestration/engine-work/close_mission02.py', 'orchestration/tools/export.mjs']]
    paths += [OUT/p for p in ['source-verification.json', 'source-inputs.json', 'browser-verification.json',
        'browser-final.png', 'projection-verification.json', 'unit-tests.log', 'build.log',
        'final-current-manifest.json', 'final-regression.log', 'final-retry-manifest.json', 'final-retry.log',
        'baseline-provenance.json', 'baseline.vite.mjs']]
    result = {'mission': '02', 'status': 'COMPLETE_CONTENT_MODEL', 'date': '2026-10-09',
        'scope': 'Persistent semantic model, native adapter admission, editor and sync round-trip. Production DOCX import is Mission 03; Word/PDF conformance is not certified here.',
        'unitTests': 759, 'unitSkipped': 0, 'build': 'PASS', 'nativeCases': 6,
        'nativeElements': 74581, 'packagePartsVerified': 174, 'browser': browser,
        'fixtureSectionsEquivalent': 247, 'regressionTargets': 23,
        'retriedTargets': sorted(replacements),
        'broaderRegressionCounts': dict(totals), 'wordRequested': False,
        'broaderRegressionStatus': '6 unchanged HEAD failures; required Word-only skips are not passes',
        'baselineRevision': provenance['revision'], 'baselineComparisons': comparisons,
        'assets': [asset(p) for p in sorted(set(paths))]}
    (OUT/'completion.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def verify():
    completion = read(OUT/'completion.json')
    errors = [r['path'] for r in completion['assets']
              if not (ROOT/r['path']).is_file() or sha(ROOT/r['path']) != r['sha256']]
    result = {'status': 'FAIL' if errors else 'PASS', 'mission02': completion['status'],
              'assetsChecked': len(completion['assets']), 'failures': errors}
    (OUT/'completion-verification.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result)); return bool(errors)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--freeze', action='store_true')
    if parser.parse_args().freeze: freeze()
    raise SystemExit(verify())
