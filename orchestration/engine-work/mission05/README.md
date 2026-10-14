# Görev 05 — Font ve satır kırılımı

Durum: TAMAMLANDI · 09.10.2026

Arial J03/J04 satır hatalarının nedeni, paragrafın tamamına uygulanan sabit
kelime aralığının Word'ün son kelimeye bağlı sıkıştırma sınırını temsil
edememesiydi. `wordLineFit.js` satır başına karar veriyor;
`wordLineLayout.js` gerçek run stillerini ölçüp aynı kararı editöre uyguluyor.
Fontlar 1000 px ölçülüp özgün puntoya ölçekleniyor. Küçük Canvas fontlarında
yuvarlama, Calibri uzun URL son ekinde bir karakter fazla sığdırıyordu.
Bağımsız Word 0,05 pt ikili araması gerçek font ilerlemelerini doğruladı.

Uzun kelimeler geçici glyph parçalarıyla bölünüyor; son ek ve ardından gelen
kelimeler sonraki satır hesabına katılıyor. Sıkıştırma aralığı yalnızca gerçek
boşluklardan gelir. Kısa son satır doğal aralığını korur; doğal genişliği taşan
son satır Word gibi sıkıştırılır. Times New Roman/Arial/Calibri için kerning
kapalıdır. Mevcut satır aralığı, tab ve baseline kuralları korunur.

Geçici span/wbr sunumu kaynak kaydına sızmaz; özgün run'lar, kimlikler ve
biçim özellikleri yerinde kalır. Yeniden ölçüm seçimi korur, aynı ölçüm tekrar
uygulandığında DOM değişmez ve IME bileşimi sırasında ertelenir. Editör/PDF
aynı konumları kullanır. Kaynak Word run'ının ayrı fontu da PDF'ye gerçek font
programı olarak gömülür. Eksik font belge uyarısında adıyla görünür; PDF sessiz
font ikamesi yapmaz.

## Sabit kapsam ve kabul

- Görev 01 sözleşmesindeki SRC09, EDGE_STRUCTURE, SYN01, SYN02, SYN05 girdileri
  ve referans SHA256 değerleri `inputs.json` içinde doğrulandı. SRC08/SRC10
  ayrılmış son kabul girdileri kullanılmadı.
- SRC09 ve EDGE_STRUCTURE'dan, sonuçlara bakılmadan belirlenen ilk dört uygun
  doğrudan-run paragrafı kullanıldı; XML konumları kayıtlı. Bunlar tipografi
  alıntılarıdır. SRC09'un 180 sayfasının tümünde sayfalama eşdeğerliği iddiası
  yoktur; uzun belge akışı sonraki görevlerin konusudur.
- Özgün `engine-word-justify` fixture/check dosyaları değiştirilmedi. Taze
  başlangıç 19 PASS / 3 FAIL; son Word karşılaştırması 22 PASS / 0 FAIL.
  J03 satır/son-satır konumu ve J04 satır hataları kapandı.
- Yeni sabit `engine-mission05-typography` matrisi: üç font, 10/12 pt, iki yana
  ve sola hizalama; gerçek kaynak alıntıları, karışık kalın/italik ve Türkçe
  karakterler, uzun URL. 22/22 kontrol geçti. Sekiz örneğin toplam 204 satırı
  gerçek Chrome DOM'unda, uygulama PDF'sinde ve bağımsız Word PDF'sinde aynı
  (`final-typography`, `editor-pdf-lines.json`).
- Altı gerçek Word regresyonu: justify 22, pagefit 213, parity 148, structure
  136, style-precedence 64, phase52-justify 34 = 617 PASS; FAIL/SKIPPED yok
  (`final-word-manifest.json`). Satır aralığı ve sekmeler bu gruplarda kapsanır.
- Times New Roman/Arial/Calibri'nin normal, kalın, italik, kalın-italik toplam
  12 FontFile2 programının özgün SFNT family/PostScript adları ve gömme izni
  denetlendi. Ayrıca yalnızca yerel satır içi run'da kullanılan Arial gömüldü;
  bulunmayan run fontu uyarısı ve PDF reddi gerçek UI'da geçti
  (`browser-verification.json`, `inline-font.pdf`, `missing-font.png`).
