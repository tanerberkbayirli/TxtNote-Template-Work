from collections import Counter
import sys
import pdfplumber
for path in sys.argv[1:]:
    with pdfplumber.open(path) as pdf:
        counts=Counter((c['fontname'], round(c['size'], 2)) for p in pdf.pages for c in p.chars)
        print(path, 'pages=', len(pdf.pages), 'fontCounts=', counts.most_common(12))
        for pno in [3, 5, 12, 15, 31]:
            p=pdf.pages[pno]
            text=p.extract_text() or ''
            print('page',pno+1,'first=',repr(text[:180]))
