#!/usr/bin/env python3
"""Find thesis template files linked from official Ege-region university sites.

This is a discovery crawler, not a completeness guarantee. It follows official
university pages and sitemaps, records downloadable thesis-template candidates,
and keeps writing guides in a separate count. Optional downloads are limited to
the template candidates and are saved by institution.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import csv
import hashlib
import html
import json
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.robotparser
import urllib.request
import xml.etree.ElementTree as ET
from collections import deque
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_CONFIG = SCRIPT_DIR / "ege-universities.json"
DEFAULT_OUTPUT = SCRIPT_DIR.parent / "output" / "ege-thesis-template-scan"
USER_AGENT = "TxtEngineThesisTemplateInventory/1.0 (public institutional template inventory)"
MAX_HTML_BYTES = 3 * 1024 * 1024
MAX_SITEMAP_BYTES = 8 * 1024 * 1024
MAX_TEMPLATE_BYTES = 25 * 1024 * 1024
REQUEST_TIMEOUT = 6
FILE_EXTENSIONS = {".doc", ".docx", ".dot", ".dotx", ".odt", ".tex", ".pdf", ".zip"}
TEMPLATE_MARKERS = ("şablon", "sablon", "template", "taslak")
POSSIBLE_TEMPLATE_TERMS = (
    "tez yazım", "tez yazim", "tez kapak", "tez format", "thesis writing",
    "thesis format", "thesis cover", "dissertation writing", "dissertation format",
)
GENERIC_DOWNLOAD_LABELS = ("word", "pdf", "doc", "docx", "indir", "download", "tıklayınız", "tiklayiniz", "buraya tıklayınız", "click here")
FORM_TERMS = ("form", "formu", "taahhüt", "taahhut", "beyan", "kontrol", "onay", "katalog", "catalog", "referans", "reference")
GUIDE_TERMS = (
    "tez yazım kılavuzu", "tez yazim kilavuzu", "tez hazırlama kılavuzu",
    "tez yazım klavuzu", "tez yazim klavuzu", "tez hazırlama klavuzu",
    "tez hazirlama klavuzu", "yazım kılavuzu", "yazim kilavuzu", "yazim klavuzu",
    "tez yazım yönergesi", "tez yazim yonergesi", "thesis writing guide",
    "tez yazım kuralları", "tez yazim kurallari", "referans sistemleri",
    "reference systems", "latex kılavuz", "latex kilavuz", "latex klavuz", "latex guide",
)
# Downloads that live next to thesis guides but are not thesis-writing sources.
EXCLUDED_TERMS = (
    "dönem projesi", "donem projesi", "term project", "staj", "internship",
    "faaliyet raporu", "stratejik plan", "akademik takvim", "takvim", "calendar",
    "el kitabı", "el kitabi", "handbook", "ders planı", "ders plani", "müfredat", "mufredat",
    "kontenjan", "tezsiz", "non-thesis", "tez önerisi", "tez onerisi", "thesis proposal",
    "bitirme projesi",
)
# Linked from a guide page, these still describe thesis layout without saying "tez".
LAYOUT_TERMS = ("yazım", "yazim", "kapak", "cover", "format", "biçim", "bicim", "şablon", "sablon", "template", "kılavuz", "kilavuz", "klavuz", "guide")
# Graduate institutes usually sit on one of these subdomains; many university
# home pages build their menus with JavaScript, so the crawler would not reach them.
INSTITUTE_SUBDOMAINS = (
    "lee", "lisansustu", "lisansustuegitim", "enstitu", "fbe", "sbe", "sabe", "saglikbe",
    "fenbilimleri", "sosyalbilimler", "saglikbilimleri", "egitimbilimleri", "ebe",
    "fen", "sosyal", "saglik", "fenbil", "sosbil", "graduate", "gradschool", "grad",
)
PAGE_TERMS = (
    "tez", "thesis", "lisansüstü", "lisansustu", "graduate", "enstitü",
    "enstitu", "kilavuz", "kılavuz", "sablon", "şablon", "tez-yazim",
    "tez_yazim",
)


def normalize_text(value: str) -> str:
    # str.lower() turns "İ" into "i" + combining dot, which breaks every match on uppercase Turkish text.
    value = html.unescape(value or "").replace("İ", "i").lower()
    value = value.translate(str.maketrans({"ı": "i", "İ": "i", "ş": "s", "ğ": "g", "ü": "u", "ö": "o", "ç": "c"}))
    return re.sub(r"\s+", " ", value).strip()


def is_match(text: str, terms: tuple[str, ...]) -> bool:
    normalized = normalize_text(text)
    return any(normalize_text(term) in normalized for term in terms)


def has_thesis_topic(text: str) -> bool:
    normalized = normalize_text(urllib.parse.unquote(text))
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    if re.search(r"(?<![a-z0-9])tezsiz(?![a-z0-9])", normalized) or "non thesis" in normalized or "nonthesis" in normalized:
        return False
    if is_match(normalized, ("tezyazim", "tezzablon")):
        return True
    return re.search(r"(?<![a-z0-9])(?:tez|thesis|dissertation)(?![a-z0-9])", normalized) is not None


def is_generic_download_label(text: str) -> bool:
    normalized = normalize_text(text)
    return not normalized or any(normalize_text(term) in normalized for term in GENERIC_DOWNLOAD_LABELS)


def canonical_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme not in {"http", "https"}:
        return ""
    clean_query = urllib.parse.urlencode([
        (key, value) for key, value in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
        if not key.lower().startswith(("utm_", "fbclid", "gclid"))
    ])
    return urllib.parse.urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path or "/", clean_query, ""))


def request_url(url: str) -> str:
    """Percent-encode non-ASCII path/query characters so urllib can send the request."""
    parsed = urllib.parse.urlsplit(url)
    netloc = parsed.netloc.encode("idna").decode("ascii") if not parsed.netloc.isascii() else parsed.netloc
    path = urllib.parse.quote(parsed.path, safe="/%:@!$&'()*+,;=-._~")
    query = urllib.parse.quote(parsed.query, safe="=&%:@!$'()*+,;/?-._~")
    return urllib.parse.urlunsplit((parsed.scheme, netloc, path, query, ""))


def hostname(url: str) -> str:
    return (urllib.parse.urlsplit(url).hostname or "").lower().rstrip(".")


def in_domain(url: str, domain: str) -> bool:
    host = hostname(url)
    return host == domain or host.endswith("." + domain)


def file_extension(url: str) -> str:
    path = urllib.parse.urlsplit(url).path.lower()
    return Path(path).suffix


class PageParser(HTMLParser):
    def __init__(self, page_url: str):
        super().__init__(convert_charrefs=True)
        self.page_url = page_url
        self.links: list[tuple[str, str]] = []
        self.title_parts: list[str] = []
        self._title_depth = 0
        self._anchor: dict[str, str] | None = None
        self._anchor_parts: list[str] = []
        self.base_url = page_url

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag.lower() == "base" and values.get("href"):
            self.base_url = urllib.parse.urljoin(self.page_url, values["href"] or "")
        elif tag.lower() == "title":
            self._title_depth += 1
        elif tag.lower() == "a" and values.get("href"):
            self._anchor = values
            self._anchor_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title" and self._title_depth:
            self._title_depth -= 1
        elif tag.lower() == "a" and self._anchor is not None:
            label = " ".join(self._anchor_parts)
            extra = " ".join(self._anchor.get(key, "") or "" for key in ("title", "aria-label", "download"))
            text = re.sub(r"\s+", " ", f"{label} {extra}").strip()
            self.links.append((self._anchor.get("href", "") or "", text))
            self._anchor = None
            self._anchor_parts = []

    def handle_data(self, data: str) -> None:
        if self._title_depth:
            self.title_parts.append(data)
        if self._anchor is not None:
            self._anchor_parts.append(data)


class SiteCrawler:
    def __init__(self, university: dict, max_pages: int, delay: float):
        self.university = university
        self.domain = university["domain"].lower()
        self.max_pages = max_pages
        self.delay = delay
        self.robot_parsers: dict[str, urllib.robotparser.RobotFileParser] = {}
        self.robots_checked: set[str] = set()
        self.sitemaps_by_origin: dict[str, list[str]] = {}
        self.last_request = 0.0
        self.errors: list[dict[str, str]] = []
        self.pages_visited: set[str] = set()
        self.pages_fetched: set[str] = set()
        self.candidates: dict[str, dict[str, str]] = {}
        self.guides: dict[str, dict[str, str]] = {}
        # Crawl order: best URL/link-text relevance first, so the page budget is
        # not spent on news and menus before the thesis pages are reached.
        self.priority: dict[str, int] = {}

    def fetch_raw(self, url: str, limit: int) -> tuple[bytes | None, str, str]:
        url = canonical_url(url)
        if not url:
            return None, "", "geçersiz bağlantı"
        elapsed = time.monotonic() - self.last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        request = urllib.request.Request(request_url(url), headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xml,text/xml,*/*;q=0.5"})
        self.last_request = time.monotonic()
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                final_url = canonical_url(response.geturl())
                data = response.read(limit + 1)
                if len(data) > limit:
                    return data[:limit], final_url, "boyut sınırı nedeniyle kısaltıldı"
                return data, final_url, ""
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as error:
            return None, url, str(error)[:240]

    def load_robots(self, page_url: str) -> list[str]:
        parsed = urllib.parse.urlsplit(page_url)
        origin = f"{parsed.scheme}://{parsed.netloc}".lower()
        if origin in self.robots_checked:
            return self.sitemaps_by_origin.get(origin, [])
        self.robots_checked.add(origin)
        robots_url = f"{origin}/robots.txt"
        data, final_url, error = self.fetch_raw(robots_url, 512 * 1024)
        sitemap_urls: list[str] = []
        if data:
            parser = urllib.robotparser.RobotFileParser()
            parser.set_url(final_url or robots_url)
            try:
                parser.parse(data.decode("utf-8", errors="replace").splitlines())
                self.robot_parsers[origin] = parser
                for line in data.decode("utf-8", errors="replace").splitlines():
                    match = re.match(r"\s*sitemap\s*:\s*(\S+)", line, re.I)
                    if match:
                        sitemap_urls.append(match.group(1))
            except Exception as parse_error:
                self.errors.append({"url": robots_url, "error": f"robots.txt okunamadı: {parse_error}"})
        elif error and ("403" in error or "401" in error):
            parser = urllib.robotparser.RobotFileParser()
            parser.set_url(robots_url)
            parser.parse(["User-agent: *", "Disallow: /"])
            self.robot_parsers[origin] = parser
        elif error and "404" not in error and "Not Found" not in error:
            self.errors.append({"url": robots_url, "error": f"robots.txt: {error}"})
        root_hosts = {self.domain, f"www.{self.domain}"}
        if not sitemap_urls and hostname(page_url) in root_hosts:
            sitemap_urls.append(f"{origin}/sitemap.xml")
        self.sitemaps_by_origin[origin] = sitemap_urls
        return sitemap_urls

    def fetch(self, url: str, limit: int = MAX_HTML_BYTES) -> tuple[bytes | None, str, str]:
        url = canonical_url(url)
        if not url:
            return None, "", "geçersiz bağlantı"
        parsed = urllib.parse.urlsplit(url)
        origin = f"{parsed.scheme}://{parsed.netloc}".lower()
        self.load_robots(url)
        robot_parser = self.robot_parsers.get(origin)
        if robot_parser and not robot_parser.can_fetch(USER_AGENT, url):
            return None, url, "robots.txt erişime izin vermiyor"
        return self.fetch_raw(url, limit)

    def read_sitemap(self, initial_urls: list[str]) -> list[str]:
        sitemap_queue = deque(initial_urls)
        seen_sitemaps: set[str] = set()
        page_urls: set[str] = set()
        sitemap_limit = 5
        while sitemap_queue and len(seen_sitemaps) < sitemap_limit:
            sitemap_url = canonical_url(sitemap_queue.popleft())
            if not sitemap_url or sitemap_url in seen_sitemaps or not in_domain(sitemap_url, self.domain):
                continue
            seen_sitemaps.add(sitemap_url)
            data, final_url, error = self.fetch(sitemap_url, MAX_SITEMAP_BYTES)
            if not data:
                continue
            try:
                root = ET.fromstring(data)
            except ET.ParseError:
                continue
            root_name = root.tag.rsplit("}", 1)[-1].lower()
            for node in root.iter():
                if node.tag.rsplit("}", 1)[-1].lower() != "loc" or not node.text:
                    continue
                loc = canonical_url(urllib.parse.urljoin(final_url or sitemap_url, node.text.strip()))
                if not loc:
                    continue
                if root_name == "sitemapindex":
                    if in_domain(loc, self.domain):
                        sitemap_queue.append(loc)
                elif in_domain(loc, self.domain):
                    if file_extension(loc) in {".xml", ".gz"} and "sitemap" in loc.lower():
                        sitemap_queue.append(loc)
                    elif self.relevance(loc) >= 5:
                        page_urls.add(loc)
        return sorted(page_urls, key=lambda url: (-self.relevance(url), url))

    @staticmethod
    def relevance(url: str) -> int:
        value = normalize_text(urllib.parse.unquote(url))
        score = 0
        if "tez" in value or "thesis" in value:
            score += 8
        if "sablon" in value or "template" in value:
            score += 10
        if "kilavuz" in value or "yonerge" in value or "guide" in value:
            score += 5
        if "lisansustu" in value or "graduate" in value or "enstitu" in value:
            score += 3
        return score

    def record_link(self, file_url: str, label: str, source_page: str, page_title: str) -> None:
        extension = file_extension(file_url)
        if extension not in FILE_EXTENSIONS:
            return
        decoded_url = urllib.parse.unquote(file_url)
        link_context = " ".join((label, decoded_url))
        template_match = has_thesis_topic(link_context) and is_match(link_context, TEMPLATE_MARKERS)
        if is_match(link_context, EXCLUDED_TERMS):
            return
        guide_page = is_match(page_title, GUIDE_TERMS)
        guide_page_link = guide_page and (has_thesis_topic(link_context) or is_match(link_context, LAYOUT_TERMS) or is_generic_download_label(label))
        guide_match = is_match(link_context, GUIDE_TERMS) or (guide_page_link and not template_match)
        page_template = has_thesis_topic(page_title) and is_match(page_title, TEMPLATE_MARKERS)
        has_form_context = is_match(link_context, FORM_TERMS)
        possible_match = not guide_match and (
            (has_thesis_topic(link_context) and not has_form_context and is_match(link_context, POSSIBLE_TEMPLATE_TERMS))
            or (page_template and is_generic_download_label(label))
        )
        if not template_match and not guide_match and not possible_match:
            return
        record = {
            "university_id": self.university["id"],
            "university": self.university["name"],
            "province": self.university["province"],
            "document_url": file_url,
            "source_page": source_page,
            "source_page_title": page_title,
            "link_text": label,
            "file_type": extension.lstrip("."),
            "classification": "kılavuz" if guide_match and not template_match else ("şablon" if template_match else "şablon adayı"),
        }
        target = self.guides if record["classification"] == "kılavuz" else self.candidates
        target.setdefault(file_url, record)

    def parse_page(self, page_url: str, queue: deque[str]) -> None:
        page_url = canonical_url(page_url)
        if not page_url or page_url in self.pages_visited or not in_domain(page_url, self.domain):
            return
        self.pages_visited.add(page_url)
        data, final_url, error = self.fetch(page_url)
        if not data:
            self.errors.append({"url": page_url, "error": error})
            return
        self.pages_fetched.add(page_url)
        # Treat XML/feed pages as sitemap material, not HTML pages.
        if data.lstrip().startswith(b"<?xml") or b"<urlset" in data[:500].lower() or b"<sitemapindex" in data[:500].lower():
            return
        if not final_url or not in_domain(final_url, self.domain):
            return
        parser = PageParser(final_url)
        try:
            parser.feed(data.decode("utf-8", errors="replace"))
        except Exception as parse_error:
            self.errors.append({"url": final_url, "error": f"HTML çözümlenemedi: {parse_error}"})
            return
        page_title = re.sub(r"\s+", " ", " ".join(parser.title_parts)).strip()
        page_relevant = is_match(" ".join((final_url, page_title)), PAGE_TERMS)
        for href, label in parser.links:
            linked_url = canonical_url(urllib.parse.urljoin(parser.base_url, href))
            if not linked_url:
                continue
            self.record_link(linked_url, label, final_url, page_title)
            if in_domain(linked_url, self.domain) and not file_extension(linked_url):
                link_relevant = is_match(" ".join((linked_url, label)), PAGE_TERMS)
                if link_relevant or (page_relevant and self.relevance(linked_url) >= 3):
                    score = self.relevance(f"{linked_url} {label}")
                    if score > self.priority.get(linked_url, -1):
                        self.priority[linked_url] = score
                    queue.append(linked_url)

    def institute_seeds(self) -> list[str]:
        seeds = []
        for label in INSTITUTE_SUBDOMAINS:
            host = f"{label}.{self.domain}"
            try:
                socket.getaddrinfo(host, 443)
            except (socket.gaierror, UnicodeError, OSError):
                continue
            seeds.append(f"https://{host}/")
        return seeds

    def scan(self) -> dict:
        page_seeds = [self.university["start_url"], *self.university.get("seed_urls", []), *self.institute_seeds()]
        sitemap_urls = []
        for page_url in page_seeds:
            sitemap_urls.extend(self.load_robots(page_url))
        sitemap_pages = self.read_sitemap(sitemap_urls)
        queue: deque[str] = deque(page_seeds)
        queue.extend(sitemap_pages[: self.max_pages])
        for seed in page_seeds:
            self.priority[canonical_url(seed)] = 100
        while queue and len(self.pages_visited) < self.max_pages:
            best = max(range(len(queue)), key=lambda index: (self.priority.get(canonical_url(queue[index]), self.relevance(queue[index])), -index))
            url = queue[best]
            del queue[best]
            self.parse_page(url, queue)
        homepage_reachable = canonical_url(self.university["start_url"]) in self.pages_fetched
        page_limit_reached = len(self.pages_visited) >= self.max_pages and bool(queue)
        scan_status = "erişilemedi" if not self.pages_fetched else ("kısmi" if self.errors or page_limit_reached or not homepage_reachable else "tarandı")
        return {
            "university_id": self.university["id"],
            "university": self.university["name"],
            "province": self.university["province"],
            "domain": self.domain,
            "pages_scanned": len(self.pages_visited),
            "pages_fetched": len(self.pages_fetched),
            "homepage_reachable": homepage_reachable,
            "page_limit_reached": page_limit_reached,
            "scan_status": scan_status,
            "template_candidates": sorted(self.candidates.values(), key=lambda item: item["document_url"]),
            "guides": sorted(self.guides.values(), key=lambda item: item["document_url"]),
            "errors": self.errors,
        }


def write_reports(report: dict, output_base: Path) -> tuple[Path, Path]:
    output_base.parent.mkdir(parents=True, exist_ok=True)
    json_path = output_base.with_suffix(".json")
    csv_path = output_base.with_suffix(".csv")
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    status_by_id = {item["university_id"]: item for item in report["results_by_university"]}
    rows = []
    for item in report["template_candidates"] + report["guides"]:
        status = status_by_id[item["university_id"]]
        rows.append({**item, "scan_status": status["scan_status"], "pages_fetched": status["pages_fetched"], "scan_errors": len(status["errors"])})
    columns = ("university_id", "university", "province", "scan_status", "pages_fetched", "page_limit_reached", "scan_errors", "classification", "file_type", "download_status", "local_path", "file_size_bytes", "sha256", "download_error", "link_text", "document_url", "source_page", "source_page_title")
    with csv_path.open("w", newline="", encoding="utf-8-sig") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    return json_path, csv_path


def download_templates(report: dict, config: dict, output_base: Path, delay: float, include_guides: bool = False) -> Path:
    download_root = output_base.parent / f"{output_base.stem}-files"
    download_root.mkdir(parents=True, exist_ok=True)
    universities = {item["id"]: item for item in config["universities"]}
    crawlers: dict[str, SiteCrawler] = {}
    hashes_by_university: dict[str, dict[str, str]] = {}

    items = report["template_candidates"] + (report["guides"] if include_guides else [])
    for item in items:
        university_id = item["university_id"]
        university = universities[university_id]
        crawler = crawlers.setdefault(university_id, SiteCrawler(university, max_pages=1, delay=max(delay, 0.5)))
        data, final_url, error = crawler.fetch(item["document_url"], MAX_TEMPLATE_BYTES)
        if data is None or error:
            item["download_status"] = "başarısız"
            item["download_error"] = error or "Dosya alınamadı."
            continue
        if data.lstrip()[:64].lower().startswith((b"<!doctype html", b"<html", b"<head", b"<body")):
            item["download_status"] = "başarısız"
            item["download_error"] = "İndirme adresi belge yerine HTML sayfası döndürdü."
            continue

        digest = hashlib.sha256(data).hexdigest()
        known_hashes = hashes_by_university.setdefault(university_id, {})
        if digest in known_hashes:
            item["download_status"] = "yinelenen dosya"
            item["local_path"] = known_hashes[digest]
            item["sha256"] = digest
            item["file_size_bytes"] = len(data)
            item["final_url"] = final_url
            continue

        parsed_name = Path(urllib.parse.unquote(urllib.parse.urlsplit(final_url or item["document_url"]).path)).name
        file_name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", parsed_name).strip(" .")
        if not file_name:
            file_name = f"template-{digest[:12]}.{item['file_type']}"
        file_name = file_name[:160]
        safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", university_id)
        target = download_root / safe_id / file_name
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            existing_digest = hashlib.sha256(target.read_bytes()).hexdigest()
            if existing_digest != digest:
                target = target.with_name(f"{target.stem}-{digest[:8]}{target.suffix}")
        target.write_bytes(data)
        local_path = str(target.resolve())
        known_hashes[digest] = local_path
        item["download_status"] = "indirildi"
        item["local_path"] = local_path
        item["sha256"] = digest
        item["file_size_bytes"] = len(data)
        item["final_url"] = final_url

    report["download_directory"] = str(download_root.resolve())
    if include_guides:
        report["downloaded_guide_link_count"] = sum(item.get("download_status") == "indirildi" for item in report["guides"])
        report["failed_guide_download_count"] = sum(item.get("download_status") == "başarısız" for item in report["guides"])
    report["downloaded_template_link_count"] = sum(item.get("download_status") == "indirildi" for item in report["template_candidates"])
    report["duplicate_template_link_count"] = sum(item.get("download_status") == "yinelenen dosya" for item in report["template_candidates"])
    report["failed_template_download_count"] = sum(item.get("download_status") == "başarısız" for item in report["template_candidates"])
    return download_root


def build_report(config: dict, max_pages: int, delay: float, workers: int = 4) -> dict:
    universities = config["universities"]
    def scan_one(index: int, university: dict) -> dict:
        print(f"[{index}/{len(universities)}] {university['name']} taranıyor...", file=sys.stderr, flush=True)
        try:
            result = SiteCrawler(university, max_pages, delay).scan()
        except KeyboardInterrupt:
            raise
        except Exception as error:
            result = {
                "university_id": university["id"],
                "university": university["name"],
                "province": university["province"],
                "domain": university["domain"],
                "pages_scanned": 0,
                "pages_fetched": 0,
                "homepage_reachable": False,
                "page_limit_reached": False,
                "scan_status": "erişilemedi",
                "template_candidates": [],
                "guides": [],
                "errors": [{"url": university["start_url"], "error": str(error)[:240]}],
            }
        print(f"    tamamlandı: {result['pages_fetched']}/{result['pages_scanned']} sayfa yüklendi, {len(result['template_candidates'])} aday", file=sys.stderr, flush=True)
        return result

    results_by_id = {}
    workers = max(1, min(workers, len(universities)))
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(scan_one, index, university) for index, university in enumerate(universities, 1)]
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            results_by_id[result["university_id"]] = result
    results = [results_by_id[item["id"]] for item in universities]
    all_candidates = [item for result in results for item in result["template_candidates"]]
    all_guides = [item for result in results for item in result["guides"]]
    explicit = [item for item in all_candidates if item["classification"] == "şablon"]
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "region": config["region"],
        "provinces": config["provinces"],
        "scope": config["scope"],
        "university_count": len(universities),
        "university_records_with_scan_errors": sum(bool(item["errors"]) for item in results),
        "pages_scanned": sum(item["pages_scanned"] for item in results),
        "pages_fetched": sum(item["pages_fetched"] for item in results),
        "universities_with_reachable_homepage": sum(item["homepage_reachable"] for item in results),
        "explicit_template_file_count": len(explicit),
        "possible_template_file_count": len(all_candidates) - len(explicit),
        "template_candidate_file_count": len(all_candidates),
        "guide_file_count_separate": len(all_guides),
        "counting_note": "Sayılar resmi üniversite sayfalarında bulunan indirilebilir dosya bağlantılarını sayar. Şablon adayı ayrı gösterilir; aynı şablonun farklı dil/degree sürümleri veya aynı dosyanın farklı kopyaları ayrıca doğrulanmalıdır. JavaScript ile üretilen, giriş gerektiren veya sitede bağlantısı bulunmayan dosyalar keşfedilemeyebilir.",
        "results_by_university": results,
        "template_candidates": all_candidates,
        "guides": all_guides,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Üniversitelerin resmî sitelerinde tez şablonu ve yazım kılavuzu dosyalarını ara.")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG, help="Üniversite ve resmî alan adı listesi (JSON).")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Çıktı dosyalarının uzantısız yolu.")
    parser.add_argument("--max-pages", type=int, default=40, help="Üniversite başına taranacak en fazla sayfa.")
    parser.add_argument("--delay", type=float, default=0.35, help="Aynı üniversite sitesine istekler arasındaki saniye.")
    parser.add_argument("--download-files", action="store_true", help="Bulunan şablon dosyalarını kurum klasörlerine indir.")
    parser.add_argument("--download-guides", action="store_true", help="--download-files ile birlikte tez yazım kılavuzlarını da indir.")
    parser.add_argument("--region", help="Yalnız bu bölgedeki üniversiteleri tara (yapılandırmadaki region alanı).")
    parser.add_argument("--only", help="Virgülle ayrılmış üniversite id listesi.")
    parser.add_argument("--workers", type=int, default=4, help="Aynı anda taranan üniversite sayısı (her siteye istekler yine sıralı).")
    args = parser.parse_args()
    if args.max_pages < 1 or args.delay < 0:
        parser.error("--max-pages en az 1, --delay en az 0 olmalı.")
    try:
        config = json.loads(args.config.read_text(encoding="utf-8"))
        if args.region:
            config["universities"] = [u for u in config["universities"] if u.get("region") == args.region]
            config["region"] = args.region
            config["provinces"] = config.get("regions", {}).get(args.region, config["provinces"])
        if args.only:
            wanted = {value.strip() for value in args.only.split(",") if value.strip()}
            config["universities"] = [u for u in config["universities"] if u["id"] in wanted]
        if not config["universities"]:
            print("Seçime uyan üniversite yok.", file=sys.stderr)
            return 2
        report = build_report(config, args.max_pages, args.delay, args.workers)
        if args.download_files:
            download_templates(report, config, args.output, args.delay, args.download_guides)
        json_path, csv_path = write_reports(report, args.output)
    except KeyboardInterrupt:
        print("Tarama kullanıcı tarafından durduruldu.", file=sys.stderr)
        return 130
    except (OSError, json.JSONDecodeError, KeyError, TypeError) as error:
        print(f"Tarama başlatılamadı: {error}", file=sys.stderr)
        return 2
    print(f"\n{report['region']}: {report['university_count']} üniversite")
    print(f"Açıkça şablon olarak etiketlenen dosyalar: {report['explicit_template_file_count']}")
    print(f"Ek doğrulama isteyen şablon adayları: {report['possible_template_file_count']}")
    print(f"Toplam şablon adayı dosya: {report['template_candidate_file_count']}")
    print(f"Ayrı tutulan tez yazım kılavuzları: {report['guide_file_count_separate']}")
    if args.download_files:
        print(f"İndirilen şablon bağlantısı: {report['downloaded_template_link_count']}; yinelenen dosya: {report['duplicate_template_link_count']}; başarısız indirme: {report['failed_template_download_count']}")
        if args.download_guides:
            print(f"İndirilen kılavuz bağlantısı: {report['downloaded_guide_link_count']}; başarısız: {report['failed_guide_download_count']}")
        print(f"Dosyalar: {report['download_directory']}")
    print(f"Sayfa: {report['pages_fetched']}/{report['pages_scanned']} başarıyla yüklendi; ana sitesi erişilen kurum: {report['universities_with_reachable_homepage']}/{report['university_count']}; hata görülen kurum: {report['university_records_with_scan_errors']}")
    print("\nKurum bazında bulunan şablon adayları:")
    for result in report["results_by_university"]:
        explicit_count = sum(item["classification"] == "şablon" for item in result["template_candidates"])
        candidate_count = len(result["template_candidates"])
        guide_count = len(result["guides"])
        capped = ", sayfa sınırına ulaştı" if result.get("page_limit_reached") else ""
        print(f"- {result['university']}: {explicit_count} açık şablon + {candidate_count - explicit_count} aday, {guide_count} kılavuz; {result['scan_status']}, {result['pages_fetched']}/{result['pages_scanned']} sayfa{capped}")
    print(f"JSON: {json_path}")
    print(f"CSV:  {csv_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
