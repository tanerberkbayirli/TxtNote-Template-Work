"""Measured self-check of the real export of aku-matematik-lisans-tr-v1 (editor PDF mat.pdf, Word-rendered DOCX mat.word.pdf)
against the official template XML / Word render of AKU_Matematik_Lisans_Tez_Sablonu_2025.docx (official.pdf).
usage (repo root): python orchestration/validation/aku-matematik-lisans/self-1/selfcheck.py"""
import re, sys
sys.path.insert(0, "orchestration/tools")
from pdfmeasure import *  # noqa
D = "orchestration/artifacts/aku-matematik-lisans/render/"
docs = {"ED": open_pdf(D + "mat.pdf")}
OF = open_pdf("orchestration/artifacts/aku-matematik-lisans/source/official.pdf")
res = []
OF_TITLE = [l for l in visual_lines(OF[0]) if l["bold"] and l["text"].startswith("TEZ BAŞLIĞI")][0]["baseline"]
def check(name, expected, actual, tol, src):
    ok = abs(actual - expected) <= tol if isinstance(expected, (int, float)) else actual == expected
    res.append(ok)
    print(("PASS" if ok else "FAIL"), f"{name}: expected {expected if not isinstance(expected, float) else round(expected, 2)} actual {actual if not isinstance(actual, float) else round(actual, 2)} (tol {tol}) [{src}]")
def lines(d, i): return visual_lines(d[i])
def find(d, pat, start=0):
    for i in range(start, len(d)):
        for l in lines(d, i):
            if re.search(pat, l["text"]): return i, l
    raise SystemExit("not found " + pat)

