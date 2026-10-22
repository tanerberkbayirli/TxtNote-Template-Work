#!/usr/bin/env python3
"""Second pass of the batch: fill every draft from its university's guide(s), re-validate, report.

Reads output/template-drafts/batch-report.json (batch-template-drafts.py), finds guide files
(kılavuz/klavuz/yönerge/guide/kurallar in the name, PDF or DOCX) in the same university folder,
extracts their rules once (output/guide-rules/), merges them into each draft (merge-guide-rules.py)
and runs the engine validator again. Updates batch-report.{json,md} with the second-pass columns.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT.parent / "Butun-Sablonlar"
CONFIG = {u["id"]: u for u in json.loads((ROOT / "scripts" / "turkey-universities.json").read_text(encoding="utf-8"))["universities"]}
GUIDE_RE = re.compile(r"(kılavuz|kilavuz|klavuz|yönerge|yonerge|guide|kurallar|esaslar|usul)", re.I)
INSTITUTE_HINTS = {"fbe": r"fen.?bil|fbe|science", "sbe": r"sosyal|sbe|social", "sagbe": r"sağlık|saglik|health", "ebe": r"eğitim|egitim|education", "lee": r"lisansüstü|lisansustu|enstit|graduate|lee"}


def pick_guides(folder: Path, institute: str) -> list[Path]:
    guides = [p for p in folder.iterdir() if p.suffix.lower() in {".pdf", ".docx"} and GUIDE_RE.search(p.name) and not p.name.startswith("~$")]
    hint = INSTITUTE_HINTS.get(institute)
    matching = [p for p in guides if hint and re.search(hint, p.name, re.I)]
    return matching or guides


def main() -> int:
    report_path = ROOT / "output" / "template-drafts" / "batch-report.json"
    rows = json.loads(report_path.read_text(encoding="utf-8"))
    rules_dir = ROOT / "output" / "guide-rules"
    rules_dir.mkdir(parents=True, exist_ok=True)
    extracted: dict[Path, Path | None] = {}
    for row in rows:
        university = CONFIG.get(row["id"])
        folder = next((p for p in ARCHIVE.glob(f"*/{university['name']}") if p.is_dir()), None) if university else None
        draft_path = ROOT / "output" / "template-drafts" / f"{row['templateId']}.draft.json"
        if not folder or not draft_path.exists():
            row["guide"] = None
            continue
        institute = row["templateId"].split("-")[1] if "-" in row["templateId"] else "lee"
        guides = pick_guides(folder, institute)
        row["guides"] = [g.name for g in guides]
        applied_total, conflicts_total = 0, 0
        for guide in guides[:1]:  # the best-matching guide only; a second one may belong to another institute
            if guide not in extracted:
                out = rules_dir / f"{guide.stem}.rules.json"
                result = subprocess.run([sys.executable, str(ROOT / "scripts" / "extract-guide-rules.py"), str(guide), "--out", str(out)], capture_output=True, text=True, timeout=300)
                extracted[guide] = out if result.returncode == 0 else None
                if result.returncode:
                    row.setdefault("guideErrors", []).append(f"{guide.name}: {(result.stderr or '').strip().splitlines()[-1][:120] if result.stderr else 'hata'}")
            rules = extracted[guide]
            if not rules:
                continue
            merge = subprocess.run([sys.executable, str(ROOT / "scripts" / "merge-guide-rules.py"), str(draft_path), str(rules), "--defaults-when-silent"], capture_output=True, text=True, timeout=120)
            if merge.returncode:
                row.setdefault("guideErrors", []).append(f"{guide.name}: birleştirme hatası {(merge.stderr or '').strip().splitlines()[-1][:120] if merge.stderr else ''}")
                continue
            draft = json.loads(draft_path.read_text(encoding="utf-8"))
            applied_total += len(draft.get("guideMerge", {}).get("applied", []))
            conflicts_total = len(draft.get("conflicts", []))
        validation = subprocess.run(["node", str(ROOT / "scripts" / "validate-template-draft.mjs"), str(draft_path)], capture_output=True, text=True, timeout=120)
        draft = json.loads(draft_path.read_text(encoding="utf-8"))
        row.update({
            "guideApplied": applied_total, "conflicts": conflicts_total,
            "statusAfterGuide": "ok" if validation.returncode == 0 else "schema-fail",
            "schemaErrorsAfterGuide": [line.strip()[2:] for line in validation.stdout.splitlines() if line.strip().startswith("✗")][:5],
            "unknownAfterGuide": len(draft.get("unknown", [])), "unknownFieldsAfterGuide": [u["field"] for u in draft.get("unknown", [])],
        })
        print(f"{row['statusAfterGuide']:12} {row['university'][:28]:28} {row['file'][:40]:40} kılavuz={len(guides)} +{applied_total} alan, {conflicts_total} çelişki, unk={row['unknownAfterGuide']}", flush=True)
    report_path.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    ok_before = sum(1 for r in rows if r.get("status") == "ok")
    ok_after = sum(1 for r in rows if r.get("statusAfterGuide") == "ok")
    with_guide = sum(1 for r in rows if r.get("guides"))
    lines = ["# Şablon taslağı toplu üretim raporu — kılavuz birleştirmesi sonrası", "",
             f"{len(rows)} DOCX şablon · kılavuzu bulunan {with_guide} · geçerli taslak: {ok_before} → **{ok_after}** · üniversite: {len({r['id'] for r in rows if r.get('statusAfterGuide') == 'ok'})}", "",
             "| Üniversite | Dosya | Önce | Sonra | Kılavuz | Doldurulan | Çelişki | Kalan bilinmeyen | Şema hatası |", "|---|---|---|---|---|---:|---:|---|---|"]
    for r in rows:
        lines.append(f"| {r['university']} | {r['file'][:45]} | {r.get('status')} | {r.get('statusAfterGuide', '—')} | {', '.join(r.get('guides', []))[:60]} | {r.get('guideApplied', '—')} | {r.get('conflicts', '—')} | {', '.join(r.get('unknownFieldsAfterGuide', []))[:90]} | {'; '.join(r.get('schemaErrorsAfterGuide', []))[:80]} |")
    (ROOT / "output" / "template-drafts" / "batch-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\ngeçerli taslak: {ok_before} → {ok_after} / {len(rows)}; kılavuzu bulunan: {with_guide}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
