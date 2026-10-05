#!/usr/bin/env python3
"""Run the measured template pipeline over every official DOCX template in Butun-Sablonlar.

For each university folder, DOCX files whose name says template (şablon/sablon/template/taslak)
and not guide (kılavuz/kilavuz/klavuz/yönerge) are measured, converted to a draft and validated
with the engine. Nothing is installed; the result table says which drafts are complete enough
to review. Output: output/template-drafts/batch-report.{json,md}
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT.parent / "Butun-Sablonlar"
CONFIG = json.loads((ROOT / "scripts" / "turkey-universities.json").read_text(encoding="utf-8"))["universities"]
BY_NAME = {u["name"]: u for u in CONFIG}
TEMPLATE_RE = re.compile(r"(şablon|sablon|template|taslak)", re.I)
GUIDE_RE = re.compile(r"(kılavuz|kilavuz|klavuz|yönerge|yonerge|guide|kurallar|öneri|oneri|proposal|onay|approval|signature|imza|dış.?kapak|dis.?kapak|kapak.?sablon|cover.?template|form|sayfas[ıi].?(şablon|sablon)|dizini.?(şablon|sablon)|özgeçmiş|ozgecmis|simgeler|kısaltma|kisaltma)", re.I)  # guides, single-page forms and one-page examples (iç kapak sayfası şablonu, şekiller dizini şablonu) are not thesis templates
INSTITUTE_HINTS = [("fbe", r"fen.?bil|fbe|science"), ("sbe", r"sosyal|sbe|social"), ("sagbe", r"sağlık|saglik|health"), ("ebe", r"eğitim|egitim|education"), ("lee", r"lisansüstü|lisansustu|enstit|graduate|lee")]
DEGREE_HINTS = [("phd", r"doktora|phd|doctor"), ("master", r"yüksek.?lisans|yuksek.?lisans|master|yl\b")]


def guess(name: str, hints, default):
    low = name.lower()
    for value, pattern in hints:
        if re.search(pattern, low):
            return value
    return default


def main() -> int:
    out_dir = ROOT / "output" / "template-drafts"
    out_dir.mkdir(parents=True, exist_ok=True)
    rows = []
    used_ids: set[str] = set()
    for folder in sorted(p for p in ARCHIVE.glob("*/*") if p.is_dir()):
        university = BY_NAME.get(folder.name)
        if not university:
            continue
        for docx in sorted(folder.glob("*.docx")):
            if not TEMPLATE_RE.search(docx.name) or GUIDE_RE.search(docx.name) or docx.name.startswith("~$"):
                continue
            institute = guess(docx.name, INSTITUTE_HINTS, "lee")
            degree = guess(docx.name, DEGREE_HINTS, "master")
            slug = re.sub(r"[^a-z0-9]+", "-", docx.stem.lower().translate(str.maketrans("çğıöşü", "cgiosu"))).strip("-")[:40]
            template_id = f"{university['id']}-{institute}-{degree}-tr-{slug}"
            # Two files whose names only differ after the slug limit must not share one id.
            suffix = 2
            while template_id in used_ids:
                template_id = f"{university['id']}-{institute}-{degree}-tr-{slug}-{suffix}"
                suffix += 1
            used_ids.add(template_id)
            row = {"university": university["name"], "id": university["id"], "file": docx.name, "templateId": template_id}
            try:
                spec_path = ROOT / "output" / "docx-spec" / f"{docx.stem}.spec.json"
                subprocess.run([sys.executable, str(ROOT / "scripts" / "extract-docx-spec.py"), str(docx), "--out", str(spec_path)], check=True, capture_output=True, text=True, timeout=300)
                draft_path = out_dir / f"{template_id}.draft.json"
                subprocess.run([sys.executable, str(ROOT / "scripts" / "docx-spec-to-template.py"), str(spec_path), "--university-id", university["id"], "--university-name", university["name"], "--institute-id", institute, "--degree", degree, "--template-id", template_id, "--out", str(draft_path)], check=True, capture_output=True, text=True, timeout=300)
                draft = json.loads(draft_path.read_text(encoding="utf-8"))
                validation = subprocess.run(["node", str(ROOT / "scripts" / "validate-template-draft.mjs"), str(draft_path)], capture_output=True, text=True, timeout=120)
                spec = json.loads(spec_path.read_text(encoding="utf-8"))
                front = [p for p in spec.get("frontPages", []) if p.get("records")]
                body = draft["template"].get("typography", {}).get("body", {})
                row.update({
                    "status": "ok" if validation.returncode == 0 else "schema-fail",
                    "schemaErrors": [line.strip()[2:] for line in validation.stdout.splitlines() if line.strip().startswith("✗")][:5],
                    "valid": draft.get("valid"), "unknown": len(draft.get("unknown", [])), "inferred": len(draft.get("inferred", [])),
                    "frontPages": len(front), "layoutSections": sum(1 for s in draft["template"]["sections"] if s.get("layoutMode") == "editable"),
                    "body": f"{body.get('fontFamily')} {body.get('fontSizePt')} pt {body.get('lineHeight')}", "margins": draft["template"].get("page", {}).get("margins"),
                    "unknownFields": [u["field"] for u in draft.get("unknown", [])],
                })
            except subprocess.CalledProcessError as error:
                row.update({"status": "error", "error": (error.stderr or error.stdout or "").strip().splitlines()[-1][:200] if (error.stderr or error.stdout) else str(error)})
            except Exception as error:  # noqa: BLE001 — batch must continue
                row.update({"status": "error", "error": str(error)[:200]})
            rows.append(row)
            print(f"{row['status']:12} {university['name'][:30]:30} {docx.name[:50]:50} unk={row.get('unknown','-')} front={row.get('frontPages','-')}", flush=True)
    (out_dir / "batch-report.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    ok = [r for r in rows if r["status"] == "ok"]
    lines = ["# Şablon taslağı toplu üretim raporu", "", f"{len(rows)} DOCX şablon · {len(ok)} taslak motor doğrulamasından geçti · {sum(1 for r in rows if r['status']=='schema-fail')} şema hatası · {sum(1 for r in rows if r['status']=='error')} işlem hatası", "",
             "| Üniversite | Dosya | Durum | Bilinmeyen | Çıkarım | Ön sayfa | Düzen bölümü | Gövde | Kenar (mm) |", "|---|---|---|---:|---:|---:|---:|---|---|"]
    for r in rows:
        m = r.get("margins") or {}
        margins = f"{m.get('topMm')}/{m.get('bottomMm')}/{m.get('leftMm')}/{m.get('rightMm')}" if m else "—"
        lines.append(f"| {r['university']} | {r['file']} | {r['status']}{' (' + '; '.join(r['schemaErrors']) + ')' if r.get('schemaErrors') else ''}{' (' + r['error'] + ')' if r.get('error') else ''} | {r.get('unknown', '—')} | {r.get('inferred', '—')} | {r.get('frontPages', '—')} | {r.get('layoutSections', '—')} | {r.get('body', '—')} | {margins} |")
    (out_dir / "batch-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n{len(ok)}/{len(rows)} taslak geçerli → {out_dir / 'batch-report.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
