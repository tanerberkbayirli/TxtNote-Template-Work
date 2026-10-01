#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""spec_annotate_v3.py — Spec schema v3 migrator / annotator.

For every rule in orchestration/specs/*.json, add schema-v3 fields:
  canonicalKey   normalized key (alias-collapsed; see rule-taxonomy.json keyMap)
  category       rule category from the taxonomy (typography, page-geometry, ...)
  check          measure | lint | render | none
  rejectionRisk  high | medium | low | none  (would an institute reject over this?)
  tolerance      {value, unit, targetValue}  measurement tolerance (noise only)

Also writes orchestration/specs/rule-taxonomy.json (generated registry) and
orchestration/reports/coverage-matrix.{json,md}.

Additive and idempotent: re-running overwrites only the v3 fields it owns.
Usage: python orchestration/tools/spec_annotate_v3.py [--dry-run]
"""
import json, re, sys, datetime, collections, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SPECS = ROOT / "orchestration" / "specs"
REPORTS = ROOT / "orchestration" / "reports"
TODAY = datetime.date.today().isoformat()

# ---------------------------------------------------------------------------
# Domain table: first key segment -> category + baseline behaviour
# ---------------------------------------------------------------------------
DOMAINS = {
    # domain:            (category,           tier, defaultCheck, defaultRisk, description)
    "page":              ("page-geometry",    1, "measure", "high",   "Sayfa ölçüleri ve kenar boşlukları"),
    "paper":             ("production",       3, "lint",    "low",    "Baskı/teslim (kâğıt, cilt)"),
    "wordModel":         ("layout-model",     1, "measure", "none",   "Word satır/paragraf modeli ölçümleri (motor içi)"),
    "typography":         ("typography",       1, "measure", "high",   "Gövde tipografisi"),
    "headings":          ("typography",       1, "measure", "high",   "Başlık stilleri H1-H5"),
    "numbers":           ("typography",       1, "lint",    "medium", "Sayı gösterimi"),
    "equations":         ("equations",        1, "measure", "medium", "Denklem yerleşimi ve numaralandırma"),
    "footnotes":         ("typography",       1, "measure", "medium", "Dipnotlar"),
    "pagination":        ("pagination",       1, "measure", "high",   "Sayfa numaralandırma"),
    "structure":         ("structure",        2, "lint",    "high",   "Bölüm sırası ve zorunlu yapı"),
    "sections":          ("structure",        2, "lint",    "high",   "Bölüm davranışı"),
    "chapters":          ("structure",        2, "lint",    "high",   "Ana bölümler"),
    "mainChapters":      ("structure",        2, "lint",    "high",   "Ana bölümler"),
    "frontMatter":       ("structure",        2, "lint",    "high",   "Ön sayfa yapısı"),
    "degrees":           ("structure",        2, "lint",    "medium", "Derece türü kuralları"),
    "language":          ("content",          3, "lint",    "medium", "Dil kuralları"),
    "software":          ("production",       3, "lint",    "low",    "Yazılım/üretim"),
    "output":            ("production",       3, "lint",    "low",    "Çıktı biçimi"),
    "cover":             ("fixed-page",       2, "render",  "high",   "Dış kapak"),
    "coverUnderPage":    ("fixed-page",       2, "render",  "high",   "Kapak altı sayfa"),
    "outerCover":        ("fixed-page",       2, "render",  "high",   "Dış kapak (kurum baskılı)"),
    "innerCover":        ("fixed-page",       2, "render",  "high",   "İç kapak"),
    "approval":          ("fixed-page",       2, "render",  "high",   "Onay/jüri sayfası"),
    "declaration":       ("fixed-page",       2, "render",  "high",   "Beyan sayfası"),
    "preface":           ("fixed-page",       2, "render",  "high",   "Önsöz"),
    "acknowledgements":  ("fixed-page",       2, "render",  "high",   "Teşekkür"),
    "ethicsDeclaration": ("fixed-page",       2, "render",  "high",   "Etik beyan"),
    "cv":                ("fixed-page",       2, "render",  "high",   "Özgeçmiş"),
    "curriculumVitae":   ("fixed-page",       2, "render",  "high",   "Özgeçmiş"),
    "abstract":          ("abstract",         2, "lint",    "high",   "Özet sayfası"),
    "englishAbstract":   ("abstract",         2, "lint",    "high",   "İngilizce özet"),
    "otherAbstract":     ("abstract",         2, "lint",    "medium", "Diğer dil özeti"),
    "extendedTurkishSummary": ("abstract",    2, "lint",    "medium", "Uzun Türkçe özet"),
    "toc":               ("toc-lists",        2, "measure", "high",   "İçindekiler"),
    "lists":             ("toc-lists",        2, "measure", "high",   "Dizinler (şekil/tablo/kısaltma/simgeler)"),
    "captions":          ("captions",         1, "measure", "high",   "Şekil/tablo açıklamaları"),
    "figures":           ("objects",          2, "lint",    "medium", "Şekil yerleşimi"),
    "tables":            ("objects",          2, "measure", "medium", "Tablo biçimi"),
    "bibliography":      ("bibliography",     1, "measure", "high",   "Kaynakça biçimi"),
    "citations":         ("bibliography",     3, "lint",    "medium", "Atıf stili"),
    "content":           ("content",          3, "lint",    "medium", "İçerik kuralları"),
    "binding":           ("production",       3, "lint",    "low",    "Cilt"),
    "printing":          ("production",       3, "lint",    "low",    "Baskı"),
    "submission":        ("production",       3, "lint",    "low",    "Teslim"),
}

# Property classes: key segment patterns -> (checkOverride, riskOverride)
NUMERIC_DIM = re.compile(r"(Mm|Pt|Em)$|Margin|Indent|Spacing|Space(Before|After)|FontSize|LinePitch|LineSpacing|Distance|Baseline|Height|Width|Gap|Overlap", re.I)
CONTENT_PROP = re.compile(r"content|usage|threshold|maxWords|maxPages|maxAuthors|etAl|minSentences|citation|system|material|copies|weight|duplex|plagiarism|similarity", re.I)
FORMAT_PROP = re.compile(r"align|format|numbering|position|label|title|style|order|case|caps|bold|italic|separator|leader|case|transform|kind|model|layout|form|structure", re.I)

UNIT_SUFFIX = re.compile(r"(Mm|Pt|Em)$")
PARANTH = re.compile(r"\((equivalent|word)\)", re.I)

# ---------------------------------------------------------------------------
def classify(key):
    dom = key.split(".")[0]
    base = DOMAINS.get(dom)
    if base is None:
        return ("structure", 2, "lint", "medium", "UNMAPPED-DOMAIN")
    category, tier, check, risk, desc = base
    prop = key.split(".")[-1]
    if dom == "wordModel":
        return (category, tier, "measure", "none", desc)
    if NUMERIC_DIM.search(prop):
        check = "measure"
        if category in ("production",):
            risk = "low"
        elif category == "content":
            risk = "medium"
        else:
            risk = "high"
    elif CONTENT_PROP.search(prop):
        check = "lint"
        risk = "medium" if risk == "high" and category in ("abstract", "content", "bibliography") else risk
    elif FORMAT_PROP.search(prop):
        check = "lint" if category in ("structure", "content", "bibliography", "production", "objects") else "lint"
        risk = "high" if category in ("structure", "fixed-page", "pagination", "toc-lists", "typography", "abstract", "captions") else risk
    return (category, tier, check, risk, desc)

def tolerance_for(key, unit):
    u = (unit or "")
    m = UNIT_SUFFIX.search(key)
    if not u and m:
        u = {"Mm": "mm", "Pt": "pt", "Em": "em"}.get(m.group(1), "")
    if u == "mm":
        return {"value": 0.5, "unit": "mm", "targetValue": 0.25}
    if u == "pt":
        if re.search(r"FontSize|SizePt$", key, re.I):
            return {"value": 0.1, "unit": "pt", "targetValue": 0.1}
        return {"value": 0.2, "unit": "pt", "targetValue": 0.2}
    if u == "em":
        return {"value": 0.02, "unit": "em", "targetValue": 0.02}
    return {"value": None, "unit": "exact", "targetValue": None}

def normalize_key(key):
    k = PARANTH.sub("", key).strip()
    return k

# ---------------------------------------------------------------------------
def main():
    dry = "--dry-run" in sys.argv
    spec_files = sorted(SPECS.glob("*.json"))
    all_keys = set()
    key_present = collections.defaultdict(set)   # canonical/normalized key -> specs
    per_spec = {}

    for sf in spec_files:
        d = json.loads(sf.read_text(encoding="utf-8"))
        if d.get("schemaVersion", 0) > 3:
            continue
        rules = d.get("rules", [])
        cat_counts = collections.Counter()
        conf_counts = collections.Counter()
        risk_counts = collections.Counter()
        for r in rules:
            key = r.get("key", "")
            nk = normalize_key(key)
            all_keys.add(nk)
            key_present[nk].add(sf.stem)
            category, tier, check, risk, _ = classify(nk)
            tol = tolerance_for(nk, r.get("unit"))
            r["canonicalKey"] = nk
            r["category"] = category
            r["check"] = check
            r["rejectionRisk"] = risk
            r["tolerance"] = tol
            r["annotatedBy"] = "spec_annotate_v3"
            cat_counts[category] += 1
            conf_counts[r.get("confidence", "UNKNOWN")] += 1
            risk_counts[risk] += 1
        d["schemaVersion"] = 3
        d["annotatedAt"] = TODAY
        d["schemaNote"] = ("v3: v3 alanlari (canonicalKey, category, check, rejectionRisk, tolerance) "
                           "spec_annotate_v3.py tarafindan otomatik eklendi; Analyzer duzeltmeye aciktir. "
                           "Kural sozlugu: orchestration/reports/KURAL_SOZLUGU.md")
        per_spec[sf.stem] = {
            "rules": len(rules), "categories": dict(cat_counts),
            "confidence": dict(conf_counts), "rejectionRisk": dict(risk_counts),
        }
        if not dry:
            sf.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # ---- alias map: bare key vs unit-suffixed key of the same concept
    key_map = {}
    for k in sorted(all_keys):
        canon = k
        if k + "Mm" in all_keys or k + "Pt" in all_keys:
            canon = k + ("Mm" if k + "Mm" in all_keys else "Pt")
        key_map[k] = {
            "canonical": canon,
            "status": "auto",
            "presentIn": sorted(key_present[k]),
        }

    taxonomy = {
        "generatedAt": TODAY,
        "generatedBy": "spec_annotate_v3.py",
        "domains": {k: {"category": v[0], "tier": v[1], "defaultCheck": v[2],
                        "defaultRejectionRisk": v[3], "description": v[4]}
                    for k, v in DOMAINS.items()},
        "tolerancePolicy": {
            "mm": {"value": 0.5, "targetValue": 0.25, "note": "Olcum gurultusu; bilincli sapma degil"},
            "ptFont": {"value": 0.1}, "ptSpacing": {"value": 0.2}, "exact": "enum/string: birebir",
        },
        "rejectionRiskPolicy": {
            "high": "Enstitunun reddetme sebebi olabilecek bicim kurali (font, margin, punto, sayfa no, baslik, onay/kapak geometrisi)",
            "medium": "Reddedilme riski olan ama tartisilabilir kural (icerik, atif stili, tablo notu)",
            "low": "Fiziksel uretim/teslim kurali; belge bicimi degil",
            "none": "Motor olcumu; dogrudan universite kurali degil",
        },
        "keyMap": key_map,
        "stats": {"distinctKeys": len(all_keys), "perSpec": per_spec},
    }
    if not dry:
        (SPECS / "rule-taxonomy.json").write_text(
            json.dumps(taxonomy, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # ---- coverage matrix
    REPORTS.mkdir(parents=True, exist_ok=True)
    matrix = {"generatedAt": TODAY, "targets": per_spec}
    if not dry:
        (REPORTS / "coverage-matrix.json").write_text(
            json.dumps(matrix, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    lines = ["# Coverage matrisi", "", f"Olusturma: {TODAY} (spec_annotate_v3.py, otomatik)", "",
             "Kategorilere gore kural sayilari ve kanit dagilimi. UNKNOWN = kaynagin kurali belirlemedigi yer (Tier-4).", ""]
    cats = sorted({c for s in per_spec.values() for c in s["categories"]})
    header = "| Kategori |" + "".join(f" {n} |" for n in per_spec) + " toplam |"
    lines.append(header)
    lines.append("|---" * (len(per_spec) + 2) + "|")
    for c in cats:
        row = f"| {c} |"
        tot = 0
        for n, s in per_spec.items():
            v = s["categories"].get(c, 0)
            tot += v
            row += f" {v} |"
        lines.append(row + f" {tot} |")
    lines += ["", "## Kanit dagilimi (confidence)", "",
              "| Spec | EXPLICIT | TEMPLATE | MEASURED | INFERRED | UNKNOWN | kural |", "|---|---|---|---|---|---|---|"]
    for n, s in per_spec.items():
        cf = s["confidence"]
        lines.append(f"| {n} | {cf.get('EXPLICIT',0)} | {cf.get('TEMPLATE',0)} | {cf.get('MEASURED',0)} | "
                     f"{cf.get('INFERRED',0)} | {cf.get('UNKNOWN',0)} | {s['rules']} |")
    lines += ["", "## Red riski dagilimi", "",
              "| Spec | high | medium | low | none |", "|---|---|---|---|---|"]
    for n, s in per_spec.items():
        rk = s["rejectionRisk"]
        lines.append(f"| {n} | {rk.get('high',0)} | {rk.get('medium',0)} | {rk.get('low',0)} | {rk.get('none',0)} |")
    if not dry:
        (REPORTS / "coverage-matrix.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({"specs": {k: {"rules": v["rules"], "risk": v["rejectionRisk"]} for k, v in per_spec.items()},
                      "distinctKeys": len(all_keys), "dryRun": dry}, ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()