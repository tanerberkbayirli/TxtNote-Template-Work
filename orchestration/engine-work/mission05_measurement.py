"""Verify the real Word PDF's omitted narrow space at a style boundary."""
from pathlib import Path
import hashlib,json,sys
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'orchestration/tools'))
from pdfmeasure import *
path=ROOT/'orchestration/engine-work/mission05/source-matrix-5/run/default.word.pdf'
doc=open_pdf(path);page=doc[4]
line=next(l for l in visual_lines(page) if l['text'].startswith('enToken'))
left=next(s for s in line['spans'] if s['text']=='kalın araştırma')
right=next(s for s in line['spans'] if s['text']=='italik yöntem')
assert not left['text'].endswith(' ') and not right['text'].startswith(' ')
xref=next(row[0] for row in page.get_fonts(full=True) if row[3].split('+')[-1]==right['font'])
import pymupdf
font=pymupdf.Font(fontbuffer=doc.extract_font(xref)[3])
space=font.text_length(' ',fontsize=right['size']);gap=(right['x0']-left['x1'])/PT2MM
assert .9*space<gap<.25*right['size'],(space,gap,right['size'])
assert 'kalın araştırma italik yöntem' in line['text']
# Existing tests keep their exact line strings and their original tolerances.
# The corrected reader must preserve the frozen negative reference and both
# original pre-fix Arial line differences; it cannot turn the old export green.
from conformance import Doc,_case_lines
baseline=ROOT/'orchestration/engine-work/mission05/baseline-justify/run'
old=Doc(str(baseline/'default.pdf'));word=Doc(str(baseline/'default.word.pdf'))
for tag in ['J03','J04']:
    assert _case_lines(old,tag) != _case_lines(word,tag),tag
result={'status':'PASS','wordPdf':str(path.relative_to(ROOT)).replace('\\','/'),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
 'font':right['font'],'fontSizePt':right['size'],'embeddedSpaceAdvancePt':space,'actualRunGapPt':gap,'oldThresholdPt':.25*right['size'],
 'encodedSpaceAbsent':True,'styleBoundaryPreserved':True,'baselineJ03J04StillFail':True,
 'reason':'The real Word PDF positions the italic run by a narrow Calibri space without encoding that space. The previous fixed .25 em reader threshold concatenated two words.'}
(ROOT/'orchestration/engine-work/mission05/measurement-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False))
