# Görev 13-B/13-C — Ayrılmış tez doğrulaması ve özellik rehberi

Tarih: 11.10.2026. Motor kodu değiştirilmedi; yalnızca bu klasördeki araçlar ve rapor yazıldı. Sayfa sayıları paralel ajanlar nedeniyle güvenilmez; yalnızca işlevsel kanıt verilir.

## Araçlar (hepsi `orchestration/engine-work/mission13/`)
| Dosya | Ne yapar |
|---|---|
| `heldout-diff.mjs` | `MODE=node` veya `MODE=browser`: SRC08/SRC10 içe aktar, kaydet/aç (payload), DOCX üret, kaynakla içerik+biçim farkı. Çıktı `heldout-diff.<mod>.json` |
| `browser-gen.mjs` | Aynı hattı gerçek Chromium'da (DOM ayrıştırıcılarıyla) çalıştırır, `*.browser.docx` yazar (kendi Vite'ı: `ORIGIN`, varsayılan 5191) |
| `interact.mjs <EDGE_NOTES\|s1\|SRC10>` | Yazma, Enter, seçim, gerçek Ctrl+C/X/V, IME (CDP composition), geri al/ileri al, kaydet/aç; `interact-<id>.json` |
| `enter-race.mjs`, `dbg3.mjs`, `miss.mjs`, `grep.mjs`, `probe-list.mjs` | Hata yeniden üretme / inceleme yardımcıları |

## 13-B — SRC08 (DEU Fen Dr, EN) ve SRC10 (Yaşar Lisansüstü, EN)
Boru hattı: `importThesisDocx` -> `installContentDocument` -> `buildNotePayload/noteFromPayload` (kaydet/aç) -> `compileThesisDocument(generic)` -> `buildThesisDocx`. Kaynak SHA-256 kilitli.

Gerçek tarayıcıda (kullanıcının yolu): kaydet/aç belgesi birebir eşit; kaynak ile çıktı gövde metni **sırayla birebir** (SRC08 671/671, SRC10 1675/1675 paragraf; 2080 / 15641 sözcük aynı). Tablo (1/13), satır, hücre, `drawing` (25/14), OMML (4), bölüm sayısı (6/19; SRC10'da 20->19 sectPr) korunur. Yeniden içe aktarımda bölüm sayısı aynı.

Biçim farkları (`generic` şablonu uygulandığı için bir kısmı BEKLENEN şablon yeniden biçimlemesidir: yazı tipi/boyut/hizalama):
- Yazı tipi Arial/Calibri/Cambria -> Times New Roman 12 pt; hizalama merkez/sol -> iki yana/sol (şablon etkisi).
- Satır içi renk (SRC10 1981 -> 4), vurgu (2 -> 0), altı çizili (8 -> 0), üst simge (SRC08 1 -> 0) kayıp: **biçim kaybı**.
- Alanlar (TOC/PAGEREF/REF/SEQ: SRC08 71, SRC10 122 `instrText`) çıktıda canlı alan değil; içindekiler motorun kendi dizini olarak yeniden üretiliyor, çapraz başvurular düz metin.
- İç köprüler (SRC08 37 -> 0; SRC10 87 -> 18 dış), sayfa kesmeleri (7 -> 0 / 1 -> 0; bölüm/başlık kuralıyla yerine geçiyor), `w:pict` (11 -> 0, `drawing` olarak korunmuş), `w:sdt` içerik denetimleri (34 / 3 -> 0), başlık stili sayısı 22 -> 20 ve 35 -> 13 (alt başlık stilleri gövde/liste olarak yazılıyor), yer imi 54 -> 51 / 192 -> 178.
- İçe aktarma uyarıları (korunmuş ama uygulanmayan): SRC08 `unmapped-property` 1737, `script-font` 875, `field-refresh` 73, `tab-layout` 18, `alternative-content` 11; SRC10 `unmapped-property` 3495, `script-font` 982, `field-refresh` 125, `tab-layout` 70, `table-layout` 13, `external-relationship` 18, `equation-layout` 4, `nested-section` 1.
- Not: `<w:b w:val="0"/>` gibi açık kapatma öğeleri sayıldığından "kalın/italik" sayıları (189 -> 1693) yanıltıcıdır; gerçek kalın/italik kaybı ayrıca ölçülmedi.

Düğüm (Node) yolu uyarısı: Node'da `document` yok; `academicDocument.js` regex yedek ayrıştırıcıya düşer ve **iç içe liste** bozulur (alt listenin ilk maddesi üst maddeyle birleşir, düzey 0'a düşer; SRC10'da 8 paragraf, SRC08'de 7 "farklı"). Tarayıcıda DOM yolu doğru. Node tabanlı CLI/test hattı yalnızca arayüz dışı kullanılıyorsa etkilenir (`resume-heldouts.mjs` bu yüzden bu hatayı görmez, yalnızca ham `w:t` sırasını karşılaştırır).

## Kısa özellik rehberi (içe aktarılan Word tezi)
- Korunur: gövde metni ve sırası, kalıcı düğüm kimlikleri, tablo yapısı/birleşik hücreler, resimler (`drawing`), denklemler (OMML), bölümler, kaydet/aç kayıpsız.
- Şablona çevrilir (kasıtlı): yazı tipi, boyut, hizalama, boşluklar, başlık/ön sayfa düzeni.
- Düz metne iner: canlı alanlar (REF/SEQ/PAGEREF), iç köprüler, içerik denetimleri.
- Kaybolabilir: satır içi renk, vurgu, altı çizili, üst simge (içe aktarma uyarısı listesine bakın).
- Düzenleme: yazma, seçim, kopyala/kes/yapıştır, IME, geri al/ileri al çalışır (aşağıya bakın).

## 13-C — Etkileşim sonuçları
Sonuçlar `interact-*.json`; özet raporun sonunda ve `orchestration/engine-work/motor.md` kaydında.

Ölçülen belgeler: küçük `EDGE_NOTES` (11 paragraf, localStorage), orta `s1` (118 paragraf), uzun SRC10 (19 bölüm, 1836 paragraf, 17,5 MB; bellek içi + `page.route` ile kaydedilmiş belgeyle yeniden açma).
- PASS (üçünde de): yazma, gerçek Ctrl+C/Ctrl+V, dış düz metin yapıştırma, Ctrl+X ve geri yapıştırma, seçim, IME composition (bayrak, commit, iptal), 40 geri al / 60 ileri al, kaydet/aç sonrası düzenleme ve ekranda görünüm, geçici işaretleme (`data-thesis-word-fit`, `data-thesis-fn-stamp`) kayda sızmıyor, sayfa/konsol hatası yok.
- Gözlem (hata değil): IME bileşimi sürerken yazılan geçici metin kayıt akışına girebiliyor (`ime_composing_text_autosaved_info`); iptal/commit sonrası temiz.
- **HATA (s1 ve SRC10; EDGE_NOTES'ta yok):** Enter paragrafı böler ama imleç yeni paragrafa geçmez; hemen ardından yazılan metin ilk yarının sonuna eklenir. Yeniden üretme: `node orchestration/engine-work/mission13/enter-race.mjs s1`. Beklenen: metin 2. paragrafın başında. Gerçek: ilk yarının sonunda (400 ms bekleme de değiştirmiyor, yani yarış değil). Kod: `RichTextBody.jsx` ~satır 711-745 (Enter -> `execCommand("insertParagraph")` -> `emitChange("input")`); şüphe: sonrasındaki yeniden sığdırma/`data-thesis-word-fit` düzeni seçimi eski konuma döndürüyor (EDGE_NOTES'ta word-fit yok).
