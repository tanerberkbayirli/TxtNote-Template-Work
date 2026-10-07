"""Idempotent Phase 5.1 fixture/check migration; never changes source expectations."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPECS = ROOT / 'orchestration/specs'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def prepare():
    checks_path = SPECS / 'aku-sagbil.checks.json'
    checks = read(checks_path)
    for check in checks:
        if check['id'] in ('h4-bold-editor', 'h4-bold-word'):
            check['params']['anchor'] = {'kind': 'heading', 'regex': r'Alt Başlık 1\.1\.1\.1$', 'sectionId': 'main'}
            # Match the semantically selected heading regardless of numbering prefix.
            check['params']['regex'] = r'Alt Başlık 1\.1\.1\.1$'
    save(checks_path, checks)

    # Preserve the authored left/center choices using the editor's existing safe classes.
    for path in SPECS.glob('aku-sbe.fixture*.json'):
        fixture = read(path)
        def canonical(html):
            return re.sub(r'<(td|th) style="text-align:(left|center|right|justify)"',
                          r'<\1 class="fmt-align-\2"', html)
        fixture['content'] = canonical(fixture['content'])
        for key, html in fixture['researchData']['thesis'].get('sectionContent', {}).items():
            fixture['researchData']['thesis']['sectionContent'][key] = canonical(html)
        if path.name in ('aku-sbe.fixture.master-en.json', 'aku-sbe.fixture.phd-en.json') and '<table' not in fixture['content']:
            # Same numeric/header semantics as the existing source-backed Turkish fixture.
            fixture['content'] += ('<div class="academic-table-wrap" data-academic-table="true">'
                '<table class="academic-table" data-kind="table"><caption>Participant distribution</caption>'
                '<thead><tr><th class="fmt-align-center">Variable</th><th class="fmt-align-center">f</th>'
                '<th class="fmt-align-center">%</th></tr></thead><tbody><tr>'
                '<td class="fmt-align-left">Variable 1</td><td class="fmt-align-center">40</td>'
                '<td class="fmt-align-center">13,3</td></tr></tbody></table></div>')
        save(path, fixture)

    path = SPECS / 'aku-sbe.checks.json'
    checks = read(path)
    for check in checks:
        if check['kind'] == 'line_pitch' and check['id'].startswith('body-line-pitch'):
            check['params']['anchor'] = {'kind': 'paragraph', 'sectionId': 'introduction',
                                         'id': 'introduction:paragraph:1', 'afterHeading': '^GİRİŞ$', 'headingOccurrence': 0}
        if check['kind'] == 'line_attr' and check['id'].startswith('first-line-indent'):
            check['params']['anchor'] = {'kind': 'paragraph', 'sectionId': 'introduction',
                                         'id': 'introduction:paragraph:1', 'afterHeading': '^GİRİŞ$', 'headingOccurrence': 0}
            check['params']['pages'] = {'label': 'arabic'}
            check['source']['locator'] = check['source']['locator'].replace(
                'first body paragraph line on fixture page 15 (GİRİŞ)',
                'first line of semantic introduction paragraph introduction:paragraph:1')
    save(path, checks)


if __name__ == '__main__':
    prepare()
    print('Phase 5.1 checks/fixtures prepared; expected values and tolerances preserved.')
