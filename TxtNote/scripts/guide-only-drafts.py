#!/usr/bin/env python3
"""Drafts for universities that publish a guide but no DOCX template (or whose template failed).

  python3 scripts/guide-only-drafts.py [--only id1,id2] [--include-installed]

For each university folder with a guide (kılavuz/klavuz/yönerge/guide/kurallar; PDF or DOCX)
and no template currently installed from a DOCX, an empty skeleton draft is written in which
every formatting value is UNKNOWN, then merge-guide-rules.py fills it from the guide's EXPLICIT
rules and the engine validator decides. Nothing is invented: the page size is A4 only when
the guide says so (else INFERRED and noted), the cover is the generic editable layout and is
flagged INFERRED (no official cover geometry), headings beyond what the guide states are
left out. Output: output/template-drafts/<id>.draft.json and guide-only-report.md.
"""

from __future__ import annotations

import argparse
import copy
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT.parent / "Butun-Sablonlar"
GENERATED = ROOT / "frontend" / "src" / "thesis" / "templates" / "generated"
CONFIG = json.loads((ROOT / "scripts" / "turkey-universities.json").read_text(encoding="utf-8"))["universities"]
GUIDE_RE = re.compile(r"(kılavuz|kilavuz|klavuz|yönerge|yonerge|guide|kurallar|esaslar|usul)", re.I)
EXCLUDE_RE = re.compile(r"(seminer|dönem projesi|donem projesi|proje yazım|staj|bitirme|lisans tezi|öneri|beyan|etik|form|taahhüt|submission|teslim|kontrol)", re.I)
INSTITUTE_HINTS = [("fbe", r"fen.?bil|fbe|science"), ("sbe", r"sosyal|sbe|social"), ("sagbe", r"sağlık|saglik|health"), ("ebe", r"eğitim|egitim|education"), ("lee", r"lisansüstü|lisansustu|enstit|graduate|lee")]
sys.path.insert(0, str(ROOT / "scripts"))
from importlib import import_module  # noqa: E402

converter = import_module("docx-spec-to-template")  # for STANDARD_PLACEHOLDERS
generic_cover_blocks = [
    {"type": "spacer", "heightMm": 12},
    {"type": "text", "value": "{{UNIVERSITY_NAME}}", "style": {"fontWeight": 700, "align": "center"}},
    {"type": "text", "value": "{{INSTITUTE_NAME}}", "style": {"align": "center"}},
    {"type": "spacer", "heightMm": 38},
    {"type": "metadata", "field": "THESIS_TITLE", "style": {"fontWeight": 700, "align": "center", "textTransform": "uppercase"}},
    {"type": "spacer", "heightMm": 25},
    {"type": "metadata", "field": "STUDENT_NAME", "fallback": "Ad SOYAD", "style": {"align": "center"}},
    {"type": "spacer", "heightMm": 20},
    {"type": "text", "value": "YÜKSEK LİSANS TEZİ", "style": {"fontWeight": 700, "align": "center"}},
    {"type": "spacer", "heightMm": 16},
    {"type": "text", "value": "Danışman", "style": {"align": "center"}},
    {"type": "metadata", "field": "ADVISOR_NAME", "fallback": "Unvan Ad SOYAD", "style": {"align": "center"}},
    {"type": "spacer", "heightMm": 24},
    {"type": "text", "value": "{{CITY}} – {{YEAR}}", "style": {"align": "center"}},
]


