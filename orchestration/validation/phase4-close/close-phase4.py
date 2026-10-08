import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parents[3]
base = root / 'orchestration/validation/phase4-close'
def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))
def save(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

initial = read(base / 'regression-manifest.json')
final = read(base / 'final-manifest.json')
timing = read(base / 'runtime-manifest.json')
selected = {t['target']: t for t in initial['targets']}
selected.update({t['target']: t for t in final['targets']})
assert len(selected) == 21 and all(t['report'] and not t['error'] for t in selected.values())
counts, failures, gates, reports = Counter(), [], [], []
for target, item in selected.items():
    path = root / item['report']
    report = read(path)
    counts.update(report['counts'])
    failures.extend({'target': target, 'id': c['id'], 'kind': c['kind'], 'status': c['status']} for c in report['checks'] if c['status'] == 'FAIL')
    gates.extend({'target': target, 'id': c['id'], 'status': c['status']} for c in report['checks'] if c['kind'] in ['layout_report_valid', 'layout_pdf_consistency'])
    reports.append({'target': target, 'report': item['report'], 'sha256': sha(path), 'counts': report['counts'], 'sourceProvenance': report['sourceProvenance'], 'artifactSha256': report['artifactSha256']})
baseline = read(root / 'orchestration/validation/phase3-close/acceptance.json')['wordRegression']
key = lambda f: (f['target'], f['id'])
assert set(map(key, failures)) == set(map(key, baseline['failures'])), 'New or changed regression failure IDs'
pilot = next(r for r in reports if r['target'] == 'adu-sagbil')
assert pilot['counts'] == {'PASS': 303}
source = read(root / 'orchestration/artifacts/adu-sagbil/source/reference/render-manifest.json')
completed = datetime.now(timezone.utc)
elapsed = (completed - datetime.fromisoformat(source['startedAt'].replace('Z', '+00:00'))).total_seconds()
acceptance = {
    'phase': 4, 'status': 'CLOSED', 'date': '2026-10-07',
    'scope': 'Official-source generation pipeline and first ADU Sagbil master/TR Tier 1 pilot; university-wide independent completion and Tier 2 remain separate',
    'pilot': {'target': 'adu-sagbil', 'sourceBackedTier1Checks': 298, 'automaticGates': 5, 'counts': pilot['counts'], 'report': pilot['report'], 'sha256': pilot['sha256']},
    'source': source,
    'sourceReview': {'path': 'orchestration/specs/adu-sagbil.source-review.json', 'sha256': sha(root / 'orchestration/specs/adu-sagbil.source-review.json'), 'selectedGuideParagraphs': 17, 'conflictRulings': 3},
    'mapping': {'facts': 153, 'preservedUnmappedPropertyGroups': 109, 'path': 'orchestration/specs/adu-sagbil.mapping.json', 'sha256': sha(root / 'orchestration/specs/adu-sagbil.mapping.json')},
    'families': {'officialUniversities': 3, 'structuralCandidates': 2, 'path': 'orchestration/specs/template-families.json', 'numericUniversityValuesShared': False},
    'cost': {'startedAt': source['startedAt'], 'completedAt': completed.isoformat(), 'instrumentedWorkflowWallSeconds': round(elapsed, 3), 'scope': 'Official source render start through generation, measured fixes, guide conversion/review, unit/build and actual Word regression; earlier XML-only checkpoint excluded', 'officialRenderSeconds': source['wallSeconds'], 'sourceExtractionSeconds': read(root / 'orchestration/specs/adu-sagbil.extracted.json')['extractionSeconds'], 'guideConversionSeconds': read(root / 'orchestration/artifacts/adu-sagbil/source/guide.converted.docx.conversion.json')['wallSeconds'], 'finalPilotWordCommandSeconds': next(t['commandSeconds'] for t in final['targets'] if t['target'] == 'adu-sagbil'), 'freshNonWordCommandSeconds': timing['targets'][0]['commandSeconds'], 'tokenUsage': None, 'tokenTelemetry': 'Unavailable; <=100k target is not verified'},
    'validation': {'frontendTests': 732, 'pythonCheckerAndExtractorTests': 40, 'generatorTests': 3, 'productionBuild': 'PASS', 'visualQA': 'Official cover and rendered cover/approval/ethics at page scale; editor/Word contact sheets for TOC, abstracts, headings, body, bibliography, table, appendices and CV; no clipping/overlap seen. Word/body line wraps are not claimed identical.'},
    'wordRegression': {'targets': 21, 'counts': dict(counts), 'baselineFailureIdsUnchanged': True, 'failures': failures, 'gates': gates, 'reports': reports, 'selectionMethod': 'Full 21-target actual Word run plus fresh ADU/AFSU Tip/SBE final reruns. Initial AFSU positioning regression fixed by opt-in baseline flag; initial SBE export error during live source updates superseded by clean fresh export. No source expected value/tolerance relaxed.'},
    'limitations': read(root / 'orchestration/specs/adu-sagbil.source-review.json')['tier2Unknown']
}
save(base / 'acceptance.json', acceptance)
progress_path = root / 'orchestration/progress.json'
progress = read(progress_path)
progress['currentPhase'] = 'MOTOR Phase 4 CLOSED: official-source generation and ADU Sagbil master/TR Tier 1 pilot PASS; separate university/variant/Tier 2 queue remains open.'
progress['enginePlan']['phase4'] = 'CLOSED (4.1-4.5 source pipeline, reviewed conflicts, Tier 1 pilot and three-university family inventory; wall cost measured, token telemetry unavailable)'
progress['enginePlan']['phase4ReportPath'] = 'orchestration/reports/MOTOR_PHASE4_CLOSE_2026-10-07.md'
progress['enginePlan']['phase4AcceptancePath'] = 'orchestration/validation/phase4-close/acceptance.json'
target = progress['targets']['adu-sagbil']
target.update(analysis='DONE', implementation='DONE', validation='TIER1_PASS (303 actual PDF/DOCX/Word checks; Tier 2 variants and independent university-wide completion remain open)', attempts=1, status='IN_PROGRESS', lastError=None, specPath='orchestration/specs/adu-sagbil.json', reportPath='orchestration/reports/MOTOR_PHASE4_CLOSE_2026-10-07.md', templatePath='TxtNote/frontend/src/thesis/templates/adu-sagbil.js', registryIds=['adu-sagbil-master-tr-v1'], note='Phase 4 pilot complete. Five exploratory checker iterations and a final fresh run are recorded locally; this is one source-template pilot, not approval of all ADU variants. Tier 2 UNKNOWN and 109 source-property review groups remain explicit.', validationPath=pilot['report'])
progress['lastCompletedValidation'] = {'target': 'adu-sagbil', 'attempt': 1, 'verdict': 'TIER1_PASS'}
save(progress_path, progress)
report = root / 'orchestration/reports/MOTOR_PHASE4_CLOSE_2026-10-07.md'
report.write_text(f'''# Phase 4 closure — 2026-10-07
- Status: CLOSED for the official-source pipeline and first Tier 1 pilot; university-wide variants/independent queue remain separate.
- 4.1: official DOCX XML plus verified owned-Word cache, line/word geometry, source/part/render SHA256 and locators; original source unchanged.
- 4.2: source roles → template/checks/fixture/context; 153 mapped facts, 109 preserved unmapped property groups. Registered ADU Sagbil master/TR, 15 sections, three editable positioned fixed pages.
- 4.3: read-only 2025 DOC guide conversion (owned Word fallback; LibreOffice unavailable); 17 relevant paragraphs, three explicit template/prose rulings, Tier 2 UNKNOWNs retained in source-review.json.
- 4.4: final fresh ADU PDF/DOCX/actual Word 303/303 PASS (298 source-backed Tier 1 assertions + five automatic gates). Word command {acceptance['cost']['finalPilotWordCommandSeconds']:.3f} s; non-Word {acceptance['cost']['freshNonWordCommandSeconds']:.3f} s.
- Cost: instrumented workflow {elapsed:.3f} s from official-render start through closure checks; render {source['wallSeconds']:.3f} s. Token telemetry unavailable; the <=100k-token target is unverified.
- 4.5: three official universities inventoried; two structural family candidates. Shared engine Word/font-flow semantics only; no numeric university values shared.
- Engine: opt-in positioned Word baseline paint correction and table cell first-line indent; legacy defaults preserved. Checker font-size regex/ignore and explicit repeated-line occurrence now honored.
- Validation: 732 frontend + 40 Python checker/extractor + three generator tests PASS; production build PASS (existing chunk/performance warnings). Visual page checks found no clipping/overlap in pilot pages reviewed.
- Full Word regression: 21 targets; {counts['PASS']} PASS / {counts['FAIL']} FAIL / {counts['INFO']} INFO. Exact FAIL IDs match Phase 3 baseline (39 separately open university/Arial failures); global checker remains exit 1.
- Acceptance combines the full run and fresh ADU/AFSU Tip/SBE final reruns. Initial positioning/export findings are superseded by measured fixes/reruns; no source values or tolerances relaxed.
- Evidence: orchestration/validation/phase4-close/acceptance.json; source-review/mapping/family inventories committed; generated exports/cache binaries remain local.
- Next queue: remaining university variants, fixed-page long replacement text, source-property review and existing independent completion/deferred failures. This closure does not claim those complete.
''', encoding='utf-8')
motor_path = root / 'MOTOR.md'
motor = motor_path.read_text(encoding='utf-8-sig')
start = motor.index('2026-10-07 start: **Phase 4 OPEN**.')
end = motor.index('\n---', start)
motor = motor[:start] + f'''2026-10-07 closure: **Phase 4 CLOSED**. ADU Sagbil master/TR official-source
pilot 303/303 actual PDF/DOCX/Word checks PASS; source cache/geometry, reviewed
guide conflicts, generator and three-university/two-family inventory complete.
Instrumented wall cost {elapsed:.3f} s; final pilot Word {acceptance['cost']['finalPilotWordCommandSeconds']:.3f} s.
Token telemetry unavailable; <=100k is unverified. University-wide variants,
109 source-property review groups and Tier 2 UNKNOWN remain explicit.
See `orchestration/reports/MOTOR_PHASE4_CLOSE_2026-10-07.md` and its acceptance JSON.
''' + motor[end:]
motor += f'\n| 2026-10-07 | Phase 4 CLOSED: official-source pipeline + ADU Sagbil Tier 1 pilot | (this commit) | 303/303 actual PDF/DOCX/Word; 732 frontend + 40 Python + 3 generator tests/build PASS; three universities/two families; wall {elapsed:.3f} s; tokens unavailable. Full regression {counts["PASS"]} PASS / 39 unchanged FAIL / {counts["INFO"]} INFO. | Remaining university/variant/Tier 2 and deferred queue |\n'
motor_path.write_text(motor, encoding='utf-8')
print(json.dumps({'status': 'CLOSED', 'counts': dict(counts), 'failureIdsUnchanged': True, 'gates': len(gates), 'wallSeconds': round(elapsed, 3)}))
