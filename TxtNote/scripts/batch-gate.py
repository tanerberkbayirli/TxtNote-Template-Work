#!/usr/bin/env python3
"""Install every valid draft, export it through the real editor and run the PASS gate.

  python3 TxtNote/scripts/batch-gate.py [--only id1,id2] [--skip-regenerate] [--base http://127.0.0.1:5175]

Steps: batch-template-drafts.py → batch-guide-merge.py (unless --skip-regenerate); install the
drafts that validate (status generic, "(taslak)") with install-template-draft.mjs; for each, the
engine's real export harness engine/tools/export.mjs (the editor's own PDF and Word buttons) on a
deterministic document, then pass-gate.py (with the university's guide rules when available).
Templates whose gate result is FAIL are uninstalled again; PASS, LIMIT, CONFLICT and BLOCKED (a required
font that cannot be embedded on this machine) stay installed as drafts and carry their gate result. Writes output/pass-gate/batch-gate-report.{json,md}.
The Vite dev server must be running: engine/tools/devserver.sh start.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
INSTALL = ROOT / "scripts" / "install-template-draft.mjs"
EXPORT_TOOL = "engine/tools/export.mjs"
PLAYWRIGHT = os.environ.get("PLAYWRIGHT_MODULE")

# Deterministic gate document: headings, multi-page paragraphs, a captioned figure and table, metadata, abstracts.
PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
LOREM = "Bu paragraf, dışa aktarım kapısının satır aralığını, kenar boşluklarını ve iki yana yaslamayı ölçebilmesi için yeterince uzun tutulmuştur; cümleler sayfanın sağ kenarına kadar akar ve böylece metin bloğunun gerçek genişliği ölçülebilir. "


def gate_fixture(template_id: str) -> dict:
    paragraph = lambda n: f"<p>{LOREM * n}</p>"
    content = "".join([
        "<h1>Giriş</h1>", paragraph(4), paragraph(5), paragraph(4),
        "<h2>Amaç ve Kapsam</h2>", paragraph(5), paragraph(4),
        f'<figure class="academic-figure fmt-align-center" data-kind="figure" contenteditable="false"><img src="{PNG}" width="240" height="120" alt=""><figcaption>Ölçüm için örnek şekil yazısı</figcaption></figure>',
        paragraph(5),
        "<table><caption>Ölçüm için örnek tablo yazısı</caption><tbody><tr><th>Değişken</th><th>Değer</th></tr><tr><td>A</td><td>1</td></tr><tr><td>B</td><td>2</td></tr></tbody></table>",
        *[paragraph(5)] * 5, "<h1>Yöntem</h1>", *[paragraph(5)] * 4,
    ])
    values = {"YEAR": "2026", "STUDENT_NAME": "Ayşe Yılmaz", "ADVISOR_NAME": "Prof. Dr. Ali Veli", "CITY": "Afyonkarahisar", "DEPARTMENT_NAME": "Moleküler Biyoloji ve Genetik",
              "KEYWORDS": "ölçüm, kapı, şablon, tez", "KEYWORDS_EN": "measurement, gate, template, thesis"}
    sections = {"abstract": f"<p>{LOREM * 3}</p>", "english-abstract": f"<p>{LOREM * 3}</p>", "bibliography": "<p>Yazar, A. (2026). Örnek kaynak. Yayınevi.</p>"}
    return {"title": "Dışa Aktarım Kapısı Test Tezi", "content": content,
            "researchData": {"thesis": {"templateId": template_id, "selection": {}, "values": values, "sectionContent": sections, "enabledSections": []}}}


def export(template_id: str, out_dir: Path, base: str, env: dict) -> subprocess.CompletedProcess:
    """Real export through the editor (engine/tools/export.mjs) → out_dir/export.{pdf,docx}; export-meta.json names the export path."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for stale in ("export.pdf", "export.docx", "export-meta.json", "gate-report.json", "gate-report.md"):
        (out_dir / stale).unlink(missing_ok=True)
    fixture = out_dir / "fixture.json"
    fixture.write_text(json.dumps(gate_fixture(template_id), ensure_ascii=False), encoding="utf-8")
    result = subprocess.run(["node", str(REPO / EXPORT_TOOL), str(fixture), str(out_dir / "export"), base], cwd=REPO, capture_output=True, text=True, timeout=900, env=env)
    if result.returncode == 0:
        (out_dir / "export-meta.json").write_text(json.dumps({"templateId": template_id, "exportTool": EXPORT_TOOL, "base": base, "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S")}, ensure_ascii=False, indent=1), encoding="utf-8")
    return result


def run(cmd, timeout=900, cwd=ROOT):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only")
    parser.add_argument("--skip-regenerate", action="store_true")
    parser.add_argument("--base", default="http://127.0.0.1:5175")
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
    install = run(["node", str(INSTALL), *drafts, "--status", "generic"], timeout=600)
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
        exported = subprocess.CompletedProcess([], 0, "", "") if reuse else export(template_id, out_dir, args.base, env)
        record = {"templateId": template_id, "university": row["university"], "file": row["file"], "seconds": round(time.time() - started)}
        font = re.search(r"PDF yazı tipi [^.;]* izin verilen font ailelerinden biri değil|[^.;:]* sistemde bulunamadı", (exported.stderr or "") + (exported.stdout or "")) if exported.returncode else None
        if font:
            # The required font cannot be embedded on this machine: BLOCKED (AGENTS.md §10/§16), not a template failure; it stays installed.
            reason = f"Gerekli yazı tipi bu makinede PDF'e gömülemiyor: {font.group(0).strip()}"
            (out_dir / "gate-report.json").write_text(json.dumps({"templateId": template_id, "overall": "BLOCKED", "results": {}, "reason": reason, "checks": []}, ensure_ascii=False, indent=1), encoding="utf-8")
            (out_dir / "export-meta.json").write_text(json.dumps({"templateId": template_id, "exportTool": EXPORT_TOOL, "base": args.base, "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S")}, ensure_ascii=False, indent=1), encoding="utf-8")
            record.update({"overall": "BLOCKED", "error": reason[:200]})
        elif exported.returncode:
            record.update({"overall": "EXPORT-FAIL", "error": (exported.stderr or exported.stdout).strip().splitlines()[-1][:200] if (exported.stderr or exported.stdout).strip() else "dışa aktarım başarısız"})
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
    # This run's templates stay installed only when they passed (PASS/LIMIT/CONFLICT); templates outside the run are untouched.
    keep = {r["templateId"] for r in results if r["overall"] in ("PASS", "LIMIT", "CONFLICT", "BLOCKED")}
    judged = {r["templateId"] for r in results}
    dropped = sorted(judged - keep)
    if dropped:
        run(["node", str(INSTALL), "--remove", *dropped], timeout=600)
    # Reinstalling the kept drafts records their gate result in source.review (status stays generic) and rebuilds the index.
    kept_drafts = [d for d, r in zip(drafts, results) if r["templateId"] in keep]
    if kept_drafts:
        run(["node", str(INSTALL), *kept_drafts, "--status", "generic"], timeout=600)
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
