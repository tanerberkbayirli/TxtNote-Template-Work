import json, re, zipfile, hashlib
from pathlib import Path
from lxml import etree

ROOT = Path(__file__).parent / "originals"
FILES = [
    "AFSU_Lisansustu_Doktora_Tez_Sablonu_2026.docx",
    "AFSU_Lisansustu_Yuksek_Lisans_Tez_Sablonu_2026.docx",
    "AFSU_Lisansustu_Doktora_Kabul_Onay_Sayfasi_2026.docx",
    "AFSU_Lisansustu_YL_Kabul_Onay_Sayfasi_2026.docx",
]
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"w": W, "r": R}

def attr(el, name):
    return el.get(f"{{{W}}}{name}") if el is not None else None

def tw(v):
    return round(int(v) / 20, 3) if v and str(v).lstrip("-").isdigit() else None

def sect(s, label):
    pg = s.find("w:pgSz", NS); mar = s.find("w:pgMar", NS)
    return {"label": label, "page_width_twips": attr(pg,"w"), "page_height_twips": attr(pg,"h"),
            "page_width_cm": round(int(attr(pg,"w"))/567,3) if attr(pg,"w") else None,
            "page_height_cm": round(int(attr(pg,"h"))/567,3) if attr(pg,"h") else None,
            "orientation": attr(pg,"orient"),
            "margins_twips": {k: attr(mar,k) for k in ("top","right","bottom","left","header","footer","gutter")} if mar is not None else {},
            "margins_cm": {k: round(int(attr(mar,k))/567,3) if attr(mar,k) and attr(mar,k).isdigit() else None for k in ("top","right","bottom","left","header","footer","gutter")} if mar is not None else {},
            "title_page": s.find("w:titlePg",NS) is not None,
            "page_numbering": ({k: attr(s.find("w:pgNumType",NS),k) for k in ("fmt","start","chapStyle","chapSep")} if s.find("w:pgNumType",NS) is not None else None),
            "header_refs": [attr(x,"id") for x in s.findall("w:headerReference",NS)],
            "footer_refs": [attr(x,"id") for x in s.findall("w:footerReference",NS)]}

def run_font(r):
    rf = r.find("w:rPr/w:rFonts",NS)
    return {k: attr(rf,k) for k in ("ascii","hAnsi","cs","eastAsia")} if rf is not None else None

def p_info(p):
    txt = "".join(p.xpath(".//w:t/text()",namespaces=NS))
    ppr = p.find("w:pPr",NS); pp = ppr.find("w:pStyle",NS) if ppr is not None else None
    jc = ppr.find("w:jc",NS) if ppr is not None else None
    ind = ppr.find("w:ind",NS) if ppr is not None else None
    sp = ppr.find("w:spacing",NS) if ppr is not None else None
    runs=[]
    for r in p.findall(".//w:r",NS):
        t="".join(r.xpath(".//w:t/text()",namespaces=NS))
        if t or r.find("w:rPr",NS) is not None:
            rp=r.find("w:rPr",NS); sz=rp.find("w:sz",NS) if rp is not None else None
            runs.append({"text":t[:180],"font":run_font(r),"size_half_points":attr(sz,"val"),"bold":rp.find("w:b",NS) is not None if rp is not None else False,"italic":rp.find("w:i",NS) is not None if rp is not None else False})
    return {"text":txt[:260],"style":attr(pp,"val"),"alignment":attr(jc,"val"),
            "indent_twips": {k:attr(ind,k) for k in ("left","right","firstLine","hanging")} if ind is not None else None,
            "spacing": {k:attr(sp,k) for k in ("before","after","line","lineRule")} if sp is not None else None,
            "page_break_before": ppr.find("w:pageBreakBefore",NS) is not None if ppr is not None else False,
            "section_break": ppr.find("w:sectPr",NS) is not None if ppr is not None else False,
            "runs":runs,"drawing_count":len(p.findall(".//w:drawing",NS)),"vml_count":len(p.findall(".//w:pict",NS)),
            "field_instr":p.xpath(".//w:instrText/text()",namespaces=NS)}

