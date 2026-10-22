# SRC09 — orkestrasyon ve kabul planı

16 Ekim 2026. Kullanıcının «başla» talimatıyla başlatıldı. Kolay hazırlık/ölçüm/doğrulama Luna; karmaşık teşhis ve üretim düzeltmeleri GPT-6.1 Sol; ana ajan koordinasyon ve inceleme yapar. SRC10 düzeltmeleri, hesap/bulut ve yeni şablonlar kapsam dışında.

## Beş görev

1. EK-2 birleşik hücre/satır devamı ve paragraf dağılımı: 11 tarihsel fiziksel açılış farkını kapatmak.
2. Metin kapsam kaybı: nedenleri kaynak/PDF/editör karşılaştırmasıyla gidermek, mevcut 0,995 alt sınırını korumak.
3. Şekiller: s.97 ok/döndürme/kırpılma, sarma ve dar metin koridoru.
4. Grafikler: kapanmış s.91 Pareto açılışını korumak; kalan stil/ölçü eşliğini kaynakla doğrulamak.
5. SRC09 son kabulü: aynı kaynak sürümünde taze içe aktarım, uzun belge ölçümü, PDF/DOCX, içerik ve 20 örnekli düzenleme/geri al/kaydet-aç.

## İş sahipliği ve sıra

- `baseline_luna`: başlangıç çalışma ağacı/hashes, HMR kapalı yalıtılmış sunucu, taze başlangıç ölçümü; ardından bağımsız son doğrulama. Üretim kodu değiştirmez.
- `ek2_sol`: `engine/src/tableContinuation.js`, `tableSemantics.js`; başka ortak dosya için önce koordinasyon. Küçük Word/Chrome kontrolüyle kök neden ve dar düzeltme, ardından uzun belge.
- `figures_sol`: `docx/drawingPreview.js`, `drawingWrap.js`, `drawingAnchors.js`, `importDocx.js` çizim bölümleri ve `layoutPdf.js` çizim bölümleri. Kaybolan metin envanteri, küçük kaynak kesitleri, geometri ve grafik kanıtı.
- Ana ajan: sahiplik/çakışma yönetimi, kanıt ve diff incelemesi, kabul sonuçlarını uzlaştırma, görev kayıtları.

Başlangıç ölçümü bitene kadar üretim mutasyonları donduruldu. Sol ajanlar bu sırada mevcut kanıt/kaynak teşhisi ve kendi dizinlerinde küçük probe hazırlığı yapabilir. Sonra ayrık üretim dosyalarında paralel ilerlenir. Ortak dosya, ağır uzun belge koşusu ve Word COM erişimi sıralıdır. Word lease başlangıçta atanmamıştır; bilinmeyen/kullanıcı süreçleri kapatılmaz.

## Kanıt ve kabul

Yeni çalışma kökü `orchestration/engine-work/src09-20261016/`; başlangıç, EK-2 ve şekil kanıtı ayrı dizinlerde. Eski rapor/hash/Word referansı yeniden yazılmaz. Özgün DOCX/PDF ve mevcut kullanıcı değişiklikleri korunur. Commit yapılmaz.

Tarihsel son ölçüm: 180/180 sayfa, 11/157 farklı fiziksel açılış, kapsam 0,98087. Bu ölçüm güncel başlangıç sonucu yerine kullanılmaz. Yeni başlangıç üretim kaynak kimliğiyle kaydedilir. İçeriği/fixture'ı/toleransları değiştirerek PASS alınmaz; toplam sayfa eşitliği tek başına kabul değildir.

Her düzeltme küçük bağımsız Word/Chrome kanıtı → hedefli anlamlı regresyon → ilgili uzun belge ölçümü sırasını izler. Son üretim sürümü sabitlendiğinde tam frontend/motor testleri ve build; gerçek SRC09 PDF/DOCX, kaynak paket/yerel nesne korunumu, sayfa açılışları, içerik kapsamı, tarayıcı window.error/pageerror ve 20 örnekli kaydet-aç kontrolü birlikte değerlendirilir. Genel ürün verify sonucu SRC10 açık işleri yüzünden ayrı tutulur; SRC09 kabulü tüm ürün 1.0 kabulü diye sunulmaz.

## Güncel başlangıç — ölçüldü

