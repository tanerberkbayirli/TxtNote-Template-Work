# Motor özellikleri ve kabul kanıtları

## Kullanıcı tarafından ertelenen kapsam (13-D)

11.10.2026 son kararında uzun belgelerin Word sayfa eşliği, kalan PDF/ChartEx dışa aktarımı ve son seri genel kabul kullanıcı isteğiyle ertelendi. Bu üç kapı açık kalır; genel motor kapanışı PASS değildir. Güncel SRC09 PDF düğmesi gerçek Consolas desteğini geçip Wingdings font gömme desteğinde durur (`orchestration/engine-work/final-closure/performance/export-probe-fonts/benchmark-SRC09.json`). Yirmi ekle/sil örneği tanısal olarak ölçüldü fakat PDF/DOCX ve genel kabulü birlikte tamamlayan 20 örnek raporu yoktur; önceden tanımlı sayısal performans sınırı da yoktur. Doğrulanmış 11/12 kapsamı, gerçek Word başlıkları, yer işaretleri/alanlar ve SRC10 etkileşimi kendi kanıtlarıyla kapalıdır.

SRC08/SRC10 artık incelenmiş regresyon belgeleridir; yeni kör heldout kabulü sayılmaz. IME kanıtı CDP composition olaylarıdır, fiziksel işletim sistemi IME testi değildir. Yeni geniş koşu başlatılmadı.

11.10.2026 güncellemesi. Motorun genel kapanış durumu `orchestration/engine-work/motor.md` ve `orchestration/MISSION.md` dosyalarındadır. Bu rehber özellik kapsamını ve kanıtların sınırlarını açıklar; tek başına genel kabul sonucu değildir. Önceki rehber `orchestration/engine-work/final-closure/performance/REHBER.historical-20261011.md` dosyasında korunur.

## Ayrılmış gerçek tezler (13-B)

Sabit SHA256 kaynakları SRC08 (DEÜ Fen doktora, İngilizce) ve SRC10 (Yaşar lisansüstü, İngilizce) güncel Chrome motorunda içe aktar → kaydet/aç → generic şablon → DOCX → yeniden içe aktar yolundan geçer. `orchestration/engine-work/final-closure/performance/heldout-diff.browser.json`: kaynakla sıralı dolu gövde paragraf metni SRC08 **671/671**, SRC10 **1675/1675**; sırasıyla 2080/15641 sözcük ve 12682/108131 karakter aynıdır. Kaydet/aç belge modeli eşittir. Tablo/satır/hücre, çizim ve native OMML sayıları korunur. SDK Office2016 şeması her iki taze çıktıda **0 hata** verir (`SRC08.schema.json`, `SRC10.schema.json`).

Başlıklardaki ithal yer işaretleri artık normal başlık metnine indirgenmez: `docx/body.js` semantik satır içi işaretleri korur. Önceki çıktıda SRC08/SRC10 için 19/11 yeni bozuk PAGEREF hedefi vardı; taze çıktıda **0/0** (`heldout-fields.json`). Alan başlangıç/ayırıcı/bitişleri dengeli, yer işareti adları benzersizdir. Eski rehberdeki “canlı alanlar ve iç köprüler düz metne iner” açıklaması güncel kod için geçerli değildir.

Bu akış üniversite şablonuna uyarlamadır: şablonun gövde yazı tipi, boyutu, hizası, boşluğu ve başlık kuralları kasıtlı uygulanır. Ham XML özellik sayılarının eşitliği biçim eşliği değildir (örneğin açık `w:b w:val="0"`, köprü alt çizgileri ve varsayılan renk yazımları sayıları değiştirir). Görsel eşlik ayrı kabul kapısıdır. İçerik denetiminin işlevi, keyfi grafik/SmartArt stili ve tüm Word alanlarının uygulama içi yeniden hesaplanması sınırsız destek iddiası taşımaz; kaynak paketi ve konumlu bildirimler korunur.

## Düzenleme (13-C)

`orchestration/engine-work/final-closure/performance/interact-SRC10.json`: uzun SRC10 üzerinde yazma, seçim, gerçek sistem panosuyla Ctrl+C/X/V, dış düz metin yapıştırma, geri al/yinele, kaydet/aç ve Enter sonrası yeni paragraf başına imleç yerleşimi geçer. IME kanıtı Chrome DevTools composition/commit/cancel olaylarıdır; fiziksel işletim sistemi IME adayı penceresi testi değildir. Geçici satır/sayfa işaretleri kayda sızmaz. 200 ms yazma birleştirmesinden sonraki güncel tekrar PASS: yazma→kayıt 753 ms, yeniden açma 5,35 sn, konsol hatası yok. Bu sonuç son seri genel kabulün yerine geçmez.

