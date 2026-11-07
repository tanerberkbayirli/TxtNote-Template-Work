"""Read every regional source independently, retaining full text and OOXML measurements.

This is a read-only source audit, not an approval of the regex-extracted rules.
Run with the bundled Python; --runtime may point at an unpacked PyMuPDF wheel.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--runtime', type=Path)
    parser.add_argument('--reuse-extracted', action='store_true')
    args = parser.parse_args()
    if args.runtime:
        sys.path.insert(0, str(args.runtime.resolve()))
    sys.path.insert(0, str(HERE))
    reader = importlib.import_module('extract-guide-rules')
    measure = importlib.import_module('extract-docx-spec')
    archive = ROOT / 'Butun-Sablonlar' / 'Ege'
    output = ROOT / 'engine' / 'output' / 'ege-rebuild'
    output.mkdir(parents=True, exist_ok=True)
    previous=json.loads((output/'sources.json').read_text(encoding='utf-8')) if (output/'sources.json').exists() else []
    previous_hashes={r['path']:r['sha256'] for r in previous}
    rows = []
    for source in sorted(archive.rglob('*')):
        if source.name.startswith('~$') or source.suffix.lower() not in {'.pdf', '.docx', '.doc'}:
            continue
        relative = source.relative_to(archive)
        key = hashlib.sha256(relative.as_posix().encode()).hexdigest()[:16]
        directory = output / key
        directory.mkdir(exist_ok=True)
        row = {'path': source.relative_to(ROOT).as_posix(), 'university': relative.parts[0],
               'scope': relative.parts[1], 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
               'key': key}
        try:
            legacy_units = None
            if source.suffix.lower() == '.doc':
                converted = output / 'converted' / (source.stem + '.docx')
                if not converted.exists():
                    if (directory / 'legacy.json').exists():
                        legacy_units = json.loads((directory/'text.json').read_text(encoding='utf-8'))
                        read_path = source
                    else:
                        row['status'] = 'legacy-conversion-required'
                        rows.append(row)
                        continue
                else:
                    read_path = converted
            else:
                read_path = source
            reusable=args.reuse_extracted and previous_hashes.get(row['path'])==row['sha256'] and (directory/'text.json').exists()
            units = json.loads((directory/'text.json').read_text(encoding='utf-8')) if reusable else legacy_units if legacy_units is not None else reader.read_document(read_path)
            (directory / 'text.json').write_text(json.dumps(units, ensure_ascii=False, indent=1), encoding='utf-8')
            (directory / 'text.txt').write_text('\n\n'.join(f"[{u['location']}]\n{u['text']}" for u in units), encoding='utf-8')
            rules = reader.extract(units)
            (directory / 'rules.json').write_text(json.dumps({'file': {'name': source.name, 'path': row['path']},
                'rules': rules.rules, 'statements': rules.statements}, ensure_ascii=False, indent=1), encoding='utf-8')
            row.update(status='extracted', units=len(units), characters=sum(len(u['text']) for u in units),
                       rules=len(rules.rules), conflicts=[k for k,v in rules.rules.items() if v['status']=='CONFLICT'])
            if read_path.suffix.lower() == '.docx':
                spec = json.loads((directory/'spec.json').read_text(encoding='utf-8')) if reusable and (directory/'spec.json').exists() else measure.extract(read_path)
                (directory / 'spec.json').write_text(json.dumps(spec, ensure_ascii=False, indent=1), encoding='utf-8')
                (directory / 'measurements.md').write_text(measure.summary(spec), encoding='utf-8')
            if not row['characters']:
                row['status'] = 'no-text-review-required'
        except (Exception, SystemExit) as error:
            row.update(status='error', error=str(error))
        rows.append(row)
        print(f"{row['status']} {relative.as_posix()}", flush=True)
    (output / 'sources.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(rows)} sources; {sum(r["status"] == "extracted" for r in rows)} extracted', flush=True)


if __name__ == '__main__':
    main()
