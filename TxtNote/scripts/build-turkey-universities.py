#!/usr/bin/env python3
"""Build turkey-universities.json from YÖK's official university list.

Source: https://www.yok.gov.tr/university?type=1 (state) and ?type=2 (foundation).
Vocational schools (type=3) award no thesis degrees and are left out; KKTC
universities (type=6) are outside Türkiye and are left out as well.

Hand-found seed URLs from ege-universities.json are carried over by domain so
the national scan does not lose the Ege inventory work.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT = SCRIPT_DIR / "turkey-universities.json"
EGE_CONFIG = SCRIPT_DIR / "ege-universities.json"
YOK_LIST_URL = "https://www.yok.gov.tr/university?type={type}"
LIST_TYPES = {1: "devlet", 2: "vakif"}
USER_AGENT = "TxtEngineThesisTemplateInventory/1.0 (public institutional template inventory)"

# Türkiye's seven geographic regions (1941 Coğrafya Kongresi), 81 provinces.
REGIONS = {
    "Marmara": ["Balıkesir", "Bilecik", "Bursa", "Çanakkale", "Edirne", "İstanbul", "Kırklareli", "Kocaeli", "Sakarya", "Tekirdağ", "Yalova"],
    "Ege": ["Afyonkarahisar", "Aydın", "Denizli", "İzmir", "Kütahya", "Manisa", "Muğla", "Uşak"],
    "Akdeniz": ["Adana", "Antalya", "Burdur", "Hatay", "Isparta", "Kahramanmaraş", "Mersin", "Osmaniye"],
    "İç Anadolu": ["Aksaray", "Ankara", "Çankırı", "Eskişehir", "Karaman", "Kayseri", "Kırıkkale", "Kırşehir", "Konya", "Nevşehir", "Niğde", "Sivas", "Yozgat"],
    "Karadeniz": ["Amasya", "Artvin", "Bartın", "Bayburt", "Bolu", "Çorum", "Düzce", "Giresun", "Gümüşhane", "Karabük", "Kastamonu", "Ordu", "Rize", "Samsun", "Sinop", "Tokat", "Trabzon", "Zonguldak"],
    "Doğu Anadolu": ["Ağrı", "Ardahan", "Bingöl", "Bitlis", "Elazığ", "Erzincan", "Erzurum", "Hakkari", "Iğdır", "Kars", "Malatya", "Muş", "Tunceli", "Van"],
    "Güneydoğu Anadolu": ["Adıyaman", "Batman", "Diyarbakır", "Gaziantep", "Kilis", "Mardin", "Siirt", "Şanlıurfa", "Şırnak"],
}
LOWER_WORDS = {"ve"}
ACRONYMS = {"TOBB", "TED", "MEF", "ODTÜ", "İSTE", "OSTİM", "SBÜ"}


def tr_upper(value: str) -> str:
    return value.replace("i", "İ").replace("ı", "I").upper()


def tr_lower(value: str) -> str:
    return value.replace("I", "ı").replace("İ", "i").lower()


def tr_title(value: str) -> str:
    words = []
    for index, word in enumerate(value.split()):
        if word in ACRONYMS:
            words.append(word)
        elif index and tr_lower(word) in LOWER_WORDS:
            words.append(tr_lower(word))
        else:
            parts = [tr_lower(part) for part in word.split("-")]
            words.append("-".join(part if index and len(part) == 1 else tr_upper(part[:1]) + part[1:] for index, part in enumerate(parts)))
    return " ".join(words)


PROVINCE_BY_UPPER = {tr_upper(province): (province, region) for region, provinces in REGIONS.items() for province in provinces}


def name_key(value: str) -> str:
    return tr_lower(value).translate(str.maketrans("âîû", "aiu"))


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8")


def parse_cards(page: str) -> list[dict]:
    cards = []
    for card in page.split('class="university-card-uni"')[1:]:
        name = html.unescape(re.search(r'data-name="([^"]*)"', card).group(1)).strip()
        city = html.unescape(re.search(r'data-city="([^"]*)"', card).group(1)).strip()
        web = re.search(r'Web Sitesi:</div>\s*<div class="detail-value-uni">\s*<a href="([^"]*)"', card)
        cards.append({"name": name, "city": city, "web": web.group(1).strip() if web else ""})
    return cards


def main() -> int:
    parser = argparse.ArgumentParser(description="YÖK listesinden Türkiye üniversiteleri tarama yapılandırmasını üret.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    ege_list = json.loads(EGE_CONFIG.read_text(encoding="utf-8"))["universities"]
    ege = {u["domain"]: u for u in ege_list}
    # Same university under another official domain (Ege list: mcbu.edu.tr, YÖK: cbu.edu.tr).
    ege_by_name = {name_key(u["name"]): u for u in ege_list}
    universities, problems = [], []
    for list_type, kind in LIST_TYPES.items():
        for card in parse_cards(fetch(YOK_LIST_URL.format(type=list_type))):
            province, region = PROVINCE_BY_UPPER.get(card["city"], (None, None))
            host = (urllib.parse.urlsplit(card["web"]).hostname or "").lower()
            domain = host[4:] if host.startswith("www.") else host
            if not province or not domain:
                problems.append(card)
                continue
            known = ege.get(domain, {})
            same_name = {} if known else ege_by_name.get(name_key(tr_title(card["name"])), {})
            universities.append({
                "id": known.get("id") or domain.removesuffix(".edu.tr").replace(".", "-"),
                "name": known.get("name") or same_name.get("name") or tr_title(card["name"]),
                "yokName": card["name"],
                "type": kind,
                "province": province,
                "region": region,
                "domain": domain,
                "start_url": known.get("start_url") or f"https://{host}/",
                "seed_urls": known.get("seed_urls") or same_name.get("seed_urls", []),
            })
    ids = [u["id"] for u in universities]
    duplicates = sorted({i for i in ids if ids.count(i) > 1})
    if duplicates or problems:
        raise SystemExit(f"Eşleşmeyen kayıtlar: {problems}; tekrar eden id: {duplicates}")
    universities.sort(key=lambda u: (list(REGIONS).index(u["region"]), u["province"], u["name"]))
    config = {
        "region": "Türkiye",
        "provinces": [province for provinces in REGIONS.values() for province in provinces],
        "regions": REGIONS,
        "scope": "YÖK listesindeki devlet ve vakıf üniversiteleri; vakıf meslek yüksekokulları ve KKTC üniversiteleri dışarıda.",
        "source": {"url": "https://www.yok.gov.tr/university?type=1 / ?type=2", "retrieved": date.today().isoformat()},
        "universities": universities,
    }
    args.output.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    counts = {region: sum(u["region"] == region for u in universities) for region in REGIONS}
    print(f"{len(universities)} üniversite → {args.output}\n{counts}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
