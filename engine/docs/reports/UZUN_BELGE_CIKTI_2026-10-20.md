# Uzun (55 ve 76 sayfa) tezde PDF/DOCX çıktı tutarlılığı — 20.10.2026

Soru: Sayfa sayısı arttığında, tablo ve görsel varken uygulama çıktısı hâlâ tutarlı mı? Kapsam: MCBÜ Yüksek Lisans (`mcbu-lee-master-tr-v1`), `engine/tools/make-fixture.mjs` belgesi (5 bölüm, 2 tablo, 2 şekil, denklem, dipnot, atıf) ana gövdesi 2× ve 3× çoğaltıldı. Gerçek arayüzden PDF ve DOCX alındı; DOCX gerçek Word'de (16.0.20430) açılıp PDF'e çevrildi (düz ve alan yenilemeli). Kanıt: `.test-tmp/validation/uzun-cikti-20261020/` (`long2*`, `long3*`, `*-cmp2*.json`).

| Belge | Sayfa (uygulama / Word / Word yenilenmiş) | Tablo | Şekil | Dipnot |
|---|---|---|---|---|
| long2 | 55 / 55 / 55 | 4 (biri 45 satır, 3 sayfa ×2) | 4 | 10 |
| long3 | 76 / 76 / 76 | 6 (3 × 45 satırlı) | 6 | 15 |

## Sonuç
- Sayfa sayısı, sayfa numaraları (roma/arap), BÖLÜM başlıklarının sayfası, Tablo ve Şekil açıklamalarının sayfası: **tam eşleşti**. Tablo açıklaması y farkı ≤0,1 pt.
- Çok sayfalı tablo: 90/90 (long2) ve 135/135 (long3) satır **aynı sayfada**; tablo sayfaları aynı.
- Dipnotlar aynı sayfalarda; Word'de yaklaşık 11 pt yukarıda başlıyor (alt kenar/ayırıcı farkı, ayrıca incelenmedi).
- Görseller aynı sayfalarda; konum farkı 0,1 pt (tablo sonrası değil, sayfa başındakiler) ve 6,0 pt (liste sonrasındakiler; Word 6 pt yukarıda).
- **Gerçek fark:** her kopyada bölüm 1'in "x.2" gövde metninin sayfa geçişinde uygulama Word'den **bir satır (10 sözcük) önce** sayfa kırıyor (long2: s.15→16, s.35→36; long3: s.16→17, 36→37, 56→57). Sonraki bölüm yeni sayfada başladığı için kayma yayılmadı. Sözcüklerin başka sayfaya düşme oranı %0,46–0,47.
- Gerçek fark değil: kalan sayfalarda 3 sözcüklük fark, PDF metin çıkarımında "1Açıklama" (Word) / "1 Açıklama" (uygulama) bölünmesidir.
- Word alan yenilemesi sayfa sayısını veya yukarıdaki konumları değiştirmedi (bu belgelerde).
- Görsel inceleme (s.14): numaralı listede Word'ün numara–metin boşluğu uygulamadan farklı (Word sekme girintisi, uygulama bitişik).

