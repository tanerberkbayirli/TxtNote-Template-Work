import pymupdf, json, sys
MM=25.4/72
src='Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf'
d=pymupdf.open(src)
out=[]
for pno in range(d.page_count):
    p=d[pno]
    pg={'page':pno+1,'pageSizeMm':[round(p.rect.width*MM,2),round(p.rect.height*MM,2)],'lines':[],'images':[],'drawings':[]}
    td=p.get_text('dict')
    for b in td['blocks']:
        if b['type']!=0: continue
        for l in b['lines']:
            spans=[s for s in l['spans'] if s['text'].strip()]
            if not spans: continue
            txt=''.join(s['text'] for s in l['spans']).strip()
            s0=spans[0]
            fonts=sorted(set((s['font'],round(s['size'],2)) for s in spans))
            x0=min(s['bbox'][0] for s in spans); x1=max(s['bbox'][2] for s in spans)
            pg['lines'].append({'text':txt[:120],'font':s0['font'],'sizePt':round(s0['size'],2),'fonts':fonts if len(fonts)>1 else None,
               'bold':bool(s0['flags']&16) or 'Bold' in s0['font'],'color':s0['color'],
               'x0Mm':round(x0*MM,2),'x1Mm':round(x1*MM,2),'baselineMm':round(s0['origin'][1]*MM,2),'topMm':round(l['bbox'][1]*MM,2)})
    for img in p.get_images(full=True):
        for r in p.get_image_rects(img[0]):
            pg['images'].append({'xref':img[0],'x0Mm':round(r.x0*MM,2),'y0Mm':round(r.y0*MM,2),'wMm':round(r.width*MM,2),'hMm':round(r.height*MM,2),'px':[img[2],img[3]]})
    for dr in p.get_drawings():
        r=dr['rect']
        pg['drawings'].append({'type':dr['type'],'x0Mm':round(r.x0*MM,2),'y0Mm':round(r.y0*MM,2),'x1Mm':round(r.x1*MM,2),'y1Mm':round(r.y1*MM,2),'color':dr.get('color'),'fill':dr.get('fill'),'widthPt':dr.get('width'),'dashes':dr.get('dashes')})
    out.append(pg)
json.dump(out,open(sys.argv[1],'w'),ensure_ascii=False,indent=0)
