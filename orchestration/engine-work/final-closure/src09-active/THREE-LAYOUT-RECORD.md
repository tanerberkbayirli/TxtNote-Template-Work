# SRC09 — şekil, matris ve tablo yerleşimi

> **Son kayıt:** [RESUME-20261013-2.md](./RESUME-20261013-2.md). SRC09 **181/180, 17/157 kayık, 0,97916**; 100–113 açılışları eşleşiyor. **1014 test + derleme PASS**. 91 ve EK-2 açık; kullanıcı isteğiyle molada. Aşağıdaki kayıtlar tarihseldir.

> Güncel 13.10.2026 mola kaydı: [RESUME-20261013.md](./RESUME-20261013.md). Son SRC09: **181/180, 25/157 kayık, 0,97911**; SRC10 kontrolü aynı; **1008 test + derleme PASS**. Aşağıdaki 29 kayık sayısı önceki turun tarihsel ölçümüdür. Üç ana iş genel olarak açık.

**Üç ana iş de bütünüyle kapanmadı; SRC09 genel kabulü FAIL.** Bu turdaki üretim düzeltmeleri aşağıdadır. Eşikler gevşetilmedi, kaynak belgeye sayfa/satır numarası üzerinden özel ayar eklenmedi.

## Kalan üretim değişiklikleri

- `importDocx.js`: desteklenen Word 2010 `wordprocessingShape` / `wordprocessingGroup` alternatifleri seçiliyor. Önceden eski VML yedeği seçiliyor, bazı sarmalama mesafeleri/çerçeve bilgileri görünümde kullanılamıyordu. Yedek dal kaynak modelde gizli olarak korunuyor.
- `docx/shapes.js`: gizli alternatif dal için ikinci çerçeve CSS'i üretilmiyor. Kaynaktaki açık `vertOverflow="overflow"` metin kutusunu kırpmıyor; `spcFirstLastPara="0"` ilk/son kutu paragrafının dış boşluğunu bastırıyor. Akış şemasının yerel şekil bilgileri ve yazı taşma davranışı düzeltilmiş olsa da gövde sarmalaması ve doğru sayfaya dağılımı açık.
- `docx/equationPreview.js` ve `docx/projection.js`: çok satırlı, varsayılan aralıklı Cambria Math matrislerinin iç satır kenarları font çizgi ölçüsüne göre ayrılıyor. Dış kenarlara gereksiz tam satır yüksekliği eklenmiyor; matris parantezi içerik yüksekliğinde sınırlanıyor. Tek satır, açık `rSp/rSpRule` veya başka matematik fontları bu ayara alınmıyor. Özgün OMML dışa aktarım otoritesi olarak kalıyor.
- `docx/projection.js`: satırın sayfaya sığma denetimine verilen asgari yükseklik, içerik yüksekliği + hücre üst/alt iç boşluğu + yarım kenarlıkların toplamını kapsıyor. Farklı hücrelerde en büyük fiziksel minimum alınıyor. İlk satırdaki kırılmayı Blink yok saydığı için, ilk satırın asgari yüksekliği sığmıyorsa kırılma tabloya uygulanıyor. Sonraki satırlar tablo içinde bölünmeye devam ediyor. Mevcut `tableContinuation.js` devam rezervleri kaldırılmadı.

Bu görünüm değişiklikleri yeni içe aktarımla ölçüldü; daha önce kaydedilmiş matematik önizlemelerine otomatik göç eklenmedi.

## Gerçek Word / Chrome kanıtları

- `three-layout/matrix-cases.docx` ve `.word.pdf`: aynı kaynak matrisin 1–5 satırlı kontrolleri. Word paragraf yükseklikleri sırasıyla 20,82 / 30,78 / 47,25 / 61,77 / 76,17 pt. Üretim Chrome görünümü 20,695 / 30,012 / 46,535 / 60,609 / 74,684 pt (`production-matrix.json`, yalnızca `baseline` üretimdir). SRC09'un üç satırlı matrisi önceden 30,75 pt idi; 47,25 pt Word hedefine fark 16,50 pt'den 0,715 pt'ye indi. Bu ölçü 100–107. sayfaların tamamının doğru kırıldığı anlamına gelmez.
- `three-layout/padded-minimum.docx` ve `.word.pdf`: sayfa sonunda 40 pt içerik + 20 pt iç boşluk + 0,5 pt kenarlık taşıyan satır. Word satırdaki PADDED / SECOND / THIRD / FOURTH / RIGHT metinlerinin tamamını ikinci sayfaya alıyor. Yeni üretim görünümü aynı sayfada başlıyor (`SRC09_PADDED_MINIMUM-baseline`). Eski yalnızca içerik minimumu taklidinde ilk üç satır birinci, son satır ikinci sayfaya bölünüyor (`SRC09_PADDED_MINIMUM-legacy-minimum`). Bu, tablo minimumu alt hatasının somut doğrulamasıdır; tüm EK-2 satır devamları kapanmadı.
- EK-2 tek başına: güncel kaynak yeniden gerçek Word'de üretildi (`three-layout/table.word.pdf`). Başlangıç karşılaştırması Word 26 / Chrome 26 sayfa, 15 kayık açılış. Aynı toplam sayfa sayısının doğru satır kırılması anlamına gelmediği doğrulandı. Birleşik hücre/boş paragraf dağılımı incelendi (`table-rows.json`, `word-cells.json`, `table-merge-*.docx`). Bu dosyalar teşhis kanıtıdır, tablo kabulü değildir.