- Yazma → geri al → yinele → kaydet/aç, temiz kalıcı kaynak, seçim korunması,
  IME erteleme/sonradan ölçüm ve biçim değişince sunum temizliği geçti.
- 785/785 test; hata/atlama/iptal yok (`unit-tests-verified.log`). Son üretim
  derlemesi geçti (`build-verified.log`). İlk sandbox derlemesinin EPERM dosya
  erişimi hatası `build.log` içinde korundu; aynı derleme tam erişimle geçti.

## Ölçüm okuyucusu düzeltmesi

Word PDF'si font değişiminde boşluğu bazen karakter olarak kodlamayıp sonraki
run'ı konumlandırır. Calibri italik geçişinde gerçek boşluk 2,252 pt, ölçülen
run aralığı 2,360 pt idi; önceki sabit 0,25 em = 2,490 pt eşiği iki kelimeyi
birleştiriyordu. `pdfmeasure.visual_lines` font değişiminde gömülü programın
gerçek boşluk ilerlemesini okuyor. `measurement-verification.json` özgün
Word PDF SHA256'sını, ham span'ları ve sayısal kanıtı kaydeder. Eski J03/J04
başarısız çıktıları yeni okuyucuyla da başarısız kalır. Kabul satırları,
fixture metni ve toleranslar değiştirilmedi.

## Sınırlar ve tekrar

Bu kapanış sabit kabul kümesinde ölçülmüş uyumluluktur; keyfi fontlar, bütün
Unicode shaping davranışları, her üniversite çeşidi veya tam tez piksel
eşdeğerliği değildir. Tab, denklem, açık satır sonu ve özel aynalı girinti
paragrafları mevcut özel yollarda kalır. Font bulunurluğu Canvas karşılaştırması
bir tanıdır; gerçek font kimliği PDF'deki SFNT programından doğrulanır.

Yerel Vite sunucusu açıkken `THESIS_BASE_URL=http://127.0.0.1:5176` ve
`CHECK_EXPORT_JOBS=1` ile `orchestration/tools/check.mjs --target
engine-mission05-typography --word` veya `--all --targets ... --word`
kullanılabilir. Node/Python/Chrome yollarını mevcut yerel runtime belirler.
`verify_mission05_browser.mjs`, `verify_mission05_lines.mjs` ve
`mission05_measurement.py` ek kanıtları yeniden üretir.

## Genel regresyon ve kapanış

23 hedef son kodda tamamlandı. Görev 04 ile aynı sonuçlar: 881 PASS, 836
SKIPPED, 6 mevcut FAIL, 32 INFO. Yeni hata veya yeni atlama yok. Genel turdaki
Word kontrolleri çalıştırılmadı; yukarıdaki altı ayrı gerçek Word grubunun 617
kontrolü atlamasız geçti. Mevcut hatalar ADÜ Ziraat'ta bir, AKÜ Sağlık'ta bir,
AKÜ SBE'de dört kontroldür; bu görevin kapanışı onları giderilmiş saymaz.

İlk turda ADÜ Ziraat ve AKÜ Felsefe sayfalama hazır kontrolüne takıldı;
AKÜ SBE'nin ilk varyantı PDF yerleşim raporu üretmedi; pagefit varsayılan
varyantında indirme zaman aşımı oldu. Dört hedef ayrı seri turda tamamlandı.
Özgün denemeler, raporlar ve log'lar korunuyor. Güvenlik kontrolleri, hazır
koşulları, kabul fixture'ları ve toleranslar gevşetilmedi. Bu denemelerin
kesin zamanlama nedeni belirlenmiş değildir.

`close_mission05.py --check` bütün kapanış önkoşullarını doğrular;
`--freeze` kaynak/kod/kanıt SHA256 envanterini oluşturur; seçenek verilmezse
`completion.json` içindeki envanteri yeniden denetler. Önceki görevlerin
kapanışları tarihsel kayıt olarak korunur. Kullanıcıdan beklenen dosya veya
Görev 05 için açık iş yok; Görev 06'ya başlanmadı.
