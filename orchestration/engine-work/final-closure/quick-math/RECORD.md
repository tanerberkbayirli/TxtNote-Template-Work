# Küçük denklem önizleme hataları — 12.10.2026

Bu turda üç dar kapsamlı hata kapandı:

1. DOCX delimiter nesnesinde mevcut ama boş `begChr` / `endChr` artık varsayılan paranteze dönüşmüyor. Eksik özellik varsayılanı kullanır; mevcut boş özellik karakteri gizler.
2. Birden fazla `m:e` argümanı arasına varsayılan veya özel `sepChr` ekleniyor. Boş ayırıcı ve tek argüman da korunuyor.
3. `noBar` kesirler çizgisiz yığın, `lin` kesirler aynı satırda kesir eğik çizgisiyle gösteriliyor. Varsayılan çizgili kesir korunuyor. `skw` ve genel matematik yüksekliği bu düzeltmenin kapsamında değil.

Üretim değişikliği: `engine/src/docx/equationPreview.js`. Kaynak OMML değiştirilmedi; yeni içe aktarımlarda uyumluluk önizlemesi düzelir. Daha önce saklanmış önizlemeler otomatik göç ettirilmedi.

## Doğrulama

- Altı yeni regresyon testi; hedefli denklem turu 19 PASS / 0 FAIL.
- Son üretim koduyla tam birim turu: **984 PASS / 0 FAIL / 0 atlama** (`unit.log`). Derleme PASS (`build.log`); mevcut büyük paket uyarısı sürüyor.
- `generate.mjs` → `roundtrip.json`: 10 örneğin DOCX dışa aktarımında özgün OMML ağaçları aynı kaldı; yeniden içe aktarılan önizleme özellikleri doğrulandı.
- `check-browser.mjs` → `browser.json`: gerçek Chrome 10 PASS / 0 FAIL, 0 sayfa hatası; boş parantez, ayırıcı, çizgisiz kesir ve doğrusal pay/payda konumu kontrol edildi. Chrome MathML gliflerin mürekkep sınırlarını döndürdüğü için a/b başlangıç yükseklikleri değil ortak alt kenarları ve yatay konumları karşılaştırıldı. `chrome.png` görsel incelendi.
- `word2pdf.ps1` → `word.pdf`, `word-info.json`: yalnız kendi başlattığımız Word örneği kullanıldı (PID 27496) ve kapatıldı. `check-word.py` → `word-check.json`: gerçek Word 10 PASS / 0 FAIL. Kesir çizgisi PDF çizim nesnesiyle, doğrusal kesir aynı satır konumuyla doğrulandı. İki PDF sayfası görsel incelendi.

Davranış kaynakları: [Microsoft BeginChar](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.math.beginchar?view=openxml-2.7.2), [SeparatorChar](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.math.separatorchar?view=openxml-3.0.1), [Fraction](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.math.fraction?view=openxml-3.0.1).

## Kalan durum

SRC09/SRC10 uzun belge kabulü ve genel kabul bu turda yeniden çalıştırılmadı. Son ölçümler tarihsel olarak SRC09 178/180 sayfa, 44/157 kayık açılış; SRC10 91/91, 8/75 kayık açılıştır. Bu küçük düzeltmeler bu sayıları iyileştirdi diye bir iddia yok. Kaynak taramasında SRC09'da tek argümanlı ve dolu köşeli parantezli bir delimiter, SRC10'da sıfır delimiter görüldü; iki kaynakta da açık kesir türü bulunmadı.

Denklem yüksekliği, yüzen şekil, bölünen tablo ve diğer uzun belge akış sorunları açık. TxtEngine 1.0 genel kabulü verilmedi. Commit yapılmadı. Kendi Vite sunucumuz (5193) testlerden sonra kapatıldı; başka süreçlere dokunulmadı.
