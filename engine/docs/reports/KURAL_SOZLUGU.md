# Kural Sözlüğü (TxtEngine Spec Şeması v3)

**Sürüm:** 1.0 — 2026-09-30
**Makine okunabilir karşılığı:** `orchestration/specs/rule-taxonomy.json` (üretici: `orchestration/tools/spec_annotate_v3.py`)
**Kapsam:** `orchestration/specs/*.json` içindeki tüm kural girdileri (şu an 5 AKÜ spec'i, 999 kural, 504 farklı anahtar)

Bu sözlük, üniversite kılavuzlarından çıkarılan kuralların ortak dilidir. Amaç: her kuralın neyi ölçtüğünü, ne kadar sapmaya izin verildiğini ve ihlalinin tezi reddettirip ettirmediğini tek yerde tanımlamak. Yeni her üniversite bu dile map edilir; isim uydurulmaz.

---

## 1. Kural girdisi (v3 alanları)

Her `rules[]` girdisi v3 ile şu alanları taşır:

| Alan | Anlamı |
|---|---|
| `key` | Kural anahtarı (kaynak spec'deki özgün ad; değiştirilmez) |
| `canonicalKey` | Sözlükteki normalize ad (birim soneki tekilleştirilmiş; `rule-taxonomy.json.keyMap`) |
| `value` / `unit` | Kural değeri ve birimi (mm, pt, em, enum, string) |
| `confidence` | Kanıt sınıfı: `EXPLICIT` (kılavuzda yazılı) / `TEMPLATE` (resmi DOCX şablonu XML'i) / `MEASURED` (resmi örnek PDF geometrisi) / `INFERRED` (gerekçeli çıkarım) / `UNKNOWN` (kaynak susturuyor) |
| `evidence` | Kaynak dosya + konum (`p.5 §2.1`, `styles.xml`, XML xpath) + alıntı |
| `category` | Sözlük kategorisi (aşağıda) |
| `check` | Doğrulama tipi: `measure` (ölçümle), `lint` (yapısal/içerik kontrolü), `render` (sabit sayfa yerleşimi), `none` (motor içi ölçüm) |
| `rejectionRisk` | `high` / `medium` / `low` / `none` — ihlali enstitünün reddetme sebebi sayıp saymayacağı |
| `tolerance` | Ölçüm toleransı: `{value, unit, targetValue}` — yalnız ölçüm gurultüsü, bilinçli sapma izni DEĞİL |

---

## 2. Kategoriler ve Tier'lar

| Kategori | Tier | İçerik | Doğrulama |
|---|---|---|---|
| `page-geometry` | 1 | Sayfa ölçüleri, kenar boşlukları, ayna margin, cilt payı | `measure`, ≤0.5 mm (hedef 0.25) |
| `typography` | 1 | Font ailesi/puntosu, satır aralığı, girinti, space before/after, hizalama, H1-H5 başlıklar, dipnotlar | `measure`, font ±0.1 pt, aralık ±0.2 pt |
| `pagination` | 1 | Sayfa numarası konumu/formatı/başlangıcı, numarasız sayfalar | `measure` + `lint` |
| `captions` | 1 | Şekil/tablo açıklamaları: etiket, konum, numaralandırma, asılı girinti | `measure` + `lint` |
| `bibliography` | 1 | Kaynakça biçimi (hanging indent, aralık, hizalama); atıf stili kuralı `citations.*` ile | `measure` + `lint` |
| `equations` | 1 | Denklem yerleşimi, numaralandırma, boşluklar | `measure` |
| `layout-model` | 1* | Word satır/paragraf modeli ölçümleri (`wordModel.*`) — motor içi referans | `measure`, risk `none` |
| `fixed-page` | 2 | Kapak, iç kapak, onay, beyan, önsöz, teşekkür, etik beyan, özgeçmiş blok geometrisi | `render` + `measure` (milimetrik) |
| `abstract` | 2 | Özet sayfaları (TR/EN/uzun özet) yapısı ve tipografisi | `lint` + `measure` |
| `toc-lists` | 2 | İçindekiler, şekil/tablo/kısaltma/simge dizinleri | `measure` + `lint` |
| `structure` | 2 | Bölüm sırası, zorunlu bölümler, sayfa başlangıçları | `lint` |
| `objects` | 2 | Şekil/tablo yerleşimi, genişlik, sayfa yönü | `lint` + `measure` |
| `content` | 3 | Dil, içerik, benzerlik oranı gibi belge içi kurallar | `lint` |
| `production` | 3 | Baskı, cilt, kâğıt, teslim — fiziksel süreç, belge biçimi değil | `lint` |

Tier anlamı: **Tier 1** değer birebir uygulanır ve ölçülür; **Tier 2** yapısal olarak doğrulanır (sabit sayfalarda geometri milimetrik); **Tier 3** lint/uyarıdır, ihracatı engellemez.

---

## 3. Tolerans politikası

Tolerans yalnız **ölçüm/render gurultusudur**; kural değerini bilerek değiştirme izni değildir.

| Birim | Tolerans | Hedef |
|---|---|---|
| mm (geometri) | ±0.5 mm | ±0.25 mm |
| pt (font puntosu) | ±0.1 pt | ±0.1 pt |
| pt (aralık/boşluk) | ±0.2 pt | ±0.2 pt |
| em (Word satır modeli) | ±0.02 em | ±0.02 em |
| enum / string | birebir | birebir |

Politika kaynağı: `orchestration/README.md` (policy revision 2026-09-28) — eski gevşek toleranslar (±1 mm margin, ±%5 aralık) hükümsüzdür.

---

## 4. Red riski politikası

| Değer | Anlamı | Davranış |
|---|---|---|
| `high` | İhlali enstitünün reddetme sebebi (punto, margin, font, sayfa numarası, başlık formatı, kapak/onay geometrisi) | Doğrulayıcı bunları **mutlaka** ölçer; ihlal = FAIL |
| `medium` | Reddedilme riski olan ama tartışılabilir (içerik kuralı, atıf stili, tablo notu) | Uyarı + rapor; kural kanıtlanmışsa FAIL |
| `low` | Fiziksel üretim/teslim kuralı | Bilgi notu |
| `none` | Motor ölçümü, üniversite kuralı değil | Regression için |

Reddedilme senaryosu rehberdir: enstitüler tezi **kural değeri** uyumsuzluğundan reddeder (fazla punto, kaymış margin), gövde metninin örnek şablonla sayfa düzeyinde birebir olmamasından değil. Bu yüzden `high` kuralların ölçümü zorunlu, sayfa görüntüsü kopyalama hedef değildir — **istisna: `fixed-page` kategorisi** (kapak/onay/jüri bloğu); orada geometri milimetriktir.

---

## 5. Anahtar normalizasyonu (`keyMap`)

504 farklı anahtarın 13'ü aynı kavramın birimli/birimsiz ikiliği (`abstract.keywords.hangingIndent` → `abstract.keywords.hangingIndentMm`). `rule-taxonomy.json.keyMap` her eski anahtara `canonical` karşılık verir; isim temizliği yalnız bu tablodan yapılır, anahtarlar olduğu gibi korunur. Şu an alias birleştirmeleri otomatik (`status: auto`); Analyzer elle düzelttikçe `status: reviewed` yapar.

Gelecek anahtarlar sözlükte yoksa: `spec_annotate_v3.py` alanı `UNMAPPED-DOMAIN` ile işaretler; Analyzer ya yeni domain'i sözlüğe ekler ya da anahtarı mevcut domain'e map eder. **Sözlük dışında key uydurmak yasaktır.**

---

## 6. Taban + delta ilkesi

- **Taban** (`rule-taxonomy.json` + bu doküman): ortak kural dili ve tolerans/risk politikası. Kural **değeri** içermez; üniversiteye özel değer taşımaz.
- **Delta** (her `specs/<id>.json`): o üniversitenin kural değerleri + kanıtları. Delta'daki her değer `evidence` taşımak zorundadır.
- Bir kural delta'da `UNKNOWN` ise motor kaynağı olmayan değeri **uydurmaz**: uygulamanın belgelenmiş varsayılanı devreye girer ve çıktı "şablon susturuyor" etiketiyle raporlanır (Tier-4 davranış).
- Bir üniversiteden alınan değer başka üniversiteye **kopyalanamaz** (`AGENTS.md` §6); yalnız motor yetenekleri paylaşılır.

---

## 7. Kullanım akışı

1. **Analyzer** kaynağı okur, kuralı sözlükteki `canonicalKey` ile yazar, `evidence` + `confidence` doldurur.
2. **`spec_annotate_v3.py`** çalıştırılır; `category/check/rejectionRisk/tolerance` alanları otomatik gelir; Analyzer gerekirse elle düzeltir (özellikle `rejectionRisk`).
3. **Integrator** `check: measure` kuralları motor/şablon tarafında karşılar; `rejectionRisk: high` kurallarda tolerans aşımı kabul edilmez.
4. **Validator / conformance checker** çıktıyı (PDF/DOCX) `check` tipine göre ölçer; `high` ihlalleri madde madde "enstitü reddi" raporuna yazar.
5. Coverage matrisi (`orchestration/reports/coverage-matrix.md`) her annotate çalışmasında yenilenir; `UNKNOWN` oranları Tier-4 envanteridir.

---

*Değişiklik notu: bu doküman ve v3 alanları eklenti niteliğindedir; mevcut spec içeriği, kanıtlar ve `schemaVersion: 2` okuyucuları bozulmaz. `schemaVersion: 3` yalnız yeni alanların varlığını bildirir.*