`line-cache.json`: aynı DOM tekrarının no-op olması, eşzamanlı metin değişimi, genişlik, font, aynı uzunlukta stil metni değişimi, üst öğe sınıfı ve root text-transform değişimi sonrası geçersizlik; imleç koruması doğrulanır. Stil sürümleri küçük sayaçtır; tam stil metni her paragraf anahtarına çoğaltılmaz.

## Hazır durumu ve performans (07-B/C/D)

Denklem modülü/CSS/fontu henüz yüklenirken sayfalama hazır ilan edilmez. Yükleme hatası veya 30 saniyelik bekleme sonunda görünür uyarı bırakılır ve dışa aktarma hazır bayrağı kapalı kalır (`math-ready.json`). Son sayfa/dizin/dipnot doğrulama yinelemeleri ve toleransları değiştirilmez.

Yazma DOM'u ve kaydetme bildirimi hemen güncellenir; tüm tez modeli derlemesi 200 ms yazma sessizliği sonrasında yapılır. İlk düzenlemede dışa aktarma hazır durumu iptal edilir; yalnız en yeni derlenmiş neslin ölçüm onayı tekrar açar. `benchmark.mjs` 20 gerçek klavye ekle/sil örneği, input→frame fırsatı, p50/p95 yerleşme süresi, bellek, kaydet/aç ve gerçek PDF/DOCX dışa aktarma sürelerini kaydeder. Input→frame compositor sunum zamanı değildir. Başlangıçta sayısal performans kabul sınırı tanımlanmamıştı; sonradan eşik icat edilmez. Paralel ajan/HMR sırasında ölçümler tanısaldır; final seri ölçüm ayrı raporlanır.

07-D başlık numarası metin olarak DOCX'e yazılır; Word otomatik liste numarası değildir. `headings-pdf.json`, gerçek Word PDF'inde 1, 1.1, 1.2, 1.2.1, 2, 2.1 numaralarıyla altı beklenen başlığın metin kanıtıdır; ilgili DOCX SDK şeması sıfır hatadır.

## Kullanım ve sınırlar

- DOCX içe aktarımında kaynak biçimini koruma ile üniversite şablonuna uyarlama seçeneklerini ayrı değerlendirin. Özgün paket ve belirsiz özellik bildirimleri saklanır.
- Dikey/yatay bölümler, ilk/çift/tek üst-alt bilgi, Roma/Arap başlangıçları ve sayfa geçişleri desteklenir.
- Tablo birleştirmeleri, iç içe tablolar, satır bölünmesi, tekrar başlıkları, devam açıklamaları ve sayfadan uzun tablolar desteklenir. Genel toplam sayfa eşliği yalnız uzun belge kabul sonucuyla söylenebilir.
- Native OMML, DOCX'te düzenlenebilir; uygulamadaki görünüm MathML önizlemesidir. Uygulamanın formül düzenleyicisi LaTeX formüllerini düzenler.
- Dipnot ve sonnot gerçek Word notu olarak çıkar; bölüm numaralandırması yeniden başlayabilir. Eski kayıtlar için `orchestration/engine-work/mission08/resume-endnotes.json`, `resume-notes-references.md` ve `continue-acceptance/engine-word-pagefit/` kapsamlarını okuyun; uzun notun 3 sayfa kabulü ve Word düzenleme kanıtı ayrıca doğrulanmalıdır.
- Dizinler, çapraz referanslar ve ithal dengeli alanlar kalıcı hedefler ve canlı Word alanlarıyla taşınır. Bilinmeyen atıf alanı korunur; kırık hedefler görünür raporlanır. Taze SRC08/SRC10 gerçek Word alan güncelleme → SaveAs → yeniden açma turu `orchestration/engine-work/final-closure/performance/heldout-word-save.json` ve `heldout-word-reopen-audit.json` ile PASS: sırasıyla 110/164 alan, hata sonucu yok.
- Taranmış/karma PDF aktarımı yerel OCR ve düzeltilebilir önizleme kullanır. Keyfi PDF çizimlerinin kayıpsız Word yeniden yapımı garanti edilmez.