def skeleton(university: dict, institute: str, guide: Path, template_id: str) -> dict:
    sections = [
        {"id": "cover", "type": "outerCover", "title": "Kapak", "status": "required", "group": "cover", "mode": "editable", "layoutMode": "editable", "tocEntry": "none", "overrides": {"page": {"numbering": {"enabled": False}}, "body": {"firstLineIndentMm": 0, "spaceBeforePt": 0, "spaceAfterPt": 0, "lineHeight": 1}}, "blocks": copy.deepcopy(generic_cover_blocks)},
        {"id": "abstract", "type": "abstract", "title": "ÖZET", "status": "required", "group": "front", "mode": "editable", "showTitle": True, "overrides": {"page": {"numbering": {"format": "roman-lower", "startAt": 1, "restart": True}}, "headings": {"1": {"align": "center"}}}},
        {"id": "english-abstract", "type": "englishAbstract", "title": "ABSTRACT", "status": "required", "group": "front", "mode": "editable", "showTitle": True, "overrides": {"page": {"numbering": {"format": "roman-lower"}}, "headings": {"1": {"align": "center"}}}},
        {"id": "acknowledgements", "type": "acknowledgements", "title": "TEŞEKKÜR", "status": "optional", "group": "front", "mode": "editable", "showTitle": True, "overrides": {"page": {"numbering": {"format": "roman-lower"}}, "headings": {"1": {"align": "center"}}}},
        {"id": "table-of-contents", "type": "tableOfContents", "title": "İÇİNDEKİLER", "status": "required", "group": "front", "mode": "generated", "generatedIndex": {"kind": "toc", "title": "İÇİNDEKİLER", "includePageNumbers": True, "leader": "dots"}, "overrides": {"page": {"numbering": {"format": "roman-lower"}}}},
        {"id": "list-of-figures", "type": "listOfFigures", "title": "ŞEKİLLER DİZİNİ", "status": "optional", "group": "front", "mode": "generated", "generatedIndex": {"kind": "figures", "title": "ŞEKİLLER DİZİNİ", "includePageNumbers": True, "leader": "dots"}, "overrides": {"page": {"numbering": {"format": "roman-lower"}}}},
        {"id": "list-of-tables", "type": "listOfTables", "title": "TABLOLAR DİZİNİ", "status": "optional", "group": "front", "mode": "generated", "generatedIndex": {"kind": "tables", "title": "TABLOLAR DİZİNİ", "includePageNumbers": True, "leader": "dots"}, "overrides": {"page": {"numbering": {"format": "roman-lower"}}}},
        {"id": "list-of-abbreviations", "type": "listOfAbbreviations", "title": "SİMGELER VE KISALTMALAR", "status": "optional", "group": "front", "mode": "editable", "showTitle": True, "overrides": {"page": {"numbering": {"format": "roman-lower"}}, "headings": {"1": {"align": "center"}}}},
        {"id": "main-content", "type": "mainContent", "title": "Ana metin", "status": "required", "group": "body", "mode": "editable", "showTitle": False, "overrides": {"page": {"numbering": {"format": "arabic", "startAt": 1, "restart": True}}}},
        {"id": "bibliography", "type": "bibliography", "title": "KAYNAKLAR", "status": "required", "group": "back", "mode": "editable", "showTitle": True},
        {"id": "appendices", "type": "appendices", "title": "EKLER", "status": "optional", "group": "back", "mode": "editable", "showTitle": True},
        {"id": "curriculum-vitae", "type": "curriculumVitae", "title": "ÖZGEÇMİŞ", "status": "optional", "group": "back", "mode": "editable", "showTitle": True},
    ]
    template = {
        "schemaVersion": 1, "templateVersion": "0.1.0-draft", "id": template_id,
        "universityId": university["id"], "universityName": university["name"], "instituteId": institute, "instituteName": {"fbe": "Fen Bilimleri Enstitüsü", "sbe": "Sosyal Bilimler Enstitüsü", "sagbe": "Sağlık Bilimleri Enstitüsü", "ebe": "Eğitim Bilimleri Enstitüsü"}.get(institute, "Lisansüstü Eğitim Enstitüsü"),
        "degreeType": "master", "language": "tr", "status": "official",
        "source": {"type": "official", "documentName": guide.name, "verifiedAt": date.today().isoformat(), "notes": ["Yalnız kılavuz metninden üretilen taslak (resmî DOCX şablonu yok); kapak düzeni genel, kılavuzdan değil", "UNKNOWN alanlar kılavuzdan tamamlanmadan PASS sayılmaz"]},
        "page": {"size": "A4", "widthMm": 210, "heightMm": 297, "orientation": "portrait", "margins": {}, "header": {"heightMm": 0, "distanceMm": 12.5, "content": "", "firstPage": "same"}, "footer": {"heightMm": 0, "distanceMm": 12.5, "content": "", "firstPage": "same"}, "numbering": {"enabled": True, "format": "arabic", "startAt": 1, "restart": False}},
        "typography": {"body": {}, "headings": {}},
        "placeholders": converter.STANDARD_PLACEHOLDERS, "sections": sections,
        "tables": None, "figures": None,
        "bibliography": {"heading": "KAYNAKLAR", "style": {}},
        "toc": {"heading": "İÇİNDEKİLER", "levels": [1, 2, 3], "showPageNumbers": True},
    }
    unknown = [{"field": f, "reason": "Kılavuzdan okunmalı (DOCX şablonu yok)"} for f in ("page.margins.topMm", "page.margins.bottomMm", "page.margins.leftMm", "page.margins.rightMm", "typography.body.fontFamily", "typography.body.fontSizePt", "typography.body.lineHeight", "typography.body.align", "typography.paragraph.firstLineIndentMm", "typography.headings.1", "typography.headings.2", "typography.headings.3", "tables", "figures", "page.numbering.position", "page.numbering.align", "bibliography.hangingIndentMm")]
    inferred = [
        {"field": "page.size", "value": "A4 210×297", "reasoning": "Kılavuz A4 demiyorsa bile Türkiye'de lisansüstü tezlerde standart; teyit gerekli"},
        {"field": "sections.cover.blocks", "value": "genel kapak", "reasoning": "Resmî kapak düzeni yok; genel düzenlenebilir kapak kullanıldı"},
        {"field": "page.header/footer.distanceMm", "value": 12.5, "reasoning": "Word varsayılanı (1,25 cm); kılavuz belirtmiyor"},
        {"field": "sections", "value": "standart ön/arka bölümler", "reasoning": "Bölüm listesi kılavuzdan değil, yaygın düzenden; Romen ön sayfalar, 1'den başlayan gövde"},
    ]
    return {"template": template, "unknown": unknown, "inferred": inferred, "evidence": {}, "valid": False, "requiredMissing": []}


