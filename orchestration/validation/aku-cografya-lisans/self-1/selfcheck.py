"""Measured self-check of the real export (cog.pdf / cog.docx) against the source values of aku-cografya-lisans.
usage: python selfcheck.py   (run from repo root). Prints PASS/FAIL per check; expected values carry their source."""
import re, sys, zipfile
sys.path.insert(0, "orchestration/tools")
from pdfmeasure import *  # noqa
D = "orchestration/validation/aku-cografya-lisans/self-1/"
doc = open_pdf(D + "cog.pdf")
res = []
def check(name, expected, actual, tol, src):
    ok = abs(actual - expected) <= tol if isinstance(expected, (int, float)) else actual == expected
    res.append(ok)
    print(("PASS" if ok else "FAIL"), f"{name}: expected {expected} actual {actual if not isinstance(actual, float) else round(actual, 3)} (tol {tol}) [{src}]")

lines = {i: visual_lines(doc[i]) for i in range(len(doc))}
sheets = [page_number(doc[i]) for i in range(len(doc))]
labels = [s["text"] if s else "" for s in sheets]
check("pages A4 mm", (210.0, 297.0), tuple(round(v) for v in page_size_mm(doc[0])), 0, "guide 2.1")

# --- body page (GİRİŞ page index 11): margins, first baseline, pitch
body = [l for l in lines[12] if l["size"] > 11 and 25 < l["baseline"] < 270]  # page 13 = first full text page
b = text_bounds(body)
check("body left edge mm", 30.0, b["x0"] if not any(l["x0"] < 30 for l in body) else min(l["x0"] for l in body), 0.25, "guide 2.3 (3 cm)")
check("body right edge mm", 180.0, max(l["x1"] for l in body), 0.25, "guide 2.3 (3 cm)")
check("first baseline mm (25 mm top + 0.9335 em)", 28.95, b["firstBaseline"], 0.25, "guide 2.3 + wordModel")
pitch = [p for p in baseline_pitches([l for l in body if l["x0"] <= 43][2:8])]
check("body line pitch pt (1.5 lines x 12 pt)", 20.69, sorted(pitch)[len(pitch) // 2], 0.15, "guide 2.2 + Word model")
last = max(l["bottom"] for l in lines[12] if l["baseline"] < 270)
res.append(last <= 272.0); print("PASS" if last <= 272.0 else "FAIL", "text bottom <= 272 mm (25 mm bottom margin):", round(last, 2))

# --- fonts: every span TNR, genuine embedded program
fonts = embedded_fonts(doc)
tnr = [f for f in fonts if f["embedded"]]
fam = {f.get("family") for f in tnr}
used = {k[0] for k in font_usage(doc)}
ok = used <= {"TimesNewRomanPSMT", "TimesNewRomanPS-BoldMT", "TimesNewRomanPS-ItalicMT", "TimesNewRomanPS-BoldItalicMT"} and fam == {"Times New Roman"}
res.append(ok); print("PASS" if ok else "FAIL", "fonts used", used, "embedded families", fam)
sizes = sorted({k[1] for k in font_usage(doc)})
print("INFO font sizes in document:", sizes)

# --- page numbers
want = ["", "", ""] + ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"] + [str(n) for n in range(1, 23)]
ok = labels == want; res.append(ok)
print("PASS" if ok else "FAIL", "page labels (cover/approval/ethics blank; roman front; arabic from GİRİŞ):", labels[:14], "...", labels[-2:], len(labels))
pn = sheets[12]
check("page number baseline (footer 12.5 mm)", 283.5, pn["baseline"], 0.6, "template sectPr footer=708/709 tw; 10 pt text")
check("page number size pt", 10.0, pn["size"], 0.05, "guide 2.7")
check("page number centre x mm", 105.0, (pn["x0"] + pn["x1"]) / 2, 0.3, "guide 2.3/2.7 (bottom centre)")

# --- headings: first H1 page, H2/H3/H4
h1 = find_line(lines[11], r"^1\. GİRİŞ")[0]
check("H1 size / bold", (12.0, True), (h1["size"], h1["bold"]), 0, "guide 2.8")
check("H1 x0 mm (no indent)", 30.0, h1["x0"], 0.3, "guide 2.4/2.8")
first_para = [l for l in lines[11] if l["baseline"] > h1["baseline"] + 1][0]
check("H1 -> first line baseline gap mm (empty 1.5 line 20.7 pt: 9.49pt+20.7pt+11.2pt)", (9.49 + 20.7 + 11.2) * 25.4 / 72, first_para["baseline"] - h1["baseline"], 0.3, "guide 2.4/2.6")
check("first-line indent mm", 42.5, first_para["x0"], 0.3, "template ind firstLine=708/709 (CONFLICT with guide 2.4 prose)")
h2 = find_line(lines[12], r"^2\.1 Alt")[0]
prev = [l for l in lines[12] if l["baseline"] < h2["baseline"] - 1][-1]
nxt = [l for l in lines[12] if l["baseline"] > h2["baseline"] + 1][0]
check("para -> H2 baseline gap mm (6 + 14.7 pt + 20.69 pitch)", (20.69 + 14.7 + 6) * 25.4 / 72, h2["baseline"] - prev["baseline"], 0.3, "guide 2.4/2.6 + 6/6 additive")
check("H2 -> para baseline gap mm", (20.69 + 14.7 + 6) * 25.4 / 72, nxt["baseline"] - h2["baseline"], 0.3, "guide 2.4/2.6 + 6/6 additive")
pp = [l for l in lines[11] if l["x0"] > 40 and l["baseline"] > 60][:2]
check("paragraph -> paragraph baseline gap mm (6+6 pt additive + pitch)", (20.69 + 12) * 25.4 / 72, pp[1]["baseline"] - [l for l in lines[11] if l["baseline"] < pp[1]["baseline"] - 1][-1]["baseline"], 0.3, "guide 2.2 'öncesi-sonrası 6 nk'")
for name, pat in (("H3", r"^2\.1\.1 Alt"), ("H4", r"^2\.1\.1\.1 Alt")):
    m = find_line(lines[13], pat)[0]
    check(f"{name} size/bold", (12.0, True), (m["size"], m["bold"]), 0, "guide 2.8")

# --- cover (page 1)
cov = lines[0]
check("cover text size pt", 14.0, min(l["size"] for l in cov), 0.05, "guide 4.2.2 + template sz=28")
check("cover all bold", True, all(l["bold"] for l in cov), 0, "guide 4.2.2")
check("cover centred", True, all(abs((l["x0"] + l["x1"]) / 2 - 105) < 0.5 for l in cov), 0, "template jc=center")
imgs = images_mm(doc[0])
check("cover seals count/size mm", (2, 26.19), (len(imgs), round(imgs[0]["w"], 2)), 0.05, "template extent 26.19 mm")
check("cover seal right edge mm (right aligned run)", 180.0, max(i["x1"] for i in imgs), 0.1, "template jc=right")
check("cover top of seals mm (25 mm top margin)", 25.0, min(i["top"] for i in imgs), 0.1, "template pgMar top=1418")
check("cover ends above bottom margin mm", True, max(l["bottom"] for l in cov) <= 272, 0, "single page")

# --- captions / tables on the figure+table page (index 14)
cap = find_line(lines[14], r"^Şekil 2\.1")[0]
check("figure caption size/label bold", (11.0, True), (cap["size"], cap["spans"][0]["bold"]), 0, "guide 3.3 + template")
tcap = find_line(lines[14], r"^Tablo 2\.1")[0]
check("table caption size pt", 11.0, tcap["size"], 0.05, "guide 3.3")
cont = [find_line(lines[i], r"^Tablo 4\.1 \(Devamı\)") for i in range(len(doc))]
ok = any(cont); res.append(ok); print("PASS" if ok else "FAIL", "continued-table caption 'Tablo 4.1 (Devamı)'", [i + 1 for i, c in enumerate(cont) if c])
img_page = images_mm(doc[14])
check("figure centred x mm", 105.0, (img_page[0]["x0"] + img_page[0]["x1"]) / 2, 0.3, "guide 2.3/3.1 (ortalı)")
note = find_line(lines[14], r"^Not:")[0]
check("table note size pt", 11.0, note["size"], 0.05, "guide 3.3 (CONFLICT: template note says 10 pt)")

# --- bibliography
kay = find_line(lines[len(doc) - 1], r"KAYNAKLAR")[0]
entries = [l for l in lines[len(doc) - 1] if l["baseline"] > kay["baseline"] + 1]
check("KAYNAKLAR heading text", "7. KAYNAKLAR", kay["text"], 0, "guide 4 / template '6. KAYNAKLAR' numbering continues")
check("KAYNAKLAR -> first entry baseline gap mm (20.69+... 9.49+14.7+6+11.2 pt... )", (9.49 + 20.7 + 11.2) * 25.4 / 72, entries[0]["baseline"] - kay["baseline"], 0.3, "guide 4.3.6 (6 nk before) + heading gap")
hang = [l for l in entries if l["x0"] > 40]
check("bibliography hanging indent mm", 42.5, hang[0]["x0"], 0.3, "guide 4.3.6 (1.25 cm)")
gap = (entries[1]["baseline"] - entries[0]["baseline"]) * 72 / 25.4
check("bibliography entry pitch pt (single 13.79 + 6 before)", 19.79, gap, 0.2, "guide 4.3.6")

# --- DOCX
z = zipfile.ZipFile(D + "cog.docx")
dx = z.read("word/document.xml").decode("utf8")
st = z.read("word/styles.xml").decode("utf8")
mar = set(re.findall(r'<w:pgMar w:top="(\d+)" w:right="(\d+)" w:bottom="(\d+)" w:left="(\d+)" w:header="(\d+)" w:footer="(\d+)"', dx))
print("INFO DOCX pgMar sets (twips):", mar)
ok = ("1417", "1701", "1417", "1701", "709", "709") in mar; res.append(ok)
print("PASS" if ok else "FAIL", "DOCX body pgMar 25/30 mm, header/footer 12.5 mm")
fonts_docx = set(re.findall(r'w:ascii="([^"]+)"', dx + st))
print("PASS" if fonts_docx <= {"Times New Roman", "Cambria Math"} else "FAIL", "DOCX fonts", fonts_docx)
res.append(fonts_docx <= {"Times New Roman", "Cambria Math"})
foot = "".join(z.read(n).decode("utf8") for n in z.namelist() if n.startswith("word/footer") and n.endswith(".xml"))
szs = set(re.findall(r'<w:sz w:val="(\d+)"', foot))
print("INFO DOCX footer run sizes (half-points):", szs)
res.append("20" in szs); print("PASS" if "20" in szs else "FAIL", "DOCX footer page number 10 pt")
print(f"\n{sum(res)}/{len(res)} checks PASS")