## Reddedilen deneyler

- Saydam CSS float/polygon ile dikdörtgen sarmalaması: 181 sayfa / 28 kayık başlangıçtan 183 sayfa / 46 kayığa çıktı. Boş işaretleri sabitlemek sorunu çözmedi. Üretimden çıkarıldı; yalnızca `rejected-float-wrap.js` ve `wrap*` ölçümleri kaldı.
- Tam sütun bantlarıyla metni aşağı taşıma: sayfa eşliğini iyileştirmedi, düzenleme yerleşmesini yavaşlattı. Üretimden çıkarıldı (`rejected-band-wrap.js`, `band-wrap`). `ThesisEditor.jsx` için bu deneyin ek entegrasyonu geri alındı.
- Boş hücre paragrafına ek bir çizgi kırılma payı: EK-2'nin bazı açılışlarını iyileştirse de bağımsız `empty-cell.docx` Word kontrolünde END metnini yaklaşık bir satır yanlış aşağı taşıdı. Üretime alınmadı.
- Bütün tablo satırlarını bölünmez yapmak 26 yerine 31 sayfa üretti; mevcut devam minimumunu kaldırmak 25 sayfa ve daha fazla kayık açılış üretti. İkisi de uygulanmadı.

## Son genel durum

- SRC09: **Word 180 / editör 181**, 157 açılıştan **29 kayık**, sıralı metin kapsamı **0,97629**, FAIL. `three-layout/final-all/cmp09.json`. Önceki grafik turunda 28 kayık / 0,9760 idi; matris yüksekliği hedefe yaklaşsa da genel kırılma ölçütü iyileşmedi, bir açılış daha eşik dışına çıktı. Bu nedenle üç ana iş tamamlandı denmedi.
- SRC10 kontrolü: **91 / 91**, **8 / 75 kayık**, kapsam **0,99605**; önceki kontrolle aynı. Genel FAIL durumu sürüyor (`final-all-control/cmp10.json`).
- Tam testler **1000 PASS / 0 FAIL**; üretim derlemesi PASS (`three-layout/unit.log`, `build.log`).
- SRC09 ana kaynak XML'indeki **14.598 literal `w:t`** modelde değişmeden korunuyor; eksik 0, değişmiş 0 (`source-text-audit.json`). Bu, görünür yerleşim/kırpılma kabulü değildir.
- Gerçek SRC09 DOCX dışa aktar/aç: altı grafik önbelleğinin tamamı değişmeden, iki yatay grafik tekrar görünür (`chart-roundtrip.json`).
- `git diff --check`: mevcut `CAPABILITIES.md:303` sonundaki boş satırı bildiriyor; bu tur o dosya değiştirilmedi.
- Bu tur açılan 5193 Vite sunucusu kapatıldı. Başka sunucu veya kullanıcı Word/Chrome süreçlerine dokunulmadı.

## Açık kalan somut işler

1. SRC09 s.48–51'de aynı paragrafa/komşu boş paragraflara bağlı şekillerin birleşik dışlama alanını, boş işaretleri itmeden gerçek metin satırlarına uygulamak; akış şemasını s.96–97 Word dağılımına getirmek.
2. Matris dış ölçüsü düzeldi. S.100–107'de diğer denklemler, paragraf boşlukları ve önceki şekilden gelen akış farkını birlikte çözmek; s.103 dahil açılışları yeniden eşlemek.
3. EK-2'de özellikle birleştirilmiş hücrelerin ve boş paragrafların fiziksel devam parçasını Word gibi dağıtmak. Asgari yükseklik alt hatası düzeltildi, uzun tablo devamları genel olarak kapanmadı.
