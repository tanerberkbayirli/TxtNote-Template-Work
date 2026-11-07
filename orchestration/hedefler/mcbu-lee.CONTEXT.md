# MCBÜ Lisansüstü Eğitim Enstitüsü

Güncelleme: 26 Ekim 2026. Son denetim [CBÜ raporunda](../raporlar/MCBU_SABLON_DUZELTMELERI_2026-10-26.md); tekrar edilmeyecek değerlendirmeler [AGENTS-RAPOR.md](../AGENTS-RAPOR.md) içindedir. Bu kayıt kurum kabulü değildir.

## Kimlik ve kaynak

- Etkin kimlikler: `mcbu-lee-master-tr-v1`, `mcbu-lee-phd-tr-v1`; eski kayıt çözümlemesi: `cbu-lee-master-tr-kilavuz` (seçim listesine geri eklenmez).
- JSON: `Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/`; modül `engine/src/templates/mcbu.js`.
- Kaynak: aynı üniversite klasörünün `Lisansustu_Egitim_Enstitusu_Tez/MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx` belgesi. Kaynak önceliği [BASLA.md](../BASLA.md) içindedir; eski “XML her durumda kazanır” notu genel kural değildir.

## Doğrulanmış düzen

- A4; sol 40 mm, üst/sağ/alt 25 mm; Times New Roman 12; gövde iki yana yaslı, 1,5 satır ve 12,5 mm ilk satır girintisi; paragraf aralığı 6 nk.
- ÖZET'ten büyük Roma I; GİRİŞ'te Arabik 1. Anahtar kelime blokları girintisizdir.
- Kılavuz PDF s.10: içindekiler kendisini listeler; ana bölüm numara/ad bloğu ortalı, iki satır ve sayfa numarasızdır. Diğer girdilerin sağa hizalı sayfa sekmesi bu bloğa zorlanmaz.
- Kılavuz PDF s.11: gövde bölüm başlıkları 12 punto, koyu, büyük harf ve iki yana yaslıdır; kısa başlık solda görünür.
- Simgeler 1,5; şekil/tablo dizinleri tek satırdır. Şekil/tablo yok diye boş dizin sayfalarını kaldıran açık zorunluluk doğrulanmadı; bu çalışmada korundu.
- Özet/abstract tek satır tercihi önceki kullanıcı kararıyla korunur; kaynağın çelişen tarafı şablon notlarında tutulur.
- “Akademisyen” ve kullanıcının kısa bölüm yapısı bu biçim denetiminde hata/çıktı engeli değildir. İçerik aynen korunur.

## Kanıt ve kalan sınır

Dört CBÜ tanımının dokuz senaryosu için gerçek editör PDF/DOCX kontrolleri raporludur. Özgün tez ayrıca Word düğmesiyle üretildi; 12 metin/başlık eşleşmesi, XML ölçümleri ve 141 ilgili test kayıtlıdır. Aynı özgün tezin ek PDF denemesi tamamlanmadı; Word yeniden sayfalama görsel kontrolü yoktur. Kullanıcının sonradan gösterdiği iki başlık ekranı kılavuzla uyumludur; tüm belge görsel kabulü anlamına gelmez.

Ham kanıt: `.test-tmp/validation/mcbu-20261026/` ve `.test-tmp/validation/testtez-original-20261026/`. Test: `engine/src/templates/mcbuConformance.test.js`. Kalan işler yalnız [GOREVLER.md](../GOREVLER.md) içindedir.
