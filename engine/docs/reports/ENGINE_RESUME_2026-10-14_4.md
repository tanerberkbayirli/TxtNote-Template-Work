# Kalan işleri kapatma çalışması — 14.10.2026

Kullanıcının devam ve açık işleri bitirmeye ağırlık verme talebiyle çalışıldı. Genel kabul **FAIL**; hiçbir eşik veya özgün Word referansı değiştirilmedi.

## Kapanan alt hata: SRC09 s.91 Pareto açılışı

`engine/src/docx/drawingPreview.js` doğrulanan toplulaştırılmış ChartEx Pareto önbelleğine SVG önizleme ekliyor. Tek sütun serisi ve ona bağlı kümülatif çizgi dışında türler, seyrek/geçersiz/negatif sayısal önbellekler mevcut yedek yolda kalıyor. Aynı kategori değerleri toplanıyor ve azalan sıraya konuyor. `importDocx.js` yalnız desteklenen yerel alternatif dalını seçiyor; kaynak/yedek ve paket verileri silinmiyor.

Grafik ilk görsel kontrolde çok sütunlu kabın RTL yönünü miras aldığı için kategori etiketleri sütunlara taşıyordu. Önizlemeye açık LTR SVG yönü eklenerek ankraj sorunu düzeltildi. Bu davranış için küçük Chrome kontrolü ve kaynak SVG yönü regresyonu mevcut. Tam Word grafik stil/ölçü eşliği iddia edilmiyor.

PDF yazıcısının SVG'yi atlayan eski yolu, yeni önizleme nedeniyle özgün grafik resmini kaybetmemeli. `layoutPdf.js` ChartEx alternatifinin gizli kaynak resmini görünür önizlemenin ölçüsüyle PDF'e taşıyor. Kaynak fallback görselinin yerel DOCX grafiğine ek ikinci nesne olarak çıkmaması da korunuyor. Küçük gerçek kaynak kontrolü: **1 yerel DOCX grafiği / 0 ek resim**, **1 sayfalık PDF / 1 grafik resmi**; PDF'teki 479×752 pikselin RGB değerleri kaynak önbellekle birebir aynı. Kategori etiketlerinin sütunların altında kaldığı gerçek DOM geometrisiyle kontrol edildi. Kanıt: `chart-controls/export.json`, `pdf-image.json`, `control.export.docx`, `control.export.pdf`, `small-full.png`.

