# Görev 06 — Bölümler ve sayfa geometrisi

Durum: **TAMAMLANDI · 10.10.2026**. Görev 07 başlatılmadı; kullanıcının talimatı bekleniyor.

Aynı belgede dikey/yatay sayfalar, bölüm kenar boşlukları, tek/çift sayfa başlangıcı, ilk/çift/tek üst-alt bilgi ve Roma/Arap numaralandırma tamamlandı. Gizlenen sayfa numarası sayılmaya devam ediyor; bölüm yeniden başlangıçları ve gerekli boş fiziksel sayfalar Word ile aynı sırada oluşuyor. Çelişen tek/çift başlangıç ve numara yeniden başlangıcı Word davranışıyla eşleştirildi.

Kaynak DOCX üst-alt bilgilerindeki düz metin, PAGE/NUMPAGES alanları, paragraf biçimi, boş paragraflar ve desteklenen sabit konumlu PAGE metin kutuları aktarılıyor. Kaynak belgenin ilk/çift/tek ayarlarına üniversite şablonu sızmıyor. Word'ün varsayılan kaynak fontu ve paragraf aralığı korunuyor. Özgün bölüm ölçüleri saklanırken üst-alt bilginin gövde alanına etkisi ayrıca hesaplanıyor; kullanıcı kenar boşluğu değişikliği editör ve DOCX'e birlikte uygulanıyor.

## Doğrulama

- Son kodla **818/818 test**, 180 test grubu; hata ve atlama yok. Görev 06 için 18 geometri testi var. Üretim derlemesi başarılı; mevcut büyük paket uyarısı sürüyor.
- Altı bağımsız gerçek Word regresyon grubu: **617 PASS**, hata ve atlama yok (`final-word-manifest.json`).
- Sabit SRC01, SRC04, SRC05, EDGE_STRUCTURE kaynakları ve SYN04 girişlerinin SHA256 denetimi geçti. Dört kaynaktaki **16 bölüm / 314 XML ve model kontrolü** başarılı.
- Özgün bölüm özellikleri, stiller, ayarlar ve üst-alt bilgi paket parçalarını koruyan kaynak alıntılarında **17 fiziksel sayfa** denetlendi. Editör PDF'si hem özgün alıntının Word render'ıyla hem dışa aktarılan DOCX'in Word render'ıyla aynı sayfa sırası, metin ve ölçüleri verdi. Ölçü toleransı 0,1 punto; gövde başlangıcı ve numara konumu toleransı 0,5 punto.
- Dikey/yatay, ön bölüm → ana metin → ekler, ilk/çift/tek bilgi, gizlenen numara, Roma/Arap başlangıcı ve çelişen parite matrisleri: **19 fiziksel sayfa** eşleşti.
- Üç tarayıcı senaryosunda %50/%100/%150 yakınlaştırma, yazma, geri al/yinele ve yeniden açma başarılı; bölüm özellikleri korundu, sayfa hatası oluşmadı.
- 23 genel regresyon hedefi önceki Görev 05 raporlarının kontrol kimliği/durumu ile birebir aynı: **881 PASS, 836 SKIPPED, 6 mevcut FAIL, 32 INFO**. Altı başarısızlık ADÜ Ziraat (1), AKÜ Sağlık (1), AKÜ SBE (4) hedeflerinde sürüyor. Atlanan Word kontrolleri başarı sayılmadı; gerçek Word kabulü yukarıdaki ayrı 617 kontroldür. Genel çalıştırıcının atlamalar nedeniyle sıfır olmayan çıkışları da kayıtta korunuyor.

## Kapsam ve kanıtlar

Kaynak alıntıları bölüm geometrisini izole eder; tam uzun tez sayfalama kabulü değildir. Başlıkla birlikte tutma, dul/yetim satır ve uzun belgede birikimli kayma Görev 07 kapsamındadır. Karmaşık üst-alt bilgi çizimleri, tablolar ve desteklenmeyen alanlar için konumlu uyarılar sürer; özgün kaynak paket korunur. Değişken kapak düzeni Görev 08 kapsamındadır.

Başlıca değişiklikler frontend `src/thesis` altında `pageLayout.js`, `sourcePageFrame.js`, `contentModel.js`, `layoutDocument.js`, `importDocx.js`, `docx/chromeImport.js`, `docx/projection.js`, `docx/properties.js`, `docx/sections.js`, `docx/paragraphs.js`, `engine.js`, `export.js`, `validation.js`, `schema.d.ts` ve editörde `ThesisSectionPages.jsx` dosyalarındadır. Testler `src/lib/thesisSectionGeometry.test.js` içindedir. Önceden var olan çalışma ağacı değişiklikleri korunmuştur.

Kök dizinden `node orchestration/engine-work/close_mission06.mjs` donmuş kapanış envanterini doğrular; `--check` sonuç koşullarını envanter karşılaştırması olmadan denetler. `completion.json` kod, girdi ve kanıt SHA256 kayıtlarını içerir. Yeniden çalıştırılabilir yardımcılar `mission06_sources.mjs`, `mission06_excerpts.mjs`, `mission06_fixture.mjs`, `mission06_variants.mjs`, `verify_mission06_sources.mjs`, `verify_mission06_pdfs.py`, `verify_mission06_browser.mjs` ve `mission06_render_qa.py` dosyalarıdır. Tarayıcı kontrolü 5176 portunda uygulama, PDF karşılaştırması PyMuPDF, bağımsız Word render'ları Windows Word gerektirir.

Ara denemeler ve başarısız hazırlık log'ları silinmedi. İlk Word turundaki iki hazır olma hatası, aynı girdiler ve gevşetilmemiş kontrollerle ayrı seri turda geçti; nihai kayıt `final-word-manifest.json` dosyasıdır. Son kodun test/derleme log'ları `unit-tests-final-code.log` ve `build-final-code.log` dosyalarıdır. Kaynak PDF ve matris raporları `source-pdf-verification.json`, `matrix-verification.json`; tarayıcı kaydı `browser-verification.json` içindedir.
