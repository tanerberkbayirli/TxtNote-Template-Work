#!/usr/bin/env python3
"""Copy scanned thesis sources into Butun-Sablonlar/<Bölge>/<Üniversite>/.

Reads the JSON report of scan-ege-thesis-templates.py (run with --download-files
--download-guides) and the university config. Files are copied unchanged; a file
whose SHA-256 already exists in the university folder is not copied again.
Hand-written kaynaklar.md files are never overwritten: the scan inventory then
goes to kaynaklar-tarama.md. The raw files are git-ignored; turkiye-kaynak-manifest.json
(URL + SHA-256 per file) is the committed record they can be re-downloaded from. Degree, language and revision of each file are not
classified here; they must be confirmed from the document itself.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import urllib.parse
import json
import shutil
from collections import defaultdict
from datetime import date
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_REPORT = SCRIPT_DIR.parent / "output" / "turkey-thesis-scan.json"
DEFAULT_CONFIG = SCRIPT_DIR / "turkey-universities.json"
DEFAULT_TARGET = REPO_ROOT / "Butun-Sablonlar"
SCAN_MARKER = "<!-- organize-scan-sources -->"


def load_scanner():
    spec = importlib.util.spec_from_file_location("thesis_scanner", SCRIPT_DIR / "scan-ege-thesis-templates.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


SCANNER = load_scanner()


def still_relevant(item: dict) -> bool:
    """Re-apply the scanner's current exclusions to a report made by an older run."""
    context = " ".join((item.get("link_text") or "", urllib.parse.unquote(item["document_url"])))
    return not SCANNER.is_match(context, SCANNER.EXCLUDED_TERMS)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def md_link(text: str, url: str) -> str:
    return f"[{text.replace('[', '(').replace(']', ')')}]({url.replace(' ', '%20').replace(')', '%29')})"


def main() -> int:
    parser = argparse.ArgumentParser(description="Tarama raporundaki dosyaları bölge/üniversite klasörlerine yerleştir.")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--target", type=Path, default=DEFAULT_TARGET)
    args = parser.parse_args()

    report = json.loads(args.report.read_text(encoding="utf-8"))
    universities = {u["id"]: u for u in json.loads(args.config.read_text(encoding="utf-8"))["universities"]}
    items_by_university: dict[str, list[dict]] = defaultdict(list)
    excluded = 0
    for item in report["template_candidates"] + report["guides"]:
        if still_relevant(item):
            items_by_university[item["university_id"]].append(item)
        else:
            excluded += 1

    summary = []
    for result in report["results_by_university"]:
        university = universities[result["university_id"]]
        folder = args.target / university["region"] / university["name"]
        items = items_by_university.get(university["id"], [])
        copied = 0
        if items:
            folder.mkdir(parents=True, exist_ok=True)
            existing = {sha256(path): path.name for path in folder.iterdir() if path.is_file() and not path.name.endswith(".md")}
            for item in items:
                source = Path(item.get("local_path") or "")
                if item.get("download_status") != "indirildi" or not source.is_file():
                    continue
                digest = item.get("sha256") or sha256(source)
                if digest in existing:
                    item["archive_name"] = existing[digest]
                    continue
                target = folder / source.name
                if target.exists():
                    target = folder / f"{source.stem}-{digest[:8]}{source.suffix}"
                shutil.copy2(source, target)
                existing[digest] = target.name
                item["archive_name"] = target.name
                copied += 1
            for item in items:
                if item.get("download_status") == "yinelenen dosya" and item.get("sha256") in existing:
                    item["archive_name"] = existing[item["sha256"]]
            write_inventory(folder, university, result, items)
        summary.append((university, result, items, copied))

    write_summary(args.target, report, summary)
    write_manifest(args.target, report, summary)
    found = sum(1 for _, _, items, _ in summary if items)
    print(f"{excluded} kayıt güncel eleme kurallarıyla çıkarıldı.")
    print(f"{found}/{len(summary)} üniversitede kaynak bulundu; {sum(c for *_, c in summary)} yeni dosya kopyalandı → {args.target}")
    return 0


