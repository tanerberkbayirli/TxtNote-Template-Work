# Motor düzeltme turu — 14.10.2026

Genel kabul **FAIL**; tüm görevler tamamlanmadı. Mevcut motor korunarak hedefli değişiklikler uygulandı. İlk turun ve devam turunun kanıtları aşağıdadır; güncel görev listesi `../MISSION.md` içindedir.

## Yöntem ve değişiklikler

- Önceki raporlardaki pahalı tam döngü yerine özgün Word PDF referansları yeniden kullanıldı. Fixture'lar güncel içe aktarıcıyla ayrı isimlerde üretildi; önceki kayıtların üzerine yazılmadı. Taze başlangıçta SRC09 zaten 180/180 ve 12 açılış farkı, SRC10 91/91 ve 6 fark verdi; eski 181/180, 17 ve 8 farkları güncel başlangıç olarak kullanılmadı.
- `engine/src/docx/drawingWrap.js`: şekli veya etkin önceki şekli olmayan paragraf, boşluk denetimi için kopyalanmadan geçiliyor. Eski yerleşim hesabı ilgili paragraflarda korunuyor.
- `engine/src/docx/shapes.js`: kaynak metin kutusu kendi Word hikâyesinin varsayılan kalın/italik biçimini kullanıyor, ankraj paragrafının biçimini almıyor. Açık paragraf/run stilleri hâlâ üstün. Kaynak modeline yazılmıyor.
- `engine/src/docx/projection.js`: bir düz paragraftan sonra gelen saf boş bölüm sonu işareti ek satır yüksekliği oluşturmuyor. Yalnızca kaynak DOCX'te, izleyen bölüm sürekli değilse uygulanıyor. Metin içeren son paragraflar, tablo sonları, continuous geçişler korunuyor. Kaynak paragraf/XML yerinde kalıyor.
- `mission07_fixture.mjs`: özgün varsayılan çıktı yolunu koruyan isteğe bağlı çıktı argümanı.
- Uzun belge ölçüm aracına salt okuma ve küçük DOM probe seçenekleri eklendi. Sayfa karşılaştırıcısı mevcut hizalamadan küçük kelime pencereleri ve fiziksel/same-page hata sayılarını raporluyor. PASS kuralları ve toleranslar aynı.

## Ölçüm ve doğrulama

Kanıt kökü: `../engine-work/resume-20261014/`.

- `baseline/SRC09.json` → `shape-fast/SRC09.json`: yükleme 49.448 → 28.618 sn (%42,1 azalma); yazı+yerleşme 36.813 → 18.260 sn (%50,4 azalma). Bu tek eşleştirilmiş çifttir; evrensel veya tekrarlı performans kabulü değildir. Sonraki salt okuma kontrolleri yaklaşık 28 sn verdi; eşzamanlı birim testiyle yapılan 64 sn koşu bir hız kabulü olarak kullanılmadı.
- Her iki `SRC09.pages.json` SHA-256: `49f268c690baf965edce2ade307d2c64fc9b7a49414bc29757460cb95488b562`. Sayfa, kelime sırası ve ölçülmüş konumlar optimizasyon öncesi/sonrası aynıdır.
- `section-break/word.json`: 0, 1 ve 3 boş paragraf kontrolünde bölüm sonu işareti önceki paragrafla aynı y konumunda. Her belgenin son kısmı ikinci sayfada. `section-break/browser.json`: üçü de PASS, 2 sayfa, işaretin kaynak XML'i korunuyor. İlk yalın test-paketinin Word tarafından reddedilmesi üzerine gerçek DOCX dışa aktarıcısıyla geçerli kontroller üretildi; bu ilk deneme başarı sayılmadı. Yalnızca bu işin açtığı Word örnekleri kapatıldı.
- `final/SRC09.json`: metin kutularında normal kaynak fontları tarayıcıdan okundu. Bu bütün akış şemasının görsel kabulü değildir. `tail-diagnostic` probe koordinatları ekran yakınlaştırmasını içerir; doğrudan Word pt geometrisi olarak kullanılmamalıdır.
- `section-fixed/diagnosed.json`: SRC09 180/180, 12/157 kayık, kapsam 0,97919, **FAIL**. Word s.91 ile eşlenen bölüm s.92'den s.91'e geldi; başlangıç kelimeleri ve grafik kapsamı hâlâ uyuşmuyor. Kalan 11 fiziksel fark EK-2 alanında.
- `src10-final/diagnosed.json`: SRC10 91/91, 6/75 kayık, kapsam 0,99565, **FAIL**. Dört fiziksel, iki aynı-sayfa başlangıç farkı. Kontrol eşikleri ve referans Word PDF değiştirilmedi.
- `final-unit.log`: **1036/1036 PASS**, 0 atlama. Yeni testler metin kutusu varsayılanlarını ve korunmuş/atlanan bölüm sonu durumlarını doğruluyor.
- `final-build.log`: **PASS**; mevcut büyük paket uyarısı sürüyor.

