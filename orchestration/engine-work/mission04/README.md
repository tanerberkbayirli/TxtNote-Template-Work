# Görev 04 — PDF'den kontrollü aktarım

Durum: TAMAMLANDI · 09.10.2026

PDF'nin yalnızca düz metne indirgenmesi yerine sayfa bazlı, düzenlenebilir ve
belirsizlikleri görünür bir aktarım akışı eklendi. Dosya → PDF içe aktar üzerinden
OCR dili ve otomatik/tüm sayfalar seçilir. Kaynak önizlemesi yanında metin, öğe türü,
okuma sırası ve tablo hücreleri düzeltilebilir. Açık uygulama seçimi mevcut belgeyi
atomik olarak değiştirir; iptal ve bozuk dosya mevcut içeriği korur. Akademik
editörün PDF seçimi de aynı akışı kullanır; Canvas ve DocumentPane aktarılmış
PDF'nin bütün bölümlerini tez düzenleyicisinde açar.

## Uygulama ve sınırlar

- PDF.js metin/konum ve raster görselleri okur; satır/paragraf, başlık adayı,
  boşluklara göre çok sütunlu sıra ve çizgili tablo hücreleri çıkarılır.
- Üst/alt kenar metni gövdeden ayrı tutulur ve önizlemede yeniden sınıflandırılabilir.
- Paketli Tesseract.js Türkçe/İngilizce OCR'yi cihazda çalıştırır. Metin/görüntü
  karışık sayfalar, eğim ve 90/180/270 derece yön denemeleri desteklenir.
- Özgün PDF baytları, sayfa önizlemeleri, kaynak token konumları ve bildirimler
  saklanır. Düzeltme özgün kanıtı değiştirmez. Her fiziksel sayfa, boş olsa bile,
  kalıcı modelde bir bölüm alır. Düzenleyicide yeniden akış kaynak sayfa sayısını
  değiştirebilir; fiziksel kaynak sayfaları kaynak raporunda korunur.
- Kalıcı rapor sayfa/koordinat konumu verir; JSON indirilebilir. Bildirimleri
  gördüğünü belirtmek `reviewed: true` anlamına gelmez; belirsizlikler temizlenmez.
- Formüller yerel matematik nesnesi olarak yeniden kurulmaz. Çizgisiz/karmaşık
  tablolar, vektör çizimleri, tam font eşlemesi ve keyfi okuma sırası doğrulanmış
  sayılmaz. Çıkarılmayan anlamsal ayrıntı özgün PDF/önizlemede kalır. Tüm PDF'lerde
  kayıpsız nesne yeniden kurma veya Word/PDF piksel eşdeğerliği iddiası yoktur.
- Sınırlar: 64 MB girdi, 1000 sayfa, sayfa başına en çok 12 milyon render pikseli.
  Şifreli PDF için şifresiz kopya gerekir. Büyük belgelerin model/bellek maliyeti
  vardır; uzun belge performansı sonraki ilgili görevin konusudur.

Ana kod: `src/thesis/importPdf.js`, `src/thesis/pdf/{structure,model}.js`,
`PdfImportReview.jsx`, `ThesisEditor.jsx`, `AcademicEditor.jsx` ve iki editör router'ı.
Kaynak/şablon seçimi mevcut kalıcı modele bağlanır. OCR ve PDF varlıkları
`public/ocr` / `public/pdf-assets` içinde paketlidir; 209 dosya / 29.740.666 baytın
sürüm, lisans, kaynak ve SHA256 envanteri `bundled-assets.json` içindedir.
PDF.js 6.3.289, Tesseract.js 6.0.1, core 6.1.2, tessdata_fast 4.1.0 kullanıldı.
OCR için çalışma anında CDN veya veri yüklemesi gerekmiyor.

## Kabul kanıtları

- Son kodda 778/778 test geçti; hata/atlama/iptal yok (`unit-tests.log`).
- Son üretim derlemesi geçti (`build.log`). Tam masaüstü CSP ilkesi altında
  üretim PDF/OCR paketi üç sayfayı okudu; dış istek ve CSP ihlali yok
  (`csp-verification.json`). Yalnızca yerel worker ve WebAssembly izni eklendi.
- Dondurulmuş geliştirme girdileri: SRC02 43 sayfalık resmî dolu örnek ve EDGE_SCAN
  üç sayfalık sentetik görüntü taraması. SRC08/SRC10 son kabul için ayrılmıştır;
  bu görevde kullanılmadı (`inputs.json`). EDGE_SCAN gerçek taranmış tez değildir.
