# SRC09 — 12.10.2026, Codex ilerleme kaydı

**Durum: AÇIK / genel kabul FAIL.** SRC09 bitmedi. Kabul eşikleri değiştirilmedi.

## Korunan değişiklikler

- `equationPreview.js` ve `importDocx.js`: Word'de yalnızca tek denklem içeren paragraf ile yanında metin, korunmuş boşluk, sekme veya başka denklem bulunan paragraf ayrıldı. İkinci grupta toplam/integral limiti, kaynak `undOvr` yazsa bile satır içi küçük operatörün yanına gelir. Yer imi ve biçimlendirme işaretleri paragrafı satır içine çevirmiyor. Ham OMML dışa aktarım otoritesi olarak korunuyor.
- `projection.js`: otomatik satır aralığında Cambria Math'ın yüksek kesir/üst-alt limitli denklemlerine doğal matematik yüksekliğinin yanında paragrafın ek satır payı veriliyor. `MATH.MathLeading = 300/2048 em`. Tam/sınırlı satır aralığına ve özel matematik fontuna bu ölçü uygulanmıyor. Belgenin açık matematik fontu içe aktarımdan görünüm CSS'ine taşınıyor.
- İki test dosyasında beş yeni regresyon kontrolü eklendi. Eski kaydedilmiş denklem önizlemeleri otomatik göç ettirilmedi; sonuçlar yeni içe aktarım içindir.

## Doğrulama

- Tam frontend testleri: **992 PASS / 0 FAIL**; üretim derlemesi PASS. İlk sandbox derlemesindeki `import.worker.js` realpath EPERM hatası, normal dosya erişimiyle tekrar çalıştırıldığında kalktı. Mevcut modül/chunk uyarıları sürüyor.
- Gerçek Word: `nary.docx` → `nary.word.pdf`; altı bağlamda limitlerin yatay konumu ve operatör genişliği kontrol edildi: **6/6 PASS** (`check-word-context.py`, `word-context-check.json`). Yalnız dikey konum kontrolü yan limitleri yanlışlıkla üst-alt sayabileceğinden yatay konum da doğrulandı.
- Gerçek Chrome: aynı altı bağlamda MathML ve limit geometrisi **6/6 PASS** (`check-context.mjs`, `context-check.json`, `nary.chrome.png`).
- DOCX dışa aktar/yeniden içe aktar: altı denklemin OMML ağacı kaynakla aynı; yeniden açıldığında bir üst-alt, beş yan limit görünümü korunuyor (`nary-roundtrip.docx`).
- Son ürün CSS'iyle izole denklem satır ölçümleri, Word'ün 1 ve 1,5 satır kesir/etiketli kesir/toplam/metinli kesir örneklerinde **8/8 durumda 1 pt içinde** yaklaşıyor. Bu sınırlı örnek başarısı bütün denklem/matris modelinin kapandığı anlamına gelmiyor (`final-equations.json` baseline, `height-check.json`, gerçek Word: `../resume2/exp/eqprobe.word.pdf`).

## Tam belge sonuçları

Ölçüm: mevcut Chrome, 1400×1000, yerel fontlar, `MulticolColumnWrapping`, yeni DOCX içe aktarımı; `long/measure.mjs` ve değişmemiş `long/compare-breaks.py`.

- **SRC09 başlangıç:** 181/180 sayfa, 32/157 kayık açılış, kapsam 0,9691 (`fresh-baseline/cmp.json`).
- **SRC09 son:** 181/180 sayfa, **31/157 kayık açılış**, kapsam **0,9691** (`final/cmp09.json`). Tarayıcı hatası 0. Yükleme 37,57 sn; tek tuş çağrısı 81 ms; yazma ve yerleşme 6,24 sn. Bunlar tek koşu ölçümüdür, performans kabulü değildir.
- **SRC10 son:** 91/91 sayfa, **8/75 kayık açılış**, kapsam **0,99605**; gerileme yok (`final/cmp10.json`). Tarayıcı hatası 0. Yükleme 6,24 sn; yazma ve yerleşme 1,73 sn.
- Ölçüm sürücüsünün `pageErrors` listeleri boş olsa da Vite terminalinde `ResizeObserver loop completed with undelivered notifications` bildirimleri görüldü. Bu nedenle tüm tarayıcı çalışma zamanının hatasız olduğu iddia edilmiyor. Son kaynak/fixture SHA-256 değerleri `final/source-hashes.json` içinde.
- Önceki rapordaki SRC09 31 sonucu eski saklanmış önizlemelerle alınmıştı. Bu turun iyileşmesi yalnızca aynı güncel içe aktarım yöntemindeki **32→31** farkıdır. Geçmiş 44→31 farkının tamamı bu tura yazılmadı.

## Geri alınan / uygulanmayan deneyler

- Matris satırlarına ölçü strutu ekleme: izole matris satır mesafesini yaklaştırsa da toplam yüksekliği tutturmadı ve SRC09'u yeniden 32 kayık açılışa çıkardı. Ürün kodu ve testinden geri alındı; deney modülü yalnız kanıt klasöründe tutuldu. Son fixture'lar matris denemesi geri alındıktan sonra üretildi.
- Yalnız başlık içeren liste kapsayıcılarını düzleştirme: 64 kapsayıcıda tam belge sonucu iyileşmedi. Ürüne uygulanmadı.
- Tablo devam kodundaki önceden mevcut değişikliklere dokunulmadı. Sayfa sayısını zorla eşitleme, eşik gevşetme veya metin kapsamını kabulden çıkarma yapılmadı.

## Kalan somut işler

1. SRC09 s.48–51: kare sarmalı yüzen şekillerin metin akışına dışlama alanı uygulaması eksik; Word'deki yaklaşık 53 pt metin itişi editörde yok. Çizimi görünür kılmak tek başına akışı düzeltmiyor.
2. s.100–107: matris doğal yüksekliği ve sonraki tablo/başlık akışı. Denklem bağlamı düzeltmesi bir açılışı kurtardı, bölgeyi tamamen kapatmadı.
3. EK-2: yüzen uzun tablonun bölünen satır devam yüksekliği ve s.150–180 akışı.
4. Kapsam 0,9691: token eşleme tanısı kayıpların önemli bölümünü grafik/şekil içi metinlerde topluyor (özellikle s.71–73, 85–86, 91, 96–97). Bu tanı karakter düzeyi kabul hesabından öncedir; tek başına içerik kaybının kesin sınıflandırması değildir (`coverage-diagnosis.json`).
5. Düzeltmelerden sonra tam seri kabul yeniden koşulmalı. Bu tur yalnız uzun belge, hedefli Word/Chrome, birim ve build doğrulamasıdır.

## Yeniden üretme

`node orchestration/engine-work/final-closure/src09-active/import.mjs SRC09 SRC10` ile taze fixture oluşturulur. Vite 5193'te çalışırken `THESIS_BASE_URL=http://127.0.0.1:5193`, `LONG_FIXTURE_ID=SRC09_ACTIVE` veya `SRC10_ACTIVE`, `LONG_MEASURE_OUT=orchestration/engine-work/final-closure/src09-active/final` ile `long/measure.mjs` çalıştırılır; ardından `long/compare-breaks.py` aynı klasörle çağrılır. Karşılaştırıcının çıkış kodu 1 bu koşuda beklenen gerçek FAIL sonucudur.

Kullanıcının mevcut çalışma ağacı korundu; commit/reset/clean yapılmadı. Bu tur açılan 5193 Vite sunucusu doğrulama sonunda kapatıldı; diğer sunucu ve Word/Chrome süreçlerine dokunulmadı.
