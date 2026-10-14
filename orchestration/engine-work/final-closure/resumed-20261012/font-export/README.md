# Wingdings gerçek dışa aktarma — 12.10.2026

Güncel kodun hedefli sistem font testleri 17/17 PASS, atlama yok. SRC09 gerçek editör düğmelerinden DOCX (6,6 sn) ve PDF (11,8 sn) indirdi; tarayıcı hatası yok, 180 fiziksel sayfa. `benchmark-SRC09.json` sıfır giriş örnekli bir dışa aktarma teşhisidir; son performans kabulü değildir. Bu ilk teşhisteki ayrı payload modeli farkı sonradan giderildi ve son seri kabulde tekrar doğrulanacaktır.

`symbol-audit.json` gerçek Wingdings font programının PDF'e gömüldüğünü, `symbol-spans.json` bu fontla çizilen 170 metin parçasını kaydeder. İlk kullanılan sayfa 104'tür. Poppler ile üretilen `symbol-page-104.png` görsel incelemesinde tablo onay işaretleri doğru görünüyor; eksik glif kutusu yok. Bu dar inceleme tüm belgenin görsel kabulü değildir.
