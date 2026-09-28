#!/usr/bin/env python3
"""Real-export proofs of the Batch B engine extensions (custom demo templates, no university).

usage: python3 tests/batchb-measure.py <scenario> [scenario ...]     (from TxtNote/frontend; needs the vite dev server:
       orchestration/tools/devserver.sh start). Each scenario builds a fixture (tests/batchb-fixture.mjs), presses the real
       editor's PDF and Word buttons (orchestration/tools/export.mjs) and asserts on the PDF (PyMuPDF) and the DOCX XML.
"""
import os, re, subprocess, sys, zipfile, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "orchestration", "tools"))
from pdfmeasure import open_pdf, visual_lines  # noqa: E402

OUT = os.environ.get("BATCHB_OUT") or tempfile.mkdtemp(prefix="batchb-")


def export(name):
    fixture, prefix = f"{OUT}/{name}.json", f"{OUT}/{name}"
    subprocess.run(["node", "tests/batchb-fixture.mjs", name, fixture], cwd=os.path.join(ROOT, "TxtNote", "frontend"), check=True)
    env = dict(os.environ, THESIS_FIXTURE_PAGE="/tests/thesis-batchb.html")
    subprocess.run(["node", "orchestration/tools/export.mjs", fixture, prefix], cwd=ROOT, env=env, check=True)
    return open_pdf(prefix + ".pdf"), zipfile.ZipFile(prefix + ".docx").read("word/document.xml").decode()


def pages(doc):
    return [[l["text"] for l in visual_lines(p)] for p in doc]


def check(ok, message):
    print(("PASS " if ok else "FAIL ") + message)
    if not ok:
        sys.exit(1)


def photo():
    doc, xml = export("photo")
    text = pages(doc)
    body = [l for page in text for l in page]
    check(any(l.startswith("Resim 1.1 Örnek") for l in body) and any(l.startswith("Resim 2.1 Alan") for l in body) and any(l.startswith("Şekil 2.1") for l in body), "each caption kind counts on its own per chapter (Resim 1.1, 1.2, 2.1 / Şekil 1.1, 2.1)")
    listing = [p for p in text if p and p[0].startswith("RESİMLER DİZİNİ")]
    check(len(listing) == 1 and sum(l.startswith("Resim ") for l in listing[0]) == 3, "RESİMLER DİZİNİ lists the three photos (one wraps) and no figure")
    check("Resim 2.1" in re.sub(r"<[^>]+>", "", xml), "DOCX carries the photo captions")


def continuation():
    doc, xml = export("continuation")
    text = pages(doc)
    table_pages = [i for i, p in enumerate(text) if any(re.match(r"^Madde \d+ ", l) for l in p) and not any(l.startswith("Tablo 1.2") for l in p)]
    first, rest = table_pages[0], table_pages[1:]
    check(len(table_pages) >= 5, f"the long table spans {len(table_pages)} pages")
    check(any(l.startswith("Tablo 1.1") and "(Devam)" not in l for l in text[first]) and not any("(Devam)" in l for l in text[first]), "the first page has the plain caption and no continuation caption")
    for i in rest:
        lines = text[i]
        check(lines[0].startswith("Tablo 1.1 (Devam) Ölçek maddelerine") and lines[1].startswith("Değişken"), f"page {i + 1} starts with the continuation caption and the repeated header")
    check(not any("(Devam)" in l for i, p in enumerate(text) if i not in rest for l in p if not l.startswith("Tablo 1.1 Ölçek")), "no other page carries a continuation caption (short tables do not split)")
    plain = re.sub(r"<[^>]+>", "", xml)
    check(plain.count("(Devam)") == len(rest) and xml.count("<w:tbl>") >= len(rest) + 1, f"DOCX: {len(rest)} continuation captions, one table fragment each")


SCENARIOS = {"photo": photo, "continuation": continuation}
if __name__ == "__main__":
    for name in sys.argv[1:] or SCENARIOS:
        print(f"== {name} (output in {OUT})")
        SCENARIOS[name]()
