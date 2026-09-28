import re
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
from pypdf import PdfReader

p = Path("output/academic-qa")
ns = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}

with ZipFile(p / "article.docx") as z:
    xml = ET.fromstring(z.read("word/document.xml"))
    styles = ET.fromstring(z.read("word/styles.xml"))
    assert len(xml.findall(".//w:tbl", ns)) >= 1
    assert len(xml.findall(".//wp:extent", ns)) >= 1
    assert xml.findall(".//w:u", ns) and xml.findall(".//w:b", ns) and xml.findall(".//w:i", ns)
    margin = xml.find(".//w:pgMar", ns)
    assert all(int(margin.get("{" + ns["w"] + "}" + key)) in (1417, 1418) for key in ["left", "right", "top", "bottom"])
    assert len(xml.findall(".//w:numPr", ns)) >= 1
    text = "".join(xml.itertext())
    for label in ["Kaynakça", "Şekil", "Katılımcı", "ç", "ö", "ş", "ü"]:
        assert label in text or label.lower() in text.lower(), label
    style_ids = " ".join((el.get("{" + ns["w"] + "}styleId") or "") for el in styles.findall(".//w:style", ns))
    assert "Heading1" in style_ids or "heading1" in style_ids.lower()
    used_styles = " ".join(
        (el.get("{" + ns["w"] + "}val") or "") for el in xml.findall(".//w:pStyle", ns)
    )
    assert re.search(r"Heading1|heading1", used_styles, re.I), used_styles
    assert "word/footnotes.xml" in z.namelist()
    fn_xml = ET.fromstring(z.read("word/footnotes.xml"))
    assert "Dipnot" in "".join(fn_xml.itertext())
    fld = xml.findall(".//w:fldChar", ns) or xml.findall(".//w:instrText", ns)
    assert fld, "TOC or page-number field missing"
    print("PASS Word XML: table, image, styles, A4 margins, heading styles, footnotes, toc-field")

reader = PdfReader(p / "article.pdf")
assert len(reader.pages) >= 5, f"expected 5+ pages, got {len(reader.pages)}"
full = []
for i, page in enumerate(reader.pages):
    assert abs(float(page.mediabox.width) - 595.28) < 1
    assert abs(float(page.mediabox.height) - 841.89) < 1
    extracted = page.extract_text() or ""
    full.append(extracted)
    print(f"PASS PDF page {i + 1}: text {len(extracted)} chars")
joined = "\n".join(full)
for token in ["ç", "ğ", "ş", "ü", "Giriş", "Yöntem"]:
    assert token in joined or token.lower() in joined.lower(), token
fonts = set()
for page in reader.pages:
    if page.get("/Resources") and page["/Resources"].get("/Font"):
        fonts.update(page["/Resources"]["/Font"].keys())
assert fonts, "PDF must embed fonts for selectable text"
print("PASS PDF selectable text, Turkish glyphs, A4 page sizes, embedded fonts", sorted(str(f) for f in fonts)[:6])
