from pathlib import Path
import json,sys,re
ROOT=Path(__file__).resolve().parents[2]
sys.path[:0]=[str(ROOT/'orchestration/tools/measurement-packages'),str(ROOT/'orchestration/tools')]
from conformance import Doc,_case_lines
rows=json.loads((ROOT/'orchestration/engine-work/mission05/probe-lines.json').read_text(encoding='utf-8'))
doc=Doc(str(ROOT/'orchestration/engine-work/mission05/baseline-justify/run/default.word.pdf'))
for n in range(1,9):
    tag=f'J{n:02}';actual=[l['text'] for row in rows if row['tag'].startswith(tag) for l in row['lines']]
    expected=_case_lines(doc,tag)
    diff=[(i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b]
    print(tag,len(actual),len(expected),len(diff),diff[:2])