Şema kaynağı: [Microsoft ST_SeriesLayout](https://learn.microsoft.com/de-at/openspecs/office_standards/ms-odrawxml/2ea3f228-fe39-4f55-b8ec-cee89596e926). Sayfa kanıtı, yeniden üretilmemiş özgün `mission01/references/SRC09/word.pdf` ile karşılaştırıldı.

Son taze fixture: `TxtNote/frontend/tests/generated/PARETO14_SRC09.fixture.json`.
Son uzun ölçüm: `engine-work/resume-20261014-4/final-export09/`. PDF koruması sonrası taze içe aktarımda sayfa/kelime koordinatları `final09/` ile birebir aynı: her iki `SRC09.pages.json` SHA-256 değeri `A0E66D1FCBFB9C644B9867F82B8C42AE666E31ECE91B8C4D11913BA330520704`.

- Word/editör: **180/180 sayfa**.
- Kayık açılış: **11/157** (önce 12/157); tamamı EK-2'de başka fiziksel sayfada.
- Aynı sayfada kayık başlangıç: **0** (önce 1; s.91).
- Metin kapsamı: **0,98087** (önce 0,97919); 0,995 kabul eşiğinin altında.
- Tarayıcı hatası: **0**.

`verified09/` yön düzeltmesinden önceki ara sonuçtur (0,98011); son kanıt diye kullanılmamalı. `pareto09/` ise yerel dal seçiminin ilk başarısız denemesidir ve tarihsel olarak tutuldu.

## Kod doğrulaması

- Hedefli Pareto + yerel çizim paketi: **14/14 PASS**. Kategori toplama/sıralama, kümülatif bitiş, geçersiz veride yedeğe dönüş, desteklenen alternatif dal ve tek düzenlenebilir yerel DOCX grafiği kontrol edildi.
- Tam frontend/motor: **1047/1047 PASS**, 0 atlama (`final-unit.log`).
- Üretim derlemesi: **PASS** (`final-build.log`); büyük paket uyarısı mevcut. İlk sandbox derlemesindeki worker `realpath EPERM`, izinli derleme ile aşıldı; ürün derleme hatası olarak kaydedilmedi.

## Diğer çalışmalar ve sınırlar

SRC10 s.57 için sekiz küçük liste/düz paragraf sınır DOCX'i ve Chrome ölçümü üretildi (`list-controls/`). Word COM kontrolü tamamlanmadı; bu tur açılan ve PID'si doğrulanan gizli Word örnekleri kapatıldı. Mevcut kullanıcı Word süreçlerine dokunulmadı. Bu kontroller Word PASS değildir; kanıtsız dikey boşluk ayarı üretime alınmadı. SRC10 s.57/75 açık ve uzun ölçümü önceki turdaki **91/91, 2/75, 0,99565** olarak tarihsel sürümüyle korunuyor.

Güncel 20 örnekli etkileşim/kaydet-aç kontrolünün sonucu ayrı `interaction/result.json` dosyasına yazılır. İlk test yalnız ana içerik değişimini izlediği için çok bölümlü belgede örnek üretmedi; düzeltilen ilk koşu 9 örnekten sonra sayfa yeniden yüklenmesiyle kesildi. Sonraki koşu 18 örnekte kesildi; Vite kaydında `ThesisEditor.jsx` HMR güncellemeleri vardı. Başarısız koşular `interaction/initial-probe-failure.json`, `reload-probe-failure.json`, `eighteen-probe-failure.json` olarak korunuyor. `watch:null` proje ayarıyla birleştirilirken izleyiciyi kapatmadığından son bağımsız test sunucusunda izleyici açıkça kapatıldı, HMR devre dışı bırakıldı ve bağımlılık önbelleği diğer sunuculardan ayrıldı (`server.mjs`, port 5203).

Kalan ürün işleri: SRC09 EK-2'nin 11 fiziksel açılışı; kalan kapsam kaybı ve s.97 şekil geometrisi; SRC10 s.57/75; performans/çıktı kabulü ve bunlar sonrası tek kaynak sürümünde tam seri `verify.mjs`. Pareto açılışı kapanışı tüm ana görevin kapandığı anlamına gelmez.

## Kapanan alt kapı: güncel 20 örnekli etkileşim ve kaydet-aç

Son yalıtılmış koşu **PASS** (`interaction-isolated.log`, `interaction/result.json`, `summary.json`). Bu koşu son PDF/fallback koruması dahil kaynak sürümünde, taze `PARETO14_SRC09` ile çalıştı. İzleyici kapalı ve HMR devre dışı; önbellek ayrılmıştır. Önceki kesilen koşular bunun yerine kullanılmadı.

- **20/20** gerçek yaz/geri al örneği; her döngüde uyumluluk HTML'i birebir geri geldi ve **180 sayfa** korundu.
- Kaynak HTML bütünü ilk haline döndü (`authorRestored=true`); sunum kabuğu kayda girmedi.
- Gerçek senkronizasyon payload'ı ile JSON kaydet/aç sonrası belge modeli birebir eşit (`save.documentEqual=true`).
- Kaydedilen not ayrı fixture olarak gerçek test sayfasında yeniden açıldı; içerik/model eşit, **180 sayfa**, tarayıcı hatası **0**.
- Yükleme **32,606 sn**, yeniden açma **33,211 sn**. Örnek süreleri ayrıca kaydedildi; önceden belirlenen sayısal hız hedefi veya eşleşmiş bu-tur hız karşılaştırması yok. Bunlar hızın kabul edildiği anlamına gelmez.

Bu alt kapı SRC09'un 11 sayfa farkını, eksik kapsamını, uzun belge PDF/font/Word kabulünü veya genel `verify.mjs` sonucunu kapatmaz. Tam seri kabul, bilinen bu ürün hataları dururken gereksiz yere tekrar çalıştırılmadı.
