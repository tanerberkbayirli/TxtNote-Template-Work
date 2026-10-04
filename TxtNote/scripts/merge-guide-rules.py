#!/usr/bin/env python3
"""Fill a template draft's UNKNOWN fields from a guide's EXPLICIT rules; report conflicts.

  python3 scripts/merge-guide-rules.py <draft.json> <rules.json> [--out merged.json]

Precedence is evidence-based: a value the DOCX template establishes (MEASURED) is kept; a
value only the guide states (EXPLICIT) fills a gap; when both exist and differ, the draft
keeps the measured value and records a CONFLICT with both sources — never an average. A rule
the guide itself states inconsistently (status CONFLICT in rules.json) is never applied.
Each applied value is added to the draft's evidence with the guide sentence.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

CAPTION_DEFAULT_LABELS = {"figures": "Şekil", "tables": "Tablo"}
# Measurement noise, not a design difference (AGENTS.md: ≤ 0.5 mm; twips → mm gives 25.01 for 2.5 cm).
TOLERANCE = {"Mm": 0.5, "Pt": 0.5}


def same_value(measured, guide, path: str) -> bool:
    if isinstance(measured, (int, float)) and isinstance(guide, (int, float)) and not isinstance(measured, bool):
        for suffix, tolerance in TOLERANCE.items():
            if path.endswith(suffix):
                return abs(measured - guide) <= tolerance
        return abs(measured - guide) <= 0.011  # line heights etc.
    return measured == guide


def main() -> int:
    parser = argparse.ArgumentParser(description="Kılavuz kurallarını taslağa işle.")
    parser.add_argument("draft", type=Path)
    parser.add_argument("rules", type=Path)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    draft = json.loads(args.draft.read_text(encoding="utf-8"))
    rules_file = json.loads(args.rules.read_text(encoding="utf-8"))
    rules = rules_file["rules"]
    template = draft["template"]
    guide_name = rules_file["file"]["name"]
    applied, conflicts, skipped = [], draft.setdefault("conflicts", []), []
    unknown_fields = {u["field"] for u in draft.get("unknown", [])}

    def explicit(key):
        rule = rules.get(key)
        if not rule:
            return None
        if rule["status"] != "EXPLICIT":
            skipped.append({"key": key, "reason": "kılavuz kendi içinde çelişiyor", "values": rule.get("values")})
            return None
        return rule

    def evidence_of(rule):
        e = rule["evidence"][0]
        return f"{guide_name} › {e['location']}: “{e['sentence'][:160]}”"

    def apply(path: str, key: str, container: dict, field: str, transform=lambda v: v):
        """Fill container[field] from rule `key` when unknown; conflict when measured differs."""
        rule = explicit(key)
        if rule is None:
            return
        value = transform(rule["value"])
        current = container.get(field)
        if current is None:
            container[field] = value
            applied.append({"field": path, "value": value, "source": evidence_of(rule)})
            draft.setdefault("evidence", {})[path] = {"value": value, "source": evidence_of(rule), "status": "EXPLICIT"}
            draft["unknown"] = [u for u in draft.get("unknown", []) if u["field"] != path]
        elif not same_value(current, value, path):
            conflicts.append({"field": path, "measured": current, "measuredSource": draft.get("evidence", {}).get(path, {}).get("source", "DOCX"), "guide": value, "guideSource": evidence_of(rule)})

    page = template.setdefault("page", {})
    margins = page.setdefault("margins", {})
    for side in ("top", "bottom", "left", "right"):
        apply(f"page.margins.{side}Mm", f"page.margins.{side}", margins, f"{side}Mm")
    typography = template.setdefault("typography", {})
    body = typography.setdefault("body", {})
    apply("typography.body.fontFamily", "body.fontFamily", body, "fontFamily")
    apply("typography.body.fontSizePt", "body.fontSizePt", body, "fontSizePt")
    apply("typography.body.lineHeight", "body.lineHeight", body, "lineHeight")
    apply("typography.body.align", "body.align", body, "align")
    paragraph = typography.setdefault("paragraph", {})
    apply("typography.paragraph.firstLineIndentMm", "body.firstLineIndentMm", paragraph, "firstLineIndentMm")
    apply("typography.paragraph.spaceBeforePt", "body.spaceBeforePt", paragraph, "spaceBeforePt")
    apply("typography.paragraph.spaceAfterPt", "body.spaceAfterPt", paragraph, "spaceAfterPt")
    if not paragraph:
        typography.pop("paragraph")
    # Headings: size / weight / case per level from the guide when the template did not establish them.
    headings = typography.setdefault("headings", {})
    for level in ("1", "2", "3", "4"):
        rule_size = explicit(f"headings.{level}.fontSizePt")
        if level not in headings and (rule_size or explicit("heading.fontSizePt")) and body.get("fontFamily"):
            size_rule = rule_size or explicit("heading.fontSizePt")
            headings[level] = {"fontFamily": body["fontFamily"], "fontSizePt": size_rule["value"], "fontWeight": 700 if explicit(f"headings.{level}.fontWeight") or explicit("heading.fontWeight") else 400, "align": "left", "keepWithNext": True}
            applied.append({"field": f"typography.headings.{level}", "value": headings[level], "source": evidence_of(size_rule)})
            draft["unknown"] = [u for u in draft.get("unknown", []) if u["field"] != f"typography.headings.{level}"]
        if level in headings:
            apply(f"typography.headings.{level}.textTransform", f"headings.{level}.textTransform", headings[level], "textTransform")
            apply(f"typography.headings.{level}.fontSizePt", f"headings.{level}.fontSizePt", headings[level], "fontSizePt")
    # Captions: the whole rule may be missing (templates without example figures).
    for kind in ("figures", "tables"):
        position = explicit(f"{kind}.position")
        if template.get(kind) is None:
            size = explicit("caption.fontSizePt")
            if position and body.get("fontFamily") and (size or body.get("fontSizePt")):
                labels = rules.get(f"{kind}.labels", {}).get("value") or [CAPTION_DEFAULT_LABELS[kind]]
                style = {"fontFamily": body["fontFamily"], "fontSizePt": size["value"] if size else body["fontSizePt"], "align": "center"}
                line = explicit("caption.lineHeight")
                if line:
                    style["lineHeight"] = line["value"]
                template[kind] = {"label": labels[0], "position": position["value"], "style": style, "numbering": {"scope": "chapter", "format": "{chapter}.{n}", "sequence": "arabic"}}
                applied.append({"field": kind, "value": template[kind], "source": evidence_of(position) + (" · " + evidence_of(size) if size else " · yazı boyutu gövdeden (kılavuz belirtmiyor)")})
                draft["unknown"] = [u for u in draft.get("unknown", []) if u["field"] != kind]
                if not size:
                    draft.setdefault("inferred", []).append({"field": f"{kind}.style.fontSizePt", "value": body["fontSizePt"], "reasoning": "Kılavuz şekil/tablo yazısı puntosunu belirtmiyor; gövde puntosu kullanıldı"})
                draft.setdefault("inferred", []).append({"field": f"{kind}.numbering", "value": template[kind]["numbering"], "reasoning": "Bölüm bazlı numaralandırma varsayıldı; kılavuzdan teyit edilmeli"})
                if len(labels) > 1:
                    draft.setdefault("unknown", []).append({"field": f"{kind}.extraLabels", "reason": f"Kılavuz birden çok etiket kullanıyor: {labels}; motor tek etiket tutuyor"})
        else:
            apply(f"{kind}.position", f"{kind}.position", template[kind], "position")
            apply(f"{kind}.style.fontSizePt", "caption.fontSizePt", template[kind].setdefault("style", {}), "fontSizePt")
    numbering = page.setdefault("numbering", {})
    apply("page.numbering.position", "page.numbering.position", numbering, "position")
    apply("page.numbering.align", "page.numbering.align", numbering, "align")
    footnotes = typography.setdefault("footnotes", {})
    apply("typography.footnotes.fontSizePt", "footnote.fontSizePt", footnotes, "fontSizePt")
    apply("typography.footnotes.lineHeight", "footnote.lineHeight", footnotes, "lineHeight")
    if not footnotes:
        typography.pop("footnotes")
    bibliography = template.setdefault("bibliography", {})
    apply("bibliography.hangingIndentMm", "bibliography.hangingIndentMm", bibliography, "hangingIndentMm")
    apply("bibliography.lineHeight", "bibliography.lineHeight", bibliography.setdefault("style", {}), "lineHeight")

    # Rules the schema cannot hold yet are kept as evidence next to the unknown they answer.
    for key, field in (("pageNumber.fontSizePt", "page.footer.font"), ("pageNumber.fontFamily", "page.footer.font")):
        rule = rules.get(key)
        if rule and rule["status"] == "EXPLICIT":
            for u in draft.get("unknown", []):
                if u["field"] == field:
                    u["reason"] += f" — kılavuz: {rule['value']} {rule['unit']} ({evidence_of(rule)[:120]}); motor sayfa numarası yazısını ayrıca tutmuyor"
    template.setdefault("source", {}).setdefault("notes", []).append(f"Kılavuz kuralları birleştirildi: {guide_name} ({len(applied)} alan, {len(conflicts)} çelişki)")
    if "guideDocumentName" not in template["source"]:
        template["source"]["guideDocumentName"] = guide_name
    draft["guideMerge"] = {"guide": guide_name, "applied": applied, "skipped": skipped}
    required_missing = [u["field"] for u in draft.get("unknown", []) if u["field"] in ("page", "typography.body.fontFamily", "typography.body.fontSizePt", "page.numbering", "tables", "figures") or u["field"].startswith("typography.headings.1")]
    draft["valid"] = not required_missing
    draft["requiredMissing"] = required_missing
    out = args.out or args.draft
    out.write_text(json.dumps(draft, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{'GEÇERLİ' if draft['valid'] else 'EKSİK'} · {len(applied)} alan kılavuzdan dolduruldu · {len(conflicts)} çelişki · {len(skipped)} kılavuz içi çelişki atlandı → {out}")
    for item in applied:
        print(f"  + {item['field']} = {json.dumps(item['value'], ensure_ascii=False)[:60]}")
    for item in conflicts:
        print(f"  ! {item['field']}: ölçülen {item['measured']} ≠ kılavuz {item['guide']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
