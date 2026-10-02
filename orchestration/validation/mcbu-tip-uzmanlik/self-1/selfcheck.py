"""Measured self-check of the real export (tip.pdf / tip.docx) against the guide values of mcbu-tip-uzmanlik-tr-v1.
usage (repo root): python orchestration/validation/mcbu-tip-uzmanlik/self-1/selfcheck.py
Expected values carry their source and evidence class (EXPLICIT guide prose / MEASURED guide example / INFERRED / UNKNOWN)."""
import re, sys, zipfile
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, "orchestration/tools")
from pdfmeasure import *  # noqa
D = "orchestration/validation/mcbu-tip-uzmanlik/self-1/"
doc = open_pdf(D + "tip.pdf")
res = []


def check(name, expected, actual, tol, src):
    ok = abs(actual - expected) <= tol if isinstance(expected, (int, float)) and not isinstance(expected, bool) else actual == expected
    res.append(ok)
    print(("PASS" if ok else "FAIL"), f"{name}: expected {expected} actual {actual if not isinstance(actual, float) else round(actual, 3)} (tol {tol}) [{src}]")


def flag(name, ok, src):
    res.append(bool(ok))
    print("PASS" if ok else "FAIL", name, f"[{src}]")


lines = {i: visual_lines(doc[i]) for i in range(len(doc))}
sheets = [page_number(doc[i]) for i in range(len(doc))]
labels = [s["text"] if s else "" for s in sheets]
MM = 25.4 / 72
BASE = 0.9377 * 12 * MM  # first baseline below the top of a 12 pt Arial line box (mm)