## Düzeltme (aynı gün)
Kök neden: `TxtNote/frontend/src/index.css` içinde `.academic-table-wrap table { margin: 0 0 2pt }`. Editör her tablonun altına bu 2 pt'yi, sarmalayıcının 12 pt'sine ek olarak koyuyordu; DOCX yazıcısı (`engine/src/docx/tables.js`) yalnız 12 pt yazıyor. Tablodan sonraki blok editörde 2 pt aşağıdaydı (tablo→başlık 13,7 pt, Word 12,0 pt; DOM ve PDF'te ölçüldü), bu da sayfa sonunda bir satırı sonraki sayfaya itiyordu. `blockGap` kullanan şablonlarda bu margin zaten sıfırlanıyordu. Düzeltme: `.academic-table-wrap > table { margin-bottom: 0 }`.

Sonra (aynı fixture'lar): long2 55/55/55 ve long3 76/76/76 sayfa, **gerçek satır kayması yok**, sözcüklerin başka sayfada oranı %0,23 (kalanı "1Açıklama" çıkarım artefaktı), 90/90 ve 135/135 tablo satırı aynı sayfada, sayfa numaraları aynı; düz ve alan yenilemeli Word PDF'inde aynı. Kontroller: 1130/1130 birim testi, üretim derlemesi, `check.mjs --target mcbu-lee --word` 108 PASS. Kanıt: `fix2*`, `fix3*`, `unit-after.log`, `build-after.log`, `check-mcbu/`.

### Altı şablonla deneme (aynı gün, `multi/`)
AFSÜ YL, AKÜ SBE YL, ADÜ Sağlık Bil. YL, MCBÜ Tıp Uzmanlık, İYTE YL (İngilizce), AKÜ Matematik Lisans; her biri aynı fixture, gövde ×2 (52–58 sayfa), gerçek arayüz PDF/DOCX + Word. Hepsinde sayfa sayısı Word ile eşit (53/53, 54/54, 52/52, 55/55, 58/58, 54/54), sayfa numaraları aynı. A/B (CSS düzeltmesi kapalı/açık): AKÜ SBE, ADÜ, MCBÜ Tıp, İYTE, AKÜ Mat. sonuçları birebir aynı (bu şablonlarda tablo margin'i zaten sıfırlanıyor); yalnız AFSÜ YL etkilendi.
- AFSÜ'de CSS düzeltmesi tek başına s.16/17 ve s.35/36 farkını 2 pt artırdı: asıl neden **ikinci bir DOCX hatasıydı** (eski 2 pt kısmen onu gizliyordu). Boş tablo hücresinin paragraf işareti (`w:pPr/w:rPr`) yoktu; Word boş paragrafı belge varsayılanı 12 pt ile ölçtüğü için hücre fontu 10 pt olan şablonda boş hücreli satırlar 2,4 pt uzuyor, tablo Word'de 4,8 pt uzun çıkıyordu. Düzeltme: `engine/src/docx/paragraphs.js` — görünür metni olmayan paragrafa paragraf işareti fontu yazılıyor.
- İki düzeltmeyle AFSÜ: kayan sayfa 8 (düzeltmesiz) → 12 (yalnız CSS) → 8 (CSS + boş hücre); s.16/17 ve s.35/36 artık kaymıyor. Diğer beş şablon ve MCBÜ LEE sonuçları değişmedi.
- Kalan (düzeltmelerden bağımsız, eski): AFSÜ s.8–9, 24–26, 43–45 (uzun tablonun Word'de farklı satırdan bölünmesi vb.), MCBÜ Tıp %1,63, İYTE %4,1 ve alan yenilemede 58→56 sayfa, AKÜ Mat. %2,44, AKÜ SBE %0,91, ADÜ %0,37 sözcük başka sayfada. Bunların kök nedenleri araştırılmadı.
- Kontroller: 1130/1130 birim testi, üretim derlemesi; `check.mjs --word`: mcbu-lee 108 PASS, aku-sbe 176 PASS, adu-sagbil 304 PASS, afsu-lee 92 PASS + 2 FAIL (`body-font`, `phd-body-font`: PDF'te `SymbolMT`; düzeltmesiz PDF'te de s.3'te aynı font var, değişiklikten bağımsız).

Açık kalan: listeden sonra gelen şeklin açıklaması Word'den ~6 pt aşağıda (s.14/34/54); diğer şablonların kontrolleri bu turda yeniden çalıştırılmadı.

## Adım 2: şekil ve liste boşluğu (aynı gün)
Ortak ölçüm kapısı (`engine/tools/parity.mjs`) ile üç ortak kural tek yere alındı (`engine/src/blockGap.js`), editör CSS'i ve DOCX yazıcısı aynı değeri okuyor:
- `figureAlign`: DOCX şekli her zaman ortalıyordu, editör yalnız `box` tanımlıysa ortalıyordu; AFSÜ, ADÜ, İYTE'de şekil editörde 48–69 pt solda çıkıyordu. Şimdi `box.align`, yoksa `figures.align`, yoksa ortalı.
- `figureMargins`: DOCX şeklin dış boşluğunu sabit 15 pt yazıyordu, editör şablonun `box.spaceBeforePt/AfterPt` değerini kullanıyordu (AKÜ SBE'de 0/0). Şimdi `box` değerleri, yoksa 15 pt.
- `LIST_SPACE_AFTER_PT` (6 pt): editör her listenin altına 6 pt koyuyordu, DOCX'te liste sonrası 0'dı (madde işaretli ve numaralı liste arası, liste sonrası paragraf). Şimdi DOCX'te en dıştaki listenin son paragrafına aynı değer yazılıyor (yalnız `blockGap` yokken).
Sonuç (gövde ×2, Word): şekil konum farkı yedi şablonda da ≤0,1 pt (önce 6–69 pt); kayan sayfa AKÜ SBE 6→2, MCBÜ Tıp 16→12, MCBÜ LEE 0; diğerleri aynı; hiçbir şablon kötüleşmedi. 1130/1130 birim testi, üretim derlemesi, `check.mjs --word`: 18/19 hedef tam PASS (`afsu-lee` 2 eski `SymbolMT` FAIL; `aku-isg-tezsiz-proje` `engine-layout-pdf-default` 60,5 mm FAIL, s.7 içindekiler satırları, figür hizası kapalıyken de çıkıyor, tüm değişikliklerin geri alınmasıyla sınanmadı).
Kalan kümeler (adım 3–4) GOREVLER.md madde 0'da.

## Adım 3: bölüm başlangıçları ve özel sayfalar (aynı gün)
- **Bölüm başlığı üst boşluğu:** Word, `pageBreakBefore` veya gerçek sayfa sonu sonrası paragrafın üst boşluğunu atar (ölçüldü: gerçek sayfa sonu run'ı da 71,3 pt verdi), yalnız yeni bölüm (`sectPr nextPage`) sonrası uygular. Editör zorunlu sayfa sonrası boşluğu korur. Üst boşluğu > 0 olan sayfa başı 1. düzey başlık artık kendi Word bölümünü açıyor (`docx/body.js`, mevcut `chapterSplits` mekanizması). AKÜ SBE bölüm başlıkları Word'de editörden +12,1 pt → ≤1 pt. Bu yolda ayrıca additive boşluk, bölme sonrası başlığa önceki paragrafın `space-after`'ını ekliyordu (12 yerine 18 pt); boşluk artık bölmeden önceki stile göre hesaplanıyor. Resmî AKÜ SBE kılavuzu "12/12 pt, her zaman yeni sayfada" der, sayfa üstündeki konumu belirtmez; editörün mevcut (12 pt korunan) konumu değişmedi.
- **Dil:** `ThesisEditor.jsx` sayfa kapsayıcısı `lang={model.language}`. Önce en yakın `[lang]` `<html lang="tr">` olduğundan İngilizce şablonda CSS `text-transform: uppercase` ve PDF yazıcısı Türkçe kurala göre büyütüyordu ("EXAMİNİNG THE DİGİTAL LİTERACY"); Word "EXAMINING". İYTE kayan sayfa 39→36.
- **Özel sayfa metin bloğu yüksekliği:** editör `min-height: heightMm` uyguluyor, DOCX uygulamıyordu. `docx/specialPages.js`: `heightMm` olan metin bloğu kenarlıksız, en az o yükseklikte tek hücreli satır. İYTE kapağında öğrenci adı +72,7 pt → 0. Grup `minHeightMm` için aynısı denendi: İYTE onay sayfası editörde alt kenar boşluğunun 8 pt altına taşıdığı için Word 59 sayfa oldu; geri alındı.
- Testler: 1131/1131 (`thesisOmitOnChapterStart.test.js`: "DOCX output is unchanged without the option" başlık üst boşluğu 0 ile yalıtıldı, yeni kural için bir test eklendi); üretim derlemesi; `check.mjs --all --word`: afsu-lee (2 eski SymbolMT FAIL; ilk koşuda geçici dışa aktarma hatası, tek başına yeniden çalışınca aynı sonuç) ve aku-isg-tezsiz-proje (eski 60,5 mm FAIL) dışında tüm hedefler ve `engine-word-*` kümeleri geçti.

## Adım 4: sayfa kırma farkları (aynı gün)
- **Başlık koruması:** editörde başlık, şekil ve tablo sarmalayıcıları için "satırın alt boşluğu da sığmalı" koruması var (`pageLayout.js`). `keepWithNext` olmayan başlıklar Word'de normal paragraf gibi sayfa sonuna konuyor (ADÜ: DOCX `keepNext=0`, Word başlığı y=756'ya koydu, editör bir sonraki sayfaya taşıdı). Bu başlık düzeyleri için koruma kaldırıldı. ADÜ kayan sayfa 4→0, sözcük %0,37→0,21.
- **Denklem:** KaTeX'in varsayılan `katex-display` margin'i (1 em) `lineHeight` olmayan `equations` kuralında kalıyordu; her durumda sıfırlandı. AFSÜ denklem numarası farkı +32,2→+22,2 pt.
- **Altbilgi sayfa numarası:** paragraf işareti (`w:pPr/w:rPr`) numaranın fontunu taşımıyordu; Word satırı 12 pt işaretle ölçtüğü için 10 pt numara 1,1 pt yukarıdaydı (AKÜ Matematik). Düzeltildi; AKÜ Mat. ön sayfa sapması 10→1, `engine-word-pagefit` 197 PASS+16 SKIPPED → 213 PASS.
- **Dipnotlu sayfada gövde sınırı (çözüldü, 21.10.2026):** Word, son gövde satırının metin altını dipnot ayırıcısından en az **12,9 pt** uzakta tutuyor (6 pt ayırıcı boşluğu + satır altı 6,9 pt = `lastLineLeadingMm`; dipnot yüksekliği 0,5 pt adımlarla süpürülerek iki bağımsız eşik geçişinde 12,3–13,5 aralığı bulundu) ve paragrafın **son satırı** için `space-after`'ı da ekliyor (tek satırlık paragraflı sentetik DOCX: eşik 6 pt için 16,3–19,2, 12 pt için 24,1–27,0, 20,7 pt için 33,0–35,9 = 12,9 + space-after). Dipnot satır aralığı, dipnot uzunluğu ve paragraf işareti nedeni değil (deneyle dışlandı); dipnot imi kaldırılınca Word 6 satırı da sığdırıyor. Editör: `engine/src/footnotes.js` `cutTarget`: paragraflar için dipnot satır boşluğuna göre ekstra pay (`noteClearanceShortfallPx`: AFSÜ'de 0, İYTE'de ≈3 pt) ve yalnız `paragraphSpacing: additive` şablonlarda sondaki boşluk (`trailingGap`). Ölçüm kapısı: AKÜ Mat. 22→0, AKÜ MBG 22→0, AKÜ FBE 22→0, İYTE 36→10 kayan sayfa; kötüleşen yok. AKÜ Coğrafya'da (`collapse`, 6/6 pt) sondaki boşluk kuralı 0→28 sayfa kaymaya yol açtığı için uygulanmıyor. MCBÜ Tıp'ta sonraki blok zorunlu sayfa sonuyla başlıyorsa onun üst boşluğu sayılmıyor (aksi halde editör 31, Word 30 sayfa).
- Testler 1131/1131, üretim derlemesi, `check.mjs --all --word` (26 hedef/küme): `afsu-lee` (2 eski SymbolMT FAIL) ve `aku-isg-tezsiz-proje` (eski 60,5 mm FAIL) dışında hepsi geçti.

## Sınırlar (ölçülmedi)
Tek bir sentetik içerik türü; gerçek kullanıcı metni, tablo içi görsel, geniş/taşan tablo, yatay sayfa, sayfa sonuna denk gelen şekil/tablo, ardışık bölümsüz uzun akış (kayma yayılımı) denenmedi. Kayma kök nedeni araştırılmadı. Yapılan tek araç değişikliği: `engine/tools/export.mjs` "Hazırlanıyor…" meşgul kontrolü (şerit düğme metni değiştiği için PDF aktarımını yanlışlıkla başarısız sayıyordu).