Tam seri Word/genel kabul bu turda tekrar çalıştırılmadı: zorunlu uzun belge kapıları hâlâ FAIL. Sonraki iş `MISSION.md` içindedir. Kaynak düğümleri ve eski motor akışı silinmedi; commit yapılmadı.

## Kullanıcının ikinci devam talebi

- `shortParagraphs.js`: mevcut 2–3 satır koruması, widow/orphan kontrolü açık tek satırı da içeriyor. Blink'in tek satırla terminal-leading payını ayırması önleniyor. `merge-fresh/` küçük sabit/birleşik satırlı örneği Chrome 1 / Word 2 sayfaydı; `merge-single-line/` artık 2/2. Minimum/yüksekliksiz varyantlar 3/3 kaldı. `single-line-word/check-20261014-0058.json`: SGL31S0…SGL31S27 ailesinin 10 gerçek Word yerleşim kontrolü ve 5 şema kapısı PASS. Bu, uzun SRC09 EK-2 kabulü değildir.
- `importDocx.js` + `docx/projection.js`: `settings.xml` içindeki açık pozitif `w:defaultTabStop` kaynak metaverisine mm olarak aktarılıyor. Kaynak paragraflarda CSS `tab-size` uygulanıyor. Bunu mevcut `body.tabStopMm` üzerinden vermek reddedildi: özel durak adaptörü tek durak üretiyor, tekrarlayan varsayılan aralığı temsil etmiyor. Eski adaptör korundu. Ayarı olmayan eski fixture'lara sessiz göç uygulanmadı.
- Paragraf sonundaki yerel sekmeler `break-spaces` ve sıfır genişlikte sunum kutusuyla, önceki kelimeyi taşımadan yeni satıra geçebiliyor. Kaynak metin/XML değişmiyor. İlk genel-sekme deneyi satır sayısını tuttururken önceki harfi taşıdı; küçük kontrol bunu yakaladı, deney daraltıldı. Aradaki sekmelerin boşluk davranışı korunuyor.
- `docx/properties.js`, `projection.js`, `wordLineLayout.js`: kaynak `w:kern` yarım punto eşiği okunuyor; font boyutu eşiği karşılıyorsa etkin, sıfırda/altında kapalı. Canvas ölçümü, genişlik önbelleği ve geçici satır span'ları kaynak kerning ayarıyla tutarlı. Mevcut sıkıştırma toleransları değişmedi. SRC10 `Gövde Metni1` stili `w:kern=3` içeriyor; önceden kapalı ölçülen liste, artık Word ile aynı altı satıra kırılıyor. Uzun belgede fiziksel s.57 farkı bununla tek başına kapanmadı.

### Son kanıtlar

Kanıt kökü yine `../engine-work/resume-20261014/`:

- `tab-controls/word.json` + `browser.json`: 18, 35,4 ve 72 pt tekrarlayan duraklar ile sonda taşan sekme kontrolü PASS; tarayıcı harf konumları Word'e 0,15 pt içinde, son kontrol ikisinde de 2 satır ve önceki harf ilk satırda. Chrome/Word y değerlerinin farklı API anlamları olduğundan mutlak glyph-y eşitliği iddia edilmiyor.
- `tab-controls/kerning-word.json`, `kerning-browser.json`, `kerning-text-comparison.json`: kapalı/açık/eşik altı örnekler 7/6/7 satır; üç örneğin bütün satır sonu kelimeleri gerçek Word PDF ile aynı, PASS.
- `kerning-src10/cmp10.json`: **91/91, 4/75 kayık, kapsam 0,99565, FAIL**. Tur başlangıcı 6 farktı. Sekme düzeltmeleri s.59 ve s.69'u kapattı. Kalanlar s.57, s.75 (fiziksel), s.85–86 (aynı sayfada tablo başlangıcı).
- `kerning-src09/cmp09.json`: **180/180, 12/157 kayık, kapsam 0,97919, FAIL**. Önceki açık sayfalar korundu; yeni açılış veya sayfa sayısı gerilemesi yok. Her iki son uzun koşuda tarayıcı hatası 0. Bu koşular hız kabulü olarak kullanılmıyor.
- `continued-final-unit.log`: **1042/1042 PASS**, 0 atlama. `continued-final-build.log`: **PASS**; mevcut büyük paket uyarısı sürüyor.

Sonraki dar tanı: SRC10 s.57'de artık doğru altı satırın neden Word'de 3+3, editörde farklı fiziksel dağıldığını satır kutusu/sayfa sınırı üzerinden incele. Kaynak kerning sorununu yeniden araştırmaya gerek yok. Genel boşluk veya satır yüksekliği ayarını kanıtsız değiştirme. SRC09 EK-2 ve grafik geometrisi, tekrarlı etkileşim/hız kabulü ve son seri kabul açık. Commit yapılmadı.