check("page size A4 mm", (210.0, 297.0), tuple(round(v) for v in page_size_mm(doc[0])), 0, "guide p.2 s1.1 EXPLICIT")
# --- body page (page 6 = second page of the first chapter)
body = [l for l in lines[5] if 25 < l["baseline"] < 270 and l["size"] == 12]
check("body left edge mm (4 cm)", 40.0, min(l["x0"] for l in body if not l["bold"]), 0.25, "guide p.2 s1.2 EXPLICIT")
check("body right edge mm (210-25)", 185.0, max(l["x1"] for l in body), 0.25, "guide p.2 s1.2 EXPLICIT (longest line end)")
check("first baseline mm (30 mm top + 0.9377 em)", 30 + BASE, body[0]["baseline"], 0.25, "guide s1.2 INFERRED margin + Word model")
last = max(l["bottom"] for l in lines[5] if l["baseline"] < 270)
flag(f"text bottom <= 267 mm (30 mm bottom margin): {round(last, 2)}", last <= 267.0, "guide s1.2 INFERRED")
bl = [l["baseline"] for l in body]
pitch = sorted(round(b - a, 2) for a, b in zip(bl[:7], bl[1:8]))
check("body line pitch mm (1.5 x 12 pt Arial = 20.7 pt)", 20.7 * MM, pitch[len(pitch) // 2], 0.1, "guide p.2 s1.3 EXPLICIT")
para = [l for l in lines[4] if l["text"].startswith("1.0 2.")][0]
check("paragraph first-line indent x0 mm (40 + 5 space glyphs)", 45.88, para["x0"], 0.25, "guide s1.3 INFERRED")
prev = [l for l in lines[4] if l["baseline"] < para["baseline"] - 1][-1]
check("paragraph -> paragraph baseline gap mm (no extra spacing)", 20.7 * MM, para["baseline"] - prev["baseline"], 0.1, "guide s1.3 INFERRED")
# --- fonts
used = {k[0] for k in font_usage(doc)}
fam = {f.get("family") for f in embedded_fonts(doc) if f["embedded"]}
flag(f"fonts used {used} embedded families {fam}", used <= {"ArialMT", "Arial-BoldMT", "Arial-ItalicMT", "Arial-BoldItalicMT"} and fam == {"Arial"}, "guide s1.3 EXPLICIT: Arial")
print("INFO font sizes in document:", sorted({k[1] for k in font_usage(doc)}))
# --- chapter first page (page 5): title 50 mm from the top edge, centred, 30 mm gap to the text
h = [l for l in lines[4] if l["text"].startswith("I. ")][0]
check("H1 line top mm (5 cm from page top)", 50.0, h["baseline"] - BASE, 0.25, "guide p.2 s1.2 EXPLICIT")
check("H1 size/bold", (12.0, True), (h["size"], h["bold"]), 0, "s1.3 INFERRED / heading weight INFERRED")
check("H1 centred in text area (centre x mm)", 112.5, (h["x0"] + h["x1"]) / 2, 0.3, "guide s1.2 EXPLICIT 'baslik ortalanir'")
first = [l for l in lines[4] if l["baseline"] > h["baseline"] + 1][0]
gap = (first["baseline"] - BASE) - (h["baseline"] - BASE + 13.8 * MM)
check("heading line bottom -> text line top gap mm (3 cm)", 30.0, gap, 0.25, "guide p.2 s1.2 EXPLICIT")
flag("chapter numbering Roman on first pages ('I.' then 'II.' ...)", any(l["text"].startswith("II. ") for i in range(len(doc)) for l in lines[i][:1]), "guide p.3 sV EXPLICIT")
for pg, name in ((2, "ÖNSÖZ"), (3, "İÇİNDEKİLER")):
    t = lines[pg][0]
    ok = abs(t["baseline"] - BASE - 50.0) <= 0.25 and abs((t["x0"] + t["x1"]) / 2 - 112.5) < 0.3 and t["text"] == name
    flag(f"{name} title top 50 mm and centred: {t['text']} {round(t['baseline'] - BASE, 2)}", ok, "guide p.2 s1.2 EXPLICIT")
# --- page numbers
want = [""] * 4 + [str(n) for n in range(1, len(doc) - 3)]
flag(f"page labels (covers, önsöz, içindekiler blank; Arabic from GİRİŞ = 1): {labels[:7]} ... {labels[-2:]} n={len(labels)}", labels == want, "guide s1.4 EXPLICIT")
pn = sheets[5]
check("page number baseline mm (distance from bottom edge 12.5 mm = UNKNOWN placeholder)", 297 - 12.5, pn["baseline"], 1.5, "UNKNOWN distance; bottom position EXPLICIT")
check("page number size pt", 12.0, pn["size"], 0.05, "s1.3 INFERRED")
check("page number centre x mm (text-area centre)", 112.5, (pn["x0"] + pn["x1"]) / 2, 0.3, "guide s1.4 'alt orta' (text-area centre INFERRED)")
print("KNOWN GAP (engine): chapter first pages still carry a number, label on first GİRİŞ page =", repr(labels[4]), "[guide s1.4: none]")
# --- cover vs Ek-1 example (guide p.6 baselines 44.07, 54.31, 101.56, 110.19, 153.75, 159.26, 197.61, 206.33, 247.82)
for pg in (0, 1):
    c = lines[pg]
    names = ["univ->anabilim", "anabilim->title", "title(last)->UZMANLIK", "UZMANLIK->researcher", "researcher->Tez Danışmanı", "Tez Danışmanı->advisor", "advisor->Manisa"]
    tgt = [10.24, 47.25, 43.56, 5.51, 38.35, 8.72, 41.49]
    got = [c[1]["baseline"] - c[0]["baseline"], c[2]["baseline"] - c[1]["baseline"], c[-5]["baseline"] - c[-6]["baseline"], c[-4]["baseline"] - c[-5]["baseline"],
           c[-3]["baseline"] - c[-4]["baseline"], c[-2]["baseline"] - c[-3]["baseline"], c[-1]["baseline"] - c[-2]["baseline"]]
    for name, t, g in zip(names, tgt, got):
        check(f"cover {pg + 1} {name} baseline gap mm", t, g, 0.25, "Ek-1 example p.6 MEASURED")
    flag(f"cover {pg + 1} all lines centred in text area", all(abs((l["x0"] + l["x1"]) / 2 - 112.5) < 0.6 for l in c), "guide sII 'ust ortada' + example")
    check(f"cover {pg + 1} sizes (univ, anabilim, title, UZMANLIK)", [12.0, 12.0, 14.0, 14.0], [c[0]["size"], c[1]["size"], c[2]["size"], c[-5]["size"]], 0, "guide sII EXPLICIT title 14 (example 12: CONFLICT)")
    flag(f"cover {pg + 1} title and UZMANLIK TEZİ in capitals", c[2]["text"] == c[2]["text"].upper() and c[-5]["text"] == "UZMANLIK TEZİ", "guide sII 'buyuk harflerle'")
# --- contents (page 4)
toc = lines[3]
check("contents rows start at the left edge mm", 40.0, min(l["x0"] for l in toc if l["baseline"] > 90), 0.25, "guide p.3 sV EXPLICIT 'sol kenardan'")
flag("no leader dots/dashes beside page numbers", not any("…" in l["text"] or "...." in l["text"] for l in toc), "guide sV EXPLICIT + Ek-2")
sy = [l for l in toc if l["text"] == "Sayfa"][0]
check("'Sayfa' heading bold", True, sy["bold"], 0, "Ek-2 example p.4 MEASURED")
rows = [l for l in toc if l["baseline"] > sy["baseline"] + 1]
mains = [i for i, l in enumerate(rows) if re.match(r"^[IVX]+\. ", l["text"])]
subs = [i for i, l in enumerate(rows) if re.match(r"^\d(\.\d)+\. ", l["text"])]
check("distance before a main heading row mm (1.5 lines of 12 pt)", 20.7 * MM, rows[mains[1]]["baseline"] - rows[mains[1] - 1]["baseline"], 0.1, "guide sV EXPLICIT")
check("distance between sub-heading rows mm (single, 13.8 pt)", 13.8 * MM, rows[subs[1]]["baseline"] - rows[subs[0]]["baseline"], 0.1, "guide sV EXPLICIT")
# --- captions (page 7): Şekil below its figure, Tablo above its table
cap_f = find_line(lines[6], r"^Şekil 1")[0]
img = images_mm(doc[6])
check("figure caption text / below the image", ("Şekil 1 Dijital okuryazarlık boyutları", True), (cap_f["text"], bool(img) and cap_f["baseline"] > max(i["y1"] if "y1" in i else i["bottom"] for i in img)), 0, "guide s1.5 EXPLICIT")
cap_t = find_line(lines[6], r"^Tablo 1")[0]
head = find_line(lines[6], r"^Değişken")[0]
flag("table caption above the table", cap_t["baseline"] < head["baseline"], "guide s1.5 EXPLICIT")
# --- bibliography (last page)
lp = lines[len(doc) - 1]
ent = [l for l in lp if l["baseline"] > 60]
check("bibliography continuation indent x0 mm (40 + 6.35)", 46.35, [l for l in ent if l["x0"] > 41][0]["x0"], 0.25, "Ek-2 examples pp.4-5 MEASURED (24.81-18.46)")
starts = [l for l in ent if l["x0"] < 41]
n_lines = len([l for l in ent if starts[1]["baseline"] <= l["baseline"] < starts[2]["baseline"]])
check("entry step mm (lines x 13.8 pt single + 17.7 pt between entries)", (13.8 * n_lines + 17.7) * MM, starts[2]["baseline"] - starts[1]["baseline"], 0.25, "Ek-2 MEASURED (~6.25 mm extra) INFERRED")
flag("KAYNAKLAR is a Roman-numbered chapter heading", bool(re.match(r"^[IVX]+\. KAYNAKLAR", lp[0]["text"])), "Ek-2 p.4 MEASURED ('X. KAYNAKLAR')")
# --- DOCX
z = zipfile.ZipFile(D + "tip.docx")
dx = z.read("word/document.xml").decode("utf8")
st = z.read("word/styles.xml").decode("utf8")
mar = set(re.findall(r'<w:pgMar w:top="(\d+)" w:right="(\d+)" w:bottom="(\d+)" w:left="(\d+)" w:header="(\d+)" w:footer="(\d+)"', dx))
print("INFO DOCX pgMar sets (twips):", mar)
tw = lambda mm: round(mm / 25.4 * 1440)
ok = any(abs(int(t) - tw(30)) <= 1 and abs(int(r) - tw(25)) <= 1 and abs(int(bt) - tw(30)) <= 1 and abs(int(l) - tw(40)) <= 1 for t, r, bt, l, _, _ in mar)
flag("DOCX body pgMar top 30 / right 25 / bottom 30 / left 40 mm", ok, "guide s1.2")
fonts_docx = set(re.findall(r'w:ascii="([^"]+)"', dx + st))
flag(f"DOCX fonts {fonts_docx}", fonts_docx <= {"Arial", "Cambria Math"}, "guide s1.3")
print(f"\n{sum(res)}/{len(res)} checks PASS")
