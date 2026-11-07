"""Print source-specific evidence for human review, never silently choose a rule."""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('university')
parser.add_argument('--scope', default='')
parser.add_argument('--text', action='store_true')
parser.add_argument('--compact', action='store_true')
parser.add_argument('--passages', action='store_true')
args = parser.parse_args()
config = json.loads((ROOT/'engine/tools/kaynak/ege-universities.json').read_text(encoding='utf-8'))
university = next(u['name'] for u in config['universities'] if u['id']==args.university)
archive = ROOT/'Butun-Sablonlar/Ege'
output = ROOT/'engine/output/ege-rebuild'
for path in sorted((archive/university).rglob('*')):
    if path.suffix not in {'.pdf','.docx','.doc'} or args.scope.lower() not in path.parent.name.lower():
        continue
    key = hashlib.sha256(path.relative_to(archive).as_posix().encode()).hexdigest()[:16]
    directory = output/key
    print('\n###', path.relative_to(archive).as_posix(), key)
    if not (directory/'text.json').exists():
        print('NOT EXTRACTED');continue
    units=json.loads((directory/'text.json').read_text(encoding='utf-8'))
    if args.passages:
        if not re.search(r'Kilavuz|Klavuz|Kurallari|Yonerge|Guide',path.name,re.I):
            continue
        for unit in units:
            lines=unit['text'].splitlines()
            wanted=set()
            for i,line in enumerate(lines):
                if re.search(r'punto|font size|12.point|line spac|kenar.{0,40}(?:cm|boş)|margin|satır.{0,20}aralı|paragraf.{0,30}cm|boşluk.{0,15}cm',line,re.I):
                    wanted.update(range(max(0,i-1),min(len(lines),i+3)))
            if wanted:
                print(unit['location'],' '.join(lines[i] for i in sorted(wanted)))
        continue
    if args.text:
        for unit in units:
            print(unit['location'], unit['text'])
        continue
    rules=json.loads((directory/'rules.json').read_text(encoding='utf-8'))['rules']
    if args.compact:
        print('RULES',json.dumps({k:v.get('values',v['value']) for k,v in rules.items() if k.startswith(('body.','page.margins.','page.numbering.','headings.','caption.','footnote.','tables.position','figures.position'))},ensure_ascii=False))
        if (directory/'spec.json').exists():
            spec=json.loads((directory/'spec.json').read_text(encoding='utf-8'))
            print('MEASURED',json.dumps(spec['profile'].get('bodyProfile'),ensure_ascii=False))
        continue
    for k,v in rules.items():
        print(k, v['status'], v.get('values',v['value']))
        for e in v['evidence'][:2]:
            print(' ',e['location'], e['sentence'])
    if (directory/'spec.json').exists():
        spec=json.loads((directory/'spec.json').read_text(encoding='utf-8'))
        print('BODY',json.dumps(spec['profile'].get('bodyProfile'),ensure_ascii=False))
        print('SECTIONS',[(s['page'],s['marginsMm'],s['firstTexts'][:2]) for s in spec['sections'][:3]])
    print('OPENING', re.sub(r'\s+',' ',' '.join(u['text'] for u in units[:4]))[:650])
