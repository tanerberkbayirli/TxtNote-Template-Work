import json, re, unicodedata, difflib, collections
import pymupdf
from pathlib import Path

root=Path('orchestration/engine-work/final-closure/src09-active')
pages=json.loads((root/'fresh-baseline/SRC09.pages.json').read_text(encoding='utf8'))
pdf=pymupdf.open('orchestration/engine-work/mission01/references/SRC09/word.pdf')
normalize=lambda x: re.sub(r'[\W_]+','',unicodedata.normalize('NFKC',x).lower())
ours=[normalize(w) for p in pages for _,w in sorted(p['words'],key=lambda x:x[0]) if normalize(w)]
words=[];physical=[]
for i,p in enumerate(pdf):
    for w in p.get_text('words',sort=True):
        if 58<w[1]<790 and normalize(w[4]): words.append(normalize(w[4]));physical.append(i+1)
matcher=difflib.SequenceMatcher(None,ours,words,autojunk=False)
unmatched=[];perpage=collections.Counter()
for tag,a,b,c,d in matcher.get_opcodes():
    if tag=='equal' or c==d:continue
    for j in range(c,d): perpage[physical[j]]+=len(words[j])
    unmatched.append({'page':physical[c],'wordChars':sum(map(len,words[c:d])),'source':' '.join(words[c:d])[:800],'editor':' '.join(ours[a:b])[:800]})
report={'note':'Token-level unmatched regions before the existing character-level coverage pass. Diagnostic only; no acceptance changes.','pages':perpage.most_common(),'largest':sorted(unmatched,key=lambda x:-x['wordChars'])[:35]}
(root/'coverage-diagnosis.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report['pages'][:20]))
