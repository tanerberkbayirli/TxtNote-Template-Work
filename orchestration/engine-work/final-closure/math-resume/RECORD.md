# Yerel Word denkleminde limit yerleşimi — önizleme hatası kapandı

12.10.2026, Codex. Kapsam: yeni DOCX içe aktarmasında toplam/integral limitlerinin kaynağa göre üst-alt veya yan konumlanması ve gizli limitteki içeriğin korunması. Tam denklem yüksekliği ve Word sayfa uyumu bu kaydın kapanış kapsamı değildir.

## Değişiklik

Eski önizleme tüm n-ary nesneleri `msubsup` ile çiziyordu. İlk düzeltmede `munderover` / `munder` / `mover` seçenekleri ve gizleme işaretleri eklenmişti; bu oturumda eksikler tamamlandı:

- `settings.xml` ilişkisinden okunan `m:mathPr/m:naryLim` ve `m:intLim` varsayılanları önizlemeye aktarılır. Ayar parçasının adı sabit varsayılmaz.
- Nesne üzerindeki açık `m:limLoc` belge ayarına üstün gelir; boş `m:limLoc` üst-alt yerleşim demektir.
- Değersiz `m:subHide` / `m:supHide` uygulanır; 0/false/off uygulanmaz.
- Gizli limitte metin varsa, gerçek Word gibi sonraki görünür alana taşınır. Alt limit gizliyse üst alana, üst de gizliyse gövde başına gider. Kaynak metni önizlemeden silinmez.
- Orijinal OMML dışa aktarma otoritesi olarak korunur.

Microsoft'un belge ayarları / limLoc önceliği açıklaması: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/990a0cc1-139d-4021-ac11-ef47f90db5eb . Kod testlerine ek olarak gerçek Word davranışı aşağıda ölçüldü.

## Kanıt

- `generate.mjs`: sıfırdan içe aktarılmış NARY_RESUME, SRC09_MATH_RESUME, SRC10_MATH_RESUME test belgeleri. Önceden kaydedilmiş önizlemeli fixture'lar güncel davranış kanıtı sayılmadı; kullanıcı belgeleri değiştirilmedi. Eski saklanmış MathML önizlemeleri için otomatik göç bu değişikliğin kapsamında değildir.
- `check-browser.mjs` / `browser.json`: gerçek Chrome, 8 durum PASS, 0 tarayıcı hatası. Üst-alt/yan limit konumları gerçek dikdörtgenlerle; görünmeyen limit alanları ve tüm L/U/x içeriği doğrulandı.
- `nary-source.docx` → `nary-word.pdf`: `word2pdf.ps1` kendi Word örneğini başlattı (PID 26748) ve kapattı. Word 16.0.20430. `check-word.py` / `word-check.json`: 8 durum PASS; konumlar ve gizli içerik taşıması doğrulandı. İlk PDF sayfası PNG olarak görsel incelendi.
- Hedefli denklem testleri: 13/13 PASS. Tam birim: 978/978 PASS, 0 FAIL, 0 atlama (`unit.log`). Üretim derlemesi PASS (`build.log`).

## Uzun belge etkisi — kapanmadı; SRC09'da bir ek kayık açılış

- SRC10 taze içe aktarım: 91/Word91, kapsam 0.99605, 75 açılışta 8 kayık, tarayıcı hatası yok (`long/SRC10.breaks.json`). Önceki sonuçla aynı. SRC10'da n-ary nesnesi yok; diğer denklem yüksekliği sorunları sürüyor.
- SRC09 son kaynakla taze içe aktarım: 178/Word180, kapsam 0.96883, 157 açılışta **44 kayık**, tarayıcı hatası yok (`final-long/SRC09.breaks.json`). Önceki kaydedilmiş fixture'ın 43 kayık sonucundan bir fazla. Fark denklem bölgesinde: Word s.101/102 açılışlarının token ofsetleri 26/22 → 56/47; s.103 de 47 token ile kayık oldu. Bu sonuç gerilemesiz tam Word paritesi olarak sunulmuyor.
- Doğru limit çizimi, eksik doğal denklem yüksekliği / ek satır payı modeliyle birlikte ele alınmalı. Kabul eşiği ve kaynak şablon ölçüleri değiştirilmedi.
- Kaynak/harness parmak izi `24020afab1fa30385eeb436421f30e8a41e1ddf6dfd1c3d3c4dd3d42c1b555fc` (873 dosya). Son genel kabul çalıştırılmadı; önceki genel FAIL kayıtları değiştirilmedi. Commit yok.
