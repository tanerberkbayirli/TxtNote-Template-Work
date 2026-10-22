# Uzun tablo ve kaynak düzenleme düzeltmeleri — 14.10.2026

Genel kabul hâlâ **FAIL**. Kullanıcının limit yenilendiği için devam talebiyle iki doğrulanmış düzeltme yapıldı. Önceki motor ve özgün belgeler korundu; commit yapılmadı.

## Değişiklikler

1. `engine/src/tableSemantics.js`, `generatedIndex.js`, `pageLayout.js`, `sourceHtml.js`: uzun kaynak tablolarında hücre başına negatif marjlı son-satır koruması yerine fiziksel tablo parçası başına klonlanan koruma kullanılıyor. Chrome, hücrelerin ölçülen yüksekliği değişmese de eski korumaları kırılım hesabında biriktiriyordu. SRC10'daki iki F1 satırı bu nedenle erkenden yeni sayfaya gidiyordu. Sunum sarmalayıcısı kayda girmez; tablo ve hücreler kopyalanmaz.
2. Yeni yol yalnızca kaynak DOCX'te, tanımlı satır asgarilerinin toplamı bir sayfayı aşan tablolara uygulanıyor. Yüzen/iç içe tablolar, liste/çizim içeren hücreler, birden fazla içerikli paragraf ve ikiden fazla satıra uzanan birleşimler eski yolda. İki satırlı başlık birleşimi ayrı gerçek Word kontrolüyle doğrulandı. Önbellek kaynak modelinin kimliğine bağlı; üniversite veya belge kimliği için özel kural yok.
3. `academicDocument.js` + `RichTextBody.jsx`: tez editöründeki ortak akademik dekorasyon yerel Word tablolarının paragraf yapısını koruyor. Önceden dolu hücrede yalnızca doğrudan metin düğümü aranıyor, `<p>` içindeki metin görülmediği için dışına görünmez karakter ekleniyordu. Ayrıca boş caption, tablo kabı ve dış caret karakterleri üretiliyordu. İlk düzenlemede anonim satırlar büyüyor, geri alma kaynak HTML'ini birebir geri getirmiyordu. Yeni seçenek yalnızca yerel satır kimliği olan içe aktarılmış tabloları koruyor; normal akademik ve yeni yazılmış tablo davranışı devam ediyor. Var olan kullanıcı içeriği temizlenmiyor/silinmiyor.

## Kanıtlar

Kök: `../engine-work/resume-20261014-3/`.

- `table-css10/SRC10.json`: yalnızca hücre sonu pseudo-elemanını kapatmak, ilk F1 satırını s.85'ten s.84'e getiriyor; widow/orphan, satır minimumu ve break-inside denemeleri bu farkı kapatmıyor.
- `table-wrapper10/SRC10.json`: tablo parçası koruması iki F1 satırını s.84 ve s.85'e getiriyor. İlk veri grubunun başlangıcı 123,05 pt'den 147,08 pt'ye geliyor; bağımsız Word PDF çiziminin tablo kutusu 147,62 pt civarında. Bu bir bütün-belge geometrik eşitlik iddiası değildir.
- Geniş kapsamlı ilk deney SRC09'u 183 sayfaya, yalnızca birleşimleri dışlayan deney 182 sayfaya çıkardı. Tek-paragraf hücre sınırı toplamı 180'e getirse de 14 açılış farkıyla başarısızdı. Bu deneyler kabul edilmedi. Son kapsam kaynak asgarileriyle gerçekten bir sayfadan uzun tablolara daraltıldı; SRC09 bu yeni yola girmiyor.
- `table-controls/word.json` + `browser.json`: bölünebilir, bölünmez, sabit yüksekliğe sahip uzun tablolar ve iki satır birleşimli başlık olmak üzere **4 taze gerçek Word/Chrome kontrolü PASS**. Her kaynak satırının fiziksel sayfası ve toplam sayfa sayısı eşleşti. Eski birleşik tablo kontrollerinin üç Chrome tekrarı Word referansındaki 2/3/3 sayfayı korudu.
- `table-controls/undo-baseline.json`: yeni koruma kapalıyken de geri alma öncesi/sonrası kaynak HTML farklıydı; eski dekorasyon sorunu bağımsız olarak yeniden üretildi. `undo-difference.json` ilk farkı görünmez karakter + akademik tablo kabı/boş caption olarak kaydediyor. Bunlar başarısız ara deneylerin kanıtıdır.
- Son `table-controls/browser.json`: gerçek klavye ile yazma/geri alma sonrası `undoRestored`, `presentationNotSaved`, `wrapperCountStable`, `pageCountStable` **true**. Ayrı DOM kontrolünde yerel caption/hücreler değişmedi; normal akademik tablo dekorasyonu devam etti. Bu küçük kontrol, 20 örnekli uzun-belge kaydet/aç ve performans kabulünün yerine geçmez.
- Son uzun ölçümler: `verified10/cmp10.json` **91/91 sayfa, 2/75 kayık açılış, kapsam 0,99565, FAIL**; `verified09/cmp09.json` **180/180, 12/157 kayık, kapsam 0,97919, FAIL**. İkisinde de tarayıcı hatası 0. SRC10'un s.85–86 başlangıçları kapandı, s.57 ve s.75 açık. Önceki ara sürüm sonuçları yeni genel kabul olarak kullanılmıyor; ölçüm koşuları hız kabulü değildir.
- `final-unit.log`: **1044/1044 PASS**, 0 atlama. `final-build.log`: **PASS**, mevcut büyük paket uyarısı sürüyor.

## Kalan dar tanılar

- SRC10 s.57: liste kelimeleri artık Word ile aynı altı satıra kırılıyor; Word 3+3, editör 4+2 dağıtıyor. Son satırın font/sayfa sınırına sığması açık. Genel satır yüksekliği veya kenar boşluğu kanıtsız değiştirilmedi.
- SRC10 s.75: iki tırnak işareti kaynakta `w:rFonts w:hint="eastAsia"` taşıyor. Word PDF bunları MS Mincho ile, editör Times New Roman ile çiziyor. Bu satır genişliğini ve iki satırın yüksekliğini değiştiriyor. Microsoft'un [Word run-font seçim açıklaması](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/aef3c9a6-5d6c-434b-90b7-85e761fd8e62), bu ipucuyla genel noktalama aralığının Doğu Asya fontuna yönlendirildiğini belirtiyor. Gözlenen MS Mincho Office CloudFonts önbelleğinde var, Chrome yerel font listesinde yok (`table-wrapper10` probe). Font adını zorlamak tek başına doğru font programını yüklemiyor; bu konu açık bırakıldı.
- SRC09 EK-2 birleşik satır devamları ve grafik/şekil kapsamı; tekrarlı uzun-belge etkileşim/hız ve son seri kabul açık.
