# SRC09 grafik görünümü ve içerik denetimi — 12.10.2026

**SRC09 genel durumu AÇIK / eski sayfa eşliği kabulü FAIL.** Bu tur grafik görünümündeki somut eksikleri düzeltti; kaynak metin kaybıyla görünüm/ölçüm farkını ayırdı. Kabul eşikleri değiştirilmedi.

## Düzeltmeler

`engine/src/docx/drawingPreview.js`:

- SRC09'un konulara göre ve yayın yerine göre dağılım grafiklerinde yatay kümelenmiş çubuklar desteklenmiyordu; çerçeve içinde uzun bir açıklama metni gösteriliyordu. Artık kaynak önbellekteki kategori ve değerlerden güvenli SVG çiziliyor. Negatif değer, kategori eksen yönü, başlık ve değer etiketleri taşınıyor. Uzun etiketler kesilmeden kendilerine ayrılan sütuna sığdırılıyor.
- Yığılmış/yüzde yığılmış ve karışık yatay grafikler kümelenmiş gibi gösterilmiyor; desteklenmeyen görünüm açık kalıyor.
- Dikey grafiklerde eksik başlıklar/değer etiketleri eklendi; kaynakta ±90 derece kategori dönüşü varsa uygulanıyor. Kategori alanı için yer ayrılıyor, uzun yazıların grafik sınırını aşması önleniyor.
- Ortak metin yardımcı fonksiyonu sayısal sıfırı boş metne dönüştürüyordu (`value || ""`). `value ?? ""` ile sıfır korunuyor.

Önizlemeler yaklaşık yerleşimdir; Word font/stil/eksen görünümünün birebir eşliği iddia edilmiyor. Grafiklerin kaynak XML'i ve düzenlenebilir Word nesnesi korunuyor. Eski kaydedilmiş önizlemelere göç eklenmedi; sonuçlar yeni içe aktarım içindir.

## İçerik kaybı incelemesi

- `audit-source-text.mjs`: SRC09 ana XML'indeki **14.598 `w:t` metin parçasının tamamı**, kaynak konumu üzerinden modeldeki metinle tek tek karşılaştırıldı. **Eksik 0, değişmiş 0.** Alternatif dalların ikisi de kapsama dahil. Sonuç: `source-text-audit.json`.
- Bu kontrol alanların hesaplanmış sonuçları, matematik, notlar, resim OCR'ı veya görünür kırpılma için kanıt değildir. Metin modelde mevcutken şekil konumu/okuma sırası yüzünden görünüm karşılaştırması başarısız olabilir.
- Akış şemasındaki “Problem Yapısının Tanımlanması” vb. metinler modelde ve tarayıcı DOM'unda mevcut. Şemanın sayfalara dağılımı ve okuma sırası hâlâ doğru değil (`content-inspection.json`). Bu bölge “metin içe aktarımda silindi” diye sınıflandırılmadı; yerleşim işi açık.
- SRC09 Pareto grafiği, kaynak `word/media/image11.png` önbellek görseliyle görünür. Yazılar resmin içinde; DOM metin çıkarıcısı bunları okuyamaz. Görsel çıkarılıp gözle doğrulandı (`pareto-fallback.png`). Bu, kapsam farkının bir bölümünün gerçek silinme olmadığını gösterir; metin ölçümünden çıkarılmadı ve eşik gevşetilmedi.

## Doğrulama

- Tam frontend birim testleri: **995 PASS / 0 FAIL**, `charts-unit.log`.
- Üretim derlemesi: **PASS**, `charts-build.log`. Mevcut modül ve chunk uyarıları sürüyor.
- Üç yeni regresyon testi: yatay negatif değer/kategori ve yerel DOCX koruması; yığılmış grafiği yanlış yorumlamama; başlık/sıfır/döndürülmüş kategori.
- Gerçek SRC09 Chrome kontrolü: **4 çubuk grafiğin tüm SVG metin etiketleri görünür çerçeve içinde**, `chart-check.json`. Dört önizleme görüntüsü (`chart-1.png` … `chart-4.png`) gözle incelendi. Dar grafiklerde yazı küçük kalabilir; font/stil eşliği kapanmadı.
- Gerçek SRC09 DOCX dışa aktar/yeniden aç: **6 grafiğin kaynak başlık ve önbellek metin/değer dizileri değişmeden korundu**; yeniden içe aktarımda iki yatay grafik SVG olarak çiziliyor. `chart-roundtrip.json`, `SRC09-charts-roundtrip.docx`. Uygulamanın bölüm eşlemesi (`installContentDocument` → `compileThesisDocument`) kullanıldı. Bu tur tam Word PDF renderi veya tüm belge dışa aktarım eşliği yeniden doğrulanmadı.

## Tam belge sonucu

Önceki turun son ölçümü (`final/`) ile aynı tarayıcı/viewport/font/karşılaştırıcı yöntemi; fixture'lar gerçek DOCX'ten yeniden üretildi.

- **SRC09 önce:** 181/180 sayfa, 31/157 kayık açılış, kapsam **0,9691**, sırayla bulunan karakter 159.651.
- **Yalnız yatay grafik ara koşusu:** 181/180 sayfa, 29/157 kayık, kapsam **0,9745** (`horizontal-charts/cmp09.json`).
- **SRC09 son:** 181/180 sayfa, **28/157 kayık**, kapsam **0,9760**, sırayla bulunan karakter **160.788**; **1.137 karakter daha** eşleşti (`charts-final/cmp09.json`).
- **SRC10 kontrol:** **91/91 sayfa, 8/75 kayık, kapsam 0,99605**; önceki sonuçla aynı (`charts-final/cmp10.json`).
- Son sürücü `pageErrors` listeleri boş; Vite terminalinde `ResizeObserver loop completed with undelivered notifications` bildirimleri tekrar görüldü. Çalışma zamanı tamamen hatasız sayılmıyor. SRC09 yükleme 23,53 sn, yazma/yerleşme 6,34 sn; SRC10 6,60 sn / 1,75 sn. Tek koşu olduğundan hız iyileşmesi veya performans kabulü iddia edilmiyor.

## Kalan işler

1. Şekillerin görünür konumu, sarması ve akış şemasının sayfalara dağılımı.
2. Matris ve uzun tablo devamlarının yerleşimi; 181/180 sayfa farkı ve kalan 28 açılış.
3. Uzun belgede düzenleme/yerleşme performansı ve ResizeObserver bildirimleri.
4. Kullanılabilir sürüm kapsamının yazılması ve güncel sürümde son uçtan uca kabul. Modelde metin korunması, tüm görünür nesnelerin doğru çizildiği anlamına gelmiyor.

Kaynak/fixture SHA-256 değerleri `charts-final/source-hashes.json` içinde. Mevcut çalışma ağacı korundu; commit/reset/clean yapılmadı. Bu tur açılan 5193 sunucusu doğrulama sonunda kapatıldı.
