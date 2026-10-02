"""Make a minimal package-level test copy of the official AKÜ FBE DOCX.

Only word/document.xml changes. Title placeholders use the exact title from
attempt-4-proof/phd.long89.fixture.json; the approval sample gains two member
and affiliation paragraph pairs. The official source DOCX is never written.
"""
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from copy import deepcopy
from pathlib import Path

from lxml import etree


ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / "orchestration/artifacts/aku-fbe/source/word-render/official.docx"
FIXTURE = ROOT / "orchestration/validation/aku-fbe/attempt-4-proof/phd.long89.fixture.json"
OUTPUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "official-long89-seven-jurors.docx"
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}
TAG = lambda name: f"{{{W}}}{name}"


def text_of(p):
    return "".join(p.xpath("./w:r/w:t/text()", namespaces=NS))


def replace_direct_text(p, old, new):
    nodes = p.xpath("./w:r/w:t", namespaces=NS)
    joined = "".join(n.text or "" for n in nodes)
    start = joined.find(old)
    if start < 0:
        return False
    end = start + len(old)
    cursor = 0
    first_index = None
    for i, node in enumerate(nodes):
        value = node.text or ""
        a, b = cursor, cursor + len(value)
        if b > start and a < end:
            if first_index is None:
                first_index = i
                before = value[:max(0, start - a)]
                after = value[min(len(value), end - a):]
                node.text = before + new + after
                if node.text[:1].isspace() or node.text[-1:].isspace():
                    node.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
            else:
                node.text = ""
        cursor = b
    return first_index is not None


def clone_text_paragraph(p):
    clone = deepcopy(p)
    # The official member and affiliation paragraphs carry floating guidance
    # callouts in drawing runs. Keep paragraph/run formatting and text only.
    for run in list(clone.findall(TAG("r"))):
        for child in list(run):
            if child.tag in {TAG("drawing"), TAG("pict"), TAG("object")}:
                run.remove(child)
        if not run.xpath("./w:t|./w:tab|./w:br", namespaces=NS):
            clone.remove(run)
    return clone


def main():
    title = json.loads(FIXTURE.read_text(encoding="utf-8"))["title"]
    if len(title) != 89:
        raise ValueError(f"Expected existing 89-character title, got {len(title)}")

    with zipfile.ZipFile(SOURCE, "r") as source_zip:
        original_xml = source_zip.read("word/document.xml")
        root = etree.fromstring(original_xml)
        paragraphs = root.xpath(".//w:p[not(ancestor::w:txbxContent)]", namespaces=NS)

        replaced_title = 0
        removed_continuations = 0
        approval_title_replaced = 0
        for p in paragraphs:
            value = text_of(p).strip()
            if value in {"TEZ BAŞLIĞI", "TEZİN TÜRKİYE TÜRKÇESİ BAŞLIĞI"}:
                old = value
                if replace_direct_text(p, old, title):
                    replaced_title += 1
            elif value == "TEZ BAŞLIĞI (Devam)":
                p.getparent().remove(p)
                removed_continuations += 1
            elif value.startswith("Adı SOYADI tarafından hazırlanan") and "Tez Onay Sayfası" in value:
                if replace_direct_text(p, "Tez Onay Sayfası", title):
                    approval_title_replaced += 1

        # Find the approval cell by its President/member paragraph rows.
        member_paras = [p for p in root.xpath(".//w:p[not(ancestor::w:txbxContent)]", namespaces=NS)
                        if text_of(p).strip().startswith("Üye")]
        cells = {}
        for p in member_paras:
            cell = p
            while cell is not None and cell.tag != TAG("tc"):
                cell = cell.getparent()
            if cell is not None:
                cells.setdefault(id(cell), (cell, []))[1].append(p)
        candidates = [(cell, rows) for cell, rows in cells.values() if len(rows) == 4]
        if len(candidates) != 1:
            raise ValueError(f"Expected one approval cell with four member rows; found {len(candidates)}")
        cell, rows = candidates[0]
        cell_paras = list(cell.findall(TAG("p")))
        source_member = rows[-1]
        member_index = cell_paras.index(source_member)
        if member_index + 1 >= len(cell_paras):
            raise ValueError("Last member row has no following affiliation paragraph")
        source_affiliation = cell_paras[member_index + 1]
        if "Üniversite adı" not in text_of(source_affiliation):
            raise ValueError("Could not identify the member affiliation paragraph")
        anchor = source_affiliation
        for _ in range(2):
            new_member = clone_text_paragraph(source_member)
            anchor.addnext(new_member)
            new_affiliation = clone_text_paragraph(source_affiliation)
            new_member.addnext(new_affiliation)
            anchor = new_affiliation

        if (replaced_title, removed_continuations, approval_title_replaced) != (3, 3, 1):
            raise ValueError("Unexpected title field count: "
                             f"replaced={replaced_title}, removed={removed_continuations}, "
                             f"approval={approval_title_replaced}")
        modified_xml = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)

        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as output_zip:
            for item in source_zip.infolist():
                payload = modified_xml if item.filename == "word/document.xml" else source_zip.read(item.filename)
                output_zip.writestr(item, payload)

    print(json.dumps({
        "source": str(SOURCE),
        "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "output": str(OUTPUT),
        "fixture": str(FIXTURE),
        "title": title,
        "titleCharacters": len(title),
        "replacedTitleParagraphs": replaced_title,
        "removedTitleContinuationParagraphs": removed_continuations,
        "approvalSentenceTitleReplaced": approval_title_replaced,
        "originalJurors": 5,
        "addedMemberEntries": 2,
        "resultingJurors": 7,
        "modifiedPackagePart": "word/document.xml",
        "sourceModified": False,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