def inspect(filename):
    path=ROOT/filename
    with zipfile.ZipFile(path) as z:
        doc=etree.fromstring(z.read("word/document.xml")); styles=etree.fromstring(z.read("word/styles.xml"))
        sects=[]
        for i,s in enumerate(doc.xpath("//w:sectPr",namespaces=NS),1): sects.append(sect(s,f"sectPr-{i}"))
        paras=[p_info(p) for p in doc.xpath("//w:body/w:p",namespaces=NS)]
        table_paras=[p_info(p) for p in doc.xpath("//w:body/w:tbl//w:p",namespaces=NS)]
        style_rows=[]
        for s in styles.xpath("//w:style",namespaces=NS):
            sid=attr(s,"styleId"); typ=attr(s,"type"); name=s.find("w:name",NS); based=s.find("w:basedOn",NS)
            rpr=s.find("w:rPr",NS); ppr=s.find("w:pPr",NS); rf=rpr.find("w:rFonts",NS) if rpr is not None else None
            sz=rpr.find("w:sz",NS) if rpr is not None else None; spacing=ppr.find("w:spacing",NS) if ppr is not None else None
            style_rows.append({"id":sid,"type":typ,"name":attr(name,"val"),"based_on":attr(based,"val"),"font":{k:attr(rf,k) for k in ("ascii","hAnsi","cs","eastAsia")} if rf is not None else None,"size_half_points":attr(sz,"val"),"paragraph_spacing":{k:attr(spacing,k) for k in ("before","after","line","lineRule")} if spacing is not None else None})
        parts={}
        for nm in z.namelist():
            if re.fullmatch(r"word/(header|footer)\d+\.xml",nm):
                x=etree.fromstring(z.read(nm)); parts[nm] = {"text":"".join(x.xpath("//w:t/text()",namespaces=NS)),"fields":x.xpath("//w:instrText/text()",namespaces=NS),"paragraphs":[p_info(p) for p in x.xpath("//w:p",namespaces=NS)]}
        core=etree.fromstring(z.read("docProps/core.xml")) if "docProps/core.xml" in z.namelist() else None
        return {"file":filename,"sha256":hashlib.sha256(path.read_bytes()).hexdigest(),"bytes":path.stat().st_size,
                "sections":sects,"paragraphs":paras,"table_paragraphs":table_paras,"styles":style_rows,"header_footer_parts":parts,
                "media":[{"name":n,"bytes":z.getinfo(n).file_size} for n in z.namelist() if n.startswith("word/media/")],
                "relationships":etree.tostring(etree.fromstring(z.read("word/_rels/document.xml.rels")),encoding="unicode") if "word/_rels/document.xml.rels" in z.namelist() else None}

out=[inspect(f) for f in FILES]
dest=Path(__file__).parents[3]/"validation"/"afsu-lee"/"source"/"docx-structure.json"
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
print(dest)
for d in out:
    print("\n###",d["file"],d["sha256"])
    print("sections",json.dumps(d["sections"],ensure_ascii=False))
    print("media",d["media"])
    print("styles",[(s["id"],s["name"],s["font"],s["size_half_points"],s["paragraph_spacing"]) for s in d["styles"] if s["font"] or s["size_half_points"] or s["paragraph_spacing"]][:45])
    print("header-footer",{k:{"text":v["text"],"fields":v["fields"]} for k,v in d["header_footer_parts"].items()})
    print("body paragraphs",len(d["paragraphs"]),"table paragraphs",len(d["table_paragraphs"]))
    for i,p in enumerate(d["paragraphs"]):
        if p["text"] or p["drawing_count"] or p["vml_count"] or p["field_instr"]:
            print(i,json.dumps({k:p[k] for k in ("text","style","alignment","indent_twips","spacing","page_break_before","section_break","drawing_count","vml_count","field_instr","runs")},ensure_ascii=False))
