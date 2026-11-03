#!/usr/bin/env python3
"""Download the hand-found sources in manual-thesis-sources.json.

Each entry is one official document found by a person (web search, institute
page) for a university the crawler could not cover. Files go to
output/manual-sources-files/<university_id>/ and a report in the scanner's
item shape goes to output/manual-sources-report.json, which
organize-scan-sources.py merges with --extra.

Only the listed documents are fetched, one request each; nothing is crawled.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_SOURCES = SCRIPT_DIR / "manual-thesis-sources.json"
DEFAULT_CONFIG = SCRIPT_DIR / "turkey-universities.json"
DEFAULT_OUTPUT = SCRIPT_DIR.parents[1] / "output" / "manual-sources-report.json"
MAX_BYTES = 40 * 1024 * 1024
USER_AGENT = "Mozilla/5.0 (Macintosh) TxtEngineThesisTemplateInventory/1.0 (single document fetch)"


def load_scanner():
    spec = importlib.util.spec_from_file_location("thesis_scanner", SCRIPT_DIR / "scan-ege-thesis-templates.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fetch(url: str, scanner) -> tuple[bytes | None, str, str, bool]:
    request = urllib.request.Request(scanner.request_url(url), headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    for context in (scanner.SSL_VERIFIED, scanner.SSL_UNVERIFIED):
        try:
            with urllib.request.urlopen(request, timeout=40, context=context) as response:
                data = response.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    return None, response.geturl(), "boyut sınırı aşıldı", False
                return data, response.geturl(), "", context is scanner.SSL_UNVERIFIED
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as error:
            text = str(error)
            if context is scanner.SSL_VERIFIED and ("SSL" in text or "ssl" in text or "CERTIFICATE" in text):
                continue
            return None, url, text[:240], False
    return None, url, "SSL bağlantısı kurulamadı", False


def main() -> int:
    parser = argparse.ArgumentParser(description="Elle bulunan tez kaynaklarını indir ve rapor üret.")
    parser.add_argument("--sources", type=Path, default=DEFAULT_SOURCES)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    scanner = load_scanner()
    universities = {u["id"]: u for u in json.loads(args.config.read_text(encoding="utf-8"))["universities"]}
    source_file = json.loads(args.sources.read_text(encoding="utf-8"))
    sources = source_file["sources"]
    download_root = args.output.parent / "manual-sources-files"
    previous = {}
    if args.output.exists():
        try:
            for item in json.loads(args.output.read_text(encoding="utf-8")).get("items", []):
                if item.get("download_status") == "indirildi" and Path(item.get("local_path", "")).is_file():
                    previous[item["document_url"]] = item
        except (OSError, json.JSONDecodeError):
            pass

    items, unknown = [], []
    for source in sources:
        university = universities.get(source["university_id"])
        if not university:
            unknown.append(source["university_id"])
            continue
        extension = scanner.file_extension(source["url"]) or ".pdf"
        item = {
            "university_id": university["id"],
            "university": university["name"],
            "province": university["province"],
            "document_url": source["url"],
            "source_page": source.get("source_page") or source["url"],
            "source_page_title": source.get("label", ""),
            "link_text": source.get("label", ""),
            "file_type": extension.lstrip("."),
            "classification": source.get("classification", "kılavuz"),
            "manual": True,
            "found": source.get("found", ""),
        }
        earlier = previous.get(source["url"])
        if earlier:
            item.update({key: earlier.get(key) for key in ("download_status", "local_path", "sha256", "file_size_bytes", "final_url", "ssl_unverified")})
            items.append(item)
            continue
        data, final_url, error, unverified = fetch(source["url"], scanner)
        if data is None or data.lstrip()[:64].lower().startswith((b"<!doctype html", b"<html", b"<head", b"<body")):
            item["download_status"] = "başarısız"
            item["download_error"] = error or "İndirme adresi belge yerine HTML sayfası döndürdü."
            items.append(item)
            print(f"  ✗ {university['name']}: {item['download_error'][:80]}")
            continue
        digest = hashlib.sha256(data).hexdigest()
        name = Path(urllib.parse.unquote(urllib.parse.urlsplit(final_url or source["url"]).path)).name
        name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name).strip(" .") or f"belge-{digest[:12]}{extension}"
        if not Path(name).suffix:
            name += extension
        target = download_root / re.sub(r"[^a-zA-Z0-9_-]", "_", university["id"]) / name[:160]
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != digest:
            target = target.with_name(f"{target.stem}-{digest[:8]}{target.suffix}")
        target.write_bytes(data)
        item.update({"download_status": "indirildi", "local_path": str(target.resolve()), "sha256": digest, "file_size_bytes": len(data), "final_url": final_url, "ssl_unverified": unverified})
        items.append(item)
        print(f"  ✓ {university['name']}: {name[:70]} ({len(data) // 1024} KB)")

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "manual": True,
        "notes": source_file.get("notes", {}),
        "items": items,
        "template_candidates": [item for item in items if item["classification"] != "kılavuz"],
        "guides": [item for item in items if item["classification"] == "kılavuz"],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    ok = sum(item.get("download_status") == "indirildi" for item in items)
    print(f"{ok}/{len(items)} belge indirildi → {args.output}")
    if unknown:
        print(f"Yapılandırmada olmayan id'ler: {sorted(set(unknown))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
