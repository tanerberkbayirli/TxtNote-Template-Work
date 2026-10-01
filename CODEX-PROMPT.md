# GÖREV PAKETİ — TxtNote tez şablonları: MCBÜ + AKÜ pilot teslimi
# (Orchestrator + 6 luna alt ajan)

Sen bu depo için **orchestrator**'sun. Aşağıdaki görevi **6 luna alt ajan** çalıştırarak yürüteceksin. Alt ajanlara rol ve dosya sahipliği bu prompt'ta verilmiştir; her ajana kendi bağlamını eksiksiz aktar (alt ajanlar bu konuşmayı görmez).

---

## 0. Çalışma dizini ve zorunlu ilk okumalar

Çalışma dizini: `C:\Users\CASPER\Desktop\TxtNote-Template-Work`

Başlamadan ŞUNLARI SIRA İLE OKU ve alt ajan brief'lerine özünü taşı:
1. `AGENTS.md` — depo kuralları (kanıt, tolerans, üniversite izolasyonu, gerçek export zorunlu).
2. `RAPOR-Ne-Yapmaliyiz.md` — teşhis, D1–D6 kararları, yol haritası (onaylandı).
3. `orchestration/manifest.json` — target sözleşmeleri (registry id'leri, modül adları, kaynak dosyalar).
4. `orchestration/progress.json` — güncel durum.
5. `orchestration/specs/rule-taxonomy.json` — kural sözlüğü.

---

## 1. KAPSAM (kilitleyici — dışına çıkma)

Sadece **2 üniversite pilotu** teslim edilecek:

| Hedef | İş |
|---|---|
| `mcbu-lee` | Mevcut `mcbu.js` incelemesi (yeni DOCX kılavuza karşı fark raporu) + spec + doğrulama. Kullanıcı bu üniversitede okuyor, kalite en yüksek olmalı. |
| `aku-fbe` | BLOCKED durumunu Tier-4 ile kapat (aşağıda) + doğrula. |
| `aku-sagbil` | Analizi tamamla → şablonu uygula → doğrula. |

Diğer 30 target'a (deu, ege, msku, pau, ...) **DOKUNMA**. Dosyalarını açma, kaynaklarını okuma, modüllerini yazma.

---

## 2. ONAYLANMIŞ KARARLAR (kullanıcı onaylı, tartışma yok)

- **D1:** Gövde metninde sayfa birebirliği VAAT EDİLMEZ. Doğrulama = kural değeri uyumu (margin, font, punto, satır aralığı, girinti, başlık formatı, sayfa numarası konumu vb.). Milimetrik geometri zorunluluğu YALNIZ sabit formlu sayfalarda (kapak, onay, jüri imza bloğu, taahhütname).
- **D2:** Her kurala `rejectionRisk: high|medium|low`. Doğrulayıcı önce high-risk kuralları ölçer.
- **D3:** **DOCX kanonik** (referans = Word semantiği). PDF her zaman DOCX'ten üretilir (LibreOffice headless). DOM→PDF'i doğrulama referansı yapma.
- **D4:** AI yalnız kaynaktan kural ÇIKARMA aşamasında. Çalışma zamanında kural yorumlaması yok; motor deterministik koddur.
- **D5:** Ortak taban + üniversite delta. Delta'daki her değer kanıt taşır (`evidence{file, location, quote}`).
- **D6 (Tier politikası):**
  - T1 geometri/tipografi: tolerance ≤ 0.5 mm (mümkünse ≤ 0.25 mm), otomatik ölçüm.
  - T2 yapı, T3 içerik lint'i.
  - **T4 = kaynak tanımlamıyorsa: belgelenmiş varsayılan davranış + uyarı; target ASLA bloke olmaz.** Yeni durum adı: `PASS_WITH_DOCUMENTED_DEFAULT` (eski `PASS_WITH_GAPS`'ın yerine geçer; tier-4 nesnesi: `{behavior, rationale, evidence: "SOURCE-SILENT", userWarning}`).

---

## 3. ORTAM GERÇEKLERİ (bu host'ta ölçülmüştür, yeniden keşfetme)

- Windows 11, shell = git-bash (MSYS). Native araçlara `C:/...` biçiminde forward-slash yol ver.
- **LibreOffice kurulu:** `C:\Program Files\LibreOffice\program\soffice.exe`.
  - İlk `--convert-to pdf` denemesi ASILDI (timeout) ve `Could not find platform independent libraries <prefix>` uyarısı verdi. Çözüm denenecek: `PYTHONHOME`/`PYTHONPATH` unset et ve `-env:UserInstallation=file:///C:/.../lo-profile` ile ayrı profil ver. Bu zinciri çalışır hale getirmek L1'in işi.
- **Playwright kurulu değil.** `orchestration/tools/export.mjs` `require(process.env.PLAYWRIGHT_MODULE || "/opt/node22/lib/node_modules/playwright")` diyor — bu Linux yoludur, bu host'ta geçersiz. Çözüm: `orchestration/tools` altında `npm install playwright` + `npx playwright install chromium`, sonra `PLAYWRIGHT_MODULE` ortam değişkeniyle çalıştır. `export.mjs`'in iç mantığına dokunma; gerekiyorsa yalnız yol/varsayılan düzeltmesi yap.
- Export zinciri: vite dev server `TxtNote/frontend` (varsayılan `http://127.0.0.1:5175`) + `export.mjs <fixture.json> <outPrefix>` → `<outPrefix>.pdf`, `.docx`, `.layout.json`. Bu, GERÇEK uygulama export'udur; alternatif test renderer kullanma.
- Ölçüm araçları hazır: `orchestration/tools/pdfmeasure.py`, `spec_annotate_v3.py`, `eq-sweep*.mjs`, `make-fixture.mjs`, `export.mjs`.
- Testler: `cd TxtNote/frontend && node --test src/lib/*.test.js src/features/workarea/*.test.js src/features/sync/*.test.js` + motor testleri `src/thesis/` altında. `progress.json` "466 passing" diyor, gerçek sayıyı koşturup doğrula.
- Word COM yeniden sayfalandırma bu host'ta ÇALIŞMIYOR (0x80070520). Tek render zinciri LibreOffice'tir; DOCX doğrulamasını XML ölçümüyle yap (styles.xml, sectPr, numPr).
- Git deposu kök dizinde; son commit `495b6ec`; izlenmeyen tek şey `orchestration/validation/aku-fbe/attempt-5-equation-repro/` (incele, uygun yere taşı ya da açıkça belgeleyerek karar ver).

---

## 4. MEVCUT DURUM (bilinen, doğrula ama yeniden keşfetme)

**Motor/şablonlar** (`TxtNote/frontend/src/thesis/`):
- `registry.js` içinde: 3 demo, `mcbu-lee-master-tr-v1`, `mcbu-lee-phd-tr-v1`, `aku-fbe-master-tr-v1`, `aku-fbe-phd-tr-v1`. **aku-sagbil şablonu YOK.**
- `templates/mcbu.js` (276 satır, kanıt notlu) ShareFileGallery-GTSM221020251445.pdf (12 s.) kaynaklı. Depodaki kanonik MCBÜ kaynağı ise `Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/MCBU_Lisansustu_Tez_Yazim_Kilavuzu.docx` (22.10.2025 yükleme). Manifest notu: **fark raporu çıkar; değişiklik gerekiyorsa yeni id (`...-v2`) aç, v1'i koru.**

**aku-fbe BLOCKED nedeni** (`orchestration/failures/aku-fbe/BLOCKED.md`, `validation/aku-fbe/attempt-4.md`):
- 89 karakterlik uzun başlık kapak/onay sayfasında taşırıyor; 7 jüri üyesi onay sayfasında satır yetmiyor. Kılavuz bu durumlar için kural TANIMLAMIYOR.
- 5 doğrulama denemesi FAIL. Bu motor eksikliği değil, Tier-4 durumudur: **belgelenmiş varsayılan davranış (örn. uzun başlıkta satır kırılımı + alt bilgi uyarısı; jüri 6+ ise ikinci onay bloğu/sayfası) + kullanıcıya uyarı** ile kapatılır.

**aku-sagbil:** `orchestration/specs/aku-sagbil.json` var (analiz IN_PROGRESS, 9735 satır). Uygulama yok.

---

## 5. ALTI LUNA ALT AJANI — roller, dosya sahipliği, sıra

Genel kural: **iki ajan aynı dosyayı asla düzenlemesin.** `progress.json`'u YALNIZ L6 yazar; commit'leri YALNIZ L6 atar. Her ajan kendi brief'inde bu prompt'un §2 (kararlar), §3 (ortam) ve kendi hedefinin kaynak yollarını almalı.

**Faz sırası:** L1 tek başına önce → L2 + L3 + L5 paralel → L4 (L3'e bağımlı) → L6 en sonda.

### L1 — Ortam & Export Zinciri
- LibreOffice headless DOCX→PDF zincirini çalıştır (§3'teki quirk'i çöz), smoke test: MCBÜ kılavuz DOCX'ini PDF'e çevir ve `pdfmeasure.py` ile ölç.
- Playwright + Chromium kur; `export.mjs`'i gerçek bir fixture ile uçtan uca çalıştır (`.pdf` + `.docx` + `.layout.json` üretildiğini kanıtla).
- Motor test tabanını koştur, sayıyı raporla.
- **Sahibi:** `orchestration/tools/*`, `orchestration/tools/package.json`, `orchestration/reports/ENV.md` (yeni).
- Çıktı: `orchestration/reports/ENV.md` + çalışır komutlar.

### L2 — aku-fbe Tier-4 Kapanışı
- Tier-4 kararlarını yaz: uzun başlık davranışı, 7+ jüri davranışı — her biri için `{behavior, rationale, SOURCE-SILENT, userWarning}`.
- `specs/aku-fbe.json`'a tier-4 nesnelerini işle (yalnız bu dosya).
- Yeni fixture ile gerçek export al, high-risk kuralları `pdfmeasure.py`/XML ölçümüyle doğrula (tolerans ≤ 0.5 mm), raporla.
- `failures/aku-fbe/` altında kapanış belgesi; hedef durumu `PASS_WITH_DOCUMENTED_DEFAULT`.
- **Sahibi:** `specs/aku-fbe.json`, `failures/aku-fbe/*`, `reports/aku-fbe.md`, `validation/aku-fbe/*` (attempt-5-equation-repro dahil — incele, kararını yaz).

### L3 — aku-sagbil Uygulama
- `specs/aku-sagbil.json`'ı tamamla (eksik analiz bitirilecek; değerler kanıt bağlantılı, çelişkiler kayıtlı).
- `templates/aku-sagbil.js` yaz (mcbu.js desenini izle: saf veri modülü, `specialPages` blok düzeni, engine genel yeteneklerini kullan — üniversiteye özel hack yok).
- `registry.js`'e ilgili variant girdilerini ekle (manifest'teki registry id'leriyle BİREBİR aynı string'ler).
- `src/thesis` testlerini yaz/koru.
- **Sahibi:** `specs/aku-sagbil.json`, `templates/aku-sagbil.js`, `registry.js` (yalnız aku-sagbil girdileri), `src/thesis/*sagbil*.test.js`.
- Çıktı: uygulama + kural → kanıt eşlemesi.

### L4 — aku-sagbil Doğrulama (L3 bittikten sonra)
- Gerçek export (L1'in zinciri), DOCX XML + LibreOffice PDF ölçümü.
- High-risk kuralların tamamı PASS olacak; kalanlar açıkça `UNKNOWN` envanteri + varsayılan davranış etiketi.
- **Sahibi:** `validation/aku-sagbil/*`, `reports/aku-sagbil.md`.

### L5 — MCBÜ İnceleme + Spec + Doğrulama
- `MCBU_Lisansustu_Tez_Yazim_Kilavuzu.docx`'i kaynak olarak (DOCX XML dahil) incele; mevcut `mcbu.js`'e karşı **fark raporu** çıkar (`reports/mcbu-lee-delta.md`): her kural için (a) kılavuz değeri + kanıt, (b) uygulanan değer, (c) sonuç: MATCH / FARK / KAYNAK SUSUYOR.
- `specs/mcbu-lee.json` yaz (kanıt bağlantılı, rule-taxonomy ile uyumlu).
- Fark varsa `templates/mcbu.js`'i **yeni id ile** düzelt: registry'ye `mcbu-lee-master-tr-v2` / `mcbu-lee-phd-tr-v2` ekle, v1'i koru. Fark yoksa dokunma.
- Gerçek export + ölçüm doğrulaması; kapak/onay geometrisinde ≤ 0.5 mm.
- **Sahibi:** `specs/mcbu-lee.json`, `reports/mcbu-lee*.md`, `validation/mcbu-lee/*`, `templates/mcbu.js` + `registry.js` (yalnız mcbu girdileri — L3 ile çakışmamak için L3'ten sonra değil, L3 registry yazımını bitirdikten sonra dokun; ikisi de registry'ye yazıyorsa L6'ya bildir, sırayla uygulasın).

### L6 — Entegrasyon, Regresyon, Teslim
- Tüm hedefler bitince: tam test suite + regresyon (motor değiştiyse tamamlanmış şablonları yeniden doğrula).
- Coverage matrisini güncelle (`orchestration/reports/coverage-matrix.*`): her hedef için kural sayısı / kanıtlı / UNKNOWN / documented-default.
- `progress.json`'u güncelle (TEK yazar sensin), commit'leri at (aşağıdaki git kuralları).
- `orchestration/reports/PILOT-TEMSIL.md` yaz: ne yapıldı, ölçüm sonuçları, açık riskler, kalan işler.

---

## 6. DOĞRULAMA KURALLARI (her ajan için bağlayıcı)

1. **Kanıt ya da yok.** Hiçbir üniversiteye özel değer uydurulmaz. Kaynak sustuysa `UNKNOWN` + Tier-4 varsayılanı + uyarı; asla sessiz dolgu.
2. **Gerçek export zorunlu.** Testlerin geçmesi yetmez; çıktı gerçek pipeline'dan (export.mjs) üretilip ölçülecek.
3. **Ölçüm, göz değil.** PDF: `pdfmeasure.py` ile bbox/font/sayfa; DOCX: XML (sectPr marj, rPr font/punto, pPr spacing/indent, numPr başlık numaralandırma, header/footer sayfa numarası alanı). Tolerans ≤ 0.5 mm (explicit geometri).
4. **Üniversite izolasyonu.** AKÜ'den MCBÜ'ye (veya tersine) değer kopyalanmaz; motor YETENEKLERİ ortak olabilir.
5. **Çelişkiler sessizce çözülmez:** kaydet (`CONFLICT`), güncellik/özgüllük kuralıyla çöz ya da açıkta bırak.
6. **PASS/FAIL/BLOCKED** tanımı AGENTS.md §16. Hedef kapanışı `PASS` veya `PASS_WITH_DOCUMENTED_DEFAULT`; `UNKNOWN` envanteri her zaman ekli.

## 7. BİTİŞ KAPISI (her hedef için)

KAYNAK → SPEC → UYGULAMA → GERÇEK EXPORT → BAĞIMSIZ ÖLÇÜM → PASS (veya PASS_WITH_DOCUMENTED_DEFAULT) → REGRESYON → CHECKPOINT

## 8. GİT KURALLARI

- Anlamlı aşama sonlarında commit (L6 sırayla, temiz mesaj: `mcbu(lee): delta report + spec`, `aku(fbe): tier-4 closure` vb.).
- `node_modules`, build cache, geçici extraction'lar commit edilmez.
- Büyük diff'lerde önce kaynağına bak.

## 9. ÇIKTI (iş bitince tek final rapor)

1. Her hedef için durum (PASS / PASS_WITH_DOCUMENTED_DEFAULT / FAIL / BLOCKED) + high-risk kural sonuç sayıları.
2. Üretilen gerçek dosyalar (pdf/docx yolları).
3. UNKNOWN + documented-default envanteri.
4. Kullanıcı akışı doğrulaması: uygulamada şablon seçilebiliyor mu, DOCX/PDF iniyor mu?
5. Açık riskler + sonraki işler (kalan 30 target için hazır reçete: analyzer → delta → checker).

Kısıtlar: AGENTS.md'deki scope discipline — bu üç hedef dışına çıkma, ilgisiz refactor yapma, kural uydurma. Maliyet bilinci: küçük worker'lar, tekrar tekrar büyük kaynak okuma.