`baseline/fresh2/`: özgün SRC09 DOCX'ten yeni `SRC09_20261016_BASE` fixture; editör/Word **180/180**, **11/157** farklı açılış, hepsi farklı fiziksel sayfada, aynı-sayfa farkı 0; **kapsam 0,98103**, özgün 0,995 sınırı korunuyor. Farklı Word sayfaları 166, 169–172, 174–179. Tarayıcı `pageerror` ve yerel `window.error` 0. İlk sunucu yükleme/warmup dahil 108658 ms; eşlenmiş performans karşılaştırması değildir.

Başlangıç yakalandıktan sonra üretim dondurması kaldırıldı. Word küçük EK-2 kontrolleri tamamlandı; Word lease şekil ajanına geçti. Bir sonraki tarayıcı küçük kontrol slotu EK-2, ardından şekil ajanı. Sunucu 5226, ana ajan tarafından açılan PID 8100/session24800; izleyici/HMR kapalı. Kod değişikliğini görmek için sunucu yeniden başlatılmalı veya yeni yalıtılmış sunucu kullanılmalı.

Hazırlık hataları açık kaydedilir: ilk server yolları yanlış derinlikteydi; sandbox ağ erişimi engellendi; ilk sunucu 5216 portunu dinlese de HTTP yanıtı vermedi; varsayılan 30 saniyelik navigation süresi büyük sayfanın ilk yüklemesine yetmedi. Başarısız kayıtlar başarı kanıtı olarak kullanılmadı. İçe aktarma betiğinin ilk sürümü mevcut üretilmiş `SRC09.fixture.json` dosyasına yazdı; sonra çıktı benzersiz ada ayrıldı. Önceki üretilmiş fixture için yedek/geri dönüş iddiası yok; özgün DOCX, referans Word PDF ve önceki `PARETO14_SRC09` fixture korunmuştur.

## İlk teşhis ve kontrollü deneyler

- Luna'nın güncel `baseline/fresh2/coverage-loss.json` incelemesi: 164742 kaynak karakterinden 3125'i sıralı hizalamada karşılanmıyor; mevcut eşik için en az 2302 karakter daha karşılanmalı. En büyük grup s.71–73 tabloları (722 karakter); s.153 ve s.66/68/69 döndürülmüş tablo başlıkları da büyük gruplar. Bu kayıplar görsel silinme sayısı değildir; sıralama farkı/kırpılma ayrı kanıtlanmalıdır.
- EK-2 küçük gerçek Word/Chrome kesitleri: Phatak satırı alt sınıra yaklaştığında Word “2018” ve “4”ü birlikte ikinci sayfaya taşıyor; editör “2018”i ilk sayfada bırakıyor. İlk üretim adayı, çok paragraflı hücre korumasının dört paragraf eşiğini ikiye indiriyor. Liste satırları ayrı sonraki deneydir; genel satır yüksekliği/kenar boşluğu ayarlanmadı.
- İlk hedefli Node tablo regresyonu 34 PASS, 0 FAIL/SKIP. Hash kaydında değişen `docx/projection.js` eksik kalmış; sonradan alınan hash bu açığı kapatıyor diye sunulmaz. Final sabit sürüm testi eksiksiz kaynak kimliğiyle tekrar alınmalı.
- Şekil kesiti gerçek Word'de tek sayfa; tarayıcıda 57 çizim nesnesi, 0 pageerror. Ana ajanın ön-düzeltme görsel/DOM kontrolü `figures/flowchart-baseline-root.*` içinde. Kaynak xfrm döndürmeleri ve preset geometrileri henüz doğru gösterilmiyor; alternatif yazıları yatay, bağlantılar yanlış yönde. Bu kontrol düzeltme sonrası kabul değildir.
- Luna benzersiz fixture/output kimlikleri, yerel font erişimi, window.error, 20 örnekli geri al/kaydet-aç ve son Word/PDF doğrulamasını içeren son kabul hazırlığını yaptı. Henüz final koşu çalıştırılmadı.

## EK-2 düzeltmesi — devam oturumu (16 Ekim, öğleden sonra)

`engine/src/docx/projection.js` üç değişiklik (hepsi yalnız hücre içi paragrafların sayfa sonu korumasını etkiler):

