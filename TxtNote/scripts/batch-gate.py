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
    parser.add_argument("--reuse-exports", action="store_true", help="Var olan export.docx/pdf dosyalarını yeniden üretmeden kullan")
    args = parser.parse_args()
    if not args.skip_regenerate:
        print("taslaklar yeniden üretiliyor…", flush=True)
        run([sys.executable, str(ROOT / "scripts" / "batch-template-drafts.py")], timeout=1800)
        run([sys.executable, str(ROOT / "scripts" / "batch-guide-merge.py")], timeout=1800)
    rows = json.loads((ROOT / "output" / "template-drafts" / "batch-report.json").read_text(encoding="utf-8"))
    guide_only = ROOT / "output" / "template-drafts" / "guide-only-report.json"
    if guide_only.exists():
        # Drafts built from a guide alone (no DOCX template) join the gate with the same rules.
        rows += [{**r, "statusAfterGuide": "ok" if r.get("status") == "ok" else "incomplete", "file": r.get("guide", "")} for r in json.loads(guide_only.read_text(encoding="utf-8"))]
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
        reuse = args.reuse_exports and (out_dir / "export.pdf").exists() and (out_dir / "export.docx").exists()
        export = subprocess.CompletedProcess([], 0, "", "") if reuse else subprocess.run(["node", str(ROOT / "frontend" / "tests" / "thesis-export-gate.e2e.mjs"), template_id, str(out_dir), args.base], cwd=ROOT / "frontend", capture_output=True, text=True, timeout=600, env=env)
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
        if not wanted:
            (ROOT / "output" / "pass-gate" / "batch-gate-report.json").write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
    # Modules of this run's candidates stay only when they passed (PASS/LIMIT/CONFLICT); with --only, templates outside
    # the run are untouched. Without --only the whole generated/ set is this run's, so stale modules go too.
    keep = {r["templateId"] for r in results if r["overall"] in ("PASS", "LIMIT", "CONFLICT")}
    judged = {r["templateId"] for r in results}
    for module in GENERATED.glob("*.js"):
        if module.name != "index.js" and module.stem not in keep and (not wanted or module.stem in judged):
            module.unlink()
    kept_drafts = [d for d, r in zip(drafts, results) if r["templateId"] in keep]
    # Gate results are recorded in the installed module's header through the draft (status stays generic).
    if kept_drafts:
        run(["node", str(ROOT / "scripts" / "install-template-draft.mjs"), kept_drafts[0], "--status", "generic"], timeout=600)  # rebuilds index.js from the remaining modules
    else:
        (GENERATED / "index.js").write_text("// Generated by scripts/install-template-draft.mjs — do not edit by hand.\nexport const GENERATED_THESIS_TEMPLATES = Object.freeze([]);\n", encoding="utf-8")
    # With --only the run re-judges a few templates: their records replace the old ones in the batch report, the rest stay.
    report_json = ROOT / "output" / "pass-gate" / "batch-gate-report.json"
    if wanted and report_json.exists():
        previous = [r for r in json.loads(report_json.read_text(encoding="utf-8")) if r["templateId"] not in judged]
        results = previous + results
        results.sort(key=lambda r: (r["university"], r["file"]))
    counts = {}
    for r in results:
        counts[r["overall"]] = counts.get(r["overall"], 0) + 1
    universities = {r["university"] for r in results if r["overall"] in ("PASS", "LIMIT", "CONFLICT")}
    lines = ["# Toplu PASS kapısı raporu", "", f"{len(results)} şablon · " + " · ".join(f"{k}: {v}" for k, v in sorted(counts.items())) + f" · kurulu kalan üniversite: {len(universities)}", "",
             "LIMIT = yalnız belgelenmiş motor sınırı (PDF yazı tipi Tinos) kaldı; CONFLICT = resmî şablon ile kılavuz farklı (kurulu, kurum teyidi gerekir); FAIL = ölçülen değer kaynakla uyuşmuyor; EXPORT-FAIL = editör dışa aktaramadı.", "",
             "| Üniversite | Dosya | Sonuç | PASS/FAIL/LIMIT | Başarısız denetimler | Bilinmeyen | Çelişki | Süre |", "|---|---|---|---|---|---:|---:|---:|"]
    for r in results:
        res = r.get("results", {})
        lines.append(f"| {r['university']} | {r['file'][:40]} | **{r['overall']}** | {res.get('PASS', '—')}/{res.get('FAIL', '—')}/{res.get('LIMIT', '—')} | {'; '.join(r.get('fails', []))[:120]}{r.get('error', '')[:120]} | {r.get('unknown', '—')} | {r.get('conflicts', '—')} | {r['seconds']} s |")
    (ROOT / "output" / "pass-gate" / "batch-gate-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    report_json.write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{counts} → {ROOT / 'output' / 'pass-gate' / 'batch-gate-report.md'}; kurulu üniversite: {len(universities)}")
    print("kalan FAIL nedenleri: " + "; ".join(f"{n}× {f}" for f, n in sorted(((f, sum(1 for r in results if f in r.get("fails", []))) for f in {f for r in results for f in r.get("fails", [])}), key=lambda x: -x[1])[:8]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