def write_inventory(folder: Path, university: dict, result: dict, items: list[dict]) -> None:
    hand_written = folder / "kaynaklar.md"
    target = hand_written if not hand_written.exists() or SCAN_MARKER in hand_written.read_text(encoding="utf-8") else folder / "kaynaklar-tarama.md"
    lines = [
        SCAN_MARKER,
        f"# {university['name']} — tez kaynakları (otomatik tarama)",
        "",
        f"Alan adı: `{university['domain']}` · {university['province']} · {university['type']} · tarama durumu: {result['scan_status']} ({result['pages_fetched']}/{result['pages_scanned']} sayfa) · {date.today().isoformat()}",
        "",
        "Derece, dil, enstitü ve revizyon tarihi bu listede doğrulanmadı; şablon uygulanmadan önce belgenin kendisinden teyit edilmeli.",
        "",
    ]
    for title, classes in (("Şablonlar", {"şablon"}), ("Şablon adayları", {"şablon adayı"}), ("Yazım kılavuzları", {"kılavuz"})):
        group = [item for item in items if item["classification"] in classes]
        if not group:
            continue
        lines += [f"## {title}", ""]
        for item in sorted(group, key=lambda entry: entry["document_url"]):
            local = f"Yerel: {md_link(item['archive_name'], './' + item['archive_name'])} (SHA-256 `{item['sha256']}`)" if item.get("archive_name") else f"İndirilemedi: {item.get('download_error') or item.get('download_status') or 'indirilmedi'}"
            label = item["link_text"] or Path(item["document_url"]).name
            lines.append(f"- **{label}** — {item['file_type'].upper()}. Kaynak sayfa: {md_link(item['source_page_title'] or item['source_page'], item['source_page'])} · {md_link('dosya', item['document_url'])}. {local}.")
        lines.append("")
    target.write_text("\n".join(lines), encoding="utf-8")


def write_manifest(target_root: Path, report: dict, summary: list) -> None:
    files = []
    for university, _, items, _ in summary:
        for item in items:
            if not item.get("archive_name"):
                continue
            files.append({
                "university_id": university["id"],
                "path": f"{university['region']}/{university['name']}/{item['archive_name']}",
                "classification": item["classification"],
                "sha256": item["sha256"],
                "size_bytes": item.get("file_size_bytes"),
                "document_url": item["document_url"],
                "final_url": item.get("final_url") or item["document_url"],
                "source_page": item["source_page"],
                "link_text": item["link_text"],
            })
    files.sort(key=lambda entry: (entry["path"], entry["document_url"]))
    manifest = {"generated_at": report["generated_at"], "file_count": len(files), "files": files}
    (target_root / "turkiye-kaynak-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def write_summary(target_root: Path, report: dict, summary: list) -> None:
    lines = [
        "# Türkiye üniversiteleri — tez kaynakları tarama özeti",
        "",
        f"Tarama: {report['generated_at'][:10]} · {report['university_count']} üniversite (YÖK listesi, devlet + vakıf) · "
        f"{report['explicit_template_file_count']} açık şablon, {report['possible_template_file_count']} şablon adayı, {report['guide_file_count_separate']} kılavuz bağlantısı.",
        "",
        "Otomatik tarama tamlık garantisi vermez: JavaScript menüleri, giriş isteyen sayfalar ve sayfa sınırı dosyaları gizleyebilir. Kaynağı bulunmayan üniversiteler elle aranmalıdır.",
        "",
    ]
    regions: dict[str, list] = defaultdict(list)
    for entry in summary:
        regions[entry[0]["region"]].append(entry)
    for region, entries in regions.items():
        found = sum(1 for _, _, items, _ in entries if items)
        lines += [f"## {region} ({found}/{len(entries)} üniversitede kaynak bulundu)", "", "| Üniversite | Şablon | Aday | Kılavuz | Yerel dosya | Tarama |", "|---|---:|---:|---:|---:|---|"]
        for university, result, items, _ in entries:
            count = lambda kind: sum(item["classification"] == kind for item in items)
            local = len({item["archive_name"] for item in items if item.get("archive_name")})
            name = md_link(university["name"], f"./{region}/{university['name']}/") if items else university["name"]
            lines.append(f"| {name} | {count('şablon')} | {count('şablon adayı')} | {count('kılavuz')} | {local} | {result['scan_status']} |")
        lines.append("")
    missing = [university["name"] for university, _, items, _ in summary if not items]
    lines += [f"## Elle aranması gerekenler ({len(missing)})", "", *[f"- {name}" for name in missing], ""]
    (target_root / "turkiye-tarama-raporu.md").write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