def pick_guides(folder: Path) -> list[Path]:
    return sorted((p for p in folder.iterdir() if p.suffix.lower() in {".pdf", ".docx"} and GUIDE_RE.search(p.name) and not EXCLUDE_RE.search(p.name) and not p.name.startswith("~$")), key=lambda p: (0 if re.search(r"tez.?yaz|thesis.?writ", p.name, re.I) else 1, 0 if re.search(r"lisansüstü|lisansustu|lee", p.name, re.I) else 1, -p.stat().st_size))


def finish_template(template: dict):
    """Schema housekeeping after the merge: headings need the body font, bibliography style the body."""
    body = template["typography"]["body"]
    for level, rule in list(template["typography"]["headings"].items()):
        rule.setdefault("fontFamily", body.get("fontFamily"))
        rule.setdefault("fontSizePt", body.get("fontSizePt"))
        rule.setdefault("align", "left")
        rule.setdefault("keepWithNext", True)
        if not rule.get("fontFamily") or not rule.get("fontSizePt"):
            template["typography"]["headings"].pop(level)
    template["bibliography"]["style"] = {**body, **template["bibliography"].get("style", {}), "align": "left"} if body else {}
    levels = [int(k) for k in template["typography"]["headings"]]
    template["toc"]["levels"] = levels or [1]
    for section in template["sections"]:
        if section.get("generatedIndex", {}).get("kind") == "toc":
            section["generatedIndex"]["levels"] = levels or [1]
    if "paragraph" in template["typography"] and not template["typography"]["paragraph"]:
        template["typography"].pop("paragraph")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only")
    parser.add_argument("--include-installed", action="store_true")
    args = parser.parse_args()
    # Universities with a valid measured DOCX draft (batch-report.json) keep that; the guide alone is for the rest.
    report = ROOT / "output" / "template-drafts" / "batch-report.json"
    installed = {r["id"] for r in json.loads(report.read_text(encoding="utf-8")) if r.get("statusAfterGuide") == "ok"} if report.exists() else set()
    installed |= {re.match(r"^([a-z0-9]+)-", f.stem).group(1) for f in GENERATED.glob("*.js") if f.name != "index.js" and not f.stem.endswith("-kilavuz") and re.match(r"^([a-z0-9]+)-", f.stem)}
    wanted = set(args.only.split(",")) if args.only else None
    rows = []
    for university in CONFIG:
        if wanted and university["id"] not in wanted:
            continue
        if university["id"] in installed and not args.include_installed:
            continue
        folder = next((p for p in ARCHIVE.glob(f"*/{university['name']}") if p.is_dir()), None)
        if not folder:
            continue
        guides = pick_guides(folder)
        if not guides:
            continue
        guide = guides[0]
        institute = next((v for v, pattern in INSTITUTE_HINTS if re.search(pattern, guide.name, re.I)), "lee")
        template_id = f"{university['id']}-{institute}-master-tr-kilavuz"
        rules_path = ROOT / "output" / "guide-rules" / f"{guide.stem}.rules.json"
        extract = subprocess.run([sys.executable, str(ROOT / "scripts" / "extract-guide-rules.py"), str(guide), "--out", str(rules_path)], capture_output=True, text=True, timeout=300)
        row = {"university": university["name"], "id": university["id"], "guide": guide.name, "templateId": template_id}
        if extract.returncode:
            row.update({"status": "extract-error", "error": (extract.stderr or "").strip().splitlines()[-1][:160] if extract.stderr else "?"})
            rows.append(row); print(f"{row['status']:14} {university['name'][:30]:30} {guide.name[:50]}", flush=True); continue
        draft = skeleton(university, institute, guide, template_id)
        draft_path = ROOT / "output" / "template-drafts" / f"{template_id}.draft.json"
        draft_path.write_text(json.dumps(draft, ensure_ascii=False, indent=1), encoding="utf-8")
        merge = subprocess.run([sys.executable, str(ROOT / "scripts" / "merge-guide-rules.py"), str(draft_path), str(rules_path), "--defaults-when-silent"], capture_output=True, text=True, timeout=120)
        draft = json.loads(draft_path.read_text(encoding="utf-8"))
        finish_template(draft["template"])
        draft_path.write_text(json.dumps(draft, ensure_ascii=False, indent=1), encoding="utf-8")
        validation = subprocess.run(["node", str(ROOT / "scripts" / "validate-template-draft.mjs"), str(draft_path)], capture_output=True, text=True, timeout=120)
        rules = json.loads(rules_path.read_text(encoding="utf-8"))["rules"]
        row.update({"status": "ok" if validation.returncode == 0 else "incomplete", "rules": len(rules), "applied": len(draft.get("guideMerge", {}).get("applied", [])), "unknown": [u["field"] for u in draft.get("unknown", [])], "schemaErrors": [line.strip()[2:] for line in validation.stdout.splitlines() if line.strip().startswith("✗")][:4]})
        rows.append(row)
        print(f"{row['status']:14} {university['name'][:30]:30} {guide.name[:45]:45} kural={row['rules']} dolduruldu={row['applied']} eksik={len(row['unknown'])}", flush=True)
    out = ROOT / "output" / "template-drafts"
    (out / "guide-only-report.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    ok = [r for r in rows if r["status"] == "ok"]
    lines = ["# Yalnız kılavuzdan üretilen taslaklar", "", f"{len(rows)} üniversite denendi · {len(ok)} taslak motor doğrulamasından geçti", "", "| Üniversite | Kılavuz | Durum | Kural | Doldurulan | Eksik alanlar | Şema hatası |", "|---|---|---|---:|---:|---|---|"]
    for r in rows:
        lines.append(f"| {r['university']} | {r['guide'][:45]} | {r['status']} | {r.get('rules', '—')} | {r.get('applied', '—')} | {', '.join(r.get('unknown', []))[:100]} | {'; '.join(r.get('schemaErrors', []))[:80]}{r.get('error', '')} |")
    (out / "guide-only-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n{len(ok)}/{len(rows)} geçerli → {out / 'guide-only-report.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
