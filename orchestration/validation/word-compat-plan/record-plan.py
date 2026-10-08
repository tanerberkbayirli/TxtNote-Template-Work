import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
def read(path):
    return json.loads((root / path).read_text(encoding='utf-8'))
def save(path, data):
    (root / path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

acceptance_path = 'orchestration/validation/phase4-close/acceptance.json'
a = read(acceptance_path)
families = [
    ('cover-baseline', 'ADÜ Ziraat iç kapak baseline', '5.1', lambda f: f['target'] == 'adu-ziraat-lisans', '2.003 mm final-line delta; root cause requires source/style/paint comparison'),
    ('h4-selector', 'AKÜ Sağlık H4 kontrol kapsamı', '5.1', lambda f: f['target'] == 'aku-sagbil' and f['id'].startswith('h4-'), 'Selected real PDF and Word have numbered H4 text and bold=true; anchored regex omits numbering prefix. Number format still requires audit.'),
    ('health-toc', 'AKÜ Sağlık etik TOC etiketi', '5.3', lambda f: f['target'] == 'aku-sagbil' and f['id'].startswith('toc-'), 'Source hidden iii vs PDF iv / Word v; investigate front flow and logical labels together'),
    ('health-pagination', 'AKÜ Sağlık varyant sayfalaması', '5.3', lambda f: f['target'] == 'aku-sagbil' and f['id'].startswith('engine-'), 'Master/PhD PDF40 Word41; t80 PDF36 Word34'),
    ('sbe-english', 'AKÜ SBE İngilizce tipografi/ön akış', '5.2/5.3', lambda f: f['target'] == 'aku-sbe' and not f['id'].startswith('table-'), 'Eight rows; broad pitch selector and physical-page indent anchor require triage before assuming engine defects'),
    ('sbe-tables', 'AKÜ SBE hücre hizası/fixture kapsamı', '5.1', lambda f: f['target'] == 'aku-sbe' and f['id'].startswith('table-'), 'Fifteen rows; master-en/phd-en main content contains no table, six rows have no match. Other rows require text-center vs cell-box-center audit.'),
    ('sociology-pagination', 'AKÜ Sosyoloji sayfalaması', '5.3', lambda f: f['target'] == 'aku-sosyoloji-lisans', 'PDF37 Word36 and label mismatch'),
    ('arial-breaks', 'Arial justification satır kırılımı', '5.2', lambda f: f['target'] == 'engine-word-justify', 'J03 Arial10 / J04 Arial12 line texts differ; J03 last-line word count differs')
]
groups = []
for key, title, phase, predicate, observation in families:
    rows = [f for f in a['wordRegression']['failures'] if predicate(f)]
    groups.append({'id': key, 'title': title, 'ownerPhase': phase, 'failedChecks': len(rows), 'checks': rows, 'observation': observation, 'rootCauseStatus': 'REQUIRES_SCOPED_REPRODUCTION; observations are not a completed fix'})
assert [g['failedChecks'] for g in groups] == [1, 2, 2, 6, 8, 15, 2, 3]
assert len({(f['target'], f['id']) for g in groups for f in g['checks']}) == 39
phases = [
    {'id': '5.1', 'title': 'Ölçüm güvenilirliği ve küçük kaynak temelli düzeltmeler', 'status': 'PLANNED', 'dependsOn': [], 'relativeEffort': 'LOW_MEDIUM'},
    {'id': '5.2', 'title': 'Yazı, satır kırılımı ve paragraf eşliği', 'status': 'PLANNED', 'dependsOn': ['5.1'], 'relativeEffort': 'HIGH'},
    {'id': '5.3', 'title': 'Sayfalama, bölüm sınırları ve dinamik alanlar', 'status': 'PLANNED', 'dependsOn': ['5.2'], 'relativeEffort': 'HIGH'},
    {'id': '5.4', 'title': 'Karmaşık içerik ve düzenlenebilirlik', 'status': 'PLANNED', 'dependsOn': ['5.2', '5.3'], 'relativeEffort': 'MEDIUM_HIGH'},
    {'id': '5.5', 'title': 'Ortam matrisi, tam regresyon ve sürüm kapısı', 'status': 'PLANNED', 'dependsOn': ['5.1', '5.2', '5.3', '5.4'], 'relativeEffort': 'MEDIUM; other environments require actual access'}
]
sources = [
    ('css-justify', 'https://www.w3.org/TR/css-text-3/#text-justify-property', 'CSS does not specify a complete justification algorithm; exact Word parity is a separate measured engine requirement.'),
    ('word-table-row', 'https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.cantsplit?view=openxml-3.0.1', 'cantSplit controls row splitting; absence is not equivalent to the current engine true default.'),
    ('word-compatibility', 'https://support.microsoft.com/en-us/word/compatibility-changes-between-versions', 'Compatibility modes and versions affect feature behavior; record and certify concrete environments.'),
    ('word-printer-metrics', 'https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.useprintermetrics?view=openxml-3.0.1', 'Printer-dependent layout metrics are controlled by a document compatibility setting.'),
    ('openxml-validation', 'https://learn.microsoft.com/en-us/office/open-xml/word/how-to-validate-a-word-processing-document', 'Schema validation is a separate layer from actual layout/Word rendering.'),
    ('word-repaginate', 'https://learn.microsoft.com/en-us/office/vba/api/word.document.repaginate', 'Repaginate recalculates document pagination.'),
    ('word-toc-update', 'https://learn.microsoft.com/en-us/office/vba/api/word.tableofcontents.update', 'TOC.Update entries and UpdatePageNumbers are distinct operations.'),
    ('word-decimal-symbol', 'https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.decimalsymbol?view=openxml-3.0.1', 'decimalSymbol concerns field evaluation; it is not evidence of arbitrary decimal-tab locale parity.')
]
save('orchestration/specs/word-compatibility-plan.audit.json', {
    'schemaVersion': 1, 'date': '2026-10-07', 'status': 'PLANNED', 'baselineRevision': '6deaf6d',
    'planPath': 'orchestration/reports/WORD_UYUM_5_FAZ_PLANI_2026-10-07.md',
    'inspectionMethod': 'Read saved final acceptance/reports, selected source code and official Microsoft/W3C documentation. Read selected actual PDF/Word H4 lines with existing pdfmeasure.visual_lines and inspect English fixture main content. No new full export or fix acceptance in this planning turn.',
    'baseline': {'acceptancePath': acceptance_path, 'sha256': hashlib.sha256((root / acceptance_path).read_bytes()).hexdigest(), 'targets': 21, 'variants': 35, 'counts': a['wordRegression']['counts'], 'layoutGates': len(a['wordRegression']['gates']), 'frontendTests': 732, 'pythonTests': 40, 'generatorTests': 3},
    'families': groups, 'phases': phases,
    'additionalUnknowns': ['Editor justified last-line preview', 'Footnote horizontal marker/body alignment', 'Unnamed paragraph terminal leading', 'Bidi/RTL model and non-locale decimal tabs', 'Firefox/Safari and alternative Word environment parity', 'Long fixed-page replacement metadata and other ADU variants', '109 unmapped source property groups; not 109 confirmed defects'],
    'researchSources': [{'id': key, 'url': url, 'accessedAt': '2026-10-07', 'planningImplication': implication} for key, url, implication in sources],
    'releaseGate': {'requiredFailures': 0, 'requiredUnknownOrSkipped': 0, 'consecutiveFullAcceptanceRuns': 2, 'scope': 'Declared supported features, variants, fonts and measured environment profiles; untested environments cannot be certified'}
})
p = read('orchestration/progress.json')
p['currentPhase'] = 'MOTOR Phase 5 Word compatibility program PLANNED (5.1-5.5); audit/roadmap recorded; implementation not started. Phase 4 remains CLOSED.'
p['enginePlan']['phase5'] = 'PLANNED (five stages: reliable checks, typography, pagination/fields, complex editable content, release certification)'
p['enginePlan']['phase5PlanPath'] = 'orchestration/reports/WORD_UYUM_5_FAZ_PLANI_2026-10-07.md'
p['enginePlan']['phase5AuditPath'] = 'orchestration/specs/word-compatibility-plan.audit.json'
p['wordCompatibilityProgram'] = {'status': 'PLANNED', 'currentStage': '5.1', 'phases': phases, 'baselineFailures': 39, 'failureFamilies': 8, 'releaseGate': 'Zero required FAIL/SKIPPED/UNKNOWN in declared scope; two consecutive full acceptance runs', 'nextAction': '5.1.1-5.1.2: source-bound failure classification, H4 anchor and English table fixture coverage before engine changes'}
save('orchestration/progress.json', p)
print('Plan audit saved: 39 distinct checks / 8 families / 5 planned phases / 8 primary research sources; no new PASS claimed')
