# Gap check on export-v6.pdf, Word line model: line top = baseline - 0.9336*size, line bottom = line top + 1.15*size*lineHeight.
import pymupdf,re,zipfile
mm=25.4/72; pt=1/72*72
A=0.9336; E=1.15
d=pymupdf.open("orchestration/artifacts/afsu-eczacilik-proje/exports/export-v6.pdf")
def lines(p):
    out=[]
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines",[]):
            s=l["spans"][0]; out.append((s["origin"][1]/72*25.4, s["size"], "".join(x["text"] for x in l["spans"])))
    return sorted(out)
res={}
p=d[54]; imgs=[pymupdf.Rect(i["bbox"]) for i in p.get_image_info()]; L=lines(p)
fig_bottom=imgs[0].y1*mm
cap=[l for l in L if re.match(r"\s*.ekil 4\.1",l[2])][0]
cap_top=cap[0]-A*cap[1]*25.4/72
res["figure_lower_edge->caption_top (Word line box), expected 6pt"]=(cap_top-fig_bottom)/25.4*72
nxt=[l for l in L if l[0]>cap[0]+1][0]
cap_bottom=cap[0]-A*cap[1]*25.4/72+E*cap[1]*25.4/72
nxt_top=nxt[0]-A*nxt[1]*25.4/72
res["figure caption bottom->next body line top, expected 12pt"]=(nxt_top-cap_bottom)/25.4*72
# table: caption bottom -> table top edge (first horizontal rule), after table -> next text
p=d[53]; L=lines(p)
cap=[l for l in L if l[2].startswith("Tablo 4.1.")][-1]
cap_bottom=cap[0]-A*cap[1]*25.4/72+E*cap[1]*25.4/72
hs=sorted({round(r["rect"].y0*mm,3) for r in p.get_drawings() if r["rect"].height<1 and r["rect"].width>50}|{round(r["rect"].y1*mm,3) for r in p.get_drawings() if r["rect"].height<1 and r["rect"].width>50})
top=[y for y in hs if y>cap[0]][0]; bot=hs[-1]
res["table caption bottom->table top edge, expected 6pt"]=(top-cap_bottom)/25.4*72
nxt=[l for l in L if l[0]>bot][0]
res["table bottom edge->next text line top, expected 12pt"]=((nxt[0]-A*nxt[1]*25.4/72)-bot)/25.4*72
for k,v in res.items(): print(f"{k}: {v:.2f} pt = {v*25.4/72:.2f} mm")
z=zipfile.ZipFile("orchestration/artifacts/afsu-eczacilik-proje/exports/export-v6.docx"); x=z.read("word/document.xml").decode()
ps=re.findall(r"<w:p[ >].*?</w:p>",x,flags=re.S)
for i,q in enumerate(ps):
    t=re.sub(r"<[^>]+>","",q)
    if t.startswith("Şekil 4.1. Bi") and 'w:jc w:val="center"' in q:
        print("DOCX figure para before",re.findall(r"<w:spacing[^>]*>",ps[i-1]),"caption",re.findall(r"<w:spacing[^>]*>",q),"next",re.findall(r"<w:spacing[^>]*>",ps[i+1]))
    if t.startswith("Tablo 4.1. Kurgusal") and 'w:jc w:val="center"' in q: print("DOCX table caption",re.findall(r"<w:spacing[^>]*>",q))