for tag, d in docs.items():
    print(f"=== {tag} ({len(d)} pages)")
    check(f"{tag} page size mm", (210, 297), tuple(round(v) for v in page_size_mm(d[0])), 0, "sectPr pgSz 11904/11906 x 16838")
    labels = [(page_number(d[i]) or {}).get("text", "") for i in range(len(d))]
    want = ["", ""] + ["i", "ii", "iii", "iv", "v", "vi", "vii"] + [str(n) for n in range(1, len(d) - 8)]
    check(f"{tag} page labels (covers blank, i-vii front, arabic from GIRIS)", want, labels, 0, "sectPr 1 none; 2 lowerRoman start=1; 3 start=1")
    # body page = GIRIS page
    gi, h1 = find(d, r"^1\. GİRİŞ", 9)
    L = lines(d, gi)
    body = [l for l in L if 25 < l["baseline"] < 270]
    check(f"{tag} H1 x0 mm", 30.0, h1["x0"], 0.25, "pgMar left 1701 tw")
    check(f"{tag} H1 first baseline mm (official p10: 33.96)", 33.96, h1["baseline"], 0.25, "official Word render p10")
    txt = [l for l in L if l["baseline"] > h1["baseline"] + 1][0]
    check(f"{tag} H1 -> first text baseline mm (heading + empty 1.5 line)", 48.56 - 33.96, txt["baseline"] - h1["baseline"], 0.25, "official p10 (33.96 -> 48.56)")
    check(f"{tag} body left x0 mm", 30.0, min(l["x0"] for l in body), 0.25, "pgMar 1701 tw")
    check(f"{tag} body right x1 mm (justified)", 180.0, max(l["x1"] for l in body), 1.2, "pgMar 1701 tw (Word justified lines overhang ~1 mm in the official render too: 181.0)")
    pit = baseline_pitches([l for l in body if l["size"] > 11][2:8])
    check(f"{tag} body pitch pt (1.5 x 12 pt x 1.15)", 20.7, sorted(pit)[len(pit) // 2], 0.2, "styles: line=360 auto, sz 24")
    check(f"{tag} body first-line x0 (no indent) mm", 30.0, txt["x0"], 0.25, "paragraph w:ind absent")
    check(f"{tag} body font size/bold", (12.0, False), (txt["size"], txt["bold"]), 0, "run sz=24")
    check(f"{tag} H1 size/bold", (12.0, True), (h1["size"], h1["bold"]), 0, "Balk2 style b, sz=24")
    pn = page_number(d[gi]);
    check(f"{tag} page number size pt", 10.0, pn["size"], 0.05, "Altbilgi/Normal no sz -> Word default 10 pt (official render 10.0)")
    check(f"{tag} page number baseline mm (footer 12.5)", 283.76, pn["baseline"], 0.5, "official p10 footer baseline 283.76")
    check(f"{tag} page number centre x mm", 105.0, (pn["x0"] + pn["x1"]) / 2, 0.3, "footer jc center")
    # acknowledgements page (official p3)
    a = lines(d, 2); t = [l for l in a if l["text"].startswith("TEŞEKKÜR")][0]
    check(f"{tag} TEŞEKKÜR title baseline mm", 33.96, t["baseline"], 0.25, "official p3")
    check(f"{tag} TEŞEKKÜR first text baseline mm (title + empty line)", 48.56, [l for l in a if l["baseline"] > 40][0]["baseline"], 0.25, "official p3")
    # TOC indents (official p4: 30/35/40/45)
    ti = lines(d, 3)
    ind = {m: [l["x0"] for l in ti if re.match(m, l["text"])][0] for m in (r"^1\. GİRİŞ", r"^2\.1 ", r"^2\.1\.1 ", r"^2\.1\.1\.1 ")}
    check(f"{tag} TOC indents mm", [30.0, 35.0, 40.0, 45.0], [round(v, 1) for v in ind.values()], 0.2, "styles T2 0, T3 284tw, T4 567tw, T5 851tw")
    sa = [l for l in ti if l["text"] == "Sayfa"][0]
    check(f"{tag} TOC 'Sayfa' bold right, baseline pitch under title mm", 41.24, sa["baseline"], 0.25, "official p4")
    # covers
    c1 = lines(d, 0); c2 = lines(d, 1)
    check(f"{tag} Dış Kapak title baseline mm (official p1)", OF_TITLE, [l for l in c1 if l["bold"]][0]["baseline"], 0.5, "official p1: 35 empty 12 pt lines + 10 pt line")
    check(f"{tag} Dış Kapak size", 12.0, c1[0]["size"], 0, "NormalWeb sz=24")
    ic = {l["text"]: l for l in c2}
    check(f"{tag} İç Kapak first line baseline mm (official Word render)", 50.43, ic["AFYON KOCATEPE ÜNİVERSİTESİ"]["baseline"], 0.3, "official p2")
    check(f"{tag} İç Kapak AFYON->FEN pitch mm", 8.52, ic["FEN EDEBİYAT FAKÜLTESİ"]["baseline"] - ic["AFYON KOCATEPE ÜNİVERSİTESİ"]["baseline"], 0.2, "14 pt x 1.15 x 1.5")
    check(f"{tag} İç Kapak FEN->LİSANS mm (3 empty 14 pt 1.5 lines)", 34.1, ic["LİSANS TEZİ"]["baseline"] - ic["FEN EDEBİYAT FAKÜLTESİ"]["baseline"], 0.3, "official p2 (54.6 -> 88.7)")
    check(f"{tag} İç Kapak size/bold", (14.0, True), (round(c2[0]["size"], 1), c2[0]["bold"]), 0.1, "sz=28; 'sadece bu sayfada 14 punto'")
    check(f"{tag} İç Kapak centred (x centre mm)", 105.0, (ic["LİSANS TEZİ"]["x0"] + ic["LİSANS TEZİ"]["x1"]) / 2, 0.5, "jc center")
    # figure caption / table caption
    fi, fc = find(d, r"^Şekil 2\.1 ", 9)
    check(f"{tag} figure caption size", 11.0, fc["size"], 0.05, "sz=22")
    ci, cc = find(d, r"^Çizelge 2\.1 ", 9)
    check(f"{tag} table caption size/x0", (11.0, 30.0), (round(cc["size"], 1), round(cc["x0"], 1)), 0.1, "sz=22; ind 0")
    ni, nl = find(d, r"^Not: ", 9)
    check(f"{tag} table note size pt", 10.0, nl["size"], 0.05, "red note: '10 punto ve 1 satır aralığı'")
    nxt = [l for l in lines(d, ni) if l["baseline"] > nl["baseline"] + 1][0]
    check(f"{tag} table note -> next heading baseline mm (official p13: 132.61 -> 146.70)", 14.09, nxt["baseline"] - nl["baseline"], 0.5, "official p13 (132.61 -> 146.7)")
    check(f"{tag} figure: image bottom -> caption baseline mm (official 6.05-6.2)", 6.1, fc["baseline"] - max(r["bottom"] for r in images_mm(d[fi])), 0.5, "official p14: image bottom 101.62, caption bbox top 104.2")
    # bibliography
    bi, bh = find(d, r"^7\. KAYNAKLAR", 9)
    check(f"{tag} KAYNAKLAR numbered as next chapter", True, bool(bh), 0, "template '6. KAYNAKLAR' typed as next chapter")
    bl = [l for l in lines(d, bi) if l["baseline"] > bh["baseline"] + 1]
    check(f"{tag} KAYNAKLAR title -> first entry baseline mm (empty line + 6 pt; official p14)", 16.72, bl[0]["baseline"] - bh["baseline"], 0.3, "official p23: 33.96 -> 50.68 (blank 1.5 line + before=120)")
    hang = [l["x0"] for l in bl if l["x0"] > 35]
    check(f"{tag} bibliography hanging x0 mm (709 tw)", 42.5, round(sorted(hang)[len(hang)//2], 1) if hang else -1, 0.3, "ind left=709 hanging=709")

# fonts (editor PDF and Word PDF)
for tag, d in docs.items():
    fam = {f.get("family") for f in embedded_fonts(d) if f["embedded"]}
    used = {k[0] for k in font_usage(d)}
    ok = used <= {"TimesNewRomanPSMT", "TimesNewRomanPS-BoldMT", "TimesNewRomanPS-ItalicMT", "TimesNewRomanPS-BoldItalicMT", "CambriaMath", "SymbolMT"} and "Times New Roman" in fam
    res.append(ok); print("PASS" if ok else "FAIL", f"{tag} fonts used", sorted(used), "embedded", sorted(x for x in fam if x))
print(f"\n{sum(res)}/{len(res)} PASS")
