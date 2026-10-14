# TxtEngine 1.0 kapanış kaydı — 12.10.2026 (devam oturumu)

Çalışma notu: bu kayıt yalnız bu oturumda ölçülen/uygulananları içerir. Eski ara çıktılar (final-2026-10-12*, long/g*, min-physical) kabul sayılmadı.
Tanı/deney betikleri ve ham çıktılar bu dizindedir (`resume2/`); tüm Word ölçümleri bu oturumda sahip olunan örneklerle alındı.

## İŞ2 — AFSÜ 36/37 farkı: KAPANDI (kök neden bulundu ve düzeltildi)

Güncel kodda hata yeniden üretildi (`afsu/check-20261012-1425.json`: 8 FAIL, PDF 36 / Word 37, master ve phd).

Kök neden: dışa aktarılan DOCX `settings.xml` içinde `w:footnotePr` ile ayırıcı dipnotları (`-1`, `0`) tanımlamıyordu. Word bu durumda paket
ayırıcısını yok sayıp kendi yerleşik ayırıcısını (Normal stilinde 12 pt paragraf: Times New Roman'da 13,8 pt) çiziyor; editör ise
`spaceBeforePt + thicknessPt + spaceAfterPt = 9,5 pt` ayırıyor. Dipnot alanının üstü Word'de 716,4 pt, editörde ~720,7 pt olduğundan
"3.1 2." paragrafının iki satırı (tam satır kutusu 720,4 pt) editörde sığıyor, Word'de sığmıyor.

Kanıt (gerçek Word, `exp/fs9.5`, `exp/fs6`, `exp/fsorig`): yalnız ayırıcı biçimi değiştirilip `settings.xml`'e `footnotePr` eklendiğinde paragraf 22. sayfada
kalıyor ve sayfa sayısı 36'ya iniyor (689,86 / 710,50 pt; editör 689,68 / 710,38). Eski tanı denemesinin (`afsu-separator95`) sonuç vermemesinin nedeni:
`footnotePr` olmadığı için Word değişikliği hiç kullanmıyordu.

Düzeltme: `docx/package.js` `noteSeparatorXml` + `finalizeThesisDocx({noteSeparator})`, `export.js` ilk `pageBottom` dipnot kuralını ayırıcı olarak geçiriyor
(çizgi = paragrafın üst kenarlığı, genişlik = sağ girinti, boşluk önce = `spaceBeforePt`, tam satır yüksekliği = `spaceAfterPt`). Kaynak orphans/widows,
tablo satır yüksekliği ve ayırıcı ölçüleri DEĞİŞMEDİ.

Doğrulama: `afsu2/check-20261012-1430.json` — afsu-lee INFO=1 PASS=94 FAIL=0 (master + phd, gerçek Chrome + gerçek Word). Dipnot taşıyan diğer hedefler
(`foot/`): afsu-eczacilik-proje, afsu-tip, aku-kimya-lisans, aku-matematik-lisans, aku-mbg-lisans, mcbu-tip-uzmanlik, engine-word-pagefit (213 PASS),
engine-word-parity (148 PASS): 0 FAIL. Birim: `thesisNoteSeparator.test.js` (3 test).

## İŞ1 — SRC09/SRC10 uzun belge uyumu: KISMEN; gerçek kalan farklar aşağıda

Yeni, sıra duyarlı karşılaştırıcı: `long/compare-breaks.py` (difflib ile token akışı hizası; ilk-30-karakter araması değil — TOC/yinelenen hücre yanıltmaz). Her Word
sayfasının ilk tokenini editör akışında bulur; sayfa açılışı bir editör sayfa başlangıcında değilse (bullet/numara için 2 token toleransı) "kayık açılış" sayar;
metin kapsamı Word karakterlerinin sırayla bulunma oranıdır. Toplam sayfa sayısı tek başına geçer sayılmaz. `long/extract-words.js` (yeni) editörün span'larla böldüğü
sözcükleri (y+ö+netimi) tek sözcük olarak birleştirir.

Başlangıç (bu oturumun ilk ölçümü, `long1`): SRC09 178 / Word 180, SRC10 91 / 91 — ama SRC10'da 75 kontrol edilen Word sayfa açılışından **27'si kayıktı**
(toplam eşitliği yanıltıcıydı).

Bu oturumda bulunan ve düzeltilen GENEL nedenler (hepsi gerçek Word/PDF kanıtlı):

1. **İçe aktarılan tek aralıklı paragraflar son-satır payı alıyordu.** Word bir sayfanın son satırına yalnız o paragrafın kendi ek satır boşluğunu verir (tek aralık 0).
   Editör sütunu gövdenin payını (1,5 satır TNR 12: 6,9 pt) tüm paragraflara veriyordu; şablon paragraf stilleri korunuyor, içe aktarılan (`data-docx-style`) paragraflar korunmuyordu.
   SRC10 s.53: "Source: Javatpoint" (TableofFigures, tek aralık) kutusu 760,4 pt, alt sınır 759,8 pt — Word sonraki sayfaya alıyor, editör almıyordu.
   Düzeltme: `docx/projection.js` paragraf başına `padding-bottom = --thesis-col-lead − kendi payı` + iptal eden `::after` (`pageLayout.js` `--thesis-col-lead`). Yalnız gövde paragrafları (hücre, liste, kutu, resim hariç).
2. **Liste metni ilk satırı.** Word, işaretten sonra metni ilk açık sekme durağına koyar (Yaşar `GvdeMetni1`: durak 28,1 pt < girinti 36 pt) — ilk satır 7,9 pt geniş. Editör 36 pt'te başlatıyordu
   ("False Negative" maddesinde "Negative”" alt satıra düşüyordu). Düzeltme: `listTabShift`.
3. **`w:noWrap` hücre.** Otomatik sığdırma tablosunda dar hücre başlığı ("Literatür") editörde bölünüyordu (+20 pt satır, tabloda bir satır eksik sığıyordu). Düzeltme: hücre `white-space:nowrap`,
   `wordLineLayout` nowrap paragrafı atlıyor, sabit yerleşimli tablolarda uygulanmıyor (Word da yok sayar).
4. **Manuel sayfa sonu.** `<br data-docx-break=page>` satır içi olduğundan `break-after` hiç etki etmiyordu (SRC10 EK-2 başlığı önceki sayfaya yapışıyordu). Paragraf-başına kural (`endsWithPageBreak`),
   depodaki "`:has(` kullanma" birim korumasına uygun.
5. **Başlık sayfası alt bilgisi payı.** Gövdeyi kısaltan ilk-sayfa altbilgisinde de (dipnotlu sayfa gibi) son-satır payı verilmemeli (SRC09 s.117: Word "6) Operasyonel"i almıyor). `footnotes.js layoutFirstPageReserves`.

Sonuç (son kaynak sürümü, `long17`/`long18`): SRC10 **91/91 sayfa, 75 açılışın 8'i kayık (27'den), metin kapsamı 0,996**; SRC09 **178/180 sayfa, 157 açılışın 43'ü kayık (ilk ölçümde 47+), kapsam 0,969**.
Kapanmadı. Ölçülmüş, kaynak kanıtlı kalan nedenler:

* **Denklem satır yüksekliği (SRC10 s.58→59 ve SRC09 s.97–129).** Gerçek Word ölçümü (`exp/eqprobe*.docx`, TNR 12, 1,5 satır): satır yüksekliği = matematik doğal yüksekliği + 6,9 pt
  (ek boşluk fontun tek satırından, matematikten değil). Doğal yükseklikler: düz metin 14,1; üst/alt simge 14,2; karekök 16,4; kesir 24,7; "etiket= (TP)/(TP+FP)" 29,9; Σ üst/alt sınırlı 39,2; diğer metinle aynı satırda kesir 19,2–22,6.
  Editörde (MathML) aynı paragraflar 21 pt (kesir/Σ ölçülerinden 10–25 pt kısa) — her denklem sayfasında satır kayıyor. Çözüm Cambria Math MATH tablosundan yükseklik modeli gerektirir; yapılmadı.
* **Kare-sarmalı yüzen şekiller (SRC09 s.48–51).** Word boş paragraflar + `wrapSquare` metin kutularında altyazıyı kutuların altına iter (altyazı 565,3 pt; editör 508,4 pt: 53 pt eksik). Editör yüzen nesneleri akışa katmıyor.
* **Satır sığdırma ±0,4 pt gürültüsü.** SRC10 s.57 ("False Negative" 382,9 pt ölçüye 383,29 pt gerekiyor; Word sıkıştırarak sığdırıyor) ve s.68/69 (bir sözcük "the" ters yönde). Word'ün gerçek sığdırma
  deneyi (bold/regular, 0,5 pt adım) modelin 8,25 pt sıkıştırma bütçesini ±0,5 pt içinde doğruluyor; kalan fark glif ilerlemesi yuvarlama düzeyinde.
* **SRC10 EK-2 SQL listesi s.88–91:** 4–10 token'lık satır kayması.
* **SRC09 EK-2 yüzen tablo (`tblpPr`, 70 satır, s.150–180):** bölünen satır devam parçası asgari yüksekliği (önceki açık iş) çözülmedi; son 23 sayfanın 21'i kayık.
* SRC09 s.91 Pareto grafiği ve s.41/84–86 küçük farklar.

Reddedilen/geri alınan deneyler (kanıtla): hücre paragraflarına terminal-leading koruması (SRC10'da 8→11 kayık; SRC09'da yalnız sayfa sayısını 180'e getirdi, açılışları düzeltmedi — "toplam eşitliği" tuzağı,
bu yüzden uygulanmadı); tail-reserve hâlâ geri yüklenmedi.

## Kabul

Bkz. `final-20261012-*.log`, `final-20261012/` ve `completion.json`.