1. Çok paragraflı hücre eşiği 4 → 2 (önceki ajanın adayı; Phatak).
2. Hücre paragraf sayımı liste öğelerini de sayar (`cellParagraphCount`, iç içe tablo hariç); liste öğeleri (`ul>li>p`) de hücre-içi koruma alır. Neden: Narimissa hücreleri tek `ul` içerdiğinden "multi" sayılmıyor, son satırlar Word'de olmayan 2,4 mm terminal payından yararlanıyordu (Word kesitinde başlangıç 446/450'de "Sürdürülebilirlik perspektifinde" satırı Word'de ikinci sayfaya geçiyor, editörde kalıyordu).
3. Bağlamsal aralıklı (contextualSpacing) liste paragrafları koruma payına "space after" katmaz. İlk denemede (2 tek başına) s.72–73'teki "Bulgular ve Katkılar" tablosu 1 satır erken bölündü ve belge 182 sayfa oldu; bu ayar onu geri aldı.

Ölçüm (`engine-work/src09-20261016/ek2fix/`, run1 = yalnız 1., run2 = 1+2, run3 = 1+2+3, HMR kapalı sunucu 5230, SRC09_20261016_BASE, yalnız okuma):
- run1: 10/157 kayık (p166 kapandı).
- run2: 182 sayfa (regresyon), 1 kayık.
- **run3: 180/180 sayfa, 0/157 kayık açılış**, pageerror 0, window.error 0. Kapsam 0,98092 (eşik 0,995 → görev 2 hâlâ açık, bu değişiklikle ilgisiz).
- Narimissa 442/446/450/454 küçük kesitleri Word ile eşleşti (öncesinde 446/450 farklıydı).

Testler: `docxTerminalLeading.test.js` 3 paragraflı hücre testi yeni davranışa göre güncellendi (3 paragraf artık korunur; tek paragraflı hücre korunmaz). `npm test` (frontend+motor) tek hata: `afsu-lee.test.js` "self-4 geometry … ethics bullets" (0 !== 6); `engine/src/templates/afsu-lee.js` çalışma ağacında başkasınca değiştirilmiş, bu işle ilgisiz, sınanmadı/ayrıca incelenmeli.

Henüz YAPILMADI: Word'de 3 paragraf/liste değişikliğinin Phatak kesitleriyle yeniden sınanması (tarayıcı probu yalnız Narimissa çalıştırıldı), final dondurulmuş sürümde tam kabul (20 örnek, PDF/DOCX), görev 2 (kapsam), 3 (s.97 şekiller), 4 (grafik).

## Görev 2 (metin kapsamı) — teşhis, düzeltme YOK (devam oturumu)

Girdi: `engine-work/src09-20261016/ek2fix/run3/SRC09.pages.json` (EK-2 düzeltmesi sonrası, 180/180, 0 kayık açılış). Aynı `coverage-loss.py` mantığı `coverage/coverage-loss.py` ile çalıştırıldı → `coverage/loss-run3.json`. Kayıp 3143 karakter (kapsam 0,98092); 0,995 için en az ~2300 karakterin daha sıralı eşleşmesi gerekir.