- Üretim adaptörü 46 sayfanın tamamını aktardı; SRC02'de 41 metin + 2 karışık OCR
  sayfası, EDGE_SCAN'de 3 OCR sayfası var. Toplam 15 tablo, 11 görsel adayı ve
  8.359 etkin DOM nesne kimliği bulundu; yinelenen kimlik yok
  (`source-verification.json`). Çıkarım adayları doğru tablo/görsel semantiği
  garantisi değildir.
- Bağımsız PyMuPDF denetimi özgün PDF baytlarının aynılığını, her çıkarılan token'ın
  gövde veya ayrı üst/alt bilgi hikâyesinde tam bir kez korunmasını doğruladı.
  SRC02'nin her sayfasında bağımsız yerel metin karakterleri tam bulundu.
  Tablo kutuları/görsel sayıları ayrıca kaydedildi; farklı algoritmaların tablo
  kutuları birebir değildir ve eşit tablo sayısı kabul koşulu yapılmadı
  (`oracle-verification.json`).
- EDGE_SCAN kaynak işaretlerinin üçü bulundu, üçüncü sayfanın 90° yönü düzeltildi.
  Kaynak metinle karakter çokluğu örtüşmesi yaklaşık %96,3 / %93,1 / %84,8.
  Bu bir sözcük doğruluğu veya matematik yapı doğruluğu ölçüsü değildir; OCR
  kusursuz denemez ve açık düzeltme/rapor gerektirir.
- Gerçek dosya seçimi, hazırlık/önizleme/işlem iptali, bozuk dosyada korunma,
  uygulama öncesi açık seçim, metin/tür/sıra/hücre düzeltmesi, atomik uygulama,
  gerçek contentEditable düzenlemesi ve kaydet/yeniden aç geçti
  (`browser-verification.json`, `browser-review.png`, `browser-final.png`).
- Gerçek DocumentPane ve Canvas üzerinden akademik PDF'nin üç kaynak bölümü,
  iptal/uygulama ve yeniden açma doğrulandı; tarayıcı hatası veya dış istek yok
  (`academic-verification.json`, `academic-pane.png`, `academic-canvas.png`).
- 23 genel regresyon hedefi Görev 03 ile aynı: **881 PASS, 836 SKIPPED, 6 FAIL,
  32 INFO**. Önceki ADÜ Ziraat 1, AKÜ Sağlık 1 ve AKÜ SBE 4 ölçüm hatası aynı
  beklenen/gerçek/tolerans değerleriyle kaldı. Word kontrolleri çalıştırılmadı;
  SKIPPED başarı sayılmadı (`completion.json` içindeki karşılaştırmalar).

## Kontrol noktası ve yeniden denemeler

Kullanıcının mola isteğindeki `checkpoint.json` tarihsel kayıt olarak korundu;
devam başlangıcında 290 kayıtlı dosyanın hash kontrolü geçti. Sonraki değişiklikler
nedeniyle eski checkpoint'in güncel dosyalara karşı doğrulanması beklenmez.
Görev 01–03 kapanışları da yeniden sabitlenmedi.

İlk genel tur kullanıcı isteğiyle kesildi. Bu turda AKÜ FBE'nin PDF aktarımı
sayfalama-hazır güvenlik kontrolüyle durdu; yeni seri çalıştırma tamamlandı.
Devam turunda stil önceliği `base` indirmesi zaman aşımına uğradı; ayrı seri
yeniden denemede dört varyant tamamlandı. İlk hata günlükleri korundu. Hataların
kesin kökeni belirlenmiş değildir; ölçüm veya güvenlik eşiği gevşetilmedi.
`regression.log`, `resume-manifest.json`, `retry-manifest.json` ve ilgili
`run/check.log` kayıtları bu ayrımı korur. Checker, Word kontrolleri atlandığında
başarılı ölçümlerle birlikte sıfır olmayan çıkış kodu da verebilir; karar rapor
durumları üzerinden verildi.

## Yeniden çalıştırma

Yerel Vite: `127.0.0.1:5176`. Node/Python için Codex paketli çalışma zamanı
kullanıldı. PyMuPDF `orchestration/tools/measurement-packages` üzerinden yüklenir.

1. `node orchestration/engine-work/verify_mission04_sources.mjs`
2. `python orchestration/engine-work/mission04_oracle.py`
3. `node orchestration/engine-work/verify_mission04_browser.mjs`
4. `node orchestration/engine-work/verify_mission04_academic.mjs`
5. Frontend üretim derlemesinden sonra `node orchestration/engine-work/verify_mission04_csp.mjs`
6. Sabit kapanış bütünlüğü: `python orchestration/engine-work/close_mission04.py`

Yeni kanıtları dondurma yalnızca kabul sağlanınca `--freeze` ile yapılır.
Kapanış `completion.json` / `completion-verification.json` içindedir.
Kullanıcıdan beklenen dosya veya açık Görev 04 işi yok. Görev 05'e başlanmadı.
