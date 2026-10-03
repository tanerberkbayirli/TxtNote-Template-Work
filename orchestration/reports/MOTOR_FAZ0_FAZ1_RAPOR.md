# MOTOR.md — Faz 0 ve Faz 1 raporu (2026-10-03)

Dal: `integrate/aku-mcbu`. Commit'ler: `429a285`, `6174bbc`, `88f7827` (Faz 0) · `954f7a1`, `6f919a6`, `c705c7f` (Faz 1).

## Özet

| Faz | Durum | Sonuç |
|---|---|---|
| 0 — açık işler + checker regresyon kapısı | **TAMAM** | AKÜ Coğrafya ve AKÜ Matematik **DONE** (Tier 1, Word dahil 0 FAIL). `check.mjs --all` 10 hedefte çalışıyor, sadece bilinen/listelenmiş FAIL'ler var. |
| 1 — yetenek kataloğu + büyük dosyaların bölünmesi | **TAMAM** | `CAPABILITIES.md` (105 anahtar, 14 bilinen eksik) ve senkron testi; 3 büyük dosya davranış değişmeden bölündü. |

## Faz 0 ayrıntı

| Adım | Bulgu / yapılan | Kanıt |
|---|---|---|
| 0.1 Matematik semboller tablosu | Motor gerilemesi **yoktu**: checker fixture'ında tablo yerine tab'lı paragraflar vardı. Fixture düzeltildi. Tanım sütunu (70,7 mm) için motora **yazar tanımlı sütun genişliği** eklendi: `<col data-col-width="%">` (editör + DOCX `tblGrid`/`tcW`). | Matematik `--word`: 46 PASS / 0 FAIL |
| 0.2 Tablo hücre boşluğu | Yeni opt-in anahtar `tables.cellPadding {topMm,rightMm,bottomMm,leftMm}` (editör CSS, DOCX `tcMar`, bölüm override). Varsayılan davranış değişmedi. Coğrafya değeri resmî DOCX `styles.xml` varsayılan tablo stili *NormalTablo*: üst/alt 0, sol/sağ 108 tw = 1,905 mm (**MEASURED**). | Coğrafya satır aralığı PDF 4,725 / Word 4,699 mm (beklenen 4,7); `--word`: 45 PASS / 0 FAIL |
| 0.3 Sosyoloji kenar boşlukları | 45/45/45/30 mm **doğru** (rehber metni, EXPLICIT). DOCX'teki 25 mm rehberin kendi sayfa düzeni. Değişiklik yok. | `aku-sosyoloji-lisans.CONTEXT.md` |
| 0.4 Regresyon kapısı | `check.mjs --all` eklendi; `page_labels` için `open_end` (fixture uzunluğuna bağlı sayfa sayısı artık beklenen değer değil). 8 yeni hedefe checks + fixture yazıldı; İSG ve AFSÜ LEE için resmî Word referansı önbelleğe alındı (mevcut render'lar kopyalandı, yeniden render yok). | aşağıdaki tablo |
| 0.5 Kapanış | Coğrafya + Matematik `progress.json` → DONE; context pack'ler güncellendi. | |

### `check.mjs --all` (10 hedef, ~2 dk, Word hariç)

| Hedef | PASS | FAIL | Diğer |
|---|---|---|---|
| aku-cografya-lisans | 39 (+6 Word) | 0 | DONE |
| aku-matematik-lisans | 40 (+6 Word) | 0 | DONE |
| aku-felsefe-lisans | 15 | 0 | |
| aku-felsefe-seminer | 15 | 0 | |
| aku-sbe | 18 | 0 | |
| mcbu-tip-uzmanlik | 44 | 0 | |
| afsu-eczacilik-proje | 19 | 0 | |
| afsu-lee (YL + doktora) | 73 | 0 | 1 CONFLICT |
| aku-isg-tezsiz-proje | 17 | **2** | |
| afsu-tip | 42 | **1** | |

## Faz 1 ayrıntı

| Adım | Yapılan | Doğrulama |
|---|---|---|
| 1.1 Katalog | `TxtNote/frontend/src/thesis/CAPABILITIES.md`: alan başına tablo (ihtiyaç → şablon anahtarı → değer → varsayılan → editör/PDF/DOCX desteği → test), 14 maddelik "Bilinen eksikler" (MOTOR fazlarına bağlı). `thesisCapabilities.test.js`: `validation.js`'in kabul ettiği her anahtar katalogda yoksa test düşer (mutasyon testi ile doğrulandı). AGENTS.md §21'e "önce kataloğa bak" kuralı eklendi. | npm test 678/678 |
| 1.2 Bölme | `ThesisRibbon.jsx` → `ribbon/` altında 11 dosya (334 satır kaldı); `engine.js` 624 → 338 satır + `engineCss.js`; `export.js` 1004 → 138 satır + `docx/` altında 7 modül + `pdfFallback.js`. Saf taşıma, döngüsel import yok. | Her bölmeden önce/sonra `--all` birebir aynı; DOCX parçaları bayt düzeyinde aynı (yalnız zaman damgası farklı); ribbon'un 6 sekmesi tarayıcıda açıldı, konsol hatası yok; build OK |

## Açık konular (sizin kararınız veya sonraki fazlar)

1. **İSG — 2 gerçek FAIL:** (a) iç kapak başlığı 3. sayfaya taşıyor, roman numaralar bir kayıyor; (b) footer mesafesi 12,5 mm olmalı, DOCX'te 17,39 mm.
2. **AFSÜ Tıp — dipnot satır aralığı:** tek aralık 9,74 mm beklenirken 10,84 mm (motor maddesi A4 → Faz 2.2).
3. **AFSÜ LEE — CONFLICT:** resmî doktora şablonu kapak sayfa numarasında Calibri 11, rehber "her yerde Times New Roman". Mevcut kural (şablon XML > rehber metni) Calibri'yi destekliyor; onayınız gerekiyor.
4. **AFSÜ LEE — onay sayfası kenar boşlukları:** çıktımız 35,5 / 24,4 mm, beklenen 40 / 25 mm. Henüz check'e bağlanmadı; karar gerekiyor.
5. **Belirsiz kaynak yorumları (INFERRED):** "alt orta" sayfa numarası sayfa ortası mı (105 mm), metin bloğu ortası mı? AFSÜ Eczacılık, AFSÜ Tıp, MCBÜ Tıp'ta seçilen yorum check'lerde INFERRED olarak işaretli.
6. **Sütun genişliği sınırlaması:** editör CSS'i tipli `attr()` kullanıyor (yalnız Chrome 133+). Firefox/Safari'de sütunlar eşit bölünür → Faz 2.5.
7. **Checker sınırı:** `page_num` yalnızca alt 25 mm'de arıyor (AFSÜ LEE doktora roman numarası 270,5 mm'de).

## Maliyet

| Kalem | Subagent token |
|---|---|
| Faz 0 (tablo motoru, 4 hedef port + Sonnet düzeltme, 4 hedef Sonnet) | ≈ 720k |
| Faz 1 (katalog, 2 bölme) | ≈ 310k |
| **Toplam** | **≈ 1,03M** |

Ders: check yazımında Haiku (110k) yetersiz kaldı, Sonnet ile yeniden yazmak 133k tuttu → check yazımı doğrudan Sonnet'e verilmeli (MOTOR §7'ye işlendi).

## Sıradaki adım

Faz 2.1 — Word satır aralığı modeli (`auto`/`exact`/`atLeast`), ardından 2.2 (paragraf aralığı; AFSÜ Tıp dipnot FAIL'i burada çözülür).