Bulgular:
- 475 bölge, 157 sayfa. Kaybın **2248 karakteri (%72)** "Word kelimeleri var, editörde o noktada sıra dışı": metin silinmemiş, **okuma sırası** farklı (örn. p73'te "göstermektedir eden anahtar faktörlerini" farklı yerde). 633 karakter karışık sıra, 262 karakter döndürülmüş başlıkların harf parçaları ("ın faa ger fay sür…" — s.66/68/69/153; yaklaşık 260 karakter).
- Karşılaştırıcı kelimeleri PDF'de alt-y sonra x ile sıralar; çok sütunlu tablo hücrelerinde (s.71–73 Tablo 2.8/2.9) Word'de sütunların ilk satırları kademeli başlar (örn. s.72 Tablo 2.9: x378 sütunu y=389, x95 sütunu 395, x633 sütunu 401; ~6 pt adımlar), editörde 386,4 / 386,4 / 392,4. Kaynak: sütunlar farklı paragraf stili (ListeParagraf: 1,08 çarpan; DecimalAligned: 1,15 çarpan + tema alt font, `after=0` geçersiz kılmasıyla) kullanıyor; ilk satır konumu ve satır yüksekliği (Calibri/Times) Word'de farklı, editörde yaklaşık aynı. Yani kapsam kaybı çoğunlukla hücre içi ilk satır dikey ofsetinin/yazı tipi satır payının Word'e göre ~3–6 pt sapmasından geliyor.
- Bunu düzeltmek hücre içi paragraf stilleri için font-metrik doğruluğunu (satır çarpanı, üstteki fazlalık, tema yazı tipi) gerektirir; tek bir kural yok, yüzlerce bölgeye dağılmış (en büyük sayfa p73'te 273 karakter). Döndürülmüş başlık parçaları (~260) tek başına eşiği sağlamaz.

Sonuç: bu oturumda üretim kodu değiştirilmedi. Kapsam eşiği hâlâ açık (0,98092 < 0,995); ilerlemek için önce hücre ilk-satır ofseti için küçük bir Word/Chrome karşılaştırması (ListeParagraf vs DecimalAligned) yapılmalı.

## Görev 2 — hücre ilk satır ofseti kesiti (devam, düzeltme YOK)

Kesit: Tablo 2.9 (`engine-work/src09-20261016/cellofs/t29.docx`, `make.mjs`; fixture `CELLOFS_20261016_t29`), Chrome ölçümü `chrome.mjs`/`chrome.json`. Word'de bağımsız ölçüm alınamadı: `word.ps1` COM ile `t29.docx`'i açarken iki denemede de takıldı (WINWORD yanıt veriyor ama `Documents.Open` dönmedi; kendi başlattığım iki WINWORD süreci sonlandırıldı). Word referansı olarak orijinal `word.pdf` s.72 kullanıldı.

Ölçüm (ilk metin satırı alt kenarı, pt): Word col2 399,8 / col1 405,8 / col3 411,8 (0 / +6 / +12); editör (fark sabiti ~2,2 pt) col1 = col2 = 397,6, col3 = 403,6 (0 / 0 / +6).
Hücrelerin ilk paragrafı boş (10 pt); col1/col2 `ListeParagraf` (contextualSpacing), col3 `Normal` (önce 6/sonra 6 pt, satır 1,5). Motor "Word boşlukları max alır" kuralıyla (`body.js`: ölçülmüş compat 12/14/15) col3'ü +6 yapıyor; Word +12 veriyor, col1'e de +6 veriyor. Bu, boşluk toplama (additive) varsayımıyla da tam açıklanmıyor (col1/col2 aynı stil ve aynı boş paragraf yapısı). Kök neden doğrulanmadı; tahmin: Word hücre ilk-paragraf boşluğu/satır payı için ek bir kural uyguluyor. Düzeltme yazılmadı çünkü yanlış kural 157 sayfalık hizalamayı (şu an 0 kayık açılış) bozabilir.

Sonraki adım: Word COM'un neden `t29.docx`'te takıldığını çöz (ör. paket bütünlüğü/yüzen tablo), sonra boş ilk paragraf + {ListeParagraf, Normal} × {contextual, boşluk} kombinasyonlarını Word'de ölç.

## Görev 2 — Word COM takılması çözüldü; hücre ofseti Word'de yeniden üretildi (düzeltme YOK)

**Takılma nedeni:** `Document.ExportAsFixedFormat` bu makinede şu an her belgede (kontrol dosyası dahil) sonsuza dek bekliyor; belge açma ve düzen hesabı sorunsuz. `SaveAs2(path, wdFormatPDF=17)` çalışıyor (`engine-work/src09-20261016/cellofs/w4.ps1`, 60–90 sn zaman aşımı + yalnız kendi başlattığı WINWORD sürecini sonlandırır). Paragraf başına `Range.Information(6)` de bazı paragraflarda takılıyor; konum ölçümü PDF'ten alındı (`rd.py`). Eski `word-evidence`/`probe-word.ps1` yöntemi (ExportAsFixedFormat) şu an kullanılamaz.

**Yalıtılmış Word ölçümü** (`t29b.docx`, Tablo 2.9 tek başına, yüzen konum kaldırıldı): sütun ilk satır alt kenarı col2 180,5 / col1 186,5 / col3 192,5 (0 / +6 / +12) — tam belgedeki s.72 sapmasıyla aynı, yani yeniden üretilebilir. Chrome: 183,0 / 183,0 / 189,0.

**Elenen nedenler** (Word'de 0/+6/+12 değişmedi): numaralandırma, tablo stili, tcW/tblW, noWrap, tema/Times/eastAsia yazı tipi (vC, vG), widowControl/suppressAutoHyphens/overflowPunct, vAlign=top eklemek. İlk boş paragrafı silmek (vA) col3'ün +12'sini yok etti (boş `Normal` paragraf: 6 sonra + 6 önce boşluk Word'de +12, motor +6 veriyor) ama col1'in +6'sı kaldı.

**Önemli bulgu:** col1'in sonuna 6 paragraf eklemek (vH) col2'nin ilk satırını 180,5 → 186,5 yaptı; col3 değişmedi. Yani bir hücrenin ilk satır konumu diğer hücrelerin içeriğine ve 6 pt (= Normal'in önce/sonra 6 pt'si) basamaklarına bağlı. Basit hücre-yerel bir kural değil; muhtemelen Word'ün satır içi ilk-satır/ilk-paragraf boşluk kuralı satır yüksekliğine göre bölünmüş. Kök neden doğrulanmadı, motor kodu değiştirilmedi (kapsam 0,98092; yanlış kural 0 kayık açılış sonucunu bozabilir).

Sonraki adım için öneri: sentetik tek satırlık 3 sütunlu tablolarda (Normal/ListeParagraf × boş ilk paragraf × içerik uzunluğu) Word'de 6 pt basamağını tetikleyen koşulu bul; ancak yarar/maliyet düşük (kayıp 475 bölgeye dağılmış, eşik için ~2300 karakter gerekli).

## Görev 3 — s.97 şekil geometrisi (devam oturumu)

Önceki ajanın çalışma ağacındaki taslağı (`drawingShapeGeometry/Preview`, `rotationDeg`, `geometryPreview`) devraldım; çizimler hiç görünmüyordu: üretilen SVG'nin `style` niteliği içe aktarımda düşüyor (`position:static`, çerçevenin iç dolgusu yüzünden genişlik 0–%50). Düzeltmeler:

1. `engine/src/docx/shapes.js`: geometri katmanı için düğüm-kimlikli CSS kuralı (mutlak konum, çerçeveyi doldurur, `z-index:-1`, çerçevede `isolation:isolate`; inline-block çerçeve `position:relative`).
2. Metinli şekil (elmas): SVG katmanı metin kırpmasına takıldığından CSS `background` data-URI (`drawingShapeBackground`, `importDocx.js` `geometryPreview:"background"`).
3. Şeklin `wps:style/fontRef` rengi (`lt1` = beyaz) metin rengi olarak uygulanıyor (`shape.textColor`): s.97'de elips içi metin Word'de beyaz/görünmez, editörde siyah görünüyordu.
4. Elmas/elips metin dikdörtgeni (elmas w/4,h/4; elips 0,14645) iç dolguya eklendi (Word'de elmas metni "Sıralamada / Grubun" iki satıra sarıyor).
5. Metin kutusu hikâyesi şekil metin dikdörtgenine kırpılıyor (`overflow:clip; overflow-clip-margin:content-box`) ve taşan ortalı metin `safe center` ile üstten başlıyor: Word `vertOverflow="overflow"`a rağmen taşan 4./5. satırı çizmiyor (s.97 "Problem Tanımı" kutusu). `docxShapes.test.js` bu davranışa göre güncellendi.

Doğrulama: izole kesit `figures/flowchart-fix5.png`→`fix4.png` (son hâl `fix4`-eşdeğeri) Word s.97 görüntüsüyle (`word-97.png`) görsel olarak eşleşiyor (oklar, bükülü ok, bağlantı çizgileri, c1–c6, Alternatif 1–3, elips boş, elmas metni); tam belge s.97 `p97-editor.png`. Tam belge (`SRC09_20261016_SHAPES`, HMR kapalı): 180/180 sayfa, 0/157 kayık açılış, pageerror/window.error 0, kapsam 0,98084 (önce 0,98092; eşik 0,995 hâlâ açık). `npm test` (frontend+motor): 1062 testten 1061 geçti; tek hata `afsu-lee.test.js` "self-4 geometry" (bu işle ilgisiz, önceki kirli çalışma ağacından).

Açık: döndürme (`rot`) bu kesitte hiç kullanılmıyor, ayrı doğrulanmadı; diğer şekilli sayfalar (s.39, 48, 66/68/69, 153) gözle doğrulanmadı; Word PDF üzerinde otomatik şekil karşılaştırması yok; final dondurulmuş sürüm hash/kabulü yapılmadı.

## Görev 4 — grafik stil/ölçü eşliği (devam oturumu)

Belgede 7 önbellek grafiği + 1 ChartEx Pareto: s.83/84/85/86 sütun-çubuk (chart1–4), s.91 Pareto (chartEx1), s.102–103 pasta (chart5), s.115 dağılım (chart6). Her biri Word `word.pdf` sayfasıyla görsel karşılaştırıldı (`engine-work/src09-20261016/charts/`: `word-p*.png`, `ed-p*.png`, `shots.mjs`). Eski genel çizici stil okumuyordu: açık mavi, geniş çubuklar, değer ekseni etiketleri/"Sayı" serisi adı, kalın olmayan başlık, ilk boş kategori yuvası kayıp, dağılım grafiği çizgiyle bağlı.

`engine/src/docx/drawingPreview.js` (Pareto yolu değişmedi):
- **Sütun/çubuk (küme)**: serinin `lumMod/lumOff` renk dönüşümü (Word'ün koyu mavisi `#2e75b6`), `gapWidth`, silinmiş değer ekseni etiket/çizgisi çizilmiyor, Excel otomatik ölçeği (≤10 aralık, %5 pay: 51→60, 85→90), başlık kalın/12 pt ve uzunsa ikiye bölünür, veri etiketi boyut/kalınlık/renk, kategori etiketi boyut/dönüş (−90°), idx 0 boş kategori yuvası, otomatik etiket atlama (50 kategorili s.86'da her ikinci etiket), grafik çerçevesi (`D9D9D9` 0,75 pt), `manualLayout` iç çizim alanı (s.85), yatayda ilk kategori altta.
- **Pasta** (s.102): dilim renkleri `dPt`, dışarıda "ad / yüzde" etiketi dilim renginde, `dLbl` `manualLayout` kayması, yüzdeler en büyük kalan yöntemiyle 100'e tamamlanıyor (Word 303→26 %, 279→24 %; önceki "desteklenmiyor" notu kalktı).
- **Dağılım** (s.115): çizgisiz işaretçi + beyaz içli halka, tek tek zengin metin etiketleri (A–O, `dLblPos`), x ekseni `min=8`/`majorUnit=1`, y otomatik (−1…2,5), eksen başlıkları. Çok serili/çizgili dağılım eskisi gibi.
- Yeni test `engine/src/chartStyles.test.js` (6 test). `npm test`: 1068 testten 1067 geçti, tek hata ilgisiz `afsu-lee` testi.

Tam belge (`SRC09_20261016_SHAPES`, HMR kapalı): 180/180 sayfa, **0/157 kayık açılış (s.91 Pareto açılışı korundu)**, pageerror/window.error 0, kapsam 0,98068 (eşik 0,995 açık; önceki ölçümler 0,98084/0,98092).

Açık/doğrulanmadı: s.115 Word'deki altın eksen çizgileri `chartUserShapes` (drawing1.xml) çizimi — bölüm içe aktarımında okunmuyor; Pareto s.91 çizici (çubuk kenarlığı/açık renk, eksen başlığı konumu) ayrıca ince farklı, dokunulmadı; s.86 çubuk kalınlığı Word'de daha kalın görünüyor (gapWidth 182 ile uyuşmuyor, nedeni bilinmiyor); Word'de otomatik ölçüm yok, görsel karşılaştırma.

## Görev 5 — SRC09 son kabulü

Ayrıntı ve tablo: `engine-work/src09-20261016/final/RESULT.md`. Özet: düzen 180/180, 0/157 kayık açılış, 20/20 düzenleme-geri al, kaydet-aç, PDF 180 sayfa PASS; **kapsam 0,98068 (FAIL), dışa aktarılan DOCX Word'de 206 sayfa (FAIL), kapak üstbilgi logosu eksik**. SRC09 kabulü bu yüzden AÇIK/FAIL.
