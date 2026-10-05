#!/usr/bin/env python3
"""Install every valid draft, export it through the real editor and run the PASS gate.

  python3 scripts/batch-gate.py [--only id1,id2] [--skip-regenerate] [--base http://localhost:5173]

Steps: batch-template-drafts.py → batch-guide-merge.py (unless --skip-regenerate); install the
drafts that validate (status generic, "(taslak)"); for each, tests/thesis-export-gate.e2e.mjs
then pass-gate.py (with the university's guide rules when available). Templates whose gate
result is FAIL are uninstalled again; PASS and LIMIT stay installed as drafts. Writes
output/pass-gate/batch-gate-report.{json,md}. Vite must be serving tests/thesis-editable.html.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GENERATED = ROOT / "frontend" / "src" / "thesis" / "templates" / "generated"
PLAYWRIGHT = os.environ.get("PLAYWRIGHT_MODULE")


def run(cmd, timeout=900, cwd=ROOT):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only")
    parser.add_argument("--skip-regenerate", action="store_true")
    parser.add_argument("--base", default="http://localhost:5173")
    args = parser.parse_args()
    if not args.skip_regenerate:
        print("taslaklar yeniden üretiliyor…", flush=True)
        run([sys.executable, str(ROOT / "scripts" / "batch-template-drafts.py")], timeout=1800)
        run([sys.executable, str(ROOT / "scripts" / "batch-guide-merge.py")], timeout=1800)
    rows = json.loads((ROOT / "output" / "template-drafts" / "batch-report.json").read_text(encoding="utf-8"))
    wanted = set(args.only.split(",")) if args.only else None
    candidates = [r for r in rows if r.get("statusAfterGuide") == "ok" and (not wanted or r["templateId"] in wanted)]
    drafts = [str(ROOT / "output" / "template-drafts" / f"{r['templateId']}.draft.json") for r in candidates]
    print(f"{len(candidates)} geçerli taslak kuruluyor…", flush=True)
    install = run(["node", str(ROOT / "scripts" / "install-template-draft.mjs"), *drafts, "--status", "generic"], timeout=600)
    if install.returncode:
        print(install.stderr[-500:]); return 2
    time.sleep(4)  # Vite picks up the new modules
    results = []
    env = {**os.environ, **({"PLAYWRIGHT_MODULE": PLAYWRIGHT} if PLAYWRIGHT else {})}
    for index, row in enumerate(candidates, 1):
        template_id = row["templateId"]
        out_dir = ROOT / "output" / "pass-gate" / template_id
        started = time.time()
        export = subprocess.run(["node", str(ROOT / "frontend" / "tests" / "thesis-export-gate.e2e.mjs"), template_id, str(out_dir), args.base], cwd=ROOT / "frontend", capture_output=True, text=True, timeout=600, env=env)
        record = {"templateId": template_id, "university": row["university"], "file": row["file"], "seconds": round(time.time() - started)}
        if export.returncode:
            record.update({"overall": "EXPORT-FAIL", "error": (export.stderr or export.stdout).strip().splitlines()[-1][:200] if (export.stderr or export.stdout).strip() else "dışa aktarım başarısız"})
        else:
            draft = json.loads(Path(drafts[index - 1]).read_text(encoding="utf-8"))
            guide = draft.get("guideMerge", {}).get("guide")
            rules = ROOT / "output" / "guide-rules" / (Path(guide).stem + ".rules.json") if guide else None
            cmd = [sys.executable, str(ROOT / "scripts" / "pass-gate.py"), template_id]
            if rules and rules.exists():
                cmd += ["--guide", str(rules)]
            gate = run(cmd, timeout=300)
            report_path = out_dir / "gate-report.json"
            if report_path.exists():
                report = json.loads(report_path.read_text(encoding="utf-8"))
                record.update({"overall": report["overall"], "results": report["results"], "fails": [c["check"] for c in report["checks"] if c["result"] == "FAIL"][:6], "unknown": len(report.get("draftUnknown", [])), "conflicts": len(report.get("draftConflicts", []))})
            else:
                record.update({"overall": "GATE-ERROR", "error": (gate.stderr or gate.stdout).strip().splitlines()[-1][:200] if (gate.stderr or gate.stdout).strip() else "kapı çalışmadı"})
        results.append(record)
        print(f"[{index}/{len(candidates)}] {record['overall']:12} {row['university'][:28]:28} {row['file'][:40]:40} {record.get('fails') or record.get('error', '')}"[:160], flush=True)
        (ROOT / "output" / "pass-gate" / "batch-gate-report.json").write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
    # Uninstall templates that failed the gate; keep PASS/LIMIT as drafts.
    failed = [r["templateId"] for r in results if r["overall"] not in ("PASS", "LIMIT")]
    for template_id in failed:
        module = GENERATED / f"{template_id}.js"
        if module.exists():
            module.unlink()
    if failed:
        run(["node", str(ROOT / "scripts" / "install-template-draft.mjs"), drafts[0], "--status", "generic"], timeout=600)  # rebuilds index.js from the remaining modules
        remaining_first = [d for d, r in zip(drafts, results) if r["overall"] in ("PASS", "LIMIT")]
        if not remaining_first:
            (GENERATED / f"{results[0]['templateId']}.js").unlink(missing_ok=True)
        run(["node", str(ROOT / "scripts" / "install-template-draft.mjs"), *(remaining_first[:1] or drafts[:1]), "--status", "generic"], timeout=600)
    counts = {}
    for r in results:
        counts[r["overall"]] = counts.get(r["overall"], 0) + 1
    universities = {r["university"] for r in results if r["overall"] in ("PASS", "LIMIT")}
    lines = ["# Toplu PASS kapısı raporu", "", f"{len(results)} şablon · " + " · ".join(f"{k}: {v}" for k, v in sorted(counts.items())) + f" · kurulu kalan üniversite: {len(universities)}", "",
             "LIMIT = yalnız belgelenmiş motor sınırı (PDF yazı tipi Tinos) kaldı; FAIL = ölçülen değer kaynakla uyuşmuyor; EXPORT-FAIL = editör dışa aktaramadı.", "",
             "| Üniversite | Dosya | Sonuç | PASS/FAIL/LIMIT | Başarısız denetimler | Bilinmeyen | Çelişki | Süre |", "|---|---|---|---|---|---:|---:|---:|"]
    for r in results:
        res = r.get("results", {})
        lines.append(f"| {r['university']} | {r['file'][:40]} | **{r['overall']}** | {res.get('PASS', '—')}/{res.get('FAIL', '—')}/{res.get('LIMIT', '—')} | {'; '.join(r.get('fails', []))[:120]}{r.get('error', '')[:120]} | {r.get('unknown', '—')} | {r.get('conflicts', '—')} | {r['seconds']} s |")
    (ROOT / "output" / "pass-gate" / "batch-gate-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n{counts} → {ROOT / 'output' / 'pass-gate' / 'batch-gate-report.md'}; kurulu üniversite: {len(universities)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
