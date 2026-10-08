"""Record immutable scope, baseline triage and fresh regression without measuring ad hoc.

Measurements are exclusively those emitted by check.mjs/conformance.py.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPECS = ROOT / 'orchestration/specs'
OUT = ROOT / 'orchestration/validation/word-compat/phase-5.1'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checks_for(target):
    checks = read(SPECS / f'{target}.checks.json')
    return checks if isinstance(checks, list) else checks['checks']


def retained_failure_unchanged(before, current):
    # The same failing ID must not conceal a new metric/cause. Changed failures
    # need investigation, even if aggregate counts happen to stay constant.
    return before['status'] == current['status'] and before.get('actual') == current.get('actual')


def baseline_reports():
    acceptance = read(ROOT / 'orchestration/validation/phase4-close/acceptance.json')
    return acceptance, {r['target']: read(ROOT / r['report'].replace('\\', '/'))
                        for r in acceptance['wordRegression']['reports']}


def inventory():
    acceptance, reports = baseline_reports()
    audit = read(SPECS / 'word-compatibility-plan.audit.json')
    targets, infos, failures = [], [], []
    for target, report in reports.items():
        checks = checks_for(target)
        variants = sorted({c.get('params', {}).get('fixture', c.get('fixture', 'default'))
                           for c in checks if c['kind'] != 'note'})
        spec_path = SPECS / f'{target}.json'
        targets.append({'target': target, 'variants': variants, 'checksPath': str((SPECS / f'{target}.checks.json').relative_to(ROOT)),
                        'specPath': str(spec_path.relative_to(ROOT)) if spec_path.exists() else None,
                        'baselineCheckIds': [c['id'] for c in report['checks']],
                        'requiredChecks': [{'id': c['id'], 'kind': c['kind'], 'source': c.get('source'),
                                            'evidence': c.get('evidence'), 'expected': c.get('expected'),
                                            'tolerance': c.get('tolerance', .5), 'params': c.get('params', {})}
                                           for c in checks if c['kind'] != 'note']})
        for row in report['checks']:
            if row['status'] != 'INFO': continue
            required = row.get('evidence') in ('UNKNOWN', 'CONFLICT')
            infos.append({'target': target, 'id': row['id'], 'source': row.get('source'),
                          'evidence': row.get('evidence'), 'observation': row.get('actual'),
                          'classification': 'SOURCE_OR_FEATURE_REVIEW_REQUIRED' if required else 'MONITORING',
                          'acceptanceBlockingUntilResolvedOrExplicitInitialScopeRuling': required,
                          'ownerPhase': '5.4.5' if required else '5.5'})
    notes = {
        'cover-baseline': ('CONFIRMED_TYPOGRAPHY_INPUT_DIFFERENCE', '5.2',
            'Official p30 funding-note baselines 215.554/222.836; fresh PDF 214.486/220.836. Source pitch 7.282 mm vs multiplier 6.350 mm. Following city baseline differs by 2.003 mm. No compensating spacer added.'),
        'h4-selector': ('CONFIRMED_MEASUREMENT_SCOPE', '5.1.2', 'Old regex excludes numbered H4; semantic heading selected; bold remains independent of unresolved source H4 numbering.'),
        'sbe-tables': ('CONFIRMED_FIXTURE_AND_STYLE_TRANSPORT', '5.1.2/5.1.3', 'EN fixtures lacked body tables. Inline alignment is stripped by sanitizer; canonical cell classes preserve authored choices, with table-cell geometry retained.'),
        'sbe-english': ('CONFIRMED_SCOPE_DEFECT_WITH_REMAINING_FLOW_TRIAGE', '5.2/5.3', 'Pitch used all Arabic pages including single-spaced bibliography; indent used physical p15. Anchor now introduction paragraph. Flow/labels require fresh diagnosis.'),
        'health-toc': ('REPRODUCED_FLOW_DIFFERENCE', '5.3', 'Ethics source iii versus cached PDF iv/Word v; source preliminary-numbering conflict remains documented.'),
        'health-pagination': ('REPRODUCED_FLOW_DIFFERENCE', '5.3', 'Master/PhD 40 vs41; t80 36 vs34. First divergent anchor remains a 5.3 investigation, not proven by page count alone.'),
        'sociology-pagination': ('BASELINE_FLOW_DIFFERENCE_REQUIRES_FIRST_ANCHOR', '5.3', 'Baseline PDF37/Word36; first divergent paragraph not yet diagnosed.'),
        'arial-breaks': ('BASELINE_LINE_BREAK_DIFFERENCE', '5.2', 'J03/J04 equal line counts can still differ in words; bounded research decision gate required.'),
    }
    for family in audit['families']:
        diagnosis, owner, explanation = notes[family['id']]
        for identity in family['checks']:
            target, cid = identity['target'], identity['id']
            row = next(c for c in reports[target]['checks'] if c['id'] == cid)
            definition = next((c for c in checks_for(target) if c['id'] == cid), {})
            failures.append({'target': target, 'id': cid, 'family': family['id'],
                             'baseline': row, 'fixture': definition.get('params', {}).get('fixture', 'default'),
                             'sourceLocator': row.get('source'), 'diagnosis': diagnosis,
                             'ownerPhase': owner, 'explanation': explanation,
                             'firstDivergence': 'See scoped fresh report; full first-flow-anchor analysis deferred to owner phase',
                             'status': 'OPEN_UNTIL_FRESH_ACCEPTANCE'})
    assert len(failures) == 39 and len(infos) == 32 and len(targets) == 21
    scope_path = SPECS / 'word-compatibility-phase51.scope.json'
    if not scope_path.exists():
        save(scope_path, {'schemaVersion': 1, 'phase': '5.1', 'scopeVersion': 1,
                          'date': '2026-10-07', 'baselineAcceptanceSha256': sha(ROOT / audit['baseline']['acceptancePath']),
                          'targets': targets, 'variants': sum(len(t['variants']) for t in targets),
                          'initialEnvironment': 'Windows Word 16.0.20430 / compatibility 15 / Microsoft Print to PDF; exact fonts/locale/browser in fresh run environment and render records',
                          'features': 'Existing source-backed checks and supported editor features; font/size/locale combinations explicitly listed in checks and fresh font environment',
                          'expansionQueue': audit['additionalUnknowns'], 'infoClassification': infos,
                          'releaseRule': 'No required FAIL/SKIPPED/UNKNOWN; source gaps require explicit source ruling, never automatic PASS'})
    save(SPECS / 'word-compatibility-phase51.triage.json', {'schemaVersion': 1, 'phase': '5.1', 'failures': failures})
    progress = read(ROOT / 'orchestration/progress.json')
    progress['currentPhase'] = 'MOTOR Phase 5.1 IN_PROGRESS: scoped checker/fixture corrections and reference provenance; Phase 4 remains CLOSED.'
    program = progress['wordCompatibilityProgram']
    program['status'] = 'IN_PROGRESS'
    program['phases'][0]['status'] = 'IN_PROGRESS'
    program['nextAction'] = 'Fresh affected targets and full Word regression; close 5.1 only after zero new regressions and documented deferrals.'
    save(ROOT / 'orchestration/progress.json', progress)
    print(f'Scope recorded: {len(targets)} targets / {sum(len(t["variants"]) for t in targets)} variants / 39 failures / 32 classified INFO.')


def acceptance(manifest_path):
    baseline, reports = baseline_reports()
    manifest = read(manifest_path)
    regressions, stale_failures, errors = [], [], []
    counts = {}
    refreshed = {}
    for target in manifest['targets']:
        if not target.get('report'):
            errors.append({'target': target['target'], 'error': target.get('error')}); continue
        path = ROOT / target['report'].replace('\\', '/')
        current = read(path)
        refreshed[target['target']] = current
        old = {c['id']: c for c in reports[target['target']]['checks']}
        now = {c['id']: c for c in current['checks']}
        for cid, row in old.items():
            if row['kind'] != 'note' and cid not in now:
                regressions.append({'target': target['target'], 'id': cid, 'reason': 'baseline check disappeared'})
            elif cid in now and (row['kind'] != now[cid]['kind'] or
                                 (row['status'] == 'PASS' and now[cid]['status'] != 'PASS')):
                regressions.append({'target': target['target'], 'id': cid, 'reason': 'check kind changed or previous PASS lost'})
        for row in current['checks']:
            counts[row['status']] = counts.get(row['status'], 0) + 1
            if row['status'] not in ('FAIL', 'CONFLICT', 'UNKNOWN', 'SKIPPED'): continue
            before = old.get(row['id'])
            item = {'target': target['target'], 'id': row['id'], 'status': row['status'],
                    'actual': row.get('actual'), 'reason': row.get('reason') or row.get('note')}
            if before and retained_failure_unchanged(before, row): stale_failures.append(item)
            else: regressions.append(item)
    triage_path = SPECS / 'word-compatibility-phase51.triage.json'
    triage = read(triage_path)
    for failure in triage['failures']:
        report = refreshed.get(failure['target'])
        row = next((c for c in report['checks'] if c['id'] == failure['id']), None) if report else None
        failure['freshResult'] = row
        failure['status'] = 'RESOLVED_FRESH_PASS' if row and row['status'] == 'PASS' else 'OPEN_DEFERRED'
    save(triage_path, triage)
    complete_targets = len(refreshed) == len(reports)
    result = {'phase': '5.1', 'date': '2026-10-07',
              'status': 'REGRESSION_GATE_PASS' if complete_targets and not regressions and not errors else 'INCOMPLETE_OR_REGRESSION',
              'manifest': str(manifest_path.relative_to(ROOT)), 'freshTargets': len(refreshed),
              'counts': counts, 'newRegressions': regressions, 'exportErrors': errors,
              'retainedFailures': stale_failures, 'resolvedBaselineFailures': sum(f['status'] == 'RESOLVED_FRESH_PASS' for f in triage['failures']),
              'scopePath': str((SPECS / 'word-compatibility-phase51.scope.json').relative_to(ROOT)),
              'schemaValidation': read(OUT / 'schema-manifest.json') if (OUT / 'schema-manifest.json').exists() else {'status': 'PENDING', 'reason': 'Office Open XML SDK 2.9.1 found; separate full schema validation/baseline comparison required.'},
              'fullProgramComplete': False, 'sourceUnknowns': '32 INFO explicitly classified in scope; required source/feature gaps remain release blockers.'}
    save(OUT / 'acceptance.json', result)
    print(json.dumps({k: result[k] for k in ('status', 'freshTargets', 'counts', 'resolvedBaselineFailures', 'newRegressions', 'exportErrors')}, ensure_ascii=False))
    return 0 if result['status'] == 'REGRESSION_GATE_PASS' else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=Path)
    args = parser.parse_args()
    if args.manifest:
        raise SystemExit(acceptance(args.manifest.resolve()))
    inventory()
