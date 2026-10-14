# Görev 07 — Uzun tezlerde sayfalama

Durum: **METİN AKIŞI ÖLÇÜTÜYLE KAPATILDI · 10.10.2026** (kullanıcı kararı). Metin ağırlıklı sayfalarda sayfa başlangıçları Word ile eşlendi; uzun tezin toplam sayfa sayısı/kırılımları Word ile aynı DEĞİL: şekil, tablo ve kapak kaynaklı fark Görev 08–10 kapsamına devredildi.

## Değişenler
- `thesis/engine.js` `withSourceLastLineLeading`: içe aktarılan bölümlerde Word'ün "son satır ekstra satır aralığı olmadan sığar" kuralı kaynak gövde stilinden hesaplanıyor.
- `thesis/docx/projection.js`:
  - asılı girinti çift uygulanıyordu (kaynakça 8 mm dar çıkıyordu);
  - boş paragraf Word'deki gibi tam satır (sıfır genişlikli dayanak);
  - paragraf işareti gizli ve yalnız yer imi içeren paragraf (ve yalnız onu içeren liste/öğe) Word'deki gibi kaybolur;
  - `contextualSpacing`: aynı stildeki komşu paragraflar arasındaki boşluk kalkar;
  - liste düzeyi girintisi (`left/hanging`) Word'deki metin kenarına oturur; Symbol işaretli maddenin ilk satırı Word'deki gibi 0,85 pt uzun.
- `thesis/shortParagraphs.js` (+ `ThesisEditor.jsx`, `pageLayout.js`, `sourceHtml.js`): 2–3 satırlık paragraf bütün tutulur (Chrome 3 satırı 2+1 bölüyordu; Word dul/yetim kuralı bölmez). İşaret kayda yazılmaz.
- `thesis/wordLineFit.js`, `wordLineLayout.js`: Word, harf/rakamlar arasındaki tireden sonra satır kırabilir ("damage-/related").
- `thesis/sourcePageFrame.js`: ilk sayfa alt bilgisi bölümün tüm sayfalarının gövdesini daraltmıyor.
- `templates/aku-sagbil.js`: beş/altı jüri üyesinde onay sayfası taşmıyor (üçüncü imza satırı için sıkıştırılmış yerleşim). `toc-page-labels-editor` FAIL kapandı.
- `orchestration/specs/aku-sbe.checks.json`: dört İngilizce sayfa-etiketi beklentisi Türkçe uzun fixture'dan kopyalanmıştı (11 ön sayfa / 3 kapak sayfası); İngilizce fixture kurallarından türetilen 7 / 2 olarak düzeltildi (beklenti değişikliğidir, motor değişikliği değildir; gerekçe satırın `locator` alanında).
- Paralel ajan turu: (1) başlık/tablo ajanı `projection.js`'de paragraf satır yüksekliğini en büyük yazı boyutundan almayı (`largestRunBase`) ve içe aktarılan tabloları satır satır bölmeyi (`tableChainsWithNext` yoksa) ekledi, sentetik 12 sayfalık DOCX'lerle gerçek Word'e karşı denendi (`orchestration/engine-work/mission07/synthetic/`); (2) hız ajanı `wordLineLayout.js` bölüm seçicisini hızlandırdı (SRC10'da ~%15); (3) dipnot ajanı `footnotes.js`'de hata bulmadı.
- Boş paragraf dayanağı ilk sürümde belge çapında `:has()` seçicisiydi; SRC09'da renderer'ı varsayılan JS yığınında çökertiyordu. Model kaynaklı düğüm başına kurala çevrildi (`paragraphHasContent`), SRC09 yeniden ~220 sn'de hazır.
- Testler: `thesisShortParagraphs`, `thesisImportedFlow`, `thesisHyphenBreaks`, `docxProjectionPagination` (836 test).

## Doğrulama
- 836 birim testi PASS, üretim derlemesi PASS.
- 25 hedefli genel regresyon: tek FAIL ADÜ Ziraat kapak taban çizgisi (Görev 08). Önceki 6 FAIL'den Sağlık (1) ve SBE (4) kapandı.
- Gerçek Word grupları: 617 PASS (22+213+148+136+64+34), tabanla aynı; son değişikliklerle yeniden çalıştırıldı.
- AKÜ SBE: tek başına 5/5, 11 hedefli seride ve temiz 25 hedefli tam seride 121 PASS / 0 FAIL. Yük altında (aynı anda SRC09 oturumu / derleme sonrası ilk koşu) iki kez "sayfalama son ölçümle doğrulanmadı" hatası görüldü; temiz koşullarda yeniden üretilemedi, kök neden çözülmedi.
- Word referansıyla sayfa başlangıcı hizası (`orchestration/engine-work/mission07_stats.py`):
  - SRC10 (EN, ayrılmış kabul belgesi): Word s.25–37, 39–44, 49–52 aynı sayfa başlangıcı; 21 → 41 sayfa; editör 97 sayfa (Word 91).
  - SRC09 (TR, 180 sayfa): kaynakça s.131–149, 87–92 vb.; 34 → 49 sayfa. Editör sayfa sayısı 370 → 278 (Word 180). Ajan değişiklikleri sonrası hizalı sayfa 53 → 49, toplam 292 → 278: tablo bölme Word'e yaklaştı, bazı sayfa başlangıçları kaydı.

## Açık (Görev 07 kabulü sağlanmadı)
- SRC09: 278 sayfa, Word 180. SRC10: 97 sayfa, Word 91. Kalan sapma: şekil/çizim (örn. Paydaşlar Kümesi), çok sayfalı tablolar ve yatay ek bölümü, kapak/onay aktarımı (Görev 08–10). Kalan "Şekil/tablo yok" sayfalarda başlık-numarası ("3.", "3.1.") kaynak numaralandırmasından görünmüyor.
- Dipnotlu uzun sayfalar SRC09/SRC10'da ayrıca ölçülmedi (EDGE_NOTES'a bağlı mevcut test sürüyor).
- Tek karakter eklemesinden sonra 292 sayfalık belgenin yeniden yerleşimi ~10,5 sn; ilk yükleme ~3 dk. Akış zaten tarayıcı parçalamasıyla yerel yeniden hesaplanıyor; hız iyileştirmesi yapılmadı.
- Ölçüm araçları: `orchestration/engine-work/mission07_*`; `TxtNote/frontend/tests/generated/` (üretilmiş fixture, commit edilmemeli).
