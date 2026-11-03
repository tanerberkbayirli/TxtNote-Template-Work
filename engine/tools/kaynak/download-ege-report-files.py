import csv
import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]  # engine/
REPORT = ROOT / "output" / "ege-thesis-template-scan.csv"
CONFIG = HERE / "ege-universities.json"
OUT = ROOT / "output" / "ege-thesis-report-files"
MAX_BYTES = 80 * 1024 * 1024

sys.path.insert(0, str(HERE))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import importlib.util
spec = importlib.util.spec_from_file_location("ege_scanner", HERE / "scan-ege-thesis-templates.py")
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)

config = json.loads(CONFIG.read_text(encoding="utf-8"))
universities = {u["id"]: u for u in config["universities"]}
with REPORT.open(encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))

OUT.mkdir(parents=True, exist_ok=True)
downloaded_hashes = {}
crawlers = {}
for i, row in enumerate(rows, 1):
    university_id = row["university_id"]
    university = universities.get(university_id)
    url = row["document_url"]
    existing = Path(row.get("local_path") or "")
    if existing.is_file():
        row["analysis_local_path"] = str(existing.resolve())
        row["analysis_download_status"] = "önceden indirilen dosya kullanıldı"
        print(f"[{i}/{len(rows)}] mevcut: {row['university']} | {row['link_text']}", flush=True)
        continue
    resumed = list((OUT / university_id).glob(f"{i:03d}_*")) if university_id else []
    if resumed and resumed[0].is_file():
        row["analysis_local_path"] = str(resumed[0].resolve())
        row["analysis_download_status"] = "önceki çalıştırmadan devam edildi"
        print(f"[{i}/{len(rows)}] önbellekten: {resumed[0].name}", flush=True)
        continue
    if not university or not url:
        row["analysis_download_status"] = "üniversite/URL kaydı eksik"
        print(f"[{i}/{len(rows)}] atlandı: URL/kurum eksik", flush=True)
        continue
    host = (urlsplit(url).hostname or "").lower()
    domain = university["domain"].lower()
    if not (host == domain or host.endswith("." + domain)):
        row["analysis_download_status"] = "kurumun resmî alan adı dışında bağlantı; indirilmedi"
        print(f"[{i}/{len(rows)}] atlandı: alan adı eşleşmiyor {host}", flush=True)
        continue
    crawler = crawlers.setdefault(university_id, scanner.SiteCrawler(university, max_pages=1, delay=0.6))
    try:
        escaped_url = __import__("urllib.parse", fromlist=["quote"]).quote(url, safe=":/%?#[]@!$&'()*+,;=-._~")
        data, final_url, error = crawler.fetch(escaped_url, MAX_BYTES)
    except Exception as exc:
        data, final_url, error = None, url, str(exc)[:240]
    if data is None or error:
        row["analysis_download_status"] = "başarısız"
        row["analysis_download_error"] = error or "Dosya alınamadı"
        print(f"[{i}/{len(rows)}] başarısız: {row['university']} | {error}", flush=True)
        continue
    if data.lstrip()[:96].lower().startswith((b"<!doctype html", b"<html", b"<head", b"<body")):
        row["analysis_download_status"] = "belge yerine HTML döndü"
        print(f"[{i}/{len(rows)}] başarısız: HTML cevabı", flush=True)
        continue
    digest = hashlib.sha256(data).hexdigest()
    dupe = downloaded_hashes.get((university_id, digest))
    if dupe:
        row["analysis_local_path"] = dupe
        row["analysis_download_status"] = "aynı kurumda yinelenen içerik"
        print(f"[{i}/{len(rows)}] yinelenen içerik: {row['university']}", flush=True)
        continue
    name = Path(unquote(urlsplit(final_url or url).path)).name or f"document-{i}.{row.get('file_type') or 'bin'}"
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name).strip(" .")[:120]
    target = OUT / university_id / f"{i:03d}_{name}"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    local = str(target.resolve())
    downloaded_hashes[(university_id, digest)] = local
    row["analysis_local_path"] = local
    row["analysis_download_status"] = "indirildi"
    row["analysis_file_size_bytes"] = str(len(data))
    row["analysis_sha256"] = digest
    print(f"[{i}/{len(rows)}] indirildi ({len(data)} bayt): {row['university']} | {name}", flush=True)
    fields_now = list(rows[0].keys()) if rows else []
    for key in ("analysis_local_path", "analysis_download_status", "analysis_download_error", "analysis_file_size_bytes", "analysis_sha256"):
        if key not in fields_now:
            fields_now.append(key)
    with (OUT / "download-manifest.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields_now)
        writer.writeheader()
        writer.writerows(rows)

fields = list(rows[0].keys()) if rows else []
for key in ("analysis_local_path", "analysis_download_status", "analysis_download_error", "analysis_file_size_bytes", "analysis_sha256"):
    if key not in fields:
        fields.append(key)
with (OUT / "download-manifest.csv").open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
print(f"Manifest: {OUT / 'download-manifest.csv'}", flush=True)
